import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { exportNodeImage } from "../../../utils/exportImage";
import "./daysummary.css"; // janela (modal) igual à do Giro do dia
import "./dreamteam.css";

/* ==========================================================================
   SELEÇÃO DO DIA — imagem 1280 x 960 com os melhores do dia
   Esquerda: "Elenco dos sonhos" (lista com os números do dia)
   Direita : campo com a foto de cada um na posição

   TAMANHO DO TIME (automático):
   olha todas as partidas do dia e faz a média de jogadores por time
   (pela formação "5_JOG..." / "6_JOG..." ou pela escalação).
   Média 5 → time de 5 (2-1-1) · média 6 → time de 6 (2-2-1) · etc.

   NOTA DE CADA JOGADOR NO DIA:
     gol 3 · assistência 2 · vitória 2 · empate 1 · gol contra -2
   GOLEIRO (quem foi o goleiro do time na partida):
     vitória 2 · jogo sem sofrer gol 3 · cada gol sofrido -0,5

   Quem escolhe a posição é o cadastro do jogador (posição principal primeiro).
   O admin pode trocar qualquer jogador antes de baixar.
   ========================================================================== */

/* Só o admin vê o botão. Para liberar para todo mundo, troque para false. */
const SO_ADMIN = true;

const dayOf = (m) => {
  const d = m?.date;
  if (!d) return "";
  if (typeof d === "string") {
    const iso = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[0];
    const br = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
  }
  const dt =
    typeof d?.toDate === "function"
      ? d.toDate()
      : d?.seconds
        ? new Date(d.seconds * 1000)
        : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const fmtDay = (iso) => iso.split("-").reverse().join("/");

/* posição do cadastro → setor do campo */
const GROUP_OF = {
  GOL: "GK",
  FIX: "DEF",
  ZAG: "DEF",
  LE: "DEF",
  LD: "DEF",
  ALE: "MID",
  ALD: "MID",
  VOL: "MID",
  MEI: "MID",
  PIV: "ATT",
  ATA: "ATT",
  PE: "ATT",
  PD: "ATT",
};

const SLOT_LABEL = { GK: "GOL", DEF: "FIXO", MID: "ALA", ATT: "PIVÔ" };

/* formações por tamanho de time (de trás pra frente: defesa, meio, ataque) */
const FORMATIONS = {
  4: { label: "1-1-1", DEF: 1, MID: 1, ATT: 1 },
  5: { label: "2-1-1", DEF: 2, MID: 1, ATT: 1 },
  6: { label: "2-2-1", DEF: 2, MID: 2, ATT: 1 },
  7: { label: "3-2-1", DEF: 3, MID: 2, ATT: 1 },
};

/* altura de cada setor no campo (0 = topo, 100 = embaixo) */
const ROW_Y = { ATT: 17, MID: 42, DEF: 66, GK: 87 };

const buildSlots = (size) => {
  const f = FORMATIONS[size] || FORMATIONS[5];
  const slots = [{ key: "GK-0", group: "GK", x: 50, y: ROW_Y.GK }];
  ["DEF", "MID", "ATT"].forEach((g) => {
    const n = f[g];
    for (let i = 0; i < n; i++) {
      // espalha na largura: 1 → meio, 2 → 30/70, 3 → 20/50/80
      const x = n === 1 ? 50 : 20 + (60 * i) / (n - 1);
      slots.push({ key: `${g}-${i}`, group: g, x, y: ROW_Y[g] });
    }
  });
  return slots;
};

const scoreOf = (m) => {
  let a = 0;
  let b = 0;
  (m.events || []).forEach((e) => {
    if (e.type === "GOAL") e.team === "A" ? a++ : b++;
    if (e.type === "OWN_GOAL") e.team === "A" ? b++ : a++;
  });
  return { a, b };
};

const sideIds = (m, side) =>
  (m[`actualParticipants${side}`] || m[`team${side}`]?.players || []).map(String);

/* quantos jogadores cada time teve na partida */
const teamSize = (m, side) => {
  const f = String(m[`formation${side}`] || "");
  const byFormation = f.match(/^(\d+)_JOG/);
  if (byFormation) return Number(byFormation[1]);
  return sideIds(m, side).length;
};

const posOf = (p) =>
  (p?.positions?.length ? p.positions : p?.position ? [p.position] : []).map((x) =>
    String(x).toUpperCase(),
  );

const firstName = (p) => p?.nickname || String(p?.name || "").split(" ")[0];

export default function DreamTeamExport({
  matches = [],
  players = [],
  date,
  isAdmin = false,
  buttonLabel = "Seleção do dia",
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const posterRef = useRef(null);

  const byId = useMemo(
    () => Object.fromEntries(players.map((p) => [String(p.id), p])),
    [players],
  );

  /* ---------- dia ---------- */
  const days = useMemo(
    () => [...new Set(matches.map(dayOf).filter(Boolean))].sort().reverse(),
    [matches],
  );
  const [day, setDay] = useState("");
  useEffect(() => {
    if (open) setDay(date && days.includes(date) ? date : days[0] || "");
  }, [open, date, days]);

  const dayMatches = useMemo(() => matches.filter((m) => dayOf(m) === day), [matches, day]);

  /* ---------- tamanho do time (média do dia) ---------- */
  const avgSize = useMemo(() => {
    const sizes = [];
    dayMatches.forEach((m) =>
      ["A", "B"].forEach((s) => {
        const n = teamSize(m, s);
        if (n >= 3) sizes.push(n);
      }),
    );
    if (!sizes.length) return 5;
    return sizes.reduce((a, b) => a + b, 0) / sizes.length;
  }, [dayMatches]);

  const autoSize = Math.min(7, Math.max(4, Math.round(avgSize)));
  const [sizeChoice, setSizeChoice] = useState("auto");
  const size = sizeChoice === "auto" ? autoSize : Number(sizeChoice);
  const slots = useMemo(() => buildSlots(size), [size]);

  /* ---------- números de cada jogador no dia ---------- */
  const stats = useMemo(() => {
    const t = {};
    const get = (id) =>
      (t[id] = t[id] || {
        id,
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals: 0,
        assists: 0,
        ownGoals: 0,
        gkGames: 0,
        cleanSheets: 0,
        conceded: 0,
        gkWins: 0,
      });

    dayMatches.forEach((m) => {
      const s = scoreOf(m);
      const winner = String(m.penaltiesWinner || m.winner || "").toUpperCase();
      ["A", "B"].forEach((side) => {
        const mine = side === "A" ? s.a : s.b;
        const theirs = side === "A" ? s.b : s.a;
        const res =
          winner === "A" || winner === "B"
            ? winner === side
              ? "W"
              : "L"
            : mine > theirs
              ? "W"
              : mine < theirs
                ? "L"
                : "D";
        const gkId = String(m[`team${side}`]?.goalkeeperId || "");

        sideIds(m, side).forEach((id) => {
          if (!byId[id]) return; // convidado de fora
          const r = get(id);
          r.games++;
          if (res === "W") r.wins++;
          else if (res === "D") r.draws++;
          else r.losses++;
          if (id === gkId) {
            r.gkGames++;
            r.conceded += theirs;
            if (theirs === 0) r.cleanSheets++;
            if (res === "W") r.gkWins++;
          }
        });
      });

      (m.events || []).forEach((e) => {
        const pid = String(e.playerId || "");
        if (e.type === "GOAL" && byId[pid]) get(pid).goals++;
        if (e.type === "GOAL" && e.assistId && byId[String(e.assistId)])
          get(String(e.assistId)).assists++;
        if (e.type === "ASSIST" && byId[pid]) get(pid).assists++;
        if (e.type === "OWN_GOAL" && byId[pid]) get(pid).ownGoals++;
      });
    });

    Object.values(t).forEach((r) => {
      r.score = r.goals * 3 + r.assists * 2 + r.wins * 2 + r.draws - r.ownGoals * 2;
      r.gkScore = r.gkWins * 2 + r.cleanSheets * 3 - r.conceded * 0.5;
    });
    return t;
  }, [dayMatches, byId]);

  const ranked = useMemo(
    () => Object.values(stats).sort((a, b) => b.score - a.score || b.goals - a.goals),
    [stats],
  );

  /* ---------- monta a seleção ---------- */
  const autoPick = useMemo(() => {
    const pick = {};
    const used = new Set();
    const free = (g) => slots.filter((s) => s.group === g && !pick[s.key]);

    // goleiro: o melhor de quem jogou no gol; senão quem tem GOL no cadastro
    const gks = Object.values(stats)
      .filter((r) => r.gkGames > 0)
      .sort((a, b) => b.gkScore - a.gkScore || b.score - a.score);
    const gk =
      gks[0] || ranked.find((r) => posOf(byId[r.id])[0] === "GOL") || null;
    if (gk) {
      pick["GK-0"] = gk.id;
      used.add(gk.id);
    }

    const outfield = ranked.filter((r) => !used.has(r.id));
    // 1ª volta: posição principal do cadastro
    outfield.forEach((r) => {
      const g = GROUP_OF[posOf(byId[r.id])[0]];
      if (!g || g === "GK") return;
      const slot = free(g)[0];
      if (slot) {
        pick[slot.key] = r.id;
        used.add(r.id);
      }
    });
    // 2ª volta: qualquer posição do cadastro
    outfield.forEach((r) => {
      if (used.has(r.id)) return;
      const groups = posOf(byId[r.id]).map((p) => GROUP_OF[p]);
      const slot = slots.find((s) => s.group !== "GK" && !pick[s.key] && groups.includes(s.group));
      if (slot) {
        pick[slot.key] = r.id;
        used.add(r.id);
      }
    });
    // 3ª volta: completa com os melhores que sobraram
    slots.forEach((s) => {
      if (pick[s.key]) return;
      const r = ranked.find((x) => !used.has(x.id));
      if (r) {
        pick[s.key] = r.id;
        used.add(r.id);
      }
    });
    return pick;
  }, [slots, stats, ranked, byId]);

  // trocas feitas pelo admin (zeram ao mudar o dia ou o tamanho)
  const [overrides, setOverrides] = useState({});
  useEffect(() => setOverrides({}), [day, size]);
  const pick = { ...autoPick, ...overrides };

  const swap = (slotKey, newId) => {
    setOverrides((prev) => {
      const next = { ...prev };
      // se o jogador já estava em outra vaga, troca os dois de lugar
      const other = slots.find((s) => s.key !== slotKey && pick[s.key] === newId);
      if (other) next[other.key] = pick[slotKey] || "";
      next[slotKey] = newId;
      return next;
    });
  };

  /* ---------- título ---------- */
  const [title, setTitle] = useState("SELEÇÃO DO DIA");
  const [showStats, setShowStats] = useState(true);

  /* ---------- janela ---------- */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // prévia encolhe para caber na tela (a imagem sai sempre no tamanho cheio)
  const previewRef = useRef(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    if (!open) return undefined;
    const el = previewRef.current;
    if (!el) return undefined;
    const fit = () => setScale(Math.min(1, (el.clientWidth - 16) / 640));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const handleExport = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await exportNodeImage(posterRef.current, {
        filename: `selecao-${day}.png`,
        background: "#ffffff",
        scale: 2,
        title,
      });
      if (res === "downloaded") setMsg("Imagem baixada!");
      if (res === "shared") setMsg("Compartilhado!");
    } catch (err) {
      console.error("Erro ao gerar a seleção do dia:", err);
      setMsg("Não foi possível gerar a imagem.");
    } finally {
      setBusy(false);
    }
  };

  const statLine = (r) => {
    if (!r) return "";
    const parts = [];
    if (r.goals) parts.push(`${r.goals} ${r.goals === 1 ? "gol" : "gols"}`);
    if (r.assists) parts.push(`${r.assists} ${r.assists === 1 ? "assist." : "assists."}`);
    parts.push(`${r.wins}V ${r.draws ? `${r.draws}E ` : ""}${r.losses}D`);
    return parts.join(" · ");
  };

  const gkLine = (r) => {
    if (!r) return "";
    if (!r.gkGames) return statLine(r);
    return `${r.cleanSheets} sem sofrer gol · ${r.conceded} sofridos · ${r.wins}V ${r.losses}D`;
  };

  // ordem da lista: goleiro, defesa, meio, ataque
  const listSlots = slots;

  const modal = open
    ? createPortal(
        <div className="gd-overlay" onClick={() => setOpen(false)}>
          <div
            className="gd-modal dt-modal"
            role="dialog"
            aria-label="Seleção do dia"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="gd-modal-head">
              <span>Seleção do dia</span>
              <button type="button" className="gd-x" onClick={() => setOpen(false)} aria-label="Fechar">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>

            <div className="gd-controls">
              <label>
                <span>Dia</span>
                <select value={day} onChange={(e) => setDay(e.target.value)}>
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {fmtDay(d)} · {matches.filter((m) => dayOf(m) === d).length} jogos
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Tamanho do time</span>
                <select value={sizeChoice} onChange={(e) => setSizeChoice(e.target.value)}>
                  <option value="auto">
                    Automático · {autoSize} ({FORMATIONS[autoSize].label}) — média {avgSize.toFixed(1).replace(".", ",")}
                  </option>
                  {[4, 5, 6, 7].map((n) => (
                    <option key={n} value={n}>
                      Time de {n} ({FORMATIONS[n].label})
                    </option>
                  ))}
                </select>
              </label>
              <input
                type="text"
                className="gd-title-input"
                value={title}
                maxLength={24}
                onChange={(e) => setTitle(e.target.value.toUpperCase())}
                aria-label="Título"
              />

              {/* trocar jogadores */}
              <div className="dt-swaps">
                {slots.map((s) => (
                  <label key={s.key}>
                    <span>{SLOT_LABEL[s.group]}</span>
                    <select value={pick[s.key] || ""} onChange={(e) => swap(s.key, e.target.value)}>
                      <option value="">—</option>
                      {ranked.map((r) => (
                        <option key={r.id} value={r.id}>
                          {byId[r.id]?.name} ({r.score} pts)
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <label className="gd-check">
                <input type="checkbox" checked={showStats} onChange={(e) => setShowStats(e.target.checked)} />
                <span>Mostrar os números do dia</span>
              </label>
            </div>

            {/* PRÉVIA (é exatamente o que vira imagem) */}
            <div className="dt-preview" ref={previewRef}>
              <div
                className="dt-scaler"
                style={{ transform: `scale(${scale})`, marginBottom: `${(scale - 1) * 480}px` }}
              >
                <div className="dt-poster" ref={posterRef}>
                  <header className="dt-head">
                    <span className="dt-rule" />
                    <h1 className="dt-title">{title}</h1>
                    <div className="dt-brand">
                      <span>
                        <i className="gd-diamond" /> ADR LEAGUE
                      </span>
                      <span className="dt-date">{day ? fmtDay(day) : ""}</span>
                      <span>
                        FORMAÇÃO {FORMATIONS[size].label} <i className="gd-diamond" />
                      </span>
                    </div>
                    <span className="dt-rule" />
                  </header>

                  <div className="dt-body">
                    {/* ESQUERDA: elenco dos sonhos */}
                    <section className="dt-list">
                      <h2 className="dt-list-title">Elenco dos sonhos</h2>
                      <ol>
                        {listSlots.map((s) => {
                          const p = byId[pick[s.key]];
                          const r = stats[pick[s.key]];
                          return (
                            <li key={s.key}>
                              <span className={`dt-pos g-${s.group}`}>{SLOT_LABEL[s.group]}</span>
                              <span className="dt-li-text">
                                <b>{p ? p.name : "—"}</b>
                                {showStats && r && (
                                  <small>{s.group === "GK" ? gkLine(r) : statLine(r)}</small>
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                      <p className="dt-rule-text">
                        {dayMatches.length} {dayMatches.length === 1 ? "jogo" : "jogos"} no dia ·
                        nota: gol 3, assistência 2, vitória 2, empate 1
                      </p>
                    </section>

                    {/* DIREITA: campo */}
                    <section className="dt-pitch">
                      <span className="dt-pitch-mid" />
                      <span className="dt-pitch-circle" />
                      <span className="dt-pitch-box is-top" />
                      <span className="dt-pitch-box is-bottom" />
                      {slots.map((s) => {
                        const p = byId[pick[s.key]];
                        return (
                          <div key={s.key} className="dt-chip" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
                            <span className="dt-face">
                              {p?.photo ? (
                                <img src={p.photo} alt="" />
                              ) : (
                                <i>{firstName(p).slice(0, 1) || "?"}</i>
                              )}
                            </span>
                            <span className="dt-chip-name">{p ? firstName(p) : "—"}</span>
                          </div>
                        );
                      })}
                    </section>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="gd-download"
              onClick={handleExport}
              disabled={busy || !dayMatches.length}
            >
              {busy ? "GERANDO..." : "BAIXAR / COMPARTILHAR"}
            </button>
            {msg && <p className="gd-msg">{msg}</p>}
          </div>
        </div>,
        document.body,
      )
    : null;

  if (SO_ADMIN && !isAdmin) return null;

  return (
    <>
      <button type="button" className="gd-open dt-open" onClick={() => setOpen(true)} disabled={!days.length}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h16v16H4zM4 12h16M12 4v16M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
        </svg>
        {buttonLabel}
      </button>
      {modal}
    </>
  );
}
