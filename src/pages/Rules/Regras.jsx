import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "../../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import "./rules.css";
import Footer from "../../components/Footer";

function Regras({ isAdmin }) {
  const [textoRemoto, setTextoRemoto] = useState("Carregando regulamento...");
  const [textoLocal, setTextoLocal] = useState("");
  const [lastUpdatedDate, setLastUpdatedDate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Novos estados de UX: Busca, Modo de Edição Admin e Feedback de Cópia
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const textareaRef = useRef(null);

  const regrasDocRef = useMemo(() => doc(db, "settings", "regulamento"), []);

  // 1. Escuta em tempo real do Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(regrasDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const content = data.content || "";
        setTextoRemoto(content);

        if (data.lastUpdated) {
          const dt = data.lastUpdated.toDate
            ? data.lastUpdated.toDate()
            : new Date(data.lastUpdated);
          setLastUpdatedDate(dt);
        }

        if (!isLoaded) {
          setTextoLocal(content);
          setIsLoaded(true);
        }
      } else {
        const fallback = "⚽ Regras em branco...";
        setTextoRemoto(fallback);
        if (!isLoaded) {
          setTextoLocal(fallback);
          setIsLoaded(true);
        }
      }
    });

    return () => unsubscribe();
  }, [regrasDocRef, isLoaded]);

  // 2. Salvamento Automático (Debounce de 1.5s mantido)
  useEffect(() => {
    if (!isAdmin || textoLocal === textoRemoto || !isLoaded) return;

    setIsSaving(true);

    const temporizadorDeSalvamento = setTimeout(async () => {
      try {
        const now = new Date();
        await setDoc(regrasDocRef, {
          content: textoLocal,
          lastUpdated: now,
        });
        setLastUpdatedDate(now);
        setIsSaving(false);
      } catch (error) {
        console.error("Erro ao salvar regras:", error);
        setIsSaving(false);
      }
    }, 1500);

    return () => clearTimeout(temporizadorDeSalvamento);
  }, [textoLocal, textoRemoto, regrasDocRef, isLoaded, isAdmin]);

  const textoParaExibir = isAdmin ? textoLocal : textoRemoto;

  // 3. PARSER INTELIGENTE DE LINHAS (Identifica Seções, Artigos, Sub-itens e Alertas)
  const parsedBlocks = useMemo(() => {
    if (!textoParaExibir) return [];
    const lines = textoParaExibir.split("\n");
    let sectionCounter = 0;

    return lines.map((rawLine, index) => {
      const trimmed = rawLine.trim();
      if (!trimmed) return { type: "spacer", id: `sp-${index}` };

      // A) Alerta / Punição: começa com "!", "⚠️", "ATENÇÃO" ou "IMPORTANTE"
      if (
        trimmed.startsWith("!") ||
        trimmed.startsWith("⚠️") ||
        /^ATEN[ÇC][ÃA]O:/i.test(trimmed) ||
        /^IMPORTANTE:/i.test(trimmed) ||
        /^PUNI[ÇC][ÃA]O:/i.test(trimmed)
      ) {
        const cleanAlert = trimmed.replace(/^!\s*/, "");
        return {
          type: "alert",
          text: cleanAlert,
          raw: rawLine,
          index,
        };
      }

      // B) Sub-item / Tópico de lista: começa com "-", "•", "*", "1.1", "a)", "Art."
      const isBullet =
        trimmed.startsWith("-") ||
        trimmed.startsWith("•") ||
        trimmed.startsWith("*") ||
        /^\d+\.\d+/.test(trimmed) ||
        /^[a-zA-Z]\)/.test(trimmed) ||
        /^Art\.?\s*\d+/i.test(trimmed);

      // C) Título de Seção: começa com "#" OU número simples + texto curto/maiúsculo (ex: "1. PONTUAÇÃO") OU linha toda em MAIÚSCULAS
      const isMarkdownHeader = trimmed.startsWith("#");
      const isNumberedHeader =
        /^\d+[\.\)]\s+/.test(trimmed) &&
        (trimmed === trimmed.toUpperCase() || trimmed.length < 65);
      const isAllCapsHeader =
        !isBullet &&
        trimmed.length > 3 &&
        trimmed.length < 70 &&
        trimmed === trimmed.toUpperCase() &&
        /[A-ZÁÉÍÓÚÃÕÇ]/.test(trimmed);

      if (isMarkdownHeader || isNumberedHeader || isAllCapsHeader) {
        sectionCounter++;
        const cleanTitle = trimmed.replace(/^#+\s*/, "");
        return {
          type: "section",
          text: cleanTitle,
          sectionNumber: sectionCounter,
          id: `rule-sec-${sectionCounter}`,
          index,
        };
      }

      // D) Item de Regra Padrão
      const cleanItem = trimmed.replace(/^[-•*]\s*/, "");
      return {
        type: "item",
        isBullet,
        text: cleanItem,
        raw: trimmed,
        index,
      };
    });
  }, [textoParaExibir]);

  // Lista de seções para o Índice de Navegação Rápida
  const sectionsIndex = useMemo(
    () => parsedBlocks.filter((b) => b.type === "section"),
    [parsedBlocks],
  );

  // Filtro de busca em tempo real
  const filteredBlocks = useMemo(() => {
    if (!searchTerm.trim()) return parsedBlocks;
    const q = searchTerm.toLowerCase();
    return parsedBlocks.filter(
      (b) => b.type !== "spacer" && b.text && b.text.toLowerCase().includes(q),
    );
  }, [parsedBlocks, searchTerm]);

  // Rola suavemente até a seção clicada
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Copia uma regra específica para mandar no WhatsApp do time
  const handleCopyRule = (text, idx) => {
    navigator.clipboard?.writeText(`📖 Regulamento O ADR: "${text}"`);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  // Atalhos de formatação rápida para o Admin
  const insertSnippet = (snippet) => {
    const ta = textareaRef.current;
    if (!ta) {
      setTextoLocal((prev) => `${prev}\n${snippet}`);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = textoLocal.substring(0, start);
    const after = textoLocal.substring(end);
    const newText = `${before}${snippet}${after}`;
    setTextoLocal(newText);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + snippet.length;
    }, 20);
  };

  const formattedDate = lastUpdatedDate
    ? lastUpdatedDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Temporada 2026";

  return (
    <div>
      <div className="page-container1">
        {/* ==================== CABEÇALHO HERO ==================== */}
        <header className="rules-hero">
          <span className="rules-kicker">ESTATUTO & DIRETRIZES DO CLUBE</span>
          <h1 className="page-title1">Regulamento Oficial</h1>
          <div className="rules-hero-line"></div>
        </header>

        <div className="rules-wrapper">
          {/* ==================== BARRA DE CONTROLES (BUSCA + PDF + ADMIN) ==================== */}
          <div className="rules-toolbar">
            {/* Campo de Busca Instantânea */}
            {(!isAdmin || !isEditMode) && (
              <div className="rules-search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="rules-search-input"
                  placeholder="Buscar regra (ex: atraso, goleiro, falta, camisa)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchTerm("")}
                    title="Limpar busca"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            <div className="rules-toolbar-actions">
              {/* Alternador Visualizar / Editar para Admin */}
              {isAdmin && (
                <div className="admin-mode-switch">
                  <button
                    type="button"
                    className={`mode-switch-btn ${!isEditMode ? "active" : ""}`}
                    onClick={() => setIsEditMode(false)}
                  >
                    👁️ Leitura
                  </button>
                  <button
                    type="button"
                    className={`mode-switch-btn ${isEditMode ? "active" : ""}`}
                    onClick={() => setIsEditMode(true)}
                  >
                    ✏️ Editar
                  </button>
                </div>
              )}

              {/* Botão PDF Oficial */}
              <a
                href="/docs/Regras.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="pdf-download-btn"
              >
                📖 Livro de Regras (PDF)
              </a>
            </div>
          </div>

          {/* ==================== ÍNDICE RÁPIDO DE CAPÍTULOS ==================== */}
          {(!isAdmin || !isEditMode) &&
            !searchTerm &&
            sectionsIndex.length > 1 && (
              <nav className="rules-toc-bar" aria-label="Índice do Regulamento">
                <span className="toc-label">Ir para:</span>
                <div className="toc-pills-scroll">
                  {sectionsIndex.map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      className="toc-pill"
                      onClick={() => scrollToSection(sec.id)}
                    >
                      {sec.text}
                    </button>
                  ))}
                </div>
              </nav>
            )}

          {/* ==================== DOCUMENTO PRINCIPAL ==================== */}
          <div
            className={`rules-paper ${isAdmin && isEditMode ? "editable" : ""}`}
          >
            {/* Cabeçalho Interno do Documento */}
            <div className="rules-header">
              <div className="rules-header-left">
                <div className="doc-stamp">O ADR • OFICIAL</div>
                <span className="doc-sub">Conselho Desportivo</span>
              </div>

              <div className="rules-header-right">
                {isAdmin && (
                  <span
                    className={`saving-badge ${
                      isSaving ? "is-saving" : "is-synced"
                    }`}
                  >
                    {isSaving ? "⏳ Salvando..." : "✓ Sincronizado"}
                  </span>
                )}
                <div className="doc-date">Atualizado: {formattedDate}</div>
              </div>
            </div>

            {/* MODO EDIÇÃO (EXCLUSIVO ADMIN QUANDO ATIVADO) */}
            {isAdmin && isEditMode ? (
              <div className="rules-editor-container">
                <div className="editor-quick-bar">
                  <span className="quick-bar-label">Inserir rápido:</span>
                  <button
                    type="button"
                    className="quick-chip"
                    onClick={() => insertSnippet("\n# NOVO CAPÍTULO\n")}
                  >
                    + Capítulo
                  </button>
                  <button
                    type="button"
                    className="quick-chip"
                    onClick={() => insertSnippet("\n- Nova regra ou diretriz")}
                  >
                    + Regra (-)
                  </button>
                  <button
                    type="button"
                    className="quick-chip alert-chip"
                    onClick={() =>
                      insertSnippet("\n! ATENÇÃO: Penalidade ou regra crítica")
                    }
                  >
                    + Alerta (!)
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  className="rules-textarea"
                  value={textoLocal}
                  onChange={(e) => setTextoLocal(e.target.value)}
                  spellCheck={false}
                  placeholder="Digite o regulamento aqui... Use LETRAS MAIÚSCULAS ou # para títulos de seção, '-' para regras e '!' no início da linha para caixas de alerta."
                />
              </div>
            ) : (
              /* MODO LEITURA FORMATADO (VISITANTES & PREVIEW DO ADMIN) */
              <div className="rules-content">
                {filteredBlocks.length === 0 ? (
                  <div className="rules-empty-search">
                    <p>
                      Nenhuma regra encontrada para{" "}
                      <strong>"{searchTerm}"</strong>.
                    </p>
                    <button
                      type="button"
                      className="clear-search-pill"
                      onClick={() => setSearchTerm("")}
                    >
                      Mostrar regulamento completo
                    </button>
                  </div>
                ) : (
                  filteredBlocks.map((block) => {
                    if (block.type === "spacer") {
                      return <div key={block.id} className="rule-spacer" />;
                    }

                    if (block.type === "section") {
                      return (
                        <div
                          key={block.id}
                          id={block.id}
                          className="rule-section"
                        >
                          <span className="sec-number-badge">
                            {String(block.sectionNumber).padStart(2, "0")}
                          </span>
                          <span className="sec-title-text">{block.text}</span>
                        </div>
                      );
                    }

                    if (block.type === "alert") {
                      return (
                        <div key={block.index} className="rule-alert-box">
                          <span className="alert-icon">⚠️</span>
                          <div className="alert-text">{block.text}</div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={block.index}
                        className={`rule-item ${
                          block.isBullet ? "is-bullet" : "is-paragraph"
                        }`}
                        onClick={() => handleCopyRule(block.text, block.index)}
                        title="Clique para copiar este artigo"
                      >
                        {block.isBullet && (
                          <span className="rule-bullet-dot"></span>
                        )}
                        <span className="rule-item-text">{block.text}</span>
                        <span
                          className={`copy-rule-hint ${
                            copiedIndex === block.index ? "copied" : ""
                          }`}
                        >
                          {copiedIndex === block.index ? "✓ Copiado!" : "📋"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Rodapé do Documento */}
            <div className="rules-footer">
              <div className="footer-seal">
                <span>⚖️ Documento Oficial Registrado — O ADR</span>
                <span className="footer-dot">•</span>
                <span>Dica: Clique em qualquer regra para copiá-la</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Regras;
