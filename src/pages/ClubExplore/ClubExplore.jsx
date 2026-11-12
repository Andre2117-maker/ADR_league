import React from "react";
import { Link } from "react-router-dom";
import "./clubexplore.css";

/* Ícones de traço fino (herdam a cor) */
const ICONS = {
  hall: (
    <>
      <path d="M3 9.5L12 4l9 5.5" />
      <path d="M4.5 10h15" />
      <path d="M6.5 10v7.5M10 10v7.5M14 10v7.5M17.5 10v7.5" />
      <path d="M3.5 20h17" />
    </>
  ),
  money: (
    <>
      <path d="M4 19V11M9.3 19V7M14.6 19v-5M20 19V5" />
      <path d="M3 21h18" />
    </>
  ),
  crown: (
    <>
      <path d="M4 17l-1-9 5 4 4-7 4 7 5-4-1 9z" />
      <path d="M4.5 20.5h15" />
    </>
  ),
};

const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

const ITEMS = [
  {
    to: "/hall-historico",
    icon: "hall",
    title: "Hall Histórico",
    desc: "Todos que já vestiram a camisa, temporada por temporada.",
  },
  {
    to: "/transparency",
    icon: "money",
    title: "Transparência",
    desc: "Prestação de contas do clube, aberta para todos.",
  },
  {
    to: "/Legends",
    icon: "crown",
    title: "Legends",
    desc: "Os nomes que marcaram a história do clube.",
  },
];

export default function ClubExplore() {
  return (
    <section className="cx-section" aria-labelledby="cx-title">
      <header className="cx-head">
        <span className="cx-kicker">ARQUIVO DO CLUBE</span>
        <h2 id="cx-title" className="cx-title">
          Explore o clube
        </h2>
      </header>

      <div className="cx-grid">
        {ITEMS.map((item, i) => (
          <Link key={item.to} to={item.to} className="cx-card">
            <span className="cx-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="cx-icon">
              <Icon name={item.icon} />
            </span>
            <span className="cx-text">
              <strong className="cx-card-title">{item.title}</strong>
              <span className="cx-card-desc">{item.desc}</span>
            </span>
            <span className="cx-go">
              <span className="cx-go-label">Acessar</span>
              <span className="cx-arrow" aria-hidden="true">
                ›
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
