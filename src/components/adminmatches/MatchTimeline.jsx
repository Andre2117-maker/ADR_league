import React, { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EVENT_META, playerName, isExternalId } from "./adminMatchesUtils";

/* ==========================================================================
   UM LANCE — arrasta só pela alça ⋮⋮ (a lista rola normal no celular)
   ========================================================================== */
function TimelineItem({ e, score, playersById, onEditMinute, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: e.id });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const meta = EVENT_META[e.type] || { icon: "•", label: e.type };
  const name = (id, ext) => playerName(playersById, id, ext);

  const assistLabel = e.assistId
    ? isExternalId(e.playerId)
      ? e.assistId
      : name(e.assistId)
    : null;

  let main;
  let sub = null;
  if (e.type === "SUB") {
    main = <>⬆️ {name(e.playerInId)}</>;
    sub = <>⬇️ {name(e.playerOutId)}{e.reason ? ` · ${e.reason}` : ""}</>;
  } else if (e.type === "GK_CHANGE") {
    main = <>{name(e.playerInId, e.externalName)}</>;
    sub = <>assume o gol</>;
  } else {
    main = <>{name(e.playerId, e.externalName)}</>;
    if (assistLabel) sub = <>🎯 {assistLabel}</>;
    else if ((e.type === "YELLOW" || e.type === "RED") && e.reason) sub = <>{e.reason}</>;
    else if (e.type === "OWN_GOAL") sub = <>gol contra</>;
  }

  const side = (
    <div className="amt-who">
      <span className="amt-main">{main}</span>
      {sub && <span className="amt-sub">{sub}</span>}
    </div>
  );

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`amt-item t-${e.type} side-${e.team} ${isDragging ? "is-dragging" : ""}`}
    >
      <button type="button" className="amt-handle" {...attributes} {...listeners} aria-label="Arrastar para reordenar">
        ⋮⋮
      </button>

      <div className="amt-side amt-a">{e.team === "A" && side}</div>

      <div className="amt-center">
        <span className="amt-icon" title={meta.label}>{meta.icon}</span>
        <button type="button" className="amt-min" onClick={() => onEditMinute(e)} title="Editar minuto">
          {e.minute || "—'"}
        </button>
        {score && <span className="amt-score">{score}</span>}
      </div>

      <div className="amt-side amt-b">{e.team === "B" && side}</div>

      <button type="button" className="amt-del" onClick={() => onRemove(e.id)} aria-label="Remover lance">
        ✕
      </button>
    </li>
  );
}

/* ==========================================================================
   LINHA DO TEMPO
   ========================================================================== */
export default function MatchTimeline({
  events,
  playersById,
  teamA,
  teamB,
  onReorder,
  onEditMinute,
  onRemove,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Placar parcial depois de cada gol
  const scores = useMemo(() => {
    let a = 0;
    let b = 0;
    const map = {};
    events.forEach((e) => {
      const isA = (e.team === "A" && e.type === "GOAL") || (e.team === "B" && e.type === "OWN_GOAL");
      const isB = (e.team === "B" && e.type === "GOAL") || (e.team === "A" && e.type === "OWN_GOAL");
      if (isA) a += 1;
      if (isB) b += 1;
      if (isA || isB) map[e.id] = `${a}–${b}`;
    });
    return map;
  }, [events]);

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = events.findIndex((e) => e.id === active.id);
    const to = events.findIndex((e) => e.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(events, from, to));
  };

  return (
    <div className="am-panel">
      <div className="am-panel-head">
        <span className="am-kicker">LANCE A LANCE</span>
        <h2>Linha do tempo</h2>
      </div>

      <div className="amt-teams">
        <span>{teamA.name || "Time A"}</span>
        <span>{teamB.name || "Time B"}</span>
      </div>

      {events.length === 0 ? (
        <p className="am-muted am-center amt-empty">
          Nenhum lance ainda. Toque em ⚽, GC ou nos cartões dentro de cada time.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={events.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <ol className="amt-list">
              {events.map((e) => (
                <TimelineItem
                  key={e.id}
                  e={e}
                  score={scores[e.id]}
                  playersById={playersById}
                  onEditMinute={onEditMinute}
                  onRemove={onRemove}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      {events.length > 1 && (
        <p className="am-hint">
          A ordem importa: é ela que define o placar parcial e qual goleiro sofreu cada gol. Arraste pela
          alça ⋮⋮ para corrigir.
        </p>
      )}
    </div>
  );
}
