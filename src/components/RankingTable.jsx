import React, { useState, useMemo, useEffect, useRef } from "react";
import primeiro from "../assets/primeiro.png";
import segundo from "../assets/segundo.png";
import terceiro from "../assets/terceiro.png";

// IMPORTANDO OS PNGS DE FOGO (STREAK DE PRESENÇA)
import fogoLaranja from "../assets/medalhas/streak/fogoLar.png";
import fogoAzul from "../assets/medalhas/streak/fogoAzul.png";
import fogoRoxo from "../assets/medalhas/streak/fogoRox.png";
import fogoVerde from "../assets/medalhas/streak/fogoVer.png";

import "../styles/Tabelas/rankingtable.css";

/* ==========================================================================
   ÍCONES DE TRAÇO FINO (substituem os emojis; herdam a cor do tema)
   ========================================================================== */
// Bola clássica: círculo sólido com os gomos recortados na cor do fundo
const BallIcon = ({ className = "" }) => {
  const clipId = `rk-ball-${React.useId().replace(/:/g, "")}`;
  return (
    <svg
      className={`rk-glyph ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ fill: "currentColor", stroke: "none" }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="12" cy="12" r="9.4" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="9.4" fill="currentColor" />
      <g
        clipPath={`url(#${clipId})`}
        style={{ fill: "var(--rk-bg, #050505)", stroke: "none" }}
      >
        <path d="M12 8.6l3.25 2.36-1.24 3.82H9.99l-1.24-3.82z" />
        <path d="M12 1.2l2.6 2.2-.4 2.2H9.8l-.4-2.2z" />
        <path d="M22.6 9.4l-.6 3.4-2 .8-1.4-1.8.8-3z" />
        <path d="M17.8 21.6l-3.3.4-1-1.9 1.6-1.8 2.9.6z" />
        <path d="M6.2 21.6l3.3.4 1-1.9-1.6-1.8-2.9.6z" />
        <path d="M1.4 9.4l.6 3.4 2 .8 1.4-1.8-.8-3z" />
      </g>
    </svg>
  );
};

const ICON_PATHS = {
  // Chuteira de perfil com travas
  assist: (
    <>
      <path
        fill="currentColor"
        d="M4.6 5.6h5.4l.9 3.8 6.4 2.3c2 .8 3.5 2.4 3.5 4.1v1.4H4.1c-.8 0-1.4-.6-1.4-1.4v-2.3c0-1.1.5-2 1.1-2.8z"
      />
      <path
        fill="currentColor"
        d="M5 18.4h2.2v1.8H5zM9.8 18.4H12v1.8H9.8zM14.6 18.4h2.2v1.8h-2.2zM18.6 18.4h2.2v1.8h-2.2z"
      />
    </>
  ),
  // Triângulo sólido com exclamação recortada
  alert: (
    <>
      <path d="M12 2.8l10 17.6H2z" fill="currentColor" />
      <path
        d="M12 9.2v5"
        fill="none"
        stroke="#000"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.2" r="1.25" fill="#000" />
    </>
  ),
  reset: (
    <path
      d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v4h4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  chevron: (
    <path
      d="M7 10l5 5 5-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

const Icon = ({ name, className = "" }) =>
  name === "ball" ? (
    <BallIcon className={className} />
  ) : (
    <svg
      className={`rk-glyph ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ fill: "currentColor", stroke: "none" }}
    >
      {ICON_PATHS[name]}
    </svg>
  );

// Seta de ordenação no cabeçalho
const SortMark = ({ active }) =>
  active ? <Icon name="chevron" className="rk-sort-glyph" /> : null;

export default function RankingTable({
  sortedPlayers = [],
  getPlayerStats,
  setHoveredPlayer,
  isAdmin,
  matches = [],
}) {
  const [sortConfig, setSortConfig] = useState({
    key: "rank",
    direction: "asc",
  });

  // Aviso discreto ao tocar num selo (no lugar do alert do navegador)
  const [info, setInfo] = useState(null);
  const infoTimer = useRef(null);
  const showInfo = (e, data) => {
    e.stopPropagation();
    clearTimeout(infoTimer.current);
    setInfo(data);
    infoTimer.current = setTimeout(() => setInfo(null), 3500);
  };
  useEffect(() => () => clearTimeout(infoTimer.current), []);

  // 1. PRÉ-PROCESSAMENTO DE DATAS (TREINOS E EVENTOS OFICIAIS QUE GERAM FALTAS)
  const trainingData = useMemo(() => {
    const validMatchesForAttendance = (matches || []).filter((m) => {
      const type = String(m.type || "TREINO").toUpperCase();
      const isTreino = type === "TREINO";
      const isEventWithFoul = type === "EVENTO" && m.generateFoul !== false;
      return (isTreino || isEventWithFoul) && m.date;
    });

    const rawDates = [
      ...new Set(
        validMatchesForAttendance.map((m) => String(m.date).split("T")[0]),
      ),
    ];

    const sortedTrainingDays = rawDates.sort((a, b) => {
      const [y1, m1, d1] = a.split("-").map(Number);
      const [y2, m2, d2] = b.split("-").map(Number);
      return new Date(y2, m2 - 1, d2, 12) - new Date(y1, m1 - 1, d1, 12);
    });

    return { validMatchesForAttendance, sortedTrainingDays };
  }, [matches]);

  // 2. DADOS DOS JOGADORES ATIVOS
  const { enrichedPlayers, maxGoals, maxAssists } = useMemo(() => {
    const active = sortedPlayers.filter((p) => !p.isAnonymous);
    let highestGoals = 0;
    let highestAssists = 0;

    const { validMatchesForAttendance, sortedTrainingDays } = trainingData;

    const processed = active.map((p, originalIdx) => {
      const pIdStr = String(p.id);
      const realStats = getPlayerStats ? getPlayerStats(p.id) : {};
      const manualStats26 = p.statsBySeason?.["2026"] || {};

      const manualGoals = Number(manualStats26.goals || 0);
      const manualAssists = Number(manualStats26.assists || 0);
      const manualGames = Number(
        manualStats26.matches || manualStats26.games || 0,
      );

      const totalGoals26 = (realStats.goals || 0) + manualGoals;
      const totalAssists26 = (realStats.assists || 0) + manualAssists;
      const totalGames26 =
        (realStats.matches || realStats.games || 0) + manualGames;

      const points = realStats.points ?? p.points ?? 0;
      const wins = realStats.wins ?? p.wins ?? 0;
      const losses = realStats.losses ?? p.losses ?? 0;
      const form = realStats.form || [];

      if (totalGoals26 > highestGoals) highestGoals = totalGoals26;
      if (totalAssists26 > highestAssists) highestAssists = totalAssists26;

      // --- CÁLCULO DE STREAK E FALTAS INTELIGENTE ---
      let streak = 0;
      let missedCount = 0;
      let countingStreak = true;
      let countingMissed = true;

      for (const day of sortedTrainingDays) {
        // Verifica se houve partidas geradoras de falta neste dia
        const matchesOnThisDay = validMatchesForAttendance.filter(
          (match) => String(match.date).split("T")[0] === day,
        );

        // Se por acaso o dia só tiver partidas que NÃO geram falta, ignoramos completamente o dia para o streak
        const hasFoulGeneratingMatch = matchesOnThisDay.some(
          (m) => m.generateFoul !== false,
        );
        if (!hasFoulGeneratingMatch) continue;

        const playedOnThisDay = matchesOnThisDay.some((match) => {
          const teamAPlayers =
            match.teamA?.players || match.actualParticipantsA || [];
          const teamBPlayers =
            match.teamB?.players || match.actualParticipantsB || [];

          const inA = teamAPlayers.some((id) => String(id) === pIdStr);
          const inB = teamBPlayers.some((id) => String(id) === String(pIdStr));
          return inA || inB;
        });

        if (countingStreak) {
          if (playedOnThisDay) streak++;
          else countingStreak = false; // Quebra o foguinho apenas se faltou a um treino/evento oficial gerador de falta
        }

        if (countingMissed) {
          if (!playedOnThisDay) missedCount++;
          else countingMissed = false;
        }

        if (!countingStreak && !countingMissed) break;
      }

      return {
        player: p,
        originalRank: originalIdx + 1,
        points,
        totalGoals26,
        totalAssists26,
        totalGames26,
        wins,
        losses,
        form,
        streak,
        missedCount,
      };
    });

    return {
      enrichedPlayers: processed,
      maxGoals: highestGoals,
      maxAssists: highestAssists,
    };
  }, [sortedPlayers, getPlayerStats, trainingData]);

  // 3. ORDENAÇÃO POR COLUNA
  const displayedPlayers = useMemo(() => {
    let list = [...enrichedPlayers];

    if (sortConfig.key !== "rank") {
      list.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA !== valB) {
          return sortConfig.direction === "desc" ? valB - valA : valA - valB;
        }
        return a.originalRank - b.originalRank;
      });
    }

    return list;
  }, [enrichedPlayers, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "desc") {
          return { key: "rank", direction: "asc" };
        }
        return { key, direction: "desc" };
      }
      return { key, direction: "desc" };
    });
  };

  const getFireIcon = (streak) => {
    if (streak >= 15) return fogoRoxo;
    if (streak >= 10) return fogoVerde;
    if (streak >= 5) return fogoAzul;
    if (streak >= 1) return fogoLaranja;
    return null;
  };

  return (
    <main className="central-column" id="tabela-content">
      {/* ==================== TOPO DA TABELA ==================== */}
      <header className="rk-header-area">
        <div className="rk-title-wrap">
          <span className="rk-kicker">TEMPORADA 2026 • O ADR</span>
          <h1 className="page-title">Classificação Geral</h1>
        </div>

        {sortConfig.key !== "rank" && (
          <button
            type="button"
            className="rk-reset-sort-btn"
            onClick={() => setSortConfig({ key: "rank", direction: "asc" })}
          >
            <Icon name="reset" /> Voltar para Classificação Oficial
          </button>
        )}
      </header>

      {/* ==================== TABELA PRINCIPAL ==================== */}
      <div className="table-responsive">
        <table className="rk-table">
          <thead>
            <tr>
              <th
                className="sticky-col pin-pos sortable-th"
                onClick={() => setSortConfig({ key: "rank", direction: "asc" })}
                title="Voltar à Ordem Oficial"
              >
                #
              </th>
              <th className="sticky-col pin-name">Jogador</th>

              <th
                className={`sortable-th ${
                  sortConfig.key === "points" ? "active-sort" : ""
                }`}
                onClick={() => handleSort("points")}
                title="Ordenar por Pontos"
              >
                Pts <SortMark active={sortConfig.key === "points"} />
              </th>

              <th
                className={`sortable-th ${
                  sortConfig.key === "totalGoals26" ? "active-sort" : ""
                }`}
                onClick={() => handleSort("totalGoals26")}
                title="Ordenar por Gols"
              >
                Gols <SortMark active={sortConfig.key === "totalGoals26"} />
              </th>

              <th
                className={`sortable-th ${
                  sortConfig.key === "totalAssists26" ? "active-sort" : ""
                }`}
                onClick={() => handleSort("totalAssists26")}
                title="Ordenar por Assistências"
              >
                Assis <SortMark active={sortConfig.key === "totalAssists26"} />
              </th>

              <th
                className={`sortable-th ${
                  sortConfig.key === "totalGames26" ? "active-sort" : ""
                }`}
                onClick={() => handleSort("totalGames26")}
                title="Ordenar por Jogos"
              >
                J <SortMark active={sortConfig.key === "totalGames26"} />
              </th>

              <th
                className={`sortable-th ${
                  sortConfig.key === "wins" ? "active-sort" : ""
                }`}
                onClick={() => handleSort("wins")}
                title="Ordenar por Vitórias"
              >
                V <SortMark active={sortConfig.key === "wins"} />
              </th>

              <th
                className={`sortable-th ${
                  sortConfig.key === "losses" ? "active-sort" : ""
                }`}
                onClick={() => handleSort("losses")}
                title="Ordenar por Derrotas"
              >
                D <SortMark active={sortConfig.key === "losses"} />
              </th>

              <th>Últimas 5</th>
            </tr>
          </thead>

          <tbody>
            {displayedPlayers.map((item, idx) => {
              const {
                player: p,
                points,
                totalGoals26,
                totalAssists26,
                totalGames26,
                wins,
                losses,
                form,
                streak,
                missedCount,
              } = item;

              const currentPos = idx + 1;
              const isLast =
                idx === displayedPlayers.length - 1 &&
                displayedPlayers.length > 3;

              const fireSrc = getFireIcon(streak);

              let rowClass = "rk-body-row";
              if (currentPos === 1) rowClass += " first-place destaque-top3";
              else if (currentPos === 2)
                rowClass += " second-place destaque-top3";
              else if (currentPos === 3)
                rowClass += " third-place destaque-top3";
              else if (isLast) rowClass += " last-place destaque-ultimo";

              return (
                <tr
                  key={p.id}
                  onMouseEnter={() => setHoveredPlayer && setHoveredPlayer(p)}
                  className={rowClass}
                >
                  <td className="fw-bold sticky-col pin-pos">
                    {currentPos <= 3 ? (
                      <img
                        src={[primeiro, segundo, terceiro][currentPos - 1]}
                        width="20"
                        height="20"
                        className="rk-medal-img"
                        alt={`${currentPos}º`}
                      />
                    ) : (
                      <span className="rk-pos-num">{currentPos}</span>
                    )}
                  </td>

                  <td className="player-td-name fw-bold sticky-col pin-name">
                    <div className="rk-player-cell-inner">
                      <span className="rk-player-name-wrap">
                        <span className="rk-player-name-text">{p.name}</span>

                        {totalGoals26 > 0 && totalGoals26 === maxGoals && (
                          <button
                            type="button"
                            className="rk-lead-chip is-goal"
                            title={`Artilheiro da temporada (${totalGoals26} gols)`}
                            onClick={(e) =>
                              showInfo(e, {
                                type: "goal",
                                title: "Artilheiro da temporada",
                                text: `${p.name} · ${totalGoals26} gols`,
                              })
                            }
                          >
                            <Icon name="ball" />
                          </button>
                        )}

                        {totalAssists26 > 0 &&
                          totalAssists26 === maxAssists && (
                            <button
                              type="button"
                              className="rk-lead-chip is-assist"
                              title={`Líder de assistências (${totalAssists26})`}
                              onClick={(e) =>
                                showInfo(e, {
                                  type: "assist",
                                  title: "Líder de assistências",
                                  text: `${p.name} · ${totalAssists26} assistências`,
                                })
                              }
                            >
                              <Icon name="assist" />
                            </button>
                          )}

                        {fireSrc && (
                          <button
                            type="button"
                            className="rk-fire-chip"
                            title={`${streak} treinos seguidos sem faltar`}
                            onClick={(e) =>
                              showInfo(e, {
                                type: "fire",
                                title: "Sequência de presença",
                                text: `${p.name} · ${streak} treinos seguidos sem faltar`,
                              })
                            }
                          >
                            <img src={fireSrc} alt="" />
                            <span>{streak}</span>
                          </button>
                        )}
                      </span>

                      {isAdmin && missedCount >= 3 && (
                        <button
                          type="button"
                          className="rk-absence-btn"
                          title={`Faltou aos últimos ${missedCount} treinos`}
                          onClick={(e) =>
                            showInfo(e, {
                              type: "alert",
                              title: "Alerta de faltas",
                              text: `${p.name} faltou aos últimos ${missedCount} treinos`,
                            })
                          }
                        >
                          <Icon name="alert" />
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="rk-pts-cell fw-bold">{points}</td>
                  <td className="rk-stat-cell">{totalGoals26}</td>
                  <td className="rk-stat-cell">{totalAssists26}</td>
                  <td className="rk-stat-cell muted">{totalGames26}</td>
                  <td className="rk-stat-cell win-num">{wins}</td>
                  <td className="rk-stat-cell loss-num">{losses}</td>

                  <td>
                    <div className="form-container">
                      {form && form.length > 0 ? (
                        form.map((result, i) => (
                          <span
                            key={i}
                            className={`form-dot ${result}`}
                            title={
                              result === "W"
                                ? "Vitória"
                                : result === "L"
                                  ? "Derrota"
                                  : "Empate"
                            }
                          />
                        ))
                      ) : (
                        <span className="no-games">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="legend-container">
        <div className="legend-group">
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: "#007bff" }}
            />
            <span>Prêmios</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: "#dc3545" }}
            />
            <span>Punição</span>
          </div>
        </div>

        <div className="legend-group">
          <div className="legend-item">
            <span className="rk-legend-chip is-goal">
              <Icon name="ball" />
            </span>
            <span>Artilheiro</span>
          </div>
          <div className="legend-item">
            <span className="rk-legend-chip is-assist">
              <Icon name="assist" />
            </span>
            <span>Líder Assists</span>
          </div>
          <div className="legend-item">
            <img src={fogoLaranja} alt="" className="rk-legend-flame" />
            <span>Presença</span>
          </div>
        </div>
      </footer>

      {/* AVISO AO TOCAR NUM SELO */}
      {info && (
        <div className={`rk-info-toast type-${info.type}`} role="status">
          <div className="rk-info-body">
            <span className="rk-info-title">{info.title}</span>
            <span className="rk-info-text">{info.text}</span>
          </div>
          <button
            type="button"
            className="rk-info-close"
            onClick={() => setInfo(null)}
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </main>
  );
}
