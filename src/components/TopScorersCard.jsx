import React from "react";

// Adicionamos a prop 'limit' com valor padrão 3
function TopScorersCard({ players = [], limit = 3 }) {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  return (
    <div
      className="info-card"
      style={{
        background:
          "linear-gradient(145deg, rgba(30,30,30,0.9), rgba(15,15,15,0.95))",
        border: "1px solid rgba(255,255,255,0.05)",
        padding: "15px",
        borderRadius: "12px",
      }}
    >
      <h3
        style={{
          borderBottom: "1px solid rgba(212, 175, 55, 0.3)",
          paddingBottom: "10px",
          color: "#d4af37",
          fontSize: "14px",
          letterSpacing: "1px",
          marginBottom: "10px",
        }}
      >
        ARTILHARIA ADR
      </h3>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          marginTop: "10px",
        }}
      >
        {/* Usamos o limit aqui no slice */}
        {players.slice(0, limit).map((p, i) => (
          <div
            key={p.id}
            className="card-row"
            style={{
              background: "rgba(255,255,255,0.02)",
              padding: "10px 12px",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  color: i === 0 ? "#d4af37" : "#555",
                  fontWeight: "900",
                  fontSize: "12px",
                  minWidth: "20px",
                }}
              >
                {i + 1 < 10 ? `0${i + 1}` : i + 1}
              </span>

              {/* Foto do Jogador - Padronizada */}
              <img
                src={p.photo || defaultAvatar}
                alt={p.name}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "4px",
                  objectFit: "cover",
                  background: "#000",
                  border:
                    i === 0
                      ? "1px solid #d4af37"
                      : "1px solid rgba(255,255,255,0.1)",
                }}
              />

              <span
                style={{ fontSize: "13px", fontWeight: "500", color: "#eee" }}
              >
                {p.name}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{ fontSize: "16px", fontWeight: "800", color: "#fff" }}
              >
                {p.goals}
              </span>
              <small
                style={{ fontSize: "9px", color: "#666", marginTop: "4px" }}
              >
                GOLS
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopScorersCard;
