export function usePlayerStats(matches, players) {
  const getBestPartner = (playerId) => {
    if (!matches || matches.length === 0) return "Nenhum";
    const scores = {};
    matches.forEach((m) => {
      const isTeamA = m.teamA.players.includes(playerId);
      const isTeamB = m.teamB.players.includes(playerId);
      if (!isTeamA && !isTeamB) return;

      const myTeam = isTeamA ? m.teamA.players : m.teamB.players;

      m.events.forEach((e) => {
        if (e.type === "GOAL") {
          if (e.playerId === playerId && e.assistId && e.assistId !== "none") {
            scores[e.assistId] = (scores[e.assistId] || 0) + 3;
          }
          if (e.assistId === playerId && e.playerId) {
            scores[e.playerId] = (scores[e.playerId] || 0) + 2;
          }
        }
      });

      const goalsA = m.events.filter(
        (e) =>
          (e.type === "GOAL" && e.team === "A") ||
          (e.type === "OWN_GOAL" && e.team === "B"),
      ).length;
      const goalsB = m.events.filter(
        (e) =>
          (e.type === "GOAL" && e.team === "B") ||
          (e.type === "OWN_GOAL" && e.team === "A"),
      ).length;
      const won =
        (isTeamA && goalsA > goalsB) ||
        (isTeamB && goalsB > goalsA) ||
        m.penaltiesWinner === (isTeamA ? "A" : "B");

      if (won) {
        myTeam.forEach((pId) => {
          if (pId !== playerId) scores[pId] = (scores[pId] || 0) + 1;
        });
      }
    });

    let bestId = null;
    let maxScore = 0;
    for (const [id, total] of Object.entries(scores)) {
      if (total > maxScore) {
        maxScore = total;
        bestId = id;
      }
    }
    const partner = players.find((p) => String(p.id) === String(bestId));
    return partner ? partner.name : "Nenhum";
  };

  const getSinglePlayerStats = (playerId) => {
    if (!matches) return { form: [], winRate: 0 };
    const playerMatches = matches.filter(
      (m) =>
        m.teamA.players.includes(playerId) ||
        m.teamB.players.includes(playerId),
    );
    const wins = playerMatches.filter((m) => {
      const isTeamA = m.teamA.players.includes(playerId);
      const gA = m.events.filter(
        (e) =>
          (e.type === "GOAL" && e.team === "A") ||
          (e.type === "OWN_GOAL" && e.team === "B"),
      ).length;
      const gB = m.events.filter(
        (e) =>
          (e.type === "GOAL" && e.team === "B") ||
          (e.type === "OWN_GOAL" && e.team === "A"),
      ).length;
      return (
        (gA > gB && isTeamA) ||
        (gB > gA && !isTeamA) ||
        m.penaltiesWinner === (isTeamA ? "A" : "B")
      );
    }).length;

    const winRate =
      playerMatches.length > 0
        ? ((wins / playerMatches.length) * 100).toFixed(0)
        : 0;
    const form = playerMatches.slice(-5).map((m) => {
      const isTeamA = m.teamA.players.includes(playerId);
      const gA = m.events.filter(
        (e) =>
          (e.type === "GOAL" && e.team === "A") ||
          (e.type === "OWN_GOAL" && e.team === "B"),
      ).length;
      const gB = m.events.filter(
        (e) =>
          (e.type === "GOAL" && e.team === "B") ||
          (e.type === "OWN_GOAL" && e.team === "A"),
      ).length;
      if (gA === gB && !m.penaltiesWinner) return "D";
      return (gA > gB && isTeamA) ||
        (gB > gA && !isTeamA) ||
        m.penaltiesWinner === (isTeamA ? "A" : "B")
        ? "W"
        : "L";
    });
    return { form, winRate };
  };

  return { getBestPartner, getSinglePlayerStats };
}
