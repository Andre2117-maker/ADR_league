import React, { useState, useEffect } from "react";
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

  // Estados para o painel inline de Linkar Partida (substitui o prompt do navegador)
  const [isLinking, setIsLinking] = useState(false);
  const [linkInput, setLinkInput] = useState(
    existingMatch?.linkedMatchId || "",
  );

  // Mantém os placares sincronizados se a partida mudar no banco
  useEffect(() => {
    setScoreA(initialScoreA);
    setScoreB(initialScoreB);
    setLinkInput(existingMatch?.linkedMatchId || "");
  }, [initialScoreA, initialScoreB, existingMatch?.linkedMatchId]);

  const matchId = `${ano}_GRUPO${grupo}_${t1}_${t2}`
    .replace(/\s+/g, "")
    .toUpperCase();

  // Lógica para descobrir quem venceu e destacar no placar
  const getWinnerSide = () => {
    if (!existingMatch?.finalizado && scoreA === "" && scoreB === "") {
      return null;
    }
    const sA = String(scoreA).trim().toUpperCase();
    const sB = String(scoreB).trim().toUpperCase();

    if (sA === "W" || sB === "L") return "A";
    if (sB === "W" || sA === "L") return "B";

    const numA = parseInt(sA, 10);
    const numB = parseInt(sB, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA > numB) return "A";
      if (numB > numA) return "B";
      return "DRAW";
    }
    return null;
  };

  const winnerSide = getWinnerSide();
  const isFinished = existingMatch?.finalizado;

  const handleSave = async () => {
    if (!isAdmin) return;
    if (scoreA === "" && scoreB === "") {
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
          placarA: String(finalPlacar1).trim().toUpperCase(),
          placarB: String(finalPlacar2).trim().toUpperCase(),
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

  const handleConfirmLink = async () => {
    let extractedId = linkInput.trim();
    if (extractedId.includes("/") || extractedId.includes("http")) {
      const parts = extractedId.split("/").filter(Boolean);
      extractedId = parts[parts.length - 1];
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "partidas_campeonato", matchId),
        {
          ano: String(ano),
          fase: "GRUPOS",
          grupo: String(grupo),
          timeA: t1,
          timeB: t2,
          linkedMatchId: extractedId || null,
        },
        { merge: true },
      );

      setIsLinking(false);
      await reloadData();
    } catch (error) {
      console.error("Erro ao linkar:", error);
      alert("Erro ao linkar a partida no banco de dados.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`mre-card ${isFinished ? "is-finished" : "is-pending"}`}>
      <div className="mre-main-bar">
        {/* BLOCO CENTRAL: CONFRONTO E PLACAR */}
        <div className="mre-teams-scoreboard">
          {/* TIME A (Esquerda) */}
          <div
            className={`mre-team mre-team-home ${
              winnerSide === "A" ? "is-winner" : ""
            }`}
          >
            <span className="mre-team-fullname" title={timeA}>
              {timeA}
            </span>
          </div>

          {/* MIOLO DO PLACAR */}
          <div className="mre-score-center">
            {isAdmin ? (
              <>
                <input
                  className={`mre-score-input ${
                    winnerSide === "A" ? "input-winner" : ""
                  }`}
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  placeholder="-"
                  maxLength="3"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <span className="mre-vs-divider">:</span>
                <input
                  className={`mre-score-input ${
                    winnerSide === "B" ? "input-winner" : ""
                  }`}
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  placeholder="-"
                  maxLength="3"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
              </>
            ) : isFinished ? (
              <div className="mre-score-readonly">
                <span
                  className={`mre-score-box ${
                    winnerSide === "A" ? "box-winner" : ""
                  }`}
                >
                  {scoreA !== "" ? scoreA : "0"}
                </span>
                <span className="mre-vs-divider">:</span>
                <span
                  className={`mre-score-box ${
                    winnerSide === "B" ? "box-winner" : ""
                  }`}
                >
                  {scoreB !== "" ? scoreB : "0"}
                </span>
              </div>
            ) : (
              <span className="mre-badge-pending">VS</span>
            )}
          </div>

          {/* TIME B (Direita) */}
          <div
            className={`mre-team mre-team-away ${
              winnerSide === "B" ? "is-winner" : ""
            }`}
          >
            <span className="mre-team-fullname" title={timeB}>
              {timeB}
            </span>
          </div>
        </div>

        {/* BLOCO DIREITO: BOTÕES DE AÇÃO E DETALHES */}
        <div className="mre-actions-group">
          {existingMatch?.linkedMatchId && (
            <button
              type="button"
              className="mre-btn mre-btn-details"
              onClick={() => navigate(`/match/${existingMatch.linkedMatchId}`)}
              title="Ver estatísticas completas da partida"
            >
              + Detalhes
            </button>
          )}

          {isAdmin && (
            <>
              <button
                type="button"
                className={`mre-btn mre-btn-link ${
                  existingMatch?.linkedMatchId ? "has-link" : ""
                } ${isLinking ? "active" : ""}`}
                onClick={() => setIsLinking(!isLinking)}
                title={
                  existingMatch?.linkedMatchId
                    ? `Linkado: ${existingMatch.linkedMatchId} (Clique p/ alterar)`
                    : "Linkar com partida do calendário"
                }
              >
                🔗 {existingMatch?.linkedMatchId ? "Linkado" : "Link"}
              </button>

              <button
                type="button"
                className="mre-btn mre-btn-save"
                onClick={handleSave}
                disabled={saving}
                title="Salvar Placar (ou pressione Enter)"
              >
                {saving ? "⏳" : "✓ Salvar"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* BARRA INLINE PARA COLAR O LINK DA PARTIDA (Sem prompt feio) */}
      {isAdmin && isLinking && (
        <div className="mre-link-drawer">
          <span className="mre-link-label">🔗 ID ou URL da Partida:</span>
          <input
            type="text"
            className="mre-link-input"
            placeholder="Ex: /match/abc123xyz ou cole o link inteiro..."
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleConfirmLink()}
          />
          <div className="mre-link-drawer-btns">
            <button
              type="button"
              className="mre-drawer-confirm"
              onClick={handleConfirmLink}
              disabled={saving}
            >
              Confirmar
            </button>
            <button
              type="button"
              className="mre-drawer-cancel"
              onClick={() => setIsLinking(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
