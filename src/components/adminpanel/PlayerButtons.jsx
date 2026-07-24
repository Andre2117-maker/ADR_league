import { useState } from "react";

/* ==========================================================
   COMPONENTE DE LINHA INDIVIDUAL
   ========================================================== */
function PlayerButtons({ p, total, onUpdateManual, onUpdateProfile, onDelete }) {
  const [inputValueG, setInputValueG] = useState(0);
  const [inputValueA, setInputValueA] = useState(0);

  return (
    <tr className={`adm-tr ${p.isAnonymous ? "row-anonymous" : ""}`}>
      <td className="adm-name-cell">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            className="adm-avatar-wrapper"
            style={{ opacity: p.isAnonymous ? 0.4 : 1 }}
          >
            {p.photo ? (
              <img src={p.photo} alt="" className="adm-player-img" />
            ) : (
              <div className="adm-player-placeholder">👤</div>
            )}
          </div>
          <div>
            <strong className="adm-player-name">
              {p.name} {p.isAnonymous && <span className="anon-tag">OFF</span>}
            </strong>
            <div className="adm-mini-stats">Partidas: {total.games}</div>
          </div>
        </div>
      </td>

      <td className="adm-auto-stats-cell">
        <div className="adm-total-badge">
          <div className="adm-stat-item">
            <span className="adm-label">GOLS: </span>
            <span className="adm-value">{total.goals}</span>
          </div>
          <div className="adm-stat-divider"></div>
          <div className="adm-stat-item">
            <span className="adm-label">ASSIST: </span>
            <span className="adm-value">{total.assists}</span>
          </div>
        </div>
      </td>

      {/* Ajuste de Gols */}
      <td className="adm-manual-cell">
        <div className="adm-calc-container">
          <div className="adm-calc-controls">
            <button
              className="adm-btn-minus"
              onClick={() => {
                onUpdateManual(p.id, "manualGoals", -inputValueG);
                setInputValueG(0);
              }}
            >
              -
            </button>
            <input
              type="number"
              className="adm-input-number"
              value={inputValueG}
              onChange={(e) => setInputValueG(Number(e.target.value))}
              placeholder="0"
            />
            <button
              className="adm-btn-plus"
              onClick={() => {
                onUpdateManual(p.id, "manualGoals", inputValueG);
                setInputValueG(0);
              }}
            >
              +
            </button>
          </div>
        </div>
      </td>

      {/* Ajuste de Assistências */}
      <td className="adm-manual-cell">
        <div className="adm-calc-container">
          <div className="adm-calc-controls">
            <button
              className="adm-btn-minus"
              onClick={() => {
                onUpdateManual(p.id, "manualAssists", -inputValueA);
                setInputValueA(0);
              }}
            >
              -
            </button>
            <input
              type="number"
              className="adm-input-number"
              value={inputValueA}
              onChange={(e) => setInputValueA(Number(e.target.value))}
              placeholder="0"
            />
            <button
              className="adm-btn-plus"
              onClick={() => {
                onUpdateManual(p.id, "manualAssists", inputValueA);
                setInputValueA(0);
              }}
            >
              +
            </button>
          </div>
        </div>
      </td>

      {/* Perfil e Gestão de Foto */}
      <td className="adm-profile-cell">
        <div className="adm-profile-inputs">
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div className="adm-title-input-wrapper">
              🏆{" "}
              <input
                type="number"
                className="adm-input-titles"
                value={p.titlesADR || 0}
                onChange={(e) =>
                  onUpdateProfile(p.id, "titlesADR", Number(e.target.value))
                }
              />
            </div>

            <input
              type="text"
              className="adm-input-role"
              placeholder="Cargo (Ex: Diretor)"
              value={p.clubRole || ""}
              onChange={(e) =>
                onUpdateProfile(p.id, "clubRole", e.target.value)
              }
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "#111",
                padding: "2px 8px",
                borderRadius: "5px",
                border: "1px solid #333",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  color: "#d4af37",
                  fontWeight: "bold",
                }}
              >
                Nº
              </span>
              <input
                type="number"
                value={p.number || ""}
                onChange={(e) =>
                  onUpdateProfile(p.id, "number", e.target.value)
                }
                placeholder="00"
                style={{
                  width: "35px",
                  background: "transparent",
                  color: "#fff",
                  border: "none",
                  outline: "none",
                  fontSize: "13px",
                  textAlign: "center",
                }}
              />
            </div>

            <label className="adm-label-allstar">
              <input
                type="checkbox"
                checked={p.isAllStar || false}
                onChange={(e) =>
                  onUpdateProfile(p.id, "isAllStar", e.target.checked)
                }
              />{" "}
              ALL-STAR
            </label>
          </div>

          <input
            type="text"
            placeholder="URL da Foto (./players/nome.png)"
            value={p.photo || ""}
            onChange={(e) => onUpdateProfile(p.id, "photo", e.target.value)}
            className="adm-photo-url-input"
          />
        </div>
      </td>

      <td className="adm-actions-cell">
        <div className="adm-action-buttons">
          <button
            title={
              p.isAnonymous ? "Ativar Jogador" : "Modo Anônimo (Café com Leite)"
            }
            className={`adm-btn-anon ${p.isAnonymous ? "active" : ""}`}
            onClick={() => onUpdateProfile(p.id, "isAnonymous", !p.isAnonymous)}
          >
            {p.isAnonymous ? "👁️‍🗨️" : "👁️"}
          </button>
          <button
            className="adm-btn-delete"
            onClick={() => onDelete(p.id, p.name)}
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}

export default PlayerButtons;