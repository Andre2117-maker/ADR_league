import React, { useState, useEffect, useRef, useMemo } from "react";
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
import MatchHistory from "../components/MatchHistory";
import Footer from "../components/Footer";
import PlayerAdminMode from "../components/PlayerAdminMode";

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
  const topRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [player.id]);

  const SKILLS_ORDER = [
    "velocidade",
    "chute",
    "passe",
    "mira",
    "defesa",
    "corpo",
  ];

  // FILTRO DE PARTIDAS RESTAURADO: Necessário para o MatchHistory
  const playerMatches = useMemo(() => {
    if (!player || !matches) return [];
    return matches.filter(
      (m) =>
        m.teamA.players.some((id) => String(id) === String(player.id)) ||
        m.teamB.players.some((id) => String(id) === String(player.id)),
    );
  }, [player, matches]);

  const renderContent = () => {
    if (isEditing && isAdmin) {
      return (
        <PlayerAdminMode
          player={player}
          SKILLS_ORDER={SKILLS_ORDER}
          onCancel={() => setIsEditing(false)}
          onSave={(updatedData) => {
            onUpdatePlayer(player.id, updatedData);
            setIsEditing(false);
          }}
        />
      );
    }

    return (
      <div className="ppg-page-container" id="player-card-capture" ref={topRef}>
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

            {/* VOLTADO PARA O ORIGINAL: Agora passa matches E player */}
            <MatchHistory matches={playerMatches} player={player} />
          </main>
        </div>
      </div>
    );
  };

  return (
    <div className="ppg-screen-wrapper">
      {renderContent()}
      <Footer />
    </div>
  );
}

export default PlayerPage;
