import React, { useMemo, useState } from "react";
import PlayerRow from "./PlayerRow";
import ExternalTeamTools from "./ExternalTeamTools";
import { norm } from "./adminMatchesUtils";
import { getShirtNumber } from "../../utils/Shirtnumber";
import LogoADR from "../../assets/logo.png";
import LogoIDR from "../../assets/IDR.png";

const logoKind = (logo) => {
  if (!logo || logo === LogoADR || logo === "/logo.png") return "ADR";
  if (logo === LogoIDR || logo === "/IDR.png" || logo === "/logo-idr.png")
    return "IDR";
  return "CUSTOM";
};

/**
 * Card de um time: escudo, nome, presets, busca e lista de jogadores.
 * (antes: bloco do AdminMatches + PresetTools + TeamCard)
 */
export default function TeamPanel({
  side,
  team,
  isExternal,
  lockName,
  clubMode,
  players,
  lineup,
  otherTeamIds,
  showHideTaken,
  stats,
  currentGk,
  teamEvents,
  teamPresets,
  onUpdateTeam,
  onTogglePlayer,
  onSetGK,
  onSetCaptain,
  onLogoFile,
  onApplyPreset,
  onSavePreset,
  onClearTeam,
  onGoal,
  onOwnGoal,
  onCard,
  onOpenSub,
  onOpenGk,
  onExternalEvent,
  onRemoveEvent,
}) {
  const [q, setQ] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const [hideTaken, setHideTaken] = useState(true);
  const fileId = `am-logo-${side}`;
  const kind = logoKind(team.logo);

  const visible = useMemo(() => {
    const nq = norm(q);
    return players.filter((p) => {
      const mine = team.players.includes(p.id) || lineup.cameIn.has(p.id);
      if (onlySelected && !mine) return false;
      if (showHideTaken && hideTaken && !mine && otherTeamIds.has(p.id))
        return false;
      if (nq && !norm(p.name).includes(nq)) return false;
      return true;
    });
  }, [
    players,
    team.players,
    lineup,
    onlySelected,
    showHideTaken,
    hideTaken,
    otherTeamIds,
    q,
  ]);

  const gkName = currentGk
    ? currentGk.id
      ? players.find((p) => p.id === currentGk.id)?.name
      : currentGk.name
    : null;

  return (
    <div className={`am-panel am-team ${isExternal ? "is-external" : ""}`}>
      {/* CABEÇALHO DO TIME */}
      <div className="am-team-head">
        <button
          type="button"
          className="am-logo"
          onClick={() => document.getElementById(fileId)?.click()}
          title="Trocar escudo"
        >
          <img src={team.logo || LogoADR} alt="" />
          <input
            id={fileId}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onLogoFile(f);
              e.target.value = "";
            }}
          />
        </button>

        <div className="am-team-id">
          <span className="am-kicker">TIME {side}</span>
          <input
            className="am-team-name"
            placeholder="Nome do time"
            value={team.name}
            disabled={lockName}
            onChange={(e) => onUpdateTeam({ name: e.target.value })}
          />
          <div className="am-seg am-seg-sm">
            <button
              type="button"
              className={kind === "ADR" ? "on" : ""}
              onClick={() => onUpdateTeam({ logo: "" })}
            >
              ADR
            </button>
            <button
              type="button"
              className={kind === "IDR" ? "on" : ""}
              onClick={() => onUpdateTeam({ logo: LogoIDR })}
            >
              IDR
            </button>
            <button
              type="button"
              className={kind === "CUSTOM" ? "on" : ""}
              onClick={() => document.getElementById(fileId)?.click()}
            >
              📤
            </button>
          </div>
        </div>
      </div>

      {/* PRESETS */}
      <div className="am-inline am-presets">
        <select
          className="am-input"
          value=""
          onChange={(e) => e.target.value && onApplyPreset(e.target.value)}
        >
          <option value="">
            📋 Carregar preset
            {teamPresets.length ? ` (${teamPresets.length})` : ""}
          </option>
          {teamPresets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="am-btn"
          onClick={onSavePreset}
          title="Salvar este time como preset"
        >
          💾
        </button>
      </div>

      {isExternal ? (
        <ExternalTeamTools
          side={side}
          team={team}
          events={teamEvents}
          onSetGkName={(v) => onUpdateTeam({ externalGoalkeeperName: v })}
          onAddEvent={onExternalEvent}
          onRemoveEvent={onRemoveEvent}
          onOpenGk={onOpenGk}
        />
      ) : (
        <>
          {/* RESUMO DO TIME */}
          <div className="am-team-summary">
            <span>
              <b>{team.players.length}</b> titulares
              {lineup.cameIn.size > 0 && (
                <>
                  {" "}
                  · <b>{lineup.cameIn.size}</b> entraram
                </>
              )}
            </span>
            {gkName ? (
              <span className="am-pill">🧤 {gkName}</span>
            ) : (
              <span className="am-pill am-pill-warn">Sem goleiro</span>
            )}
          </div>

          {/* BUSCA E FILTROS */}
          <input
            className="am-input"
            type="search"
            placeholder="🔍 Buscar jogador..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="am-chips">
            <button
              type="button"
              className={`am-chip ${onlySelected ? "on" : ""}`}
              onClick={() => setOnlySelected((v) => !v)}
            >
              Só quem joga
            </button>
            {showHideTaken && (
              <button
                type="button"
                className={`am-chip ${hideTaken ? "on" : ""}`}
                onClick={() => setHideTaken((v) => !v)}
              >
                Ocultar do outro time
              </button>
            )}
            <button
              type="button"
              className="am-chip am-chip-danger"
              onClick={onClearTeam}
              disabled={team.players.length === 0}
            >
              Limpar
            </button>
          </div>

          {/* JOGADORES */}
          <div className="amp-list">
            {visible.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                shirt={getShirtNumber(p, clubMode, "")}
                isSelected={team.players.includes(p.id)}
                isGK={team.goalkeeperId === p.id}
                isCaptain={team.captainId === p.id}
                cameIn={lineup.cameIn.has(p.id)}
                wentOut={lineup.wentOut.has(p.id)}
                stats={stats[p.id]}
                onToggle={() => onTogglePlayer(p.id)}
                onSetGK={() => onSetGK(p.id)}
                onSetCaptain={() => onSetCaptain(p.id)}
                onGoal={() => onGoal(p.id)}
                onOwnGoal={() => onOwnGoal(p.id)}
                onCard={(type, reason) => onCard(p.id, type, reason)}
              />
            ))}
            {visible.length === 0 && (
              <p className="am-muted am-center">Nenhum jogador encontrado.</p>
            )}
          </div>

          <div className="am-team-actions">
            <button
              type="button"
              className="am-btn"
              onClick={onOpenSub}
              disabled={team.players.length === 0}
            >
              🔄 Substituição
            </button>
            <button
              type="button"
              className="am-btn"
              onClick={onOpenGk}
              disabled={team.players.length === 0}
            >
              🧤 Troca de goleiro
            </button>
          </div>
        </>
      )}
    </div>
  );
}
