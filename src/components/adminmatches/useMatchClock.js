import { useEffect, useState, useCallback } from "react";

/**
 * Cronômetro da partida baseado em timestamp:
 * não atrasa com a tela apagada e sobrevive a um reload (via rascunho).
 */
export default function useMatchClock() {
  const [clock, setClock] = useState({ running: false, base: 0, startedAt: null });
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!clock.running) return undefined;
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    const onVisible = () => setTick((t) => t + 1);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [clock.running]);

  const elapsed = (c) =>
    c.running ? c.base + Math.floor((Date.now() - c.startedAt) / 1000) : c.base;

  const seconds = elapsed(clock);
  const minute = Math.floor(seconds / 60) + 1;

  const toggle = useCallback(
    () =>
      setClock((c) =>
        c.running
          ? { running: false, base: elapsed(c), startedAt: null }
          : { running: true, base: c.base, startedAt: Date.now() },
      ),
    [],
  );

  const adjust = useCallback(
    (minutes) =>
      setClock((c) => {
        const next = Math.max(0, elapsed(c) + minutes * 60);
        return c.running
          ? { running: true, base: next, startedAt: Date.now() }
          : { ...c, base: next };
      }),
    [],
  );

  const reset = useCallback(
    () => setClock({ running: false, base: 0, startedAt: null }),
    [],
  );

  return { clock, setClock, seconds, minute, toggle, adjust, reset };
}
