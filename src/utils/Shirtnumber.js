import { useEffect, useState } from "react";

/**
 * Número da camisa conforme o modo do clube.
 * - ADR         -> player.number
 * - IDR         -> player.numberIDR     (se vazio, cai no número do ADR)
 * - ADR Classic -> player.numberClassic (se vazio, cai no número do ADR)
 */
export const getShirtNumber = (player, mode = "adr", fallback = "00") => {
  if (!player) return fallback;

  const isEmpty = (v) => v === undefined || v === null || v === "";
  const m = String(mode).toLowerCase();

  if (m === "idr" && !isEmpty(player.numberIDR)) return player.numberIDR;
  if (m === "classic" && !isEmpty(player.numberClassic))
    return player.numberClassic;
  return isEmpty(player.number) ? fallback : player.number;
};

/**
 * Detecta o modo pelas classes do tema no <html>/<body>:
 *   theme-idr -> "idr" | theme-classic -> "classic" | nenhum -> "adr"
 * Quem só compara com "idr" continua funcionando igual
 * (o Classic é tratado como ADR nas fotos, só o número muda).
 */
const detectMode = () => {
  if (typeof document === "undefined") return "adr";
  const has = (cls) =>
    document.documentElement?.classList?.contains(cls) ||
    document.body?.classList?.contains(cls);
  if (has("theme-idr") || document.querySelector(".theme-idr")) return "idr";
  if (has("theme-classic")) return "classic";
  return "adr";
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
