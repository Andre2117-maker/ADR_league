import React, { useCallback, useEffect, useMemo, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../../firebase";
import "./MatchRowEditor.css";

export default function MatchRowEditor({
  ano,
  grupo,
  timeA,
  timeB,
  partidas = [],
  reloadData,
  isAdmin = false,
}) {
  const navigate = useNavigate();

  // Mantém uma identificação única e uma ordem fixa para o Firebase.
  const [t1, t2] = useMemo(
    () =>
      [timeA, timeB].sort((a, b) =>
        String(a).localeCompare(String(b), "pt-BR"),
      ),
    [timeA, timeB],
  );

  const isReverse = timeA !== t1;

  // Procura a partida existente.
  const existingMatch = useMemo(() => {
    if (!Array.isArray(partidas)) return null;

    return (
      partidas.find(
        (partida) =>
          String(partida.ano) === String(ano) &&
          partida.fase === "GRUPOS" &&
          String(partida.grupo) === String(grupo) &&
          partida.timeA === t1 &&
          partida.timeB === t2,
      ) || null
    );
  }, [partidas, ano, grupo, t1, t2]);

  // Recupera o placar respeitando a ordem visual dos times.
  const initialScoreA = useMemo(() => {
    if (!existingMatch) return "";

    const value = isReverse ? existingMatch.placarB : existingMatch.placarA;

    return value == null ? "" : String(value);
  }, [existingMatch, isReverse]);

  const initialScoreB = useMemo(() => {
    if (!existingMatch) return "";

    const value = isReverse ? existingMatch.placarA : existingMatch.placarB;

    return value == null ? "" : String(value);
  }, [existingMatch, isReverse]);

  const [scoreA, setScoreA] = useState(initialScoreA);
  const [scoreB, setScoreB] = useState(initialScoreB);
  const [saving, setSaving] = useState(false);

  const [isLinking, setIsLinking] = useState(false);
  const [linkInput, setLinkInput] = useState(
    existingMatch?.linkedMatchId || "",
  );

  // Sincroniza os campos quando a partida muda no Firebase.
  useEffect(() => {
    setScoreA(initialScoreA);
    setScoreB(initialScoreB);
    setLinkInput(existingMatch?.linkedMatchId || "");
  }, [initialScoreA, initialScoreB, existingMatch?.linkedMatchId]);

  // Mantém o mesmo padrão de ID já utilizado pelo projeto.
  const matchId = useMemo(
    () => `${ano}_GRUPO${grupo}_${t1}_${t2}`.replace(/\s+/g, "").toUpperCase(),
    [ano, grupo, t1, t2],
  );

  const isFinished = Boolean(existingMatch?.finalizado);

  // Normaliza o placar para descobrir o vencedor.
  const winnerSide = useMemo(() => {
    const a = String(scoreA ?? "")
      .trim()
      .toUpperCase();
    const b = String(scoreB ?? "")
      .trim()
      .toUpperCase();

    if (!a || !b) return null;

    // Resultados especiais.
    if (a === "W" && b === "L") return "A";
    if (b === "W" && a === "L") return "B";

    // Não interpreta resultados incompletos ou inválidos.
    const validNumber = /^\d+$/;

    if (!validNumber.test(a) || !validNumber.test(b)) {
      return null;
    }

    const numberA = Number(a);
    const numberB = Number(b);

    if (numberA > numberB) return "A";
    if (numberB > numberA) return "B";

    return "DRAW";
  }, [scoreA, scoreB]);

  // Salva o placar.
  const handleSave = useCallback(async () => {
    if (!isAdmin || saving) return;

    const normalizedA = String(scoreA).trim().toUpperCase();
    const normalizedB = String(scoreB).trim().toUpperCase();

    if (!normalizedA || !normalizedB) {
      alert("Preencha os dois campos do placar antes de salvar.");
      return;
    }

    const validScore = (value) =>
      /^\d+$/.test(value) || value === "W" || value === "L";

    if (!validScore(normalizedA) || !validScore(normalizedB)) {
      alert("Utilize números ou os resultados especiais W/L.");
      return;
    }

    if (
      (normalizedA === "W" && normalizedB !== "L") ||
      (normalizedB === "W" && normalizedA !== "L") ||
      (normalizedA === "L" && normalizedB !== "W") ||
      (normalizedB === "L" && normalizedA !== "W")
    ) {
      alert("Para resultados especiais, utilize W contra L.");
      return;
    }

    setSaving(true);

    // Converte o placar visual para a ordem fixa do banco.
    const finalPlacar1 = isReverse ? normalizedB : normalizedA;
    const finalPlacar2 = isReverse ? normalizedA : normalizedB;

    try {
      await setDoc(
        doc(db, "partidas_campeonato", matchId),
        {
          ano: String(ano),
          fase: "GRUPOS",
          grupo: String(grupo),
          timeA: t1,
          timeB: t2,
          placarA: finalPlacar1,
          placarB: finalPlacar2,
          finalizado: true,
        },
        { merge: true },
      );

      if (typeof reloadData === "function") {
        await reloadData();
      }
    } catch (error) {
      console.error("Erro ao salvar partida:", error);
      alert("Não foi possível salvar o placar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }, [
    isAdmin,
    saving,
    scoreA,
    scoreB,
    isReverse,
    matchId,
    ano,
    grupo,
    t1,
    t2,
    reloadData,
  ]);

  // Extrai o ID de uma URL ou utiliza o ID informado diretamente.
  const extractMatchId = (value) => {
    const input = String(value ?? "").trim();

    if (!input) return null;

    try {
      if (/^https?:\/\//i.test(input)) {
        const url = new URL(input);
        const segments = url.pathname.split("/").filter(Boolean);
        return segments[segments.length - 1] || null;
      }
    } catch {
      return input;
    }

    const cleaned = input.split(/[?#]/)[0];
    const segments = cleaned.split("/").filter(Boolean);

    return segments[segments.length - 1] || null;
  };

  // Vincula a partida ao calendário.
  const handleConfirmLink = useCallback(async () => {
    if (!isAdmin || saving) return;

    const extractedId = extractMatchId(linkInput);

    if (linkInput.trim() && !extractedId) {
      alert("Informe um ID ou link válido.");
      return;
    }

    if (extractedId && /[\/\s]/.test(extractedId)) {
      alert("O identificador da partida não é válido.");
      return;
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
          linkedMatchId: extractedId,
        },
        { merge: true },
      );

      setIsLinking(false);

      if (typeof reloadData === "function") {
        await reloadData();
      }
    } catch (error) {
      console.error("Erro ao vincular partida:", error);
      alert("Não foi possível vincular a partida.");
    } finally {
      setSaving(false);
    }
  }, [isAdmin, saving, linkInput, matchId, ano, grupo, t1, t2, reloadData]);

  const toggleLinkDrawer = () => {
    setIsLinking((current) => !current);
  };

  return (
    <article
      className={`mre-card ${isFinished ? "is-finished" : "is-pending"}`}
    >
      <div className="mre-main-bar">
        {/* PLACAR E EQUIPES */}
        <div className="mre-teams-scoreboard">
          {/* EQUIPE A */}
          <div
            className={`mre-team mre-team-home ${
              winnerSide === "A" ? "is-winner" : ""
            }`}
          >
            <span className="mre-team-fullname" title={timeA}>
              {timeA}
            </span>
          </div>

          {/* PLACAR */}
          <div className="mre-score-center">
            {isAdmin ? (
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={`Placar de ${timeA}`}
                  className={`mre-score-input ${
                    winnerSide === "A" ? "input-winner" : ""
                  }`}
                  value={scoreA}
                  onChange={(event) =>
                    setScoreA(event.target.value.toUpperCase())
                  }
                  placeholder="-"
                  maxLength={3}
                  disabled={saving}
                  onKeyDown={(event) => event.key === "Enter" && handleSave()}
                />

                <span className="mre-vs-divider">:</span>

                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={`Placar de ${timeB}`}
                  className={`mre-score-input ${
                    winnerSide === "B" ? "input-winner" : ""
                  }`}
                  value={scoreB}
                  onChange={(event) =>
                    setScoreB(event.target.value.toUpperCase())
                  }
                  placeholder="-"
                  maxLength={3}
                  disabled={saving}
                  onKeyDown={(event) => event.key === "Enter" && handleSave()}
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

          {/* EQUIPE B */}
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

        {/* AÇÕES */}
        <div className="mre-actions-group">
          {existingMatch?.linkedMatchId && (
            <button
              type="button"
              className="mre-btn mre-btn-details"
              onClick={() => navigate(`/match/${existingMatch.linkedMatchId}`)}
              title="Ver estatísticas completas"
            >
              <span aria-hidden="true">↗</span>
              <span>Detalhes</span>
            </button>
          )}

          {isAdmin && (
            <>
              <button
                type="button"
                className={`mre-btn mre-btn-link ${
                  existingMatch?.linkedMatchId ? "has-link" : ""
                } ${isLinking ? "active" : ""}`}
                onClick={toggleLinkDrawer}
                disabled={saving}
                aria-expanded={isLinking}
                title="Vincular partida ao calendário"
              >
                <span aria-hidden="true">↗</span>
                <span>
                  {existingMatch?.linkedMatchId ? "Vinculado" : "Vincular"}
                </span>
              </button>

              <button
                type="button"
                className="mre-btn mre-btn-save"
                onClick={handleSave}
                disabled={saving}
                title="Salvar placar"
              >
                {saving ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <span aria-hidden="true">✓</span>
                    <span>Salvar</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* GAVETA DE VINCULAÇÃO */}
      {isAdmin && isLinking && (
        <div className="mre-link-drawer">
          <div className="mre-link-content">
            <label className="mre-link-label" htmlFor={`mre-link-${matchId}`}>
              VINCULAR PARTIDA
            </label>

            <input
              id={`mre-link-${matchId}`}
              type="text"
              className="mre-link-input"
              placeholder="Cole o ID ou a URL da partida..."
              value={linkInput}
              onChange={(event) => setLinkInput(event.target.value)}
              disabled={saving}
              autoFocus
              onKeyDown={(event) =>
                event.key === "Enter" && handleConfirmLink()
              }
            />
          </div>

          <div className="mre-link-drawer-btns">
            <button
              type="button"
              className="mre-drawer-confirm"
              onClick={handleConfirmLink}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Confirmar"}
            </button>

            <button
              type="button"
              className="mre-drawer-cancel"
              onClick={() => setIsLinking(false)}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>

          {existingMatch?.linkedMatchId && (
            <span className="mre-link-current">
              Partida atualmente vinculada
            </span>
          )}
        </div>
      )}
    </article>
  );
}
