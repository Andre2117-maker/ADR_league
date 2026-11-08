import React, { useState, useEffect, useMemo } from "react";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../../firebase";
import TrofeuImg from "../../../assets/trofeu.png";
import "./MataMata.css";

// Helper para identificar se o nome do time ainda é apenas um placeholder do chaveamento
const isPlaceholderTeam = (name) => {
  if (!name) return true;
  const n = String(name).trim();
  return (
    n === "" ||
    n.toLowerCase() === "a definir" ||
    n.startsWith("Vencedor ") ||
    /^[1-9]º\s+[A-Z]$/i.test(n)
  );
};

// Helper centralizado para calcular vencedor (suporta Gols, W/L e Pênaltis ex: "2(4)")
const calcularResultadoPlacar = (placarA, placarB) => {
  const sA = String(placarA ?? "")
    .trim()
    .toUpperCase();
  const sB = String(placarB ?? "")
    .trim()
    .toUpperCase();

  if (sA === "" && sB === "") {
    return { isWinnerA: false, isWinnerB: false, hasWinner: false };
  }

  if (sA === "W" || sB === "L") {
    return { isWinnerA: true, isWinnerB: false, hasWinner: true };
  }
  if (sB === "W" || sA === "L") {
    return { isWinnerA: false, isWinnerB: true, hasWinner: true };
  }

  const golsA = parseInt(sA, 10);
  const golsB = parseInt(sB, 10);

  if (!isNaN(golsA) && !isNaN(golsB)) {
    if (golsA > golsB) {
      return { isWinnerA: true, isWinnerB: false, hasWinner: true };
    }
    if (golsB > golsA) {
      return { isWinnerA: false, isWinnerB: true, hasWinner: true };
    }

    // Desempate por pênaltis entre parênteses: ex "1(4)" x "1(3)"
    const penMatchA = sA.match(/\((\d+)\)/);
    const penMatchB = sB.match(/\((\d+)\)/);
    const penA = penMatchA ? parseInt(penMatchA[1], 10) : 0;
    const penB = penMatchB ? parseInt(penMatchB[1], 10) : 0;

    if (penA > penB) {
      return { isWinnerA: true, isWinnerB: false, hasWinner: true };
    }
    if (penB > penA) {
      return { isWinnerA: false, isWinnerB: true, hasWinner: true };
    }
  }

  return { isWinnerA: false, isWinnerB: false, hasWinner: false };
};

