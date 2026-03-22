import React, { useState, useMemo } from "react";
import { db } from "../firebase";
import {
  updateDoc,
  doc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import MatchPreview from "../components/adminmatches/MatchPreview";
import "../styles/adminmatches.css";
import { query, orderBy, limit, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

/* ==========================================================================
   SUB-COMPONENTE: LINHA DO JOGADOR
   ========================================================================== */
const PlayerRow = ({
  player,
  isSelected,
  isGK,
  onToggle,
  onSetGK,
  onGoal,
  onOwnGoal,
  onCard,
}) => (
  <div className={`player-row ${isSelected ? "active" : ""}`}>
    <div className="p-clickable-area" onClick={onToggle}>
      <input type="checkbox" checked={isSelected} readOnly />
      <span className="p-name">
        {player.name} {isGK && "🧤"}
      </span>
    </div>

    {isSelected && (
      <div className="actions">
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
          title="Marcar Gol"
          className="btn-goal"
          onClick={(e) => {
            e.stopPropagation();
            onGoal();
          }}
        >
          ⚽
        </button>
        <button
          title="Gol Contra"
          className="btn-og"
          onClick={(e) => {
            e.stopPropagation();
            onOwnGoal();
          }}
        >
          GC
        </button>
        <button
          title="Cartão Amarelo"
          className="btn-card yellow"
          onClick={(e) => {
            e.stopPropagation();
            onCard("YELLOW");
          }}
        >
          🟨
        </button>
        <button
          title="Cartão Vermelho"
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
  const [extScorerName, setExtScorerName] = useState(""); // <-- NOVO ESTADO AQUI
  const navigate = useNavigate();

  const [draft, setDraft] = useState(() => {
    if (matchToEdit) return matchToEdit;
    return {
      date: new Date().toISOString().split("T")[0],
      venue: "",
      teamA: { name: "", players: [], goalkeeperId: null, logo: "" },
      teamB: { name: "", players: [], goalkeeperId: null, logo: "" },
      events: [],
      penaltiesWinner: null,
      penaltiesScoreA: "", // <-- NOVO
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
        {/* 3. Troque setPage por navigate */}
        <button onClick={() => navigate("/")} className="back-btn">
          Voltar
        </button>
      </div>
    );
  }

  // Cálculos de Gols (Lógica corrigida: GC soma para o adversário)
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

  // --- FUNÇÕES DE MANIPULAÇÃO ---

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
        }, // Salva o nome aqui
      ],
    }));
    setShowAssistModal(null);
  };

  const handleGoalClick = (team, playerId, externalName = null) => {
    if (playerId === "OPONENTE_EXTERNO") {
      addEvent(team, playerId, "GOAL", null, externalName);
    } else {
      setShowAssistModal({ team, playerId });
    }
  };

  const handleRepeatSquad = () => {
    if (!matches || matches.length === 0) {
      return alert("Nenhuma partida anterior encontrada para repetir.");
    }

    // Pega a última partida (baseado na propriedade 'order' ou a última do array)
    const lastMatch = [...matches].sort((a, b) => b.order - a.order)[0];

    setDraft((prev) => ({
      ...prev,
      // Mantém data e local atuais do formulário, mas puxa os times da última partida
      teamA: {
        name: lastMatch.teamA.name,
        players: lastMatch.teamA.players,
        goalkeeperId: lastMatch.teamA.goalkeeperId,
        logo: lastMatch.teamA.logo || "",
      },
      teamB: {
        name: lastMatch.teamB.name,
        players: lastMatch.teamB.players,
        goalkeeperId: lastMatch.teamB.goalkeeperId,
        logo: lastMatch.teamB.logo || "",
      },
      events: [], // Sempre começa com 0 gols
      penaltiesWinner: null,
    }));

    alert(
      `Escalação de "${lastMatch.teamA.name} vs ${lastMatch.teamB.name}" carregada!`,
    );
  };

  const getNextOrder = async () => {
    try {
      const q = query(
        collection(db, "matches"),
        orderBy("order", "desc"),
        limit(1),
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const lastMatch = querySnapshot.docs[0].data();
        return (Number(lastMatch.order) || 0) + 1;
      }
      return 1; // Se for a primeira partida do banco
    } catch (error) {
      console.error("Erro ao buscar ordem:", error);
      return 1;
    }
  };

  // 1. Certifique-se de ter isso no topo do seu componente:
  // import { useNavigate } from "react-router-dom";
  // const navigate = useNavigate();

  const saveMatch = async () => {
    if (!draft.date || !draft.venue) {
      return alert("Preencha data e localização.");
    }

    if (isDraw) {
      if (draft.penaltiesScoreA === "" || draft.penaltiesScoreB === "") {
        return alert("Preencha o placar dos pênaltis.");
      }
      if (Number(draft.penaltiesScoreA) === Number(draft.penaltiesScoreB)) {
        return alert("O placar dos pênaltis não pode ser empate.");
      }
    }

    setLoading(true);
    try {
      const pWinner =
        Number(draft.penaltiesScoreA) > Number(draft.penaltiesScoreB)
          ? "A"
          : "B";

      const finalOrder = matchToEdit?.order
        ? matchToEdit.order
        : await getNextOrder();

      const finalData = {
        date: draft.date,
        venue: draft.venue,
        events: draft.events,
        teamA: { ...draft.teamA, goalkeeperGoalsAgainst: Number(goalsB) },
        teamB: { ...draft.teamB, goalkeeperGoalsAgainst: Number(goalsA) },
        goalsA: Number(goalsA),
        goalsB: Number(goalsB),
        type: matchType,
        penaltiesScoreA: isDraw ? Number(draft.penaltiesScoreA) : null,
        penaltiesScoreB: isDraw ? Number(draft.penaltiesScoreB) : null,
        penaltiesWinner: isDraw ? pWinner : null,
        updatedAt: serverTimestamp(),
        order: finalOrder,
      };

      if (matchToEdit?.id) {
        await updateDoc(doc(db, "matches", matchToEdit.id), finalData);
      } else {
        await addDoc(collection(db, "matches"), {
          ...finalData,
          createdAt: serverTimestamp(),
        });
      }

      alert(`Partida #${finalOrder} salva com sucesso!`);

      // Limpa o estado de edição
      if (typeof setMatchToEdit === "function") {
        setMatchToEdit(null);
      }

      // --- CORREÇÃO AQUI ---
      // Em vez de setPage, usamos o navigate para voltar à home/calendário
      navigate("/");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-container2"
      style={{ paddingTop: "100px", paddingBottom: "80px" }}
    >
      <header className="admin-header-flex">
        <div className="match-type-selector">
          <select
            value={matchType}
            onChange={(e) => setMatchType(e.target.value)}
          >
            <option value="TREINO">🏟️ TREINO INTERNO</option>
            <option value="AMISTOSO">🤝 AMISTOSO EXTERNO</option>
          </select>
        </div>
      </header>

      {/* BOX CONFIGURAÇÃO */}
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
            placeholder="Arena ADR..."
            value={draft.venue}
            onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
          />
        </div>
        <div className="field">
          <label>AÇÕES RÁPIDAS</label>
          <button className="btn-repeat" onClick={handleRepeatSquad}>
            🔄 Limpar Placar (Manter Time)
          </button>
        </div>
      </div>

      <div className="match-teams-grid">
        {["A", "B"].map((t) => (
          <div key={t} className="team-card">
            <input
              className="team-name-input"
              placeholder="ADR"
              value={t === "A" ? draft.teamA.name : draft.teamB.name}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  [t === "A" ? "teamA" : "teamB"]: {
                    ...draft[t === "A" ? "teamA" : "teamB"],
                    name: e.target.value,
                  },
                })
              }
            />

            {matchType === "AMISTOSO" && t === "B" ? (
              <div className="external-tools">
                <div className="external-field">
                  <label>Logo do Adversário (Pasta /png)</label>
                  <div className="logo-input-group">
                    {draft.teamB.logo && (
                      <img
                        src={draft.teamB.logo}
                        alt="Logo"
                        className="ext-logo-preview"
                      />
                    )}
                    <input
                      type="text"
                      placeholder="Ex: /png/adversario.png"
                      value={draft.teamB.logo}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          teamB: { ...draft.teamB, logo: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="external-field" style={{ marginTop: "20px" }}>
                  <label>Registrar Gol do Adversário</label>
                  <div className="external-goal-group">
                    <input
                      type="text"
                      placeholder="Nome do Jogador"
                      value={extScorerName}
                      onChange={(e) => setExtScorerName(e.target.value)}
                    />
                    <button
                      className="btn-external-goal"
                      onClick={() => {
                        handleGoalClick(
                          "B",
                          "OPONENTE_EXTERNO",
                          extScorerName || "Desconhecido",
                        );
                        setExtScorerName(""); // Limpa o campo após o gol
                      }}
                    >
                      ⚽ Gol
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="players-scroll">
                {sortedPlayers.map((p) => (
                  <PlayerRow
                    key={p.id}
                    player={p}
                    isSelected={draft[
                      t === "A" ? "teamA" : "teamB"
                    ].players.includes(p.id)}
                    isGK={
                      draft[t === "A" ? "teamA" : "teamB"].goalkeeperId === p.id
                    }
                    onToggle={() => {
                      const key = t === "A" ? "teamA" : "teamB";
                      const isRemoving = draft[key].players.includes(p.id);
                      setDraft({
                        ...draft,
                        [key]: {
                          ...draft[key],
                          players: isRemoving
                            ? draft[key].players.filter((id) => id !== p.id)
                            : [...draft[key].players, p.id],
                        },
                        events: isRemoving
                          ? draft.events.filter((e) => e.playerId !== p.id)
                          : draft.events,
                      });
                    }}
                    onSetGK={() =>
                      setDraft({
                        ...draft,
                        [t === "A" ? "teamA" : "teamB"]: {
                          ...draft[t === "A" ? "teamA" : "teamB"],
                          goalkeeperId: p.id,
                        },
                      })
                    }
                    onGoal={() => handleGoalClick(t, p.id)}
                    onOwnGoal={() => addEvent(t, p.id, "OWN_GOAL")}
                    onCard={(type) => addEvent(t, p.id, type)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL DE ASSISTÊNCIA */}
      {showAssistModal && (
        <div className="assist-modal-overlay">
          <div className="assist-modal">
            <h3>
              ASSISTÊNCIA PARA:{" "}
              {
                sortedPlayers.find((p) => p.id === showAssistModal.playerId)
                  ?.name
              }
            </h3>
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
                ❌ Sem Assistência
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
              Cancelar
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
          <p>🏆 PLACAR DOS PÊNALTIS</p>
          <div className="p-score-input-wrapper">
            <div className="p-input-side">
              <label>{draft.teamA.name || "Time A"}</label>
              <input
                type="number"
                value={draft.penaltiesScoreA}
                onChange={(e) =>
                  setDraft({ ...draft, penaltiesScoreA: e.target.value })
                }
              />
            </div>

            <div className="p-vs-circle">X</div>

            <div className="p-input-side">
              <label>{draft.teamB.name || "Time B"}</label>
              <input
                type="number"
                value={draft.penaltiesScoreB}
                onChange={(e) =>
                  setDraft({ ...draft, penaltiesScoreB: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={saveMatch}
        disabled={loading}
        className="confirm-btn-final"
      >
        {loading ? "SALVANDO..." : "CONCLUIR E SALVAR PARTIDA"}
      </button>
    </div>
  );
}

export default AdminMatches;
