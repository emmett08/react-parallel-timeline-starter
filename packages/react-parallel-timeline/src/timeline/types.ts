import * as React from "react";

export type TimelineStatus =
  | "queued"
  | "running"
  | "thinking"
  | "responding"
  | "review"
  | "completed"
  | "error"
  | "cancelled"
  | (string & {});

export interface TimelineLane {
  id: string;
  label: string;
  /**
   * Base colour for this lane. Items can override, and status styles can apply patterns/emphasis.
   * Accepts any valid CSS colour string.
   */
  color?: string;
  meta?: Record<string, unknown>;
}

export interface TimelineSegment {
  /** Optional stable id for keyed rendering */
  id?: string;
  start: number;
  /** Undefined means “active until now” */
  end?: number;
  label?: string;
  status?: TimelineStatus;
  color?: string;
  meta?: Record<string, unknown>;
}

export interface TimelineItem {
  id: string;
  laneId: string;
  start: number;
  /** Undefined means “active until now” */
  end?: number;
  label?: string;
  status?: TimelineStatus;
  color?: string;
  /**
   * If present, segments are rendered as a single continuous bar split into sub-segments.
   * This is the preferred UX for “thinking → responding → review” style transitions.
   */
  segments?: TimelineSegment[];
  /**
   * Optional progress fill within the item bar (0..1).
   * Useful when duration is known but internal progress should be shown too.
   */
  progress?: number;
  meta?: Record<string, unknown>;
}

export interface TimelineView {
  start: number;
  end: number;
}

export type MotionMode = "auto" | "on" | "off";

export interface TimelineMotionOptions {
  mode?: MotionMode;
  /** CSS transition duration for updates (ms) */
  updateMs?: number;
}

export interface TimelineGridOptions {
  show?: boolean;
  showMinor?: boolean;
  /** Desired pixel spacing between major ticks */
  majorTickPx?: number;
  /** Minor ticks per major tick */
  minorTicks?: number;
}

export interface TimelineAxisOptions {
  showTimeAxis?: boolean;
  showLaneAxis?: boolean;
  /** Width of the left lane axis (px) */
  laneWidth?: number;
  /** Height of the top time axis (px) */
  timeAxisHeight?: number;
  /**
   * If your times are relative (e.g. 0..73_000), set `timeOrigin` to 0 (or the run start)
   * so labels read like 0s, 10s, 20s.
   *
   * If your times are epoch millis, set `timeOrigin` to 0 and provide a `timeFormatter`.
   */
  timeOrigin?: number;
  timeFormatter?: (timeMs: number, ctx: { originMs: number; view: TimelineView }) => string;
  headerLeft?: React.ReactNode;
}

export interface TimelineInteractionOptions {
  pan?: boolean;
  zoom?: boolean;
  /**
   * Which modifier key is required for wheel zoom.
   * - "ctrl": Ctrl (Windows/Linux) or Control key on Mac
   * - "meta": ⌘ key on Mac
   * - "alt": Alt/Option
   * - "shift": Shift
   * - "none": no modifier required
   */
  zoomModifier?: "ctrl" | "meta" | "alt" | "shift" | "none";
  /** Minimum view range (ms) */
  minRangeMs?: number;
  /** Maximum view range (ms) */
  maxRangeMs?: number;
  /** Keep “now” within view by shifting the window */
  followNow?: boolean;
  /** Where to keep “now” when following */
  followNowAnchor?: "right" | "center";
  onViewChange?: (view: TimelineView, reason: "pan" | "zoom" | "follow" | "programmatic") => void;
}

export interface TimelineVirtualisationOptions {
  enabled?: boolean;
  /** Extra lanes to render above/below */
  overscan?: number;
}

export type StatusPattern = "solid" | "stripe" | "dots";

export interface StatusStyle {
  color?: string;
  pattern?: StatusPattern;
  emphasis?: "normal" | "strong";
}

export interface TimelineClassNames {
  root?: string;
  header?: string;
  headerLeft?: string;
  headerRight?: string;
  body?: string;
  laneAxis?: string;
  canvasWrap?: string;
  canvas?: string;
  item?: string;
  itemLabel?: string;
  tooltip?: string;
}

export interface TimelineProps {
  lanes: TimelineLane[];
  items: TimelineItem[];

  /** Controlled view window */
  view?: TimelineView;
  /** Uncontrolled initial view window */
  defaultView?: TimelineView;

  /** If omitted, `realtime.enabled` will drive an internal clock */
  now?: number;
  realtime?: { enabled?: boolean; tickMs?: number };

  /** Layout */
  rowHeight?: number; // per lane
  laneGap?: number;
  itemHeight?: number;
  paddingY?: number;

  /** UX/UI toggles */
  showNowLine?: boolean;
  showHoverLine?: boolean;
  grid?: TimelineGridOptions;
  axes?: TimelineAxisOptions;

  /** Motion / animations */
  motion?: TimelineMotionOptions;

  /** Zoom/pan/follow */
  interaction?: TimelineInteractionOptions;

  /** Optional lane virtualisation (works best with fixed row heights) */
  virtualisation?: TimelineVirtualisationOptions;

  /** Status styling (colour/pattern). Merged with defaults. */
  statusStyles?: Partial<Record<string, StatusStyle>>;

  /** Custom render hooks */
  renderLaneLabel?: (ctx: { lane: TimelineLane; laneIndex: number; laneState?: TimelineStatus }) => React.ReactNode;
  renderItem?: (ctx: {
    item: TimelineItem;
    lane: TimelineLane;
    rect: { x: number; y: number; w: number; h: number };
    now: number;
    view: TimelineView;
  }) => React.ReactNode;
  renderTooltip?: (ctx: { item: TimelineItem; lane: TimelineLane; now: number }) => React.ReactNode;

  /** Events */
  onItemClick?: (item: TimelineItem) => void;
  onItemHover?: (item: TimelineItem | null) => void;
  onHoverTimeChange?: (timeMs: number | null) => void;

  /** Selection */
  selectedItemId?: string | null;
  onSelectedItemIdChange?: (id: string | null) => void;

  /** Styling */
  theme?: "dark" | "light";
  className?: string;
  style?: React.CSSProperties;
  classNames?: TimelineClassNames;
  getItemClassName?: (item: TimelineItem) => string | undefined;
  getLaneClassName?: (lane: TimelineLane) => string | undefined;

  /** Accessibility */
  ariaLabel?: string;
  /**
   * Whether items are keyboard focusable.
   * If you need a purely “display” timeline, set this false.
   */
  focusableItems?: boolean;
}

