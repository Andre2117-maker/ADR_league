import React, { useMemo } from "react";
import "../styles/playerdashboard.css";

const PlayerStatsDashboard = ({ player, matches }) => {
  const stats = useMemo(() => {
    if (!player || !matches) return null;

    const manualGoals = Number(player.manualGoals) || 0;
    const manualAssists = Number(player.manualAssists) || 0;
    const manualMatches = Number(player.manualMatches) || 0;
    const currentYear = new Date().getFullYear();

    const pMatches = matches.filter(
      (m) =>
        m.teamA.players.some((id) => String(id) === String(player.id)) ||
        m.teamB.players.some((id) => String(id) === String(player.id)),
    );

    let seasonStats = { goals: 0, assists: 0, yellow: 0, red: 0, matches: 0 };
    let totalAuto = { goals: 0, assists: 0 };
    let dailyGroup = {};

    pMatches.forEach((m) => {
      // Formata a data para PT-BR (DD/MM)
      const rawDate = m.date?.split("T")[0] || "S/D";
      const displayDate =
        rawDate !== "S/D"
          ? rawDate.split("-").reverse().slice(0, 2).join("/")
          : "S/D";

      const isSeason = new Date(m.date).getFullYear() === currentYear;

      if (isSeason) seasonStats.matches++;
      if (!dailyGroup[displayDate]) dailyGroup[displayDate] = { g: 0, a: 0 };

      m.events.forEach((e) => {
        const isAuthor = String(e.playerId) === String(player.id);
        const isAssist = String(e.assistId) === String(player.id);

        if (e.type === "GOAL" && isAuthor) {
          totalAuto.goals++;
          dailyGroup[displayDate].g++;
          if (isSeason) seasonStats.goals++;
        }

        const countedAsAssist =
          (e.type === "GOAL" && isAssist) || (e.type === "ASSIST" && isAuthor);
        if (countedAsAssist) {
          totalAuto.assists++;
          dailyGroup[displayDate].a++;
          if (isSeason) seasonStats.assists++;
        }

        if (isAuthor && isSeason) {
          if (e.type === "YELLOW_CARD") seasonStats.yellow++;
          if (e.type === "RED_CARD") seasonStats.red++;
        }
      });
    });

    // Encontrar o recorde e a data correspondente
    let recordG = { value: 0, date: "" };
    let recordA = { value: 0, date: "" };

    Object.entries(dailyGroup).forEach(([date, val]) => {
      if (val.g >= recordG.value && val.g > 0) recordG = { value: val.g, date };
      if (val.a >= recordA.value && val.a > 0) recordA = { value: val.a, date };
    });

    return {
      season: seasonStats,
      allTime: {
        matches: manualMatches + pMatches.length,
        goals: manualGoals + totalAuto.goals,
        assists: manualAssists + totalAuto.assists,
      },
      records: {
        goals: recordG,
        assists: recordA,
      },
    };
  }, [player, matches]);

  if (!stats) return null;

  return (
    <div className="psd-dashboard">
      <h3 className="psd-title">Temporada {new Date().getFullYear()}</h3>
      <div className="psd-grid-season">
        <div className="psd-card season-main">
          <span className="psd-label">JOGOS</span>
          <span className="psd-value">{stats.season.matches}</span>
        </div>
        <div className="psd-card season-goals">
          <span className="psd-label">GOLS</span>
          <span className="psd-value">{stats.season.goals}</span>
        </div>
        <div className="psd-card season-assists">
          <span className="psd-label">ASSISTS</span>
          <span className="psd-value">{stats.season.assists}</span>
        </div>
        <div className="psd-card cards-box">
          <div className="card-item yellow">
            <div className="card-rect"></div> <span>{stats.season.yellow}</span>
          </div>
          <div className="card-item red">
            <div className="card-rect"></div> <span>{stats.season.red}</span>
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
        <div className="psd-mini-card all-time">
          <span className="psd-mini-label">TOTAL CARREIRA</span>
          <div className="psd-alltime-row">
            <span>⚽ {stats.allTime.goals}</span>
            <span>👟 {stats.allTime.assists}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsDashboard;
