import React from "react";

const MatchTimeline = ({ events, players }) => {
  const getPlayerName = (id) =>
    players.find((p) => String(p.id) === String(id))?.name || "Jogador";

  const teamAEvents = events?.filter((e) => e.team === "A") || [];
  const teamBEvents = events?.filter((e) => e.team === "B") || [];

  // Adicionamos o 'index' no mapeamento para criar uma key estável
  const renderEvent = (e, index) => {
    const name = getPlayerName(e.playerId);
    // Assistência formatada com [] e classe menor
    const assist = e.assistId ? (
      <span className="timeline-assist">[{getPlayerName(e.assistId)}]</span>
    ) : null;

    const stableKey = e.id || `${e.type}-${index}`;

    return (
      <div key={stableKey} className="timeline-event-item">
        {/* Se for time A (Esquerda), a assistência vem antes do nome */}
        {e.team === "A" ? (
          <>
            {assist} <span className="player-name">{name}</span>{" "}
            <span className="event-icon">⚽</span>
          </>
        ) : (
          /* Se for time B (Direita), a bola vem primeiro, depois nome, depois assistência */
          <>
            <span className="event-icon">⚽</span>{" "}
            <span className="player-name">{name}</span> {assist}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="match-timeline-container">
      <div className="timeline-column left">
        {teamAEvents.map((e, i) => renderEvent(e, i))}
      </div>
      <div className="timeline-column right">
        {teamBEvents.map((e, i) => renderEvent(e, i))}
      </div>
    </div>
  );
};

export default MatchTimeline;
