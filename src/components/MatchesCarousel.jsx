import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import LogoADR from "../assets/logo.png";
import "../styles/Home/matchescarroussel.css";

function MatchesCarousel({ matches, players }) {
  const [currentIndex, setCurrentIndex] = useState(0);
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
    if (sortedMatches.length <= 1) return;
    const interval = setInterval(nextMatch, 6000);
    return () => clearInterval(interval);
  }, [nextMatch, sortedMatches.length]);

  if (sortedMatches.length === 0) return null;

  const match = sortedMatches[currentIndex];
  const matchType = (match.type || "TREINO").toLowerCase();

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

  const hasPenalties =
    match.penaltiesScoreA !== null &&
    match.penaltiesScoreA !== undefined &&
    match.penaltiesScoreA !== "";

  return (
    <section className={`mtc-banner-container mtc-type-${matchType}`}>
      <button className="mtc-arrow left" onClick={prevMatch}>
        ❮
      </button>
      <button className="mtc-arrow right" onClick={nextMatch}>
        ❯
      </button>

      <div className="mtc-banner-content">
        <header className="mtc-banner-header">
          <span className="mtc-venue-top">📍 {match.venue || "ARENA ADR"}</span>
          <span className="mtc-match-date">
            {match.date?.split("-").reverse().join("/")}
          </span>
        </header>

        <div className="mtc-main-display">
          {/* TIME A */}
          <div className="mtc-team-box">
            <img
              src={match.teamA.logo || LogoADR}
              alt="Logo A"
              className="mtc-banner-logo"
            />
            <h2 className="mtc-team-name-large">{match.teamA.name}</h2>
            <div className="mtc-scorers-list left-align">
              {match.events
                ?.filter(
                  (e) =>
                    (e.team === "A" && e.type === "GOAL") ||
                    (e.team === "B" && e.type === "OWN_GOAL"),
                )
                .map((e, i) => (
                  <span key={i} className="mtc-scorer">
                    {e.type === "OWN_GOAL"
                      ? `${e.externalName || getName(e.playerId)} (GC) `
                      : `${getName(e.playerId)} ⚽`}
                  </span>
                ))}
            </div>
          </div>

          {/* PLACAR CENTRAL */}
          <div className="mtc-central-column">
            <div className="mtc-score-wrapper">
              <div className="mtc-score-unit">
                <span className="mtc-big-num">{goalsA}</span>
                {hasPenalties && (
                  <span className="mtc-penalty-small">
                    ({match.penaltiesScoreA})
                  </span>
                )}
              </div>
              <span className="mtc-vs-text">X</span>
              <div className="mtc-score-unit">
                {hasPenalties && (
                  <span className="mtc-penalty-small">
                    ({match.penaltiesScoreB})
                  </span>
                )}
                <span className="mtc-big-num">{goalsB}</span>
              </div>
            </div>

            <button
              className="mtc-details-btn"
              onClick={() => navigate(`/match/${match.id}`)}
            >
              VIEW DETAILS
            </button>
          </div>

          {/* TIME B */}
          <div className="mtc-team-box">
            <img
              src={match.teamB.logo || LogoADR}
              alt="Logo B"
              className="mtc-banner-logo"
            />
            <h2 className="mtc-team-name-large">{match.teamB.name}</h2>
            <div className="mtc-scorers-list right-align">
              {match.events
                ?.filter(
                  (e) =>
                    (e.team === "B" && e.type === "GOAL") ||
                    (e.team === "A" && e.type === "OWN_GOAL"),
                )
                .map((e, i) => (
                  <span key={i} className="mtc-scorer">
                    {e.type === "OWN_GOAL"
                      ? `🔴 ${getName(e.playerId)} (GC)`
                      : `⚽ ${e.externalName || getName(e.playerId)}`}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mtc-dots">
        {sortedMatches.map((_, i) => (
          <div
            key={i}
            className={`mtc-dot ${i === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}

export default MatchesCarousel;
