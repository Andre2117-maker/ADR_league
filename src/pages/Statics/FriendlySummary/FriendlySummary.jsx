import React from "react";
import "./friendlySummary.css";

/* Resumo dos amistosos (usa as mesmas variáveis --st-* da página) */
export default function FriendlySummary({ stats }) {
  const balance = Number(stats.balance) || 0;

  return (
    <section className="fs-card">
      <header className="fs-head">
        <span className="fs-kicker">Contra outros times</span>
        <h2 className="fs-title">Histórico de amistosos</h2>
      </header>

      <div className="fs-grid">
        <div className="fs-item">
          <strong>{stats.games}</strong>
          <span>Jogos</span>
        </div>
        <div className="fs-item is-for">
          <strong>{stats.goalsMade}</strong>
          <span>Gols feitos</span>
        </div>
        <div className="fs-item is-against">
          <strong>{stats.goalsConceded}</strong>
          <span>Gols sofridos</span>
        </div>
        <div className={`fs-item ${balance >= 0 ? "is-pos" : "is-neg"}`}>
          <strong>{balance > 0 ? `+${balance}` : balance}</strong>
          <span>Saldo</span>
        </div>
      </div>

      <div className="fs-best">
        <span className="fs-best-label">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3c1.5 3 4.5 4.6 4.5 8.6a4.5 4.5 0 0 1-9 0c0-2 1-3.3 2-4.2.2 1.4 1 2.3 2 2.6-.6-2.4.1-4.6.5-7z" />
            <path d="M10 17.5a2 2 0 0 0 4 0c0-1.2-1-1.9-2-3.2-1 1.3-2 2-2 3.2z" />
          </svg>
          Maior goleada
        </span>
        <span className="fs-best-value">{stats.bestCampaign}</span>
      </div>
    </section>
  );
}