/* ==========================================================================
   COMPONENTE DO CARD DE CONFRONTO (ESTILO SHARP / PEBARIANOS CUP)
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
  hoveredTeam,
  setHoveredTeam,
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

  // CORREÇÃO DE LÓGICA: Se o valor salvo no banco era só "Vencedor O1" ou "A definir",
  // ele dá lugar automaticamente ao time vencedor real assim que a fase anterior acaba!
  const savedTeamA = !isPlaceholderTeam(dadosSalvos.timeA)
    ? dadosSalvos.timeA
    : "";
  const savedTeamB = !isPlaceholderTeam(dadosSalvos.timeB)
    ? dadosSalvos.timeB
    : "";

  const finalTimeA = savedTeamA || (isFirstRound ? defaultA : timeSugeridoA);
  const finalTimeB = savedTeamB || (isFirstRound ? defaultB : timeSugeridoB);

  const [timeA, setTimeA] = useState(finalTimeA);
  const [timeB, setTimeB] = useState(finalTimeB);
  const [scoreA, setScoreA] = useState(dadosSalvos.placarA || "");
  const [scoreB, setScoreB] = useState(dadosSalvos.placarB || "");
  const [manualEdit, setManualEdit] = useState(false);

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

  // Verifica se há alterações não salvas no card
  const isDirty =
    String(scoreA).trim().toUpperCase() !==
      String(dadosSalvos.placarA || "")
        .trim()
        .toUpperCase() ||
    String(scoreB).trim().toUpperCase() !==
      String(dadosSalvos.placarB || "")
        .trim()
        .toUpperCase() ||
    timeA !== (dadosSalvos.timeA || finalTimeA) ||
    timeB !== (dadosSalvos.timeB || finalTimeB);

  const { isWinnerA, isWinnerB, hasWinner } = calcularResultadoPlacar(
    scoreA,
    scoreB,
  );

  const championName =
    isFinal && hasWinner ? (isWinnerA ? timeA : timeB) : null;

  // Binds de Teclado nos Inputs de Placar (Setas ↑/↓, W para W.O., Enter para Salvar)
  const handleScoreKeyDown = (e, side) => {
    const currentVal = side === "A" ? scoreA : scoreB;
    const setVal = side === "A" ? setScoreA : setScoreB;
    const setOtherVal = side === "A" ? setScoreB : setScoreA;

    if (e.key === "Enter") {
      e.preventDefault();
      salvarConfronto(fase, jogoId, timeA, timeB, scoreA, scoreB);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const num = parseInt(currentVal, 10);
      setVal(String(isNaN(num) ? 0 : num + 1));
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const num = parseInt(currentVal, 10);
      setVal(String(isNaN(num) ? 0 : Math.max(0, num - 1)));
      return;
    }

    // Bind rápida: Apertar "W" aplica W.O. a favor deste time automaticamente
    if ((e.key === "w" || e.key === "W") && !String(currentVal).includes("(")) {
      e.preventDefault();
      setVal("W");
      setOtherVal("L");
    }
  };

  // Bind Admin: Inverter Mandante (Time A <-> Time B)
  const handleSwapTeams = () => {
    const tempT = timeA;
    const tempS = scoreA;
    setTimeA(timeB);
    setTimeB(tempT);
    setScoreA(scoreB);
    setScoreB(tempS);
  };

  // Bind Admin: Limpar / Resetar Confronto
  const handleResetMatch = () => {
    if (!window.confirm("Zerar o placar deste confronto?")) return;
    const resetA = isFirstRound ? defaultA : timeSugeridoA;
    const resetB = isFirstRound ? defaultB : timeSugeridoB;
    setTimeA(resetA);
    setTimeB(resetB);
    setScoreA("");
    setScoreB("");
    salvarConfronto(fase, jogoId, resetA, resetB, "", "");
  };

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

  const canSelectTeam = isAdmin && (isFirstRound || manualEdit);
  const opcoesContainsA = classificadosDinamicos.some((c) => c.nome === timeA);
  const opcoesContainsB = classificadosDinamicos.some((c) => c.nome === timeB);

  const isTeamAHovered =
    hoveredTeam &&
    !isPlaceholderTeam(timeA) &&
    hoveredTeam.toLowerCase() === timeA.toLowerCase();
  const isTeamBHovered =
    hoveredTeam &&
    !isPlaceholderTeam(timeB) &&
    hoveredTeam.toLowerCase() === timeB.toLowerCase();

  return (
    <div
      className={`bkt-card ${isFinal ? "bkt-card-final" : ""} ${
        hasWinner ? "bkt-has-winner" : ""
      } ${isTeamAHovered || isTeamBHovered ? "bkt-card-highlighted" : ""} ${
        isDirty && isAdmin ? "bkt-card-dirty" : ""
      }`}
    >
      {/* CABEÇALHO DO CARD */}
      <div className="bkt-card-header">
        <div className="bkt-header-left">
          <span className="bkt-square-dot" />
          <span className="bkt-match-code">
            {tituloConfronto || `JOGO ${jogoId.toUpperCase()}`}
          </span>
        </div>

        <div className="bkt-header-right">
          {isAdmin && isDirty && (
            <span className="bkt-dirty-badge" title="Alterações não salvas">
              ● NÃO SALVO
            </span>
          )}
          {isAdmin && (
            <div className="bkt-quick-tools">
              {!isFirstRound && (
                <button
                  type="button"
                  className={`bkt-tool-btn ${manualEdit ? "active" : ""}`}
                  onClick={() => setManualEdit(!manualEdit)}
                  title="Alternar seleção manual de equipes nesta fase"
                >
                  ✎
                </button>
              )}
              <button
                type="button"
                className="bkt-tool-btn"
                onClick={handleSwapTeams}
                title="Inverter Equipes (Time A ⇄ Time B)"
              >
                ⇄
              </button>
              {hasWinner && (
                <button
                  type="button"
                  className="bkt-tool-btn bkt-tool-danger"
                  onClick={handleResetMatch}
                  title="Zerar Placar"
                >
                  ↺
                </button>
              )}
            </div>
          )}
          {hasWinner && <span className="bkt-status-dot" title="Finalizado" />}
        </div>
      </div>

      {/* CORPO DOS TIMES */}
      <div className="bkt-teams-body">
        {/* TIME A */}
        <div
          className={`bkt-team-row ${
            isWinnerA ? "is-winner" : isWinnerB ? "is-loser" : ""
          } ${isTeamAHovered ? "is-hovered-team" : ""}`}
          onMouseEnter={() =>
            !isPlaceholderTeam(timeA) && setHoveredTeam(timeA)
          }
          onMouseLeave={() => setHoveredTeam(null)}
        >
          <div className="bkt-team-info">
            <span className="bkt-team-indicator" />
            {canSelectTeam ? (
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
                  isPlaceholderTeam(timeA) ? "is-tbd" : ""
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
              title="Dica: Setas ↑/↓ ajustam gols | Tecla 'W' aplica W.O. | Enter salva"
              onKeyDown={(e) => handleScoreKeyDown(e, "A")}
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
          } ${isTeamBHovered ? "is-hovered-team" : ""}`}
          onMouseEnter={() =>
            !isPlaceholderTeam(timeB) && setHoveredTeam(timeB)
          }
          onMouseLeave={() => setHoveredTeam(null)}
        >
          <div className="bkt-team-info">
            <span className="bkt-team-indicator" />
            {canSelectTeam ? (
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
                  isPlaceholderTeam(timeB) ? "is-tbd" : ""
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
              title="Dica: Setas ↑/↓ ajustam gols | Tecla 'W' aplica W.O. | Enter salva"
              onKeyDown={(e) => handleScoreKeyDown(e, "B")}
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
          <span className="bkt-champ-label">
            ■ CAMPEÃO OFICIAL {selectedYear}
          </span>
          <strong className="bkt-champ-team">{championName}</strong>
        </div>
      )}

      {/* RODAPÉ DE AÇÕES (SÚMULA / LINKAR / SALVAR) */}
      {(dadosSalvos.linkedMatchId || isAdmin) && (
        <div className="bkt-card-footer">
          {dadosSalvos.linkedMatchId && (
            <button
              type="button"
              className="bkt-btn bkt-btn-details"
              onClick={() => navigate(`/match/${dadosSalvos.linkedMatchId}`)}
            >
              ■ VER DETALHES DA PARTIDA
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
                title="Vincular ID da partida para exibir súmula/detalhes"
              >
                🔗 {dadosSalvos.linkedMatchId ? "LINKADO" : "LINKAR"}
              </button>

              <button
                type="button"
                className={`bkt-btn bkt-btn-save ${isDirty ? "is-dirty" : ""}`}
                onClick={() =>
                  salvarConfronto(fase, jogoId, timeA, timeB, scoreA, scoreB)
                }
                disabled={loadingJogo === jogoId}
              >
                {loadingJogo === jogoId ? "SALVANDO..." : "✓ SALVAR"}
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
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirmLink();
              if (e.key === "Escape") setIsLinking(false);
            }}
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
  partidasMataMata = [],
  tabelaGrupos = {},
  loadData,
  isAdmin,
  configAtual,
}) {
  const [loadingJogo, setLoadingJogo] = useState(null);
  const [mobileRoundFilter, setMobileRoundFilter] = useState("ALL");
  const [hoveredTeam, setHoveredTeam] = useState(null);
  const navigate = useNavigate();

  const faseInicial = (
    configAtual?.faseInicialMataMata || "oitavas"
  ).toLowerCase();

  const showOitavas = faseInicial === "oitavas";
  const showQuartas = faseInicial === "oitavas" || faseInicial === "quartas";
  const showSemis =
    faseInicial === "oitavas" ||
    faseInicial === "quartas" ||
    faseInicial === "semifinal" ||
    faseInicial === "semis";
  const showFinal = true;

  const classificadosDinamicos = useMemo(() => {
    const lista = [];
    Object.keys(tabelaGrupos || {})
      .sort()
      .forEach((grupoKey) => {
        const timesDoGrupo = tabelaGrupos[grupoKey] || [];
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

    const cleanScoreA = String(sA || "")
      .trim()
      .toUpperCase();
    const cleanScoreB = String(sB || "")
      .trim()
      .toUpperCase();
    const { hasWinner } = calcularResultadoPlacar(cleanScoreA, cleanScoreB);

    try {
      await setDoc(
        doc(db, "partidas_campeonato", docId),
        {
          ano: String(selectedYear),
          fase: String(fase).toUpperCase(),
          jogoId: String(jogoId),
          timeA: String(tA || "A definir"),
          timeB: String(tB || "A definir"),
          placarA: cleanScoreA,
          placarB: cleanScoreB,
          // Só marca finalizado se houver placar válido definido
          finalizado: Boolean(
            hasWinner || (cleanScoreA !== "" && cleanScoreB !== ""),
          ),
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

  // Busca segura ignorando diferenças de número/string ou maiúsculas/minúsculas
  const getPartidaData = (fase, jogoId) => {
    const encontrada = partidasMataMata.find(
      (p) =>
        String(p.ano) === String(selectedYear) &&
        String(p.fase).toUpperCase() === String(fase).toUpperCase() &&
        String(p.jogoId).toLowerCase() === String(jogoId).toLowerCase(),
    );
    return encontrada || { timeA: "", timeB: "", placarA: "", placarB: "" };
  };

  const descobrirVencedor = (faseAnterior, jogoIdAnterior) => {
    const p = getPartidaData(faseAnterior, jogoIdAnterior);
    if (!p) return "";

    const { timeA, timeB, placarA, placarB } = p;
    if (isPlaceholderTeam(timeA) || isPlaceholderTeam(timeB)) return "";

    const { isWinnerA, isWinnerB } = calcularResultadoPlacar(placarA, placarB);
    if (isWinnerA) return timeA;
    if (isWinnerB) return timeB;

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
    hoveredTeam,
    setHoveredTeam,
  };

  const isPairActive = (fase, id1, id2) => {
    return Boolean(
      descobrirVencedor(fase, id1) || descobrirVencedor(fase, id2),
    );
  };

  return (
    <div className="bkt-outer-wrapper">
      {/* BARRA DE ATALHOS DO ADMIN */}
      {isAdmin && (
        <div className="bkt-admin-hint-bar">
          <span>
            <strong>ATALHOS ADMIN:</strong> Setas <kbd>↑</kbd> <kbd>↓</kbd>{" "}
            alteram gols • Tecla <kbd>W</kbd> aplica W.O. • <kbd>Enter</kbd>{" "}
            salva na hora • <kbd>⇄</kbd> inverte equipes
          </span>
        </div>
      )}

      {/* FILTRO RÁPIDO DE FASES PARA CELULAR */}
      <div className="bkt-mobile-nav">
        <button
          type="button"
          className={`bkt-mob-pill ${
            mobileRoundFilter === "ALL" ? "active" : ""
          }`}
          onClick={() => setMobileRoundFilter("ALL")}
        >
          <span className="bkt-pill-sq" /> CHAVE COMPLETA
        </button>
        {showOitavas && (
          <button
            type="button"
            className={`bkt-mob-pill ${
              mobileRoundFilter === "OITAVAS" ? "active" : ""
            }`}
            onClick={() => setMobileRoundFilter("OITAVAS")}
          >
            <span className="bkt-pill-sq" /> OITAVAS
          </button>
        )}
        {showQuartas && (
          <button
            type="button"
            className={`bkt-mob-pill ${
              mobileRoundFilter === "QUARTAS" ? "active" : ""
            }`}
            onClick={() => setMobileRoundFilter("QUARTAS")}
          >
            <span className="bkt-pill-sq" /> QUARTAS
          </button>
        )}
        {showSemis && (
          <button
            type="button"
            className={`bkt-mob-pill ${
              mobileRoundFilter === "SEMIS" ? "active" : ""
            }`}
            onClick={() => setMobileRoundFilter("SEMIS")}
          >
            <span className="bkt-pill-sq" /> SEMIS
          </button>
        )}
        <button
          type="button"
          className={`bkt-mob-pill ${
            mobileRoundFilter === "FINAL" ? "active" : ""
          }`}
          onClick={() => setMobileRoundFilter("FINAL")}
        >
          <span className="bkt-pill-sq" /> FINAL
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
                <span className="bkt-col-kicker">FASE ELIMINATÓRIA</span>
                <span className="bkt-col-title">OITAVAS DE FINAL</span>
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
                <span className="bkt-col-kicker">TOP 8 • MATA-MATA</span>
                <span className="bkt-col-title">QUARTAS DE FINAL</span>
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
                <span className="bkt-col-kicker">RUMO À TAÇA</span>
                <span className="bkt-col-title">SEMIFINAIS</span>
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
                    isFirstRound={
                      faseInicial === "semifinal" || faseInicial === "semis"
                    }
                  />
                  <MatchCardItem
                    {...sharedProps}
                    fase="SEMIS"
                    jogoId="s2"
                    defaultA="Vencedor Q3"
                    defaultB="Vencedor Q4"
                    jogoAnteriorA={{ fase: "QUARTAS", jogoId: "q3" }}
                    jogoAnteriorB={{ fase: "QUARTAS", jogoId: "q4" }}
                    isFirstRound={
                      faseInicial === "semifinal" || faseInicial === "semis"
                    }
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
                <span className="bkt-col-kicker">DECISÃO DO TÍTULO</span>
                <span className="bkt-col-title">GRANDE FINAL</span>
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
                    tituloConfronto="GRANDE FINAL"
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
