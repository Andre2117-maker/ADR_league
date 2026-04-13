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
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import "../styles/Playerpage/playerpage.css";
import RankingSlice from "../components/playerpage/RankingSlice";
import PlayerStatsDashboard from "../components/playerpage/PlayerStatsDashboard";
import MatchHistory from "../components/playerpage/MatchHistory";
import Footer from "../components/Footer";
import PlayerAdminMode from "../components/playerpage/PlayerAdminMode";
import PlayerBanner from "../components/playerpage/PlayerBanner";
import PartnerAnalyzer from "../components/playerpage/PartnerAnalyzer";

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
  const [careerDates, setCareerDates] = useState(null);
  const topRef = useRef(null);

  // 1. Encontra o jogador baseado no ID da URL
  const player = useMemo(() => {
    return playersWithStats?.find((p) => String(p.id) === String(id));
  }, [id, playersWithStats]);

  // 2. Scroll para o topo ao carregar ou mudar de jogador
  useEffect(() => {
    const fetchMemorialData = async () => {
      if (!id) return;
      try {
        const q = query(
          collection(db, "memorial"),
          where("playerId", "==", id), // Busca pelo ID da URL
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setCareerDates(querySnapshot.docs[0].data());
        } else {
          setCareerDates(null);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do memorial:", error);
      }
    };

    fetchMemorialData();
  }, [id]);

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

    const checkConsecutiveAbsences = (player, allMatches) => {
      if (!allMatches || allMatches.length === 0)
        return { isOut: false, missedCount: 0 };

      // 1. Pega todas as datas únicas
      const rawDates = [...new Set(allMatches.map((m) => m.date))];

      // 2. Ordena as datas da mais RECENTE para a mais ANTIGA
      const trainingDays = rawDates.sort((a, b) => {
        // Como a data é "2026-03-28", o Date(ano, mes, dia) funciona bem
        const [y1, m1, d1] = a.split("-").map(Number);
        const [y2, m2, d2] = b.split("-").map(Number);
        return new Date(y2, m2 - 1, d2, 12) - new Date(y1, m1 - 1, d1, 12);
      });

      let missedCount = 0;
      for (const day of trainingDays) {
        const playedOnThisDay = allMatches.some((match) => {
          return (
            match.date === day &&
            (match.teamA.players.some(
              (pId) => String(pId) === String(player.id),
            ) ||
              match.teamB.players.some(
                (pId) => String(pId) === String(player.id),
              ))
          );
        });

        if (playedOnThisDay) break;
        else missedCount++;
      }

      return { isOut: missedCount >= 3, missedCount };
    };

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

        <PlayerBanner
          player={player}
          getBestPartner={getBestPartner}
          careerDates={careerDates}
        />

        <div className="ppg-page-container">
          <div className="ppg-main-layout">
            <aside>
              {/* --- PAINEL ADM: REGRA DE 3 TREINOS SEGUIDOS --- */}
              {isAdmin &&
                (() => {
                  const { isOut, missedCount } = checkConsecutiveAbsences(
                    player,
                    matches,
                  );

                  return (
                    <div
                      className="ppg-card"
                      style={{
                        border: isOut
                          ? "1px solid #ff4d4d"
                          : "1px dashed var(--gold)",
                        background: isOut
                          ? "rgba(255, 77, 77, 0.05)"
                          : "rgba(212, 175, 55, 0.05)",
                        padding: "15px",
                        marginBottom: "15px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "12px",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "900",
                            color: "var(--gold)",
                            background: "rgba(212, 175, 55, 0.1)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          🛡️ CONTROLE DE SEQUÊNCIA
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: isOut
                              ? "#ff4d4d"
                              : missedCount > 0
                                ? "#ffcc00"
                                : "#00ff7f",
                            fontWeight: "900",
                          }}
                        >
                          {missedCount}/3 FALTAS SEGUIDAS
                        </span>
                      </div>

                      {/* Barra de Progresso de Faltas (Visual) */}
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          marginBottom: "15px",
                        }}
                      >
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: "4px",
                              borderRadius: "2px",
                              background:
                                i <= missedCount
                                  ? isOut
                                    ? "#ff4d4d"
                                    : "#ffcc00"
                                  : "rgba(255,255,255,0.1)",
                            }}
                          />
                        ))}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          fontSize: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ color: "#888" }}>Status Atual:</span>
                          <span
                            style={{
                              fontWeight: "800",
                              color: isOut ? "#ff4d4d" : "#fff",
                            }}
                          >
                            {isOut
                              ? "REMOVER DA TABELA"
                              : missedCount > 0
                                ? "EM ALERTA"
                                : "ATIVO"}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ color: "#888" }}>
                            Último Treino Realizado:
                          </span>
                          <span style={{ fontWeight: "700", color: "#fff" }}>
                            {playerMatches.length > 0
                              ? (() => {
                                  // Ordena para pegar o mais recente
                                  const sorted = [...playerMatches].sort(
                                    (a, b) => {
                                      const [y1, m1, d1] = a.date
                                        .split("-")
                                        .map(Number);
                                      const [y2, m2, d2] = b.date
                                        .split("-")
                                        .map(Number);
                                      return (
                                        new Date(y2, m2 - 1, d2, 12) -
                                        new Date(y1, m1 - 1, d1, 12)
                                      );
                                    },
                                  );

                                  // Pega a data "YYYY-MM-DD" e inverte para "DD/MM/YYYY"
                                  const lastDate = sorted[0].date;
                                  const [y, m, d] = lastDate.split("-");
                                  return `${d}/${m}/${y}`;
                                })()
                              : "Sem registros"}
                          </span>
                        </div>
                      </div>

                      {isOut && (
                        <div
                          style={{
                            marginTop: "12px",
                            background: "rgba(255, 77, 77, 0.2)",
                            color: "#ff4d4d",
                            fontSize: "10px",
                            fontWeight: "900",
                            padding: "10px",
                            borderRadius: "6px",
                            textAlign: "center",
                            textTransform: "uppercase",
                          }}
                        >
                          JOGADOR FALTOU AOS ÚLTIMOS 3 TREINOS.
                          <br />
                          PASSAR PARA ANÔNIMO.
                        </div>
                      )}
                    </div>
                  );
                })()}

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

              <PartnerAnalyzer
                currentPlayer={player}
                allPlayers={playersWithStats}
                matches={matches}
              />
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
