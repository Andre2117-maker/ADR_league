import React, { useMemo } from "react";
import { PenaltiesResult } from "../PenaltyResult/PenaltyResult";
import "./MatchTimeline.css";

const TimelineMarker = ({ icon, title, subtitle, customClass = "" }) => (
  <div className="timeline-marker-wrapper">
    <div className="timeline-horizontal-line"></div>
    <div className="timeline-marker-center">
      <span className="marker-icon">{icon}</span>
      <span className="marker-title">{title}</span>
      {subtitle && (
        <span className={`match-end-time ${customClass}`}>{subtitle}</span>
      )}
    </div>
    <div className="timeline-horizontal-line"></div>
  </div>
);

const MatchTimeline = ({ events, players, match }) => {
  const getPlayerName = (id, externalName) => {
    if (id === "EXTERNO" || id === "OPONENTE_EXTERNO") {
      return externalName || "Jogador Externo";
    }
    return players.find((p) => String(p.id) === String(id))?.name || "Jogador";
  };

  const renderEvent = (e, index) => {
    const isTeamA = e.team === "A";
    const stableKey = e.id || `${e.type}-${index}-${e.team}`;
    const isSub = e.type === "SUB";

    let icon = null;
    let extraLabel = null;
    let name = "";
    let assist = null;

    let isInjured = false;
    let playerOut = "";
    let playerIn = "";

    const minuteElement = e.minute ? (
      <span className="timeline-minute">{e.minute}</span>
    ) : null;

    if (isSub) {
      isInjured = e.reason === "Lesão" || e.reason === "Machucado";
      playerOut = getPlayerName(e.playerOutId);
      playerIn = getPlayerName(e.playerInId);
      icon = <span className="event-icon">🔄</span>;
    } else {
      const isOwnGoal = e.type === "OWN_GOAL";
      name = getPlayerName(e.playerId, e.externalName);
      assist =
        e.assistId && !isOwnGoal ? (
          <span className="timeline-assist">
            [{getPlayerName(e.assistId, e.externalAssistName)}]
          </span>
        ) : null;

      switch (e.type) {
        case "GOAL":
          icon = <span className="event-icon">⚽</span>;
          break;
        case "OWN_GOAL":
          icon = <span className="event-icon own-goal">⚽</span>;
          extraLabel = <small className="own-goal-label">(GC)</small>;
          break;
        case "YELLOW":
          icon = <span className="event-icon yellow-card">🟨</span>;
          break;
        case "RED":
          icon = <span className="event-icon red-card">🟥</span>;
          break;
        default:
          icon = <span className="event-icon">•</span>;
      }
    }

    return (
      <div key={stableKey} className="timeline-event-row">
        {/* LADO ESQUERDO (TIME A) */}
        <div className="timeline-side left">
          {isTeamA && !isSub && (
            <>
              {assist} {extraLabel} <span className="player-name">{name}</span>
              {minuteElement && (
                <span className="minute-spacing-left">{minuteElement}</span>
              )}
            </>
          )}

          {isTeamA && isSub && (
            <>
              <div className="sub-box left">
                <div className="sub-item-row">
                  {isInjured && <span className="sub-injury">➕</span>}
                  <span className="sub-out">⬇️ {playerOut}</span>
                </div>
                <span className="sub-in">⬆️ {playerIn}</span>
              </div>
              {minuteElement && (
                <span className="minute-spacing-left">{minuteElement}</span>
              )}
            </>
          )}
        </div>

        {/* CENTRO (ÍCONES) */}
        <div className="timeline-center-icon">{icon}</div>

        {/* LADO DIREITO (TIME B) */}
        <div className="timeline-side right">
          {!isTeamA && !isSub && (
            <>
              {minuteElement && (
                <span className="minute-spacing-right">{minuteElement}</span>
              )}
              <span className="player-name">{name}</span> {extraLabel} {assist}
            </>
          )}

          {!isTeamA && isSub && (
            <>
              {minuteElement && (
                <span className="minute-spacing-right">{minuteElement}</span>
              )}
              <div className="sub-box right">
                <div className="sub-item-row">
                  <span className="sub-out">⬇️ {playerOut}</span>
                  {isInjured && <span className="sub-injury">➕</span>}
                </div>
                <span className="sub-in">⬆️ {playerIn}</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const unifiedTimeline = useMemo(() => {
    const validEvents = events || [];

    const parseMinute = (minStr) => {
      if (!minStr) return 0;
      const str = String(minStr).replace("+", ".");
      return parseFloat(str) || 0;
    };

    let maxMin = 0;

    const parsedEvents = validEvents.map((e, index) => {
      const m = parseMinute(e.minute);
      if (m > maxMin) maxMin = m;
      return { ...e, isEvent: true, sortValue: m, originalIndex: index };
    });

    const markers = [];
    if (maxMin > 0) {
      const lastMarker = Math.ceil(maxMin / 5) * 5;
      for (let i = 5; i <= lastMarker; i += 5) {
        markers.push({ isMarker: true, minute: String(i), sortValue: i });
      }
    }

    const unified = [...parsedEvents, ...markers];

    unified.sort((a, b) => {
      if (a.sortValue === b.sortValue) {
        if (a.isMarker && !b.isMarker) return -1;
        if (!a.isMarker && b.isMarker) return 1;
        return a.originalIndex - b.originalIndex;
      }
      return a.sortValue - b.sortValue;
    });

    return unified;
  }, [events]);

  return (
    <div className="timeline-scroll-wrapper">
      <div className="match-timeline-container">
        {/* Linha vertical central */}
        <div className="timeline-vertical-line"></div>

        {/* --- MARCADOR: PONTAPÉ INICIAL --- */}
        <TimelineMarker icon="⏱️" title="PONTAPÉ INICIAL" />

        {/* --- LISTA UNIFICADA --- */}
        {unifiedTimeline.map((item, index) => {
          if (item.isMarker) {
            return (
              <div
                key={`marker-${item.minute}-${index}`}
                className="timeline-time-marker"
              >
                <div className="marker-badge">{item.minute}'</div>
              </div>
            );
          }
          return renderEvent(item, index);
        })}

        {/* BLOCO DE PÊNALTIS */}
        {(match.penalties?.A?.length > 0 || match.penalties?.B?.length > 0) && (
          <PenaltiesResult draft={match} players={players} />
        )}

        {/* --- MARCADOR: FIM DA PARTIDA --- */}
        <TimelineMarker
          icon="⏱️"
          title="FIM DA PARTIDA"
          customClass="tempo-fim-partida"
        />
      </div>
    </div>
  );
};

export default MatchTimeline;
