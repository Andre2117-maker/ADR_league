import React from "react";
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

  // Destaca o placar de quem está na frente (empate = nenhum)
  const leadA = Number(scoreA) > Number(scoreB);
  const leadB = Number(scoreB) > Number(scoreA);

  return (
    <div className="psg-match-banner">
      <div className="psg-banner-header">
        <span className="psg-status">FIM DE JOGO</span>
        <div className="psg-meta">
          <span className="psg-date">{match.date || "Data Indefinida"}</span>

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
              <span className={`psg-score-num ${leadA ? "is-leading" : ""}`}>
                {scoreA}
              </span>
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
              <span className={`psg-score-num ${leadB ? "is-leading" : ""}`}>
                {scoreB}
              </span>
            </div>
            <div className="psg-scorers">{getScorers("B")}</div>
          </div>
        </div>

        {/* LINHA DOS PÊNALTIS */}
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
        <div className="golden-goal-wrap">
          <div
            className="golden-goal-pill"
            onClick={() => setShowGoldenGoalInfo(!showGoldenGoalInfo)}
          >
            ⚽ Decidido no Gol de Ouro {showGoldenGoalInfo ? "▲" : "▼"}
          </div>
          {showGoldenGoalInfo && (
            <div className="golden-goal-info">
              <strong>Regra do Gol de Ouro:</strong>
              <br />O time{" "}
              <strong className="gold">
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
