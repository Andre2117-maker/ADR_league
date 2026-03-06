import React from "react";
import "../styles/goalkeepers.css";

function TopGoalkeepersCard({ players, matches }) {
  const MIN_GAMES = 2; // Ajuste conforme desejar: mínimo de jogos para entrar no ranking

  const goalkeeperStats = players
    .map((player) => {
      let totalCleanSheets = 0;
      let totalGoalsAgainst = 0;
      let gamesAsGK = 0;

      matches.forEach((match) => {
        const isA = match.teamA.goalkeeperId === player.id;
        const isB = match.teamB.goalkeeperId === player.id;

        if (isA || isB) {
          gamesAsGK++;
          const goals = isA
            ? match.events.filter(
                (e) =>
                  (e.type === "GOAL" && e.team === "B") ||
                  (e.type === "OWN_GOAL" && e.team === "A"),
              ).length
            : match.events.filter(
                (e) =>
                  (e.type === "GOAL" && e.team === "A") ||
                  (e.type === "OWN_GOAL" && e.team === "B"),
              ).length;

          totalGoalsAgainst += goals;
          if (goals === 0) totalCleanSheets++;
        }
      });

      // Cálculo da Média: Gols Sofridos / Jogos
      const mgs = gamesAsGK > 0 ? totalGoalsAgainst / gamesAsGK : 999;

      return { ...player, totalCleanSheets, totalGoalsAgainst, gamesAsGK, mgs };
    })
    // Filtros: Tem que ter jogado o mínimo, ter jogado no gol e não ser anônimo
    .filter((p) => p.gamesAsGK >= MIN_GAMES && !p.isAnonymous)
    // Ordenação: Menor MGS primeiro (mais eficiente), depois mais CS
    .sort((a, b) => a.mgs - b.mgs || b.totalCleanSheets - a.totalCleanSheets)
    .slice(0, 5);

  return (
    <div className="gk-card">
      <h3 className="gk-title">Paredões da Temporada</h3>

      <div className="gk-header">
        <span>Goleiro</span>
        <div className="gk-header-stats">
          <span className="gk-stat-label">MGS</span>
          <span className="gk-stat-label">CS</span>
          <span className="gk-stat-label">J</span>
        </div>
      </div>

      <div className="gk-list">
        {goalkeeperStats.map((p, i) => (
          <div key={p.id} className="gk-row">
            <div className="gk-info">
              <span className={`gk-rank ${i === 0 ? "is-first" : ""}`}>
                {i + 1}º
              </span>
              <span className="gk-name">{p.name}</span>
            </div>
            <div className="gk-stats">
              <span className="gk-val mgs">{p.mgs.toFixed(1)}</span>
              <span className="gk-val cs">{p.totalCleanSheets}</span>
              <span className="gk-val j">{p.gamesAsGK}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="gk-footer">
        <span>
          <strong>MGS</strong> Média de Gols Sofridos
        </span>
        <span>
          <strong>CS</strong> Clean Sheets
        </span>
        <span>
          <strong>J</strong> Jogos
        </span>
      </div>
    </div>
  );
}

export default TopGoalkeepersCard;
