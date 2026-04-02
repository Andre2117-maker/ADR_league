import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Tenta resetar o scroll da janela principal
    window.scrollTo(0, 0);

    // 2. Tenta resetar o scroll do body e do html (garantia extra)
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);

    // 3. Se o seu scroll estiver preso dentro da div "main-wrapper"
    const mainWrapper = document.querySelector(".main-wrapper");
    if (mainWrapper) {
      mainWrapper.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
