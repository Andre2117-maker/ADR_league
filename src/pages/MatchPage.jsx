import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import "../styles/matchpage/matchpage.css";
import "../styles/matchpage/friendlytabs.css";

import { calculateMatchStats } from "../components/matchpages/matchUtils";
import { createEmptyFriendlyGame } from "../components/matchpages/FriendlyGame/friendlyGamesUtils";
import { FORMATIONS_DATA } from "../data/formationsConfig";

import MatchBanner from "../components/matchpages/MatchBanner/MatchBanner";
import DualField from "../components/matchpages/DualField/DualField";
import MatchStats from "../components/matchpages/MatchStats/MatchStats";
import MatchTimeline from "../components/matchpages/MatchTimeline/MatchTimeline";
import FriendlyGamesTabs from "../components/matchpages/FriendlyGame/FriendlyGamesTabs";
import FriendlyGameField from "../components/matchpages/FriendlyGame/FriendlyGameField";
import Footer from "../components/Footer";

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

  const getPlayerStats = (pId, role) => {
    if (!pId) return null;
    const pObj = players.find((player) => String(player.id) === String(pId));
    if (!pObj) return null;

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
      .map((e) => e.reason)
      .filter(Boolean)
      .join(" | ");
    const redEvents = pEvents.filter(
      (e) => e.type === "RED_CARD" || e.type === "RED",
    );
    const redReasons = redEvents
      .map((e) => e.reason)
      .filter(Boolean)
      .join(" | ");

    return {
      pObj,
      isMVP,
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

  const renderPlayerUI = (stats, subType, subReason) => {
    if (!stats) return null;
    const {
      pObj,
      isMVP,
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

    return (
      <div
        className={`player-tactical ${isMVP ? "is-mvp" : ""} ${subType === "out" ? "is-sub-out" : ""}`}
      >
        <div className="player-badges">
          {isInjured && (
            <span
              style={{
                background: "transparent",
                padding: 0,
                boxShadow: "none",
              }}
            >
              <img
                src="/lesao.png"
                alt="Lesão"
                style={{ width: "22px", height: "22px", objectFit: "contain" }}
              />
              <span className="custom-tooltip">Saiu por Lesão</span>
            </span>
          )}
          {subType === "out" && (
            <span>
              <img
                src="/setaVerm.png"
                alt="Saiu"
                style={{ width: "22px", height: "22px", objectFit: "contain" }}
              />
            </span>
          )}
          {goals > 0 && (
            <span className="badge-item">
              ⚽{goals > 1 && <small>{goals}</small>}
            </span>
          )}
          {assists > 0 && (
            <span className="badge-item">
              👟{assists > 1 && <small>{assists}</small>}
            </span>
          )}
          {yellowEvents.length > 0 && (
            <span className="badge-item tooltip-container">
              🟨
              {yellowEvents.length > 1 && <small>{yellowEvents.length}</small>}
              <span className="custom-tooltip">
                {yellowReasons || "Cartão Amarelo"}
              </span>
            </span>
          )}
          {redEvents.length > 0 && (
            <span className="badge-item tooltip-container">
              🟥{redEvents.length > 1 && <small>{redEvents.length}</small>}
              <span className="custom-tooltip">
                {redReasons || "Cartão Vermelho"}
              </span>
            </span>
          )}
          {subType === "in" && (
            <span>
              <img
                src="/setaVerd.png"
                alt="Entrou"
                style={{ width: "22px", height: "22px", objectFit: "contain" }}
              />
            </span>
          )}
          {role === "GK" && <span className="badge-item">🧤</span>}
          {ownGoals > 0 && (
            <span className="badge-item">
              GC{ownGoals > 1 && <small>{ownGoals}</small>}
            </span>
          )}
        </div>
        <img
          src={pObj.photo || "/players/default.png"}
          className="player-img"
          alt={pObj.name}
          style={
            subType === "out" ? { filter: "grayscale(40%) opacity(0.8)" } : {}
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
      ? getPlayerStats(subEvent.playerOutId, slot.role)
      : null;
    const inStats = subEvent
      ? getPlayerStats(subEvent.playerInId, slot.role)
      : getPlayerStats(occupantId, slot.role);

    return (
      <div
        key={slot.id}
        className="tactical-slot"
        style={{ left: slot.x, top: slot.y }}
      >
        {outStats && inStats ? (
          <div className="sub-flip-container" tabIndex="0">
            <div className="sub-flip-inner">
              <div className="sub-flip-front">
                {renderPlayerUI(outStats, "out", subEvent.reason)}
              </div>
              <div className="sub-flip-back">
                {renderPlayerUI(inStats, "in", null)}
              </div>
            </div>
          </div>
        ) : inStats ? (
          renderPlayerUI(inStats, null, null)
        ) : (
          <div className="empty-slot-marker">?</div>
        )}
        {isAdmin && (
          <select
            className="slot-selector"
            value={occupantId || ""}
            onChange={(e) => handleEscalar(teamKey, slot.id, e.target.value)}
          >
            <option value="">Escalar...</option>
            {teamPlayersIds?.map((pId) => {
              const playerInfo = players.find(
                (pl) => String(pl.id) === String(pId),
              );
              return (
                <option key={pId} value={pId}>
                  {playerInfo ? playerInfo.name : "Carregando..."}
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
          className={`penalty-dot ${isGoal ? "bg-green-500" : isMiss ? "bg-red-500" : "bg-gray-300"}`}
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
              /* Componente Extraído dos Campos Duplos */
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
      <Footer />
    </div>
  );
}

export default MatchPage;
