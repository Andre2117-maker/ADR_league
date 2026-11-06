import React, { useMemo } from "react";
import { FORMATIONS_DATA } from "../../data/formationsConfig";
import "../../styles/Playerpage/favoritefield.css";

const FavoritePositionField = ({ playerId, matches }) => {
  const positionStats = useMemo(() => {
    if (!matches || matches.length === 0)
      return { positions: [], totalMatches: 0 };

    const roleCounts = {};
    const roleCoordsSample = {};
    let totalAppearances = 0;

    const getSlotData = (formationKey, slotId) => {
      if (!formationKey) return null;
      let foundData = null;
      ["FUT4", "FUT5", "FUT6", "FUT7", "FUT8"].forEach((futType) => {
        if (FORMATIONS_DATA[futType]?.[formationKey]) {
          const slot = FORMATIONS_DATA[futType][formationKey].slots.find(
            (s) => String(s.id) === String(slotId),
          );
          if (slot) foundData = { x: slot.x, y: slot.y, role: slot.role };
        }
      });
      return foundData;
    };

    const registerAppearance = (formationKey, tacticalObj) => {
      if (!tacticalObj) return;
      Object.entries(tacticalObj).forEach(([slotId, pId]) => {
        if (String(pId) === String(playerId)) {
          const data = getSlotData(formationKey, slotId);
          if (data && data.role) {
            roleCounts[data.role] = (roleCounts[data.role] || 0) + 1;
            totalAppearances++;
            roleCoordsSample[data.role] = { x: data.x, y: data.y };
          }
        }
      });
    };

    // Varre todas as partidas (incluindo treinos, eventos e sub-jogos de amistosos/campeonatos)
    matches.forEach((match) => {
      registerAppearance(match.formationA, match.tacticalA);
      registerAppearance(match.formationB, match.tacticalB);

      if (Array.isArray(match.friendlyGames)) {
        match.friendlyGames.forEach((fg) => {
          registerAppearance(fg.formation, fg.tactical);
        });
      }
    });

    if (totalAppearances === 0) return { positions: [], totalMatches: 0 };

    const positionsArray = Object.entries(roleCounts).map(([role, count]) => {
      const percentage = Math.round((count / totalAppearances) * 100);
      const coords = roleCoordsSample[role] || { x: "50%", y: "50%" };
      return { role, count, percentage, x: coords.x, y: coords.y };
    });

    positionsArray.sort((a, b) => b.count - a.count);

    return { positions: positionsArray, totalMatches: totalAppearances };
  }, [playerId, matches]);

  const topRole = positionStats.positions[0]?.role || "—";

  return (
    <div className="fav-pos-minimal-section">
      {/* Cabeçalho Minimalista */}
      <div className="fav-pos-minimal-header">
        <h3 className="fav-pos-minimal-title">MAPA DE CALOR</h3>
        <span className="fav-pos-minimal-kicker">
          PRINCIPAL <strong>{topRole.toUpperCase()}</strong>
        </span>
      </div>

      {/* Caixa Principal com Borda Fina */}
      <div className="fav-pos-minimal-box">
        {positionStats.positions.length > 0 ? (
          <>
            {/* Área da Prancheta Tática Minimalista */}
            <div className="fav-pos-pitch-wrapper">
              <div className="mini-field-container">
                <div className="field-line-center"></div>
                <div className="field-circle-center"></div>
                <div className="penalty-area-top"></div>
                <div className="penalty-area-bottom"></div>

                {positionStats.positions.map((pos, index) => (
                  <div
                    key={index}
                    className={`blinking-dot ${
                      index === 0 ? "main-dot" : "secondary-dot"
                    }`}
                    data-role={`${pos.role.toUpperCase()} • ${pos.percentage}% (${pos.count}x)`}
                    style={{
                      left: pos.x,
                      top: pos.y,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Grade Inferior no padrão da tabela de Estatísticas */}
            <div className="fav-pos-minimal-grid">
              {positionStats.positions.map((pos, index) => (
                <div
                  key={pos.role}
                  className={`fav-pos-minimal-cell ${
                    index === 0 ? "is-primary-pos" : ""
                  }`}
                >
                  <span className="fav-pos-cell-label">
                    {pos.role.toUpperCase()}
                  </span>
                  <span className="fav-pos-cell-val">{pos.percentage}%</span>
                  <span className="fav-pos-cell-sub">
                    {pos.count} {pos.count === 1 ? "jogo" : "jogos"}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="fav-pos-empty">Nenhuma posição tática registrada</div>
        )}
      </div>
    </div>
  );
};

export default FavoritePositionField;
