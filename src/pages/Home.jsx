import React, { useState, useMemo } from "react";
import html2canvas from "html2canvas";
import "../styles/home.css";
import "../style.css";

// Componentes
import MatchesCarousel from "../components/MatchesCarousel";
import SquadCarousel from "../components/SquadCarousel";
import RankingTable from "../components/RankingTable";
import PlayerScoutPanel from "../components/PlayerScoutPanel";
import TopGoalkeepersCard from "../components/TopGoalkeepersCard";
import TopScorersCard from "../components/TopScorersCard";
import TopAssistsCard from "../components/TopAssistsCard";
import AwardsCard from "../components/AwardsCard";
import BirthdaySchedule from "../components/BirthdaySchedule";
import HistoryCarousel from "../components/HistoryCarousel";
import Footer from "../components/Footer";

function Home({ players, matches, onSelectPlayer, setPage, getBestPartner }) {
  const [hoveredPlayer, setHoveredPlayer] = useState(null);

  // --- Lógica de Ordenação e Stats ---
  const sortedMatchesByDate = useMemo(() => {
    if (!matches) return [];
    return [...matches].sort(
      (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0),
    );
  }, [matches]);

  const getPlayerStats = (playerId) => {
    if (!sortedMatchesByDate || sortedMatchesByDate.length === 0)
      return { form: [], winRate: 0 };

    const playerMatches = sortedMatchesByDate.filter(
      (m) =>
        m.teamA.players.some((id) => String(id) === String(playerId)) ||
        m.teamB.players.some((id) => String(id) === String(playerId)),
    );

    if (playerMatches.length === 0) return { form: [], winRate: 0 };

    // CALCULA A FORMA (BOLINHAS)
    const form = playerMatches.slice(-5).map((m) => {
      const isTeamA = m.teamA.players.some(
        (id) => String(id) === String(playerId),
      );
      const playerTeam = isTeamA ? "A" : "B";

      // 1. Prioridade: Vencedor definido (Penaltis ou Campo Winner)
      const winnerField = m.penaltiesWinner || m.winner;

      if (winnerField) {
        // O .toUpperCase() é o segredo aqui para não falhar se for minúsculo
        return String(winnerField).toUpperCase() === playerTeam ? "W" : "L";
      }

      // 2. Fallback: Se não houver campo winner, calcula pelo placar de eventos
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

      if (goalsA === goalsB) return "D";
      const won = (goalsA > goalsB && isTeamA) || (goalsB > goalsA && !isTeamA);
      return won ? "W" : "L";
    });

    // CALCULA O WINRATE
    const wins = playerMatches.filter((m) => {
      const isTeamA = m.teamA.players.some(
        (id) => String(id) === String(playerId),
      );
      const playerTeam = isTeamA ? "A" : "B";
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

      const winner =
        m.penaltiesWinner ||
        (goalsA > goalsB ? "A" : goalsB > goalsA ? "B" : null);
      return winner && String(winner).toUpperCase() === playerTeam;
    }).length;

    return { form, winRate: Math.round((wins / playerMatches.length) * 100) };
  };

  const sorted = [...players].sort(
    (a, b) =>
      b.points - a.points || b.goals - a.goals || a.name.localeCompare(b.name),
  );
  const sortedByGoals = [...players].sort((a, b) => b.goals - a.goals);

  const exportTabela = () => {
    const element = document.getElementById("tabela-content");
    html2canvas(element, { backgroundColor: "#101010", scale: 2 }).then(
      (canvas) => {
        const link = document.createElement("a");
        link.download = "tabela-adr.png";
        link.href = canvas.toDataURL();
        link.click();
      },
    );
  };

  const getTotalAssists = (playerId) => {
    return matches?.reduce(
      (acc, m) =>
        acc +
        (m.events?.filter(
          (e) =>
            (e.type === "ASSIST" && String(e.playerId) === String(playerId)) ||
            (e.type === "GOAL" && String(e.assistId) === String(playerId)),
        ).length || 0),
      0,
    );
  };

  return (
    <div className="main-wrapper">
      <BirthdaySchedule players={players} />

      {/* NAVEGAÇÃO ENTRE PÁGINAS */}
      <div className="transparency-nav-container">
        <button
          className="btn-transparency-nav"
          onClick={() => setPage("HallHistorico")}
        >
          🏛️ MEMORIAL DOS JOGADORES
        </button>
        <button
          className="btn-transparency-nav"
          onClick={() => setPage("AdminTransparency")}
        >
          💰 TRANSPARÊNCIA
        </button>
      </div>

      <MatchesCarousel matches={matches} players={players} />

      <div className="home-layout">
        <aside className="side-cards">
          <button className="export-btn" onClick={exportTabela}>
            📸 Exportar Tabela
          </button>
          <TopScorersCard players={sortedByGoals} />
          <TopAssistsCard players={players} matches={matches} />
          <TopGoalkeepersCard players={players} matches={matches} />
        </aside>

        <main className="main-content-area">
          <div className="ranking-section" id="tabela-content">
            <RankingTable
              sortedPlayers={sorted}
              getPlayerStats={getPlayerStats}
              getTotalAssists={getTotalAssists}
              onSelectPlayer={onSelectPlayer}
              setHoveredPlayer={
                window.innerWidth > 1024 ? setHoveredPlayer : () => {}
              }
            />
          </div>
          <div className="awards-section">
            <AwardsCard />
          </div>
        </main>

        {window.innerWidth > 1024 && (
          <aside className="details-panel">
            <PlayerScoutPanel
              player={hoveredPlayer}
              matches={matches}
              stats={hoveredPlayer ? getPlayerStats(hoveredPlayer.id) : null}
              bestPartner={
                hoveredPlayer ? getBestPartner(hoveredPlayer.id) : "Nenhum"
              }
            />
          </aside>
        )}
      </div>

      <SquadCarousel players={players} onSelectPlayer={onSelectPlayer} />

      <HistoryCarousel />

      <Footer />
    </div>
  );
}

export default Home;
