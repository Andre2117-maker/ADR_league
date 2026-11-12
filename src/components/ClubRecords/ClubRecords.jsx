import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { computeRecords, seasonsIn } from "../../utils/seasonStats";
import { CURRENT_SEASON } from "../../utils/matchStats";
import { useClubMode } from "../../utils/Shirtnumber";
import "./clubrecords.css";

const firstName = (p) => p?.nickname || String(p?.name || "").split(" ")[0];
const photoOf = (p, mode) =>
  (mode === "idr" ? p?.photoIDR1 || p?.photo : p?.photo) ||
  "/players/default.png";

const fmtDate = (d) => {
  if (!d) return "";
  const s = String(d).slice(0, 10);
  const [y, m, day] = s.split("-");
  return y && m && day ? `${day}/${m}/${y}` : s;
};

const GROUPS = ["Totais", "Numa partida", "Sequências"];

/**
 * Recordes do clube.
 * Uso: <ClubRecords players={players} matches={matches} />
 */
export default function ClubRecords({ players = [], matches = [] }) {
  const mode = useClubMode();
  const seasons = useMemo(() => seasonsIn(matches), [matches]);
  const [scope, setScope] = useState("all"); // "all" | ano

  const records = useMemo(
    () => computeRecords(players, matches, scope === "all" ? null : scope),
    [players, matches, scope],
  );

  const grouped = GROUPS.map((g) => ({
    g,
    items: records.filter((r) => r.group === g),
  })).filter((x) => x.items.length);

  const scopes = ["all", ...seasons.map(String)];

  return (
    <section className="cr-section" aria-label="Recordes do clube">
      <header className="cr-head">
        <span className="cr-kicker">LIVRO DOS RECORDES</span>
        <h2 className="cr-title">Recordes</h2>
      </header>

      <div className="cr-scopes" role="tablist">
        {scopes.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={scope === s}
            className={`cr-scope ${scope === s ? "is-active" : ""}`}
            onClick={() => setScope(s)}
          >
            {s === "all"
              ? "Todos os tempos"
              : s === String(CURRENT_SEASON)
                ? `${s} · atual`
                : s}
          </button>
        ))}
      </div>

      {grouped.length === 0 && (
        <p className="cr-empty">
          Ainda não há partidas suficientes para recordes.
        </p>
      )}

      {grouped.map(({ g, items }) => (
        <div className="cr-group" key={g}>
          <h3 className="cr-group-title">{g}</h3>
          <div className="cr-grid">
            {items.map((r) => (
              <RecordCard key={r.key} r={r} mode={mode} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function RecordCard({ r, mode }) {
  const isMatchRecord = !r.holders[0]?.playerId; // goleada / jogo com mais gols
  const extra = r.holders.length > 1;

  return (
    <article className={`cr-card ${isMatchRecord ? "is-match" : ""}`}>
      <div className="cr-card-top">
        <span className="cr-label">{r.label}</span>
        {extra && <span className="cr-tie">empate</span>}
      </div>

      <div className="cr-value-row">
        <span className="cr-value">{r.value}</span>
        <span className="cr-unit">{r.unit}</span>
      </div>

      <ul className="cr-holders">
        {r.holders.map((h, i) => {
          const matchInfo = h.matchId ? (
            <Link to={`/match/${h.matchId}`} className="cr-match">
              {h.teamA && h.teamB ? (
                <>
                  {h.teamA} <b>{h.score}</b> {h.teamB}
                </>
              ) : (
                <b>{h.score}</b>
              )}
              {h.date && <span className="cr-date">{fmtDate(h.date)}</span>}
            </Link>
          ) : null;

          if (h.player) {
            return (
              <li key={i} className="cr-holder">
                <Link to={`/player/${h.player.id}`} className="cr-holder-link">
                  <span className="cr-photo">
                    <img src={photoOf(h.player, mode)} alt="" loading="lazy" />
                  </span>
                  <span className="cr-name">{firstName(h.player)}</span>
                </Link>
                {matchInfo}
              </li>
            );
          }
          return (
            <li key={i} className="cr-holder cr-holder-match">
              {matchInfo}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
