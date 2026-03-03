// src/components/PlayerScoutPanel.jsx
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function PlayerScoutPanel({ player, stats, bestPartner }) {
  // Se não houver jogador selecionado/hover, exibe o estado vazio
  if (!player) {
    return (
      <div className="empty-state-card">
        <p>Passe o mouse sobre um atleta para ver o scout</p>
      </div>
    );
  }

  return (
    <div className="player-profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          {player.photo ? (
            <img
              src={player.photo}
              alt={player.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            player.name.charAt(0)
          )}
        </div>
        <h2>{player.name}</h2>
        <span className="profile-foot">{player.strongFoot || "Destro"}</span>
      </div>

      <div className="profile-main-stats">
        <div className="stat-box">
          <span className="stat-val">{stats?.winRate || 0}%</span>
          <span className="stat-lab">Vitórias</span>
        </div>
        <div className="stat-box">
          <span className="stat-val">
            {(player.goals / (player.games || 1)).toFixed(1)}
          </span>
          <span className="stat-lab">Gols/J</span>
        </div>
      </div>

      <div className="profile-info-list">
        <div className="info-item">
          <span>🏆 Títulos ADR</span>
          <strong>{player.titlesADR || 0}</strong>
        </div>
        <div className="info-item">
          <span>🤝 Melhor Parceiro</span>
          <strong>{bestPartner || "Nenhum"}</strong>
        </div>
        <div className="info-item">
          <span>🦶 Perna boa</span>
          <strong>{player.strongFoot || "Indefinido"}</strong>
        </div>

        <div
          className="profile-radar-section"
          style={{
            width: "100%",
            height: 220,
            marginTop: "15px",
            borderTop: "1px solid #333",
            paddingTop: "10px",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              cx="50%"
              cy="50%"
              outerRadius="65%"
              data={[
                { subject: "Vel", A: player.skills?.velocidade || 50 },
                { subject: "Cor", A: player.skills?.corpo || 50 },
                { subject: "Chu", A: player.skills?.chute || 50 },
                { subject: "Mir", A: player.skills?.mira || 50 },
                { subject: "Pas", A: player.skills?.passe || 50 },
                { subject: "Def", A: player.skills?.defesa || 50 },
              ]}
            >
              <PolarGrid stroke="#444" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#aaa", fontSize: 9 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Skills"
                dataKey="A"
                stroke="#d4af37"
                fill="#d4af37"
                fillOpacity={0.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="profile-footer">
        <p>Temporada 2026</p>
        <div className="badge-adr">ATLETA ADR</div>
      </div>
    </div>
  );
}
