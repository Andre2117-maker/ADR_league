import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FutCard from "./FutCard";
import { computeRetrospective, seasonsIn } from "../../../utils/seasonStats";
import { exportNodeImage } from "../../../utils/exportImage";
import { useClubMode } from "../../../utils/shirtNumber";
import "./futcard.css";

/**
 * Botão "Card do jogador" + janela com o card, troca de temporada,
 * e baixar / compartilhar a imagem.
 * Uso: <FutCardShare player={player} players={players} matches={matches} />
 */
export default function FutCardShare({
  player,
  players = [],
  matches = [],
  buttonClassName = "",
}) {
  const mode = useClubMode();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const cardRef = useRef(null);

  const seasons = useMemo(() => seasonsIn(matches), [matches]);
  const [season, setSeason] = useState(null);
  const activeSeason = season || seasons[0] || String(new Date().getFullYear());

  const retro = useMemo(
    () =>
      open && player
        ? computeRetrospective(player, players, matches, activeSeason)
        : null,
    [open, player, players, matches, activeSeason],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!player) return null;

  const handleExport = async () => {
    setBusy(true);
    setMsg("");
    try {
      const name = String(player.nickname || player.name || "jogador")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .toLowerCase();
      const result = await exportNodeImage(cardRef.current, {
        filename: `card-${name}-${activeSeason}.png`,
        background: null,
        title: `Card de ${player.name}`,
      });
      if (result === "downloaded") setMsg("Imagem baixada!");
      if (result === "shared") setMsg("Compartilhado!");
    } catch (err) {
      console.error("Erro ao gerar o card:", err);
      setMsg("Não foi possível gerar a imagem.");
    } finally {
      setBusy(false);
    }
  };

  const t = retro?.totals;

  return (
    <>
      <button
        type="button"
        className={`fcs-open ${buttonClassName}`}
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="2.5" width="14" height="19" rx="2" />
          <path d="M8.5 7.5h3M8.5 10h2" />
          <path d="M8 18h8" />
        </svg>
        Card do jogador
      </button>

      {open &&
        createPortal(
          <div
            className={`fcs-overlay ${mode === "idr" ? "theme-idr" : ""}`}
            onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <div
              className="fcs-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Card do jogador"
            >
              <header className="fcs-head">
                <span>CARD DO JOGADOR</span>
                <button
                  type="button"
                  className="fcs-x"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </header>

              <div className="fcs-stage">
                <FutCard
                  ref={cardRef}
                  player={player}
                  mode={mode}
                  season={activeSeason}
                  stats={
                    t
                      ? { games: t.games, goals: t.goals, assists: t.assists }
                      : null
                  }
                  gkShare={t && t.games ? t.gkGames / t.games : 0}
                />
              </div>

              {seasons.length > 1 && (
                <div className="fcs-seasons">
                  {seasons.map((y) => (
                    <button
                      key={y}
                      type="button"
                      className={y === activeSeason ? "on" : ""}
                      onClick={() => setSeason(y)}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="fcs-download"
                onClick={handleExport}
                disabled={busy}
              >
                {busy ? "GERANDO..." : "BAIXAR / COMPARTILHAR"}
                {!busy && <span aria-hidden="true">›</span>}
              </button>
              {msg && <p className="fcs-msg">{msg}</p>}
              <p className="fcs-hint">
                O OVR é a média das habilidades. Ouro a partir de 75, Ícone a
                partir de 85.
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
