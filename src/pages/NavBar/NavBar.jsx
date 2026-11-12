import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/logo.png";
import logoIdr from "../../assets/IDR.png";
import "./navbar.css";

/* Ícone de pessoa (traço fino, herda a cor) */
const UserIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20.2c.9-3.7 3.8-5.9 7.2-5.9s6.3 2.2 7.2 5.9" />
  </svg>
);

/* Estrutura do menu lateral (fácil de editar) */
const MENU = [
  {
    section: "Navegação",
    items: [
      {
        to: "/",
        label: "Início",
        children: [
          { to: "/Legends", label: "Legends" },
          { to: "/hall-historico", label: "Hall Histórico" },
          { to: "/transparency", label: "Transparência" },
        ],
      },
      {
        to: "/elenco",
        label: "Elenco",
        children: [
          { to: "/elenco?tab=masculino", label: "Masculino" },
          { to: "/elenco?tab=feminino", label: "Feminino" },
        ],
      },
      { to: "/calendar", label: "Calendário" },
      { to: "/estatisticas", label: "Estatísticas" },
      { to: "/campeonato", label: "Campeonato" },
      { to: "/titulos", label: "Títulos" },
    ],
  },
  {
    section: "Clube",
    items: [
      { to: "/regras", label: "Regras" },
      { to: "/about", label: "Sobre nós" },
      { to: "/configuracoes", label: "Configuração" },
    ],
  },
];

