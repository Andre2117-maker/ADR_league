import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteField,
} from "firebase/firestore";
import { db } from "../../firebase";
import primeiro from "../../assets/primeiro.png";
import segundo from "../../assets/segundo.png";
import terceiro from "../../assets/terceiro.png";
import {
  buildSeasonTable,
  buildGoalsTable,
  seasonMatches,
  dayOf,
} from "../../utils/seasonTable";
import {
  useAwards,
  itemsForYear,
  awardIconToAch,
} from "../../services/hallAwards";
import { AchIcon } from "../../components/playerpage/achIcons";

// visual da tabela = o mesmo da Classificação Geral (já tem as 3 versões)
import "../../styles/Tabelas/rankingtable.css";
import "./temporadas.css";

/* ==========================================================================
   OUTRAS TEMPORADAS
   - Cada temporada pode ter um documento em `seasons/{ano}` no Firestore:
       { year, rules: [..], rows: [..], columns: [..], archivedAt }
   - rows = tabela FINAL congelada (o admin clica em "Arquivar tabela").
     Sem rows, a tabela é calculada na hora com as partidas daquele ano.
   - rules = as regras que valiam naquela temporada (o admin edita aqui).
   ========================================================================== */

const COLUMNS = {
  points: { label: "Pts", title: "Pontos" },
  goals: { label: "Gols", title: "Gols" },
  assists: { label: "Assis", title: "Assistências" },
  games: { label: "J", title: "Jogos" },
  wins: { label: "V", title: "Vitórias" },
  losses: { label: "D", title: "Derrotas" },
};

const FULL_COLUMNS = ["points", "goals", "assists", "games", "wins", "losses"];

/* Como era cada temporada (o que está no banco tem prioridade) */
const SEASON_DEFAULTS = {
  2025: {
    mode: "goals",
    subtitle: "A temporada de estreia",
    columns: ["goals"],
    rules: [
      "Primeira temporada do ADR.",
      "A classificação era só pelos gols marcados no ano.",
      "Empate em gols: ordem alfabética.",
    ],
  },
  2026: {
    mode: "points",
    subtitle: "A primeira com tabela de pontos",
    columns: FULL_COLUMNS,
    rules: [
      "Vitória vale 3 pontos, empate 1 e derrota 0.",
      "Contam os treinos e os eventos oficiais (amistosos e campeonatos ficam de fora).",
      "Desempate: pontos, depois gols, depois assistências.",
      "Gols, assistências e jogos lançados à mão na temporada também somam.",
      "Os 3 primeiros ganham premiação; o último colocado paga a punição.",
      "O foguinho mostra quantos treinos seguidos o jogador foi sem faltar.",
    ],
  },
};

// temporada sem padrão: usa o formato de pontos e as regras da anterior
const defaultsFor = (year, saved) => {
  if (SEASON_DEFAULTS[year]) return SEASON_DEFAULTS[year];
  const prev = saved[year - 1]?.rules || SEASON_DEFAULTS[year - 1]?.rules;
  return {
    mode: "points",
    subtitle: "",
    columns: FULL_COLUMNS,
    rules: prev || SEASON_DEFAULTS[2026].rules,
  };
};

const MEDALS = [primeiro, segundo, terceiro];

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
};

