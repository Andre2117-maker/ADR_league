/* ==========================================================================
   TABELA DE UMA TEMPORADA
   Mesma conta da Classificação Geral (Home / RankingTable):
   - contam TREINO + EVENTO oficial
   - vitória 3, empate 1, derrota 0 (campo winner/penaltiesWinner manda; senão o placar)
   - gols, assistências e jogos manuais da temporada (statsBySeason[ano]) somam
   - desempate: pontos > gols > assistências > nome
   ========================================================================== */

const has = (list, id) => (list || []).some((x) => String(x) === id);

// "AAAA-MM-DD" de qualquer formato de data das partidas
export const dayOf = (m) => {
  const d = m?.date;
  if (!d) return "";
  if (typeof d === "string") {
    const iso = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[0];
    const br = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (br)
      return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
  }
  const dt =
    typeof d?.toDate === "function"
      ? d.toDate()
      : d?.seconds
        ? new Date(d.seconds * 1000)
        : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

export const isRankingMatch = (m) => {
  const type = String(m.type || "TREINO").toUpperCase();
  return type === "TREINO" || (type === "EVENTO" && m.isOfficial !== false);
};

const scoreOf = (m) => {
  const ev = m.events || [];
  const a = ev.filter(
    (e) =>
      (e.type === "GOAL" && e.team === "A") ||
      (e.type === "OWN_GOAL" && e.team === "B"),
  ).length;
  const b = ev.filter(
    (e) =>
      (e.type === "GOAL" && e.team === "B") ||
      (e.type === "OWN_GOAL" && e.team === "A"),
  ).length;
  return [a, b];
};

/** partidas que entram na tabela de um ano
 *  (no ano atual, partidas sem data também entram, como na Home) */
export const seasonMatches = (matches, year, isCurrent) =>
  (matches || []).filter((m) => {
    if (!isRankingMatch(m)) return false;
    const d = dayOf(m);
    if (!d) return isCurrent;
    return d.slice(0, 4) === String(year);
  });

/** linhas da tabela, já ordenadas */
export const buildSeasonTable = (players, matches, year) => {
  const y = String(year);
  return (players || [])
    .filter((p) => !p.isAnonymous)
    .map((p) => {
      const id = String(p.id);
      let goals = 0;
      let assists = 0;
      let games = 0;
      let wins = 0;
      let draws = 0;
      let losses = 0;

      matches.forEach((m) => {
        const isA = has(m.teamA?.players, id) || has(m.actualParticipantsA, id);
        const isB = has(m.teamB?.players, id) || has(m.actualParticipantsB, id);
        if (!isA && !isB) return;
        games++;
        const side = isA ? "A" : "B";

        (m.events || []).forEach((e) => {
          if (e.type === "GOAL" && String(e.playerId) === id) goals++;
          if (
            (e.type === "ASSIST" && String(e.playerId) === id) ||
            (e.type === "GOAL" && String(e.assistId) === id)
          )
            assists++;
        });

        const winner = m.penaltiesWinner || m.winner;
        if (winner) {
          if (String(winner).toUpperCase() === side) wins++;
          else losses++;
        } else {
          const [ga, gb] = scoreOf(m);
          if (ga === gb) draws++;
          else if ((ga > gb && isA) || (gb > ga && !isA)) wins++;
          else losses++;
        }
      });

      const manual = p.statsBySeason?.[y] || {};
      return {
        id,
        name: p.name || "",
        photo: p.photo || "",
        points: wins * 3 + draws,
        goals: goals + Number(manual.goals || 0),
        assists: assists + Number(manual.assists || 0),
        games: games + Number(manual.matches ?? manual.games ?? 0),
        wins,
        draws,
        losses,
      };
    })
    .filter((r) => r.games > 0 || r.goals > 0 || r.assists > 0)
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goals - a.goals ||
        b.assists - a.assists ||
        a.name.localeCompare(b.name, "pt-BR"),
    )
    .map((r, i) => ({ ...r, pos: i + 1 }));
};

/** tabela só de gols (como era em 2025), a partir do statsBySeason do jogador.
 *  Aqui os anônimos ENTRAM: em 2025 ainda não existia a regra de esconder ninguém. */
export const buildGoalsTable = (players, year) => {
  const y = String(year);
  return (players || [])
    .map((p) => {
      const s = p.statsBySeason?.[y] || {};
      return {
        id: String(p.id),
        name: p.name || "",
        photo: p.photo || "",
        goals: Number(s.goals || 0),
        assists: Number(s.assists || 0),
        games: Number(s.matches ?? s.games ?? 0),
      };
    })
    .filter((r) => r.goals > 0)
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, "pt-BR"))
    .map((r, i) => ({ ...r, pos: i + 1 }));
};
