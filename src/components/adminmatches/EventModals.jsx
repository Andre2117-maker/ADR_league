import React, { useMemo, useState } from "react";
import Modal from "./Modal";
import { norm, normalizeMinute } from "./adminMatchesUtils";

/* ==========================================================================
   ASSISTÊNCIA — toque no nome de quem deu o passe (ou "Sem assistência")
   ========================================================================== */
export function AssistModal({ scorerName, candidates, onPick, onClose }) {
  const [q, setQ] = useState("");
  const list = useMemo(
    () => candidates.filter((p) => !q || norm(p.name).includes(norm(q))),
    [candidates, q],
  );

  return (
    <Modal title="⚽ Quem deu a assistência?" subtitle={`Gol de ${scorerName}`} onClose={onClose}>
      <button type="button" className="am-btn am-btn-block am-btn-ghost amx-noassist" onClick={() => onPick(null)}>
        Sem assistência
      </button>

      {candidates.length > 8 && (
        <input
          className="am-input"
          type="search"
          placeholder="🔍 Buscar..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      )}

      <div className="amx-grid">
        {list.map((p) => (
          <button key={p.id} type="button" className="amx-pick" onClick={() => onPick(p.id)}>
            {p.shirt !== undefined && p.shirt !== "" && <small>#{p.shirt}</small>}
            {p.name}
          </button>
        ))}
        {list.length === 0 && <p className="am-muted">Ninguém encontrado.</p>}
      </div>
    </Modal>
  );
}

/* ==========================================================================
   MINUTO — digita o número; "+" vira acréscimo; o ' é colocado sozinho
   ========================================================================== */
export function MinuteModal({ title = "⏱️ Minuto do lance", initial = "", suggestion, onSave, onClose }) {
  const [value, setValue] = useState(String(initial || "").replace(/'/g, ""));

  const save = (v = value) => onSave(normalizeMinute(v));

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="am-btn am-btn-ghost" onClick={() => onSave("")}>
            Sem minuto
          </button>
          <button type="button" className="am-btn am-btn-primary" onClick={() => save()}>
            Salvar
          </button>
        </>
      }
    >
      <div className="amx-minute">
        <input
          className="am-input amx-minute-input"
          type="text"
          inputMode="numeric"
          autoFocus
          placeholder="Ex: 15"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9+]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <span className="amx-minute-mark">'</span>
      </div>

      <div className="am-chips">
        <button type="button" className="am-chip" onClick={() => setValue((v) => (v.includes("+") ? v : `${v}+`))}>
          + Acréscimo
        </button>
        {suggestion && (
          <button type="button" className="am-chip on" onClick={() => save(String(suggestion))}>
            Agora ({suggestion}')
          </button>
        )}
      </div>
    </Modal>
  );
}

/* ==========================================================================
   SUBSTITUIÇÃO e TROCA DE GOLEIRO
   mode="sub": quem sai (em campo) / quem entra (fora de campo)
   mode="gk" : quem vai pro gol (em campo) ou nome do goleiro adversário
   ========================================================================== */
export function SubModal({
  mode = "sub",
  side,
  teamName,
  onField,
  bench,
  currentGkId,
  external = false,
  onConfirm,
  onClose,
}) {
  const [outId, setOutId] = useState("");
  const [inId, setInId] = useState("");
  const [reason, setReason] = useState("Tática");
  const [takesGoal, setTakesGoal] = useState(true);
  const [extName, setExtName] = useState("");
  const [error, setError] = useState("");

  const outIsGk = !!currentGkId && outId === currentGkId;

  if (mode === "gk") {
    const candidates = onField.filter((p) => p.id !== currentGkId);
    const confirm = () => {
      if (external) {
        if (!extName.trim()) return setError("Digite o nome do goleiro.");
        return onConfirm({ playerInId: null, externalName: extName.trim() });
      }
      if (!inId) return setError("Escolha quem vai pro gol.");
      return onConfirm({ playerInId: inId, externalName: null });
    };

    return (
      <Modal
        title={`🧤 Troca de goleiro · ${teamName}`}
        subtitle="Os gols a partir daqui contam para o novo goleiro."
        onClose={onClose}
        footer={
          <>
            <button type="button" className="am-btn am-btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="am-btn am-btn-primary" onClick={confirm}>
              Confirmar
            </button>
          </>
        }
      >
        {external ? (
          <input
            className="am-input"
            autoFocus
            placeholder="Nome do goleiro..."
            value={extName}
            onChange={(e) => setExtName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirm()}
          />
        ) : (
          <div className="amx-grid">
            {candidates.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`amx-pick ${inId === p.id ? "is-on" : ""}`}
                onClick={() => setInId(p.id)}
              >
                {p.name}
              </button>
            ))}
            {candidates.length === 0 && <p className="am-muted">Ninguém em campo.</p>}
          </div>
        )}
        {error && <p className="am-error">{error}</p>}
      </Modal>
    );
  }

  const confirm = () => {
    if (!outId || !inId) return setError("Escolha quem sai e quem entra.");
    if (outId === inId) return setError("Quem sai e quem entra não podem ser a mesma pessoa.");
    return onConfirm({ playerOutId: outId, playerInId: inId, reason, takesGoal: outIsGk && takesGoal });
  };

  return (
    <Modal
      title={`🔄 Substituição · ${teamName}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="am-btn am-btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="am-btn am-btn-primary" onClick={confirm}>
            Confirmar
          </button>
        </>
      }
    >
      <label className="am-label am-label-out">⬇️ Sai</label>
      <select className="am-input" value={outId} onChange={(e) => setOutId(e.target.value)}>
        <option value="">Quem sai...</option>
        {onField.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.id === currentGkId ? " 🧤" : ""}
          </option>
        ))}
      </select>

      <label className="am-label am-label-in">⬆️ Entra</label>
      <select className="am-input" value={inId} onChange={(e) => setInId(e.target.value)}>
        <option value="">Quem entra...</option>
        {bench.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {outIsGk && (
        <label className="am-switch">
          <input type="checkbox" checked={takesGoal} onChange={(e) => setTakesGoal(e.target.checked)} />
          <span>
            <b>🧤 Quem entra assume o gol</b>
            <small>Registra a troca de goleiro junto</small>
          </span>
        </label>
      )}

      <label className="am-label">Motivo</label>
      <div className="am-seg">
        {["Tática", "Lesão"].map((r) => (
          <button key={r} type="button" className={reason === r ? "on" : ""} onClick={() => setReason(r)}>
            {r === "Lesão" ? "🩹 Lesão" : "🧠 Tática"}
          </button>
        ))}
      </div>

      {error && <p className="am-error">{error}</p>}
    </Modal>
  );
}

/* ==========================================================================
   ESCOLHER JOGADOR (lance rápido) — grade de nomes ou nome livre (adversário)
   ========================================================================== */
export function PickPlayerModal({ title, subtitle, candidates, external = false, suggestions = [], onPick, onClose }) {
  const [q, setQ] = useState("");
  const [ext, setExt] = useState("");
  const list = useMemo(
    () => candidates.filter((p) => !q || norm(p.name).includes(norm(q))),
    [candidates, q],
  );

  if (external) {
    return (
      <Modal title={title} subtitle={subtitle} onClose={onClose}>
        <div className="am-inline">
          <input
            className="am-input"
            autoFocus
            placeholder="Nome do jogador"
            value={ext}
            onChange={(e) => setExt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ext.trim() && onPick(null, ext.trim())}
          />
          <button type="button" className="am-btn am-btn-primary" disabled={!ext.trim()} onClick={() => onPick(null, ext.trim())}>
            ✓
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="am-chips">
            {suggestions.map((n) => (
              <button key={n} type="button" className="am-chip" onClick={() => onPick(null, n)}>
                {n}
              </button>
            ))}
          </div>
        )}
      </Modal>
    );
  }

  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose}>
      {candidates.length > 8 && (
        <input className="am-input" type="search" placeholder="🔍 Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
      )}
      <div className="amx-grid">
        {list.map((p) => (
          <button key={p.id} type="button" className="amx-pick" onClick={() => onPick(p.id, null)}>
            {p.shirt !== undefined && p.shirt !== "" && <small>#{p.shirt}</small>}
            {p.name}
          </button>
        ))}
        {list.length === 0 && <p className="am-muted">Ninguém escalado neste time.</p>}
      </div>
    </Modal>
  );
}

/* ==========================================================================
   NOVO LOCAL
   ========================================================================== */
export function VenueModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await onSave(name.trim());
    setSaving(false);
  };

  return (
    <Modal
      title="📍 Novo local"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="am-btn am-btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="am-btn am-btn-primary" onClick={save} disabled={!name.trim() || saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <input
        className="am-input"
        autoFocus
        placeholder="Ex: Arena ADR"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
      />
    </Modal>
  );
}
