import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import html2canvas from "html2canvas";
import "../styles/Home/home.css";
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
import BirthdayAlert from "../components/BirthdayAlert";
import MatchBanner from "../components/matchbanner/MatchBanner";

function Home({ players, matches, getBestPartner, isAdmin }) {
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const navigate = useNavigate();

  // --- Lógica de Ordenação e Stats ---
  const sortedMatchesByDate = useMemo(() => {
    if (!matches) return [];
    return [...matches].sort(
      (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0),
    );
  }, [matches]);

  const handlePlayerClick = (player) => {
    navigate(`/player/${player.id}`);
  };

  const getPlayerStats = useCallback(
    (playerId) => {
      const defaultReturn = {
        form: [],
        winRate: 0,
        goals: 0,
        assists: 0,
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
      };

      if (!sortedMatchesByDate || sortedMatchesByDate.length === 0)
        return defaultReturn;

      // --- CORREÇÃO AQUI: FILTRAR APENAS TREINOS ---
      // A Tabela Geral e os cards laterais devem ignorar AMISTOSOS
      const onlyTrainings = sortedMatchesByDate.filter(
        (m) => m.type === "TREINO",
      );

      // Agora filtramos apenas onde o jogador participou DENTRO DOS TREINOS
      const playerMatches = onlyTrainings.filter(
        (m) =>
          m.teamA?.players?.some((id) => String(id) === String(playerId)) ||
          m.teamB?.players?.some((id) => String(id) === String(playerId)),
      );

      if (playerMatches.length === 0) return defaultReturn;

      let totalGoals = 0;
      let totalAssists = 0;
      let totalWins = 0;
      let totalLosses = 0;
      let totalDraws = 0;

      playerMatches.forEach((m) => {
        const isTeamA = m.teamA?.players?.some(
          (id) => String(id) === String(playerId),
        );
        const playerTeam = isTeamA ? "A" : "B";
        const pIdStr = String(playerId);

        // Gols e Assistências
        m.events?.forEach((e) => {
          // Garante que não conta gols de "OPONENTE_EXTERNO" para seus jogadores
          if (e.type === "GOAL" && String(e.playerId) === pIdStr) {
            totalGoals++;
          }

          const ehEventoAssist =
            e.type === "ASSIST" && String(e.playerId) === pIdStr;
          const ehCampoNoGol =
            e.type === "GOAL" && String(e.assistId) === pIdStr;

          if (ehEventoAssist || ehCampoNoGol) {
            totalAssists++;
          }
        });

        // Placar (Calculado dinamicamente para cada partida do loop)
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

        if (winner) {
          result = String(winner).toUpperCase() === playerTeam ? "W" : "L";
        } else {
          if (goalsA === goalsB) result = "D";
          else if (
            (goalsA > goalsB && isTeamA) ||
            (goalsB > goalsA && !isTeamA)
          )
            result = "W";
          else result = "L";
        }

        if (result === "W") totalWins++;
        else if (result === "D") totalDraws++;
        else if (result === "L") totalLosses++;
      });

      // Cálculo da Forma (últimos 5 jogos de TREINO)
      const form = playerMatches.slice(-5).map((m) => {
        const isTeamA = m.teamA?.players?.some(
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
        const winner = m.penaltiesWinner || m.winner;

        if (winner)
          return String(winner).toUpperCase() === playerTeam ? "W" : "L";
        if (goalsA === goalsB) return "D";
        return (goalsA > goalsB && isTeamA) || (goalsB > goalsA && !isTeamA)
          ? "W"
          : "L";
      });

      return {
        form,
        winRate: Math.round((totalWins / playerMatches.length) * 100) || 0,
        goals: totalGoals,
        assists: totalAssists,
        games: playerMatches.length,
        wins: totalWins,
        losses: totalLosses,
        draws: totalDraws,
        points: totalWins * 3 + totalDraws * 1,
      };
    },
    [sortedMatchesByDate],
  );

  const playersWith2026Stats = useMemo(() => {
    return players.map((p) => {
      const stats = getPlayerStats(p.id); // <-- Você usa a função aqui
      const manual26 = p.statsBySeason?.["2026"] || {};

      return {
        ...p,
        points: stats.points,
        goals: stats.goals + Number(manual26.goals || 0),
        assists: stats.assists + Number(manual26.assists || 0),
        games: stats.games + Number(manual26.matches || manual26.games || 0),
        wins: stats.wins,
        losses: stats.losses,
        form: stats.form,
      };
    });
    // AQUI ESTÁ A CORREÇÃO: Adicione getPlayerStats no array abaixo
  }, [players, getPlayerStats]);

  // Agora as listas ordenadas usam os dados de 2026:
  const sorted = [...playersWith2026Stats].sort(
    (a, b) =>
      b.points - a.points || b.goals - a.goals || a.name.localeCompare(b.name),
  );

  const sortedByGoals = [...playersWith2026Stats].sort(
    (a, b) => b.goals - a.goals,
  );

  const sortedByAssists = [...playersWith2026Stats].sort(
    (a, b) => b.assists - a.assists,
  );

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

  const amistososAgendados = [
    {
      title: "AMISTOSO",
      teamA: { name: "Amigos do Renzo", logo: "/logo.png" },
      teamB: {
        name: "RATOS DE CAMPO",
        logo: "/times rivais/RATOSDECAMPO.png",
      },
      date: "20/04",
      time: "19:00",
      location: "Quinta das Laranjeiras",
    },
  ];

  return (
    <div className="main-wrapper">
      <MatchesCarousel matches={matches} players={players} />

      <MatchBanner matches={amistososAgendados} isAdmin={isAdmin} />

      <BirthdaySchedule players={players} />

      <BirthdayAlert players={players} />

      {/* NAVEGAÇÃO ENTRE PÁGINAS */}
      <div className="transparency-nav-container">
        <Link to="/hall-historico" className="btn-transparency-nav">
          🗿 MEMORIAL DOS JOGADORES
        </Link>
        <Link to="/transparency" className="btn-transparency-nav">
          💰 TRANSPARÊNCIA
        </Link>
        <Link to="/Legends" className="btn-transparency-nav">
          👑 Legends
        </Link>
      </div>

      <div className="home-layout">
        <aside className="side-cards">
          <button className="export-btn" onClick={exportTabela}>
            📸 Exportar Tabela
          </button>
          <TopScorersCard players={sortedByGoals} limit={3} />
          <TopAssistsCard players={sortedByAssists} limit={3} />
          <TopGoalkeepersCard players={players} matches={matches} limit={5} />
        </aside>

        <main className="main-content-area">
          <div className="ranking-section" id="tabela-content">
            <RankingTable
              sortedPlayers={sorted}
              getPlayerStats={getPlayerStats}
              getTotalAssists={getTotalAssists}
              onSelectPlayer={handlePlayerClick}
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

      <SquadCarousel players={players} onSelectPlayer={handlePlayerClick} />

      <Footer />
    </div>
  );
}

export default Home;
