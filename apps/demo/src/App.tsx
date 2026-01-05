import React from "react";
import BasicDemo from "./demos/BasicDemo";
import RealtimeDemo from "./demos/RealtimeDemo";
import PhasesDemo from "./demos/PhasesDemo";
import ControlsDemo from "./demos/ControlsDemo";
import BigDemo from "./demos/BigDemo";

type DemoKey = "basic" | "realtime" | "phases" | "controls" | "big";

function useQuery(): URLSearchParams {
  const [q, setQ] = React.useState(() => new URLSearchParams(window.location.search));
  React.useEffect(() => {
    const onPop = () => setQ(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return q;
}

function Link(props: { demo: DemoKey; current: DemoKey; children: React.ReactNode }) {
  const { demo, current, children } = props;
  const href = `/?demo=${demo}`;
  return (
    <a className={demo === current ? "active" : ""} href={href}>
      {children}
    </a>
  );
}

export default function App() {
  const q = useQuery();
  const demo = (q.get("demo") as DemoKey) ?? "basic";
  const motion = (q.get("motion") ?? "on") as "on" | "off";

  const Demo = (() => {
    switch (demo) {
      case "basic":
        return <BasicDemo motion={motion} />;
      case "realtime":
        return <RealtimeDemo motion={motion} />;
      case "phases":
        return <PhasesDemo motion={motion} />;
      case "controls":
        return <ControlsDemo motion={motion} />;
      case "big":
        return <BigDemo motion={motion} />;
      default:
        return <BasicDemo motion={motion} />;
    }
  })();

  return (
    <div className="app">
      <div className="sidebar">
        <h1>React Parallel Timeline – Demo</h1>
        <div className="hint">Try wheel+Ctrl to zoom, drag to pan.</div>
        <div className="nav">
          <Link demo="basic" current={demo}>Basic</Link>
          <Link demo="realtime" current={demo}>Real-time</Link>
          <Link demo="phases" current={demo}>Status phases</Link>
          <Link demo="controls" current={demo}>UI controls</Link>
          <Link demo="big" current={demo}>Big (virtualised)</Link>
        </div>
        <div className="hint">
          Tip: append <code>&motion=off</code> to disable animation.
        </div>
      </div>

      <div className="panel">
        {Demo}
      </div>
    </div>
  );
}
