import React from "react";
import "./penaltiesresult.css";

/* ==========================================================================
   DISPUTA DE PÊNALTIS EM CARDS
   - <PenaltiesResult draft={match} players={players} />         → bloco próprio
   - <PenaltiesResult draft={match} players={players} inline />  → só os cards
     (usado dentro da faixa da MatchTimeline)
   ========================================================================== */

/* Trave com rede + check / x */
const NetIcon = ({ ok }) => (
  <svg viewBox="0 0 32 24" aria-hidden="true">
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <path d="M2 21V4h20v17" />
      <path
        d="M6 4v17M10 4v17M14 4v17M18 4v17M2 8.5h20M2 13h20M2 17.5h20"
        strokeWidth="0.8"
        opacity="0.65"
      />
    </g>
    <circle cx="25" cy="16" r="6.2" fill="currentColor" />
    {ok ? (
      <path
        d="M22.3 16.1l1.9 1.9 3.6-3.8"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <path
        d="M22.8 13.8l4.4 4.4M27.2 13.8l-4.4 4.4"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    )}
  </svg>
);

const GoalFrameIcon = () => (
  <svg
    viewBox="0 0 48 40"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinejoin="round"
  >
    <path d="M5 36V6h38v30" />
    <path
      d="M11 6v30M17 6v30M23 6v30M29 6v30M35 6v30M5 12h38M5 18h38M5 24h38M5 30h38"
      strokeWidth="1.1"
      opacity=".55"
    />
    <path d="M2 36h44" strokeLinecap="round" />
  </svg>
);

const Silhouette = () => (
  <svg className="pr-silhouette" viewBox="0 0 80 80" aria-hidden="true">
    <circle cx="40" cy="30" r="15" />
    <path d="M12 80c2-17 13-27 28-27s26 10 28 27z" />
  </svg>
);

const shortName = (n) => {
  const parts = String(n || "")
    .trim()
    .split(/\s+/);
  return parts.length > 1
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : parts[0] || "";
};

/* Monta a ordem das cobranças (A1, B1, A2, B2...) com o placar acumulado */
export const buildKicks = (draft) => {
  const A = draft?.penalties?.A || [];
  const B = draft?.penalties?.B || [];
  const max = Math.max(A.length, B.length);
  const kicks = [];
  let a = 0;
  let b = 0;
  for (let i = 0; i < max; i++) {
    [
      ["A", A[i]],
      ["B", B[i]],
    ].forEach(([team, k]) => {
      if (!k) return;
      if (k.result === "goal") team === "A" ? a++ : b++;
      kicks.push({ ...k, team, round: i + 1, scoreA: a, scoreB: b });
    });
  }
  return { kicks, scoreA: a, scoreB: b };
};

export const PenaltiesResult = ({
  draft,
  players = [],
  inline = false,
  mode,
}) => {
  const { kicks, scoreA, scoreB } = buildKicks(draft);
  if (kicks.length === 0) return null;

  const isIdr = mode
    ? mode === "idr"
    : typeof document !== "undefined" &&
      document.body.classList.contains("theme-idr");

  const find = (id) => players.find((p) => String(p.id) === String(id));
  const nameOf = (k) => {
    if (!k.playerId || k.playerId === "EXTERNO")
      return k.externalName || "Externo";
    const p = find(k.playerId);
    return p ? p.nickname || shortName(p.name) : k.externalName || "Jogador";
  };
  const photoOf = (k) => {
    const p = find(k.playerId);
    return p ? (isIdr ? p.photoIDR1 || p.photo : p.photo) || null : null;
  };

  const cards = (
    <>
      <div className="pr-item kind-marker">
        <div className="pr-card pr-marker">
          <GoalFrameIcon />
          <span>Pênaltis</span>
        </div>
        <span className="pr-label">&nbsp;</span>
        <span className="pr-sub">&nbsp;</span>
      </div>

      {kicks.map((k, i) => {
        const pending = k.result !== "goal" && k.result !== "miss";
        const ok = k.result === "goal";
        const photo = photoOf(k);
        return (
          <div
            key={`${k.team}-${k.round}-${i}`}
            className={`pr-item side-${k.team.toLowerCase()} ${ok ? "is-goal" : pending ? "is-pending" : "is-miss"}`}
            style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
          >
            <div className="pr-card">
              <span className="pr-round">{k.round}ª</span>
              <span className="pr-photo">
                {photo ? (
                  <img src={photo} alt="" loading="lazy" />
                ) : (
                  <Silhouette />
                )}
              </span>
              {!pending && (
                <span className="pr-badge">
                  <NetIcon ok={ok} />
                </span>
              )}
              <span className="pr-name">{pending ? "—" : nameOf(k)}</span>
            </div>
            <span className="pr-label">
              {pending ? "Não cobrou" : ok ? "Gol!" : "Perdeu"}
            </span>
            <span className="pr-sub">
              {pending ? " " : `${k.scoreA} x ${k.scoreB}`}
            </span>
          </div>
        );
      })}
    </>
  );

  if (inline) return cards;

  const teamA = draft?.teamA?.name || "Time A";
  const teamB = draft?.teamB?.name || "Time B";

  return (
    <section
      className={`pr-wrap ${isIdr ? "is-idr" : ""}`}
      aria-label="Disputa de pênaltis"
    >
      <header className="pr-head">
        <span className="pr-title">Disputa de pênaltis</span>
        <span className="pr-score">
          <span>{teamA}</span>
          <b className={scoreA > scoreB ? "win" : ""}>{scoreA}</b>
          <i>x</i>
          <b className={scoreB > scoreA ? "win" : ""}>{scoreB}</b>
          <span>{teamB}</span>
        </span>
      </header>
      <div className="pr-strip">{cards}</div>
    </section>
  );
};

export default PenaltiesResult;
