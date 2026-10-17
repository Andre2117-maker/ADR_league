import React, { useState, useEffect, useMemo } from "react";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../../firebase";
import TrofeuImg from "../../../assets/trofeu.png";
import "./MataMata.css";

/* ==========================================================================
   COMPONENTE DO CARD DE CONFRONTO (ISOLADO PARA ALTA PERFORMANCE)
   ========================================================================== */
function MatchCardItem({
  fase,
  jogoId,
  tituloConfronto,
  defaultA,
  defaultB,
  isFirstRound = false,
  isFinal = false,
  jogoAnteriorA = null,
  jogoAnteriorB = null,
  selectedYear,
  isAdmin,
  classificadosDinamicos,
  getPartidaData,
  descobrirVencedor,
  salvarConfronto,
  loadData,
  loadingJogo,
  navigate,
}) {
  const dadosSalvos = getPartidaData(fase, jogoId);

  let timeSugeridoA = defaultA;
  let timeSugeridoB = defaultB;

  if (!isFirstRound) {
    if (jogoAnteriorA) {
      const vA = descobrirVencedor(jogoAnteriorA.fase, jogoAnteriorA.jogoId);
      if (vA) timeSugeridoA = vA;
    }
    if (jogoAnteriorB) {
      const vB = descobrirVencedor(jogoAnteriorB.fase, jogoAnteriorB.jogoId);
      if (vB) timeSugeridoB = vB;
    }
  }

  const finalTimeA =
    dadosSalvos.timeA || (isFirstRound ? defaultA : timeSugeridoA);
  const finalTimeB =
    dadosSalvos.timeB || (isFirstRound ? defaultB : timeSugeridoB);

  const [timeA, setTimeA] = useState(finalTimeA);
  const [timeB, setTimeB] = useState(finalTimeB);
  const [scoreA, setScoreA] = useState(dadosSalvos.placarA || "");
  const [scoreB, setScoreB] = useState(dadosSalvos.placarB || "");

  // Estados da gaveta inline de Linkar Partida
  const [isLinking, setIsLinking] = useState(false);
  const [linkInput, setLinkInput] = useState(dadosSalvos.linkedMatchId || "");

  useEffect(() => {
    setTimeA(finalTimeA);
    setTimeB(finalTimeB);
    setScoreA(dadosSalvos.placarA || "");
    setScoreB(dadosSalvos.placarB || "");
    setLinkInput(dadosSalvos.linkedMatchId || "");
  }, [
    finalTimeA,
    finalTimeB,
    dadosSalvos.placarA,
    dadosSalvos.placarB,
    dadosSalvos.linkedMatchId,
  ]);

  // Cálculo do Vencedor (Suporta Gols, W/L e Pênaltis ex: "2(3)")
  let isWinnerA = false;
  let isWinnerB = false;

  const sA = String(scoreA).trim().toUpperCase();
  const sB = String(scoreB).trim().toUpperCase();

  if (sA !== "" || sB !== "") {
    if (sA === "W" || sB === "L") isWinnerA = true;
    else if (sB === "W" || sA === "L") isWinnerB = true;
    else {
      const golsA = parseInt(sA, 10);
      const golsB = parseInt(sB, 10);
      if (!isNaN(golsA) && !isNaN(golsB)) {
        if (golsA > golsB) isWinnerA = true;
        else if (golsB > golsA) isWinnerB = true;
        else {
          const penA = sA.includes("(") ? parseInt(sA.split("(")[1], 10) : 0;
          const penB = sB.includes("(") ? parseInt(sB.split("(")[1], 10) : 0;
          if (penA > penB) isWinnerA = true;
          if (penB > penA) isWinnerB = true;
        }
      }
    }
  }

  const hasWinner = isWinnerA || isWinnerB;
  const championName = isFinal
    ? isWinnerA
      ? timeA
      : isWinnerB
        ? timeB
        : null
    : null;

  const handleConfirmLink = async () => {
    let extractedId = linkInput.trim();
    if (extractedId.includes("/") || extractedId.includes("http")) {
      const parts = extractedId.split("/").filter(Boolean);
      extractedId = parts[parts.length - 1];
    }

    const docId = `${selectedYear}_${fase}_${jogoId}`
      .replace(/\s+/g, "")
      .toUpperCase();

    try {
      await setDoc(
        doc(db, "partidas_campeonato", docId),
        {
          ano: String(selectedYear),
          fase: fase.toUpperCase(),
          jogoId: String(jogoId),
          timeA: String(timeA || "A definir"),
          timeB: String(timeB || "A definir"),
          linkedMatchId: extractedId || null,
        },
        { merge: true },
      );

      setIsLinking(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao linkar:", error);
      alert("Erro ao linkar a partida no banco de dados.");
    }
  };

  // Garante que o time salvo apareça no select mesmo se não estiver na lista padrão
  const opcoesContainsA = classificadosDinamicos.some((c) => c.nome === timeA);
  const opcoesContainsB = classificadosDinamicos.some((c) => c.nome === timeB);

  return (
    <div
      className={`bkt-card ${isFinal ? "bkt-card-final" : ""} ${
        hasWinner ? "bkt-has-winner" : ""
      }`}
    >
      {/* CABEÇALHO DO CARD */}
      <div className="bkt-card-header">
        <span className="bkt-match-code">
          {tituloConfronto || `CONFRONTO ${jogoId.toUpperCase()}`}
        </span>
        {hasWinner && <span className="bkt-status-dot" title="Concluído" />}
      </div>

      {/* CORPO DOS TIMES */}
      <div className="bkt-teams-body">
        {/* TIME A */}
        <div
          className={`bkt-team-row ${
            isWinnerA ? "is-winner" : isWinnerB ? "is-loser" : ""
          }`}
        >
          <div className="bkt-team-info">
            <span className="bkt-team-indicator"></span>
            {isAdmin && isFirstRound ? (
              <select
                className="bkt-team-select"
                value={timeA}
                onChange={(e) => setTimeA(e.target.value)}
              >
                <option value="">Definir Equipe A...</option>
                {classificadosDinamicos.map((c, i) => (
                  <option key={i} value={c.nome}>
                    {c.rotulo}
                  </option>
                ))}
                {!opcoesContainsA && timeA && (
                  <option value={timeA}>{timeA}</option>
                )}
              </select>
            ) : (
              <span
                className={`bkt-team-name ${
                  !timeA || timeA.includes("Vencedor") || timeA.includes("º")
                    ? "is-tbd"
                    : ""
                }`}
                title={timeA || "A definir"}
              >
                {timeA || "A definir"}
              </span>
            )}
          </div>

          {isAdmin ? (
            <input
              className={`bkt-score-input ${
                isWinnerA ? "score-win" : isWinnerB ? "score-lose" : ""
              }`}
              value={scoreA}
              onChange={(e) => setScoreA(e.target.value)}
              placeholder="-"
              maxLength="8"
              onKeyDown={(e) =>
                e.key === "Enter" &&
                salvarConfronto(fase, jogoId, timeA, timeB, scoreA, scoreB)
              }
            />
          ) : (
            <span
              className={`bkt-score-pill ${
                isWinnerA ? "score-win" : isWinnerB ? "score-lose" : ""
              }`}
            >
              {scoreA !== "" ? scoreA : "—"}
            </span>
          )}
        </div>

        {/* TIME B */}
        <div
          className={`bkt-team-row ${
            isWinnerB ? "is-winner" : isWinnerA ? "is-loser" : ""
          }`}
        >
          <div className="bkt-team-info">
            <span className="bkt-team-indicator"></span>
            {isAdmin && isFirstRound ? (
              <select
                className="bkt-team-select"
                value={timeB}
                onChange={(e) => setTimeB(e.target.value)}
              >
                <option value="">Definir Equipe B...</option>
                {classificadosDinamicos.map((c, i) => (
                  <option key={i} value={c.nome}>
                    {c.rotulo}
                  </option>
                ))}
                {!opcoesContainsB && timeB && (
                  <option value={timeB}>{timeB}</option>
                )}
              </select>
            ) : (
              <span
                className={`bkt-team-name ${
                  !timeB || timeB.includes("Vencedor") || timeB.includes("º")
                    ? "is-tbd"
                    : ""
                }`}
                title={timeB || "A definir"}
              >
                {timeB || "A definir"}
              </span>
            )}
          </div>

          {isAdmin ? (
            <input
              className={`bkt-score-input ${
                isWinnerB ? "score-win" : isWinnerA ? "score-lose" : ""
              }`}
              value={scoreB}
              onChange={(e) => setScoreB(e.target.value)}
              placeholder="-"
              maxLength="8"
              onKeyDown={(e) =>
                e.key === "Enter" &&
                salvarConfronto(fase, jogoId, timeA, timeB, scoreA, scoreB)
              }
            />
          ) : (
            <span
              className={`bkt-score-pill ${
                isWinnerB ? "score-win" : isWinnerA ? "score-lose" : ""
              }`}
            >
              {scoreB !== "" ? scoreB : "—"}
            </span>
          )}
        </div>
      </div>

      {/* BANNER DE CAMPEÃO (Aparece na Final quando há vencedor) */}
      {isFinal && championName && (
        <div className="bkt-champion-banner">
          <span className="bkt-champ-label">🏆 CAMPEÃO {selectedYear}</span>
          <strong className="bkt-champ-team">{championName}</strong>
        </div>
      )}

      {/* RODAPÉ DE AÇÕES (VER MAIS / LINKAR / SALVAR) */}
      {(dadosSalvos.linkedMatchId || isAdmin) && (
        <div className="bkt-card-footer">
          {dadosSalvos.linkedMatchId && (
            <button
              type="button"
              className="bkt-btn bkt-btn-details"
              onClick={() => navigate(`/match/${dadosSalvos.linkedMatchId}`)}
            >
              VER MAIS
            </button>
          )}

          {isAdmin && (
            <div className="bkt-admin-controls">
              <button
                type="button"
                className={`bkt-btn bkt-btn-link ${
                  dadosSalvos.linkedMatchId ? "has-link" : ""
                } ${isLinking ? "active" : ""}`}
                onClick={() => setIsLinking(!isLinking)}
                title="Linkar com partida oficial do calendário"
              >
                🔗 {dadosSalvos.linkedMatchId ? "Linkado" : "Linkar"}
              </button>

              <button
                type="button"
                className="bkt-btn bkt-btn-save"
                onClick={() =>
                  salvarConfronto(fase, jogoId, timeA, timeB, scoreA, scoreB)
                }
                disabled={loadingJogo === jogoId}
              >
                {loadingJogo === jogoId ? "⏳" : "✓ Salvar"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* GAVETA INLINE DE LINKAR PARTIDA */}
      {isAdmin && isLinking && (
        <div className="bkt-link-drawer">
          <input
            type="text"
            className="bkt-link-input"
            placeholder="Cole o ID ou URL da partida..."
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleConfirmLink()}
          />
          <div className="bkt-link-drawer-actions">
            <button
              type="button"
              className="bkt-drawer-ok"
              onClick={handleConfirmLink}
            >
              OK
            </button>
            <button
              type="button"
              className="bkt-drawer-cancel"
              onClick={() => setIsLinking(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   COMPONENTE PRINCIPAL DO MATA-MATA (CHAVEAMENTO)
   ========================================================================== */
export default function MataMata({
  selectedYear,
  partidasMataMata,
  tabelaGrupos,
  loadData,
  isAdmin,
  configAtual,
}) {
  const [loadingJogo, setLoadingJogo] = useState(null);
  const [mobileRoundFilter, setMobileRoundFilter] = useState("ALL");
  const navigate = useNavigate();

  const faseInicial = configAtual?.faseInicialMataMata || "oitavas";

  const showOitavas = faseInicial === "oitavas";
  const showQuartas = faseInicial === "oitavas" || faseInicial === "quartas";
  const showSemis =
    faseInicial === "oitavas" ||
    faseInicial === "quartas" ||
    faseInicial === "semifinal";
  const showFinal = true;

  const classificadosDinamicos = useMemo(() => {
    const lista = [];
    Object.keys(tabelaGrupos)
      .sort()
      .forEach((grupoKey) => {
        const timesDoGrupo = tabelaGrupos[grupoKey];
        timesDoGrupo.forEach((time, index) => {
          lista.push({
            posicao: index + 1,
            grupo: grupoKey,
            nome: time.nome,
            rotulo: `${index + 1}º Grupo ${grupoKey} — ${time.nome}`,
          });
        });
      });
    return lista;
  }, [tabelaGrupos]);

  const salvarConfronto = async (fase, jogoId, tA, tB, sA, sB) => {
    if (!isAdmin) return;
    setLoadingJogo(jogoId);

    const docId = `${selectedYear}_${fase}_${jogoId}`
      .replace(/\s+/g, "")
      .toUpperCase();

    try {
      await setDoc(
        doc(db, "partidas_campeonato", docId),
        {
          ano: String(selectedYear),
          fase: fase.toUpperCase(),
          jogoId: String(jogoId),
          timeA: String(tA || "A definir"),
          timeB: String(tB || "A definir"),
          placarA: String(sA || "")
            .trim()
            .toUpperCase(),
          placarB: String(sB || "")
            .trim()
            .toUpperCase(),
          finalizado: true,
        },
        { merge: true },
      );

      await loadData();
    } catch (error) {
      console.error("ERRO AO SALVAR NO FIREBASE:", error);
      alert("Erro ao salvar confronto.");
    } finally {
      setLoadingJogo(null);
    }
  };

  const getPartidaData = (fase, jogoId) => {
    const encontrada = partidasMataMata.find(
      (p) => p.ano === selectedYear && p.fase === fase && p.jogoId === jogoId,
    );
    return encontrada || { timeA: "", timeB: "", placarA: "", placarB: "" };
  };

  const descobrirVencedor = (faseAnterior, jogoIdAnterior) => {
    const p = partidasMataMata.find(
      (item) =>
        item.ano === selectedYear &&
        item.fase === faseAnterior &&
        item.jogoId === jogoIdAnterior,
    );
    if (!p || !p.finalizado) return "";

    const { timeA, timeB, placarA, placarB } = p;
    if (!timeA || !timeB || timeA === "A definir" || timeB === "A definir")
      return "";

    const sA = String(placarA).trim().toUpperCase();
    const sB = String(placarB).trim().toUpperCase();

    if (sA === "W" || sB === "L") return timeA;
    if (sB === "W" || sA === "L") return timeB;

    const golsA = parseInt(sA, 10) || 0;
    const golsB = parseInt(sB, 10) || 0;

    if (golsA > golsB) return timeA;
    if (golsB > golsA) return timeB;

    const penA = sA.includes("(") ? parseInt(sA.split("(")[1], 10) : 0;
    const penB = sB.includes("(") ? parseInt(sB.split("(")[1], 10) : 0;

    if (penA > penB) return timeA;
    if (penB > penA) return timeB;

    return "";
  };

  const sharedProps = {
    selectedYear,
    isAdmin,
    classificadosDinamicos,
    getPartidaData,
    descobrirVencedor,
    salvarConfronto,
    loadData,
    loadingJogo,
    navigate,
  };

  // Verifica se um par de jogos já tem vencedores para acender a linha conectora
  const isPairActive = (fase, id1, id2) => {
    return Boolean(
      descobrirVencedor(fase, id1) || descobrirVencedor(fase, id2),
    );
  };

  return (
    <div className="bkt-outer-wrapper">
      {/* FILTRO RÁPIDO DE FASES PARA CELULAR */}
      <div className="bkt-mobile-nav">
        <button
          className={`bkt-mob-pill ${mobileRoundFilter === "ALL" ? "active" : ""}`}
          onClick={() => setMobileRoundFilter("ALL")}
        >
          Chave Completa
        </button>
        {showOitavas && (
          <button
            className={`bkt-mob-pill ${
              mobileRoundFilter === "OITAVAS" ? "active" : ""
            }`}
            onClick={() => setMobileRoundFilter("OITAVAS")}
          >
            Oitavas
          </button>
        )}
        {showQuartas && (
          <button
            className={`bkt-mob-pill ${
              mobileRoundFilter === "QUARTAS" ? "active" : ""
            }`}
            onClick={() => setMobileRoundFilter("QUARTAS")}
          >
            Quartas
          </button>
        )}
        {showSemis && (
          <button
            className={`bkt-mob-pill ${
              mobileRoundFilter === "SEMIS" ? "active" : ""
            }`}
            onClick={() => setMobileRoundFilter("SEMIS")}
          >
            Semis
          </button>
        )}
        <button
          className={`bkt-mob-pill ${
            mobileRoundFilter === "FINAL" ? "active" : ""
          }`}
          onClick={() => setMobileRoundFilter("FINAL")}
        >
          🏆 Final
        </button>
      </div>

      {/* ÁRVORE DO CHAVEAMENTO */}
      <div
        className={`bkt-tree-scroll ${
          mobileRoundFilter !== "ALL" ? "is-filtered-mobile" : ""
        }`}
      >
        <div className="bkt-tree-board">
          {/* ==================== COLUNA 1: OITAVAS ==================== */}
          {showOitavas && (
            <div
              className={`bkt-round-col has-next-col ${
                mobileRoundFilter !== "ALL" && mobileRoundFilter !== "OITAVAS"
                  ? "mob-hidden"
                  : ""
              }`}
            >
              <div className="bkt-col-header">
                <span className="bkt-col-title">OITAVAS DE FINAL</span>
                <span className="bkt-col-sub">
                  {classificadosDinamicos.length} equipes classificadas
                </span>
              </div>

              <div className="bkt-col-body">
                <div
                  className={`bkt-pair ${
                    isPairActive("OITAVAS", "o1", "o2") ? "pair-active" : ""
                  }`}
                >
                  <MatchCardItem
                    {...sharedProps}
                    fase="OITAVAS"
                    jogoId="o1"
                    defaultA="1º A"
                    defaultB="3º B"
                    isFirstRound={faseInicial === "oitavas"}
                  />
                  <MatchCardItem
                    {...sharedProps}
                    fase="OITAVAS"
                    jogoId="o2"
                    defaultA="1º B"
                    defaultB="3º C"
                    isFirstRound={faseInicial === "oitavas"}
                  />
                </div>

                <div
                  className={`bkt-pair ${
                    isPairActive("OITAVAS", "o3", "o4") ? "pair-active" : ""
                  }`}
                >
                  <MatchCardItem
                    {...sharedProps}
                    fase="OITAVAS"
                    jogoId="o3"
                    defaultA="1º C"
                    defaultB="3º D"
                    isFirstRound={faseInicial === "oitavas"}
                  />
                  <MatchCardItem
                    {...sharedProps}
                    fase="OITAVAS"
                    jogoId="o4"
                    defaultA="1º D"
                    defaultB="3º E"
                    isFirstRound={faseInicial === "oitavas"}
                  />
                </div>

                <div
                  className={`bkt-pair ${
                    isPairActive("OITAVAS", "o5", "o6") ? "pair-active" : ""
                  }`}
                >
                  <MatchCardItem
                    {...sharedProps}
                    fase="OITAVAS"
                    jogoId="o5"
                    defaultA="1º E"
                    defaultB="3º F"
                    isFirstRound={faseInicial === "oitavas"}
                  />
                  <MatchCardItem
                    {...sharedProps}
                    fase="OITAVAS"
                    jogoId="o6"
                    defaultA="1º F"
                    defaultB="3º A"
                    isFirstRound={faseInicial === "oitavas"}
                  />
                </div>

                <div
                  className={`bkt-pair ${
                    isPairActive("OITAVAS", "o7", "o8") ? "pair-active" : ""
                  }`}
                >
                  <MatchCardItem
                    {...sharedProps}
                    fase="OITAVAS"
                    jogoId="o7"
                    defaultA="2º A"
                    defaultB="2º B"
                    isFirstRound={faseInicial === "oitavas"}
                  />
                  <MatchCardItem
                    {...sharedProps}
                    fase="OITAVAS"
                    jogoId="o8"
                    defaultA="2º C"
                    defaultB="2º D"
                    isFirstRound={faseInicial === "oitavas"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================== COLUNA 2: QUARTAS ==================== */}
          {showQuartas && (
            <div
              className={`bkt-round-col has-next-col ${
                showOitavas ? "has-prev-col" : ""
              } ${
                mobileRoundFilter !== "ALL" && mobileRoundFilter !== "QUARTAS"
                  ? "mob-hidden"
                  : ""
              }`}
            >
              <div className="bkt-col-header">
                <span className="bkt-col-title">QUARTAS DE FINAL</span>
                <span className="bkt-col-sub">Fase Eliminatória</span>
              </div>

              <div className="bkt-col-body">
                <div
                  className={`bkt-pair ${
                    isPairActive("QUARTAS", "q1", "q2") ? "pair-active" : ""
                  }`}
                >
                  <MatchCardItem
                    {...sharedProps}
                    fase="QUARTAS"
                    jogoId="q1"
                    defaultA="Vencedor O1"
                    defaultB="Vencedor O2"
                    jogoAnteriorA={{ fase: "OITAVAS", jogoId: "o1" }}
                    jogoAnteriorB={{ fase: "OITAVAS", jogoId: "o2" }}
                    isFirstRound={faseInicial === "quartas"}
                  />
                  <MatchCardItem
                    {...sharedProps}
                    fase="QUARTAS"
                    jogoId="q2"
                    defaultA="Vencedor O3"
                    defaultB="Vencedor O4"
                    jogoAnteriorA={{ fase: "OITAVAS", jogoId: "o3" }}
                    jogoAnteriorB={{ fase: "OITAVAS", jogoId: "o4" }}
                    isFirstRound={faseInicial === "quartas"}
                  />
                </div>

                <div
                  className={`bkt-pair ${
                    isPairActive("QUARTAS", "q3", "q4") ? "pair-active" : ""
                  }`}
                >
                  <MatchCardItem
                    {...sharedProps}
                    fase="QUARTAS"
                    jogoId="q3"
                    defaultA="Vencedor O5"
                    defaultB="Vencedor O6"
                    jogoAnteriorA={{ fase: "OITAVAS", jogoId: "o5" }}
                    jogoAnteriorB={{ fase: "OITAVAS", jogoId: "o6" }}
                    isFirstRound={faseInicial === "quartas"}
                  />
                  <MatchCardItem
                    {...sharedProps}
                    fase="QUARTAS"
                    jogoId="q4"
                    defaultA="Vencedor O7"
                    defaultB="Vencedor O8"
                    jogoAnteriorA={{ fase: "OITAVAS", jogoId: "o7" }}
                    jogoAnteriorB={{ fase: "OITAVAS", jogoId: "o8" }}
                    isFirstRound={faseInicial === "quartas"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================== COLUNA 3: SEMIFINAIS ==================== */}
          {showSemis && (
            <div
              className={`bkt-round-col has-next-col ${
                showQuartas ? "has-prev-col" : ""
              } ${
                mobileRoundFilter !== "ALL" && mobileRoundFilter !== "SEMIS"
                  ? "mob-hidden"
                  : ""
              }`}
            >
              <div className="bkt-col-header">
                <span className="bkt-col-title">SEMIFINAIS</span>
                <span className="bkt-col-sub">Rumo à Decisão</span>
              </div>

              <div className="bkt-col-body">
                <div
                  className={`bkt-pair ${
                    isPairActive("SEMIS", "s1", "s2") ? "pair-active" : ""
                  }`}
                >
                  <MatchCardItem
                    {...sharedProps}
                    fase="SEMIS"
                    jogoId="s1"
                    defaultA="Vencedor Q1"
                    defaultB="Vencedor Q2"
                    jogoAnteriorA={{ fase: "QUARTAS", jogoId: "q1" }}
                    jogoAnteriorB={{ fase: "QUARTAS", jogoId: "q2" }}
                    isFirstRound={faseInicial === "semifinal"}
                  />
                  <MatchCardItem
                    {...sharedProps}
                    fase="SEMIS"
                    jogoId="s2"
                    defaultA="Vencedor Q3"
                    defaultB="Vencedor Q4"
                    jogoAnteriorA={{ fase: "QUARTAS", jogoId: "q3" }}
                    jogoAnteriorB={{ fase: "QUARTAS", jogoId: "q4" }}
                    isFirstRound={faseInicial === "semifinal"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================== COLUNA 4: GRANDE FINAL ==================== */}
          {showFinal && (
            <div
              className={`bkt-round-col bkt-col-final ${
                showSemis ? "has-prev-col" : ""
              } ${
                mobileRoundFilter !== "ALL" && mobileRoundFilter !== "FINAL"
                  ? "mob-hidden"
                  : ""
              }`}
            >
              <div className="bkt-col-header bkt-header-final">
                <span className="bkt-col-title">GRANDE FINAL</span>
                <span className="bkt-col-sub">Decisão do Título</span>
              </div>

              <div className="bkt-col-body">
                <div className="bkt-final-showcase">
                  <div className="bkt-trophy-pedestal">
                    <img
                      src={TrofeuImg}
                      alt="Troféu"
                      className="bkt-trophy-img"
                    />
                  </div>

                  <MatchCardItem
                    {...sharedProps}
                    fase="FINAL"
                    jogoId="final"
                    tituloConfronto="CONFRONTO FINAL"
                    defaultA="Vencedor S1"
                    defaultB="Vencedor S2"
                    jogoAnteriorA={{ fase: "SEMIS", jogoId: "s1" }}
                    jogoAnteriorB={{ fase: "SEMIS", jogoId: "s2" }}
                    isFirstRound={faseInicial === "final"}
                    isFinal={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
