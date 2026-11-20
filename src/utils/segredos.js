/* ==========================================================================
   EASTER EGGS (códigos secretos da tela de Configurações)

   Pra criar um segredo novo, é só adicionar um item na lista SEGREDOS:

   {
     id: "NOME_UNICO",              // sem espaço, não repita
     codigos: ["meu codigo"],       // um ou mais códigos que liberam
     nome: "Nome que aparece",
     desc: "Frase curta embaixo do nome",
     logo: "/alguma-imagem.png",    // opcional (fica na pasta public)
     tema: "AERO",                  // opcional: se o segredo libera um tema
     aoLiberar: () => {},           // opcional: o que fazer quando liberar
     aoTrancar: () => {},           // opcional: o que fazer quando trancar
     classe: "seg-meu-segredo",     // opcional: segredo de LIGA/DESLIGA. Quando
                                    // ativo, essa classe vai no <body> e o CSS
                                    // (styles/segredos.css) faz o resto.
                                    // Ganha o botão Ativar/Desativar.
   }

   Maiúsculas, acentos, espaços e símbolos são ignorados nos códigos:
   "Frutiger Aero", "FRUTIGER-AERO" e "frutigeraero" são o mesmo código.
   Tudo fica salvo só no aparelho/navegador da pessoa.
   ========================================================================== */
import { unlockAero, lockAero, isAeroUnlocked } from "./theme";

export const SEGREDOS = [
  {
    id: "AERO",
    codigos: ["frutiger aero"],
    nome: "ADR Aero",
    desc: "Tema de bolhas e ondas",
    logo: "/logo-aero.png",
    tema: "AERO",
    aoLiberar: unlockAero,
    aoTrancar: lockAero,
  },

  {
    id: "ALBERTO_AHEGAO",
    codigos: ["alberto ahegao"],
    nome: "Alberto Ahegao",
    desc: "Troca todas as fotos do Alberto",
    logo: "/players/AlbertoA.png",
    classe: "seg-alberto-ahegao", // o visual fica no styles/segredos.css
  },

  /* exemplo (apague as barras // pra ativar):
  {
    id: "RENZO",
    codigos: ["renzo lenda", "o renzo"],
    nome: "Modo Renzo",
    desc: "Você achou o segredo do fundador",
    logo: "/logo.png",
  },
  */
];

const KEY = "adr-segredos";
const KEY_ATIVOS = "adr-segredos-desligados"; // segredos de liga/desliga que estão DESLIGADOS

export const normalizar = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const ler = () => {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const gravar = (ids) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
};

/* ids dos segredos já encontrados neste aparelho */
export const getLiberados = () => {
  const ids = new Set(ler());
  if (isAeroUnlocked()) ids.add("AERO"); // quem liberou antes continua liberado
  return SEGREDOS.filter((s) => ids.has(s.id)).map((s) => s.id);
};

export const estaLiberado = (id) => getLiberados().includes(id);

/* devolve o segredo daquele código, ou null */
export const acharSegredo = (codigo) => {
  const c = normalizar(codigo);
  if (!c) return null;
  return SEGREDOS.find((s) => s.codigos.some((k) => normalizar(k) === c)) || null;
};

export const liberar = (id) => {
  const s = SEGREDOS.find((x) => x.id === id);
  if (!s) return;
  gravar([...new Set([...ler(), id])]);
  gravarDesligados(lerDesligados().filter((x) => x !== id)); // já começa ligado
  s.aoLiberar?.();
  aplicarSegredos();
};

export const trancar = (id) => {
  const s = SEGREDOS.find((x) => x.id === id);
  gravar(ler().filter((x) => x !== id));
  s?.aoTrancar?.();
  aplicarSegredos();
};

/* ---------- segredos de LIGA/DESLIGA (os que têm "classe") ---------- */
const lerDesligados = () => {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY_ATIVOS) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const gravarDesligados = (ids) => {
  try {
    window.localStorage.setItem(KEY_ATIVOS, JSON.stringify(ids));
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
};

/* liberado e não desligado = ativo */
export const estaAtivo = (id) => estaLiberado(id) && !lerDesligados().includes(id);

export const ativar = (id) => {
  gravarDesligados(lerDesligados().filter((x) => x !== id));
  aplicarSegredos();
};

export const desativar = (id) => {
  gravarDesligados([...new Set([...lerDesligados(), id])]);
  aplicarSegredos();
};

/* coloca/tira a classe de cada segredo no <body> */
export const aplicarSegredos = () => {
  if (typeof document === "undefined") return;
  SEGREDOS.filter((s) => s.classe).forEach((s) => {
    document.body.classList.toggle(s.classe, estaAtivo(s.id));
  });
};

/* roda sozinho quando o site abre (o App.jsx importa este arquivo) */
aplicarSegredos();
