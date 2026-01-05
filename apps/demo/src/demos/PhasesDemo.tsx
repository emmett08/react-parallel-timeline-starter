import React from "react";
import { Timeline } from "@neuralsea/react-parallel-timeline";
import { makeBaseLanes, makePhaseItems } from "./demoData";

export default function PhasesDemo(props: { motion: "on" | "off" }) {
  const lanes = React.useMemo(() => makeBaseLanes(), []);
  const [now, setNow] = React.useState(34_500);

  React.useEffect(() => {
    const id = window.setInterval(() => setNow((n) => (n > 55_000 ? 34_500 : n + 220)), 220);
    return () => window.clearInterval(id);
  }, []);

  const items = React.useMemo(() => makePhaseItems(now), [now]);

  return (
    <>
      <div className="panelHeader">
        <h2>Status phases (thinking → responding → review)</h2>
        <div className="hint">Patterns reduce “colour-only” dependence</div>
      </div>

      <Timeline
        lanes={lanes}
        items={items}
        defaultView={{ start: 0, end: 60_000 }}
        now={now}
        grid={{ show: true, showMinor: true }}
        axes={{ showLaneAxis: true, showTimeAxis: true, timeOrigin: 0, headerLeft: "Agents" }}
        motion={{ mode: props.motion }}
        interaction={{ pan: true, zoom: true, zoomModifier: "ctrl" }}
      />
    </>
  );
}
