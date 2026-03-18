import React, { useState, useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
} from "recharts";
import "../styles/playerpage.css";
import RankingSlice from "../components/RankingSlice";
import PlayerStatsDashboard from "../components/PlayerStatsDashboard";

function PlayerPage({
  player,
  matches,
  getBestPartner,
  onBack,
  isAdmin,
  onUpdatePlayer,
  sortedPlayers,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...player });
  const [newAch, setNewAch] = useState({ icon: "🏆", title: "" });

  const SKILLS_ORDER = [
    "velocidade",
    "chute",
    "passe",
    "mira",
    "defesa",
    "corpo",
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split("T")[0].split("-");
    return `${parts[2]}/${parts[1]}`;
  };

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      manualGoals: Number(formData.manualGoals) || 0,
      manualAssists: Number(formData.manualAssists) || 0,
      manualMatches: Number(formData.manualMatches) || 0,
    };
    onUpdatePlayer(player.id, dataToSave);
    setIsEditing(false);
  };

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

  const stats = useMemo(() => {
    if (!player || !matches) return null;
    const pMatches = matches.filter(
      (m) =>
        m.teamA.players.some((id) => String(id) === String(player.id)) ||
        m.teamB.players.some((id) => String(id) === String(player.id)),
    );

    return {
      pMatches,
      sorted: [...pMatches].sort((a, b) => new Date(b.date) - new Date(a.date)),
    };
  }, [player, matches]);

  if (isEditing && isAdmin) {
    return (
      <div className="ppg-edit-container">
        <div className="ppg-edit-card">
          <h1 style={{ color: "var(--gold)", marginBottom: "30px" }}>
            Configurações: {player.name}
          </h1>

          <div className="ppg-edit-section">
            <h3 className="ppg-card-title">1. Histórico Antigo (2023-2025)</h3>
            <div className="ppg-edit-grid">
              <div>
                <label className="ppg-mini-label">Gols</label>
                <input
                  type="number"
                  value={formData.manualGoals || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, manualGoals: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="ppg-mini-label">Assists</label>
                <input
                  type="number"
                  value={formData.manualAssists || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, manualAssists: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="ppg-mini-label">Jogos</label>
                <input
                  type="number"
                  value={formData.manualMatches || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, manualMatches: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* CAMPO DE ANIVERSÁRIO VOLTOU AQUI NO EDIT */}
          <div className="ppg-edit-section">
            <h3 className="ppg-card-title">Aniversário</h3>
            <div
              className="ppg-edit-grid"
              style={{ gridTemplateColumns: "1fr" }}
            >
              <input
                type="date"
                value={formData.birthDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="ppg-edit-section">
            <h3 className="ppg-card-title">2. Atributos Técnicos</h3>
            <div
              className="ppg-edit-grid"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              }}
            >
              {SKILLS_ORDER.map((s) => (
                <div
                  key={s}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <label className="ppg-mini-label">
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
                    style={{ width: "100%" }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="ppg-edit-section">
            <h3 className="ppg-card-title">3. Gerenciar Conquistas</h3>
            <div
              className="ppg-add-ach-form"
              style={{ display: "flex", gap: "10px", marginBottom: "15px" }}
            >
              <input
                style={{ width: "50px" }}
                value={newAch.icon}
                onChange={(e) => setNewAch({ ...newAch, icon: e.target.value })}
              />
              <input
                style={{ flex: 1 }}
                value={newAch.title}
                onChange={(e) =>
                  setNewAch({ ...newAch, title: e.target.value })
                }
                placeholder="Título..."
              />
              <button onClick={addAchievement} className="ppg-btn-capture">
                ADD
              </button>
            </div>
            {formData.achievements?.map((ach, idx) => (
              <div
                key={idx}
                className="ppg-edit-ach-item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px",
                  background: "#222",
                  marginBottom: "5px",
                  borderRadius: "5px",
                }}
              >
                <span>
                  {ach.icon} {ach.title}
                </span>
                <button
                  onClick={() => removeAchievement(idx)}
                  style={{
                    background: "red",
                    border: "none",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  X
                </button>
              </div>
            ))}
          </div>

          <div
            className="ppg-edit-grid"
            style={{
              marginTop: "30px",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
            }}
          >
            <button className="ppg-btn-save" onClick={handleSave}>
              SALVAR TUDO
            </button>
            <button
              className="ppg-btn-cancel"
              onClick={() => setIsEditing(false)}
            >
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ppg-page-container" id="player-card-capture">
      <header className="ppg-top-header">
        <button onClick={onBack} className="ppg-btn-back">
          ← VOLTAR
        </button>
        {isAdmin && (
          <button onClick={() => setIsEditing(true)} className="ppg-btn-edit">
            MODO ADM
          </button>
        )}
      </header>

      <div className="ppg-main-layout">
        <aside>
          <div className="ppg-card ppg-profile-card ppg-glow-gold">
            <img
              src={player.photo || ""}
              className="ppg-profile-img"
              alt={player.name}
              crossOrigin="anonymous"
            />
            <h1 className="ppg-player-name">{player.name}</h1>
            <p className="ppg-player-role">{player.clubRole}</p>

            <div
              className="ppg-mini-stats-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "10px",
                marginTop: "10px",
                textAlign: "center",
              }}
            >
              <div>
                <span className="ppg-mini-label">Perna</span>
                <span
                  className="ppg-mini-value"
                  style={{ display: "block", fontWeight: "bold" }}
                >
                  {player.strongFoot || "—"}
                </span>
              </div>
              <div>
                <span className="ppg-mini-label">Parceiro</span>
                <span
                  className="ppg-mini-value"
                  style={{ display: "block", fontWeight: "bold" }}
                >
                  {getBestPartner(player.id) || "—"}
                </span>
              </div>
              <div>
                <span className="ppg-mini-label">Nascimento</span>
                <span
                  className="ppg-mini-value"
                  style={{ display: "block", fontWeight: "bold" }}
                >
                  {player.birthDate || "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="ppg-card">
            <h3 className="ppg-card-title">Habilidades</h3>
            <div className="ppg-radar-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={SKILLS_ORDER.map((k) => ({
                    subject: k.toUpperCase(),
                    A: player.skills[k],
                  }))}
                >
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#666", fontSize: 10 }}
                  />
                  <Radar
                    dataKey="A"
                    stroke="var(--gold)"
                    fill="var(--gold)"
                    fillOpacity={0.4}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <RankingSlice player={player} sortedPlayers={sortedPlayers} />
        </aside>

        <main>
          <PlayerStatsDashboard player={player} matches={matches} />

          <div className="ppg-card">
            <h3 className="ppg-card-title">Conquistas na Carreira</h3>
            <div
              className="ppg-achievements-list"
              style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
            >
              {player.achievements?.length > 0 ? (
                player.achievements.map((a, i) => (
                  <div
                    key={i}
                    className="ppg-tag-goal"
                    style={{
                      fontSize: "13px",
                      padding: "8px 12px",
                      background: "rgba(255, 215, 0, 0.1)",
                      border: "1px solid var(--gold)",
                    }}
                  >
                    {a.icon} {a.title}
                  </div>
                ))
              ) : (
                <span style={{ color: "#555", fontSize: "12px" }}>
                  Nenhuma conquista registrada.
                </span>
              )}
            </div>
          </div>

          <div className="ppg-card">
            <h3 className="ppg-card-title">Histórico de Partidas</h3>
            <div className="ppg-scroll-area">
              {stats.sorted.map((m) => {
                const isTeamA = m.teamA.players.some(
                  (id) => String(id) === String(player.id),
                );
                const sA = m.events.filter(
                  (e) =>
                    (e.team === "A" && e.type === "GOAL") ||
                    (e.team === "B" && e.type === "OWN_GOAL"),
                ).length;
                const sB = m.events.filter(
                  (e) =>
                    (e.team === "B" && e.type === "GOAL") ||
                    (e.team === "A" && e.type === "OWN_GOAL"),
                ).length;
                const pG = m.events.filter(
                  (e) =>
                    String(e.playerId) === String(player.id) &&
                    e.type === "GOAL",
                ).length;
                const pA = m.events.filter(
                  (e) =>
                    (e.type === "GOAL" &&
                      String(e.assistId) === String(player.id)) ||
                    (e.type === "ASSIST" &&
                      String(e.playerId) === String(player.id)),
                ).length;

                return (
                  <div key={m.id} className="ppg-match-item">
                    <div style={{ flex: 1 }}>
                      <span className="ppg-date-tag">{formatDate(m.date)}</span>
                      <div className="ppg-teams-display">
                        <span className={isTeamA ? "active" : ""}>
                          {m.teamA.name}
                        </span>
                        <span className="ppg-vs-badge">
                          {sA} : {sB}
                        </span>
                        <span className={!isTeamA ? "active" : ""}>
                          {m.teamB.name}
                        </span>
                      </div>
                    </div>
                    <div className="ppg-match-stats-tags">
                      {pG > 0 && <span className="ppg-tag-goal">+{pG} G</span>}
                      {pA > 0 && (
                        <span className="ppg-tag-assist">+{pA} A</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default PlayerPage;
