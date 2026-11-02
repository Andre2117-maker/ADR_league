import React from "react";
import "./MatchStats.css";

function MatchStats({ teamStats, match, teamAName, teamBName }) {
  // Se recebermos a partida (match), calculamos os totais em tempo real de forma segura
  const statsA = teamStats?.teamA || {
    goals: 0,
    assists: 0,
    ownGoals: 0,
    yellowCards: 0,
    redCards: 0,
  };
  const statsB = teamStats?.teamB || {
    goals: 0,
    assists: 0,
    ownGoals: 0,
    yellowCards: 0,
    redCards: 0,
  };

  if (match && match.events) {
    match.events.forEach((e) => {
      const team = e.team; // "A" ou "B"
      if (!team) return;

      const target = team === "A" ? statsA : statsB;
      const otherTarget = team === "A" ? statsB : statsA;

      if (e.type === "GOAL") {
        target.goals = (target.goals || 0) + 1;
        if (e.assistId) {
          target.assists = (target.assists || 0) + 1;
        }
      } else if (e.type === "ASSIST") {
        target.assists = (target.assists || 0) + 1;
      } else if (e.type === "OWN_GOAL") {
        // Gol contra conta para o adversário como gol, mas registra o GC na estatística própria
        target.ownGoals = (target.ownGoals || 0) + 1;
        otherTarget.goals = (otherTarget.goals || 0) + 1;
      } else if (e.type === "YELLOW" || e.type === "YELLOW_CARD") {
        target.yellowCards = (target.yellowCards || 0) + 1;
      } else if (e.type === "RED" || e.type === "RED_CARD") {
        target.redCards = (target.redCards || 0) + 1;
      }
    });
  }

  const nameA = teamAName || match?.teamA?.name || "Time A";
  const nameB = teamBName || match?.teamB?.name || "Time B";

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
        <span className="team-name-a">{nameA}</span>
        <span className="stats-title-center">ESTATÍSTICAS DA PARTIDA</span>
        <span className="team-name-b">{nameB}</span>
      </div>

      <div className="stats-body">
        {rows.map((row) => {
          const valA = statsA[row.key] || 0;
          const valB = statsB[row.key] || 0;

          let classA = "stat-val";
          let classB = "stat-val";

          // Lógica de Destaque
          if (valA !== valB) {
            if (row.lowerIsBetter) {
              if (valA < valB) classA += " highlight-winner";
              else classB += " highlight-winner";
            } else {
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
