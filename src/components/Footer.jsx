import React from "react";
import "../styles/footer.css";

import master from "../assets/master.png";
import patro1 from "../assets/patro1.png";
import patro2 from "../assets/patro2.png";

// Ícones SVG (Sem dependência de biblioteca, 100% seguro)
const InstagramIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

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

        <div className="footer-divider"></div>

        {/* REDES SOCIAIS (Agora usando os SVGs internos) */}
        <div className="footer-socials">
          <a
            href="https://www.instagram.com/clube_do_adr/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            <InstagramIcon />
          </a>
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
