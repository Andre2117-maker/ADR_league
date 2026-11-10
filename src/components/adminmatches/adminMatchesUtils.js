/* ==========================================================================
   ADMIN MATCHES — CONSTANTES E FUNÇÕES PURAS
   (tudo que não é tela fica aqui; os componentes só importam)
   ========================================================================== */

export const DRAFT_KEY = "adr_admin_match_draft_v1";

export const MATCH_TYPES = [
  { id: "TREINO", icon: "🏟️", label: "Treino", hint: "Interno" },
  { id: "AMISTOSO", icon: "🤝", label: "Amistoso", hint: "Contra externo" },
  { id: "CAMPEONATO", icon: "🏆", label: "Campeonato", hint: "Contra externo" },
  { id: "EVENTO", icon: "🎉", label: "Evento", hint: "Especial" },
];

export const EVENT_THEMES = [
  { id: "NATAL", label: "🎄 Natal" },
  { id: "HALLOWEEN", label: "🎃 Halloween" },
  { id: "ANIVERSARIO_ADR", label: "👑 Aniversário d'O ADR" },
  { id: "CONFRATERNIZACAO", label: "🥳 Confraternização" },
  { id: "OUTRO", label: "✨ Outro" },
];

export const CHAMP_PHASES = [
  "Fase de Grupos",
  "Oitavas de Final",
  "Quartas de Final",
  "Semifinal",
  "Final",
];

export const STEPS = [
  { id: "setup", label: "Jogo", icon: "⚙️" },
  { id: "A", label: "Time A", icon: "🅰️" },
  { id: "B", label: "Time B", icon: "🅱️" },
  { id: "events", label: "Lances", icon: "⚽" },
  { id: "finish", label: "Fim", icon: "✅" },
];

export const EVENT_META = {
  GOAL: { icon: "⚽", label: "Gol" },
  OWN_GOAL: { icon: "⚠️", label: "Gol contra" },
  YELLOW: { icon: "🟨", label: "Amarelo" },
  RED: { icon: "🟥", label: "Vermelho" },
  SUB: { icon: "🔄", label: "Substituição" },
  GK_CHANGE: { icon: "🧤", label: "Troca de goleiro" },
};

export const CARD_REASONS = [
  "Falta dura",
  "Reclamação",
  "Mão na bola",
  "Antijogo",
  "Briga",
];

export const EXTERNAL_IDS = ["EXTERNO", "OPONENTE_EXTERNO"];
export const isExternalId = (id) => EXTERNAL_IDS.includes(id);
export const isExternalMatch = (type) =>
  type === "AMISTOSO" || type === "CAMPEONATO";

export const teamKeyOf = (side) => (side === "A" ? "teamA" : "teamB");
export const otherSide = (side) => (side === "A" ? "B" : "A");

/* ---------- Texto ---------- */
export const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const fmtClock = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** "12" -> "12'", "45+2" -> "45+2'", "" -> "" */
export const normalizeMinute = (raw) => {
  const v = String(raw || "")
    .trim()
    .replace(/[’'`´]+/g, "");
  return v ? `${v}'` : "";
};

export const todayISO = () => {
  const hoje = new Date();
  const offset = hoje.getTimezoneOffset() * 60000;
  return new Date(hoje.getTime() - offset).toISOString().split("T")[0];
};

/* ---------- Rascunho ---------- */
export const emptyDraft = (date) => ({
  date,
  venue: "",
  championshipPhase: "",
  teamA: {
    name: "ADR",
    players: [],
    goalkeeperId: null,
    captainId: null,
    logo: "",
  },
  teamB: {
    name: "ADR",
    players: [],
    goalkeeperId: null,
    externalGoalkeeperName: "",
    captainId: null,
    logo: "",
  },
  events: [],
  goldenGoalWinner: null,
  penaltiesWinner: null,
  penaltiesScoreA: "",
  penaltiesScoreB: "",
  penalties: { A: [], B: [] },
});

export const readSavedDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const d = saved?.draft;
    if (!d) return null;
    const meaningful =
      (d.events?.length || 0) > 0 ||
      (d.teamA?.players?.length || 0) > 0 ||
      (d.teamB?.players?.length || 0) > 0 ||
      !!d.venue;
    return meaningful ? saved : null;
  } catch {
    return null;
  }
};

