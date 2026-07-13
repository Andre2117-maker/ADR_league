import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import "../styles/matchpage/matchpage.css";
import "../styles/matchpage/friendlytabs.css";
import { calculateMatchStats } from "../components/matchpages/matchUtils";
import MatchStats from "../components/matchpages/MatchStats";
import MatchTimeline from "../components/matchpages/MatchTimeline";
import { FORMATIONS_DATA } from "../data/formationsConfig";
import FriendlyGamesTabs from "../components/matchpages/FriendlyGamesTabs";
import FriendlyGameField from "../components/matchpages/FriendlyGameField";
import { createEmptyFriendlyGame } from "../components/matchpages/friendlyGamesUtils";

function MatchPage({ matches, players, isAdmin }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const match = matches.find((m) => String(m.id) === String(id));

  // Estados locais da prancheta
  const [formA, setFormA] = useState(match?.formationA || "5_JOG_2-1-1");
  const [formB, setFormB] = useState(match?.formationB || "5_JOG_2-1-1");
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);

  // 1. Estados para "vigiar" a última versão do banco de dados (Substituindo o antigo prevId)
  const [prevDbFormA, setPrevDbFormA] = useState(match?.formationA);
  const [prevDbFormB, setPrevDbFormB] = useState(match?.formationB);

  // 2. Jeito Oficial do React: Atualizar estado durante a renderização se o banco mudar
  if (match && match.formationA !== prevDbFormA) {
    setPrevDbFormA(match.formationA);
    setFormA(match.formationA || "5_JOG_2-1-1");
  }

  if (match && match.formationB !== prevDbFormB) {
    setPrevDbFormB(match.formationB);
    setFormB(match.formationB || "5_JOG_2-1-1");
  }

  // Se o Firebase ainda não entregou a partida, exibe o carregamento
  if (!match) {
    return <div className="loading">Partida não encontrada...</div>;
  }

  const isFriendly = match.type === "AMISTOSO";

  const currentFriendlyGame = match.friendlyGames?.[selectedGameIndex] || {
    name: "JOGO 1",
    formation: "5_JOG_2-1-1",
    tactical: {},
  };

  // =========================
  // SCORE
  // =========================

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

  // =========================
  // ADD GAME
  // =========================

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

  // =========================
  // REMOVE GAME
  // =========================

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

  // =========================
  // FORMATION
  // =========================

  const handleFriendlyFormationChange = async (formation) => {
    try {
      const updated = [...(match.friendlyGames || [])];

      // se não existir jogo ainda
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

  // =========================
  // ESCALAR
  // =========================

  const handleEscalar = async (teamKey, slotId, pId) => {
    try {
      // =====================
      // AMISTOSO
      // =====================

      if (isFriendly) {
        const updated = [...match.friendlyGames];

        updated[selectedGameIndex].tactical[slotId] = pId;

        await updateDoc(doc(db, "matches", match.id), {
          friendlyGames: updated,
        });

        return;
      }

      // =====================
      // NORMAL
      // =====================

      const field =
        teamKey === "A" ? `tacticalA.${slotId}` : `tacticalB.${slotId}`;

      await updateDoc(doc(db, "matches", match.id), {
        [field]: pId,
      });
    } catch (err) {
      console.error("Erro ao escalar:", err);
    }
  };

  // =========================
  // FORMATION NORMAL
  // =========================

  // =========================
  // SLOTS
  // =========================

  const getActiveSlots = (formKey) => {
    const formFut4 = FORMATIONS_DATA.FUT4?.[formKey];
    const formFut5 = FORMATIONS_DATA.FUT5?.[formKey];
    const formFut6 = FORMATIONS_DATA.FUT6?.[formKey];

    return (formFut4 || formFut5 || formFut6)?.slots || [];
  };

  // =========================
  // RENDER SLOT
  // =========================

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

  // Função para desenhar a interface do card do jogador
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

    // Verifica se é o jogador que saiu e se o motivo da substituição contém "lesão" (ignorando maiúsculas/minúsculas)
    const isInjured =
      subType === "out" &&
      subReason &&
      subReason.toLowerCase().includes("lesão");

    return (
      <div
        className={`player-tactical ${isMVP ? "is-mvp" : ""} ${subType === "out" ? "is-sub-out" : ""}`}
      >
        <div className="player-badges">
          {/* NOVO: Ícone de Lesão (Usando a imagem que você enviou) */}
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

          {/* Indicadores visuais de substituição */}
          {subType === "out" && (
            <span>
              <img
                src="/setaVerm.png"
                alt="Lesão"
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
                alt="Lesão"
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

    // MUDANÇA AQUI: Procura o evento de SUB verificando se o occupantId foi quem ENTROU ou quem SAIU no time correspondente
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

    // Se houver evento, extrai as informações corretas de quem sai e quem entra
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
        {/* Se houver dados de substituição válidos, ativa o Flip Card */}
        {outStats && inStats ? (
          <div className="sub-flip-container" tabIndex="0">
            <div className="sub-flip-inner">
              <div className="sub-flip-front">
                {/* Passando o motivo (reason) do evento de substituição */}
                {renderPlayerUI(outStats, "out", subEvent.reason)}
              </div>
              <div className="sub-flip-back">
                {/* Aqui não precisamos exibir a lesão, pois o jogador que entrou está 100% */}
                {renderPlayerUI(inStats, "in", null)}
              </div>
            </div>
          </div>
        ) : inStats ? (
          /* Jogador normal sem alteração */
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

  // =========================
  // TIMES NORMAIS
  // =========================

  const teamsToRender = [
    {
      k: "A",
      f: formA,
      n: match.teamA.name,
      p: match.teamA.players,
    },
    {
      k: "B",
      f: formB,
      n: match.teamB.name,
      p: match.teamB.players,
    },
  ];

  const renderPenalties = (sequence = []) => {
    return sequence.map((p, i) => (
      <span key={i} className={`penalty-box ${p}`}></span>
    ));
  };

  const hasPenalties =
    match.penalties?.A?.length > 0 || match.penalties?.B?.length > 0;

  return (
    <div className="match-view-wrapper" id="capture-area">
      <div className="match-top-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ❮ VOLTAR
        </button>
      </div>

      <div className="scoreboard-container">
        <div className="sb-main">
          <div className="sb-team-name team-left">{match.teamA.name}</div>

          <div className="sb-score-box">
            <span className="score">{scoreA}</span>

            <span className="vs-badge">VS</span>

            <span className="score">{scoreB}</span>
          </div>

          <div className="sb-team-name team-right">{match.teamB.name}</div>
        </div>
        {hasPenalties && (
          <div className="penalties-row">
            <div className="penalties-team">
              {renderPenalties(match.penalties?.A)}
            </div>

            <span className="penalties-label">(PÊNALTIS)</span>

            <div className="penalties-team">
              {renderPenalties(match.penalties?.B)}
            </div>
          </div>
        )}
      </div>

      <MatchTimeline events={match.events} players={players} />

      {/* ===================== */}
      {/* TABS */}
      {/* ===================== */}

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

      {/* ===================== */}
      {/* AMISTOSO */}
      {/* ===================== */}

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
        <div className="dual-fields-layout">
          {teamsToRender.map((t) => (
            <div key={t.k} className="field-section">
              <div className="field-header">
                <h3 className="field-team-title">{t.n}</h3>

                {isAdmin && (
                  <div className="formation-select-wrapper">
                    <select
                      className="formation-dropdown"
                      value={t.k === "A" ? formA : formB}
                      onChange={async (e) => {
                        const newFormation = e.target.value;

                        try {
                          if (t.k === "A") {
                            setFormA(newFormation);

                            await updateDoc(doc(db, "matches", match.id), {
                              formationA: newFormation,
                            });
                          } else {
                            setFormB(newFormation);

                            await updateDoc(doc(db, "matches", match.id), {
                              formationB: newFormation,
                            });
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >
                      {/* NOVO: Grupo do FUT 4 */}
                      <optgroup label="FUT 4">
                        {Object.keys(FORMATIONS_DATA.FUT4 || {}).map((k) => (
                          <option key={k} value={k}>
                            {FORMATIONS_DATA.FUT4[k].label}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="FUT 5">
                        {Object.keys(FORMATIONS_DATA.FUT5).map((k) => (
                          <option key={k} value={k}>
                            {FORMATIONS_DATA.FUT5[k].label}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="FUT 6">
                        {Object.keys(FORMATIONS_DATA.FUT6).map((k) => (
                          <option key={k} value={k}>
                            {FORMATIONS_DATA.FUT6[k].label}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                )}
              </div>

              <div className="pitch-canvas">
                <div className="field-lines">
                  <div className="c-circle"></div>
                  <div className="c-line"></div>
                  <div className="b-top"></div>
                  <div className="b-bottom"></div>
                </div>

                {getActiveSlots(t.f).map((s) => renderSlot(s, t.k, t.p))}
              </div>
            </div>
          ))}
        </div>
      )}

      <MatchStats
        teamStats={stats}
        teamAName={match.teamA.name}
        teamBName={match.teamB.name}
      />
    </div>
  );
}

export default MatchPage;
