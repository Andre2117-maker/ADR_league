import React, { useState } from "react";

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
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "400px" }}>
        <h3>🔄 Substituição - Time {team}</h3>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            margin: "20px 0",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                color: "#ff4444",
                fontWeight: "bold",
              }}
            >
              ⬇️ Quem Sai:
            </label>
            <select
              value={playerOutId}
              onChange={(e) => setPlayerOutId(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
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
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                color: "#44ff44",
                fontWeight: "bold",
              }}
            >
              ⬆️ Quem Entra:
            </label>
            <select
              value={playerInId}
              onChange={(e) => setPlayerInId(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
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
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Motivo:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
            >
              <option value="Tática">Opção Tática</option>
              <option value="Lesão">Lesão / Machucado</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <button
            onClick={close}
            style={{
              flex: 1,
              padding: "10px",
              background: "#555",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: "10px",
              background: "#d4af37",
              color: "#000",
              fontWeight: "bold",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubModal;
