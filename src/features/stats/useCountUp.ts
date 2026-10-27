import { useEffect, useRef, useState } from 'react';

/** Tween 0 → target once; instant under prefers-reduced-motion. */
export function useCountUp(target: number | undefined, duration = 900) {
  const [value, setValue] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (target === undefined) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || done.current) { setValue(target); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
      else done.current = true;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}
