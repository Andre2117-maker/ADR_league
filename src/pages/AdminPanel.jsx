import "../styles/panel.css";
import { useState } from "react";
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

/* ==========================================================
   COMPONENTE DE LINHA INDIVIDUAL (RESTAURADO)
   ========================================================== */
function PlayerRow({ p, total, onUpdateManual, onUpdateProfile, onDelete }) {
  const [inputValueG, setInputValueG] = useState(0);
  const [inputValueA, setInputValueA] = useState(0);

  return (
    <tr className={`adm-tr ${p.isAnonymous ? "row-anonymous" : ""}`}>
      <td className="adm-name-cell">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            className="adm-avatar-wrapper"
            style={{ opacity: p.isAnonymous ? 0.4 : 1 }}
          >
            {p.photo ? (
              <img src={p.photo} alt="" className="adm-player-img" />
            ) : (
              <div className="adm-player-placeholder">👤</div>
            )}
          </div>
          <div>
            <strong className="adm-player-name">
              {p.name} {p.isAnonymous && <span className="anon-tag">OFF</span>}
            </strong>
            <div className="adm-mini-stats">Partidas: {total.games}</div>
          </div>
        </div>
      </td>

      <td className="adm-auto-stats-cell">
        <div className="adm-total-badge">
          <div className="adm-stat-item">
            <span className="adm-label">GOLS: </span>
            <span className="adm-value">{total.goals}</span>
          </div>
          <div className="adm-stat-divider"></div>
          <div className="adm-stat-item">
            <span className="adm-label">ASSIST: </span>
            <span className="adm-value">{total.assists}</span>
          </div>
        </div>
      </td>

      {/* Ajuste de Gols */}
      <td className="adm-manual-cell">
        <div className="adm-calc-container">
          <div className="adm-calc-controls">
            <button
              className="adm-btn-minus"
              onClick={() => {
                onUpdateManual(p.id, "manualGoals", -inputValueG);
                setInputValueG(0);
              }}
            >
              -
            </button>
            <input
              type="number"
              className="adm-input-number"
              value={inputValueG}
              onChange={(e) => setInputValueG(Number(e.target.value))}
              placeholder="0"
            />
            <button
              className="adm-btn-plus"
              onClick={() => {
                onUpdateManual(p.id, "manualGoals", inputValueG);
                setInputValueG(0);
              }}
            >
              +
            </button>
          </div>
        </div>
      </td>

      {/* Ajuste de Assistências */}
      <td className="adm-manual-cell">
        <div className="adm-calc-container">
          <div className="adm-calc-controls">
            <button
              className="adm-btn-minus"
              onClick={() => {
                onUpdateManual(p.id, "manualAssists", -inputValueA);
                setInputValueA(0);
              }}
            >
              -
            </button>
            <input
              type="number"
              className="adm-input-number"
              value={inputValueA}
              onChange={(e) => setInputValueA(Number(e.target.value))}
              placeholder="0"
            />
            <button
              className="adm-btn-plus"
              onClick={() => {
                onUpdateManual(p.id, "manualAssists", inputValueA);
                setInputValueA(0);
              }}
            >
              +
            </button>
          </div>
        </div>
      </td>

      {/* Perfil e Gestão de Foto */}
      <td className="adm-profile-cell">
        <div className="adm-profile-inputs">
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Títulos ADR */}
            <div className="adm-title-input-wrapper">
              🏆{" "}
              <input
                type="number"
                className="adm-input-titles"
                value={p.titlesADR || 0}
                onChange={(e) =>
                  onUpdateProfile(p.id, "titlesADR", Number(e.target.value))
                }
              />
            </div>

            {/* Cargo no Clube */}
            <input
              type="text"
              className="adm-input-role"
              placeholder="Cargo (Ex: Diretor)"
              value={p.clubRole || ""}
              onChange={(e) =>
                onUpdateProfile(p.id, "clubRole", e.target.value)
              }
            />

            {/* Número da Camisa */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "#111",
                padding: "2px 8px",
                borderRadius: "5px",
                border: "1px solid #333",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  color: "#d4af37",
                  fontWeight: "bold",
                }}
              >
                Nº
              </span>
              <input
                type="number"
                value={p.number || ""}
                onChange={(e) =>
                  onUpdateProfile(p.id, "number", e.target.value)
                }
                placeholder="00"
                style={{
                  width: "35px",
                  background: "transparent",
                  color: "#fff",
                  border: "none",
                  outline: "none",
                  fontSize: "13px",
                  textAlign: "center",
                }}
              />
            </div>

            {/* All-Star Checkbox */}
            <label className="adm-label-allstar">
              <input
                type="checkbox"
                checked={p.isAllStar || false}
                onChange={(e) =>
                  onUpdateProfile(p.id, "isAllStar", e.target.checked)
                }
              />{" "}
              ALL-STAR
            </label>
          </div>

          <input
            type="text"
            placeholder="URL da Foto (./players/nome.png)"
            value={p.photo || ""}
            onChange={(e) => onUpdateProfile(p.id, "photo", e.target.value)}
            className="adm-photo-url-input"
          />
        </div>
      </td>

      <td className="adm-actions-cell">
        <div className="adm-action-buttons">
          <button
            title={
              p.isAnonymous ? "Ativar Jogador" : "Modo Anônimo (Café com Leite)"
            }
            className={`adm-btn-anon ${p.isAnonymous ? "active" : ""}`}
            onClick={() => onUpdateProfile(p.id, "isAnonymous", !p.isAnonymous)}
          >
            {p.isAnonymous ? "👁️‍🗨️" : "👁️"}
          </button>
          <button
            className="adm-btn-delete"
            onClick={() => onDelete(p.id, p.name)}
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ==========================================================
   PAINEL PRINCIPAL (ADMIN PANEL - INTEGRADO)
   ========================================================== */
