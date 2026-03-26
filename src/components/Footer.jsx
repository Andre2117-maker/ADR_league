import React, { useState } from "react"; // Adicionamos o useState
import { useNavigate } from "react-router-dom";
import "../styles/footer.css";

import master from "../assets/master.png";
import patro1 from "../assets/patro1.png";
import patro2 from "../assets/patro2.png";

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
  const navigate = useNavigate();

  // ESTADO DO EASTER EGG
  // false = nada clicado | true = clicou em ADR, esperando Piscina
  const [adrClicked, setAdrClicked] = useState(false);

  const handleAdrClick = () => {
    setAdrClicked(true);
    // Opcional: define um tempo para resetar se ele não clicar em piscina logo
    setTimeout(() => setAdrClicked(false), 5000); // 5 segundos para completar a sequência
    console.log("Sequência iniciada...");
  };

  const handlePiscinaClick = () => {
    if (adrClicked) {
      console.log("Easter Egg Ativado!");
      navigate("/quiz-secret"); // Abre a página
    }
  };

  return (
    <footer className="sponsors-footer">
      <div className="footer-container">
        {/* Seção de Patrocinadores (Mantenha seu código original aqui) */}
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

        {/* Rodapé Final com a Sequência */}
        <div className="footer-bottom">
          <p>
            © {currentYear}
            <span className="egg-trigger" onClick={handleAdrClick}>
              {" "}
              ADR
            </span>{" "}
            LEAGUE — Todos os direitos reservados.
          </p>
          <div className="footer-motto">
            "Honra,
            <span className="egg-trigger" onClick={handlePiscinaClick}>
              {" "}
              Piscina
            </span>{" "}
            e Resenha"
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
