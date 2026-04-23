import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import "./altar.css";

// Imports das fotos
import carlos1 from "../../assets/easteregg/carlos1.jpeg";
import carlos2 from "../../assets/easteregg/carlos2.jpeg";
import carlos3 from "../../assets/easteregg/carlos3.png";
import carlosVideo from "../../assets/easteregg/CARLOS10.mp4";

const Altar = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Confete ao entrar no Santuário
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#d4af37", "#ffffff", "#aa8920"],
    });
  }, []);

  return (
    <div className="altar-container">
      <div className="altar-content">
        <p className="dedication-text">
          PÁGINA DEDICADA AO NOSSO QUERIDO AMIGO CARLOS
        </p>

        <h1 className="glow-text">O MITO</h1>

        {/* FOTO PRINCIPAL COM AURA */}
        <div className="aura-wrapper">
          <div className="aura-effect"></div>
          <div className="altar-frame">
            <img
              src={carlos1}
              alt="Carlos Eduardo Silva Miller"
              className="carlos-img-main"
            />
          </div>
        </div>

        {/* GALERIA DOS TÍTULOS */}
        <div className="carlos-gallery">
          <div className="gallery-card">
            <div className="gallery-item">
              <img src={carlos2} alt="O Pensador" />
            </div>
            <span>O PENSADOR</span>
          </div>

          <div className="gallery-card">
            <div className="gallery-item">
              <img src={carlos3} alt="O Atleta" className="img-atleta" />
            </div>
            <span>O ATLETA</span>
          </div>
        </div>

        {/* --- NOVA SEÇÃO DE VÍDEO --- */}
        <div className="video-section">
          <h2 className="video-title">REGISTRO HISTÓRICO</h2>
          <div className="video-frame">
            <video
              src={carlosVideo}
              controls
              autoPlay
              muted
              loop
              className="carlos-video-player"
            />
          </div>
        </div>

        {/* BOX DE CONQUISTAS */}
        <div className="stats-container">
          <div className="stats-box">
            <h2>FEITOS LENDÁRIOS</h2>
            <ul>
              <li>Soco em Gustavo por questão de lugar</li>
              <li>Mora atualmente na Argentina</li>
              <li>Precisou de 14 pontos para passar</li>
              <li>Joga pelo time de e-sports do ADR</li>
            </ul>
          </div>

          <div className="stats-box red-stats">
            <h2>ESTATÍSTICAS NO TIME</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span>4</span> JOGOS
              </div>
              <div className="stat-item">
                <span>0</span> GOLS
              </div>
              <div className="stat-item">
                <span>0</span> ASSIST.
              </div>
            </div>
          </div>
        </div>

        <p className="motto">"CARLOS VOLTARÁ EM DOOMSDAY"</p>

        <button className="btn-exit" onClick={() => navigate("/")}>
          SAIR DO SANTUÁRIO
        </button>
      </div>
    </div>
  );
};

export default Altar;
