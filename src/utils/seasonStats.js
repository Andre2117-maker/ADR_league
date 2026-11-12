/* ==========================================================================
   CÁLCULOS DA RETROSPECTIVA, CONFRONTO DIRETO E RECORDES
   (src/utils/seasonStats.js — usa as mesmas regras do matchStats.js)
   ========================================================================== */
import {
  SEASON_STAT_TYPES,
  matchType,
  isOfficialMatch,
  participantsOf,
  playerSide,
  countMatchGoals,
  playerGkLine,
} from "./matchStats";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/* ---------- Data da partida (aceita "2026-11-12", "12/11/2026", Timestamp do Firestore, Date) ---------- */
const pad = (n) => String(n).padStart(2, "0");
export const matchDay = (m) => {
  const d = m?.date;
  if (!d) return "";
  if (typeof d === "string") {
    const iso = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const br = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (br) return `${br[3]}-${pad(br[2])}-${pad(br[1])}`;
  }
  const dt =
    typeof d?.toDate === "function"
      ? d.toDate()
      : d?.seconds
        ? new Date(d.seconds * 1000)
        : new Date(d);
  return Number.isNaN(dt.getTime())
    ? ""
    : `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};
export const matchSeason = (m) => matchDay(m).slice(0, 4);

/* Mesmas partidas da tabela da temporada: TREINO + EVENTO oficiais */
export const seasonStatMatch = (m) =>
  isOfficialMatch(m) && SEASON_STAT_TYPES.includes(matchType(m));

/* ---------- Ordem cronológica (data → ordem → criação) ---------- */
const chronoKey = (m) => {
  const day = matchDay(m);
  const created =
    m.createdAt?.seconds ??
    (typeof m.createdAt === "number" ? m.createdAt / 1000 : 0);
  return [day, Number(m.order ?? 0), created];
};

export const sortChrono = (matches = []) =>
  [...matches].sort((a, b) => {
    const [da, oa, ca] = chronoKey(a);
    const [db, ob, cb] = chronoKey(b);
    if (da !== db) return da < db ? -1 : 1;
    if (oa !== ob) return oa - ob;
    return ca - cb;
  });

/* ---------- Resultado de um lado da partida ---------- */
export const outcomeFor = (m, side) => {
  const { a, b } = countMatchGoals(m);
  let w = m.goldenGoalWinner || m.penaltiesWinner || m.winner;
  w = w ? String(w).trim().toUpperCase() : null;
  if (w === "A" || w === "B") return w === side ? "W" : "L";
  if (a === b) return "D";
  return a > b === (side === "A") ? "W" : "L";
};

export const scoreText = (m) => {
  const { a, b } = countMatchGoals(m);
  return `${a}×${b}`;
};

/* ---------- Linha do jogador numa partida ---------- */
export const playerLine = (m, playerId) => {
  const id = String(playerId);
  const side = playerSide(m, id);
  if (!side) return null;
  let goals = 0;
  let assists = 0;
  let og = 0;
  let yellow = 0;
  let red = 0;
  (m.events || []).forEach((e) => {
    const isAuthor = String(e.playerId) === id;
    if (isAuthor && e.type === "GOAL") goals += 1;
    if (isAuthor && e.type === "OWN_GOAL") og += 1;
    if (isAuthor && (e.type === "YELLOW" || e.type === "YELLOW_CARD"))
      yellow += 1;
    if (isAuthor && (e.type === "RED" || e.type === "RED_CARD")) red += 1;
    if (
      (e.type === "GOAL" && String(e.assistId) === id) ||
      (e.type === "ASSIST" && isAuthor)
    )
      assists += 1;
  });
  const other = side === "A" ? "B" : "A";
  return {
    match: m,
    side,
    outcome: outcomeFor(m, side),
    goals,
    assists,
    og,
    yellow,
    red,
    gk: playerGkLine(m, id),
    teammates: participantsOf(m, side).filter((p) => p !== id),
    opponents: participantsOf(m, other),
  };
};

export const seasonsIn = (matches = []) =>
  [...new Set(matches.map(matchSeason).filter((y) => /^\d{4}$/.test(y)))].sort(
    (a, b) => b.localeCompare(a),
  );

/* Dias que contam presença: "Gerar faltas" ligado; antigos sem o campo = só TREINO */
const countsForAttendance = (m) =>
  m.generateFoul === undefined || m.generateFoul === null
    ? matchType(m) === "TREINO"
    : m.generateFoul === true;

/* ---------- Ranking da temporada (mesma regra da tabela) ---------- */
export const seasonRanking = (players = [], matches = [], season) => {
  const ranked = matches.filter(
    (m) =>
      SEASON_STAT_TYPES.includes(matchType(m)) &&
      isOfficialMatch(m) &&
      (!season || matchSeason(m) === String(season)),
  );
  const rows = players
    .filter((p) => !p.isAnonymous)
    .map((p) => {
      let points = 0;
      let goals = 0;
      let assists = 0;
      ranked.forEach((m) => {
        const l = playerLine(m, p.id);
        if (!l) return;
        if (l.outcome === "W") points += 3;
        else if (l.outcome === "D") points += 1;
        goals += l.goals;
        assists += l.assists;
      });
      return { player: p, points, goals, assists };
    });
  const byPoints = [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      b.goals - a.goals ||
      b.assists - a.assists ||
      String(a.player.name || "").localeCompare(
        String(b.player.name || ""),
        "pt-BR",
      ),
  );
  const byGoals = [...rows].sort(
    (a, b) => b.goals - a.goals || b.assists - a.assists,
  );
  const byAssists = [...rows].sort(
    (a, b) => b.assists - a.assists || b.goals - a.goals,
  );
  return { byPoints, byGoals, byAssists };
};

/* ==========================================================================
   RETROSPECTIVA DE UM JOGADOR
   ========================================================================== */
export const computeRetrospective = (
  player,
  players = [],
  matches = [],
  season,
) => {
  const id = String(player.id);
  const seasonStr = String(season);
  const seasonMatches = sortChrono(
    matches.filter((m) => seasonStatMatch(m) && matchSeason(m) === seasonStr),
  );
  const lines = seasonMatches.map((m) => playerLine(m, id)).filter(Boolean);

  const t = {
    games: lines.length,
    wins: 0,
    draws: 0,
    losses: 0,
    goals: 0,
    assists: 0,
    yellow: 0,
    red: 0,
    braces: 0,
    hatTricks: 0,
    gkGames: 0,
    conceded: 0,
    cleanSheets: 0,
  };
  const byMonth = {};
  const partners = {};
  const rivals = {};
  let bestStreakW = 0;
  let curW = 0;
  let bestUnbeaten = 0;
  let curU = 0;

  lines.forEach((l) => {
    if (l.outcome === "W") t.wins += 1;
    else if (l.outcome === "D") t.draws += 1;
    else t.losses += 1;
    t.goals += l.goals;
    t.assists += l.assists;
    t.yellow += l.yellow;
    t.red += l.red;
    if (l.goals >= 3) t.hatTricks += 1;
    else if (l.goals === 2) t.braces += 1;
    if (l.gk) {
      t.gkGames += 1;
      t.conceded += l.gk.conceded;
      if (l.gk.cleanSheet) t.cleanSheets += 1;
    }

    curW = l.outcome === "W" ? curW + 1 : 0;
    curU = l.outcome === "L" ? 0 : curU + 1;
    bestStreakW = Math.max(bestStreakW, curW);
    bestUnbeaten = Math.max(bestUnbeaten, curU);

    const month = Number(matchDay(l.match).slice(5, 7)) - 1;
    if (month >= 0) {
      byMonth[month] = byMonth[month] || {
        goals: 0,
        assists: 0,
        games: 0,
        wins: 0,
      };
      byMonth[month].goals += l.goals;
      byMonth[month].assists += l.assists;
      byMonth[month].games += 1;
      if (l.outcome === "W") byMonth[month].wins += 1;
    }

    l.teammates.forEach((tid) => {
      partners[tid] = partners[tid] || { games: 0, wins: 0 };
      partners[tid].games += 1;
      if (l.outcome === "W") partners[tid].wins += 1;
    });
    l.opponents.forEach((oid) => {
      rivals[oid] = rivals[oid] || { games: 0, losses: 0, wins: 0 };
      rivals[oid].games += 1;
      if (l.outcome === "L") rivals[oid].losses += 1;
      if (l.outcome === "W") rivals[oid].wins += 1;
    });
  });

  const byId = Object.fromEntries(players.map((p) => [String(p.id), p]));

  // Melhor mês (G+A, depois vitórias)
  const monthEntries = Object.entries(byMonth).map(([mIdx, v]) => ({
    month: Number(mIdx),
    ...v,
  }));
  const bestMonth =
    monthEntries.sort(
      (a, b) =>
        b.goals + b.assists - (a.goals + a.assists) ||
        b.wins - a.wins ||
        b.games - a.games,
    )[0] || null;

  // Parceiro: mais vitórias juntos (mín. 3 jogos)
  const partner =
    Object.entries(partners)
      .filter(([pid, v]) => v.games >= 3 && byId[pid] && !byId[pid].isAnonymous)
      .map(([pid, v]) => ({ player: byId[pid], ...v, rate: v.wins / v.games }))
      .sort((a, b) => b.wins - a.wins || b.rate - a.rate)[0] || null;

  // Carrasco: quem mais te derrotou (mín. 3 jogos contra)
  const nemesis =
    Object.entries(rivals)
      .filter(([pid, v]) => v.games >= 3 && byId[pid] && !byId[pid].isAnonymous)
      .map(([pid, v]) => ({
        player: byId[pid],
        ...v,
        rate: v.losses / v.games,
      }))
      .sort((a, b) => b.losses - a.losses || b.rate - a.rate)[0] || null;

  // Jogo mais marcante: gols valem 2, assistências 1, vitória desempata
  const bestMatch =
    [...lines].sort(
      (a, b) =>
        b.goals * 2 + b.assists - (a.goals * 2 + a.assists) ||
        (b.outcome === "W") - (a.outcome === "W") ||
        (b.gk?.cleanSheet ? 1 : 0) - (a.gk?.cleanSheet ? 1 : 0),
    )[0] || null;

  // Presença nos dias que geram falta
  const attendanceDays = [
    ...new Set(
      seasonMatches.filter(countsForAttendance).map((m) => matchDay(m)),
    ),
  ].sort();
  const playedDays = new Set(
    seasonMatches
      .filter((m) => countsForAttendance(m) && playerSide(m, id))
      .map((m) => matchDay(m)),
  );
  let bestPresence = 0;
  let curP = 0;
  attendanceDays.forEach((d) => {
    curP = playedDays.has(d) ? curP + 1 : 0;
    bestPresence = Math.max(bestPresence, curP);
  });

  const { byPoints, byGoals, byAssists } = seasonRanking(
    players,
    matches,
    seasonStr,
  );
  const posOf = (list) => {
    const i = list.findIndex((r) => String(r.player.id) === id);
    return i >= 0 ? i + 1 : null;
  };

  // Contra outros times: amistosos e campeonatos ficam à parte (não entram nos totais acima)
  const competition = (type) => {
    const ls = sortChrono(
      matches.filter(
        (m) =>
          isOfficialMatch(m) &&
          matchType(m) === type &&
          matchSeason(m) === seasonStr,
      ),
    )
      .map((m) => playerLine(m, id))
      .filter(Boolean);
    const c = {
      games: ls.length,
      wins: 0,
      draws: 0,
      losses: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      opponents: [],
    };
    const opp = new Set();
    ls.forEach((l) => {
      if (l.outcome === "W") c.wins += 1;
      else if (l.outcome === "D") c.draws += 1;
      else c.losses += 1;
      c.goals += l.goals;
      c.assists += l.assists;
      if (l.gk?.cleanSheet) c.cleanSheets += 1;
      const other = l.side === "A" ? l.match.teamB : l.match.teamA;
      if (other?.name) opp.add(String(other.name).trim());
    });
    c.opponents = [...opp];
    return c;
  };
  const friendlies = competition("AMISTOSO");
  const championships = competition("CAMPEONATO");

  const points = t.wins * 3 + t.draws;
  return {
    season: seasonStr,
    totals: {
      ...t,
      points,
      winRate: t.games ? Math.round((points / (t.games * 3)) * 100) : 0,
      goalsPerGame: t.games ? (t.goals / t.games).toFixed(2) : "0.00",
      bestWinStreak: bestStreakW,
      bestUnbeaten,
    },
    attendance: {
      days: attendanceDays.length,
      present: playedDays.size,
      rate: attendanceDays.length
        ? Math.round((playedDays.size / attendanceDays.length) * 100)
        : 0,
      bestStreak: bestPresence,
    },
    bestMonth: bestMonth
      ? { ...bestMonth, name: MONTHS[bestMonth.month] }
      : null,
    partner,
    nemesis,
    bestMatch: bestMatch
      ? {
          id: bestMatch.match.id,
          date: matchDay(bestMatch.match),
          score: scoreText(bestMatch.match),
          side: bestMatch.side,
          outcome: bestMatch.outcome,
          goals: bestMatch.goals,
          assists: bestMatch.assists,
          cleanSheet: Boolean(bestMatch.gk?.cleanSheet),
          teamA: bestMatch.match.teamA?.name || "Time A",
          teamB: bestMatch.match.teamB?.name || "Time B",
        }
      : null,
    friendlies,
    championships,
    ranking: {
      position: posOf(byPoints),
      of: byPoints.length,
      scorerPos: t.goals > 0 ? posOf(byGoals) : null,
      assistPos: t.assists > 0 ? posOf(byAssists) : null,
    },
  };
};

/* ==========================================================================
   CONFRONTO DIRETO
   ========================================================================== */
const duelMatches = (matches) =>
  matches.filter(
    (m) => isOfficialMatch(m) && SEASON_STAT_TYPES.includes(matchType(m)),
  );

export const headToHead = (aId, bId, matches = []) => {
  const a = String(aId);
  const b = String(bId);
  const res = {
    against: 0,
    winsA: 0,
    winsB: 0,
    draws: 0,
    goalsA: 0,
    goalsB: 0,
    together: 0,
    togetherWins: 0,
    last: null,
  };
  sortChrono(duelMatches(matches)).forEach((m) => {
    const la = playerLine(m, a);
    const lb = playerLine(m, b);
    if (!la || !lb) return;
    if (la.side !== lb.side) {
      res.against += 1;
      res.goalsA += la.goals;
      res.goalsB += lb.goals;
      if (la.outcome === "W") res.winsA += 1;
      else if (lb.outcome === "W") res.winsB += 1;
      else res.draws += 1;
      res.last = {
        id: m.id,
        date: matchDay(m),
        winner: la.outcome === "W" ? "A" : lb.outcome === "W" ? "B" : null,
      };
    } else {
      res.together += 1;
      if (la.outcome === "W") res.togetherWins += 1;
    }
  });
  return res;
};

/** Sorteia uma dupla que já se enfrentou pelo menos `minGames` vezes */
export const randomRivalPair = (
  players = [],
  matches = [],
  minGames = 3,
  exclude = null,
) => {
  const active = new Set(
    players.filter((p) => !p.isAnonymous).map((p) => String(p.id)),
  );
  const pairs = {};
  duelMatches(matches).forEach((m) => {
    const A = participantsOf(m, "A").filter((id) => active.has(id));
    const B = participantsOf(m, "B").filter((id) => active.has(id));
    A.forEach((x) =>
      B.forEach((y) => {
        const key = x < y ? `${x}|${y}` : `${y}|${x}`;
        pairs[key] = (pairs[key] || 0) + 1;
      }),
    );
  });
  let list = Object.entries(pairs).filter(([, n]) => n >= minGames);
  if (exclude) list = list.filter(([k]) => k !== exclude);
  if (list.length === 0) return null;
  const [key] = list[Math.floor(Math.random() * list.length)];
  const [x, y] = key.split("|");
  return { aId: x, bId: y, key };
};

/* ==========================================================================
   RECORDES DO CLUBE
   ========================================================================== */
export const computeRecords = (players = [], matches = [], season = null) => {
  const byId = Object.fromEntries(players.map((p) => [String(p.id), p]));
  const valid = sortChrono(
    matches.filter(
      (m) =>
        isOfficialMatch(m) && (!season || matchSeason(m) === String(season)),
    ),
  );

  const recs = [];
  const best = (key, value, data) => {
    if (value <= 0) return;
    const cur = recs.find((r) => r.key === key);
    if (!cur || value > cur.value) {
      const idx = recs.findIndex((r) => r.key === key);
      const rec = { key, value, holders: [data] };
      if (idx >= 0) recs[idx] = rec;
      else recs.push(rec);
    } else if (value === cur.value && cur.holders.length < 3) {
      cur.holders.push(data);
    }
  };

  // Recordes por partida
  valid.forEach((m) => {
    const { a, b } = countMatchGoals(m);
    const matchRef = {
      matchId: m.id,
      date: matchDay(m),
      score: `${a}×${b}`,
      teamA: m.teamA?.name,
      teamB: m.teamB?.name,
    };
    best("biggestWin", Math.abs(a - b), matchRef);
    best("mostGoalsMatch", a + b, matchRef);

    const perPlayer = {};
    (m.events || []).forEach((e) => {
      const pid =
        e.playerId && byId[String(e.playerId)] ? String(e.playerId) : null;
      const aid =
        e.assistId && byId[String(e.assistId)] ? String(e.assistId) : null;
      if (e.type === "GOAL" && pid) {
        perPlayer[pid] = perPlayer[pid] || { g: 0, a: 0 };
        perPlayer[pid].g += 1;
      }
      if (e.type === "GOAL" && aid) {
        perPlayer[aid] = perPlayer[aid] || { g: 0, a: 0 };
        perPlayer[aid].a += 1;
      }
    });
    Object.entries(perPlayer).forEach(([pid, v]) => {
      best("goalsInMatch", v.g, { playerId: pid, ...matchRef });
      best("assistsInMatch", v.a, { playerId: pid, ...matchRef });
    });
  });

  // Recordes por jogador (sequências e totais)
  players
    .filter((p) => !p.isAnonymous)
    .forEach((p) => {
      const id = String(p.id);
      let curW = 0;
      let curU = 0;
      let curS = 0;
      let bestW = 0;
      let bestU = 0;
      let bestS = 0;
      let goals = 0;
      let assists = 0;
      let games = 0;
      let cleanSheets = 0;
      valid.forEach((m) => {
        const l = playerLine(m, id);
        if (!l) return;
        games += 1;
        goals += l.goals;
        assists += l.assists;
        if (l.gk?.cleanSheet) cleanSheets += 1;
        curW = l.outcome === "W" ? curW + 1 : 0;
        curU = l.outcome === "L" ? 0 : curU + 1;
        curS = l.goals > 0 ? curS + 1 : 0;
        bestW = Math.max(bestW, curW);
        bestU = Math.max(bestU, curU);
        bestS = Math.max(bestS, curS);
      });
      const ref = { playerId: id };
      best("winStreak", bestW, ref);
      best("scoringStreak", bestS, ref);
      best("topScorer", goals, ref);
      best("topAssist", assists, ref);
      best("mostGames", games, ref);
      best("cleanSheets", cleanSheets, ref);
    });

  const META = {
    topScorer: { label: "Artilheiro", unit: "gols", group: "Totais" },
    topAssist: { label: "Garçom", unit: "assistências", group: "Totais" },
    mostGames: { label: "Mais jogos", unit: "jogos", group: "Totais" },
    cleanSheets: {
      label: "Paredão",
      unit: "jogos sem sofrer gol",
      group: "Totais",
    },
    goalsInMatch: {
      label: "Mais gols numa partida",
      unit: "gols",
      group: "Numa partida",
    },
    assistsInMatch: {
      label: "Mais assistências numa partida",
      unit: "assistências",
      group: "Numa partida",
    },
    biggestWin: {
      label: "Maior goleada",
      unit: "gols de diferença",
      group: "Numa partida",
    },
    mostGoalsMatch: {
      label: "Jogo com mais gols",
      unit: "gols",
      group: "Numa partida",
    },
    winStreak: {
      label: "Maior sequência de vitórias",
      unit: "vitórias seguidas",
      group: "Sequências",
    },
    scoringStreak: {
      label: "Marcando em sequência",
      unit: "jogos seguidos com gol",
      group: "Sequências",
    },
  };
  const ORDER = Object.keys(META);

  return recs
    .filter((r) => META[r.key])
    .sort((x, y) => ORDER.indexOf(x.key) - ORDER.indexOf(y.key))
    .map((r) => ({
      ...r,
      ...META[r.key],
      holders: r.holders.map((h) => ({
        ...h,
        player: h.playerId ? byId[h.playerId] : null,
      })),
    }));
};
