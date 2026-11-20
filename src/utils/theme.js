/* ==========================================================================
   TEMAS DO SITE: "ADR" (escuro e dourado) | "IDR" (preto e branco) |
                  "CLASSIC" (primeiro escudo: roxo -> vermelho) |
                  "AERO" (secreto: bolhas e ondas, liberado por código)
   ========================================================================== */
export const THEMES = ["ADR", "IDR", "CLASSIC", "AERO"];
const KEY = "app-theme";
const AERO_KEY = "adr-aero-unlocked";

/* ---------- tema secreto ---------- */
// aceita "Frutiger Aero", "FRUTIGER-AERO", "frutigeraero"...
const normalize = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const checkSecretCode = (code) => normalize(code) === "frutigeraero";

export const isAeroUnlocked = () => {
  try {
    return window.localStorage.getItem(AERO_KEY) === "1";
  } catch {
    return false;
  }
};

export const unlockAero = () => {
  try {
    window.localStorage.setItem(AERO_KEY, "1");
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
};

/* tranca de novo (botão "Trancar" em Configurações). Se o tema estava em
   uso, volta para o ADR. */
export const lockAero = () => {
  try {
    window.localStorage.removeItem(AERO_KEY);
    if (window.localStorage.getItem(KEY) === "AERO")
      window.localStorage.setItem(KEY, "ADR");
  } catch {
    /* sem armazenamento */
  }
  if (document.body.classList.contains("theme-aero")) applyTheme("ADR");
};

/* ---------- fundo do tema: BOLHAS E ONDAS ----------
   Camadas presas atrás de todo o site (criadas aqui pelo JS, então nenhum
   CSS de página consegue cobrir):
     #aero-sky        degradê céu -> mar
     #aero-aura-1..2  auras coloridas (verde, verde-limão, turquesa) flutuando
     #aero-wave-1..3  três ondas no pé da tela, cada uma numa velocidade
     #aero-bubbles    bolhas subindo (entre as ondas: saem de dentro da água) */
const SKY_ID = "aero-sky";
const BUBBLES_ID = "aero-bubbles";
const AURA_ID = "aero-aura";
const WAVE_ID = "aero-wave";
const STYLE_ID = "aero-sky-style";

const SKY_CSS = `
#${SKY_ID}, #${BUBBLES_ID}, #${AURA_ID}-1, #${AURA_ID}-2,
#${WAVE_ID}-1, #${WAVE_ID}-2, #${WAVE_ID}-3 {
  position: fixed !important; inset: 0; z-index: -1; pointer-events: none;
  display: block !important; visibility: visible !important; margin: 0 !important;
}
#${SKY_ID} {
  background:
    radial-gradient(ellipse 70% 40% at 50% -5%, rgba(255,255,255,0.55), transparent 70%),
    radial-gradient(ellipse 20% 6% at 15% 8%, rgba(255,255,255,0.7), transparent 70%),
    radial-gradient(ellipse 16% 5% at 80% 12%, rgba(255,255,255,0.55), transparent 70%),
    linear-gradient(180deg, #9fe4ff 0%, #4fc6f0 30%, #1a9ad8 62%, #0b6fae 100%);
}
/* auras: manchas de luz bem desfocadas que passeiam devagar */
#${AURA_ID}-1, #${AURA_ID}-2 {
  inset: -15%;
  will-change: transform;
}
#${AURA_ID}-1 {
  background:
    radial-gradient(32% 28% at 14% 34%, rgba(110, 230, 120, 0.55), rgba(110, 230, 120, 0) 70%),
    radial-gradient(26% 24% at 82% 20%, rgba(40, 230, 190, 0.45), rgba(40, 230, 190, 0) 70%),
    radial-gradient(30% 24% at 58% 82%, rgba(170, 240, 80, 0.4), rgba(170, 240, 80, 0) 70%);
  animation: aero-aura-a 28s ease-in-out infinite alternate;
}
#${AURA_ID}-2 {
  background:
    radial-gradient(24% 22% at 88% 62%, rgba(120, 245, 170, 0.45), rgba(120, 245, 170, 0) 70%),
    radial-gradient(24% 22% at 30% 72%, rgba(0, 215, 200, 0.4), rgba(0, 215, 200, 0) 70%),
    radial-gradient(22% 18% at 46% 16%, rgba(210, 255, 150, 0.4), rgba(210, 255, 150, 0) 70%);
  animation: aero-aura-b 36s ease-in-out infinite alternate;
}
@keyframes aero-aura-a {
  0%   { transform: translate3d(-6%, -3%, 0) scale(1); }
  50%  { transform: translate3d(5%, 4%, 0) scale(1.12); }
  100% { transform: translate3d(-2%, 7%, 0) scale(0.95); }
}
@keyframes aero-aura-b {
  0%   { transform: translate3d(5%, 4%, 0) scale(1.05) rotate(0deg); }
  50%  { transform: translate3d(-6%, -2%, 0) scale(0.92) rotate(8deg); }
  100% { transform: translate3d(3%, -6%, 0) scale(1.1) rotate(-6deg); }
}
#${WAVE_ID}-1, #${WAVE_ID}-2, #${WAVE_ID}-3 {
  top: auto; bottom: 0; background-repeat: repeat-x;
}
#${WAVE_ID}-1 { height: 190px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1440' height='120' viewBox='0 0 1440 120' preserveAspectRatio='none'%3E%3Cpath d='M0 60 C 240 20 480 20 720 60 S 1200 100 1440 60 V120 H0 Z' fill='%23ffffff' fill-opacity='0.18'/%3E%3C/svg%3E"); background-size: 1440px 190px; animation: aero-wave 26s linear infinite; }
#${WAVE_ID}-2 { height: 150px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1440' height='120' viewBox='0 0 1440 120' preserveAspectRatio='none'%3E%3Cpath d='M0 60 C 240 20 480 20 720 60 S 1200 100 1440 60 V120 H0 Z' fill='%238fe3ff' fill-opacity='0.3'/%3E%3C/svg%3E"); background-size: 1100px 150px; animation: aero-wave-r 18s linear infinite; }
#${WAVE_ID}-3 { height: 110px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1440' height='120' viewBox='0 0 1440 120' preserveAspectRatio='none'%3E%3Cpath d='M0 60 C 240 20 480 20 720 60 S 1200 100 1440 60 V120 H0 Z' fill='%230b6fae' fill-opacity='0.85'/%3E%3C/svg%3E"); background-size: 1440px 110px; animation: aero-wave 12s linear infinite; }
@keyframes aero-wave   { from { background-position: 0 0; } to { background-position: -1440px 0; } }
@keyframes aero-wave-r { from { background-position: 0 0; } to { background-position: 1100px 0; } }

#${BUBBLES_ID} { overflow: hidden; }
/* !important: nenhum CSS geral do site (span, div, i...) pode esconder as bolhas */
#${BUBBLES_ID} .aero-bolha {
  display: block !important;
  position: absolute !important;
  top: auto !important;
  bottom: -120px !important;
  margin: 0 !important;
  padding: 0 !important;
  visibility: visible !important;
  opacity: 1;
  border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.65);
  background:
    radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0 8%, rgba(255,255,255,0) 22%),
    radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 55%, rgba(255,255,255,0.18) 100%);
  box-shadow: inset 0 -4px 10px rgba(255,255,255,0.12);
  animation: aero-rise linear infinite;
  animation-duration: var(--dur, 20s);
  animation-delay: var(--delay, 0s);
  will-change: transform;
}
/* bolhas "longe": menores, desfocadas e mais lentas (dá profundidade) */
#${BUBBLES_ID} .aero-bolha.is-far {
  filter: blur(1.5px);
  opacity: 0.55;
}
/* algumas com reflexo esverdeado ou turquesa */
#${BUBBLES_ID} .aero-bolha.is-green {
  border-color: rgba(190, 255, 170, 0.75);
  background:
    radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0 8%, rgba(255,255,255,0) 22%),
    radial-gradient(circle at 50% 50%, rgba(160,255,150,0) 50%, rgba(160,255,150,0.28) 100%);
}
#${BUBBLES_ID} .aero-bolha.is-aqua {
  border-color: rgba(143, 240, 255, 0.85);
  background:
    radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0 8%, rgba(255,255,255,0) 22%),
    radial-gradient(circle at 50% 50%, rgba(80,230,255,0) 50%, rgba(80,230,255,0.3) 100%);
}
@keyframes aero-rise {
  0%   { transform: translate3d(0, 0, 0); opacity: 0; }
  8%   { opacity: 1; }
  50%  { transform: translate3d(var(--sway), -55vh, 0); }
  92%  { opacity: 1; }
  100% { transform: translate3d(0, -115vh, 0); opacity: 0; }
}
/* Windows/celular com "efeitos de animação" desligados: em vez de sumir,
   tudo continua se mexendo, só que bem mais devagar */
@media (prefers-reduced-motion: reduce) {
  #${BUBBLES_ID} .aero-bolha {
    animation-duration: calc(var(--dur, 20s) * 3);
    animation-delay: calc(var(--delay, 0s) * 3);
  }
  #${WAVE_ID}-1, #${WAVE_ID}-2, #${WAVE_ID}-3 { animation-duration: 80s; }
  #${AURA_ID}-1, #${AURA_ID}-2 { animation-duration: 120s; }
}
html.theme-aero, html:has(body.theme-aero) { background: #0b6fae !important; }
`;

const LAYERS = [
  SKY_ID,
  `${AURA_ID}-1`,
  `${AURA_ID}-2`,
  `${WAVE_ID}-1`,
  `${WAVE_ID}-2`,
  BUBBLES_ID,
  `${WAVE_ID}-3`,
];

/* bolhas espalhadas: posição, tamanho e velocidade variam (sem cara de grade) */
const BUBBLE_COUNT = 64; // celular pequeno recebe menos (ver abaixo)
const fillBubbles = (box) => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const total =
    window.innerWidth < 600 ? Math.round(BUBBLE_COUNT * 0.6) : BUBBLE_COUNT;
  for (let i = 0; i < total; i++) {
    const b = document.createElement("div");
    b.className = "aero-bolha";
    const far = rnd() < 0.35; // 1/3 ficam "lá no fundo"
    const big = !far && rnd() < 0.12; // algumas bolhas grandes de verdade
    const size = far
      ? Math.round(5 + rnd() * 18)
      : big
        ? Math.round(60 + rnd() * 50)
        : Math.round(10 + rnd() * rnd() * 48);
    const dur = (far ? 26 : 12) + rnd() * 20;
    const tom = rnd();
    if (far) b.classList.add("is-far");
    else if (tom < 0.22) b.classList.add("is-green");
    else if (tom < 0.44) b.classList.add("is-aqua");
    b.style.left = `${(rnd() * 100).toFixed(1)}%`;
    b.style.width = b.style.height = `${size}px`;
    b.style.setProperty("--dur", `${dur.toFixed(1)}s`);
    b.style.setProperty("--delay", `-${(rnd() * dur).toFixed(1)}s`); // já começa no meio da subida
    b.style.setProperty(
      "--sway",
      `${Math.round((rnd() - 0.5) * (far ? 40 : 110))}px`,
    );
    box.appendChild(b);
  }
};

