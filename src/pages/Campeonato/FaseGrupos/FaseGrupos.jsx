import React, { useEffect, useMemo, useState } from "react";
import MatchRowEditor from "../MatchRowEditor/MatchRowEditor";
import "./FaseGrupos.css";

const formatStat = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const formatSaldo = (value) => {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number) || number === 0) return "0";

  return number > 0 ? `+${number}` : String(number);
};

export default function FaseGrupos({
  tabelaGrupos,
  qtdClassificados = 0,
  selectedYear,
  partidas = [],
  loadData,
  isAdmin = false,
}) {
  const [expandedRow, setExpandedRow] = useState(null);

  // Mantém a ordem de classificação recebida do sistema.
  // Apenas organiza alfabeticamente os nomes dos grupos.
  const grupos = useMemo(() => {
    if (!tabelaGrupos || typeof tabelaGrupos !== "object") {
      return [];
    }

    return Object.keys(tabelaGrupos).sort((a, b) =>
      a.localeCompare(b, "pt-BR", {
        numeric: true,
        sensitivity: "base",
      }),
    );
  }, [tabelaGrupos]);

  const limiteClassificacao = Math.max(
    0,
    Math.floor(Number(qtdClassificados) || 0),
  );

  const toggleRow = (rowId) => {
    setExpandedRow((current) => (current === rowId ? null : rowId));
  };

  // Fecha a gaveta caso a equipe aberta deixe de existir.
  useEffect(() => {
    if (!expandedRow) return;

    const equipeExiste = grupos.some((grupo) => {
      const equipes = Array.isArray(tabelaGrupos?.[grupo])
        ? tabelaGrupos[grupo]
        : [];

      return equipes.some((time) => {
        const nome = String(time?.nome ?? "").trim();

        return `${selectedYear}_${grupo}_${nome}` === expandedRow;
      });
    });

    if (!equipeExiste) {
      setExpandedRow(null);
    }
  }, [expandedRow, grupos, selectedYear, tabelaGrupos]);

  // Estado vazio
  if (grupos.length === 0) {
    return (
      <div className="camp-empty-state" role="status">
        <div className="empty-icon" aria-hidden="true">
          🏆
        </div>

        <span className="empty-eyebrow">COMPETIÇÃO</span>

        <h2>Nenhuma tabela configurada para {selectedYear}</h2>

        <p>
          {isAdmin
            ? "Acesse a aba Configurar para criar os grupos e adicionar as equipes desta edição."
            : "Os grupos desta temporada ainda estão sendo definidos pela organização."}
        </p>
      </div>
    );
  }

  return (
    <div className="camp-groups-layout">
      {grupos.map((grupo) => {
        const equipes = Array.isArray(tabelaGrupos?.[grupo])
          ? tabelaGrupos[grupo]
          : [];

        return (
          <section
            key={`${selectedYear}-${grupo}`}
            className="camp-group-card"
            aria-labelledby={`camp-group-${selectedYear}-${grupo}`}
          >
            {/* CABEÇALHO */}
            <header className="camp-group-header">
              <div className="group-title-wrapper">
                <span className="group-tag">FASE DE CLASSIFICAÇÃO</span>

                <h2
                  className="camp-group-title"
                  id={`camp-group-${selectedYear}-${grupo}`}
                >
                  GRUPO {grupo}
                </h2>
              </div>

              <span className="group-click-hint">
                {isAdmin
                  ? "Selecione uma equipe para editar"
                  : "Selecione uma equipe para ver os jogos"}
              </span>
            </header>

            {/* TABELA */}
            <div
              className="camp-table-scroll"
              role="region"
              aria-label={`Classificação do Grupo ${grupo}`}
              tabIndex={0}
            >
              <table className="camp-table">
                <thead>
                  <tr>
                    <th className="th-team" scope="col">
                      EQUIPE
                    </th>

                    <th scope="col" title="Pontos">
                      PTS
                    </th>
                    <th scope="col" title="Jogos">
                      J
                    </th>
                    <th scope="col" title="Vitórias">
                      V
                    </th>
                    <th scope="col" title="Empates">
                      E
                    </th>
                    <th scope="col" title="Derrotas">
                      D
                    </th>
                    <th scope="col" title="Saldo de gols">
                      SG
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {equipes.length === 0 ? (
                    <tr className="camp-empty-row">
                      <td colSpan={7}>
                        Nenhuma equipe cadastrada neste grupo.
                      </td>
                    </tr>
                  ) : (
                    equipes.map((time, idx) => {
                      const nome =
                        String(time?.nome ?? "").trim() || "Equipe sem nome";

                      const rowId = `${selectedYear}_${grupo}_${nome}`;

                      const isExpanded = expandedRow === rowId;

                      const isQualified = idx < limiteClassificacao;

                      const saldo = Number(time?.sg ?? 0);

                      const saldoClass =
                        !Number.isFinite(saldo) || saldo === 0
                          ? "sg-zero"
                          : saldo > 0
                            ? "sg-pos"
                            : "sg-neg";

                      const confrontos = equipes.filter(
                        (oponente) =>
                          String(oponente?.nome ?? "").trim() !== nome,
                      );

                      return (
                        <React.Fragment key={rowId}>
                          <tr
                            className={[
                              "camp-tr",
                              isQualified ? "is-qualified" : "",
                              isExpanded ? "is-expanded" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <td className="td-team">
                              <button
                                type="button"
                                className="team-toggle"
                                onClick={() => toggleRow(rowId)}
                                aria-expanded={isExpanded}
                                aria-controls={`matches-${encodeURIComponent(rowId)}`}
                                title={
                                  isExpanded
                                    ? `Ocultar confrontos de ${nome}`
                                    : `Ver confrontos de ${nome}`
                                }
                              >
                                <span
                                  className={`expand-chevron ${
                                    isExpanded ? "open" : ""
                                  }`}
                                  aria-hidden="true"
                                >
                                  ❯
                                </span>

                                <span className="pos-badge">{idx + 1}</span>

                                <span className="team-name-text" title={nome}>
                                  {nome}
                                </span>
                              </button>
                            </td>

                            <td className="td-pts">
                              <span className="pts-pill">
                                {formatStat(time?.pts)}
                              </span>
                            </td>

                            <td className="td-stat">{formatStat(time?.j)}</td>

                            <td className="td-stat stat-win">
                              {formatStat(time?.v)}
                            </td>

                            <td className="td-stat">{formatStat(time?.e)}</td>

                            <td className="td-stat">{formatStat(time?.d)}</td>

                            <td className="td-stat">
                              <span className={`sg-badge ${saldoClass}`}>
                                {formatSaldo(time?.sg)}
                              </span>
                            </td>
                          </tr>

                          {/* CONFRONTOS EXPANDIDOS */}
                          {isExpanded && (
                            <tr className="expanded-matches-row">
                              <td
                                colSpan={7}
                                className="expanded-cell"
                                id={`matches-${encodeURIComponent(rowId)}`}
                              >
                                <div className="matches-dropdown">
                                  <div className="dropdown-header">
                                    <div className="dropdown-heading">
                                      <span className="dropdown-kicker">
                                        CONFRONTOS DIRETOS
                                      </span>

                                      <span className="dropdown-title">
                                        {nome}
                                      </span>
                                    </div>

                                    <span className="dropdown-badge">
                                      GRUPO {grupo}
                                    </span>
                                  </div>

                                  {confrontos.length > 0 ? (
                                    <div className="matches-list-grid">
                                      {confrontos.map((oponente) => (
                                        <div
                                          key={`${rowId}-${oponente.nome}`}
                                          className="camp-match-item"
                                        >
                                          <MatchRowEditor
                                            ano={selectedYear}
                                            grupo={grupo}
                                            timeA={nome}
                                            timeB={oponente.nome}
                                            partidas={partidas}
                                            reloadData={loadData}
                                            isAdmin={isAdmin}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="no-matches-message">
                                      Não há outros times neste grupo para gerar
                                      confrontos.
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* RODAPÉ */}
            <footer className="camp-group-footer">
              <div className="legend-item">
                <span className="legend-dot qualified-dot" aria-hidden="true" />

                <span>
                  Zona de classificação{" "}
                  <strong>({limiteClassificacao} primeiros)</strong>
                </span>
              </div>

              <div
                className="legend-cols"
                aria-label="Legenda das estatísticas"
              >
                <span>
                  <strong>PTS</strong> Pontos
                </span>
                <span>
                  <strong>J</strong> Jogos
                </span>
                <span>
                  <strong>SG</strong> Saldo
                </span>
              </div>
            </footer>
          </section>
        );
      })}
    </div>
  );
}
