import React from "react";

function FriendlyGamesTabs({
  games,
  selectedGameIndex,
  setSelectedGameIndex,
  isAdmin,
  onAddGame,
  onRemoveGame,
}) {
  return (
    <div className="friendly-tabs-wrapper">
      <div className="friendly-tabs">
        {games.map((game, index) => (
          <div key={index} className="friendly-tab-group">
            <button
              className={`friendly-tab ${
                selectedGameIndex === index ? "active" : ""
              }`}
              onClick={() => setSelectedGameIndex(index)}
            >
              {game.name || `JOGO ${index + 1}`}
            </button>

            {isAdmin && (
              <button
                className="remove-tab-btn"
                onClick={() => onRemoveGame(index)}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {isAdmin && (
          <button className="add-game-btn" onClick={onAddGame}>
            + JOGO
          </button>
        )}
      </div>
    </div>
  );
}

export default FriendlyGamesTabs;
