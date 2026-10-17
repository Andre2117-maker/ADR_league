import React, { useState } from "react";
import "./goalkeepers.css";

function TopGoalkeepersCard({ players = [], matches = [], limit = 5 }) {
  const [showInfo, setShowInfo] = useState(false);
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  if (!players.length || !matches.length) {
    return (
      <div className="gk-card">
        <div className="gk-card-top">
          <h3 className="gk-title">Paredões da Temporada</h3>
        </div>
        <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
          Aguardando dados...
        </p>
      </div>
    );
  }

  // 1. Números brutos de todos que atuaram no gol em TREINOS
  const rawStats = players
    .filter((p) => !p.isAnonymous)
    .map((player) => {
      let totalCleanSheets = 0;
      let totalGoalsAgainst = 0;
      let gamesAsGK = 0;

      matches?.forEach((match) => {
        if (match.type !== "TREINO") return;

        const isA = String(match.teamA?.goalkeeperId) === String(player.id);
        const isB = String(match.teamB?.goalkeeperId) === String(player.id);

        if (isA || isB) {
          gamesAsGK++;
          const events = match.events || [];
          const goals = isA
            ? events.filter(
                (e) =>
                  (e.type === "GOAL" && e.team === "B") ||
                  (e.type === "OWN_GOAL" && e.team === "A"),
              ).length
            : events.filter(
                (e) =>
                  (e.type === "GOAL" && e.team === "A") ||
                  (e.type === "OWN_GOAL" && e.team === "B"),
              ).length;

          totalGoalsAgainst += goals;
          if (goals === 0) totalCleanSheets++;
        }
      });

      const mgs = gamesAsGK > 0 ? totalGoalsAgainst / gamesAsGK : 999;
      return {
        ...player,
        totalCleanSheets,
        totalGoalsAgainst,
        gamesAsGK,
        mgs,
      };
    })
    .filter((p) => p.gamesAsGK > 0);

  // 2. CORTE DINÂMICO: Mínimo de 25% dos jogos do goleiro que mais atuou (mínimo de 2 jogos)
  const maxGamesByAnyGK = rawStats.reduce(
    (max, p) => Math.max(max, p.gamesAsGK),
    0,
  );
  const MIN_RATIO = 0.25;
  const dynamicMinGames = Math.max(2, Math.floor(maxGamesByAnyGK * MIN_RATIO));

  // 3. MÉDIA GERAL DA LIGA (Para o peso de consistência)
  const totalGKGamesLeague = rawStats.reduce((acc, p) => acc + p.gamesAsGK, 0);
  const totalGKGoalsLeague = rawStats.reduce(
    (acc, p) => acc + p.totalGoalsAgainst,
    0,
  );
  const leagueAvgMGS =
    totalGKGamesLeague > 0 ? totalGKGoalsLeague / totalGKGamesLeague : 1.5;

  const CONFIDENCE_WEIGHT = 5;

  // 4. Filtra pelos elegíveis e ordena (MGS Ponderado + Desempate Real por Clean Sheets e Jogos)
  const goalkeeperStats = rawStats
    .filter((p) => p.gamesAsGK >= dynamicMinGames)
    .map((p) => {
      const weightedMgs =
        (p.totalGoalsAgainst + CONFIDENCE_WEIGHT * leagueAvgMGS) /
        (p.gamesAsGK + CONFIDENCE_WEIGHT);

      // Arredonda para 2 casas decimais no critério primário para permitir que o Clean Sheet desempate!
      const roundedScore = Number(weightedMgs.toFixed(2));

      return { ...p, weightedMgs, roundedScore };
    })
    .sort(
      (a, b) =>
        a.roundedScore - b.roundedScore || // 1º Critério: Menor Média Ponderada
        b.totalCleanSheets - a.totalCleanSheets || // 2º Critério (Desempate): Mais Clean Sheets (CS)
        b.gamesAsGK - a.gamesAsGK || // 3º Critério (Desempate): Mais Jogos disputados (J)
        a.mgs - b.mgs, // 4º Critério: Menor MGS bruto
    )
    .slice(0, limit);

  return (
    <div className="gk-card">
      {/* TOPO DO CARD COM TÍTULO E BOTÃO "i" */}
      <div className="gk-card-top">
        <h3 className="gk-title">Paredões da Temporada</h3>
        <button
          type="button"
          className={`gk-info-btn ${showInfo ? "active" : ""}`}
          onClick={() => setShowInfo(!showInfo)}
          title="Como funciona o ranking de goleiros?"
          aria-label="Informações sobre o ranking de goleiros"
        >
          i
        </button>
      </div>

      {/* PAINEL EXPLICATIVO (ABRE AO CLICAR NO "i") */}
      {showInfo && (
        <div className="gk-info-popover">
          <div className="gk-info-popover-header">
            <strong>📖 Entenda as Estatísticas</strong>
            <button
              type="button"
              className="gk-info-close"
              onClick={() => setShowInfo(false)}
            >
              ✕
            </button>
          </div>
          <ul className="gk-info-list">
            <li>
              <span className="gk-badge-mini">MGS</span>
              <div>
                <strong>Média de Gols Sofridos:</strong> Total de gols sofridos
                dividido pelo número de jogos no gol (quanto menor, melhor).
              </div>
            </li>
            <li>
              <span className="gk-badge-mini">CS</span>
              <div>
                <strong>Clean Sheets:</strong> Quantidade de partidas em que o
                goleiro saiu de campo sem sofrer nenhum gol. É o{" "}
                <strong>1º critério de desempate</strong>!
              </div>
            </li>
            <li>
              <span className="gk-badge-mini">J</span>
              <div>
                <strong>Jogos:</strong> Total de partidas atuando como goleiro.
              </div>
            </li>
          </ul>
          <div className="gk-info-rule-box">
            <strong>
              ⚖️ Regra de Justiça & Corte ({dynamicMinGames} Jogos):
            </strong>
            <p>
              Para evitar que alguém jogue apenas 1 ou 2 partidas e lidere com
              média baixa, o ranking exige no mínimo{" "}
              <strong>25% dos jogos</strong> do goleiro mais ativo da temporada
              (atualmente <strong>{dynamicMinGames} jogos</strong>) e aplica um
              fator de consistência que valoriza quem joga mais.
            </p>
          </div>
        </div>
      )}

      <div className="gk-header">
        <span>Goleiro</span>
        <div className="gk-header-stats">
          <span className="gk-stat-label">MGS</span>
          <span className="gk-stat-label">CS</span>
          <span className="gk-stat-label">J</span>
        </div>
      </div>

      <div className="gk-list">
        {goalkeeperStats.length > 0 ? (
          goalkeeperStats.map((p, i) => (
            <div key={p.id} className="gk-row">
              <div className="gk-info">
                <span className={`gk-rank ${i === 0 ? "is-first" : ""}`}>
                  {i + 1}º
                </span>
                <img
                  src={p.photo || defaultAvatar}
                  alt={p.name}
                  className="gk-avatar-img"
                />
                <span className="gk-name">{p.name}</span>
              </div>
              <div className="gk-stats">
                <span className="gk-val mgs">{p.mgs.toFixed(2)}</span>
                <span className="gk-val cs">{p.totalCleanSheets}</span>
                <span className="gk-val j">{p.gamesAsGK}</span>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "#666", textAlign: "center", fontSize: "0.8rem" }}>
            Nenhum goleiro atingiu o mínimo de {dynamicMinGames} jogos em
            Treinos.
          </p>
        )}
      </div>

      <div className="gk-footer">
        <span>
          <strong>MGS</strong> Média de Gols
        </span>
        <span>
          <strong>CS</strong> Clean Sheets
        </span>
        <span>
          <strong>Mín</strong> {dynamicMinGames} J
        </span>
      </div>
    </div>
  );
}

export default TopGoalkeepersCard;
