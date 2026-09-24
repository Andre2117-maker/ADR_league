import React, { useState } from "react";
import "./submodal.css";

const SubModal = ({ team, sortedPlayers, teamPlayers, addSubEvent, close }) => {
  const [playerOutId, setPlayerOutId] = useState("");
  const [playerInId, setPlayerInId] = useState("");
  const [reason, setReason] = useState("Tática");

  // Filtra quem ESTÁ no time (para poder sair)
  const playersOnField = sortedPlayers.filter((p) =>
    teamPlayers.includes(p.id),
  );

  const playersOffField = sortedPlayers;

  const handleConfirm = () => {
    if (!playerOutId || !playerInId) {
      return alert("Selecione o jogador que sai e o que entra!");
    }

    addSubEvent(team, playerOutId, playerInId, reason);
  };

  return (
    <div className="sub-modal-overlay">
      <div className="sub-modal-content">
        <h3>🔄 Substituição - Time {team}</h3>

        <div className="sub-modal-form">
          <div>
            <label className="sub-label-out">⬇️ Quem Sai:</label>
            <select
              className="sub-select"
              value={playerOutId}
              onChange={(e) => setPlayerOutId(e.target.value)}
            >
              <option value="">Selecione quem sai...</option>
              {playersOnField.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="sub-label-in">⬆️ Quem Entra:</label>
            <select
              className="sub-select"
              value={playerInId}
              onChange={(e) => setPlayerInId(e.target.value)}
            >
              <option value="">Selecione quem entra...</option>
              {playersOffField.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="sub-label-reason">Motivo:</label>
            <select
              className="sub-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="Tática">Opção Tática</option>
              <option value="Lesão">Lesão / Machucado</option>
            </select>
          </div>
        </div>

        <div className="sub-modal-buttons">
          <button className="sub-btn-cancel" onClick={close}>
            Cancelar
          </button>
          <button className="sub-btn-confirm" onClick={handleConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubModal;
