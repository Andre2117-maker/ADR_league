/* ==========================================================================
   TEMAS DO SITE: "ADR" (escuro e dourado) | "IDR" (preto e branco) |
                  "CLASSIC" (primeiro escudo: roxo -> vermelho)
   ========================================================================== */
export const THEMES = ["ADR", "IDR", "CLASSIC"];
const KEY = "app-theme";

export const getSavedTheme = () => {
  try {
    const t = window.localStorage.getItem(KEY);
    return THEMES.includes(t) ? t : "ADR";
  } catch {
    return "ADR";
  }
};

/* Coloca/tira as classes no <body>. O CLASSIC usa a numeração do ADR,
   então só o IDR liga a classe theme-idr. */
export const applyTheme = (theme) => {
  const body = document.body;
  body.classList.toggle("theme-idr", theme === "IDR");
  body.classList.toggle("theme-classic", theme === "CLASSIC");
};

export const saveTheme = (theme) => {
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  applyTheme(theme);
};
