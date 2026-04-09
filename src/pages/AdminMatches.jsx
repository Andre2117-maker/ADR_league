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
} from "firebase/firestore";
import MatchPreview from "../components/adminmatches/MatchPreview";
import "../styles/adminmatches.css";
import { useNavigate } from "react-router-dom";

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
  const [extScorerName, setExtScorerName] = useState("");
  const navigate = useNavigate();

  const [draft, setDraft] = useState(() => {
    if (matchToEdit) return matchToEdit;
    return {
      date: new Date().toISOString().split("T")[0],
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
      // 1. Pegar TODAS as partidas do banco para reordenar
      const q = query(collection(db, "matches"), orderBy("date", "asc"));
      const snap = await getDocs(q);

      let allMatches = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 2. Criar o objeto da nova partida (ou atualizar a existente)
      const currentMatchData = {
        ...draft,
        goalsA,
        goalsB,
        type: matchType,
        updatedAt: serverTimestamp(),
      };

      if (matchToEdit?.id) {
        // Se for edição, removemos a versão antiga da lista para re-inserir na ordem certa
        allMatches = allMatches.filter((m) => m.id !== matchToEdit.id);
      }

      // 3. Adicionar a partida atual na lista local para ordenação
      allMatches.push(currentMatchData);

      // 4. Ordenar TODA a lista por data (e usar updatedAt como desempate)
      allMatches.sort((a, b) => new Date(a.date) - new Date(b.date));

      // 5. Salvar no Firebase
      if (matchToEdit?.id) {
        // Se for edição, atualiza os dados e depois as orders
        await updateDoc(doc(db, "matches", matchToEdit.id), currentMatchData);
      } else {
        // Se for nova, cria o documento e pega o ID gerado
        const newDoc = await addDoc(collection(db, "matches"), {
          ...currentMatchData,
          createdAt: serverTimestamp(),
        });
        currentMatchData.id = newDoc.id;
      }

      // 6. Loop de atualização de ordens (MUITO IMPORTANTE)
      // Isso garante que se você inseriu um jogo em 2025, ele ganhe order 1, 2, 3...
      const updatePromises = allMatches.map((match, index) => {
        const matchId = match.id;
        if (!matchId) return Promise.resolve(); // Pula se não tiver ID ainda

        return updateDoc(doc(db, "matches", matchId), {
          order: index + 1,
        });
      });

      await Promise.all(updatePromises);

      if (setMatchToEdit) setMatchToEdit(null);
      alert("Partidas reordenadas por data com sucesso!");
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
                  <div className="external-goal-group">
                    <input
                      placeholder="Nome do Jogador"
                      value={extScorerName}
                      onChange={(e) => setExtScorerName(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        if (!extScorerName) return;
                        addEvent(t, "EXTERNO", "GOAL", null, extScorerName);
                        setExtScorerName("");
                      }}
                    >
                      ⚽ + Gol
                    </button>
                  </div>
                  <div className="external-events-list">
                    {draft.events
                      .filter((e) => e.team === t)
                      .map((e) => (
                        <div key={e.id} className="event-tag">
                          {e.externalName} ⚽{" "}
                          <span
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
