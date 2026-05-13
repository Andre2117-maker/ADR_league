import React, { useMemo } from "react";
import "../../styles/Playerpage/rankingslice.css";

export default function RankingSlice({ player, sortedPlayers = [] }) {
  const trainingPlayers = useMemo(() => {
    return sortedPlayers.filter((p) => !p.isAnonymous);
  }, [sortedPlayers]);

  const index = trainingPlayers.findIndex(
    (p) => String(p.id) === String(player.id),
  );

  if (index === -1) return null;

  let start = Math.max(0, index - 2);
  let end = Math.min(start + 5, trainingPlayers.length);

  if (end - start < 5 && start > 0) {
    start = Math.max(0, end - 5);
  }

  const tableSlice = trainingPlayers.slice(start, end);

  return (
    <div className="rs-container">
      <h3 className="rs-title">Ranking de Treino</h3>

      <div className="rs-list">
        {tableSlice.map((p, localIndex) => {
          console.log(
            p.name,
            "PTS:",
            p.points,
            "W:",
            p.wins,
            "D:",
            p.draws,
            "L:",
            p.losses,
            "G:",
            p.goals,
            "A:",
            p.assists,
          );
          const realPosition = start + localIndex + 1;

          const isActive = String(p.id) === String(player.id);

          return (
            <div key={p.id} className={`rs-row ${isActive ? "active" : ""}`}>
              <span className="rs-pos">{realPosition}º</span>

              <span className="rs-separator">–</span>

              <span className="rs-name">
                {p.nickname || p.name.split(" ")[0]}
              </span>

              <span className="rs-pts">
                <strong>{p.points || 0}</strong> pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
