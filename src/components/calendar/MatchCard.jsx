import React from "react";
import "./MatchCard.css";

const MatchCard = ({
  match,
  isAdmin,
  onEdit,
  onDelete,
  onNavigate,
  onSwapOrder,
}) => {
  // Função para calcular o placar
  const getTeamScore = (teamLetter) => {
    const opponentLetter = teamLetter === "A" ? "B" : "A";
    return match.events.filter(
      (e) =>
        (e.type === "GOAL" && e.team === teamLetter) ||
        (e.type === "OWN_GOAL" && e.team === opponentLetter),
    ).length;
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
            gap: "12px",
            justifyContent: "flex-end",
            width: "100%",
            marginBottom: "10px",
            borderBottom: "1px solid #333",
            paddingBottom: "8px",
          }}
        >
          {/* SETAS DE ORDENAÇÃO */}
          <div style={{ display: "flex", gap: "8px", marginRight: "auto" }}>
            <button
              title="Subir Ordem"
              onClick={(e) => {
                e.stopPropagation();
                onSwapOrder(match, "UP");
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                color: "#e2b900",
              }}
            >
              ▼
            </button>
            <button
              title="Descer Ordem"
              onClick={(e) => {
                e.stopPropagation();
                onSwapOrder(match, "DOWN");
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                color: "#e2b900",
              }}
            >
              ▲
            </button>
          </div>

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

      {/* Rodapé informativo do Card */}
      <div
        style={{
          textAlign: "center",
          marginTop: "12px",
          fontSize: "10px",
          color: "#666",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "8px",
        }}
      >
        Clique para ver detalhes da partida
      </div>
    </div>
  );
};

export default MatchCard;
