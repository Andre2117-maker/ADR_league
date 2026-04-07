import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home/legends.css";
import Footer from "../components/Footer";

const MILESTONES = [
  { goals: 200, title: "Lenda Suprema", color: "#00ffff", icon: "💎" },
  { goals: 150, title: "Imortal da ADR", color: "#e5e4e2", icon: "🛡️" },
  { goals: 100, title: "Centenário de Ouro", color: "#d4af37", icon: "👑" },
  { goals: 50, title: "Artilheiro de Elite", color: "#c0c0c0", icon: "🏹" },
];

const Legends = ({ playersWithStats }) => {
  const navigate = useNavigate();

  // Filtra apenas quem tem pelo menos 50 gols
  const legendPlayers =
    playersWithStats?.filter((p) => (p.goals || 0) >= 50) || [];

  return (
    <div className="legends-wrapper">
      <header className="legends-header">
        <h1 className="legends-main-title">HALL DA FAMA</h1>
        <p className="legends-subtitle">
          OS MAIORES ARTILHEIROS DA HISTÓRIA DA ADR
        </p>
      </header>

      <div className="legends-container">
        {MILESTONES.map((milestone) => {
          // Encontra jogadores que pertencem a esta categoria específica
          const playersInCategory = legendPlayers
            .filter(
              (p) =>
                p.goals >= milestone.goals &&
                p.goals <
                  (MILESTONES[MILESTONES.indexOf(milestone) - 1]?.goals ||
                    9999),
            )
            .sort((a, b) => b.goals - a.goals);

          if (playersInCategory.length === 0) return null;

          return (
            <section key={milestone.goals} className="milestone-section">
              <div
                className="milestone-banner"
                style={{ borderColor: milestone.color }}
              >
                <span className="milestone-icon">{milestone.icon}</span>
                <div className="milestone-text">
                  <h2 style={{ color: milestone.color }}>{milestone.title}</h2>
                  <span>MARCA DE {milestone.goals}+ GOLS</span>
                </div>
              </div>

              <div className="legends-grid">
                {playersInCategory.map((p) => (
                  <div
                    key={p.id}
                    className="legend-card"
                    onClick={() => navigate(`/player/${p.id}`)}
                  >
                    <div className="legend-photo-wrapper">
                      <img src={p.photo} alt={p.name} className="legend-img" />
                      <div
                        className="legend-goal-badge"
                        style={{ backgroundColor: milestone.color }}
                      >
                        {p.goals} GOLS
                      </div>
                    </div>
                    <h3 className="legend-name">{p.name.toUpperCase()}</h3>
                    {p.isAnonymous && (
                      <span className="legend-status">INATIVO</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {legendPlayers.length === 0 && (
          <div className="no-legends">
            <p>
              Ainda não há jogadores com 50+ gols. A história está sendo
              escrita...
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Legends;
