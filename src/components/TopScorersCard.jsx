import React from "react";

function TopScorersCard({ players }) {
  return (
    <div
      className="info-card"
      style={{
        background:
          "linear-gradient(145deg, rgba(30,30,30,0.9), rgba(15,15,15,0.95))",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <h3
        style={{
          borderBottom: "1px solid rgba(212, 175, 55, 0.3)",
          paddingBottom: "10px",
          color: "#d4af37",
          fontSize: "14px",
          letterSpacing: "1px",
        }}
      >
        Artilharia ADR
      </h3>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          marginTop: "10px",
        }}
      >
        {players.slice(0, 3).map((p, i) => (
          <div
            key={p.id}
            className="card-row"
            style={{
              background: "rgba(255,255,255,0.02)",
              padding: "10px 12px",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  color: i === 0 ? "#d4af37" : "#555",
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