function Navbar({ isAdmin, logout }) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userRef = useRef(null);

  /* Rolagem: barra fica mais fina */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Fecha tudo ao trocar de página */
  useEffect(() => {
    setIsSidebarOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname, location.search]);

  /* ESC fecha; trava a rolagem do fundo com o menu aberto */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setIsSidebarOpen(false);
      setUserMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isSidebarOpen]);

  /* Menu do admin fecha ao tocar fora */
  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const onDown = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [userMenuOpen]);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleMenu = (key) =>
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));

  /* Página atual (considera ?tab= do elenco) */
  const current = `${location.pathname}${location.search}`;
  const isActive = (to) => {
    if (to.includes("?")) return current === to;
    if (to === "/") return location.pathname === "/";
    return location.pathname.toLowerCase() === to.toLowerCase();
  };
  const groupActive = (item) =>
    isActive(item.to) || (item.children || []).some((c) => isActive(c.to));

  const handleLogout = () => {
    setUserMenuOpen(false);
    closeSidebar();
    logout?.();
  };

  return (
    <>
      <header
        className={`nvb-wrapper ${scrolled ? "nvb-on-scroll" : "nvb-top"}`}
      >
        <div className="nvb-container">
          {/* ESQUERDA: MENU */}
          <div className="nvb-section nvb-left">
            <button
              type="button"
              className={`nvb-hamburger ${isSidebarOpen ? "is-open" : ""}`}
              onClick={() => setIsSidebarOpen((v) => !v)}
              aria-label="Abrir menu"
              aria-expanded={isSidebarOpen}
            >
              <span className="nvb-burger-lines" aria-hidden="true">
                <span className="line" />
                <span className="line" />
              </span>
              <span className="nvb-burger-label">MENU</span>
            </button>
          </div>

          {/* CENTRO: MARCA */}
          <Link to="/" className="nvb-brand" onClick={closeSidebar}>
            <img
              src={logo}
              alt="ADR League"
              className="nvb-logo-img logo-adr"
            />
            <img
              src={logoIdr}
              alt="IDR League"
              className="nvb-logo-img logo-idr"
            />
            <span className="nvb-brand-text">
              <span className="text-adr">ADR</span>
              <span className="text-idr">IDR</span>
              <span className="nvb-highlight">LEAGUE</span>
            </span>
          </Link>

          {/* DIREITA: PESSOINHA */}
          <div className="nvb-section nvb-right" ref={userRef}>
            {isAdmin ? (
              <>
                <button
                  type="button"
                  className={`nvb-user-btn is-admin ${userMenuOpen ? "is-open" : ""}`}
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="Menu do administrador"
                  aria-expanded={userMenuOpen}
                >
                  <UserIcon />
                  <span className="nvb-user-dot" aria-hidden="true" />
                </button>

                <div
                  className={`nvb-user-menu ${userMenuOpen ? "open" : ""}`}
                  role="menu"
                >
                  <span className="nvb-user-menu-kicker">ADMINISTRADOR</span>
                  <Link
                    to="/admin-panel"
                    className="nvb-user-menu-item"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Painel <span aria-hidden="true">›</span>
                  </Link>
                  <button
                    type="button"
                    className="nvb-user-menu-item is-danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    Sair
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/admin-login"
                className="nvb-user-btn"
                aria-label="Acesso admin"
                title="Acesso admin"
                onClick={closeSidebar}
              >
                <UserIcon />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ==================== MENU LATERAL ==================== */}
      <div
        className={`nvb-sidebar-overlay ${isSidebarOpen ? "visible" : ""}`}
        onClick={closeSidebar}
      />

      <aside
        className={`nvb-sidebar ${isSidebarOpen ? "open" : ""}`}
        aria-hidden={!isSidebarOpen}
      >
        <div className="nvb-sidebar-header">
          <div className="nvb-sidebar-brand">
            <img src={logo} alt="" className="nvb-side-logo logo-adr" />
            <img src={logoIdr} alt="" className="nvb-side-logo logo-idr" />
            <div>
              <span className="nvb-sidebar-kicker">MENU</span>
              <span className="nvb-sidebar-title">
                <span className="text-adr">ADR</span>
                <span className="text-idr">IDR</span> LEAGUE
              </span>
            </div>
          </div>
          <button
            type="button"
            className="nvb-sidebar-close"
            onClick={closeSidebar}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        <nav className="nvb-sidebar-links">
          {MENU.map((group) => (
            <div key={group.section} className="nvb-side-section">
              <span className="nvb-side-section-title">{group.section}</span>

              {group.items.map((item) =>
                item.children ? (
                  <div
                    key={item.to}
                    className={`nvb-side-item-group ${groupActive(item) ? "is-active" : ""}`}
                  >
                    <div className="nvb-side-item-main">
                      <Link
                        to={item.to}
                        className={`nvb-side-link ${isActive(item.to) ? "active" : ""}`}
                        onClick={closeSidebar}
                      >
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        className={`nvb-sub-toggle ${openMenus[item.to] ? "active" : ""}`}
                        onClick={() => toggleMenu(item.to)}
                        aria-label={`Abrir ${item.label}`}
                        aria-expanded={!!openMenus[item.to]}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                    <div
                      className={`nvb-side-submenu ${openMenus[item.to] ? "open" : ""}`}
                    >
                      <div className="nvb-side-submenu-inner">
                        {item.children.map((c) => (
                          <Link
                            key={c.to}
                            to={c.to}
                            className={`nvb-sub-link ${isActive(c.to) ? "active" : ""}`}
                            onClick={closeSidebar}
                          >
                            {c.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`nvb-side-link ${isActive(item.to) ? "active" : ""}`}
                    onClick={closeSidebar}
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </div>
          ))}
        </nav>

        <div className="nvb-sidebar-footer">
          {isAdmin ? (
            <div className="nvb-side-admin">
              <Link
                to="/admin-panel"
                className="nvb-side-admin-btn"
                onClick={closeSidebar}
              >
                <UserIcon /> Painel
              </Link>
              <button
                type="button"
                className="nvb-side-logout"
                onClick={handleLogout}
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              to="/admin-login"
              className="nvb-side-admin-btn"
              onClick={closeSidebar}
            >
              <UserIcon /> Acesso admin
            </Link>
          )}
          <span className="nvb-side-copy">
            <span className="text-adr">ADR</span>
            <span className="text-idr">IDR</span> LEAGUE ·{" "}
            {new Date().getFullYear()}
          </span>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
