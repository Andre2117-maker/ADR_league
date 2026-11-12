import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import "../styles/Home/home.css";

// Componentes
import MatchesCarousel from "../components/MatchesCarousel";
import SquadCarousel from "../components/SquadCarousel";
import RankingTable from "../components/RankingTable";
import PlayerScoutPanel from "../components/ScoutPanel/PlayerScoutPanel";
import TopGoalkeepersCard from "../components/TopGoalkeepers/TopGoalkeepersCard";
import TopScorersCard from "../components/TopScorers/TopScorersCard";
import TopAssistsCard from "../components/TopAssists/TopAssistsCard";
import AwardsCard from "../components/Awards/AwardsCard";
import BirthdaySchedule from "../components/BirthdaySchedule";
import HistoryCarousel from "../components/HistoryCarousel";
import Footer from "../components/Footer";
import BirthdayAlert from "../components/BirthdayAlert";
import MatchAlert from "../components/matchalert/MatchAlert";
import ClubExplore from "./ClubExplore/ClubExplore";
import HeadToHead from "../components/HeadToHead/HeadToHead";

/* ==========================================================================
   EXPORTAÇÃO: o html2canvas só entende cores em rgb/rgba/hex.
   Cores modernas (color(), oklab(), oklch(), lab(), lch() — inclusive as que
   o navegador gera a partir de color-mix) quebram o print. Esta função
   converte tudo para rgba na CÓPIA usada pelo html2canvas.
   ========================================================================== */
const MODERN_COLOR_RE =
  /\b(?:color|oklab|oklch|lab|lch)\((?:[^()]|\([^()]*\))*\)/g;

const COLOR_PROPS = [
  "color",
  "background-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "column-rule-color",
  "caret-color",
  "fill",
  "stroke",
  "box-shadow",
  "text-shadow",
  "background-image",
];

const sanitizeColorsForCanvas = (doc, root) => {
  const canvas = doc.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const cache = new Map();

  // Pinta 1 pixel com a cor e lê de volta em RGBA
  const toRgba = (value) => {
    if (cache.has(value)) return cache.get(value);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const out = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    cache.set(value, out);
    return out;
  };

  const view = doc.defaultView || window;
  [root, ...root.querySelectorAll("*")].forEach((el) => {
    const cs = view.getComputedStyle(el);
    COLOR_PROPS.forEach((prop) => {
      const value = cs.getPropertyValue(prop);
      if (!value || !MODERN_COLOR_RE.test(value)) return;
      MODERN_COLOR_RE.lastIndex = 0;
      el.style.setProperty(
        prop,
        value.replace(MODERN_COLOR_RE, toRgba),
        "important",
      );
    });
    MODERN_COLOR_RE.lastIndex = 0;
  });
};

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

      const params = new URLSearchParams(window.location.search);
      const limite = Number(params.get("limit")) || 9999;

      // --- CORREÇÃO AQUI: INCLUIR TREINOS E EVENTOS OFICIAIS ---
      // Agora o sistema aceita TREINOS e também EVENTOS que estejam marcados como oficiais (isOfficial !== false)
      const validMatches = sortedMatchesByDate
        .filter((m) => {
          const type = String(m.type || "TREINO").toUpperCase();
          const isTreino = type === "TREINO";
          const isOfficialEvent = type === "EVENTO" && m.isOfficial !== false;
          return isTreino || isOfficialEvent;
        })
        .slice(-limite);

      // Filtra apenas onde o jogador participou DENTRO DAS PARTIDAS VÁLIDAS
      const playerMatches = validMatches.filter(
        (m) =>
          m.teamA?.players?.some((id) => String(id) === String(playerId)) ||
          m.teamB?.players?.some((id) => String(id) === String(playerId)) ||
          m.actualParticipantsA?.some(
            (id) => String(id) === String(playerId),
          ) ||
          m.actualParticipantsB?.some((id) => String(id) === String(playerId)),
      );

      if (playerMatches.length === 0) return defaultReturn;

      let totalGoals = 0;
      let totalAssists = 0;
      let totalWins = 0;
      let totalLosses = 0;
      let totalDraws = 0;

      playerMatches.forEach((m) => {
        const isTeamA =
          m.teamA?.players?.some((id) => String(id) === String(playerId)) ||
          m.actualParticipantsA?.some((id) => String(id) === String(playerId));
        const playerTeam = isTeamA ? "A" : "B";
        const pIdStr = String(playerId);

        // Gols e Assistências
        m.events?.forEach((e) => {
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

        // Placar
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

      // Cálculo da Forma (últimos 5 jogos válidos)
      const form = playerMatches.slice(-5).map((m) => {
        const isTeamA =
          m.teamA?.players?.some((id) => String(id) === String(playerId)) ||
          m.actualParticipantsA?.some((id) => String(id) === String(playerId));
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
      const stats = getPlayerStats(p.id);
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
  }, [players, getPlayerStats]);

  const sorted = [...playersWith2026Stats].sort(
    (a, b) =>
      b.points - a.points ||
      b.goals - a.goals ||
      b.assists - a.assists ||
      a.name.localeCompare(b.name, "pt-BR"),
  );

  const sortedByGoals = [...playersWith2026Stats].sort(
    (a, b) => b.goals - a.goals,
  );

  const sortedByAssists = [...playersWith2026Stats].sort(
    (a, b) => b.assists - a.assists,
  );

  const exportTabela = async () => {
    const element = document.getElementById("tabela-content");
    if (!element) return;

    const isIdr = Boolean(document.querySelector(".theme-idr"));

    // Espera as fontes carregarem para o print não sair com fonte errada
    if (document.fonts?.ready) await document.fonts.ready;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: isIdr ? "#ffffff" : "#050505",
        scale: 2,
        useCORS: true,
        // O html2canvas não entende texto com degradê (background-clip: text)
        // nem animações: na cópia usada para o print, liga o "modo exportação"
        onclone: (clonedDoc) => {
          const root = clonedDoc.getElementById("tabela-content");
          if (!root) return;
          root.classList.add("is-exporting");
          sanitizeColorsForCanvas(clonedDoc, root);
        },
      });

      const link = document.createElement("a");
      link.download = isIdr ? "tabela-idr.png" : "tabela-adr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Erro ao exportar tabela:", err);
      alert("Não foi possível exportar a tabela. Tente de novo.");
    }
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

      <MatchAlert matches={amistososAgendados} isAdmin={isAdmin} />

      <BirthdaySchedule players={players} />

      <BirthdayAlert players={players} />

      <div className="home-layout">
        <aside className="side-cards">
          <button className="export-btn" onClick={exportTabela}>
            Exportar tabela
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
              isAdmin={isAdmin}
              matches={matches}
            />
          </div>
          <div className="awards-section">
            <AwardsCard isAdmin={isAdmin} />
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

      {/* CONFRONTO DIRETO ALEATÓRIO */}
      <HeadToHead players={players} matches={matches} />

      {/* ARQUIVO DO CLUBE: Hall Histórico · Transparência · Legends */}
      <ClubExplore />

      <SquadCarousel players={players} onSelectPlayer={handlePlayerClick} />

      <Footer />
    </div>
  );
}

export default Home;
