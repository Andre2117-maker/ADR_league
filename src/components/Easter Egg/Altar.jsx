import React from "react";
import { useNavigate } from "react-router-dom";
import "./altar.css";

// Imports corretos conforme sua pasta
import carlos1 from "../../assets/easteregg/carlos1.jpeg";
import carlos2 from "../../assets/easteregg/carlos2.jpeg";
import carlos3 from "../../assets/easteregg/carlos3.png";

const Altar = () => {
  const navigate = useNavigate();

  return (
    <div className="altar-container">
      {/* Eye of the Tiger - YouTube ID: btPJPFnesVw */}
      <iframe
        width="0"
        height="0"
        src="https://www.youtube.com/embed/btPJPFnesVw?autoplay=1"
        frameBorder="0"
        allow="autoplay"
        title="Eye of the Tiger"
      ></iframe>

      <div className="altar-content">
        <p className="dedication-text">
          PÁGINA DEDICADA AO NOSSO QUERIDO AMIGO CARLOS
        </p>

        <h1 className="glow-text">O MITO</h1>

        {/* FOTO PRINCIPAL (carlos1) */}
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

        {/* GALERIA (carlos2 e carlos3) */}
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

        <div className="stats-container">
          <div className="stats-box">
            <h2>FEITOS LENDÁRIOS</h2>
            <ul>
              <li>Carlos deu um soco em Gustavo por questão de lugar</li>
              <li>Carlos mora atualmente na argentina</li>
              <li>
                Carlos precisou de 14 pontos pra passar em certas matérias
              </li>
              <li>Carlos atualmente joga pelo time de easport do adr</li>
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
