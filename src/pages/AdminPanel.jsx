import "../styles/panel.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  writeBatch,
} from "firebase/firestore";
import dadosIniciais from "../dados_iniciais.json";
import PlayerButtons from "../components/adminpanel/PlayerButtons/PlayerButtons";

/* ==========================================================
   PAINEL PRINCIPAL
   ========================================================== */
function AdminPanel({ players, matches }) {
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState("Male"); // Estado para o Gênero
  const navigate = useNavigate();

  const sortedPlayers = [...players].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );

  // --- FUNÇÕES FIREBASE ---
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await addDoc(collection(db, "players"), {
        name: newName.trim(),
        gender: newGender, // <--- Salva o Gênero no Firebase
        manualGoals: 0,
        manualAssists: 0,
        titlesADR: 0,
        photo: "",
        clubRole: "",
        number: "",
        isAllStar: false,
        isAnonymous: false,
        strongFoot: "Destro",
        currentRank: 0,
        previousRank: 0,
        skills: {
          velocidade: 50,
          corpo: 50,
          chute: 50,
          mira: 50,
          passe: 50,
          defesa: 50,
        },
      });
      setNewName("");
      setNewGender("Male"); // Reseta para o padrão após adicionar
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateManual = async (id, field, value) => {
    try {
      const playerRef = doc(db, "players", id);
      await updateDoc(playerRef, { [field]: increment(value) });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (id, field, value) => {
    try {
      const playerRef = doc(db, "players", id);
      await updateDoc(playerRef, { [field]: value });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Excluir ${name}?`)) {
      try {
        await deleteDoc(doc(db, "players", id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMigrateJSON = async () => {
    if (
      !window.confirm("Deseja importar todos os dados do JSON para o Firebase?")
    )
      return;
    const batch = writeBatch(db);
    dadosIniciais.players.forEach((player) => {
      const playerRef = doc(db, "players", String(player.id));
      batch.set(playerRef, { ...player });
    });
    dadosIniciais.matches.forEach((match) => {
      const matchRef = doc(db, "matches", String(match.id));
      batch.set(matchRef, { ...match });
    });
    try {
      await batch.commit();
      alert("Dados migrados com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro na migração.");
    }
  };

  const getTotalStats = (player) => {
    let stats = {
      goals: player.manualGoals || 0,
      assists: player.manualAssists || 0,
      games: 0,
    };
    matches.forEach((m) => {
      if (
        m.teamA.players.includes(player.id) ||
        m.teamB.players.includes(player.id)
      ) {
        stats.games++;
        m.events.forEach((e) => {
          if (e.playerId === player.id) {
            if (e.type === "GOAL") stats.goals++;
            if (e.type === "ASSIST") stats.assists++;
          }
        });
      }
    });
    return stats;
  };

  const migrateOldMatches = async () => {
    if (
      !window.confirm(
        "Isso vai atribuir ordem numérica a todas as partidas. Confirmar?",
      )
    )
      return;
    const batch = writeBatch(db);
    const sorted = [...matches].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    sorted.forEach((match, index) => {
      const matchRef = doc(db, "matches", match.id);
      batch.update(matchRef, { order: index });
    });
    try {
      await batch.commit();
      alert("Migração concluída com sucesso!");
    } catch (err) {
      console.error("Erro na migração:", err);
      alert("Erro ao salvar no banco.");
    }
  };

  return (
    <div className="adm-main-layout">
      <header className="adm-header-nav">
        <div className="adm-nav-left">
          <button onClick={() => navigate("/")} className="adm-btn-exit">
            ← Sair
          </button>
          <button onClick={handleMigrateJSON} className="adm-btn-backup">
            🚀 Migrar JSON
          </button>
          <button
            onClick={() => alert("Função desativada.")}
            className="adm-btn-import"
          >
            📥 Abrir
          </button>
          <button
            onClick={() => navigate("/admin-matches")}
            className="adm-btn-matches"
          >
            ⚽ Partidas
          </button>
          <button
            onClick={migrateOldMatches}
            className="adm-btn-backup"
            style={{ background: "red" }}
          >
            🔧 Fix Order
          </button>
        </div>
        <h1 className="adm-title-main">
          PAINEL <span className="adm-title-highlight">ADMIN</span>
        </h1>
      </header>

      <section className="adm-add-section">
        <form onSubmit={handleAddPlayer} className="adm-add-form">
          <input
            type="text"
            className="adm-input-new-player"
            placeholder="Novo jogador..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          {/* NOVO SELECT DE GÊNERO */}
          <select
            className="adm-select-gender"
            value={newGender}
            onChange={(e) => setNewGender(e.target.value)}
            style={{
              background: "#111",
              border: "1px solid #222",
              color: "#fff",
              padding: "0 20px",
              borderRadius: "12px",
              outline: "none",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <button type="submit" className="adm-btn-add-confirm">
            Adicionar +
          </button>
        </form>
      </section>

      <div className="adm-table-container">
        <div className="adm-table">
          <div className="adm-thead-fake-pc">
            <span>JOGADOR</span>
            <span>ESTATÍSTICAS</span>
            <span>GOLS</span>
            <span>ASSIST</span>
            <span>PERFIL</span>
            <span>AÇÕES</span>
          </div>

          <div className="adm-tbody">
            {sortedPlayers.map((p) => (
              <PlayerButtons
                key={p.id}
                p={p}
                total={getTotalStats(p)}
                onUpdateManual={handleUpdateManual}
                onUpdateProfile={handleUpdateProfile}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
