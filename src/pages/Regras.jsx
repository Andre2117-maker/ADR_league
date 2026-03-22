import { useState, useEffect, useMemo } from "react"; // 1. Adicionado useMemo
import { db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore"; // 2. Removido getDoc
import "../styles/rules.css";
import Footer from "../components/Footer";

function Regras({ isAdmin }) {
  const [textoRegras, setTextoRegras] = useState("Carregando regulamento...");
  const [isSaving, setIsSaving] = useState(false);

  // 3. useMemo resolve o erro de dependência do useEffect
  // Ele garante que a referência do documento não mude a cada renderização
  const regrasDocRef = useMemo(() => doc(db, "settings", "regulamento"), []);

  useEffect(() => {
    const unsubscribe = onSnapshot(regrasDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setTextoRegras(docSnap.data().content);
      } else {
        setTextoRegras("⚽ Pontuação...");
      }
    });

    return () => unsubscribe();
  }, [regrasDocRef]); // 4. Agora podemos incluir com segurança no array de dependências

  const handleSaveToFirebase = async (novoTexto) => {
    setIsSaving(true);
    try {
      await setDoc(regrasDocRef, {
        content: novoTexto,
        lastUpdated: new Date(),
      });

      // Pequeno delay apenas para o feedback visual não piscar rápido demais
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      console.error("Erro ao salvar regras:", error);
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const valor = e.target.value;
    setTextoRegras(valor);
    handleSaveToFirebase(valor);
  };

  return (
    <div className="page-container1">
      <h1 className="page-title">Regulamento Oficial</h1>

      <div className="rules-wrapper">
        <div className="pdf-actions">
          <a
            href="/docs/Regras.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-download-btn"
          >
            📖 Abrir Livro de Regras Completo (PDF)
          </a>
        </div>

        <div className={`rules-paper ${isAdmin ? "editable" : ""}`}>
          <div className="rules-header">
            <div className="doc-stamp">ADR LEAGUE</div>
            <div className="doc-date">Vigência: 2026</div>
          </div>

          {isAdmin ? (
            <textarea
              className="rules-textarea"
              value={textoRegras}
              onChange={handleChange}
              spellCheck={false}
              placeholder="Digite as regras aqui..."
            />
          ) : (
            <div className="rules-content">
              {textoRegras.split("\n").map((line, index) => (
                <div
                  key={index}
                  className={
                    line.trim().startsWith("-") || line.trim().match(/^\d\./)
                      ? "rule-item"
                      : "rule-section"
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          )}

          <div className="rules-footer">
            {isAdmin ? (
              <span className={`saving-status ${isSaving ? "blink" : ""}`}>
                {isSaving ? "💾 Salvando na Nuvem..." : "✅ Sincronizado"}
              </span>
            ) : (
              <span>Documento oficial registrado.</span>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Regras;
