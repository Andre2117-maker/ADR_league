import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoADR from "../../assets/logo.png"; // Importando a logo
import "../../styles/Playerpage/matchHistory.css";

const MatchHistory = ({ matches, player }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("TREINO");

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    if (dateStr.includes("/")) return dateStr.substring(0, 5);
    const [, month, day] = dateStr.split("T")[0].split("-");
    return `${day}/${month}`;
  };

  const filteredMatches = matches.filter(
    (m) => (m.type || "TREINO").toUpperCase() === activeTab,
  );

  const sortedMatches = [...filteredMatches].sort(
    (a, b) => (b.order || 0) - (a.order || 0),
  );

  return (
    <div className="adr-history-container">
      <div className="adr-history-header">
        <div className="adr-history-tabs">
          <button
            className={`adr-tab-btn ${activeTab === "TREINO" ? "active" : ""}`}
            onClick={() => setActiveTab("TREINO")}
          >
            Treinos
          </button>
          <button
            className={`adr-tab-btn ${activeTab === "AMISTOSO" ? "active" : ""}`}
            onClick={() => setActiveTab("AMISTOSO")}
          >
            Amistosos
          </button>
        </div>
      </div>

      <div className="adr-history-list">
        {sortedMatches.length > 0 ? (
          sortedMatches.map((m) => {
            const isTeamA = m.teamA.players.some(
              (id) => String(id) === String(player.id),
            );

            const sA =
              m.events?.filter(
                (e) =>
                  (e.team === "A" && e.type === "GOAL") ||
                  (e.team === "B" && e.type === "OWN_GOAL"),
              ).length || 0;

            const sB =
              m.events?.filter(
                (e) =>
                  (e.team === "B" && e.type === "GOAL") ||
                  (e.team === "A" && e.type === "OWN_GOAL"),
              ).length || 0;

            let result = "draw";
            if (sA > sB) result = isTeamA ? "win" : "loss";
            else if (sB > sA) result = !isTeamA ? "win" : "loss";

            if (sA === sB && m.penaltiesWinner) {
              const wonPenalties =
                (m.penaltiesWinner === "A" && isTeamA) ||
                (m.penaltiesWinner === "B" && !isTeamA);
              result = wonPenalties ? "win" : "loss";
            }

            const pG =
              m.events?.filter(
                (e) =>
                  String(e.playerId) === String(player.id) && e.type === "GOAL",
              ).length || 0;
            const pA =
              m.events?.filter(
                (e) =>
                  e.type === "GOAL" && String(e.assistId) === String(player.id),
              ).length || 0;

            return (
              <div
                key={m.id}
                className={`adr-match-card result-${result} type-${activeTab.toLowerCase()}`}
                onClick={() => navigate(`/match/${m.id}`)}
              >
                <div className="adr-match-info">
                  <div className={`adr-status-indicator ${result}`}>
                    {result === "win" ? "V" : result === "loss" ? "D" : "E"}
                  </div>
                  <span className="adr-match-date">{formatDate(m.date)}</span>
                </div>

                <div className="adr-match-main">
                  {/* Nome Time A (Sempre visível no Desktop, some no Mobile via CSS) */}
                  <span
                    className={`adr-team-name team-a ${isTeamA ? "highlight" : ""}`}
                  >
                    {m.teamA.name}
                  </span>

                  {/* Bloco Central: Logo A + Placar + Logo B */}
                  <div className="adr-score-wrapper">
                    <img
                      src={m.teamA.logo || LogoADR}
                      alt="Logo A"
                      className="adr-history-logo"
                    />

                    <div className="adr-match-score">
                      <span className="score-num">{sA}</span>
                      <span className="score-divider">:</span>
                      <span className="score-num">{sB}</span>
                    </div>

                    <img
                      src={m.teamB.logo || LogoADR}
                      alt="Logo B"
                      className="adr-history-logo"
                    />
                  </div>

                  {/* Nome Time B */}
                  <span
                    className={`adr-team-name team-b ${!isTeamA ? "highlight" : ""}`}
                  >
                    {m.teamB.name}
                  </span>
                </div>

                <div className="adr-match-player-stats">
                  <div className="stats-badges">
                    {pG > 0 && <span className="badge-goal">+{pG} G</span>}
                    {pA > 0 && <span className="badge-assist">+{pA} A</span>}
                  </div>
                  <span className="adr-match-chevron">›</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="adr-empty-history">
            Nenhuma partida registrada nesta categoria.
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistory;
