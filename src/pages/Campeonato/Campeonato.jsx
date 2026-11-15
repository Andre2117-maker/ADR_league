import React, { useState, useMemo, useEffect } from "react";
import "./campeonato.css";
import LogoADR from "../../assets/logo.png";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

// Importando os componentes modulares
import FaseGrupos from "./FaseGrupos/FaseGrupos";
import AdminConfig from "./ADMINCONFIG/AdminConfig";
import MataMata from "./MataMata/MataMata";

/* Ícones (SVG, herdam a cor) */
const IcoTrophy = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5" />
    <path d="M12 14v3.5M8.5 20.5h7M9.5 17.5h5v3h-5z" />
  </svg>
);
const IcoGroups = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3.5" y="4" width="17" height="16" rx="1.5" />
    <path d="M3.5 9h17M3.5 14.5h17M9.5 9v11" />
  </svg>
);
const IcoBracket = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 5h5v5H3M3 14h5v5H3M8 7.5h3v9H8M11 12h4M15 9.5h6v5h-6z" />
  </svg>
);
const IcoGear = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
  </svg>
);
const IcoPen = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 20l1-4.5L15.5 5 19 8.5 8.5 19z" />
    <path d="M13.5 7l3.5 3.5" />
  </svg>
);

export default function Campeonato({ isAdmin }) {
  const [partidas, setPartidas] = useState([]);
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [activeTab, setActiveTab] = useState("GRUPOS");

  // Edição rápida do nome da competição (admin)
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({ nome: "", subtitulo: "" });
  const [savingMeta, setSavingMeta] = useState(false);

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

  const configAtual = configs[selectedYear];

  // Resumo da temporada (jogos, realizados, gols, grupos)
  const resumo = useMemo(() => {
    const jogos = partidas.filter((p) => p.ano === selectedYear);
    const feitos = jogos.filter((p) => p.finalizado);
    const gols = feitos.reduce((acc, p) => {
      const a = parseInt(p.placarA, 10);
      const b = parseInt(p.placarB, 10);
      return acc + (isNaN(a) ? 0 : a) + (isNaN(b) ? 0 : b);
    }, 0);
    return {
      total: jogos.length,
      feitos: feitos.length,
      gols,
      grupos: Object.keys(configAtual?.grupos || {}).length,
    };
  }, [partidas, selectedYear, configAtual]);

  // Abre o editor inline já preenchido
  const startEditMeta = () => {
    setMetaForm({
      nome: configAtual?.nome || "",
      subtitulo: configAtual?.subtitulo || "",
    });
    setEditingMeta(true);
  };

  // Salva só nome/subtítulo (merge: não mexe em grupos nem no resto)
  const saveMeta = async () => {
    setSavingMeta(true);
    try {
      await setDoc(
        doc(db, "campeonatos_config", String(selectedYear)),
        {
          nome: metaForm.nome.trim(),
          subtitulo: metaForm.subtitulo.trim(),
        },
        { merge: true },
      );
      await loadData();
      setEditingMeta(false);
    } catch (err) {
      console.error("Erro ao salvar nome da competição:", err);
      alert("Não foi possível salvar. Verifique as permissões.");
    } finally {
      setSavingMeta(false);
    }
  };

  // Cria a próxima temporada já com um nome sugerido
  const addSeason = async () => {
    const next = String(Math.max(...anosDisponiveis.map(Number)) + 1);
    try {
      await setDoc(
        doc(db, "campeonatos_config", next),
        { nome: `Campeonato ${next}`, subtitulo: "" },
        { merge: true },
      );
      await loadData();
      setSelectedYear(next);
      setActiveTab("GRUPOS");
    } catch (err) {
      console.error("Erro ao criar temporada:", err);
      alert("Não foi possível criar a temporada.");
    }
  };

  if (loading) {
    return (
      <div className="camp-page-wrapper camp-loading-screen">
        <div className="camp-spinner"></div>
        <p className="camp-loading-text">CARREGANDO TORNEIOS...</p>
      </div>
    );
  }

  const qtdClassificados = configs[selectedYear]?.vagasClassificacao || 2;

  return (
    <div className="camp-page-wrapper">
      {/* CABEÇALHO HERO */}
      <header className="camp-header">
        <div className="camp-hero">
          <span className="camp-hero-corner tl" aria-hidden="true" />
          <span className="camp-hero-corner br" aria-hidden="true" />

          <div className="camp-logo-glow">
            <img src={LogoADR} alt="Logo O ADR" className="camp-logo" />
          </div>

          <div className="camp-hero-text">
            <span className="camp-subtitle">
              Temporada {selectedYear} · Hub oficial
            </span>
            <h1 className="camp-title">
              {configAtual?.nome || "Campeonatos do ADR"}
            </h1>
            {configAtual?.subtitulo && (
              <p className="camp-edition">{configAtual.subtitulo}</p>
            )}
          </div>

          <span className="camp-hero-trophy" aria-hidden="true">
            <IcoTrophy />
          </span>
        </div>
        <div className="camp-header-divider"></div>

        {/* Edição rápida do nome (só admin) */}
        {isAdmin && !editingMeta && (
          <button
            type="button"
            className="camp-edit-btn"
            onClick={startEditMeta}
          >
            <IcoPen /> Editar nome da competição
          </button>
        )}

        {isAdmin && editingMeta && (
          <div className="camp-meta-form">
            <input
              type="text"
              autoFocus
              placeholder="Nome (ex: Copa ADR 2026)"
              value={metaForm.nome}
              onChange={(e) =>
                setMetaForm({ ...metaForm, nome: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && saveMeta()}
            />
            <input
              type="text"
              placeholder="Subtítulo opcional (ex: A edição da vingança)"
              value={metaForm.subtitulo}
              onChange={(e) =>
                setMetaForm({ ...metaForm, subtitulo: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && saveMeta()}
            />
            <div className="camp-meta-actions">
              <button
                type="button"
                className="camp-meta-cancel"
                onClick={() => setEditingMeta(false)}
                disabled={savingMeta}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="camp-meta-save"
                onClick={saveMeta}
                disabled={savingMeta}
              >
                {savingMeta ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* RESUMO DA TEMPORADA */}
      {resumo.total > 0 && (
        <section className="camp-summary-block" aria-label="Resumo da temporada">
          <div className="camp-summary">
            <div>
              <strong>{resumo.total}</strong>
              <span>Jogos</span>
            </div>
            <div>
              <strong>{resumo.feitos}</strong>
              <span>Realizados</span>
            </div>
            <div>
              <strong>{resumo.gols}</strong>
              <span>Gols</span>
            </div>
            {resumo.grupos > 0 && (
              <div>
                <strong>{resumo.grupos}</strong>
                <span>Grupos</span>
              </div>
            )}
          </div>

          <div className="camp-progress">
            <div className="camp-progress-label">
              <span>Andamento da temporada</span>
              <b>{Math.round((resumo.feitos / resumo.total) * 100)}%</b>
            </div>
            <div className="camp-progress-track">
              <i style={{ width: `${(resumo.feitos / resumo.total) * 100}%` }} />
            </div>
          </div>
        </section>
      )}

      {/* PAINEL DE CONTROLES (ANOS + ABAS) */}
      <div className="camp-controls-bar">
        {/* Seletor de Temporada/Ano */}
        <div className="camp-years-container">
          {anosDisponiveis.map((ano) => (
            <button
              key={ano}
              className={`camp-year-btn ${selectedYear === ano ? "active" : ""}`}
              onClick={() => setSelectedYear(ano)}
            >
              <span className="year-dot"></span>
              <span className="year-text">
                <b>{ano}</b>
                {configs[ano]?.nome && (
                  <small className="year-name">{configs[ano].nome}</small>
                )}
              </span>
            </button>
          ))}

          {isAdmin && (
            <button
              type="button"
              className="camp-year-btn camp-year-add"
              onClick={addSeason}
              title="Criar a próxima temporada"
            >
              + Nova temporada
            </button>
          )}
        </div>

        {/* Navegação de Fase */}
        <div className="camp-tabs">
          <button
            className={`camp-tab-btn ${activeTab === "GRUPOS" ? "active" : ""}`}
            onClick={() => setActiveTab("GRUPOS")}
          >
            <IcoGroups />
            <span>Fase de Grupos</span>
          </button>
          <button
            className={`camp-tab-btn ${activeTab === "MATAMATA" ? "active" : ""}`}
            onClick={() => setActiveTab("MATAMATA")}
          >
            <IcoBracket />
            <span>Mata-Mata</span>
          </button>

          {isAdmin && (
            <button
              className={`camp-tab-btn camp-tab-admin ${
                activeTab === "CONFIG" ? "active" : ""
              }`}
              onClick={() => setActiveTab("CONFIG")}
            >
              <IcoGear />
              <span>Configurar</span>
            </button>
          )}
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO DOS COMPONENTES */}
      <main className="camp-content-area">
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
            configAtual={configAtual}
          />
        )}

        {activeTab === "CONFIG" && isAdmin && (
          <AdminConfig
            loadData={loadData}
            anoEdit={selectedYear}
            configEdit={configs[selectedYear]}
          />
        )}
      </main>
    </div>
  );
}
