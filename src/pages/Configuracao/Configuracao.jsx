import React, { useState, useEffect } from "react";
import Footer from "../../components/Footer";
import { getSavedTheme, saveTheme } from "../../utils/theme";
import "./Configuracao.css";

/* Cada cartão mostra o próprio tema (independente do tema ativo do site) */
const OPCOES = [
  {
    id: "CLASSIC",
    cls: "tc-classic",
    logo: "/logo-classic.png",
    nome: "ADR Classic",
    desc: "O primeiro escudo: roxo e vermelho",
    cores: ["#7b3aa8", "#b8307a", "#e3263a", "#2a1d2f"],
  },
  {
    id: "ADR",
    cls: "tc-adr",
    logo: "/logo.png",
    nome: "ADR League",
    desc: "Escuro e dourado",
    cores: ["#000000", "#1a1a1a", "#d4af37"],
  },
  {
    id: "IDR",
    cls: "tc-idr",
    logo: "/IDR.png",
    nome: "IDR League",
    desc: "Claro, preto e branco",
    cores: ["#ffffff", "#e9e9e9", "#000000"],
  },
];

const Check = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    <path
      d="M3 8.5l3.2 3L13 4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function Configuracao() {
  const [temaAtual, setTemaAtual] = useState("ADR");

  useEffect(() => {
    setTemaAtual(getSavedTheme());
  }, []);

  const mudarTema = (novoTema) => {
    setTemaAtual(novoTema);
    saveTheme(novoTema); // salva e aplica na hora
  };

  return (
    <div>
      <div className="page-container1 config-page">
        <h1 className="page-title1">Configurações</h1>

        <div className="config-wrapper">
          <p className="config-subtitle">
            Escolha a identidade visual do sistema
          </p>

          <div
            className="theme-cards-container"
            role="radiogroup"
            aria-label="Tema do site"
          >
            {OPCOES.map((o) => {
              const ativo = temaAtual === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  className={`theme-card-option ${o.cls} ${ativo ? "is-active" : ""}`}
                  onClick={() => mudarTema(o.id)}
                >
                  <span className="tc-badge">
                    <Check /> Em uso
                  </span>

                  <span className="tc-crest">
                    <img src={o.logo} alt={`Escudo ${o.nome}`} loading="lazy" />
                  </span>

                  <span className="tc-body">
                    <strong className="tc-name">{o.nome}</strong>
                    <span className="tc-desc">{o.desc}</span>
                    <span className="color-preview">
                      {o.cores.map((c) => (
                        <span key={c} style={{ background: c }} />
                      ))}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Configuracao;
