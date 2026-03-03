import React from "react";

function AwardsCard() {
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
    <div
      className="info-card"
      style={{
        background:
          "linear-gradient(145deg, rgba(40,40,40,0.9), rgba(20,20,20,0.95))",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <h3
        style={{
          color: "#fff",
          fontSize: "14px",
          textAlign: "center",
          marginBottom: "15px",
          textTransform: "uppercase",
          letterSpacing: "2px",
        }}
      >
        🏛️ Hall da Fama 2025
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
        {awards.map((award, idx) => (
          <div
            key={idx}
            style={{
              position: "relative",
              padding: "15px",
              borderRadius: "12px",
              background: `linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 100%)`,
              borderLeft: `3px solid ${award.color}`,
              overflow: "hidden",
            }}
          >
            <span
              style={{
                position: "absolute",
                right: "-10px",
                bottom: "-10px",
                fontSize: "40px",
                opacity: 0.1,
                transform: "rotate(-15deg)",
              }}
            >
              {award.icon}
            </span>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: "9px",
                  color: award.color,
                  fontWeight: "800",
                  textTransform: "uppercase",
                }}
              >
                {award.title}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "900",
                  color: "#fff",
                  marginTop: "2px",
                }}
              >
                {award.winner}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AwardsCard;
