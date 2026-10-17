import React, { useState, useEffect } from "react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import "./AdminConfig.css";

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

  // Torneios salvos para o ano selecionado
  const [torneioSelecionadoId, setTorneioSelecionadoId] = useState("");

  useEffect(() => {
    setAdminAno(anoEdit || "2026");
  }, [anoEdit]);

  // Filtra os torneios do ano atual
  const torneiosDoAno = Object.entries(allConfigs).filter(([id, cfg]) => {
    return (
      cfg.ano === (anoEdit || "2026") || id.startsWith(`${anoEdit || "2026"}_`)
    );
  });

  useEffect(() => {
    if (configEdit) {
      setAdminAno(configEdit.ano || anoEdit || "2026");
      setTituloTorneio(configEdit.titulo || "Campeonato Principal");
      setAdminVagas(configEdit.vagasClassificacao || 2);
      setFaseMataMata(configEdit.faseInicialMataMata || "semifinal");
      setAdminGrupos(configEdit.grupos || { A: [] });
      if (configEdit.grupos && Object.keys(configEdit.grupos).length > 0) {
        setGrupoSelecionado(Object.keys(configEdit.grupos)[0]);
      }
    } else {
      setAdminAno(anoEdit || "2026");
      setTituloTorneio("Novo Torneio");
      setAdminVagas(2);
      setFaseMataMata("semifinal");
      setAdminGrupos({ A: [] });
      setGrupoSelecionado("A");
    }
  }, [configEdit, anoEdit]);

  const addGrupo = () => {
    const novoNome = prompt("Nome do Grupo (ex: B, C, D):");
    if (novoNome && !adminGrupos[novoNome.toUpperCase()]) {
      setAdminGrupos({ ...adminGrupos, [novoNome.toUpperCase()]: [] });
      setGrupoSelecionado(novoNome.toUpperCase());
    }
  };

  const addTime = () => {
    if (!novoTime.trim()) return;
    setAdminGrupos((prev) => ({
      ...prev,
      [grupoSelecionado]: [...prev[grupoSelecionado], novoTime.trim()],
    }));
    setNovoTime("");
  };

  const removerGrupo = (grupoParaRemover) => {
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
    const novosGrupos = { ...adminGrupos };
    novosGrupos[grupo] = novosGrupos[grupo].filter(
      (t) => t !== timeParaRemover,
    );
    setAdminGrupos(novosGrupos);
  };

  const salvarConfiguracao = async () => {
    if (!tituloTorneio.trim()) {
      alert("Por favor, insira um título para o torneio.");
      return;
    }

    // Gera um ID único limpo baseado no ano e no título (ex: 2026_COPA_OURO)
    const torneioId = `${adminAno}_${tituloTorneio}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toUpperCase();

    try {
      await setDoc(doc(db, "campeonatos_config", torneioId), {
        ano: String(adminAno),
        titulo: tituloTorneio.trim(),
        vagasClassificacao: parseInt(adminVagas),
        faseInicialMataMata: faseMataMata,
        grupos: adminGrupos,
      });

      alert(`Torneio "${tituloTorneio}" salvo com sucesso!`);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar configuração.");
    }
  };

  return (
    <div className="camp-admin-container">
      <h2 className="camp-admin-title">⚙️ Gerenciar Torneios e Estrutura</h2>

      {/* LINHA 1: CONFIGURAÇÕES PRINCIPAIS */}
      <div className="camp-admin-row">
        <div className="camp-admin-field">
          <label>Ano do Torneio:</label>
          <input
            type="text"
            value={adminAno}
            onChange={(e) => setAdminAno(e.target.value)}
          />
        </div>

        <div className="camp-admin-field camp-admin-input-flex">
          <label>Título do Torneio: </label>
          <input
            type="text"
            value={tituloTorneio}
            onChange={(e) => setTituloTorneio(e.target.value)}
            placeholder="Ex: Campeonato Principal"
          />
        </div>

        <div className="camp-admin-field">
          <label>Vagas por Grupo:</label>
          <input
            type="number"
            value={adminVagas}
            onChange={(e) => setAdminVagas(e.target.value)}
            min="1"
            max="10"
          />
        </div>

        <div className="camp-admin-field">
          <label>Início do Mata-Mata:</label>
          <select
            value={faseMataMata}
            onChange={(e) => setFaseMataMata(e.target.value)}
          >
            <option value="oitavas">Oitavas de Final</option>
            <option value="quartas">Quartas de Final</option>
            <option value="semifinal">Semifinal</option>
            <option value="final">Final Direta</option>
          </select>
        </div>
      </div>

      <hr className="camp-admin-divider" />

      {/* LINHA 2: GERENCIAMENTO DE GRUPOS E TIMES */}
      <div className="camp-admin-row align-end">
        <div className="camp-admin-field">
          <label>Selecione o Grupo:</label>
          <select
            value={grupoSelecionado}
            onChange={(e) => setGrupoSelecionado(e.target.value)}
          >
            {Object.keys(adminGrupos).map((g) => (
              <option key={g} value={g}>
                Grupo {g}
              </option>
            ))}
          </select>
        </div>
        <button className="camp-btn camp-btn-dark" onClick={addGrupo}>
          + Criar Novo Grupo
        </button>
      </div>

      <div className="camp-admin-row">
        <input
          className="camp-admin-input-flex"
          type="text"
          placeholder="Nome do Time..."
          value={novoTime}
          onChange={(e) => setNovoTime(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTime()}
        />
        <button className="camp-btn camp-btn-pink" onClick={addTime}>
          Adicionar Time ao Grupo {grupoSelecionado}
        </button>
      </div>

      <div className="camp-admin-groups-grid">
        {Object.keys(adminGrupos).map((g) => (
          <div key={g} className="camp-admin-group-card">
            <div className="camp-admin-group-header">
              <h4>Grupo {g}</h4>
              <button
                className="btn-delete-group"
                onClick={() => removerGrupo(g)}
                title="Apagar Grupo"
              >
                🗑️
              </button>
            </div>
            <ul>
              {adminGrupos[g].map((t, idx) => (
                <li key={idx} className="camp-admin-team-item">
                  {t}
                  <button
                    className="btn-delete-team"
                    onClick={() => removerTime(g, t)}
                    title="Remover Time"
                  >
                    ×
                  </button>
                </li>
              ))}
              {adminGrupos[g].length === 0 && (
                <span className="empty-msg">Vazio</span>
              )}
            </ul>
          </div>
        ))}
      </div>

      <button className="camp-btn camp-btn-save" onClick={salvarConfiguracao}>
        💾 SALVAR TORNEIO NO BANCO
      </button>
    </div>
  );
}
