import React from "react";
import { FORMATIONS_DATA } from "../../../data/formationsConfig";
import "./FriendlyGameField.css";

export default function FriendlyGameField({
  game,
  players,
  match,
  renderSlot,
  isAdmin,
  onFormationChange,
}) {
  const formKey = game.formation || "5_JOG_2-1-1";

  const getActiveSlots = (fk) => {
    const f4 = FORMATIONS_DATA.FUT4?.[fk];
    const f5 = FORMATIONS_DATA.FUT5?.[fk];
    const f6 = FORMATIONS_DATA.FUT6?.[fk];
    const f7 = FORMATIONS_DATA.FUT7?.[fk];
    const f8 = FORMATIONS_DATA.FUT8?.[fk];
    return (f4 || f5 || f6 || f7 || f8)?.slots || [];
  };

  const slots = getActiveSlots(formKey);

  // ==========================================
  // LÓGICA DE TITULARES E RESERVAS
  // ==========================================
  const titularesIds = Object.values(game.tactical || {}).filter(Boolean);
  const adrPlayersIds = match.teamA?.players || [];

  const titulares = adrPlayersIds
    .filter((id) => titularesIds.includes(String(id)))
    .map((id) => players.find((p) => String(p.id) === String(id)))
    .filter(Boolean);

  const reservas = adrPlayersIds
    .filter((id) => !titularesIds.includes(String(id)))
    .map((id) => players.find((p) => String(p.id) === String(id)))
    .filter(Boolean);

  // Inteligência para descobrir a Posição baseada no Slot da Prancheta
  const getPlayerRole = (playerId) => {
    const slotId = Object.keys(game.tactical || {}).find(
      (k) => game.tactical[k] === String(playerId),
    );
    if (slotId) {
      const slot = slots.find((s) => s.id === slotId);
      if (slot) {
        const r = slot.role.toUpperCase();
        if (r.includes("GOL")) return "GOL";
        if (r.includes("ZAG") || r.includes("DEF") || r.includes("LAT"))
          return "DEF";
        if (r.includes("MEI") || r.includes("VOL") || r.includes("ALA"))
          return "MEI";
        if (r.includes("ATA") || r.includes("PON") || r.includes("CEN"))
          return "ATA";
        return "JOG";
      }
    }
    return "RES";
  };

  // Abrevia o nome estilo TV (Ex: "A. Hakimi")
  const formatName = (fullName) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(" ");
    if (parts.length > 1) {
      return `${parts[0][0]}. ${parts[parts.length - 1]}`;
    }
    return fullName;
  };

  // Coleta eventos e status do jogador na partida (Gols, Cartões, Sub, Lesão)
  const getPlayerMatchBadges = (pId) => {
    const pIdStr = String(pId);
    const pEvents =
      match.events?.filter((e) => String(e.playerId) === pIdStr) || [];

    const goals = pEvents.filter((e) => e.type === "GOAL").length;
    const assists =
      match.events?.filter(
        (e) => e.type === "GOAL" && String(e.assistId) === pIdStr,
      ).length || 0;
    const ownGoals = pEvents.filter((e) => e.type === "OWN_GOAL").length;
    const yellows = pEvents.filter(
      (e) => e.type === "YELLOW_CARD" || e.type === "YELLOW",
    ).length;
    const reds = pEvents.filter(
      (e) => e.type === "RED_CARD" || e.type === "RED",
    ).length;

    // Detecta Substituição (Entrou ou Saiu) verificando todos os eventos de sub
    const subEvent = match.events
      ?.slice()
      .reverse()
      .find(
        (e) =>
          e.type === "SUB" &&
          (String(e.playerInId) === pIdStr || String(e.playerOutId) === pIdStr),
      );

    let subType = null;
    let isInjured = false;
    if (subEvent) {
      if (String(subEvent.playerOutId) === pIdStr) {
        subType = "out";
        isInjured =
          subEvent.reason && subEvent.reason.toLowerCase().includes("lesão");
      } else if (String(subEvent.playerInId) === pIdStr) {
        subType = "in";
      }
    }

    const isMVP = match.mvp && String(match.mvp.id) === pIdStr;
    const isTeamGK = String(match.teamA?.goalkeeperId) === pIdStr;
    const isCaptain = String(match.teamA?.captainId) === pIdStr;

    return {
      goals,
      assists,
      ownGoals,
      yellows,
      reds,
      subType,
      isInjured,
      isMVP,
      isTeamGK,
      isCaptain,
    };
  };

  return (
    <div className="friendly-field-wrapper">
      {/* SELETOR DE FORMAÇÃO (SÓ ADMIN) */}
      <div
        className="field-header"
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        {isAdmin && (
          <div className="formation-select-wrapper">
            <select
              className="formation-dropdown"
              value={formKey}
              onChange={(e) => onFormationChange(e.target.value)}
            >
              <optgroup label="FUT 4">
                {Object.keys(FORMATIONS_DATA.FUT4 || {}).map((k) => (
                  <option key={k} value={k}>
                    {FORMATIONS_DATA.FUT4[k].label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="FUT 5">
                {Object.keys(FORMATIONS_DATA.FUT5 || {}).map((k) => (
                  <option key={k} value={k}>
                    {FORMATIONS_DATA.FUT5[k].label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="FUT 6">
                {Object.keys(FORMATIONS_DATA.FUT6 || {}).map((k) => (
                  <option key={k} value={k}>
                    {FORMATIONS_DATA.FUT6[k].label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="FUT 7">
                {Object.keys(FORMATIONS_DATA.FUT7 || {}).map((k) => (
                  <option key={k} value={k}>
                    {FORMATIONS_DATA.FUT7[k].label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="FUT 8">
                {Object.keys(FORMATIONS_DATA.FUT8 || {}).map((k) => (
                  <option key={k} value={k}>
                    {FORMATIONS_DATA.FUT8[k].label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        )}
      </div>

      {/* PRANCHETA DO CAMPO CENTRALIZADA */}
      <div className="friendly-pitch-container">
        <div className="pitch-canvas friendly-pitch">
          <div className="field-lines">
            <div className="c-circle"></div>
            <div className="c-line"></div>
            <div className="b-top"></div>
            <div className="b-bottom"></div>
          </div>
          {slots.map((s) => renderSlot(s, "A", adrPlayersIds))}
        </div>
      </div>

      {/* ==========================================
          ESCALAÇÃO VERTICAL ESPELHADA COM BADGES
      ========================================== */}
      <div className="psg-vertical-lineup-container">
        <h3 className="psg-vertical-title">ESCALAÇÕES</h3>

        {/* Cabeçalho dos Times (Escudos) */}
        <div className="psg-vertical-header">
          <div className="team-header-side left">
            <div className="team-header-text">
              <span className="th-name">{match.teamA.name}</span>
            </div>
            <img src={match.teamA.logo || "/logo.png"} alt="A" />
          </div>

          <div className="team-header-side right">
            <img src={match.teamB.logo || "/logo.png"} alt="B" />
            <div className="team-header-text">
              <span className="th-name">{match.teamB.name}</span>
            </div>
          </div>
        </div>

        {/* LINHA DOS TITULARES */}
        <div className="psg-vertical-list">
          {titulares.length > 0 ? (
            titulares.map((p) => {
              const b = getPlayerMatchBadges(p.id);
              return (
                <div key={p.id} className="psg-v-row">
                  {/* O Seu Time (ADR) - Lado Esquerdo */}
                  <div className="psg-v-side left">
                    <span className="psg-v-name">{formatName(p.name)}</span>
                    <span className="psg-v-pos">{getPlayerRole(p.id)}</span>
                    <span className="psg-v-num">{p.number || "-"}</span>

                    <div className="psg-v-photo-wrapper">
                      <img
                        className="psg-v-photo"
                        src={p.photo || "/players/Anonimo.png"}
                        alt={p.name}
                      />

                      <div className="psg-v-badges-overlay">
                        {b.goals > 0 && (
                          <span
                            className="v-badge goal"
                            title={`${b.goals} Gol(s)`}
                          >
                            ⚽{b.goals > 1 && <small>{b.goals}</small>}
                          </span>
                        )}
                        {b.assists > 0 && (
                          <span
                            className="v-badge assist"
                            title={`${b.assists} Assistência(s)`}
                          >
                            👟{b.assists > 1 && <small>{b.assists}</small>}
                          </span>
                        )}
                        {b.yellows > 0 && (
                          <span
                            className="v-badge yellow"
                            title="Cartão Amarelo"
                          >
                            🟨
                          </span>
                        )}
                        {b.reds > 0 && (
                          <span className="v-badge red" title="Cartão Vermelho">
                            🟥
                          </span>
                        )}
                        {b.subType === "out" && (
                          <span
                            className="v-badge sub-out"
                            title="Substituído (Saiu)"
                          >
                            <img src="/setaVerm.png" alt="Saiu" />
                          </span>
                        )}
                        {b.subType === "in" && (
                          <span
                            className="v-badge sub-in"
                            title="Entrou em campo"
                          >
                            <img src="/setaVerd.png" alt="Entrou" />
                          </span>
                        )}
                        {b.isInjured && (
                          <span className="v-badge injury" title="Lesão">
                            <img src="/lesao.png" alt="Lesão" />
                          </span>
                        )}
                        {b.isCaptain && (
                          <span className="v-badge captain" title="Capitão">
                            C
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Adversário - Lado Direito */}
                  <div className="psg-v-side right">
                    <div className="psg-v-photo-wrapper shadow-opponent">
                      <img
                        className="psg-v-photo"
                        src="/players/Anonimo.png"
                        alt="Oponente"
                      />
                    </div>
                    <span className="psg-v-num shadow-text">-</span>
                    <span className="psg-v-pos shadow-text">
                      {getPlayerRole(p.id)}
                    </span>
                    <span className="psg-v-name shadow-text">Oponente</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", color: "#666", width: "100%" }}>
              Escalação pendente...
            </div>
          )}
        </div>

        {/* LINHA DOS RESERVAS (Com suporte a badges de entrada, gols e cartões) */}
        {reservas.length > 0 && (
          <>
            <h4 className="psg-vertical-subtitle">BANCO DE RESERVAS</h4>
            <div className="psg-vertical-list">
              {reservas.map((p) => {
                const b = getPlayerMatchBadges(p.id);
                return (
                  <div key={p.id} className="psg-v-row">
                    <div className="psg-v-side left">
                      <span className="psg-v-name" style={{ color: "#aaa" }}>
                        {formatName(p.name)}
                      </span>
                      <span className="psg-v-pos">RES</span>
                      <span className="psg-v-num" style={{ color: "#888" }}>
                        {p.number || "-"}
                      </span>

                      <div className="psg-v-photo-wrapper">
                        <img
                          className="psg-v-photo"
                          src={p.photo || "/players/Anonimo.png"}
                          alt={p.name}
                          style={{ opacity: b.subType === "in" ? 1 : 0.6 }}
                        />

                        {/* Badges para os reservas que participaram da partida */}
                        <div className="psg-v-badges-overlay">
                          {b.goals > 0 && (
                            <span className="v-badge goal">
                              ⚽{b.goals > 1 && <small>{b.goals}</small>}
                            </span>
                          )}
                          {b.assists > 0 && (
                            <span className="v-badge assist">
                              👟{b.assists > 1 && <small>{b.assists}</small>}
                            </span>
                          )}
                          {b.yellows > 0 && (
                            <span className="v-badge yellow">🟨</span>
                          )}
                          {b.reds > 0 && (
                            <span className="v-badge red">🟥</span>
                          )}
                          {b.subType === "in" && (
                            <span
                              className="v-badge sub-in"
                              title="Entrou em campo do banco"
                            >
                              <img src="/setaVerd.png" alt="Entrou" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="psg-v-side right">
                      <div className="psg-v-photo-wrapper shadow-opponent">
                        <img
                          className="psg-v-photo"
                          src="/players/Anonimo.png"
                          alt="Oponente"
                        />
                      </div>
                      <span className="psg-v-num shadow-text">-</span>
                      <span className="psg-v-pos shadow-text">RES</span>
                      <span className="psg-v-name shadow-text">Oponente</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
