import React from "react";
import "./MatchCard.css";

const MatchCard = ({
  match,
  isAdmin,
  onEdit,
  onDelete,
  onNavigate,
  onSwapOrder,
}) => {
  // Função para formatar a data no padrão da imagem ("SEXTA-FEIRA 9 OUTUBRO 2026")
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
    match.winner || // Se existe um vencedor definido, a partida já ocorreu
    (match.events && match.events.length > 0) ||
    (match.penalties && (match.penalties.A || match.penalties.B)) || // Se teve disputa de pênaltis cadastrada
    (match.penaltiesScoreA != null && match.penaltiesScoreA !== "");

  const scoreA = getTeamScore("A");
  const scoreB = getTeamScore("B");
  const isTie = scoreA === scoreB;

  const getPenaltyScore = (teamLetter) => {
    const penalties = match.penalties?.[teamLetter];
    if (!penalties || !Array.isArray(penalties)) return 0;

    // Se o primeiro item for string (Lógica Antiga)
    if (typeof penalties[0] === "string") {
      return penalties.filter((p) => p === "goal").length;
    }

    // Se o primeiro item for objeto (Lógica Nova)
    if (typeof penalties[0] === "object") {
      return penalties.filter((p) => p?.result === "goal").length;
    }

    return 0;
  };

  // ==========================================
  // TRATAMENTO DOS NOMES DOS TIMES (Fallback)
  // ==========================================
  const teamAName = match.teamA?.externalName || match.teamA?.name || "ADR";
  const teamBName =
    match.teamB?.externalName || match.teamB?.name || "Adversário";

  return (
    <div className="psg-match-card">
      {/* Barra de Ações Administrativas */}
      {isAdmin && (
        <div className="psg-admin-actions">
          {/* SETAS DE ORDENAÇÃO */}
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

      {/* Cabeçalho do Card */}
      <div className="psg-card-top">
        <span className="psg-comp-text">
          {match.type || "RODADA"}
          {/* AQUI ENTRA A FASE DO CAMPEONATO SE EXISTIR */}
          {match.championshipPhase ? ` - ${match.championshipPhase}` : ""}
        </span>
        {/* Área da Marca d'água Dinâmica */}
        <div className="psg-watermark-image">
          {match.type === "CAMPEONATO" ? (
            <img src="/trofeu.png" alt="Troféu Campeonato" />
          ) : match.type === "AMISTOSO" ? (
            <img src="/Amistoso.png" alt="Troféu Amistoso" />
          ) : (
            <img src="/logo.png" alt="ADR" />
          )}
        </div>
      </div>

      {/* Área dos Times */}
      <div className="psg-card-teams">
        {/* TIME A (O ADR) */}
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

        {/* TIME B (Adversário / País) */}
        <div className="psg-team">
          <div className="psg-team-info">
            <img
              src={match.teamB?.logo || "/logo.png"}
              alt={teamBName}
              className="psg-team-logo opp-logo"
            />
            <span className="psg-team-name">{teamBName}</span>
          </div>
          {/* Placar do Time B ao lado */}
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

      {/* Informações da Partida (Data e Local) */}
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
