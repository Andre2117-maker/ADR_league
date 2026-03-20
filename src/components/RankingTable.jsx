import React from "react";
import primeiro from "../assets/primeiro.png";
import segundo from "../assets/segundo.png";
import terceiro from "../assets/terceiro.png";
import "../styles/rankingtable.css";

export default function RankingTable({
  sortedPlayers,
  getPlayerStats, // Usaremos essa função para pegar os dados das partidas reais
  onSelectPlayer,
  setHoveredPlayer,
}) {
  const activePlayers = sortedPlayers.filter((p) => !p.isAnonymous);
  const anonymousPlayers = sortedPlayers.filter((p) => p.isAnonymous);

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
              // 1. Pega os dados calculados das PARTIDAS REAIS
              const realStats = getPlayerStats(p.id);

              // 2. Pega os dados MANUAIS salvos em statsBySeason["2026"]
              const manualStats26 = p.statsBySeason?.["2026"] || {};
              const manualGoals = Number(manualStats26.goals || 0);
              const manualAssists = Number(manualStats26.assists || 0);
              const manualGames = Number(
                manualStats26.matches || manualStats26.games || 0,
              );

              // 3. SOMA (Partidas Reais + Manuais de 2026)
              // Se getPlayerStats não retornar gols/assists/games, usamos fallback para 0
              const totalGoals26 = (realStats.goals || 0) + manualGoals;
              const totalAssists26 = (realStats.assists || 0) + manualAssists;
              const totalGames26 =
                (realStats.matches || realStats.games || 0) + manualGames;

              // Para os Pontos, Vitórias e Derrotas, estou mantendo o cálculo atual do getPlayerStats.
              // Se você também edita V/D/Pts manualmente no ADM para 2026, precisará somar aqui também.
              const points = realStats.points || p.points || 0;
              const wins = realStats.wins || p.wins || 0;
              const losses = realStats.losses || p.losses || 0;
              const form = realStats.form || [];

              // Classes de destaque para o pódio e último colocado
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
                    {p.name}
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

            {/* SEÇÃO ANÔNIMOS */}
            {anonymousPlayers.map((p) => {
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

              return (
                <tr key={p.id} className="row-is-anonymous">
                  <td className="sticky-col pin-pos">-</td>
                  <td className="player-td-name sticky-col pin-name">
                    {p.name}
                  </td>

                  <td>{points}</td>
                  <td>{totalGoals26}</td>
                  <td>{totalAssists26}</td>
                  <td>{totalGames26}</td>
                  <td>{wins}</td>
                  <td>{losses}</td>
                  <td>
                    <div className="form-container">
                      {form &&
                        form.map((result, i) => (
                          <span key={i} className={`form-dot ${result}`}></span>
                        ))}
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
