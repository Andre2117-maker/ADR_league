import React, { useState, useEffect, useMemo, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/Statics/statics.css";

// Componentes originais
import TopAssistsCard from "../components/TopAssists/TopAssistsCard";
import TopGoalkeepersCard from "../components/TopGoalkeepers/TopGoalkeepersCard";
import TopScorersCard from "../components/TopScorers/TopScorersCard";
import AllTimeTable from "../components/AllTimeTable/ALLTimeTable";
import Footer from "../components/Footer";

// IMPORTES (Amistosos)
import FriendlySummary from "../components/Statics/FriendlySummary";
import { useFriendlyStats } from "../data/useFriendlyStats";

// Função auxiliar para identificar se o nome do time na tabela é O ADR
const isADRTeam = (teamName) => {
  if (!teamName) return false;
  const norm = String(teamName).trim().toUpperCase();
  return (
    norm === "ADR" ||
    norm === "O ADR" ||
    norm.startsWith("ADR ") ||
    norm.endsWith(" ADR") ||
    norm.includes("AMIGOS DO RENZO")
  );
};

// Avalia o resultado de um jogo de campeonato para O ADR
const evaluateADRMatch = (jogo) => {
  const adrIsA = isADRTeam(jogo.timeA);
  const adrIsB = isADRTeam(jogo.timeB);
  if (!adrIsA && !adrIsB) return null;

  const myRaw = String(adrIsA ? jogo.placarA : jogo.placarB)
    .trim()
    .toUpperCase();
  const oppRaw = String(adrIsA ? jogo.placarB : jogo.placarA)
    .trim()
    .toUpperCase();
  const opponentName = adrIsA ? jogo.timeB : jogo.timeA;

  if (myRaw === "" && oppRaw === "") return null;

  if (myRaw === "W" || oppRaw === "L") {
    return {
      outcome: "W",
      goalsFor: 0,
      goalsAgainst: 0,
      opponentName,
      scoreStr: `${myRaw} x ${oppRaw}`,
    };
  }
  if (oppRaw === "W" || myRaw === "L") {
    return {
      outcome: "L",
      goalsFor: 0,
      goalsAgainst: 0,
      opponentName,
      scoreStr: `${myRaw} x ${oppRaw}`,
    };
  }

  const gFor = parseInt(myRaw, 10) || 0;
  const gAgainst = parseInt(oppRaw, 10) || 0;

  let penFor = 0;
  let penAgainst = 0;
  if (myRaw.includes("(") && oppRaw.includes("(")) {
    penFor = parseInt(myRaw.split("(")[1], 10) || 0;
    penAgainst = parseInt(oppRaw.split("(")[1], 10) || 0;
  }

  let outcome = "D";
  if (gFor > gAgainst || penFor > penAgainst) outcome = "W";
  else if (gAgainst > gFor || penAgainst > penFor) outcome = "L";

  return {
    outcome,
    goalsFor: gFor,
    goalsAgainst: gAgainst,
    opponentName,
    scoreStr: `${myRaw} x ${oppRaw}`,
  };
};

export default function Statics({ players = [], matches = [] }) {
  const [partidasCamp, setPartidasCamp] = useState([]);
  const [configsCamp, setConfigsCamp] = useState({});

  // Busca os dados da aba Campeonato no Firebase para montar o histórico d'O ADR
  useEffect(() => {
    const fetchChampionshipHistory = async () => {
      try {
        const [partidasSnap, configsSnap] = await Promise.all([
          getDocs(collection(db, "partidas_campeonato")),
          getDocs(collection(db, "campeonatos_config")),
        ]);

        const listaPartidas = partidasSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const mapaConfigs = {};
        configsSnap.forEach((d) => {
          mapaConfigs[d.id] = d.data();
        });

        setPartidasCamp(listaPartidas);
        setConfigsCamp(mapaConfigs);
      } catch (err) {
        console.error("Erro ao carregar histórico de campeonatos:", err);
      }
    };

    fetchChampionshipHistory();
  }, []);

  // 1. Ordenação das partidas (Igual à Home)
  const sortedMatchesByDate = useMemo(() => {
    if (!matches) return [];
    return [...matches].sort(
      (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0),
    );
  }, [matches]);

  // CHAMADA DO HOOK DE AMISTOSOS (Original mantido)
  const friendlyStats = useFriendlyStats(sortedMatchesByDate);

  // NOVO: Cálculo automático da Campanha d'O ADR em Campeonatos
  const championshipSummary = useMemo(() => {
    // Filtra todos os jogos finalizados onde O ADR jogou na coleção partidas_campeonato
    const adrBracketGames = partidasCamp.filter(
      (p) => p.finalizado && (isADRTeam(p.timeA) || isADRTeam(p.timeB)),
    );

    // Também verifica se existem partidas salvas no calendário geral com type === "CAMPEONATO"
    const calendarCampGames = sortedMatchesByDate.filter(
      (m) => String(m.type || "").toUpperCase() === "CAMPEONATO",
    );

    let totalGames = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    // Agrupa por edição/ano para descobrir até que fase O ADR chegou em cada torneio
    const editionsMap = {};

    adrBracketGames.forEach((jogo) => {
      const evalResult = evaluateADRMatch(jogo);
      if (!evalResult) return;

      totalGames++;
      goalsFor += evalResult.goalsFor;
      goalsAgainst += evalResult.goalsAgainst;
      if (evalResult.outcome === "W") wins++;
      else if (evalResult.outcome === "D") draws++;
      else losses++;

      const anoKey = String(jogo.ano || "2026");
      if (!editionsMap[anoKey]) {
        editionsMap[anoKey] = {
          ano: anoKey,
          titulo: configsCamp[anoKey]?.titulo || `Campeonato ${anoKey}`,
          jogos: 0,
          vitorias: 0,
          empates: 0,
          derrotas: 0,
          golsPro: 0,
          golsContra: 0,
          highestStageWeight: 1,
          stageLabel: "Fase de Grupos",
          stageBadgeClass: "stage-groups",
          ultimoConfronto: null,
        };
      }

      const ed = editionsMap[anoKey];
      ed.jogos++;
      ed.golsPro += evalResult.goalsFor;
      ed.golsContra += evalResult.goalsAgainst;
      if (evalResult.outcome === "W") ed.vitorias++;
      else if (evalResult.outcome === "D") ed.empates++;
      else ed.derrotas++;

      const faseUpper = String(jogo.fase || "GRUPOS").toUpperCase();

      // Pesos das fases: 1=Grupos, 2=Oitavas, 3=Quartas, 4=Semifinal, 5=Vice-Campeão, 6=Campeão
      if (faseUpper === "FINAL") {
        ed.ultimoConfronto = `Final: O ADR ${evalResult.scoreStr} ${evalResult.opponentName}`;
        if (evalResult.outcome === "W") {
          ed.highestStageWeight = 6;
          ed.stageLabel = "🏆 Campeão";
          ed.stageBadgeClass = "stage-champion";
        } else {
          ed.highestStageWeight = Math.max(ed.highestStageWeight, 5);
          if (ed.highestStageWeight === 5) {
            ed.stageLabel = "🥈 Vice-Campeão (Finalista)";
            ed.stageBadgeClass = "stage-runnerup";
          }
        }
      } else if (faseUpper === "SEMIS" || faseUpper === "SEMIFINAL") {
        if (ed.highestStageWeight < 4) {
          ed.highestStageWeight = 4;
          ed.stageLabel = "Semifinalista";
          ed.stageBadgeClass = "stage-semi";
          ed.ultimoConfronto = `Semis: O ADR ${evalResult.scoreStr} ${evalResult.opponentName}`;
        }
      } else if (faseUpper === "QUARTAS") {
        if (ed.highestStageWeight < 3) {
          ed.highestStageWeight = 3;
          ed.stageLabel = "Quartas de Final";
          ed.stageBadgeClass = "stage-quarters";
        }
      } else if (faseUpper === "OITAVAS") {
        if (ed.highestStageWeight < 2) {
          ed.highestStageWeight = 2;
          ed.stageLabel = "Oitavas de Final";
          ed.stageBadgeClass = "stage-eighths";
        }
      }
    });

    // Caso não haja jogos na coleção partidas_campeonato, contabiliza os jogos type==="CAMPEONATO" do calendário
    if (adrBracketGames.length === 0 && calendarCampGames.length > 0) {
      calendarCampGames.forEach((m) => {
        totalGames++;
        const gA =
          m.events?.filter(
            (e) =>
              (e.type === "GOAL" && e.team === "A") ||
              (e.type === "OWN_GOAL" && e.team === "B"),
          ).length || 0;
        const gB =
          m.events?.filter(
            (e) =>
              (e.type === "GOAL" && e.team === "B") ||
              (e.type === "OWN_GOAL" && e.team === "A"),
          ).length || 0;
        goalsFor += gA;
        goalsAgainst += gB;
        if (gA > gB) wins++;
        else if (gB > gA) losses++;
        else draws++;
      });
    }

    const editionsList = Object.values(editionsMap).sort((a, b) =>
      String(b.ano).localeCompare(String(a.ano)),
    );

    // Descobre a Melhor Campanha histórica entre todas as edições
    let bestCampaign = {
      stageLabel: "Sem registros",
      ano: "—",
      titulo: "Aguardando torneios",
      highestStageWeight: 0,
    };

    editionsList.forEach((ed) => {
      if (ed.highestStageWeight > bestCampaign.highestStageWeight) {
        bestCampaign = ed;
      }
    });

    const titulosCount = editionsList.filter(
      (ed) => ed.highestStageWeight === 6,
    ).length;
    const finaisCount = editionsList.filter(
      (ed) => ed.highestStageWeight >= 5,
    ).length;

    const aproveitamento =
      totalGames > 0
        ? Math.round(((wins * 3 + draws) / (totalGames * 3)) * 100)
        : 0;

    return {
      totalGames,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      saldoGols: goalsFor - goalsAgainst,
      aproveitamento,
      titulosCount,
      finaisCount,
      bestCampaign,
      editionsList,
    };
  }, [partidasCamp, configsCamp, sortedMatchesByDate]);

  // 2. Função de cálculo original da Temporada 2026 (Mantida 100% igual à sua)
  const getPlayerStats = useCallback(
    (playerId) => {
      const defaultReturn = { goals: 0, assists: 0, points: 0, games: 0 };
      if (!sortedMatchesByDate.length) return defaultReturn;

      const playerMatches = sortedMatchesByDate.filter(
        (m) =>
          m.type === "TREINO" &&
          (m.teamA?.players?.some((id) => String(id) === String(playerId)) ||
            m.teamB?.players?.some((id) => String(id) === String(playerId))),
      );

      let totalGoals = 0;
      let totalAssists = 0;
      let totalWins = 0;
      let totalDraws = 0;

      playerMatches.forEach((m) => {
        const isTeamA = m.teamA?.players?.some(
          (id) => String(id) === String(playerId),
        );
        const playerTeam = isTeamA ? "A" : "B";
        const pIdStr = String(playerId);

        m.events?.forEach((e) => {
          if (e.type === "GOAL" && String(e.playerId) === pIdStr) totalGoals++;
          if (
            (e.type === "ASSIST" && String(e.playerId) === pIdStr) ||
            (e.type === "GOAL" && String(e.assistId) === pIdStr)
          ) {
            totalAssists++;
          }
        });

        const goalsA =
          m.events?.filter(
            (e) =>
              (e.type === "GOAL" && e.team === "A") ||
              (e.type === "OWN_GOAL" && e.team === "B"),
          ).length || 0;
        const goalsB =
          m.events?.filter(
            (e) =>
              (e.type === "GOAL" && e.team === "B") ||
              (e.type === "OWN_GOAL" && e.team === "A"),
          ).length || 0;

        const winner = m.penaltiesWinner || m.winner;
        let result = "";
        if (winner)
          result = String(winner).toUpperCase() === playerTeam ? "W" : "L";
        else if (goalsA === goalsB) result = "D";
        else
          result =
            (goalsA > goalsB && isTeamA) || (goalsB > goalsA && !isTeamA)
              ? "W"
              : "L";

        if (result === "W") totalWins++;
        else if (result === "D") totalDraws++;
      });

      return {
        goals: totalGoals,
        assists: totalAssists,
        points: totalWins * 3 + totalDraws * 1,
        games: playerMatches.length,
      };
    },
    [sortedMatchesByDate],
  );

  // 3. Processamento Final original (Mantido sem alterações)
  const playersWithFullStats = useMemo(() => {
    return players
      .filter((p) => p.isAnonymous !== true)
      .map((p) => {
        const stats = getPlayerStats(p.id);
        const manual26 = p.statsBySeason?.["2026"] || {};

        return {
          ...p,
          points: stats.points,
          goals: stats.goals + Number(manual26.goals || 0),
          assists: stats.assists + Number(manual26.assists || 0),
          games: stats.games + Number(manual26.matches || manual26.games || 0),
        };
      });
  }, [players, getPlayerStats]);

  // 4. Listas Ordenadas para os Cards originais
  const sortedByGoals = useMemo(
    () =>
      [...playersWithFullStats].sort(
        (a, b) => b.goals - a.goals || b.points - a.points,
      ),
    [playersWithFullStats],
  );

  const sortedByAssists = useMemo(
    () =>
      [...playersWithFullStats].sort(
        (a, b) => b.assists - a.assists || b.points - a.points,
      ),
    [playersWithFullStats],
  );

  if (!players.length)
    return <div className="statics-container">Carregando...</div>;

  return (
    <div>
      <div className="statics-container">
        {/* ==================== 1. AMISTOSOS ==================== */}
        <h1 className="page-title">AMISTOSOS</h1>
        <FriendlySummary stats={friendlyStats} />

        {/* ==================== 2. CAMPEONATOS (NOVO PAINEL DE CAMPANHA) ==================== */}
        <h1 className="page-title">CAMPEONATOS</h1>
        <div className="camp-summary-wrapper">
          {/* LINHA DE DESTAQUE: MELHOR CAMPANHA + KPIS GERAIS */}
          <div className="camp-summary-top-grid">
            {/* Card Principal: Melhor Campanha */}
            <div className="camp-highlight-card best-campaign-card">
              <span className="camp-card-kicker">
                🏅 MELHOR CAMPANHA DO ADR
              </span>
              <div className="best-campaign-main">
                <strong className="best-stage-text">
                  {championshipSummary.bestCampaign.stageLabel}
                </strong>
                <span className="best-edition-badge">
                  Edição {championshipSummary.bestCampaign.ano}
                </span>
              </div>
              <p className="best-campaign-sub">
                {championshipSummary.bestCampaign.ultimoConfronto ||
                  championshipSummary.bestCampaign.titulo}
              </p>
            </div>

            {/* Card KPI: Aproveitamento e Finais */}
            <div className="camp-highlight-card kpi-stats-card">
              <div className="camp-kpi-item">
                <span className="kpi-label">TORNEIOS</span>
                <strong className="kpi-num">
                  {championshipSummary.editionsList.length}
                </strong>
              </div>
              <div className="camp-kpi-divider"></div>
              <div className="camp-kpi-item">
                <span className="kpi-label">FINAIS ALCANÇADAS</span>
                <strong className="kpi-num gold">
                  {championshipSummary.finaisCount}
                </strong>
              </div>
              <div className="camp-kpi-divider"></div>
              <div className="camp-kpi-item">
                <span className="kpi-label">APROVEITAMENTO</span>
                <strong className="kpi-num">
                  {championshipSummary.aproveitamento}%
                </strong>
              </div>
            </div>
          </div>

          {/* BARRA DE RETROSPECTO EM TORNEIOS (J, V, E, D, GP, GC) */}
          <div className="camp-record-strip">
            <div className="record-pill">
              <span>JOGOS</span>
              <strong>{championshipSummary.totalGames}</strong>
            </div>
            <div className="record-pill win">
              <span>VITÓRIAS</span>
              <strong>{championshipSummary.wins}</strong>
            </div>
            <div className="record-pill draw">
              <span>EMPATES</span>
              <strong>{championshipSummary.draws}</strong>
            </div>
            <div className="record-pill loss">
              <span>DERROTAS</span>
              <strong>{championshipSummary.losses}</strong>
            </div>
            <div className="record-pill">
              <span>GOLS PRÓ</span>
              <strong>{championshipSummary.goalsFor}</strong>
            </div>
            <div className="record-pill">
              <span>SALDO</span>
              <strong
                className={
                  championshipSummary.saldoGols > 0
                    ? "text-win"
                    : championshipSummary.saldoGols < 0
                      ? "text-loss"
                      : ""
                }
              >
                {championshipSummary.saldoGols > 0
                  ? `+${championshipSummary.saldoGols}`
                  : championshipSummary.saldoGols}
              </strong>
            </div>
          </div>

          {/* HISTÓRICO POR EDIÇÃO: QUAL FASE CHEGOU EM CADA ANO */}
          {championshipSummary.editionsList.length > 0 && (
            <div className="camp-editions-list">
              <h3 className="editions-list-title">
                Histórico de Participações & Fase Alcançada
              </h3>
              <div className="editions-cards-grid">
                {championshipSummary.editionsList.map((ed) => (
                  <div key={ed.ano} className="edition-history-card">
                    <div className="edition-card-top">
                      <div>
                        <span className="edition-year-tag">
                          TEMPORADA {ed.ano}
                        </span>
                        <h4 className="edition-name">{ed.titulo}</h4>
                      </div>
                      <span
                        className={`edition-stage-badge ${ed.stageBadgeClass}`}
                      >
                        {ed.stageLabel}
                      </span>
                    </div>

                    <div className="edition-mini-stats">
                      <span>
                        <strong>{ed.jogos}</strong> J
                      </span>
                      <span className="dot-sep">•</span>
                      <span className="text-win">
                        <strong>{ed.vitorias}</strong> V
                      </span>
                      <span className="dot-sep">•</span>
                      <span>
                        <strong>{ed.empates}</strong> E
                      </span>
                      <span className="dot-sep">•</span>
                      <span className="text-loss">
                        <strong>{ed.derrotas}</strong> D
                      </span>
                      <span className="dot-sep">•</span>
                      <span>
                        GP: <strong>{ed.golsPro}</strong> / GC:{" "}
                        <strong>{ed.golsContra}</strong>
                      </span>
                    </div>

                    {ed.ultimoConfronto && (
                      <div className="edition-last-match">
                        {ed.ultimoConfronto}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ==================== 3. ESTATÍSTICAS DA TEMPORADA 2026 ==================== */}
        <h1 className="page-title">Estatísticas da Temporada 2026</h1>
        <div className="statics-grid">
          <TopScorersCard players={sortedByGoals} limit={10} />
          <TopAssistsCard players={sortedByAssists} limit={10} />
          <TopGoalkeepersCard players={players} matches={matches} limit={10} />
        </div>

        {/* ==================== 4. ALL TIME ==================== */}
        <h1 className="page-title">ALL TIME</h1>
        <AllTimeTable matches={matches} players={players} />
      </div>
      <Footer />
    </div>
  );
}
