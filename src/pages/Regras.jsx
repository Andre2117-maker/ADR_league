import { useState } from "react";
import "../styles/rules.css";

function Regras({ isAdmin }) {
  // Estado inicial com o texto que vi na sua imagem
  const [textoRegras, setTextoRegras] = useState(`⚽ Pontuação
- Vitória: 3 pontos
- Derrota: 0 pontos
Se der empate, não haverá prorrogação e vai direto para os pênaltis:
- Vencedor nos pênaltis: 3 pontos
- Perdedor nos pênaltis: 0 ponto

🥇 Premiação
- 1º lugar: Troféu
- 2º lugar: Caixa de Bombom (paga pelo Josué)
- 3º lugar: High-five

💀 Punição
- Último lugar sofre punição definida pelo grupo

📜 Critérios de desempate
1. Pontos
2. Gols
3. Assistências
4. Ordem alfabética

OBS: Minimo de jogadores para a partida contar na tabela são 8 membros oficiais do ADR`);

  const [isSaving, setIsSaving] = useState(false);

  // Simula o salvamento automático quando o texto muda
  const handleChange = (e) => {
    setTextoRegras(e.target.value);
    setIsSaving(true);

    // Debounce fake para simular salvamento
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div className="page-container1">
      <h1 className="page-title">Regulamento Oficial</h1>

      <div className="rules-wrapper">
        {/* Adicionamos o botão de download/abertura externa aqui */}
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
          {/* ... (Todo o seu código do rules-header, content e footer continua aqui igual) ... */}
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
              <span
                className={isSaving ? "saving-status blink" : "saving-status"}
              >
                {isSaving
                  ? "💾 Salvando alterações..."
                  : "✅ Todas as alterações salvas"}
              </span>
            ) : (
              <span>Documento aprovado pela diretoria.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Regras;
