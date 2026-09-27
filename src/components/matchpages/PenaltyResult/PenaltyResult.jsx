import React from "react";
import "./penaltiesresult.css"; // Lembre-se de importar o CSS aqui!

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
    <div className="penalties-result-container">
      <h4 className="penalties-title">COBRANÇA DE PÊNALTIS</h4>

      {Array.from({ length: maxPenalties }).map((_, i) => {
        const pA = penaltiesA[i];
        const pB = penaltiesB[i];

        // Atualiza placar acumulado
        if (pA?.result === "goal") scoreA++;
        if (pB?.result === "goal") scoreB++;

        // Define as classes de cores dos ícones
        const getIconClass = (res) => {
          if (res === "goal") return "icon-goal";
          if (res === "miss") return "icon-miss";
          return "icon-pending";
        };

        const getIconSymbol = (res) => {
          if (res === "goal") return "✓";
          if (res === "miss") return "✗";
          return "○";
        };

        return (
          <div key={i} className="penalties-row">
            {/* TIME A */}
            <div className="pen-side left">
              <div className="pen-player-name">{getPlayerName(pA)}</div>
              <div className="pen-score-detail">
                {pA?.result === "goal"
                  ? `Gol (${scoreA} - ${scoreB})`
                  : pA?.result === "miss"
                    ? "Perdido"
                    : ""}
              </div>
            </div>

            {/* ÍCONES DE RESULTADO */}
            <div className="pen-icons">
              <span className={`pen-icon ${getIconClass(pA?.result)}`}>
                {getIconSymbol(pA?.result)}
              </span>
              <span className={`pen-icon ${getIconClass(pB?.result)}`}>
                {getIconSymbol(pB?.result)}
              </span>
            </div>

            {/* TIME B */}
            <div className="pen-side right">
              <div className="pen-player-name">{getPlayerName(pB)}</div>
              <div className="pen-score-detail">
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
