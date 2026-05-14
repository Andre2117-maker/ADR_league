function PresetTools({ teamPresets, applyPreset, handleSavePreset, teamKey }) {
  return (
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
  );
}

export default PresetTools;
