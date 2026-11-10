import React, { useMemo, useState } from "react";

/**
 * Time adversário (amistoso / campeonato): não tem lista de jogadores,
 * então os lances são por nome. Nomes já usados viram sugestão.
 */
export default function ExternalTeamTools({
  side,
  team,
  events,
  onSetGkName,
  onAddEvent,
  onRemoveEvent,
  onOpenGk,
}) {
  const [name, setName] = useState("");
  const [assist, setAssist] = useState("");
  const [error, setError] = useState("");

  const knownNames = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      if (e.externalName) set.add(e.externalName);
      if (e.assistId && e.type === "GOAL") set.add(e.assistId);
    });
    return [...set].sort();
  }, [events]);

  const add = (type) => {
    if (!name.trim()) {
      setError("Digite o nome do jogador.");
      return;
    }
    onAddEvent(type, name.trim(), type === "GOAL" ? assist.trim() || null : null);
    setName("");
    setAssist("");
    setError("");
  };

  const listId = `ext-names-${side}`;

  return (
    <div className="amx-ext">
      <label className="am-label">🧤 Goleiro titular do adversário</label>
      <div className="am-inline">
        <input
          className="am-input"
          placeholder="Nome do goleiro"
          value={team.externalGoalkeeperName || ""}
          onChange={(e) => onSetGkName(e.target.value)}
        />
        <button type="button" className="am-chip" onClick={onOpenGk}>
          Trocar
        </button>
      </div>

      <div className="am-divider" />

      <label className="am-label">Lance do adversário</label>
      <input
        className="am-input"
        placeholder="Nome do jogador"
        list={listId}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="am-input"
        placeholder="Assistência (opcional, só para gol)"
        list={listId}
        value={assist}
        onChange={(e) => setAssist(e.target.value)}
      />
      <datalist id={listId}>
        {knownNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <div className="amx-ext-actions">
        <button type="button" className="amp-act amp-goal" onClick={() => add("GOAL")}>
          ⚽ Gol
        </button>
        <button type="button" className="amp-act amp-og" onClick={() => add("OWN_GOAL")}>
          GC
        </button>
        <button type="button" className="amp-act amp-yellow" onClick={() => add("YELLOW")}>
          🟨
        </button>
        <button type="button" className="amp-act amp-red" onClick={() => add("RED")}>
          🟥
        </button>
      </div>
      {error && <p className="am-error">{error}</p>}

      {events.length > 0 && (
        <div className="amx-ext-list">
          {events.map((e) => (
            <span key={e.id} className={`amx-tag t-${e.type}`}>
              {e.minute && <b>{e.minute}</b>}
              {e.type === "GOAL" && "⚽"}
              {e.type === "OWN_GOAL" && "⚠️"}
              {e.type === "YELLOW" && "🟨"}
              {e.type === "RED" && "🟥"}
              {e.type === "GK_CHANGE" && "🧤"} {e.externalName}
              {e.type === "GOAL" && e.assistId && <small> · 🎯 {e.assistId}</small>}
              <button type="button" onClick={() => onRemoveEvent(e.id)} aria-label="Remover">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
