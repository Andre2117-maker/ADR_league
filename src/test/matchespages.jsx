import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/matchpage.css";

function MatchPage({ matches, players, isAdmin, onUpdateMatch }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const pitchRef = useRef(null);

  // Encontra a partida atual
  const match = matches.find((m) => String(m.id) === String(id));

  if (!match) return <div className="loading">Partida não encontrada...</div>;

  // --- LÓGICA DE PLACAR (IGUAL AO CALENDÁRIO) ---
  const calculatedScoreA = match.events.filter(
    (e) =>
      (e.type === "GOAL" && match.teamA.players.includes(e.playerId)) ||
      (e.type === "OWN_GOAL" && match.teamB.players.includes(e.playerId)),
  ).length;

  const calculatedScoreB = match.events.filter(
    (e) =>
      (e.type === "GOAL" && match.teamB.players.includes(e.playerId)) ||
      (e.type === "OWN_GOAL" && match.teamA.players.includes(e.playerId)),
  ).length;

  const handleDragEnd = (e, playerId) => {
    if (!isAdmin) return;
    const rect = pitchRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const updatedMatch = {
      ...match,
      positions: {
        ...(match.positions || {}),
        [playerId]: {
          x: `${Math.max(5, Math.min(95, x)).toFixed(1)}%`,
          y: `${Math.max(5, Math.min(95, y)).toFixed(1)}%`,
        },
      },
    };
    if (onUpdateMatch) onUpdateMatch(updatedMatch);
  };

  const renderStats = (playerId) => {
    const goals = match.events.filter(
      (e) => e.playerId === playerId && e.type === "GOAL",
    ).length;
    const assists = match.events.filter(
      (e) => e.playerId === playerId && e.type === "ASSIST",
    ).length;

    // Verifica se o jogador é o goleiro salvo na partida
    const isGoalkeeper =
      String(match.teamA.goalkeeperId) === String(playerId) ||
      String(match.teamB.goalkeeperId) === String(playerId);

    if (goals === 0 && assists === 0 && !isGoalkeeper) return null;

    return (
      <div className="player-stats-floating">
        {isGoalkeeper && <span className="stat-emoji">🧤</span>}
        {"⚽".repeat(goals)}
        {"👟".repeat(assists)}
      </div>
    );
  };

  const renderPlayer = (pId) => {
    const p = players.find((player) => String(player.id) === String(pId));
    if (!p) return null;

    const pos = match.positions?.[pId] || { x: "50%", y: "50%" };

    return (
      <div
        key={p.id}
        className={`player-tactical ${isAdmin ? "adm-draggable" : ""}`}
        draggable={isAdmin}
        onDragEnd={(e) => handleDragEnd(e, p.id)}
        style={{ left: pos.x, top: pos.y }}
      >
        {renderStats(p.id)}

        <img
          src={p.photo || "/players/default.png"}
          className="player-img"
          alt=""
          draggable={false}
        />

        <div className="player-card-label">
          <span className="p-card-num">{p.number || "0"}</span>
          <span className="p-card-name">{p.name.split(" ")[0]}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="match-view-wrapper">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ❮ Voltar
      </button>

      {/* PLACAR CALCULADO DINAMICAMENTE */}
      <div className="scoreboard-modern">
        <div className="sb-content">
          <div className="team">
            {match.teamA.name}
            <span className="score-number">{calculatedScoreA}</span>
          </div>

          <div className="vs">VS</div>

          <div className="team">
            <span className="score-number">{calculatedScoreB}</span>
            {match.teamB.name}
          </div>
        </div>
      </div>

      <div className="pitch-container" ref={pitchRef}>
        <div className="pitch-grass">
          <div className="field-markings">
            <div className="center-circle"></div>
            <div className="center-line"></div>
            <div className="box-top"></div>
            <div className="box-bottom"></div>
          </div>

          {match.teamA.players.map((pId) => renderPlayer(pId))}
          {match.teamB.players.map((pId) => renderPlayer(pId))}
        </div>
      </div>
    </div>
  );
}

export default MatchPage;
