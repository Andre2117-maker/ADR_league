import React, { useState, useMemo } from "react";
import { useDreamTeamMath } from "../data/useDreamTeamMath";
import "../styles/DreamTeam/dreamteam.css";

// Mapeamento das Formações e Conexões
const FORMATIONS = {
  2: {
    nodes: [
      { top: 85, left: 50, role: "GK" },
      { top: 25, left: 50, role: "ATT" },
    ],
    links: [[0, 1]],
  },
  3: {
    nodes: [
      { top: 85, left: 50, role: "GK" },
      { top: 35, left: 25, role: "DEF" },
      { top: 35, left: 75, role: "ATT" },
    ],
    links: [
      [0, 1],
      [0, 2],
      [1, 2],
    ],
  },
  4: {
    nodes: [
      { top: 85, left: 50, role: "GK" },
      { top: 55, left: 25, role: "DEF" },
      { top: 55, left: 75, role: "DEF" },
      { top: 20, left: 50, role: "ATT" },
    ],
    links: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 3],
    ],
  },
  5: {
    nodes: [
      { top: 85, left: 50, role: "GK" },
      { top: 60, left: 25, role: "DEF" },
      { top: 60, left: 75, role: "DEF" },
      { top: 30, left: 30, role: "MID" },
      { top: 30, left: 70, role: "ATT" },
    ],
    links: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 4],
      [1, 4],
      [2, 3],
    ],
  },
  6: {
    nodes: [
      { top: 85, left: 50, role: "GK" },
      { top: 60, left: 20, role: "DEF" },
      { top: 60, left: 50, role: "DEF" },
      { top: 60, left: 80, role: "DEF" },
      { top: 30, left: 35, role: "MID" },
      { top: 30, left: 65, role: "ATT" },
    ],
    links: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [2, 3],
      [1, 4],
      [2, 4],
      [2, 5],
      [3, 5],
      [4, 5],
    ],
  },
};

