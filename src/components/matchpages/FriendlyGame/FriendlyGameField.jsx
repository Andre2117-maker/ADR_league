import React from "react";
import { PitchStage, FormationSelect, ViewSwitch, formationShort, formationInfo, useVertical } from "../DualField/PitchStage";
import Lineups from "../DualField/Lineups";
import "../DualField/DualField.css";
import "./FriendlyGameField.css";

/* ==========================================================================
   CAMPO 3D DE AMISTOSO / CAMPEONATO
   Só o nosso time em campo (meio campo dele, gol perto da câmera),
   com o adversário no fundo e o elenco do jogo ao lado.
   ========================================================================== */
export default function FriendlyGameField({
  game,
  players = [],
  match,
  renderSlot,
  isAdmin,
  onFormationChange,
  is3D = true,
  onToggle3D,
}) {
  const vertical = useVertical();
  const formKey = game?.formation || "5_JOG_2-1-1";
  const slots = formationInfo(formKey)?.slots || [];
  const adrIds = match?.teamA?.players || [];

  const ourName = match?.teamA?.name || "O ADR";
  const oppName = match?.teamB?.externalName || match?.teamB?.name || "Adversário";
  const ourLogo = match?.teamA?.logo;
  const oppLogo = match?.teamB?.logo;
  const layoutKey = vertical ? "solo" : "soloWide";

  return (
    <div className={`pf-wrap fr-wrap layout-${layoutKey} ${is3D ? "is-3d" : "is-flat"}`}>
      {/* CABEÇALHO: nós x adversário */}
      <header className="fr-head">
        <div className="pf-team side-a">
          {ourLogo && <img className="pf-logo" src={ourLogo} alt="" />}
          <div className="pf-team-text">
            <span className="pf-team-name">{ourName}</span>
            <span className="pf-team-form">{formationShort(formKey)}</span>
          </div>
        </div>

        <div className="fr-game">
          <span className="fr-game-kicker">{match?.type === "CAMPEONATO" ? "Campeonato" : "Amistoso"}</span>
          <span className="fr-game-name">{game?.name || "Jogo 1"}</span>
        </div>

        <div className="pf-team pf-team-right fr-opp">
          {oppLogo && <img className="pf-logo" src={oppLogo} alt="" />}
          <div className="pf-team-text">
            <span className="fr-opp-kicker">contra</span>
            <span className="pf-team-name">{oppName}</span>
          </div>
        </div>
      </header>

      {isAdmin && (
        <div className="fr-admin">
          <span>Formação deste jogo</span>
          <FormationSelect value={formKey} onChange={onFormationChange} />
        </div>
      )}

      <div className="fr-grid">
        <div className="fr-pitch-col">
          <PitchStage
            layoutKey={layoutKey}
            is3D={is3D}
            half
            solo
            teams={[{ k: "A", slots, ids: adrIds }]}
            renderSlot={renderSlot}
          >
            {/* Adversário no fundo do campo */}
            <div className="fr-opp-banner">
              {oppLogo && <img src={oppLogo} alt="" />}
              <span>
                Atacando contra <b>{oppName}</b>
              </span>
            </div>
            {!vertical && (
              <div className="pf-tools">
                <ViewSwitch is3D={is3D} onToggle3D={onToggle3D} />
              </div>
            )}
          </PitchStage>

          {vertical && (
            <div className="pf-mobile-tools">
              <ViewSwitch is3D={is3D} onToggle3D={onToggle3D} />
            </div>
          )}
        </div>

        <div className="fr-side-col">
          <Lineups
            match={match}
            players={players}
            teams={[{ k: "A", f: formKey, n: ourName, p: adrIds }]}
            getActiveSlots={() => slots}
            tacticalByTeam={{ A: game?.tactical || {} }}
            title={`Elenco · ${game?.name || "Jogo 1"}`}
          />
        </div>
      </div>
    </div>
  );
}
