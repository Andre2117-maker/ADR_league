import React from "react";
import { FORMATIONS_DATA } from "../../data/formationsConfig";

function FriendlyGameField({
  game,
  match,
  players,
  renderSlot,
  isAdmin,
  onFormationChange,
}) {
  // ATUALIZADO: Agora ele busca no FUT4, FUT5 e FUT6
  const getActiveSlots = (formKey) =>
    (
      FORMATIONS_DATA.FUT4?.[formKey] ||
      FORMATIONS_DATA.FUT5?.[formKey] ||
      FORMATIONS_DATA.FUT6?.[formKey]
    )?.slots || [];

  const tacticalPlayers = Object.values(game?.tactical || {});

  return (
    <div className="field-section">
      <h3 className="field-team-title">{match.teamA.name}</h3>

      {isAdmin && (
        <div className="formation-select-wrapper">
          <select
            className="formation-dropdown"
            value={game?.formation || "5_JOG_2-1-1"}
            onChange={(e) => onFormationChange(e.target.value)}
          >
            {/* NOVO: Grupo do FUT 4 */}
            <optgroup label="FUT 4">
              {Object.keys(FORMATIONS_DATA.FUT4 || {}).map((k) => (
                <option key={k} value={k}>
                  {FORMATIONS_DATA.FUT4[k].label}
                </option>
              ))}
            </optgroup>

            <optgroup label="FUT 5">
              {Object.keys(FORMATIONS_DATA.FUT5 || {}).map((k) => (
                <option key={k} value={k}>
                  {FORMATIONS_DATA.FUT5[k].label}
                </option>
              ))}
            </optgroup>

            <optgroup label="FUT 6">
              {Object.keys(FORMATIONS_DATA.FUT6 || {}).map((k) => (
                <option key={k} value={k}>
                  {FORMATIONS_DATA.FUT6[k].label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      )}

      <div className="pitch-canvas">
        <div className="field-lines">
          <div className="c-circle"></div>
          <div className="c-line"></div>
          <div className="b-top"></div>
          <div className="b-bottom"></div>
        </div>

        {getActiveSlots(game?.formation || "5_JOG_2-1-1").map((slot) =>
          renderSlot(slot, "A", match.teamA.players),
        )}
      </div>
      {/* BANCO */}

      <div className="squad-list-container">
        <h4 className="squad-title">Banco de Reservas</h4>

        <div className="squad-grid">
          {match.teamA.players?.map((pId) => {
            const pInfo = players.find((pl) => String(pl.id) === String(pId));
            const isOnField = tacticalPlayers.includes(pId);

            return (
              <div
                key={pId}
                className={`squad-player-item ${isOnField ? "on-field" : ""}`}
              >
                <span className="squad-num">{pInfo?.number || "0"}</span>

                <span className="squad-name">
                  {pInfo?.name}

                  {String(pId) === String(match.teamA.captainId) && (
                    <small className="bench-tag"> (C)</small>
                  )}

                  {String(pId) === String(match.teamA.goalkeeperId) && (
                    <small className="bench-tag"> (GK)</small>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FriendlyGameField;
