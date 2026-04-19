import React from "react";
import "./matchbanner.css";

const MatchBanner = ({ matches }) => {
  // Se não houver partidas ou a lista estiver vazia, não renderiza nada
  if (!matches || matches.length === 0) return null;

  return (
    <div className="banners-wrapper">
      {matches.map((match, index) => (
        <div key={index} className="match-banner-container">
          <div className="banner-badge">
            {match.title || "PRÓXIMO CONFRONTO"}
          </div>

          <div className="banner-content">
            {/* TIME A */}
            <div className="banner-team">
              <div className="logo-upload-area">
                <img
                  src={match.teamA.logo}
                  alt={match.teamA.name}
                  className="banner-logo"
                />
              </div>
              <span className="banner-team-name">{match.teamA.name}</span>
            </div>

            {/* INFO CENTRAL */}
            <div className="banner-info">
              <div className="banner-datetime">
                <span className="b-date">{match.date}</span>
                <span className="b-divider">|</span>
                <span className="b-time">{match.time}</span>
              </div>
              <div className="banner-location">
                <span className="icon-loc">📍</span> {match.location}
              </div>
            </div>

            {/* TIME B */}
            <div className="banner-team">
              <div className="logo-upload-area">
                <img
                  src={match.teamB.logo}
                  alt={match.teamB.name}
                  className="banner-logo"
                />
              </div>
              <span className="banner-team-name">{match.teamB.name}</span>
            </div>
          </div>

          <div className="banner-footer">
            <div className="scrolling-text">
              ADR LEAGUE • AMISTOSO CONFIRMADO • PREPARE SUA TORCIDA • ADR
              LEAGUE •
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchBanner;
