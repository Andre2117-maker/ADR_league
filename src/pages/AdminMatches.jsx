import React, { useState, useMemo, useEffect } from "react";
import { db } from "../firebase";

import {
  updateDoc,
  doc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";

import { useNavigate, useLocation } from "react-router-dom";

import MatchPreview from "../components/adminmatches/MatchPreview";
import PlayerRow from "../components/adminmatches/PlayerRow";
import AssistModal from "../components/adminmatches/AssistModal";
import SubModal from "../components/adminmatches/SubModal";
import PenaltiesSection from "../components/adminmatches/PenaltiesSection";
import AdminHeader from "../components/adminmatches/AdminHeader";
import PresetTools from "../components/adminmatches/PresetTools";
import ExternalTeamTools from "../components/adminmatches/ExternalTeamTools";

import { saveTeamPreset, loadTeamPresets } from "../data/teamPresets";

import "../styles/adminmatches/adminmatches.css";

function AdminMatches({ players, isAdmin, matchToEdit, setMatchToEdit }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [loadingLastTeams, setLoadingLastTeams] = useState(false);
  const [matchType, setMatchType] = useState(matchToEdit?.type || "TREINO");
  const [showAssistModal, setShowAssistModal] = useState(null);
  const [showSubModal, setShowSubModal] = useState(null);
  const [teamPresets, setTeamPresets] = useState([]);
  const [extScorerName, setExtScorerName] = useState("");
  const [extAssistName, setExtAssistName] = useState("");

  const initialDate = useMemo(() => {
    if (matchToEdit?.date) return matchToEdit.date;

    if (location.state?.initialDate) {
      return location.state.initialDate;
    }

    return new Date().toISOString().split("T")[0];
  }, [matchToEdit, location.state]);

  const [draft, setDraft] = useState(() => {
    if (matchToEdit) return matchToEdit;

    return {
      date: initialDate,
      venue: "",

      teamA: {
        name: "ADR",
        players: [],
        goalkeeperId: null,
        captainId: null,
        logo: "",
      },

      teamB: {
        name: "ADR",
        players: [],
        goalkeeperId: null,
        externalGoalkeeperName: "",
        captainId: null,
        logo: "",
      },

      events: [],

      penaltiesWinner: null,

      penaltiesScoreA: "",
      penaltiesScoreB: "",

      penalties: {
        A: [],
        B: [],
      },
    };
  });

  useEffect(() => {
    if (!matchToEdit && location.state?.initialDate) {
      setDraft((prev) => ({
        ...prev,
        date: location.state.initialDate,
      }));
    }
  }, [location.state, matchToEdit]);

  useEffect(() => {
    const fetchPresets = async () => {
      const presets = await loadTeamPresets(draft.date);

      setTeamPresets(presets);
    };

    fetchPresets();
  }, [draft.date]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  const goalsA = draft.events.filter(
    (e) =>
      (e.team === "A" && e.type === "GOAL") ||
      (e.team === "B" && e.type === "OWN_GOAL"),
  ).length;

  const goalsB = draft.events.filter(
    (e) =>
      (e.team === "B" && e.type === "GOAL") ||
      (e.team === "A" && e.type === "OWN_GOAL"),
  ).length;

  const isDraw = goalsA === goalsB;

  const addPenalty = (team, result) => {
    setDraft((prev) => ({
      ...prev,

      penalties: {
        ...prev.penalties,

        [team]: [...(prev.penalties?.[team] || []), result],
      },
    }));
  };

  const removePenalty = (team, index) => {
    setDraft((prev) => {
      const newList = [...(prev.penalties?.[team] || [])];

      newList.splice(index, 1);

      return {
        ...prev,

        penalties: {
          ...prev.penalties,

          [team]: newList,
        },
      };
    });
  };

  const addEvent = (
    team,
    playerId,
    type,
    assistId = null,
    externalName = null,
    reason = "",
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
          reason,
          matchType,
        },
      ],
    }));

    setShowAssistModal(null);
  };

  const addSubEvent = (team, playerOutId, playerInId, reason) => {
    setDraft((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          id: crypto.randomUUID(),
          team,
          type: "SUB",
          playerOutId,
          playerInId,
          reason,
          matchType,
        },
      ],
    }));
    setShowSubModal(null); // Fecha o modal após adicionar
  };

  const handleImageUpload = (e, teamKey) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setDraft((prev) => ({
        ...prev,

        [teamKey]: {
          ...prev[teamKey],
          logo: reader.result,
        },
      }));
    };

    reader.readAsDataURL(file);
  };

  const applyPreset = (teamKey, presetId) => {
    const preset = teamPresets.find((p) => p.id === presetId);

    if (!preset) return;

    setDraft((prev) => ({
      ...prev,

      [teamKey]: {
        ...prev[teamKey],

        name: preset.name,
        players: preset.players || [],
        goalkeeperId: preset.goalkeeperId || null,
        captainId: preset.captainId || null,
        logo: preset.logo || "",
      },
    }));
  };

  const handleSavePreset = async (teamKey) => {
    try {
      const team = draft[teamKey];

      if (!team.players.length) {
        return alert("Selecione jogadores primeiro.");
      }

      const presetName = prompt("Nome do preset:");

      if (!presetName) return;

      await saveTeamPreset(team, draft.date, presetName);

      const updatedPresets = await loadTeamPresets(draft.date);

      setTeamPresets(updatedPresets);

      alert("Preset salvo!");
    } catch (err) {
      console.error(err);

      alert("Erro ao salvar preset.");
    }
  };

  const loadLastTrainingTeams = async () => {
    try {
      setLoadingLastTeams(true);

      const matchesRef = collection(db, "matches");

      const q = query(matchesRef, orderBy("order", "desc"), limit(10));

      const snap = await getDocs(q);

      const matches = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const lastTraining = matches.find((m) => m.type === "TREINO");

      if (!lastTraining) {
        alert("Nenhum treino encontrado.");
        return;
      }

      setDraft((prev) => ({
        ...prev,

        venue: lastTraining.venue || "",

        teamA: {
          ...prev.teamA,

          players: lastTraining.teamA?.players || [],

          goalkeeperId: lastTraining.teamA?.goalkeeperId || null,

          captainId: lastTraining.teamA?.captainId || null,

          logo: lastTraining.teamA?.logo || "",

          name: lastTraining.teamA?.name || "ADR",
        },

        teamB: {
          ...prev.teamB,

          players: lastTraining.teamB?.players || [],

          goalkeeperId: lastTraining.teamB?.goalkeeperId || null,

          captainId: lastTraining.teamB?.captainId || null,

          logo: lastTraining.teamB?.logo || "",

          name: lastTraining.teamB?.name || "ADR",
        },

        events: [],
      }));

      alert("Últimos times carregados!");
    } catch (err) {
      console.error(err);

      alert("Erro ao carregar últimos times.");
    } finally {
      setLoadingLastTeams(false);
    }
  };

  const saveMatch = async () => {
    if (!draft.date || !draft.venue) {
      return alert("Preencha data e local.");
    }

    setLoading(true);

    try {
      const matchesRef = collection(db, "matches");

      const q = query(matchesRef, orderBy("order", "asc"));

      const snap = await getDocs(q);

      let allMatches = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let winner = null;

      if (goalsA > goalsB) {
        winner = "A";
      } else if (goalsB > goalsA) {
        winner = "B";
      } else {
        const pensA =
          draft.penalties?.A?.length > 0
            ? draft.penalties.A.filter((p) => p === "goal").length
            : Number(draft.penaltiesScoreA || 0);

        const pensB =
          draft.penalties?.B?.length > 0
            ? draft.penalties.B.filter((p) => p === "goal").length
            : Number(draft.penaltiesScoreB || 0);

        if (pensA > pensB) {
          winner = "A";
        } else if (pensB > pensA) {
          winner = "B";
        } else {
          return alert("Defina um vencedor nos pênaltis.");
        }
      }

      const currentMatchData = {
        ...draft,
        events: draft.events, // Isso garante que a ordem atualizada (pelo drag & drop) seja enviada
        goalsA,
        goalsB,
        winner,
        type: matchType,
        updatedAt: serverTimestamp(),
      };

      if (matchToEdit?.id) {
        await updateDoc(doc(db, "matches", matchToEdit.id), currentMatchData);
      } else {
        allMatches.push(currentMatchData);

        allMatches.sort((a, b) => {
          if (a.date !== b.date) {
            return new Date(a.date) - new Date(b.date);
          }

          return (a.order || 999) - (b.order || 999);
        });

        const newDoc = await addDoc(matchesRef, {
          ...currentMatchData,
          createdAt: serverTimestamp(),
        });

        const index = allMatches.findIndex((m) => m === currentMatchData);

        allMatches[index].id = newDoc.id;

        const updatePromises = allMatches.map((match, i) => {
          return updateDoc(doc(db, "matches", match.id), {
            order: i + 1,
          });
        });

        await Promise.all(updatePromises);
      }

      if (setMatchToEdit) {
        setMatchToEdit(null);
      }

      alert("Partida salva!");

      navigate("/");
    } catch (e) {
      console.error(e);

      alert("Erro ao salvar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-container">
        <h2>🚫 Acesso Negado</h2>
      </div>
    );
  }

  return (
    <div className="page-container2">
      <AdminHeader
        matchType={matchType}
        setMatchType={setMatchType}
        setDraft={setDraft}
        loadLastTrainingTeams={loadLastTrainingTeams}
        loadingLastTeams={loadingLastTeams}
      />

      <div className="admin-box-grid">
        <div className="field">
          <label>DATA</label>

          <input
            type="date"
            value={draft.date}
            onChange={(e) =>
              setDraft({
                ...draft,
                date: e.target.value,
              })
            }
          />
        </div>

        <div className="field">
          <label>LOCALIZAÇÃO</label>

          <input
            type="text"
            placeholder="Ex: Arena ADR"
            value={draft.venue}
            onChange={(e) =>
              setDraft({
                ...draft,
                venue: e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="match-teams-grid">
        {["A", "B"].map((t) => {
          const teamKey = t === "A" ? "teamA" : "teamB";

          const isExternal = matchType === "AMISTOSO" && t === "B";

          return (
            <div
              key={t}
              className={`team-card ${isExternal ? "opponent-card" : ""}`}
            >
              <div className="team-upload-header">
                <div
                  className="logo-box"
                  onClick={() => document.getElementById(`file-${t}`).click()}
                >
                  {draft[teamKey].logo ? (
                    <img src={draft[teamKey].logo} alt="logo" />
                  ) : (
                    <span>+ LOGO</span>
                  )}

                  <input
                    id={`file-${t}`}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleImageUpload(e, teamKey)}
                  />
                </div>

                <input
                  className="team-name-input"
                  placeholder="Nome do Time"
                  value={draft[teamKey].name}
                  disabled={!isExternal && matchType === "AMISTOSO"}
                  onChange={(e) =>
                    setDraft({
                      ...draft,

                      [teamKey]: {
                        ...draft[teamKey],

                        name: e.target.value,
                      },
                    })
                  }
                />

                <PresetTools
                  teamPresets={teamPresets}
                  applyPreset={applyPreset}
                  handleSavePreset={handleSavePreset}
                  teamKey={teamKey}
                />
              </div>

              {isExternal ? (
                <ExternalTeamTools
                  draft={draft}
                  teamKey={teamKey}
                  t={t}
                  extScorerName={extScorerName}
                  setExtScorerName={setExtScorerName}
                  extAssistName={extAssistName}
                  setExtAssistName={setExtAssistName}
                  addEvent={addEvent}
                  setDraft={setDraft}
                />
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

                          [teamKey]: {
                            ...draft[teamKey],

                            players: newList,
                          },
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
                        setDraft({
                          ...draft,

                          [teamKey]: {
                            ...draft[teamKey],

                            captainId:
                              draft[teamKey].captainId === p.id ? null : p.id,
                          },
                        })
                      }
                      onGoal={() =>
                        setShowAssistModal({
                          team: t,
                          playerId: p.id,
                        })
                      }
                      onOwnGoal={() => addEvent(t, p.id, "OWN_GOAL")}
                      onCard={(type, reason) =>
                        addEvent(t, p.id, type, null, null, reason)
                      }
                    />
                  ))}
                </div>
              )}
              {isExternal ? (
                <ExternalTeamTools
                // ... suas props
                />
              ) : (
                <>
                  <div className="players-scroll">
                    {/* ... seu map do PlayerRow ... */}
                  </div>

                  {/* --- NOVO BOTÃO DE SUBSTITUIÇÃO AQUI --- */}
                  <div style={{ marginTop: "10px", padding: "0 10px" }}>
                    <button
                      onClick={() => setShowSubModal(t)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        backgroundColor: "#333",
                        color: "#fff",
                        border: "1px solid #d4af37",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      🔄 Nova Substituição
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {showAssistModal && (
        <AssistModal
          showAssistModal={showAssistModal}
          sortedPlayers={sortedPlayers}
          draft={draft}
          addEvent={addEvent}
          setShowAssistModal={setShowAssistModal}
        />
      )}

      {showSubModal && (
        <SubModal
          team={showSubModal}
          sortedPlayers={sortedPlayers}
          // PASSA A LISTA DE JOGADORES DO TIME SELECIONADO:
          teamPlayers={draft[showSubModal === "A" ? "teamA" : "teamB"].players}
          addSubEvent={addSubEvent}
          close={() => setShowSubModal(null)}
        />
      )}

      <MatchPreview
        draft={draft}
        players={players}
        goalsA={goalsA}
        goalsB={goalsB}
        penaltiesScoreA={draft.penaltiesScoreA}
        penaltiesScoreB={draft.penaltiesScoreB}
        penaltiesWinner={isDraw ? draft.penaltiesWinner : null}
        // Mantém a sua função de remover:
        removeEvent={(id) =>
          setDraft((prev) => ({
            ...prev,
            events: prev.events.filter((e) => e.id !== id),
          }))
        }
        // NOVA FUNÇÃO: Atualiza a lista quando você arrasta os itens
        onReorder={(newEvents) => {
          setDraft((prev) => ({
            ...prev,
            events: newEvents,
          }));
        }}
        // NOVA FUNÇÃO: O que fazer quando clica em editar
        onEdit={(eventToEdit) => {
          if (eventToEdit.type === "SUB") {
            // Exemplo de edição simples para substituição
            const novoMotivo = prompt(
              "Novo motivo da substituição:",
              eventToEdit.reason,
            );
            if (novoMotivo !== null) {
              setDraft((prev) => ({
                ...prev,
                events: prev.events.map((e) =>
                  e.id === eventToEdit.id ? { ...e, reason: novoMotivo } : e,
                ),
              }));
            }
          } else {
            alert("Edite o evento: " + eventToEdit.type);
          }
        }}
      />

      {isDraw && (
        <PenaltiesSection
          draft={draft}
          addPenalty={addPenalty}
          removePenalty={removePenalty}
          setDraft={setDraft}
        />
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
