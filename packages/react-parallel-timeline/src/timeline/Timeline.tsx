import * as React from "react";
import type {
  TimelineAxisOptions,
  TimelineGridOptions,
  TimelineInteractionOptions,
  TimelineItem,
  TimelineLane,
  TimelineMotionOptions,
  TimelineProps,
  TimelineSegment,
  TimelineStatus,
  TimelineView,
  TimelineVirtualisationOptions,
  StatusStyle,
} from "./types";
import { defaultStatusStyles } from "./defaultStatusStyles";
import { clamp, computeTicks, matchesModifier, panViewByDeltaPx, zoomViewAroundTime } from "./utils";
import { useNow, usePrefersReducedMotion, useResizeObserver } from "./hooks";

type PackedLane = {
  lane: TimelineLane;
  laneIndex: number;
  y: number;
  height: number;
};

type PackedItem = {
  item: TimelineItem;
  lane: TimelineLane;
  x: number;
  y: number;
  w: number;
  h: number;
  isActive: boolean;
  segments: TimelineSegment[];
};

function asSegments(item: TimelineItem): TimelineSegment[] {
  if (item.segments && item.segments.length > 0) return item.segments;
  return [{ start: item.start, end: item.end, status: item.status, color: item.color, label: item.label }];
}

function resolveLaneState(lane: TimelineLane, itemsForLane: TimelineItem[], now: number): TimelineStatus | undefined {
  // Determine “current state” as the status of the segment that spans now, else last segment status.
  let best: TimelineStatus | undefined = undefined;
  let bestEnd = -Infinity;

  for (const item of itemsForLane) {
    const segs = asSegments(item);
    for (const s of segs) {
      const end = s.end ?? (item.end ?? now);
      const start = s.start;
      if (start <= now && now <= end) {
        return s.status ?? item.status;
      }
      if (end > bestEnd) {
        bestEnd = end;
        best = (s.status ?? item.status) as TimelineStatus | undefined;
      }
    }
  }
  return best;
}

function mergeStatusStyles(overrides?: Partial<Record<string, StatusStyle>>): Record<string, StatusStyle> {
  const merged: Record<string, StatusStyle> = { ...defaultStatusStyles };
  if (!overrides) return merged;
  for (const [key, style] of Object.entries(overrides)) {
    if (style != null) merged[key] = style;
  }
  return merged;
}

function getActiveEnd(item: TimelineItem, now: number): number {
  return item.end ?? now;
}

function safeRangeMs(view: TimelineView): number {
  return Math.max(1, view.end - view.start);
}

function pickItemColor(lane: TimelineLane, item: TimelineItem): string | undefined {
  return item.color ?? lane.color;
}

function buildItemSegments(item: TimelineItem, now: number): TimelineSegment[] {
  const segs = asSegments(item).map((s, idx) => ({ ...s, id: s.id ?? `${item.id}__seg_${idx}` }));
  // Ensure segments are in chronological order
  segs.sort((a, b) => a.start - b.start);
  // Clamp segment ends to item.end/now
  const hardEnd = getActiveEnd(item, now);
  for (const s of segs) {
    if (s.end == null || s.end > hardEnd) s.end = hardEnd;
  }
  return segs;
}

function useControllableView(params: {
  view?: TimelineView;
  defaultView?: TimelineView;
  onChange?: (view: TimelineView, reason: "pan" | "zoom" | "follow" | "programmatic") => void;
}): [TimelineView, (next: TimelineView, reason: "pan" | "zoom" | "follow" | "programmatic") => void] {
  const { view, defaultView, onChange } = params;
  const [internal, setInternal] = React.useState<TimelineView>(() => {
    return defaultView ?? { start: 0, end: 60_000 };
  });

  const actual = view ?? internal;

  const set = React.useCallback(
    (next: TimelineView, reason: "pan" | "zoom" | "follow" | "programmatic") => {
      if (!view) setInternal(next);
      onChange?.(next, reason);
    },
    [view, onChange]
  );

  return [actual, set];
}

