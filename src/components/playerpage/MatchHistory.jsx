import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/matchHistory.css";

const MatchHistory = ({ matches, player }) => {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";

    if (dateStr.includes("/")) {
      return dateStr.substring(0, 5);
    }

    // Note a vírgula vazia no início: ela pula o primeiro item (ano)
    const [, month, day] = dateStr.split("T")[0].split("-");
    return `${day}/${month}`;
  };
  // Ordenar por ordem decrescente (mais recentes primeiro)
  const sortedMatches = [...matches].sort(
    (a, b) => (b.order || 0) - (a.order || 0),
  );

  return (
    <div className="adr-history-container">
      <div className="adr-history-header">
        <h3 className="adr-history-title">Histórico de Performance</h3>
        <div className="adr-history-count">{matches.length} partidas</div>
      </div>

      <div className="adr-history-list">
        {sortedMatches.map((m) => {
          const isTeamA = m.teamA.players.some(
            (id) => String(id) === String(player.id),
          );

          const sA =
            m.events?.filter(
              (e) =>
                (e.team === "A" && e.type === "GOAL") ||
                (e.team === "B" && e.type === "OWN_GOAL"),
            ).length || 0;

          const sB =
            m.events?.filter(
              (e) =>
                (e.team === "B" && e.type === "GOAL") ||
                (e.team === "A" && e.type === "OWN_GOAL"),
            ).length || 0;

          let result = "draw"; // win, loss, draw
          if (sA > sB) result = isTeamA ? "win" : "loss";
          else if (sB > sA) result = !isTeamA ? "win" : "loss";

          // Se houve pênaltis
          if (sA === sB && m.penaltiesWinner) {
            const wonPenalties =
              (m.penaltiesWinner === "A" && isTeamA) ||
              (m.penaltiesWinner === "B" && !isTeamA);
            result = wonPenalties ? "win" : "loss";
          }

          const pG =
            m.events?.filter(
              (e) =>
                String(e.playerId) === String(player.id) && e.type === "GOAL",
            ).length || 0;
          const pA =
            m.events?.filter(
              (e) =>
                e.type === "GOAL" && String(e.assistId) === String(player.id),
            ).length || 0;

          return (
            <div
              key={m.id}
              className={`adr-match-card result-${result}`}
              onClick={() => navigate(`/match/${m.id}`)}
            >
              {/* Lado Esquerdo: Data e Círculo de Status */}
              <div className="adr-match-info">
                <div className={`adr-status-indicator ${result}`}>
                  {result === "win" ? "V" : result === "loss" ? "D" : "E"}
                </div>
                <span className="adr-match-date">{formatDate(m.date)}</span>
              </div>

              {/* Centro: Placar e Times */}
              <div className="adr-match-main">
                <div className="adr-team-mini">
                  <span
                    className={`adr-team-name ${isTeamA ? "highlight" : ""}`}
                  >
                    {m.teamA.name}
                  </span>
                </div>

                <div className="adr-match-score">
                  <span className="score-num">{sA}</span>
                  <span className="score-divider">:</span>
                  <span className="score-num">{sB}</span>
                  {m.penaltiesWinner && (
                    <small className="penalties-alert">P</small>
                  )}
                </div>

                <div className="adr-team-mini team-right">
                  <span
                    className={`adr-team-name ${!isTeamA ? "highlight" : ""}`}
                  >
                    {m.teamB.name}
                  </span>
                </div>
              </div>

              {/* Lado Direito: Stats do Jogador */}
              <div className="adr-match-player-stats">
                <div className="stats-badges">
                  {pG > 0 && <span className="badge-goal"> +{pG} G</span>}
                  {pA > 0 && <span className="badge-assist"> +{pA} A</span>}
                </div>
                <span className="adr-match-chevron">›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchHistory;
