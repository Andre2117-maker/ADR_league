export const calculateLiveRanking = (players, matches) => {
  if (!players || !matches) return [];

  // Considera apenas treinos
  const onlyTrainings = matches.filter((m) => m.type === "TREINO");

  const calculatedPlayers = players.map((p) => {
    const playerMatches = onlyTrainings.filter(
      (m) =>
        m.teamA?.players?.some((id) => String(id) === String(p.id)) ||
        m.teamB?.players?.some((id) => String(id) === String(p.id)),
    );

    let totalWins = 0;
    let totalDraws = 0;
    let totalGoals = 0;
    let totalAssists = 0;

    playerMatches.forEach((m) => {
      const isTeamA = m.teamA?.players?.some(
        (id) => String(id) === String(p.id),
      );
      const playerTeam = isTeamA ? "A" : "B";
      const pIdStr = String(p.id);

      // Gols e assistências do jogador
      m.events?.forEach((e) => {
        if (e.type === "GOAL" && String(e.playerId) === pIdStr) totalGoals++;
        if (
          (e.type === "ASSIST" && String(e.playerId) === pIdStr) ||
          (e.type === "GOAL" && String(e.assistId) === pIdStr)
        ) {
          totalAssists++;
        }
      });

      // Placar da equipe
      const goalsA =
        m.events?.filter(
          (e) =>
            (e.type === "GOAL" && e.team === "A") ||
            (e.type === "OWN_GOAL" && e.team === "B"),
        ).length || 0;
      const goalsB =
        m.events?.filter(
          (e) =>
            (e.type === "GOAL" && e.team === "B") ||
            (e.type === "OWN_GOAL" && e.team === "A"),
        ).length || 0;

      // Análise de Vencedor (Cobre Gol de Ouro e Pênaltis)
      const winner = m.penaltiesWinner || m.winner;
      let result = "";

      if (winner) {
        result = String(winner).toUpperCase() === playerTeam ? "W" : "L";
      } else {
        if (goalsA === goalsB) result = "D";
        else if ((goalsA > goalsB && isTeamA) || (goalsB > goalsA && !isTeamA))
          result = "W";
        else result = "L";
      }

      if (result === "W") totalWins++;
      else if (result === "D") totalDraws++;
    });

    // Pega os stats manuais caso existam
    const manual26 = p.statsBySeason?.["2026"] || {};
    const livePoints = totalWins * 3 + totalDraws * 1;

    return {
      ...p,
      points: livePoints,
      goals: totalGoals + Number(manual26.goals || 0),
      assists: totalAssists + Number(manual26.assists || 0),
    };
  });

  // Ordena usando as exatas mesmas regras da tabela principal
  return calculatedPlayers.sort(
    (a, b) =>
      b.points - a.points ||
      b.goals - a.goals ||
      b.assists - a.assists ||
      a.name.localeCompare(b.name, "pt-BR"),
  );
};
