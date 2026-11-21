import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/footer.css";

// Patrocinadores ADR
import master from "../assets/master.png";
import patro1 from "../assets/patro1.png";
import patro2 from "../assets/patro2.png";

// Patrocinadores IDR (Adicione essas imagens na sua pasta assets)
import masterIdr from "../assets/IDR/Terere.png";
import patro1Idr from "../assets/IDR/FabianTV.png";
import patro2Idr from "../assets/IDR/bobbet.png";

// Patrocinadores ADR Classic (só dois: o terceiro quadro some nesse tema)
import masterclass from "../assets/ADRCLASSIC/Wilson.png";
import patro1class from "../assets/ADRCLASSIC/Arcoma.png";

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

const ArrowUp = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

/* bolhas que sobem no rodapé do tema Aero (posições fixas, sem sorteio) */
const BOLHAS_AERO = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 41 + 7) % 100,
  size: 8 + ((i * 17) % 26),
  delay: ((i * 7) % 16) * 0.55,
  dur: 7 + ((i * 5) % 7),
}));

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const [adrClicked, setAdrClicked] = useState(false);

  const handleAdrClick = () => {
    setAdrClicked(true);
    setTimeout(() => setAdrClicked(false), 5000);
    console.log("Sequência iniciada...");
  };

  const handlePiscinaClick = () => {
    if (adrClicked) {
      console.log("Easter Egg Ativado!");
      navigate("/quiz-secret");
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="sponsors-footer">
      {/* Marca d'água gigante ao fundo (troca ADR/IDR/AERO pelo tema) */}
      <span className="footer-watermark" aria-hidden="true">
        <span className="text-adr">ADR</span>
        <span className="text-idr">IDR</span>
        <span className="text-aero">AERO</span>
      </span>

      {/* só aparecem no tema Aero: ondas no topo e bolhas subindo */}
      <div className="ft-aero-waves" aria-hidden="true">
        <span className="ft-aero-wave w1" />
        <span className="ft-aero-wave w2" />
        <span className="ft-aero-wave w3" />
      </div>
      <div className="ft-aero-bubbles" aria-hidden="true">
        {BOLHAS_AERO.map((b, i) => (
          <span
            key={i}
            style={{
              left: `${b.left}%`,
              width: b.size,
              height: b.size,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
            }}
          />
        ))}
      </div>

      <div className="footer-container">
        {/* TEMA AERO: no lugar dos patrocinadores, o selo da edição secreta */}
        <div className="ft-aero-card">
          <span className="ft-aero-crest">
            <img src="/logo-aero.png" alt="Escudo ADR Aero" />
          </span>
          <div className="ft-aero-text">
            <span className="ft-aero-kicker">Edição secreta</span>
            <strong className="ft-aero-title">ADR Aero</strong>
            <p className="ft-aero-sub">
              Você achou o tema escondido. Aqui não tem patrocinador: só
              bolhas, ondas e o ADR.
            </p>
          </div>
          <span className="ft-aero-seal" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="8" cy="15" r="4.2" />
              <path d="M11 12l8.5-8.5M16.5 6.5l2.5 2.5M14.5 8.5l2 2" />
            </svg>
            Desbloqueado
          </span>
        </div>

        <div className="sponsors-wrapper">
          <p className="footer-label">PATROCINADORES OFICIAIS</p>

          <div className="sponsors-display">
            <div className="sponsor-item master">
              <span className="sponsor-tag">Master</span>
              <img
                src={master}
                alt="Patrocinador Master ADR"
                className="img-adr"
              />
              <img
                src={masterIdr}
                alt="Patrocinador Master IDR"
                className="img-idr"
              />
              <img
                src={masterclass}
                alt="Patrocinador Master ADR Classic"
                className="img-class"
              />
            </div>

            <div className="sponsor-item">
              <span className="sponsor-tag">Oficial</span>
              <img src={patro1} alt="Patrocinador 1 ADR" className="img-adr" />
              <img
                src={patro1Idr}
                alt="Patrocinador 1 IDR"
                className="img-idr"
              />
              <img
                src={patro1class}
                alt="Patrocinador 1 ADR Classic"
                className="img-class"
              />
            </div>

            {/* sem patrocinador no ADR Classic: esse quadro some nesse tema */}
            <div className="sponsor-item no-classic">
              <span className="sponsor-tag">Oficial</span>
              <img src={patro2} alt="Patrocinador 2 ADR" className="img-adr" />
              <img
                src={patro2Idr}
                alt="Patrocinador 2 IDR"
                className="img-idr"
              />
            </div>
          </div>
        </div>

        <div className="footer-mid">
          <a
            href="https://www.instagram.com/clube_do_adr/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            <InstagramIcon />
            <span>@clube_do_adr</span>
          </a>

          <div className="footer-motto">
            "Honra,
            <span className="egg-trigger" onClick={handlePiscinaClick}>
              {" "}
              Piscina
            </span>{" "}
            e Resenha"
          </div>

          <button
            type="button"
            className="footer-top-btn"
            onClick={scrollToTop}
          >
            <ArrowUp /> Topo
          </button>
        </div>

        <div className="footer-bottom">
          <p>
            © {currentYear}
            <span className="egg-trigger" onClick={handleAdrClick}>
              {" "}
              {/* Troca do texto ADR/IDR */}
              <span className="text-adr">ADR</span>
              <span className="text-idr">IDR</span>
            </span>{" "}
            LEAGUE — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
