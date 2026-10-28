import React, { useState, useMemo } from "react";
import "../../styles/Playerpage/partneranalyzer.css";

// Função blindada para descobrir o time vencedor ("A", "B" ou "D")
const getMatchWinner = (m) => {
  const mType = String(m.type || "TREINO").toUpperCase();
  const isTreino = mType === "TREINO";

  // 1. Gol de Ouro
  if (m.goldenGoalWinner) {
    return String(m.goldenGoalWinner).toUpperCase() === "A" ? "A" : "B";
  }

  // 2. Gols no tempo normal
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

  // 3. Pênaltis (sistema novo de array ou antigo numérico)
  const newPensA =
    m.penalties?.A?.length > 0
      ? m.penalties.A.filter((p) => p.result === "goal").length
      : null;
  const newPensB =
    m.penalties?.B?.length > 0
      ? m.penalties.B.filter((p) => p.result === "goal").length
      : null;

  const pensA = newPensA !== null ? newPensA : Number(m.penaltiesScoreA) || 0;
  const pensB = newPensB !== null ? newPensB : Number(m.penaltiesScoreB) || 0;

  if (pensA > pensB) return "A";
  if (pensB > pensA) return "B";

  if (m.penaltiesWinner || m.winner) {
    const wRaw = String(m.penaltiesWinner || m.winner)
      .trim()
      .toUpperCase();
    if (
      wRaw === "A" ||
      wRaw === "TEAMA" ||
      wRaw === "TEAM_A" ||
      wRaw === "TIME A"
    )
      return "A";
    if (
      wRaw === "B" ||
      wRaw === "TEAMB" ||
      wRaw === "TEAM_B" ||
      wRaw === "TIME B"
    )
      return "B";
  }

  // 4. Fallback para partidas antigas pelo saldo do goleiro
  const gaA = Number(m.teamA?.goalkeeperGoalsAgainst || 0);
  const gaB = Number(m.teamB?.goalkeeperGoalsAgainst || 0);
  if (gaB > gaA) return "A";
  if (gaA > gaB) return "B";

  return isTreino ? "A" : "D";
};

