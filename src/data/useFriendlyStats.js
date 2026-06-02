import { useMemo } from "react";

export function useFriendlyStats(matches) {
  return useMemo(() => {
    if (!matches || !matches.length) {
      return {
        games: 0,
        goalsMade: 0,
        goalsConceded: 0,
        balance: 0,
        bestCampaign: "Nenhum amistoso registrado",
      };
    }

    const friendlyMatches = matches.filter((m) => m.type === "AMISTOSO");

    let totalGoalsMade = 0;
    let totalGoalsConceded = 0;
    let bestGoalDifference = -Infinity;
    let bestMatchInfo = "Nenhum amistoso registrado";

    friendlyMatches.forEach((m) => {
      const isAdrTeamA = m.teamA?.name?.toUpperCase() === "ADR";

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

      const adrGoals = isAdrTeamA ? goalsA : goalsB;
      const enemyGoals = isAdrTeamA ? goalsB : goalsA;
      const enemyName = isAdrTeamA
        ? m.teamB?.name || "Adversário"
        : m.teamA?.name || "Adversário";

      totalGoalsMade += adrGoals;
      totalGoalsConceded += enemyGoals;

      const matchDiff = adrGoals - enemyGoals;
      if (matchDiff > bestGoalDifference) {
        bestGoalDifference = matchDiff;
        bestMatchInfo = `ADR ${adrGoals} x ${enemyGoals} ${enemyName}`;
      }
    });

    return {
      games: friendlyMatches.length,
      goalsMade: totalGoalsMade,
      goalsConceded: totalGoalsConceded,
      balance: totalGoalsMade - totalGoalsConceded,
      bestCampaign:
        friendlyMatches.length > 0
          ? bestMatchInfo
          : "Nenhum amistoso registrado",
    };
  }, [matches]);
}
