import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/*
  Controla a rolagem quando a página (rota) muda:
  - Abriu uma página nova (clicou num link)  -> vai para o topo
  - Usou o "voltar"/"avançar" do navegador   -> volta para onde estava
  - Mudou só o ?filtro ou o #âncora da mesma página -> NÃO mexe na rolagem
*/
const posicoes = new Map();

function ScrollToTop() {
  const { pathname, key } = useLocation();
  const tipo = useNavigationType(); // "PUSH" | "REPLACE" | "POP"
  const anterior = useRef({ pathname, key });

  // o navegador não deve tentar restaurar sozinho (briga com o React)
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // guarda onde a pessoa estava em cada página
  useEffect(() => {
    const salvar = () => posicoes.set(key, window.scrollY);
    window.addEventListener("scroll", salvar, { passive: true });
    return () => window.removeEventListener("scroll", salvar);
  }, [key]);

  useLayoutEffect(() => {
    const mesmaPagina = anterior.current.pathname === pathname;
    anterior.current = { pathname, key };
    if (mesmaPagina) return; // só trocou filtro/aba dentro da página

    if (tipo === "POP" && posicoes.has(key)) {
      const y = posicoes.get(key);
      // espera a página desenhar antes de rolar
      requestAnimationFrame(() => window.scrollTo(0, y));
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, key, tipo]);

  return null;
}

export default ScrollToTop;
