import React, { useMemo } from "react";
import {
  rankingAroundMatch,
  isRankingMatch,
} from "../../../utils/rankingHistory";
import "./MatchStats.css";

const EMPTY = {
  goals: 0,
  assists: 0,
  ownGoals: 0,
  yellowCards: 0,
  redCards: 0,
};

const shortName = (n) => {
  const parts = String(n || "")
    .trim()
    .split(/\s+/);
  return parts.length > 1
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : parts[0] || "";
};

/* Setinhas iguais às da Classificação Geral */
const Move = ({ delta }) => {
  if (!delta)
    return (
      <span className="ms-move is-same" title="Manteve a posição">
        –
      </span>
    );
  const up = delta > 0;
  const n = Math.min(3, Math.abs(delta));
  return (
    <span
      className={`ms-move ${up ? "is-up" : "is-down"}`}
      title={`${up ? "Subiu" : "Caiu"} ${Math.abs(delta)} ${Math.abs(delta) === 1 ? "posição" : "posições"}`}
    >
      <svg viewBox={`0 0 10 ${4 + n * 4}`} aria-hidden="true">
        {Array.from({ length: n }).map((_, i) => (
          <path
            key={i}
            d={up ? `M1 ${6 + i * 4}l4-4 4 4` : `M1 ${2 + i * 4}l4 4 4-4`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <b>{Math.abs(delta)}</b>
    </span>
  );
};

function MatchStats({
  teamStats,
  match,
  teamAName,
  teamBName,
  players = [],
  matches = [],
}) {
  const isIdr =
    typeof document !== "undefined" &&
    document.body.classList.contains("theme-idr");

  /* ---------- Números da partida ---------- */
  const { statsA, statsB } = useMemo(() => {
    // Com a partida em mãos, conta tudo pelos eventos (sem somar em cima do teamStats)
    if (match?.events) {
      const A = { ...EMPTY };
      const B = { ...EMPTY };
      match.events.forEach((e) => {
        if (!e.team) return;
        const target = e.team === "A" ? A : B;
        const other = e.team === "A" ? B : A;
        if (e.type === "GOAL") {
          target.goals += 1;
          if (e.assistId) target.assists += 1;
        } else if (e.type === "ASSIST") target.assists += 1;
        else if (e.type === "OWN_GOAL") {
          target.ownGoals += 1;
          other.goals += 1;
        } else if (e.type === "YELLOW" || e.type === "YELLOW_CARD")
          target.yellowCards += 1;
        else if (e.type === "RED" || e.type === "RED_CARD")
          target.redCards += 1;
      });
      return { statsA: A, statsB: B };
    }
    return {
      statsA: { ...EMPTY, ...teamStats?.teamA },
      statsB: { ...EMPTY, ...teamStats?.teamB },
    };
  }, [match, teamStats]);

  const nameA = teamAName || match?.teamA?.name || "Time A";
  const nameB = teamBName || match?.teamB?.name || "Time B";

  const rows = [
    { label: "Gols", key: "goals", lowerIsBetter: false },
    { label: "Assistências", key: "assists", lowerIsBetter: false },
    { label: "Gols contra", key: "ownGoals", lowerIsBetter: true },
    { label: "Amarelos", key: "yellowCards", lowerIsBetter: true },
    { label: "Vermelhos", key: "redCards", lowerIsBetter: true },
  ];

  /* ---------- Classificação depois desta partida ---------- */
  const standings = useMemo(() => {
    const r = rankingAroundMatch(players, matches, match);
    if (!r) return null;
    const byId = Object.fromEntries(players.map((p) => [String(p.id), p]));

    const side = (s) =>
      Object.entries(r.results)
        .filter(
          ([id, v]) =>
            v.side === s && byId[id] && !byId[id].isAnonymous && r.after[id],
        )
        .map(([id, v]) => {
          const p = byId[id];
          const after = r.after[id].position;
          const before = r.before[id]?.position ?? after;
          return {
            id,
            player: p,
            res: v.res,
            after,
            delta: before - after,
            gained: r.after[id].points - (r.before[id]?.points || 0),
          };
        })
        .sort((a, b) => a.after - b.after);

    return { A: side("A"), B: side("B"), total: r.total };
  }, [players, matches, match]);

  const photoOf = (p) =>
    (isIdr ? p.photoIDR1 || p.photo : p.photo) || "/players/default.png";

  const StandingList = ({ list, align }) => (
    <ul className={`ms-stand-list ${align}`}>
      {list.map((s) => (
        <li key={s.id} className={`ms-stand res-${s.res}`}>
          <span className="ms-pos">
            {s.after}
            <small>º</small>
          </span>
          <span className="ms-photo">
            <img src={photoOf(s.player)} alt="" loading="lazy" />
          </span>
          <span className="ms-who">
            <span className="ms-name">
              {s.player.nickname || shortName(s.player.name)}
            </span>
            <span className="ms-gain">+{s.gained} pts</span>
          </span>
          <Move delta={s.delta} />
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`team-stats-card ${isIdr ? "is-idr" : ""}`}>
      <div className="stats-header-text">
        <span className="team-name-a">{nameA}</span>
        <span className="stats-title-center">Estatísticas da partida</span>
        <span className="team-name-b">{nameB}</span>
      </div>

      <div className="stats-body">
        {rows.map((row) => {
          const valA = statsA[row.key] || 0;
          const valB = statsB[row.key] || 0;
          const total = valA + valB;
          let winA = false;
          let winB = false;
          if (valA !== valB) {
            const aBetter = row.lowerIsBetter ? valA < valB : valA > valB;
            winA = aBetter;
            winB = !aBetter;
          }
          return (
            <div className="text-stat-row" key={row.key}>
              <div className="stat-line">
                <span className={`stat-val ${winA ? "highlight-winner" : ""}`}>
                  {valA}
                </span>
                <span className="stat-label-text">{row.label}</span>
                <span className={`stat-val ${winB ? "highlight-winner" : ""}`}>
                  {valB}
                </span>
              </div>
              {/* Barra dividida: cada lado ocupa a sua parte do total */}
              <div className={`stat-bar ${total ? "" : "is-empty"}`}>
                {total > 0 && (
                  <>
                    <span
                      className={`bar-a ${winA ? "on" : ""}`}
                      style={{ flexGrow: valA || 0.0001 }}
                    />
                    <span
                      className={`bar-b ${winB ? "on" : ""}`}
                      style={{ flexGrow: valB || 0.0001 }}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {standings && (standings.A.length > 0 || standings.B.length > 0) && (
        <div className="ms-standings">
          <div className="ms-stand-head">
            <span className="ms-stand-title">Classificação após a partida</span>
            <span className="ms-stand-sub">
              posição na tabela de {standings.total} jogadores
            </span>
          </div>
          <div className="ms-stand-cols">
            <StandingList list={standings.A} align="left" />
            <StandingList list={standings.B} align="right" />
          </div>
        </div>
      )}

      {match && !isRankingMatch(match) && (
        <p className="ms-stand-note">
          Amistosos e campeonatos não contam na Classificação Geral.
        </p>
      )}
    </div>
  );
}

export default MatchStats;
