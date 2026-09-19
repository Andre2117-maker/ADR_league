import React from "react";
import "./MinuteModal.css";

export default function MinuteModal({
  minuteInput,
  setMinuteInput,
  finalizeEvent,
  setPendingEvent,
}) {
  return (
    <div className="minute-modal-overlay">
      <div className="minute-modal-box">
        <h3 className="minute-modal-title">⏱️ Inserir Minutagem</h3>

        <input
          type="text"
          autoFocus
          placeholder="Ex: 15', 45+2'"
          value={minuteInput}
          onChange={(e) => setMinuteInput(e.target.value)}
          className="minute-input"
          onKeyDown={(e) => {
            if (e.key === "Enter") finalizeEvent();
          }}
        />

        <div className="minute-modal-buttons">
          <button
            className="minute-btn-cancel"
            onClick={() => setPendingEvent(null)}
          >
            Cancelar
          </button>
          <button className="minute-btn-save" onClick={finalizeEvent}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
