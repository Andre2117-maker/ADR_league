import React, { useState, useMemo } from "react";
import "../../styles/Playerpage/playerdashboard.css";

// Função auxiliar para extrair informações cronológicas da partida
const getMatchChronoInfo = (m) => {
  const rawDate = m.date ? String(m.date).split("T")[0] : "";
  const dayTimestamp = rawDate ? new Date(`${rawDate}T12:00:00`).getTime() : 0;
  const matchOrder = Number(m.order ?? m.matchNumber ?? 0);
  const createdMs = m.createdAt?.seconds
    ? m.createdAt.seconds * 1000
    : typeof m.createdAt === "number"
      ? m.createdAt
      : dayTimestamp;

  return { dayTimestamp, matchOrder, createdMs };
};

// Função interna blindada para calcular o resultado exato d'O ADR (Sem empate em treino)
const calculateMatchOutcome = (m, pIdStr) => {
  const isTeamA = m.teamA?.players?.some((id) => String(id) === pIdStr);
  const playerTeam = isTeamA ? "A" : "B";
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

  let result = "L";

  // 1. Gol de Ouro
  if (m.goldenGoalWinner) {
    const teamAWonGG = String(m.goldenGoalWinner).toUpperCase() === "A";
    result = (teamAWonGG && isTeamA) || (!teamAWonGG && !isTeamA) ? "W" : "L";
  }
  // 2. Tempo Normal
  else if (sA > sB) {
    result = isTeamA ? "W" : "L";
  } else if (sB > sA) {
    result = !isTeamA ? "W" : "L";
  }
  // 3. Empate -> Pênaltis ou Regra de Treino
  else {
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

    if (pensA !== pensB) {
      const teamAWonPens = pensA > pensB;
      result =
        (teamAWonPens && isTeamA) || (!teamAWonPens && !isTeamA) ? "W" : "L";
    } else if (m.penaltiesWinner || m.winner) {
      const wRaw = String(m.penaltiesWinner || m.winner)
        .trim()
        .toUpperCase();
      const teamAWon =
        wRaw === "A" ||
        wRaw === "TEAMA" ||
        wRaw === "TEAM_A" ||
        wRaw === "TIME A";
      result = (teamAWon && isTeamA) || (!teamAWon && !isTeamA) ? "W" : "L";
    } else if (isTreino) {
      // Em treino não existe empate: se empatou e não salvou pênalti, assume vitória do time A para evitar quebrar estatística
      result = isTeamA ? "W" : "L";
    } else {
      result = "D";
    }
  }

  return {
    result,
    scoreText: `${sA}x${sB}`,
    isTeamA,
  };
};

