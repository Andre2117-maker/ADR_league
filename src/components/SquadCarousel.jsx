import React, { useRef, useEffect } from "react";
import ALL from "../assets/ALL.png";
import "../styles/matches.css";

function SquadCarousel({ players, onSelectPlayer }) {
  const carouselRef = useRef(null);

  // 1. Filtra (remove anônimos), ordena e TRIPLICA a lista para o efeito infinito
  const baseSquad = [...players]
    .filter((p) => !p.isAnonymous) // Remove os anônimos aqui
    .sort((a, b) => a.name.localeCompare(b.name));

  const infiniteSquad = [...baseSquad, ...baseSquad, ...baseSquad];

  const CARD_FULL_WIDTH = 305; // 280px (card) + 25px (gap)

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel && baseSquad.length > 0) {
      const middleIndex = baseSquad.length;
      carousel.scrollLeft = middleIndex * CARD_FULL_WIDTH;
    }
  }, [baseSquad.length]);

  const handleScroll = (direction) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const totalContentWidth = baseSquad.length * CARD_FULL_WIDTH;

    if (direction === "left") {
      carousel.scrollBy({ left: -CARD_FULL_WIDTH, behavior: "smooth" });
    } else {
      carousel.scrollBy({ left: CARD_FULL_WIDTH, behavior: "smooth" });
    }

    // Reset Invisível
    setTimeout(() => {
      if (carousel.scrollLeft >= totalContentWidth * 2) {
        carousel.scrollLeft = totalContentWidth;
      }
      if (carousel.scrollLeft <= CARD_FULL_WIDTH) {
        carousel.scrollLeft = totalContentWidth + CARD_FULL_WIDTH;
      }
    }, 500);
  };

  return (
    <section className="sqd-container-full">
      <div className="sqd-header">
        <h2 className="sqd-title">
          ELENCO <span className="sqd-highlight">ADR</span>
        </h2>
        <div className="sqd-underline"></div>
      </div>

      <div className="sqd-carousel-window" ref={carouselRef}>
        <div className="sqd-track">
          {infiniteSquad.map((player, index) => (
            <div
              key={`${player.id}-${index}`}
              className="sqd-player-card"
              onClick={() => onSelectPlayer(player)}
            >
              <div className="sqd-photo-area">
                {player.isAllStar && (
                  <img src={ALL} className="sqd-badge-icon" alt="All Star" />
                )}

                {/* CANTO DIREITO: Número da Camisa */}
                {player.number && (
                  <div className="player-number-badge">{player.number}</div>
                )}

                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="sqd-player-img"
                  />
                ) : (
                  <div className="sqd-placeholder">{player.name.charAt(0)}</div>
                )}

                <div className="sqd-card-overlay">
                  <div className="sqd-info">
                    <span className="sqd-name">
                      {player.name.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sqd-controls">
        <button className="sqd-nav-btn" onClick={() => handleScroll("left")}>
          ❮
        </button>
        <button className="sqd-nav-btn" onClick={() => handleScroll("right")}>
          ❯
        </button>
      </div>
    </section>
  );
}

export default SquadCarousel;
