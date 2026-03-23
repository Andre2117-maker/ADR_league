import React from "react";

function MatchStats({ teamStats, teamAName, teamBName }) {
  if (!teamStats) return null;

  // Definimos as linhas e quais delas devem ter o destaque invertido (menor é melhor)
  const rows = [
    { label: "GOLS", key: "goals", lowerIsBetter: false },
    { label: "ASSISTÊNCIAS", key: "assists", lowerIsBetter: false },
    { label: "GOLS CONTRA", key: "ownGoals", lowerIsBetter: true },
    { label: "AMARELOS", key: "yellowCards", lowerIsBetter: true },
    { label: "VERMELHOS", key: "redCards", lowerIsBetter: true },
  ];

  return (
    <div className="team-stats-card">
      <div className="stats-header-text">
        <span className="team-name-a">{teamAName}</span>
        <span className="stats-title-center">ESTATÍSTICAS DA PARTIDA</span>
        <span className="team-name-b">{teamBName}</span>
      </div>

      <div className="stats-body">
        {rows.map((row) => {
          const valA = teamStats.teamA?.[row.key] || 0;
          const valB = teamStats.teamB?.[row.key] || 0;

          let classA = "stat-val";
          let classB = "stat-val";

          // Lógica de Destaque
          if (valA !== valB) {
            if (row.lowerIsBetter) {
              // Se menos é melhor (Cartões e Gols Contra)
              if (valA < valB) classA += " highlight-winner";
              else classB += " highlight-winner";
            } else {
              // Se mais é melhor (Gols e Assistências)
              if (valA > valB) classA += " highlight-winner";
              else classB += " highlight-winner";
            }
          }

          return (
            <div className="text-stat-row" key={row.label}>
              <div className="stat-col left">
                <span className={classA}>{valA}</span>
              </div>
              <div className="stat-col center">
                <span className="stat-label-text">{row.label}</span>
              </div>
              <div className="stat-col right">
                <span className={classB}>{valB}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MatchStats;
