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
    match.status === "FINISHED" || (match.events && match.events.length > 0);

  const scoreA = getTeamScore("A");
  const scoreB = getTeamScore("B");
  const isTie = scoreA === scoreB;

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
        <span className="psg-comp-text">{match.type || "RODADA"}</span>
        {/* Área da Marca d'água Dinâmica */}
        <div className="psg-watermark-image">
          {match.type === "AMISTOSO" ? (
            // Ícone de troféu para amistoso
            <img src="../src/assets/trofeu.png" alt="Troféu" />
          ) : (
            // Logo do ADR para treino ou outros
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
              alt={match.teamA?.name || "ADR"}
              className="psg-team-logo"
            />
            <span className="psg-team-name">{match.teamA?.name || "ADR"}</span>
          </div>
          {/* Placar do Time A ao lado */}
          <div className="psg-team-score">
            {hasStarted ? (
              <>
                {scoreA}
                {/* Pênaltis SÓ aparecem se empatou E se o valor existir */}
                {isTie && match.penaltiesScoreA != null && (
                  <span className="psg-penalty-score">
                    ({match.penaltiesScoreA})
                  </span>
                )}
              </>
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
              alt={match.teamB?.name || "Adversário"}
              className="psg-team-logo opp-logo"
            />
            <span className="psg-team-name">
              {match.teamB?.name || "Adversário"}
            </span>
          </div>
          {/* Placar do Time B ao lado */}
          <div className="psg-team-score">
            {hasStarted ? (
              <>
                {scoreB}
                {/* Pênaltis SÓ aparecem se empatou E se o valor existir */}
                {isTie && match.penaltiesScoreB != null && (
                  <span className="psg-penalty-score">
                    ({match.penaltiesScoreB})
                  </span>
                )}
              </>
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
