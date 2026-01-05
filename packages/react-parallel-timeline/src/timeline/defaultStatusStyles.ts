import type { StatusStyle } from "./types";

/**
 * Defaults aim for good UX:
 * - “thinking” uses animated stripes to signal ongoing work (even if duration is unknown).
 * - “responding” is solid and slightly more vivid.
 * - “review” uses dots to avoid relying only on colour.
 */
export const defaultStatusStyles: Record<string, StatusStyle> = {
  queued: { pattern: "dots", emphasis: "normal" },
  running: { pattern: "solid", emphasis: "normal" },
  thinking: { pattern: "stripe", emphasis: "normal" },
  responding: { pattern: "solid", emphasis: "strong" },
  review: { pattern: "dots", emphasis: "normal" },
  completed: { pattern: "solid", emphasis: "normal" },
  error: { pattern: "solid", emphasis: "strong" },
  cancelled: { pattern: "dots", emphasis: "normal" },
};
