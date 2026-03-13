import { useState, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import "../styles/adminmatches.css";

/* ======================
   PREVIEW DA PARTIDA + LISTA DE EXCLUSÃO
====================== */
function MatchPreview({
  draft,
  players,
  goalsA,
  goalsB,
  penaltiesWinner,
  removeEvent,
}) {
  const playerName = (id) =>
    players.find((p) => p.id === id)?.name || "Jogador";

  return (
    <div className="match-preview">
      <div className="preview-score">
        <span className="team-name">{draft.teamA.name || "Time A"}</span>
        <span className="score-badge">
          {goalsA} x {goalsB}
        </span>
        <span className="team-name">{draft.teamB.name || "Time B"}</span>
      </div>

      {penaltiesWinner && (
        <div className="penalty-info">
          🏆 Venceu nos Pênaltis:{" "}
          {penaltiesWinner === "A" ? draft.teamA.name : draft.teamB.name}
        </div>
      )}

      {/* LISTA PARA REMOVER GOLS/EVENTOS ESPECÍFICOS */}
      <div className="events-manager-list">
        <h4
          style={{
            color: "#d4af37",
            fontSize: "11px",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          LINHA DO TEMPO (Clique no X para excluir)
        </h4>
        {draft.events.length === 0 && (
          <p style={{ fontSize: "10px", textAlign: "center", color: "#666" }}>
            Nenhum gol registrado
          </p>
        )}
        {draft.events.map((e) => (
          <div key={e.id} className="event-item-removable">
            <button
              className="delete-event-btn"
              onClick={() => removeEvent(e.id)}
            >
              ✕
            </button>

            <span
              className="event-icon"
              style={{ marginRight: "10px", fontSize: "16px" }}
            >
              {e.type === "GOAL" ? "⚽" : "⚠️ GC"}
            </span>

            <span className="event-details">
              <strong style={{ marginRight: "8px" }}>
                {playerName(e.playerId)}
              </strong>
              {e.assistId && (
                <span className="assist-text">
                  (Assist: {playerName(e.assistId)} 👟)
                </span>
              )}
              <span className="team-indicator">
                {e.team === "A"
                  ? `[${draft.teamA.name}]`
                  : `[${draft.teamB.name}]`}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================
   COMPONENTE PRINCIPAL
====================== */
function AdminMatches({
  players,
  setPage,
  isAdmin,
  matchToEdit,
  setMatchToEdit,
}) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(() => {
    if (matchToEdit) return matchToEdit;
    return {
      date: "",
      venue: "",
      teamA: { name: "", players: [], goalkeeperId: null },
      teamB: { name: "", players: [], goalkeeperId: null },
      events: [],
      penaltiesWinner: null,
    };
  });

  // O useMemo DEVE vir aqui, antes do check de isAdmin
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  // SÓ AGORA você pode fazer o check de segurança
  if (!isAdmin) {
    return (
      <div
        className="page-container"
        style={{ textAlign: "center", paddingTop: "120px" }}
      >
        <h2 style={{ color: "red" }}>🚫 Acesso Negado</h2>
        <button onClick={() => setPage("home")} className="back-btn">
          Voltar
        </button>
      </div>
    );
  }

  const goals = (team) =>
    draft.events.filter((e) => {
      if (e.type === "GOAL" && e.team === team) return true;
      if (e.type === "OWN_GOAL" && e.team !== team) return true;
      return false;
    }).length;

  const goalsA = goals("A");
  const goalsB = goals("B");
  const isDraw =
    goalsA === goalsB &&
    (draft.events.length > 0 || (matchToEdit && (goalsA > 0 || goalsB > 0)));

  const togglePlayer = (team, playerId) => {
    setDraft((prev) => {
      const key = team === "A" ? "teamA" : "teamB";
      const list = prev[key].players;
      const isRemoving = list.includes(playerId);
      return {
        ...prev,
        [key]: {
          ...prev[key],
          players: isRemoving
            ? list.filter((id) => id !== playerId)
            : [...list, playerId],
          goalkeeperId:
            isRemoving && prev[key].goalkeeperId === playerId
              ? null
              : prev[key].goalkeeperId,
        },
        // Se remover o jogador da escalação, remove os gols dele também
        events: isRemoving
          ? prev.events.filter(
              (e) => e.playerId !== playerId && e.assistId !== playerId,
            )
          : prev.events,
      };
    });
  };

  const addGoalWithAssist = (team, playerId) => {
    const teamData = team === "A" ? draft.teamA : draft.teamB;
    const teammates = players.filter(
      (p) => teamData.players.includes(p.id) && p.id !== playerId,
    );

    let msg = `Assistência para o gol de ${players.find((p) => p.id === playerId).name}:\n\n0 - Sem assistência\n`;
    teammates.forEach((p, i) => (msg += `${i + 1} - ${p.name}\n`));

    const choice = prompt(msg, "0");
    if (choice === null) return;

    const index = parseInt(choice) - 1;
    const assistId = teammates[index] ? teammates[index].id : null;

    setDraft((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        { id: crypto.randomUUID(), team, playerId, type: "GOAL", assistId },
      ],
    }));
  };

  const addOwnGoal = (team, playerId) => {
    setDraft((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        { id: crypto.randomUUID(), team, playerId, type: "OWN_GOAL" },
      ],
    }));
  };

  const removeEvent = (eventId) => {
    setDraft((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== eventId),
    }));
  };

  const saveMatch = async () => {
    if (!draft.date || !draft.teamA.name || !draft.teamB.name)
      return alert("Erro: Data e nomes dos times são obrigatórios.");
    if (isDraw && !draft.penaltiesWinner)
      return alert("Empate! Selecione o vencedor nos pênaltis.");
    if (!draft.teamA.goalkeeperId || !draft.teamB.goalkeeperId)
      return alert("Selecione os goleiros para as estatísticas.");

    setLoading(true);
    try {
      const finalData = {
        ...draft,
        updatedAt: serverTimestamp(),
        teamA: {
          ...draft.teamA,
          goalkeeperGoalsAgainst: goalsB,
          goalkeeperCleanSheet: goalsB === 0 ? 1 : 0,
        },
        teamB: {
          ...draft.teamB,
          goalkeeperGoalsAgainst: goalsA,
          goalkeeperCleanSheet: goalsA === 0 ? 1 : 0,
        },
      };

      if (matchToEdit?.id) {
        await updateDoc(doc(db, "matches", matchToEdit.id), finalData);
        alert("Partida atualizada!");
      } else {
        await addDoc(collection(db, "matches"), {
          ...finalData,
          createdAt: serverTimestamp(),
          order: Date.now(),
        });
        alert("Partida salva!");
      }
      setMatchToEdit(null);
      setPage("adminPanel");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar no Firebase.");
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
        <button
          onClick={() => {
            setMatchToEdit(null);
            setPage("adminPanel");
          }}
          className="btn-voltar-curto"
        >
          ← Voltar
        </button>
        <h1 className="page-title">
          {matchToEdit ? "Editar Partida" : "Cadastrar Partida"}
        </h1>
        <div style={{ width: "60px" }}></div>
      </header>

      {/* BOX DE CONFIGURAÇÃO BÁSICA */}
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
          <label>LOCAL</label>
          <input
            placeholder="Ex: Maracanã"
            value={draft.venue}
            onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
          />
        </div>
        <div className="field">
          <label>TIME A</label>
          <input
            placeholder="Ex: ADR"
            value={draft.teamA.name}
            onChange={(e) =>
              setDraft({
                ...draft,
                teamA: { ...draft.teamA, name: e.target.value },
              })
            }
          />
        </div>
        <div className="field">
          <label>TIME B</label>
          <input
            placeholder="Ex: IDR"
            value={draft.teamB.name}
            onChange={(e) =>
              setDraft({
                ...draft,
                teamB: { ...draft.teamB, name: e.target.value },
              })
            }
          />
        </div>
      </div>

      {/* ESCALAÇÃO E GOLS */}
      <div className="match-teams-grid">
        {["A", "B"].map((team) => (
          <div key={team} className="team-card">
            <h3>
              Escalar{" "}
              {team === "A"
                ? draft.teamA.name || "Time A"
                : draft.teamB.name || "Time B"}
            </h3>
            <div className="players-scroll">
              {sortedPlayers.map((p) => {
                const teamObj = team === "A" ? draft.teamA : draft.teamB;
                const isSelected = teamObj.players.includes(p.id);
                const isGK = teamObj.goalkeeperId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`player-row ${isSelected ? "active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePlayer(team, p.id)}
                    />
                    <span className="p-name">
                      {p.name} {isGK && "🧤"}
                    </span>
                    {isSelected && (
                      <div className="actions">
                        <button
                          className={`btn-gk ${isGK ? "is-gk" : ""}`}
                          onClick={() =>
                            setDraft({
                              ...draft,
                              [team === "A" ? "teamA" : "teamB"]: {
                                ...teamObj,
                                goalkeeperId: p.id,
                              },
                            })
                          }
                        >
                          GK
                        </button>
                        <button
                          className="btn-goal"
                          onClick={() => addGoalWithAssist(team, p.id)}
                        >
                          ⚽
                        </button>
                        <button
                          className="btn-og"
                          onClick={() => addOwnGoal(team, p.id)}
                        >
                          GC
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <MatchPreview
        draft={draft}
        players={players}
        goalsA={goalsA}
        goalsB={goalsB}
        penaltiesWinner={isDraw ? draft.penaltiesWinner : null}
        removeEvent={removeEvent}
      />

      {isDraw && (
        <div className="penalty-selector">
          <p>EMPATOU! QUEM GANHOU NOS PÊNALTIS?</p>
          <div className="p-btns">
            <button
              className={draft.penaltiesWinner === "A" ? "selected" : ""}
              onClick={() => setDraft({ ...draft, penaltiesWinner: "A" })}
            >
              {draft.teamA.name || "Time A"}
            </button>
            <button
              className={draft.penaltiesWinner === "B" ? "selected" : ""}
              onClick={() => setDraft({ ...draft, penaltiesWinner: "B" })}
            >
              {draft.teamB.name || "Time B"}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={saveMatch}
        disabled={loading}
        className="confirm-btn-final"
      >
        {loading ? "PROCESSANDO..." : "CONCLUIR E SALVAR"}
      </button>
    </div>
  );
}

export default AdminMatches;
