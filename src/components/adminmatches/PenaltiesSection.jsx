import React, { useState } from "react";
import Modal from "./Modal";
import { penaltyGoals, penaltyResult, playerName } from "./adminMatchesUtils";

/* Modal: quem cobrou? (toque no nome) */
function TakerModal({ result, teamName, candidates, onSave, onClose }) {
  const [ext, setExt] = useState("");
  const [showExt, setShowExt] = useState(candidates.length === 0);

  return (
    <Modal
      title={`${result === "goal" ? "✅ Gol" : "❌ Perdeu"} · quem cobrou?`}
      subtitle={teamName}
      onClose={onClose}
    >
      <div className="amx-grid">
        {candidates.map((p) => (
          <button key={p.id} type="button" className="amx-pick" onClick={() => onSave(p.id, "")}>
            {p.name}
          </button>
        ))}
      </div>

      {showExt ? (
        <div className="am-inline">
          <input
            className="am-input"
            autoFocus
            placeholder="Nome do cobrador"
            value={ext}
            onChange={(e) => setExt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ext.trim() && onSave("EXTERNO", ext.trim())}
          />
          <button
            type="button"
            className="am-btn am-btn-primary"
            disabled={!ext.trim()}
            onClick={() => onSave("EXTERNO", ext.trim())}
          >
            ✓
          </button>
        </div>
      ) : (
        <button type="button" className="am-chip" onClick={() => setShowExt(true)}>
          Outro / externo
        </button>
      )}

      <button type="button" className="am-btn am-btn-ghost am-btn-block" onClick={() => onSave(null, "")}>
        Registrar sem cobrador
      </button>
    </Modal>
  );
}

/**
 * Disputa de pênaltis: dois botões grandes por time.
 * Toque numa bolinha para remover aquela cobrança.
 */
export default function PenaltiesSection({
  penalties,
  teamA,
  teamB,
  candidates,
  playersById,
  onAdd,
  onRemove,
}) {
  const [taker, setTaker] = useState(null);
  const pA = penaltyGoals(penalties, "A");
  const pB = penaltyGoals(penalties, "B");
  const names = { A: teamA.name || "Time A", B: teamB.name || "Time B" };

  return (
    <div className="am-panel am-pens">
      <div className="am-panel-head">
        <span className="am-kicker">EMPATE</span>
        <h2>Pênaltis</h2>
      </div>

      <div className="am-pens-score">
        <b className={pA > pB ? "win" : ""}>{pA}</b>
        <i>×</i>
        <b className={pB > pA ? "win" : ""}>{pB}</b>
      </div>

      <div className="am-pens-teams">
        {["A", "B"].map((side) => (
          <div key={side} className="am-pens-team">
            <h4>{names[side]}</h4>
            <div className="am-pens-btns">
              <button type="button" className="amp-act amp-goal" onClick={() => setTaker({ side, result: "goal" })}>
                ✅ Gol
              </button>
              <button type="button" className="amp-act amp-red" onClick={() => setTaker({ side, result: "miss" })}>
                ❌ Perdeu
              </button>
            </div>
            <div className="am-pens-seq">
              {(penalties?.[side] || []).map((p, i) => {
                const r = penaltyResult(p);
                const who = typeof p === "object" && p ? playerName(playersById, p.playerId, p.externalName) : "";
                return (
                  <button
                    key={i}
                    type="button"
                    className={`am-pen ${r}`}
                    title={who ? `${i + 1}ª: ${who}` : `${i + 1}ª cobrança`}
                    onClick={() => {
                      if (window.confirm(`Remover a ${i + 1}ª cobrança${who ? ` (${who})` : ""}?`)) onRemove(side, i);
                    }}
                  >
                    {r === "goal" ? "●" : r === "miss" ? "✕" : "•"}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {taker && (
        <TakerModal
          result={taker.result}
          teamName={names[taker.side]}
          candidates={candidates[taker.side] || []}
          onClose={() => setTaker(null)}
          onSave={(playerId, externalName) => {
            onAdd(taker.side, taker.result, playerId, externalName);
            setTaker(null);
          }}
        />
      )}
    </div>
  );
}