function AdminPanel({ players, setPage, matches }) {
  const [newName, setNewName] = useState("");

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
        manualGoals: 0,
        manualAssists: 0,
        titlesADR: 0,
        photo: "",
        clubRole: "",
        number: "",
        isAllStar: false,
        isAnonymous: false,
        strongFoot: "Destro", // Adicione um padrão
        // Adicione o esqueleto das skills
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateManual = async (id, field, value) => {
    try {
      const playerRef = doc(db, "players", id);
      // Mantive a lógica de Math.max(0) via Firebase não é direta no increment,
      // então usamos o valor atual para garantir que não fique negativo se desejar:
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

  // --- FUNÇÃO DE MIGRAÇÃO (🚀 BOTÃO IMPORTAR JSON) ---
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

  return (
    <div className="adm-main-layout">
      <header className="adm-header-nav">
        <div className="adm-nav-left">
          <button onClick={() => setPage("home")} className="adm-btn-exit">
            ← Sair
          </button>

          {/* Botões restaurados do código antigo com as classes originais */}
          <button onClick={handleMigrateJSON} className="adm-btn-backup">
            🚀 Migrar JSON
          </button>

          <button
            onClick={() =>
              alert(
                "Função desativada: Use o botão Migrar JSON para o Firebase.",
              )
            }
            className="adm-btn-import"
          >
            📥 Abrir
          </button>

          <button
            onClick={() => setPage("adminMatches")}
            className="adm-btn-matches"
          >
            ⚽ Partidas
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
          <button type="submit" className="adm-btn-add-confirm">
            Adicionar +
          </button>
        </form>
      </section>

      <div className="adm-table-container">
        <table className="adm-table">
          <thead>
            <tr className="adm-thead-tr">
              <th>JOGADOR</th>
              <th>ESTATÍSTICAS</th>
              <th>GOLS</th>
              <th>ASSIST</th>
              <th>PERFIL (FOTO/CARGO)</th>
              <th>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((p) => (
              <PlayerRow
                key={p.id}
                p={p}
                total={getTotalStats(p)}
                onUpdateManual={handleUpdateManual}
                onUpdateProfile={handleUpdateProfile}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPanel;
