import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import "../styles/matchpage.css";

const FORMATIONS_DATA = {
  FUT5: {
    "5_JOG_2-1-1": {
      label: "2-1-1",
      slots: [
        { id: "s1", x: "50%", y: "18%" },
        { id: "s2", x: "25%", y: "38%" },
        { id: "s3", x: "75%", y: "38%" },
        { id: "s4", x: "50%", y: "60%" },
        { id: "s5", x: "50%", y: "85%" },
      ],
    },
    "5_JOG_1-2-1": {
      label: "1-2-1",
      slots: [
        { id: "s1", x: "50%", y: "18%" },
        { id: "s2", x: "50%", y: "38%" },
        { id: "s3", x: "25%", y: "58%" },
        { id: "s4", x: "75%", y: "58%" },
        { id: "s5", x: "50%", y: "85%" },
      ],
    },
    "5_JOG_1-1-2": {
      label: "1-1-2",
      slots: [
        { id: "s1", x: "50%", y: "18%" },
        { id: "s2", x: "50%", y: "38%" },
        { id: "s3", x: "30%", y: "68%" },
        { id: "s4", x: "70%", y: "68%" },
        { id: "s5", x: "50%", y: "85%" },
      ],
    },
    "5_JOG_1-2-2": {
      label: "1-2-2",
      slots: [
        { id: "s1", x: "50%", y: "18%" },
        { id: "s2", x: "25%", y: "45%" },
        { id: "s3", x: "75%", y: "45%" },
        { id: "s4", x: "30%", y: "75%" },
        { id: "s5", x: "70%", y: "75%" },
      ],
    },
  },
  FUT6: {
    "6_JOG_3-1-1": {
      label: "3-1-1",
      slots: [
        { id: "s1", x: "50%", y: "18%" },
        { id: "s2", x: "20%", y: "35%" },
        { id: "s3", x: "50%", y: "35%" },
        { id: "s4", x: "80%", y: "35%" },
        { id: "s5", x: "50%", y: "58%" },
        { id: "s6", x: "50%", y: "85%" },
      ],
    },
    "6_JOG_2-2-1": {
      label: "2-2-1",
      slots: [
        { id: "s1", x: "50%", y: "18%" },
        { id: "s2", x: "30%", y: "35%" },
        { id: "s3", x: "70%", y: "35%" },
        { id: "s4", x: "30%", y: "62%" },
        { id: "s5", x: "70%", y: "62%" },
        { id: "s6", x: "50%", y: "85%" },
      ],
    },
    "6_JOG_2-1-2": {
      label: "2-1-2",
      slots: [
        { id: "s1", x: "50%", y: "18%" },
        { id: "s2", x: "30%", y: "35%" },
        { id: "s3", x: "70%", y: "35%" },
        { id: "s4", x: "50%", y: "58%" },
        { id: "s5", x: "30%", y: "80%" },
        { id: "s6", x: "70%", y: "80%" },
      ],
    },
    "6_JOG_1-3-1": {
      label: "1-3-1",
      slots: [
        { id: "s1", x: "50%", y: "18%" },
        { id: "s2", x: "50%", y: "35%" },
        { id: "s3", x: "20%", y: "58%" },
        { id: "s4", x: "50%", y: "58%" },
        { id: "s5", x: "80%", y: "58%" },
        { id: "s6", x: "50%", y: "85%" },
      ],
    },
  },
};

