import React from "react";
import { Timeline } from "@neuralsea/react-parallel-timeline";
import type { TimelineItem, TimelineLane } from "@neuralsea/react-parallel-timeline";

function makeBig(count: number): { lanes: TimelineLane[]; items: TimelineItem[] } {
  const lanes: TimelineLane[] = [];
  const items: TimelineItem[] = [];

  for (let i = 0; i < count; i++) {
    const id = `lane-${i}`;
    lanes.push({ id, label: `Agent ${String(i).padStart(3, "0")}`, color: i % 3 === 0 ? "#4c8dff" : i % 3 === 1 ? "#4ad295" : "#c57bff" });

    const start = (i % 20) * 1200;
    const end = start + 18_000 + (i % 7) * 900;
    items.push({
      id: `item-${i}`,
      laneId: id,
      start,
      end,
      label: i % 5 === 0 ? "draft" : "step",
      status: i % 6 === 0 ? "thinking" : "responding",
    });
  }
  return { lanes, items };
}

export default function BigDemo(props: { motion: "on" | "off" }) {
  const { lanes, items } = React.useMemo(() => makeBig(260), []);

  return (
    <>
      <div className="panelHeader">
        <h2>Big list (virtualised lanes)</h2>
        <div className="hint">Virtualisation is enabled (fixed row heights)</div>
      </div>
      <Timeline
        lanes={lanes}
        items={items}
        defaultView={{ start: 0, end: 40_000 }}
        now={22_000}
        grid={{ show: true, showMinor: false }}
        axes={{ showLaneAxis: true, showTimeAxis: true, timeOrigin: 0, headerLeft: "Agents" }}
        motion={{ mode: props.motion }}
        virtualisation={{ enabled: true, overscan: 8 }}
      />
    </>
  );
}
