import "../styles/panel.css";
import { useState, useRef } from "react";

// Componente de Linha Individual
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

            {/* Número da Camisa - INTEGRADO AQUI */}
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
              />
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

function AdminPanel({ players, setPlayers, setPage, matches, setMatches }) {
  const [newName, setNewName] = useState("");
  const fileInputRef = useRef(null);

  const handleExportData = () => {
    const dataToSave = { players, matches };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dataFormatada = new Date().toISOString().split("T")[0];
    link.download = `backup_adr_league_${dataFormatada}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData.players && importedData.matches) {
          if (window.confirm("Substituir dados atuais pelo backup?")) {
            setPlayers(importedData.players);
            setMatches(importedData.matches);
            alert("Dados restaurados!");
          }
        }
      } catch {
        alert("Erro no JSON.");
      }
    };
    reader.readAsText(file);
  };

  const sortedPlayers = [...players].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newPlayer = {
      id: Date.now().toString(),
      name: newName.trim(),
      manualGoals: 0,
      manualAssists: 0,
      titlesADR: 0,
      goalkeeperGoalsAgainst: 0,
      cleanSheets: 0,
      photo: "",
      clubRole: "",
      number: "",
      isAllStar: false,
      isAnonymous: false,
      skills: {
        velocidade: 50,
        corpo: 50,
        chute: 50,
        mira: 50,
        passe: 50,
        defesa: 50,
      },
    };
    setPlayers([...players, newPlayer]);
    setNewName("");
  };

  const handleUpdateManual = (id, field, value) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, [field]: Math.max(0, (p[field] || 0) + value) }
          : p,
      ),
    );
  };

  const handleUpdateProfile = (id, field, value) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Excluir ${name}?`)) {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
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
          <button onClick={handleExportData} className="adm-btn-backup">
            📤 Backup
          </button>
          <button
            onClick={() => fileInputRef.current.click()}
            className="adm-btn-import"
          >
            📥 Abrir
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportData}
            accept=".json"
            style={{ display: "none" }}
          />
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
