import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // 1. Importar o hook
import LogoADR from "../assets/logo.png";
import "../styles/matchescarroussel.css";

function MatchesCarousel({ matches, players }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate(); // 2. Inicializar o navigate

  const getName = useCallback(
    (id) => {
      const p = players.find((player) => String(player.id) === String(id));
      return p ? p.name : "Jogador";
    },
    [players],
  );

  const sortedMatches = useMemo(() => {
    return [...matches]
      .filter((m) => m.events && m.events.length > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
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
    const interval = setInterval(nextMatch, 5000);
    return () => clearInterval(interval);
  }, [nextMatch, sortedMatches.length]);

  if (sortedMatches.length === 0) return null;

  const match = sortedMatches[currentIndex];

  const goalsA = match.events.filter(
    (e) =>
      (e.type === "GOAL" && e.team === "A") ||
      (e.type === "OWN_GOAL" && e.team === "B"),
  ).length;
  const goalsB = match.events.filter(
    (e) =>
      (e.type === "GOAL" && e.team === "B") ||
      (e.type === "OWN_GOAL" && e.team === "A"),
  ).length;

  return (
    <section className="mtc-banner-container">
      <button className="mtc-arrow left" onClick={prevMatch}>
        ❮
      </button>
      <button className="mtc-arrow right" onClick={nextMatch}>
        ❯
      </button>

      <div className="mtc-banner-content">
        <div className="mtc-banner-header">
          <span className="mtc-league-tag">ADR LEAGUE 2026</span>
          <span className="mtc-match-date">
            {match.date?.split("-").reverse().join("/")}
          </span>
        </div>

        <div className="mtc-main-display">
          <div className="mtc-team-box">
            <img src={LogoADR} alt="Logo" className="mtc-banner-logo" />
            <h2 className="mtc-team-name-large">{match.teamA.name}</h2>
            <div className="mtc-scorers-list left-align">
              {match.events
                .filter(
                  (e) =>
                    e.team === "A" &&
                    (e.type === "GOAL" || e.type === "OWN_GOAL"),
                )
                .map((e, i) => (
                  <span key={i} className="mtc-scorer">
                    {e.type === "GOAL"
                      ? `${getName(e.playerId)} ⚽`
                      : `${getName(e.playerId)} (GC) ⚽`}
                  </span>
                ))}
            </div>
          </div>

          <div className="mtc-central-column">
            <div className="mtc-score-wrapper">
              <span className="mtc-big-num">{goalsA}</span>
              <span className="mtc-vs-text">X</span>
              <span className="mtc-big-num">{goalsB}</span>
            </div>

            {(match.penaltiesWinner || match.penaltyWinner) && (
              <div className="mtc-penalties-winner-label">
                Venceu nos pênaltis: <br />
                <strong>
                  {match.penaltiesWinner === "A" || match.penaltyWinner === "A"
                    ? match.teamA.name
                    : match.teamB.name}
                </strong>
              </div>
            )}
            <div className="mtc-venue-label">
              📍 {match.venue || "ARENA ADR"}
            </div>
          </div>

          <div className="mtc-team-box">
            <img src={LogoADR} alt="Logo" className="mtc-banner-logo" />
            <h2 className="mtc-team-name-large">{match.teamB.name}</h2>
            <div className="mtc-scorers-list right-align">
              {match.events
                .filter(
                  (e) =>
                    e.team === "B" &&
                    (e.type === "GOAL" || e.type === "OWN_GOAL"),
                )
                .map((e, i) => (
                  <span key={i} className="mtc-scorer">
                    {e.type === "GOAL"
                      ? `⚽ ${getName(e.playerId)}`
                      : `⚽ (GC) ${getName(e.playerId)}`}
                  </span>
                ))}
            </div>
          </div>
        </div>

        <div className="mtc-footer-actions">
          {/* 3. Redirecionamento configurado aqui */}
          <button
            className="mtc-details-btn"
            onClick={() => navigate(`/match/${match.id}`)}
          >
            VIEW DETAILS
          </button>
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
