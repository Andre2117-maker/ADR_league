function AdminHeader({
  loadingLastTeams,
  loadLastTrainingTeams,
  matchType,
  setMatchType,
  setDraft,
}) {
  return (
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

          if (newType === "TREINO") {
            setDraft((prev) => ({
              ...prev,
              teamB: {
                ...prev.teamB,
                name: "ADR",
              },
            }));
          }
        }}
      >
        <option value="TREINO">🏟️ TREINO INTERNO</option>

        <option value="AMISTOSO">🤝 AMISTOSO EXTERNO</option>
      </select>
    </header>
  );
}

export default AdminHeader;
