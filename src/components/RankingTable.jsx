import primeiro from "../assets/primeiro.png";
import segundo from "../assets/segundo.png";
import terceiro from "../assets/terceiro.png";
import "../styles/rankingtable.css";

export default function RankingTable({
  sortedPlayers,
  getPlayerStats,
  onSelectPlayer,
  setHoveredPlayer,
}) {
  const activePlayers = sortedPlayers.filter((p) => !p.isAnonymous);
  const anonymousPlayers = sortedPlayers.filter((p) => p.isAnonymous);

  return (
    <main className="central-column" id="tabela-content">
      <h1 className="page-title">Classificação Geral</h1>
      <table>
        <thead>
          <tr style={{ color: "#e2b900", fontSize: "12px" }}>
            <th>#</th>
            <th style={{ textAlign: "left", paddingLeft: "15px" }}>Jogador</th>
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
          {/* ATIVOS */}
          {activePlayers.map((p, idx) => {
            const { form } = getPlayerStats(p.id);
            let rowClass = "";
            if (idx === 0) rowClass = "first-place";
            else if (idx === 1) rowClass = "second-place";
            else if (idx === 2) rowClass = "third-place";

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

          {/* ANÔNIMOS (CAFÉ COM LEITE) */}
          {/* RENDERIZAÇÃO DOS ANÔNIMOS (CAFÉ COM LEITE) */}
          {anonymousPlayers.map((p) => {
            const { form } = getPlayerStats(p.id);

            return (
              <tr key={p.id} className="row-is-anonymous">
                <td>-</td>
                <td className="player-td-name">{p.name}</td>
                <td>{p.points}</td>
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
        </tbody>
      </table>
    </main>
  );
}
