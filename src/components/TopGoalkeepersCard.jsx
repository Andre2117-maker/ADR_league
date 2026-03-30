import React from "react";
import "../styles/Tabelas/goalkeepers.css";

// Adicionamos a prop 'limit' com valor padrão 5
function TopGoalkeepersCard({ players = [], matches = [], limit = 5 }) {
  const MIN_GAMES = 2;
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  if (!players.length || !matches.length) {
    return (
      <div className="gk-card">
        <h3 className="gk-title">Paredões da Temporada</h3>
        <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
          Aguardando dados...
        </p>
      </div>
    );
  }

  const goalkeeperStats = players
    .map((player) => {
      let totalCleanSheets = 0;
      let totalGoalsAgainst = 0;
      let gamesAsGK = 0;

      matches?.forEach((match) => {
        const isA = match.teamA?.goalkeeperId === player.id;
        const isB = match.teamB?.goalkeeperId === player.id;

        if (isA || isB) {
          gamesAsGK++;
          const events = match.events || [];
          const goals = isA
            ? events.filter(
                (e) =>
                  (e.type === "GOAL" && e.team === "B") ||
                  (e.type === "OWN_GOAL" && e.team === "A"),
              ).length
            : events.filter(
                (e) =>
                  (e.type === "GOAL" && e.team === "A") ||
                  (e.type === "OWN_GOAL" && e.team === "B"),
              ).length;

          totalGoalsAgainst += goals;
          if (goals === 0) totalCleanSheets++;
        }
      });

      const mgs = gamesAsGK > 0 ? totalGoalsAgainst / gamesAsGK : 999;
      return { ...player, totalCleanSheets, totalGoalsAgainst, gamesAsGK, mgs };
    })
    .filter((p) => p.gamesAsGK >= MIN_GAMES && !p.isAnonymous)
    .sort((a, b) => a.mgs - b.mgs || b.totalCleanSheets - a.totalCleanSheets)
    .slice(0, limit); // Agora usa a variável 'limit'

  return (
    <div className="gk-card">
      <h3 className="gk-title">Paredões da Temporada</h3>

      <div className="gk-header">
        <span>Goleiro</span>
        <div className="gk-header-stats">
          <span className="gk-stat-label">MGS</span>
          <span className="gk-stat-label">CS</span>
          <span className="gk-stat-label">J</span>
        </div>
      </div>

      <div className="gk-list">
        {goalkeeperStats.length > 0 ? (
          goalkeeperStats.map((p, i) => (
            <div key={p.id} className="gk-row">
              <div className="gk-info">
                <span className={`gk-rank ${i === 0 ? "is-first" : ""}`}>
                  {i + 1}º
                </span>
                {/* Adicionada a foto do jogador */}
                <img
                  src={p.photo || defaultAvatar}
                  alt={p.name}
                  className="gk-avatar-img"
                />
                <span className="gk-name">{p.name}</span>
              </div>
              <div className="gk-stats">
                <span className="gk-val mgs">{p.mgs.toFixed(2)}</span>
                <span className="gk-val cs">{p.totalCleanSheets}</span>
                <span className="gk-val j">{p.gamesAsGK}</span>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "#666", textAlign: "center", fontSize: "0.8rem" }}>
            Nenhum goleiro atingiu o mínimo de {MIN_GAMES} jogos.
          </p>
        )}
      </div>

      <div className="gk-footer">
        <span>
          <strong>MGS</strong> Média de Gols
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
