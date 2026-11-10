/* ==========================================================================
   REGRAS ÚNICAS DE ESTATÍSTICA (colocar em src/utils/matchStats.js)
   Use estas funções em qualquer lugar que conte gols, jogos ou goleiro,
   assim a aba Estatísticas, o dashboard e os rankings dão sempre o mesmo número.
   ========================================================================== */
import { getGkStats } from "./goalkeeperStats";

/** Temporada mostrada na aba Estatísticas */
export const CURRENT_SEASON = "2026";

/** Tipos de partida que entram nos rankings da temporada (artilharia, assistências) */
export const SEASON_STAT_TYPES = ["TREINO", "EVENTO"];

export const matchType = (m) => String(m?.type || "TREINO").toUpperCase();

/** "Contar como partida oficial": partidas antigas (sem o campo) contam */
export const isOfficialMatch = (m) => m?.isOfficial !== false;

export const matchYear = (m) => String(m?.date || "").slice(0, 4);

/** Quem jogou por um lado: titulares + quem entrou (actualParticipants) */
export const participantsOf = (m, side) => {
  const key = side === "A" ? "actualParticipantsA" : "actualParticipantsB";
  const team = side === "A" ? m?.teamA : m?.teamB;
  const list =
    Array.isArray(m?.[key]) && m[key].length ? m[key] : team?.players || [];
  return list.map(String);
};

/** "A", "B" ou null */
export const playerSide = (m, playerId) => {
  const id = String(playerId);
  if (participantsOf(m, "A").includes(id)) return "A";
  if (participantsOf(m, "B").includes(id)) return "B";
  return null;
};

export const countMatchGoals = (m) => {
  let a = 0;
  let b = 0;
  (m?.events || []).forEach((e) => {
    if ((e.type === "GOAL" && e.team === "A") || (e.type === "OWN_GOAL" && e.team === "B")) a += 1;
    if ((e.type === "GOAL" && e.team === "B") || (e.type === "OWN_GOAL" && e.team === "A")) b += 1;
  });
  return { a, b };
};

/**
 * Linha de goleiro do jogador nesta partida (respeita trocas de goleiro).
 * Retorna { side, conceded, cleanSheet } ou null se ele não foi ao gol.
 */
export const playerGkLine = (m, playerId) => {
  const id = String(playerId);
  const gk = getGkStats(m);
  for (const side of ["A", "B"]) {
    const line = (gk?.[side] || []).find((g) => g.id && String(g.id) === id);
    if (line) return { side, conceded: line.conceded, cleanSheet: line.cleanSheet };
  }
  return null;
};
