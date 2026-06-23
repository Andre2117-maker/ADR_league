import React, { useRef } from "react";
import "../../styles/matchpage/matchpreview.css";

const MatchPreview = ({
  draft,
  players,
  goalsA,
  goalsB,
  penaltiesScoreA,
  penaltiesScoreB,
  removeEvent,
  onReorder,
}) => {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const isDraw = goalsA === goalsB && goalsA !== undefined;
  const autoWinner =
    penaltiesScoreA > penaltiesScoreB
      ? "A"
      : penaltiesScoreB > penaltiesScoreA
        ? "B"
        : null;

  const getPlayerName = (playerId, externalName) => {
    if (playerId === "EXTERNO" || playerId === "OPONENTE_EXTERNO")
      return externalName || "Jogador Adversário";
    return players.find((p) => p.id === playerId)?.name || "Jogador";
  };

  const renderEventIcon = (type) => {
    switch (type) {
      case "GOAL":
        return "⚽";
      case "OWN_GOAL":
        return "⚠️";
      case "YELLOW":
        return "🟨";
      case "RED":
        return "🟥";
      case "SUB":
        return "🔄";
      default:
        return "•";
    }
  };

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const currentEvents = [...draft.events];
    const draggedContent = currentEvents.splice(dragItem.current, 1)[0];
    currentEvents.splice(dragOverItem.current, 0, draggedContent);
    dragItem.current = null;
    dragOverItem.current = null;
    if (onReorder) onReorder(currentEvents);
  };

  return (
    <div className="match-preview-container">
      <div className="preview-card-glass">
        <div className="tv-scoreboard">
          <div className="score-center" style={{ width: "100%" }}>
            <div className="score-numbers">
              <span className="n">{goalsA}</span>
              {isDraw && (penaltiesScoreA > 0 || penaltiesScoreB > 0) && (
                <span className="penalties-score">
                  ({penaltiesScoreA || 0})
                </span>
              )}
              <span className="divider">-</span>
              {isDraw && (penaltiesScoreA > 0 || penaltiesScoreB > 0) && (
                <span className="penalties-score">
                  ({penaltiesScoreB || 0})
                </span>
              )}
              <span className="n">{goalsB}</span>
            </div>
            {isDraw && autoWinner && (
              <div className="penalties-tag">
                PÊNALTIS:{" "}
                <strong>
                  {autoWinner === "A" ? draft.teamA.name : draft.teamB.name}
                </strong>{" "}
                🏆
              </div>
            )}
          </div>
        </div>

        <div
          className="timeline-section"
          style={{ position: "relative", padding: "20px" }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "0",
              bottom: "0",
              width: "2px",
              background: "rgba(255,255,255,0.1)",
              zIndex: 0,
            }}
          ></div>

          <div className="events-grid">
            {draft.events.map((e, index) => (
              <div
                key={e.id}
                draggable
                onDragStart={() => (dragItem.current = index)}
                onDragEnter={() => (dragOverItem.current = index)}
                onDragEnd={handleSort}
                onDragOver={(evt) => evt.preventDefault()}
                className="event-card-mini"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  cursor: "grab",
                }}
              >
                {/* LADO A */}
                <div
                  style={{ flex: 1, textAlign: "right", paddingRight: "30px" }}
                >
                  {e.team === "A" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                      }}
                    >
                      {e.type === "SUB" ? (
                        <>
                          <span
                            style={{ fontWeight: "bold", color: "#44ff44" }}
                          >
                            {getPlayerName(e.playerInId)} ⬆️
                          </span>
                          <span style={{ fontSize: "10px", color: "#aaa" }}>
                            {getPlayerName(e.playerOutId)} ⬇️
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: "bold" }}>
                            {getPlayerName(e.playerId, e.externalName)}
                          </span>
                          {e.assistId && (
                            <span style={{ fontSize: "10px", color: "#aaa" }}>
                              [{getPlayerName(e.assistId)}]
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* ÍCONE */}
                <div
                  className="e-icon"
                  style={{
                    zIndex: 2,
                    background: "#000",
                    padding: "5px",
                    borderRadius: "50%",
                    border: "2px solid #333",
                  }}
                >
                  {renderEventIcon(e.type)}
                </div>

                {/* LADO B */}
                <div
                  style={{ flex: 1, textAlign: "left", paddingLeft: "30px" }}
                >
                  {e.team === "B" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      {e.type === "SUB" ? (
                        <>
                          <span
                            style={{ fontWeight: "bold", color: "#44ff44" }}
                          >
                            ⬆️ {getPlayerName(e.playerInId)}
                          </span>
                          <span style={{ fontSize: "10px", color: "#aaa" }}>
                            ⬇️ {getPlayerName(e.playerOutId)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: "bold" }}>
                            {getPlayerName(e.playerId, e.externalName)}
                          </span>
                          {e.assistId && (
                            <span style={{ fontSize: "10px", color: "#aaa" }}>
                              [{getPlayerName(e.assistId)}]
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeEvent(e.id)}
                  style={{
                    position: "absolute",
                    right: "0",
                    background: "none",
                    border: "none",
                    color: "#444",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchPreview;
