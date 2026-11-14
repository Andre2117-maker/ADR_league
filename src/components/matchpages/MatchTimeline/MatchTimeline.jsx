import React, { useEffect, useMemo, useRef, useState } from "react";
import { PenaltiesResult, buildKicks } from "../PenaltyResult/PenaltyResult";
import "./MatchTimeline.css";

/* ==========================================================================
   ÍCONES (SVG, sem emoji)
   ========================================================================== */
const BallIcon = () => {
  // Bola clássica: branca com gomos pretos (id único para o recorte)
  const clip = `ball-${React.useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <circle cx="12" cy="12" r="9.1" />
        </clipPath>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="10.4"
        fill="#ffffff"
        stroke="#111111"
        strokeWidth="0.8"
      />
      <g clipPath={`url(#${clip})`} fill="#111111">
        <polygon points="12.00,8.60 15.23,10.95 14.00,14.75 10.00,14.75 8.77,10.95" />
        <polygon points="12.00,5.40 8.58,2.91 9.88,-1.11 14.12,-1.11 15.42,2.91" />
        <polygon points="18.28,9.96 19.58,5.94 23.82,5.94 25.12,9.96 21.70,12.45" />
        <polygon points="15.88,17.34 20.11,17.34 21.42,21.36 18.00,23.85 14.57,21.36" />
        <polygon points="8.12,17.34 9.43,21.36 6.00,23.85 2.58,21.36 3.89,17.34" />
        <polygon points="5.72,9.96 2.30,12.45 -1.12,9.96 0.18,5.94 4.42,5.94" />
      </g>
      <path
        d="M12.00 8.60L12.00 5.40 M15.23 10.95L18.28 9.96 M14.00 14.75L15.88 17.34 M10.00 14.75L8.12 17.34 M8.77 10.95L5.72 9.96"
        stroke="#111111"
        strokeWidth="0.7"
        fill="none"
      />
    </svg>
  );
};
const CardIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect
      x="6.5"
      y="3"
      width="11"
      height="16"
      rx="1.6"
      transform="rotate(10 12 11)"
      fill="currentColor"
    />
  </svg>
);

const SwapIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 9h12l-3.5-3.5" />
    <path d="M19 15H7l3.5 3.5" />
  </svg>
);

const GloveIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M8.2 3.4c.8 0 1.4.6 1.4 1.4v4.3h.6V3.6c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v5.5h.6V4.4c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v5.8h.6V6.6c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v7.2c0 3.3-2.7 6-6 6h-1.5c-2 0-3.8-1-4.9-2.6L4 12.6c-.5-.7-.3-1.6.4-2.1.6-.4 1.5-.3 2 .3l.4.5V4.8c0-.8.6-1.4 1.4-1.4z" />
    <rect x="8.5" y="19.6" width="8.6" height="2.4" rx=".6" />
  </svg>
);

const WhistleIcon = () => (
  <svg
    viewBox="0 0 48 48"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 17h22v7H27" />
    <circle cx="17" cy="26" r="9" />
    <circle cx="17" cy="26" r="2.5" fill="currentColor" stroke="none" />
    <path d="M10 13l-3-4M17 11V6M24 13l3-4" />
    <path d="M9 41h22m-5-4 5 4-5 4" />
  </svg>
);

const FlagIcon = () => (
  <svg
    viewBox="0 0 48 48"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 43V6" />
    <path d="M12 8h24l-5 7 5 7H12" />
    <path d="M18 8v14M24 8v14M30 8v14" strokeWidth="1.4" opacity=".5" />
  </svg>
);

const CrossIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z" />
  </svg>
);

const Chevron = ({ dir }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
  </svg>
);

/* Silhueta para quem não tem foto (convidados, externos) */
const Silhouette = () => (
  <svg className="mt-silhouette" viewBox="0 0 80 80" aria-hidden="true">
    <circle cx="40" cy="30" r="15" />
    <path d="M12 80c2-17 13-27 28-27s26 10 28 27z" />
  </svg>
);

