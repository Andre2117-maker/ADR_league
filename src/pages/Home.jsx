import React, { useState } from "react";
import html2canvas from "html2canvas";
import "../styles/home.css";
import master from "../assets/master.png";
import patro1 from "../assets/patro1.png";
import patro2 from "../assets/patro2.png";

// Importação de Componentes
import MatchesCarousel from "../components/MatchesCarousel";
import SquadCarousel from "../components/SquadCarousel";
import RankingTable from "../components/RankingTable";
import PlayerScoutPanel from "../components/PlayerScoutPanel";
import TopGoalkeepersCard from "../components/TopGoalkeepersCard";
import TopScorersCard from "../components/TopScorersCard";
import TopAssistsCard from "../components/TopAssistsCard";
import AwardsCard from "../components/AwardsCard";

/* ======================
   HOME PRINCIPAL
====================== */
function Home({ players, matches, onSelectPlayer }) {
  const [hoveredPlayer, setHoveredPlayer] = useState(null);

  // --- Lógica de Estatísticas (Mantida aqui por enquanto, ou pode mover para um Hook) ---
  const getPlayerStats = (playerId) => {
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

  // Ordenações
  const sorted = [...players].sort(
    (a, b) =>
      b.points - a.points ||
      b.goals - a.goals ||
      b.assists - a.assists ||
      a.name.localeCompare(b.name),
  );
  const sortedByGoals = [...players].sort((a, b) => b.goals - a.goals);
  const sortedByAssists = [...players].sort((a, b) => b.assists - a.assists);

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

  return (
    <div className="main-wrapper">
      {/* 1. Carrossel de Partidas (Ponta a Ponta) */}
      <MatchesCarousel matches={matches} players={players} />
      <div className="home-layout">
        {/* 2. Lado Esquerdo: Rankings Rápidos */}
        <aside className="side-cards">
          <button className="export-btn" onClick={exportTabela}>
            📸 Exportar Tabela
          </button>
          <TopScorersCard players={sortedByGoals} />
          <TopAssistsCard players={sortedByAssists} />

          <TopGoalkeepersCard players={players} matches={matches} />
        </aside>

        <main className="main-content-area">
          <RankingTable
            sortedPlayers={sorted}
            getPlayerStats={getPlayerStats}
            onSelectPlayer={onSelectPlayer}
            setHoveredPlayer={
              window.innerWidth > 1024 ? setHoveredPlayer : () => {}
            }
          />
          <AwardsCard />
        </main>
        {/* 4. Lado Direito: Scout Detalhado (Componentizado) */}
        {window.innerWidth > 1024 && (
          <aside className="details-panel">
            <PlayerScoutPanel
              player={hoveredPlayer}
              stats={hoveredPlayer ? getPlayerStats(hoveredPlayer.id) : null}
              bestPartner={
                hoveredPlayer ? getBestPartner(hoveredPlayer.id) : "Nenhum"
              }
            />
          </aside>
        )}
      </div>

      {/* 5. Rodapé: Carrossel do Elenco */}
      <SquadCarousel players={players} onSelectPlayer={onSelectPlayer} />

      <footer className="sponsors-footer">
        <div className="sponsors-container">
          {/* Patrocinador Master */}
          <div className="sponsor-master">
            <div className="logo-wrapper">
              <img src={master} alt="Patrocinador Master" />
            </div>
          </div>

          <hr className="sponsor-divider" />

          {/* Patrocinadores Secundários (Os outros 3) */}
          <div className="sponsors-secondary">
            <img src={patro1} alt="Patrocinador" />
            <img src={patro2} alt="Patrocinador" />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
