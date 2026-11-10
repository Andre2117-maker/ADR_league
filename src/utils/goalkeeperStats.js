/* ==========================================================================
   ESTATÍSTICAS DE GOLEIRO POR PARTIDA  (colocar em src/utils/goalkeeperStats.js)

   Regra: cada gol sofrido conta para o goleiro que estava no gol NA HORA do
   gol, seguindo a ORDEM da lista de lances (match.events).

   - Começa com o goleiro titular do time (goalkeeperId / externalGoalkeeperName)
   - Lance { type: "GK_CHANGE", team, playerInId | externalName } troca o goleiro
   - Sofre gol: gol do adversário (GOAL) ou gol contra do próprio time (OWN_GOAL)
   - Pênaltis da disputa NÃO entram (não são lances da lista)
   - cleanSheet: o time inteiro não sofreu gol, todo goleiro que jogou ganha
   - Partidas antigas (sem GK_CHANGE) caem no caso de um goleiro só
   ========================================================================== */

const keyOf = (g) => (g ? (g.id ? `id:${g.id}` : `ext:${g.name}`) : null);

const makeGk = (id, name) => {
  if (id) return { id, name: null };
  const n = String(name || "").trim();
  return n ? { id: null, name: n } : null;
};

export function computeGkStats(match) {
  const events = match?.events || [];
  const out = {};

  ["A", "B"].forEach((side) => {
    const team = side === "A" ? match?.teamA : match?.teamB;
    const opp = side === "A" ? "B" : "A";

    const entries = new Map();
    const touch = (g) => {
      if (!g) return null;
      const k = keyOf(g);
      if (!entries.has(k)) entries.set(k, { ...g, conceded: 0, cleanSheet: false });
      return entries.get(k);
    };

    let current = touch(makeGk(team?.goalkeeperId, team?.externalGoalkeeperName));
    let teamConceded = 0;

    events.forEach((e) => {
      if (e.type === "GK_CHANGE" && e.team === side) {
        current = touch(makeGk(e.playerInId, e.externalName)) || current;
        return;
      }
      const conceded =
        (e.team === opp && e.type === "GOAL") ||
        (e.team === side && e.type === "OWN_GOAL");
      if (conceded) {
        teamConceded += 1;
        if (current) current.conceded += 1;
      }
    });

    const list = Array.from(entries.values()).map((g) => ({
      ...g,
      cleanSheet: teamConceded === 0,
    }));

    out[side] = list;
  });

  return out;
}

/** Usa o resumo gravado na partida; se não houver (partida antiga), calcula. */
export function getGkStats(match) {
  return match?.gkStats || computeGkStats(match);
}