/* ==========================================================================
   CARD DE EVENTO
   ========================================================================== */
const Photo = ({ src }) => (
  <span className="mt-photo">
    {src ? <img src={src} alt="" loading="lazy" /> : <Silhouette />}
  </span>
);

const EventCard = ({
  side,
  minute,
  kind,
  label,
  sub,
  photos,
  names,
  badge,
}) => (
  <div
    className={`mt-item side-${side} kind-${kind} ${photos.length > 1 ? "is-wide" : ""}`}
  >
    <div className={`mt-card ${photos.length > 1 ? "is-double" : ""}`}>
      {minute && <span className="mt-minute">{minute}'</span>}

      <div className="mt-photos">
        {photos.map((src, i) => (
          <Photo key={i} src={src} />
        ))}
      </div>

      {badge && <span className={`mt-badge badge-${kind}`}>{badge}</span>}

      <div className="mt-names">
        {names.map((n, i) => (
          <span
            key={i}
            className={`mt-name ${names.length > 1 ? (i === 0 ? "is-out" : "is-in") : ""}`}
          >
            {n}
          </span>
        ))}
      </div>
    </div>

    <span className="mt-label">{label}</span>
    <span className="mt-sub">{sub || " "}</span>
  </div>
);

const MarkerCard = ({ icon, label, sub }) => (
  <div className="mt-item kind-marker">
    <div className="mt-card mt-marker">
      <span className="mt-marker-icon">{icon}</span>
      <span className="mt-marker-label">{label}</span>
    </div>
    <span className="mt-label">&nbsp;</span>
    <span className="mt-sub">{sub || " "}</span>
  </div>
);

/* ==========================================================================
   TIMELINE
   ========================================================================== */
const parseMinute = (m) => parseFloat(String(m ?? "").replace("+", ".")) || 0;

const shortName = (n) => {
  const parts = String(n || "")
    .trim()
    .split(/\s+/);
  return parts.length > 1
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : parts[0] || "";
};

const MatchTimeline = ({ events, players = [], match = {}, mode }) => {
  const scrollRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const isIdr = mode
    ? mode === "idr"
    : typeof document !== "undefined" &&
      document.body.classList.contains("theme-idr");

  const findPlayer = (id) => players.find((p) => String(p.id) === String(id));
  const nameOf = (id, externalName) => {
    if (!id || id === "EXTERNO" || id === "OPONENTE_EXTERNO")
      return externalName || "Externo";
    const p = findPlayer(id);
    return p ? p.nickname || shortName(p.name) : externalName || "Jogador";
  };
  const photoOf = (id) => {
    const p = findPlayer(id);
    if (!p) return null;
    return (isIdr ? p.photoIDR1 || p.photo : p.photo) || null;
  };

  const ordered = useMemo(
    () =>
      (events || [])
        .map((e, i) => ({ ...e, _i: i, _m: parseMinute(e.minute) }))
        .sort((a, b) => a._m - b._m || a._i - b._i),
    [events],
  );

  // Placar ao vivo (para o card final)
  const score = useMemo(() => {
    let a = 0;
    let b = 0;
    (events || []).forEach((e) => {
      if (e.type === "GOAL") e.team === "A" ? a++ : b++;
      if (e.type === "OWN_GOAL") e.team === "A" ? b++ : a++;
    });
    return { a, b };
  }, [events]);

  const renderEvent = (e) => {
    const side = e.team === "B" ? "b" : "a";
    const key = e.id || `${e.type}-${e._i}`;
    const minute = e.minute ? String(e.minute) : null;

    switch (e.type) {
      case "GOAL":
        return (
          <EventCard
            key={key}
            side={side}
            minute={minute}
            kind="goal"
            label="Gol!"
            sub={
              e.assistId
                ? `assist. ${nameOf(e.assistId, e.externalAssistName)}`
                : null
            }
            photos={[photoOf(e.playerId)]}
            names={[nameOf(e.playerId, e.externalName)]}
            badge={<BallIcon />}
          />
        );
      case "OWN_GOAL":
        return (
          <EventCard
            key={key}
            side={side}
            minute={minute}
            kind="own-goal"
            label="Gol contra"
            photos={[photoOf(e.playerId)]}
            names={[nameOf(e.playerId, e.externalName)]}
            badge={<BallIcon />}
          />
        );
      case "YELLOW":
        return (
          <EventCard
            key={key}
            side={side}
            minute={minute}
            kind="yellow"
            label="Amarelo"
            photos={[photoOf(e.playerId)]}
            names={[nameOf(e.playerId, e.externalName)]}
            badge={<CardIcon />}
          />
        );
      case "RED":
        return (
          <EventCard
            key={key}
            side={side}
            minute={minute}
            kind="red"
            label="Vermelho"
            photos={[photoOf(e.playerId)]}
            names={[nameOf(e.playerId, e.externalName)]}
            badge={<CardIcon />}
          />
        );
      case "SUB": {
        const injured = e.reason === "Lesão" || e.reason === "Machucado";
        return (
          <EventCard
            key={key}
            side={side}
            minute={minute}
            kind={injured ? "sub-injury" : "sub"}
            label="Substituição"
            sub={injured ? "por lesão" : null}
            photos={[photoOf(e.playerOutId), photoOf(e.playerInId)]}
            names={[nameOf(e.playerOutId), nameOf(e.playerInId)]}
            badge={injured ? <CrossIcon /> : <SwapIcon />}
          />
        );
      }
      case "GK_CHANGE":
        return (
          <EventCard
            key={key}
            side={side}
            minute={minute}
            kind="gk"
            label="No gol"
            sub="troca de goleiro"
            photos={[photoOf(e.playerInId)]}
            names={[nameOf(e.playerInId, e.externalName)]}
            badge={<GloveIcon />}
          />
        );
      default:
        return null;
    }
  };

  /* Setas de rolagem (desktop) */
  const updateEdges = () => {
    const el = scrollRef.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    updateEdges();
    const el = scrollRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ordered.length]);

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (el)
      el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const pens = buildKicks(match);
  const hasPenalties = pens.kicks.length > 0;
  const teamA = match?.teamA?.name || "Time A";
  const teamB = match?.teamB?.name || "Time B";

  return (
    <section
      className={`mt-wrap ${isIdr ? "is-idr" : ""}`}
      aria-label="Linha do tempo da partida"
    >
      <header className="mt-head">
        <span className="mt-title">Linha do tempo</span>
        <span className="mt-legend">
          <i className="dot-a" /> {teamA}
          <i className="dot-b" /> {teamB}
        </span>
      </header>

      <div className="mt-strip-wrap">
        {edges.left && (
          <button
            type="button"
            className="mt-nav left"
            onClick={() => scrollBy(-1)}
            aria-label="Voltar"
          >
            <Chevron dir="left" />
          </button>
        )}

        <div className="mt-strip" ref={scrollRef} onScroll={updateEdges}>
          <MarkerCard icon={<WhistleIcon />} label="Início" />

          {ordered.map(renderEvent)}

          {ordered.length === 0 && (
            <div className="mt-empty">Nenhum lance registrado.</div>
          )}

          {/* Pênaltis entram na mesma faixa, cobrança por cobrança */}
          {hasPenalties && (
            <PenaltiesResult
              draft={match}
              players={players}
              mode={isIdr ? "idr" : "adr"}
              inline
            />
          )}

          <MarkerCard
            icon={<FlagIcon />}
            label="Fim de jogo"
            sub={
              hasPenalties
                ? `${score.a} x ${score.b} · pên. ${pens.scoreA} x ${pens.scoreB}`
                : `${score.a} x ${score.b}`
            }
          />
        </div>

        {edges.right && (
          <button
            type="button"
            className="mt-nav right"
            onClick={() => scrollBy(1)}
            aria-label="Avançar"
          >
            <Chevron dir="right" />
          </button>
        )}
      </div>
    </section>
  );
};

export default MatchTimeline;
