import { useState, useEffect } from "react";
// IMPORTANTE: Importar o Router
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import AdminMatches from "./pages/AdminMatches.jsx";
import Regras from "./pages/Regras.jsx";
import Calendar from "./pages/Calendar.jsx";
import Navbar from "./pages/NavBar.jsx";
import PlayerPage from "./pages/PlayerPage.jsx";
import MatchPage from "./pages/MatchPage.jsx"; // <--- IMPORTANTE: Importar a nova página
import "./styles/global.css";
import "./styles/navbar.css";
import "./styles/home.css";
import "./styles/matches.css";
import "./styles/admin.css";
import "./styles/playerpage.css";
import dadosIniciais from "./dados_iniciais.json";

// --- FUNÇÕES AUXILIARES (Mantive as suas iguais) ---
function getBestPartner(playerId, matches, players) {
  if (!matches || matches.length === 0) return "Nenhum";
  const partnersCount = {};

  matches.forEach((m) => {
    const isTeamA = m.teamA.players.includes(playerId);
    const isTeamB = m.teamB.players.includes(playerId);
    if (!isTeamA && !isTeamB) return;

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
      const team = isTeamA ? m.teamA.players : m.teamB.players;
      team.forEach((pId) => {
        if (pId !== playerId)
          partnersCount[pId] = (partnersCount[pId] || 0) + 1;
      });
    }
  });

  let bestId = null;
  let maxWins = 0;
  for (const [id, count] of Object.entries(partnersCount)) {
    if (count > maxWins) {
      maxWins = count;
      bestId = id;
    }
  }
  const partner = players.find((p) => String(p.id) === String(bestId));
  return partner ? partner.name : "Nenhum";
}

function calculateStandings(players, matches) {
  return players.map((player) => {
    let stats = {
      ...player,
      points: 0,
      goals: player.manualGoals || 0,
      assists: player.manualAssists || 0,
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    };

    matches.forEach((m) => {
      const isTeamA = m.teamA.players.includes(player.id);
      const isTeamB = m.teamB.players.includes(player.id);
      if (!isTeamA && !isTeamB) return;

      stats.games++;
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

      m.events.forEach((e) => {
        if (e.playerId === player.id) {
          if (e.type === "GOAL") stats.goals++;
          if (e.type === "ASSIST") stats.assists++;
        }
      });

      if (goalsA === goalsB) {
        if (m.penaltiesWinner) {
          const won = m.penaltiesWinner === (isTeamA ? "A" : "B");
          won ? ((stats.points += 3), stats.wins++) : stats.losses++;
        } else {
          stats.points += 1;
          stats.draws++;
        }
      } else {
        const won = isTeamA ? goalsA > goalsB : goalsB > goalsA;
        won ? ((stats.points += 3), stats.wins++) : stats.losses++;
      }
    });
    return stats;
  });
}

// --- APP PRINCIPAL ---

function App() {
  const [page, setPage] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem("players");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Erro ao ler cache de players", e);
      }
    }
    return dadosIniciais.players || [];
  });

  const [matches, setMatches] = useState(() => {
    const saved = localStorage.getItem("matches");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Erro ao ler cache de matches", e);
      }
    }
    return dadosIniciais.matches || [];
  });

  useEffect(() => {
    if (players.length > 0) {
      localStorage.setItem("players", JSON.stringify(players));
    }
  }, [players]);

  useEffect(() => {
    if (matches.length > 0) {
      localStorage.setItem("matches", JSON.stringify(matches));
    }
  }, [matches]);

  const playersWithStats = calculateStandings(players, matches);

  const logout = () => {
    setIsAdmin(false);
    setPage("home");
  };

  const handleOpenPlayerProfile = (player) => {
    setSelectedPlayer(player);
    setPage("playerProfile");
  };

  const handleUpdateMatch = (updatedMatch) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)),
    );
  };

  // --- RENDERIZAÇÃO FINAL COM ROTAS ---
  return (
    <BrowserRouter>
      <Routes>
        {/* ROTA 1: Página Ousada da Partida */}
        <Route
          path="/match/:id"
          element={
            <MatchPage
              matches={matches}
              players={players}
              isAdmin={isAdmin}
              onUpdateMatch={handleUpdateMatch}
            />
          }
        />

        {/* ROTA 2: Todo o resto do site (Renderizado diretamente no element) */}
        <Route
          path="/*"
          element={
            <>
              <Navbar setPage={setPage} isAdmin={isAdmin} logout={logout} />

              <div className="main-wrapper">
                {page === "home" && (
                  <Home
                    players={playersWithStats}
                    matches={matches}
                    setMatches={setMatches}
                    onSelectPlayer={handleOpenPlayerProfile}
                  />
                )}

                {page === "playerProfile" && selectedPlayer && (
                  <PlayerPage
                    player={selectedPlayer}
                    matches={matches}
                    isAdmin={isAdmin}
                    getBestPartner={(id) =>
                      getBestPartner(id, matches, players)
                    }
                    onBack={() => setPage("home")}
                    onUpdatePlayer={(id, newData) => {
                      setPlayers((prev) =>
                        prev.map((p) =>
                          p.id === id ? { ...p, ...newData } : p,
                        ),
                      );
                      setSelectedPlayer((prev) => ({ ...prev, ...newData }));
                    }}
                  />
                )}

                {page === "Calendar" && (
                  <Calendar
                    matches={matches}
                    players={players}
                    isAdmin={isAdmin}
                    setMatches={setMatches}
                    setPage={setPage}
                    setMatchToEdit={setMatchToEdit}
                  />
                )}

                {page === "regras" && <Regras isAdmin={isAdmin} />}

                {page === "adminLogin" && (
                  <AdminLogin setIsAdmin={setIsAdmin} setPage={setPage} />
                )}

                {page === "adminPanel" && (
                  <AdminPanel
                    players={players}
                    setPlayers={setPlayers}
                    setPage={setPage}
                    isAdmin={isAdmin}
                    matches={matches}
                    setMatches={setMatches}
                  />
                )}

                {page === "adminMatches" && (
                  <AdminMatches
                    players={players}
                    setMatches={setMatches}
                    setPage={setPage}
                    isAdmin={isAdmin}
                    matchToEdit={matchToEdit}
                    setMatchToEdit={setMatchToEdit}
                  />
                )}
              </div>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
