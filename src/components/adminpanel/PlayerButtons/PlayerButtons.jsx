import { useState } from "react";

/* ==========================================================
   COMPONENTE DE LINHA INDIVIDUAL
   ========================================================== */
function PlayerButtons({
  p,
  total,
  onUpdateManual,
  onUpdateProfile,
  onDelete,
}) {
  const [inputValueG, setInputValueG] = useState(0);
  const [inputValueA, setInputValueA] = useState(0);

  // Estados para controlar o pop-up de edição de nome
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(p.name);

  // Função para salvar o novo nome e fechar o pop-up
  const handleSaveName = () => {
    if (newName && newName.trim() !== "") {
      onUpdateProfile(p.id, "name", newName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <>
      {/* ==========================================================
          O NOSSO POP-UP PERSONALIZADO (Substitui o prompt do navegador)
          ========================================================== */}
      {isEditingName && (
        <div className="custom-prompt-overlay">
          <div className="custom-prompt-box">
            <h3>✏️ Editar Nome</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
              }}
            />
            <div className="custom-prompt-actions">
              <button
                className="btn-cancel"
                onClick={() => setIsEditingName(false)}
              >
                Cancelar
              </button>
              <button className="btn-save" onClick={handleSaveName}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A LINHA NORMAL DO JOGADOR COMEÇA AQUI */}
      <tr className={`adm-tr ${p.isAnonymous ? "row-anonymous" : ""}`}>
        <td className="adm-name-cell">
          <div className="adm-name-container">
            <div className="adm-avatar-wrapper">
              {/* SE NÃO TIVER FOTO NO BANCO, PUXA O ANONIMO.PNG POR PADRÃO */}
              <img
                src={p.photo || "/players/Anonimo.png"}
                alt="Avatar"
                className="adm-player-img"
              />
            </div>
            <div>
              <strong className="adm-player-name">
                {p.name}
                <span
                  className="adm-edit-name-btn"
                  onClick={() => {
                    setNewName(p.name);
                    setIsEditingName(true);
                  }}
                  title="Editar Nome do Jogador"
                >
                  ✏️
                </span>
                {p.isAnonymous && <span className="anon-tag">OFF</span>}
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
            <div className="adm-profile-row-1">
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

              <div className="adm-number-wrapper">
                <span className="adm-number-label">Nº</span>
                <input
                  type="number"
                  className="adm-number-input"
                  value={p.number || ""}
                  onChange={(e) =>
                    onUpdateProfile(p.id, "number", e.target.value)
                  }
                  placeholder="00"
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
              placeholder="URL da Foto (ex: /players/Nome.png)"
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
                p.isAnonymous
                  ? "Ativar Jogador"
                  : "Modo Anônimo (Café com Leite)"
              }
              className={`adm-btn-anon ${p.isAnonymous ? "active" : ""}`}
              onClick={() =>
                onUpdateProfile(p.id, "isAnonymous", !p.isAnonymous)
              }
            >
              {p.isAnonymous ? "👁️‍🗨️" : "👁️"}
            </button>

            <button
              className="adm-btn-delete"
              title="Excluir Jogador"
              onClick={() => {
                const confirmar = window.confirm(
                  `Tem certeza que deseja EXCLUIR o jogador ${p.name}?\nEssa ação não pode ser desfeita.`,
                );
                if (confirmar) {
                  onDelete(p.id, p.name);
                }
              }}
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}

export default PlayerButtons;
