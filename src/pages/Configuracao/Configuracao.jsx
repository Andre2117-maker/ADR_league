import React, { useState, useEffect } from "react";
import Footer from "../../components/Footer";
import { getSavedTheme, saveTheme } from "../../utils/theme";
import {
  SEGREDOS,
  acharSegredo,
  getLiberados,
  liberar,
  trancar,
  estaAtivo,
  ativar,
  desativar,
} from "../../utils/segredos";
import "./Configuracao.css";

/* Cada cartão mostra o próprio tema (independente do tema ativo do site) */
const OPCOES = [
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
  {
    id: "CLASSIC",
    cls: "tc-classic",
    logo: "/logo-classic.png",
    nome: "ADR Classic",
    desc: "O primeiro escudo: roxo e vermelho",
    cores: ["#7b3aa8", "#b8307a", "#e3263a", "#2a1d2f"],
  },
];

/* temas secretos: só aparecem depois do código (ver utils/segredos.js) */
const TEMAS_SECRETOS = {
  AERO: {
    id: "AERO",
    cls: "tc-aero",
    logo: "/logo-aero.png",
    nome: "ADR Aero",
    desc: "Bolhas e ondas · tema secreto",
    cores: ["#0a6fb0", "#18a3d6", "#8fe3ff", "#59c96b"],
  },
};

const Check = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const KeyIco = () => (
  <svg className="secret-ico" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="8" cy="15" r="4.2" />
    <path d="M11 12l8.5-8.5M16.5 6.5l2.5 2.5M14.5 8.5l2 2" />
  </svg>
);

const ArrowIco = () => (
  <svg className="secret-arrow" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
);

/* bolhas que sobem quando o código acerta */
const BUBBLES = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 37) % 100,
  size: 14 + ((i * 13) % 38),
  delay: (i % 7) * 0.12,
  dur: 1.6 + ((i * 7) % 10) / 10,
}));

