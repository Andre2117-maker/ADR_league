import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase"; // Importe seu db do firebase
import { doc, updateDoc } from "firebase/firestore";
import "../styles/matchpage.css";

function MatchPage({ matches, players, isAdmin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const pitchRef = useRef(null);

  // Encontra a partida atual no array que vem do Firebase (via props)
  const match = matches.find((m) => String(m.id) === String(id));

  if (!match) return <div className="loading">Partida não encontrada...</div>;

  // --- LÓGICA DE PLACAR ---
  const calculatedScoreA = match.events.filter(
    (e) =>
      (e.type === "GOAL" && e.team === "A") ||
      (e.type === "OWN_GOAL" && e.team === "B"),
  ).length;

  const calculatedScoreB = match.events.filter(
    (e) =>
      (e.type === "GOAL" && e.team === "B") ||
      (e.type === "OWN_GOAL" && e.team === "A"),
  ).length;

  // --- ATUALIZAÇÃO TÁTICA NO FIREBASE ---
  const handleDragEnd = async (e, playerId) => {
    if (!isAdmin) return;

    const rect = pitchRef.current.getBoundingClientRect();
    // Cálculo de porcentagem para manter responsivo em qualquer tela
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Limites para o jogador não sair do campo
    const safeX = `${Math.max(5, Math.min(95, x)).toFixed(1)}%`;
    const safeY = `${Math.max(5, Math.min(95, y)).toFixed(1)}%`;

    try {
      const matchRef = doc(db, "matches", match.id);
      // Atualiza apenas o campo 'positions' dentro do documento da partida
      await updateDoc(matchRef, {
        [`positions.${playerId}`]: { x: safeX, y: safeY },
      });
    } catch (error) {
      console.error("Erro ao salvar posição:", error);
    }
  };

  const renderStats = (playerId) => {
    const goals = match.events.filter(
      (e) => e.playerId === playerId && e.type === "GOAL",
    ).length;
    const assists = match.events.filter(
      (e) => e.playerId === playerId && e.type === "ASSIST",
    ).length;

    const isGoalkeeper =
      String(match.teamA.goalkeeperId) === String(playerId) ||
      String(match.teamB.goalkeeperId) === String(playerId);

    if (goals === 0 && assists === 0 && !isGoalkeeper) return null;

    return (
      <div className="player-stats-floating">
        <span className="stat-emoji-wrapper">
          {isGoalkeeper && <span className="stat-emoji">🧤</span>}
          {goals > 0 && <span>{"⚽".repeat(goals)}</span>}
          {assists > 0 && <span>{"👟".repeat(assists)}</span>}
        </span>
      </div>
    );
  };

  const renderPlayer = (pId) => {
    const p = players.find((player) => String(player.id) === String(pId));
    if (!p) return null;

    // Pega a posição do Firebase ou centraliza se for a primeira vez
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
          alt={p.name}
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

      <div className="scoreboard-modern">
        <div className="sb-content">
          <div className="team">
            {match.teamA.name}
            <span className="score-number">{calculatedScoreA}</span>
          </div>
          <div className="vs">{match.penaltiesWinner ? "PEN" : "VS"}</div>
          <div className="team">
            <span className="score-number">{calculatedScoreB}</span>
            {match.teamB.name}
          </div>
        </div>
        {match.penaltiesWinner && (
          <div className="penalties-winner-label">
            Vencedor Pênaltis:{" "}
            {match.penaltiesWinner === "A"
              ? match.teamA.name
              : match.teamB.name}
          </div>
        )}
      </div>

      <div className="pitch-container" ref={pitchRef}>
        <div className="pitch-grass">
          <div className="field-markings">
            <div className="center-circle"></div>
            <div className="center-line"></div>
            <div className="box-top"></div>
            <div className="box-bottom"></div>
          </div>

          {/* Renderiza jogadores de ambos os times no campo */}
          {match.teamA.players.map((pId) => renderPlayer(pId))}
          {match.teamB.players.map((pId) => renderPlayer(pId))}
        </div>
      </div>
    </div>
  );
}

export default MatchPage;
