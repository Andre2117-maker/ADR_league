import React, { useState, useMemo } from "react";
import "../../styles/Playerpage/playerdashboard.css";

const PlayerStatsDashboard = ({ player, matches }) => {
  const [selectedSeason, setSelectedSeason] = useState("ALL");

  const stats = useMemo(() => {
    if (!player || !matches) return null;

    // 1. Dados Manuais
    const mGoalsGlobal = Number(player.manualGoals || 0);
    const mAssistsGlobal = Number(player.manualAssists || 0);
    const mMatchesGlobal = Number(player.manualMatches || 0);

    // 2. Filtrar e Ordenar (mais recentes primeiro para os recordes)
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
      matches: 0,
      gamesAsGK: 0,
      cleanSheets: 0,
      goalsAgainst: 0,
    };

    let dailyGroup = {};

    pMatches.forEach((m) => {
      const matchYear = new Date(m.date).getFullYear();
      const isSelectedSeason =
        selectedSeason === "ALL" || matchYear === Number(selectedSeason);

      if (isSelectedSeason) {
        filtered.matches++;

        // Lógica de Goleiro
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

    const isAll = selectedSeason === "ALL";
    const seasonMap = player.statsBySeason?.[selectedSeason] || {};

    const finalGoals = isAll
      ? filtered.goals + mGoalsGlobal
      : filtered.goals + Number(seasonMap.goals || 0);
    const finalAssists = isAll
      ? filtered.assists + mAssistsGlobal
      : filtered.assists + Number(seasonMap.assists || 0);

    return {
      display: {
        matches: isAll
          ? filtered.matches + mMatchesGlobal
          : filtered.matches + Number(seasonMap.matches || 0),
        goals: finalGoals,
        assists: finalAssists,
        participation: finalGoals + finalAssists,
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
  }, [player, matches, selectedSeason]);

  if (!stats) return null;

  return (
    <div className="psd-dashboard">
      <div className="psd-header-row">
        <select
          className="psd-season-select"
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
        >
          <option value="ALL">TODAS AS TEMPORADAS</option>
          <option value="2026">TEMPORADA 26</option>
          <option value="2025">TEMPORADA 25</option>
        </select>
        <h3 className="psd-title">
          {selectedSeason === "ALL"
            ? "Carreira Completa"
            : `Temporada ${selectedSeason}`}
        </h3>
      </div>

      {/* GRID PRINCIPAL (LINHA) */}
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
          <span className="psd-label">PARTICIPAÇÕES EM GOLS</span>
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

      {/* GRID GOLEIRO */}
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

      {/* RECORDES DIÁRIOS */}
      <div className="psd-lower-grid">
        <div className="psd-mini-card">
          <span className="psd-mini-label">RECORDE DIA (GOLS)</span>
          <span className="psd-mini-value">{stats.records.goals.value}</span>
          <span className="psd-record-date">
            {stats.records.goals.date || "--/--/----"}
          </span>
        </div>
        <div className="psd-mini-card">
          <span className="psd-mini-label">RECORDE DIA (ASSISTS)</span>
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
