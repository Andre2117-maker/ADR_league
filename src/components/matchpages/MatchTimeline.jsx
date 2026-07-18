import React from "react";
import { PenaltiesResult } from "./PenaltyResult";

const TimelineMarker = ({ icon, title, subtitle, customClass = "" }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      width: "100%",
      margin: "15px 0",
      zIndex: 2, // Fica acima da linha vertical central
      position: "relative",
    }}
  >
    {/* Linha horizontal esquerda */}
    <div
      style={{
        flex: 1,
        height: "1px",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
      }}
    ></div>

    {/* Centro (Fundo preto esconde a linha vertical que passa por trás) */}
    <div
      style={{
        padding: "0 15px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 1)", // Garanta que é a mesma cor de fundo do contêiner
      }}
    >
      <span style={{ color: "#888", fontSize: "16px", marginBottom: "4px" }}>
        {icon}
      </span>
      <span
        style={{
          color: "#8FAEC2",
          fontSize: "11px",
          fontWeight: "bold",
          letterSpacing: "1px",
        }}
      >
        {title}
      </span>
      {subtitle && (
        <span
          className={`match-end-time ${customClass}`}
          style={{ color: "#888", fontSize: "11px", marginTop: "4px" }}
        >
          {subtitle}
        </span>
      )}
    </div>

    {/* Linha horizontal direita */}
    <div
      style={{
        flex: 1,
        height: "1px",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
      }}
    ></div>
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

    // Variáveis comuns
    let icon = null;
    let extraLabel = null;
    let name = "";
    let assist = null;

    // Variáveis de Substituição
    let isInjured = false;
    let playerOut = "";
    let playerIn = "";

    // Elemento da Minutagem
    const minuteElement = e.minute ? (
      <span style={{ color: "#d4af37", fontWeight: "bold", fontSize: "13px" }}>
        {e.minute}
      </span>
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
          <span
            className="timeline-assist"
            style={{ fontSize: "0.85em", opacity: 0.8 }}
          >
            [{getPlayerName(e.assistId, e.externalAssistName)}]
          </span>
        ) : null;

      switch (e.type) {
        case "GOAL":
          icon = <span className="event-icon">⚽</span>;
          break;
        case "OWN_GOAL":
          icon = (
            <span className="event-icon" style={{ color: "#ff4444" }}>
              ⚽
            </span>
          );
          extraLabel = (
            <small style={{ color: "#ff4444", fontWeight: "bold" }}>(GC)</small>
          );
          break;
        case "YELLOW":
          icon = (
            <span
              className="event-icon"
              style={{ color: "#FFD700", fontWeight: "bold" }}
            >
              🟨
            </span>
          );
          break;
        case "RED":
          icon = (
            <span
              className="event-icon"
              style={{ color: "#ff2222", fontWeight: "bold" }}
            >
              🟥
            </span>
          );
          break;
        default:
          icon = <span className="event-icon">•</span>;
      }
    }

    return (
      <div
        key={stableKey}
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        {/* ========================================== */}
        {/* LADO ESQUERDO (TIME A) */}
        {/* ========================================== */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingRight: "15px",
            gap: "6px",
            textAlign: "right",
          }}
        >
          {isTeamA && !isSub && (
            <>
              {assist} {extraLabel} <span className="player-name">{name}</span>
              {minuteElement && (
                <span style={{ marginLeft: "6px" }}>{minuteElement}</span>
              )}
            </>
          )}

          {isTeamA && isSub && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "2px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                {isInjured && (
                  <span style={{ color: "#ff4444", fontSize: "12px" }}>➕</span>
                )}
                <span style={{ color: "#ff4444", fontSize: "11px" }}>
                  ⬇️ {playerOut}
                </span>
              </div>
              <span style={{ color: "#44ff44", fontSize: "11px" }}>
                ⬆️ {playerIn}
              </span>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* CENTRO (ÍCONES) */}
        {/* ========================================== */}
        <div
          style={{
            width: "30px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
            zIndex: 2,
          }}
        >
          {icon}
        </div>

        {/* ========================================== */}
        {/* LADO DIREITO (TIME B) */}
        {/* ========================================== */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            paddingLeft: "15px",
            gap: "6px",
            textAlign: "left",
          }}
        >
          {!isTeamA && !isSub && (
            <>
              {minuteElement && (
                <span style={{ marginRight: "6px" }}>{minuteElement}</span>
              )}
              <span className="player-name">{name}</span> {extraLabel} {assist}
            </>
          )}

          {!isTeamA && isSub && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <span style={{ color: "#ff4444", fontSize: "11px" }}>
                  ⬇️ {playerOut}
                </span>
                {isInjured && (
                  <span style={{ color: "#ff4444", fontSize: "12px" }}>➕</span>
                )}
              </div>
              <span style={{ color: "#44ff44", fontSize: "11px" }}>
                ⬆️ {playerIn}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="timeline-scroll-wrapper"
      style={{
        width: "100%",
        maxWidth: "600px",
        margin: "20px auto",
        maxHeight: "350px",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "10px",
        backgroundColor: "rgba(0, 0, 0)", // Fundo deve ser sólido para as quebras de linha funcionarem
        borderRadius: "8px",
      }}
    >
      <div
        className="match-timeline-container"
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          position: "relative",
          paddingBottom: "10px",
          paddingTop: "10px", // Reduzi o padding superior para encaixar melhor o marcador inicial
        }}
      >
        {/* Linha vertical central */}
        <div
          style={{
            position: "absolute",
            top: "25px",
            bottom: "25px",
            left: "50%",
            width: "2px", // Deixei um pouco mais fina pra parecer com a imagem
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            transform: "translateX(-50%)",
            zIndex: 1,
          }}
        ></div>

        {/* --- MARCADOR: PONTAPÉ INICIAL --- */}
        <TimelineMarker icon="⏱️" title="PONTAPÉ INICIAL" />

        {/* Mapeamento dos Eventos (Gols, Cartões, Subs) */}
        {events?.map((e, i) => renderEvent(e, i))}

        {/* BLOCO DE PÊNALTIS (Usando o 'match' que recebemos) */}
        {(match.penalties?.A?.length > 0 || match.penalties?.B?.length > 0) && (
          <PenaltiesResult draft={match} players={players} />
        )}

        {/* --- MARCADOR: FIM DA PARTIDA --- */}
        {/* Aqui está a classe match-end-time. Você pode passar o tempo pelo 'subtitle' ou preencher via CSS/props depois */}
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
