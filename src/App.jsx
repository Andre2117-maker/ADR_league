import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Firebase
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc, // Adicione este
  updateDoc, // Adicione este
  deleteDoc,
} from "firebase/firestore";

// Componentes e Páginas
import Home from "./pages/Home.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import AdminMatches from "./pages/AdminMatches.jsx";
import Regras from "./pages/Regras.jsx";
import Calendar from "./pages/Calendar.jsx";
import Navbar from "./pages/NavBar.jsx";
import PlayerPage from "./pages/PlayerPage.jsx";
import MatchPage from "./pages/MatchPage.jsx";

// Estilos
import "./styles/global.css";
import "./styles/navbar.css";
import "./styles/home.css";
import "./styles/matches.css";
import "./styles/admin.css";
import "./styles/playerpage.css";

// --- FUNÇÕES AUXILIARES (Lógica de Negócio) ---

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

  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);

  // 1. Efeito para carregar Jogadores em tempo real
  useEffect(() => {
    const q = query(collection(db, "players"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPlayers(data);
    });
    return () => unsubscribe();
  }, []);

  // 2. Efeito para carregar Partidas em tempo real
  useEffect(() => {
    const q = query(collection(db, "matches"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMatches(data);
    });
    return () => unsubscribe();
  }, []);

  const playersWithStats = calculateStandings(players, matches);

  const logout = () => {
    setIsAdmin(false);
    setPage("home");
  };

  const handleOpenPlayerProfile = (player) => {
    setSelectedPlayer(player);
    setPage("playerProfile");
  };

  const handleUpdatePlayer = async (playerId, updatedData) => {
    try {
      // 1. Cria a referência do documento usando o ID
      const playerRef = doc(db, "players", playerId);

      // 2. Remove o ID de dentro dos dados para não salvar o ID dentro do documento
      const { id: _id, ...dataToSave } = updatedData;

      // 3. Atualiza no Firebase
      await updateDoc(playerRef, dataToSave);

      alert("Atleta atualizado com sucesso! 🏅");
    } catch (error) {
      console.error("Erro ao atualizar jogador:", error);
      alert("Erro ao salvar: Verifique se você tem permissão de Admin.");
    }
  };

  const handleDeleteMatch = async (matchId) => {
    try {
      const matchRef = doc(db, "matches", matchId);
      await deleteDoc(matchRef);
      alert("Partida eliminada com sucesso! Os pontos serão recalculados.");
    } catch (error) {
      console.error("Erro ao deletar partida:", error);
      alert("Erro ao excluir a partida do banco de dados.");
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/match/:id"
          element={
            <MatchPage matches={matches} players={players} isAdmin={isAdmin} />
          }
        />

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
                    onSelectPlayer={handleOpenPlayerProfile}
                  />
                )}

                {page === "playerProfile" && selectedPlayer && (
                  <PlayerPage
                    player={
                      playersWithStats.find(
                        (p) => p.id === selectedPlayer.id,
                      ) || selectedPlayer
                    }
                    matches={matches}
                    isAdmin={isAdmin}
                    getBestPartner={(id) =>
                      getBestPartner(id, matches, players)
                    }
                    onBack={() => setPage("home")}
                    onUpdatePlayer={handleUpdatePlayer}
                  />
                )}

                {page === "Calendar" && (
                  <Calendar
                    matches={matches}
                    players={players}
                    isAdmin={isAdmin}
                    setPage={setPage}
                    setMatchToEdit={setMatchToEdit}
                    onDeleteMatch={handleDeleteMatch}
                  />
                )}

                {page === "regras" && <Regras isAdmin={isAdmin} />}

                {page === "adminLogin" && (
                  <AdminLogin setIsAdmin={setIsAdmin} setPage={setPage} />
                )}

                {page === "adminPanel" && (
                  <AdminPanel
                    players={players}
                    setPage={setPage}
                    matches={matches}
                  />
                )}

                {page === "adminMatches" && (
                  <AdminMatches
                    players={players}
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
