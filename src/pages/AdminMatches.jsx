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
  getDocs,
  limit,
} from "firebase/firestore";
import MatchPreview from "../components/adminmatches/MatchPreview";
import "../styles/adminmatches.css";
import { useNavigate, useLocation } from "react-router-dom";

/* ==========================================================================
   SUB-COMPONENTE: LINHA DO JOGADOR (ADR)
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
function AdminMatches({ players, isAdmin, matchToEdit, setMatchToEdit }) {
  const [loading, setLoading] = useState(false);
  const [matchType, setMatchType] = useState(matchToEdit?.type || "TREINO");
  const [showAssistModal, setShowAssistModal] = useState(null);
  const [loadingLastTeams, setLoadingLastTeams] = useState(false);
  const [extScorerName, setExtScorerName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const initialDate = useMemo(() => {
    if (matchToEdit?.date) return matchToEdit.date;
    if (location.state?.initialDate) return location.state.initialDate;
    return new Date().toISOString().split("T")[0];
  }, [matchToEdit, location.state]);

  const [draft, setDraft] = useState(() => {
    if (matchToEdit) return matchToEdit;
    return {
      date: initialDate, // Agora usa a data inteligente
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

  const loadLastTrainingTeams = async () => {
    try {
      setLoadingLastTeams(true);

      const matchesRef = collection(db, "matches");

      // pega as últimas partidas pela ordem
      const q = query(matchesRef, orderBy("order", "desc"), limit(10));

      const snap = await getDocs(q);

      const matches = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // acha o último treino interno
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

        // limpa eventos antigos
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

  React.useEffect(() => {
    if (!matchToEdit && location.state?.initialDate) {
      setDraft((prev) => ({ ...prev, date: location.state.initialDate }));
    }
  }, [location.state, matchToEdit]);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name)),
    [players],
  );

  const handleImageUpload = (e, teamKey) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraft((prev) => ({
          ...prev,
          [teamKey]: { ...prev[teamKey], logo: reader.result },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

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
          matchType: matchType,
        },
      ],
    }));
    setShowAssistModal(null);
  };

  const saveMatch = async () => {
    if (!draft.date || !draft.venue) return alert("Preencha data e local.");
    setLoading(true);
    try {
      const matchesRef = collection(db, "matches");

      // 1. Pega todas as partidas atuais ordenadas pela ordem que VOCÊ definiu
      const q = query(matchesRef, orderBy("order", "asc"));
      const snap = await getDocs(q);
      let allMatches = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const finalGoalsA = goalsA;
      const finalGoalsB = goalsB;

      let winner = null;

      if (goalsA > goalsB) {
        winner = "A";
      } else if (goalsB > goalsA) {
        winner = "B";
      } else {
        // empate -> decide nos pênaltis

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

        goalsA: finalGoalsA,
        goalsB: finalGoalsB,

        winner,

        type: matchType,
        updatedAt: serverTimestamp(),
      };

      if (matchToEdit?.id) {
        // Se for apenas edição de placar/jogadores, não mexe na ordem
        await updateDoc(doc(db, "matches", matchToEdit.id), currentMatchData);
      } else {
        // É UMA NOVA PARTIDA:
        // Inserimos ela no array e ordenamos com "memória"
        allMatches.push(currentMatchData);

        allMatches.sort((a, b) => {
          // Regra 1: Datas diferentes? Ordem cronológica pura.
          if (a.date !== b.date) {
            return new Date(a.date) - new Date(b.date);
          }
          // Regra 2: Mesma data? Mantém a ordem manual (order) que já existia.
          // Se um deles for o novo (não tem order), ele vai por último no dia.
          return (a.order || 999) - (b.order || 999);
        });

        // Salva a nova partida para ganhar um ID
        const newDoc = await addDoc(matchesRef, {
          ...currentMatchData,
          createdAt: serverTimestamp(),
        });

        // Atualiza o ID no nosso array local para salvar as ordens certas
        const index = allMatches.findIndex((m) => m === currentMatchData);
        allMatches[index].id = newDoc.id;

        // 2. Reatribui as ordens (1, 2, 3...) baseada na nova arrumação
        const updatePromises = allMatches.map((match, i) => {
          return updateDoc(doc(db, "matches", match.id), {
            order: i + 1,
          });
        });

        await Promise.all(updatePromises);
      }

      if (setMatchToEdit) setMatchToEdit(null);
      alert(
        "Partida salva! A cronologia foi ajustada respeitando sua organização.",
      );
      navigate("/");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin)
    return (
      <div className="page-container">
        <h2>🚫 Acesso Negado</h2>
      </div>
    );

  return (
    <div className="page-container2">
      <header className="admin-header-flex">
        <button
          className="load-last-teams-btn"
          onClick={loadLastTrainingTeams}
          disabled={loadingLastTeams}
        >
          {loadingLastTeams ? "CARREGANDO..." : "📋 USAR ÚLTIMOS TIMES"}
        </button>
        <select
          value={matchType}
          onChange={(e) => {
            const newType = e.target.value;
            setMatchType(newType);
            // Reseta o nome do time B se mudar para Treino
            if (newType === "TREINO") {
              setDraft((prev) => ({
                ...prev,
                teamB: { ...prev.teamB, name: "ADR" },
              }));
            }
          }}
        >
          <option value="TREINO">🏟️ TREINO INTERNO</option>
          <option value="AMISTOSO">🤝 AMISTOSO EXTERNO</option>
        </select>
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
            placeholder="Ex: Arena ADR"
            value={draft.venue}
            onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
          />
        </div>
      </div>

      <div className="match-teams-grid">
        {["A", "B"].map((t) => {
          const teamKey = t === "A" ? "teamA" : "teamB";

          // Lógica corrigida: No TREINO, ambos são ADR. No AMISTOSO, só o B é externo.
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
                  disabled={!isExternal && matchType === "AMISTOSO"} // Trava ADR no amistoso
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      [teamKey]: { ...draft[teamKey], name: e.target.value },
                    })
                  }
                />
              </div>

              {isExternal ? (
                /* INTERFACE PARA TIME ADVERSÁRIO (AMISTOSO) */
                <div className="external-tools">
                  {/* CAMPO DO GOLEIRO ADVERSÁRIO */}
                  <div className="external-field-group">
                    <label>🧤 GOLEIRO ADVERSÁRIO</label>
                    <input
                      placeholder="Nome do Goleiro"
                      value={draft[teamKey].externalGoalkeeperName || ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          [teamKey]: {
                            ...draft[teamKey],
                            externalGoalkeeperName: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <hr className="admin-divider" />

                  {/* ÁREA DE GOLS E GOLS CONTRA */}
                  <div className="external-goal-group">
                    <input
                      placeholder="Nome do Jogador"
                      value={extScorerName}
                      onChange={(e) => setExtScorerName(e.target.value)}
                    />
                    <div className="external-btns-row">
                      <button
                        className="btn-goal"
                        onClick={() => {
                          if (!extScorerName) return;
                          addEvent(t, "EXTERNO", "GOAL", null, extScorerName);
                          setExtScorerName("");
                        }}
                      >
                        ⚽ + Gol
                      </button>
                      <button
                        className="btn-og"
                        onClick={() => {
                          if (!extScorerName) return;
                          // Gol contra do Time B (Soma ponto para o ADR)
                          addEvent(
                            t,
                            "EXTERNO",
                            "OWN_GOAL",
                            null,
                            extScorerName,
                          );
                          setExtScorerName("");
                        }}
                      >
                        ❌ + GC
                      </button>
                    </div>
                  </div>

                  <div className="external-events-list">
                    {draft.events
                      .filter((e) => e.team === t)
                      .map((e) => (
                        <div
                          key={e.id}
                          className={`event-tag ${e.type === "OWN_GOAL" ? "og" : ""}`}
                        >
                          {e.externalName}{" "}
                          {e.type === "GOAL" ? "⚽" : "❌ (GC)"}
                          <span
                            className="remove-event"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                events: prev.events.filter(
                                  (ev) => ev.id !== e.id,
                                ),
                              }))
                            }
                          >
                            x
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                /* INTERFACE PADRÃO ADR (TREINO OU TIME A DO AMISTOSO) */
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

      {/* ==========================================================================
    SEÇÃO DE PÊNALTIS (SÓ APARECE EM CASO DE EMPATE)
    ========================================================================== */}
      {isDraw && (
        <div className="penalties-admin-section">
          <h3 className="section-title">🏆 PÊNALTIS</h3>

          {["A", "B"].map((team) => (
            <div key={team} className="penalty-team-block">
              <h4>{team === "A" ? draft.teamA.name : draft.teamB.name}</h4>

              <div className="penalty-buttons">
                <button onClick={() => addPenalty(team, "goal")}>✅</button>
                <button onClick={() => addPenalty(team, "miss")}>❌</button>
                <button onClick={() => addPenalty(team, "pending")}>⚪</button>
              </div>

              <div className="penalty-seq">
                {(draft.penalties?.[team] || []).map((p, i) => (
                  <span
                    key={i}
                    className={`penalty ${p}`}
                    onClick={() => removePenalty(team, i)}
                    title="Clique para remover"
                  >
                    {p === "goal" ? "⚽" : p === "miss" ? "✖" : "•"}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* 👇 AQUI ENTRA O LEGADO */}
          <div className="penalties-legacy">
            <input
              type="number"
              placeholder="0"
              value={draft.penaltiesScoreA}
              onChange={(e) =>
                setDraft({ ...draft, penaltiesScoreA: e.target.value })
              }
            />

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