const PlayerStatsDashboard = ({ player, matches }) => {
  const [selectedSeason, setSelectedSeason] = useState("ALL");
  const [matchFilter, setMatchFilter] = useState("ALL_TYPES");
  const [showAbsences, setShowAbsences] = useState(false);

  const stats = useMemo(() => {
    if (!player || !matches) return null;

    const pIdStr = String(player.id);

    let filtered = {
      goals: 0,
      assists: 0,
      yellow: 0,
      red: 0,
      matchesCount: 0,
      gamesAsGK: 0,
      cleanSheets: 0,
      goalsAgainst: 0,
      hatTricks: 0,
      braces: 0,
    };

    let dailyGroup = {};
    let activeDays = {};

    // 1. LÓGICA DE DIAS DE EVENTO E PRESENÇA
    matches.forEach((m) => {
      if (!m.date) return;
      const matchYear = new Date(m.date).getFullYear();
      const isSelectedSeason =
        selectedSeason === "ALL" || matchYear === Number(selectedSeason);
      const isSelectedType =
        matchFilter === "ALL_TYPES" || m.type === matchFilter;

      if (isSelectedSeason && isSelectedType) {
        const rawDate = m.date?.split("T")[0] || "S/D";
        if (rawDate !== "S/D") {
          if (!activeDays[rawDate]) {
            activeDays[rawDate] = { played: false };
          }
          const participated =
            m.teamA?.players?.some((id) => String(id) === pIdStr) ||
            m.teamB?.players?.some((id) => String(id) === pIdStr);
          if (participated) {
            activeDays[rawDate].played = true;
          }
        }
      }
    });

    const sortedDatesDesc = Object.keys(activeDays).sort(
      (a, b) => new Date(b) - new Date(a),
    );

    let totalActiveDays = sortedDatesDesc.length;
    let missedDaysList = [];

    sortedDatesDesc.forEach((dateString) => {
      if (!activeDays[dateString].played) {
        const displayDate = dateString.split("-").reverse().join("/");
        missedDaysList.push(displayDate);
      }
    });

    let currentMissedStreak = 0;
    for (const dateStr of sortedDatesDesc) {
      if (!activeDays[dateStr].played) {
        currentMissedStreak++;
      } else {
        break;
      }
    }

    const attendedDays = totalActiveDays - missedDaysList.length;
    const attendanceRate =
      totalActiveDays > 0
        ? Math.round((attendedDays / totalActiveDays) * 100)
        : 100;

    // 2. FILTRAR E ORDENAR PARTIDAS DO JOGADOR EM ORDEM CRONOLÓGICA
    const pMatchesChrono = matches
      .filter((m) => {
        const inA = m.teamA?.players?.some((id) => String(id) === pIdStr);
        const inB = m.teamB?.players?.some((id) => String(id) === pIdStr);
        if (!inA && !inB) return false;

        const matchYear = new Date(m.date).getFullYear();
        const isSelectedSeason =
          selectedSeason === "ALL" || matchYear === Number(selectedSeason);
        const isSelectedType =
          matchFilter === "ALL_TYPES" || m.type === matchFilter;

        return isSelectedSeason && isSelectedType;
      })
      .sort((a, b) => {
        const infoA = getMatchChronoInfo(a);
        const infoB = getMatchChronoInfo(b);
        if (infoA.dayTimestamp !== infoB.dayTimestamp) {
          return infoA.dayTimestamp - infoB.dayTimestamp;
        }
        if (infoA.matchOrder !== infoB.matchOrder) {
          return infoA.matchOrder - infoB.matchOrder;
        }
        return infoA.createdMs - infoB.createdMs;
      });

    let recentResults = [];
    let winsCount = 0;
    let lossesCount = 0;
    let drawsCount = 0;
    let currentUnbeaten = 0;
    let maxUnbeatenStreak = 0;

    pMatchesChrono.forEach((m) => {
      filtered.matchesCount++;

      const rawDate = m.date?.split("T")[0] || "S/D";
      const displayDate =
        rawDate !== "S/D" ? rawDate.split("-").reverse().join("/") : "S/D";

      const outcome = calculateMatchOutcome(m, pIdStr);
      const result = outcome.result;
      const scoreText = outcome.scoreText;

      if (result === "W") {
        winsCount++;
        currentUnbeaten++;
      } else if (result === "D") {
        drawsCount++;
        currentUnbeaten++;
      } else {
        lossesCount++;
        currentUnbeaten = 0;
      }

      if (currentUnbeaten > maxUnbeatenStreak) {
        maxUnbeatenStreak = currentUnbeaten;
      }

      recentResults.push({
        result,
        date: displayDate,
        scoreText,
        order: m.order || "",
      });

      // Estatísticas como Goleiro
      const isGkTeamA = String(m.teamA?.goalkeeperId) === pIdStr;
      const isGkTeamB = String(m.teamB?.goalkeeperId) === pIdStr;

      if (isGkTeamA || isGkTeamB) {
        filtered.gamesAsGK++;
        const goalsA =
          m.events?.filter(
            (e) =>
              (e.type === "GOAL" && e.team === "A") ||
              (e.type === "OWN_GOAL" && e.team === "B"),
          ).length || 0;
        const goalsB =
          m.events?.filter(
            (e) =>
              (e.type === "GOAL" && e.team === "B") ||
              (e.type === "OWN_GOAL" && e.team === "A"),
          ).length || 0;

        const conceded = isGkTeamA ? goalsB : goalsA;
        filtered.goalsAgainst += conceded;
        if (conceded === 0) filtered.cleanSheets++;
      }

      // Gols, Assistências e Cartões
      if (!dailyGroup[displayDate]) dailyGroup[displayDate] = { g: 0, a: 0 };
      let goalsInThisMatch = 0;

      m.events?.forEach((e) => {
        const isAuthor = String(e.playerId) === pIdStr;
        const isAssist = String(e.assistId) === pIdStr;

        if (e.type === "GOAL" && isAuthor) {
          filtered.goals++;
          goalsInThisMatch++;
          dailyGroup[displayDate].g++;
        }
        if (
          (e.type === "GOAL" && isAssist) ||
          (e.type === "ASSIST" && isAuthor)
        ) {
          filtered.assists++;
          dailyGroup[displayDate].a++;
        }
        if (isAuthor) {
          if (e.type === "YELLOW" || e.type === "YELLOW_CARD")
            filtered.yellow++;
          if (e.type === "RED" || e.type === "RED_CARD") filtered.red++;
        }
      });

      if (goalsInThisMatch >= 3) filtered.hatTricks++;
      else if (goalsInThisMatch === 2) filtered.braces++;
    });

    // 3. DADOS MANUAIS
    const isAllSeason = selectedSeason === "ALL";
    const showManual = matchFilter === "ALL_TYPES" || matchFilter === "TREINO";

    let mGoals = 0;
    let mAssists = 0;
    let mMatches = 0;

    if (showManual) {
      if (isAllSeason) {
        mGoals = Number(player.manualGoals || 0);
        mAssists = Number(player.manualAssists || 0);
        mMatches = Number(player.manualMatches || 0);
      } else {
        const seasonMap = player.statsBySeason?.[selectedSeason] || {};
        mGoals = Number(seasonMap.goals || 0);
        mAssists = Number(seasonMap.assists || 0);
        mMatches = Number(seasonMap.matches || 0);
      }
    }

    const totalMatches = filtered.matchesCount + mMatches;
    const totalGoals = filtered.goals + mGoals;
    const totalAssists = filtered.assists + mAssists;
    const totalParticipation = totalGoals + totalAssists;

    const pointsEarned = winsCount * 3 + drawsCount * 1;
    const winRate =
      filtered.matchesCount > 0
        ? Math.round(
            ((winsCount * 3 + drawsCount) / (filtered.matchesCount * 3)) * 100,
          )
        : 0;

    const cleanSheetRate =
      filtered.gamesAsGK > 0
        ? Math.round((filtered.cleanSheets / filtered.gamesAsGK) * 100)
        : 0;

    // Pega as últimas 5 partidas e inverte para o mais recente ficar na esquerda
    const lastFiveForm = recentResults.slice(-5).reverse();

    return {
      display: {
        matches: totalMatches,
        goals: totalGoals,
        assists: totalAssists,
        participation: totalParticipation,
        goalsPerGame:
          totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : "0.00",
        assistsPerGame:
          totalMatches > 0 ? (totalAssists / totalMatches).toFixed(2) : "0.00",
        partPerGame:
          totalMatches > 0
            ? (totalParticipation / totalMatches).toFixed(2)
            : "0.00",
        yellow: filtered.yellow,
        red: filtered.red,
        wins: winsCount,
        draws: drawsCount,
        losses: lossesCount,
        points: pointsEarned,
        winRate,
        hatTricks: filtered.hatTricks,
        braces: filtered.braces,
        maxUnbeatenStreak,
        lastFiveForm,
        gamesAsGK: filtered.gamesAsGK,
        cleanSheets: filtered.cleanSheets,
        goalsAgainst: filtered.goalsAgainst,
        cleanSheetRate,
        mgs:
          filtered.gamesAsGK > 0
            ? (filtered.goalsAgainst / filtered.gamesAsGK).toFixed(2)
            : "0.00",
      },
      records: {
        goals: Object.entries(dailyGroup).reduce(
          (max, [date, val]) =>
            val.g >= max.value && val.g > 0 ? { value: val.g, date } : max,
          { value: 0, date: "" },
        ),
        assists: Object.entries(dailyGroup).reduce(
          (max, [date, val]) =>
            val.a >= max.value && val.a > 0 ? { value: val.a, date } : max,
          { value: 0, date: "" },
        ),
      },
      absences: {
        totalDays: totalActiveDays,
        attendedDays,
        attendanceRate,
        missedList: missedDaysList,
        currentMissedStreak,
      },
    };
  }, [player, matches, selectedSeason, matchFilter]);

  if (!stats) return null;

  const filterLabelMap = {
    ALL_TYPES: "Visão Geral",
    TREINO: "Treinos",
    AMISTOSO: "Amistosos",
    CAMPEONATO: "Campeonatos",
  };

  return (
    <div className="psd-dashboard">
      {/* 1. CABEÇALHO E FILTROS */}
      <div className="psd-header-row">
        <div className="psd-title-block">
          <span className="psd-kicker">SCOUT INDIVIDUAL</span>
          <h3 className="psd-title">{filterLabelMap[matchFilter]}</h3>
        </div>

        <div className="psd-filters">
          <select
            className="psd-season-select"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
          >
            <option value="ALL">TODAS AS TEMPORADAS</option>
            <option value="2026">TEMPORADA 2026</option>
            <option value="2025">TEMPORADA 2025</option>
          </select>

          <select
            className="psd-type-select"
            value={matchFilter}
            onChange={(e) => setMatchFilter(e.target.value)}
          >
            <option value="ALL_TYPES">📊 GERAL</option>
            <option value="TREINO">⚽ TREINOS</option>
            <option value="AMISTOSO">🤝 AMISTOSOS</option>
            <option value="CAMPEONATO">🏆 CAMPEONATOS</option>
          </select>
        </div>
      </div>

      {/* 2. BARRA DE RETROSPECTO E FORMA RECENTE */}
      <div className="psd-summary-banner">
        <div className="psd-record-group">
          <span className="psd-banner-label">RETROSPECTO E APROVEITAMENTO</span>
          <div className="psd-wdl-pills">
            <span className="wdl-pill win">
              <strong>{stats.display.wins}</strong> V
            </span>
            <span className="wdl-pill draw">
              <strong>{stats.display.draws}</strong> E
            </span>
            <span className="wdl-pill loss">
              <strong>{stats.display.losses}</strong> D
            </span>
            <span className="wdl-pill pts">
              <strong>{stats.display.points}</strong> PTS
            </span>
          </div>
          <div className="psd-winrate-bar-wrap">
            <div className="psd-winrate-track">
              <div
                className="psd-winrate-fill"
                style={{ width: `${stats.display.winRate}%` }}
              />
            </div>
            <span className="psd-winrate-text">
              {stats.display.winRate}% aprov.
            </span>
          </div>
        </div>

        <div className="psd-form-group">
          <span className="psd-banner-label">
            ÚLTIMOS 5 JOGOS (1º = MAIS RECENTE)
          </span>
          <div className="psd-form-bubbles">
            {stats.display.lastFiveForm.length > 0 ? (
              stats.display.lastFiveForm.map((item, idx) => (
                <span
                  key={idx}
                  className={`form-bubble ${
                    item.result === "W"
                      ? "is-win"
                      : item.result === "D"
                        ? "is-draw"
                        : "is-loss"
                  }`}
                  title={`${item.date} — Placar: ${item.scoreText}`}
                >
                  {item.result === "W" ? "V" : item.result === "D" ? "E" : "D"}
                </span>
              ))
            ) : (
              <span className="psd-no-form">Sem jogos registrados</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. KPIS PRINCIPAIS */}
      <div className="psd-grid-season">
        <div className="psd-card season-main">
          <span className="psd-label">JOGOS DISPUTADOS</span>
          <span className="psd-value">{stats.display.matches}</span>
          <span className="psd-sub-metric">
            Sequência máx: <strong>{stats.display.maxUnbeatenStreak}V</strong>
          </span>
        </div>

        <div className="psd-card season-goals">
          <span className="psd-label">GOLS MARCADOS</span>
          <span className="psd-value">{stats.display.goals}</span>
          <span className="psd-sub-metric">
            Média: <strong>{stats.display.goalsPerGame}</strong> / jogo
          </span>
        </div>

        <div className="psd-card season-assists">
          <span className="psd-label">ASSISTÊNCIAS</span>
          <span className="psd-value">{stats.display.assists}</span>
          <span className="psd-sub-metric">
            Média: <strong>{stats.display.assistsPerGame}</strong> / jogo
          </span>
        </div>

        <div className="psd-card participation-box">
          <span className="psd-label">PARTICIPAÇÕES (G+A)</span>
          <span className="psd-value">{stats.display.participation}</span>
          <span className="psd-sub-metric highlight">
            Impacto: <strong>{stats.display.partPerGame}</strong> / jogo
          </span>
        </div>
      </div>

      {/* 4. MILESTONES E DISCIPLINA */}
      <div className="psd-grid-secondary">
        <div className="psd-card milestone-card">
          <span className="psd-label">🎩 HAT-TRICKS (3+ GOLS)</span>
          <span className="psd-value-sm">{stats.display.hatTricks}</span>
        </div>

        <div className="psd-card milestone-card">
          <span className="psd-label">⚡ DOBRADINHAS (2 GOLS)</span>
          <span className="psd-value-sm">{stats.display.braces}</span>
        </div>

        <div className="psd-card cards-box">
          <span className="psd-label">DISCIPLINA</span>
          <div className="cards-counters-row">
            <div className="card-item yellow" title="Cartões Amarelos">
              <div className="card-rect"></div>
              <span>{stats.display.yellow}</span>
            </div>
            <div className="card-item red" title="Cartões Vermelhos">
              <div className="card-rect"></div>
              <span>{stats.display.red}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. GOLEIRO */}
      <div className="psd-gk-section">
        <div className="psd-section-mini-header">
          <span>🧤 DESEMPENHO NO GOL (GOLEIRO)</span>
        </div>
        <div className="psd-grid-season">
          <div className="psd-card gk-style">
            <span className="psd-label">JOGOS NO GOL</span>
            <span className="psd-value">{stats.display.gamesAsGK}</span>
          </div>

          <div className="psd-card gk-style">
            <span className="psd-label">CLEAN SHEETS (SG)</span>
            <span className="psd-value">{stats.display.cleanSheets}</span>
          </div>

          <div className="psd-card gk-style">
            <span className="psd-label">MÉDIA SOFRIDOS (MGS)</span>
            <span className="psd-value">{stats.display.mgs}</span>
          </div>

          <div className="psd-card gk-style">
            <span className="psd-label">% JOGOS SEM SOFRER</span>
            <span className="psd-value">{stats.display.cleanSheetRate}%</span>
          </div>
        </div>
      </div>

      {/* 6. RECORDES */}
      <div className="psd-lower-grid">
        <div className="psd-mini-card record-goals">
          <div className="psd-mini-top">
            <span className="psd-mini-label">🔥 RECORDE DE GOLS NO DIA</span>
            <span className="psd-record-date">
              {stats.records.goals.date || "Sem registro"}
            </span>
          </div>
          <div className="psd-mini-bottom">
            <span className="psd-mini-value">{stats.records.goals.value}</span>
            <span className="psd-mini-unit">gols na mesma data</span>
          </div>
        </div>

        <div className="psd-mini-card record-assists">
          <div className="psd-mini-top">
            <span className="psd-mini-label">🎯 RECORDE DE ASSISTS NO DIA</span>
            <span className="psd-record-date">
              {stats.records.assists.date || "Sem registro"}
            </span>
          </div>
          <div className="psd-mini-bottom">
            <span className="psd-mini-value">
              {stats.records.assists.value}
            </span>
            <span className="psd-mini-unit">assistências na mesma data</span>
          </div>
        </div>
      </div>

      {/* 7. ASSIDUIDADE */}
      <div className="psd-absences-wrapper">
        <div className="psd-absence-panel">
          <div
            className="psd-absence-header"
            onClick={() => setShowAbsences(!showAbsences)}
          >
            <div className="psd-absence-info-left">
              <span className="psd-absence-title">
                📅 Assiduidade & Frequência ({stats.absences.attendanceRate}% de
                presença)
              </span>
              <span className="psd-absence-sub">
                Esteve em{" "}
                <strong className="txt-ok">
                  {stats.absences.attendedDays}
                </strong>{" "}
                de <strong>{stats.absences.totalDays}</strong> dias de evento (
                <strong
                  className={
                    stats.absences.missedList.length > 0
                      ? "txt-danger"
                      : "txt-ok"
                  }
                >
                  {stats.absences.missedList.length} faltas
                </strong>
                )
              </span>
            </div>

            <div className="psd-absence-info-right">
              <span
                className={`psd-rule-status-badge ${
                  stats.absences.currentMissedStreak > 3
                    ? "status-out"
                    : stats.absences.currentMissedStreak === 3
                      ? "status-risk"
                      : "status-ok"
                }`}
              >
                {stats.absences.currentMissedStreak > 3
                  ? `⚠️ Fora da Tabela (${stats.absences.currentMissedStreak} faltas seg.)`
                  : stats.absences.currentMissedStreak === 3
                    ? "⚡ No Limite (3 faltas seg.)"
                    : "✅ Ativo na Tabela"}
              </span>
              <span
                className={`psd-expand-arrow ${showAbsences ? "open" : ""}`}
              >
                ❯
              </span>
            </div>
          </div>

          {showAbsences && (
            <div className="psd-absence-content">
              {stats.absences.missedList.length > 0 ? (
                <div className="psd-missed-chips-grid">
                  {stats.absences.missedList.map((date, idx) => (
                    <span key={idx} className="psd-absence-chip">
                      📅 {date}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="psd-absence-perfect">
                  🏆 Presença 100%! Não faltou a nenhum dia de evento.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsDashboard;
