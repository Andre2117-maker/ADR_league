import React, { useState } from "react";

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
  // Estados para controlar o input do motivo do cartão
  const [pendingCardType, setPendingCardType] = useState(null);
  const [cardReason, setCardReason] = useState("");

  const handleConfirmCard = (e) => {
    e.stopPropagation();
    // Envia o tipo de cartão e o motivo escrito
    onCard(pendingCardType, cardReason);
    // Limpa o estado e fecha o input
    setPendingCardType(null);
    setCardReason("");
  };

  const handleCancelCard = (e) => {
    e.stopPropagation();
    setPendingCardType(null);
    setCardReason("");
  };

  return (
    <div className={`player-row ${isSelected ? "active" : ""}`}>
      <div className="p-clickable-area" onClick={onToggle}>
        <input type="checkbox" checked={isSelected} readOnly />

        <span className="p-name">
          {player.name} {isGK && "🧤"} {isCaptain && "Ⓒ"}
        </span>
      </div>

      {/* Renderiza os botões normais se não houver um cartão pendente de justificativa */}
      {isSelected && !pendingCardType && (
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
              setPendingCardType("YELLOW"); // Abre o input
            }}
          >
            🟨
          </button>

          <button
            title="Vermelho"
            className="btn-card red"
            onClick={(e) => {
              e.stopPropagation();
              setPendingCardType("RED"); // Abre o input
            }}
          >
            🟥
          </button>
        </div>
      )}

      {/* Renderiza o campo de texto se o usuário clicou em um cartão */}
      {isSelected && pendingCardType && (
        <div
          className="actions card-reason-box"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            placeholder={`Motivo (${pendingCardType === "YELLOW" ? "Amarelo" : "Vermelho"})...`}
            value={cardReason}
            onChange={(e) => setCardReason(e.target.value)}
            autoFocus
            style={{ padding: "4px", fontSize: "12px", width: "120px" }}
          />
          <button
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "4px 8px",
            }}
            onClick={handleConfirmCard}
          >
            ✔
          </button>
          <button
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              padding: "4px 8px",
            }}
            onClick={handleCancelCard}
          >
            ✖
          </button>
        </div>
      )}
    </div>
  );
}

export default PlayerRow;
