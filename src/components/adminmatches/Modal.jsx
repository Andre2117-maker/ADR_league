import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useClubMode } from "../../utils/shirtNumber";

/**
 * Modal base de todo o admin de partidas.
 * - Celular: abre como "gaveta" de baixo pra cima (fácil de alcançar com o polegar)
 * - Computador: caixa centralizada
 * - ESC ou toque fora fecha; trava a rolagem do fundo
 */
export default function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
  const mode = useClubMode();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current?.();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div
      className={`amx-overlay ${mode === "idr" ? "theme-idr" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeRef.current?.();
      }}
    >
      <div className={`amx-modal ${wide ? "is-wide" : ""}`} role="dialog" aria-modal="true">
        <header className="amx-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="amx-x" onClick={() => closeRef.current?.()} aria-label="Fechar">
            ✕
          </button>
        </header>
        <div className="amx-body">{children}</div>
        {footer && <footer className="amx-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
