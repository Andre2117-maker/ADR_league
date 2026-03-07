import React, { useState, useMemo } from "react";
import html2canvas from "html2canvas";
import "../styles/home.css";
import "../style.css";
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
import AddBanner from "../components/AddBanner";

/* ======================
   HOME PRINCIPAL
====================== */
function Home({ players, matches, onSelectPlayer }) {
  const [hoveredPlayer, setHoveredPlayer] = useState(null);

  // Ordenação das partidas por data (Firebase Timestamp)
  const sortedMatchesByDate = useMemo(() => {
    if (!matches) return [];
    return [...matches].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeA - timeB;
    });
  }, [matches]);

  // --- Lógica de Estatísticas e Forma (Últimas 5) ---
  const getPlayerStats = (playerId) => {
    if (!sortedMatchesByDate || sortedMatchesByDate.length === 0)
      return { form: [], winRate: 0 };

    // 1. Filtra TODAS as partidas do jogador
    const playerMatches = sortedMatchesByDate.filter(
      (m) =>
        m.teamA.players.some((id) => String(id) === String(playerId)) ||
        m.teamB.players.some((id) => String(id) === String(playerId)),
    );

    if (playerMatches.length === 0) return { form: [], winRate: 0 };

    // 2. Calcula a "Forma" (últimas 5 partidas)
    const form = playerMatches.slice(-5).map((m) => {
      const isTeamA = m.teamA.players.some(
        (id) => String(id) === String(playerId),
      );
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
      const winnerField = m.penaltiesWinner || m.winner;

      if (winnerField) {
        const playerTeam = isTeamA ? "A" : "B";
        return String(winnerField).toUpperCase() === playerTeam ? "W" : "L";
      }
      if (gA === gB) return "D";
      const won = (gA > gB && isTeamA) || (gB > gA && !isTeamA);
      return won ? "W" : "L";
    });

    // 3. Calcula o WinRate REAL (Todas as vitórias / Total de partidas)
    const totalWins = playerMatches.filter((m) => {
      const isTeamA = m.teamA.players.some(
        (id) => String(id) === String(playerId),
      );

      // Conta gols reais de cada lado
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

      let winner = null;

      // Define o vencedor: Prioriza pênaltis, se não houver, compara gols
      if (m.penaltiesWinner) {
        winner = m.penaltiesWinner;
      } else if (goalsA > goalsB) {
        winner = "A";
      } else if (goalsB > goalsA) {
        winner = "B";
      }

      const playerTeam = isTeamA ? "A" : "B";
      return winner === playerTeam;
    }).length;

    // Cálculo da porcentagem (evitando divisão por zero)
    const winRate =
      playerMatches.length > 0
        ? Math.round((totalWins / playerMatches.length) * 100)
        : 0;

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
      <MatchesCarousel matches={matches} players={players} />
      <div className="home-layout">
        <aside className="side-cards">
          <button className="export-btn" onClick={exportTabela}>
            📸 Exportar Tabela
          </button>
          <TopScorersCard players={sortedByGoals} />
          <TopAssistsCard players={sortedByAssists} />
          <TopGoalkeepersCard players={players} matches={matches} />
        </aside>

        <main className="main-content-area">
          <div className="ranking-section">
            <RankingTable
              sortedPlayers={sorted}
              getPlayerStats={getPlayerStats}
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
              stats={hoveredPlayer ? getPlayerStats(hoveredPlayer.id) : null}
              bestPartner={
                hoveredPlayer ? getBestPartner(hoveredPlayer.id) : "Nenhum"
              }
            />
          </aside>
        )}
      </div>

      <SquadCarousel players={players} onSelectPlayer={onSelectPlayer} />

      <footer className="sponsors-footer">
        <div className="sponsors-container">
          <div className="sponsor-master">
            <div className="logo-wrapper">
              <img src={master} alt="Patrocinador Master" />
            </div>
          </div>
          <hr className="sponsor-divider" />
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