export default function DreamTeam({ players = [], matches = [] }) {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const { getChemistryBetween } = useDreamTeamMath(matches);

  const [teamSize, setTeamSize] = useState(5);
  const [selectedSquad, setSelectedSquad] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);

  const availablePlayers = useMemo(() => {
    return players.filter((p) => !p.isAnonymous && p.isAnonymous !== true);
  }, [players]);

  const handleSizeChange = (size) => {
    setTeamSize(size);
    setSelectedSquad({});
    setActiveSlot(null);
  };

  const selectPlayerForSlot = (player) => {
    setSelectedSquad((prev) => ({ ...prev, [activeSlot]: player }));
    setActiveSlot(null);
  };

  // =============== LÓGICA DE ESTATÍSTICAS E OVERALL (ATUALIZADA) ===============

  const getStat = (player, statName) => {
    return player?.skills?.[statName] || 50;
  };

  const calculateOVR = (player, node = null) => {
    if (!player.skills) return 50;

    const pac = getStat(player, "velocidade");
    const sho = getStat(player, "chute");
    const pas = getStat(player, "passe");
    const dri = getStat(player, "mira");
    const def = getStat(player, "defesa");
    const phy = getStat(player, "corpo");

    const formulas = {
      ATT:
        sho * 0.3 + pac * 0.2 + dri * 0.2 + pas * 0.1 + phy * 0.1 + def * 0.1,
      MID:
        pas * 0.3 + dri * 0.2 + sho * 0.1 + pac * 0.1 + phy * 0.15 + def * 0.15,
      DEF:
        def * 0.3 + phy * 0.2 + pac * 0.15 + pas * 0.15 + dri * 0.1 + sho * 0.1,
      GK: def * 0.4 + dri * 0.3 + pas * 0.1 + phy * 0.1 + pac * 0.1,
    };

    // SE O JOGADOR ESTIVER NO CAMPO: Força a nota baseada na posição que ele foi colocado!
    if (node) {
      if (node.role === "GK") return Math.round(formulas.GK);
      if (node.role === "DEF") return Math.round(formulas.DEF);
      if (node.role === "MID") return Math.round(formulas.MID);
      if (node.role === "ATT") return Math.round(formulas.ATT);
    }

    // SE ESTIVER NO MENU DE BUSCA: Mostra a nota oficial da vocação natural dele
    const positions = player.positions || [];
    if (positions.length === 0) {
      return Math.round(Math.max(formulas.ATT, formulas.MID, formulas.DEF));
    }

    let bestOvr = 0;
    positions.forEach((pos) => {
      let currentOvr = 0;
      if (["ATA", "PIV", "PE", "PD"].includes(pos)) currentOvr = formulas.ATT;
      else if (["MEI", "ALE", "ALD"].includes(pos)) currentOvr = formulas.MID;
      else if (["FIX", "ZAG", "LE", "LD", "VOL"].includes(pos))
        currentOvr = formulas.DEF;
      else if (pos === "GOL") currentOvr = formulas.GK;

      if (currentOvr > bestOvr) bestOvr = currentOvr;
    });

    return Math.round(bestOvr) || 50;
  };
  // =========================================================================

  const formation = FORMATIONS[teamSize];

  return (
    <div className="dream-team-container">
      <h1 className="page-title">ADR Ultimate Team</h1>

      <div className="size-selector">
        {[2, 3, 4, 5, 6].map((size) => (
          <button
            key={size}
            className={`size-btn ${teamSize === size ? "active" : ""}`}
            onClick={() => handleSizeChange(size)}
          >
            Formação {size}v{size}
          </button>
        ))}
      </div>

      <div className="tactical-pitch-wrapper">
        <div className="pitch-grass">
          <svg className="chemistry-lines-layer">
            {formation.links.map(([i, j], index) => {
              const nodeA = formation.nodes[i];
              const nodeB = formation.nodes[j];
              const playerA = selectedSquad[i];
              const playerB = selectedSquad[j];

              let lineColor = "rgba(255, 255, 255, 0.2)";

              if (playerA && playerB) {
                const chem = getChemistryBetween(playerA.id, playerB.id);
                if (chem.color === "green") lineColor = "#00e676";
                else if (chem.color === "yellow") lineColor = "#ffea00";
                else if (chem.color === "red") lineColor = "#ff1744";
                else lineColor = "#9e9e9e";
              }

              return (
                <line
                  key={`link-${index}`}
                  x1={`${nodeA.left}%`}
                  y1={`${nodeA.top}%`}
                  x2={`${nodeB.left}%`}
                  y2={`${nodeB.top}%`}
                  stroke={lineColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="chem-line"
                />
              );
            })}
          </svg>

          <div className="players-layer">
            {formation.nodes.map((node, index) => {
              const player = selectedSquad[index];

              return (
                <div
                  key={index}
                  className={`fut-card-wrapper ${player ? "filled" : ""}`}
                  style={{ top: `${node.top}%`, left: `${node.left}%` }}
                  onClick={() => setActiveSlot(index)}
                >
                  {player ? (
                    <div className="fut-card gold-card">
                      <div className="card-top-info">
                        <span className="card-rating">
                          {calculateOVR(player)}
                        </span>
                        <span className="card-position">
                          {player.positions && player.positions.length > 0
                            ? player.positions[0]
                            : "ADR"}
                        </span>
                      </div>
                      <img
                        src={player.photo || defaultAvatar}
                        alt={player.name}
                        className="card-player-img"
                      />
                      <div className="card-name">
                        {player.name.split(" ")[0].toUpperCase()}
                      </div>

                      {/* AQUI ESTAMOS PUXANDO AS SKILLS REAIS DO BANCO */}
                      <div className="card-stats-grid">
                        <div className="stat-col-left">
                          <div>
                            <span>PAC</span> {getStat(player, "velocidade")}
                          </div>
                          <div>
                            <span>SHO</span> {getStat(player, "chute")}
                          </div>
                          <div>
                            <span>PAS</span> {getStat(player, "passe")}
                          </div>
                        </div>
                        <div className="stat-col-right">
                          <div>
                            <span>DRI</span> {getStat(player, "mira")}
                          </div>
                          <div>
                            <span>DEF</span> {getStat(player, "defesa")}
                          </div>
                          <div>
                            <span>PHY</span> {getStat(player, "corpo")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="fut-card empty-card">
                      <span>+</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeSlot !== null && (
        <div className="fut-modal-overlay" onClick={() => setActiveSlot(null)}>
          <div
            className="fut-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Elenco da ADR</h3>
              <button
                className="close-modal-btn"
                onClick={() => setActiveSlot(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-players-list">
              {availablePlayers.map((p) => {
                const isSelected = Object.values(selectedSquad).some(
                  (selected) => selected?.id === p.id,
                );
                return (
                  <button
                    key={p.id}
                    className="modal-player-row"
                    disabled={isSelected}
                    onClick={() => selectPlayerForSlot(p)}
                  >
                    <img src={p.photo || defaultAvatar} alt={p.name} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{p.name}</span>
                      <small style={{ color: "#e2b317" }}>
                        OVR {calculateOVR(p)}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
