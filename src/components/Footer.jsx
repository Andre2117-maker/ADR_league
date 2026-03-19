import React from "react";
import "../styles/footer.css";

// Assets - Certifique-se de que os caminhos estão corretos
import master from "../assets/master.png";
import patro1 from "../assets/patro1.png";
import patro2 from "../assets/patro2.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="sponsors-footer">
      <div className="footer-container">
        {/* Seção de Patrocinadores */}
        <div className="sponsors-wrapper">
          <p className="footer-label">PATROCINADORES OFICIAIS</p>

          <div className="sponsors-display">
            <div className="sponsor-item master">
              <img src={master} alt="Patrocinador Master" />
            </div>

            <div className="footer-divider"></div>

            <div className="sponsors-secondary">
              <div className="sponsor-item">
                <img src={patro1} alt="Patrocinador 1" />
              </div>
              <div className="sponsor-item">
                <img src={patro2} alt="Patrocinador 2" />
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Final */}
        <div className="footer-bottom">
          <p>© {currentYear} ADR LEAGUE — Todos os direitos reservados.</p>
          <div className="footer-motto">"Honra, Suor e Resenha"</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
