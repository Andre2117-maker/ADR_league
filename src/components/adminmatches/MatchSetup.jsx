import React from "react";
import { MATCH_TYPES, EVENT_THEMES, CHAMP_PHASES, todayISO } from "./adminMatchesUtils";

/**
 * Etapa "Jogo": tipo, data, local, fase, tema do evento e opções.
 * (antes: AdminHeader + painel de configurações + parte do AdminExtras)
 */
export default function MatchSetup({
  matchType,
  onChangeType,
  draft,
  setField,
  venues,
  onOpenVenue,
  eventType,
  setEventType,
  isOfficial,
  setIsOfficial,
  generateFoul,
  setGenerateFoul,
  onLoadLast,
  loadingLast,
}) {
  const today = todayISO();

  return (
    <div className="am-panel">
      <div className="am-panel-head">
        <span className="am-kicker">ETAPA 1</span>
        <h2>Configurar partida</h2>
      </div>

      {/* TIPO */}
      <label className="am-label">Tipo de partida</label>
      <div className="am-type-grid">
        {MATCH_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`am-type ${matchType === t.id ? "on" : ""}`}
            onClick={() => onChangeType(t.id)}
          >
            <span className="am-type-icon">{t.icon}</span>
            <b>{t.label}</b>
            <small>{t.hint}</small>
          </button>
        ))}
      </div>

      {/* DATA + LOCAL */}
      <div className="am-row-2">
        <div>
          <label className="am-label">Data</label>
          <div className="am-inline">
            <input
              className="am-input"
              type="date"
              value={draft.date}
              onChange={(e) => setField("date", e.target.value)}
            />
            {draft.date !== today && (
              <button type="button" className="am-chip" onClick={() => setField("date", today)}>
                Hoje
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="am-label">Local</label>
          <div className="am-inline">
            <select
              className={`am-input ${!draft.venue ? "is-missing" : ""}`}
              value={draft.venue}
              onChange={(e) => setField("venue", e.target.value)}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {venues.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
              {draft.venue && !venues.includes(draft.venue) && (
                <option value={draft.venue}>{draft.venue}</option>
              )}
            </select>
            <button type="button" className="am-chip" onClick={onOpenVenue}>
              + Novo
            </button>
          </div>
        </div>
      </div>

      {/* FASE DO CAMPEONATO */}
      {matchType === "CAMPEONATO" && (
        <>
          <label className="am-label">Fase do campeonato</label>
          <div className="am-chips">
            {CHAMP_PHASES.map((p) => (
              <button
                key={p}
                type="button"
                className={`am-chip ${draft.championshipPhase === p ? "on" : ""}`}
                onClick={() => setField("championshipPhase", p)}
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}

      {/* TEMA DO EVENTO */}
      {matchType === "EVENTO" && (
        <>
          <label className="am-label">Tema visual do evento</label>
          <div className="am-chips">
            {EVENT_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`am-chip ${eventType === t.id ? "on" : ""}`}
                onClick={() => setEventType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* OPÇÕES */}
      <div className="am-switches">
        <label className="am-switch">
          <input type="checkbox" checked={isOfficial} onChange={(e) => setIsOfficial(e.target.checked)} />
          <span>
            <b>Partida oficial</b>
            <small>Soma gols, assistências e estatísticas gerais</small>
          </span>
        </label>
        <label className="am-switch">
          <input type="checkbox" checked={generateFoul} onChange={(e) => setGenerateFoul(e.target.checked)} />
          <span>
            <b>Gerar faltas para ausentes</b>
            <small>Afeta streak e status de ativo na tabela</small>
          </span>
        </label>
      </div>

      <button type="button" className="am-btn am-btn-block" onClick={onLoadLast} disabled={loadingLast}>
        {loadingLast ? "Carregando..." : "📋 Usar times do último treino"}
      </button>
    </div>
  );
}
