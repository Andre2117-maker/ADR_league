import React, { useState, useEffect } from "react";
import "./MatchCard.css";
import LogoIDR from "../../../assets/IDR.png";

// Importando a moldura de Halloween
import halloweenMoldura from "../../../assets/moldura/halloween.png";

/* Ícones (SVG, herdam a cor) */
const Ico = ({ d }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICO = {
  up: "M6 15l6-6 6 6",
  down: "M6 9l6 6 6-6",
  edit: "M4 20l1-4.5L15.5 5 19 8.5 8.5 19zM13.5 7l3.5 3.5",
  trash: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5",
  pin: "M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11zM12 12.3a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z",
  star: "M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z",
};

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
                aria-label="Subir ordem"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwapOrder(match, "UP");
                }}
              >
                <Ico d={ICO.up} />
              </button>
              <button
                title="Descer Ordem"
                aria-label="Descer ordem"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwapOrder(match, "DOWN");
                }}
              >
                <Ico d={ICO.down} />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(match);
            }}
            title="Editar"
            aria-label="Editar partida"
          >
            <Ico d={ICO.edit} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(match.id);
            }}
            title="Excluir"
            aria-label="Excluir partida"
            className="is-danger"
          >
            <Ico d={ICO.trash} />
          </button>
        </div>
      )}

      {/* Cabeçalho do Card com o nome do Evento ao lado */}
      <div className="psg-card-top">
        <span className="psg-comp-text">
          {isEvent ? (
            <>
              <Ico d={ICO.star} />
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
                  <small className="psg-penalty-score">
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
                  <small className="psg-penalty-score">
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
          <Ico d={ICO.pin} /> {match.venue || match.location || "Local a definir"}
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
