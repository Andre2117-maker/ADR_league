import React, { useMemo } from "react";
import { FORMATIONS_DATA } from "../../data/formationsConfig"; // Ajuste o caminho
import "../../styles/Playerpage/favoritefield.css"; // Ajuste o caminho do CSS

const FavoritePositionField = ({ playerId, matches }) => {
  const positionStats = useMemo(() => {
    if (!matches || matches.length === 0) return { positions: [], totalMatches: 0 };

    const roleCounts = {};
    // Guarda amostras de coordenadas para cada role, para saber onde desenhar o ponto no campo
    const roleCoordsSample = {};
    let totalAppearances = 0;

    const getSlotData = (formationKey, slotId) => {
      let foundData = null;
      ["FUT4", "FUT5", "FUT6"].forEach((futType) => {
        if (FORMATIONS_DATA[futType]?.[formationKey]) {
          const slot = FORMATIONS_DATA[futType][formationKey].slots.find(
            (s) => String(s.id) === String(slotId)
          );
          if (slot) foundData = { x: slot.x, y: slot.y, role: slot.role };
        }
      });
      return foundData;
    };

    // Varre todas as partidas e acumula APENAS pelo nome do "role" (ex: "Atacante")
    matches.forEach((match) => {
      if (match.tacticalA) {
        Object.entries(match.tacticalA).forEach(([slotId, pId]) => {
          if (String(pId) === String(playerId)) {
            const data = getSlotData(match.formationA, slotId);
            if (data && data.role) {
              roleCounts[data.role] = (roleCounts[data.role] || 0) + 1;
              totalAppearances++;
              // Salva a última coordenada vista para esse role desenhar no mini campo
              roleCoordsSample[data.role] = { x: data.x, y: data.y };
            }
          }
        });
      }

      if (match.tacticalB) {
        Object.entries(match.tacticalB).forEach(([slotId, pId]) => {
          if (String(pId) === String(playerId)) {
            const data = getSlotData(match.formationB, slotId);
            if (data && data.role) {
              roleCounts[data.role] = (roleCounts[data.role] || 0) + 1;
              totalAppearances++;
              roleCoordsSample[data.role] = { x: data.x, y: data.y };
            }
          }
        });
      }
    });

    if (totalAppearances === 0) return { positions: [], totalMatches: 0 };

    // Transforma em um array unificado por nome de função
    const positionsArray = Object.entries(roleCounts).map(([role, count]) => {
      const percentage = Math.round((count / totalAppearances) * 100);
      const coords = roleCoordsSample[role] || { x: "50%", y: "50%" };
      return { role, count, percentage, x: coords.x, y: coords.y };
    });

    // Ordena do mais jogado para o menos jogado
    positionsArray.sort((a, b) => b.count - a.count);

    return { positions: positionsArray, totalMatches: totalAppearances };
  }, [playerId, matches]);

  if (positionStats.positions.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#666", fontSize: "0.9rem" }}>
        Nenhuma partida registrada
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#555" }}>
        Mapa de Calor & Frequência
      </span>
      
      {/* Mini Campo */}
      <div className="mini-field-container">
        <div className="field-line-center"></div>
        <div className="field-circle-center"></div>
        <div className="penalty-area-top"></div>
        <div className="penalty-area-bottom"></div>

        {positionStats.positions.map((pos, index) => (
          <div
            key={index}
            className={`blinking-dot ${index === 0 ? "main-dot" : "secondary-dot"}`}
            data-role={`${pos.role} (${pos.percentage}%)`}
            style={{
              left: pos.x,
              top: pos.y,
            }}
          ></div>
        ))}
      </div>

      {/* Lista consolidada abaixo do campo */}
      <div style={{ marginTop: "10px", fontSize: "0.8rem", textAlign: "left", display: "inline-block" }}>
        {positionStats.positions.map((pos, index) => (
          <div key={index} style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginBottom: "3px" }}>
            <span style={{ color: "#333", fontWeight: index === 0 ? "bold" : "normal" }}>
              • {pos.role}:
            </span>
            <span style={{ color: "#666", fontWeight: "bold" }}>
              {pos.percentage}% ({pos.count}x)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritePositionField;