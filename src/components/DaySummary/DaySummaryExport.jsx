import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { exportNodeImage } from "../../utils/exportImage";
import "./daysummary.css";

/* ==========================================================================
   "GIRO DO DIA": resumo das partidas de um dia como imagem (4:5, 1080x1350)
   Layouts (a foto ocupa sempre o espaço que sobra):
   - bottom : jogos em 2 colunas e a foto embaixo
   - side   : jogos numa coluna e a foto ao lado
   - topside: 1º e último jogo em cima, o resto numa coluna e a foto ao lado
   - auto   : escolhe pelo número de jogos

   Uso no Calendar:
     <DaySummaryExport matches={matches} players={players} date="2026-11-15" />
   ========================================================================== */

const dayOf = (m) => {
  const d = m?.date;
  if (!d) return "";
  if (typeof d === "string") {
    const iso = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[0];
    const br = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (br)
      return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
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

const scoreOf = (m) => {
  let a = 0;
  let b = 0;
  (m.events || []).forEach((e) => {
    if (e.type === "GOAL") e.team === "A" ? a++ : b++;
    if (e.type === "OWN_GOAL") e.team === "A" ? b++ : a++;
  });
  return { a, b };
};

const penaltiesOf = (m) => {
  const had = (m.penalties?.A?.length || 0) + (m.penalties?.B?.length || 0) > 0;
  if (!had) return null;
  const count = (arr) =>
    (arr || []).filter((p) => (p?.result || p) === "goal").length;
  return { a: count(m.penalties.A), b: count(m.penalties.B) };
};

/* Quem representa cada time no card: capitão > goleiro > primeiro da lista */
const faceOf = (team, byId) => {
  const ids = [team?.captainId, team?.goalkeeperId, ...(team?.players || [])]
    .filter(Boolean)
    .map(String);
  for (const id of ids) {
    const p = byId[id];
    if (p?.photo) return { src: p.photo };
  }
  return null;
};

const ORDINAIS = [
  "",
  "PRIMEIRO",
  "SEGUNDO",
  "TERCEIRO",
  "QUARTO",
  "QUINTO",
  "SEXTO",
  "SÉTIMO",
  "OITAVO",
  "NONO",
  "DÉCIMO",
];

const LAYOUTS = [
  { id: "auto", label: "Automático" },
  { id: "bottom", label: "Foto embaixo" },
  { id: "side", label: "Foto ao lado" },
  { id: "topside", label: "2 em cima + foto" },
];

const autoLayout = (n) => (n <= 3 ? "bottom" : n <= 5 ? "side" : "topside");

export default function DaySummaryExport({
  matches = [],
  players = [],
  date,
  buttonLabel = "Exportar giro do dia",
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const posterRef = useRef(null);
  const fileRef = useRef(null);

  const byId = useMemo(
    () => Object.fromEntries(players.map((p) => [String(p.id), p])),
    [players],
  );
  const nameOf = (id, ext) => {
    if (!id || id === "EXTERNO") return ext || "Convidado";
    const p = byId[String(id)];
    return p
      ? p.nickname || String(p.name || "").split(" ")[0]
      : ext || "Jogador";
  };

  /* ---------- Dia ---------- */
  const days = useMemo(
    () => [...new Set(matches.map(dayOf).filter(Boolean))].sort().reverse(),
    [matches],
  );
  const [day, setDay] = useState("");
  useEffect(() => {
    if (open) setDay(date && days.includes(date) ? date : days[0] || "");
  }, [open, date, days]);

  const dayMatches = useMemo(
    () =>
      matches
        .filter((m) => dayOf(m) === day)
        .sort(
          (a, b) =>
            (Number(a.order) || 0) - (Number(b.order) || 0) ||
            (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0),
        ),
    [matches, day],
  );

  const seasonDayNumber = useMemo(() => {
    if (!day) return 0;
    const sameYear = days.filter((d) => d.startsWith(day.slice(0, 4))).sort();
    return sameYear.indexOf(day) + 1;
  }, [days, day]);

  /* ---------- Opções ---------- */
  const [titleMode, setTitleMode] = useState("month");
  const [customTitle, setCustomTitle] = useState("");
  const [layoutChoice, setLayoutChoice] = useState("auto");
  const [showScorers, setShowScorers] = useState(true);
  const [photo, setPhoto] = useState(null); // foto escolhida (fica só no aparelho)
  const [photoPos, setPhotoPos] = useState(50); // posição vertical da foto (0-100)

  const autoTitle =
    titleMode === "season"
      ? `GIRO DO ${ORDINAIS[seasonDayNumber] || `${seasonDayNumber}º`} DIA`
      : `GIRO DO DIA ${day ? Number(day.slice(8, 10)) : ""}`;
  const title = titleMode === "custom" ? customTitle || autoTitle : autoTitle;
  const layout =
    layoutChoice === "auto" ? autoLayout(dayMatches.length) : layoutChoice;

  // Libera a foto da memória ao trocar/fechar
  useEffect(() => () => photo && URL.revokeObjectURL(photo), [photo]);

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
    setPhotoPos(50);
    e.target.value = "";
  };

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

  // Altura do pôster (prévia reduzida no celular)
  const [posterH, setPosterH] = useState(675);
  useEffect(() => {
    const el = posterRef.current;
    if (!open || !el) return undefined;
    const ro = new ResizeObserver(() => setPosterH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  });

  const handleExport = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await exportNodeImage(posterRef.current, {
        filename: `giro-${day}.png`,
        background: "#ffffff",
        scale: 2,
        title,
      });
      if (res === "downloaded") setMsg("Imagem baixada!");
      if (res === "shared") setMsg("Compartilhado!");
    } catch (err) {
      console.error("Erro ao gerar o giro do dia:", err);
      setMsg("Não foi possível gerar a imagem.");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Card de uma partida ---------- */
  const scorersOf = (m, side) => {
    const list = [];
    (m.events || []).forEach((e) => {
      if (e.type === "GOAL" && e.team === side)
        list.push(nameOf(e.playerId, e.externalName));
      if (e.type === "OWN_GOAL" && e.team !== side)
        list.push(`${nameOf(e.playerId, e.externalName)} (GC)`);
    });
    // "Biel, Biel, André" -> "Biel (2), André"
    const count = {};
    list.forEach((n) => (count[n] = (count[n] || 0) + 1));
    return Object.entries(count)
      .map(([n, c]) => (c > 1 ? `${n} (${c})` : n))
      .join(", ");
  };

  const MatchCard = ({ m, n }) => {
    const s = scoreOf(m);
    const pen = penaltiesOf(m);
    const left = faceOf(m.teamA, byId);
    const isExternalB = m.teamB?.logo && !(m.teamB?.players || []).length;
    const right = isExternalB
      ? { src: m.teamB.logo, logo: true }
      : faceOf(m.teamB, byId);
    const scA = showScorers ? scorersOf(m, "A") : "";
    const scB = showScorers ? scorersOf(m, "B") : "";

    return (
      <div className="gd-card">
        <div className="gd-face">
          {left ? (
            <img src={left.src} alt="" />
          ) : (
            <span className="gd-noface" />
          )}
        </div>
        <div className="gd-center">
          <span className="gd-label">{n}º JOGO</span>
          <div className="gd-score">
            <span className="gd-side">
              <b>{s.a}</b>
              {scA && <small>{scA}</small>}
            </span>
            <i />
            <span className="gd-side">
              <b>{s.b}</b>
              {scB && <small>{scB}</small>}
            </span>
          </div>
          {pen && (
            <span className="gd-pen">
              {pen.a} x {pen.b}
            </span>
          )}
        </div>
        <div className="gd-face">
          {right ? (
            <img
              src={right.src}
              alt=""
              className={right.logo ? "is-logo" : ""}
            />
          ) : (
            <span className="gd-noface" />
          )}
        </div>
      </div>
    );
  };

  /* Foto do dia (ou o cartão dourado do ADR quando não tem foto) */
  const PhotoBox = () => (
    <div className={`gd-photo ${photo ? "" : "is-empty"}`}>
      {photo ? (
        <img
          src={photo}
          alt=""
          style={{ objectPosition: `50% ${photoPos}%` }}
        />
      ) : (
        <img className="gd-photo-logo" src="/logo.png" alt="" />
      )}
    </div>
  );

  const titleSize = title.length > 22 ? 62 : title.length > 16 ? 74 : 86;
  const list = dayMatches.map((m, i) => ({ m, n: i + 1 }));

  /* ---------- Conteúdo de cada layout ---------- */
  let body;
  if (layout === "bottom") {
    const rows = [];
    for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));
    body = (
      <div className="gd-body layout-bottom">
        {rows.map((row, r) => (
          <React.Fragment key={r}>
            <div className={`gd-row ${row.length === 1 ? "single" : ""}`}>
              {row.map(({ m, n }) => (
                <MatchCard key={m.id || n} m={m} n={n} />
              ))}
            </div>
            <span className="gd-rule" />
          </React.Fragment>
        ))}
        <PhotoBox />
      </div>
    );
  } else {
    // side / topside
    const top =
      layout === "topside" && list.length >= 3
        ? [list[0], list[list.length - 1]]
        : [];
    const column = top.length ? list.slice(1, -1) : list;
    body = (
      <div className={`gd-body layout-${layout}`}>
        {top.length > 0 && (
          <>
            <div className="gd-row">
              {top.map(({ m, n }) => (
                <MatchCard key={m.id || n} m={m} n={n} />
              ))}
            </div>
            <span className="gd-rule" />
          </>
        )}
        <div className="gd-split">
          <div className="gd-column">
            {column.map(({ m, n }, i) => (
              <React.Fragment key={m.id || n}>
                <MatchCard m={m} n={n} />
                {i < column.length - 1 && <span className="gd-rule" />}
              </React.Fragment>
            ))}
          </div>
          <PhotoBox />
        </div>
      </div>
    );
  }

  const modal = open
    ? createPortal(
        <div className="gd-overlay" onClick={() => setOpen(false)}>
          <div
            className="gd-modal"
            role="dialog"
            aria-label="Giro do dia"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="gd-modal-head">
              <span>Giro do dia</span>
              <button
                type="button"
                className="gd-x"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
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
                      {fmtDay(d)} ·{" "}
                      {matches.filter((m) => dayOf(m) === d).length} jogos
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Título</span>
                <select
                  value={titleMode}
                  onChange={(e) => setTitleMode(e.target.value)}
                >
                  <option value="month">
                    Giro do dia {day ? Number(day.slice(8, 10)) : ""}
                  </option>
                  <option value="season">Giro do {seasonDayNumber}º dia</option>
                  <option value="custom">Escrever o meu</option>
                </select>
              </label>
              {titleMode === "custom" && (
                <input
                  type="text"
                  className="gd-title-input"
                  placeholder="Ex: GIRO DA FINAL"
                  value={customTitle}
                  maxLength={30}
                  onChange={(e) => setCustomTitle(e.target.value.toUpperCase())}
                />
              )}

              {/* Layout */}
              <div className="gd-layouts" role="radiogroup" aria-label="Layout">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="radio"
                    aria-checked={layoutChoice === l.id}
                    className={layoutChoice === l.id ? "on" : ""}
                    onClick={() => setLayoutChoice(l.id)}
                  >
                    <span
                      className={`gd-lay-ico ico-${l.id === "auto" ? autoLayout(dayMatches.length) : l.id}`}
                      aria-hidden="true"
                    >
                      <i />
                      <i />
                      <i />
                    </span>
                    {l.label}
                  </button>
                ))}
              </div>

              {/* Foto */}
              <div className="gd-photo-tools">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={pickPhoto}
                />
                <button type="button" onClick={() => fileRef.current?.click()}>
                  {photo ? "Trocar foto" : "Escolher foto"}
                </button>
                {photo && (
                  <>
                    <label className="gd-range">
                      <span>Posição</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={photoPos}
                        onChange={(e) => setPhotoPos(Number(e.target.value))}
                      />
                    </label>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => setPhoto(null)}
                    >
                      Tirar foto
                    </button>
                  </>
                )}
                <label className="gd-check">
                  <input
                    type="checkbox"
                    checked={showScorers}
                    onChange={(e) => setShowScorers(e.target.checked)}
                  />
                  <span>Mostrar quem fez os gols</span>
                </label>
              </div>
            </div>

            {/* PRÉVIA (é exatamente o que vira imagem) */}
            <div className="gd-preview">
              <div className="gd-scaler" style={{ "--gd-h": `${posterH}px` }}>
                <div className="gd-poster" ref={posterRef}>
                  <span className="gd-rule" />
                  <h1 className="gd-title" style={{ fontSize: titleSize }}>
                    {title}
                  </h1>
                  <span className="gd-rule" />
                  <div className="gd-brand">
                    <span>
                      <i className="gd-diamond" /> ADR LEAGUE
                    </span>
                    <span className="gd-date">{day ? fmtDay(day) : ""}</span>
                    <span>
                      ADR LEAGUE <i className="gd-diamond" />
                    </span>
                  </div>
                  <span className="gd-rule" />

                  {dayMatches.length ? (
                    body
                  ) : (
                    <p className="gd-empty">Nenhuma partida neste dia.</p>
                  )}

                  <span className="gd-rule gd-rule-end" />
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

  return (
    <>
      <button
        type="button"
        className="gd-open"
        onClick={() => setOpen(true)}
        disabled={!days.length}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 17v3h16v-3" />
        </svg>
        {buttonLabel}
      </button>
      {modal}
    </>
  );
}