function MatchPage({ matches, players, isAdmin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formA, setFormA] = useState("5_JOG_2-1-1");
  const [formB, setFormB] = useState("5_JOG_2-1-1");

  const match = matches.find((m) => String(m.id) === String(id));
  if (!match) return null;

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

  const handleEscalar = async (teamKey, slotId, pId) => {
    const field =
      teamKey === "A" ? `tacticalA.${slotId}` : `tacticalB.${slotId}`;
    await updateDoc(doc(db, "matches", match.id), { [field]: pId });
  };

  const getActiveSlots = (formKey) =>
    (FORMATIONS_DATA.FUT5[formKey] || FORMATIONS_DATA.FUT6[formKey])?.slots ||
    [];

  const renderSlot = (slot, teamKey, teamPlayers) => {
    const occupantId =
      teamKey === "A" ? match.tacticalA?.[slot.id] : match.tacticalB?.[slot.id];
    const p = players.find(
      (player) => String(player.id) === String(occupantId),
    );

    // Lógica para capturar eventos do jogador nesta partida específica
    const playerEvents =
      match.events?.filter((e) => String(e.playerId) === String(occupantId)) ||
      [];

    // Contagem de Gols normais (Quando o time do evento é o mesmo do time da coluna)
    const goals = playerEvents.filter(
      (e) => e.type === "GOAL" && e.team === teamKey,
    ).length;

    // Contagem de Assistências
    const assists = playerEvents.filter((e) => e.type === "ASSIST").length;

    // Contagem de Gols Contra (Quando o tipo é OWN_GOAL ou quando é GOAL mas o time do evento é o oposto)
    const ownGoals = playerEvents.filter(
      (e) => e.type === "OWN_GOAL" || (e.type === "GOAL" && e.team !== teamKey),
    ).length;

    return (
      <div
        key={slot.id}
        className="tactical-slot"
        style={{ left: slot.x, top: slot.y }}
      >
        {p ? (
          <div className="player-tactical">
            {/* CONTAINER DE EMOJIS/BADGES */}
            <div className="player-badges">
              {/* LUVA: Verifica a posição salva no cadastro do jogador */}
              {(p.position === "Goleiro" || p.posicao === "Goleiro") && (
                <span className="badge glove">🧤</span>
              )}

              {/* GOLS */}
              {goals > 0 && (
                <span className="badge-item">⚽{goals > 1 ? goals : ""}</span>
              )}

              {/* ASSISTÊNCIAS */}
              {assists > 0 && (
                <span className="badge-item">
                  👟{assists > 1 ? assists : ""}
                </span>
              )}

              {/* GOL CONTRA (GC) */}
              {ownGoals > 0 && (
                <span className="badge-item GC">
                  {ownGoals > 1 ? ownGoals : ""} GC
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
            {teamPlayers.map((pId) => (
              <option key={pId} value={pId}>
                {players.find((pl) => String(pl.id) === String(pId))?.name}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  return (
    <div className="match-view-wrapper">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ❮ VOLTAR
      </button>

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
        {match.penaltiesWinner && (
          <div className="penalties-pill">
            🏆 VENCEDOR PÊNALTIS:{" "}
            {match.penaltiesWinner === "A"
              ? match.teamA.name
              : match.teamB.name}
          </div>
        )}
      </div>

      <div className="dual-fields-layout">
        {[
          {
            k: "A",
            f: formA,
            sf: setFormA,
            n: match.teamA.name,
            p: match.teamA.players,
          },
          {
            k: "B",
            f: formB,
            sf: setFormB,
            n: match.teamB.name,
            p: match.teamB.players,
          },
        ].map((t) => (
          <div key={t.k} className="field-section">
            <h3 className="field-team-title">{t.n}</h3>
            {isAdmin && (
              <div className="formation-controls">
                <div className="formation-group">
                  <span className="group-label">F5:</span>
                  {Object.keys(FORMATIONS_DATA.FUT5).map((k) => (
                    <button
                      key={k}
                      className={t.f === k ? "active" : ""}
                      onClick={() => t.sf(k)}
                    >
                      {FORMATIONS_DATA.FUT5[k].label}
                    </button>
                  ))}
                </div>
                <div className="formation-group">
                  <span className="group-label">F6:</span>
                  {Object.keys(FORMATIONS_DATA.FUT6).map((k) => (
                    <button
                      key={k}
                      className={t.f === k ? "active" : ""}
                      onClick={() => t.sf(k)}
                    >
                      {FORMATIONS_DATA.FUT6[k].label}
                    </button>
                  ))}
                </div>
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default MatchPage;
