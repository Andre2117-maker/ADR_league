import React, { useState, useEffect } from "react";
import "./MatchCard.css";
import LogoIDR from "../../../assets/IDR.png";

// Importando a moldura de Halloween
import halloweenMoldura from "../../assets/moldura/halloween.png";

const MatchCard = ({
  match,
  isAdmin,
  onEdit,
  onDelete,
  onNavigate,
  onSwapOrder,
}) => {
  const [isIdrTheme, setIsIdrTheme] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const hasIdr =
        document.body.classList.contains("theme-idr") ||
        document.documentElement.classList.contains("theme-idr") ||
        Boolean(document.querySelector(".theme-idr"));
      setIsIdrTheme(hasIdr);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const formatCardDate = (dateString) => {
    if (!dateString) return "Data a definir";
    const [y, m, d] = dateString.split("-");
    const dateObj = new Date(y, m - 1, d);
    const mesesFull = [
      "JANEIRO",
      "FEVEREIRO",
      "MARÇO",
      "ABRIL",
      "MAIO",
      "JUNHO",
      "JULHO",
      "AGOSTO",
      "SETEMBRO",
      "OUTUBRO",
      "NOVEMBRO",
      "DEZEMBRO",
    ];
    const diasSemana = [
      "DOMINGO",
      "SEGUNDA-FEIRA",
      "TERÇA-FEIRA",
      "QUARTA-FEIRA",
      "QUINTA-FEIRA",
      "SEXTA-FEIRA",
      "SÁBADO",
    ];
    return `${diasSemana[dateObj.getDay()]} ${d} ${mesesFull[dateObj.getMonth()]} ${y}`;
  };

  const getTeamScore = (teamLetter) => {
    if (!match.events) return 0;
    const opponentLetter = teamLetter === "A" ? "B" : "A";
    return match.events.filter(
      (e) =>
        (e.type === "GOAL" && e.team === teamLetter) ||
        (e.type === "OWN_GOAL" && e.team === opponentLetter),
    ).length;
  };

  const hasStarted =
    match.status === "FINISHED" ||
    match.winner ||
    (match.events && match.events.length > 0) ||
    (match.penalties && (match.penalties.A || match.penalties.B)) ||
    (match.penaltiesScoreA != null && match.penaltiesScoreA !== "");

  const scoreA = getTeamScore("A");
  const scoreB = getTeamScore("B");
  const isTie = scoreA === scoreB;

  const getPenaltyScore = (teamLetter) => {
    const penalties = match.penalties?.[teamLetter];
    if (!penalties || !Array.isArray(penalties)) return 0;

    if (typeof penalties[0] === "string") {
      return penalties.filter((p) => p === "goal").length;
    }
    if (typeof penalties[0] === "object") {
      return penalties.filter((p) => p?.result === "goal").length;
    }
    return 0;
  };

  const teamAName = match.teamA?.externalName || match.teamA?.name || "ADR";
  const teamBName =
    match.teamB?.externalName || match.teamB?.name || "Adversário";

  const getEventMolduraSrc = () => {
    switch (match.eventType) {
      case "HALLOWEEN":
        return halloweenMoldura;
      default:
        return halloweenMoldura;
    }
  };

  const formatEventSubtype = (subType) => {
    if (!subType) return "";
    const clean = subType.replace(/_/g, " ").toLowerCase();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const isEvent = match.type === "EVENTO";

  return (
    <div className={`psg-match-card ${isEvent ? "psg-event-card" : ""}`}>
      {/* Camada da Moldura abraçando o lado de fora da borda do card */}
      {isEvent && (
        <div
          className="psg-event-frame-overlay"
          style={{
            backgroundImage: `url(${getEventMolduraSrc()})`,
          }}
        />
      )}

      {/* Barra de Ações Administrativas */}
      {isAdmin && (
        <div className="psg-admin-actions">
          {onSwapOrder && (
            <>
              <button
                title="Subir Ordem"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwapOrder(match, "UP");
                }}
              >
                ▼
              </button>
              <button
                title="Descer Ordem"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwapOrder(match, "DOWN");
                }}
              >
                ▲
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(match);
            }}
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(match.id);
            }}
          >
            🗑️
          </button>
        </div>
      )}

      {/* Cabeçalho do Card com o nome do Evento ao lado */}
      <div className="psg-card-top">
        <span className="psg-comp-text">
          {isEvent ? (
            <>
              🎃
              {match.eventType ? `${formatEventSubtype(match.eventType)}` : ""}
            </>
          ) : (
            match.type || "RODADA"
          )}
          {match.championshipPhase ? ` - ${match.championshipPhase}` : ""}
        </span>

        {/* Marca d'água interna normal */}
        <div className="psg-watermark-image">
          {match.type === "CAMPEONATO" ? (
            <img src="/trofeu.png" alt="Troféu Campeonato" />
          ) : match.type === "AMISTOSO" ? (
            <img src="/Amistoso.png" alt="Troféu Amistoso" />
          ) : (
            <img
              src={isIdrTheme ? LogoIDR : "/logo.png"}
              alt={isIdrTheme ? "IDR" : "ADR"}
            />
          )}
        </div>
      </div>

      {/* Área dos Times */}
      <div className="psg-card-teams">
        {/* TIME A */}
        <div className="psg-team">
          <div className="psg-team-info">
            <img
              src={match.teamA?.logo || "/logo.png"}
              alt={teamAName}
              className="psg-team-logo"
            />
            <span className="psg-team-name">{teamAName}</span>
          </div>
          <div className="psg-team-score">
            {hasStarted ? (
              <span>
                {scoreA}
                {isTie && (
                  <small style={{ marginLeft: "5px", color: "#d4af37" }}>
                    (
                    {match.penaltiesScoreA != null &&
                    match.penaltiesScoreA !== ""
                      ? match.penaltiesScoreA
                      : getPenaltyScore("A")}
                    )
                  </small>
                )}
              </span>
            ) : (
              "-"
            )}
          </div>
        </div>

        {/* TIME B */}
        <div className="psg-team">
          <div className="psg-team-info">
            <img
              src={match.teamB?.logo || "/logo.png"}
              alt={teamBName}
              className="psg-team-logo opp-logo"
            />
            <span className="psg-team-name">{teamBName}</span>
          </div>
          <div className="psg-team-score">
            {hasStarted ? (
              <span>
                {scoreB}
                {isTie && (
                  <small style={{ marginLeft: "5px", color: "#d4af37" }}>
                    (
                    {match.penaltiesScoreB != null &&
                    match.penaltiesScoreB !== ""
                      ? match.penaltiesScoreB
                      : getPenaltyScore("B")}
                    )
                  </small>
                )}
              </span>
            ) : (
              "-"
            )}
          </div>
        </div>
      </div>

      {/* Informações da Partida */}
      <div className="psg-card-info">
        <p className="psg-date">
          {formatCardDate(match.date)} {match.time ? match.time : ""}
        </p>
        <p className="psg-venue">
          📍 {match.venue || match.location || "Local a definir"}
        </p>
      </div>

      {/* Botão de Match Center */}
      <div
        className="psg-match-center-btn"
        onClick={() => onNavigate(match.id)}
      >
        + INFORMAÇÕES
      </div>
    </div>
  );
};

export default MatchCard;