function Configuracao() {
  const [temaAtual, setTemaAtual] = useState("ADR");
  const [liberados, setLiberados] = useState([]);
  const [codigo, setCodigo] = useState("");
  const [status, setStatus] = useState("idle"); // idle | erro | repetido
  const [festa, setFesta] = useState(null); // segredo que acabou de ser liberado
  const [novo, setNovo] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const [, setVersao] = useState(0); // redesenha quando liga/desliga um segredo

  useEffect(() => {
    setTemaAtual(getSavedTheme());
    setLiberados(getLiberados());
  }, []);

  const mudarTema = (novoTema) => {
    setTemaAtual(novoTema);
    saveTheme(novoTema); // salva e aplica na hora
  };

  const enviarCodigo = (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    const segredo = acharSegredo(codigo);

    if (!segredo) {
      setStatus("erro");
      setTentativa((n) => n + 1); // refaz a animação de "tremer"
      return;
    }
    setCodigo("");
    if (liberados.includes(segredo.id)) {
      setStatus("repetido");
      return;
    }

    liberar(segredo.id);
    setLiberados(getLiberados());
    setStatus("idle");
    setNovo(segredo.id);
    setFesta(segredo);
    if (segredo.tema) setTimeout(() => mudarTema(segredo.tema), 650);
    setTimeout(() => setFesta(null), 3200);
  };

  const alternarSegredo = (id) => {
    if (estaAtivo(id)) desativar(id);
    else ativar(id);
    setVersao((n) => n + 1);
  };

  const trancarSegredo = (id) => {
    trancar(id);
    setLiberados(getLiberados());
    setTemaAtual(getSavedTheme());
    setStatus("idle");
  };

  const temasLiberados = liberados.map((id) => TEMAS_SECRETOS[id]).filter(Boolean);
  const opcoes = [...OPCOES, ...temasLiberados];
  const encontrados = SEGREDOS.filter((s) => liberados.includes(s.id));

  const mensagem =
    status === "erro"
      ? "Código inválido. Tente de novo."
      : status === "repetido"
        ? "Você já tinha encontrado esse segredo."
        : "Maiúsculas, acentos e espaços não importam.";

  return (
    <div>
      <div className="page-container1 config-page">
        <h1 className="page-title1">Configurações</h1>

        <div className="config-wrapper">
          <p className="config-subtitle">Escolha a identidade visual do sistema</p>

          <div
            className={`theme-cards-container ${temasLiberados.length ? "has-secret" : ""}`}
            role="radiogroup"
            aria-label="Tema do site"
          >
            {opcoes.map((o) => {
              const ativo = temaAtual === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  className={`theme-card-option ${o.cls} ${ativo ? "is-active" : ""} ${
                    o.id === novo ? "is-new" : ""
                  }`}
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

          {/* ==================== EASTER EGGS: CÓDIGO SECRETO ==================== */}
          <form
            key={tentativa}
            className={`secret-box ${status === "erro" ? "is-wrong" : ""}`}
            onSubmit={enviarCodigo}
          >
            <span className="secret-badge" aria-hidden="true">
              <KeyIco />
            </span>

            <div className="secret-main">
              <span className="secret-kicker">Código secreto</span>
              <strong className="secret-title">Tem coisa escondida por aqui...</strong>

              <div className="secret-row">
                <input
                  className="secret-input"
                  type="text"
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value);
                    if (status !== "idle") setStatus("idle");
                  }}
                  placeholder="Digite o código"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label="Código secreto"
                  aria-invalid={status === "erro"}
                />
                <button type="submit" className="secret-btn" disabled={!codigo.trim()}>
                  <span>Desbloquear</span>
                  <ArrowIco />
                </button>
              </div>
              <p
                className={`secret-msg ${status === "erro" ? "is-err" : ""} ${
                  status === "repetido" ? "is-info" : ""
                }`}
                aria-live="polite"
              >
                {mensagem}
              </p>
            </div>
          </form>

          {/* segredos já encontrados neste aparelho */}
          {encontrados.length > 0 && (
            <section className="found-box" aria-label="Segredos encontrados">
              <span className="found-head">
                Segredos encontrados
                <b>
                  {encontrados.length}/{SEGREDOS.length}
                </b>
              </span>

              <ul className="found-list">
                {encontrados.map((s) => {
                  const emUso = s.tema && temaAtual === s.tema;
                  const ligado = s.classe && estaAtivo(s.id);
                  return (
                    <li key={s.id} className={`found-item ${s.id === novo ? "is-new" : ""}`}>
                      <span className="found-logo">
                        {s.logo ? <img src={s.logo} alt="" /> : <KeyIco />}
                      </span>
                      <span className="found-text">
                        <strong>{s.nome}</strong>
                        <small>{s.desc}</small>
                      </span>
                      <span className="found-actions">
                        {s.tema && (
                          <button
                            type="button"
                            className="found-btn is-main"
                            disabled={emUso}
                            onClick={() => mudarTema(s.tema)}
                          >
                            {emUso ? "Em uso" : "Usar tema"}
                          </button>
                        )}
                        {s.classe && (
                          <button
                            type="button"
                            className={`found-btn found-toggle ${ligado ? "is-main is-on" : ""}`}
                            aria-pressed={ligado}
                            onClick={() => alternarSegredo(s.id)}
                          >
                            <span className="found-toggle-dot" aria-hidden="true" />
                            {ligado ? "Ativado" : "Desativado"}
                          </button>
                        )}
                        <button
                          type="button"
                          className="found-btn"
                          onClick={() => trancarSegredo(s.id)}
                          title="Esconde de novo neste aparelho (o código volta a funcionar)"
                        >
                          Trancar
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* bolhas + aviso quando desbloqueia */}
      {festa && (
        <div className="secret-party" aria-live="polite">
          {BUBBLES.map((b, i) => (
            <span
              key={i}
              style={{
                left: `${b.x}%`,
                width: b.size,
                height: b.size,
                animationDelay: `${b.delay}s`,
                animationDuration: `${b.dur}s`,
              }}
            />
          ))}
          <div className="secret-party-card">
            {festa.logo && <img src={festa.logo} alt="" />}
            <strong>Segredo desbloqueado!</strong>
            <small>{festa.nome}</small>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Configuracao;
