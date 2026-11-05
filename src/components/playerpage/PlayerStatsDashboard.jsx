import React, { useState, useMemo } from "react";
import "../../styles/Playerpage/playerdashboard.css";

// ==========================================
// ÍCONES MINIMALISTAS (traço fino, herdam a cor do tema)
// ==========================================
const ICONS = {
  whistle: (
    <>
      <circle cx="9" cy="14" r="5" />
      <path d="M13.5 11.5L21 9v5l-6.5 1" />
      <path d="M9 9V6" />
    </>
  ),
  ball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8l3.5 2.5-1.3 4h-4.4l-1.3-4z" />
      <path d="M12 8V3M15.5 10.5L20 9M14.2 14.5l3 3.5M9.8 14.5l-3 3.5M8.5 10.5L4 9" />
    </>
  ),
  goal: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 10h18M8 10v9M16 10v9" />
    </>
  ),
  plus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v9M7.5 12h9" />
    </>
  ),
  hat: (
    <>
      <path d="M7 16V8a2 2 0 012-2h6a2 2 0 012 2v8" />
      <path d="M3 16h18M7 12h10" />
    </>
  ),
  bolt: <path d="M13 3L5 14h6l-1 7 8-11h-6z" />,
  flame: (
    <path d="M12 3c.8 3.6 5 5 5 10a5 5 0 01-10 0c0-2 1-3.2 2-4 0 2 .8 3 2 3 0-3-1.2-5 1-9z" />
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  equal: <path d="M5 9h14M5 15h14" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  star: (
    <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7z" />
  ),
  percent: (
    <>
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
      <path d="M19 5L5 19" />
    </>
  ),
  bars: <path d="M5 19v-8M12 19V5M19 19v-6" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  down: <path d="M12 4v13M7 12.5l5 5 5-5" />,
  yellow: (
    <rect
      x="7"
      y="4"
      width="10"
      height="16"
      rx="1.5"
      fill="#ffd600"
      stroke="none"
    />
  ),
  red: (
    <rect
      x="7"
      y="4"
      width="10"
      height="16"
      rx="1.5"
      fill="#e4002b"
      stroke="none"
    />
  ),
};

const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

// Célula do grid (ícone, rótulo, valor e uma linha opcional de apoio)
const StatCell = ({ icon, label, value, sub, children }) => (
  <div className="psd-cell">
    <span className="psd-cell-icon">
      <Icon name={icon} />
    </span>
    <span className="psd-cell-label">{label}</span>
    {children ? children : <span className="psd-cell-value">{value}</span>}
    {sub && <span className="psd-cell-sub">{sub}</span>}
  </div>
);

