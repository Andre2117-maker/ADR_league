/* ==========================================================================
   CLASSIFICAÇÃO EM QUALQUER MOMENTO DA TEMPORADA
   Mesmas regras da tabela da Home:
   - TREINO + EVENTO oficial (isOfficial !== false)
   - ordem das partidas por createdAt
   - pontos > gols > assistências > nome (gols/assist. somam o manual de 2026)
   ========================================================================== */

export const isRankingMatch = (m) => {
  const type = String(m?.type || "TREINO").toUpperCase();
  return type === "TREINO" || (type === "EVENTO" && m.isOfficial !== false);
};

const inList = (list, id) => (list || []).some((x) => String(x) === id);

const createdSec = (m) =>
  m?.createdAt?.seconds ??
  (m?.createdAt ? new Date(m.createdAt).getTime() / 1000 : 0);

/* Partidas da classificação em ordem cronológica (igual à Home) */
export const rankingMatchesInOrder = (matches = []) =>
  matches.filter(isRankingMatch).sort((a, b) => createdSec(a) - createdSec(b));

/* Resultado de cada jogador numa partida: "W" | "D" | "L" */
export const matchResults = (m) => {
  const goalsA = (m.events || []).filter(
    (e) =>
      (e.type === "GOAL" && e.team === "A") ||
      (e.type === "OWN_GOAL" && e.team === "B"),
  ).length;
  const goalsB = (m.events || []).filter(
    (e) =>
      (e.type === "GOAL" && e.team === "B") ||
      (e.type === "OWN_GOAL" && e.team === "A"),
  ).length;
  const winner = String(m.penaltiesWinner || m.winner || "").toUpperCase();

  const ids = new Set(
    [
      ...(m.teamA?.players || []),
      ...(m.teamB?.players || []),
      ...(m.actualParticipantsA || []),
      ...(m.actualParticipantsB || []),
    ].map(String),
  );

  const out = {};
  ids.forEach((id) => {
    const isA =
      inList(m.teamA?.players, id) || inList(m.actualParticipantsA, id);
    const side = isA ? "A" : "B";
    let res;
    if (winner) res = winner === side ? "W" : "L";
    else if (goalsA === goalsB) res = "D";
    else res = goalsA > goalsB === isA ? "W" : "L";
    out[id] = { side, res };
  });
  return out;
};

/* Pontos / gols / assistências de um conjunto de partidas */
export const tallyMatches = (list) => {
  const t = {};
  const get = (id) => (t[id] = t[id] || { points: 0, goals: 0, assists: 0 });
  list.forEach((m) => {
    const results = matchResults(m);
    Object.entries(results).forEach(([id, { res }]) => {
      get(id).points += res === "W" ? 3 : res === "D" ? 1 : 0;
    });
    (m.events || []).forEach((e) => {
      if (e.type === "GOAL" && e.playerId) get(String(e.playerId)).goals += 1;
      if (e.type === "GOAL" && e.assistId) get(String(e.assistId)).assists += 1;
      if (e.type === "ASSIST" && e.playerId)
        get(String(e.playerId)).assists += 1;
    });
  });
  return t;
};

/* Classificação ({id: posição}) a partir de um conjunto de partidas */
export const rankFrom = (players = [], list = []) => {
  const t = tallyMatches(list);
  const rows = players
    .filter((p) => !p.isAnonymous)
    .map((p) => {
      const id = String(p.id);
      const manual = p.statsBySeason?.["2026"] || {};
      const s = t[id] || { points: 0, goals: 0, assists: 0 };
      return {
        id,
        name: p.name || "",
        points: s.points,
        goals: s.goals + Number(manual.goals || 0),
        assists: s.assists + Number(manual.assists || 0),
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goals - a.goals ||
        b.assists - a.assists ||
        a.name.localeCompare(b.name, "pt-BR"),
    );
  const pos = {};
  rows.forEach((r, i) => {
    pos[r.id] = { position: i + 1, points: r.points };
  });
  return { pos, total: rows.length };
};

/* Posição de cada jogador antes e depois de uma partida */
export const rankingAroundMatch = (players, matches, match) => {
  if (!match || !isRankingMatch(match)) return null;
  const ordered = rankingMatchesInOrder(matches);
  const idx = ordered.findIndex((m) => m.id === match.id);
  if (idx === -1) return null;

  const before = rankFrom(players, ordered.slice(0, idx));
  const after = rankFrom(players, ordered.slice(0, idx + 1));
  return {
    before: before.pos,
    after: after.pos,
    total: after.total,
    results: matchResults(match),
  };
};
