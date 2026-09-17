import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import "../styles/rules.css";
import Footer from "../components/Footer";

function Regras({ isAdmin }) {
  const [textoRemoto, setTextoRemoto] = useState("Carregando regulamento...");
  const [textoLocal, setTextoLocal] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const regrasDocRef = useMemo(() => doc(db, "settings", "regulamento"), []);

  useEffect(() => {
    const unsubscribe = onSnapshot(regrasDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const content = docSnap.data().content;
        setTextoRemoto(content);
        if (!isLoaded) {
          setTextoLocal(content);
          setIsLoaded(true);
        }
      } else {
        setTextoRemoto("⚽ Regras em branco...");
        if (!isLoaded) {
          setTextoLocal("⚽ Regras em branco...");
          setIsLoaded(true);
        }
      }
    });

    return () => unsubscribe();
  }, [regrasDocRef, isLoaded]);

  useEffect(() => {
    if (textoLocal === textoRemoto || !isLoaded) return;

    setIsSaving(true);

    const temporizadorDeSalvamento = setTimeout(async () => {
      try {
        await setDoc(regrasDocRef, {
          content: textoLocal,
          lastUpdated: new Date(),
        });
        setIsSaving(false);
      } catch (error) {
        console.error("Erro ao salvar regras:", error);
        setIsSaving(false);
      }
    }, 1500);

    return () => clearTimeout(temporizadorDeSalvamento);
  }, [textoLocal, textoRemoto, regrasDocRef, isLoaded]);

  const handleChange = (e) => {
    setTextoLocal(e.target.value);
  };

  const textoParaExibir = isAdmin ? textoLocal : textoRemoto;

  return (
    <div>
      <div className="page-container1">
        <h1 className="page-title1">Regulamento Oficial</h1>

        <div className="rules-wrapper">
          <div className="pdf-actions">
            <a
              href="/docs/Regras.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="pdf-download-btn"
            >
              📖 Abrir Livro de Regras (PDF)
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
                value={textoLocal}
                onChange={handleChange}
                spellCheck={false}
                placeholder="Digite as regras aqui..."
              />
            ) : (
              <div className="rules-content">
                {textoParaExibir.split("\n").map((line, index) => {
                  const textoLinha = line.trim();
                  if (!textoLinha) return <br key={index} />;

                  return (
                    <div
                      key={index}
                      className={
                        textoLinha.startsWith("-") || textoLinha.match(/^\d\./)
                          ? "rule-item"
                          : "rule-section"
                      }
                    >
                      {line}
                    </div>
                  );
                })}
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
      </div>
      <Footer />
    </div>
  );
}

export default Regras;
