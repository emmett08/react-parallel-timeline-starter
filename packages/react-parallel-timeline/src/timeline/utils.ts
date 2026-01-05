import type { TimelineView } from "./types";

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export function formatDurationMs(ms: number): string {
  const abs = Math.abs(ms);
  const sign = ms < 0 ? "-" : "";
  const totalSeconds = Math.round(abs / 1000);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);

  if (h > 0) return `${sign}${h}h ${m}m`;
  if (m > 0) return `${sign}${m}m ${String(s).padStart(2, "0")}s`;
  return `${sign}${s}s`;
}

const NICE_STEPS_MS = [
  250, 500,
  1000, 2000, 5000, 10_000, 15_000, 30_000,
  60_000, 120_000, 300_000, 600_000, 900_000, 1_800_000,
  3_600_000, 7_200_000, 14_400_000,
];

export type Tick = { t: number; label: string };

export function computeTicks(
  view: TimelineView,
  widthPx: number,
  majorTickPx: number,
  originMs: number,
  formatter?: (timeMs: number) => string
): { major: Tick[]; stepMs: number } {
  const range = view.end - view.start;
  if (range <= 0 || widthPx <= 0) return { major: [], stepMs: 1000 };

  const approxStep = (range / Math.max(1, widthPx)) * majorTickPx;
  let stepMs = NICE_STEPS_MS[NICE_STEPS_MS.length - 1];
  for (const s of NICE_STEPS_MS) {
    if (s >= approxStep) {
      stepMs = s;
      break;
    }
  }

  // Snap start to step boundaries, but keep relative to origin.
  const first = Math.floor((view.start - originMs) / stepMs) * stepMs + originMs;
  const ticks: Tick[] = [];
  for (let t = first; t <= view.end; t += stepMs) {
    if (t < view.start - stepMs) continue;
    const label = formatter ? formatter(t) : formatDurationMs(t - originMs);
    ticks.push({ t, label });
  }
  return { major: ticks, stepMs };
}

export function matchesModifier(e: WheelEvent, modifier: "ctrl" | "meta" | "alt" | "shift" | "none"): boolean {
  if (modifier === "none") return true;
  if (modifier === "ctrl") return e.ctrlKey;
  if (modifier === "meta") return e.metaKey;
  if (modifier === "alt") return e.altKey;
  if (modifier === "shift") return e.shiftKey;
  return false;
}

export function zoomViewAroundTime(view: TimelineView, zoomFactor: number, anchorTime: number): TimelineView {
  const oldRange = view.end - view.start;
  const newRange = oldRange * zoomFactor;
  const k = (anchorTime - view.start) / oldRange; // 0..1
  const newStart = anchorTime - k * newRange;
  return { start: newStart, end: newStart + newRange };
}

export function panViewByDeltaPx(view: TimelineView, deltaPx: number, pxPerMs: number): TimelineView {
  if (pxPerMs === 0) return view;
  const deltaMs = -deltaPx / pxPerMs;
  return { start: view.start + deltaMs, end: view.end + deltaMs };
}

