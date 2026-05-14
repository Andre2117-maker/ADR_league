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

      {/* ARTILHEIRO */}
      <div className="external-goal-group">
        <input
          placeholder="Nome do Jogador"
          value={extScorerName}
          onChange={(e) => setExtScorerName(e.target.value)}
        />

        <input
          placeholder="Assistência (Opcional)"
          value={extAssistName}
          onChange={(e) => setExtAssistName(e.target.value)}
        />

        <div className="external-btns-row">
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
      </div>

      {/* EVENTOS */}
      <div className="external-events-list">
        {draft.events
          .filter((e) => e.team === t)
          .map((e) => (
            <div
              key={e.id}
              className={`event-tag ${e.type === "OWN_GOAL" ? "og" : ""}`}
            >
              {e.externalName} {e.type === "GOAL" ? "⚽" : "❌ (GC)"}
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
