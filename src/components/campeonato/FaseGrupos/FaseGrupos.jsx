import React, { useState } from "react";
import MatchRowEditor from "../MatchRowEditor/MatchRowEditor";
import "./FaseGrupos.css";

export default function FaseGrupos({
  tabelaGrupos,
  qtdClassificados,
  selectedYear,
  partidas,
  loadData,
  isAdmin,
}) {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (rowId) => {
    setExpandedRow(expandedRow === rowId ? null : rowId);
  };

  if (Object.keys(tabelaGrupos).length === 0) {
    return (
      <div className="camp-empty-state">
        <h2>Nenhuma configuração para {selectedYear}.</h2>
      </div>
    );
  }

  return (
    <div className="camp-groups-layout">
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
                          <span
                            className="expand-arrow"
                            style={{ cursor: "pointer" }}
                          >
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

                      {isExpanded && (
                        <tr className="expanded-matches-row">
                          <td colSpan="7">
                            <div className="matches-dropdown">
                              <h4 className="camp-match-title">
                                Lançar Resultados: {time.nome}
                              </h4>

                              {tabelaGrupos[grupo]
                                .filter((t) => t.nome !== time.nome)
                                .map((oponente) => (
                                  <div
                                    key={oponente.nome}
                                    className="camp-match-item"
                                  >
                                    <MatchRowEditor
                                      ano={selectedYear}
                                      grupo={grupo}
                                      timeA={time.nome}
                                      timeB={oponente.nome}
                                      partidas={partidas}
                                      reloadData={loadData}
                                      isAdmin={isAdmin}
                                    />
                                  </div>
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
