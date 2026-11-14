import React, { useMemo } from "react";
import { Link } from "react-router-dom";

/* ==========================================================================
   TITULARES E RESERVAS (abaixo do campo)
   - Titular = quem está escalado nos slots da formação
   - Reserva = quem estava no time e não começou jogando
   - Mostra quem entrou/saiu e em que minuto, gols, assistências e cartões
   ========================================================================== */

const GK_ROLES = ["GK", "GOL", "GOLEIRO", "G", "GL"];

const shortRole = (role) => {
  const r = String(role || "").toUpperCase();
  if (GK_ROLES.includes(r) || r.includes("GOL")) return "GOL";
  if (r.includes("ZAG") || r.includes("DEF") || r.includes("LAT")) return "DEF";
  if (
    r.includes("VOL") ||
    r.includes("MEI") ||
    r.includes("ALA") ||
    r.includes("MC")
  )
    return "MEI";
  if (
    r.includes("ATA") ||
    r.includes("PON") ||
    r.includes("CEN") ||
    r.includes("FIX")
  )
    return "ATA";
  return r.slice(0, 3) || "JOG";
};

const ROLE_ORDER = { GOL: 0, DEF: 1, MEI: 2, ATA: 3 };

/* Ícones pequenos (SVG, sem emoji) */
const Ball = () => {
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
const Boot = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M4.6 5.6h5.4l.9 3.8 6.4 2.3c2 .8 3.5 2.4 3.5 4.1v1.4H4.1c-.8 0-1.4-.6-1.4-1.4v-2.3c0-1.1.5-2 1.1-2.8z" />
    <path d="M5 18.4h2.2v1.8H5zM9.8 18.4H12v1.8H9.8zM14.6 18.4h2.2v1.8h-2.2z" />
  </svg>
);
const Arrow = ({ up }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={up ? "M12 19V5M6 11l6-6 6 6" : "M12 5v14M6 13l6 6 6-6"} />
  </svg>
);
const Glove = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M8.2 3.4c.8 0 1.4.6 1.4 1.4v4.3h.6V3.6c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v5.5h.6V4.4c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v5.8h.6V6.6c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v7.2c0 3.3-2.7 6-6 6h-1.5c-2 0-3.8-1-4.9-2.6L4 12.6c-.5-.7-.3-1.6.4-2.1.6-.4 1.5-.3 2 .3l.4.5V4.8c0-.8.6-1.4 1.4-1.4z" />
  </svg>
);

const minuteTxt = (m) =>
  m !== undefined && m !== null && m !== "" ? `${m}'` : "";

