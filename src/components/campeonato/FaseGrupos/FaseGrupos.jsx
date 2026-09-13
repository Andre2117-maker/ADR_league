import React, { useState } from "react";
import MatchRowEditor from "../MatchRowEditor/MatchRowEditor";
import "./FaseGrupos.css";

export default function FaseGrupos({
  tabelaGrupos,
  qtdClassificados,
  selectedYear,
  partidas,
  loadData,
  isAdmin, // <-- Já recebemos aqui
}) {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (rowId) => {
    setExpandedRow(expandedRow === rowId ? null : rowId);
  };

  if (Object.keys(tabelaGrupos).length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#888", padding: "40px" }}>
        <h2>Nenhuma configuração para {selectedYear}.</h2>
      </div>
    );
  }

  return (
    <div className="camp-groups-layout">
      {/* ADICIONAMOS O .sort() AQUI PARA ORDENAR ALFABETICAMENTE */}
      {Object.keys(tabelaGrupos)
        .sort()
        .map((grupo) => (
          <div key={grupo} className="camp-group-table-wrapper">
            <h2 className="camp-group-title">Grupo {grupo}</h2>
            <table className="camp-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Pts</th>
                  <th>J</th>
                  <th>V</th>
                  <th>E</th>
                  <th>D</th>
                  <th>SG</th>
                </tr>
              </thead>
              <tbody>
                {tabelaGrupos[grupo].map((time, idx) => {
                  const isExpanded = expandedRow === `${grupo}_${time.nome}`;
                  return (
                    <React.Fragment key={idx}>
                      <tr
                        className={`row-clickable ${idx < qtdClassificados ? "qualified" : ""} ${isExpanded ? "row-active" : ""}`}
                        onClick={() => toggleRow(`${grupo}_${time.nome}`)}
                        title="Clique para lançar partidas!"
                      >
                        <td className="team-name">
                          <span className="expand-arrow">
                            {isExpanded ? "▼" : "▶"}
                          </span>
                          <span className="pos">{idx + 1}</span> {time.nome}
                        </td>
                        <td className="bold highlight">{time.pts}</td>
                        <td>{time.j}</td>
                        <td>{time.v}</td>
                        <td>{time.e}</td>
                        <td>{time.d}</td>
                        <td>{time.sg}</td>
                      </tr>

                      {/* CAIXA SUSPENSA COM OS JOGOS */}
                      {isExpanded && (
                        <tr className="expanded-matches-row">
                          <td colSpan="7">
                            <div className="matches-dropdown">
                              <h4
                                style={{
                                  color: "#d4af37",
                                  marginTop: 0,
                                  marginBottom: "15px",
                                  textAlign: "center",
                                }}
                              >
                                Lançar Resultados: {time.nome}
                              </h4>
                              {tabelaGrupos[grupo]
                                .filter((t) => t.nome !== time.nome)
                                .map((oponente) => (
                                  <MatchRowEditor
                                    key={oponente.nome}
                                    ano={selectedYear}
                                    grupo={grupo}
                                    timeA={time.nome}
                                    timeB={oponente.nome}
                                    partidas={partidas}
                                    reloadData={loadData}
                                    isAdmin={isAdmin}
                                  />
                                ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
