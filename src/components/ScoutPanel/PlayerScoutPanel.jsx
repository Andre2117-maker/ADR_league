import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

import "./scoutpanel.css";

export default function PlayerScoutPanel({ player, stats, bestPartner }) {
  const navigate = useNavigate();

  // Calcula estatísticas combinadas (Jogos Oficiais + Manual 2026) e Overall (OVR)
  const scoutMetrics = useMemo(() => {
    if (!player) return null;

    const manual26 = player.statsBySeason?.["2026"] || {};
    const totalGoals =
      Number(stats?.goals ?? player.goals ?? 0) + Number(manual26.goals || 0);
    const totalAssists =
      Number(stats?.assists ?? player.assists ?? 0) +
      Number(manual26.assists || 0);
    const totalGames =
      Number(stats?.matches ?? stats?.games ?? player.games ?? 0) +
      Number(manual26.matches || manual26.games || 0);

    const wins = Number(stats?.wins ?? player.wins ?? 0);
    const winRate =
      stats?.winRate !== undefined
        ? stats.winRate
        : totalGames > 0
          ? Math.round((wins / totalGames) * 100)
          : 0;

    const goalsPerGame =
      totalGames > 0 ? (totalGoals / totalGames).toFixed(2) : "0.00";
    const totalGA = totalGoals + totalAssists;

    const radarData = [
      {
        subject: "VEL",
        full: "Velocidade",
        val: Number(player.skills?.velocidade || 50),
      },
      {
        subject: "COR",
        full: "Físico / Corpo",
        val: Number(player.skills?.corpo || 50),
      },
      {
        subject: "CHU",
        full: "Chute",
        val: Number(player.skills?.chute || 50),
      },
      {
        subject: "MIR",
        full: "Mira / Precisão",
        val: Number(player.skills?.mira || 50),
      },
      {
        subject: "PAS",
        full: "Passe",
        val: Number(player.skills?.passe || 50),
      },
      {
        subject: "DEF",
        full: "Defesa",
        val: Number(player.skills?.defesa || 50),
      },
    ];

    const overall = Math.round(
      radarData.reduce((acc, item) => acc + item.val, 0) / radarData.length,
    );

    return {
      winRate,
      goalsPerGame,
      totalGA,
      radarData,
      overall,
    };
  }, [player, stats]);

  if (!player || !scoutMetrics) {
    return (
      <div className="empty-state-card">
        <div className="empty-state-icon">🎯</div>
        <h4>SCOUT INDIVIDUAL</h4>
        <p>
          Passe o mouse sobre um atleta na tabela para inspecionar o seu perfil
          e atributos.
        </p>
      </div>
    );
  }

  return (
    <aside className="player-profile-card ppg-glow-gold">
      {/* ==================== TOPO: AVATAR, OVERALL E NOME ==================== */}
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {player.photo ? (
              <img
                src={player.photo}
                alt={player.name}
                className="profile-avatar-img"
              />
            ) : (
              <span>{player.name.charAt(0)}</span>
            )}
          </div>
          <div className="profile-ovr-badge" title="Overall Médio de Atributos">
            <span className="ovr-num">{scoutMetrics.overall}</span>
            <span className="ovr-label">OVR</span>
          </div>
        </div>

        <h2 className="profile-name">{player.name}</h2>
        {player.position && (
          <span className="profile-pos-tag">{player.position}</span>
        )}
      </div>

      {/* ==================== 3 KPIS DE IMPACTO RÁPIDO ==================== */}
      <div className="profile-main-stats">
        <div className="stat-box">
          <span className="stat-val">{scoutMetrics.winRate}%</span>
          <span className="stat-lab">Vitórias</span>
        </div>
        <div className="stat-box">
          <span className="stat-val">{scoutMetrics.goalsPerGame}</span>
          <span className="stat-lab">Gols / J</span>
        </div>
        <div className="stat-box highlight">
          <span className="stat-val">{scoutMetrics.totalGA}</span>
          <span className="stat-lab">Part. (G+A)</span>
        </div>
      </div>

      {/* ==================== FICHA TÉCNICA ==================== */}
      <div className="profile-info-list">
        <div className="info-item">
          <span className="info-label">🏆 Títulos d'O ADR</span>
          <strong className="info-value">{player.titlesADR || 0}</strong>
        </div>
        <div className="info-item">
          <span className="info-label">🤝 Melhor Parceiro</span>
          <strong className="info-value">{bestPartner || "Nenhum"}</strong>
        </div>
        <div className="info-item">
          <span className="info-label">🦶 Perna Dominante</span>
          <strong className="info-value">
            {player.strongFoot || "Indefinida"}
          </strong>
        </div>
      </div>

      {/* ==================== GRÁFICO DE RADAR + PÍLULAS DE SKILLS ==================== */}
      <div className="profile-radar-section">
        <div className="radar-header-bar">
          <span>MAPA DE ATRIBUTOS</span>
        </div>

        <div className="radar-chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              cx="50%"
              cy="50%"
              outerRadius="68%"
              data={scoutMetrics.radarData}
            >
              <PolarGrid stroke="var(--radar-grid, rgba(255,255,255,0.12))" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{
                  fill: "var(--radar-text, #cbd5e1)",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Atributos"
                dataKey="val"
                stroke="var(--radar-cor, #d4af37)"
                strokeWidth={2}
                fill="var(--radar-cor, #d4af37)"
                fillOpacity={0.42}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade compacta com os valores numéricos das 6 skills */}
        <div className="radar-skills-mini-grid">
          {scoutMetrics.radarData.map((s) => (
            <div key={s.subject} className="skill-mini-pill" title={s.full}>
              <span className="skill-mini-key">{s.subject}</span>
              <strong className="skill-mini-val">{s.val}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== BOTÃO VER PERFIL + RODAPÉ ==================== */}
      <button
        type="button"
        className="profile-view-full-btn"
        onClick={() => navigate(`/player/${player.id}`)}
      >
        VER PERFIL COMPLETO ❯
      </button>

      <div className="profile-footer">
        <p>Temporada {new Date().getFullYear()}</p>
        <div className="badge-adr">
          <span className="text-adr">ATLETA D'O ADR</span>
          <span className="text-idr1">ATLETA IDR</span>
        </div>
      </div>
    </aside>
  );
}
