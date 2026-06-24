import React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "../../styles/matchpage/matchpreview.css";

// 1. Componente Sortable
const SortableEvent = ({ e, renderEventIcon, getPlayerName, removeEvent }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: e.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} className="event-card-mini">
      {/* Container de Arraste (somente o conteúdo) */}
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          cursor: "grab",
        }}
        {...attributes}
        {...listeners}
      >
        <div style={{ flex: 1, textAlign: "right", paddingRight: "30px" }}>
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
                  <span style={{ fontWeight: "bold", color: "#44ff44" }}>
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

        <div style={{ flex: 1, textAlign: "left", paddingLeft: "30px" }}>
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
                  <span style={{ fontWeight: "bold", color: "#44ff44" }}>
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
      </div>

      {/* Botão de Remover (Fora dos listeners de arraste) */}
      <button
        onClick={() => removeEvent(e.id)}
        style={{
          position: "absolute",
          right: "5px",
          background: "none",
          border: "none",
          color: "#666",
          cursor: "pointer",
          zIndex: 10,
          padding: "10px",
        }}
      >
        ✕
      </button>
    </div>
  );
};

// 2. Componente Principal
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
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    }),
  );

  const isDraw = goalsA === goalsB && goalsA !== undefined;
  const autoWinner =
    penaltiesScoreA > penaltiesScoreB
      ? "A"
      : penaltiesScoreB > penaltiesScoreA
        ? "B"
        : null;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = draft.events.findIndex((e) => e.id === active.id);
      const newIndex = draft.events.findIndex((e) => e.id === over.id);
      onReorder(arrayMove(draft.events, oldIndex, newIndex));
    }
  };

  const getPlayerName = (playerId, externalName) => {
    if (playerId === "EXTERNO" || playerId === "OPONENTE_EXTERNO")
      return externalName || "Jogador Adversário";
    return players.find((p) => p.id === playerId)?.name || "Jogador";
  };

  const renderEventIcon = (type) => {
    const icons = {
      GOAL: "⚽",
      OWN_GOAL: "⚠️",
      YELLOW: "🟨",
      RED: "🟥",
      SUB: "🔄",
    };
    return icons[type] || "•";
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
              <div
                className="penalties-tag"
                style={{ textAlign: "center", marginTop: "5px" }}
              >
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
          <div className="events-grid">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={draft.events.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {draft.events.map((e) => (
                  <SortableEvent
                    key={e.id}
                    e={e}
                    renderEventIcon={renderEventIcon}
                    getPlayerName={getPlayerName}
                    removeEvent={removeEvent}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchPreview;
