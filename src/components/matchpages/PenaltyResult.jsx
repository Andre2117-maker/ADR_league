export const PenaltiesResult = ({ draft, players }) => {
  const penaltiesA = draft.penalties?.A || [];
  const penaltiesB = draft.penalties?.B || [];
  const maxPenalties = Math.max(penaltiesA.length, penaltiesB.length);

  // Função para buscar nome do jogador ou tratar estados especiais
  const getPlayerName = (p) => {
    if (!p) return "---";
    if (p.result === "pending") return "Não teve";

    if (p.playerId) {
      const found = players.find((pl) => String(pl.id) === String(p.playerId));
      return found ? found.name : "Jogador Desconhecido";
    }
    return "---";
  };

  let scoreA = 0;
  let scoreB = 0;

  return (
    <div
      style={{
        margin: "20px 0",
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
        padding: "15px",
        border: "1px solid #333",
      }}
    >
      <h4
        style={{ textAlign: "center", color: "#d4af37", marginBottom: "10px" }}
      >
        COBRANÇA DE PÊNALTIS
      </h4>

      {Array.from({ length: maxPenalties }).map((_, i) => {
        const pA = penaltiesA[i];
        const pB = penaltiesB[i];

        // Atualiza placar acumulado
        if (pA?.result === "goal") scoreA++;
        if (pB?.result === "goal") scoreB++;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom: "1px solid #222",
            }}
          >
            {/* TIME A */}
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "#fff" }}>
                {getPlayerName(pA)}
              </div>
              <div style={{ fontSize: "10px", color: "#888" }}>
                {pA?.result === "goal"
                  ? `Gol (${scoreA} - ${scoreB})`
                  : pA?.result === "miss"
                    ? "Perdido"
                    : ""}
              </div>
            </div>

            {/* ÍCONES DE RESULTADO */}
            <div style={{ margin: "0 15px", display: "flex", gap: "10px" }}>
              <span
                style={{
                  color:
                    pA?.result === "goal"
                      ? "#44ff44"
                      : pA?.result === "miss"
                        ? "#ff4444"
                        : "#555",
                }}
              >
                {pA?.result === "goal"
                  ? "✓"
                  : pA?.result === "miss"
                    ? "✗"
                    : "○"}
              </span>
              <span
                style={{
                  color:
                    pB?.result === "goal"
                      ? "#44ff44"
                      : pB?.result === "miss"
                        ? "#ff4444"
                        : "#555",
                }}
              >
                {pB?.result === "goal"
                  ? "✓"
                  : pB?.result === "miss"
                    ? "✗"
                    : "○"}
              </span>
            </div>

            {/* TIME B (Corrigido para textAlign: left) */}
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: "12px", color: "#fff" }}>
                {getPlayerName(pB)}
              </div>
              <div style={{ fontSize: "10px", color: "#888" }}>
                {pB?.result === "goal"
                  ? `Gol (${scoreA} - ${scoreB})`
                  : pB?.result === "miss"
                    ? "Perdido"
                    : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
