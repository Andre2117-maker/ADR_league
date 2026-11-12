import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { headToHead, randomRivalPair } from "../../utils/seasonStats";
import { getShirtNumber, useClubMode } from "../../utils/Shirtnumber";
import "./headtohead.css";

const firstName = (p) => p?.nickname || String(p?.name || "").split(" ")[0];
const photoOf = (p, mode) =>
  (mode === "idr" ? p?.photoIDR1 || p?.photo : p?.photo) ||
  "/players/default.png";

/**
 * Confronto direto aleatório entre dois jogadores que já se enfrentaram.
 * Uso na Home: <HeadToHead players={players} matches={matches} />
 */
export default function HeadToHead({
  players = [],
  matches = [],
  minGames = 3,
}) {
  const mode = useClubMode();
  const [pair, setPair] = useState(null);

  const byId = useMemo(
    () => Object.fromEntries(players.map((p) => [String(p.id), p])),
    [players],
  );

  // Se ainda não há duplas com jogos suficientes, aceita quem se enfrentou ao menos 1 vez
  const draw = (exclude) =>
    randomRivalPair(players, matches, minGames, exclude) ||
    randomRivalPair(players, matches, 1, exclude);

  // Sorteia ao carregar (e quando os dados chegam)
  useEffect(() => {
    if (!pair && players.length && matches.length) setPair(draw(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, matches, minGames, pair]);

  const shuffle = () => setPair(draw(pair?.key) || pair);

  const a = pair ? byId[pair.aId] : null;
  const b = pair ? byId[pair.bId] : null;
  const h = useMemo(
    () => (a && b ? headToHead(a.id, b.id, matches) : null),
    [a, b, matches],
  );

  if (!a || !b || !h || h.against === 0) return null;

  const total = h.against || 1;
  const pctA = Math.round((h.winsA / total) * 100);
  const pctD = Math.round((h.draws / total) * 100);
  const pctB = 100 - pctA - pctD;
  const leader = h.winsA === h.winsB ? null : h.winsA > h.winsB ? a : b;

  const Side = ({ p, wins, goals, align }) => {
    const shirt = getShirtNumber(p, mode, "");
    return (
      <Link to={`/player/${p.id}`} className={`h2h-side h2h-${align}`}>
        <span className="h2h-photo">
          <img src={photoOf(p, mode)} alt="" />
        </span>
        <span className="h2h-name">{firstName(p)}</span>
        {shirt !== "" && <span className="h2h-shirt">#{shirt}</span>}
        <span className="h2h-wins">{wins}</span>
        <span className="h2h-wins-label">vitórias</span>
        <span className="h2h-goals">{goals} gols no duelo</span>
      </Link>
    );
  };

  return (
    <section className="h2h-section" aria-label="Confronto direto">
      <header className="h2h-head">
        <span className="h2h-kicker">CONFRONTO DIRETO</span>
        <h2 className="h2h-title">Duelo do dia</h2>
      </header>

      <div className="h2h-card">
        <div className="h2h-main">
          <Side p={a} wins={h.winsA} goals={h.goalsA} align="left" />

          <div className="h2h-center">
            <span className="h2h-vs">VS</span>
            <span className="h2h-games">{h.against} jogos</span>
            {h.draws > 0 && (
              <span className="h2h-draws">
                {h.draws} {h.draws === 1 ? "empate" : "empates"}
              </span>
            )}
          </div>

          <Side p={b} wins={h.winsB} goals={h.goalsB} align="right" />
        </div>

        {/* Barra de domínio */}
        <div className="h2h-bar" aria-hidden="true">
          <span className="h2h-bar-a" style={{ width: `${pctA}%` }} />
          <span className="h2h-bar-d" style={{ width: `${pctD}%` }} />
          <span className="h2h-bar-b" style={{ width: `${pctB}%` }} />
        </div>

        <div className="h2h-foot">
          <p>
            {leader ? (
              <>
                <b>{firstName(leader)}</b> leva vantagem no duelo.
              </>
            ) : (
              <>Duelo empatado em vitórias.</>
            )}
            {h.together > 0 && (
              <>
                {" "}
                Juntos no mesmo time: {h.togetherWins} vitórias em {h.together}{" "}
                jogos.
              </>
            )}
          </p>
          <button type="button" className="h2h-shuffle" onClick={shuffle}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h11l-3-3M20 17H9l3 3" />
            </svg>
            Outro duelo
          </button>
        </div>
      </div>
    </section>
  );
}
