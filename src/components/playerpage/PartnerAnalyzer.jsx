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

    const p1Id = String(currentPlayer.id);
    const p2Id = String(partnerId);

    // 1. Filtrar partidas em comum (Garantindo que players existe)
    const allCommonMatches = matches.filter((m) => {
      const playersA = m.teamA?.players?.map(String) || [];
      const playersB = m.teamB?.players?.map(String) || [];
      const p1InMatch = playersA.includes(p1Id) || playersB.includes(p1Id);
      const p2InMatch = playersA.includes(p2Id) || playersB.includes(p2Id);
      return p1InMatch && p2InMatch;
    });

    const sameTeamMatches = [];
    const opponentMatches = [];

    // 2. Separar Aliados de Rivais
    allCommonMatches.forEach((m) => {
      const p1InA = m.teamA?.players?.map(String).includes(p1Id);
      const p2InA = m.teamA?.players?.map(String).includes(p2Id);
      if (p1InA === p2InA) sameTeamMatches.push(m);
      else opponentMatches.push(m);
    });

    let partnerWins = 0;
    let duoGoals = 0;
    let winsAgainst = 0;
    let lossesAgainst = 0;

    // --- PROCESSAR PARCERIA ---
    sameTeamMatches.forEach((m) => {
      const p1InA = m.teamA?.players?.map(String).includes(p1Id);
      const gA = Number(m.goalsA || 0);
      const gB = Number(m.goalsB || 0);

      let winnerSide = "";
      if (gA > gB) winnerSide = "A";
      else if (gB > gA) winnerSide = "B";
      else winnerSide = m.penaltiesWinner; // "A" ou "B" do seu banco

      if ((p1InA && winnerSide === "A") || (!p1InA && winnerSide === "B")) {
        partnerWins++;
      }

      const assistEvents = m.events?.filter(
        (e) =>
          e.type === "GOAL" &&
          ((String(e.playerId) === p1Id && String(e.assistId) === p2Id) ||
            (String(e.playerId) === p2Id && String(e.assistId) === p1Id)),
      );
      duoGoals += assistEvents?.length || 0;
    });

    // --- PROCESSAR RIVALIDADE ---
    opponentMatches.forEach((m) => {
      const p1InA = m.teamA?.players?.map(String).includes(p1Id);
      const gA = Number(m.goalsA || 0);
      const gB = Number(m.goalsB || 0);

      let winnerSide = "";
      if (gA > gB) winnerSide = "A";
      else if (gB > gA) winnerSide = "B";
      else winnerSide = m.penaltiesWinner;

      // Se mesmo com penaltiesWinner for vazio, não deixa 0-0 (usa quem fez mais gols ou assume B)
      if (!winnerSide) winnerSide = gA > gB ? "A" : "B";

      if (winnerSide === "A") {
        p1InA ? winsAgainst++ : lossesAgainst++;
      } else {
        !p1InA ? winsAgainst++ : lossesAgainst++;
      }
    });

    const winRate =
      sameTeamMatches.length > 0
        ? ((partnerWins / sameTeamMatches.length) * 100).toFixed(0)
        : 0;

    return {
      totalTogether: sameTeamMatches.length,
      totalAgainst: opponentMatches.length,
      winsAgainst,
      lossesAgainst,
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

          <div className="partner-divider">
            <span>VS</span>
          </div>

          <div className="partner-section">
            <h4 className="partner-section-title">⚔️ CONFRONTO DIRETO</h4>
            <div className="partner-grid-row">
              <div className="partner-stat-box">
                <span className="p-stat-val">{stats.totalAgainst}</span>
                <span className="p-stat-label">Vezes Rivais</span>
              </div>
              <div className="partner-stat-box rivalry">
                <span className="p-stat-val">{stats.winsAgainst}</span>
                <span className="p-stat-label">Minhas Vitórias</span>
              </div>
              <div className="partner-stat-box rivalry">
                <span className="p-stat-val">{stats.lossesAgainst}</span>
                <span className="p-stat-label">Vitórias dele</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="partner-empty">
          Selecione um atleta para analisar a química.
        </p>
      )}
    </div>
  );
};

export default PartnerAnalyzer;
