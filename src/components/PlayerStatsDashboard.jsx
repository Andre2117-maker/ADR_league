import React, { useState, useMemo } from "react";
import "../styles/playerdashboard.css";

const PlayerStatsDashboard = ({ player, matches }) => {
  const [selectedSeason, setSelectedSeason] = useState("ALL");

  const stats = useMemo(() => {
    if (!player || !matches) return null;

    // 1. Dados Manuais Globais (da raiz do banco)
    const mGoalsGlobal = Number(player.manualGoals || 0);
    const mAssistsGlobal = Number(player.manualAssists || 0);
    const mMatchesGlobal = Number(player.manualMatches || 0);

    // 2. Filtro de Partidas Reais
    const pMatches = matches.filter(
      (m) =>
        m.teamA.players.some((id) => String(id) === String(player.id)) ||
        m.teamB.players.some((id) => String(id) === String(player.id)),
    );

    let filtered = { goals: 0, assists: 0, yellow: 0, red: 0, matches: 0 };
    let dailyGroup = {};

    pMatches.forEach((m) => {
      const matchYear = new Date(m.date).getFullYear();

      // Se não for ALL, filtra pelo ano
      if (selectedSeason !== "ALL" && matchYear !== Number(selectedSeason))
        return;

      filtered.matches++;

      const rawDate = m.date?.split("T")[0] || "S/D";
      const displayDate =
        rawDate !== "S/D"
          ? rawDate.split("-").reverse().slice(0, 2).join("/")
          : "S/D";

      if (!dailyGroup[displayDate]) dailyGroup[displayDate] = { g: 0, a: 0 };

      m.events.forEach((e) => {
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
    });

    // Restaurado: Cálculo de Recordes Diários
    let recordG = { value: 0, date: "" };
    let recordA = { value: 0, date: "" };
    Object.entries(dailyGroup).forEach(([date, val]) => {
      if (val.g >= recordG.value && val.g > 0) recordG = { value: val.g, date };
      if (val.a >= recordA.value && val.a > 0) recordA = { value: val.a, date };
    });

    const isAll = selectedSeason === "ALL";

    // 3. Dados Manuais da Temporada Selecionada (Ex: só 2026 ou só 2025)
    const seasonMap = player.statsBySeason?.[selectedSeason] || {};
    const sManualGoals = Number(seasonMap.goals || 0);
    const sManualAssists = Number(seasonMap.assists || 0);
    const sManualMatches = Number(seasonMap.matches || seasonMap.games || 0);

    return {
      display: {
        // Se ALL: soma Partidas Totais + Manual Global
        // Se Temporada: soma Partidas do Ano + Manual do Ano
        matches: isAll
          ? filtered.matches + mMatchesGlobal
          : filtered.matches + sManualMatches,
        goals: isAll
          ? filtered.goals + mGoalsGlobal
          : filtered.goals + sManualGoals,
        assists: isAll
          ? filtered.assists + mAssistsGlobal
          : filtered.assists + sManualAssists,
        yellow: filtered.yellow,
        red: filtered.red,
      },
      records: { goals: recordG, assists: recordA },
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

      <div className="psd-grid-season">
        <div className="psd-card season-main">
          <span className="psd-label">JOGOS</span>
          <span className="psd-value">{stats.display.matches}</span>
        </div>
        <div className="psd-card season-goals">
          <span className="psd-label">GOLS</span>
          <span className="psd-value"> {stats.display.goals}</span>
        </div>
        <div className="psd-card season-assists">
          <span className="psd-label">ASSISTS</span>
          <span className="psd-value"> {stats.display.assists}</span>
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

      <div className="psd-lower-grid">
        <div className="psd-mini-card">
          <span className="psd-mini-label">RECORDE DIA (G)</span>
          <span className="psd-mini-value">{stats.records.goals.value}</span>
          <span className="psd-record-date">
            {stats.records.goals.date || "--/--"}
          </span>
        </div>
        <div className="psd-mini-card">
          <span className="psd-mini-label">RECORDE DIA (A)</span>
          <span className="psd-mini-value">{stats.records.assists.value}</span>
          <span className="psd-record-date">
            {stats.records.assists.date || "--/--"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsDashboard;
