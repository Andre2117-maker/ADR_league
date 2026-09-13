import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import "./MatchRowEditor.css";

export default function MatchRowEditor({
  ano,
  grupo,
  timeA,
  timeB,
  partidas,
  reloadData,
  isAdmin,
}) {
  const [t1, t2] = [timeA, timeB].sort();
  const isReverse = timeA !== t1;

  const existingMatch = partidas.find(
    (p) =>
      p.ano === ano &&
      p.fase === "GRUPOS" &&
      p.grupo === grupo &&
      p.timeA === t1 &&
      p.timeB === t2,
  );

  const initialScoreA = existingMatch
    ? isReverse
      ? existingMatch.placarB
      : existingMatch.placarA
    : "";
  const initialScoreB = existingMatch
    ? isReverse
      ? existingMatch.placarA
      : existingMatch.placarB
    : "";

  const [scoreA, setScoreA] = useState(initialScoreA);
  const [scoreB, setScoreB] = useState(initialScoreB);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    console.log("➡️ Botão Salvar (Grupos) clicado!", {
      ano,
      grupo,
      timeA,
      timeB,
      scoreA,
      scoreB,
    });

    if (!isAdmin) {
      console.warn("🚫 Salvamento bloqueado: Usuário não é admin.");
      return;
    }

    if (!scoreA && !scoreB) {
      console.warn("⚠️ Salvamento cancelado: Ambos os placares estão vazios.");
      alert("Preencha o placar antes de salvar!");
      return;
    }

    setSaving(true);

    const finalPlacar1 = isReverse ? scoreB : scoreA;
    const finalPlacar2 = isReverse ? scoreA : scoreB;

    const matchId = `${ano}_GRUPO${grupo}_${t1}_${t2}`
      .replace(/\s+/g, "")
      .toUpperCase();

    console.log("📝 ID gerado para o Firestore:", matchId);

    try {
      await setDoc(doc(db, "partidas_campeonato", matchId), {
        ano: String(ano),
        fase: "GRUPOS",
        grupo: String(grupo),
        timeA: t1,
        timeB: t2,
        placarA: String(finalPlacar1).toUpperCase(),
        placarB: String(finalPlacar2).toUpperCase(),
        finalizado: true,
      });

      console.log("✅ Partida do grupo salva com sucesso!");
      await reloadData();
    } catch (error) {
      console.error("❌ Erro ao salvar a partida do grupo no Firebase:", error);
      alert("Erro ao salvar partida.");
    } finally {
      setSaving(false);
    }
  };

  const formatarNome = (nome) => {
    if (!nome) return "";
    return nome.length > 3
      ? nome.substring(0, 3).toUpperCase()
      : nome.toUpperCase();
  };

  return (
    <div className="match-edit-row">
      <span className="match-team-name align-right" title={timeA}>
        {formatarNome(timeA)}
      </span>

      <input
        className="match-score-input"
        value={scoreA}
        onChange={(e) => setScoreA(e.target.value)}
        placeholder="W/L"
        maxLength="2"
        disabled={!isAdmin}
      />
      <span className="match-vs">x</span>
      <input
        className="match-score-input"
        value={scoreB}
        onChange={(e) => setScoreB(e.target.value)}
        placeholder="W/L"
        maxLength="2"
        disabled={!isAdmin}
      />

      <span className="match-team-name align-left" title={timeB}>
        {formatarNome(timeB)}
      </span>

      {isAdmin && (
        <button
          className="match-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "⏳" : "💾 Salvar"}
        </button>
      )}
    </div>
  );
}
