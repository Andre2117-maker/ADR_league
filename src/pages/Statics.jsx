import React, { useMemo, useCallback } from "react";
import "../styles/Statics/statics.css";

// Componentes
import TopAssistsCard from "../components/TopAssistsCard";
import TopGoalkeepersCard from "../components/TopGoalkeepersCard";
import TopScorersCard from "../components/TopScorersCard";
import Footer from "../components/Footer";

export default function Statics({ players = [], matches = [] }) {
  // 1. Ordenação das partidas (Igual à Home)
  const sortedMatchesByDate = useMemo(() => {
    if (!matches) return [];
    return [...matches].sort(
      (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0),
    );
  }, [matches]);

  // 2. Função de cálculo (Copiada da sua Home para garantir paridade)
  const getPlayerStats = useCallback(
    (playerId) => {
      const defaultReturn = { goals: 0, assists: 0, points: 0, games: 0 };
      if (!sortedMatchesByDate.length) return defaultReturn;

      const playerMatches = sortedMatchesByDate.filter(
        (m) =>
          m.teamA?.players?.some((id) => String(id) === String(playerId)) ||
          m.teamB?.players?.some((id) => String(id) === String(playerId)),
      );

      let totalGoals = 0;
      let totalAssists = 0;
      let totalWins = 0;
      let totalDraws = 0;

      playerMatches.forEach((m) => {
        const isTeamA = m.teamA?.players?.some(
          (id) => String(id) === String(playerId),
        );
        const playerTeam = isTeamA ? "A" : "B";
        const pIdStr = String(playerId);

        m.events?.forEach((e) => {
          if (e.type === "GOAL" && String(e.playerId) === pIdStr) totalGoals++;
          if (
            (e.type === "ASSIST" && String(e.playerId) === pIdStr) ||
            (e.type === "GOAL" && String(e.assistId) === pIdStr)
          ) {
            totalAssists++;
          }
        });

        // Lógica de pontos (Vitória/Empate)
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
        let result = "";
        if (winner)
          result = String(winner).toUpperCase() === playerTeam ? "W" : "L";
        else if (goalsA === goalsB) result = "D";
        else
          result =
            (goalsA > goalsB && isTeamA) || (goalsB > goalsA && !isTeamA)
              ? "W"
              : "L";

        if (result === "W") totalWins++;
        else if (result === "D") totalDraws++;
      });

      return {
        goals: totalGoals,
        assists: totalAssists,
        points: totalWins * 3 + totalDraws * 1,
        games: playerMatches.length,
      };
    },
    [sortedMatchesByDate],
  );

  // 3. Processamento Final (AQUI É ONDE OS DADOS FICAM CORRETOS)
  const playersWithFullStats = useMemo(() => {
    return players.map((p) => {
      const stats = getPlayerStats(p.id);
      const manual26 = p.statsBySeason?.["2026"] || {};

      return {
        ...p,
        points: stats.points,
        // Importante: Soma os gols calculados + os manuais do banco
        goals: stats.goals + Number(manual26.goals || 0),
        assists: stats.assists + Number(manual26.assists || 0),
        games: stats.games + Number(manual26.matches || manual26.games || 0),
      };
    });
  }, [players, getPlayerStats]);

  // 4. Listas Ordenadas para os Cards
  const sortedByGoals = useMemo(
    () =>
      [...playersWithFullStats].sort(
        (a, b) => b.goals - a.goals || b.points - a.points,
      ),
    [playersWithFullStats],
  );

  const sortedByAssists = useMemo(
    () =>
      [...playersWithFullStats].sort(
        (a, b) => b.assists - a.assists || b.points - a.points,
      ),
    [playersWithFullStats],
  );

  if (!players.length)
    return <div className="statics-container">Carregando...</div>;

  return (
    <div className="statics-container">
      <h1 className="page-title">Estatísticas da Temporada</h1>

      <div className="statics-grid">
        {/* Agora passamos as listas JÁ ORDENADAS e com os gols somados */}
        <TopScorersCard players={sortedByGoals} limit={10} />
        <TopAssistsCard players={sortedByAssists} limit={10} />
        <TopGoalkeepersCard players={players} matches={matches} limit={10} />
      </div>

      <Footer />
    </div>
  );
}
