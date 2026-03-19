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
  writeBatch,
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
import AdminTransparency from "./pages/AdminTransparency.jsx";
import HallHistorico from "./components/HallHistorico.jsx";

// Estilos
import "./styles/global.css";
import "./styles/navbar.css";
import "./styles/home.css";
import "./styles/matches.css";
import "./styles/admin.css";
import "./styles/playerpage.css";

// --- FUNÇÕES AUXILIARES (Lógica de Negócio) ---

const getBestPartner = (playerId, matches, players) => {
  if (!matches || matches.length === 0) return "Nenhum";

  const scores = {};

  matches.forEach((m) => {
    // 1. Identifica se o jogador participou e em qual time
    const isTeamA = m.teamA.players.some(
      (id) => String(id) === String(playerId),
    );
    const isTeamB = m.teamB.players.some(
      (id) => String(id) === String(playerId),
    );

    if (!isTeamA && !isTeamB) return;

    const myTeam = isTeamA ? m.teamA.players : m.teamB.players;
    const myTeamLetter = isTeamA ? "A" : "B";
    const winner = m.penaltiesWinner || m.winner;

    // --- PESO 1: PARCERIA DE CAMPO (2 pontos por cada jogo juntos) ---
    myTeam.forEach((pId) => {
      if (String(pId) !== String(playerId)) {
        scores[pId] = (scores[pId] || 0) + 2;

        // --- PESO 2: VITÓRIA CONJUNTA (+5 pontos extras) ---
        if (winner && String(winner).toUpperCase() === myTeamLetter) {
          scores[pId] += 5;
        }
      }
    });

    // --- PESO 3: CONEXÃO DIRETA DE GOLS (+10 pontos extras) ---
    m.events?.forEach((e) => {
      if (e.type === "GOAL") {
        // Se eu fiz o gol com assistência do parceiro
        if (
          String(e.playerId) === String(playerId) &&
          e.assistId &&
          e.assistId !== "none"
        ) {
          scores[e.assistId] = (scores[e.assistId] || 0) + 10;
        }
        // Se o parceiro fez o gol com a minha assistência
        if (String(e.assistId) === String(playerId) && e.playerId) {
          scores[e.playerId] = (scores[e.playerId] || 0) + 10;
        }
      }
    });
  });

  // Encontra o ID com maior pontuação acumulada
  const bestId = Object.keys(scores).reduce(
    (a, b) => (scores[a] > scores[b] ? a : b),
    null,
  );

  if (!bestId) return "Nenhum";

  const partner = players.find((p) => String(p.id) === String(bestId));
  return partner ? partner.name : "Nenhum";
};

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
    const q = query(collection(db, "matches"), orderBy("order", "asc"));
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

  const handleUpdateMatchOrder = async (newMatches) => {
    // 1. Criamos um batch
    const batch = writeBatch(db);

    // 2. Iteramos e adicionamos cada update
    newMatches.forEach((match, index) => {
      const matchRef = doc(db, "matches", match.id);
      batch.update(matchRef, { order: index });
    });

    try {
      // 3. Executamos
      await batch.commit();
      console.log("Ordem sincronizada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar ordem no Firebase:", error);
      alert("Erro ao salvar a nova ordem. Verifique o console.");
    }
  };

  const playersSortedByPoints = [...playersWithStats].sort(
    (a, b) => b.points - a.points,
  );

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
                    setPage={setPage}
                    isAdmin={isAdmin}
                    getBestPartner={(id) =>
                      getBestPartner(id, matches, players)
                    }
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
                    sortedPlayers={playersSortedByPoints}
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
                    onUpdateMatchOrder={handleUpdateMatchOrder}
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

                {page === "AdminTransparency" && (
                  <AdminTransparency isAdmin={isAdmin} />
                )}

                {page === "HallHistorico" && (
                  <HallHistorico isAdmin={isAdmin} setPage={setPage} />
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
