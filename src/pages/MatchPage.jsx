import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import "../styles/matchpage.css";
import { calculateMatchStats } from "../components/matchpages/matchUtils";
import { exportMatchImage } from "../components/matchpages/screenshotHelper";
import MatchStats from "../components/matchpages/MatchStats";
import MatchTimeline from "../components/matchpages/MatchTimeline";
import { FORMATIONS_DATA } from "../data/formationsConfig";

function MatchPage({ matches, players, isAdmin }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const match = matches.find((m) => String(m.id) === String(id));

  const [formA, setFormA] = useState(match?.formationA || "5_JOG_2-1-1");
  const [formB, setFormB] = useState(match?.formationB || "5_JOG_2-1-1");
  const [prevId, setPrevId] = useState(id);

  if (id !== prevId) {
    setPrevId(id);
    setFormA(match?.formationA || "5_JOG_2-1-1");
    setFormB(match?.formationB || "5_JOG_2-1-1");
  }

  if (!match) return <div className="loading">Partida não encontrada...</div>;

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

  const handleEscalar = async (teamKey, slotId, pId) => {
    const field =
      teamKey === "A" ? `tacticalA.${slotId}` : `tacticalB.${slotId}`;
    try {
      await updateDoc(doc(db, "matches", match.id), { [field]: pId });
    } catch (err) {
      console.error("Erro ao escalar:", err);
    }
  };

  const handleSetFormation = async (teamKey, formationKey) => {
    try {
      const field = teamKey === "A" ? "formationA" : "formationB";
      if (teamKey === "A") setFormA(formationKey);
      else setFormB(formationKey);
      await updateDoc(doc(db, "matches", match.id), { [field]: formationKey });
    } catch (err) {
      console.error("Erro ao salvar formação:", err);
    }
  };

  const getActiveSlots = (formKey) =>
    (FORMATIONS_DATA.FUT5[formKey] || FORMATIONS_DATA.FUT6[formKey])?.slots ||
    [];

  const renderSlot = (slot, teamKey, teamPlayersIds) => {
    const occupantId =
      teamKey === "A" ? match.tacticalA?.[slot.id] : match.tacticalB?.[slot.id];
    const p = players.find(
      (player) => String(player.id) === String(occupantId),
    );
    const isMVP = mvp && p && String(p.id) === String(mvp.id);

    // Lógica de Emojis/Status
    const pEvents =
      match.events?.filter((e) => String(e.playerId) === String(occupantId)) ||
      [];
    const goals = pEvents.filter((e) => e.type === "GOAL").length;
    const yellows = pEvents.filter((e) => e.type === "YELLOW_CARD").length;
    const reds = pEvents.filter((e) => e.type === "RED_CARD").length;

    // Assistências (Pode estar no assistId de um GOAL)
    const assists =
      match.events?.filter(
        (e) => e.type === "GOAL" && String(e.assistId) === String(occupantId),
      ).length || 0;

    return (
      <div
        key={slot.id}
        className="tactical-slot"
        style={{ left: slot.x, top: slot.y }}
      >
        {p ? (
          <div className={`player-tactical ${isMVP ? "is-mvp" : ""}`}>
            {/* Badges de Status */}
            <div className="player-badges">
              {slot.role === "GK" && <span className="badge-item">🧤</span>}
              {goals > 0 && (
                <span className="badge-item">⚽{goals > 1 ? goals : ""}</span>
              )}
              {assists > 0 && (
                <span className="badge-item">
                  👟{assists > 1 ? assists : ""}
                </span>
              )}
              {yellows > 0 && <span className="badge-item">🟨</span>}
              {reds > 0 && <span className="badge-item">🟥</span>}
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

  return (
    <div className="match-view-wrapper" id="capture-area">
      <div className="match-top-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ❮ VOLTAR
        </button>
        <button
          className="screenshot-btn"
          onClick={() =>
            exportMatchImage(
              "capture-area",
              `${match.teamA.name}-vs-${match.teamB.name}`,
            )
          }
        >
          📸 SALVAR RESUMO
        </button>
      </div>

      <div className="scoreboard-container">
        <div className="sb-main">
          <div className="sb-team-name team-left">{match.teamA.name}</div>
          <div className="sb-score-box">
            {match.penaltiesScoreA !== undefined && (
              <span className="penalties-mini-score">
                ({match.penaltiesScoreA})
              </span>
            )}
            <span className="score">{scoreA}</span>
            <span className="vs-badge">VS</span>
            <span className="score">{scoreB}</span>
            {match.penaltiesScoreB !== undefined && (
              <span className="penalties-mini-score">
                ({match.penaltiesScoreB})
              </span>
            )}
          </div>
          <div className="sb-team-name team-right">{match.teamB.name}</div>
        </div>
      </div>

      <MatchTimeline events={match.events} players={players} />

      <div className="dual-fields-layout">
        {[
          {
            k: "A",
            f: formA,
            n: match.teamA.name,
            p: match.teamA.players,
            tact: match.tacticalA,
          },
          {
            k: "B",
            f: formB,
            n: match.teamB.name,
            p: match.teamB.players,
            tact: match.tacticalB,
          },
        ].map((t) => (
          <div key={t.k} className="field-section">
            <h3 className="field-team-title">{t.n}</h3>

            {isAdmin && (
              <div className="formation-select-wrapper">
                <select
                  className="formation-dropdown"
                  value={t.f}
                  onChange={(e) => handleSetFormation(t.k, e.target.value)}
                >
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

            <div className="pitch-canvas">
              <div className="field-lines">
                <div className="c-circle"></div>
                <div className="c-line"></div>
                <div className="b-top"></div>
                <div className="b-bottom"></div>
              </div>
              {getActiveSlots(t.f).map((s) => renderSlot(s, t.k, t.p))}
            </div>

            <div className="squad-list-container">
              <h4 className="squad-title">Elenco:</h4>
              <div className="squad-grid">
                {t.p?.map((pId) => {
                  const pInfo = players.find(
                    (pl) => String(pl.id) === String(pId),
                  );
                  const isOnField = Object.values(
                    t.k === "A" ? match.tacticalA || {} : match.tacticalB || {},
                  ).includes(pId);
                  return (
                    <div
                      key={pId}
                      className={`squad-player-item ${isOnField ? "on-field" : ""}`}
                    >
                      <span className="squad-num">{pInfo?.number || "0"}</span>
                      <span className="squad-name">
                        {pInfo?.name.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <MatchStats
        teamStats={stats}
        teamAName={match.teamA.name}
        teamBName={match.teamB.name}
      />
    </div>
  );
}

export default MatchPage;
