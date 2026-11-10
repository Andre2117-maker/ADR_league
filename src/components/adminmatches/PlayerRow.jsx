import React, { useState } from "react";
import { CARD_REASONS } from "./adminMatchesUtils";

/**
 * Linha do jogador: toque no nome = entra/sai da escalação.
 * Se ele está jogando, aparecem os botões grandes de ação.
 * Mostra número da camisa e o que ele já fez na partida.
 */
function PlayerRow({
  player,
  shirt,
  isSelected,
  isGK,
  isCaptain,
  cameIn,
  wentOut,
  stats,
  onToggle,
  onSetGK,
  onSetCaptain,
  onGoal,
  onOwnGoal,
  onCard,
}) {
  const [pendingCard, setPendingCard] = useState(null);
  const [reason, setReason] = useState("");

  const playing = isSelected || cameIn;
  const s = stats || {};

  const confirmCard = (r = reason) => {
    onCard(pendingCard, r);
    setPendingCard(null);
    setReason("");
  };

  return (
    <div className={`amp-row ${isSelected ? "is-selected" : ""} ${cameIn && !isSelected ? "is-sub" : ""} ${s.red ? "is-sent-off" : ""}`}>
      <button type="button" className="amp-main" onClick={onToggle} aria-pressed={isSelected}>
        <span className="amp-check" aria-hidden="true" />
        {shirt !== "" && <span className="amp-num">{shirt}</span>}
        <span className="amp-name">{player.name}</span>

        <span className="amp-tags">
          {isGK && <i title="Goleiro titular">🧤</i>}
          {isCaptain && <i title="Capitão">Ⓒ</i>}
          {cameIn && <i title="Entrou">⬆️</i>}
          {wentOut && <i title="Saiu">⬇️</i>}
        </span>

        <span className="amp-stats">
          {s.goals > 0 && <em>⚽{s.goals > 1 ? s.goals : ""}</em>}
          {s.assists > 0 && <em>🎯{s.assists > 1 ? s.assists : ""}</em>}
          {s.og > 0 && <em>⚠️{s.og > 1 ? s.og : ""}</em>}
          {s.yellow > 0 && <em>🟨{s.yellow > 1 ? s.yellow : ""}</em>}
          {s.red > 0 && <em>🟥</em>}
        </span>
      </button>

      {playing && !pendingCard && (
        <div className="amp-actions">
          <button type="button" className="amp-act amp-goal" onClick={onGoal}>
            ⚽ <span>Gol</span>
          </button>
          <button type="button" className="amp-act amp-og" onClick={onOwnGoal}>
            GC
          </button>
          <button type="button" className="amp-act amp-yellow" onClick={() => setPendingCard("YELLOW")} aria-label="Amarelo">
            🟨
          </button>
          <button type="button" className="amp-act amp-red" onClick={() => setPendingCard("RED")} aria-label="Vermelho">
            🟥
          </button>
          {isSelected && (
            <>
              <button type="button" className={`amp-act amp-gk ${isGK ? "on" : ""}`} onClick={onSetGK} title="Goleiro titular">
                🧤
              </button>
              <button type="button" className={`amp-act amp-cap ${isCaptain ? "on" : ""}`} onClick={onSetCaptain} title="Capitão">
                Ⓒ
              </button>
            </>
          )}
        </div>
      )}

      {playing && pendingCard && (
        <div className="amp-card-box">
          <div className="amp-card-title">
            {pendingCard === "YELLOW" ? "🟨 Amarelo" : "🟥 Vermelho"} · motivo (opcional)
          </div>
          <div className="am-chips">
            {CARD_REASONS.map((r) => (
              <button key={r} type="button" className="am-chip" onClick={() => confirmCard(r)}>
                {r}
              </button>
            ))}
          </div>
          <div className="am-inline">
            <input
              className="am-input"
              placeholder="Outro motivo..."
              value={reason}
              autoFocus
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmCard()}
            />
            <button type="button" className="am-btn am-btn-primary" onClick={() => confirmCard()}>
              ✓
            </button>
            <button type="button" className="am-btn am-btn-ghost" onClick={() => setPendingCard(null)}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(PlayerRow);
