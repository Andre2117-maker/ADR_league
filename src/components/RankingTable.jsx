import React from "react";
import primeiro from "../assets/primeiro.png";
import segundo from "../assets/segundo.png";
import terceiro from "../assets/terceiro.png";
import "../styles/rankingtable.css";

export default function RankingTable({
  sortedPlayers,
  getPlayerStats,
  onSelectPlayer,
  setHoveredPlayer,
}) {
  // Filtra jogadores ativos e anônimos
  const activePlayers = sortedPlayers.filter((p) => !p.isAnonymous);
  const anonymousPlayers = sortedPlayers.filter((p) => p.isAnonymous);

  return (
    <main className="central-column" id="tabela-content">
      <h1 className="page-title">Classificação Geral</h1>
      <div className="table-responsive">
        <table>
          <thead>
            <tr style={{ color: "#e2b900", fontSize: "12px" }}>
              <th>#</th>
              <th style={{ textAlign: "left", paddingLeft: "15px" }}>
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
            {/* --- JOGADORES ATIVOS --- */}
            {activePlayers.map((p, idx) => {
              const { form } = getPlayerStats(p.id);

              // Classes de destaque para o pódio
              let rowClass = "";
              if (idx === 0) rowClass = "first-place";
              else if (idx === 1) rowClass = "second-place";
              else if (idx === 2) rowClass = "third-place";
              else if (idx === activePlayers.length - 1)
                rowClass = "last-place";

              return (
                <tr
                  key={p.id}
                  onMouseEnter={() => setHoveredPlayer(p)}
                  className={rowClass}
                >
                  <td>
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
                    className="player-td-name"
                    onClick={() => onSelectPlayer(p)}
                  >
                    {p.name}
                  </td>
                  <td className="fw-bold">{p.points}</td>
                  <td>{p.goals}</td>
                  <td>{p.assists}</td>
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

            {/* --- JOGADORES ANÔNIMOS (CAFÉ COM LEITE) --- */}
            {anonymousPlayers.length > 0 && (
              <>
                <tr className="separator-row">
                  <td
                    colSpan="9"
                    style={{
                      fontSize: "10px",
                      color: "#666",
                      padding: "10px 0",
                    }}
                  >
                    JOGADORES AVULSOS / ANTIGOS
                  </td>
                </tr>
                {anonymousPlayers.map((p) => {
                  const { form } = getPlayerStats(p.id);
                  return (
                    <tr key={p.id} className="row-is-anonymous">
                      <td>-</td>
                      <td className="player-td-name">{p.name}</td>
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
                              <span
                                key={i}
                                className={`form-dot ${result}`}
                              ></span>
                            ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
