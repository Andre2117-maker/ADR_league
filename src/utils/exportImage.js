/* ==========================================================================
   EXPORTAR UM PEDAÇO DA TELA COMO IMAGEM (src/utils/exportImage.js)
   Usa o html2canvas que o projeto já tem, com as proteções que descobrimos:
   - cores modernas (color(), oklab, oklch, color-mix…) viram rgba
   - a cópia ganha a classe .is-exporting (para desligar efeitos não suportados)
   - no celular, tenta abrir o "Compartilhar" com a imagem; senão, baixa
   ========================================================================== */
import html2canvas from "html2canvas";

const MODERN_COLOR_RE = /\b(?:color|oklab|oklch|lab|lch)\((?:[^()]|\([^()]*\))*\)/g;

const COLOR_PROPS = [
  "color",
  "background-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "fill",
  "stroke",
  "box-shadow",
  "text-shadow",
  "background-image",
];

export const sanitizeColorsForCanvas = (doc, root) => {
  const canvas = doc.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const cache = new Map();
  const toRgba = (value) => {
    if (cache.has(value)) return cache.get(value);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const out = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    cache.set(value, out);
    return out;
  };
  const view = doc.defaultView || window;
  [root, ...root.querySelectorAll("*")].forEach((el) => {
    const cs = view.getComputedStyle(el);
    COLOR_PROPS.forEach((prop) => {
      const value = cs.getPropertyValue(prop);
      MODERN_COLOR_RE.lastIndex = 0;
      if (!value || !MODERN_COLOR_RE.test(value)) return;
      MODERN_COLOR_RE.lastIndex = 0;
      el.style.setProperty(prop, value.replace(MODERN_COLOR_RE, toRgba), "important");
    });
  });
};

/**
 * Exporta `node` como PNG.
 * @returns "shared" | "downloaded"
 */
export const exportNodeImage = async (
  node,
  { filename = "imagem.png", background = "#050505", scale = 3, share = true, title = "" } = {},
) => {
  if (!node) throw new Error("Nada para exportar");
  if (document.fonts?.ready) await document.fonts.ready;

  const marker = `exp-${Date.now()}`;
  node.setAttribute("data-export-id", marker);

  let canvas;
  try {
    canvas = await html2canvas(node, {
      backgroundColor: background,
      scale,
      useCORS: true,
      onclone: (doc) => {
        const clone = doc.querySelector(`[data-export-id="${marker}"]`);
        if (!clone) return;
        clone.classList.add("is-exporting");
        sanitizeColorsForCanvas(doc, clone);
      },
    });
  } finally {
    node.removeAttribute("data-export-id");
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Não foi possível gerar a imagem");

  const file = new File([blob], filename, { type: "image/png" });
  if (share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded";
};