export default function Temporadas({
  players = [],
  matches = [],
  isAdmin = false,
}) {
  const currentYear = new Date().getFullYear();
  const [saved, setSaved] = useState({}); // { [ano]: doc }
  const [year, setYear] = useState(null);
  const [editingRules, setEditingRules] = useState(null); // texto em edição
  const [busy, setBusy] = useState(false);
  const awards = useAwards();

  /* ---------- carrega as temporadas salvas ---------- */
  useEffect(() => {
    getDocs(collection(db, "seasons"))
      .then((snap) => {
        const out = {};
        snap.forEach((d) => (out[d.id] = d.data()));
        setSaved(out);
      })
      .catch((err) => console.error("Erro ao carregar temporadas:", err));
  }, []);

  /* ---------- anos que aparecem nas abas ---------- */
  const years = useMemo(() => {
    const set = new Set([
      ...Object.keys(SEASON_DEFAULTS).map(Number),
      ...Object.keys(saved).map(Number),
      currentYear,
    ]);
    (matches || []).forEach((m) => {
      const d = dayOf(m);
      if (d) set.add(Number(d.slice(0, 4)));
    });
    return [...set].filter((y) => y <= currentYear).sort((a, b) => b - a);
  }, [saved, matches, currentYear]);

  // abre na temporada passada mais recente (a atual já está na Home)
  useEffect(() => {
    if (year === null && years.length) {
      setYear(years.find((y) => y < currentYear) ?? years[0]);
    }
  }, [years, year, currentYear]);

  const y = year ?? currentYear;
  const doc_ = saved[y] || {};
  const base = defaultsFor(y, saved);
  const isCurrent = y === currentYear;
  const isArchived = Array.isArray(doc_.rows) && doc_.rows.length > 0;
  const columns = doc_.columns || base.columns;
  const rules = doc_.rules || base.rules;

  /* ---------- linhas da tabela ---------- */
  const liveRows = useMemo(() => {
    if (base.mode === "goals") return buildGoalsTable(players, y);
    return buildSeasonTable(players, seasonMatches(matches, y, isCurrent), y);
  }, [players, matches, y, isCurrent, base.mode]);

  const rows = isArchived ? doc_.rows : liveRows;
  const champion = rows[0];
  const seasonAwards = itemsForYear(awards, y).filter((it) => it.winner);

  /* ---------- admin ---------- */
  // grava no banco; `local` = como a temporada fica na tela depois de salvar
  const saveDoc = async (data, local) => {
    setBusy(true);
    try {
      await setDoc(
        doc(db, "seasons", String(y)),
        { year: y, ...data },
        { merge: true },
      );
      setSaved((prev) => ({
        ...prev,
        [y]: local
          ? local(prev[y] || {})
          : { ...(prev[y] || {}), year: y, ...data },
      }));
      return true;
    } catch (err) {
      console.error(err);
      alert("Não foi possível salvar. Verifique as permissões do Firestore.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    const msg = isArchived
      ? `Substituir a tabela arquivada de ${y} pela tabela de agora?`
      : `Arquivar a tabela de ${y}? Ela fica congelada do jeito que está agora.`;
    if (!window.confirm(msg)) return;
    await saveDoc({
      rows: liveRows,
      columns,
      rules,
      archivedAt: new Date().toISOString(),
    });
  };

  const unarchive = async () => {
    if (
      !window.confirm(
        `Apagar o arquivo de ${y}? A tabela volta a ser calculada pelas partidas.`,
      )
    )
      return;
    await saveDoc({ rows: deleteField(), archivedAt: deleteField() }, (cur) => {
      const { rows: _r, archivedAt: _a, ...rest } = cur;
      return rest;
    });
  };

  const saveRules = async () => {
    const list = editingRules
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (await saveDoc({ rules: list })) setEditingRules(null);
  };

  const changeYear = (n) => {
    if (
      editingRules !== null &&
      !window.confirm("Descartar as regras não salvas?")
    )
      return;
    setEditingRules(null);
    setYear(n);
  };

  /* ---------- status da temporada ---------- */
  const status = isArchived
    ? {
        cls: "is-archived",
        text: `Tabela final · arquivada em ${fmtDate(doc_.archivedAt)}`,
      }
    : isCurrent
      ? { cls: "is-live", text: "Em andamento · a tabela ainda vai mudar" }
      : base.mode === "goals"
        ? { cls: "is-calc", text: "Gols lançados na temporada" }
        : { cls: "is-calc", text: "Calculada pelas partidas do ano" };

  return (
    <div className="ss-wrapper">
      <main className="central-column ss-page">
        <header className="rk-header-area">
          <div className="rk-title-wrap">
            <span className="rk-kicker">ARQUIVO • O ADR</span>
            <h1 className="page-title">Outras Temporadas</h1>
          </div>
        </header>

        {/* ---------- abas das temporadas ---------- */}
        <nav className="ss-tabs" aria-label="Temporadas">
          {years.map((n) => (
            <button
              key={n}
              type="button"
              className={`ss-tab ${n === y ? "is-active" : ""}`}
              onClick={() => changeYear(n)}
              aria-pressed={n === y}
            >
              <span className="ss-tab-year">{n}</span>
              <span className="ss-tab-sub">
                {saved[n]?.rows?.length
                  ? "Encerrada"
                  : n === currentYear
                    ? "Atual"
                    : "Temporada"}
              </span>
            </button>
          ))}
        </nav>

        {/* ---------- topo da temporada ---------- */}
        <section className="ss-head">
          <div>
            <h2 className="ss-title">Temporada {y}</h2>
            {base.subtitle && <p className="ss-subtitle">{base.subtitle}</p>}
            <span className={`ss-status ${status.cls}`}>{status.text}</span>
          </div>

          {champion && (
            <Link to={`/player/${champion.id}`} className="ss-champ">
              <img src={primeiro} alt="" className="ss-champ-medal" />
              <span className="ss-champ-label">
                {isCurrent && !isArchived ? "Líder" : "Campeão"}
              </span>
              <span className="ss-champ-name">{champion.name}</span>
              <span className="ss-champ-stat">
                {base.mode === "goals"
                  ? `${champion.goals} gols`
                  : `${champion.points} pts`}
              </span>
            </Link>
          )}
        </section>

        {/* ---------- tabela ---------- */}
        {rows.length ? (
          <div className="table-responsive">
            <table
              className={`rk-table ss-table ${columns.length <= 2 ? "is-compact" : ""}`}
            >
              <thead>
                <tr>
                  <th className="sticky-col pin-pos">#</th>
                  <th className="sticky-col pin-name">Jogador</th>
                  {columns.map((c) => (
                    <th key={c} title={COLUMNS[c]?.title}>
                      {COLUMNS[c]?.label || c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const pos = r.pos || idx + 1;
                  const isLast =
                    idx === rows.length - 1 &&
                    rows.length > 3 &&
                    base.mode !== "goals";
                  let cls = "rk-body-row";
                  if (pos === 1) cls += " first-place destaque-top3";
                  else if (pos === 2) cls += " second-place destaque-top3";
                  else if (pos === 3) cls += " third-place destaque-top3";
                  else if (isLast) cls += " last-place destaque-ultimo";

                  return (
                    <tr key={r.id || idx} className={cls}>
                      <td className="fw-bold sticky-col pin-pos">
                        <span className="rk-pos-wrap">
                          {pos <= 3 ? (
                            <img
                              src={MEDALS[pos - 1]}
                              width="20"
                              height="20"
                              className="rk-medal-img"
                              alt={`${pos}º`}
                            />
                          ) : (
                            <span className="rk-pos-num">{pos}</span>
                          )}
                        </span>
                      </td>
                      <td className="player-td-name fw-bold sticky-col pin-name">
                        <Link to={`/player/${r.id}`} className="ss-player-link">
                          <span className="rk-player-name-text">{r.name}</span>
                        </Link>
                      </td>
                      {columns.map((c, ci) => (
                        <td
                          key={c}
                          className={
                            ci === 0
                              ? "rk-pts-cell fw-bold"
                              : c === "wins"
                                ? "rk-stat-cell win-num"
                                : c === "losses"
                                  ? "rk-stat-cell loss-num"
                                  : c === "games"
                                    ? "rk-stat-cell muted"
                                    : "rk-stat-cell"
                          }
                        >
                          {r[c] ?? 0}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="ss-empty">Nenhum jogo registrado nessa temporada.</p>
        )}

        {/* ---------- regras da temporada ---------- */}
        <section className="ss-card ss-rules">
          <div className="ss-card-head">
            <h3 className="ss-card-title">Regras da tabela em {y}</h3>
            {isAdmin && editingRules === null && (
              <button
                type="button"
                className="ss-btn ss-btn-ghost"
                onClick={() => setEditingRules(rules.join("\n"))}
              >
                Editar regras
              </button>
            )}
          </div>

          {editingRules !== null ? (
            <div className="ss-rules-edit">
              <textarea
                value={editingRules}
                onChange={(e) => setEditingRules(e.target.value)}
                rows={Math.max(6, editingRules.split("\n").length + 1)}
                placeholder="Uma regra por linha"
              />
              <p className="ss-hint">
                Uma regra por linha. Vale só para a temporada {y}.
              </p>
              <div className="ss-actions">
                <button
                  type="button"
                  className="ss-btn ss-btn-ghost"
                  onClick={() => setEditingRules(null)}
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="ss-btn"
                  onClick={saveRules}
                  disabled={busy}
                >
                  {busy ? "Salvando..." : "Salvar regras"}
                </button>
              </div>
            </div>
          ) : (
            <ol className="ss-rules-list">
              {rules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          )}
        </section>

        {/* ---------- prêmios do Hall da Fama daquele ano ---------- */}
        {seasonAwards.length > 0 && (
          <section className="ss-card ss-awards">
            <h3 className="ss-card-title">Prêmios da temporada</h3>
            <div className="ss-awards-list">
              {seasonAwards.map((a) => (
                <div
                  key={a.id}
                  className="ss-award"
                  style={{ "--award-color": a.color }}
                >
                  <AchIcon
                    icon={awardIconToAch(a.icon)}
                    className="ss-award-ico"
                  />
                  <span className="ss-award-title">{a.title}</span>
                  <span className="ss-award-winner">{a.winner}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------- admin: congelar a tabela ---------- */}
        {isAdmin && (
          <section className="ss-admin">
            <p>
              {isArchived
                ? "Essa tabela está congelada. Mudanças nas partidas não alteram mais ela."
                : "Quando a temporada acabar, arquive a tabela para ela ficar guardada do jeito que terminou."}
            </p>
            <div className="ss-actions">
              {isArchived && (
                <button
                  type="button"
                  className="ss-btn ss-btn-ghost is-danger"
                  onClick={unarchive}
                  disabled={busy}
                >
                  Apagar arquivo
                </button>
              )}
              <button
                type="button"
                className="ss-btn"
                onClick={archive}
                disabled={busy || !liveRows.length}
              >
                {isArchived ? "Arquivar de novo" : `Arquivar tabela de ${y}`}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
