import React from "react";

const MatchTimeline = ({ events, players }) => {
  // FUNÇÃO ATUALIZADA PARA LIDAR COM JOGADORES EXTERNOS
  const getPlayerName = (id, externalName) => {
    if (id === "EXTERNO" || id === "OPONENTE_EXTERNO") {
      return externalName || "Jogador Externo";
    }
    return players.find((p) => String(p.id) === String(id))?.name || "Jogador";
  };

  // LÓGICA DE FILTRO (Mantida como você enviou)
  const teamAEvents =
    events?.filter(
      (e) =>
        (e.team === "A" && e.type !== "OWN_GOAL") ||
        (e.team === "B" && e.type === "OWN_GOAL"),
    ) || [];

  const teamBEvents =
    events?.filter(
      (e) =>
        (e.team === "B" && e.type !== "OWN_GOAL") ||
        (e.team === "A" && e.type === "OWN_GOAL"),
    ) || [];

  const renderEvent = (e, index, side) => {
    const isOwnGoal = e.type === "OWN_GOAL";

    // AGORA PASSAMOS O ID E O EXTERNALNAME
    const name = getPlayerName(e.playerId, e.externalName);

    // Assistência (Também atualizada caso haja assist externo no futuro)
    const assist =
      e.assistId && !isOwnGoal ? (
        <span className="timeline-assist">
          [{getPlayerName(e.assistId, e.externalAssistName)}]
        </span>
      ) : null;

    const stableKey = e.id || `${e.type}-${index}-${side}`;

    const icon = isOwnGoal ? (
      <span className="event-icon" style={{ color: "#ff4444" }}>
        ⚽
      </span>
    ) : (
      <span className="event-icon">⚽</span>
    );

    const gcLabel = isOwnGoal ? (
      <small
        style={{ color: "#ff4444", fontWeight: "bold", marginLeft: "4px" }}
      >
        (GC)
      </small>
    ) : null;

    return (
      <div key={stableKey} className="timeline-event-item">
        {side === "A" ? (
          <>
            {assist} <span className="player-name">{name}</span> {gcLabel}{" "}
            {icon}
          </>
        ) : (
          <>
            {icon} <span className="player-name">{name}</span> {gcLabel}{" "}
            {assist}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="match-timeline-container">
      <div className="timeline-column left">
        {teamAEvents.map((e, i) => renderEvent(e, i, "A"))}
      </div>
      <div className="timeline-column right">
        {teamBEvents.map((e, i) => renderEvent(e, i, "B"))}
      </div>
    </div>
  );
};

export default MatchTimeline;
