/* ==========================================================================
   EXPORTAR UM PEDAÇO DA TELA COMO IMAGEM (src/utils/exportImage.js)

   Agora usa o html-to-image: ele "fotografa" o elemento com o próprio
   navegador, então a imagem sai IGUAL à tela (degradês, máscaras/esmaecido
   da foto, espaçamento das letras, fontes, sombras, inclinações...).
   O html2canvas redesenhava tudo do zero e errava nisso: letras grudadas ou
   separadas ("LEAG UE"), números quebrados, foto com borda dura etc.

   Instale uma vez no projeto:   npm install html-to-image

   Se der algum erro, cai automaticamente no html2canvas (o jeito antigo).
   ========================================================================== */
import { toBlob } from "html-to-image";
import html2canvas from "html2canvas";

const isSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
  /iP(hone|ad|od)/.test(navigator.userAgent);

/* Espera as imagens de dentro do elemento terminarem de carregar */
const waitImages = (node) =>
  Promise.all(
    [...node.querySelectorAll("img")].map((img) =>
      img.complete && img.naturalWidth
        ? Promise.resolve()
        : new Promise((res) => {
            img.addEventListener("load", res, { once: true });
            img.addEventListener("error", res, { once: true });
          }),
    ),
  );

/* ---------- Jeito antigo (só se o novo falhar) ---------- */
const MODERN_COLOR_RE =
  /\b(?:color|oklab|oklch|lab|lch)\((?:[^()]|\([^()]*\))*\)/g;
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
      el.style.setProperty(
        prop,
        value.replace(MODERN_COLOR_RE, toRgba),
        "important",
      );
    });
  });
};

const legacyBlob = async (node, { background, scale }) => {
  const marker = `exp-${Date.now()}`;
  node.setAttribute("data-export-id", marker);
  try {
    const canvas = await html2canvas(node, {
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
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  } finally {
    node.removeAttribute("data-export-id");
  }
};

/* ---------- Jeito novo ---------- */
const modernBlob = async (node, { background, scale }) => {
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  const opts = {
    pixelRatio: scale,
    width,
    height,
    cacheBust: true,
    // se alguma foto não puder ser lida, usa um pixel transparente em vez de falhar tudo
    imagePlaceholder:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    backgroundColor: background || undefined,
    // a cópia não herda zoom/rotação de quem está em volta (ex.: prévia reduzida no celular)
    style: { transform: "none", margin: "0" },
  };
  // No Safari/iPhone a 1ª passada às vezes sai sem as fotos; a 2ª sai certa
  if (isSafari()) {
    try {
      await toBlob(node, opts);
    } catch {
      /* ignora: é só o "aquecimento" */
    }
  }
  return toBlob(node, opts);
};

/**
 * Exporta `node` como PNG.
 * @returns "shared" | "downloaded" | "cancelled"
 */
export const exportNodeImage = async (
  node,
  {
    filename = "imagem.png",
    background = "#050505",
    scale = 3,
    share = true,
    title = "",
  } = {},
) => {
  if (!node) throw new Error("Nada para exportar");
  if (document.fonts?.ready) await document.fonts.ready;
  await waitImages(node);

  // .is-exporting continua valendo (desliga animações durante a foto)
  node.classList.add("is-exporting");
  let blob = null;
  try {
    blob = await modernBlob(node, { background, scale });
  } catch (err) {
    console.warn("html-to-image falhou, usando html2canvas:", err);
  } finally {
    node.classList.remove("is-exporting");
  }
  if (!blob) blob = await legacyBlob(node, { background, scale });
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
