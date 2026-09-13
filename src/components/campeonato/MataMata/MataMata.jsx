import React, { useState, useMemo } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import "./MataMata.css";

export default function MataMata({
  selectedYear,
  partidasMataMata,
  tabelaGrupos,
  loadData,
  isAdmin,
}) {
  const [loadingJogo, setLoadingJogo] = useState(null);

  // 1. Extrai os classificados no formato curto: "1º A", "2º B", etc.
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

  // Função para salvar o confronto no Firebase vinculado estritamente ao ano selecionado
  // Função de salvamento direta e blindada
  const salvarConfronto = async (fase, jogoId, tA, tB, sA, sB) => {
    console.log("➡️ O botão Salvar foi clicado!", {
      fase,
      jogoId,
      tA,
      tB,
      sA,
      sB,
      isAdmin,
      selectedYear,
    });

    if (!isAdmin) {
      alert("Acesso negado. Apenas administradores podem alterar o mata-mata.");
      return;
    }

    setLoadingJogo(jogoId);

    const docId = `${selectedYear}_${fase}_${jogoId}`
      .replace(/\s+/g, "")
      .toUpperCase();

    console.log("📝 ID gerado para o documento no Firestore:", docId);

    try {
      await setDoc(doc(db, "partidas_campeonato", docId), {
        ano: String(selectedYear),
        fase: fase.toUpperCase(),
        jogoId: String(jogoId),
        timeA: String(tA || "A definir"),
        timeB: String(tB || "A definir"),
        placarA: String(sA || "").toUpperCase(),
        placarB: String(sB || "").toUpperCase(),
        finalizado: true,
      });

      console.log("✅ Salvo com sucesso no Firebase!");
      await loadData();
    } catch (error) {
      console.error("❌ ERRO AO SALVAR NO FIREBASE:", error);
      alert("Erro ao salvar. Veja o console (F12).");
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

  // Função inteligente que lê gols e pênaltis exatos (ex: "1(3)" ou "2") e retorna o vencedor
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

    // Se for W/O explícito
    if (placarA === "W" || placarB === "L") return timeA;
    if (placarB === "W" || placarA === "L") return timeB;

    const golsA = parseInt(placarA) || 0;
    const golsB = parseInt(placarB) || 0;

    if (golsA > golsB) return timeA;
    if (golsB > golsA) return timeB;

    // Desempate por pênaltis nos parênteses (ex: "1(3)" vs "1(2)")
    const penA =
      placarA && placarA.includes("(") ? parseInt(placarA.split("(")[1]) : 0;
    const penB =
      placarB && placarB.includes("(") ? parseInt(placarB.split("(")[1]) : 0;

    if (penA > penB) return timeA;
    if (penB > penA) return timeB;

    return "";
  };

  // Componente individual de cada partida
  const MatchCardItem = ({
    fase,
    jogoId,
    defaultA,
    defaultB,
    isOitavas = false,
    jogoAnteriorA = null,
    jogoAnteriorB = null,
  }) => {
    const dadosSalvos = getPartidaData(fase, jogoId);

    // Descobre os times automáticos se não forem oitavas
    let timeSugeridoA = defaultA;
    let timeSugeridoB = defaultB;

    if (!isOitavas) {
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
      dadosSalvos.timeA || (isOitavas ? defaultA : timeSugeridoA);
    const finalTimeB =
      dadosSalvos.timeB || (isOitavas ? defaultB : timeSugeridoB);

    const [timeA, setTimeA] = useState(finalTimeA);
    const [timeB, setTimeB] = useState(finalTimeB);
    const [scoreA, setScoreA] = useState(dadosSalvos.placarA || "");
    const [scoreB, setScoreB] = useState(dadosSalvos.placarB || "");

    // --- LÓGICA PARA DESTACAR O VENCEDOR ---
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
          // Desempate por pênaltis
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

    // Garante que a caixinha atualize sozinha se o banco de dados mudar
    React.useEffect(() => {
      setTimeA(finalTimeA);
      setTimeB(finalTimeB);
      setScoreA(dadosSalvos.placarA || "");
      setScoreB(dadosSalvos.placarB || "");
    }, [finalTimeA, finalTimeB, dadosSalvos.placarA, dadosSalvos.placarB]);

    return (
      <div className="bracket-match">
        <div className="bracket-date">Confronto {jogoId.toUpperCase()}</div>

        {/* TIME A + PLACAR */}
        <div className="bracket-team">
          {isAdmin && isOitavas ? (
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

        {/* TIME B + PLACAR */}
        <div className="bracket-team">
          {isAdmin && isOitavas ? (
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
              salvarConfronto(
                fase,
                jogoId,
                timeA, // <-- AGORA ELE PEGA A SUA ESCOLHA CORRETA
                timeB, // <-- AGORA ELE PEGA A SUA ESCOLHA CORRETA
                scoreA,
                scoreB,
              )
            }
            disabled={loadingJogo === jogoId}
          >
            {loadingJogo === jogoId ? "⏳" : "💾 Salvar"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="camp-bracket-container">
      {/* OITAVAS */}
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
            isOitavas={true}
          />
          <MatchCardItem
            fase="OITAVAS"
            jogoId="o2"
            defaultA="1º B"
            defaultB="3º C"
            isOitavas={true}
          />
          <MatchCardItem
            fase="OITAVAS"
            jogoId="o3"
            defaultA="1º C"
            defaultB="3º D"
            isOitavas={true}
          />
          <MatchCardItem
            fase="OITAVAS"
            jogoId="o4"
            defaultA="1º D"
            defaultB="3º E"
            isOitavas={true}
          />
          <MatchCardItem
            fase="OITAVAS"
            jogoId="o5"
            defaultA="1º E"
            defaultB="3º F"
            isOitavas={true}
          />
          <MatchCardItem
            fase="OITAVAS"
            jogoId="o6"
            defaultA="1º F"
            defaultB="3º A"
            isOitavas={true}
          />
          <MatchCardItem
            fase="OITAVAS"
            jogoId="o7"
            defaultA="2º A"
            defaultB="2º B"
            isOitavas={true}
          />
          <MatchCardItem
            fase="OITAVAS"
            jogoId="o8"
            defaultA="2º C"
            defaultB="2º D"
            isOitavas={true}
          />
        </div>
      </div>

      {/* QUARTAS DE FINAL */}
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
          />
          <MatchCardItem
            fase="QUARTAS"
            jogoId="q2"
            defaultA="Vencedor O3"
            defaultB="Vencedor O4"
            jogoAnteriorA={{ fase: "OITAVAS", jogoId: "o3" }}
            jogoAnteriorB={{ fase: "OITAVAS", jogoId: "o4" }}
          />
          <MatchCardItem
            fase="QUARTAS"
            jogoId="q3"
            defaultA="Vencedor O5"
            defaultB="Vencedor O6"
            jogoAnteriorA={{ fase: "OITAVAS", jogoId: "o5" }}
            jogoAnteriorB={{ fase: "OITAVAS", jogoId: "o6" }}
          />
          <MatchCardItem
            fase="QUARTAS"
            jogoId="q4"
            defaultA="Vencedor O7"
            defaultB="Vencedor O8"
            jogoAnteriorA={{ fase: "OITAVAS", jogoId: "o7" }}
            jogoAnteriorB={{ fase: "OITAVAS", jogoId: "o8" }}
          />
        </div>
      </div>

      {/* SEMIFINAIS */}
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
          />
          <MatchCardItem
            fase="SEMIS"
            jogoId="s2"
            defaultA="Vencedor Q3"
            defaultB="Vencedor Q4"
            jogoAnteriorA={{ fase: "QUARTAS", jogoId: "q3" }}
            jogoAnteriorB={{ fase: "QUARTAS", jogoId: "q4" }}
          />
        </div>
      </div>

      {/* GRANDE FINAL */}
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
          />
        </div>
      </div>
    </div>
  );
}
