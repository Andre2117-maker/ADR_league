import PlayerRow from "./PlayerRow";

function TeamCard({
  t,
  draft,
  matchType,
  handleImageUpload,
  setDraft,
  teamPresets,
  applyPreset,
  handleSavePreset,
  isExternal,
  addEvent,
  sortedPlayers,
  setShowAssistModal,
}) {
  const teamKey = t === "A" ? "teamA" : "teamB";

  return (
    <div className={`team-card ${isExternal ? "opponent-card" : ""}`}>
      {/* HEADER */}

      <div className="team-upload-header">
        <div className="header-top-row">
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
                [teamKey]: { ...draft[teamKey], name: e.target.value },
              })
            }
          />
        </div>

        <div className="preset-tools">
          <select
            defaultValue=""
            onChange={(e) => applyPreset(teamKey, e.target.value)}
          >
            <option value="">📋 Carregar Preset</option>
            {teamPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <button onClick={() => handleSavePreset(teamKey)}>💾</button>
        </div>
      </div>

      {/* PLAYERS */}

      <div className="players-scroll">
        {sortedPlayers.map((p) => (
          <PlayerRow
            key={p.id}
            player={p}
            isSelected={draft[teamKey].players.includes(p.id)}
            isGK={draft[teamKey].goalkeeperId === p.id}
            isCaptain={draft[teamKey].captainId === p.id}
            onToggle={() => {}}
            onSetGK={() => {}}
            onSetCaptain={() => {}}
            onGoal={() =>
              setShowAssistModal({
                team: t,
                playerId: p.id,
              })
            }
            onOwnGoal={() => addEvent(t, p.id, "OWN_GOAL")}
            onCard={(type) => addEvent(t, p.id, type)}
          />
        ))}
      </div>
    </div>
  );
}

export default TeamCard;
