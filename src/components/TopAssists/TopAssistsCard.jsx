import React from "react";
import "./topassists.css";

function TopAssistsCard({ players, limit = 3 }) {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const topPlayers = (players || [])
    .filter((p) => p.assists > 0)
    .slice(0, limit);

  return (
    <div className="ta-card">
      <h3 className="ta-title">LÍDERES EM ASSISTÊNCIAS</h3>

      <div className="ta-list">
        {topPlayers.length > 0 ? (
          topPlayers.map((p, i) => {
            const isFirst = i === 0;

            return (
              <div key={p.id} className="ta-row">
                <div className="ta-info">
                  <span className={`ta-rank ${isFirst ? "is-first" : ""}`}>
                    {i + 1 < 10 ? `0${i + 1}` : i + 1}
                  </span>

                  <img
                    src={p.photo || defaultAvatar}
                    alt={p.name}
                    className={`ta-avatar-img ${isFirst ? "is-first" : ""}`}
                  />

                  <span className="ta-name">{p.name}</span>
                </div>

                <div className="ta-stats">
                  <span className="ta-assists-val">{p.assists}</span>
                  <small className="ta-assists-label">AST</small>
                </div>
              </div>
            );
          })
        ) : (
          <div className="ta-empty">Nenhuma assistência registrada</div>
        )}
      </div>
    </div>
  );
}

export default TopAssistsCard;
