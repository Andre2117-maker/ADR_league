import React from "react";
import "./matchbanner.css";

const MatchBanner = ({ matches }) => {
  // Se não houver partidas ou a lista estiver vazia, não renderiza nada
  if (!matches || matches.length === 0) return null;

  // Função para trocar a imagem localmente (apenas visual para o admin antes de salvar)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      // Aqui você poderia atualizar o estado no componente pai,
      // mas por enquanto ele serve para visualizar o preview.
      const imgElement = e.target.parentElement.querySelector(".banner-logo");
      if (imgElement) imgElement.src = url;
    }
  };

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
                <input
                  type="file"
                  className="banner-file-input"
                  onChange={(e) => handleImageChange(e, index, "A")}
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
                <input
                  type="file"
                  className="banner-file-input"
                  onChange={(e) => handleImageChange(e, index, "B")}
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
