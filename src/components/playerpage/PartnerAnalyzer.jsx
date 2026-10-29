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
      ? m.penalties.A.filter(
          (p) => (p?.result || p) === "goal" || (p?.result || p) === "scored",
        ).length
      : null;
  const newPensB =
    m.penalties?.B?.length > 0
      ? m.penalties.B.filter(
          (p) => (p?.result || p) === "goal" || (p?.result || p) === "scored",
        ).length
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

// Retorna os IDs dos jogadores de cada equipe (considerando substituições reais se houver)
const getTeamPlayerIds = (m, teamKey) => {
  const actual =
    teamKey === "A" ? m.actualParticipantsA : m.actualParticipantsB;
  const base = teamKey === "A" ? m.teamA?.players : m.teamB?.players;
  const list = actual && actual.length > 0 ? actual : base || [];
  return list.map((id) => String(id).trim());
};

const PartnerAnalyzer = ({ currentPlayer, allPlayers = [], matches = [] }) => {
  const [partnerId, setPartnerId] = useState("");

  const firstName = (fullName) =>
    fullName ? fullName.trim().split(" ")[0] : "Atleta";

  const p1Short = firstName(currentPlayer?.name);

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

  const p2Short = firstName(partner?.name);

  // =========================================================================
  // 1. RADAR AUTOMÁTICO: PARCEIRO, FREGUÊS (SALDO > 0) E CARRASCO (SALDO < 0)
  // =========================================================================
  const autoHighlights = useMemo(() => {
    if (!currentPlayer || !matches.length || !otherPlayers.length) return null;
    const p1Id = String(currentPlayer.id).trim();

    let bestPartner = null;
    let biggestCustomer = null; // Freguês de currentPlayer (currentPlayer TEM que ter mais vitórias que derrotas!)
    let biggestNemesis = null; // Carrasco de currentPlayer (Oponente TEM que ter mais vitórias que currentPlayer!)

    otherPlayers.forEach((other) => {
      const p2Id = String(other.id).trim();
      let togetherGames = 0;
      let togetherWins = 0;
      let duoGoals = 0;
      let againstGames = 0;
      let p1WinsVsP2 = 0; // Vitórias de currentPlayer contra other
      let p2WinsVsP1 = 0; // Vitórias de other contra currentPlayer

      matches.forEach((m) => {
        const playersA = getTeamPlayerIds(m, "A");
        const playersB = getTeamPlayerIds(m, "B");

        const p1InA = playersA.includes(p1Id);
        const p1InB = playersB.includes(p1Id);
        if (!p1InA && !p1InB) return;

        const p2InA = playersA.includes(p2Id);
        const p2InB = playersB.includes(p2Id);
        if (!p2InA && !p2InB) return;

        const winner = getMatchWinner(m);

        // Jogaram no mesmo time
        if ((p1InA && p2InA) || (p1InB && p2InB)) {
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
        }
        // Jogaram em times opostos (Confronto Direto)
        else {
          againstGames++;
          if ((p1InA && winner === "A") || (p1InB && winner === "B")) {
            p1WinsVsP2++;
          } else if ((p1InA && winner === "B") || (p1InB && winner === "A")) {
            p2WinsVsP1++;
          }
        }
      });

      // 1. Melhor Parceiro (mínimo 2 jogos juntos)
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

      // 2. Maior Freguês de currentPlayer:
      // OBRIGATÓRIO: currentPlayer tem que ter MAIS vitórias do que derrotas contra ele (p1WinsVsP2 > p2WinsVsP1)
      if (p1WinsVsP2 > p2WinsVsP1) {
        const positiveDiff = p1WinsVsP2 - p2WinsVsP1; // Saldo de vitórias a favor de currentPlayer
        if (
          !biggestCustomer ||
          positiveDiff > biggestCustomer.diff ||
          (positiveDiff === biggestCustomer.diff &&
            p1WinsVsP2 > biggestCustomer.p1Wins)
        ) {
          biggestCustomer = {
            player: other,
            p1Wins: p1WinsVsP2,
            p2Wins: p2WinsVsP1,
            games: againstGames,
            diff: positiveDiff,
          };
        }
      }

      // 3. Maior Carrasco de currentPlayer:
      // OBRIGATÓRIO: o adversário tem que ter MAIS vitórias do que currentPlayer (p2WinsVsP1 > p1WinsVsP2)
      if (p2WinsVsP1 > p1WinsVsP2) {
        const negativeDiff = p2WinsVsP1 - p1WinsVsP2; // Saldo de vitórias a favor do carrasco
        if (
          !biggestNemesis ||
          negativeDiff > biggestNemesis.diff ||
          (negativeDiff === biggestNemesis.diff &&
            p2WinsVsP1 > biggestNemesis.p2Wins)
        ) {
          biggestNemesis = {
            player: other,
            p2Wins: p2WinsVsP1,
            p1Wins: p1WinsVsP2,
            games: againstGames,
            diff: negativeDiff,
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
      const playersA = getTeamPlayerIds(m, "A");
      const playersB = getTeamPlayerIds(m, "B");

      const p1InA = playersA.includes(p1Id);
      const p1InB = playersB.includes(p1Id);
      if (!p1InA && !p1InB) return;

      const p2InA = playersA.includes(p2Id);
      const p2InB = playersB.includes(p2Id);
      if (!p2InA && !p2InB) return;

      if ((p1InA && p2InA) || (p1InB && p2InB)) sameTeamMatches.push(m);
      else opponentMatches.push(m);
    });

    let partnerWins = 0;
    let partnerLosses = 0;
    let p1AssistedP2 = 0; // Passes de currentPlayer para gol de partner
    let p2AssistedP1 = 0; // Passes de partner para gol de currentPlayer
    let p1WinsAgainst = 0; // Vitórias de currentPlayer contra partner
    let p2WinsAgainst = 0; // Vitórias de partner contra currentPlayer
    let recentTogether = [];

    // Processar Aliados
    sameTeamMatches.forEach((m) => {
      const playersA = getTeamPlayerIds(m, "A");
      const p1InA = playersA.includes(p1Id);
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
      const playersA = getTeamPlayerIds(m, "A");
      const p1InA = playersA.includes(p1Id);
      const winner = getMatchWinner(m);
      if (winner === "A") {
        p1InA ? p1WinsAgainst++ : p2WinsAgainst++;
      } else if (winner === "B") {
        !p1InA ? p1WinsAgainst++ : p2WinsAgainst++;
      }
    });

    const duoGoals = p1AssistedP2 + p2AssistedP1;
    const winRate =
      sameTeamMatches.length > 0
        ? Math.round((partnerWins / sameTeamMatches.length) * 100)
        : 0;

    const totalDecidedRivalry = p1WinsAgainst + p2WinsAgainst;
    const p1DominancePct =
      totalDecidedRivalry > 0
        ? Math.round((p1WinsAgainst / totalDecidedRivalry) * 100)
        : 50;

    return {
      totalTogether: sameTeamMatches.length,
      partnerWins,
      partnerLosses,
      totalAgainst: opponentMatches.length,
      p1WinsAgainst,
      p2WinsAgainst,
      duoGoals,
      p1AssistedP2,
      p2AssistedP1,
      winRate,
      p1DominancePct,
      lastFiveTogether: recentTogether.slice(-5).reverse(),
    };
  }, [partner, matches, currentPlayer, partnerId]);

  return (
    <div className="ppg-card partner-card">
      <div className="partner-header-top">
        <span className="partner-kicker">
          QUÍMICA & CONFRONTO DIRETO DE {p1Short.toUpperCase()}
        </span>
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
                title={`Melhor dupla de ${p1Short}`}
              >
                <span className="spot-tag">
                  🤝 MELHOR DUPLA DE {p1Short.toUpperCase()}
                </span>
                <strong className="spot-name">
                  {autoHighlights.bestPartner.player.name}
                </strong>
                <span className="spot-meta">
                  {autoHighlights.bestPartner.wins}V em{" "}
                  {autoHighlights.bestPartner.games}J juntos (
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
                title={`${p1Short} tem saldo positivo de vitórias contra ${autoHighlights.biggestCustomer.player.name}`}
              >
                <span className="spot-tag">
                  🟢 FREGUÊS DE {p1Short.toUpperCase()}
                </span>
                <strong className="spot-name">
                  {autoHighlights.biggestCustomer.player.name}
                </strong>
                <span className="spot-meta">
                  {p1Short} {autoHighlights.biggestCustomer.p1Wins}V x{" "}
                  {autoHighlights.biggestCustomer.p2Wins}V{" "}
                  {firstName(autoHighlights.biggestCustomer.player.name)}
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
                title={`${autoHighlights.biggestNemesis.player.name} tem mais vitórias contra ${p1Short}`}
              >
                <span className="spot-tag">
                  💀 CARRASCO DE {p1Short.toUpperCase()}
                </span>
                <strong className="spot-name">
                  {autoHighlights.biggestNemesis.player.name}
                </strong>
                <span className="spot-meta">
                  {firstName(autoHighlights.biggestNemesis.player.name)}{" "}
                  {autoHighlights.biggestNemesis.p2Wins}V x{" "}
                  {autoHighlights.biggestNemesis.p1Wins}V {p1Short}
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
          <option value="">
            🔍 Selecionar atleta para comparar com {p1Short}...
          </option>
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
              <span className="p-vs-name">{p1Short}</span>
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
              <span className="p-vs-name">{p2Short}</span>
            </div>
          </div>

          {/* BLOCO 1: NA MESMA EQUIPE (QUÍMICA) */}
          <div className="partner-section">
            <div className="partner-section-head">
              <h4 className="partner-section-title">
                🤝 {p1Short.toUpperCase()} & {p2Short.toUpperCase()} NO MESMO
                TIME
              </h4>
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

            {/* DETALHAMENTO DE ASSISTÊNCIAS MÚTUAS COM OS NOMES CLAROS */}
            {stats.duoGoals > 0 && (
              <div className="partner-synergy-breakdown">
                <div className="synergy-pill">
                  <span>
                    🎯 Passes de {p1Short} p/ gol de {p2Short}:
                  </span>
                  <strong>{stats.p1AssistedP2}</strong>
                </div>
                <div className="synergy-pill">
                  <span>
                    ⚽ Passes de {p2Short} p/ gol de {p1Short}:
                  </span>
                  <strong>{stats.p2AssistedP1}</strong>
                </div>
              </div>
            )}

            <div className="partner-verdict">
              {stats.totalTogether === 0
                ? `🆕 ${p1Short.toUpperCase()} E ${p2Short.toUpperCase()} AINDA NÃO JOGARAM NO MESMO TIME`
                : stats.winRate >= 70
                  ? `🔥 DUPLA DINÂMICA • ${p1Short.toUpperCase()} & ${p2Short.toUpperCase()} TÊM ENTROSAMENTO DE ELITE`
                  : stats.winRate >= 50
                    ? `✅ BOA QUÍMICA • PARCERIA POSITIVA ENTRE ${p1Short.toUpperCase()} E ${p2Short.toUpperCase()}`
                    : `⚠️ QUÍMICA BAIXA • ${p1Short.toUpperCase()} E ${p2Short.toUpperCase()} PRECISAM AJUSTAR A TÁTICA`}
            </div>
          </div>

          <div className="partner-divider">
            <span>
              CONFRONTO DIRETO ({p1Short.toUpperCase()} VS{" "}
              {p2Short.toUpperCase()})
            </span>
          </div>

          {/* BLOCO 2: EM TIMES OPOSTOS (RIVALIDADE) */}
          <div className="partner-section">
            <h4 className="partner-section-title">
              ⚔️ {p1Short.toUpperCase()} CONTRA {p2Short.toUpperCase()}
            </h4>

            <div className="partner-grid-row">
              <div className="partner-stat-box rivalry-win">
                <span className="p-stat-val">{stats.p1WinsAgainst}</span>
                <span className="p-stat-label">Vitórias de {p1Short}</span>
              </div>

              <div className="partner-stat-box">
                <span className="p-stat-val">{stats.totalAgainst}</span>
                <span className="p-stat-label">Duelos Totais</span>
              </div>

              <div className="partner-stat-box rivalry-loss">
                <span className="p-stat-val">{stats.p2WinsAgainst}</span>
                <span className="p-stat-label">Vitórias de {p2Short}</span>
              </div>
            </div>

            {/* BARRA DE CABO DE GUERRA COM OS NOMES DE CADA UM */}
            {stats.totalAgainst > 0 && (
              <div className="rivalry-tug-wrapper">
                <div className="rivalry-tug-labels">
                  <span className="tug-win-txt">
                    {stats.p1DominancePct}% {p1Short}
                  </span>
                  <span className="tug-status-txt">
                    {stats.p1WinsAgainst > stats.p2WinsAgainst
                      ? `😎 ${p2Short} é freguês de ${p1Short}`
                      : stats.p2WinsAgainst > stats.p1WinsAgainst
                        ? `💀 ${p2Short} é carrasco de ${p1Short}`
                        : `⚖️ Empate entre ${p1Short} e ${p2Short}`}
                  </span>
                  <span className="tug-loss-txt">
                    {100 - stats.p1DominancePct}% {p2Short}
                  </span>
                </div>
                <div className="rivalry-tug-track">
                  <div
                    className="rivalry-tug-fill-win"
                    style={{ width: `${stats.p1DominancePct}%` }}
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
            para comparar a química e o histórico de confrontos com{" "}
            <strong>{p1Short}</strong>.
          </p>
        </div>
      )}
    </div>
  );
};

export default PartnerAnalyzer;
