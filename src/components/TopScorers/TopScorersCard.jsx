import React from "react";
import "./topscorers.css";

function TopScorersCard({ players = [], limit = 3 }) {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  return (
    <div className="ts-card">
      <h3 className="ts-title">ARTILHARIA ADR</h3>

      <div className="ts-list">
        {players.slice(0, limit).map((p, i) => {
          // Variável para identificar se é o 1º colocado (para destacar em dourado/preto)
          const isFirst = i === 0;

          return (
            <div key={p.id} className="ts-row">
              <div className="ts-info">
                <span className={`ts-rank ${isFirst ? "is-first" : ""}`}>
                  {i + 1 < 10 ? `0${i + 1}` : i + 1}
                </span>

                <img
                  src={p.photo || defaultAvatar}
                  alt={p.name}
                  className={`ts-avatar-img ${isFirst ? "is-first" : ""}`}
                />

                <span className="ts-name">{p.name}</span>
              </div>

              <div className="ts-stats">
                <span className="ts-goals-val">{p.goals}</span>
                <small className="ts-goals-label">GOLS</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TopScorersCard;
