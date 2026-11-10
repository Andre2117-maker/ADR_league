import {
  SEASON_STAT_TYPES,
  matchType,
  isOfficialMatch,
  playerSide,
  countMatchGoals,
} from "../utils/matchStats";

export const calculateLiveRanking = (players, matches) => {
  if (!players || !matches) return [];

  // Treino + Evento, só partidas oficiais (mesma regra da aba Estatísticas)
  const rankedMatches = matches.filter(
    (m) => SEASON_STAT_TYPES.includes(matchType(m)) && isOfficialMatch(m),
  );

  const calculatedPlayers = players.map((p) => {
    const pIdStr = String(p.id);

    // Titulares + quem entrou como substituto
    const playerMatches = rankedMatches.filter((m) => playerSide(m, pIdStr));

    let totalWins = 0;
    let totalDraws = 0;
    let totalGoals = 0;
    let totalAssists = 0;

    playerMatches.forEach((m) => {
      const playerTeam = playerSide(m, pIdStr);
      const isTeamA = playerTeam === "A";

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
      const { a: goalsA, b: goalsB } = countMatchGoals(m);

      // Análise de Vencedor (Cobre Gol de Ouro e Pênaltis)
      const winner = m.penaltiesWinner || m.winner;
      let result = "";

      if (winner) {
        result = String(winner).toUpperCase() === playerTeam ? "W" : "L";
      } else if (goalsA === goalsB) {
        result = "D";
      } else if (
        (goalsA > goalsB && isTeamA) ||
        (goalsB > goalsA && !isTeamA)
      ) {
        result = "W";
      } else {
        result = "L";
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
      (a.name || "").localeCompare(b.name || "", "pt-BR"),
  );
};
