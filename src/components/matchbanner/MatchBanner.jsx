import React, { useState } from "react";
import "./matchbanner.css";

const MatchBanner = ({ isAdmin }) => {
  const [banners, setBanners] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [formData, setFormData] = useState({
    title: "AMISTOSO",
    teamA: { name: "", logo: "" },
    teamB: { name: "", logo: "" },
    date: "",
    time: "",
    location: "",
    footerText: "ADR LEAGUE • AMISTOSO CONFIRMADO • PREPARE SUA TORCIDA •",
  });

  // Função para carregar imagem do PC
  const handleFile = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (target === "A")
        setFormData({ ...formData, teamA: { ...formData.teamA, logo: url } });
      else
        setFormData({ ...formData, teamB: { ...formData.teamB, logo: url } });
    }
  };

  const addBanner = () => {
    setBanners([...banners, formData]);
    setShowAdmin(false); // Fecha o painel após adicionar
  };

  return (
    <div className="banners-wrapper">
      {/* BOTÃO PARA ABRIR O ADMIN (Só aparece se for isAdmin) */}
      {isAdmin && (
        <button
          className="admin-toggle-btn"
          onClick={() => setShowAdmin(!showAdmin)}
        >
          {showAdmin ? "FECHAR EDITOR" : "⚙️ CONFIGURAR NOVO BANNER"}
        </button>
      )}

      {/* PAINEL DE EDIÇÃO (ADMIN) */}
      {showAdmin && (
        <div className="admin-internal-panel">
          <div className="admin-grid">
            <input
              type="text"
              placeholder="Título"
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Data (20/04)"
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Hora (19:00)"
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Local"
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />

            <div className="upload-group">
              <label>Logo Time A</label>
              <input type="file" onChange={(e) => handleFile(e, "A")} />
              <input
                type="text"
                placeholder="Nome Time A"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    teamA: { ...formData.teamA, name: e.target.value },
                  })
                }
              />
            </div>

            <div className="upload-group">
              <label>Logo Time B</label>
              <input type="file" onChange={(e) => handleFile(e, "B")} />
              <input
                type="text"
                placeholder="Nome Time B"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    teamB: { ...formData.teamB, name: e.target.value },
                  })
                }
              />
            </div>

            <input
              type="text"
              className="full-width"
              placeholder="Texto do Letreiro"
              onChange={(e) =>
                setFormData({ ...formData, footerText: e.target.value })
              }
            />
            <button className="confirm-btn" onClick={addBanner}>
              PUBLICAR BANNER
            </button>
          </div>
        </div>
      )}

      {/* RENDERIZAÇÃO DOS BANNERS (SEU CSS ATUAL) */}
      {banners.map((match, index) => (
        <div key={index} className="match-banner-container">
          <div className="banner-badge">{match.title}</div>
          <div className="banner-content">
            <div className="banner-team">
              <img src={match.teamA.logo} className="banner-logo" alt="logo" />
              <span className="banner-team-name">{match.teamA.name}</span>
            </div>
            <div className="banner-info">
              <div className="banner-datetime">
                <span className="b-date">{match.date}</span>
                <span className="b-divider">|</span>
                <span className="b-time">{match.time}</span>
              </div>
              <div className="banner-location">📍 {match.location}</div>
            </div>
            <div className="banner-team">
              <img src={match.teamB.logo} className="banner-logo" alt="logo" />
              <span className="banner-team-name">{match.teamB.name}</span>
            </div>
          </div>
          <div className="banner-footer">
            <div className="scrolling-text">{match.footerText}</div>
          </div>
          {isAdmin && (
            <button
              className="del-btn"
              onClick={() => setBanners(banners.filter((_, i) => i !== index))}
            >
              X
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MatchBanner;
