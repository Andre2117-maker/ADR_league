import React, { useState, useMemo } from "react";
import "../styles/Campeonato/campeonato.css";
import LogoADR from "../assets/logo.png";
import {
  faseGrupos2023,
  bracket2023,
  bracketMockGenerico,
} from "../data/ed2023";

export default function Campeonato({ matches = [], players = [] }) {
  // 1. EXTRAIR OS ANOS DISPONÍVEIS
  const anosDisponiveis = useMemo(() => {
    const years = new Set(["2023"]);

    if (matches && Array.isArray(matches)) {
      matches.forEach((m) => {
        if ((m.type || "").toUpperCase() === "CAMPEONATO" && m.date) {
          const year = m.date.substring(0, 4);
          years.add(year);
        }
      });
    }

    return Array.from(years).sort((a, b) => b - a);
  }, [matches]);

  const [selectedYear, setSelectedYear] = useState(
    anosDisponiveis[0] || "2026",
  );
  const [activeTab, setActiveTab] = useState("GRUPOS");

  const handleYearChange = (ano) => {
    setSelectedYear(ano);
  };

  // Função inteligente para descobrir o vencedor (Aceita "W", Placar e Pênaltis "1(3)")
  const checkWinner = (scoreA, scoreB) => {
    if (scoreA === "W") return true;
    if (scoreA === "-" || !scoreA) return false;

    // Lógica para pênaltis ex: "1(3)" vs "1(2)"
    if (String(scoreA).includes("(") && String(scoreB).includes("(")) {
      const penA = parseInt(String(scoreA).split("(")[1]);
      const penB = parseInt(String(scoreB).split("(")[1]);
      return penA > penB;
    }

    // Placar normal
    return parseInt(scoreA) > parseInt(scoreB);
  };

  return (
    <div className="camp-page-wrapper">
      <div className="camp-header">
        <img src={LogoADR} alt="Logo ADR" className="camp-logo" />
        <h1 className="camp-title">CAMPEONATOS DO ADR</h1>
      </div>

      {/* SELETOR DE ANO DINÂMICO */}
      <div className="camp-years-container">
        {anosDisponiveis.map((ano) => (
          <button
            key={ano}
            className={`camp-year-btn ${selectedYear === ano ? "active" : ""}`}
            onClick={() => handleYearChange(ano)}
          >
            Edição {ano}
          </button>
        ))}
      </div>

      {/* ABAS */}
      <div className="camp-tabs">
        <button
          className={`camp-tab-btn ${activeTab === "GRUPOS" ? "active" : ""}`}
          onClick={() => setActiveTab("GRUPOS")}
        >
          Fase de Grupos
        </button>
        <button
          className={`camp-tab-btn ${activeTab === "MATAMATA" ? "active" : ""}`}
          onClick={() => setActiveTab("MATAMATA")}
        >
          Mata-Mata (Bracket)
        </button>
      </div>

      <div className="camp-content-area">
        {/* ================= FASE DE GRUPOS ================= */}
        {activeTab === "GRUPOS" && (
          <div className="camp-groups-layout">
            {selectedYear === "2023" ? (
              Object.keys(faseGrupos2023).map((grupo) => (
                <div key={grupo} className="camp-group-table-wrapper">
                  <h2 className="camp-group-title">
                    Grupo {grupo} (Histórico 2023)
                  </h2>
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
                      {faseGrupos2023[grupo].map((time, idx) => (
                        <tr key={idx} className={idx < 3 ? "qualified" : ""}>
                          <td className="team-name">
                            <span className="pos">{idx + 1}</span> {time.nome}
                          </td>
                          <td className="bold highlight">{time.pts}</td>
                          <td>{time.j}</td>
                          <td>{time.v}</td>
                          <td>{time.e}</td>
                          <td>{time.d}</td>
                          <td>{time.sg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "0.8rem",
                      color: "#888",
                      marginTop: "15px",
                    }}
                  >
                    *Detalhes exatos perdidos nos registros antigos.
                  </p>
                </div>
              ))
            ) : (
              <div
                style={{ textAlign: "center", color: "#888", padding: "40px" }}
              >
                <h2>Grupos de {selectedYear} em construção...</h2>
                <p>
                  Assim que tivermos os dados do banco, eles aparecerão aqui.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= MATA-MATA (BRACKET DINÂMICO) ================= */}
        {activeTab === "MATAMATA" && (
          <div className="camp-bracket-container">
            {(() => {
              const currentBracket =
                selectedYear === "2023" ? bracket2023 : bracketMockGenerico;

              if (!currentBracket) return null;

              return (
                <>
                  {/* === OITAVAS DE FINAL === */}
                  {currentBracket.oitavas &&
                    currentBracket.oitavas.length > 0 && (
                      <>
                        <div className="bracket-column oitavas">
                          <h3 className="bracket-round-title">
                            Oitavas de Final
                          </h3>
                          <div className="bracket-matches-wrapper">
                            {currentBracket.oitavas.map((match) => (
                              <div key={match.id} className="bracket-match">
                                <div className="bracket-date">{match.date}</div>
                                <div
                                  className={`bracket-team ${checkWinner(match.score1, match.score2) ? "winner" : ""}`}
                                >
                                  <span>{match.team1}</span>
                                  <span className="bracket-score">
                                    {match.score1}
                                  </span>
                                </div>
                                <div
                                  className={`bracket-team ${checkWinner(match.score2, match.score1) ? "winner" : ""}`}
                                >
                                  <span>{match.team2}</span>
                                  <span className="bracket-score">
                                    {match.score2}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Conectores Oitavas -> Quartas (4 pares) */}
                        <div className="bracket-column-connectors">
                          <h3
                            className="bracket-round-title"
                            style={{ opacity: 0 }}
                          >
                            -
                          </h3>
                          <div className="bracket-matches-wrapper">
                            {[...Array(4)].map((_, i) => (
                              <div
                                key={i}
                                className="bracket-connector oitavas-to-quartas"
                              >
                                <div className="line top-line"></div>
                                <div className="line bottom-line"></div>
                                <div className="line center-line"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                  {/* === QUARTAS DE FINAL === */}
                  {currentBracket.quartas &&
                    currentBracket.quartas.length > 0 && (
                      <>
                        <div className="bracket-column quartas">
                          <h3 className="bracket-round-title">Quartas</h3>
                          <div className="bracket-matches-wrapper">
                            {currentBracket.quartas.map((match) => (
                              <div key={match.id} className="bracket-match">
                                <div className="bracket-date">{match.date}</div>
                                <div
                                  className={`bracket-team ${checkWinner(match.score1, match.score2) ? "winner" : ""}`}
                                >
                                  <span>{match.team1}</span>
                                  <span className="bracket-score">
                                    {match.score1}
                                  </span>
                                </div>
                                <div
                                  className={`bracket-team ${checkWinner(match.score2, match.score1) ? "winner" : ""}`}
                                >
                                  <span>{match.team2}</span>
                                  <span className="bracket-score">
                                    {match.score2}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Conectores Quartas -> Semis (2 pares) */}
                        <div className="bracket-column-connectors">
                          <h3
                            className="bracket-round-title"
                            style={{ opacity: 0 }}
                          >
                            -
                          </h3>
                          <div className="bracket-matches-wrapper">
                            {[...Array(2)].map((_, i) => (
                              <div
                                key={i}
                                className="bracket-connector quartas-to-semis"
                              >
                                <div className="line top-line"></div>
                                <div className="line bottom-line"></div>
                                <div className="line center-line"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                  {/* === SEMIFINAIS === */}
                  {currentBracket.semis && currentBracket.semis.length > 0 && (
                    <>
                      <div className="bracket-column semis">
                        <h3 className="bracket-round-title">Semifinais</h3>
                        <div className="bracket-matches-wrapper">
                          {currentBracket.semis.map((match) => (
                            <div key={match.id} className="bracket-match">
                              <div className="bracket-date">{match.date}</div>
                              <div
                                className={`bracket-team ${checkWinner(match.score1, match.score2) ? "winner" : ""}`}
                              >
                                <span>{match.team1}</span>
                                <span className="bracket-score">
                                  {match.score1}
                                </span>
                              </div>
                              <div
                                className={`bracket-team ${checkWinner(match.score2, match.score1) ? "winner" : ""}`}
                              >
                                <span>{match.team2}</span>
                                <span className="bracket-score">
                                  {match.score2}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conector Semis -> Final (1 par) */}
                      <div className="bracket-column-connectors">
                        <h3
                          className="bracket-round-title"
                          style={{ opacity: 0 }}
                        >
                          -
                        </h3>
                        <div className="bracket-matches-wrapper">
                          <div className="bracket-connector semis-to-final">
                            <div className="line top-line"></div>
                            <div className="line bottom-line"></div>
                            <div className="line center-line"></div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* === GRANDE FINAL === */}
                  {currentBracket.final && (
                    <>
                      <div className="bracket-column final">
                        <h3
                          className="bracket-round-title"
                          style={{ color: "#d4af37" }}
                        >
                          Grande Final
                        </h3>
                        <div className="bracket-matches-wrapper">
                          <div className="bracket-match gold-border">
                            <div className="bracket-date">
                              {currentBracket.final.date}
                            </div>
                            <div
                              className={`bracket-team ${checkWinner(currentBracket.final.score1, currentBracket.final.score2) ? "winner" : ""}`}
                            >
                              <span>{currentBracket.final.team1}</span>
                              <span className="bracket-score">
                                {currentBracket.final.score1}
                              </span>
                            </div>
                            <div
                              className={`bracket-team ${checkWinner(currentBracket.final.score2, currentBracket.final.score1) ? "winner" : ""}`}
                            >
                              <span>{currentBracket.final.team2}</span>
                              <span className="bracket-score">
                                {currentBracket.final.score2}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Conector Campeão */}
                      <div className="bracket-column-connectors">
                        <h3
                          className="bracket-round-title"
                          style={{ opacity: 0 }}
                        >
                          -
                        </h3>
                        <div className="bracket-matches-wrapper">
                          <div className="bracket-connector final-to-champ">
                            <div className="line center-line"></div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* === CAMPEÃO === */}
                  {currentBracket.campeao && (
                    <div className="bracket-column champion">
                      <h3
                        className="bracket-round-title"
                        style={{ color: "#d4af37" }}
                      >
                        Campeão
                      </h3>
                      <div className="bracket-matches-wrapper">
                        <div className="champion-box">
                          👑 {currentBracket.campeao}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
