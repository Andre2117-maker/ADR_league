import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import "./matchpage.css";
import "./friendlytabs.css";

import { calculateMatchStats } from "../../components/matchpages/matchUtils";
import { createEmptyFriendlyGame } from "../../components/matchpages/FriendlyGame/friendlyGamesUtils";
import { FORMATIONS_DATA } from "../../data/formationsConfig";

import MatchBanner from "../../components/matchpages/MatchBanner/MatchBanner";
import DualField from "../../components/matchpages/DualField/DualField";
import MatchStats from "../../components/matchpages/MatchStats/MatchStats";
import MatchTimeline from "../../components/matchpages/MatchTimeline/MatchTimeline";
import FriendlyGamesTabs from "../../components/matchpages/FriendlyGame/FriendlyGamesTabs";
import FriendlyGameField from "../../components/matchpages/FriendlyGame/FriendlyGameField";
import Footer from "../../components/Footer";

function MatchPage({ matches, players, isAdmin }) {
  const { id } = useParams();
  const match = matches.find((m) => String(m.id) === String(id));

  const [formA, setFormA] = useState(match?.formationA || "5_JOG_2-1-1");
  const [formB, setFormB] = useState(match?.formationB || "5_JOG_2-1-1");
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);

  const [prevDbFormA, setPrevDbFormA] = useState(match?.formationA);
  const [prevDbFormB, setPrevDbFormB] = useState(match?.formationB);

  const [showGoldenGoalInfo, setShowGoldenGoalInfo] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [mainTab, setMainTab] = useState("ESCALACOES");

  // Estado para controlar qual justificativa de cartão/lesão está aberta (Funciona 100% no Mobile e PC)
  const [activePopover, setActivePopover] = useState(null);

  // Fecha o tooltip ao tocar em qualquer lugar livre da tela
  useEffect(() => {
    const handleOutsideClick = () => setActivePopover(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  if (match && match.formationA !== prevDbFormA) {
    setPrevDbFormA(match.formationA);
    setFormA(match.formationA || "5_JOG_2-1-1");
  }

  if (match && match.formationB !== prevDbFormB) {
    setPrevDbFormB(match.formationB);
    setFormB(match.formationB || "5_JOG_2-1-1");
  }

  if (!match) return <div className="loading">Partida não encontrada...</div>;

  const isFriendly = match.type === "AMISTOSO" || match.type === "CAMPEONATO";
  const currentFriendlyGame = match.friendlyGames?.[selectedGameIndex] || {
    name: "JOGO 1",
    formation: "5_JOG_2-1-1",
    tactical: {},
  };

  const scoreA =
    match.events?.filter(
      (e) =>
        (e.type === "GOAL" && e.team === "A") ||
        (e.type === "OWN_GOAL" && e.team === "B"),
    ).length || 0;

  const scoreB =
    match.events?.filter(
      (e) =>
        (e.type === "GOAL" && e.team === "B") ||
        (e.type === "OWN_GOAL" && e.team === "A"),
    ).length || 0;

  const { stats, mvp } = calculateMatchStats(match, players);

  const getScorers = (teamKey) => {
    const goals =
      match.events?.filter(
        (e) =>
          (e.team === teamKey && e.type === "GOAL") ||
          (e.team !== teamKey && e.type === "OWN_GOAL"),
      ) || [];

    const scorersMap = {};
    goals.forEach((g) => {
      const pId = g.playerId;
      const pInfo = players.find((p) => String(p.id) === String(pId));

      let rawName = "Desconhecido";

      if (pInfo) {
        rawName = pInfo.name;
      } else if (g.externalName && g.externalName.trim() !== "") {
        rawName = g.externalName;
      } else if (g.playerName && g.playerName.trim() !== "") {
        rawName = g.playerName;
      } else if (pId && pId !== "EXTERNO" && isNaN(Number(pId))) {
        rawName = String(pId);
      }

      const name = rawName.split(" ")[0];
      const suffix = g.type === "OWN_GOAL" ? " (GC)" : "";
      const fullName = name + suffix;

      scorersMap[fullName] = (scorersMap[fullName] || 0) + 1;
    });

    return Object.entries(scorersMap).map(([name, count]) => (
      <span key={name} className="scorer-item">
        ⚽ {name} {count > 1 ? `(${count})` : ""}
      </span>
    ));
  };

  const handleAddFriendlyGame = async () => {
    try {
      const newGame = createEmptyFriendlyGame(
        (match.friendlyGames?.length || 0) + 1,
      );
      await updateDoc(doc(db, "matches", match.id), {
        friendlyGames: arrayUnion(newGame),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFriendlyGame = async (index) => {
    try {
      const updated = match.friendlyGames.filter((_, i) => i !== index);
      await updateDoc(doc(db, "matches", match.id), {
        friendlyGames: updated,
      });
      setSelectedGameIndex(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFriendlyFormationChange = async (formation) => {
    try {
      const updated = [...(match.friendlyGames || [])];
      if (!updated[selectedGameIndex]) {
        updated[selectedGameIndex] = {
          name: `JOGO ${selectedGameIndex + 1}`,
          formation: "5_JOG_2-1-1",
          tactical: {},
        };
      }
      updated[selectedGameIndex].formation = formation;
      await updateDoc(doc(db, "matches", match.id), {
        friendlyGames: updated,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEscalar = async (teamKey, slotId, pId) => {
    try {
      if (isFriendly) {
        const updated = [...match.friendlyGames];
        updated[selectedGameIndex].tactical[slotId] = pId;
        await updateDoc(doc(db, "matches", match.id), {
          friendlyGames: updated,
        });
        return;
      }
      const field =
        teamKey === "A" ? `tacticalA.${slotId}` : `tacticalB.${slotId}`;
      await updateDoc(doc(db, "matches", match.id), {
        [field]: pId,
      });
    } catch (err) {
      console.error("Erro ao escalar:", err);
    }
  };

  const getActiveSlots = (formKey) => {
    const formFut4 = FORMATIONS_DATA.FUT4?.[formKey];
    const formFut5 = FORMATIONS_DATA.FUT5?.[formKey];
    const formFut6 = FORMATIONS_DATA.FUT6?.[formKey];
    const formFut7 = FORMATIONS_DATA.FUT7?.[formKey];
    const formFut8 = FORMATIONS_DATA.FUT8?.[formKey];
    return (
      (formFut4 || formFut5 || formFut6 || formFut7 || formFut8)?.slots || []
    );
  };

  const getPlayerStats = (pId, role, teamKey) => {
    if (!pId) return null;
    const pObj = players.find((player) => String(player.id) === String(pId));
    if (!pObj) return null;

    const teamData = teamKey === "B" ? match.teamB : match.teamA;
    const isTeamGK = String(teamData?.goalkeeperId) === String(pId);
    const isCaptain = String(teamData?.captainId) === String(pId);

    const isMVP = mvp && String(pObj.id) === String(mvp.id);
    const pEvents =
      match.events?.filter((e) => String(e.playerId) === String(pId)) || [];
    const goals = pEvents.filter((e) => e.type === "GOAL").length;
    const assists =
      match.events?.filter(
        (e) => e.type === "GOAL" && String(e.assistId) === String(pId),
      ).length || 0;
    const ownGoals = pEvents.filter((e) => e.type === "OWN_GOAL").length;
    const yellowEvents = pEvents.filter(
      (e) => e.type === "YELLOW_CARD" || e.type === "YELLOW",
    );
    const yellowReasons = yellowEvents
      .map((e) =>
        e.minute ? `${e.minute}' - ${e.reason || "Cartão Amarelo"}` : e.reason,
      )
      .filter(Boolean)
      .join(" • ");
    const redEvents = pEvents.filter(
      (e) => e.type === "RED_CARD" || e.type === "RED",
    );
    const redReasons = redEvents
      .map((e) =>
        e.minute ? `${e.minute}' - ${e.reason || "Cartão Vermelho"}` : e.reason,
      )
      .filter(Boolean)
      .join(" • ");

    return {
      pObj,
      isMVP,
      isTeamGK,
      isCaptain,
      goals,
      assists,
      ownGoals,
      yellowEvents,
      yellowReasons,
      redEvents,
      redReasons,
      role,
    };
  };

  // Alterna o popover de justificativa sem girar o card ou perder o clique no mobile
  const toggleBadgeInfo = (e, popKey, infoData) => {
    e.stopPropagation();
    e.preventDefault();
    setActivePopover((prev) =>
      prev?.key === popKey ? null : { key: popKey, ...infoData },
    );
  };

  const renderPlayerUI = (stats, subType, subReason, slotUniqueKey = "") => {
    if (!stats) return null;
    const {
      pObj,
      isMVP,
      isTeamGK,
      isCaptain,
      goals,
      assists,
      ownGoals,
      yellowEvents,
      yellowReasons,
      redEvents,
      redReasons,
      role,
    } = stats;

    const isInjured =
      subType === "out" &&
      subReason &&
      subReason.toLowerCase().includes("lesão");

    const yellowKey = `${slotUniqueKey}_${pObj.id}_Y`;
    const redKey = `${slotUniqueKey}_${pObj.id}_R`;
    const injuryKey = `${slotUniqueKey}_${pObj.id}_INJ`;

    const isYellowOpen = activePopover?.key === yellowKey;
    const isRedOpen = activePopover?.key === redKey;
    const isInjuryOpen = activePopover?.key === injuryKey;

    return (
      <div
        className={`player-tactical ${isMVP ? "is-mvp" : ""} ${
          subType === "out" ? "is-sub-out" : ""
        }`}
      >
        {/* ==================== COLUNA DIREITA: ESTATÍSTICAS E CARTÕES ==================== */}
        <div className="player-badges-right">
          {goals > 0 && (
            <div className="pro-badge badge-goal" title={`${goals} Gol(s)`}>
              <span className="pro-badge-icon">⚽</span>
              {goals > 1 && <span className="pro-badge-count">{goals}</span>}
            </div>
          )}

          {assists > 0 && (
            <div
              className="pro-badge badge-assist"
              title={`${assists} Assistência(s)`}
            >
              <span className="pro-badge-icon">👟</span>
              {assists > 1 && (
                <span className="pro-badge-count">{assists}</span>
              )}
            </div>
          )}

          {yellowEvents.length > 0 && (
            <button
              type="button"
              className={`pro-card-badge card-yellow ${
                isYellowOpen ? "is-open" : ""
              }`}
              onClick={(e) =>
                toggleBadgeInfo(e, yellowKey, {
                  playerName: pObj.name,
                  typeLabel: "CARTÃO AMARELO",
                  typeClass: "yellow",
                  text: yellowReasons || "Advertência disciplinar na partida",
                })
              }
            >
              <span className="card-3d-rect yellow-rect">
                {yellowEvents.length > 1 && (
                  <small className="card-multi-num">
                    {yellowEvents.length}
                  </small>
                )}
              </span>

              <span className={`pro-tooltip ${isYellowOpen ? "visible" : ""}`}>
                <strong className="pro-tooltip-head yellow">
                  🟨 CARTÃO AMARELO
                </strong>
                <span>{yellowReasons || "Motivo não especificado"}</span>
              </span>
            </button>
          )}

          {redEvents.length > 0 && (
            <button
              type="button"
              className={`pro-card-badge card-red ${
                isRedOpen ? "is-open" : ""
              }`}
              onClick={(e) =>
                toggleBadgeInfo(e, redKey, {
                  playerName: pObj.name,
                  typeLabel: "CARTÃO VERMELHO",
                  typeClass: "red",
                  text: redReasons || "Expulsão direta na partida",
                })
              }
            >
              <span className="card-3d-rect red-rect">
                {redEvents.length > 1 && (
                  <small className="card-multi-num">{redEvents.length}</small>
                )}
              </span>

              <span className={`pro-tooltip ${isRedOpen ? "visible" : ""}`}>
                <strong className="pro-tooltip-head red">
                  🟥 CARTÃO VERMELHO
                </strong>
                <span>{redReasons || "Motivo não especificado"}</span>
              </span>
            </button>
          )}

          {ownGoals > 0 && (
            <div className="pro-badge badge-og" title="Gol Contra">
              <span>GC</span>
              {ownGoals > 1 && (
                <span className="pro-badge-count">{ownGoals}</span>
              )}
            </div>
          )}
        </div>

        {/* ==================== COLUNA ESQUERDA: CAPITÃO, GOLEIRO, SUB E LESÃO ==================== */}
        <div className="player-badges-left">
          {/* BRAÇADEIRA DE CAPITÃO CADASTRADO NO BANCO */}
          {isCaptain && (
            <div className="pro-role-badge captain" title="Capitão da Equipe">
              C
            </div>
          )}

          {/* LUVA DE GOLEIRO (Mostra se for o Goleiro do banco OU estiver no slot GK) */}
          {(role === "GK" || isTeamGK) && (
            <div className="pro-role-badge gk" title="Goleiro da Equipe">
              🧤
            </div>
          )}

          {subType === "out" && (
            <div className="pro-sub-badge sub-out" title="Substituído (Saiu)">
              <img src="/setaVerm.png" alt="Saiu" />
            </div>
          )}

          {subType === "in" && (
            <div className="pro-sub-badge sub-in" title="Entrou em campo">
              <img src="/setaVerd.png" alt="Entrou" />
            </div>
          )}

          {isInjured && (
            <button
              type="button"
              className={`pro-card-badge badge-injury ${
                isInjuryOpen ? "is-open" : ""
              }`}
              onClick={(e) =>
                toggleBadgeInfo(e, injuryKey, {
                  playerName: pObj.name,
                  typeLabel: "SUBSTITUIÇÃO POR LESÃO",
                  typeClass: "injury",
                  text: subReason || "Atleta substituído por lesão",
                })
              }
            >
              <img src="/lesao.png" alt="Lesão" className="injury-icon-img" />
              <span className={`pro-tooltip ${isInjuryOpen ? "visible" : ""}`}>
                <strong className="pro-tooltip-head injury">✚ LESÃO</strong>
                <span>{subReason || "Saiu por lesão"}</span>
              </span>
            </button>
          )}
        </div>

        {/* FOTO E PLACA DE NOME DO ATLETA */}
        <img
          src={pObj.photo || "/players/default.png"}
          className="player-img"
          alt={pObj.name}
          style={
            subType === "out" ? { filter: "grayscale(45%) opacity(0.82)" } : {}
          }
        />

        <div className="player-card-label">
          <span className="p-card-num">{pObj.number || "0"}</span>
          <span className="p-card-name">{pObj.name.split(" ")[0]}</span>
        </div>
      </div>
    );
  };

  const renderSlot = (slot, teamKey, teamPlayersIds) => {
    const teamData = teamKey === "B" ? match.teamB : match.teamA;
    const savedGkId = teamData?.goalkeeperId;
    const savedCapId = teamData?.captainId;

    const occupantId = isFriendly
      ? currentFriendlyGame?.tactical?.[slot.id]
      : teamKey === "A"
        ? match.tacticalA?.[slot.id]
        : match.tacticalB?.[slot.id];

    const subEvent = match.events
      ?.slice()
      .reverse()
      .find(
        (e) =>
          e.type === "SUB" &&
          e.team === teamKey &&
          (String(e.playerInId) === String(occupantId) ||
            String(e.playerOutId) === String(occupantId)),
      );

    const outStats = subEvent
      ? getPlayerStats(subEvent.playerOutId, slot.role, teamKey)
      : null;
    const inStats = subEvent
      ? getPlayerStats(subEvent.playerInId, slot.role, teamKey)
      : getPlayerStats(occupantId, slot.role, teamKey);

    const slotUniqueKey = `${teamKey}_${slot.id}`;
    const hasOpenPopoverInSlot =
      activePopover && activePopover.key.startsWith(slotUniqueKey);

    // Se for o slot de Goleiro (GK), coloca o goleiro salvo no banco no topo da lista!
    const sortedOptionIds = [...(teamPlayersIds || [])].sort((a, b) => {
      if (slot.role === "GK") {
        if (String(a) === String(savedGkId)) return -1;
        if (String(b) === String(savedGkId)) return 1;
      }
      return 0;
    });

    return (
      <div
        key={slot.id}
        className={`tactical-slot ${
          hasOpenPopoverInSlot ? "slot-popover-active" : ""
        }`}
        style={{ left: slot.x, top: slot.y }}
      >
        {outStats && inStats ? (
          <div className="sub-flip-container" tabIndex="0">
            <div className="sub-flip-inner">
              <div className="sub-flip-front">
                {renderPlayerUI(
                  outStats,
                  "out",
                  subEvent.reason,
                  `${slotUniqueKey}_OUT`,
                )}
              </div>
              <div className="sub-flip-back">
                {renderPlayerUI(inStats, "in", null, `${slotUniqueKey}_IN`)}
              </div>
            </div>
          </div>
        ) : inStats ? (
          renderPlayerUI(inStats, null, null, slotUniqueKey)
        ) : (
          <div
            className={`empty-slot-marker ${
              slot.role === "GK" ? "is-gk-slot" : ""
            }`}
          >
            {slot.role === "GK" ? "🧤" : "?"}
          </div>
        )}

        {isAdmin && (
          <select
            className="slot-selector"
            value={occupantId || ""}
            onChange={(e) => handleEscalar(teamKey, slot.id, e.target.value)}
          >
            <option value="">
              {slot.role === "GK" ? "🧤 Escalar Goleiro..." : "Escalar..."}
            </option>
            {sortedOptionIds.map((pId) => {
              const playerInfo = players.find(
                (pl) => String(pl.id) === String(pId),
              );
              const isThisGK = String(pId) === String(savedGkId);
              const isThisCap = String(pId) === String(savedCapId);

              const prefixBadges = [isThisGK ? "🧤" : "", isThisCap ? "©️" : ""]
                .filter(Boolean)
                .join(" ");

              const suffixTags = [
                isThisGK ? "[GOL]" : "",
                isThisCap ? "[CAP]" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <option key={pId} value={pId}>
                  {prefixBadges ? `${prefixBadges} ` : ""}
                  {playerInfo ? playerInfo.name : "Carregando..."}
                  {suffixTags ? ` ${suffixTags}` : ""}
                </option>
              );
            })}
          </select>
        )}
      </div>
    );
  };

  const renderPenalties = (teamPenalties) => {
    if (!teamPenalties || !Array.isArray(teamPenalties)) return null;
    return teamPenalties.map((p, index) => {
      const status = p?.result || p;
      const isGoal =
        status === "goal" || status === "scored" || status === "green";
      const isMiss = status === "miss" || status === "red" || status === "lost";
      return (
        <span
          key={index}
          className={`penalty-dot ${
            isGoal ? "bg-green-500" : isMiss ? "bg-red-500" : "bg-gray-300"
          }`}
          style={{
            display: "inline-block",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            margin: "0 2px",
            backgroundColor: isGoal ? "#28a745" : isMiss ? "#dc3545" : "#ccc",
          }}
        ></span>
      );
    });
  };

  const hasPenalties =
    match.penalties?.A?.length > 0 || match.penalties?.B?.length > 0;
  const teamsToRender = [
    { k: "A", f: formA, n: match.teamA.name, p: match.teamA.players },
    { k: "B", f: formB, n: match.teamB.name, p: match.teamB.players },
  ];

  return (
    <div className="match-view-wrapper" id="capture-area">
      {/* 1. Componente Extraído do Banner */}
      <MatchBanner
        match={match}
        scoreA={scoreA}
        scoreB={scoreB}
        getScorers={getScorers}
        hasPenalties={hasPenalties}
        renderPenalties={renderPenalties}
        showGoldenGoalInfo={showGoldenGoalInfo}
        setShowGoldenGoalInfo={setShowGoldenGoalInfo}
        isTimelineExpanded={isTimelineExpanded}
        setIsTimelineExpanded={setIsTimelineExpanded}
      />

      {/* 2. Timeline Condicional */}
      {isTimelineExpanded && (
        <div className="psg-timeline-dropdown">
          <MatchTimeline
            players={players}
            events={match.events || []}
            match={match}
          />
        </div>
      )}

      {/* 3. Menu de Abas */}
      <div className="psg-tabs-menu">
        <button
          className={mainTab === "ESCALACOES" ? "active" : ""}
          onClick={() => setMainTab("ESCALACOES")}
        >
          ESCALAÇÕES DAS EQUIPES
        </button>
        <button
          className={mainTab === "ESTATISTICAS" ? "active" : ""}
          onClick={() => setMainTab("ESTATISTICAS")}
        >
          ESTATÍSTICAS DA PARTIDA
        </button>
      </div>

      {/* 4. Conteúdo das Abas */}
      <div className="psg-tab-content">
        {mainTab === "ESTATISTICAS" && (
          <MatchStats
            teamStats={stats}
            teamAName={match.teamA.name}
            teamBName={match.teamB.name}
          />
        )}

        {mainTab === "ESCALACOES" && (
          <>
            {isFriendly && (
              <FriendlyGamesTabs
                games={match.friendlyGames || []}
                selectedGameIndex={selectedGameIndex}
                setSelectedGameIndex={setSelectedGameIndex}
                isAdmin={isAdmin}
                onAddGame={handleAddFriendlyGame}
                onRemoveGame={handleRemoveFriendlyGame}
              />
            )}

            {isFriendly ? (
              <FriendlyGameField
                game={currentFriendlyGame}
                players={players}
                match={match}
                renderSlot={renderSlot}
                isAdmin={isAdmin}
                onFormationChange={handleFriendlyFormationChange}
              />
            ) : (
              <DualField
                match={match}
                teamsToRender={teamsToRender}
                isAdmin={isAdmin}
                formA={formA}
                setFormA={setFormA}
                formB={formB}
                setFormB={setFormB}
                getActiveSlots={getActiveSlots}
                renderSlot={renderSlot}
              />
            )}
          </>
        )}
      </div>

      {/* BARRA FLUTUANTE DE JUSTIFICATIVA NO MOBILE (Nunca corta na tela do celular!) */}
      {activePopover && (
        <div
          className={`mobile-card-reason-toast type-${activePopover.typeClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="toast-left-indicator" />
          <div className="toast-body">
            <span className="toast-kicker">
              {activePopover.typeLabel} • {activePopover.playerName}
            </span>
            <p className="toast-reason-text">{activePopover.text}</p>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setActivePopover(null)}
          >
            ✕
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default MatchPage;
