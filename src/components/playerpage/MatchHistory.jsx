import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import LogoADR from "../../assets/logo.png";
import "../../styles/Playerpage/matchHistory.css";

// Função oficial de resultado d'O ADR (Garante ZERO empate em TREINO)
export const resolveADRMatchOutcome = (m, isTeamA) => {
  const mType = String(m.type || "TREINO").toUpperCase();
  const isTreino = mType === "TREINO";

  const sA =
    m.events?.filter(
      (e) =>
        (e.team === "A" && e.type === "GOAL") ||
        (e.team === "B" && e.type === "OWN_GOAL"),
    ).length || 0;

  const sB =
    m.events?.filter(
      (e) =>
        (e.team === "B" && e.type === "GOAL") ||
        (e.team === "A" && e.type === "OWN_GOAL"),
    ).length || 0;

  // Extrai placar de pênaltis (sistema novo ou antigo)
  const newPensA =
    m.penalties?.A?.length > 0
      ? m.penalties.A.filter((p) => p.result === "goal").length
      : null;
  const newPensB =
    m.penalties?.B?.length > 0
      ? m.penalties.B.filter((p) => p.result === "goal").length
      : null;

  const oldPensA =
    m.penaltiesScoreA !== undefined && m.penaltiesScoreA !== ""
      ? Number(m.penaltiesScoreA)
      : null;
  const oldPensB =
    m.penaltiesScoreB !== undefined && m.penaltiesScoreB !== ""
      ? Number(m.penaltiesScoreB)
      : null;

  const pensA = newPensA !== null ? newPensA : oldPensA;
  const pensB = newPensB !== null ? newPensB : oldPensB;
  const hasPenaltiesScore =
    pensA !== null && pensB !== null && (pensA > 0 || pensB > 0 || sA === sB);

  let result = "draw";
  let decidedBy = "NORMAL"; // "NORMAL" | "GOLDEN_GOAL" | "PENALTIES"

  // 1. Gol de Ouro
  if (m.goldenGoalWinner) {
    const teamAWonGG = String(m.goldenGoalWinner).toUpperCase() === "A";
    result =
      (teamAWonGG && isTeamA) || (!teamAWonGG && !isTeamA) ? "win" : "loss";
    decidedBy = "GOLDEN_GOAL";
  }
  // 2. Vitória no Tempo Normal
  else if (sA > sB) {
    result = isTeamA ? "win" : "loss";
  } else if (sB > sA) {
    result = !isTeamA ? "win" : "loss";
  }
  // 3. Empate no Tempo Normal -> Decide nos Pênaltis
  else {
    const pA = pensA ?? 0;
    const pB = pensB ?? 0;

    if (pA !== pB) {
      const teamAWonPens = pA > pB;
      result =
        (teamAWonPens && isTeamA) || (!teamAWonPens && !isTeamA)
          ? "win"
          : "loss";
      decidedBy = "PENALTIES";
    } else if (m.penaltiesWinner || m.winner) {
      const wRaw = String(m.penaltiesWinner || m.winner)
        .trim()
        .toUpperCase();
      const teamAWon =
        wRaw === "A" ||
        wRaw === "TEAMA" ||
        wRaw === "TEAM_A" ||
        wRaw === "TIME A" ||
        (m.teamA?.name && wRaw === String(m.teamA.name).trim().toUpperCase());

      result =
        (teamAWon && isTeamA) || (!teamAWon && !isTeamA) ? "win" : "loss";
      decidedBy = "PENALTIES";
    } else if (isTreino) {
      // Trava de segurança: Nunca permite "draw" em TREINO
      result = isTeamA ? "win" : "loss";
      decidedBy = "PENALTIES";
    }
  }

  return {
    result,
    sA,
    sB,
    pensA: pensA ?? 0,
    pensB: pensB ?? 0,
    decidedBy,
    hasPenaltiesScore:
      decidedBy === "PENALTIES" && pensA !== null && pensB !== null,
  };
};

