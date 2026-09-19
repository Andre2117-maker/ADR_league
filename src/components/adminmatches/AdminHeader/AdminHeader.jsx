import "./adminheader.css";

function AdminHeader({
  loadingLastTeams,
  loadLastTrainingTeams,
  matchType,
  setMatchType,
  setDraft,
  draft,
  savedVenues,
  setNewVenueInput,
  setShowVenueModal,
}) {
  return (
    <header
      className="admin-header-flex page-container2"
      style={{ flexDirection: "column", alignItems: "stretch", gap: "20px" }}
    >
      <div
        style={{
          display: "flex",
          gap: "15px",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <button
          className="load-last-teams-btn"
          onClick={loadLastTrainingTeams}
          disabled={loadingLastTeams}
        >
          {loadingLastTeams ? "CARREGANDO..." : "📋 USAR ÚLTIMOS TIMES"}
        </button>

        {/* NOVA CLASSE ADICIONADA AQUI 👇 */}
        <select
          className="match-type-select"
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
          <option value="CAMPEONATO">🏆 CAMPEONATO</option>
        </select>
      </div>

      <div className="admin-box-grid" style={{ width: "100%" }}>
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
          <select
            className="venue-select"
            value={draft.venue}
            onChange={(e) => {
              if (e.target.value === "ADD_NEW") {
                setNewVenueInput("");
                setShowVenueModal(true);
              } else {
                setDraft({ ...draft, venue: e.target.value });
              }
            }}
          >
            <option value="" disabled>
              Selecione um local...
            </option>
            {savedVenues.map((venue, idx) => (
              <option key={idx} value={venue}>
                {venue}
              </option>
            ))}
            {draft.venue && !savedVenues.includes(draft.venue) && (
              <option value={draft.venue}>{draft.venue}</option>
            )}
            <option value="ADD_NEW" className="add-new-venue">
              + Adicionar novo local...
            </option>
          </select>
        </div>

        {matchType === "CAMPEONATO" && (
          <div className="field">
            <label>FASE DO CAMPEONATO</label>
            <select
              className="venue-select"
              value={draft.championshipPhase || ""}
              onChange={(e) =>
                setDraft({ ...draft, championshipPhase: e.target.value })
              }
            >
              <option value="" disabled>
                Selecione a fase...
              </option>
              <option value="Fase de Grupos">Fase de Grupos</option>
              <option value="Oitavas de Final">Oitavas de Final</option>
              <option value="Quartas de Final">Quartas de Final</option>
              <option value="Semifinal">Semifinal</option>
              <option value="Final">Final</option>
            </select>
          </div>
        )}
      </div>
    </header>
  );
}

export default AdminHeader;
