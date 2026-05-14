function PlayerRow({
  player,
  isSelected,
  isGK,
  isCaptain,
  onToggle,
  onSetGK,
  onSetCaptain,
  onGoal,
  onOwnGoal,
  onCard,
}) {
  return (
    <div className={`player-row ${isSelected ? "active" : ""}`}>
      <div className="p-clickable-area" onClick={onToggle}>
        <input type="checkbox" checked={isSelected} readOnly />

        <span className="p-name">
          {player.name} {isGK && "🧤"} {isCaptain && "Ⓒ"}
        </span>
      </div>

      {isSelected && (
        <div className="actions">
          <button
            title="Capitão"
            className={`btn-captain ${isCaptain ? "is-captain-active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onSetCaptain();
            }}
          >
            Ⓒ
          </button>

          <button
            title="Goleiro"
            className={`btn-gk ${isGK ? "is-gk" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onSetGK();
            }}
          >
            GK
          </button>

          <button
            title="Gol"
            className="btn-goal"
            onClick={(e) => {
              e.stopPropagation();
              onGoal();
            }}
          >
            ⚽
          </button>

          <button
            title="GC"
            className="btn-og"
            onClick={(e) => {
              e.stopPropagation();
              onOwnGoal();
            }}
          >
            GC
          </button>

          <button
            title="Amarelo"
            className="btn-card yellow"
            onClick={(e) => {
              e.stopPropagation();
              onCard("YELLOW");
            }}
          >
            🟨
          </button>

          <button
            title="Vermelho"
            className="btn-card red"
            onClick={(e) => {
              e.stopPropagation();
              onCard("RED");
            }}
          >
            🟥
          </button>
        </div>
      )}
    </div>
  );
}

export default PlayerRow;
