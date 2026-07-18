import React, { useState } from "react";

function PenaltiesSection({ draft, players = [], addPenalty, removePenalty }) {
  const [modalConfig, setModalConfig] = useState(null); // Controla se o modal está aberto
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [externalName, setExternalName] = useState("");

  // 1. Calcula o placar automático lendo o array de pênaltis
  const getScore = (team) => {
    const teamPenalties = draft.penalties?.[team] || [];
    return teamPenalties.filter((p) => {
      // Suporta o formato antigo (string) e o novo (objeto)
      const result = typeof p === "object" ? p.result : p;
      return result === "goal";
    }).length;
  };

  const scoreA = getScore("A");
  const scoreB = getScore("B");

  // 2. Lida com o clique nos botões
  const handlePenaltyClick = (team, result) => {
    if (result === "pending") {
      // Se for a bolinha branca, não precisa de cobrador
      addPenalty(team, result, null, "");
    } else {
      // Se for Gol ou Miss, abre a tela pra escolher o jogador
      setModalConfig({ team, result });
      setSelectedPlayer("");
      setExternalName("");
    }
  };

  // 3. Salva o jogador escolhido no modal
  const handleSavePlayer = () => {
    if (!modalConfig) return;
    addPenalty(
      modalConfig.team,
      modalConfig.result,
      selectedPlayer,
      externalName,
    );
    setModalConfig(null);
  };

  // 4. Pega o nome do jogador pra mostrar quando passar o mouse em cima da bolinha
  const getPlayerName = (id, extName) => {
    if (!id) return "";
    if (id === "EXTERNO") return extName || "Jogador Externo";
    return players.find((p) => p.id === id)?.name || "Desconhecido";
  };

  // 5. Filtra os jogadores do time correto
  const getTeamPlayers = (teamLetter) => {
    const teamIds =
      teamLetter === "A"
        ? draft.teamA?.players || draft.actualParticipantsA || []
        : draft.teamB?.players || draft.actualParticipantsB || [];

    console.log(`Time ${teamLetter} - IDs encontrados:`, teamIds);
    console.log("Total de jogadores disponíveis na prop:", players.length);

    const filtered = players.filter((p) => teamIds.includes(p.id));
    console.log(`Jogadores filtrados para o time ${teamLetter}:`, filtered);

    return filtered;
  };

  return (
    <div className="penalties-admin-section">
      <h3 className="section-title">🏆 PÊNALTIS</h3>

      {/* --- PLACAR AUTOMÁTICO COM CSS NOVO --- */}
      <div className="penalties-score-display">
        <div
          className={`penalties-score-box ${scoreA > scoreB ? "winner" : ""}`}
        >
          {scoreA}
        </div>
        <span className="penalties-score-divider">X</span>
        <div
          className={`penalties-score-box ${scoreB > scoreA ? "winner" : ""}`}
        >
          {scoreB}
        </div>
      </div>

      {/* --- MODAL DE SELEÇÃO DE COBRADOR (AQUI ESTAVA FALTANDO!) --- */}
      {modalConfig && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#111",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #d4af37",
              width: "90%",
              maxWidth: "300px",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                color: "#d4af37",
                marginBottom: "15px",
                fontSize: "16px",
              }}
            >
              Quem cobrou? (
              {modalConfig.result === "goal" ? "⚽ Gol" : "❌ Perdeu"})
            </h3>

            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: selectedPlayer === "EXTERNO" ? "10px" : "20px",
                backgroundColor: "#222",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: "4px",
              }}
            >
              <option value="">Selecione um jogador...</option>
              {getTeamPlayers(modalConfig.team).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="EXTERNO">Outro / Externo</option>
            </select>

            {selectedPlayer === "EXTERNO" && (
              <input
                type="text"
                placeholder="Nome do jogador externo"
                value={externalName}
                onChange={(e) => setExternalName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "20px",
                  backgroundColor: "#222",
                  color: "#fff",
                  border: "1px solid #444",
                  borderRadius: "4px",
                }}
              />
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setModalConfig(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePlayer}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#d4af37",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BLOCOS DOS TIMES --- */}
      {["A", "B"].map((team) => (
        <div key={team} className="penalty-team-block">
          <h4>{team === "A" ? draft.teamA?.name : draft.teamB?.name}</h4>

          <div className="penalty-buttons">
            <button onClick={() => handlePenaltyClick(team, "goal")}>✅</button>
            <button onClick={() => handlePenaltyClick(team, "miss")}>❌</button>
            <button onClick={() => handlePenaltyClick(team, "pending")}>
              ⚪
            </button>
          </div>

          <div className="penalty-seq">
            {(draft.penalties?.[team] || []).map((p, i) => {
              // Se p for objeto, pegamos os dados, se for string, tratamos como antigo
              const isObj = typeof p === "object";
              const result = isObj ? p.result : p;
              const pName = isObj
                ? getPlayerName(p.playerId, p.externalName)
                : "";

              return (
                <span
                  key={i}
                  className={`penalty ${result}`}
                  onClick={() => removePenalty(team, i)}
                  title={pName ? `Cobrador: ${pName}` : "Remover"}
                  style={{ cursor: "pointer" }}
                >
                  {result === "goal" ? "⚽" : result === "miss" ? "✖" : "•"}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PenaltiesSection;
