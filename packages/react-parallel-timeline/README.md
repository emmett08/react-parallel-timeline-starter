# @neuralsea/react-parallel-timeline

An extensible, Gantt-style “parallel processes” timeline component for React.

## Install

```bash
npm i @neuralsea/react-parallel-timeline
```

Peer deps: `react`, `react-dom` (React 19).

## Usage

```tsx
import { Timeline } from "@neuralsea/react-parallel-timeline";
import "@neuralsea/react-parallel-timeline/styles.css";

export function Example() {
  return (
    <Timeline
      lanes={[{ id: "ui", label: "UIAgent", color: "#4C8DFF" }]}
      items={[
        { id: "a", laneId: "ui", start: 0, end: 10_000, label: "draft", status: "responding" },
      ]}
      defaultView={{ start: 0, end: 60_000 }}
      now={12_345}
      grid={{ show: true }}
      axes={{ showLaneAxis: true, showTimeAxis: true, timeOrigin: 0 }}
      motion={{ mode: "auto" }}
    />
  );
}
```

## Links

- Repo: https://github.com/emmett08/react-parallel-timeline-starter
