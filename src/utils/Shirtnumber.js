import { useEffect, useState } from "react";

/**
 * Número da camisa conforme o modo do clube.
 * - ADR  -> player.number
 * - IDR  -> player.numberIDR (se vazio, cai no número do ADR)
 */
export const getShirtNumber = (player, mode = "adr", fallback = "00") => {
  if (!player) return fallback;

  const adr = player.number;
  const idr = player.numberIDR;
  const isEmpty = (v) => v === undefined || v === null || v === "";

  if (String(mode).toLowerCase() === "idr" && !isEmpty(idr)) return idr;
  return isEmpty(adr) ? fallback : adr;
};

/**
 * Detecta o modo pela classe `theme-idr` no <html>/<body>.
 * Se você já tem um context/hook de modo, ignore este e passe `mode` por prop.
 */
const detectMode = () => {
  if (typeof document === "undefined") return "adr";
  const has = (el) => el?.classList?.contains("theme-idr");
  return has(document.documentElement) ||
    has(document.body) ||
    document.querySelector(".theme-idr")
    ? "idr"
    : "adr";
};

export const useClubMode = () => {
  const [mode, setMode] = useState(detectMode);

  useEffect(() => {
    const update = () => setMode(detectMode());
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
    });
    return () => obs.disconnect();
  }, []);

  return mode;
};
