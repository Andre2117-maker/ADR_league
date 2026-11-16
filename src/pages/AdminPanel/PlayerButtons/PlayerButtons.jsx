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


/* Ícones desenhados (no lugar dos emojis) */
const ADM_ICO = {
  back: "M15 5l-7 7 7 7",
  ball: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5l3.8 2.8-1.5 4.4H9.7l-1.5-4.4zM12 3v4.5M15.8 10.3l4.3-1.6M14.3 14.7l2.6 3.8M9.7 14.7l-2.6 3.8M8.2 10.3 3.9 8.7",
  wrench: "M14.5 5.5a4 4 0 0 0 4.9 4.9L12 17.8a2.1 2.1 0 0 1-3-3l7.4-7.4M14.5 5.5l2.3 2.3M6 21l3-3",
  upload: "M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v5h16v-5",
  sort: "M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l-3 3m3-3l3 3",
  open: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M3 3l18 18M10.6 6c.5-.1.9-.1 1.4-.1C18 5.9 21.5 12 21.5 12a17 17 0 0 1-2.9 3.6M6.5 7.2A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2",
  trash: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5",
};
const AdmIco = ({ n }) => (
  <svg className="adm-ico" viewBox="0 0 24 24" aria-hidden="true">
    <path d={ADM_ICO[n]} />
  </svg>
);

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
              Editar <AdmIco n="open" />
            </button>
          )}

          <button
            title={
              p.isAnonymous ? "Ativar jogador" : "Modo anônimo (café com leite)"
            }
            className={`adm-btn-anon ${p.isAnonymous ? "active" : ""}`}
            onClick={() => onUpdateProfile(p.id, "isAnonymous", !p.isAnonymous)}
          >
            <AdmIco n={p.isAnonymous ? "eyeOff" : "eye"} />
          </button>

          <button
            className="adm-btn-delete"
            title="Excluir jogador"
            onClick={() => onDelete(p.id, p.name)}
          >
            <AdmIco n="trash" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerButtons;
