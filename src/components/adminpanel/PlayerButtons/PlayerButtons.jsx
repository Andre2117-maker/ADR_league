import { useEffect, useState } from "react";
import "./PlayerButtons.css";

/* ==========================================================
   LINHA DE JOGADOR (painel geral)
   Campos de texto só gravam no Firestore ao sair do campo
   (blur) ou apertar Enter — antes gravava a cada tecla.
   ========================================================== */
function CommitInput({ value, onCommit, ...rest }) {
  const [local, setLocal] = useState(value ?? "");

  // sincroniza quando o dado muda no banco
  useEffect(() => setLocal(value ?? ""), [value]);

  const commit = () => {
    const clean = String(local).trim();
    if (clean !== String(value ?? "")) onCommit(clean);
  };

  return (
    <input
      {...rest}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );
}

const PHOTO_FIELDS = [
  { field: "photo", label: "ADR", placeholder: "URL da foto (ADR)" },
  { field: "photoIDR1", label: "IDR", placeholder: "URL da foto (IDR padrão)" },
  {
    field: "photoIDR2",
    label: "IDR HOVER",
    placeholder: "URL da foto (IDR ao passar o mouse)",
  },
];

function PlayerButtons({ p, total, onUpdateProfile, onDelete, onOpen }) {
  const hasNumber =
    p.number !== "" && p.number !== undefined && p.number !== null;

  return (
    <div className={`adm-tr ${p.isAnonymous ? "row-anonymous" : ""}`}>
      {/* ---------------- JOGADOR ---------------- */}
      <div className="adm-name-cell">
        <div className="adm-name-container">
          <div className="adm-avatar-wrapper">
            <img
              src={p.photo || "/players/Anonimo.png"}
              alt={p.name}
              className="adm-player-img"
            />
          </div>

          <div className="adm-name-info">
            <strong className="adm-player-name">
              <span className="adm-player-name-text">{p.name}</span>
              {p.isAnonymous && <span className="anon-tag">OFF</span>}
            </strong>

            <div className="adm-mini-stats">
              {hasNumber ? `Nº ${p.number}` : "Sem nº"}
              {p.numberIDR !== "" &&
                p.numberIDR != null &&
                ` · IDR ${p.numberIDR}`}
            </div>

            <div className="adm-pending-tags">
              {!p.photo && <span>sem foto</span>}
              {!p.photoIDR1 && <span>sem foto IDR</span>}
              {!hasNumber && <span>sem nº</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- RESUMO (somente leitura) ---------------- */}
      <div className="adm-auto-stats-cell">
        <span className="adm-cell-label">Resumo</span>
        <div className="adm-total-badge">
          <div className="adm-stat-item">
            <span className="adm-label">J</span>
            <span className="adm-value">{total.games}</span>
          </div>
          <div className="adm-stat-divider" />
          <div className="adm-stat-item">
            <span className="adm-label">G</span>
            <span className="adm-value">{total.goals}</span>
          </div>
          <div className="adm-stat-divider" />
          <div className="adm-stat-item">
            <span className="adm-label">A</span>
            <span className="adm-value">{total.assists}</span>
          </div>
        </div>
      </div>

      {/* ---------------- PERFIL ---------------- */}
      <div className="adm-profile-cell">
        <span className="adm-cell-label">Perfil</span>
        <div className="adm-profile-inputs">
          <div className="adm-profile-row-1">
            <select
              className="adm-input-role adm-input-gender"
              value={p.gender || "Male"}
              onChange={(e) => onUpdateProfile(p.id, "gender", e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <CommitInput
              type="text"
              className="adm-input-role"
              placeholder="Cargo (ex: Diretor)"
              value={p.clubRole}
              onCommit={(v) => onUpdateProfile(p.id, "clubRole", v)}
            />
          </div>

          <label className="adm-label-allstar">
            <input
              type="checkbox"
              checked={p.isAllStar || false}
              onChange={(e) =>
                onUpdateProfile(p.id, "isAllStar", e.target.checked)
              }
            />
            ALL-STAR
          </label>
        </div>
      </div>

      {/* ---------------- FOTOS ---------------- */}
      <div className="adm-photos-cell">
        <span className="adm-cell-label">Fotos</span>
        <div className="adm-photos-list">
          {PHOTO_FIELDS.map(({ field, label, placeholder }) => (
            <div key={field} className="adm-photo-row">
              <span className="adm-photo-tag">{label}</span>
              {p[field] ? (
                <img src={p[field]} alt="" className="adm-photo-thumb" />
              ) : (
                <span className="adm-photo-thumb is-empty">—</span>
              )}
              <CommitInput
                type="text"
                className="adm-photo-url-input"
                placeholder={placeholder}
                value={p[field]}
                onCommit={(v) => onUpdateProfile(p.id, field, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- AÇÕES ---------------- */}
      <div className="adm-actions-cell">
        <div className="adm-action-buttons">
          {onOpen && (
            <button
              className="adm-btn-edit"
              title="Abrir a página do jogador (admin individual)"
              onClick={onOpen}
            >
              Editar ↗
            </button>
          )}

          <button
            title={
              p.isAnonymous ? "Ativar jogador" : "Modo anônimo (café com leite)"
            }
            className={`adm-btn-anon ${p.isAnonymous ? "active" : ""}`}
            onClick={() => onUpdateProfile(p.id, "isAnonymous", !p.isAnonymous)}
          >
            {p.isAnonymous ? "👁️‍🗨️" : "👁️"}
          </button>

          <button
            className="adm-btn-delete"
            title="Excluir jogador"
            onClick={() => onDelete(p.id, p.name)}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerButtons;
