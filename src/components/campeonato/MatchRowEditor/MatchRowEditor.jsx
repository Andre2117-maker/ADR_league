import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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

  const matchId = `${ano}_GRUPO${grupo}_${t1}_${t2}`
    .replace(/\s+/g, "")
    .toUpperCase();

  const handleSave = async () => {
    if (!isAdmin) return;
    if (!scoreA && !scoreB) {
      alert("Preencha o placar antes de salvar!");
      return;
    }

    setSaving(true);
    const finalPlacar1 = isReverse ? scoreB : scoreA;
    const finalPlacar2 = isReverse ? scoreA : scoreB;

    try {
      await setDoc(
        doc(db, "partidas_campeonato", matchId),
        {
          ano: String(ano),
          fase: "GRUPOS",
          grupo: String(grupo),
          timeA: t1,
          timeB: t2,
          placarA: String(finalPlacar1).toUpperCase(),
          placarB: String(finalPlacar2).toUpperCase(),
          finalizado: true,
        },
        { merge: true },
      );

      await reloadData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar partida.");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkMatch = async () => {
    let rawId = prompt(
      "Cole o ID da partida ou o link completo do calendário aqui:",
    );

    if (!rawId) return;

    let extractedId = rawId.trim();
    if (extractedId.includes("/") || extractedId.includes("http")) {
      const parts = extractedId.split("/").filter(Boolean);
      extractedId = parts[parts.length - 1];
    }

    try {
      await setDoc(
        doc(db, "partidas_campeonato", matchId),
        {
          ano: String(ano),
          fase: "GRUPOS",
          grupo: String(grupo),
          timeA: t1,
          timeB: t2,
          linkedMatchId: extractedId,
        },
        { merge: true },
      );

      alert("🔗 Partida linkada com sucesso!");
      await reloadData();
    } catch (error) {
      console.error("Erro ao linkar:", error);
      alert("Erro ao linkar a partida no banco de dados.");
    }
  };

  const formatarNome = (nome) => {
    if (!nome) return "";
    return nome.length > 3
      ? nome.substring(0, 3).toUpperCase()
      : nome.toUpperCase();
  };

  return (
    <div className="match-editor-wrapper">
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

      <div className="camp-match-actions">
        {existingMatch?.linkedMatchId && (
          <button
            className="btn-match-center"
            onClick={() => navigate(`/match/${existingMatch.linkedMatchId}`)}
          >
            Ver mais
          </button>
        )}

        {isAdmin && (
          <button
            className="btn-link-match"
            onClick={handleLinkMatch}
            title="Linkar com a partida oficial do calendário"
          >
            🔗 Linkar Partida
          </button>
        )}
      </div>
    </div>
  );
}
