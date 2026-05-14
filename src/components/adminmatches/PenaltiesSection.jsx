function PenaltiesSection({ draft, addPenalty, removePenalty, setDraft }) {
  return (
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
              >
                {p === "goal" ? "⚽" : p === "miss" ? "✖" : "•"}
              </span>
            ))}
          </div>
        </div>
      ))}

      <div className="penalties-legacy">
        <input
          type="number"
          placeholder="0"
          value={draft.penaltiesScoreA}
          onChange={(e) =>
            setDraft({
              ...draft,
              penaltiesScoreA: e.target.value,
            })
          }
        />

        <input
          type="number"
          placeholder="0"
          value={draft.penaltiesScoreB}
          onChange={(e) =>
            setDraft({
              ...draft,
              penaltiesScoreB: e.target.value,
            })
          }
        />
      </div>
    </div>
  );
}

export default PenaltiesSection;
