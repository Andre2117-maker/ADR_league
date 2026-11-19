/* ==========================================================================
   HALL DA FAMA — fonte única dos prêmios da temporada
   - Os prêmios ficam em `awards/{ano}` no Firestore:
       { year, items: [{ id, title, icon, color, winner, playerId, detail }] }
   - O Hall da Fama (AwardsCard) e a página do jogador (PlayerPage /
     PlayerAdminMode) usam ESTE arquivo, então:
       · deu o prêmio num lugar  → aparece nos dois
       · tirou o prêmio num lugar → some dos dois
   ========================================================================== */
import { useEffect, useState } from "react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase"; // ajuste o caminho se necessário

/* ---------- modelos (antes ficavam no AwardsCard) ---------- */
export const PALETTE = ["#d4af37", "#4caf50", "#ff9800", "#e53935", "#2196f3", "#9c27b0", "#00bcd4"];

export const DEFAULT_TEMPLATE = () => [
  { id: "mvp", title: "MVP da Temporada", icon: "trophy", color: "#d4af37" },
  { id: "gk", title: "Paredão do Ano", icon: "glove", color: "#4caf50" },
  { id: "puskas", title: "Puskás ADR", icon: "fire", color: "#ff9800" },
  { id: "scorer", title: "Artilheiro", icon: "ball", color: "#e53935" },
  { id: "assist", title: "Líder de Assistências", icon: "target", color: "#2196f3" },
];

// Dados que já existiam antes de ir para o banco
export const SEED = {
  2025: [
    { id: "mvp", title: "MVP da Temporada", icon: "trophy", color: "#d4af37", winner: "Davi" },
    { id: "gk", title: "Paredão do Ano", icon: "glove", color: "#4caf50", winner: "Thaiane" },
    { id: "puskas", title: "Puskás ADR", icon: "fire", color: "#ff9800", winner: "Renzo" },
  ],
};

export const makeId = () => Math.random().toString(36).slice(2, 9);

export const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/* ícones: o Hall usa "medal" e "boot", a página do jogador usa "gold" e "silver" */
const AWARD_TO_ACH = { medal: "gold", boot: "ball" };
const ACH_TO_AWARD = { gold: "medal", silver: "medal" };
export const awardIconToAch = (k) => AWARD_TO_ACH[k] || k || "trophy";
export const achIconToAward = (k) => ACH_TO_AWARD[k] || k || "trophy";

/* ---------- cache compartilhado (todas as telas veem a mesma coisa) ---------- */
let cache = null; // { [ano]: items[] }
let loading = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(cache));

export const loadAwards = async (force = false) => {
  if (cache && !force) return cache;
  if (!loading || force) {
    loading = getDocs(collection(db, "awards"))
      .then((snap) => {
        const loaded = {};
        snap.forEach((d) => {
          const v = d.data();
          if (Array.isArray(v.items)) loaded[d.id] = v.items;
        });
        cache = loaded;
        emit();
        return cache;
      })
      .catch((err) => {
        console.error("Erro ao carregar premiações:", err);
        cache = cache || {};
        return cache;
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
};

/** Hook: devolve { [ano]: items[] } do banco e atualiza sozinho após salvar */
export const useAwards = () => {
  const [data, setData] = useState(cache || {});
  useEffect(() => {
    listeners.add(setData);
    loadAwards().then((d) => setData(d));
    return () => listeners.delete(setData);
  }, []);
  return data;
};

/** Itens de um ano (banco > SEED > modelo padrão) */
export const itemsForYear = (data, year) =>
  (data || {})[year] || SEED[year] || DEFAULT_TEMPLATE();

/** Grava a lista inteira de um ano */
export const saveYear = async (year, items) => {
  const y = Number(year);
  await setDoc(doc(db, "awards", String(y)), { year: y, items });
  cache = { ...(cache || {}), [y]: items };
  emit();
};

/* ---------- ligação com o jogador ---------- */
const isWinner = (it, player) => {
  if (!it.winner || !player) return false;
  if (it.playerId) return String(it.playerId) === String(player.id);
  const n = norm(it.winner);
  const name = norm(player.name);
  return name === n || name.split(" ")[0] === n;
};

/** Todos os prêmios do Hall que um jogador ganhou (mais recentes primeiro) */
export const awardsForPlayer = (data, player) => {
  if (!player) return [];
  const years = new Set([...Object.keys(data || {}), ...Object.keys(SEED)].map(Number));
  const out = [];
  [...years]
    .sort((a, b) => b - a)
    .forEach((year) => {
      itemsForYear(data, year).forEach((it) => {
        if (isWinner(it, player)) out.push({ ...it, year });
      });
    });
  return out;
};

/** Tira o vencedor de um prêmio (o prêmio continua no Hall como "A definir") */
export const clearAward = async (year, itemId) => {
  const data = await loadAwards();
  const items = itemsForYear(data, year).map((it) =>
    it.id === itemId ? { ...it, winner: "", playerId: "", detail: "" } : it,
  );
  await saveYear(year, items);
};

/**
 * Dá um prêmio do Hall para o jogador.
 * Se já existe um prêmio com o mesmo nome no ano, só troca o vencedor;
 * senão cria o prêmio novo nesse ano.
 */
export const giveAward = async (year, { title, icon, color, detail = "" }, player) => {
  const data = await loadAwards();
  const base = itemsForYear(data, year);
  const t = norm(title);
  const existing = base.find((it) => norm(it.title) === t);
  const winner = { winner: player.name, playerId: String(player.id), detail };

  const items = existing
    ? base.map((it) => (it.id === existing.id ? { ...it, ...winner } : it))
    : [
        ...base,
        {
          id: makeId(),
          title: title.trim(),
          icon: achIconToAward(icon),
          color: color || PALETTE[base.length % PALETTE.length],
          ...winner,
        },
      ];
  await saveYear(year, items);
};

/**
 * Esconde da página do jogador as conquistas manuais que repetem um prêmio do Hall
 * (ex.: "MVP da Temporada 2025" digitado à mão + o mesmo prêmio no Hall)
 */
export const isDuplicateOfHall = (ach, hallList) => {
  const t = norm(ach?.title);
  return hallList.some((h) => {
    const ht = norm(h.title);
    return t === ht || t === `${ht} ${h.year}` || (t.includes(ht) && t.includes(String(h.year)));
  });
};
