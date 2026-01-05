import React from "react";
import { Timeline } from "@neuralsea/react-parallel-timeline";
import type { TimelineItem } from "@neuralsea/react-parallel-timeline";
import { makeBaseLanes } from "./demoData";

function mkItems(now: number): TimelineItem[] {
  // Active items have undefined end, extend to now.
  return [
    { id: "ui", laneId: "ui", start: 3_000, label: "draft", status: now < 16_000 ? "thinking" : "responding" },
    { id: "infra", laneId: "infra", start: 4_000, label: "draft", status: "responding", progress: Math.min(1, (now - 4_000) / 25_000) },
    { id: "qa", laneId: "qa", start: 5_000, end: 18_000, label: "draft", status: "review" },
    { id: "comp", laneId: "compliance", start: 6_000, end: 22_000, label: "review", status: "review" },
    { id: "lead", laneId: "lead", start: 22_000, label: "synthesis", status: "responding" },
  ];
}

export default function RealtimeDemo(props: { motion: "on" | "off" }) {
  const lanes = React.useMemo(() => makeBaseLanes(), []);
  const [now, setNow] = React.useState(10_000);

  React.useEffect(() => {
    const id = window.setInterval(() => setNow((n) => n + 180), 180);
    return () => window.clearInterval(id);
  }, []);

  const items = React.useMemo(() => mkItems(now), [now]);

  return (
    <>
      <div className="panelHeader">
        <h2>Real-time progress (active bars extend to “now”)</h2>
        <div className="hint">Follow mode keeps “now” in view</div>
      </div>

      <Timeline
        lanes={lanes}
        items={items}
        view={{ start: 0, end: 40_000 }}
        now={now}
        grid={{ show: true }}
        axes={{ showLaneAxis: true, showTimeAxis: true, timeOrigin: 0, headerLeft: "Agents" }}
        motion={{ mode: props.motion }}
        interaction={{
          pan: true,
          zoom: true,
          zoomModifier: "ctrl",
          followNow: true,
          followNowAnchor: "right",
        }}
      />
    </>
  );
}
