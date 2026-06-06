import { useMemo } from "react";

export function useDreamTeamMath(matches = []) {
  // Filtra apenas treinos para basear as estatísticas reais
  const validMatches = useMemo(() => {
    return matches.filter((m) => m.type === "TREINO");
  }, [matches]);

  // Função que calcula a química/parceirismo entre DOIS jogadores
  const getChemistryBetween = (playerAId, playerBId) => {
    if (!playerAId || !playerBId) return { color: "gray", pct: 0, games: 0 };

    let gamesTogether = 0;
    let pointsEarned = 0;

    validMatches.forEach((m) => {
      // Verifica se ambos jogaram juntos no Time A
      const bothInA =
        m.teamA?.players?.some((id) => String(id) === String(playerAId)) &&
        m.teamA?.players?.some((id) => String(id) === String(playerBId));

      // Verifica se ambos jogaram juntos no Time B
      const bothInB =
        m.teamB?.players?.some((id) => String(id) === String(playerAId)) &&
        m.teamB?.players?.some((id) => String(id) === String(playerBId));

      if (bothInA || bothInB) {
        gamesTogether++;

        // Identifica o lado deles na partida
        const side = bothInA ? "A" : "B";

        // Calcula os gols finais computando gols contra
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

        const winner = m.penaltiesWinner || m.winner;
        let result = "L";

        if (winner) {
          result = String(winner).toUpperCase() === side ? "W" : "L";
        } else if (goalsA === goalsB) {
          result = "D";
        } else {
          result =
            (goalsA > goalsB && side === "A") ||
            (goalsB > goalsA && side === "B")
              ? "W"
              : "L";
        }

        if (result === "W") pointsEarned += 3;
        if (result === "D") pointsEarned += 1;
      }
    });

    if (gamesTogether === 0) return { color: "gray", pct: 0, games: 0 };

    // Aproveitamento máximo possível de pontos se tivessem vencido todas juntos
    const maxPossiblePoints = gamesTogether * 3;
    const aproveitamento = (pointsEarned / maxPossiblePoints) * 100;

    // REGRAS DO FIFA ULTIMATE TEAM DA ADR:
    // Menos de 2 jogos juntos = Cinza (Falta de entrosamento)
    if (gamesTogether < 2)
      return { color: "gray", pct: aproveitamento, games: gamesTogether };
    // Aproveitamento excelente (>= 65%) = Verde
    if (aproveitamento >= 65)
      return { color: "green", pct: aproveitamento, games: gamesTogether };
    // Aproveitamento mediano (>= 40% e < 65%) = Amarelo
    if (aproveitamento >= 40)
      return { color: "yellow", pct: aproveitamento, games: gamesTogether };
    // Aproveitamento ruim (< 40%) = Vermelho
    return { color: "red", pct: aproveitamento, games: gamesTogether };
  };

  return { getChemistryBetween };
}
