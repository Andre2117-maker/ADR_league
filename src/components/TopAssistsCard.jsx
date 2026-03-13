import React from "react";

function TopAssistsCard({ matches, players }) {
  const safeMatches = matches || [];
  const safePlayers = players || [];

  const playersWithStats = safePlayers.map((player) => {
    let totalAssists = 0;

    safeMatches.forEach((match) => {
      if (match.events && Array.isArray(match.events)) {
        // Lógica Híbrida: Soma assistências antigas E novas
        const assistsInMatch = match.events.reduce((count, e) => {
          // Caso 1: Evento antigo de tipo 'ASSIST'
          if (e.type === "ASSIST" && String(e.playerId) === String(player.id)) {
            return count + 1;
          }
          // Caso 2: Evento novo de tipo 'GOAL' com assistId
          if (e.type === "GOAL" && String(e.assistId) === String(player.id)) {
            return count + 1;
          }
          return count;
        }, 0);

        totalAssists += assistsInMatch;
      }
    });

    return { ...player, totalAssists };
  });

  const topPlayers = playersWithStats
    .sort((a, b) => b.totalAssists - a.totalAssists)
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
        {topPlayers.map((p, i) => (
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{ fontSize: "16px", fontWeight: "800", color: "#fff" }}
              >
                {p.totalAssists}
              </span>
              <small
                style={{ fontSize: "9px", color: "#666", marginTop: "4px" }}
              >
                AST
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopAssistsCard;
