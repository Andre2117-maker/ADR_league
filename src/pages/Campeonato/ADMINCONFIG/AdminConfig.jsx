import React, { useState, useEffect, useMemo, useCallback } from "react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import "./AdminConfig.css";

// Gera o ID limpo do documento (ex: 2026_PEBARIANOS_CUP)
const gerarTorneioId = (ano, titulo) => {
  return `${ano}_${titulo}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
};

export default function AdminConfig({
  loadData,
  anoEdit,
  configEdit,
  allConfigs = {},
}) {
  const [adminAno, setAdminAno] = useState("2026");
  const [tituloTorneio, setTituloTorneio] = useState("Campeonato Principal");
  const [adminVagas, setAdminVagas] = useState(2);
  const [faseMataMata, setFaseMataMata] = useState("semifinal");
  const [adminGrupos, setAdminGrupos] = useState({ A: [] });
  const [novoTime, setNovoTime] = useState("");
  const [grupoSelecionado, setGrupoSelecionado] = useState("A");

  // Controle de Torneios Salvos e Edição Inline
  const [torneioSelecionadoId, setTorneioSelecionadoId] = useState("");
  const [originalDocId, setOriginalDocId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null); // { grupo, index, value }

  // Lista todos os torneios salvos (priorizando os do ano atual no topo)
  const listaTorneiosSalvos = useMemo(() => {
    return Object.entries(allConfigs || {})
      .map(([id, cfg]) => ({
        id,
        ano: String(cfg.ano || id.split("_")[0] || "2026"),
        titulo: cfg.titulo || id,
        ...cfg,
      }))
      .sort((a, b) => Number(b.ano) - Number(a.ano));
  }, [allConfigs]);

  // Carrega dados quando configEdit ou anoEdit mudam externamente
  useEffect(() => {
    if (configEdit) {
      const ano = String(configEdit.ano || anoEdit || "2026");
      const titulo = configEdit.titulo || "Campeonato Principal";
      const idCalculado = gerarTorneioId(ano, titulo);

      setAdminAno(ano);
      setTituloTorneio(titulo);
      setAdminVagas(configEdit.vagasClassificacao || 2);
      setFaseMataMata(configEdit.faseInicialMataMata || "semifinal");

      const gruposCarregados =
        configEdit.grupos && Object.keys(configEdit.grupos).length > 0
          ? configEdit.grupos
          : { A: [] };

      setAdminGrupos(gruposCarregados);
      setGrupoSelecionado(Object.keys(gruposCarregados)[0] || "A");
      setTorneioSelecionadoId(idCalculado);
      setOriginalDocId(idCalculado);
    } else {
      setAdminAno(anoEdit || "2026");
      setTituloTorneio("Novo Torneio");
      setAdminVagas(2);
      setFaseMataMata("semifinal");
      setAdminGrupos({ A: [] });
      setGrupoSelecionado("A");
      setTorneioSelecionadoId("");
      setOriginalDocId("");
    }
  }, [configEdit, anoEdit]);

  // Selecionar um torneio existente na barra superior para editar
  const handleSelectTorneio = (torneio) => {
    setTorneioSelecionadoId(torneio.id);
    setOriginalDocId(torneio.id);
    setAdminAno(String(torneio.ano || "2026"));
    setTituloTorneio(torneio.titulo || "Campeonato");
    setAdminVagas(torneio.vagasClassificacao || 2);
    setFaseMataMata(torneio.faseInicialMataMata || "semifinal");
    const g =
      torneio.grupos && Object.keys(torneio.grupos).length > 0
        ? torneio.grupos
        : { A: [] };
    setAdminGrupos(g);
    setGrupoSelecionado(Object.keys(g)[0] || "A");
  };

  // Iniciar um torneio em branco
  const handleNovoTorneioEmBranco = () => {
    setTorneioSelecionadoId("NEW");
    setOriginalDocId("");
    setAdminAno(anoEdit || "2026");
    setTituloTorneio("");
    setAdminVagas(2);
    setFaseMataMata("semifinal");
    setAdminGrupos({ A: [], B: [] });
    setGrupoSelecionado("A");
  };

  // Cria automaticamente a próxima letra de grupo (A -> B -> C...) sem precisar de prompt
  const addGrupoAuto = () => {
    const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const proximaLetra =
      alfabeto.find((letra) => !adminGrupos[letra]) ||
      `G${Object.keys(adminGrupos).length + 1}`;

    setAdminGrupos((prev) => ({ ...prev, [proximaLetra]: [] }));
    setGrupoSelecionado(proximaLetra);
  };

  // Adiciona 1 ou vários times de uma vez (separados por vírgula ou quebra de linha)
  const addTime = () => {
    if (!novoTime.trim()) return;

    const grupoAlvo =
      grupoSelecionado && adminGrupos[grupoSelecionado]
        ? grupoSelecionado
        : Object.keys(adminGrupos)[0];

    if (!grupoAlvo) {
      alert("Crie pelo menos um grupo primeiro!");
      return;
    }

    // Suporta colar lista de times separados por vírgula, ponto-e-vírgula ou quebra de linha
    const candidatos = novoTime
      .split(/[,;\n]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (candidatos.length === 0) return;

    const todosTimesExistentes = Object.values(adminGrupos)
      .flat()
      .map((t) => t.toLowerCase());

    const novosValidos = [];
    const duplicados = [];

    candidatos.forEach((nome) => {
      if (
        todosTimesExistentes.includes(nome.toLowerCase()) ||
        novosValidos.some((n) => n.toLowerCase() === nome.toLowerCase())
      ) {
        duplicados.push(nome);
      } else {
        novosValidos.push(nome);
      }
    });

    if (duplicados.length > 0) {
      alert(
        `Atenção: Já existe(m) no torneio e foi(ram) ignorado(s): ${duplicados.join(", ")}`,
      );
    }

    if (novosValidos.length > 0) {
      setAdminGrupos((prev) => ({
        ...prev,
        [grupoAlvo]: [...(prev[grupoAlvo] || []), ...novosValidos],
      }));
      setNovoTime("");
    }
  };

  // Sorteia / Embaralha todos os times cadastrados igualmente entre os grupos
  const sortearTimesNosGrupos = () => {
    const chavesGrupos = Object.keys(adminGrupos).sort();
    if (chavesGrupos.length < 2) {
      return alert("Crie pelo menos 2 grupos para sortear as equipes!");
    }

    const todosTimes = Object.values(adminGrupos).flat();
    if (todosTimes.length < 2) {
      return alert("Adicione equipes antes de realizar o sorteio!");
    }

    if (
      !window.confirm(
        `Deseja embaralhar e redistribuir os ${todosTimes.length} times igualmente entre os ${chavesGrupos.length} grupos?`,
      )
    ) {
      return;
    }

    // Algoritmo Fisher-Yates Shuffle
    const embaralhados = [...todosTimes];
    for (let i = embaralhados.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [embaralhados[i], embaralhados[j]] = [embaralhados[j], embaralhados[i]];
    }

    const novosGrupos = {};
    chavesGrupos.forEach((g) => {
      novosGrupos[g] = [];
    });

    embaralhados.forEach((time, index) => {
      const grupoDestino = chavesGrupos[index % chavesGrupos.length];
      novosGrupos[grupoDestino].push(time);
    });

    setAdminGrupos(novosGrupos);
  };

  // Move um time rapidamente para o próximo grupo (Bind ⇄)
  const moverTimeDeGrupo = (grupoAtual, nomeTime) => {
    const chaves = Object.keys(adminGrupos).sort();
    if (chaves.length < 2) return;

    const idxAtual = chaves.indexOf(grupoAtual);
    const proximoGrupo = chaves[(idxAtual + 1) % chaves.length];

    setAdminGrupos((prev) => ({
      ...prev,
      [grupoAtual]: prev[grupoAtual].filter((t) => t !== nomeTime),
      [proximoGrupo]: [...prev[proximoGrupo], nomeTime],
    }));
  };

  // Salva edição inline do nome de um time
  const confirmarEdicaoTime = () => {
    if (!editingTeam) return;
    const { grupo, index, value } = editingTeam;
    const limpo = value.trim();
    if (!limpo) {
      setEditingTeam(null);
      return;
    }

    setAdminGrupos((prev) => {
      const copia = [...(prev[grupo] || [])];
      copia[index] = limpo;
      return { ...prev, [grupo]: copia };
    });
    setEditingTeam(null);
  };

  const removerGrupo = (grupoParaRemover) => {
    if (Object.keys(adminGrupos).length <= 1) {
      return alert("O torneio precisa ter pelo menos 1 grupo.");
    }
    if (
      window.confirm(
        `Tem certeza que deseja apagar o Grupo ${grupoParaRemover} inteiro?`,
      )
    ) {
      const novosGrupos = { ...adminGrupos };
      delete novosGrupos[grupoParaRemover];
      setAdminGrupos(novosGrupos);
      if (grupoSelecionado === grupoParaRemover) {
        const chavesRestantes = Object.keys(novosGrupos);
        setGrupoSelecionado(
          chavesRestantes.length > 0 ? chavesRestantes[0] : "",
        );
      }
    }
  };

  const removerTime = (grupo, timeParaRemover) => {
    setAdminGrupos((prev) => ({
      ...prev,
      [grupo]: prev[grupo].filter((t) => t !== timeParaRemover),
    }));
  };

  const excluirTorneioDoBanco = async (idParaExcluir, nomeTorneio) => {
    if (
      !window.confirm(
        `⚠️ ATENÇÃO: Deseja excluir permanentemente o torneio "${nomeTorneio}" do banco de dados?`,
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "campeonatos_config", idParaExcluir));
      alert(`Torneio "${nomeTorneio}" removido.`);
      loadData();
    } catch (error) {
      console.error("Erro ao excluir torneio:", error);
      alert("Erro ao excluir torneio.");
    }
  };

  const salvarConfiguracao = useCallback(async () => {
    if (!tituloTorneio.trim()) {
      alert("Por favor, insira um título para o torneio.");
      return;
    }

    const novoTorneioId = gerarTorneioId(adminAno, tituloTorneio);

    setIsSaving(true);
    try {
      // Se o Admin renomeou um torneio que já existia, pergunta se quer substituir o antigo
      if (
        originalDocId &&
        originalDocId !== novoTorneioId &&
        allConfigs[originalDocId]
      ) {
        const substituir = window.confirm(
          `Você alterou o nome/ano do torneio.\n\nClique em OK para RENOMEAR (apagar o antigo "${originalDocId}") ou CANCELAR para manter os dois torneios separados.`,
        );
        if (substituir) {
          await deleteDoc(doc(db, "campeonatos_config", originalDocId));
        }
      }

      await setDoc(doc(db, "campeonatos_config", novoTorneioId), {
        ano: String(adminAno).trim(),
        titulo: tituloTorneio.trim(),
        vagasClassificacao: Math.max(1, parseInt(adminVagas, 10) || 2),
        faseInicialMataMata: faseMataMata,
        grupos: adminGrupos,
      });

      setOriginalDocId(novoTorneioId);
      setTorneioSelecionadoId(novoTorneioId);
      alert(`✓ Torneio "${tituloTorneio}" salvo com sucesso!`);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar configuração.");
    } finally {
      setIsSaving(false);
    }
  }, [
    adminAno,
    tituloTorneio,
    adminVagas,
    faseMataMata,
    adminGrupos,
    originalDocId,
    allConfigs,
    loadData,
  ]);

  // Bind Global: Ctrl + S salva a configuração
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        salvarConfiguracao();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [salvarConfiguracao]);

  // Métricas em tempo real para o painel superior (Estilo Pebarianos Cup)
  const totalGrupos = Object.keys(adminGrupos).length;
  const totalEquipes = Object.values(adminGrupos).reduce(
    (acc, arr) => acc + arr.length,
    0,
  );
  const totalClassificados = totalGrupos * (parseInt(adminVagas, 10) || 0);

  return (
    <div className="camp-admin-container">
      {/* CABEÇALHO ESTILO PEBARIANOS CUP */}
      <div className="camp-admin-header">
        <span className="camp-admin-kicker">
          PAINEL DE CONTROLE • DIRETORIA O ADR
        </span>
        <h2 className="camp-admin-title">CONFIGURAÇÃO DO TORNEIO</h2>
        <div className="camp-admin-gold-line" />
      </div>

      {/* CONTADORES DE RESUMO (IGUAL AO TOPO DA PEBARIANOS CUP) */}
      <div className="camp-admin-stats-bar">
        <div className="camp-stat-box">
          <span className="camp-stat-num">{adminAno || "—"}</span>
          <span className="camp-stat-label">TEMPORADA</span>
        </div>
        <div className="camp-stat-box">
          <span className="camp-stat-num">{totalGrupos}</span>
          <span className="camp-stat-label">GRUPOS</span>
        </div>
        <div className="camp-stat-box">
          <span className="camp-stat-num">{totalEquipes}</span>
          <span className="camp-stat-label">EQUIPES</span>
        </div>
        <div className="camp-stat-box">
          <span className="camp-stat-num">{totalClassificados}</span>
          <span className="camp-stat-label">VAGAS TOTAIS</span>
        </div>
      </div>

      {/* BARRA DE TORNEIOS SALVOS (ALTERNAR OU CRIAR NOVO) */}
      {listaTorneiosSalvos.length > 0 && (
        <div className="camp-saved-tournaments-section">
          <div className="camp-section-label">
            <span>■ TORNEIOS CADASTRADOS NO SISTEMA</span>
            <button
              type="button"
              className="camp-btn-new-preset"
              onClick={handleNovoTorneioEmBranco}
            >
              + CRIAR NOVO TORNEIO
            </button>
          </div>

          <div className="camp-tournaments-tabs">
            {listaTorneiosSalvos.map((t) => {
              const isSelected = torneioSelecionadoId === t.id;
              return (
                <div
                  key={t.id}
                  className={`camp-tournament-tab ${
                    isSelected ? "active" : ""
                  }`}
                  onClick={() => handleSelectTorneio(t)}
                >
                  <div className="camp-tab-info">
                    <span className="camp-tab-year">
                      <span className="camp-sq" /> {t.ano}
                    </span>
                    <span className="camp-tab-name">{t.titulo}</span>
                  </div>
                  <button
                    type="button"
                    className="camp-tab-del"
                    title="Excluir este torneio do banco"
                    onClick={(e) => {
                      e.stopPropagation();
                      excluirTorneioDoBanco(t.id, t.titulo);
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LINHA 1: CONFIGURAÇÕES PRINCIPAIS */}
      <div className="camp-admin-row">
        <div className="camp-admin-field camp-field-small">
          <label>ANO / TEMPORADA</label>
          <input
            type="text"
            value={adminAno}
            maxLength="4"
            onChange={(e) => setAdminAno(e.target.value)}
          />
        </div>

        <div className="camp-admin-field camp-admin-input-flex">
          <label>TÍTULO DO TORNEIO</label>
          <input
            type="text"
            value={tituloTorneio}
            onChange={(e) => setTituloTorneio(e.target.value)}
            placeholder="Ex: PEBARIANOS CUP"
          />
        </div>

        <div className="camp-admin-field camp-field-small">
          <label>VAGAS / GRUPO</label>
          <input
            type="number"
            value={adminVagas}
            onChange={(e) => setAdminVagas(e.target.value)}
            min="1"
            max="16"
          />
        </div>

        <div className="camp-admin-field">
          <label>FASE INICIAL DO MATA-MATA</label>
          <select
            value={faseMataMata}
            onChange={(e) => setFaseMataMata(e.target.value)}
          >
            <option value="oitavas">OITAVAS DE FINAL (16)</option>
            <option value="quartas">QUARTAS DE FINAL (8)</option>
            <option value="semifinal">SEMIFINAL (4)</option>
            <option value="final">GRANDE FINAL DIRETA (2)</option>
          </select>
        </div>
      </div>

      <hr className="camp-admin-divider" />

      {/* LINHA 2: GERENCIAMENTO DE GRUPOS E TIMES */}
      <div className="camp-admin-toolbar">
        <div className="camp-toolbar-left">
          <div className="camp-admin-field">
            <label>GRUPO ATIVO PARA INSERÇÃO</label>
            <select
              value={grupoSelecionado}
              onChange={(e) => setGrupoSelecionado(e.target.value)}
            >
              {Object.keys(adminGrupos)
                .sort()
                .map((g) => (
                  <option key={g} value={g}>
                    GRUPO {g} ({adminGrupos[g]?.length || 0} equipes)
                  </option>
                ))}
            </select>
          </div>

          <button
            type="button"
            className="camp-btn camp-btn-dark"
            onClick={addGrupoAuto}
            title="Cria automaticamente a próxima letra de grupo"
          >
            + CRIAR GRUPO
          </button>
        </div>

        <div className="camp-toolbar-right">
          <button
            type="button"
            className="camp-btn camp-btn-outline-gold"
            onClick={sortearTimesNosGrupos}
            title="Embaralha todos os times e divide igualmente nos grupos"
          >
            🎲 SORTEAR TIMES NOS GRUPOS
          </button>
        </div>
      </div>

      {/* BARRA DE ADICIONAR TIME (SUPORTA LOTE POR VÍRGULA) */}
      <div className="camp-admin-row camp-add-team-row">
        <input
          className="camp-admin-input-flex"
          type="text"
          placeholder={`Digite o nome do time (ou vários separados por vírgula) para o GRUPO ${grupoSelecionado}...`}
          value={novoTime}
          onChange={(e) => setNovoTime(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTime();
            }
          }}
        />
        <button
          type="button"
          className="camp-btn camp-btn-gold"
          onClick={addTime}
        >
          ■ ADICIONAR AO GRUPO {grupoSelecionado}
        </button>
      </div>

      <div className="camp-hint-text">
        💡 <strong>DICA:</strong> Clique em qualquer card de grupo abaixo para
        selecioná-lo • <strong>Duplo clique</strong> no nome de um time para
        renomear • Use <strong>⇄</strong> para mover o time de grupo.
      </div>

      {/* GRID DE GRUPOS CRIADOS */}
      <div className="camp-admin-groups-grid">
        {Object.keys(adminGrupos)
          .sort()
          .map((g) => {
            const isSelectedGroup = grupoSelecionado === g;
            const listaTimes = adminGrupos[g] || [];

            return (
              <div
                key={g}
                className={`camp-admin-group-card ${
                  isSelectedGroup ? "is-selected-group" : ""
                }`}
                onClick={() => setGrupoSelecionado(g)}
              >
                <div className="camp-admin-group-header">
                  <div className="camp-group-title-wrap">
                    <span className="camp-sq" />
                    <h4>GRUPO {g}</h4>
                    <span className="camp-group-count">
                      {listaTimes.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-delete-group"
                    onClick={(e) => {
                      e.stopPropagation();
                      removerGrupo(g);
                    }}
                    title={`Apagar Grupo ${g}`}
                  >
                    🗑️
                  </button>
                </div>

                <ul className="camp-team-list">
                  {listaTimes.map((t, idx) => {
                    const isEditingThis =
                      editingTeam &&
                      editingTeam.grupo === g &&
                      editingTeam.index === idx;
                    const isQualifyingSlot =
                      idx < (parseInt(adminVagas, 10) || 2);

                    return (
                      <li
                        key={idx}
                        className={`camp-admin-team-item ${
                          isQualifyingSlot ? "is-qualifying-slot" : ""
                        }`}
                      >
                        <div className="camp-team-left">
                          <span className="camp-team-pos">{idx + 1}</span>
                          {isEditingThis ? (
                            <input
                              type="text"
                              className="camp-inline-edit-input"
                              value={editingTeam.value}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setEditingTeam({
                                  ...editingTeam,
                                  value: e.target.value,
                                })
                              }
                              onBlur={confirmarEdicaoTime}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") confirmarEdicaoTime();
                                if (e.key === "Escape") setEditingTeam(null);
                              }}
                            />
                          ) : (
                            <span
                              className="camp-team-name-text"
                              title="Duplo clique para editar o nome"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingTeam({
                                  grupo: g,
                                  index: idx,
                                  value: t,
                                });
                              }}
                            >
                              {t}
                            </span>
                          )}
                        </div>

                        <div className="camp-team-actions">
                          {Object.keys(adminGrupos).length > 1 && (
                            <button
                              type="button"
                              className="btn-move-team"
                              onClick={(e) => {
                                e.stopPropagation();
                                moverTimeDeGrupo(g, t);
                              }}
                              title="Mover para o próximo grupo"
                            >
                              ⇄
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-delete-team"
                            onClick={(e) => {
                              e.stopPropagation();
                              removerTime(g, t);
                            }}
                            title="Remover Time"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    );
                  })}

                  {listaTimes.length === 0 && (
                    <li className="empty-msg">Nenhuma equipe cadastrada</li>
                  )}
                </ul>
              </div>
            );
          })}
      </div>

      {/* BOTÃO SALVAR FINAL */}
      <button
        type="button"
        className="camp-btn camp-btn-save"
        onClick={salvarConfiguracao}
        disabled={isSaving}
      >
        {isSaving
          ? "SALVANDO CONFIGURAÇÃO..."
          : "■ SALVAR TORNEIO NO BANCO DE DADOS (CTRL + S)"}
      </button>
    </div>
  );
}
