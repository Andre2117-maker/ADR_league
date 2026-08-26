import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { getBestPartner, calculateStandings } from "./utils/statsLogic";

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
import HallHistorico from "./pages/HallHistorico.jsx";
import SecretQuiz from "./components/Easter Egg/SecretQuiz.jsx";
import Altar from "./components/Easter Egg/Altar.jsx";
import Statics from "./pages/Statics.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Legends from "./pages/Legends.jsx";
import DreamTeam from "./pages/DreamTeam.jsx";
import Campeonato from "./pages/Campeonato.jsx";

// Estilos
import "./styles/global.css";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);

  // Carregar Jogadores e Partidas (Mantenha os seus useEffects do Firebase aqui)
  useEffect(() => {
    const q = query(collection(db, "players"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPlayers(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "matches"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMatches(data);
    });
    return () => unsubscribe();
  }, []);

  // --- USANDO AS FUNÇÕES IMPORTADAS ---
  const playersWithStats = calculateStandings(players, matches);

  const trainingMatches = matches.filter(
    (m) => m.type === "TREINO" || m.category === "TREINO",
  );
  const playersWithTrainingStats = calculateStandings(players, trainingMatches);

  const playersSortedByTrainingPoints = [...playersWithTrainingStats].sort(
    (a, b) =>
      b.points - a.points ||
      b.goals - a.goals ||
      b.assists - a.assists ||
      a.name.localeCompare(b.name, "pt-BR"),
  );

  // --- HANDLERS (AÇÕES) ---
  const handleUpdatePlayer = async (playerId, updatedData) => {
    try {
      const playerRef = doc(db, "players", playerId);
      const { id: _id, ...dataToSave } = updatedData;
      await updateDoc(playerRef, dataToSave);
      alert("Atleta atualizado com sucesso! 🏅");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    }
  };

  const handleDeleteMatch = async (matchId) => {
    try {
      await deleteDoc(doc(db, "matches", matchId));
      alert("Partida eliminada!");
    } catch (error) {
      console.error(error);
    }
  };

  const logout = () => setIsAdmin(false);

  return (
    <BrowserRouter>
      <ScrollToTop />

      <Navbar isAdmin={isAdmin} logout={logout} />

      <div className="main-wrapper">
        <Routes>
          {/* ROTA HOME (Ranking) */}

          <Route
            path="/"
            element={
              <Home
                players={playersWithStats}
                matches={matches}
                isAdmin={isAdmin}
                getBestPartner={(id) => getBestPartner(id, matches, players)}
              />
            }
          />

          {/* ROTA CALENDÁRIO (Agora com path próprio) */}

          <Route
            path="/calendar"
            element={
              <Calendar
                isAdmin={isAdmin}
                matches={matches}
                players={players}
                setMatchToEdit={setMatchToEdit}
                onDeleteMatch={handleDeleteMatch}
              />
            }
          />

          {/* ROTA ADMIN (Onde a edição acontece) */}

          <Route
            path="/admin"
            element={
              <AdminMatches
                players={players}
                isAdmin={isAdmin}
                matchToEdit={matchToEdit}
                setMatchToEdit={setMatchToEdit}
                matches={matches}
              />
            }
          />

          {/* ROTA DAS ESTATISTICAS*/}

          <Route
            path="/estatisticas"
            element={<Statics players={players} matches={matches} />}
          />

          {/* Rota "Sobre Nós" */}

          <Route path="/about" element={<AboutPage />} />

          {/* ROTA DO EASTER EGG*/}

          <Route path="/quiz-secret" element={<SecretQuiz />} />

          <Route path="/altar-adr" element={<Altar />} />

          {/* Rota de Erro 404 */}

          <Route
            path="*"
            element={<div className="loading">Página não encontrada</div>}
          />

          {/* ROTA PERFIL DO JOGADOR */}

          <Route
            path="/player/:id"
            element={
              <PlayerPage
                playersWithStats={playersWithStats}
                playersWithTrainingStats={playersWithTrainingStats}
                matches={matches}
                sortedPlayers={playersSortedByTrainingPoints}
                isAdmin={isAdmin}
                getBestPartner={(id) => getBestPartner(id, matches, players)}
                onUpdatePlayer={handleUpdatePlayer}
                getPlayerStats={(playerId) => {
                  const found = playersWithTrainingStats.find(
                    (p) => String(p.id) === String(playerId),
                  );

                  return found || {};
                }}
              />
            }
          />

          {/* Restante das rotas... */}

          <Route path="/regras" element={<Regras isAdmin={isAdmin} />} />

          <Route
            path="/admin-login"
            element={<AdminLogin setIsAdmin={setIsAdmin} />}
          />

          <Route
            path="/admin-panel"
            element={<AdminPanel players={players} matches={matches} />}
          />

          <Route
            path="/admin-matches"
            element={
              <AdminMatches
                players={players}
                isAdmin={isAdmin}
                matches={matches}
              />
            }
          />

          <Route
            path="/transparency"
            element={<AdminTransparency isAdmin={isAdmin} />}
          />

          <Route
            path="/Legends"
            element={<Legends playersWithStats={playersWithStats} />}
          />

          <Route
            path="/hall-historico"
            element={<HallHistorico isAdmin={isAdmin} />}
          />

          <Route
            path="/dream-team"
            element={<DreamTeam players={players} matches={matches} />}
          />

          <Route
            path="/campeonato"
            element={<Campeonato matches="{matches}" players="{players}" />}
          />

          <Route
            path="/match/:id"
            element={
              <MatchPage
                matches={matches}
                players={players}
                isAdmin={isAdmin}
              />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
