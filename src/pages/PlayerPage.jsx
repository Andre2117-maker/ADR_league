import React, { useState, useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PolarRadiusAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import "../styles/playerpage.css";
import RankingSlice from "../components/RankingSlice";
import BestDayStats from "../components/BestDayStats";

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
    onUpdatePlayer(player.id, formData);
    setIsEditing(false);
  };

  // Funções para Conquistas
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

    const mappedMatches = pMatches.map((m, index) => ({
      ...m,
      _originalIndex: index,
    }));
    const sorted = mappedMatches.sort((a, b) => {
      const tA = new Date(a.date).getTime();
      const tB = new Date(b.date).getTime();
      return tA !== tB ? tB - tA : b._originalIndex - a._originalIndex;
    });

    const totalGoals = pMatches.reduce(
      (acc, m) =>
        acc +
        m.events.filter(
          (e) => String(e.playerId) === String(player.id) && e.type === "GOAL",
        ).length,
      0,
    );
    const totalAssists = pMatches.reduce(
      (acc, m) =>
        acc +
        m.events.filter(
          (e) =>
            String(e.playerId) === String(player.id) && e.type === "ASSIST",
        ).length,
      0,
    );

    const chartData = [...sorted]
      .slice(0, 5)
      .reverse()
      .map((m, i) => ({
        name: `J${i + 1}`,
        Gols: m.events.filter(
          (e) => String(e.playerId) === String(player.id) && e.type === "GOAL",
        ).length,
        Assists: m.events.filter(
          (e) =>
            String(e.playerId) === String(player.id) && e.type === "ASSIST",
        ).length,
      }));

    return { pMatches, sorted, totalGoals, totalAssists, chartData };
  }, [player, matches]);

  if (isEditing && isAdmin) {
    return (
      <div className="ppg-edit-container">
        <div className="ppg-edit-card">
          <h1 style={{ color: "var(--gold)", marginBottom: "30px" }}>
            Configurações de Atleta: {player.name}
          </h1>

          <div className="ppg-edit-section">
            <h3 className="ppg-card-title">1. Dados Básicos</h3>
            <div className="ppg-edit-grid">
              <div>
                <label className="ppg-mini-label">Nome Completo</label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="ppg-mini-label">Cargo / Posição</label>
                <input
                  value={formData.clubRole}
                  onChange={(e) =>
                    setFormData({ ...formData, clubRole: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="ppg-mini-label">Perna Dominante</label>
                <select
                  value={formData.strongFoot}
                  onChange={(e) =>
                    setFormData({ ...formData, strongFoot: e.target.value })
                  }
                >
                  <option value="Destro">Destro</option>
                  <option value="Canhoto">Canhoto</option>
                  <option value="Ambidestro">Ambidestro</option>
                </select>
              </div>
              <div>
                <label className="ppg-mini-label">Data de Nascimento</label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={formData.birthDate || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="ppg-edit-section">
            <h3 className="ppg-card-title">2. Atributos Técnicos (0-100)</h3>
            <div
              className="ppg-edit-grid"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              }}
            >
              {Object.keys(formData.skills || {}).map((skill) => (
                <div
                  key={skill}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    padding: "15px",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <label
                      className="ppg-mini-label"
                      style={{ color: "var(--gold)" }}
                    >
                      {skill.toUpperCase()}
                    </label>
                    <span style={{ fontWeight: "bold", color: "#fff" }}>
                      {formData.skills[skill]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.skills[skill]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        skills: {
                          ...formData.skills,
                          [skill]: parseInt(e.target.value),
                        },
                      })
                    }
                    style={{ width: "100%", accentColor: "var(--gold)" }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="ppg-edit-section">
            <h3 className="ppg-card-title">3. Gerenciar Conquistas</h3>
            <div className="ppg-add-ach-form">
              <input
                style={{ width: "60px", textAlign: "center" }}
                value={newAch.icon}
                onChange={(e) => setNewAch({ ...newAch, icon: e.target.value })}
                placeholder="🏅"
              />
              <input
                style={{ flex: 1 }}
                value={newAch.title}
                onChange={(e) =>
                  setNewAch({ ...newAch, title: e.target.value })
                }
                placeholder="Ex: Artilheiro da Temporada..."
              />
              <button
                onClick={addAchievement}
                className="ppg-btn-capture"
                style={{ borderRadius: "8px", padding: "0 25px" }}
              >
                ADICIONAR
              </button>
            </div>
            <div className="ppg-edit-ach-list" style={{ marginTop: "20px" }}>
              {formData.achievements?.map((ach, idx) => (
                <div key={idx} className="ppg-edit-ach-item">
                  <span>
                    {ach.icon} {ach.title}
                  </span>
                  <button
                    onClick={() => removeAchievement(idx)}
                    className="ppg-btn-remove-ach"
                  >
                    EXCLUIR
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div
            className="ppg-edit-grid"
            style={{ marginTop: "50px", gridTemplateColumns: "1fr 1fr" }}
          >
            <button
              className="ppg-btn-save"
              style={{ height: "55px", fontSize: "16px" }}
              onClick={handleSave}
            >
              SALVAR TODAS AS ALTERAÇÕES
            </button>
            <button
              className="ppg-btn-cancel"
              style={{ height: "55px", fontSize: "16px" }}
              onClick={() => setIsEditing(false)}
            >
              DESCARTAR E VOLTAR
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
          ← VOLTAR AO SCOUT
        </button>
        <div>
          {isAdmin && (
            <button onClick={() => setIsEditing(true)} className="ppg-btn-edit">
              MODO ADM
            </button>
          )}
        </div>
      </header>

      <div className="ppg-main-layout">
        <aside>
          <div className="ppg-card ppg-profile-card ppg-glow-gold">
            <img
              src={player.photo || ""}
              className="ppg-profile-img"
              alt="P"
              crossOrigin="anonymous"
            />
            <h1 className="ppg-player-name">{player.name}</h1>
            <p className="ppg-player-role">{player.clubRole}</p>
            <div className="ppg-mini-stats-row">
              <div>
                <span className="ppg-mini-label">Perna</span>
                <span className="ppg-mini-value">{player.strongFoot}</span>
              </div>
              <div>
                <span className="ppg-mini-label">Parceiro</span>
                <span className="ppg-mini-value">
                  {getBestPartner(player.id)}
                </span>
              </div>
              <div>
                <span className="ppg-mini-label">Nascimento</span>
                <span className="ppg-mini-value">
                  {player.birthDate || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="ppg-card">
            <h3 className="ppg-card-title">Atributos Técnicos</h3>
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
          <BestDayStats matches={matches} playerId={player.id} />
          <div className="ppg-stats-summary-row">
            <div className="ppg-stat-box">
              <span className="ppg-stat-value">{stats.pMatches.length}</span>
              <span className="ppg-stat-label">Jogos</span>
            </div>
            <div className="ppg-stat-box ppg-stat-gold">
              <span className="ppg-stat-value">{stats.totalGoals}</span>
              <span className="ppg-stat-label">Gols</span>
            </div>
            <div className="ppg-stat-box ppg-stat-blue">
              <span className="ppg-stat-value">{stats.totalAssists}</span>
              <span className="ppg-stat-label">Assists</span>
            </div>
          </div>

          <div className="ppg-card">
            <h3 className="ppg-card-title">Conquistas na Carreira</h3>
            <div className="ppg-edit-ach-list">
              {player.achievements?.length > 0 ? (
                player.achievements.map((a, i) => (
                  <div
                    key={i}
                    className="ppg-tag-goal"
                    style={{ fontSize: "13px", padding: "10px 15px" }}
                  >
                    {a.icon} {a.title}
                  </div>
                ))
              ) : (
                <span style={{ color: "#333", fontSize: "12px" }}>
                  Nenhuma conquista registrada.
                </span>
              )}
            </div>
          </div>

          <div className="ppg-card">
            <h3 className="ppg-card-title">
              Performance Recente (Gols e Assists)
            </h3>
            <div className="ppg-bar-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#444", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#444", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                    contentStyle={{
                      backgroundColor: "#111",
                      border: "1px solid #333",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: "10px" }}
                  />
                  <Bar
                    dataKey="Gols"
                    fill="var(--gold)"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="Assists"
                    fill="var(--blue)"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
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
                const winnerField = m.penaltiesWinner || m.winner;
                let res = "E";
                if (winnerField)
                  res =
                    (isTeamA ? "A" : "B") === String(winnerField).toUpperCase()
                      ? "V"
                      : "D";
                else if (sA !== sB)
                  res = (sA > sB ? isTeamA : !isTeamA) ? "V" : "D";

                const pG = m.events.filter(
                  (e) =>
                    String(e.playerId) === String(player.id) &&
                    e.type === "GOAL",
                ).length;
                const pA = m.events.filter(
                  (e) =>
                    String(e.playerId) === String(player.id) &&
                    e.type === "ASSIST",
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
                      {pG > 0 && (
                        <span className="ppg-tag-goal">+{pG} GOL</span>
                      )}
                      {pA > 0 && (
                        <span className="ppg-tag-assist">+{pA} AST</span>
                      )}
                      <div
                        className={`ppg-res-circle b-res-${res.toLowerCase()}`}
                      >
                        {res}
                      </div>
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
