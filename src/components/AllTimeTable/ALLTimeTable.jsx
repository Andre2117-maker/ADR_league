import React, { useMemo, useState } from "react";
import "./alltimetable.css";

const AllTimeTable = ({ matches, players }) => {
  const [sortBy, setSortBy] = useState("goals");

  const allTimeStats = useMemo(() => {
    const statsMap = {};

    // 1. INICIALIZA TODOS OS JOGADORES DO BANCO (Ativos, Inativos, Anônimos)
    if (players && players.length > 0) {
      players.forEach((p) => {
        const safeId = String(p.id);
        statsMap[safeId] = {
          id: safeId,
          name: p.name || "Anônimo",
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          assists: 0,
          points: 0,
        };

        // SOMA DADOS HISTÓRICOS DE TODAS AS TEMPORADAS MANUAIS
        if (p.statsBySeason) {
          Object.values(p.statsBySeason).forEach((season) => {
            statsMap[safeId].matches += Number(
              season.matches || season.games || 0,
            );
            statsMap[safeId].wins += Number(season.wins || 0);
            statsMap[safeId].draws += Number(season.draws || 0);
            statsMap[safeId].losses += Number(season.losses || 0);
            statsMap[safeId].goals += Number(season.goals || 0);
            statsMap[safeId].assists += Number(season.assists || 0);
          });
        }
      });
    }

    // Função auxiliar para inicializar nomes externos (convidados)
    const initPlayer = (id, externalName = "") => {
      const safeId = String(id);
      if (!statsMap[safeId]) {
        statsMap[safeId] = {
          id: safeId,
          name: externalName || "Anônimo (Convidado)",
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          assists: 0,
          points: 0,
        };
      }
      return safeId;
    };

    // 2. PROCESSA TODAS AS PARTIDAS DINÂMICAS REGISTRADAS
    if (matches && matches.length > 0) {
      matches.forEach((match) => {
        // ==============================================================
        // SISTEMA ROBUSTO DE DETECÇÃO DE RESULTADOS (VITÓRIA/EMPATE/DERROTA)
        // ==============================================================
        let scoreA = 0;
        let scoreB = 0;

        // Tentativa 1: Busca o placar salvo explicitamente no banco
        if (match.scoreA !== undefined) scoreA = Number(match.scoreA);
        else if (match.score?.A !== undefined) scoreA = Number(match.score.A);
        else if (match.teamA?.score !== undefined)
          scoreA = Number(match.teamA.score);

        if (match.scoreB !== undefined) scoreB = Number(match.scoreB);
        else if (match.score?.B !== undefined) scoreB = Number(match.score.B);
        else if (match.teamB?.score !== undefined)
          scoreB = Number(match.teamB.score);

        // Tentativa 2: Se o placar der 0x0, calcula contando os gols pela Timeline de Eventos!
        if (scoreA === 0 && scoreB === 0 && Array.isArray(match.events)) {
          match.events.forEach((ev) => {
            if (ev.type === "GOAL") {
              const isTeamA = match.teamA?.players?.some(
                (p) => (p.id || p) === ev.playerId,
              );
              const isTeamB = match.teamB?.players?.some(
                (p) => (p.id || p) === ev.playerId,
              );
              if (isTeamA) scoreA++;
              if (isTeamB) scoreB++;
            }
          });
        }

        // Define quem ganhou baseado no placar final calculado
        let isDraw = scoreA === scoreB;
        let winner = scoreA > scoreB ? "A" : scoreA < scoreB ? "B" : null;

        // Tentativa 3: Se existir uma propriedade "winner" forçando o resultado (caso você use pênaltis)
        if (match.winner) {
          if (match.winner === "A" || match.winner === "teamA") {
            winner = "A";
            isDraw = false;
          } else if (match.winner === "B" || match.winner === "teamB") {
            winner = "B";
            isDraw = false;
          } else if (match.winner === "DRAW" || match.winner === "empate") {
            winner = null;
            isDraw = true;
          }
        }
        // ==============================================================

        const processTeam = (teamData, teamKey) => {
          if (!teamData) return;
          const playerList = Array.isArray(teamData)
            ? teamData
            : teamData.players || [];

          playerList.forEach((playerItem) => {
            const pId =
              typeof playerItem === "object" ? playerItem.id : playerItem;
            if (!pId) return;

            const safeId = initPlayer(pId);
            statsMap[safeId].matches += 1;

            if (isDraw) {
              statsMap[safeId].draws += 1;
            } else if (winner === teamKey) {
              statsMap[safeId].wins += 1;
            } else {
              statsMap[safeId].losses += 1;
            }

            // Gols diretos na escalação (se houver)
            if (typeof playerItem === "object") {
              if (playerItem.goals)
                statsMap[safeId].goals += Number(playerItem.goals);
              if (playerItem.assists)
                statsMap[safeId].assists += Number(playerItem.assists);
            }
          });
        };

        processTeam(match.teamA, "A");
        processTeam(match.teamB, "B");

        // Gols pela Timeline de Eventos
        if (Array.isArray(match.events)) {
          match.events.forEach((event) => {
            if (event.type === "GOAL") {
              if (event.playerId) {
                const safeId = initPlayer(event.playerId, event.externalName);
                statsMap[safeId].goals += 1;
              }
              if (event.assistId) {
                const safeId = initPlayer(
                  event.assistId,
                  event.externalAssistName,
                );
                statsMap[safeId].assists += 1;
              }
            }
          });
        }
      });
    }

    // 3. CALCULA PONTOS E GERA O ARRAY FINAL
    let results = Object.values(statsMap);

    results.forEach((p) => {
      // 3 pontos por vitória, 1 por empate (ajuste se a sua regra for diferente)
      p.points = p.wins * 3 + p.draws * 1;
    });

    // Filtra apenas quem tem pelo menos 1 jogo na história
    results = results.filter((p) => p.matches > 0);

    // 4. ORDENAÇÃO DINÂMICA
    results.sort((a, b) => {
      if (b[sortBy] !== a[sortBy]) {
        return b[sortBy] - a[sortBy];
      }
      // Desempates
      if (sortBy === "goals")
        return b.matches - a.matches || b.assists - a.assists;
      if (sortBy === "assists")
        return b.matches - a.matches || b.goals - a.goals;
      if (sortBy === "points") return b.wins - a.wins || b.goals - a.goals;
      return b.goals - a.goals;
    });

    return results;
  }, [matches, players, sortBy]);

  return (
    <div className="alltime-container">
      <div className="alltime-header">
        <h3 className="alltime-title">🏆 RANKING HISTÓRICO (ALL-TIME)</h3>
        <select
          className="alltime-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="goals">Maior Artilheiro</option>
          <option value="assists">Maior Garçom</option>
          <option value="points">Mais Pontos</option>
          <option value="matches">Mais Jogos</option>
          <option value="wins">Mais Vitórias</option>
        </select>
      </div>

      <div className="alltime-table-wrapper">
        <table className="alltime-table">
          <thead>
            <tr>
              <th className="col-pos">#</th>
              <th className="col-name">Lenda</th>
              <th
                title="Pontos"
                className={sortBy === "points" ? "highlight-col" : ""}
              >
                Pts
              </th>
              <th
                title="Gols"
                className={sortBy === "goals" ? "highlight-col" : ""}
              >
                G
              </th>
              <th
                title="Assistências"
                className={sortBy === "assists" ? "highlight-col" : ""}
              >
                A
              </th>
              <th
                title="Jogos"
                className={sortBy === "matches" ? "highlight-col" : ""}
              >
                J
              </th>
              <th
                title="Vitórias"
                className={sortBy === "wins" ? "highlight-col" : ""}
              >
                V
              </th>
              <th title="Empates">E</th>
              <th title="Derrotas">D</th>
            </tr>
          </thead>
          <tbody>
            {allTimeStats.map((p, index) => (
              <tr key={p.id}>
                <td className="col-pos">{index + 1}º</td>
                <td className="col-name">{p.name}</td>

                {/* Colunas dinâmicas (Brilham se forem o sortBy atual) */}
                <td
                  className={
                    sortBy === "points" ? "highlight-col bold" : "bold"
                  }
                >
                  {p.points}
                </td>
                <td
                  className={sortBy === "goals" ? "highlight-col bold" : "bold"}
                >
                  {p.goals}
                </td>
                <td className={sortBy === "assists" ? "highlight-col" : ""}>
                  {p.assists}
                </td>
                <td className={sortBy === "matches" ? "highlight-col" : ""}>
                  {p.matches}
                </td>

                {/* Mantém a cor original (verde) a menos que esteja selecionada */}
                <td
                  className={`color-win ${sortBy === "wins" ? "highlight-col" : ""}`}
                >
                  {p.wins}
                </td>

                <td className="color-draw">{p.draws}</td>
                <td className="color-loss">{p.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllTimeTable;
