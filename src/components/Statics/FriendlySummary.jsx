import React from "react";
import "./friendlySummary.css";

export default function FriendlySummary({ stats }) {
  return (
    <div className="friendly-summary-card">
      <h2>🤝 Histórico de Amistosos</h2>
      <div className="friendly-stats-grid">
        <div className="friendly-stat-item">
          <span className="stat-label">Jogos Realizados:</span>
          <span className="stat-value">{stats.games}</span>
        </div>
        <div className="friendly-stat-item">
          <span className="stat-label">Gols Feitos:</span>
          <span className="stat-value goals-made">{stats.goalsMade}</span>
        </div>
        <div className="friendly-stat-item">
          <span className="stat-label">Gols Sofridos:</span>
          <span className="stat-value goals-conceded">
            {stats.goalsConceded}
          </span>
        </div>
        <div className="friendly-stat-item">
          <span className="stat-label">Saldo de Gols:</span>
          <span
            className={`stat-value ${stats.balance >= 0 ? "positive" : "negative"}`}
          >
            {stats.balance > 0 ? `+${stats.balance}` : stats.balance}
          </span>
        </div>
      </div>
      <div className="friendly-best-campaign">
        <span className="best-label">🔥 Melhor Campanha (Maior Goleada):</span>
        <span className="best-value">{stats.bestCampaign}</span>
      </div>
    </div>
  );
}
