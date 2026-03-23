import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import "../styles/matchpage.css";
import { calculateMatchStats } from "../components/matchpages/matchUtils";
import { exportMatchImage } from "../components/matchpages/screenshotHelper";
import MatchStats from "../components/matchpages/MatchStats";
import MatchTimeline from "../components/matchpages/MatchTimeline";

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
    "5_JOG_1-3-1": {
      label: "1-3-1",
      slots: [
        { id: "s1", x: "50%", y: "18%" },
        { id: "s2", x: "20%", y: "45%" },
        { id: "s3", x: "50%", y: "45%" },
        { id: "s4", x: "80%", y: "45%" },
        { id: "s5", x: "50%", y: "85%" },
      ],
    },
    "5_JOG_2-0-2": {
      label: "2-0-2",
      slots: [
        { id: "s1", x: "50%", y: "18%" },
        { id: "s2", x: "30%", y: "40%" },
        { id: "s3", x: "70%", y: "40%" },
        { id: "s4", x: "30%", y: "80%" },
        { id: "s5", x: "70%", y: "80%" },
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
    "6_JOG_3-2-1": {
      label: "3-2-1",
      slots: [
        { id: "s1", x: "50%", y: "15%" },
        { id: "s2", x: "20%", y: "35%" },
        { id: "s3", x: "50%", y: "35%" },
        { id: "s4", x: "80%", y: "35%" },
        { id: "s5", x: "35%", y: "65%" },
        { id: "s6", x: "65%", y: "65%" },
      ],
    },
    "6_JOG_2-3-1": {
      label: "2-3-1",
      slots: [
        { id: "s1", x: "50%", y: "15%" },
        { id: "s2", x: "30%", y: "35%" },
        { id: "s3", x: "70%", y: "35%" },
        { id: "s4", x: "20%", y: "60%" },
        { id: "s5", x: "50%", y: "60%" },
        { id: "s6", x: "80%", y: "60%" },
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

  const match = matches.find((m) => String(m.id) === String(id));

  // 1. Inicializamos o estado DIRETAMENTE com o valor do match, se existir.
  // 2. Usamos o ID no useState para "resetar" o estado caso o usuário mude de partida sem recarregar a página.
  const [formA, setFormA] = useState(match?.formationA || "5_JOG_2-1-1");
  const [formB, setFormB] = useState(match?.formationB || "5_JOG_2-1-1");

  // Ajuste técnico: Se o componente não desmontar ao trocar de ID (navegação interna),
  // verificamos se os estados batem com o match atual durante o render (padrão recomendado pelo React)
  const [prevId, setPrevId] = useState(id);

  if (id !== prevId) {
    setPrevId(id);
    setFormA(match?.formationA || "5_JOG_2-1-1");
    setFormB(match?.formationB || "5_JOG_2-1-1");
  }

  if (!match) return <div className="loading">Partida não encontrada...</div>;

  // Lógica de Placar
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

  // Funções de atualização do banco
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
      if (teamKey === "A") {
        setFormA(formationKey);
        await updateDoc(doc(db, "matches", match.id), {
          formationA: formationKey,
        });
      } else {
        setFormB(formationKey);
        await updateDoc(doc(db, "matches", match.id), {
          formationB: formationKey,
        });
      }
    } catch (err) {
      console.error("Erro ao salvar formação:", err);
    }
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
    const isMVP = mvp && p && String(p.id) === String(mvp.id);

    // Eventos do Jogador no Slot
    const playerEvents =
      match.events?.filter((e) => String(e.playerId) === String(occupantId)) ||
      [];
    const goals = playerEvents.filter(
      (e) => e.type === "GOAL" && e.team === teamKey,
    ).length;
    const assists =
      match.events?.filter(
        (e) =>
          (e.type === "ASSIST" && String(e.playerId) === String(occupantId)) ||
          (e.type === "GOAL" && String(e.assistId) === String(occupantId)),
      ).length || 0;
    const ownGoals = playerEvents.filter((e) => e.type === "OWN_GOAL").length;

    return (
      <div
        key={slot.id}
        className="tactical-slot"
        style={{ left: slot.x, top: slot.y }}
      >
        {p ? (
          <div className={`player-tactical ${isMVP ? "is-mvp" : ""}`}>
            <div className="player-badges">
              {goals > 0 && (
                <span className="badge-item">⚽{goals > 1 ? goals : ""}</span>
              )}
              {assists > 0 && (
                <span className="badge-item">
                  👟{assists > 1 ? assists : ""}
                </span>
              )}
              {ownGoals > 0 && <span className="badge-item GC">GC</span>}
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

          <div className="sb-score-box-wrapper">
            {" "}
            {/* Wrapper para agrupar placar + penaltis */}
            <div className="sb-score-box">
              {/* Pênaltis Time A (Fica à esquerda do gol A) */}
              {(match.penaltiesScoreA !== undefined ||
                match.penaltiesScoreB !== undefined) && (
                <span className="penalties-mini-score">
                  ({match.penaltiesScoreA || 0})
                </span>
              )}

              <span className="score">{scoreA}</span>
              <span className="vs-badge">VS</span>
              <span className="score">{scoreB}</span>

              {/* Pênaltis Time B (Fica à direita do gol B) */}
              {(match.penaltiesScoreA !== undefined ||
                match.penaltiesScoreB !== undefined) && (
                <span className="penalties-mini-score">
                  ({match.penaltiesScoreB || 0})
                </span>
              )}
            </div>
          </div>

          <div className="sb-team-name team-right">{match.teamB.name}</div>
        </div>
      </div>
      <MatchTimeline events={match.events} players={players} />

      <div className="dual-fields-layout">
        {[
          { k: "A", f: formA, n: match.teamA.name, p: match.teamA.players },
          { k: "B", f: formB, n: match.teamB.name, p: match.teamB.players },
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
                      onClick={() => handleSetFormation(t.k, k)}
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
                      onClick={() => handleSetFormation(t.k, k)}
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

      <MatchStats
        teamStats={stats}
        teamAName={match.teamA.name}
        teamBName={match.teamB.name}
      />
    </div>
  );
}

export default MatchPage;
