import React from "react";
import "../../styles/rankingslice.css";

export default function RankingSlice({ player, sortedPlayers = [] }) {
  // 1. Filtramos os anônimos ANTES de qualquer cálculo de posição
  const visiblePlayers = sortedPlayers.filter((p) => !p.isAnonymous);

  // Procuramos o jogador na lista de visíveis
  const index = visiblePlayers.findIndex(
    (p) => String(p.id) === String(player.id),
  );

  // Se o jogador selecionado for anônimo ou não estiver na lista, não renderiza o slice
  if (index === -1) return null;

  // 2. Lógica de centralização baseada na lista filtrada
  let start = Math.max(0, index - 2);
  let end = Math.min(start + 5, visiblePlayers.length);

  if (end - start < 5 && start > 0) {
    start = Math.max(0, end - 5);
  }

  const tableSlice = visiblePlayers.slice(start, end);

  return (
    <div className="rs-container">
      <h3 className="rs-title">Posição no Ranking</h3>
      <div className="rs-list">
        {tableSlice.map((p) => {
          // O índice real agora reflete a posição APENAS entre os visíveis
          const realPosition = visiblePlayers.indexOf(p) + 1;
          const isActive = String(p.id) === String(player.id);

          return (
            <div key={p.id} className={`rs-row ${isActive ? "active" : ""}`}>
              <span className="rs-pos">{realPosition}</span>
              <span className="rs-separator">–</span>
              <span className="rs-name">{p.name}</span>
              <span className="rs-pts">
                <strong>{p.points}</strong> pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