const PartnerAnalyzer = ({ currentPlayer, allPlayers = [], matches = [] }) => {
  const [partnerId, setPartnerId] = useState("");

  // Filtra e ordena os outros jogadores em ordem alfabética
  const otherPlayers = useMemo(() => {
    if (!currentPlayer) return [];
    return allPlayers
      .filter(
        (p) => String(p.id) !== String(currentPlayer.id) && !p.isAnonymous,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allPlayers, currentPlayer]);

  const partner = useMemo(
    () => allPlayers.find((p) => String(p.id) === String(partnerId)),
    [partnerId, allPlayers],
  );

  // =========================================================================
  // 1. RADAR AUTOMÁTICO: MELHOR PARCEIRO, MAIOR FREGUÊS E MAIOR CARRASCO
  // =========================================================================
  const autoHighlights = useMemo(() => {
    if (!currentPlayer || !matches.length || !otherPlayers.length) return null;
    const p1Id = String(currentPlayer.id).trim();

    let bestPartner = null;
    let biggestCustomer = null; // Freguês (mais vitórias contra)
    let biggestNemesis = null; // Carrasco (mais derrotas contra)

    otherPlayers.forEach((other) => {
      const p2Id = String(other.id).trim();
      let togetherGames = 0;
      let togetherWins = 0;
      let duoGoals = 0;
      let againstGames = 0;
      let winsAgainst = 0;
      let lossesAgainst = 0;

      matches.forEach((m) => {
        const playersA = m.teamA?.players?.map((id) => String(id).trim()) || [];
        const playersB = m.teamB?.players?.map((id) => String(id).trim()) || [];

        const p1InA = playersA.includes(p1Id);
        const p1InB = playersB.includes(p1Id);
        if (!p1InA && !p1InB) return;

        const p2InA = playersA.includes(p2Id);
        const p2InB = playersB.includes(p2Id);
        if (!p2InA && !p2InB) return;

        const winner = getMatchWinner(m);

        if (p1InA === p2InA) {
          togetherGames++;
          if ((p1InA && winner === "A") || (p1InB && winner === "B")) {
            togetherWins++;
          }
          const linked =
            m.events?.filter(
              (e) =>
                e.type === "GOAL" &&
                ((String(e.playerId).trim() === p1Id &&
                  String(e.assistId).trim() === p2Id) ||
                  (String(e.playerId).trim() === p2Id &&
                    String(e.assistId).trim() === p1Id)),
            ).length || 0;
          duoGoals += linked;
        } else {
          againstGames++;
          if ((p1InA && winner === "A") || (p1InB && winner === "B")) {
            winsAgainst++;
          } else if ((p1InA && winner === "B") || (p1InB && winner === "A")) {
            lossesAgainst++;
          }
        }
      });

      if (togetherGames >= 2) {
        const wr = Math.round((togetherWins / togetherGames) * 100);
        if (
          !bestPartner ||
          togetherWins > bestPartner.wins ||
          (togetherWins === bestPartner.wins && wr > bestPartner.winRate)
        ) {
          bestPartner = {
            player: other,
            wins: togetherWins,
            games: togetherGames,
            winRate: wr,
            duoGoals,
          };
        }
      }

      if (winsAgainst >= 1) {
        const diff = winsAgainst - lossesAgainst;
        if (
          !biggestCustomer ||
          winsAgainst > biggestCustomer.winsAgainst ||
          (winsAgainst === biggestCustomer.winsAgainst &&
            diff > biggestCustomer.diff)
        ) {
          biggestCustomer = {
            player: other,
            winsAgainst,
            lossesAgainst,
            games: againstGames,
            diff,
          };
        }
      }

      if (lossesAgainst >= 1) {
        const diff = lossesAgainst - winsAgainst;
        if (
          !biggestNemesis ||
          lossesAgainst > biggestNemesis.lossesAgainst ||
          (lossesAgainst === biggestNemesis.lossesAgainst &&
            diff > biggestNemesis.diff)
        ) {
          biggestNemesis = {
            player: other,
            lossesAgainst,
            winsAgainst,
            games: againstGames,
            diff,
          };
        }
      }
    });

    return { bestPartner, biggestCustomer, biggestNemesis };
  }, [currentPlayer, matches, otherPlayers]);

  // =========================================================================
  // 2. ESTATÍSTICAS DETALHADAS DO PARCEIRO SELECIONADO
  // =========================================================================
  const stats = useMemo(() => {
    if (!partner || !currentPlayer) return null;

    const p1Id = String(currentPlayer.id).trim();
    const p2Id = String(partnerId).trim();

    const sameTeamMatches = [];
    const opponentMatches = [];

    matches.forEach((m) => {
      const playersA = m.teamA?.players?.map((p) => String(p).trim()) || [];
      const playersB = m.teamB?.players?.map((p) => String(p).trim()) || [];

      const p1InA = playersA.includes(p1Id);
      const p1InB = playersB.includes(p1Id);
      if (!p1InA && !p1InB) return;

      const p2InA = playersA.includes(p2Id);
      const p2InB = playersB.includes(p2Id);
      if (!p2InA && !p2InB) return;

      if (p1InA === p2InA) sameTeamMatches.push(m);
      else opponentMatches.push(m);
    });

    let partnerWins = 0;
    let partnerLosses = 0;
    let p1AssistedP2 = 0; // Eu dei assistência para gol dele
    let p2AssistedP1 = 0; // Ele deu assistência para gol meu
    let winsAgainst = 0;
    let lossesAgainst = 0;
    let recentTogether = [];

    // Processar Aliados
    sameTeamMatches.forEach((m) => {
      const p1InA = m.teamA?.players
        ?.map((p) => String(p).trim())
        .includes(p1Id);
      const winner = getMatchWinner(m);
      const won = (p1InA && winner === "A") || (!p1InA && winner === "B");

      if (won) partnerWins++;
      else if (winner !== "D") partnerLosses++;

      recentTogether.push(won ? "W" : winner === "D" ? "D" : "L");

      m.events?.forEach((e) => {
        if (e.type === "GOAL") {
          const scorer = String(e.playerId).trim();
          const assister = String(e.assistId).trim();
          if (scorer === p2Id && assister === p1Id) p1AssistedP2++;
          if (scorer === p1Id && assister === p2Id) p2AssistedP1++;
        }
      });
    });

    // Processar Rivais
    opponentMatches.forEach((m) => {
      const p1InA = m.teamA?.players
        ?.map((p) => String(p).trim())
        .includes(p1Id);
      const winner = getMatchWinner(m);
      if (winner === "A") {
        p1InA ? winsAgainst++ : lossesAgainst++;
      } else if (winner === "B") {
        !p1InA ? winsAgainst++ : lossesAgainst++;
      }
    });

    const duoGoals = p1AssistedP2 + p2AssistedP1;
    const winRate =
      sameTeamMatches.length > 0
        ? Math.round((partnerWins / sameTeamMatches.length) * 100)
        : 0;

    const totalDecidedRivalry = winsAgainst + lossesAgainst;
    const myDominancePct =
      totalDecidedRivalry > 0
        ? Math.round((winsAgainst / totalDecidedRivalry) * 100)
        : 50;

    return {
      totalTogether: sameTeamMatches.length,
      partnerWins,
      partnerLosses,
      totalAgainst: opponentMatches.length,
      winsAgainst,
      lossesAgainst,
      duoGoals,
      p1AssistedP2,
      p2AssistedP1,
      winRate,
      myDominancePct,
      lastFiveTogether: recentTogether.slice(-5).reverse(),
    };
  }, [partner, matches, currentPlayer, partnerId]);

  const firstName = (fullName) =>
    fullName ? fullName.split(" ")[0] : "Atleta";

  return (
    <div className="ppg-card partner-card">
      <div className="partner-header-top">
        <span className="partner-kicker">QUÍMICA & CONFRONTO DIRETO</span>
        <h3 className="ppg-card-title">🤝 Analisador de Parceria</h3>
      </div>

      {/* ==================== RADAR AUTOMÁTICO DE DESTAQUES ==================== */}
      {autoHighlights &&
        (autoHighlights.bestPartner ||
          autoHighlights.biggestCustomer ||
          autoHighlights.biggestNemesis) && (
          <div className="partner-auto-highlights">
            {autoHighlights.bestPartner && (
              <button
                type="button"
                className={`auto-spot-chip ally ${
                  String(partnerId) ===
                  String(autoHighlights.bestPartner.player.id)
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setPartnerId(String(autoHighlights.bestPartner.player.id))
                }
                title="Clique para inspecionar seu melhor parceiro"
              >
                <span className="spot-tag">🤝 FIEL ESCUDEIRO</span>
                <strong className="spot-name">
                  {autoHighlights.bestPartner.player.name}
                </strong>
                <span className="spot-meta">
                  {autoHighlights.bestPartner.wins}V juntos (
                  {autoHighlights.bestPartner.winRate}%)
                </span>
              </button>
            )}

            {autoHighlights.biggestCustomer && (
              <button
                type="button"
                className={`auto-spot-chip customer ${
                  String(partnerId) ===
                  String(autoHighlights.biggestCustomer.player.id)
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setPartnerId(String(autoHighlights.biggestCustomer.player.id))
                }
                title="Clique para inspecionar quem você mais venceu"
              >
                <span className="spot-tag">🟢 MAIOR FREGUÊS</span>
                <strong className="spot-name">
                  {autoHighlights.biggestCustomer.player.name}
                </strong>
                <span className="spot-meta">
                  {autoHighlights.biggestCustomer.winsAgainst}V x{" "}
                  {autoHighlights.biggestCustomer.lossesAgainst}D
                </span>
              </button>
            )}

            {autoHighlights.biggestNemesis && (
              <button
                type="button"
                className={`auto-spot-chip nemesis ${
                  String(partnerId) ===
                  String(autoHighlights.biggestNemesis.player.id)
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setPartnerId(String(autoHighlights.biggestNemesis.player.id))
                }
                title="Clique para inspecionar quem mais venceu você"
              >
                <span className="spot-tag">💀 MAIOR CARRASCO</span>
                <strong className="spot-name">
                  {autoHighlights.biggestNemesis.player.name}
                </strong>
                <span className="spot-meta">
                  {autoHighlights.biggestNemesis.lossesAgainst} derrotas p/ ele
                </span>
              </button>
            )}
          </div>
        )}

      {/* ==================== SELETOR DE ATLETA ==================== */}
      <div className="partner-selector">
        <select
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
        >
          <option value="">🔍 Selecionar outro atleta para comparar...</option>
          {otherPlayers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ==================== RESULTADOS DA ANÁLISE ==================== */}
      {stats && partner ? (
        <div className="partner-results-wrapper">
          {/* CABEÇALHO CARA A CARA (AVATARES) */}
          <div className="partner-versus-banner">
            <div className="p-vs-athlete">
              <div className="p-vs-avatar">
                {currentPlayer.photo ? (
                  <img src={currentPlayer.photo} alt={currentPlayer.name} />
                ) : (
                  <span>{currentPlayer.name.charAt(0)}</span>
                )}
              </div>
              <span className="p-vs-name">{firstName(currentPlayer.name)}</span>
            </div>

            <div className="p-vs-badge">X</div>

            <div className="p-vs-athlete">
              <div className="p-vs-avatar">
                {partner.photo ? (
                  <img src={partner.photo} alt={partner.name} />
                ) : (
                  <span>{partner.name.charAt(0)}</span>
                )}
              </div>
              <span className="p-vs-name">{firstName(partner.name)}</span>
            </div>
          </div>

          {/* BLOCO 1: NA MESMA EQUIPE (QUÍMICA) */}
          <div className="partner-section">
            <div className="partner-section-head">
              <h4 className="partner-section-title">🤝 NA MESMA EQUIPE</h4>
              {stats.lastFiveTogether.length > 0 && (
                <div className="partner-mini-form" title="Últimos jogos juntos">
                  {stats.lastFiveTogether.map((r, i) => (
                    <span key={i} className={`p-form-dot ${r}`} />
                  ))}
                </div>
              )}
            </div>

            <div className="partner-grid-row">
              <div className="partner-stat-box">
                <span className="p-stat-val">{stats.totalTogether}</span>
                <span className="p-stat-label">Jogos Juntos</span>
                <span className="p-stat-sub">
                  {stats.partnerWins}V • {stats.partnerLosses}D
                </span>
              </div>

              <div className="partner-stat-box highlight">
                <span className="p-stat-val">{stats.winRate}%</span>
                <span className="p-stat-label">Aproveitamento</span>
                <span className="p-stat-sub">Taxa de Vitória</span>
              </div>

              <div className="partner-stat-box">
                <span className="p-stat-val">{stats.duoGoals}</span>
                <span className="p-stat-label">Gols da Dupla</span>
                <span className="p-stat-sub">Gol + Assist</span>
              </div>
            </div>

            {/* DETALHAMENTO DE ASSISTÊNCIAS MÚTUAS */}
            {stats.duoGoals > 0 && (
              <div className="partner-synergy-breakdown">
                <div className="synergy-pill">
                  <span>
                    🎯 Passes de {firstName(currentPlayer.name)} p/ gol dele:
                  </span>
                  <strong>{stats.p1AssistedP2}</strong>
                </div>
                <div className="synergy-pill">
                  <span>
                    ⚽ Passes de {firstName(partner.name)} p/ gol seu:
                  </span>
                  <strong>{stats.p2AssistedP1}</strong>
                </div>
              </div>
            )}

            <div className="partner-verdict">
              {stats.totalTogether === 0
                ? "🆕 AINDA NÃO JOGARAM NO MESMO TIME"
                : stats.winRate >= 70
                  ? "🔥 DUPLA DINÂMICA • ENTROSAMENTO DE ELITE"
                  : stats.winRate >= 50
                    ? "✅ BOA QUÍMICA • PARCERIA POSITIVA"
                    : "⚠️ QUÍMICA BAIXA • PRECISAM AJUSTAR A TÁTICA"}
            </div>
          </div>

          <div className="partner-divider">
            <span>CONFRONTO DIRETO (VS)</span>
          </div>

          {/* BLOCO 2: EM TIMES OPOSTOS (RIVALIDADE) */}
          <div className="partner-section">
            <h4 className="partner-section-title">⚔️ QUANDO JOGAM CONTRA</h4>

            <div className="partner-grid-row">
              <div className="partner-stat-box rivalry-win">
                <span className="p-stat-val">{stats.winsAgainst}</span>
                <span className="p-stat-label">
                  Vitórias de {firstName(currentPlayer.name)}
                </span>
              </div>

              <div className="partner-stat-box">
                <span className="p-stat-val">{stats.totalAgainst}</span>
                <span className="p-stat-label">Duelos Totais</span>
              </div>

              <div className="partner-stat-box rivalry-loss">
                <span className="p-stat-val">{stats.lossesAgainst}</span>
                <span className="p-stat-label">
                  Vitórias de {firstName(partner.name)}
                </span>
              </div>
            </div>

            {/* BARRA DE CABO DE GUERRA (DOMÍNIO DA RIVALIDADE) */}
            {stats.totalAgainst > 0 && (
              <div className="rivalry-tug-wrapper">
                <div className="rivalry-tug-labels">
                  <span className="tug-win-txt">
                    {stats.myDominancePct}% {firstName(currentPlayer.name)}
                  </span>
                  <span className="tug-status-txt">
                    {stats.winsAgainst > stats.lossesAgainst
                      ? "😎 Freguês de Carteirinha"
                      : stats.lossesAgainst > stats.winsAgainst
                        ? "💀 Seu Carrasco em Campo"
                        : "⚖️ Rivalidade Empatada"}
                  </span>
                  <span className="tug-loss-txt">
                    {100 - stats.myDominancePct}% {firstName(partner.name)}
                  </span>
                </div>
                <div className="rivalry-tug-track">
                  <div
                    className="rivalry-tug-fill-win"
                    style={{ width: `${stats.myDominancePct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="partner-empty">
          <span className="partner-empty-icon">🔍</span>
          <p>
            Clique em um dos destaques acima ou selecione um atleta na lista
            para comparar a química e o histórico de confrontos.
          </p>
        </div>
      )}
    </div>
  );
};

export default PartnerAnalyzer;
