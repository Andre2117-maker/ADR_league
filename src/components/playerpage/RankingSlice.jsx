import React, { useMemo } from "react";
import "../../styles/Playerpage/rankingslice.css";

export default function RankingSlice({
  player,
  sortedPlayers = [],
  getPlayerStats,
}) {
  const trainingPlayers = useMemo(() => {
    return sortedPlayers
      .filter((p) => !p.isAnonymous)
      .map((p) => {
        // Se a função existir, pega os pontos oficiais. Se não, usa o que tiver no p.
        const stats =
          typeof getPlayerStats === "function" ? getPlayerStats(p.id) : {};
        const points = stats.points ?? p.points ?? 0;

        return { ...p, officialPoints: points };
      })
      .sort((a, b) => b.officialPoints - a.officialPoints);
  }, [sortedPlayers, getPlayerStats]);

  const index = trainingPlayers.findIndex(
    (p) => String(p.id) === String(player.id),
  );

  if (index === -1) return null;

  let start = Math.max(0, index - 2);
  let end = Math.min(start + 5, trainingPlayers.length);
  if (end - start < 5 && start > 0) start = Math.max(0, end - 5);

  const tableSlice = trainingPlayers.slice(start, end);

  return (
    <div className="rs-container">
      <h3 className="rs-title">Ranking de Treino</h3>
      <div className="rs-list">
        {tableSlice.map((p) => {
          const realPosition = trainingPlayers.indexOf(p) + 1;
          const isActive = String(p.id) === String(player.id);

          return (
            <div key={p.id} className={`rs-row ${isActive ? "active" : ""}`}>
              <span className="rs-pos">{realPosition}º</span>
              <span className="rs-separator">–</span>
              <span className="rs-name">
                {p.nickname || p.name.split(" ")[0]}
              </span>
              <span className="rs-pts">
                <strong>{p.officialPoints}</strong> pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
