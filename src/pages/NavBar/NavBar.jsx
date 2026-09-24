import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import logoIdr from "../../assets/IDR.png";
import "./navbar.css";

function Navbar({ isAdmin, logout }) {
  const [scrolled, setScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [openMenus, setOpenMenus] = useState({
    home: false,
    elenco: false,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => {
    setIsSidebarOpen(false);

    setOpenMenus({ home: false, elenco: false });
  };

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  return (
    <>
      <header
        className={`nvb-wrapper ${scrolled ? "nvb-on-scroll" : "nvb-top"}`}
      >
        <div className="nvb-container">
          <div className="nvb-section nvb-left">
            <div className="nvb-hamburger" onClick={toggleSidebar}>
              <div className="line"></div>
              <div className="line"></div>
              <div className="line"></div>
            </div>
          </div>

          <Link
            to="/"
            className="nvb-brand"
            onClick={closeSidebar}
            style={{ textDecoration: "none" }}
          >
            {/* As duas logos renderizadas (o CSS decide qual mostrar) */}
            <img
              src={logo}
              alt="ADR League Logo"
              className="nvb-logo-img logo-adr"
            />
            <img
              src={logoIdr}
              alt="IDR League Logo"
              className="nvb-logo-img logo-idr"
            />

            <div className="nvb-brand-text">
              {/* Os dois textos renderizados (o CSS decide qual mostrar) */}
              <span className="text-adr">ADR</span>
              <span className="text-idr">IDR</span>{" "}
              <span className="nvb-highlight">LEAGUE</span>
            </div>
          </Link>

          <div className="nvb-section nvb-right">
            {isAdmin ? (
              <div className="nvb-admin-group">
                <Link
                  to="/admin-panel"
                  className="nvb-admin-badge"
                  onClick={closeSidebar}
                >
                  Painel
                </Link>
                <button
                  className="nvb-logout-btn"
                  onClick={() => {
                    logout();
                    closeSidebar();
                  }}
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link
                to="/admin-login"
                className="nvb-login-btn"
                onClick={closeSidebar}
              >
                Acesso Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <div
        className={`nvb-sidebar-overlay ${isSidebarOpen ? "visible" : ""}`}
        onClick={closeSidebar}
      ></div>

      <div className={`nvb-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="nvb-sidebar-header">
          <span className="nvb-sidebar-title">MENU</span>
          <button className="nvb-sidebar-close" onClick={closeSidebar}>
            &times;
          </button>
        </div>

        <nav className="nvb-sidebar-links">
          {/* MENU INÍCIO COM SUBDIVISÕES */}
          <div className="nvb-side-item-group">
            <div className="nvb-side-item-main">
              <Link to="/" className="nvb-side-link" onClick={closeSidebar}>
                Início
              </Link>
              <button
                className={`nvb-sub-toggle ${openMenus.home ? "active" : ""}`}
                onClick={() => toggleMenu("home")}
              >
                ▼
              </button>
            </div>
            <div className={`nvb-side-submenu ${openMenus.home ? "open" : ""}`}>
              <Link
                to="/Legends"
                className="nvb-sub-link"
                onClick={closeSidebar}
              >
                Legends
              </Link>
              <Link
                to="/hall-historico"
                className="nvb-sub-link"
                onClick={closeSidebar}
              >
                Hall Histórico
              </Link>
              <Link
                to="/transparency"
                className="nvb-sub-link"
                onClick={closeSidebar}
              >
                Transparência
              </Link>
            </div>
          </div>

          {/* MENU ELENCO COM SUBDIVISÕES */}
          <div className="nvb-side-item-group">
            <div className="nvb-side-item-main">
              <Link
                to="/elenco"
                className="nvb-side-link"
                onClick={closeSidebar}
              >
                Elenco
              </Link>
              <button
                className={`nvb-sub-toggle ${openMenus.elenco ? "active" : ""}`}
                onClick={() => toggleMenu("elenco")}
              >
                ▼
              </button>
            </div>
            <div
              className={`nvb-side-submenu ${openMenus.elenco ? "open" : ""}`}
            >
              <Link
                to="/elenco?tab=masculino"
                className="nvb-sub-link"
                onClick={closeSidebar}
              >
                Masculino
              </Link>
              <Link
                to="/elenco?tab=feminino"
                className="nvb-sub-link"
                onClick={closeSidebar}
              >
                Feminino
              </Link>
            </div>
          </div>

          <Link to="/calendar" className="nvb-side-link" onClick={closeSidebar}>
            Calendário
          </Link>
          <Link
            to="/estatisticas"
            className="nvb-side-link"
            onClick={closeSidebar}
          >
            Estatísticas
          </Link>
          <Link
            to="/campeonato"
            className="nvb-side-link"
            onClick={closeSidebar}
          >
            Campeonato
          </Link>

          <Link to="/titulos" className="nvb-side-link" onClick={closeSidebar}>
            Títulos
          </Link>

          <div className="nvb-side-divider"></div>

          <Link to="/regras" className="nvb-side-link" onClick={closeSidebar}>
            Regras
          </Link>
          <Link to="/about" className="nvb-side-link" onClick={closeSidebar}>
            Sobre nós
          </Link>

          <Link
            to="/configuracoes"
            className="nvb-side-link"
            onClick={closeSidebar}
          >
            Configuração
          </Link>
        </nav>
      </div>
    </>
  );
}

export default Navbar;
