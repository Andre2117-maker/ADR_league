import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  Link,
} from "react-router-dom";
import FutCard from "../Playerpage/FutCard/FutCard";
import {
  computeRetrospective,
  seasonsIn,
  matchSeason,
  seasonStatMatch,
} from "../../utils/seasonStats";
import { exportNodeImage } from "../../utils/exportImage";
import { getShirtNumber, useClubMode } from "../../utils/Shirtnumber";
import { playerSide } from "../../utils/matchStats";
import "./retrospectiva.css";
import Footer from "../../components/Footer";

const SLIDE_MS = 6500;

const firstName = (p) => p?.nickname || String(p?.name || "").split(" ")[0];
const photoOf = (p, mode) =>
  (mode === "idr" ? p?.photoIDR1 || p?.photo : p?.photo) ||
  "/players/default.png";
const fmtDate = (d) =>
  String(d || "")
    .slice(0, 10)
    .split("-")
    .reverse()
    .join("/");

/* Número que "conta" até o valor quando o slide aparece */
function CountUp({ value, active, decimals = 0 }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!active) {
      setShown(0);
      return undefined;
    }
    const target = Number(value) || 0;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, active]);
  return <>{decimals ? shown.toFixed(decimals) : Math.round(shown)}</>;
}

/* ==========================================================================
   TELA 1: ESCOLHER JOGADOR
   ========================================================================== */
