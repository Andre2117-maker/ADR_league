import React, { useState } from "react";
import "../../styles/playeradmin.css";

const ALL_POSITIONS = [
  "GOL",
  "FIX",
  "ALE",
  "ALD",
  "PIV",
  "ZAG",
  "LE",
  "LD",
  "VOL",
  "MEI",
  "PE",
  "PD",
  "ATA",
];

const PlayerAdminMode = ({ player, onSave, onCancel, SKILLS_ORDER }) => {
  // Inicializamos o formulário com os dados atuais do jogador
  const [formData, setFormData] = useState({ ...player });
  const [selectedYear, setSelectedYear] = useState("2026");
  const [newAch, setNewAch] = useState({ icon: "🏆", title: "" });

  // Pega os stats da temporada selecionada dentro do mapa 'statsBySeason'
  // Se não existir no Firebase ainda, inicia com 0
  const currentSeasonStats = formData.statsBySeason?.[selectedYear] || {
    goals: 0,
    assists: 0,
    games: 0,
  };

  const handleSeasonChange = (field, value) => {
    const updatedStatsBySeason = {
      ...(formData.statsBySeason || {}),
      [selectedYear]: {
        ...currentSeasonStats,
        [field]: Number(value) || 0,
      },
    };
    setFormData({ ...formData, statsBySeason: updatedStatsBySeason });
  };

  const handlePositionToggle = (pos) => {
    const currentPositions = formData.positions || [];
    let updatedPositions;

    if (currentPositions.includes(pos)) {
      updatedPositions = currentPositions.filter((p) => p !== pos);
    } else {
      updatedPositions = [...currentPositions, pos];
    }

    setFormData({ ...formData, positions: updatedPositions });
  };

  const handleSave = () => {
    const seasons = formData.statsBySeason || {};

    let totalManualGoals = 0;
    let totalManualAssists = 0;
    let totalManualMatches = 0;

    // Percorre TODAS as temporadas do mapa (2025, 2026 manual, etc)
    Object.keys(seasons).forEach((year) => {
      const s = seasons[year];
      totalManualGoals += Number(s.goals || 0);
      totalManualAssists += Number(s.assists || 0);
      totalManualMatches += Number(s.matches || s.games || 0);
    });

    const dataToSave = {
      ...formData,
      // Agora a raiz tem a soma fiel de todo o histórico manual
      manualGoals: totalManualGoals,
      manualAssists: totalManualAssists,
      manualMatches: totalManualMatches,
      // Mantemos os automáticos zerados para o Dashboard calcular via Matches
      goals: 0,
      assists: 0,
      games: 0,
      statsBySeason: seasons,
    };

    onSave(dataToSave);
  };

  // Funções de Conquistas (mantidas iguais)
  const addAchievement = () => {
    if (!newAch.title) return;
    const updated = [...(formData.achievements || []), { ...newAch }];
    setFormData({ ...formData, achievements: updated });
    setNewAch({ icon: "🏆", title: "" });
  };

  const removeAchievement = (index) => {
    const updated = formData.achievements.filter((_, i) => i !== index);
    setFormData({ ...formData, achievements: updated });
  };

  return (
    <div className="adm-container">
      <div className="adm-card">
        <h1 className="adm-main-title">Configurações: {player.name}</h1>

        {/* --- DADOS PESSOAIS --- */}
        <div className="adm-section">
          <h3 className="adm-title">1. Dados Pessoais</h3>
          <div className="adm-grid-stats">
            <div className="adm-input-group">
              <label>Aniversário (DD/MM/AAAA)</label>
              <input
                type="date"
                // CONVERSÃO PARA EXIBIR: "25/12/2026" vira "2026-12-25" para o input ler
                value={
                  formData.birthDate && formData.birthDate.includes("/")
                    ? formData.birthDate.split("/").reverse().join("-")
                    : ""
                }
                onChange={(e) => {
                  const dateVal = e.target.value; // Vem como AAAA-MM-DD
                  if (!dateVal) return;

                  // CONVERSÃO PARA SALVAR: "2026-12-25" vira "25/12/2026"
                  const [year, month, day] = dateVal.split("-");
                  const dateWithSlash = `${day}/${month}/${year}`;

                  setFormData({ ...formData, birthDate: dateWithSlash });
                }}
              />
            </div>
            <div className="adm-input-group">
              <label>Pé Forte</label>

              <select
                className="adm-select-field"
                value={formData.strongFoot || ""}
                onChange={(e) =>
                  setFormData({ ...formData, strongFoot: e.target.value })
                }
              >
                <option value="Destro">Destro</option>
                <option value="Canhoto">Canhoto</option>
                <option value="Ambidestro">Ambidestro</option>
              </select>
            </div>
          </div>
          {/* NOVO SUB-BLOQUEIO: SELEÇÃO DE MULTIPLAS POSIÇÕES */}
          <div className="adm-positions-block" style={{ marginTop: "20px" }}>
            <label
              className="adm-positions-label"
              style={{
                fontWeight: "bold",
                display: "block",
                marginBottom: "10px",
              }}
            >
              Posições do Jogador (Selecione uma ou mais)
            </label>
            <div
              className="adm-positions-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "10px",
                background: "rgba(255,255,255,0.03)",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {ALL_POSITIONS.map((pos) => {
                const isChecked = (formData?.positions || []).includes(pos);
                return (
                  <label
                    key={pos}
                    className={`adm-pos-checkbox-label ${isChecked ? "active" : ""}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      background: isChecked
                        ? "rgba(226, 179, 23, 0.15)"
                        : "transparent",
                      border: isChecked
                        ? "1px solid #e2b317"
                        : "1px solid transparent",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handlePositionToggle(pos)}
                      style={{ accentColor: "#e2b317", cursor: "pointer" }}
                    />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: isChecked ? "#e2b317" : "#fff",
                      }}
                    >
                      {pos}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- HISTÓRICO MANUAL --- */}
        <div className="adm-section">
          <div className="adm-section-header">
            <h3 className="adm-title">2. Histórico por Temporada</h3>
            <select
              className="adm-season-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2026">TEMPORADA 2026</option>
              <option value="2025">TEMPORADA 2025</option>
              <option value="2024">TEMPORADA 2024</option>
            </select>
          </div>

          <div className="adm-grid-stats">
            <div className="adm-input-group">
              <label>Gols ({selectedYear})</label>
              <input
                type="number"
                value={currentSeasonStats.goals}
                onChange={(e) => handleSeasonChange("goals", e.target.value)}
              />
            </div>
            <div className="adm-input-group">
              <label>Assists ({selectedYear})</label>
              <input
                type="number"
                value={currentSeasonStats.assists}
                onChange={(e) => handleSeasonChange("assists", e.target.value)}
              />
            </div>
            <div className="adm-input-group">
              <label>Jogos ({selectedYear})</label>
              <input
                type="number"
                value={currentSeasonStats.games}
                onChange={(e) => handleSeasonChange("games", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* --- ATRIBUTOS --- */}
        <div className="adm-section">
          <h3 className="adm-title">3. Atributos Técnicos</h3>
          <div className="adm-grid-skills">
            {SKILLS_ORDER.map((s) => (
              <div key={s} className="adm-skill-item">
                <label>
                  {s.toUpperCase()}: {formData.skills[s]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.skills[s]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skills: {
                        ...formData.skills,
                        [s]: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* --- CONQUISTAS --- */}
        <div className="adm-section">
          <h3 className="adm-title">4. Conquistas</h3>
          <div className="adm-ach-inputs">
            <input
              className="adm-ach-icon"
              value={newAch.icon}
              onChange={(e) => setNewAch({ ...newAch, icon: e.target.value })}
            />
            <input
              className="adm-ach-title"
              placeholder="Título..."
              value={newAch.title}
              onChange={(e) => setNewAch({ ...newAch, title: e.target.value })}
            />
            <button onClick={addAchievement} className="adm-btn-add">
              ADD
            </button>
          </div>
          <div className="adm-ach-list">
            {formData.achievements?.map((ach, idx) => (
              <div key={idx} className="adm-ach-item">
                <span>
                  {ach.icon} {ach.title}
                </span>
                <button onClick={() => removeAchievement(idx)}>X</button>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-actions">
          <button className="adm-btn-save" onClick={handleSave}>
            SALVAR TUDO
          </button>
          <button className="adm-btn-cancel" onClick={onCancel}>
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerAdminMode;