// Mostra "/" quando o valor é zero (estilo scout minimalista)
const orSlash = (n) => (Number(n) > 0 ? n : "/");

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
  const mType = String(m.type || "TREINO").toUpperCase();
  const isTreino = mType === "TREINO";

  const sA =
    m.events?.filter(
      (e) =>
        (e.type === "GOAL" && e.team === "A") ||
        (e.type === "OWN_GOAL" && e.team === "B"),
    ).length || 0;

  const sB =
    m.events?.filter(
      (e) =>
        (e.type === "GOAL" && e.team === "B") ||
        (e.type === "OWN_GOAL" && e.team === "A"),
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
    const isAnonymousPlayer = Boolean(player.isAnonymous);

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

      let goalsInThisMatch = 0;

      m.events?.forEach((e) => {
        const isAuthor = String(e.playerId) === pIdStr;
        const isAssist = String(e.assistId) === pIdStr;

        if (e.type === "GOAL" && isAuthor) {
          filtered.goals++;
          goalsInThisMatch++;
        }
        if (
          (e.type === "GOAL" && isAssist) ||
          (e.type === "ASSIST" && isAuthor)
        ) {
          filtered.assists++;
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
      absences: {
        totalDays: totalActiveDays,
        attendedDays,
        attendanceRate,
        missedList: missedDaysList,
        currentMissedStreak,
        isAnonymous: isAnonymousPlayer,
      },
    };
  }, [player, matches, selectedSeason, matchFilter]);

  if (!stats) return null;

  const d = stats.display;
  const a = stats.absences;

  return (
    <div className="psd-dashboard">
      {/* 1. TÍTULO E FILTROS */}
      <h3 className="psd-title">ESTATÍSTICAS</h3>

      <div className="psd-filters">
        <select
          className="psd-type-select"
          value={matchFilter}
          onChange={(e) => setMatchFilter(e.target.value)}
        >
          <option value="ALL_TYPES">Todas as competições</option>
          <option value="TREINO">Treinos</option>
          <option value="AMISTOSO">Amistosos</option>
          <option value="CAMPEONATO">Campeonatos</option>
          <option value="EVENTO">Evento</option>
        </select>

        <select
          className="psd-season-select"
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
        >
          <option value="ALL">Todas as temporadas</option>
          <option value="2026">Temporada 2026</option>
          <option value="2025">Temporada 2025</option>
        </select>
      </div>

      {/* 2. NÚMEROS PRINCIPAIS */}
      <div className="psd-grid cols-3">
        <StatCell icon="whistle" label="Jogos disputados" value={d.matches} />
        <StatCell
          icon="ball"
          label="Gols"
          value={d.goals}
          sub={`${d.goalsPerGame} / jogo`}
        />
        <StatCell
          icon="goal"
          label="Assistências"
          value={d.assists}
          sub={`${d.assistsPerGame} / jogo`}
        />

        <StatCell
          icon="plus"
          label="Participações (G+A)"
          value={d.participation}
          sub={`${d.partPerGame} / jogo`}
        />
        <StatCell icon="hat" label="Hat-tricks" value={orSlash(d.hatTricks)} />
        <StatCell icon="bolt" label="Dobradinhas" value={orSlash(d.braces)} />

        <StatCell
          icon="yellow"
          label="Cartões amarelos"
          value={orSlash(d.yellow)}
        />
        <StatCell icon="red" label="Cartões vermelhos" value={orSlash(d.red)} />
        <StatCell
          icon="flame"
          label="Maior sequência invicta"
          value={orSlash(d.maxUnbeatenStreak)}
        />
      </div>

      {/* 3. RESULTADOS */}
      <h4 className="psd-section-title">RESULTADOS</h4>
      <div className="psd-grid cols-3">
        <StatCell icon="check" label="Vitórias" value={d.wins} />
        <StatCell icon="equal" label="Empates" value={d.draws} />
        <StatCell icon="cross" label="Derrotas" value={d.losses} />

        <StatCell icon="star" label="Pontos" value={d.points} />
        <StatCell
          icon="percent"
          label="Aproveitamento"
          value={`${d.winRate}%`}
        />
        <StatCell icon="bars" label="Últimos 5 jogos">
          {d.lastFiveForm.length > 0 ? (
            <div className="psd-bubbles">
              {d.lastFiveForm.map((item, idx) => (
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
              ))}
            </div>
          ) : (
            <span className="psd-cell-value">/</span>
          )}
          <span className="psd-cell-sub">1º = mais recente</span>
        </StatCell>
      </div>

      {/* 4. GOLEIRO (só aparece se já jogou no gol) */}
      {d.gamesAsGK > 0 && (
        <>
          <h4 className="psd-section-title">GOLEIRO</h4>
          <div className="psd-grid cols-4">
            <StatCell icon="goal" label="Jogos no gol" value={d.gamesAsGK} />
            <StatCell
              icon="shield"
              label="Clean sheets"
              value={orSlash(d.cleanSheets)}
            />
            <StatCell icon="down" label="Média sofridos" value={d.mgs} />
            <StatCell
              icon="percent"
              label="Jogos sem sofrer"
              value={`${d.cleanSheetRate}%`}
            />
          </div>
        </>
      )}

      {/* 5. ASSIDUIDADE E STATUS DA TABELA */}
      <h4 className="psd-section-title">FREQUÊNCIA</h4>
      <div className="psd-absence-panel">
        <div
          className="psd-absence-header"
          onClick={() => setShowAbsences(!showAbsences)}
        >
          <div className="psd-absence-info-left">
            <span className="psd-absence-title">
              Assiduidade · {a.attendanceRate}% de presença
            </span>
            <span className="psd-absence-sub">
              Esteve em <strong className="txt-ok">{a.attendedDays}</strong> de{" "}
              <strong>{a.totalDays}</strong> dias de evento (
              <strong
                className={a.missedList.length > 0 ? "txt-danger" : "txt-ok"}
              >
                {a.missedList.length} faltas
              </strong>
              )
            </span>
          </div>

          <div className="psd-absence-info-right">
            {a.isAnonymous ? (
              <span className="psd-rule-status-badge status-anonymous">
                Atleta anônimo (isento de faltas)
              </span>
            ) : (
              <span
                className={`psd-rule-status-badge ${
                  a.currentMissedStreak > 3
                    ? "status-out"
                    : a.currentMissedStreak === 3
                      ? "status-risk"
                      : "status-ok"
                }`}
              >
                {a.currentMissedStreak > 3
                  ? `Fora da tabela (${a.currentMissedStreak} faltas seg.)`
                  : a.currentMissedStreak === 3
                    ? "No limite (3 faltas seg.)"
                    : "Ativo na tabela"}
              </span>
            )}
            <span className={`psd-expand-arrow ${showAbsences ? "open" : ""}`}>
              ❯
            </span>
          </div>
        </div>

        {showAbsences && (
          <div className="psd-absence-content">
            {a.isAnonymous ? (
              <div className="psd-absence-perfect">
                Este perfil está oculto como anônimo e não sofre penalidades por
                inatividade.
              </div>
            ) : a.missedList.length > 0 ? (
              <div className="psd-missed-chips-grid">
                {a.missedList.map((date, idx) => (
                  <span key={idx} className="psd-absence-chip">
                    {date}
                  </span>
                ))}
              </div>
            ) : (
              <div className="psd-absence-perfect">
                Presença 100%! Não faltou a nenhum dia de evento.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerStatsDashboard;
