import React from "react";
import primeiro from "../assets/primeiro.png";
import segundo from "../assets/segundo.png";
import terceiro from "../assets/terceiro.png";
import "../styles/rankingtable.css";

export default function RankingTable({
  sortedPlayers,
  getPlayerStats,
  onSelectPlayer,
  getTotalAssists,
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
              {/* COLUNAS FIXAS NO THEAD */}
              <th className="sticky-col pin-pos">#</th>
              <th
                className="sticky-col pin-name"
                style={{ textAlign: "left", paddingLeft: "15px" }}
              >
                Jogador
              </th>
              {/* REMOVIDA A LINHA VERTICAL AQUI NO CSS */}
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
              const { form } = getPlayerStats(p.id);

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
                  {/* DADOS FIXOS NO TBODY */}
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

                  {/* COLUNAS QUE SCROLLAM */}
                  {/* REMOVIDA A LINHA VERTICAL AQUI NO CSS */}
                  <td className="fw-bold">{p.points}</td>
                  <td>{p.goals}</td>
                  <td>{getTotalAssists(p.id)}</td>
                  <td>{p.games}</td>
                  <td>{p.wins || 0}</td>
                  <td>{p.losses || 0}</td>
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
              const { form } = getPlayerStats(p.id);
              return (
                <tr key={p.id} className="row-is-anonymous">
                  {/* Adicione as classes sticky-col pin-pos */}
                  <td className="sticky-col pin-pos">-</td>

                  {/* Adicione as classes sticky-col pin-name */}
                  <td className="player-td-name sticky-col pin-name">
                    {p.name}
                  </td>

                  {/* O resto permanece igual */}
                  <td>{p.points}</td>
                  <td>{p.goals}</td>
                  <td>{p.assists}</td>
                  <td>{p.games}</td>
                  <td>{p.wins || 0}</td>
                  <td>{p.losses || 0}</td>
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
