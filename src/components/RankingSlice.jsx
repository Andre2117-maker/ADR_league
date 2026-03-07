import React from "react";
import "../styles/rankingslice.css";

export default function RankingSlice({ player, sortedPlayers = [] }) {
  // A lista já chega ordenada pelo App.jsx
  const index = sortedPlayers.findIndex(
    (p) => String(p.id) === String(player.id),
  );
  if (index === -1) return null;

  // Lógica de centralização (mantém o jogador no meio das 5 posições)
  let start = Math.max(0, index - 2);
  let end = Math.min(start + 5, sortedPlayers.length);
  // Ajuste fino para garantir sempre 5 itens se possível
  if (end - start < 5 && start > 0) start = Math.max(0, end - 5);

  const tableSlice = sortedPlayers.slice(start, end);

  return (
    <div className="rs-container">
      <h3 className="rs-title">Posição no Ranking</h3>
      <div className="rs-list">
        {tableSlice.map((p) => {
          // O índice real é o índice na lista de pontos + 1
          const realPosition = sortedPlayers.indexOf(p) + 1;
          const isActive = String(p.id) === String(player.id);

          return (
            <div key={p.id} className={`rs-row ${isActive ? "active" : ""}`}>
              <span className="rs-pos">{realPosition}</span>
              <span className="rs-separator">–</span>{" "}
              {/* Separador adicionado aqui */}
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