const MatchHistory = ({ matches = [], player }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("TREINO");

  const formatDate = (dateStr) => {
    if (!dateStr) return "S/D";
    if (dateStr.includes("/")) return dateStr.substring(0, 5);
    const [, month, day] = dateStr.split("T")[0].split("-");
    return `${day}/${month}`;
  };

  // Contadores de partidas por aba para este jogador
  const tabCounts = useMemo(() => {
    const counts = { TREINO: 0, AMISTOSO: 0, CAMPEONATO: 0 };
    matches.forEach((m) => {
      const t = (m.type || "TREINO").toUpperCase();
      if (counts[t] !== undefined) counts[t]++;
    });
    return counts;
  }, [matches]);

  const sortedMatches = useMemo(() => {
    const filtered = matches.filter(
      (m) => (m.type || "TREINO").toUpperCase() === activeTab,
    );
    return [...filtered].sort((a, b) => (b.order || 0) - (a.order || 0));
  }, [matches, activeTab]);

  return (
    <div className="adr-history-container">
      {/* CABEÇALHO & ABAS */}
      <div className="adr-history-header">
        <div className="adr-history-title-group">
          <span className="adr-history-kicker">REGISTRO DE PARTIDAS</span>
          <h3 className="adr-history-title">Histórico de Jogos</h3>
        </div>

        <div className="adr-history-tabs">
          <button
            type="button"
            className={`adr-tab-btn ${activeTab === "TREINO" ? "active" : ""}`}
            onClick={() => setActiveTab("TREINO")}
          >
            <span>Treinos</span>
            <span className="adr-tab-count">{tabCounts.TREINO}</span>
          </button>

          <button
            type="button"
            className={`adr-tab-btn ${activeTab === "AMISTOSO" ? "active" : ""}`}
            onClick={() => setActiveTab("AMISTOSO")}
          >
            <span>Amistosos</span>
            <span className="adr-tab-count">{tabCounts.AMISTOSO}</span>
          </button>

          <button
            type="button"
            className={`adr-tab-btn ${
              activeTab === "CAMPEONATO" ? "active" : ""
            }`}
            onClick={() => setActiveTab("CAMPEONATO")}
          >
            <span>Campeonatos</span>
            <span className="adr-tab-count">{tabCounts.CAMPEONATO}</span>
          </button>
        </div>
      </div>

      {/* LISTA DE PARTIDAS */}
      <div className="adr-history-list">
        {sortedMatches.length > 0 ? (
          sortedMatches.map((m) => {
            const pIdStr = String(player?.id);
            const isTeamA = m.teamA?.players?.some(
              (id) => String(id) === pIdStr,
            );

            const {
              result,
              sA,
              sB,
              pensA,
              pensB,
              decidedBy,
              hasPenaltiesScore,
            } = resolveADRMatchOutcome(m, isTeamA);

            // Scouts do jogador na partida
            const pG =
              m.events?.filter(
                (e) => String(e.playerId) === pIdStr && e.type === "GOAL",
              ).length || 0;

            const pA =
              m.events?.filter(
                (e) =>
                  (e.type === "GOAL" && String(e.assistId) === pIdStr) ||
                  (e.type === "ASSIST" && String(e.playerId) === pIdStr),
              ).length || 0;

            const pY =
              m.events?.filter(
                (e) =>
                  String(e.playerId) === pIdStr &&
                  (e.type === "YELLOW" || e.type === "YELLOW_CARD"),
              ).length || 0;

            const pR =
              m.events?.filter(
                (e) =>
                  String(e.playerId) === pIdStr &&
                  (e.type === "RED" || e.type === "RED_CARD"),
              ).length || 0;

            const isGoalkeeper =
              String(m.teamA?.goalkeeperId) === pIdStr ||
              String(m.teamB?.goalkeeperId) === pIdStr;

            const teamConceded = isTeamA ? sB : sA;
            const isCleanSheet = isGoalkeeper && teamConceded === 0;

            return (
              <div
                key={m.id}
                className={`adr-match-card result-${result}`}
                onClick={() => navigate(`/match/${m.id}`)}
              >
                {/* COLUNA ESQUERDA: RESULTADO (V/D/E) + DATA */}
                <div className="adr-match-info">
                  <div className={`adr-status-indicator ${result}`}>
                    {result === "win" ? "V" : result === "loss" ? "D" : "E"}
                  </div>
                  <span className="adr-match-date">{formatDate(m.date)}</span>
                </div>

                {/* COLUNA CENTRAL: CONFRONTO E PLACAR */}
                <div className="adr-match-main">
                  <span
                    className={`adr-team-name team-a ${
                      isTeamA ? "highlight" : ""
                    }`}
                    title={m.teamA?.name}
                  >
                    {m.teamA?.name}
                  </span>

                  <div className="adr-score-wrapper">
                    <img
                      src={m.teamA?.logo || LogoADR}
                      alt="Logo A"
                      className="adr-history-logo"
                    />

                    <div className="adr-score-box-stack">
                      <div className="adr-match-score">
                        <span
                          className={`score-num ${
                            isTeamA ? "my-team-score" : ""
                          }`}
                        >
                          {sA}
                        </span>
                        <span className="score-divider">:</span>
                        <span
                          className={`score-num ${
                            !isTeamA ? "my-team-score" : ""
                          }`}
                        >
                          {sB}
                        </span>
                      </div>

                      {/* Sub-placar quando decidido nos Pênaltis */}
                      {decidedBy === "PENALTIES" && (
                        <span className="adr-pens-sub">
                          {hasPenaltiesScore
                            ? `(${pensA} : ${pensB} Pên)`
                            : "Pênaltis"}
                        </span>
                      )}
                    </div>

                    <img
                      src={m.teamB?.logo || LogoADR}
                      alt="Logo B"
                      className="adr-history-logo"
                    />
                  </div>

                  <span
                    className={`adr-team-name team-b ${
                      !isTeamA ? "highlight" : ""
                    }`}
                    title={m.teamB?.name}
                  >
                    {m.teamB?.name}
                  </span>
                </div>

                {/* COLUNA DIREITA: BADGES DE DESEMPENHO INDIVIDUAL */}
                <div className="adr-match-player-stats">
                  <div className="stats-badges">
                    {decidedBy === "GOLDEN_GOAL" && (
                      <span
                        className="badge-tag badge-golden"
                        title="Decidido no Gol de Ouro"
                      >
                        ⚡ Ouro
                      </span>
                    )}
                    {pG > 0 && (
                      <span className="badge-tag badge-goal">⚽ +{pG}</span>
                    )}
                    {pA > 0 && (
                      <span className="badge-tag badge-assist">👟 +{pA}</span>
                    )}
                    {isGoalkeeper && (
                      <span className="badge-tag badge-gk">🧤 GK</span>
                    )}
                    {isCleanSheet && (
                      <span
                        className="badge-tag badge-cs"
                        title="Clean Sheet (Sem sofrer gols)"
                      >
                        🛡️ SG
                      </span>
                    )}
                    {pY > 0 && (
                      <span className="badge-tag badge-yellow">🟨 {pY}</span>
                    )}
                    {pR > 0 && (
                      <span className="badge-tag badge-red">🟥 {pR}</span>
                    )}
                  </div>
                  <span className="adr-match-chevron">❯</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="adr-empty-history">
            Nenhuma partida registrada nesta categoria.
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistory;
