function AssistModal({
  showAssistModal,
  sortedPlayers,
  draft,
  addEvent,
  setShowAssistModal,
}) {
  if (!showAssistModal) return null;

  return (
    <div className="assist-modal-overlay">
      <div className="assist-modal">
        <h3>Assistência?</h3>

        <div className="assist-grid">
          <button
            className="btn-no-assist"
            onClick={() =>
              addEvent(showAssistModal.team, showAssistModal.playerId, "GOAL")
            }
          >
            ❌ Sem
          </button>

          {sortedPlayers
            .filter(
              (p) =>
                draft[
                  showAssistModal.team === "A" ? "teamA" : "teamB"
                ].players.includes(p.id) && p.id !== showAssistModal.playerId,
            )
            .map((p) => (
              <button
                key={p.id}
                onClick={() =>
                  addEvent(
                    showAssistModal.team,
                    showAssistModal.playerId,
                    "GOAL",
                    p.id,
                  )
                }
              >
                {p.name}
              </button>
            ))}
        </div>

        <button className="btn-cancel" onClick={() => setShowAssistModal(null)}>
          Voltar
        </button>
      </div>
    </div>
  );
}

export default AssistModal;
