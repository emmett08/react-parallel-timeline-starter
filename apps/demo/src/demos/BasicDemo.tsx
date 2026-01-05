import React from "react";
import { Timeline } from "@neuralsea/react-parallel-timeline";
import { makeBaseLanes, makeBasicItems } from "./demoData";

export default function BasicDemo(props: { motion: "on" | "off" }) {
  const lanes = React.useMemo(() => makeBaseLanes(), []);
  const items = React.useMemo(() => makeBasicItems(), []);

  return (
    <>
      <div className="panelHeader">
        <h2>Basic timeline (static)</h2>
        <div className="hint">Wheel+Ctrl zoom · drag pan · hover for tooltip</div>
      </div>
      <Timeline
        lanes={lanes}
        items={items}
        defaultView={{ start: 0, end: 75_000 }}
        now={42_000}
        grid={{ show: true, showMinor: true }}
        axes={{ showLaneAxis: true, showTimeAxis: true, timeOrigin: 0, headerLeft: "Lanes" }}
        motion={{ mode: props.motion }}
        interaction={{ pan: true, zoom: true, zoomModifier: "ctrl" }}
      />
    </>
  );
}
