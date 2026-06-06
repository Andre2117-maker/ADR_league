import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/navbar.css";

function Navbar({ isAdmin, logout }) {
  // Removido setPage pois não usaremos mais estados
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`nvb-wrapper ${scrolled ? "nvb-on-scroll" : "nvb-top"}`}>
      <div className="nvb-container">
        {/* Esquerda */}
        <nav className="nvb-section nvb-left">
          <Link to="/" className="nvb-link">
            Início
          </Link>
          <Link to="/calendar" className="nvb-link">
            Calendário
          </Link>
          <Link to="/estatisticas" className="nvb-link">
            Estatísticas
          </Link>
        </nav>

        {/* Centro (Logo) */}
        <Link to="/" className="nvb-brand" style={{ textDecoration: "none" }}>
          <img src={logo} alt="ADR League Logo" className="nvb-logo-img" />
          <div className="nvb-brand-text">
            ADR <span className="nvb-highlight">LEAGUE</span>
          </div>
        </Link>

        {/* Direita */}
        <nav className="nvb-section nvb-right">
          <Link to="/regras" className="nvb-link">
            Regras
          </Link>
          <Link
            to="/dream-team"
            className="nvb-link"
            style={{ fontWeight: "600" }}
          >
            Dream Team
          </Link>
          <Link to="/about" className="nvb-link">
            Sobre nós
          </Link>

          {isAdmin ? (
            <div className="nvb-admin-group">
              <Link to="/admin-panel" className="nvb-admin-badge">
                Painel
              </Link>
              <button className="nvb-logout-btn" onClick={logout}>
                Sair
              </button>
            </div>
          ) : (
            <Link to="/admin-login" className="nvb-login-btn">
              Acesso Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
