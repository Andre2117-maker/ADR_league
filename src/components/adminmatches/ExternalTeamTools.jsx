import React from "react";

function ExternalTeamTools({
  draft,
  teamKey,
  t,
  extScorerName,
  setExtScorerName,
  extAssistName,
  setExtAssistName,
  addEvent,
  setDraft,
}) {
  return (
    <div className="external-tools">
      {/* GOLEIRO */}
      <div className="external-field-group">
        <label>🧤 GOLEIRO ADVERSÁRIO</label>

        <input
          placeholder="Nome do Goleiro"
          value={draft[teamKey].externalGoalkeeperName || ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              [teamKey]: {
                ...draft[teamKey],
                externalGoalkeeperName: e.target.value,
              },
            })
          }
        />
      </div>

      <hr className="admin-divider" />

      {/* AÇÕES ADVERSÁRIAS (GOLS E CARTÕES) */}
      <div className="external-goal-group">
        <input
          placeholder="Nome do Jogador"
          value={extScorerName}
          onChange={(e) => setExtScorerName(e.target.value)}
        />

        <input
          placeholder="Assistência (Opcional - Apenas p/ Gol)"
          value={extAssistName}
          onChange={(e) => setExtAssistName(e.target.value)}
        />

        {/* LINHA DE GOLS */}
        <div className="external-btns-row" style={{ marginBottom: "8px" }}>
          <button
            className="btn-goal"
            onClick={() => {
              if (!extScorerName) return;

              addEvent(
                t,
                "EXTERNO",
                "GOAL",
                extAssistName || null,
                extScorerName,
              );

              setExtScorerName("");
              setExtAssistName("");
            }}
          >
            ⚽ + Gol
          </button>

          <button
            className="btn-og"
            onClick={() => {
              if (!extScorerName) return;

              addEvent(
                t,
                "EXTERNO",
                "OWN_GOAL",
                extAssistName || null,
                extScorerName,
              );

              setExtScorerName("");
              setExtAssistName("");
            }}
          >
            ❌ + GC
          </button>
        </div>

        {/* LINHA DE CARTÕES CORRIGIDA PARA BATER COM O PREVIEW */}
        <div className="external-btns-row">
          <button
            className="btn-yellow-card"
            style={{
              backgroundColor: "#ffeb3b",
              color: "#000",
              fontWeight: "bold",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              flex: 1,
            }}
            onClick={() => {
              if (!extScorerName) return;

              // CORREÇÃO: Enviando "YELLOW" para bater com o switch case do Preview/MatchPage
              addEvent(t, "EXTERNO", "YELLOW", null, extScorerName);

              setExtScorerName("");
              setExtAssistName("");
            }}
          >
            🟨 + Amarelo
          </button>

          <button
            className="btn-red-card"
            style={{
              backgroundColor: "#f44336",
              color: "#fff",
              fontWeight: "bold",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              flex: 1,
            }}
            onClick={() => {
              if (!extScorerName) return;

              // CORREÇÃO: Enviando "RED" para bater com o switch case do Preview/MatchPage
              addEvent(t, "EXTERNO", "RED", null, extScorerName);

              setExtScorerName("");
              setExtAssistName("");
            }}
          >
            🟥 + Vermelho
          </button>
        </div>
      </div>

      {/* EVENTOS */}
      <div className="external-events-list">
        {draft.events
          .filter((e) => e.team === t)
          .map((e) => (
            <div
              key={e.id}
              className={`event-tag ${e.type === "OWN_GOAL" ? "og" : ""} ${
                e.type === "YELLOW" ? "yellow" : ""
              } ${e.type === "RED" ? "red" : ""}`}
            >
              {e.externalName} {e.type === "GOAL" && "⚽"}
              {e.type === "OWN_GOAL" && "❌ (GC)"}
              {e.type === "YELLOW" && "🟨"}
              {e.type === "RED" && "🟥"}
              {e.assistId && ` • 🎯 ${e.assistId}`}
              <span
                className="remove-event"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    events: prev.events.filter((ev) => ev.id !== e.id),
                  }))
                }
              >
                x
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default ExternalTeamTools;
