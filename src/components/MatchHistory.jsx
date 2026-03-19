import React from "react";
import "../styles/matchHistory.css";

const MatchHistory = ({ matches, player }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split("T")[0].split("-");
    return `${parts[2]}/${parts[1]}`;
  };

  const sortedMatches = [...matches].sort(
    (a, b) => (b.order || 0) - (a.order || 0),
  );

  return (
    <div className="ppg-card">
      <h3 className="ppg-card-title">Histórico de Partidas</h3>
      <div className="ppg-scroll-area">
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

          let won = false;
          if (sA > sB) won = isTeamA;
          else if (sB > sA) won = !isTeamA;
          else
            won =
              (m.penaltiesWinner === "A" && isTeamA) ||
              (m.penaltiesWinner === "B" && !isTeamA);

          const statusClass = won ? "win" : "loss";
          const pG =
            m.events?.filter(
              (e) =>
                String(e.playerId) === String(player.id) && e.type === "GOAL",
            ).length || 0;
          const pA =
            m.events?.filter(
              (e) =>
                (e.type === "GOAL" &&
                  String(e.assistId) === String(player.id)) ||
                (e.type === "ASSIST" &&
                  String(e.playerId) === String(player.id)),
            ).length || 0;

          return (
            <div key={m.id} className={`ppg-match-item border-${statusClass}`}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span className="ppg-date-tag">{formatDate(m.date)}</span>
                  <span className={`status-tag ${statusClass}`}>
                    {won ? "VITÓRIA" : "DERROTA"}
                    {sA === sB && " (P)"}
                  </span>
                </div>
                <div className="ppg-teams-display">
                  <span className={isTeamA ? "active" : ""}>
                    {m.teamA.name}
                  </span>
                  <span className="ppg-vs-badge">
                    {sA} : {sB}
                  </span>
                  <span className={!isTeamA ? "active" : ""}>
                    {m.teamB.name}
                  </span>
                </div>
              </div>
              <div className="ppg-match-stats-tags">
                {pG > 0 && <span className="ppg-tag-goal">+{pG} G</span>}
                {pA > 0 && <span className="ppg-tag-assist">+{pA} A</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchHistory;
