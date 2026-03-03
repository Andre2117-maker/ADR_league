import { useState } from "react";
import "../style.css";

/* ======================
   PREVIEW DA PARTIDA
====================== */
function MatchPreview({ draft, players, goalsA, goalsB, penaltiesWinner }) {
  const playerName = (id) => players.find((p) => p.id === id)?.name || "";

  return (
    <div className="match-preview">
      <div
        style={{
          textAlign: "center",
          fontSize: "12px",
          color: "#aaa",
          marginBottom: "5px",
        }}
      >
        📍 {draft.venue || "Local Indefinido"}
      </div>
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

      <div className="preview-columns">
        {["A", "B"].map((team) => (
          <div key={team} className="preview-event-list">
            {draft.events
              .filter((e) => e.team === team)
              .map((e) => (
                <div key={e.id} className="event-tag">
                  {e.type === "GOAL" && "⚽"}
                  {e.type === "ASSIST" && "👟"}
                  {e.type === "OWN_GOAL" && "GC"}
                  <span>{playerName(e.playerId)}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================
   ADMIN MATCHES
====================== */
function AdminMatches({
  players,
  setMatches,
  setPage,
  isAdmin,
  matchToEdit,
  setMatchToEdit,
}) {
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
  const effectivePenaltiesWinner = isDraw ? draft.penaltiesWinner : null;

  if (!isAdmin) {
    return (
      <div
        className="page-container"
        style={{ textAlign: "center", paddingTop: "90px" }}
      >
        <h2>🚫 Acesso Negado</h2>
        <button onClick={() => setPage("home")} className="back-btn">
          Voltar
        </button>
      </div>
    );
  }

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
          // Se remover o jogador que era goleiro, limpa o ID do goleiro
          goalkeeperId:
            isRemoving && prev[key].goalkeeperId === playerId
              ? null
              : prev[key].goalkeeperId,
        },
      };
    });
  };

  const setGoalkeeper = (team, playerId) => {
    const key = team === "A" ? "teamA" : "teamB";
    setDraft((prev) => ({
      ...prev,
      [key]: { ...prev[key], goalkeeperId: playerId },
    }));
  };

  const addEvent = (team, playerId, type) => {
    setDraft((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        { id: crypto.randomUUID(), team, playerId, type },
      ],
    }));
  };

  const removeLastEvent = () => {
    setDraft((prev) => ({ ...prev, events: prev.events.slice(0, -1) }));
  };

  const saveMatch = () => {
    if (!draft.date || !draft.teamA.name || !draft.teamB.name) {
      alert("Preencha a data e os nomes dos times!");
      return;
    }
    if (isDraw && !effectivePenaltiesWinner) {
      alert("Empate! Selecione quem venceu nos pênaltis.");
      return;
    }

    // Lógica de Clean Sheets: Se o adversário fez 0 gols, é Clean Sheet (CS)
    const finalMatchData = {
      ...draft,
      penaltiesWinner: effectivePenaltiesWinner,
      id: matchToEdit ? matchToEdit.id : crypto.randomUUID(),
      teamA: {
        ...draft.teamA,
        goalkeeperGoalsAgainst: goalsB,
        goalkeeperCleanSheet: goalsB === 0 ? 1 : 0, // Adicionado aqui
      },
      teamB: {
        ...draft.teamB,
        goalkeeperGoalsAgainst: goalsA,
        goalkeeperCleanSheet: goalsA === 0 ? 1 : 0, // Adicionado aqui
      },
    };

    setMatches((prev) => {
      return matchToEdit
        ? prev.map((m) => (m.id === matchToEdit.id ? finalMatchData : m))
        : [...prev, finalMatchData];
    });

    alert(matchToEdit ? "Partida atualizada!" : "Partida salva com sucesso!");

    // Reset do Draft
    setMatchToEdit(null);
    setDraft({
      date: "",
      venue: "",
      teamA: { name: "", players: [], goalkeeperId: null },
      teamB: { name: "", players: [], goalkeeperId: null },
      events: [],
      penaltiesWinner: null,
    });

    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setMatchToEdit(null);
    setPage("adminPanel");
  };

  return (
    <div className="page-container2" style={{ paddingTop: "100px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <button onClick={handleBack} className="btn-voltar-curto">
          ← Voltar
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>
          {matchToEdit ? "Editar Partida" : "Nova Partida"}
        </h1>
        <div style={{ width: "80px" }}></div>
      </div>

      <div
        className="admin-box"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
          background: "#1a1a1a",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #333",
        }}
      >
        <div className="input-group-adr">
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#d4af37",
              marginBottom: "8px",
            }}
          >
            DATA DO JOGO
          </label>
          <input
            type="date"
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </div>

        <div className="input-group-adr">
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#d4af37",
              marginBottom: "8px",
            }}
          >
            LOCAL
          </label>
          <input
            placeholder="Ex: Arena ADR"
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
            value={draft.venue}
            onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
          />
        </div>

        <div className="input-group-adr">
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#d4af37",
              marginBottom: "8px",
            }}
          >
            NOME TIME A
          </label>
          <input
            placeholder="Ex: Real Madrid"
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
            value={draft.teamA.name}
            onChange={(e) =>
              setDraft({
                ...draft,
                teamA: { ...draft.teamA, name: e.target.value },
              })
            }
          />
        </div>

        <div className="input-group-adr">
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#d4af37",
              marginBottom: "8px",
            }}
          >
            NOME TIME B
          </label>
          <input
            placeholder="Ex: Barcelona"
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
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

      <div
        className="match-teams"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}
      >
        {["A", "B"].map((team) => (
          <div key={team} className="info-card">
            <h3
              style={{ borderBottom: "1px solid #333", paddingBottom: "10px" }}
            >
              Escalar{" "}
              {team === "A"
                ? draft.teamA.name || "Time A"
                : draft.teamB.name || "Time B"}
            </h3>
            <div
              style={{
                maxHeight: "350px",
                overflowY: "auto",
                paddingRight: "10px",
              }}
            >
              {players
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((p) => {
                  const teamDraft = team === "A" ? draft.teamA : draft.teamB;
                  const selected = teamDraft.players.includes(p.id);
                  const isGK = teamDraft.goalkeeperId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="player-line"
                      style={{
                        background: selected ? "#1e1e1e" : "transparent",
                        padding: "8px 5px",
                        borderRadius: "4px",
                        marginBottom: "2px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => togglePlayer(team, p.id)}
                      />

                      <span
                        style={{
                          flex: 1,
                          fontSize: "14px",
                          color: isGK ? "#d4af37" : "#fff",
                          fontWeight: isGK ? "bold" : "normal",
                        }}
                      >
                        {p.name} {isGK && "🧤"}
                      </span>

                      {selected && (
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            alignItems: "center",
                          }}
                        >
                          {/* Checkbox do Goleiro */}
                          <button
                            className="mini-btn"
                            style={{
                              background: isGK ? "#d4af37" : "#333",
                              color: isGK ? "#000" : "#fff",
                              fontSize: "10px",
                              padding: "2px 5px",
                            }}
                            onClick={() => setGoalkeeper(team, p.id)}
                            title="Marcar como Goleiro"
                          >
                            GK
                          </button>

                          <button
                            className="mini-btn"
                            onClick={() => addEvent(team, p.id, "GOAL")}
                          >
                            ⚽
                          </button>
                          <button
                            className="mini-btn"
                            onClick={() => addEvent(team, p.id, "ASSIST")}
                          >
                            👟
                          </button>
                          <button
                            className="mini-btn"
                            onClick={() => addEvent(team, p.id, "OWN_GOAL")}
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

      <div style={{ marginTop: "30px" }}>
        <h2 className="page-title" style={{ fontSize: "20px" }}>
          Resumo da Partida
        </h2>

        {isDraw && (
          <div
            className="penalty-box"
            style={{
              background: "#1a1a1a",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #d4af37",
              marginBottom: "15px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: "0 0 10px 0",
                fontWeight: "bold",
                color: "#d4af37",
              }}
            >
              EMPATE! Quem venceu nos pênaltis?
            </p>
            <div
              style={{ display: "flex", justifyContent: "center", gap: "20px" }}
            >
              <label>
                <input
                  type="radio"
                  name="penalties"
                  checked={draft.penaltiesWinner === "A"}
                  onChange={() => setDraft({ ...draft, penaltiesWinner: "A" })}
                />
                {draft.teamA.name || "Time A"}
              </label>
              <label>
                <input
                  type="radio"
                  name="penalties"
                  checked={draft.penaltiesWinner === "B"}
                  onChange={() => setDraft({ ...draft, penaltiesWinner: "B" })}
                />
                {draft.teamB.name || "Time B"}
              </label>
            </div>
          </div>
        )}

        <MatchPreview
          draft={draft}
          players={players}
          goalsA={goalsA}
          goalsB={goalsB}
          penaltiesWinner={effectivePenaltiesWinner}
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={removeLastEvent}
            className="desfa-btn"
            style={{ flex: 1 }}
          >
            Desfazer Último Evento
          </button>
          <button
            onClick={saveMatch}
            className="confirm-btn"
            style={{ flex: 2, margin: 0 }}
          >
            {matchToEdit ? "Salvar Alterações" : "Confirmar e Salvar Partida"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminMatches;
