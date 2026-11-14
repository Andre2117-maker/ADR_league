import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import {
  PitchStage,
  FormationSelect,
  ViewSwitch,
  formationShort,
  useVertical,
  startersCount,
} from "./PitchStage";
import Lineups from "./Lineups";
import "./DualField.css";

/* ==========================================================================
   CAMPO 3D COM OS DOIS TIMES (treino / evento)
   - Computador: campo deitado em perspectiva (fino no fundo, largo na frente)
   - Celular: "Os dois" (campo em pé) ou um time por vez (meio campo dele)
   ========================================================================== */
export default function DualField({
  match,
  teamsToRender,
  isAdmin,
  formA,
  setFormA,
  formB,
  setFormB,
  getActiveSlots,
  renderSlot,
  players = [],
  is3D = true,
  onToggle3D,
}) {
  const vertical = useVertical();
  const [mobileView, setMobileView] = useState(isAdmin ? "A" : "both");
  const solo = vertical && mobileView !== "both";
  const layoutKey = !vertical ? "horizontal" : solo ? "solo" : "vertical";

  const [tA, tB] = teamsToRender;
  const shown = solo
    ? teamsToRender.filter((t) => t.k === mobileView)
    : teamsToRender;

  const saveFormation = async (k, value) => {
    try {
      if (k === "A") {
        setFormA(value);
        await updateDoc(doc(db, "matches", match.id), { formationA: value });
      } else {
        setFormB(value);
        await updateDoc(doc(db, "matches", match.id), { formationB: value });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const teamLogo = (k) => (k === "A" ? match?.teamA?.logo : match?.teamB?.logo);

  const TeamTag = ({ t, align, noSelect = false }) =>
    t ? (
      <div className={`pf-team pf-team-${align} side-${t.k.toLowerCase()}`}>
        {teamLogo(t.k) && (
          <img className="pf-logo" src={teamLogo(t.k)} alt="" />
        )}
        <div className="pf-team-text">
          <span className="pf-team-name">{t.n}</span>
          <span className="pf-team-form">{formationShort(t.f)}</span>
        </div>
        {isAdmin && !noSelect && (
          <FormationSelect
            value={t.k === "A" ? formA : formB}
            onChange={(v) => saveFormation(t.k, v)}
            size={startersCount(match, t.k)}
          />
        )}
      </div>
    ) : null;

  return (
    <div
      className={`pf-wrap layout-${layoutKey} ${is3D ? "is-3d" : "is-flat"} ${vertical ? (solo ? "is-solo" : "is-both") : ""}`}
    >
      {vertical && (
        <div className="pf-switch" role="tablist">
          {tA && (
            <button
              type="button"
              className={mobileView === "A" ? "on" : ""}
              onClick={() => setMobileView("A")}
            >
              {tA.n}
            </button>
          )}
          <button
            type="button"
            className={mobileView === "both" ? "on" : ""}
            onClick={() => setMobileView("both")}
          >
            Os dois
          </button>
          {tB && (
            <button
              type="button"
              className={mobileView === "B" ? "on" : ""}
              onClick={() => setMobileView("B")}
            >
              {tB.n}
            </button>
          )}
        </div>
      )}

      {vertical &&
        (solo ? (
          <TeamTag
            t={teamsToRender.find((t) => t.k === mobileView)}
            align="top"
          />
        ) : (
          <TeamTag t={tB} align="top" noSelect />
        ))}

      <PitchStage
        layoutKey={layoutKey}
        is3D={is3D}
        half={solo}
        solo={solo}
        teams={shown.map((t) => ({
          k: t.k,
          slots: getActiveSlots(t.f),
          ids: t.p,
        }))}
        renderSlot={renderSlot}
      >
        {!vertical && (
          <div className="pf-tools">
            <ViewSwitch is3D={is3D} onToggle3D={onToggle3D} />
          </div>
        )}
      </PitchStage>

      {vertical ? (
        <>
          {!solo && <TeamTag t={tA} align="bottom" noSelect />}
          <div className="pf-mobile-tools">
            <ViewSwitch is3D={is3D} onToggle3D={onToggle3D} />
            {!solo && isAdmin && (
              <span className="pf-hint">
                Para escalar, escolha um dos times acima.
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="pf-bar">
          <TeamTag t={tA} align="left" />
          <TeamTag t={tB} align="right" />
        </div>
      )}

      {/* TITULARES E RESERVAS */}
      <Lineups
        match={match}
        players={players}
        teams={teamsToRender}
        getActiveSlots={getActiveSlots}
      />
    </div>
  );
}
