import React from "react";
import "./awards.css";

function AwardsCard() {
  const currentYear = new Date().getFullYear(); // Ano dinâmico automático

  const awards = [
    { title: "MVP da Temporada", winner: "Davi", icon: "🏆", color: "#d4af37" },
    {
      title: "Paredão do Ano",
      winner: "Thaiane",
      icon: "🧤",
      color: "#4caf50",
    },
    { title: "Puskás ADR", winner: "Renzo", icon: "🔥", color: "#ff9800" },
  ];

  return (
    <div className="aw-card">
      <h3 className="aw-title">⭐ Hall da Fama {currentYear}</h3>

      <div className="aw-grid">
        {awards.map((award, idx) => (
          <div
            key={idx}
            className="aw-item"
            // Passamos a cor dinâmica como uma variável CSS para usar no arquivo externo
            style={{ "--award-color": award.color }}
          >
            <span className="aw-icon-bg">{award.icon}</span>

            <div className="aw-content">
              <div className="aw-award-title">{award.title}</div>
              <div className="aw-winner-name">{award.winner}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AwardsCard;
