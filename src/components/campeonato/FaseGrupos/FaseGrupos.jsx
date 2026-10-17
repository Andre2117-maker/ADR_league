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

  if (!tabelaGrupos || Object.keys(tabelaGrupos).length === 0) {
    return (
      <div className="camp-empty-state">
        <div className="empty-icon">🏆</div>
        <h2>Nenhuma tabela configurada para {selectedYear}</h2>
        <p>
          {isAdmin
            ? "Acesse a aba 'Configurar' acima para criar os grupos e adicionar as equipes desta edição."
            : "Os grupos desta temporada ainda estão sendo definidos pela organização."}
        </p>
      </div>
    );
  }

  return (
    <div className="camp-groups-layout">
      {Object.keys(tabelaGrupos)
        .sort()
        .map((grupo) => (
          <div key={grupo} className="camp-group-card">
            {/* CABEÇALHO DO GRUPO */}
            <div className="camp-group-header">
              <div className="group-title-wrapper">
                <span className="group-tag">FASE DE CLASSIFICAÇÃO</span>
                <h2 className="camp-group-title">GRUPO {grupo}</h2>
              </div>
              <span className="group-Click-hint">
                {isAdmin
                  ? "Clique no time p/ editar"
                  : "Clique no time p/ ver jogos"}
              </span>
            </div>

            {/* CONTAINER DE SCROLL PARA MOBILE */}
            <div className="camp-table-scroll">
              <table className="camp-table">
                <thead>
                  <tr>
                    <th className="th-team">EQUIPE</th>
                    <th title="Pontos">PTS</th>
                    <th title="Jogos">J</th>
                    <th title="Vitórias">V</th>
                    <th title="Empates">E</th>
                    <th title="Derrotas">D</th>
                    <th title="Saldo de Gols">SG</th>
                  </tr>
                </thead>
                <tbody>
                  {tabelaGrupos[grupo].map((time, idx) => {
                    const rowId = `${grupo}_${time.nome}`;
                    const isExpanded = expandedRow === rowId;
                    const isQualified = idx < qtdClassificados;

                    // Estilo dinâmico para o Saldo de Gols
                    const sgClass =
                      time.sg > 0
                        ? "sg-pos"
                        : time.sg < 0
                          ? "sg-neg"
                          : "sg-zero";
                    const sgFormatted = time.sg > 0 ? `+${time.sg}` : time.sg;

                    return (
                      <React.Fragment key={time.nome || idx}>
                        <tr
                          className={`camp-tr ${
                            isQualified ? "is-qualified" : ""
                          } ${isExpanded ? "is-expanded" : ""}`}
                          onClick={() => toggleRow(rowId)}
                        >
                          <td className="td-team">
                            <div className="team-cell-inner">
                              <span
                                className={`expand-chevron ${
                                  isExpanded ? "open" : ""
                                }`}
                              >
                                ❯
                              </span>
                              <span className="pos-badge">{idx + 1}</span>
                              <span
                                className="team-name-text"
                                title={time.nome}
                              >
                                {time.nome}
                              </span>
                            </div>
                          </td>
                          <td className="td-pts">
                            <span className="pts-pill">{time.pts}</span>
                          </td>
                          <td className="td-stat">{time.j}</td>
                          <td className="td-stat stat-win">{time.v}</td>
                          <td className="td-stat">{time.e}</td>
                          <td className="td-stat">{time.d}</td>
                          <td className="td-stat">
                            <span className={`sg-badge ${sgClass}`}>
                              {sgFormatted}
                            </span>
                          </td>
                        </tr>

                        {/* GAVETA DE PARTIDAS (DROPDOWN) */}
                        {isExpanded && (
                          <tr className="expanded-matches-row">
                            <td colSpan="7" className="expanded-cell">
                              <div className="matches-dropdown">
                                <div className="dropdown-header">
                                  <span className="dropdown-title">
                                    ⚽ Confrontos Diretos —{" "}
                                    <strong>{time.nome}</strong>
                                  </span>
                                  <span className="dropdown-badge">
                                    Grupo {grupo}
                                  </span>
                                </div>

                                <div className="matches-list-grid">
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

            {/* RODAPÉ COM LEGENDA DA TABELA */}
            <div className="camp-group-footer">
              <div className="legend-item">
                <span className="legend-dot qualified-dot"></span>
                <span>Zona de Classificação (Top {qtdClassificados})</span>
              </div>
              <div className="legend-cols">
                <span>PTS: Pontos</span>
                <span>J: Jogos</span>
                <span>SG: Saldo</span>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
