import React, { useState, useMemo, useEffect } from "react";
import "../styles/Campeonato/campeonato.css";
import LogoADR from "../assets/logo.png";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Importando os componentes modulares
import FaseGrupos from "../components/campeonato/FaseGrupos/FaseGrupos";
import AdminConfig from "../components/campeonato/ADMINCONFIG/AdminConfig";
import MataMata from "../components/campeonato/MataMata/MataMata";

export default function Campeonato({ isAdmin }) {
  const [partidas, setPartidas] = useState([]);
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [activeTab, setActiveTab] = useState("GRUPOS");

  const loadData = async () => {
    try {
      const partidasSnap = await getDocs(collection(db, "partidas_campeonato"));
      const dadosPartidas = partidasSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const configsSnap = await getDocs(collection(db, "campeonatos_config"));
      const dadosConfigs = {};
      configsSnap.forEach((doc) => {
        dadosConfigs[doc.id] = doc.data();
      });

      setPartidas(dadosPartidas);
      setConfigs(dadosConfigs);
    } catch (error) {
      console.error("Erro ao buscar dados do Firebase:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const anosDisponiveis = useMemo(() => {
    const years = new Set([
      ...partidas.map((p) => p.ano).filter(Boolean),
      ...Object.keys(configs),
    ]);
    if (years.size === 0) return ["2026"];
    return Array.from(years).sort((a, b) => b - a);
  }, [partidas, configs]);

  useEffect(() => {
    if (anosDisponiveis.length > 0 && !anosDisponiveis.includes(selectedYear)) {
      setSelectedYear(anosDisponiveis[0]);
    }
  }, [anosDisponiveis, selectedYear]);

  // CÉREBRO: Monta a tabela matematicamente
  const tabelaGrupos = useMemo(() => {
    const tabela = {};
    const configAtual = configs[selectedYear];

    if (configAtual && configAtual.grupos) {
      Object.keys(configAtual.grupos).forEach((nomeGrupo) => {
        tabela[nomeGrupo] = {};
        configAtual.grupos[nomeGrupo].forEach((time) => {
          tabela[nomeGrupo][time] = {
            nome: time,
            pts: 0,
            j: 0,
            v: 0,
            e: 0,
            d: 0,
            gp: 0,
            gc: 0,
            sg: 0,
          };
        });
      });
    }

    const jogosDoAno = partidas.filter(
      (p) => p.ano === selectedYear && p.fase === "GRUPOS",
    );

    jogosDoAno.forEach((jogo) => {
      const { grupo, timeA, timeB, placarA, placarB, finalizado } = jogo;
      if (!grupo) return;

      if (!tabela[grupo]) tabela[grupo] = {};
      if (!tabela[grupo][timeA])
        tabela[grupo][timeA] = {
          nome: timeA,
          pts: 0,
          j: 0,
          v: 0,
          e: 0,
          d: 0,
          gp: 0,
          gc: 0,
          sg: 0,
        };
      if (!tabela[grupo][timeB])
        tabela[grupo][timeB] = {
          nome: timeB,
          pts: 0,
          j: 0,
          v: 0,
          e: 0,
          d: 0,
          gp: 0,
          gc: 0,
          sg: 0,
        };

      if (finalizado) {
        tabela[grupo][timeA].j += 1;
        tabela[grupo][timeB].j += 1;

        const vitA = placarA === "W" || placarB === "L";
        const vitB = placarB === "W" || placarA === "L";
        const golsA = parseInt(placarA) || 0;
        const golsB = parseInt(placarB) || 0;

        if (vitA || (!vitB && golsA > golsB)) {
          tabela[grupo][timeA].pts += 3;
          tabela[grupo][timeA].v += 1;
          tabela[grupo][timeB].d += 1;
        } else if (vitB || (!vitA && golsB > golsA)) {
          tabela[grupo][timeB].pts += 3;
          tabela[grupo][timeB].v += 1;
          tabela[grupo][timeA].d += 1;
        } else if (
          golsA === golsB &&
          !vitA &&
          !vitB &&
          placarA !== "-" &&
          placarB !== "-"
        ) {
          tabela[grupo][timeA].pts += 1;
          tabela[grupo][timeA].e += 1;
          tabela[grupo][timeB].pts += 1;
          tabela[grupo][timeB].e += 1;
        }

        if (
          !vitA &&
          !vitB &&
          placarA !== "W" &&
          placarB !== "W" &&
          placarA !== "L" &&
          placarB !== "L" &&
          placarA !== "-" &&
          placarB !== "-"
        ) {
          tabela[grupo][timeA].gp += golsA;
          tabela[grupo][timeA].gc += golsB;
          tabela[grupo][timeB].gp += golsB;
          tabela[grupo][timeB].gc += golsA;
        }
        tabela[grupo][timeA].sg =
          tabela[grupo][timeA].gp - tabela[grupo][timeA].gc;
        tabela[grupo][timeB].sg =
          tabela[grupo][timeB].gp - tabela[grupo][timeB].gc;
      }
    });

    const tabelaOrdenada = {};
    Object.keys(tabela).forEach((g) => {
      tabelaOrdenada[g] = Object.values(tabela[g]).sort(
        (a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp,
      );
    });
    return tabelaOrdenada;
  }, [partidas, configs, selectedYear]);

  if (loading)
    return (
      <div style={{ color: "#fff", textAlign: "center", marginTop: "50px" }}>
        Carregando banco de dados... ⏳
      </div>
    );

  const qtdClassificados = configs[selectedYear]?.vagasClassificacao || 2;

  return (
    <div className="camp-page-wrapper">
      <div className="camp-header">
        <img src={LogoADR} alt="Logo ADR" className="camp-logo" />
        <h1 className="camp-title">CAMPEONATOS DO ADR</h1>
      </div>

      <div className="camp-years-container">
        {anosDisponiveis.map((ano) => (
          <button
            key={ano}
            className={`camp-year-btn ${selectedYear === ano ? "active" : ""}`}
            onClick={() => setSelectedYear(ano)}
          >
            Edição {ano}
          </button>
        ))}
      </div>

      <div className="camp-tabs">
        <button
          className={`camp-tab-btn ${activeTab === "GRUPOS" ? "active" : ""}`}
          onClick={() => setActiveTab("GRUPOS")}
        >
          Fase de Grupos
        </button>
        <button
          className={`camp-tab-btn ${activeTab === "MATAMATA" ? "active" : ""}`}
          onClick={() => setActiveTab("MATAMATA")}
        >
          Mata-Mata (Bracket)
        </button>

        {/* O BOTÃO DE CONFIGURAR SÓ APARECE PARA O ADMIN */}
        {isAdmin && (
          <button
            className={`camp-tab-btn ${activeTab === "CONFIG" ? "active" : ""}`}
            style={{ color: "#ff47a3" }}
            onClick={() => setActiveTab("CONFIG")}
          >
            ⚙️ Configurar (Admin)
          </button>
        )}
      </div>

      <div className="camp-content-area">
        {activeTab === "GRUPOS" && (
          <FaseGrupos
            tabelaGrupos={tabelaGrupos}
            qtdClassificados={qtdClassificados}
            selectedYear={selectedYear}
            partidas={partidas}
            loadData={loadData}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === "MATAMATA" && (
          <MataMata
            selectedYear={selectedYear}
            partidasMataMata={partidas}
            tabelaGrupos={tabelaGrupos}
            loadData={loadData}
            isAdmin={isAdmin}
            configAtual={configs[selectedYear]} /* <-- ADICIONE ESTA LINHA */
          />
        )}

        {activeTab === "CONFIG" && isAdmin && (
          <AdminConfig
            loadData={loadData}
            anoEdit={selectedYear}
            configEdit={configs[selectedYear]}
          />
        )}
      </div>
    </div>
  );
}