const setAeroSky = (on) => {
  if (typeof document === "undefined") return;
  if (!on) {
    LAYERS.forEach((id) => document.getElementById(id)?.remove());
    document.getElementById(STYLE_ID)?.remove();
    return;
  }
  let st = document.getElementById(STYLE_ID);
  if (!st) {
    st = document.createElement("style");
    st.id = STYLE_ID;
    document.head.appendChild(st);
  }
  st.textContent = SKY_CSS;
  // de trás pra frente: céu, bolhas, ondas (a primeira da lista fica no fundo)
  [...LAYERS].reverse().forEach((id) => {
    const existente = document.getElementById(id);
    if (existente) {
      if (id === BUBBLES_ID && !existente.querySelector(".aero-bolha"))
        fillBubbles(existente);
      return;
    }
    const el = document.createElement("div");
    el.id = id;
    el.setAttribute("aria-hidden", "true");
    if (id === BUBBLES_ID) fillBubbles(el);
    document.body.prepend(el);
  });
};

/* ---------- tema salvo ---------- */
export const getSavedTheme = () => {
  try {
    const t = window.localStorage.getItem(KEY);
    if (t === "AERO" && !isAeroUnlocked()) return "ADR";
    return THEMES.includes(t) ? t : "ADR";
  } catch {
    return "ADR";
  }
};

/* Coloca/tira as classes no <body>. CLASSIC e AERO usam a numeração do ADR,
   então só o IDR liga a classe theme-idr. */
export const applyTheme = (theme) => {
  const body = document.body;
  body.classList.toggle("theme-idr", theme === "IDR");
  body.classList.toggle("theme-classic", theme === "CLASSIC");
  body.classList.toggle("theme-aero", theme === "AERO");
  // também no <html>, para o fundo de céu pegar mesmo em navegador sem :has()
  document.documentElement.classList.toggle("theme-aero", theme === "AERO");
  setAeroSky(theme === "AERO");
};

export const saveTheme = (theme) => {
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  applyTheme(theme);
};
