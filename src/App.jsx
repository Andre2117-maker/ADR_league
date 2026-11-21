import { useState, useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { db } from "./firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

import useCollection from "./hooks/useCollection";
import { getBestPartner, calculateStandings } from "./utils/statsLogic";
import { applyTheme, getSavedTheme } from "./utils/theme";
import "./utils/segredos.js";
import "./styles/index.css";

import Home from "./pages/Home/Home.jsx";
import AdminLogin from "./pages/Login/AdminLogin.jsx";
import AdminPanel from "./pages/AdminPanel/AdminPanel.jsx";
import AdminMatches from "./pages/AdminMatches/AdminMatches.jsx";
import Regras from "./pages/Rules/Regras.jsx";
import Calendar from "./pages/Calendar/Calendar.jsx";
import Navbar from "./pages/NavBar/NavBar.jsx";
import PlayerPage from "./pages/Playerpage/PlayerPage.jsx";
import MatchPage from "./pages/MatchPage/MatchPage.jsx";
import AdminTransparency from "./pages/Home/AdminTransparency/AdminTransparency.jsx";
import HallHistorico from "./pages/Home/HallHistorico/HallHistorico.jsx";
import Legends from "./pages/Home/Legends/Legends.jsx";
import SecretQuiz from "./components/Easter Egg/SecretQuiz.jsx";
import Altar from "./components/Easter Egg/Altar.jsx";
import Statics from "./pages/Statics/Statics.jsx";
import AboutPage from "./pages/AboutUs/AboutPage.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import DreamTeam from "./pages/DreamTeam.jsx";
import Campeonato from "./pages/Campeonato/Campeonato.jsx";
import Titulos from "./pages/Titulos/Titulos.jsx";
import LocalTreinos from "./pages/LocalTreinos/LocalTreinos.jsx";
import Elenco from "./pages/Elenco/Elenco.jsx";
import Configuracao from "./pages/Configuracao/Configuracao.jsx";
import Retrospectiva from "./pages/Retrospectiva/Retrospectiva.jsx";
import Temporadas from "./pages/Temporadas/Temporadas.jsx";

// Aplica o tema salvo antes da primeira tela (sem piscar o tema errado)
applyTheme(getSavedTheme());

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState(null);

  const players = useCollection("players", "name");
  const matches = useCollection("matches", "order");

  /* contas pesadas: só refazem quando jogadores ou partidas mudam */
  const playersWithStats = useMemo(
    () => calculateStandings(players, matches),
    [players, matches],
  );

  const playersWithTrainingStats = useMemo(() => {
    const treinos = matches.filter(
      (m) => m.type === "TREINO" || m.category === "TREINO",
    );
    return calculateStandings(players, treinos);
  }, [players, matches]);

  const playersSortedByTrainingPoints = useMemo(
    () =>
      [...playersWithTrainingStats].sort(
        (a, b) =>
          b.points - a.points ||
          b.goals - a.goals ||
          b.assists - a.assists ||
          a.name.localeCompare(b.name, "pt-BR"),
      ),
    [playersWithTrainingStats],
  );

  const bestPartner = (id) => getBestPartner(id, matches, players);

  const getPlayerStats = (playerId) =>
    playersWithTrainingStats.find((p) => String(p.id) === String(playerId)) ||
    {};

  const handleUpdatePlayer = async (playerId, updatedData) => {
    try {
      const { id: _id, ...dataToSave } = updatedData;
      await updateDoc(doc(db, "players", playerId), dataToSave);
      alert("Atleta atualizado com sucesso!");
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

  /* a mesma tela atende /admin e /admin-matches */
  const adminMatches = (
    <AdminMatches
      players={players}
      isAdmin={isAdmin}
      matchToEdit={matchToEdit}
      setMatchToEdit={setMatchToEdit}
      matches={matches}
    />
  );

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar isAdmin={isAdmin} logout={() => setIsAdmin(false)} />

      <div className="main-wrapper">
        <Routes>
          {/* ---------- principais ---------- */}
          <Route
            path="/"
            element={
              <Home
                players={playersWithStats}
                matches={matches}
                isAdmin={isAdmin}
                getBestPartner={bestPartner}
              />
            }
          />
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
          <Route
            path="/match/:id"
            element={
              <MatchPage
                matches={matches}
                players={players}
                isAdmin={isAdmin}
                setMatchToEdit={setMatchToEdit}
              />
            }
          />
          <Route
            path="/player/:id"
            element={
              <PlayerPage
                playersWithStats={playersWithStats}
                playersWithTrainingStats={playersWithTrainingStats}
                matches={matches}
                sortedPlayers={playersSortedByTrainingPoints}
                isAdmin={isAdmin}
                getBestPartner={bestPartner}
                onUpdatePlayer={handleUpdatePlayer}
                getPlayerStats={getPlayerStats}
              />
            }
          />
          <Route
            path="/estatisticas"
            element={<Statics players={players} matches={matches} />}
          />
          <Route
            path="/campeonato"
            element={
              <Campeonato
                matches={matches}
                players={players}
                isAdmin={isAdmin}
              />
            }
          />
          <Route
            path="/temporadas"
            element={
              <Temporadas
                players={players}
                matches={matches}
                isAdmin={isAdmin}
              />
            }
          />
          <Route
            path="/retrospectiva"
            element={
              <Retrospectiva
                isAdmin={isAdmin}
                players={players}
                matches={matches}
              />
            }
          />
          <Route
            path="/retrospectiva/:id"
            element={<Retrospectiva players={players} matches={matches} />}
          />
          <Route
            path="/dream-team"
            element={<DreamTeam players={players} matches={matches} />}
          />
          <Route path="/elenco" element={<Elenco />} />
          <Route path="/titulos" element={<Titulos />} />

          {/* ---------- arquivo do clube ---------- */}
          <Route
            path="/Legends"
            element={<Legends playersWithStats={playersWithStats} />}
          />
          <Route
            path="/hall-historico"
            element={<HallHistorico isAdmin={isAdmin} />}
          />
          <Route
            path="/transparency"
            element={<AdminTransparency isAdmin={isAdmin} />}
          />

          {/* ---------- páginas de informação ---------- */}
          <Route
            path="/about"
            element={<AboutPage isAdmin={isAdmin} players={players} />}
          />
          <Route path="/regras" element={<Regras isAdmin={isAdmin} />} />
          <Route path="/local" element={<LocalTreinos isAdmin={isAdmin} />} />
          <Route path="/configuracoes" element={<Configuracao />} />

          {/* ---------- admin ---------- */}
          <Route
            path="/admin-login"
            element={<AdminLogin setIsAdmin={setIsAdmin} />}
          />
          <Route
            path="/admin-panel"
            element={<AdminPanel players={players} matches={matches} />}
          />
          <Route path="/admin" element={adminMatches} />
          <Route path="/admin-matches" element={adminMatches} />

          {/* ---------- easter eggs ---------- */}
          <Route path="/quiz-secret" element={<SecretQuiz />} />
          <Route path="/altar-adr" element={<Altar />} />

          {/* 404: por último, pega todo o resto */}
          <Route
            path="*"
            element={<div className="loading">Página não encontrada</div>}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
