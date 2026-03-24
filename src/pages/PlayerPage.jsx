import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Importes necessários para rotas
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
import MatchHistory from "../components/playerpage/MatchHistory";
import Footer from "../components/Footer";
import PlayerAdminMode from "../components/playerpage/PlayerAdminMode";
import PlayerBanner from "../components/playerpage/PlayerBanner";

function PlayerPage({
  playersWithStats, // Recebe a lista completa para encontrar o player pelo ID
  matches,
  getBestPartner,
  isAdmin,
  onUpdatePlayer,
  sortedPlayers,
}) {
  const { id } = useParams(); // Pega o ID da URL (ex: /player/21)
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const topRef = useRef(null);

  // 1. Encontra o jogador baseado no ID da URL
  const player = useMemo(() => {
    return playersWithStats?.find((p) => String(p.id) === String(id));
  }, [id, playersWithStats]);

  // 2. Scroll para o topo ao carregar ou mudar de jogador
  useEffect(() => {
    if (player) {
      window.scrollTo(0, 0);
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }
  }, [id, player]);

  const SKILLS_ORDER = [
    "velocidade",
    "chute",
    "passe",
    "mira",
    "defesa",
    "corpo",
  ];

  const playerMatches = useMemo(() => {
    if (!player || !matches) return [];
    return matches.filter(
      (m) =>
        m.teamA.players.some((pId) => String(pId) === String(player.id)) ||
        m.teamB.players.some((pId) => String(pId) === String(player.id)),
    );
  }, [player, matches]);

  // --- VERIFICAÇÃO DE SEGURANÇA ---
  // Se os dados ainda não carregaram ou o ID é inválido, exibe um loading
  if (!player) {
    return (
      <div
        className="ppg-screen-wrapper"
        style={{ color: "#fff", textAlign: "center", padding: "100px 20px" }}
      >
        <h2>Buscando atleta...</h2>
        <button
          onClick={() => navigate("/")}
          className="ppg-btn-edit"
          style={{ marginTop: "20px" }}
        >
          Voltar para Home
        </button>
      </div>
    );
  }

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
      <div className="ppg-screen-content" ref={topRef}>
        <header className="ppg-header-overlay">
          <div className="ppg-header-container">
            {isAdmin && (
              <button
                onClick={() => setIsEditing(true)}
                className="ppg-btn-edit"
              >
                MODO ADM
              </button>
            )}
          </div>
        </header>

        <PlayerBanner player={player} getBestPartner={getBestPartner} />

        <div className="ppg-page-container">
          <div className="ppg-main-layout">
            <aside>
              <div className="ppg-card">
                <h3 className="ppg-card-title">Habilidades</h3>
                <div className="ppg-radar-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={SKILLS_ORDER.map((k) => ({
                        subject: k.toUpperCase(),
                        A: player.skills?.[k] || 0,
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
                      <div key={i} className="ppg-tag-goal">
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

              <MatchHistory matches={playerMatches} player={player} />
            </main>
          </div>
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
