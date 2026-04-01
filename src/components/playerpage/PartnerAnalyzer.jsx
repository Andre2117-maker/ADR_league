import React, { useState, useMemo } from "react";
import "../../styles/Playerpage/partneranalyzer.css";

const PartnerAnalyzer = ({ currentPlayer, allPlayers, matches }) => {
  const [partnerId, setPartnerId] = useState("");

  const otherPlayers = allPlayers.filter(
    (p) => String(p.id) !== String(currentPlayer.id),
  );

  const partner = useMemo(
    () => allPlayers.find((p) => String(p.id) === String(partnerId)),
    [partnerId, allPlayers],
  );

  const stats = useMemo(() => {
    if (!partner) return null;

    const allCommonMatches = matches.filter((m) => {
      const p1 = String(currentPlayer.id);
      const p2 = String(partnerId);
      return (
        (m.teamA.players.map(String).includes(p1) ||
          m.teamB.players.map(String).includes(p1)) &&
        (m.teamA.players.map(String).includes(p2) ||
          m.teamB.players.map(String).includes(p2))
      );
    });

    const sameTeamMatches = [];
    const opponentMatches = [];

    allCommonMatches.forEach((m) => {
      const p1 = String(currentPlayer.id);
      const p2 = String(partnerId);
      const p1InA = m.teamA.players.map(String).includes(p1);
      const p2InA = m.teamA.players.map(String).includes(p2);

      if (p1InA === p2InA) sameTeamMatches.push(m);
      else opponentMatches.push(m);
    });

    let partnerWins = 0;
    let duoGoals = 0;

    sameTeamMatches.forEach((m) => {
      const isTeamA = m.teamA.players
        .map(String)
        .includes(String(currentPlayer.id));
      const scoreA =
        m.events?.filter(
          (e) =>
            (e.type === "GOAL" && e.team === "A") ||
            (e.type === "OWN_GOAL" && e.team === "B"),
        ).length || 0;
      const scoreB =
        m.events?.filter(
          (e) =>
            (e.type === "GOAL" && e.team === "B") ||
            (e.type === "OWN_GOAL" && e.team === "A"),
        ).length || 0;

      if ((isTeamA && scoreA > scoreB) || (!isTeamA && scoreB > scoreA))
        partnerWins++;

      const assistEvents = m.events?.filter(
        (e) =>
          e.type === "GOAL" &&
          ((String(e.playerId) === String(currentPlayer.id) &&
            String(e.assistId) === String(partnerId)) ||
            (String(e.playerId) === String(partnerId) &&
              String(e.assistId) === String(currentPlayer.id))),
      );
      duoGoals += assistEvents?.length || 0;
    });

    let winsAgainst = 0;
    opponentMatches.forEach((m) => {
      const isTeamA = m.teamA.players
        .map(String)
        .includes(String(currentPlayer.id));
      const scoreA =
        m.events?.filter(
          (e) =>
            (e.type === "GOAL" && e.team === "A") ||
            (e.type === "OWN_GOAL" && e.team === "B"),
        ).length || 0;
      const scoreB =
        m.events?.filter(
          (e) =>
            (e.type === "GOAL" && e.team === "B") ||
            (e.type === "OWN_GOAL" && e.team === "A"),
        ).length || 0;

      if ((isTeamA && scoreA > scoreB) || (!isTeamA && scoreB > scoreA))
        winsAgainst++;
    });

    const winRate =
      sameTeamMatches.length > 0
        ? ((partnerWins / sameTeamMatches.length) * 100).toFixed(0)
        : 0;

    return {
      totalTogether: sameTeamMatches.length,
      totalAgainst: opponentMatches.length,
      partnerWins,
      winsAgainst,
      duoGoals,
      winRate,
    };
  }, [partner, matches, currentPlayer.id, partnerId]);

  return (
    <div className="ppg-card partner-card">
      <h3 className="ppg-card-title">🤝 Analisador de Parceria</h3>

      <div className="partner-selector">
        <select
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
        >
          <option value="">Selecione um parceiro...</option>
          {otherPlayers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {stats ? (
        <div className="partner-results-wrapper">
          {/* SEÇÃO 1: PARCERIA (MESMO TIME) */}
          <div className="partner-section">
            <h4 className="partner-section-title">🤝 NA MESMA EQUIPE</h4>
            <div className="partner-grid-row">
              <div className="partner-stat-box">
                <span className="p-stat-val">{stats.totalTogether}</span>
                <span className="p-stat-label">Jogos Juntos</span>
              </div>
              <div className="partner-stat-box highlight">
                <span className="p-stat-val">{stats.winRate}%</span>
                <span className="p-stat-label">Aproveitamento</span>
              </div>
              <div className="partner-stat-box">
                <span className="p-stat-val">{stats.duoGoals}</span>
                <span className="p-stat-label">Gols em Conjunto</span>
              </div>
            </div>

            <div className="partner-verdict">
              {stats.winRate >= 70
                ? "🔥 DUPLA DINÂMICA"
                : stats.winRate >= 45
                  ? "✅ BOA QUÍMICA"
                  : "⚠️ PRECISAM TREINAR JUNTOS"}
            </div>
          </div>

          {/* DIVISÓRIA ESTILIZADA */}
          <div className="partner-divider">
            <span>VS</span>
          </div>

          {/* SEÇÃO 2: RIVALIDADE (TIMES OPOSTOS) */}
          <div className="partner-section">
            <h4 className="partner-section-title">⚔️ CONFRONTO DIRETO</h4>
            <div className="partner-grid-row">
              <div className="partner-stat-box">
                <span className="p-stat-val">{stats.totalAgainst}</span>
                <span className="p-stat-label">Vezes Rivais</span>
              </div>
              <div className="partner-stat-box rivalry">
                <span className="p-stat-val">{stats.winsAgainst}</span>
                <span className="p-stat-label">Vitórias MINHAS</span>
              </div>
              <div className="partner-stat-box rivalry">
                <span className="p-stat-val">
                  {stats.totalAgainst - stats.winsAgainst}
                </span>
                <span className="p-stat-label">Vitórias dele</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="partner-empty">
          Selecione um atleta para analisar a química e o histórico de
          confrontos.
        </p>
      )}
    </div>
  );
};

export default PartnerAnalyzer;
