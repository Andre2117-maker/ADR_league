import React from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { FORMATIONS_DATA } from "../../../data/formationsConfig";
import "./DualField.css";

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
}) {
  return (
    <div className="dual-fields-layout">
      {teamsToRender.map((t) => (
        <div key={t.k} className="field-section">
          <div className="field-header">
            <h3 className="field-team-title">{t.n}</h3>
            {isAdmin && (
              <div className="formation-select-wrapper">
                <select
                  className="formation-dropdown"
                  value={t.k === "A" ? formA : formB}
                  onChange={async (e) => {
                    const newFormation = e.target.value;
                    try {
                      if (t.k === "A") {
                        setFormA(newFormation);
                        await updateDoc(doc(db, "matches", match.id), {
                          formationA: newFormation,
                        });
                      } else {
                        setFormB(newFormation);
                        await updateDoc(doc(db, "matches", match.id), {
                          formationB: newFormation,
                        });
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
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
          <div className="pitch-canvas">
            <div className="field-lines">
              <div className="c-circle"></div>
              <div className="c-line"></div>
              <div className="b-top"></div>
              <div className="b-bottom"></div>
            </div>
            {getActiveSlots(t.f).map((s) => renderSlot(s, t.k, t.p))}
          </div>
        </div>
      ))}
    </div>
  );
}