function RetroPicker({ players, matches, season, seasons, setSeason }) {
  const mode = useClubMode();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    // Só a temporada escolhida, com as mesmas partidas da tabela (TREINO + EVENTO)
    const seasonMatches = matches.filter(
      (m) => seasonStatMatch(m) && matchSeason(m) === String(season),
    );
    return players
      .filter((p) => !p.isAnonymous)
      .map((p) => ({
        p,
        games: seasonMatches.filter((m) => playerSide(m, p.id)).length,
      }))
      .filter((x) => x.games > 0)
      .filter(
        (x) => !q || String(x.p.name).toLowerCase().includes(q.toLowerCase()),
      )
      .sort(
        (a, b) =>
          b.games - a.games ||
          String(a.p.name).localeCompare(String(b.p.name), "pt-BR"),
      );
  }, [players, matches, season, q]);

  return (
    <div>
      <div className="rt-page">
        <header className="rt-hero">
          <span className="rt-kicker">
            {mode === "idr" ? "IDR" : "O ADR"} · FIM DE TEMPORADA
          </span>
          <h1 className="rt-hero-title">
            Retrospectiva <b>{season}</b>
          </h1>
          <p className="rt-hero-sub">
            Escolha um jogador e veja a temporada dele em stories.
          </p>

          {seasons.length > 1 && (
            <div className="rt-seasons">
              {seasons.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={y === season ? "on" : ""}
                  onClick={() => setSeason(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          <input
            className="rt-search"
            type="search"
            placeholder="Buscar jogador..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </header>

        <div className="rt-grid">
          {list.map(({ p, games }) => {
            const shirt = getShirtNumber(p, mode, "");
            return (
              <Link
                key={p.id}
                to={`/retrospectiva/${p.id}?temporada=${season}`}
                className="rt-player"
              >
                <span className="rt-player-photo">
                  <img src={photoOf(p, mode)} alt="" />
                </span>
                <span className="rt-player-info">
                  <strong>{firstName(p)}</strong>
                  <small>
                    {shirt !== "" ? `#${shirt} · ` : ""}
                    {games} jogos
                  </small>
                </span>
                <span className="rt-player-go" aria-hidden="true">
                  ›
                </span>
              </Link>
            );
          })}
          {list.length === 0 && (
            <p className="rt-empty">Nenhum jogador com jogos em {season}.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ==========================================================================
   TELA 2: STORIES
   ========================================================================== */
function RetroStory({ player, players, matches, season }) {
  const navigate = useNavigate();
  const mode = useClubMode();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const holdTimer = useRef(null);
  const held = useRef(false);
  const cardRef = useRef(null);

  const r = useMemo(
    () => computeRetrospective(player, players, matches, season),
    [player, players, matches, season],
  );
  const t = r.totals;
  const name = firstName(player);

  /* ---------- Monta os slides conforme o que o jogador fez ---------- */
  const slides = useMemo(() => {
    const s = [];
    const extGames = (r.friendlies?.games || 0) + (r.championships?.games || 0);
    if (t.games === 0 && extGames === 0) {
      s.push({
        key: "empty",
        tone: "gold",
        render: () => (
          <>
            <span className="rt-k">RETROSPECTIVA {season}</span>
            <h2 className="rt-h">
              {name} não entrou em campo em {season}.
            </h2>
            <p className="rt-p">Escolha outra temporada na tela anterior.</p>
          </>
        ),
      });
      return s;
    }

    s.push({
      key: "intro",
      tone: "gold",
      render: () => (
        <>
          <span className="rt-k">RETROSPECTIVA {season}</span>
          <div className="rt-avatar">
            <img src={photoOf(player, mode)} alt="" />
          </div>
          <h2 className="rt-h rt-h-xl">{name}</h2>
          <p className="rt-p">Essa foi a sua temporada, em números.</p>
        </>
      ),
    });

    if (t.games > 0)
      s.push({
        key: "games",
        tone: "green",
        render: (active) => (
          <>
            <span className="rt-k">VOCÊ ENTROU EM CAMPO</span>
            <div className="rt-big">
              <CountUp value={t.games} active={active} />
            </div>
            <span className="rt-unit">JOGOS</span>
            {r.attendance.days > 0 && (
              <div className="rt-facts">
                <div>
                  <b>
                    {r.attendance.present}/{r.attendance.days}
                  </b>
                  <span>dias de treino</span>
                </div>
                <div>
                  <b>{r.attendance.rate}%</b>
                  <span>de presença</span>
                </div>
                <div>
                  <b>{r.attendance.bestStreak}</b>
                  <span>treinos seguidos</span>
                </div>
              </div>
            )}
          </>
        ),
      });

    if (t.goals + t.assists > 0) {
      s.push({
        key: "goals",
        tone: "gold",
        render: (active) => (
          <>
            <span className="rt-k">BOLA NA REDE</span>
            <div className="rt-duo">
              <div>
                <div className="rt-big">
                  <CountUp value={t.goals} active={active} />
                </div>
                <span className="rt-unit">GOLS</span>
              </div>
              <div>
                <div className="rt-big rt-big-blue">
                  <CountUp value={t.assists} active={active} />
                </div>
                <span className="rt-unit">ASSISTÊNCIAS</span>
              </div>
            </div>
            <div className="rt-facts">
              <div>
                <b>{t.goalsPerGame}</b>
                <span>gols por jogo</span>
              </div>
              {r.ranking.scorerPos && (
                <div>
                  <b>{r.ranking.scorerPos}º</b>
                  <span>na artilharia</span>
                </div>
              )}
              {(t.hatTricks > 0 || t.braces > 0) && (
                <div>
                  <b>{t.hatTricks > 0 ? t.hatTricks : t.braces}</b>
                  <span>{t.hatTricks > 0 ? "hat-tricks" : "dobradinhas"}</span>
                </div>
              )}
            </div>
          </>
        ),
      });
    }

    if (t.gkGames > 0) {
      s.push({
        key: "gk",
        tone: "blue",
        render: (active) => (
          <>
            <span className="rt-k">DEBAIXO DAS TRAVES</span>
            <div className="rt-big">
              <CountUp value={t.gkGames} active={active} />
            </div>
            <span className="rt-unit">JOGOS NO GOL</span>
            <div className="rt-facts">
              <div>
                <b>{t.cleanSheets}</b>
                <span>sem sofrer gol</span>
              </div>
              <div>
                <b>{(t.conceded / t.gkGames).toFixed(2)}</b>
                <span>sofridos por jogo</span>
              </div>
            </div>
          </>
        ),
      });
    }

    if (r.bestMonth && r.bestMonth.goals + r.bestMonth.assists > 0) {
      const m = r.bestMonth;
      s.push({
        key: "month",
        tone: "purple",
        render: () => (
          <>
            <span className="rt-k">SEU MELHOR MÊS</span>
            <h2 className="rt-h rt-h-xl">{m.name}</h2>
            <div className="rt-facts">
              <div>
                <b>{m.goals}</b>
                <span>gols</span>
              </div>
              <div>
                <b>{m.assists}</b>
                <span>assistências</span>
              </div>
              <div>
                <b>
                  {m.wins}/{m.games}
                </b>
                <span>vitórias</span>
              </div>
            </div>
          </>
        ),
      });
    }

    if (r.partner) {
      const p = r.partner;
      s.push({
        key: "partner",
        tone: "green",
        render: () => (
          <>
            <span className="rt-k">SEU PARCEIRO DE VITÓRIAS</span>
            <div className="rt-avatar rt-avatar-sm">
              <img src={photoOf(p.player, mode)} alt="" />
            </div>
            <h2 className="rt-h">{firstName(p.player)}</h2>
            <p className="rt-p">
              Juntos no mesmo time: <b>{p.wins} vitórias</b> em {p.games} jogos
              ({Math.round(p.rate * 100)}%).
            </p>
          </>
        ),
      });
    }

    if (r.nemesis && r.nemesis.losses > 0) {
      const n = r.nemesis;
      s.push({
        key: "nemesis",
        tone: "red",
        render: () => (
          <>
            <span className="rt-k">SEU CARRASCO</span>
            <div className="rt-avatar rt-avatar-sm">
              <img src={photoOf(n.player, mode)} alt="" />
            </div>
            <h2 className="rt-h">{firstName(n.player)}</h2>
            <p className="rt-p">
              Te venceu <b>{n.losses} vezes</b> em {n.games} jogos um contra o
              outro.
            </p>
          </>
        ),
      });
    }

    /* Contra outros times: amistosos e campeonatos numa página só deles */
    const comps = [
      { key: "fr", label: "AMISTOSOS", c: r.friendlies },
      { key: "ch", label: "CAMPEONATOS", c: r.championships },
    ].filter((x) => x.c && x.c.games > 0);
    if (comps.length) {
      s.push({
        key: "external",
        tone: "purple",
        render: () => (
          <>
            <span className="rt-k">CONTRA OUTROS TIMES</span>
            <h2 className="rt-h">
              Vestindo a camisa {mode === "idr" ? "do IDR" : "do ADR"}
            </h2>
            <div className="rt-comps">
              {comps.map(({ key, label, c }) => (
                <div key={key} className="rt-comp">
                  <div className="rt-comp-head">
                    <span>{label}</span>
                    <b>
                      {c.games} {c.games === 1 ? "jogo" : "jogos"}
                    </b>
                  </div>
                  <div className="rt-comp-wdl">
                    <span className="w">
                      <b>{c.wins}</b>V
                    </span>
                    {c.draws > 0 && (
                      <span className="d">
                        <b>{c.draws}</b>E
                      </span>
                    )}
                    <span className="l">
                      <b>{c.losses}</b>D
                    </span>
                  </div>
                  <div className="rt-comp-stats">
                    <span>
                      <b>{c.goals}</b> gols
                    </span>
                    <span>
                      <b>{c.assists}</b> assist.
                    </span>
                    {c.cleanSheets > 0 && (
                      <span>
                        <b>{c.cleanSheets}</b> sem sofrer
                      </span>
                    )}
                  </div>
                  {c.opponents.length > 0 && (
                    <p className="rt-comp-opp">
                      {c.opponents.length === 1
                        ? "Contra "
                        : `${c.opponents.length} adversários: `}
                      {c.opponents.slice(0, 4).join(", ")}
                      {c.opponents.length > 4 ? "..." : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        ),
      });
    }

    const bm = r.bestMatch;
    if (bm && (bm.goals + bm.assists > 0 || bm.cleanSheet)) {
      const parts = [];
      if (bm.goals)
        parts.push(`${bm.goals} ${bm.goals === 1 ? "gol" : "gols"}`);
      if (bm.assists)
        parts.push(
          `${bm.assists} ${bm.assists === 1 ? "assistência" : "assistências"}`,
        );
      if (bm.cleanSheet) parts.push("sem sofrer gol");
      s.push({
        key: "match",
        tone: "gold",
        render: () => (
          <>
            <span className="rt-k">O JOGO DA SUA TEMPORADA</span>
            <span className="rt-date">{fmtDate(bm.date)}</span>
            <div className="rt-score">
              <span>{bm.teamA}</span>
              <b>{bm.score}</b>
              <span>{bm.teamB}</span>
            </div>
            <p className="rt-p">
              Você fez <b>{parts.join(" e ")}</b>
              {bm.outcome === "W" ? " e saiu com a vitória." : "."}
            </p>
          </>
        ),
      });
    }

    if (t.games > 0)
      s.push({
        key: "record",
        tone: "gold",
        render: (active) => (
          <>
            <span className="rt-k">O BALANÇO</span>
            <div className="rt-wdl">
              <div className="w">
                <b>
                  <CountUp value={t.wins} active={active} />
                </b>
                <span>V</span>
              </div>
              {/* No ADR não tem empate (vai pros pênaltis); só aparece se existir */}
              {t.draws > 0 && (
                <div className="d">
                  <b>
                    <CountUp value={t.draws} active={active} />
                  </b>
                  <span>E</span>
                </div>
              )}
              <div className="l">
                <b>
                  <CountUp value={t.losses} active={active} />
                </b>
                <span>D</span>
              </div>
            </div>
            <div className="rt-facts">
              <div>
                <b>{t.points}</b>
                <span>pontos</span>
              </div>
              <div>
                <b>{t.winRate}%</b>
                <span>aproveitamento</span>
              </div>
              {r.ranking.position && (
                <div>
                  <b>
                    {r.ranking.position}º/{r.ranking.of}
                  </b>
                  <span>na tabela</span>
                </div>
              )}
            </div>
            {t.bestWinStreak >= 3 && (
              <p className="rt-p">
                Maior sequência de vitórias: <b>{t.bestWinStreak} seguidas</b>.
              </p>
            )}
          </>
        ),
      });

    s.push({
      key: "card",
      tone: "gold",
      final: true,
      render: () => (
        <>
          <span className="rt-k">SEU CARD {season}</span>
          <div className="rt-card-stage">
            <FutCard
              ref={cardRef}
              player={player}
              mode={mode}
              season={season}
              stats={{ games: t.games, goals: t.goals, assists: t.assists }}
              gkShare={t.games ? t.gkGames / t.games : 0}
            />
          </div>
        </>
      ),
    });
    return s;
  }, [r, t, player, mode, season, name]);

  const last = slides.length - 1;
  const current = slides[Math.min(idx, last)];

  const go = (delta) => {
    setMsg("");
    setIdx((i) => Math.max(0, Math.min(last, i + delta)));
  };

  /* Teclado */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") navigate(`/retrospectiva?temporada=${season}`);
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last, season]);

  /* Trava a rolagem da página por trás */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* Toque: rápido = navegar; segurar = pausar */
  const onPointerDown = () => {
    held.current = false;
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      held.current = true;
      setPaused(true);
    }, 220);
  };

  const onPointerUp = (e) => {
    clearTimeout(holdTimer.current);
    if (held.current) {
      setPaused(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    go(x < rect.width * 0.3 ? -1 : 1);
  };

  const stop = (e) => e.stopPropagation();

  const handleExport = async () => {
    setBusy(true);
    setMsg("");
    try {
      const slug = String(name)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .toLowerCase();
      const res = await exportNodeImage(cardRef.current, {
        filename: `card-${slug}-${season}.png`,
        background: null,
        title: `Retrospectiva ${season} de ${player.name}`,
      });
      if (res === "downloaded") setMsg("Imagem baixada!");
      if (res === "shared") setMsg("Compartilhado!");
    } catch (err) {
      console.error("Erro ao gerar o card:", err);
      setMsg("Não foi possível gerar a imagem.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rt-story-overlay ${mode === "idr" ? "is-idr" : ""}`}>
      <div className={`rt-story tone-${current.tone}`}>
        {/* Barras de progresso */}
        <div className="rt-bars" onPointerDown={stop} onPointerUp={stop}>
          {slides.map((s, i) => (
            <span key={s.key} className="rt-bar">
              <span
                key={i === idx ? `run-${idx}` : `bar-${i}`}
                className={`rt-bar-fill ${i < idx ? "done" : ""} ${i === idx && !s.final ? "run" : ""} ${
                  i === idx && s.final ? "done" : ""
                } ${paused ? "paused" : ""}`}
                style={{ animationDuration: `${SLIDE_MS}ms` }}
                onAnimationEnd={() => i === idx && go(1)}
              />
            </span>
          ))}
        </div>

        {/* Topo: quem é + fechar */}
        <div className="rt-top" onPointerDown={stop} onPointerUp={stop}>
          <span className="rt-top-who">
            <img src={photoOf(player, mode)} alt="" />
            <span>
              <b>{name}</b>
              <small>Retrospectiva {season}</small>
            </span>
          </span>
          <button
            type="button"
            className="rt-close"
            onClick={() => navigate(`/retrospectiva?temporada=${season}`)}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo do slide (área de toque) */}
        <div
          className="rt-slide-area"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={() => clearTimeout(holdTimer.current)}
        >
          <div key={current.key} className="rt-slide">
            {current.render(true)}
          </div>
        </div>

        {/* Ações do último slide */}
        {current.final && (
          <div className="rt-actions" onPointerDown={stop} onPointerUp={stop}>
            <button
              type="button"
              className="rt-btn rt-btn-main"
              onClick={handleExport}
              disabled={busy}
            >
              {busy ? "GERANDO..." : "BAIXAR / COMPARTILHAR CARD"}
            </button>
            <button type="button" className="rt-btn" onClick={() => setIdx(0)}>
              Ver de novo
            </button>
            {msg && <p className="rt-msg">{msg}</p>}
          </div>
        )}

        {paused && <span className="rt-paused">PAUSADO</span>}
      </div>
    </div>
  );
}

/* ==========================================================================
   PÁGINA
   rotas: /retrospectiva  e  /retrospectiva/:id   (?temporada=2026 opcional)
   ========================================================================== */
export default function Retrospectiva({ players = [], matches = [] }) {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();

  const seasons = useMemo(() => seasonsIn(matches), [matches]);
  const season =
    params.get("temporada") || seasons[0] || String(new Date().getFullYear());
  const setSeason = (y) => setParams({ temporada: y });

  const player = id ? players.find((p) => String(p.id) === String(id)) : null;

  if (id && !player) {
    return (
      <div className="rt-page">
        <p className="rt-empty">Carregando jogador...</p>
      </div>
    );
  }

  if (player) {
    return (
      <RetroStory
        key={`${player.id}-${season}`}
        player={player}
        players={players}
        matches={matches}
        season={season}
      />
    );
  }

  return (
    <RetroPicker
      players={players}
      matches={matches}
      season={season}
      seasons={seasons}
      setSeason={setSeason}
    />
  );
}
