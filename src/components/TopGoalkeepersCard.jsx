import React from "react";

function TopGoalkeepersCard({ players, matches }) {
  const goalkeeperStats = players
    .map((player) => {
      let totalCleanSheets = 0;
      let totalGoalsAgainst = 0;
      let gamesAsGK = 0;

      matches.forEach((match) => {
        if (match.teamA.goalkeeperId === player.id) {
          gamesAsGK++;
          const goals = match.events.filter(
            (e) =>
              (e.type === "GOAL" && e.team === "B") ||
              (e.type === "OWN_GOAL" && e.team === "A"),
          ).length;
          totalGoalsAgainst += goals;
          if (goals === 0) totalCleanSheets++;
        }
        if (match.teamB.goalkeeperId === player.id) {
          gamesAsGK++;
          const goals = match.events.filter(
            (e) =>
              (e.type === "GOAL" && e.team === "A") ||
              (e.type === "OWN_GOAL" && e.team === "B"),
          ).length;
          totalGoalsAgainst += goals;
          if (goals === 0) totalCleanSheets++;
        }
      });
      return { ...player, totalCleanSheets, totalGoalsAgainst, gamesAsGK };
    })
    // FILTRO: Só entra quem jogou no gol E NÃO é anônimo
    .filter((p) => p.gamesAsGK > 0 && !p.isAnonymous)
    .sort(
      (a, b) =>
        a.totalGoalsAgainst - b.totalGoalsAgainst ||
        b.totalCleanSheets - a.totalCleanSheets,
    )
    .slice(0, 5); // Mantém o Top 5

  const colWidth = "30px";

  return (
    <div
      className="info-card"
      style={{
        background:
          "linear-gradient(145deg, rgba(30,30,30,0.9), rgba(15,15,15,0.95))",
        border: "1px solid rgba(255,255,255,0.05)",
        padding: "15px",
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
        Paredões da Temporada
      </h3>

      <div
        className="card-row"
        style={{
          padding: "8px",
          opacity: 0.4,
          fontSize: "9px",
          fontWeight: "800",
          textTransform: "uppercase",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Goleiro</span>
        <div style={{ display: "flex", gap: "15px" }}>
          <span style={{ width: colWidth, textAlign: "center" }}>GS</span>
          <span style={{ width: colWidth, textAlign: "center" }}>CS</span>
          <span style={{ width: colWidth, textAlign: "center" }}>J</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {goalkeeperStats.length > 0 ? (
          goalkeeperStats.map((p, i) => (
            <div
              key={p.id}
              className="card-row"
              style={{
                background: "rgba(255,255,255,0.03)",
                padding: "10px 8px",
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: i === 0 ? "#d4af37" : "#666",
                    fontWeight: "900",
                    width: "18px",
                  }}
                >
                  {i + 1}º
                </span>
                <span
                  style={{ fontSize: "13px", fontWeight: "500", color: "#eee" }}
                >
                  {p.name}
                </span>
              </div>

              <div
                style={{ display: "flex", gap: "15px", alignItems: "center" }}
              >
                <span
                  style={{
                    color: "#ff5252",
                    fontWeight: "700",
                    fontSize: "14px",
                    width: colWidth,
                    textAlign: "center",
                  }}
                >
                  {p.totalGoalsAgainst}
                </span>
                <span
                  style={{
                    color: "#4caf50",
                    fontWeight: "800",
                    fontSize: "14px",
                    width: colWidth,
                    textAlign: "center",
                  }}
                >
                  {p.totalCleanSheets}
                </span>
                <span
                  style={{
                    color: "#aaa",
                    fontWeight: "600",
                    fontSize: "13px",
                    width: colWidth,
                    textAlign: "center",
                  }}
                >
                  {p.gamesAsGK}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              opacity: 0.5,
              fontSize: "12px",
            }}
          >
            Aguardando primeiras defesas... 🧤
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "12px",
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          fontSize: "9px",
          opacity: 0.3,
          textTransform: "uppercase",
        }}
      >
        <span>
          <strong>GS</strong> Gols Sofridos
        </span>
        <span>
          <strong>CS</strong> Clean Sheets
        </span>
        <span>
          <strong>J</strong> Jogos
        </span>
      </div>
    </div>
  );
}

export default TopGoalkeepersCard;
