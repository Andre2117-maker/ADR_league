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

    const p1Id = String(currentPlayer.id).trim();
    const p2Id = String(partnerId).trim();

    // 1. Filtrar partidas em comum
    const allCommonMatches = matches.filter((m) => {
      const playersA = m.teamA?.players?.map((p) => String(p).trim()) || [];
      const playersB = m.teamB?.players?.map((p) => String(p).trim()) || [];
      return (
        (playersA.includes(p1Id) || playersB.includes(p1Id)) &&
        (playersA.includes(p2Id) || playersB.includes(p2Id))
      );
    });

    const sameTeamMatches = [];
    const opponentMatches = [];

    allCommonMatches.forEach((m) => {
      const p1InA = m.teamA?.players
        ?.map((p) => String(p).trim())
        .includes(p1Id);
      const p2InA = m.teamA?.players
        ?.map((p) => String(p).trim())
        .includes(p2Id);
      if (p1InA === p2InA) sameTeamMatches.push(m);
      else opponentMatches.push(m);
    });

    let partnerWins = 0;
    let duoGoals = 0;
    let winsAgainst = 0;
    let lossesAgainst = 0;

    // --- FUNÇÃO DE VITÓRIA HÍBRIDA (ANTIGAS + NOVAS) ---
    const getWinner = (m) => {
      // 1. Tenta por Gols (Events) - Mais preciso nas novas
      const gA =
        m.events?.filter(
          (e) =>
            (e.type === "GOAL" && e.team === "A") ||
            (e.type === "OWN_GOAL" && e.team === "B"),
        ).length || 0;
      const gB =
        m.events?.filter(
          (e) =>
            (e.type === "GOAL" && e.team === "B") ||
            (e.type === "OWN_GOAL" && e.team === "A"),
        ).length || 0;

      if (gA > gB) return "A";
      if (gB > gA) return "B";

      // 2. Se empatou em gols, tenta o penaltiesWinner (novas)
      if (m.penaltiesWinner) return m.penaltiesWinner;

      // 3. FALLBACK PARA ANTIGAS: Se não tem nada acima, olha o saldo do goleiro
      // (Se o goleiro do B tomou mais gols, o A ganhou)
      const gaA = Number(m.teamA?.goalkeeperGoalsAgainst || 0);
      const gaB = Number(m.teamB?.goalkeeperGoalsAgainst || 0);
      if (gaB > gaA) return "A";
      if (gaA > gaB) return "B";

      return null;
    };

    // Processar Aliados
    sameTeamMatches.forEach((m) => {
      const p1InA = m.teamA?.players
        ?.map((p) => String(p).trim())
        .includes(p1Id);
      const winner = getWinner(m);
      if ((p1InA && winner === "A") || (!p1InA && winner === "B"))
        partnerWins++;

      const assists = m.events?.filter(
        (e) =>
          e.type === "GOAL" &&
          ((String(e.playerId).trim() === p1Id &&
            String(e.assistId).trim() === p2Id) ||
            (String(e.playerId).trim() === p2Id &&
              String(e.assistId).trim() === p1Id)),
      );
      duoGoals += assists?.length || 0;
    });

    // Processar Rivais
    opponentMatches.forEach((m) => {
      const p1InA = m.teamA?.players
        ?.map((p) => String(p).trim())
        .includes(p1Id);
      const winner = getWinner(m);
      if (winner === "A") {
        p1InA ? winsAgainst++ : lossesAgainst++;
      } else if (winner === "B") {
        !p1InA ? winsAgainst++ : lossesAgainst++;
      }
    });

    const winRate =
      sameTeamMatches.length > 0
        ? Math.round((partnerWins / sameTeamMatches.length) * 100)
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
