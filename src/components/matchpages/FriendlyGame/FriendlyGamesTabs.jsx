import React from "react";
import "./friendlygamestabs.css";

/* Abas dos jogos do amistoso/campeonato (JOGO 1, JOGO 2...) */
function FriendlyGamesTabs({ games, selectedGameIndex, setSelectedGameIndex, isAdmin, onAddGame, onRemoveGame }) {
  const list = games.length ? games : [{ name: "JOGO 1" }];

  return (
    <div className="fgt-wrap">
      <div className="fgt-tabs" role="tablist" aria-label="Jogos da partida">
        {list.map((game, index) => (
          <div key={index} className={`fgt-tab ${selectedGameIndex === index ? "on" : ""}`}>
            <button
              type="button"
              role="tab"
              aria-selected={selectedGameIndex === index}
              className="fgt-tab-btn"
              onClick={() => setSelectedGameIndex(index)}
            >
              <small>{String(index + 1).padStart(2, "0")}</small>
              {game.name || `JOGO ${index + 1}`}
            </button>

            {isAdmin && games.length > 0 && (
              <button
                type="button"
                className="fgt-remove"
                onClick={() => {
                  if (window.confirm(`Remover ${game.name || `JOGO ${index + 1}`}?`)) onRemoveGame(index);
                }}
                aria-label={`Remover ${game.name || `jogo ${index + 1}`}`}
                title="Remover jogo"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {isAdmin && (
          <button type="button" className="fgt-add" onClick={onAddGame}>
            + Jogo
          </button>
        )}
      </div>
    </div>
  );
}

export default FriendlyGamesTabs;
