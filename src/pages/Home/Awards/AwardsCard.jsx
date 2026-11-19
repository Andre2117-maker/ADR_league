import React, { useEffect, useMemo, useState } from "react";
import {
  useAwards,
  saveYear,
  SEED,
  DEFAULT_TEMPLATE,
  PALETTE,
  makeId,
  norm,
} from "../../../services/hallAwards"; // mesmo nível do firebase.js
import "./awards.css";

/* ==========================================================
   COMO FUNCIONA
   - Os dados ficam no services/hallAwards.js, que a página do jogador também usa
     (prêmio dado/tirado aqui aparece/some lá, e vice-versa)
   - Cada ano é um documento em `awards/{ano}` no Firestore:
       { year: 2026, items: [{ id, title, icon, color, winner, playerId, detail }] }
   - Ano sem documento usa SEED (2025) ou o modelo padrão.
   - Só quem recebe `isAdmin` vê os botões de editar.
   ========================================================== */

/* Ícones desenhados (no lugar dos emojis). Ícone salvo no banco = a chave. */
const ICONS = {
  trophy: "M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v3.5M8.5 20.5h7M9.5 17.5h5v3h-5z",
  glove: "M7 21v-4.5L4.5 12c-.8-1.4.9-2.7 2-1.6L8 12V5.5a1.3 1.3 0 0 1 2.6 0V10V4a1.3 1.3 0 0 1 2.6 0v6V5a1.3 1.3 0 0 1 2.6 0v5.5V7.5a1.3 1.3 0 0 1 2.6 0V15c0 2.5-1.3 4-3 4.8V21z",
  fire: "M12 3c1.5 3 4.5 4.6 4.5 8.6a4.5 4.5 0 0 1-9 0c0-2 1-3.3 2-4.2.2 1.4 1 2.3 2 2.6-.6-2.4.1-4.6.5-7zM10 17.5a2 2 0 0 0 4 0c0-1.2-1-1.9-2-3.2-1 1.3-2 2-2 3.2z",
  ball: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5l3.8 2.8-1.5 4.4H9.7l-1.5-4.4zM12 3v4.5M15.8 10.3l4.3-1.6M14.3 14.7l2.6 3.8M9.7 14.7l-2.6 3.8M8.2 10.3 3.9 8.7",
  target: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 11.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6z",
  medal: "M8.5 3h7l-1.8 5.5h-3.4zM12 9a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM12 12.3l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3z",
  star: "M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z",
  shield: "M12 2.8 4.5 5.6v5.8c0 4.8 3.2 8.4 7.5 9.8 4.3-1.4 7.5-5 7.5-9.8V5.6zM8.6 12l2.4 2.4 4.6-4.8",
  boot: "M4 6.5h6l1 4.5c3 .3 7 1.3 8.5 3.3.8 1.1.3 3.2-1.5 3.2H5.5c-1 0-1.5-.6-1.5-1.5zM4 13h7M7 17v2M11 17v2M15 17v2",
  crown: "M3.5 8 8 11.5l4-6.5 4 6.5L20.5 8l-1.8 10H5.3zM5.5 21h13",
  edit: "M4 20l1-4.5L15.5 5 19 8.5 8.5 19zM13.5 7l3.5 3.5",
  up: "M6 15l6-6 6 6",
  down: "M6 9l6 6 6-6",
};
const ICON_LABEL = {
  trophy: "Troféu",
  glove: "Luva",
  fire: "Fogo",
  ball: "Bola",
  target: "Alvo",
  medal: "Medalha",
  star: "Estrela",
  shield: "Escudo",
  boot: "Chuteira",
  crown: "Coroa",
};
/* Prêmios antigos salvos com emoji continuam funcionando */
const EMOJI_TO_KEY = {
  "🏆": "trophy",
  "🧤": "glove",
  "🔥": "fire",
  "⚽": "ball",
  "🎯": "target",
  "🏅": "medal",
  "⭐": "star",
  "🛡️": "shield",
  "👟": "boot",
  "👑": "crown",
};
const iconKey = (v) => (ICONS[v] ? v : EMOJI_TO_KEY[v] || "medal");

