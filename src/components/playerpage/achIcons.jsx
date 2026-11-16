/* ==========================================================================
   Ícones desenhados das conquistas (no lugar dos emojis)
   As conquistas antigas salvas com emoji continuam aparecendo:
   o emoji é traduzido para o ícone equivalente.
   ========================================================================== */

const PATHS = {
  trophy:
    "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3M12 13v4M8.5 20h7M10 17h4",
  gold: "M8 3l2.5 6M16 3l-2.5 6M12 21a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM11 14l1.3-.8V18",
  silver:
    "M8 3l2.5 6M16 3l-2.5 6M12 21a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM10.6 14a1.5 1.5 0 0 1 2.9.4c0 1.3-2.9 2-2.9 3.6h2.9",
  ball: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5l3.8 2.8-1.5 4.4H9.7l-1.5-4.4zM12 3v4.5M15.8 10.3l4.3-1.6M14.3 14.7l2.6 3.8M9.7 14.7l-2.6 3.8M8.2 10.3 3.9 8.7",
  target:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 12.8a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6z",
  glove:
    "M7 21v-5L4.5 12.5a1.6 1.6 0 0 1 2.5-2L8 11.5V5a1.5 1.5 0 0 1 3 0v5V3.5a1.5 1.5 0 0 1 3 0V10V5a1.5 1.5 0 0 1 3 0v6V7.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-3 5.2V21",
  crown: "M3.5 8 8 11.5l4-6.5 4 6.5L20.5 8l-1.8 10H5.3zM5.5 21h13",
  fire: "M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.6 3-5.6 3.5-9.3 2.5 1.4 3.6 3.8 3.4 6 1-.7 1.7-1.9 1.8-3.4 2.4 1.8 3.8 4.2 3.8 6.7 0 3.6-2.6 6.2-6 6.2zM12 21c-1.5 0-2.6-1.1-2.6-2.6 0-1.6 1.6-2.4 2.1-4 1.6 1 3 2.4 3 4 0 1.5-1 2.6-2.5 2.6z",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
  shield: "M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6zM8.8 12l2.2 2.2 4.4-4.4",
};

export const ACH_ICON_KEYS = Object.keys(PATHS);

export const ACH_ICON_LABELS = {
  trophy: "Troféu",
  gold: "Medalha de ouro",
  silver: "Medalha de prata",
  ball: "Bola",
  target: "Alvo",
  glove: "Luva",
  crown: "Coroa",
  fire: "Fogo",
  star: "Estrela",
  shield: "Escudo",
};

/* conquistas antigas, gravadas com emoji (escritos em código, ex.: \u{1F3C6} = troféu) */
const EMOJI_TO_KEY = {
  "\u{1F3C6}": "trophy",
  "\u{1F947}": "gold",
  "\u{1F948}": "silver",
  "\u{1F949}": "silver",
  "\u{1F3C5}": "gold",
  "\u{26BD}": "ball",
  "\u{1F3AF}": "target",
  "\u{1F9E4}": "glove",
  "\u{1F451}": "crown",
  "\u{1F525}": "fire",
  "\u{2B50}": "star",
  "\u{1F31F}": "star",
  "\u{1F6E1}\u{FE0F}": "shield",
  "\u{1F6E1}": "shield",
};

export const achIconKey = (icon) => {
  if (!icon) return "trophy";
  if (PATHS[icon]) return icon;
  const clean = String(icon).trim();
  return EMOJI_TO_KEY[clean] || EMOJI_TO_KEY[clean.replace(/\uFE0F/g, "")] || "trophy";
};

export const AchIcon = ({ icon, className = "ach-ico" }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d={PATHS[achIconKey(icon)]} />
  </svg>
);
