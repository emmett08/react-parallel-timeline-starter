# React Parallel Timeline (React 19 + TypeScript 5) – Starter

A visually appealing, extensible, Gantt-style “parallel processes” timeline component (inspired by the UI in your screenshot):
- **Real-time** progress (active bars extend to `now`)
- **Parallel lanes** (agents/processes on the left)
- **Colour by lane / by item / by status**
- **Status transitions** (e.g. thinking → responding) via **segments**, colour + subtle patterns
- **Togglable motion** (`motion.mode = 'on' | 'off' | 'auto'`)
- **Show/hide** time axis, lane axis, grid, now line, hover line
- **Zoom + pan** (wheel zoom with modifier, drag pan)
- **Optional lane virtualisation** for big lists (fixed row height mode)
- **Accessible defaults** (keyboard focus, ARIA labels, reduced-motion support)
- Ships **ESM + CommonJS** builds, Node **18+**

Includes a Vite demo app and Cypress E2E specs that **capture screenshots and MP4 videos** of the demos.

## Monorepo layout

- `packages/react-parallel-timeline/` – the library
- `apps/demo/` – Vite demo app (multiple “demo scenes”)
- `cypress/` – E2E specs (one per demo → one MP4 per demo)

## Quick start

```bash
npm i
npm run build
npm run dev
```

Open the demo:
- `http://localhost:5173/?demo=basic`
- `http://localhost:5173/?demo=realtime`
- `http://localhost:5173/?demo=phases`
- `http://localhost:5173/?demo=controls`
- `http://localhost:5173/?demo=big`

## Cypress screenshots + MP4 videos

Run headless (records MP4 by default):

```bash
npm run e2e
```

Outputs:
- Videos: `cypress/videos/`
- Screenshots: `cypress/screenshots/`

Notes:
- Cypress **does not record video in `cypress open`** (interactive mode). Use `cypress run` / `npm run e2e` for MP4s.

## Library usage

```tsx
import { Timeline } from "@neuralsea/react-parallel-timeline";
import "@neuralsea/react-parallel-timeline/styles.css";

export function Example() {
  return (
    <Timeline
      lanes={[{ id: "ui", label: "UIAgent", color: "#4C8DFF" }]}
      items={[
        { id: "a", laneId: "ui", start: 0, end: 10_000, label: "draft", status: "responding" }
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

## Custom styling

Override CSS variables on a wrapper:

```css
.myTheme {
  --rt-bg: #0b1220;
  --rt-panel: #0f1a2f;
  --rt-text: #e7eefc;
  --rt-grid: rgba(255,255,255,.08);
  --rt-now: rgba(255,255,255,.5);
}
```

Or pass classes via `classNames` / `getItemClassName` and implement your own CSS.
