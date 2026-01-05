import * as React from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mql) return;
    const onChange = () => setReduced(!!mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

export function useNow(options: { enabled: boolean; tickMs: number; externalNow?: number }): number {
  const { enabled, tickMs, externalNow } = options;
  const [now, setNow] = React.useState(() => (typeof externalNow === "number" ? externalNow : Date.now()));

  React.useEffect(() => {
    if (typeof externalNow === "number") {
      setNow(externalNow);
    }
  }, [externalNow]);

  React.useEffect(() => {
    if (!enabled) return;
    if (typeof externalNow === "number") return; // controlled
    const id = window.setInterval(() => setNow(Date.now()), Math.max(16, tickMs));
    return () => window.clearInterval(id);
  }, [enabled, tickMs, externalNow]);

  return now;
}

export function useResizeObserver<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  { width: number; height: number },
] {
  const ref = React.useRef<T | null>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSize({ width: cr.width, height: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}