export function Timeline(props: TimelineProps) {
  const {
    lanes,
    items,
    view,
    defaultView,
    now: nowProp,
    realtime,
    rowHeight = 44,
    laneGap = 6,
    itemHeight = 22,
    paddingY = 10,
    showNowLine = true,
    showHoverLine = true,
    grid,
    axes,
    motion,
    interaction,
    virtualisation,
    statusStyles,
    renderLaneLabel,
    renderItem,
    renderTooltip,
    onItemClick,
    onItemHover,
    onHoverTimeChange,
    selectedItemId,
    onSelectedItemIdChange,
    theme = "dark",
    className,
    style,
    classNames,
    getItemClassName,
    getLaneClassName,
    ariaLabel = "Timeline",
    focusableItems = true,
  } = props;

  const gridOpts: Required<TimelineGridOptions> = {
    show: grid?.show ?? true,
    showMinor: grid?.showMinor ?? true,
    majorTickPx: grid?.majorTickPx ?? 120,
    minorTicks: grid?.minorTicks ?? 4,
  };

  const axisOpts: Required<Omit<TimelineAxisOptions, "timeFormatter">> & {
    timeFormatter?: TimelineAxisOptions["timeFormatter"];
  } = {
    showTimeAxis: axes?.showTimeAxis ?? true,
    showLaneAxis: axes?.showLaneAxis ?? true,
    laneWidth: axes?.laneWidth ?? 220,
    timeAxisHeight: axes?.timeAxisHeight ?? 34,
    timeOrigin: axes?.timeOrigin ?? (defaultView?.start ?? 0),
    timeFormatter: axes?.timeFormatter,
    headerLeft: axes?.headerLeft ?? null,
  };

  const inter: Required<Omit<TimelineInteractionOptions, "onViewChange">> & {
    onViewChange?: TimelineInteractionOptions["onViewChange"];
  } = {
    pan: interaction?.pan ?? true,
    zoom: interaction?.zoom ?? true,
    zoomModifier: interaction?.zoomModifier ?? "ctrl",
    minRangeMs: interaction?.minRangeMs ?? 2_000,
    maxRangeMs: interaction?.maxRangeMs ?? 24 * 60 * 60 * 1000,
    followNow: interaction?.followNow ?? false,
    followNowAnchor: interaction?.followNowAnchor ?? "right",
    onViewChange: interaction?.onViewChange,
  };

  const virt: Required<TimelineVirtualisationOptions> = {
    enabled: virtualisation?.enabled ?? false,
    overscan: virtualisation?.overscan ?? 6,
  };

  const prefersReduced = usePrefersReducedMotion();
  const motionMode: "on" | "off" = (() => {
    const mode = motion?.mode ?? "auto";
    if (mode === "on") return "on";
    if (mode === "off") return "off";
    return prefersReduced ? "off" : "on";
  })();
  const updateMs = motion?.updateMs ?? 220;

  const now = useNow({
    enabled: realtime?.enabled ?? false,
    tickMs: realtime?.tickMs ?? 100,
    externalNow: nowProp,
  });

  const statusStyleMap = React.useMemo(() => mergeStatusStyles(statusStyles), [statusStyles]);

  const [canvasWrapRef, canvasWrapSize] = useResizeObserver<HTMLDivElement>();
  const [scrollRef, scrollSize] = useResizeObserver<HTMLDivElement>();
  const [scrollTop, setScrollTop] = React.useState(0);

  const [actualView, setView] = useControllableView({
    view,
    defaultView,
    onChange: inter.onViewChange,
  });

  // Follow “now”
  React.useEffect(() => {
    if (!inter.followNow) return;
    const v = actualView;
    const range = safeRangeMs(v);
    const margin = range * 0.08;
    const minVisible = v.start + margin;
    const maxVisible = v.end - margin;

    if (now < minVisible || now > maxVisible) {
      const anchor = inter.followNowAnchor;
      const next =
        anchor === "center"
          ? { start: now - range / 2, end: now + range / 2 }
          : { start: now - (range - margin), end: now + margin };
      setView(next, "follow");
    }
  }, [now, inter.followNow, inter.followNowAnchor, actualView, setView]);

  const widthPx = canvasWrapSize.width;
  const heightPx = scrollSize.height;
  const pxPerMs = widthPx / safeRangeMs(actualView);

  const timeToX = React.useCallback(
    (t: number) => (t - actualView.start) * pxPerMs,
    [actualView.start, pxPerMs]
  );
  const xToTime = React.useCallback(
    (x: number) => actualView.start + x / (pxPerMs || 1),
    [actualView.start, pxPerMs]
  );

  const itemsByLane = React.useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const lane of lanes) map.set(lane.id, []);
    for (const it of items) {
      const arr = map.get(it.laneId);
      if (arr) arr.push(it);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.start - b.start);
    return map;
  }, [lanes, items]);

  // Virtualisation: fixed row height mode. (If you enable stacking, consider disabling virtualisation.)
  const laneStride = rowHeight + laneGap;
  const totalHeight = lanes.length * laneStride + laneGap;

  const visibleLaneWindow = React.useMemo(() => {
    if (!virt.enabled) return { start: 0, end: lanes.length, topPad: 0, botPad: 0 };
    const start = Math.max(0, Math.floor(scrollTop / laneStride) - virt.overscan);
    const end = Math.min(lanes.length, Math.ceil((scrollTop + heightPx) / laneStride) + virt.overscan);
    return {
      start,
      end,
      topPad: start * laneStride,
      botPad: (lanes.length - end) * laneStride,
    };
  }, [virt.enabled, virt.overscan, scrollTop, laneStride, lanes.length, heightPx]);

  const packedLanes: PackedLane[] = React.useMemo(() => {
    const res: PackedLane[] = [];
    for (let i = visibleLaneWindow.start; i < visibleLaneWindow.end; i++) {
      const lane = lanes[i];
      res.push({
        lane,
        laneIndex: i,
        y: i * laneStride,
        height: rowHeight,
      });
    }
    return res;
  }, [lanes, visibleLaneWindow.start, visibleLaneWindow.end, laneStride, rowHeight]);

  const packedItems: PackedItem[] = React.useMemo(() => {
    const res: PackedItem[] = [];
    for (const pl of packedLanes) {
      const laneItems = itemsByLane.get(pl.lane.id) ?? [];
      for (const item of laneItems) {
        const end = getActiveEnd(item, now);
        const x0 = timeToX(item.start);
        const x1 = timeToX(end);
        const x = clamp(x0, -10_000_000, 10_000_000);
        const w = Math.max(2, x1 - x0);
        const y = pl.y + (rowHeight - itemHeight) / 2;
        const isActive = item.end == null || end > (item.end ?? -Infinity);
        const segs = buildItemSegments(item, now);
        res.push({ item, lane: pl.lane, x, y, w, h: itemHeight, isActive, segments: segs });
      }
    }
    return res;
  }, [packedLanes, itemsByLane, now, timeToX, rowHeight, itemHeight]);

  const { major: majorTicks, stepMs } = React.useMemo(() => {
    const origin = axisOpts.timeOrigin;
    const fmt = axisOpts.timeFormatter
      ? (t: number) => axisOpts.timeFormatter!(t, { originMs: origin, view: actualView })
      : undefined;
    return computeTicks(actualView, widthPx, gridOpts.majorTickPx, origin, fmt);
  }, [actualView, widthPx, gridOpts.majorTickPx, axisOpts.timeOrigin, axisOpts.timeFormatter]);

  const minorTicks = React.useMemo(() => {
    if (!gridOpts.showMinor) return [] as number[];
    if (majorTicks.length < 2) return [] as number[];
    const res: number[] = [];
    const minorStep = stepMs / gridOpts.minorTicks;
    const start = majorTicks[0]?.t ?? actualView.start;
    const end = majorTicks[majorTicks.length - 1]?.t ?? actualView.end;
    for (let t = start; t <= end; t += minorStep) res.push(t);
    return res;
  }, [gridOpts.showMinor, gridOpts.minorTicks, majorTicks, stepMs, actualView.start, actualView.end]);

  const [hoverTime, setHoverTime] = React.useState<number | null>(null);
  const [hoverItemId, setHoverItemId] = React.useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState<{ x: number; y: number } | null>(null);

  const selectedId = selectedItemId ?? null;

  const onScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const onWheel = React.useCallback(
    (e: React.WheelEvent) => {
      if (!inter.zoom) return;
      // Wheel zoom only if modifier matches.
      if (!matchesModifier(e.nativeEvent as WheelEvent, inter.zoomModifier)) return;

      e.preventDefault();
      const delta = e.deltaY;
      // Trackpads can be small deltas; map to smooth zoom.
      const zoomFactor = Math.exp(delta * 0.0012);

      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const x = e.clientX - rect.left - (axisOpts.showLaneAxis ? axisOpts.laneWidth : 0);
      const anchor = xToTime(clamp(x, 0, widthPx));
      let next = zoomViewAroundTime(actualView, zoomFactor, anchor);

      const minRange = inter.minRangeMs;
      const maxRange = inter.maxRangeMs;
      const nextRange = safeRangeMs(next);
      if (nextRange < minRange) {
        const k = (anchor - next.start) / nextRange;
        const fixed = minRange;
        const start = anchor - k * fixed;
        next = { start, end: start + fixed };
      } else if (nextRange > maxRange) {
        const k = (anchor - next.start) / nextRange;
        const fixed = maxRange;
        const start = anchor - k * fixed;
        next = { start, end: start + fixed };
      }

      setView(next, "zoom");
    },
    [inter.zoom, inter.zoomModifier, inter.minRangeMs, inter.maxRangeMs, xToTime, widthPx, actualView, setView, axisOpts.showLaneAxis, axisOpts.laneWidth]
  );

  // Drag pan
  const dragRef = React.useRef<{
    active: boolean;
    pointerId: number;
    startX: number;
    startView: TimelineView;
  } | null>(null);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (!inter.pan) return;
      // Only left click / primary pointer
      if (e.button !== 0) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { active: true, pointerId: e.pointerId, startX: e.clientX, startView: actualView };
    },
    [inter.pan, actualView]
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left - (axisOpts.showLaneAxis ? axisOpts.laneWidth : 0);
      const t = xToTime(clamp(x, 0, widthPx));
      setHoverTime(t);
      onHoverTimeChange?.(t);

      if (dragRef.current?.active && dragRef.current.pointerId === e.pointerId) {
        const dx = e.clientX - dragRef.current.startX;
        const next = panViewByDeltaPx(dragRef.current.startView, dx, pxPerMs);
        setView(next, "pan");
      }
    },
    [axisOpts.showLaneAxis, axisOpts.laneWidth, xToTime, widthPx, onHoverTimeChange, pxPerMs, setView]
  );

  const onPointerUp = React.useCallback((e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  }, []);

  const onMouseLeave = React.useCallback(() => {
    setHoverTime(null);
    onHoverTimeChange?.(null);
  }, [onHoverTimeChange]);

  const hoveredItem = React.useMemo(() => {
    if (!hoverItemId) return null;
    const it = items.find((x) => x.id === hoverItemId) ?? null;
    if (!it) return null;
    const lane = lanes.find((l) => l.id === it.laneId) ?? lanes[0];
    return { item: it, lane };
  }, [hoverItemId, items, lanes]);

  const resolvedLaneStates = React.useMemo(() => {
    const map = new Map<string, TimelineStatus | undefined>();
    for (const lane of lanes) {
      const laneItems = itemsByLane.get(lane.id) ?? [];
      map.set(lane.id, resolveLaneState(lane, laneItems, now));
    }
    return map;
  }, [lanes, itemsByLane, now]);

  const rootCls = [
    "rt-root",
    `rt-theme-${theme}`,
    motionMode === "on" ? "rt-motion-on" : "rt-motion-off",
    className,
    classNames?.root,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootCls}
      style={{ ...style, ["--rt-update-ms" as any]: `${updateMs}ms` }}
      data-motion={motionMode}
      data-theme={theme}
      aria-label={ariaLabel}
      role="group"
      data-testid="timeline"
    >
      {axisOpts.showTimeAxis && (
        <div
          className={["rt-header", classNames?.header].filter(Boolean).join(" ")}
          style={{
            height: axisOpts.timeAxisHeight,
            gridTemplateColumns: `${axisOpts.showLaneAxis ? axisOpts.laneWidth : 0}px 1fr`,
          }}
        >
          <div className={["rt-headerLeft", classNames?.headerLeft].filter(Boolean).join(" ")}>
            {axisOpts.showLaneAxis ? axisOpts.headerLeft : null}
          </div>
          <div className={["rt-headerRight", classNames?.headerRight].filter(Boolean).join(" ")}>
            <div className="rt-timeAxis">
              {majorTicks.map((tick) => {
                const x = timeToX(tick.t);
                return (
                  <div key={tick.t} className="rt-timeTick" style={{ left: x }}>
                    <div className="rt-timeTickLabel">{tick.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className={["rt-body", classNames?.body].filter(Boolean).join(" ")}
        onScroll={onScroll}
        data-testid="timeline-scroll"
        style={{
          gridTemplateColumns: `${axisOpts.showLaneAxis ? axisOpts.laneWidth : 0}px 1fr`,
        }}
      >
        {axisOpts.showLaneAxis && (
          <div className={["rt-laneAxis", classNames?.laneAxis].filter(Boolean).join(" ")}>
            {/* Top pad for virtualisation */}
            {virt.enabled && visibleLaneWindow.topPad > 0 ? (
              <div style={{ height: visibleLaneWindow.topPad }} />
            ) : null}

            {packedLanes.map((pl) => {
              const laneState = resolvedLaneStates.get(pl.lane.id);
              const dotStyle = laneState ? statusStyleMap[laneState]?.pattern ?? "solid" : "solid";
              const dotColor = statusStyleMap[laneState ?? ""]?.color ?? pl.lane.color ?? "var(--rt-accent)";

              return (
                <div
                  key={pl.lane.id}
                  className={[
                    "rt-laneLabel",
                    getLaneClassName?.(pl.lane),
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ height: rowHeight, marginBottom: laneGap }}
                  title={pl.lane.label}
                >
                  <span className={`rt-laneDot rt-dot-${dotStyle}`} style={{ backgroundColor: dotColor }} />
                  <div className="rt-laneText">
                    {renderLaneLabel ? renderLaneLabel({ lane: pl.lane, laneIndex: pl.laneIndex, laneState }) : pl.lane.label}
                  </div>
                </div>
              );
            })}

            {virt.enabled && visibleLaneWindow.botPad > 0 ? (
              <div style={{ height: visibleLaneWindow.botPad }} />
            ) : null}
          </div>
        )}

        <div
          ref={canvasWrapRef}
          className={["rt-canvasWrap", classNames?.canvasWrap].filter(Boolean).join(" ")}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onMouseLeave={onMouseLeave}
          data-testid="timeline-canvas"
        >
          <div
            className={["rt-canvas", classNames?.canvas].filter(Boolean).join(" ")}
            style={{ height: totalHeight, width: "100%" }}
          >
            {/* Grid */}
            {gridOpts.show && (
              <div className="rt-gridLayer" aria-hidden="true">
                {gridOpts.showMinor &&
                  minorTicks.map((t) => {
                    const x = timeToX(t);
                    return <div key={`m-${t}`} className="rt-gridLine rt-gridLineMinor" style={{ left: x }} />;
                  })}
                {majorTicks.map((tick) => {
                  const x = timeToX(tick.t);
                  return <div key={`M-${tick.t}`} className="rt-gridLine rt-gridLineMajor" style={{ left: x }} />;
                })}
              </div>
            )}

            {/* Lane separators */}
            <div className="rt-laneSepLayer" aria-hidden="true">
              {packedLanes.map((pl) => (
                <div
                  key={`sep-${pl.lane.id}`}
                  className="rt-laneSep"
                  style={{ top: pl.y + rowHeight + laneGap / 2 }}
                />
              ))}
            </div>

            {/* Now line */}
            {showNowLine && (
              <div className="rt-nowLayer" aria-hidden="true">
                <div className="rt-nowLine" style={{ left: timeToX(now) }} />
              </div>
            )}

            {/* Hover line */}
            {showHoverLine && hoverTime != null && (
              <div className="rt-hoverLayer" aria-hidden="true">
                <div className="rt-hoverLine" style={{ left: timeToX(hoverTime) }} />
              </div>
            )}

            {/* Items */}
            <div className="rt-itemsLayer">
              {packedItems.map((pi) => {
                const isSelected = selectedId != null && pi.item.id === selectedId;
                const laneColor = pi.lane.color ?? undefined;
                const baseColor = pickItemColor(pi.lane, pi.item) ?? "var(--rt-accent)";

                const onEnter = (e: React.MouseEvent) => {
                  setHoverItemId(pi.item.id);
                  onItemHover?.(pi.item);
                  setTooltipPos({ x: e.clientX, y: e.clientY });
                };
                const onMove = (e: React.MouseEvent) => {
                  if (hoverItemId === pi.item.id) setTooltipPos({ x: e.clientX, y: e.clientY });
                };
                const onLeave = () => {
                  setHoverItemId((prev) => (prev === pi.item.id ? null : prev));
                  onItemHover?.(null);
                  setTooltipPos(null);
                };
                const onClick = () => {
                  onItemClick?.(pi.item);
                  onSelectedItemIdChange?.(pi.item.id);
                };

                const label = pi.item.label ?? "";
                const aria = `${pi.lane.label}: ${label || pi.item.id}`;

                const rect = { x: pi.x, y: pi.y, w: pi.w, h: pi.h };

                const content = renderItem ? (
                  renderItem({ item: pi.item, lane: pi.lane, rect, now, view: actualView })
                ) : (
                  <>
                    <div className="rt-itemSegments">
                      {pi.segments.map((seg) => {
                        const segEnd = seg.end ?? now;
                        const x0 = timeToX(seg.start);
                        const x1 = timeToX(segEnd);
                        const w = Math.max(1, x1 - x0);

                        const status = (seg.status ?? pi.item.status ?? "running") as string;
                        const st = statusStyleMap[status] ?? {};
                        const segColor = st.color ?? seg.color ?? baseColor;
                        const pattern = st.pattern ?? "solid";
                        const emphasis = st.emphasis ?? "normal";

                        return (
                          <div
                            key={seg.id ?? `${pi.item.id}-${seg.start}`}
                            className={[
                              "rt-seg",
                              `rt-seg-${pattern}`,
                              emphasis === "strong" ? "rt-seg-strong" : null,
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            style={{
                              left: x0 - pi.x,
                              width: w,
                              backgroundColor: segColor,
                            }}
                            title={seg.label ?? status}
                          />
                        );
                      })}
                    </div>
                    {pi.item.progress != null && (
                      <div className="rt-itemProgress" style={{ width: `${clamp(pi.item.progress, 0, 1) * 100}%` }} />
                    )}
                    <div className={["rt-itemLabel", classNames?.itemLabel].filter(Boolean).join(" ")}>
                      {label}
                    </div>
                  </>
                );

                return (
                  <div
                    key={pi.item.id}
                    className={[
                      "rt-item",
                      isSelected ? "rt-itemSelected" : null,
                      pi.item.end == null ? "rt-itemActive" : null,
                      getItemClassName?.(pi.item),
                      classNames?.item,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      left: rect.x,
                      top: rect.y,
                      width: rect.w,
                      height: rect.h,
                      ["--rt-item-color" as any]: baseColor,
                      ["--rt-lane-color" as any]: laneColor ?? baseColor,
                    }}
                    onMouseEnter={onEnter}
                    onMouseMove={onMove}
                    onMouseLeave={onLeave}
                    onClick={onClick}
                    role={focusableItems ? "button" : undefined}
                    tabIndex={focusableItems ? 0 : undefined}
                    aria-label={focusableItems ? aria : undefined}
                    onKeyDown={(e) => {
                      if (!focusableItems) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onClick();
                      }
                    }}
                  >
                    {content}
                  </div>
                );
              })}
            </div>

            {/* Tooltip */}
            {hoveredItem && tooltipPos && (
              <div
                className={["rt-tooltip", classNames?.tooltip].filter(Boolean).join(" ")}
                role="tooltip"
                style={{ left: tooltipPos.x + 12, top: tooltipPos.y + 12 }}
              >
                {renderTooltip ? (
                  renderTooltip({ item: hoveredItem.item, lane: hoveredItem.lane, now })
                ) : (
                  <DefaultTooltip item={hoveredItem.item} lane={hoveredItem.lane} now={now} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultTooltip(props: { item: TimelineItem; lane: TimelineLane; now: number }) {
  const { item, lane, now } = props;
  const end = item.end ?? now;
  const dur = Math.max(0, end - item.start);
  return (
    <div className="rt-tooltipInner">
      <div className="rt-tooltipTitle">{item.label ?? item.id}</div>
      <div className="rt-tooltipRow">
        <span className="rt-tooltipKey">Lane</span>
        <span className="rt-tooltipVal">{lane.label}</span>
      </div>
      <div className="rt-tooltipRow">
        <span className="rt-tooltipKey">Start</span>
        <span className="rt-tooltipVal">{Math.round(item.start)} ms</span>
      </div>
      <div className="rt-tooltipRow">
        <span className="rt-tooltipKey">End</span>
        <span className="rt-tooltipVal">{item.end == null ? "active" : `${Math.round(item.end)} ms`}</span>
      </div>
      <div className="rt-tooltipRow">
        <span className="rt-tooltipKey">Duration</span>
        <span className="rt-tooltipVal">{Math.round(dur)} ms</span>
      </div>
      {item.status && (
        <div className="rt-tooltipRow">
          <span className="rt-tooltipKey">Status</span>
          <span className="rt-tooltipVal">{item.status}</span>
        </div>
      )}
    </div>
  );
}
