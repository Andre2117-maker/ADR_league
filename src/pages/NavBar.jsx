import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";

function Navbar({ setPage, isAdmin, logout }) {
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
          <a className="nvb-link" onClick={() => setPage("home")}>
            Início
          </a>
          <a className="nvb-link" onClick={() => setPage("Calendar")}>
            Calendário
          </a>
        </nav>

        {/* Centro (Logo) */}
        <div className="nvb-brand" onClick={() => setPage("home")}>
          <img src={logo} alt="ADR League Logo" className="nvb-logo-img" />
          <div className="nvb-brand-text">
            ADR <span className="nvb-highlight">LEAGUE</span>
          </div>
        </div>

        {/* Direita */}
        <nav className="nvb-section nvb-right">
          <a className="nvb-link" onClick={() => setPage("regras")}>
            Regras
          </a>

          {isAdmin ? (
            <div className="nvb-admin-group">
              <a
                onClick={() => setPage("adminPanel")}
                className="nvb-admin-badge"
              >
                Painel
              </a>
              <button className="nvb-logout-btn" onClick={logout}>
                Sair
              </button>
            </div>
          ) : (
            <button
              className="nvb-login-btn"
              onClick={() => setPage("adminLogin")}
            >
              Acesso Admin
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
