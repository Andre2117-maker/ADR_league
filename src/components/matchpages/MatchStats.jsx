import React from "react";

function MatchStats({ teamStats, teamAName, teamBName }) {
  // Se o objeto stats não chegar, não renderiza
  if (!teamStats) return null;

  // Mapeamos os rótulos para as chaves que existem dentro de teamA e teamB do seu matchUtils
  const rows = [
    { label: "Gols", key: "goals" },
    { label: "Assistências", key: "assists" },
    { label: "Gols Contra", key: "ownGoals" },
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
          // Acessa os valores conforme a estrutura do seu matchUtils: stats.teamA.goals, etc.
          const valA = teamStats.teamA?.[row.key] || 0;
          const valB = teamStats.teamB?.[row.key] || 0;

          // Define as cores das pílulas de destaque
          let classA = "stat-val";
          let classB = "stat-val";

          if (valA > valB) classA += " highlight-winner";
          else if (valB > valA) classB += " highlight-winner";

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
