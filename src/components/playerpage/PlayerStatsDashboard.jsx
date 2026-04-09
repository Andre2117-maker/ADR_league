import React, { useState, useMemo } from "react";
import "../../styles/Playerpage/playerdashboard.css";

const PlayerStatsDashboard = ({ player, matches }) => {
  const [selectedSeason, setSelectedSeason] = useState("ALL");
  const [matchFilter, setMatchFilter] = useState("ALL_TYPES");

  const stats = useMemo(() => {
    if (!player || !matches) return null;

    // 1. Filtrar partidas em que o jogador participou
    const pMatches = matches
      .filter(
        (m) =>
          m.teamA.players.some((id) => String(id) === String(player.id)) ||
          m.teamB.players.some((id) => String(id) === String(player.id)),
      )
      .sort((a, b) => (b.order || 0) - (a.order || 0));

    let filtered = {
      goals: 0,
      assists: 0,
      yellow: 0,
      red: 0,
      matchesCount: 0,
      gamesAsGK: 0,
      cleanSheets: 0,
      goalsAgainst: 0,
    };

    let dailyGroup = {};

    pMatches.forEach((m) => {
      const matchYear = new Date(m.date).getFullYear();
      const isSelectedSeason =
        selectedSeason === "ALL" || matchYear === Number(selectedSeason);
      const isSelectedType =
        matchFilter === "ALL_TYPES" || m.type === matchFilter;

      if (isSelectedSeason && isSelectedType) {
        filtered.matchesCount++;

        // Goleiro
        const isGkTeamA = String(m.teamA.goalkeeperId) === String(player.id);
        const isGkTeamB = String(m.teamB.goalkeeperId) === String(player.id);

        if (isGkTeamA || isGkTeamB) {
          filtered.gamesAsGK++;
          let conceded = 0;
          m.events?.forEach((e) => {
            if (
              isGkTeamA &&
              ((e.type === "GOAL" && e.team === "B") ||
                (e.type === "OWN_GOAL" && e.team === "A"))
            )
              conceded++;
            if (
              isGkTeamB &&
              ((e.type === "GOAL" && e.team === "A") ||
                (e.type === "OWN_GOAL" && e.team === "B"))
            )
              conceded++;
          });
          filtered.goalsAgainst += conceded;
          if (conceded === 0) filtered.cleanSheets++;
        }

        // Gols e Assistências
        const rawDate = m.date?.split("T")[0] || "S/D";
        const displayDate =
          rawDate !== "S/D" ? rawDate.split("-").reverse().join("/") : "S/D";
        if (!dailyGroup[displayDate]) dailyGroup[displayDate] = { g: 0, a: 0 };

        m.events?.forEach((e) => {
          const isAuthor = String(e.playerId) === String(player.id);
          const isAssist = String(e.assistId) === String(player.id);

          if (e.type === "GOAL" && isAuthor) {
            filtered.goals++;
            dailyGroup[displayDate].g++;
          }
          if (
            (e.type === "GOAL" && isAssist) ||
            (e.type === "ASSIST" && isAuthor)
          ) {
            filtered.assists++;
            dailyGroup[displayDate].a++;
          }
          if (isAuthor) {
            if (e.type === "YELLOW_CARD") filtered.yellow++;
            if (e.type === "RED_CARD") filtered.red++;
          }
        });
      }
    });

    // --- LÓGICA DE DADOS MANUAIS (APENAS PARA TREINOS) ---
    const isAllSeason = selectedSeason === "ALL";
    // Regra: Se o filtro for "AMISTOSO", os manuais (que são de treinos) viram 0.
    const showManual = matchFilter === "ALL_TYPES" || matchFilter === "TREINO";

    let mGoals = 0;
    let mAssists = 0;
    let mMatches = 0;

    if (showManual) {
      if (isAllSeason) {
        mGoals = Number(player.manualGoals || 0);
        mAssists = Number(player.manualAssists || 0);
        mMatches = Number(player.manualMatches || 0);
      } else {
        const seasonMap = player.statsBySeason?.[selectedSeason] || {};
        mGoals = Number(seasonMap.goals || 0);
        mAssists = Number(seasonMap.assists || 0);
        mMatches = Number(seasonMap.matches || 0);
      }
    }

    return {
      display: {
        matches: filtered.matchesCount + mMatches,
        goals: filtered.goals + mGoals,
        assists: filtered.assists + mAssists,
        participation: filtered.goals + mGoals + (filtered.assists + mAssists),
        yellow: filtered.yellow,
        red: filtered.red,
        gamesAsGK: filtered.gamesAsGK,
        cleanSheets: filtered.cleanSheets,
        mgs:
          filtered.gamesAsGK > 0
            ? (filtered.goalsAgainst / filtered.gamesAsGK).toFixed(2)
            : "0.00",
      },
      records: {
        goals: Object.entries(dailyGroup).reduce(
          (max, [date, val]) =>
            val.g >= max.value ? { value: val.g, date } : max,
          { value: 0, date: "" },
        ),
        assists: Object.entries(dailyGroup).reduce(
          (max, [date, val]) =>
            val.a >= max.value ? { value: val.a, date } : max,
          { value: 0, date: "" },
        ),
      },
    };
  }, [player, matches, selectedSeason, matchFilter]);

  if (!stats) return null;

  return (
    <div className="psd-dashboard">
      <div className="psd-header-row">
        <div className="psd-filters">
          <select
            className="psd-season-select"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
          >
            <option value="ALL">TODAS AS TEMPORADAS</option>
            <option value="2026">TEMPORADA 26</option>
            <option value="2025">TEMPORADA 25</option>
          </select>

          <select
            className="psd-type-select"
            value={matchFilter}
            onChange={(e) => setMatchFilter(e.target.value)}
            style={{
              marginLeft: "10px",
              border: "1px solid #d4af37",
              borderRadius: "5px",
              background: "#000",
              color: "#fff",
              padding: "5px",
            }}
          >
            <option value="ALL_TYPES">GERAL</option>
            <option value="TREINO">APENAS TREINOS</option>
            <option value="AMISTOSO">APENAS AMISTOSOS</option>
          </select>
        </div>

        <h3 className="psd-title">
          {matchFilter === "ALL_TYPES" ? "Estatísticas" : matchFilter}
        </h3>
      </div>

      <div className="psd-grid-season">
        <div className="psd-card season-main">
          <span className="psd-label">JOGOS</span>
          <span className="psd-value">{stats.display.matches}</span>
        </div>
        <div className="psd-card season-goals">
          <span className="psd-label">GOLS</span>
          <span className="psd-value">{stats.display.goals}</span>
        </div>
        <div className="psd-card season-assists">
          <span className="psd-label">ASSISTS</span>
          <span className="psd-value">{stats.display.assists}</span>
        </div>
        <div className="psd-card participation-box">
          <span className="psd-label">PARTICIPAÇÕES</span>
          <span className="psd-value">{stats.display.participation}</span>
        </div>
        <div className="psd-card cards-box">
          <div className="card-item yellow">
            <div className="card-rect"></div>{" "}
            <span>{stats.display.yellow}</span>
          </div>
          <div className="card-item red">
            <div className="card-rect"></div> <span>{stats.display.red}</span>
          </div>
        </div>
      </div>

      <div className="psd-grid-season" style={{ marginTop: "12px" }}>
        <div className="psd-card season-main gk-style">
          <span className="psd-label">JOGOS (GL)</span>
          <span className="psd-value">{stats.display.gamesAsGK}</span>
        </div>
        <div className="psd-card season-goals gk-style">
          <span className="psd-label">CLEAN SHEETS</span>
          <span className="psd-value">{stats.display.cleanSheets}</span>
        </div>
        <div className="psd-card season-assists gk-style">
          <span className="psd-label">MGS</span>
          <span className="psd-value">{stats.display.mgs}</span>
        </div>
      </div>

      <div className="psd-lower-grid">
        <div className="psd-mini-card">
          <span className="psd-mini-label">RECORDE DIA (G)</span>
          <span className="psd-mini-value">{stats.records.goals.value}</span>
          <span className="psd-record-date">
            {stats.records.goals.date || "--/--/----"}
          </span>
        </div>
        <div className="psd-mini-card">
          <span className="psd-mini-label">RECORDE DIA (A)</span>
          <span className="psd-mini-value">{stats.records.assists.value}</span>
          <span className="psd-record-date">
            {stats.records.assists.date || "--/--/----"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsDashboard;
