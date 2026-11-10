import React from "react";

/**
 * Etapa "Fim": resultado, gol de ouro, goleiros e checklist antes de salvar.
 * (antes: AdminExtras)
 */
export default function FinishPanel({
  teamA,
  teamB,
  goalsA,
  goalsB,
  pensA,
  pensB,
  result,
  goldenGoalWinner,
  onGoldenGoal,
  gkStats,
  playersById,
  checklist,
  onGoStep,
  eventsCount,
}) {
  const names = { A: teamA.name || "Time A", B: teamB.name || "Time B" };
  const how = {
    normal: "no tempo normal",
    penalties: `nos pênaltis (${pensA} × ${pensB})`,
    golden: "no gol de ouro",
  };

  const gkLabel = (g) => (g.id ? playersById[g.id]?.name || "Jogador" : g.name);

  return (
    <div className="am-panel">
      <div className="am-panel-head">
        <span className="am-kicker">ETAPA FINAL</span>
        <h2>Conferir e salvar</h2>
      </div>

      {/* RESULTADO */}
      <div className="am-result">
        <div className="am-result-score">
          <span>{names.A}</span>
          <b>
            {goalsA} × {goalsB}
          </b>
          <span>{names.B}</span>
        </div>
        <p className={result.winner ? "am-result-win" : "am-result-pending"}>
          {result.winner
            ? `🏆 ${names[result.winner]} vence ${how[result.how]}`
            : "Empate: defina o vencedor nos pênaltis ou no gol de ouro"}
        </p>
        <small className="am-muted">{eventsCount} lances registrados</small>
      </div>

      {/* GOL DE OURO */}
      <label className="am-label">⚡ Gol de ouro</label>
      <p className="am-hint">Use se a partida foi decidida no gol de ouro: o time escolhido vence, independente do placar.</p>
      <div className="am-seg">
        <button type="button" className={!goldenGoalWinner ? "on" : ""} onClick={() => onGoldenGoal(null)}>
          Não houve
        </button>
        <button type="button" className={goldenGoalWinner === "A" ? "on" : ""} onClick={() => onGoldenGoal("A")}>
          {names.A}
        </button>
        <button type="button" className={goldenGoalWinner === "B" ? "on" : ""} onClick={() => onGoldenGoal("B")}>
          {names.B}
        </button>
      </div>

      {/* GOLEIROS */}
      <label className="am-label">🧤 Goleiros (vai para a tabela)</label>
      <div className="am-gk-grid">
        {["A", "B"].map((side) => (
          <div key={side} className="am-gk-col">
            <small>{names[side]}</small>
            {(gkStats[side] || []).length === 0 ? (
              <span className="am-pill am-pill-warn">Sem goleiro definido</span>
            ) : (
              gkStats[side].map((g) => (
                <div key={g.id || g.name} className="am-gk-line">
                  <span>{gkLabel(g)}</span>
                  <b>{g.conceded} sofrido{g.conceded === 1 ? "" : "s"}</b>
                  {g.cleanSheet && <em>clean sheet</em>}
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      {/* CHECKLIST */}
      <label className="am-label">Checklist</label>
      <ul className="am-check-list">
        {checklist.map((c) => (
          <li key={c.id || c.label}className={c.ok ? "ok" : c.required ? "bad" : "warn"}>
            <span>{c.ok ? "✓" : c.required ? "✕" : "!"}</span>
            <p>{c.label}</p>
            {!c.ok && c.step && (
              <button type="button" className="am-chip" onClick={() => onGoStep(c.step)}>
                Resolver
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
