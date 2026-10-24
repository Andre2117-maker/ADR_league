import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import LogoADR from "../assets/logo.png";
import "../styles/Home/matchescarroussel.css";

function MatchesCarousel({ matches = [], players = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const navigate = useNavigate();

  const getName = useCallback(
    (id) => {
      if (id === "OPONENTE_EXTERNO") return "Oponente";
      const p = players.find((player) => String(player.id) === String(id));
      return p ? p.name : "Jogador";
    },
    [players],
  );

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => (b.order || 0) - (a.order || 0));
  }, [matches]);

  // Garante que o índice nunca fique fora do limite se a lista mudar
  useEffect(() => {
    if (currentIndex >= sortedMatches.length && sortedMatches.length > 0) {
      setCurrentIndex(0);
    }
  }, [sortedMatches.length, currentIndex]);

  const nextMatch = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === sortedMatches.length - 1 ? 0 : prev + 1,
    );
  }, [sortedMatches.length]);

  const prevMatch = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? sortedMatches.length - 1 : prev - 1,
    );
  }, [sortedMatches.length]);

  useEffect(() => {
    if (sortedMatches.length <= 1 || isPaused) return;
    const interval = setInterval(nextMatch, 6000);
    return () => clearInterval(interval);
  }, [nextMatch, sortedMatches.length, isPaused]);

  if (sortedMatches.length === 0) return null;

  const match = sortedMatches[currentIndex] || sortedMatches[0];
  const rawType = (match.type || "TREINO").toUpperCase();
  const matchType = rawType.toLowerCase();

  const typeLabelMap = {
    TREINO: "TREINO OFICIAL",
    AMISTOSO: "AMISTOSO",
    CAMPEONATO: "CAMPEONATO",
  };

  // Contagem de gols no tempo normal
  const goalsA =
    match.events?.filter(
      (e) =>
        (e.type === "GOAL" && e.team === "A") ||
        (e.type === "OWN_GOAL" && e.team === "B"),
    ).length || 0;

  const goalsB =
    match.events?.filter(
      (e) =>
        (e.type === "GOAL" && e.team === "B") ||
        (e.type === "OWN_GOAL" && e.team === "A"),
    ).length || 0;

  // Sistema de pênaltis (novo e antigo)
  const newPenaltiesA =
    match.penalties?.A?.length > 0
      ? match.penalties.A.filter((p) => p.result === "goal").length
      : null;

  const newPenaltiesB =
    match.penalties?.B?.length > 0
      ? match.penalties.B.filter((p) => p.result === "goal").length
      : null;

  const oldPenaltiesA =
    match.penaltiesScoreA !== undefined && match.penaltiesScoreA !== ""
      ? Number(match.penaltiesScoreA)
      : null;
  const oldPenaltiesB =
    match.penaltiesScoreB !== undefined && match.penaltiesScoreB !== ""
      ? Number(match.penaltiesScoreB)
      : null;

  const displayPenA = newPenaltiesA !== null ? newPenaltiesA : oldPenaltiesA;
  const displayPenB = newPenaltiesB !== null ? newPenaltiesB : oldPenaltiesB;

  const hasPenalties =
    displayPenA !== null &&
    displayPenB !== null &&
    (displayPenA > 0 || displayPenB > 0 || goalsA === goalsB);

  // Agrupa os goleadores para não repetir o mesmo nome várias vezes (Ex: "Jogador (2x)")
  const getGroupedScorers = (teamSide) => {
    const otherSide = teamSide === "A" ? "B" : "A";
    const relevantEvents =
      match.events?.filter(
        (e) =>
          (e.team === teamSide && e.type === "GOAL") ||
          (e.team === otherSide && e.type === "OWN_GOAL"),
      ) || [];

    const map = new Map();
    relevantEvents.forEach((e) => {
      const isOG = e.type === "OWN_GOAL";
      const name = e.externalName || getName(e.playerId);
      const key = `${name}_${isOG ? "OG" : "G"}`;
      if (!map.has(key)) {
        map.set(key, { name, isOG, count: 1 });
      } else {
        map.get(key).count += 1;
      }
    });

    return Array.from(map.values());
  };

  const scorersA = getGroupedScorers("A");
  const scorersB = getGroupedScorers("B");

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const clean = String(dateStr).split("T")[0];
    return clean.includes("-") ? clean.split("-").reverse().join("/") : clean;
  };

  // Suporte a gesto de arrastar (Swipe) no celular
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) {
      diff > 0 ? nextMatch() : prevMatch();
    }
    setTouchStartX(null);
  };

  return (
    <section
      className={`mtc-banner-container mtc-type-${matchType}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Luz de atmosfera superior */}
      <div className="mtc-ambient-glow" />

      {sortedMatches.length > 1 && (
        <>
          <button
            type="button"
            className="mtc-arrow left"
            onClick={prevMatch}
            aria-label="Partida anterior"
          >
            ❮
          </button>
          <button
            type="button"
            className="mtc-arrow right"
            onClick={nextMatch}
            aria-label="Próxima partida"
          >
            ❯
          </button>
        </>
      )}

      <div className="mtc-banner-content">
        {/* ==================== HEADER (CATEGORIA, LOCAL E DATA) ==================== */}
        <header className="mtc-banner-header">
          <div className="mtc-header-left">
            <span className="mtc-type-pill">
              {typeLabelMap[rawType] || rawType}
            </span>
            <span className="mtc-venue-top">
              📍 {match.venue || "ARENA O ADR"}
              {match.championshipPhase && ` • ${match.championshipPhase}`}
            </span>
          </div>

          <div className="mtc-header-right">
            {match.goldenGoalWinner && (
              <span className="mtc-special-tag">⚡ GOL DE OURO</span>
            )}
            <span className="mtc-match-date">{formatDate(match.date)}</span>
          </div>
        </header>

        {/* ==================== PLACAR E CONFRONTO PRINCIPAL ==================== */}
        <div className="mtc-main-display">
          {/* TIME A */}
          <div className="mtc-team-box team-a">
            <div className="mtc-logo-halo">
              <img
                src={match.teamA?.logo || LogoADR}
                alt={match.teamA?.name || "Time A"}
                className="mtc-banner-logo"
              />
            </div>
            <h2 className="mtc-team-name-large">{match.teamA?.name}</h2>

            {scorersA.length > 0 && (
              <div className="mtc-scorers-list">
                {scorersA.map((s, i) => (
                  <span
                    key={i}
                    className={`mtc-scorer-chip ${s.isOG ? "is-og" : ""}`}
                  >
                    ⚽ {s.name}
                    {s.count > 1 && <strong> ({s.count}x)</strong>}
                    {s.isOG && <em> (GC)</em>}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* COLUNA CENTRAL (PLACAR + BOTÃO DETALHES) */}
          <div className="mtc-central-column">
            <div className="mtc-score-card">
              <div className="mtc-score-row">
                <span className="mtc-big-num">{goalsA}</span>
                <span className="mtc-vs-divider">:</span>
                <span className="mtc-big-num">{goalsB}</span>
              </div>

              {hasPenalties && (
                <div className="mtc-penalties-bar">
                  <span>PÊNALTIS:</span>
                  <strong>
                    {displayPenA} - {displayPenB}
                  </strong>
                </div>
              )}
            </div>

            <button
              type="button"
              className="mtc-details-btn"
              onClick={() => navigate(`/match/${match.id}`)}
            >
              VER COMPLETO ❯
            </button>
          </div>

          {/* TIME B */}
          <div className="mtc-team-box team-b">
            <div className="mtc-logo-halo">
              <img
                src={match.teamB?.logo || LogoADR}
                alt={match.teamB?.name || "Time B"}
                className="mtc-banner-logo"
              />
            </div>
            <h2 className="mtc-team-name-large">{match.teamB?.name}</h2>

            {scorersB.length > 0 && (
              <div className="mtc-scorers-list">
                {scorersB.map((s, i) => (
                  <span
                    key={i}
                    className={`mtc-scorer-chip ${s.isOG ? "is-og" : ""}`}
                  >
                    ⚽ {s.name}
                    {s.count > 1 && <strong> ({s.count}x)</strong>}
                    {s.isOG && <em> (GC)</em>}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INDICADORES INFERIORES (DOTS) */}
      {sortedMatches.length > 1 && (
        <div className="mtc-dots">
          {sortedMatches.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`mtc-dot ${i === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Ir para partida ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default MatchesCarousel;
