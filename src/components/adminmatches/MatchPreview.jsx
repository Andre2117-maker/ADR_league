import React from "react";
import "../../styles/matchpreview.css";

const MatchPreview = ({
  draft,
  players,
  goalsA,
  goalsB,
  penaltiesScoreA, // Recebendo os gols de pênalti
  penaltiesScoreB, // Recebendo os gols de pênalti
  removeEvent,
}) => {
  // Lógica de empate: gols normais iguais
  const isDraw = goalsA === goalsB && goalsA !== undefined;

  // Lógica de vencedor automático: quem tem mais gols de pênalti
  const autoWinner =
    penaltiesScoreA > penaltiesScoreB
      ? "A"
      : penaltiesScoreB > penaltiesScoreA
        ? "B"
        : null;

  const getPlayerName = (playerId, externalName) => {
    if (playerId === "EXTERNO" || playerId === "OPONENTE_EXTERNO")
      return externalName || "Jogador Adversário";
    return players.find((p) => p.id === playerId)?.name || "Jogador";
  };

  const getCaptainName = (teamSide) => {
    const team = teamSide === "A" ? draft.teamA : draft.teamB;
    if (!team.captainId) return null;
    return players.find((p) => p.id === team.captainId)?.name;
  };

  const renderEventIcon = (type) => {
    switch (type) {
      case "GOAL":
        return "⚽";
      case "OWN_GOAL":
        return "⚠️";
      case "YELLOW":
        return "🟨";
      case "RED":
        return "🟥";
      default:
        return "•";
    }
  };

  return (
    <div className="match-preview-container">
      <div className="preview-card-glass">
        {/* HEADER: PLACAR ESTILO PLACAR DE TV */}
        <div className="tv-scoreboard">
          <div className="scoreboard-team team-left">
            <div className="logo-wrapper">
              {draft.teamA.logo ? (
                <img src={draft.teamA.logo} alt="L" />
              ) : (
                <div className="logo-placeholder">A</div>
              )}
            </div>
            <div className="team-info-preview">
              <span className="team-text">{draft.teamA.name || "TIME A"}</span>
              {getCaptainName("A") && (
                <span className="captain-badge">© {getCaptainName("A")}</span>
              )}
            </div>
          </div>

          <div className="score-center">
            <div className="score-numbers">
              <span className="n">{goalsA}</span>

              {/* Placar de Pênaltis: Só aparece se for empate e houver gols de pênalti */}
              {isDraw && (penaltiesScoreA > 0 || penaltiesScoreB > 0) && (
                <span className="penalties-score">
                  ({penaltiesScoreA || 0})
                </span>
              )}

              <span className="divider">-</span>

              {isDraw && (penaltiesScoreA > 0 || penaltiesScoreB > 0) && (
                <span className="penalties-score">
                  ({penaltiesScoreB || 0})
                </span>
              )}

              <span className="n">{goalsB}</span>
            </div>

            {/* Vencedor automático nos pênaltis: Só aparece se for empate e tiver vencedor */}
            {isDraw && autoWinner && (
              <div className="penalties-tag">
                PÊNALTIS:{" "}
                <strong>
                  {autoWinner === "A" ? draft.teamA.name : draft.teamB.name}
                </strong>{" "}
                🏆
              </div>
            )}
          </div>

          <div className="scoreboard-team team-right">
            <div className="team-info-preview align-right">
              <span className="team-text">{draft.teamB.name || "TIME B"}</span>
              {getCaptainName("B") && (
                <span className="captain-badge">© {getCaptainName("B")}</span>
              )}
            </div>
            <div className="logo-wrapper">
              {draft.teamB.logo ? (
                <img src={draft.teamB.logo} alt="L" />
              ) : (
                <div className="logo-placeholder">B</div>
              )}
            </div>
          </div>
        </div>

        {/* TIMELINE ESTILIZADA */}
        <div className="timeline-section">
          <h4 className="section-label">LINHA DO TEMPO DOS EVENTOS</h4>
          <div className="events-grid">
            {draft.events.length === 0 ? (
              <div className="empty-timeline">
                Aguardando lances da partida...
              </div>
            ) : (
              draft.events.map((e) => (
                <div
                  key={e.id}
                  className={`event-card-mini ${e.type.toLowerCase()}`}
                >
                  <div className="event-main-info">
                    <span className="e-icon">{renderEventIcon(e.type)}</span>
                    <div className="e-texts">
                      <span className="e-player">
                        {getPlayerName(e.playerId, e.externalName)}
                        {e.type === "OWN_GOAL" && (
                          <small className="og-label"> (GC)</small>
                        )}
                      </span>
                      {e.assistId && (
                        <span className="e-assist">
                          Assist: {getPlayerName(e.assistId)} 👟
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="event-side">
                    <span className="e-team-tag">
                      {e.team === "A" ? draft.teamA.name : draft.teamB.name}
                    </span>
                    <button
                      className="e-delete"
                      onClick={() => removeEvent(e.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchPreview;