const Icon = ({ name, className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d={ICONS[iconKey(name)]} />
  </svg>
);

function AwardsCard({ players = [], onSelectPlayer, isAdmin = false }) {
  const currentYear = new Date().getFullYear();

  const saved = useAwards(); // { [ano]: items[] } vindo do banco (compartilhado)
  const [newYears, setNewYears] = useState({}); // anos criados e ainda não salvos
  const data = useMemo(() => ({ ...newYears, ...saved }), [newYears, saved]);
  const [year, setYear] = useState(currentYear);
  const [draft, setDraft] = useState(null); // null = modo leitura
  const [saving, setSaving] = useState(false);

  const itemsFor = (y) => data[y] || SEED[y] || DEFAULT_TEMPLATE();

  /* ---------- anos disponíveis ---------- */
  const years = useMemo(() => {
    const set = new Set([
      ...Object.keys(data).map(Number),
      ...Object.keys(SEED).map(Number),
      currentYear,
    ]);
    return [...set].sort((a, b) => b - a);
  }, [data, currentYear]);

  // Ao carregar, abre o ano atual se existir, senão o mais recente com vencedores
  useEffect(() => {
    if (!years.includes(year)) setYear(years[0]);
  }, [years, year]);

  const items = draft || itemsFor(year);
  const editing = draft !== null;

  /* ---------- contador de prêmios ao longo dos anos ---------- */
  const totalByName = useMemo(() => {
    const map = {};
    years.forEach((y) => {
      if (y > year) return;
      (data[y] || SEED[y] || []).forEach((it) => {
        if (!it.winner) return;
        const k = norm(it.winner);
        map[k] = (map[k] || 0) + 1;
      });
    });
    return map;
  }, [years, year, data]);

  const findPlayer = (it) => {
    if (!it.winner) return null;
    if (it.playerId) return players.find((p) => p.id === it.playerId) || null;
    const n = norm(it.winner);
    return (
      players.find((p) => norm(p.name) === n) ||
      players.find((p) => norm(p.name).split(" ")[0] === n) ||
      null
    );
  };

  /* ---------- edição (admin) ---------- */
  const startEdit = () =>
    setDraft(itemsFor(year).map((it) => ({ ...it, icon: iconKey(it.icon) })));
  const cancelEdit = () => setDraft(null);

  const patch = (id, changes) =>
    setDraft((d) => d.map((it) => (it.id === id ? { ...it, ...changes } : it)));

  const setWinner = (id, name) => {
    const n = norm(name);
    const match = players.find(
      (p) => norm(p.name) === n || norm(p.name).split(" ")[0] === n,
    );
    patch(id, { winner: name, playerId: match ? match.id : "" });
  };

  const addAward = () =>
    setDraft((d) => [
      ...d,
      {
        id: makeId(),
        title: "",
        icon: "medal",
        color: PALETTE[d.length % PALETTE.length],
        winner: "",
        playerId: "",
        detail: "",
      },
    ]);

  const removeAward = (id) => setDraft((d) => d.filter((it) => it.id !== id));

  const move = (id, dir) =>
    setDraft((d) => {
      const i = d.findIndex((it) => it.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.length) return d;
      const copy = [...d];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const saveDraft = async () => {
    const clean = draft
      .filter((it) => it.title.trim())
      .map((it) => ({
        id: it.id,
        title: it.title.trim(),
        icon: iconKey(it.icon),
        color: it.color || PALETTE[0],
        winner: (it.winner || "").trim(),
        playerId: it.playerId || "",
        detail: (it.detail || "").trim(),
      }));

    setSaving(true);
    try {
      await saveYear(year, clean);
      setNewYears((prev) => {
        const { [year]: _, ...rest } = prev;
        return rest;
      });
      setDraft(null);
    } catch (err) {
      console.error("Erro ao salvar premiações:", err);
      alert("Não foi possível salvar. Verifique as permissões do Firestore.");
    } finally {
      setSaving(false);
    }
  };

  const addYear = () => {
    const next = Math.max(...years) + 1;
    setNewYears((prev) => ({ ...prev, [next]: DEFAULT_TEMPLATE() }));
    setYear(next);
    setDraft(DEFAULT_TEMPLATE());
  };

  const changeYear = (y) => {
    if (editing && !window.confirm("Descartar as alterações não salvas?"))
      return;
    setDraft(null);
    setYear(y);
  };

  const decided = items.filter((it) => it.winner).length;
  const isOpen = decided === 0;

  return (
    <div className="aw-card">
      <div className="aw-head">
        <h3 className="aw-title">
          <Icon name="star" className="aw-title-ico" />
          Hall da Fama
        </h3>

        <div className="aw-years" role="tablist" aria-label="Temporada">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              role="tab"
              aria-selected={y === year}
              className={`aw-year ${y === year ? "is-active" : ""}`}
              onClick={() => changeYear(y)}
            >
              {y}
            </button>
          ))}
          {isAdmin && (
            <button
              type="button"
              className="aw-year aw-year-add"
              title="Adicionar próximo ano"
              onClick={addYear}
              disabled={editing}
            >
              +
            </button>
          )}
        </div>
      </div>

      <div className="aw-status">
        <span>
          {isOpen
            ? `Temporada ${year} · em disputa`
            : `Temporada ${year} · ${decided}/${items.length} prêmios`}
        </span>

        {isAdmin && !editing && (
          <button type="button" className="aw-admin-btn" onClick={startEdit}>
            <Icon name="edit" className="aw-ico" />
            Editar prêmios
          </button>
        )}
      </div>

      {/* ================= MODO EDIÇÃO ================= */}
      {editing ? (
        <div className="aw-edit">
          <datalist id="aw-players-list">
            {players
              .filter((p) => !p.isAnonymous)
              .map((p) => (
                <option key={p.id} value={p.name} />
              ))}
          </datalist>

          {draft.map((it, idx) => (
            <div
              key={it.id}
              className="aw-edit-item"
              style={{ "--award-color": it.color }}
            >
              <div className="aw-edit-row">
                <span className="aw-in-icon-preview" aria-hidden="true">
                  <Icon name={it.icon} />
                </span>
                <select
                  className="aw-in aw-in-icon"
                  value={iconKey(it.icon)}
                  onChange={(e) => patch(it.id, { icon: e.target.value })}
                  aria-label="Ícone"
                >
                  {Object.keys(ICON_LABEL).map((k) => (
                    <option key={k} value={k}>
                      {ICON_LABEL[k]}
                    </option>
                  ))}
                </select>
                <input
                  className="aw-in aw-in-title"
                  value={it.title}
                  placeholder="Nome do prêmio (ex: Artilheiro)"
                  onChange={(e) => patch(it.id, { title: e.target.value })}
                />
                <input
                  className="aw-in aw-in-color"
                  type="color"
                  value={it.color}
                  onChange={(e) => patch(it.id, { color: e.target.value })}
                  aria-label="Cor"
                />
              </div>

              <div className="aw-edit-row">
                <input
                  className="aw-in"
                  list="aw-players-list"
                  value={it.winner || ""}
                  placeholder="Vencedor (deixe vazio = A definir)"
                  onChange={(e) => setWinner(it.id, e.target.value)}
                />
                <input
                  className="aw-in"
                  value={it.detail || ""}
                  placeholder="Detalhe (ex: 18 gols)"
                  onChange={(e) => patch(it.id, { detail: e.target.value })}
                />
              </div>

              <div className="aw-edit-tools">
                <button
                  type="button"
                  onClick={() => move(it.id, -1)}
                  disabled={idx === 0}
                  aria-label="Subir"
                >
                  <Icon name="up" className="aw-ico" />
                </button>
                <button
                  type="button"
                  onClick={() => move(it.id, 1)}
                  disabled={idx === draft.length - 1}
                  aria-label="Descer"
                >
                  <Icon name="down" className="aw-ico" />
                </button>
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => removeAward(it.id)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}

          <button type="button" className="aw-add-btn" onClick={addAward}>
            + Adicionar prêmio
          </button>

          <div className="aw-edit-actions">
            <button
              type="button"
              className="aw-btn-cancel"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="aw-btn-save"
              onClick={saveDraft}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      ) : (
        /* ================= MODO LEITURA ================= */
        <div className="aw-grid" key={year}>
          {items.map((it, idx) => {
            const player = findPlayer(it);
            const wins = it.winner ? totalByName[norm(it.winner)] || 0 : 0;
            const clickable = Boolean(player && onSelectPlayer);

            return (
              <div
                key={it.id}
                className={`aw-item ${it.winner ? "" : "is-pending"} ${
                  clickable ? "is-link" : ""
                }`}
                style={{ "--award-color": it.color, "--i": idx }}
                onClick={clickable ? () => onSelectPlayer(player) : undefined}
              >
                <span className="aw-icon-bg">
                  <Icon name={it.icon} />
                </span>

                {player?.photo && (
                  <img
                    className="aw-avatar"
                    src={player.photo}
                    alt={player.name}
                  />
                )}

                <div className="aw-content">
                  <div className="aw-award-title">{it.title}</div>
                  <div className="aw-winner-name">
                    {it.winner || "A definir"}
                  </div>
                  {it.detail && <div className="aw-detail">{it.detail}</div>}
                </div>

                {wins > 1 && (
                  <span className="aw-wins" title="Prêmios no Hall da Fama">
                    <Icon name="medal" className="aw-ico" /> {wins}x
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AwardsCard;
