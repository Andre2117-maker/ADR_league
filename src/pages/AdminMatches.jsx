import React, { useState, useMemo } from "react";
import { db } from "../firebase";
import {
  updateDoc,
  doc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import MatchPreview from "../components/adminmatches/MatchPreview";
import "../styles/adminmatches.css";
import { useNavigate } from "react-router-dom";

/* ==========================================================================
   SUB-COMPONENTE: LINHA DO JOGADOR
   ========================================================================== */
const PlayerRow = ({
  player,
  isSelected,
  isGK,
  isCaptain,
  onToggle,
  onSetGK,
  onSetCaptain,
  onGoal,
  onOwnGoal,
  onCard,
}) => (
  <div className={`player-row ${isSelected ? "active" : ""}`}>
    <div className="p-clickable-area" onClick={onToggle}>
      <input type="checkbox" checked={isSelected} readOnly />
      <span className="p-name">
        {player.name} {isGK && "🧤"} {isCaptain && "Ⓒ"}
      </span>
    </div>

    {isSelected && (
      <div className="actions">
        <button
          title="Capitão"
          className={`btn-captain ${isCaptain ? "is-captain-active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onSetCaptain();
          }}
        >
          Ⓒ
        </button>

        <button
          title="Goleiro"
          className={`btn-gk ${isGK ? "is-gk" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onSetGK();
          }}
        >
          GK
        </button>

        <button
          title="Gol"
          className="btn-goal"
          onClick={(e) => {
            e.stopPropagation();
            onGoal();
          }}
        >
          ⚽
        </button>
        <button
          title="GC"
          className="btn-og"
          onClick={(e) => {
            e.stopPropagation();
            onOwnGoal();
          }}
        >
          GC
        </button>
        <button
          title="Amarelo"
          className="btn-card yellow"
          onClick={(e) => {
            e.stopPropagation();
            onCard("YELLOW");
          }}
        >
          🟨
        </button>
        <button
          title="Vermelho"
          className="btn-card red"
          onClick={(e) => {
            e.stopPropagation();
            onCard("RED");
          }}
        >
          🟥
        </button>
      </div>
    )}
  </div>
);

/* ==========================================================================
   COMPONENTE PRINCIPAL
   ========================================================================== */
function AdminMatches({
  players,
  isAdmin,
  matchToEdit,
  setMatchToEdit,
  matches,
}) {
  const [loading, setLoading] = useState(false);
  const [matchType, setMatchType] = useState(matchToEdit?.type || "TREINO");
  const [showAssistModal, setShowAssistModal] = useState(null);
  const [extScorerName, setExtScorerName] = useState("");
  const navigate = useNavigate();

  const [draft, setDraft] = useState(() => {
    if (matchToEdit) return matchToEdit;
    return {
      date: new Date().toISOString().split("T")[0],
      venue: "",
      teamA: {
        name: "",
        players: [],
        goalkeeperId: null,
        captainId: null,
        logo: "",
      },
      teamB: {
        name: "",
        players: [],
        goalkeeperId: null,
        captainId: null,
        logo: "",
      },
      events: [],
      penaltiesWinner: null,
      penaltiesScoreA: "",
      penaltiesScoreB: "",
    };
  });

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name)),
    [players],
  );

  if (!isAdmin) {
    return (
      <div
        className="page-container"
        style={{ textAlign: "center", paddingTop: "120px" }}
      >
        <h2 style={{ color: "red" }}>🚫 Acesso Negado</h2>
        <button onClick={() => navigate("/")} className="back-btn">
          Voltar
        </button>
      </div>
    );
  }

  const goalsA = draft.events.filter(
    (e) =>
      (e.type === "GOAL" && e.team === "A") ||
      (e.type === "OWN_GOAL" && e.team === "B"),
  ).length;
  const goalsB = draft.events.filter(
    (e) =>
      (e.type === "GOAL" && e.team === "B") ||
      (e.type === "OWN_GOAL" && e.team === "A"),
  ).length;
  const isDraw = goalsA === goalsB;

  const addEvent = (
    team,
    playerId,
    type,
    assistId = null,
    externalName = null,
  ) => {
    setDraft((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          id: crypto.randomUUID(),
          team,
          playerId,
          type,
          assistId,
          externalName,
        },
      ],
    }));
    setShowAssistModal(null);
  };

  const handleRepeatSquad = () => {
    if (!matches || matches.length === 0)
      return alert("Sem partidas anteriores.");
    const last = [...matches].sort((a, b) => b.order - a.order)[0];
    setDraft((prev) => ({
      ...prev,
      teamA: {
        ...last.teamA,
        players: last.teamA.players,
        goalkeeperId: last.teamA.goalkeeperId,
        captainId: last.teamA.captainId,
      },
      teamB: {
        ...last.teamB,
        players: last.teamB.players,
        goalkeeperId: last.teamB.goalkeeperId,
        captainId: last.teamB.captainId,
      },
      events: [],
    }));
  };

  const saveMatch = async () => {
    if (!draft.date || !draft.venue) return alert("Preencha data e local.");
    setLoading(true);
    try {
      const q = query(
        collection(db, "matches"),
        orderBy("order", "desc"),
        limit(1),
      );
      const snap = await getDocs(q);
      const nextOrder =
        matchToEdit?.order ||
        (snap.empty ? 1 : (snap.docs[0].data().order || 0) + 1);

      const finalData = {
        ...draft,
        goalsA,
        goalsB,
        type: matchType,
        order: nextOrder,
        updatedAt: serverTimestamp(),
        penaltiesWinner: isDraw
          ? Number(draft.penaltiesScoreA) > Number(draft.penaltiesScoreB)
            ? "A"
            : "B"
          : null,
      };

      if (matchToEdit?.id) {
        await updateDoc(doc(db, "matches", matchToEdit.id), finalData);
      } else {
        await addDoc(collection(db, "matches"), {
          ...finalData,
          createdAt: serverTimestamp(),
        });
      }

      // LIMPA O ESTADO DE EDIÇÃO
      if (setMatchToEdit) setMatchToEdit(null);

      alert("Sucesso!");
      navigate("/");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (setMatchToEdit) setMatchToEdit(null);
    navigate("/");
  };

  return (
    <div className="page-container2">
      <header className="admin-header-flex">
        <select
          value={matchType}
          onChange={(e) => setMatchType(e.target.value)}
        >
          <option value="TREINO">🏟️ TREINO INTERNO</option>
          <option value="AMISTOSO">🤝 AMISTOSO EXTERNO</option>
        </select>
        {matchToEdit && (
          <button className="btn-cancel-edit" onClick={handleCancel}>
            ❌ CANCELAR EDIÇÃO
          </button>
        )}
      </header>

      <div className="admin-box-grid">
        <div className="field">
          <label>DATA</label>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </div>
        <div className="field">
          <label>LOCALIZAÇÃO</label>
          <input
            type="text"
            value={draft.venue}
            onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
          />
        </div>
        <div className="field">
          <label>AÇÕES</label>
          <button className="btn-repeat" onClick={handleRepeatSquad}>
            🔄 Repetir Escalação
          </button>
        </div>
      </div>

      <div className="match-teams-grid">
        {["A", "B"].map((t) => {
          const teamKey = t === "A" ? "teamA" : "teamB";
          const isExt = matchType === "AMISTOSO" && t === "B";
          return (
            <div key={t} className="team-card">
              <input
                className="team-name-input"
                placeholder="ADR"
                value={draft[teamKey].name}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    [teamKey]: { ...draft[teamKey], name: e.target.value },
                  })
                }
              />
              {isExt ? (
                <div className="external-tools">
                  <label>Logo URL</label>
                  <input
                    type="text"
                    value={draft.teamB.logo}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        teamB: { ...draft.teamB, logo: e.target.value },
                      })
                    }
                  />
                  <div className="external-goal-group">
                    <input
                      placeholder="Marcador"
                      value={extScorerName}
                      onChange={(e) => setExtScorerName(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        addEvent(
                          "B",
                          "OPONENTE_EXTERNO",
                          "GOAL",
                          null,
                          extScorerName,
                        );
                        setExtScorerName("");
                      }}
                    >
                      ⚽ Gol
                    </button>
                  </div>
                </div>
              ) : (
                <div className="players-scroll">
                  {sortedPlayers.map((p) => (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      isSelected={draft[teamKey].players.includes(p.id)}
                      isGK={draft[teamKey].goalkeeperId === p.id}
                      isCaptain={draft[teamKey].captainId === p.id}
                      onToggle={() => {
                        const list = draft[teamKey].players;
                        const newList = list.includes(p.id)
                          ? list.filter((id) => id !== p.id)
                          : [...list, p.id];
                        setDraft({
                          ...draft,
                          [teamKey]: { ...draft[teamKey], players: newList },
                        });
                      }}
                      onSetGK={() =>
                        setDraft({
                          ...draft,
                          [teamKey]: {
                            ...draft[teamKey],
                            goalkeeperId:
                              draft[teamKey].goalkeeperId === p.id
                                ? null
                                : p.id,
                          },
                        })
                      }
                      onSetCaptain={() =>
                        setDraft((prev) => ({
                          ...prev,
                          [teamKey]: {
                            ...prev[teamKey],
                            captainId:
                              prev[teamKey].captainId === p.id ? null : p.id,
                          },
                        }))
                      }
                      onGoal={() =>
                        setShowAssistModal({ team: t, playerId: p.id })
                      }
                      onOwnGoal={() => addEvent(t, p.id, "OWN_GOAL")}
                      onCard={(type) => addEvent(t, p.id, type)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAssistModal && (
        <div className="assist-modal-overlay">
          <div className="assist-modal">
            <h3>Assistência?</h3>
            <div className="assist-grid">
              <button
                className="btn-no-assist"
                onClick={() =>
                  addEvent(
                    showAssistModal.team,
                    showAssistModal.playerId,
                    "GOAL",
                  )
                }
              >
                ❌ Sem
              </button>
              {sortedPlayers
                .filter(
                  (p) =>
                    draft[
                      showAssistModal.team === "A" ? "teamA" : "teamB"
                    ].players.includes(p.id) &&
                    p.id !== showAssistModal.playerId,
                )
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      addEvent(
                        showAssistModal.team,
                        showAssistModal.playerId,
                        "GOAL",
                        p.id,
                      )
                    }
                  >
                    {p.name}
                  </button>
                ))}
            </div>
            <button
              className="btn-cancel"
              onClick={() => setShowAssistModal(null)}
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      <MatchPreview
        draft={draft}
        players={players}
        goalsA={goalsA}
        goalsB={goalsB}
        penaltiesWinner={isDraw ? draft.penaltiesWinner : null}
        removeEvent={(id) =>
          setDraft((prev) => ({
            ...prev,
            events: prev.events.filter((e) => e.id !== id),
          }))
        }
      />

      {isDraw && (
        <div className="penalty-selector">
          <p>🏆 PÊNALTIS</p>
          <div className="p-score-input-wrapper">
            <input
              type="number"
              placeholder="0"
              value={draft.penaltiesScoreA}
              onChange={(e) =>
                setDraft({ ...draft, penaltiesScoreA: e.target.value })
              }
            />
            <span>X</span>
            <input
              type="number"
              placeholder="0"
              value={draft.penaltiesScoreB}
              onChange={(e) =>
                setDraft({ ...draft, penaltiesScoreB: e.target.value })
              }
            />
          </div>
        </div>
      )}

      <button
        onClick={saveMatch}
        disabled={loading}
        className="confirm-btn-final"
      >
        {loading
          ? "SALVANDO..."
          : matchToEdit
            ? "ATUALIZAR PARTIDA"
            : "SALVAR NOVA PARTIDA"}
      </button>
    </div>
  );
}

export default AdminMatches;
