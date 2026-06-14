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

  const [formA, setFormA] = useState(match?.formationA || "5_JOG_2-1-1");

  const [formB, setFormB] = useState(match?.formationB || "5_JOG_2-1-1");

  const [prevId, setPrevId] = useState(id);

  const [selectedGameIndex, setSelectedGameIndex] = useState(0);

  if (id !== prevId) {
    setPrevId(id);

    setFormA(match?.formationA || "5_JOG_2-1-1");

    setFormB(match?.formationB || "5_JOG_2-1-1");
  }

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

  const renderSlot = (slot, teamKey, teamPlayersIds) => {
    const occupantId = isFriendly
      ? currentFriendlyGame?.tactical?.[slot.id]
      : teamKey === "A"
        ? match.tacticalA?.[slot.id]
        : match.tacticalB?.[slot.id];

    const p = players.find(
      (player) => String(player.id) === String(occupantId),
    );

    const isMVP = mvp && p && String(p.id) === String(mvp.id);

    const pEvents =
      match.events?.filter((e) => String(e.playerId) === String(occupantId)) ||
      [];

    const goals = pEvents.filter((e) => e.type === "GOAL").length;

    const assists =
      match.events?.filter(
        (e) => e.type === "GOAL" && String(e.assistId) === String(occupantId),
      ).length || 0;

    const ownGoals = pEvents.filter((e) => e.type === "OWN_GOAL").length;

    const yellows = pEvents.filter(
      (e) => e.type === "YELLOW_CARD" || e.type === "YELLOW",
    ).length;

    const reds = pEvents.filter(
      (e) => e.type === "RED_CARD" || e.type === "RED",
    ).length;

    return (
      <div
        key={slot.id}
        className="tactical-slot"
        style={{
          left: slot.x,
          top: slot.y,
        }}
      >
        {p ? (
          <div className={`player-tactical ${isMVP ? "is-mvp" : ""}`}>
            <div className="player-badges">
              {goals > 0 && (
                <span className="badge-item">
                  ⚽{goals > 1 && <small>{goals}</small>}
                </span>
              )}

              {assists > 0 && (
                <span className="badge-item">
                  👟
                  {assists > 1 && <small>{assists}</small>}
                </span>
              )}

              {yellows > 0 && (
                <span className="badge-item">
                  🟨
                  {yellows > 1 && <small>{yellows}</small>}
                </span>
              )}

              {reds > 0 && (
                <span className="badge-item">
                  🟥
                  {reds > 1 && <small>{reds}</small>}
                </span>
              )}

              {slot.role === "GK" && <span className="badge-item">🧤</span>}

              {ownGoals > 0 && (
                <span className="badge-item">
                  GC
                  {ownGoals > 1 && <small>{ownGoals}</small>}
                </span>
              )}
            </div>

            <img
              src={p.photo || "/players/default.png"}
              className="player-img"
              alt={p.name}
            />

            <div className="player-card-label">
              <span className="p-card-num">{p.number || "0"}</span>

              <span className="p-card-name">{p.name.split(" ")[0]}</span>
            </div>
          </div>
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

  console.log("CHAVES ENCONTRADAS NO ARQUIVO:", Object.keys(FORMATIONS_DATA));

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
