import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../firebase"; // ajuste o caminho se necessário
import "./awards.css";

/* ==========================================================
   COMO FUNCIONA
   - Cada ano é um documento em `awards/{ano}` no Firestore:
       { year: 2026, items: [{ id, title, icon, color, winner, playerId, detail }] }
   - Ano sem documento usa SEED (2025) ou o modelo padrão.
   - Só quem recebe `isAdmin` vê os botões de editar.
   ========================================================== */

const PALETTE = [
  "#d4af37",
  "#4caf50",
  "#ff9800",
  "#e53935",
  "#2196f3",
  "#9c27b0",
  "#00bcd4",
];

const makeId = () => Math.random().toString(36).slice(2, 9);

// Modelo de um ano novo (vencedores em branco = "A definir")
const DEFAULT_TEMPLATE = () => [
  { id: "mvp", title: "MVP da Temporada", icon: "🏆", color: "#d4af37" },
  { id: "gk", title: "Paredão do Ano", icon: "🧤", color: "#4caf50" },
  { id: "puskas", title: "Puskás ADR", icon: "🔥", color: "#ff9800" },
  { id: "scorer", title: "Artilheiro", icon: "⚽", color: "#e53935" },
  {
    id: "assist",
    title: "Líder de Assistências",
    icon: "🎯",
    color: "#2196f3",
  },
];

// Dados que já existiam antes de ir para o banco
const SEED = {
  2025: [
    {
      id: "mvp",
      title: "MVP da Temporada",
      icon: "🏆",
      color: "#d4af37",
      winner: "Davi",
    },
    {
      id: "gk",
      title: "Paredão do Ano",
      icon: "🧤",
      color: "#4caf50",
      winner: "Thaiane",
    },
    {
      id: "puskas",
      title: "Puskás ADR",
      icon: "🔥",
      color: "#ff9800",
      winner: "Renzo",
    },
  ],
};

const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

function AwardsCard({ players = [], onSelectPlayer, isAdmin = false }) {
  const currentYear = new Date().getFullYear();

  const [data, setData] = useState({}); // { [ano]: items[] } vindo do banco
  const [year, setYear] = useState(currentYear);
  const [draft, setDraft] = useState(null); // null = modo leitura
  const [saving, setSaving] = useState(false);

  /* ---------- carrega do Firestore ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "awards"));
        const loaded = {};
        snap.forEach((d) => {
          const v = d.data();
          if (Array.isArray(v.items)) loaded[d.id] = v.items;
        });
        if (alive) setData(loaded);
      } catch (err) {
        console.error("Erro ao carregar premiações:", err);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
  const startEdit = () => setDraft(itemsFor(year).map((it) => ({ ...it })));
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
        icon: "🏅",
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
        icon: it.icon || "🏅",
        color: it.color || PALETTE[0],
        winner: (it.winner || "").trim(),
        playerId: it.playerId || "",
        detail: (it.detail || "").trim(),
      }));

    setSaving(true);
    try {
      await setDoc(doc(db, "awards", String(year)), { year, items: clean });
      setData((prev) => ({ ...prev, [year]: clean }));
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
    setData((prev) => ({ ...prev, [next]: DEFAULT_TEMPLATE() }));
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
        <h3 className="aw-title">⭐ Hall da Fama</h3>

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
            ✎ Editar prêmios
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
                <input
                  className="aw-in aw-in-icon"
                  value={it.icon}
                  maxLength={4}
                  onChange={(e) => patch(it.id, { icon: e.target.value })}
                  aria-label="Ícone"
                />
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
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(it.id, 1)}
                  disabled={idx === draft.length - 1}
                  aria-label="Descer"
                >
                  ↓
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
                <span className="aw-icon-bg">{it.icon}</span>

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
                    🏅 {wins}x
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
