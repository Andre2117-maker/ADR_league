import React, { useState, useMemo } from "react";
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

const QUICK_ICONS = [
  "🏆",
  "🥇",
  "🥈",
  "⚽",
  "🎯",
  "🧤",
  "👑",
  "🔥",
  "⭐",
  "🛡️",
];

const PlayerAdminMode = ({
  player,
  onSave,
  onCancel,
  SKILLS_ORDER = ["velocidade", "corpo", "chute", "mira", "passe", "defesa"],
}) => {
  const [formData, setFormData] = useState(() => ({
    ...player,
    skills: {
      velocidade: 50,
      corpo: 50,
      chute: 50,
      mira: 50,
      passe: 50,
      defesa: 50,
      ...(player?.skills || {}),
    },
    positions: player?.positions || (player?.position ? [player.position] : []),
    achievements: player?.achievements || [],
    isAnonymous: Boolean(player?.isAnonymous),
  }));

  const [selectedYear, setSelectedYear] = useState("2026");
  const [newAch, setNewAch] = useState({ icon: "🏆", title: "" });

  // Estatísticas da temporada selecionada
  const currentSeasonStats = formData.statsBySeason?.[selectedYear] || {
    goals: 0,
    assists: 0,
    games: 0,
  };

  // Calcula o Overall (OVR) em tempo real enquanto mexe nos sliders
  const liveOverall = useMemo(() => {
    if (!SKILLS_ORDER || SKILLS_ORDER.length === 0) return 50;
    const sum = SKILLS_ORDER.reduce(
      (acc, key) => acc + Number(formData.skills?.[key] ?? 50),
      0,
    );
    return Math.round(sum / SKILLS_ORDER.length);
  }, [formData.skills, SKILLS_ORDER]);

  // Calcula o resumo acumulado de todas as temporadas manuais
  const manualTotalsSummary = useMemo(() => {
    const seasons = formData.statsBySeason || {};
    let g = 0;
    let a = 0;
    let m = 0;
    Object.keys(seasons).forEach((yr) => {
      const s = seasons[yr] || {};
      g += Number(s.goals || 0);
      a += Number(s.assists || 0);
      m += Number(s.matches ?? s.games ?? 0);
    });
    return { g, a, m };
  }, [formData.statsBySeason]);

  const handleSeasonChange = (field, value) => {
    const numVal = Math.max(0, Number(value) || 0);
    const updatedSeasonObj = {
      ...currentSeasonStats,
      [field]: numVal,
    };

    // Mantém 'games' e 'matches' sincronizados para compatibilidade com todos os componentes
    if (field === "games") {
      updatedSeasonObj.matches = numVal;
    }

    const updatedStatsBySeason = {
      ...(formData.statsBySeason || {}),
      [selectedYear]: updatedSeasonObj,
    };
    setFormData({ ...formData, statsBySeason: updatedStatsBySeason });
  };

  const handlePositionToggle = (pos) => {
    const currentPositions = formData.positions || [];
    const updatedPositions = currentPositions.includes(pos)
      ? currentPositions.filter((p) => p !== pos)
      : [...currentPositions, pos];

    setFormData({
      ...formData,
      positions: updatedPositions,
      // Atualiza também a string 'position' principal para os cards que leem singular
      position: updatedPositions[0] || "",
    });
  };

  const handleSkillChange = (skillKey, val) => {
    const clamped = Math.min(100, Math.max(0, Number(val) || 0));
    setFormData({
      ...formData,
      skills: {
        ...formData.skills,
        [skillKey]: clamped,
      },
    });
  };

  const addAchievement = () => {
    if (!newAch.title.trim()) return;
    const updated = [
      ...(formData.achievements || []),
      { icon: newAch.icon || "🏆", title: newAch.title.trim() },
    ];
    setFormData({ ...formData, achievements: updated });
    setNewAch({ icon: "🏆", title: "" });
  };

  const removeAchievement = (index) => {
    const updated = (formData.achievements || []).filter((_, i) => i !== index);
    setFormData({ ...formData, achievements: updated });
  };

  const handleSave = () => {
    const seasons = formData.statsBySeason || {};

    let totalManualGoals = 0;
    let totalManualAssists = 0;
    let totalManualMatches = 0;

    Object.keys(seasons).forEach((year) => {
      const s = seasons[year] || {};
      totalManualGoals += Number(s.goals || 0);
      totalManualAssists += Number(s.assists || 0);
      totalManualMatches += Number(s.matches ?? s.games ?? 0);
    });

    const dataToSave = {
      ...formData,
      number:
        formData.number !== "" && formData.number !== undefined
          ? Number(formData.number)
          : "",
      titlesADR: Number(formData.titlesADR || 0),
      manualGoals: totalManualGoals,
      manualAssists: totalManualAssists,
      manualMatches: totalManualMatches,
      goals: 0,
      assists: 0,
      games: 0,
      statsBySeason: seasons,
    };

    onSave(dataToSave);
  };

  // Converte "DD/MM/AAAA" para "AAAA-MM-DD" para o input type="date"
  const formattedDateForInput = useMemo(() => {
    if (!formData.birthDate) return "";
    if (formData.birthDate.includes("/")) {
      const parts = formData.birthDate.split("/");
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return formData.birthDate;
  }, [formData.birthDate]);

  return (
    <div className="adm-container">
      <div className="adm-card">
        {/* ==================== TOPO DO EDITOR ==================== */}
        <header className="adm-top-bar">
          <div className="adm-top-titles">
            <span className="adm-kicker">PAINEL DE GESTÃO TÉCNICA • O ADR</span>
            <h1 className="adm-main-title">
              Editar Atleta: <span>{formData.name || player.name}</span>
            </h1>
          </div>

          <div
            className="adm-ovr-preview-box"
            title="Overall Calculado em Tempo Real"
          >
            <span className="adm-ovr-num">{liveOverall}</span>
            <span className="adm-ovr-label">OVR</span>
          </div>
        </header>

        {/* ==================== 1. DADOS PESSOAIS E STATUS ==================== */}
        <section className="adm-section">
          <div className="adm-section-header">
            <h3 className="adm-title">1. Dados Pessoais & Status no Clube</h3>
            <label
              className={`adm-status-toggle ${
                formData.isAnonymous ? "is-anon" : "is-active"
              }`}
            >
              <input
                type="checkbox"
                checked={!formData.isAnonymous}
                onChange={(e) =>
                  setFormData({ ...formData, isAnonymous: !e.target.checked })
                }
              />
              <span className="adm-status-dot" />
              <span>
                {formData.isAnonymous
                  ? "🕵️ Oculto / Anônimo (Fora da Tabela)"
                  : "✅ Ativo na Tabela Oficial"}
              </span>
            </label>
          </div>

          <div className="adm-grid-personal">
            <div className="adm-input-group">
              <label>Nome de Exibição</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome do Atleta"
              />
            </div>

            <div className="adm-input-group">
              <label>Nº da Camisa</label>
              <input
                type="number"
                value={formData.number ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, number: e.target.value })
                }
                placeholder="Ex: 10"
              />
            </div>

            <div className="adm-input-group">
              <label>Aniversário</label>
              <input
                type="date"
                value={formattedDateForInput}
                onChange={(e) => {
                  const dateVal = e.target.value;
                  if (!dateVal) {
                    setFormData({ ...formData, birthDate: "" });
                    return;
                  }
                  const [year, month, day] = dateVal.split("-");
                  setFormData({
                    ...formData,
                    birthDate: `${day}/${month}/${year}`,
                  });
                }}
              />
            </div>

            <div className="adm-input-group">
              <label>Perna Dominante</label>
              <select
                className="adm-select-field"
                value={formData.strongFoot || "Destro"}
                onChange={(e) =>
                  setFormData({ ...formData, strongFoot: e.target.value })
                }
              >
                <option value="Destro">🦶 Destro</option>
                <option value="Canhoto">🦶 Canhoto</option>
                <option value="Ambidestro">⚡ Ambidestro</option>
              </select>
            </div>

            <div className="adm-input-group">
              <label>🏆 Títulos d'O ADR</label>
              <input
                type="number"
                min="0"
                value={formData.titlesADR ?? 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    titlesADR: Math.max(0, Number(e.target.value) || 0),
                  })
                }
              />
            </div>
          </div>

          {/* SELEÇÃO DE MÚLTIPLAS POSIÇÕES EM PÍLULAS TÁTICAS */}
          <div className="adm-positions-block">
            <div className="adm-positions-header">
              <label className="adm-positions-label">
                Posições de Atuação (A 1ª selecionada será a principal)
              </label>
              {formData.positions?.length > 0 && (
                <span className="adm-pos-selected-summary">
                  Selecionadas:{" "}
                  <strong>{formData.positions.join(" • ")}</strong>
                </span>
              )}
            </div>

            <div className="adm-positions-grid">
              {ALL_POSITIONS.map((pos) => {
                const isChecked = (formData.positions || []).includes(pos);
                const isPrimary = formData.positions?.[0] === pos;
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => handlePositionToggle(pos)}
                    className={`adm-pos-pill ${isChecked ? "active" : ""} ${
                      isPrimary ? "primary-pos" : ""
                    }`}
                  >
                    <span className="pos-code">{pos}</span>
                    {isPrimary && <span className="pos-main-star">★</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== 2. HISTÓRICO MANUAL POR TEMPORADA ==================== */}
        <section className="adm-section">
          <div className="adm-section-header">
            <div>
              <h3 className="adm-title">2. Ajuste Manual por Temporada</h3>
              <p className="adm-sub-hint">
                Some gols/jogos antigos que não estão cadastrados nas súmulas.
              </p>
            </div>

            <select
              className="adm-season-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2026">📅 TEMPORADA 2026</option>
              <option value="2025">📅 TEMPORADA 2025</option>
              <option value="2024">📅 TEMPORADA 2024</option>
            </select>
          </div>

          <div className="adm-grid-stats">
            <div className="adm-input-group stat-card-input">
              <label>⚽ Gols Manuais ({selectedYear})</label>
              <input
                type="number"
                min="0"
                value={currentSeasonStats.goals ?? 0}
                onChange={(e) => handleSeasonChange("goals", e.target.value)}
              />
            </div>

            <div className="adm-input-group stat-card-input">
              <label>🎯 Assists Manuais ({selectedYear})</label>
              <input
                type="number"
                min="0"
                value={currentSeasonStats.assists ?? 0}
                onChange={(e) => handleSeasonChange("assists", e.target.value)}
              />
            </div>

            <div className="adm-input-group stat-card-input">
              <label>🏟️ Jogos Manuais ({selectedYear})</label>
              <input
                type="number"
                min="0"
                value={
                  currentSeasonStats.games ?? currentSeasonStats.matches ?? 0
                }
                onChange={(e) => handleSeasonChange("games", e.target.value)}
              />
            </div>
          </div>

          <div className="adm-manual-totals-strip">
            <span>Soma Manual Total (Todas as Temporadas):</span>
            <strong>
              {manualTotalsSummary.g} Gols • {manualTotalsSummary.a} Assists •{" "}
              {manualTotalsSummary.m} Jogos
            </strong>
          </div>
        </section>

        {/* ==================== 3. ATRIBUTOS TÉCNICOS (SKILLS) ==================== */}
        <section className="adm-section">
          <div className="adm-section-header">
            <h3 className="adm-title">3. Atributos Técnicos (Carta & Radar)</h3>
            <button
              type="button"
              className="adm-reset-skills-btn"
              onClick={() => {
                const balanced = {};
                SKILLS_ORDER.forEach((k) => (balanced[k] = 70));
                setFormData({ ...formData, skills: balanced });
              }}
            >
              Padrão 70
            </button>
          </div>

          <div className="adm-grid-skills">
            {SKILLS_ORDER.map((s) => {
              const val = Number(formData.skills?.[s] ?? 50);
              const tierClass =
                val >= 85
                  ? "tier-elite"
                  : val >= 75
                    ? "tier-gold"
                    : val >= 60
                      ? "tier-silver"
                      : "tier-bronze";

              return (
                <div key={s} className={`adm-skill-item ${tierClass}`}>
                  <div className="adm-skill-top">
                    <label>{s.toUpperCase()}</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="adm-skill-num-input"
                      value={val}
                      onChange={(e) => handleSkillChange(s, e.target.value)}
                    />
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={val}
                    onChange={(e) => handleSkillChange(s, e.target.value)}
                  />

                  <div className="adm-skill-bar-bg">
                    <div
                      className="adm-skill-bar-fill"
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==================== 4. GALERIA DE CONQUISTAS ==================== */}
        <section className="adm-section">
          <h3 className="adm-title">4. Troféus & Conquistas Individuais</h3>

          <div className="adm-quick-icons-bar">
            <span>Ícones rápidos:</span>
            {QUICK_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={`adm-emoji-btn ${
                  newAch.icon === ic ? "selected" : ""
                }`}
                onClick={() => setNewAch({ ...newAch, icon: ic })}
              >
                {ic}
              </button>
            ))}
          </div>

          <div className="adm-ach-inputs">
            <input
              className="adm-ach-icon"
              value={newAch.icon}
              onChange={(e) => setNewAch({ ...newAch, icon: e.target.value })}
              placeholder="🏆"
            />
            <input
              className="adm-ach-title"
              placeholder="Ex: Artilheiro da Copa ADR 2026..."
              value={newAch.title}
              onChange={(e) => setNewAch({ ...newAch, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addAchievement()}
            />
            <button
              type="button"
              onClick={addAchievement}
              className="adm-btn-add"
            >
              + ADICIONAR
            </button>
          </div>

          <div className="adm-ach-list">
            {formData.achievements?.length > 0 ? (
              formData.achievements.map((ach, idx) => (
                <div key={idx} className="adm-ach-item">
                  <div className="adm-ach-info">
                    <span className="adm-ach-badge-icon">{ach.icon}</span>
                    <span className="adm-ach-badge-text">{ach.title}</span>
                  </div>
                  <button
                    type="button"
                    className="adm-ach-del"
                    onClick={() => removeAchievement(idx)}
                    title="Remover conquista"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <p className="adm-empty-ach">
                Nenhuma conquista cadastrada para este atleta.
              </p>
            )}
          </div>
        </section>

        {/* ==================== BOTÕES FINAIS ==================== */}
        <footer className="adm-actions">
          <button type="button" className="adm-btn-cancel" onClick={onCancel}>
            CANCELAR
          </button>
          <button type="button" className="adm-btn-save" onClick={handleSave}>
            💾 SALVAR ALTERAÇÕES
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PlayerAdminMode;
