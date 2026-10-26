import React, { useState, useMemo } from "react";
import primeiro from "../assets/primeiro.png";
import segundo from "../assets/segundo.png";
import terceiro from "../assets/terceiro.png";

// IMPORTANDO OS PNGS DE FOGO (STREAK DE PRESENÇA)
import fogoLaranja from "../assets/medalhas/streak/fogoLar.png";
import fogoAzul from "../assets/medalhas/streak/fogoAzul.png";
import fogoRoxo from "../assets/medalhas/streak/fogoRox.png";
import fogoVerde from "../assets/medalhas/streak/fogoVer.png";

import "../styles/Tabelas/rankingtable.css";

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

  // 1. PRÉ-PROCESSAMENTO DE DATAS DE TREINO
  const trainingData = useMemo(() => {
    const onlyTrainings = (matches || []).filter(
      (m) => String(m.type || "TREINO").toUpperCase() === "TREINO" && m.date,
    );

    const rawDates = [
      ...new Set(onlyTrainings.map((m) => String(m.date).split("T")[0])),
    ];

    const sortedTrainingDays = rawDates.sort((a, b) => {
      const [y1, m1, d1] = a.split("-").map(Number);
      const [y2, m2, d2] = b.split("-").map(Number);
      return new Date(y2, m2 - 1, d2, 12) - new Date(y1, m1 - 1, d1, 12);
    });

    return { onlyTrainings, sortedTrainingDays };
  }, [matches]);

  // 2. DADOS DOS JOGADORES ATIVOS
  const { enrichedPlayers, maxGoals, maxAssists } = useMemo(() => {
    const active = sortedPlayers.filter((p) => !p.isAnonymous);
    let highestGoals = 0;
    let highestAssists = 0;

    const { onlyTrainings, sortedTrainingDays } = trainingData;

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

      // Calcula Streak de Presença e Faltas Consecutivas
      let streak = 0;
      let missedCount = 0;
      let countingStreak = true;
      let countingMissed = true;

      for (const day of sortedTrainingDays) {
        const playedOnThisDay = onlyTrainings.some((match) => {
          const mDay = String(match.date).split("T")[0];
          if (mDay !== day) return false;
          const inA = match.teamA?.players?.some((id) => String(id) === pIdStr);
          const inB = match.teamB?.players?.some((id) => String(id) === pIdStr);
          return inA || inB;
        });

        if (countingStreak) {
          if (playedOnThisDay) streak++;
          else countingStreak = false;
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

  // 3. ORDENAÇÃO POR COLUNA (Atualiza as colocações dinamicamente)
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
            ↺ Voltar para Classificação Oficial
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
                Pts {sortConfig.key === "points" && "▾"}
              </th>

              <th
                className={`sortable-th ${
                  sortConfig.key === "totalGoals26" ? "active-sort" : ""
                }`}
                onClick={() => handleSort("totalGoals26")}
                title="Ordenar por Gols"
              >
                Gols {sortConfig.key === "totalGoals26" && "▾"}
              </th>

              <th
                className={`sortable-th ${
                  sortConfig.key === "totalAssists26" ? "active-sort" : ""
                }`}
                onClick={() => handleSort("totalAssists26")}
                title="Ordenar por Assistências"
              >
                Assis {sortConfig.key === "totalAssists26" && "▾"}
              </th>

              <th
                className={`sortable-th ${
                  sortConfig.key === "totalGames26" ? "active-sort" : ""
                }`}
                onClick={() => handleSort("totalGames26")}
                title="Ordenar por Jogos"
              >
                J {sortConfig.key === "totalGames26" && "▾"}
              </th>

              <th
                className={`sortable-th ${
                  sortConfig.key === "wins" ? "active-sort" : ""
                }`}
                onClick={() => handleSort("wins")}
                title="Ordenar por Vitórias"
              >
                V {sortConfig.key === "wins" && "▾"}
              </th>

              <th
                className={`sortable-th ${
                  sortConfig.key === "losses" ? "active-sort" : ""
                }`}
                onClick={() => handleSort("losses")}
                title="Ordenar por Derrotas"
              >
                D {sortConfig.key === "losses" && "▾"}
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

              // Colocação atualizada conforme a ordenação atual
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
                  {/* POSIÇÃO DINÂMICA (1º, 2º, 3º...) */}
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

                  {/* NOME DO JOGADOR (Sem interatividade de clique) */}
                  <td className="player-td-name fw-bold sticky-col pin-name">
                    <div className="rk-player-cell-inner">
                      <span className="rk-player-name-wrap">
                        <span className="rk-player-name-text">{p.name}</span>

                        {/* MEDALHA DE ARTILHEIRO */}
                        {totalGoals26 > 0 && totalGoals26 === maxGoals && (
                          <span
                            className="rk-leader-badge"
                            title={`Artilheiro do Campeonato (${totalGoals26} gols)`}
                            onClick={() =>
                              alert("⚽ Artilheiro do Campeonato!")
                            }
                          >
                            ⚽
                          </span>
                        )}

                        {/* MEDALHA DE GARÇOM */}
                        {totalAssists26 > 0 &&
                          totalAssists26 === maxAssists && (
                            <span
                              className="rk-leader-badge"
                              title={`Líder de Assistências (${totalAssists26} assists)`}
                              onClick={() => alert("🎯 Líder de Assistências!")}
                            >
                              🎯
                            </span>
                          )}

                        {/* STREAK DE PRESENÇA (FOGO) */}
                        {fireSrc && (
                          <div
                            className="rk-fire-badge"
                            title={`${streak} treinos sem faltar!`}
                            onClick={() =>
                              alert(
                                `🔥 ${streak} treinos consecutivos sem faltar!`,
                              )
                            }
                          >
                            <img src={fireSrc} alt="Streak Fogo" />
                            <span>{streak}</span>
                          </div>
                        )}
                      </span>

                      {/* ALERTA DE FALTAS (ADMIN) */}
                      {isAdmin && missedCount >= 3 && (
                        <span
                          className="rk-absence-alert"
                          title={`Alerta: Faltou aos últimos ${missedCount} treinos!`}
                        >
                          ⚠️
                        </span>
                      )}
                    </div>
                  </td>

                  {/* COLUNAS DE ESTATÍSTICAS */}
                  <td className="rk-pts-cell fw-bold">{points}</td>
                  <td className="rk-stat-cell">{totalGoals26}</td>
                  <td className="rk-stat-cell">{totalAssists26}</td>
                  <td className="rk-stat-cell muted">{totalGames26}</td>
                  <td className="rk-stat-cell win-num">{wins}</td>
                  <td className="rk-stat-cell loss-num">{losses}</td>

                  {/* ÚLTIMAS 5 PARTIDAS */}
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

      {/* ==================== LEGENDA OFICIAL ==================== */}
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
            <span>⚽ Artilheiro</span>
          </div>
          <div className="legend-item">
            <span>🎯 Líder Assists</span>
          </div>
          <div className="legend-item">
            <span>🔥 Presença</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
