import type { TimelineItem, TimelineLane } from "@neuralsea/react-parallel-timeline";

export function makeBaseLanes(): TimelineLane[] {
  return [
    { id: "dispatch", label: "Dispatch", color: "#9aa4b2" },
    { id: "ui", label: "UIAgent", color: "#4c8dff" },
    { id: "infra", label: "InfraAgent", color: "#4ad295" },
    { id: "qa", label: "QAAgent", color: "#f2b441" },
    { id: "compliance", label: "ComplianceAgent", color: "#c57bff" },
    { id: "lead", label: "LeadAgent", color: "#34c1ff" },
  ];
}

export function makeBasicItems(): TimelineItem[] {
  // Times are relative in ms (like the screenshot 0s..73s)
  return [
    { id: "dispatch-in", laneId: "dispatch", start: 0, end: 800, label: "fan-out", status: "queued" },
    { id: "ui-draft", laneId: "ui", start: 1500, end: 26_000, label: "draft", status: "responding" },
    { id: "infra-draft", laneId: "infra", start: 1800, end: 31_400, label: "draft", status: "responding" },
    { id: "qa-draft", laneId: "qa", start: 2200, end: 19_000, label: "draft", status: "review" },
    { id: "comp-review", laneId: "compliance", start: 4200, end: 25_000, label: "review", status: "review" },
    { id: "lead-synth", laneId: "lead", start: 41_000, end: 73_000, label: "synthesis", status: "responding" },
  ];
}

export function makePhaseItems(now: number): TimelineItem[] {
  // Shows state transitions within bars using segments.
  return [
    {
      id: "ui",
      laneId: "ui",
      start: 1000,
      end: 40_000,
      label: "UIAgent",
      segments: [
        { start: 1000, end: 14_000, status: "thinking", label: "thinking" },
        { start: 14_000, end: 32_000, status: "responding", label: "responding" },
        { start: 32_000, end: 40_000, status: "review", label: "review" },
      ],
    },
    {
      id: "infra",
      laneId: "infra",
      start: 2000,
      end: 36_000,
      label: "InfraAgent",
      segments: [
        { start: 2000, end: 12_000, status: "thinking" },
        { start: 12_000, end: 36_000, status: "responding" },
      ],
    },
    {
      id: "qa",
      laneId: "qa",
      start: 4000,
      end: 28_000,
      label: "QAAgent",
      segments: [
        { start: 4000, end: 10_000, status: "queued" },
        { start: 10_000, end: 18_000, status: "thinking" },
        { start: 18_000, end: 28_000, status: "review" },
      ],
    },
    {
      id: "lead",
      laneId: "lead",
      start: 28_000,
      end: now, // active to now
      label: "Lead synthesis",
      status: "responding",
      segments: [
        { start: 28_000, end: 33_000, status: "thinking" },
        { start: 33_000, end: now, status: "responding" },
      ],
    },
  ];
}
