import React from "react";

function TopAssistsCard({ players }) {
  // Agora usamos os players que já vêm ordenados e calculados do Home.js
  const topPlayers = (players || [])
    .filter((p) => p.assists > 0) // Opcional: só mostra quem tem assistência
    .slice(0, 3);

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
          borderBottom: "1px solid rgba(33, 150, 243, 0.3)",
          paddingBottom: "10px",
          color: "#2196f3",
          fontSize: "14px",
          letterSpacing: "1px",
          marginBottom: "10px",
        }}
      >
        LÍDERES EM ASSISTÊNCIAS
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {topPlayers.length > 0 ? (
          topPlayers.map((p, i) => (
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
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span
                  style={{
                    color: i === 0 ? "#2196f3" : "#555",
                    fontWeight: "900",
                    fontSize: "12px",
                  }}
                >
                  0{i + 1}
                </span>
                <span
                  style={{ fontSize: "13px", fontWeight: "500", color: "#eee" }}
                >
                  {p.name}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <span
                  style={{ fontSize: "16px", fontWeight: "800", color: "#fff" }}
                >
                  {p.assists} {/* Mudado de totalAssists para assists */}
                </span>
                <small
                  style={{ fontSize: "9px", color: "#666", marginTop: "4px" }}
                >
                  AST
                </small>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              color: "#666",
              fontSize: "12px",
              textAlign: "center",
              padding: "10px",
            }}
          >
            Nenhuma assistência registrada
          </div>
        )}
      </div>
    </div>
  );
}

export default TopAssistsCard;
