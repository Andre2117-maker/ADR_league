// --- LÓGICA DE MELHOR PARCEIRO ---
export const getBestPartner = (playerId, matches, players) => {
  if (!matches || matches.length === 0) return "Nenhum";

  const scores = {};

  matches.forEach((m) => {
    const isTeamA = m.teamA.players.some(
      (id) => String(id) === String(playerId),
    );
    const isTeamB = m.teamB.players.some(
      (id) => String(id) === String(playerId),
    );

    if (!isTeamA && !isTeamB) return;

    const myTeam = isTeamA ? m.teamA.players : m.teamB.players;
    const myTeamLetter = isTeamA ? "A" : "B";
    const winner = m.penaltiesWinner || m.winner;

    // Pontuação por jogo juntos
    myTeam.forEach((pId) => {
      if (String(pId) !== String(playerId)) {
        scores[pId] = (scores[pId] || 0) + 2;
        if (winner && String(winner).toUpperCase() === myTeamLetter) {
          scores[pId] += 5;
        }
      }
    });

    // Pontuação por gols e assistências
    m.events?.forEach((e) => {
      if (e.type === "GOAL") {
        if (
          String(e.playerId) === String(playerId) &&
          e.assistId &&
          e.assistId !== "none"
        ) {
          scores[e.assistId] = (scores[e.assistId] || 0) + 10;
        }
        if (String(e.assistId) === String(playerId) && e.playerId) {
          scores[e.playerId] = (scores[e.playerId] || 0) + 10;
        }
      }
    });
  });

  const bestId = Object.keys(scores).reduce(
    (a, b) => (scores[a] > scores[b] ? a : b),
    null,
  );
  if (!bestId) return "Nenhum";

  const partner = players.find((p) => String(p.id) === String(bestId));
  return partner ? partner.name : "Nenhum";
};

// --- LÓGICA DE CLASSIFICAÇÃO (TABELA) ---
export const calculateStandings = (players, matches) => {
  return players.map((player) => {
    let stats = {
      ...player,
      points: 0,
      goals: player.manualGoals || 0,
      assists: player.manualAssists || 0,
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    };

    matches.forEach((m) => {
      const isTeamA = m.teamA.players.includes(player.id);
      const isTeamB = m.teamB.players.includes(player.id);
      if (!isTeamA && !isTeamB) return;

      stats.games++;
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

      m.events.forEach((e) => {
        if (e.playerId === player.id) {
          if (e.type === "GOAL") stats.goals++;
          if (e.type === "ASSIST") stats.assists++;
        }
      });

      if (goalsA === goalsB) {
        if (m.penaltiesWinner) {
          const won = m.penaltiesWinner === (isTeamA ? "A" : "B");
          won ? ((stats.points += 3), stats.wins++) : stats.losses++;
        } else {
          stats.points += 1;
          stats.draws++;
        }
      } else {
        const won = isTeamA ? goalsA > goalsB : goalsB > goalsA;
        won ? ((stats.points += 3), stats.wins++) : stats.losses++;
      }
    });
    return stats;
  });
};
