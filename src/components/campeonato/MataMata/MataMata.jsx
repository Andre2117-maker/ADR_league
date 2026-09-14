import React, { useState, useMemo } from "react";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../../firebase";
import "./MataMata.css";

export default function MataMata({
  selectedYear,
  partidasMataMata,
  tabelaGrupos,
  loadData,
  isAdmin,
  configAtual,
}) {
  const [loadingJogo, setLoadingJogo] = useState(null);
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
    Object.keys(tabelaGrupos).forEach((grupoKey) => {
      const timesDoGrupo = tabelaGrupos[grupoKey];
      timesDoGrupo.forEach((time, index) => {
        lista.push({
          posicao: index + 1,
          grupo: grupoKey,
          nome: time.nome,
          rotulo: `${index + 1}º ${grupoKey} (${time.nome})`,
        });
      });
    });
    return lista;
  }, [tabelaGrupos]);

  const salvarConfronto = async (fase, jogoId, tA, tB, sA, sB) => {
    if (!isAdmin) {
      alert("Acesso negado. Apenas administradores podem alterar o mata-mata.");
      return;
    }

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
          placarA: String(sA || "").toUpperCase(),
          placarB: String(sB || "").toUpperCase(),
          finalizado: true,
        },
        { merge: true },
      );

      await loadData();
    } catch (error) {
      console.error("ERRO AO SALVAR NO FIREBASE:", error);
      alert("Erro ao salvar.");
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

    if (placarA === "W" || placarB === "L") return timeA;
    if (placarB === "W" || placarA === "L") return timeB;

    const golsA = parseInt(placarA) || 0;
    const golsB = parseInt(placarB) || 0;

    if (golsA > golsB) return timeA;
    if (golsB > golsA) return timeB;

    const penA =
      placarA && placarA.includes("(") ? parseInt(placarA.split("(")[1]) : 0;
    const penB =
      placarB && placarB.includes("(") ? parseInt(placarB.split("(")[1]) : 0;

    if (penA > penB) return timeA;
    if (penB > penA) return timeB;

    return "";
  };

  const MatchCardItem = ({
    fase,
    jogoId,
    defaultA,
    defaultB,
    isFirstRound = false,
    jogoAnteriorA = null,
    jogoAnteriorB = null,
  }) => {
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

    let isWinnerA = false;
    let isWinnerB = false;

    if (scoreA || scoreB) {
      if (scoreA === "W" || scoreB === "L") isWinnerA = true;
      else if (scoreB === "W" || scoreA === "L") isWinnerB = true;
      else {
        const golsA = parseInt(scoreA) || 0;
        const golsB = parseInt(scoreB) || 0;
        if (golsA > golsB) isWinnerA = true;
        else if (golsB > golsA) isWinnerB = true;
        else {
          const penA = scoreA.includes("(")
            ? parseInt(scoreA.split("(")[1])
            : 0;
          const penB = scoreB.includes("(")
            ? parseInt(scoreB.split("(")[1])
            : 0;
          if (penA > penB) isWinnerA = true;
          if (penB > penA) isWinnerB = true;
        }
      }
    }

    React.useEffect(() => {
      setTimeA(finalTimeA);
      setTimeB(finalTimeB);
      setScoreA(dadosSalvos.placarA || "");
      setScoreB(dadosSalvos.placarB || "");
    }, [finalTimeA, finalTimeB, dadosSalvos.placarA, dadosSalvos.placarB]);

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
            linkedMatchId: extractedId,
          },
          { merge: true },
        );

        alert("🔗 Partida linkada com sucesso!");
        await loadData();
      } catch (error) {
        console.error("Erro ao linkar:", error);
        alert("Erro ao linkar a partida no banco de dados.");
      }
    };

    return (
      <div className="bracket-match">
        <div className="bracket-date">Confronto {jogoId.toUpperCase()}</div>

        <div className="bracket-team">
          {isAdmin && isFirstRound ? (
            <select
              className="bracket-team-select"
              value={timeA}
              onChange={(e) => setTimeA(e.target.value)}
            >
              <option value="">Selecione o Time A</option>
              {classificadosDinamicos.map((c, i) => (
                <option key={i} value={c.nome}>
                  {c.rotulo}
                </option>
              ))}
              <option value={timeA}>{timeA}</option>
            </select>
          ) : (
            <span
              className={`bracket-team-label ${isWinnerA ? "winner" : isWinnerB ? "loser" : ""}`}
            >
              {timeA || "A definir"}
            </span>
          )}

          <input
            className={`bracket-score-input ${isWinnerA ? "winner" : isWinnerB ? "loser" : ""}`}
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
            placeholder="W/L"
            maxLength="10"
            disabled={!isAdmin}
          />
        </div>

        <div className="bracket-team">
          {isAdmin && isFirstRound ? (
            <select
              className="bracket-team-select"
              value={timeB}
              onChange={(e) => setTimeB(e.target.value)}
            >
              <option value="">Selecione o Time B</option>
              {classificadosDinamicos.map((c, i) => (
                <option key={i} value={c.nome}>
                  {c.rotulo}
                </option>
              ))}
              <option value={timeB}>{timeB}</option>
            </select>
          ) : (
            <span
              className={`bracket-team-label ${isWinnerB ? "winner" : isWinnerA ? "loser" : ""}`}
            >
              {timeB || "A definir"}
            </span>
          )}

          <input
            className={`bracket-score-input ${isWinnerB ? "winner" : isWinnerA ? "loser" : ""}`}
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
            placeholder="W/L"
            maxLength="10"
            disabled={!isAdmin}
          />
        </div>

        {isAdmin && (
          <button
            className="bracket-save-btn"
            onClick={() =>
              salvarConfronto(fase, jogoId, timeA, timeB, scoreA, scoreB)
            }
            disabled={loadingJogo === jogoId}
          >
            {loadingJogo === jogoId ? "⏳" : "💾 Salvar"}
          </button>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            marginTop: "10px",
          }}
        >
          {dadosSalvos.linkedMatchId && (
            <button
              className="btn-match-center"
              onClick={() => navigate(`/match/${dadosSalvos.linkedMatchId}`)}
              style={{ fontSize: "0.7rem", padding: "4px 8px" }}
            >
              Ver mais
            </button>
          )}

          {isAdmin && (
            <button
              className="btn-link-match"
              onClick={handleLinkMatch}
              title="Linkar com a partida oficial do calendário"
              style={{ fontSize: "0.7rem", padding: "4px 8px" }}
            >
              🔗 Linkar Partida
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="camp-bracket-container">
      {showOitavas && (
        <div className="bracket-column">
          <h3 className="bracket-round-title">Oitavas de Final</h3>
          <div className="bracket-matches-wrapper">
            <div
              style={{
                color: "#aaa",
                fontSize: "0.8rem",
                textAlign: "center",
                marginBottom: "5px",
              }}
            >
              {classificadosDinamicos.length} times apurados
            </div>
            <MatchCardItem
              fase="OITAVAS"
              jogoId="o1"
              defaultA="1º A"
              defaultB="3º B"
              isFirstRound={faseInicial === "oitavas"}
            />
            <MatchCardItem
              fase="OITAVAS"
              jogoId="o2"
              defaultA="1º B"
              defaultB="3º C"
              isFirstRound={faseInicial === "oitavas"}
            />
            <MatchCardItem
              fase="OITAVAS"
              jogoId="o3"
              defaultA="1º C"
              defaultB="3º D"
              isFirstRound={faseInicial === "oitavas"}
            />
            <MatchCardItem
              fase="OITAVAS"
              jogoId="o4"
              defaultA="1º D"
              defaultB="3º E"
              isFirstRound={faseInicial === "oitavas"}
            />
            <MatchCardItem
              fase="OITAVAS"
              jogoId="o5"
              defaultA="1º E"
              defaultB="3º F"
              isFirstRound={faseInicial === "oitavas"}
            />
            <MatchCardItem
              fase="OITAVAS"
              jogoId="o6"
              defaultA="1º F"
              defaultB="3º A"
              isFirstRound={faseInicial === "oitavas"}
            />
            <MatchCardItem
              fase="OITAVAS"
              jogoId="o7"
              defaultA="2º A"
              defaultB="2º B"
              isFirstRound={faseInicial === "oitavas"}
            />
            <MatchCardItem
              fase="OITAVAS"
              jogoId="o8"
              defaultA="2º C"
              defaultB="2º D"
              isFirstRound={faseInicial === "oitavas"}
            />
          </div>
        </div>
      )}

      {showQuartas && (
        <div className="bracket-column">
          <h3 className="bracket-round-title">Quartas de Final</h3>
          <div className="bracket-matches-wrapper">
            <MatchCardItem
              fase="QUARTAS"
              jogoId="q1"
              defaultA="Vencedor O1"
              defaultB="Vencedor O2"
              jogoAnteriorA={{ fase: "OITAVAS", jogoId: "o1" }}
              jogoAnteriorB={{ fase: "OITAVAS", jogoId: "o2" }}
              isFirstRound={faseInicial === "quartas"}
            />
            <MatchCardItem
              fase="QUARTAS"
              jogoId="q2"
              defaultA="Vencedor O3"
              defaultB="Vencedor O4"
              jogoAnteriorA={{ fase: "OITAVAS", jogoId: "o3" }}
              jogoAnteriorB={{ fase: "OITAVAS", jogoId: "o4" }}
              isFirstRound={faseInicial === "quartas"}
            />
            <MatchCardItem
              fase="QUARTAS"
              jogoId="q3"
              defaultA="Vencedor O5"
              defaultB="Vencedor O6"
              jogoAnteriorA={{ fase: "OITAVAS", jogoId: "o5" }}
              jogoAnteriorB={{ fase: "OITAVAS", jogoId: "o6" }}
              isFirstRound={faseInicial === "quartas"}
            />
            <MatchCardItem
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
      )}

      {showSemis && (
        <div className="bracket-column">
          <h3 className="bracket-round-title">Semifinais</h3>
          <div className="bracket-matches-wrapper">
            <MatchCardItem
              fase="SEMIS"
              jogoId="s1"
              defaultA="Vencedor Q1"
              defaultB="Vencedor Q2"
              jogoAnteriorA={{ fase: "QUARTAS", jogoId: "q1" }}
              jogoAnteriorB={{ fase: "QUARTAS", jogoId: "q2" }}
              isFirstRound={faseInicial === "semifinal"}
            />
            <MatchCardItem
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
      )}

      {showFinal && (
        <div className="bracket-column">
          <h3 className="bracket-round-title" style={{ color: "#d4af37" }}>
            Grande Final
          </h3>
          <div className="bracket-matches-wrapper">
            <MatchCardItem
              fase="FINAL"
              jogoId="final"
              defaultA="Vencedor S1"
              defaultB="Vencedor S2"
              jogoAnteriorA={{ fase: "SEMIS", jogoId: "s1" }}
              jogoAnteriorB={{ fase: "SEMIS", jogoId: "s2" }}
              isFirstRound={faseInicial === "final"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