export default function Lineups({
  match,
  players = [],
  teams = [],
  getActiveSlots,
  tacticalByTeam, // opcional: { A: {...} } (amistoso usa a escalação de cada jogo)
  title,
}) {
  const byId = useMemo(
    () => Object.fromEntries(players.map((p) => [String(p.id), p])),
    [players],
  );
  const events = match?.events || [];

  const buildTeam = (t) => {
    const k = t.k;
    const team = k === "A" ? match.teamA : match.teamB;
    const tactical =
      tacticalByTeam?.[k] ||
      (k === "A" ? match.tacticalA : match.tacticalB) ||
      {};
    const slots = getActiveSlots ? getActiveSlots(t.f) : [];
    const slotRole = Object.fromEntries(slots.map((s) => [s.id, s.role]));

    // Se o slot guarda quem ENTROU, volta pela cadeia de substituições até o titular
    const resolveStarter = (pid) => {
      let id = String(pid);
      for (let i = 0; i < 10; i++) {
        const sub = events.find(
          (e) =>
            e.type === "SUB" && e.team === k && String(e.playerInId) === id,
        );
        if (!sub || !sub.playerOutId) break;
        id = String(sub.playerOutId);
      }
      return id;
    };

    // Titulares: escalados nos slots que existem na formação atual
    const starters = [];
    const seen = new Set();
    Object.entries(tactical).forEach(([slotId, pid]) => {
      if (!pid || !(slotId in slotRole)) return;
      const id = resolveStarter(pid);
      if (seen.has(id)) return;
      seen.add(id);
      starters.push({ id, role: shortRole(slotRole[slotId]) });
    });

    // Elenco do dia + quem entrou por substituição (mesmo que não esteja na lista)
    const roster = [
      ...new Set([
        ...(team?.players || []).map(String),
        ...events
          .filter((e) => e.type === "SUB" && e.team === k && e.playerInId)
          .map((e) => String(e.playerInId)),
      ]),
    ];
    // Sem escalação feita: todo mundo aparece como relacionado
    const noLineup = starters.length === 0;

    const bench = roster
      .filter((id) => !seen.has(id))
      .map((id) => ({ id, role: "RES" }));

    const info = (id) => {
      const subIn = events.find(
        (e) => e.type === "SUB" && e.team === k && String(e.playerInId) === id,
      );
      const subOut = events.find(
        (e) => e.type === "SUB" && e.team === k && String(e.playerOutId) === id,
      );
      const gkIn = events.find(
        (e) =>
          e.type === "GK_CHANGE" && e.team === k && String(e.playerInId) === id,
      );
      const goals = events.filter(
        (e) => e.type === "GOAL" && String(e.playerId) === id,
      ).length;
      const assists = events.filter(
        (e) => e.type === "GOAL" && String(e.assistId) === id,
      ).length;
      const og = events.filter(
        (e) => e.type === "OWN_GOAL" && String(e.playerId) === id,
      ).length;
      const yellow = events.filter(
        (e) =>
          (e.type === "YELLOW" || e.type === "YELLOW_CARD") &&
          String(e.playerId) === id,
      ).length;
      const red = events.filter(
        (e) =>
          (e.type === "RED" || e.type === "RED_CARD") &&
          String(e.playerId) === id,
      ).length;
      return {
        subIn,
        subOut,
        gkIn,
        goals,
        assists,
        og,
        yellow,
        red,
        isGK: String(team?.goalkeeperId) === id,
        isCap: String(team?.captainId) === id,
        injured:
          subOut &&
          String(subOut.reason || "")
            .toLowerCase()
            .includes("les"),
      };
    };

    const sortStarters = (list) =>
      [...list].sort(
        (a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9),
      );

    // Banco: quem entrou primeiro aparece em cima
    const sortBench = (list) =>
      [...list].sort((a, b) => {
        const ia = info(a.id).subIn;
        const ib = info(b.id).subIn;
        if (ia && !ib) return -1;
        if (!ia && ib) return 1;
        return (parseFloat(ia?.minute) || 0) - (parseFloat(ib?.minute) || 0);
      });

    return {
      t,
      team,
      noLineup,
      starters: noLineup
        ? []
        : sortStarters(starters).map((r) => ({ ...r, ...info(r.id) })),
      bench: sortBench(
        noLineup ? roster.map((id) => ({ id, role: "REL" })) : bench,
      ).map((r) => ({ ...r, ...info(r.id) })),
    };
  };

  const data = teams.map(buildTeam);

  const Row = ({ r, side }) => {
    const p = byId[r.id];
    if (!p) return null;
    const name = p.nickname || p.name || "Jogador";
    const body = (
      <>
        <span className="lu-num">{p.number ?? "–"}</span>
        <span className="lu-photo">
          <img src={p.photo || "/players/default.png"} alt="" loading="lazy" />
        </span>
        <span className="lu-who">
          <span className="lu-name">
            {name}
            {r.isCap && <i className="lu-cap">C</i>}
          </span>
          <span className="lu-meta">
            <span className="lu-role">
              {r.isGK && r.role !== "GOL" ? "GOL" : r.role}
            </span>
            {r.subIn && (
              <span className="lu-sub in">
                <Arrow up /> {minuteTxt(r.subIn.minute) || "entrou"}
              </span>
            )}
            {r.subOut && (
              <span className={`lu-sub out ${r.injured ? "injury" : ""}`}>
                <Arrow /> {minuteTxt(r.subOut.minute) || "saiu"}
                {r.injured ? " · lesão" : ""}
              </span>
            )}
            {r.gkIn && (
              <span className="lu-sub gk">
                <Glove /> {minuteTxt(r.gkIn.minute) || "no gol"}
              </span>
            )}
          </span>
        </span>
        <span className="lu-badges">
          {r.goals > 0 && (
            <span className="lu-b goal" title={`${r.goals} gol(s)`}>
              <Ball />
              {r.goals > 1 && <b>{r.goals}</b>}
            </span>
          )}
          {r.assists > 0 && (
            <span className="lu-b assist" title={`${r.assists} assistência(s)`}>
              <Boot />
              {r.assists > 1 && <b>{r.assists}</b>}
            </span>
          )}
          {r.og > 0 && (
            <span className="lu-b og" title="Gol contra">
              GC
            </span>
          )}
          {r.yellow > 0 && (
            <span className="lu-card yellow" title="Cartão amarelo" />
          )}
          {r.red > 0 && (
            <span className="lu-card red" title="Cartão vermelho" />
          )}
        </span>
      </>
    );
    return (
      <li
        className={`lu-row ${r.subOut ? "is-out" : ""} ${r.subIn ? "is-in" : ""} side-${side}`}
      >
        {p.isAnonymous ? (
          <div className="lu-link">{body}</div>
        ) : (
          <Link to={`/player/${p.id}`} className="lu-link">
            {body}
          </Link>
        )}
      </li>
    );
  };

  return (
    <section className="lu-wrap" aria-label="Titulares e reservas">
      {title && <h3 className="lu-section-title">{title}</h3>}
      <div className={`lu-grid ${data.length === 1 ? "is-single" : ""}`}>
        {data.map(({ t, starters, bench, noLineup }) => (
          <div key={t.k} className={`lu-team side-${t.k.toLowerCase()}`}>
            <header className="lu-head">
              <span className="lu-dot" />
              <span className="lu-team-name">{t.n}</span>
            </header>

            {!noLineup && (
              <>
                <h4 className="lu-title">
                  Titulares <span>{starters.length}</span>
                </h4>
                <ul className="lu-list">
                  {starters.map((r) => (
                    <Row key={r.id} r={r} side={t.k.toLowerCase()} />
                  ))}
                </ul>
              </>
            )}

            <h4 className="lu-title">
              {noLineup ? "Relacionados" : "Reservas"}{" "}
              <span>{bench.length}</span>
            </h4>
            {bench.length > 0 ? (
              <ul className="lu-list">
                {bench.map((r) => (
                  <Row key={r.id} r={r} side={t.k.toLowerCase()} />
                ))}
              </ul>
            ) : (
              <p className="lu-empty">Sem reservas nesta partida.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
