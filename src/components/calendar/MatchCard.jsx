import React from "react";
import "./MatchCard.css";

const MatchCard = ({
  match,
  players,
  isAdmin,
  onEdit,
  onDelete,
  onNavigate,
}) => {
  // Função para calcular o placar (Gols a favor + Gols contra do adversário)
  const getTeamScore = (teamLetter) => {
    const opponentLetter = teamLetter === "A" ? "B" : "A";
    return match.events.filter(
      (e) =>
        (e.type === "GOAL" && e.team === teamLetter) ||
        (e.type === "OWN_GOAL" && e.team === opponentLetter),
    ).length;
  };

  // Renderiza a lista de jogadores e seus ícones (gols, assistências)
  const renderPlayersList = (team, side) => {
    const isRight = side === "right";

    return team.players
      .map((id) => players.find((p) => p.id === id))
      .filter((p) => p)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((player) => {
        const isGK = team.goalkeeperId === player.id;
        const goals = match.events.filter(
          (e) => e.playerId === player.id && e.type === "GOAL",
        );
        const ownGoals = match.events.filter(
          (e) => e.playerId === player.id && e.type === "OWN_GOAL",
        );
        const assists = match.events.filter(
          (e) =>
            e.assistId === player.id ||
            (e.playerId === player.id && e.type === "ASSIST"),
        );

        const hasEvents =
          goals.length > 0 || ownGoals.length > 0 || assists.length > 0;

        return (
          <div
            key={player.id}
            className="event-item"
            style={{
              opacity: hasEvents || isGK ? 1 : 0.6,
              justifyContent: isRight ? "flex-end" : "flex-start",
            }}
          >
            {!isRight && (
              <span
                className="event-player"
                style={{ fontWeight: isGK ? "bold" : "normal" }}
              >
                {player.name} {isGK && "🧤"}
              </span>
            )}

            <span className="event-icons-group">
              {assists.map((_, i) => (
                <span key={`ast-${i}`}>👟</span>
              ))}
              {goals.map((_, i) => (
                <span key={`gol-${i}`}>⚽</span>
              ))}
              {ownGoals.map((_, i) => (
                <span key={`og-${i}`}>GC</span>
              ))}
            </span>

            {isRight && (
              <span
                className="event-player"
                style={{ fontWeight: isGK ? "bold" : "normal" }}
              >
                {isGK && "🧤"} {player.name}
              </span>
            )}
          </div>
        );
      });
  };

  return (
    <div
      className="match-card-display"
      onClick={() => onNavigate(match.id)}
      style={{ flexDirection: "column", height: "auto", cursor: "pointer" }}
    >
      {/* Barra de Ações Administrativas */}
      {isAdmin && (
        <div
          data-html2canvas-ignore="true"
          className="admin-actions-bar"
          style={{
            display: "flex",
            gap: "15px",
            justifyContent: "flex-end",
            width: "100%",
            marginBottom: "10px",
            borderBottom: "1px solid #333",
            paddingBottom: "8px",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(match);
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "14px" }}>✏️</span>
            <span
              style={{ color: "#2196f3", fontSize: "12px", fontWeight: "bold" }}
            >
              EDITAR
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(match.id);
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "14px" }}>🗑️</span>
            <span
              style={{ color: "#f44336", fontSize: "12px", fontWeight: "bold" }}
            >
              ELIMINAR
            </span>
          </button>
        </div>
      )}

      {/* Localização */}
      <div
        className="match-location"
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: "#d4af37",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        📍 {match.venue || "Local Indefinido"}
      </div>

      {/* Placar Principal */}
      <div
        className="match-main-info"
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="team-side">
          <span className="team-name-display">{match.teamA.name}</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <div className="score-board">
            <span className="score-number">
              {getTeamScore("A")}
              {/* Pênaltis Time A (menorzinho do lado) */}
              {match.penaltiesScoreA != null && (
                <span
                  style={{
                    fontSize: "12px",
                    marginLeft: "4px",
                    color: "#d4af37",
                    verticalAlign: "top",
                  }}
                >
                  ({match.penaltiesScoreA})
                </span>
              )}
            </span>

            <span className="versus">X</span>

            <span className="score-number">
              {/* Pênaltis Time B (menorzinho do lado) */}
              {match.penaltiesScoreB != null && (
                <span
                  style={{
                    fontSize: "12px",
                    marginRight: "4px",
                    color: "#d4af37",
                    verticalAlign: "top",
                  }}
                >
                  ({match.penaltiesScoreB})
                </span>
              )}
              {getTeamScore("B")}
            </span>
          </div>
        </div>

        <div className="team-side">
          <span className="team-name-display">{match.teamB.name}</span>
        </div>
      </div>

      {/* Detalhes (Escalações e Gols) */}
      <div
        className="match-details-expanded"
        style={{
          borderTop: "1px solid #222",
          marginTop: "10px",
          paddingTop: "10px",
        }}
      >
        <div className="events-column">
          <div style={{ fontSize: "7px", color: "#666", marginBottom: "5px" }}>
            ESCALAÇÃO {match.teamA.name.toUpperCase()}
          </div>
          {renderPlayersList(match.teamA, "left")}
        </div>

        <div className="events-column text-right">
          <div style={{ fontSize: "7px", color: "#666", marginBottom: "5px" }}>
            ESCALAÇÃO {match.teamB.name.toUpperCase()}
          </div>
          {renderPlayersList(match.teamB, "right")}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
