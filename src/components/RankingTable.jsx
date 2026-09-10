import React from "react";
import primeiro from "../assets/primeiro.png";
import segundo from "../assets/segundo.png";
import terceiro from "../assets/terceiro.png";

// IMPORTANDO SEUS PNGS DE FOGO (Ajuste os nomes dos arquivos conforme salvou na pasta)
import fogoLaranja from "../assets/streak/fogoLar.png"; // Seu fogo base (5 a 9)
import fogoAzul from "../assets/streak/fogoAzul.png"; // (10 a 14)
import fogoRoxo from "../assets/streak/fogoVer.png"; // (15 a 19)
import fogoVermelho from "../assets/streak/fogoRox.png"; // (20+)

import "../styles/Tabelas/rankingtable.css";

export default function RankingTable({
  sortedPlayers,
  getPlayerStats,
  onSelectPlayer,
  setHoveredPlayer,
  isAdmin,
  matches,
}) {
  const activePlayers = sortedPlayers.filter((p) => !p.isAnonymous);

  // --- 1. ENCONTRAR ARTILHEIRO E LÍDER DE ASSISTÊNCIAS ---
  let maxGoals = 0;
  let maxAssists = 0;

  activePlayers.forEach((p) => {
    const realStats = getPlayerStats(p.id);
    const manualStats26 = p.statsBySeason?.["2026"] || {};
    const tGoals = (realStats.goals || 0) + Number(manualStats26.goals || 0);
    const tAssists =
      (realStats.assists || 0) + Number(manualStats26.assists || 0);

    if (tGoals > maxGoals) maxGoals = tGoals;
    if (tAssists > maxAssists) maxAssists = tAssists;
  });

  // --- 2. FUNÇÃO PARA CHECAR FALTAS ---
  const checkConsecutiveAbsences = (player, allMatches) => {
    if (!allMatches || allMatches.length === 0) return { isOut: false };

    const onlyTrainings = allMatches.filter((m) => m.type === "TREINO");
    if (onlyTrainings.length === 0) return { isOut: false };

    const rawDates = [...new Set(onlyTrainings.map((m) => m.date))];
    const trainingDays = rawDates.sort((a, b) => {
      const [y1, m1, d1] = a.split("-").map(Number);
      const [y2, m2, d2] = b.split("-").map(Number);
      return new Date(y2, m2 - 1, d2, 12) - new Date(y1, m1 - 1, d1, 12);
    });

    let missedCount = 0;
    for (const day of trainingDays) {
      const playedOnThisDay = onlyTrainings.some((match) => {
        return (
          match.date === day &&
          (match.teamA.players.some(
            (pId) => String(pId) === String(player.id),
          ) ||
            match.teamB.players.some(
              (pId) => String(pId) === String(player.id),
            ))
        );
      });

      if (playedOnThisDay) break;
      else missedCount++;
    }

    return { isOut: missedCount >= 3 };
  };

  // --- 3. FUNÇÃO PARA CHECAR STREAK DE PRESENÇA (FOGO) ---
  const checkAttendanceStreak = (player, allMatches) => {
    if (!allMatches || allMatches.length === 0) return 0;
    const onlyTrainings = allMatches.filter((m) => m.type === "TREINO");
    if (onlyTrainings.length === 0) return 0;

    const rawDates = [...new Set(onlyTrainings.map((m) => m.date))];
    const trainingDays = rawDates.sort((a, b) => {
      const [y1, m1, d1] = a.split("-").map(Number);
      const [y2, m2, d2] = b.split("-").map(Number);
      return new Date(y2, m2 - 1, d2, 12) - new Date(y1, m1 - 1, d1, 12);
    });

    let streak = 0;
    for (const day of trainingDays) {
      const playedOnThisDay = onlyTrainings.some((match) => {
        return (
          match.date === day &&
          (match.teamA.players.some(
            (pId) => String(pId) === String(player.id),
          ) ||
            match.teamB.players.some(
              (pId) => String(pId) === String(player.id),
            ))
        );
      });

      if (playedOnThisDay) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Ajuda a escolher o fogo correto a cada 5 treinos
  const getFireIcon = (streak) => {
    if (streak >= 15) return fogoVermelho;
    if (streak >= 10) return fogoRoxo;
    if (streak >= 5) return fogoAzul;
    if (streak >= 1) return fogoLaranja;
    return null;
  };

  return (
    <main className="central-column" id="tabela-content">
      <h1 className="page-title">Classificação Geral</h1>

      <div className="table-responsive">
        <table>
          <thead>
            <tr style={{ color: "#e2b900", fontSize: "12px" }}>
              <th className="sticky-col pin-pos">#</th>
              <th
                className="sticky-col pin-name"
                style={{ textAlign: "left", paddingLeft: "15px" }}
              >
                Jogador
              </th>
              <th>Pts</th>
              <th>Gols</th>
              <th>Assis</th>
              <th>J</th>
              <th>V</th>
              <th>D</th>
              <th>Últimas 5</th>
            </tr>
          </thead>
          <tbody>
            {activePlayers.map((p, idx) => {
              const realStats = getPlayerStats(p.id);
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

              const points = realStats.points || p.points || 0;
              const wins = realStats.wins || p.wins || 0;
              const losses = realStats.losses || p.losses || 0;
              const form = realStats.form || [];

              const streak = checkAttendanceStreak(p, matches);
              const fireSrc = getFireIcon(streak);

              let rowClass = "";
              if (idx === 0) rowClass = "first-place destaque-top3";
              else if (idx === 1) rowClass = "second-place destaque-top3";
              else if (idx === 2) rowClass = "third-place destaque-top3";
              else if (idx === activePlayers.length - 1)
                rowClass = "last-place destaque-ultimo";

              return (
                <tr
                  key={p.id}
                  onMouseEnter={() => setHoveredPlayer(p)}
                  className={rowClass}
                >
                  <td className="fw-bold sticky-col pin-pos">
                    {idx < 3 ? (
                      <img
                        src={[primeiro, segundo, terceiro][idx]}
                        width="20"
                        alt={idx + 1}
                      />
                    ) : (
                      idx + 1
                    )}
                  </td>
                  <td
                    className="player-td-name fw-bold sticky-col pin-name"
                    onClick={() => onSelectPlayer(p)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        paddingRight: "5px",
                      }}
                    >
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {p.name}

                        {totalGoals26 > 0 && totalGoals26 === maxGoals && (
                          <span
                            title="Artilheiro do Campeonato"
                            style={{ fontSize: "14px" }}
                          >
                            ⚽
                          </span>
                        )}

                        {totalAssists26 > 0 &&
                          totalAssists26 === maxAssists && (
                            <span
                              title="Líder de Assistências"
                              style={{ fontSize: "14px" }}
                            >
                              🎯
                            </span>
                          )}

                        {/* CAIXINHA DO FOGO COM CONTADOR */}
                        {fireSrc && (
                          <div
                            title={`${streak} treinos sem faltar!`}
                            style={{
                              position: "relative",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "24px",
                              height: "24px",
                              marginTop: "-2px",
                            }}
                          >
                            <img
                              src={fireSrc}
                              alt="Streak Fogo"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                bottom: "3px", // Ajuste esse valor para o número subir ou descer na chama
                                fontSize: "11px",
                                fontWeight: "900",
                                color: "#fff",
                                // Essa sombra preta garante que o número branco dê leitura até em fogo claro
                                textShadow:
                                  "1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000",
                              }}
                            >
                              {streak}
                            </span>
                          </div>
                        )}
                      </span>

                      {isAdmin &&
                        checkConsecutiveAbsences(p, matches).isOut && (
                          <span
                            title="Alerta: Faltou aos últimos 3 treinos!"
                            style={{
                              cursor: "help",
                              fontSize: "14px",
                              marginLeft: "auto",
                              flexShrink: 0,
                            }}
                          >
                            ⚠️
                          </span>
                        )}
                    </div>
                  </td>

                  <td className="fw-bold">{points}</td>
                  <td>{totalGoals26}</td>
                  <td>{totalAssists26}</td>
                  <td>{totalGames26}</td>
                  <td>{wins}</td>
                  <td>{losses}</td>
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
                          ></span>
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

      <div className="legend-container">
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: "#007bff" }}
          ></span>
          <span>Prêmios</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: "#dc3545" }}
          ></span>
          <span>Punição</span>
        </div>
      </div>
    </main>
  );
}
