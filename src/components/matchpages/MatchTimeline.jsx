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

    let icon = null;
    let extraLabel = null;

    switch (e.type) {
      case "GOAL":
        icon = <span className="event-icon">⚽</span>;
        break;

      case "OWN_GOAL":
        icon = (
          <span className="event-icon" style={{ color: "#ff4444" }}>
            ⚽
          </span>
        );

        extraLabel = (
          <small
            style={{
              color: "#ff4444",
              fontWeight: "bold",
              marginLeft: "4px",
            }}
          >
            (GC)
          </small>
        );
        break;

      case "YELLOW":
        icon = (
          <span
            className="event-icon"
            style={{
              color: "#FFD700",
              fontWeight: "bold",
            }}
          >
            🟨
          </span>
        );
        break;

      case "RED":
        icon = (
          <span
            className="event-icon"
            style={{
              color: "#ff2222",
              fontWeight: "bold",
            }}
          >
            🟥
          </span>
        );
        break;

      default:
        icon = <span className="event-icon">•</span>;
    }

    return (
      <div key={stableKey} className="timeline-event-item">
        {side === "A" ? (
          <>
            {assist} <span className="player-name">{name}</span> {extraLabel}{" "}
            {icon}
          </>
        ) : (
          <>
            {icon} <span className="player-name">{name}</span> {extraLabel}{" "}
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
