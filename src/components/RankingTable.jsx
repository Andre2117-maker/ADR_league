// src/components/RankingTable.jsx
import primeiro from "../assets/primeiro.png";
import segundo from "../assets/segundo.png";
import terceiro from "../assets/terceiro.png";

export default function RankingTable({
  sortedPlayers,
  getPlayerStats,
  onSelectPlayer,
  setHoveredPlayer,
}) {
  // 1. SEPARAÇÃO: Ativos participam do ranking, Anônimos vão para o fim sem posição
  const activePlayers = sortedPlayers.filter((p) => !p.isAnonymous);
  const anonymousPlayers = sortedPlayers.filter((p) => p.isAnonymous);

  return (
    <main className="central-column" id="tabela-content">
      <h1 className="page-title">Classificação Geral</h1>
      <table>
        <thead>
          <tr style={{ color: "#e2b900", fontSize: "12px" }}>
            <th>#</th>
            <th
              style={{
                textAlign: "left",
                paddingLeft: "15px",
              }}
            >
              Jogador
            </th>
            <th>Pts</th>
            <th>Gols</th>
            <th>Assis</th>
            <th>J</th>
            <th>V</th>
            <th>D</th>
            <th>Últimas 5</th>
          </tr>
        </thead>
        <tbody>
          {/* RENDERIZAÇÃO DOS ATIVOS (COM RANKING E MEDALHAS) */}
          {activePlayers.map((p, idx) => {
            const { form } = getPlayerStats(p.id);
            let rowClass = "";

            if (idx === 0) rowClass = "first-place";
            else if (idx === 1) rowClass = "second-place";
            else if (idx === 2) rowClass = "third-place";
            else if (idx >= activePlayers.length - 1) rowClass = "last-place";

            return (
              <tr
                key={p.id}
                onMouseEnter={() => setHoveredPlayer(p)}
                className={rowClass}
              >
                <td>
                  {idx < 3 ? (
                    <img
                      src={[primeiro, segundo, terceiro][idx]}
                      className="rank-icon"
                      width="20"
                      alt={idx + 1}
                    />
                  ) : (
                    idx + 1
                  )}
                </td>
                <td
                  className="player-td-name"
                  onClick={() => onSelectPlayer(p)}
                >
                  {p.name}
                </td>
                <td className="fw-bold">{p.points}</td>
                <td>{p.goals}</td>
                <td>{p.assists}</td>
                <td>{p.games}</td>
                <td>{p.wins || 0}</td>
                <td>{p.losses || 0}</td>
                <td>
                  <div className="form-container">
                    {form.map((r, i) => (
                      <span key={i} className={`form-dot ${r}`}></span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}

          {/* RENDERIZAÇÃO DOS ANÔNIMOS (CAFÉ COM LEITE) */}
          {anonymousPlayers.map((p) => {
            const { form } = getPlayerStats(p.id);
            return (
              <tr key={p.id} className="row-is-anonymous">
                <td className="rank-cell-anon">-</td>
                <td className="player-td-name anon-name-style">{p.name}</td>

                {/* Dados com opacidade para ficarem ao fundo */}
                <td className="anon-data">{p.points}</td>
                <td className="anon-data">{p.goals}</td>
                <td className="anon-data">{p.assists}</td>
                <td className="anon-data">{p.games}</td>
                <td className="anon-data">{p.wins || 0}</td>
                <td className="anon-data">{p.losses || 0}</td>
                <td className="anon-data">
                  <div className="form-container">
                    {form.map((r, i) => (
                      <span key={i} className={`form-dot ${r}`}></span>
                    ))}
                  </div>

                  {/* MODO MANUAL: Este texto vai flutuar sobre a linha */}
                  <div className="anon-text-overlay">NÃO PARTICIPANDO</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