export const writeSavedDraft = (data) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* sem espaço ou storage bloqueado */
  }
};

export const clearSavedDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* sem storage */
  }
};

/* ---------- Placar / vencedor ---------- */
export const countGoals = (events = []) => {
  let a = 0;
  let b = 0;
  events.forEach((e) => {
    if ((e.team === "A" && e.type === "GOAL") || (e.team === "B" && e.type === "OWN_GOAL")) a += 1;
    if ((e.team === "B" && e.type === "GOAL") || (e.team === "A" && e.type === "OWN_GOAL")) b += 1;
  });
  return { a, b };
};

const penResult = (p) => (typeof p === "object" && p ? p.result : p);

export const penaltyGoals = (penalties, side) =>
  (penalties?.[side] || []).filter((p) => penResult(p) === "goal").length;

export const penaltyResult = penResult;

/** Retorna { winner: "A"|"B"|null, how: "normal"|"golden"|"penalties"|null } */
export const computeWinner = ({ goalsA, goalsB, goldenGoalWinner, pensA, pensB }) => {
  if (goldenGoalWinner) return { winner: goldenGoalWinner, how: "golden" };
  if (goalsA > goalsB) return { winner: "A", how: "normal" };
  if (goalsB > goalsA) return { winner: "B", how: "normal" };
  if (pensA > pensB) return { winner: "A", how: "penalties" };
  if (pensB > pensA) return { winner: "B", how: "penalties" };
  return { winner: null, how: null };
};

/* ---------- Escalação ao vivo ---------- */
/** Quem começou, quem entrou, quem saiu e quem participou, por lado. */
export const buildLineups = (draft) => {
  const out = {};
  ["A", "B"].forEach((side) => {
    const starters = draft[teamKeyOf(side)]?.players || [];
    const onField = new Set(starters);
    const cameIn = new Set();
    const wentOut = new Set();
    (draft.events || []).forEach((e) => {
      if (e.type === "SUB" && e.team === side) {
        if (e.playerOutId) {
          onField.delete(e.playerOutId);
          wentOut.add(e.playerOutId);
        }
        if (e.playerInId) {
          onField.add(e.playerInId);
          cameIn.add(e.playerInId);
        }
      }
    });
    out[side] = {
      starters,
      onField,
      cameIn,
      wentOut,
      participants: new Set([...starters, ...cameIn]),
    };
  });
  return out;
};

/** Goleiro no gol agora (titular + trocas na ordem dos lances). */
export const currentGoalkeeper = (draft, side) => {
  const team = draft[teamKeyOf(side)] || {};
  let cur = team.goalkeeperId
    ? { id: team.goalkeeperId, name: null }
    : team.externalGoalkeeperName
      ? { id: null, name: team.externalGoalkeeperName }
      : null;
  (draft.events || []).forEach((e) => {
    if (e.type === "GK_CHANGE" && e.team === side) {
      cur = e.playerInId
        ? { id: e.playerInId, name: null }
        : { id: null, name: e.externalName };
    }
  });
  return cur;
};

/** Estatística do jogador nesta partida: { [id]: {goals, assists, og, yellow, red} } */
export const playerMatchStats = (events = []) => {
  const map = {};
  const get = (id) => {
    if (!map[id]) map[id] = { goals: 0, assists: 0, og: 0, yellow: 0, red: 0 };
    return map[id];
  };
  events.forEach((e) => {
    if (!e.playerId || isExternalId(e.playerId)) {
      // assistência de externo é nome, não id: ignora
    } else if (e.type === "GOAL") get(e.playerId).goals += 1;
    else if (e.type === "OWN_GOAL") get(e.playerId).og += 1;
    else if (e.type === "YELLOW") get(e.playerId).yellow += 1;
    else if (e.type === "RED") get(e.playerId).red += 1;

    if (e.type === "GOAL" && e.assistId && !isExternalId(e.playerId)) {
      get(e.assistId).assists += 1;
    }
  });
  return map;
};

export const playerName = (playersById, id, externalName) => {
  if (!id) return externalName || "";
  if (isExternalId(id)) return externalName || "Adversário";
  return playersById[id]?.name || externalName || "Jogador";
};

/* ---------- Imagem ---------- */
export const compressLogoImage = (file, maxSize = 160) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", 0.8));
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
