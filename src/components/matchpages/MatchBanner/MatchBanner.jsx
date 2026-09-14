import React from "react";
import { useNavigate } from "react-router-dom";
import "./MatchBanner.css";

export default function MatchBanner({
  match,
  scoreA,
  scoreB,
  getScorers,
  hasPenalties,
  showGoldenGoalInfo,
  setShowGoldenGoalInfo,
  isTimelineExpanded,
  setIsTimelineExpanded,
}) {
  const navigate = useNavigate();

  // ==========================================
  // TRATAMENTO DOS NOMES DOS TIMES (Fallback)
  // ==========================================
  const teamAName = match.teamA.externalName || match.teamA.name || "Time A";
  const teamBName = match.teamB.externalName || match.teamB.name || "Time B";

  // ==========================================
  // CÁLCULO DOS PÊNALTIS (Placar numérico)
  // ==========================================
  const penScoreA =
    match.penaltiesScoreA != null && match.penaltiesScoreA !== ""
      ? Number(match.penaltiesScoreA)
      : match.penalties?.A?.filter((p) => {
          const status = p?.result || p;
          return status === "goal" || status === "scored" || status === "green";
        }).length || 0;

  const penScoreB =
    match.penaltiesScoreB != null && match.penaltiesScoreB !== ""
      ? Number(match.penaltiesScoreB)
      : match.penalties?.B?.filter((p) => {
          const status = p?.result || p;
          return status === "goal" || status === "scored" || status === "green";
        }).length || 0;

  // Descobre quem venceu para dar o destaque no CSS
  const isWinnerA = penScoreA > penScoreB;
  const isWinnerB = penScoreB > penScoreA;

  return (
    <div className="psg-match-banner">
      <button className="psg-back-btn" onClick={() => navigate(-1)}>
        ❮ Voltar
      </button>

      <div className="psg-banner-header">
        <span className="psg-status">FIM DE JOGO</span>
        <div className="psg-meta">
          <span className="psg-date">{match.date || "Data Indefinida"}</span>

          {/* AQUI ESTÁ A MÁGICA DA FASE DO CAMPEONATO */}
          <span className="psg-comp">
            {match.type}
            {match.championshipPhase ? ` - ${match.championshipPhase}` : ""}
            {" • "}
            {match.venue ? match.venue : "Local não definido"}
          </span>
        </div>
      </div>

      <div className="psg-scoreboard">
        {/* LINHA DO TIME A */}
        <div className="psg-team-row">
          <img
            src={match.teamA.logo || "/logo.png"}
            alt="A"
            className="psg-logo"
          />
          <div className="psg-team-details">
            <div className="psg-name-score">
              <h2>{teamAName}</h2>
              <span className="psg-score-num">{scoreA}</span>
            </div>
            <div className="psg-scorers">{getScorers("A")}</div>
          </div>
        </div>

        {/* LINHA DO TIME B */}
        <div className="psg-team-row">
          <img
            src={match.teamB.logo || "/logo.png"}
            alt="B"
            className="psg-logo"
          />
          <div className="psg-team-details">
            <div className="psg-name-score">
              <h2>{teamBName}</h2>
              <span className="psg-score-num">{scoreB}</span>
            </div>
            <div className="psg-scorers">{getScorers("B")}</div>
          </div>
        </div>

        {/* ==========================================
            LINHA DOS PÊNALTIS (ESTILO IMAGEM PSG)
        ========================================== */}
        {hasPenalties && (
          <div className="psg-penalties-text-box">
            <span
              className={`pen-team ${isWinnerA ? "pen-winner" : "pen-loser"}`}
            >
              {teamAName} {penScoreA}
            </span>
            <span className="pen-divider">-</span>
            <span
              className={`pen-team ${isWinnerB ? "pen-winner" : "pen-loser"}`}
            >
              {penScoreB} {teamBName}
            </span>
          </div>
        )}
      </div>

      {match.goldenGoalWinner && (
        <div
          style={{
            textAlign: "center",
            marginTop: "12px",
            paddingBottom: "10px",
          }}
        >
          <div
            onClick={() => setShowGoldenGoalInfo(!showGoldenGoalInfo)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 15px",
              backgroundColor: "rgba(212, 175, 55, 0.15)",
              border: "1px solid #d4af37",
              borderRadius: "20px",
              color: "#ffd700",
              fontSize: "0.85rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            ⚽ Decidido no Gol de Ouro {showGoldenGoalInfo ? "▲" : "▼"}
          </div>
          {showGoldenGoalInfo && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px 15px",
                backgroundColor: "rgba(25, 25, 25, 0.9)",
                border: "1px solid rgba(212, 175, 55, 0.5)",
                borderRadius: "8px",
                color: "#eee",
                fontSize: "0.85rem",
                lineHeight: "1.4",
                maxWidth: "320px",
                margin: "10px auto 0 auto",
                textAlign: "center",
              }}
            >
              <strong>Regra do Gol de Ouro:</strong>
              <br />O time{" "}
              <strong style={{ color: "#ffd700" }}>
                {match.goldenGoalWinner === "A" ? teamAName : teamBName}
              </strong>{" "}
              marcou primeiro no desempate e venceu a partida.
            </div>
          )}
        </div>
      )}

      {/* SETA DE DROP DOWN PARA O HISTÓRICO */}
      <div
        className="psg-timeline-toggle"
        onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
      >
        {isTimelineExpanded ? "OCULTAR EVENTOS ▲" : "VER LINHA DO TEMPO ▼"}
      </div>
    </div>
  );
}
