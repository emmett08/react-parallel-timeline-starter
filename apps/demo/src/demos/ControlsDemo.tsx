import React from "react";
import { Timeline } from "@neuralsea/react-parallel-timeline";
import { makeBaseLanes, makeBasicItems } from "./demoData";

export default function ControlsDemo(props: { motion: "on" | "off" }) {
  const lanes = React.useMemo(() => makeBaseLanes(), []);
  const items = React.useMemo(() => makeBasicItems(), []);

  const [showGrid, setShowGrid] = React.useState(true);
  const [showNow, setShowNow] = React.useState(true);
  const [showAxes, setShowAxes] = React.useState(true);
  const [motionOn, setMotionOn] = React.useState(props.motion === "on");

  return (
    <>
      <div className="panelHeader">
        <h2>Controls (grid / axes / motion)</h2>
        <div className="hint">Use these toggles as “external events”</div>
      </div>

      <div className="controls">
        <label data-testid="toggle-grid">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> Grid
        </label>
        <label data-testid="toggle-now">
          <input type="checkbox" checked={showNow} onChange={(e) => setShowNow(e.target.checked)} /> Now line
        </label>
        <label>
          <input type="checkbox" checked={showAxes} onChange={(e) => setShowAxes(e.target.checked)} /> Axes
        </label>
        <label data-testid="toggle-motion">
          <input type="checkbox" checked={motionOn} onChange={(e) => setMotionOn(e.target.checked)} /> Motion
        </label>
      </div>

      <Timeline
        lanes={lanes}
        items={items}
        defaultView={{ start: 0, end: 75_000 }}
        now={42_000}
        grid={{ show: showGrid, showMinor: true }}
        axes={{ showLaneAxis: showAxes, showTimeAxis: showAxes, timeOrigin: 0, headerLeft: "Lanes" }}
        showNowLine={showNow}
        motion={{ mode: motionOn ? "on" : "off" }}
      />
    </>
  );
}
