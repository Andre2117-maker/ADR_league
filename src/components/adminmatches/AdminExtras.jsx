import React from "react";

export default function AdminExtras({
  draft,
  setDraft,
  showVenueModal,
  setShowVenueModal,
  newVenueInput,
  setNewVenueInput,
  handleSaveNewVenue,
}) {
  return (
    <>
      {/* Bloco do Gol de Ouro */}
      <div
        className="field"
        style={{
          margin: "20px 0",
          textAlign: "center",
          backgroundColor: "#111",
          padding: "15px",
          borderRadius: "8px",
          border: "1px solid #d4af37",
        }}
      >
        <h3
          style={{ color: "#d4af37", marginBottom: "10px", fontSize: "16px" }}
        >
          ⚽ Gol de Ouro (Regra Especial)
        </h3>
        <p style={{ color: "#ccc", fontSize: "13px", marginBottom: "15px" }}>
          Ative isso caso a partida tenha sido decidida no Gol de Ouro (o time
          escolhido será o vencedor, independente do placar final).
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                goldenGoalWinner: prev.goldenGoalWinner === "A" ? null : "A",
              }))
            }
            style={{
              padding: "10px 20px",
              backgroundColor:
                draft.goldenGoalWinner === "A" ? "#d4af37" : "#333",
              color: draft.goldenGoalWinner === "A" ? "#000" : "#fff",
              border: "1px solid #d4af37",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Vitória {draft.teamA.name}
          </button>

          <button
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                goldenGoalWinner: prev.goldenGoalWinner === "B" ? null : "B",
              }))
            }
            style={{
              padding: "10px 20px",
              backgroundColor:
                draft.goldenGoalWinner === "B" ? "#d4af37" : "#333",
              color: draft.goldenGoalWinner === "B" ? "#000" : "#fff",
              border: "1px solid #d4af37",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Vitória {draft.teamB.name}
          </button>
        </div>
      </div>

      {/* Pop-up / Modal de Novo Local */}
      {showVenueModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#111",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #d4af37",
              width: "90%",
              maxWidth: "300px",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                color: "#d4af37",
                marginBottom: "15px",
                fontSize: "16px",
              }}
            >
              📍 Adicionar Novo Local
            </h3>

            <input
              type="text"
              autoFocus
              placeholder="Ex: Arena ADR"
              value={newVenueInput}
              onChange={(e) => setNewVenueInput(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                backgroundColor: "#222",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: "4px",
                textAlign: "center",
                fontSize: "16px",
              }}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  await handleSaveNewVenue();
                }
              }}
            />

            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <button
                onClick={() => setShowVenueModal(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNewVenue}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#d4af37",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
