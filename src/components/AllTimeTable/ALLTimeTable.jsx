import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isOfficialMatch, participantsOf } from "../../utils/matchStats";
import { outcomeFor } from "../../utils/seasonStats";
import { useClubMode } from "../../utils/Shirtnumber";
import "./alltimetable.css";

const SORTS = [
  { key: "goals", label: "Gols" },
  { key: "assists", label: "Assist." },
  { key: "points", label: "Pontos" },
  { key: "matches", label: "Jogos" },
  { key: "wins", label: "Vitórias" },
  { key: "rate", label: "Aproveit." },
];

const PAGE = 15;
const MIN_GAMES_RATE = 10; // aproveitamento só conta pra quem tem 10+ jogos

const photoOf = (p, mode) =>
  (mode === "idr" ? p?.photoIDR1 || p?.photo : p?.photo) ||
  "/players/default.png";

const AllTimeTable = ({ matches = [], players = [] }) => {
  const mode = useClubMode();
  const [sortBy, setSortBy] = useState("goals");
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => {
    const map = {};

    // 1. Jogadores cadastrados + histórico manual (statsBySeason)
    players.forEach((p) => {
      const id = String(p.id);
      const r = {
        id,
        player: p,
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals: 0,
        assists: 0,
      };
      Object.values(p.statsBySeason || {}).forEach((s) => {
        r.matches += Number(s.matches || s.games || 0);
        r.wins += Number(s.wins || 0);
        r.draws += Number(s.draws || 0);
        r.losses += Number(s.losses || 0);
        r.goals += Number(s.goals || 0);
        r.assists += Number(s.assists || 0);
      });
      map[id] = r;
    });

    // 2. Partidas registradas (oficiais). Convidados ("EXTERNO") ficam de fora.
    matches.filter(isOfficialMatch).forEach((m) => {
      ["A", "B"].forEach((side) => {
        const outcome = outcomeFor(m, side); // pênaltis / gol de ouro decidem
        participantsOf(m, side).forEach((pid) => {
          const r = map[pid];
          if (!r) return;
          r.matches += 1;
          if (outcome === "W") r.wins += 1;
          else if (outcome === "D") r.draws += 1;
          else r.losses += 1;
        });
      });

      (m.events || []).forEach((e) => {
        if (e.type !== "GOAL") return;
        const scorer = map[String(e.playerId)];
        const assist = e.assistId ? map[String(e.assistId)] : null;
        if (scorer) scorer.goals += 1;
        if (assist) assist.assists += 1;
      });
    });

    return Object.values(map)
      .filter((r) => r.matches > 0)
      .map((r) => ({
        ...r,
        points: r.wins * 3 + r.draws,
        rate: r.matches
          ? Math.round(((r.wins * 3 + r.draws) / (r.matches * 3)) * 100)
          : 0,
      }));
  }, [matches, players]);

  const sorted = useMemo(() => {
    const list =
      sortBy === "rate"
        ? rows.filter((r) => r.matches >= MIN_GAMES_RATE)
        : [...rows];
    return list.sort((a, b) => {
      if (b[sortBy] !== a[sortBy]) return b[sortBy] - a[sortBy];
      if (sortBy === "goals")
        return b.assists - a.assists || a.matches - b.matches;
      if (sortBy === "assists")
        return b.goals - a.goals || a.matches - b.matches;
      if (sortBy === "points" || sortBy === "rate")
        return b.wins - a.wins || b.goals - a.goals;
      return b.goals - a.goals;
    });
  }, [rows, sortBy]);

  const visible = showAll ? sorted : sorted.slice(0, PAGE);
  const hl = (key, extra = "") =>
    `${extra} ${sortBy === key ? "highlight-col" : ""}`.trim();

  return (
    <div className="alltime-container">
      <div className="alltime-header">
        <div className="alltime-heading">
          <span className="alltime-kicker">ALL TIME</span>
          <h3 className="alltime-title">Ranking histórico</h3>
        </div>

        <div className="alltime-sorts" role="tablist" aria-label="Ordenar por">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={sortBy === s.key}
              className={`alltime-sort ${sortBy === s.key ? "is-active" : ""}`}
              onClick={() => setSortBy(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="alltime-table-wrapper">
        <table className="alltime-table">
          <thead>
            <tr>
              <th className="col-pos">#</th>
              <th className="col-name">Lenda</th>
              <th title="Pontos" className={hl("points")}>
                Pts
              </th>
              <th title="Gols" className={hl("goals")}>
                G
              </th>
              <th title="Assistências" className={hl("assists")}>
                A
              </th>
              <th title="Jogos" className={hl("matches")}>
                J
              </th>
              <th title="Vitórias" className={hl("wins")}>
                V
              </th>
              <th title="Derrotas">D</th>
              <th title="Aproveitamento" className={hl("rate")}>
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => {
              const p = r.player;
              const nameEl = (
                <>
                  <span className="at-photo">
                    <img src={photoOf(p, mode)} alt="" loading="lazy" />
                  </span>
                  <span className="at-name">
                    {p.nickname || p.name || "Anônimo"}
                  </span>
                </>
              );
              return (
                <tr key={r.id}>
                  <td className="col-pos">{i + 1}</td>
                  <td className="col-name">
                    {p.isAnonymous ? (
                      <span className="at-player">{nameEl}</span>
                    ) : (
                      <Link to={`/player/${r.id}`} className="at-player">
                        {nameEl}
                      </Link>
                    )}
                  </td>
                  <td className={hl("points", "bold")}>{r.points}</td>
                  <td className={hl("goals", "bold")}>{r.goals}</td>
                  <td className={hl("assists")}>{r.assists}</td>
                  <td className={hl("matches")}>{r.matches}</td>
                  <td className={hl("wins", "color-win")}>{r.wins}</td>
                  <td className="color-loss">{r.losses}</td>
                  <td className={hl("rate", "at-rate")}>{r.rate}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="alltime-foot">
        {sortBy === "rate" && (
          <span className="alltime-note">
            Aproveitamento: só quem tem {MIN_GAMES_RATE}+ jogos.
          </span>
        )}
        {sorted.length > PAGE && (
          <button
            type="button"
            className="alltime-more"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Mostrar menos" : `Ver todos (${sorted.length})`}
          </button>
        )}
      </div>
    </div>
  );
};

export default AllTimeTable;
