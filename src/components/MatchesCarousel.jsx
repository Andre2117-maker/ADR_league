import React, { useRef, useEffect } from "react";
import LogoADR from "../assets/logo.png";

function MatchesCarousel({ matches, players }) {
  const carouselRef = useRef(null);

  const validMatches = matches.filter((m) => m.events && m.events.length > 0);
  const infiniteMatches = [...validMatches, ...validMatches, ...validMatches];

  const CARD_WIDTH = 440;
  const GAP = 25;
  const TOTAL_SPACE = CARD_WIDTH + GAP;

  const getName = (id) => {
    const p = players.find((player) => String(player.id) === String(id));
    return p ? p.name : "Jogador";
  };

  const handleScroll = (direction) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const currentScroll = carousel.scrollLeft;
    const targetScroll =
      direction === "right"
        ? currentScroll + TOTAL_SPACE
        : currentScroll - TOTAL_SPACE;

    carousel.scrollTo({ left: targetScroll, behavior: "smooth" });

    const totalWidth = validMatches.length * TOTAL_SPACE;
    setTimeout(() => {
      if (!carousel) return;
      if (carousel.scrollLeft >= totalWidth * 2) {
        carousel.scrollLeft = totalWidth;
      } else if (carousel.scrollLeft <= TOTAL_SPACE) {
        carousel.scrollLeft = totalWidth + TOTAL_SPACE;
      }
    }, 600);
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel && validMatches.length > 0) {
      carousel.scrollLeft = validMatches.length * TOTAL_SPACE;
    }
  }, [validMatches.length, TOTAL_SPACE]);

  if (validMatches.length === 0) return null;

  return (
    <section className="mtc-section-full">
      <div className="mtc-header">
        <h2 className="mtc-main-title">
          ÚLTIMAS <span className="mtc-highlight">PARTIDAS</span>
        </h2>
        <div className="mtc-underline"></div>
      </div>

      <div className="mtc-carousel-window" ref={carouselRef}>
        <div className="mtc-track">
          {infiniteMatches.map((match, index) => {
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
            const penaltiesWinner = match.penaltiesWinner;

            return (
              <div key={`${match.id}-${index}`} className="mtc-card">
                <div className="mtc-card-header">ADR LEAGUE - 2026</div>

                <div className="mtc-info-center">
                  <span className="mtc-date-big">
                    {match.date?.split("-").reverse().join("/")}
                  </span>
                  <div className="mtc-venue">{match.venue || "ARENA ADR"}</div>
                </div>

                <div className="mtc-display-row">
                  {/* TIME A */}
                  <div className="mtc-team-col">
                    <img src={LogoADR} alt="L" className="mtc-team-logo" />
                    <span className="mtc-team-name">{match.teamA.name}</span>
                    <div className="mtc-stats-list">
                      {match.events
                        .filter(
                          (e) =>
                            e.team === "A" &&
                            (e.type === "GOAL" || e.type === "ASSIST"),
                        )
                        .map((e, i) => (
                          <p key={i} className="mtc-mini-stat">
                            {e.type === "GOAL" ? "⚽" : "🎯"}{" "}
                            {getName(e.playerId)}
                          </p>
                        ))}
                    </div>
                  </div>

                  <div className="mtc-score-container">
                    <div className="mtc-score-box">
                      <span className="mtc-score-val">{goalsA}</span>
                      <span className="mtc-score-vs">:</span>
                      <span className="mtc-score-val">{goalsB}</span>
                    </div>

                    {/* EXIBIÇÃO DOS PÊNALTIS */}
                    {penaltiesWinner && (
                      <div className="mtc-penalties-badge">
                        (P){" "}
                        {penaltiesWinner === "A"
                          ? match.teamA.name
                          : match.teamB.name}
                      </div>
                    )}
                  </div>

                  {/* TIME B */}
                  <div className="mtc-team-col">
                    <img src={LogoADR} alt="L" className="mtc-team-logo" />
                    <span className="mtc-team-name">{match.teamB.name}</span>
                    <div className="mtc-stats-list">
                      {match.events
                        .filter(
                          (e) =>
                            e.team === "B" &&
                            (e.type === "GOAL" || e.type === "ASSIST"),
                        )
                        .map((e, i) => (
                          <p key={i} className="mtc-mini-stat">
                            {e.type === "GOAL" ? "⚽" : "🎯"}{" "}
                            {getName(e.playerId)}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mtc-controls">
        <button className="mtc-nav-btn" onClick={() => handleScroll("left")}>
          ❮
        </button>
        <button className="mtc-nav-btn" onClick={() => handleScroll("right")}>
          ❯
        </button>
      </div>
    </section>
  );
}

export default MatchesCarousel;
