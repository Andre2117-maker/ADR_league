// utils/matchUtils.js

export const calculateMatchStats = (match, players) => {
  const stats = {
    teamA: { goals: 0, assists: 0, ownGoals: 0, points: 0 },
    teamB: { goals: 0, assists: 0, ownGoals: 0, points: 0 },
    playerPoints: {}, // { playerId: score }
  };

  match.events?.forEach((event) => {
    const pId = String(event.playerId);
    if (!stats.playerPoints[pId]) stats.playerPoints[pId] = 0;

    if (event.type === "GOAL") {
      stats[`team${event.team}`].goals++;
      stats.playerPoints[pId] += 3; // 3 pontos por gol

      // Se houver assistência
      if (event.assistId) {
        const aId = String(event.assistId);
        if (!stats.playerPoints[aId]) stats.playerPoints[aId] = 0;
        stats.playerPoints[aId] += 2; // 2 pontos por assistência
        stats[`team${event.team}`].assists++;
      }
    }

    if (event.type === "OWN_GOAL") {
      stats[`team${event.team}`].ownGoals++;
      stats.playerPoints[pId] -= 1; // Perde ponto por gol contra
    }
  });

  // Encontrar o MVP
  let mvpId = null;
  let maxPoints = -1;

  Object.entries(stats.playerPoints).forEach(([id, pts]) => {
    if (pts > maxPoints) {
      maxPoints = pts;
      mvpId = id;
    }
  });

  const mvp = players.find((p) => String(p.id) === String(mvpId));

  return { stats, mvp, maxPoints };
};
