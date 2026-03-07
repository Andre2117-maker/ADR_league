import "../styles/bestdaystats.css";

export default function BestDayStats({ matches, playerId }) {
  const getRecords = () => {
    if (!matches || matches.length === 0) return null;

    const dayStats = {};

    matches.forEach((m) => {
      const isPlayerIn =
        m.teamA.players.includes(playerId) ||
        m.teamB.players.includes(playerId);
      if (!isPlayerIn) return;

      const date = m.date || "Sem data";
      if (!dayStats[date]) dayStats[date] = { goals: 0, assists: 0 };

      m.events.forEach((e) => {
        if (e.playerId === playerId) {
          if (e.type === "GOAL") dayStats[date].goals++;
          if (e.type === "ASSIST") dayStats[date].assists++;
        }
      });
    });

    // Encontra o dia com mais gols
    let bestGoalDay = { date: "-", count: 0 };
    // Encontra o dia com mais assistências
    let bestAssistDay = { date: "-", count: 0 };

    for (const [date, stats] of Object.entries(dayStats)) {
      if (stats.goals > bestGoalDay.count) {
        bestGoalDay = { date, count: stats.goals };
      }
      if (stats.assists > bestAssistDay.count) {
        bestAssistDay = { date, count: stats.assists };
      }
    }

    return { bestGoalDay, bestAssistDay };
  };

  const records = getRecords();
  if (!records) return null;

  return (
    <div className="bds-container">
      {/* Recorde de Gols */}
      <div className="bds-card">
        <span className="bds-label">Recorde Gols</span>
        <div className="bds-value">{records.bestGoalDay.count}</div>
        <span className="bds-footer">{records.bestGoalDay.date}</span>
      </div>

      {/* Recorde de Assistências */}
      <div className="bds-card">
        <span className="bds-label">Recorde Assis.</span>
        <div className="bds-value">{records.bestAssistDay.count}</div>
        <span className="bds-footer">{records.bestAssistDay.date}</span>
      </div>
    </div>
  );
}
