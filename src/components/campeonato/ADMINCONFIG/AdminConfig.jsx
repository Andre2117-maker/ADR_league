import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import "./AdminConfig.css";

export default function AdminConfig({ loadData }) {
  const [adminAno, setAdminAno] = useState("2026");
  const [adminVagas, setAdminVagas] = useState(2);
  const [adminGrupos, setAdminGrupos] = useState({ A: [] });
  const [novoTime, setNovoTime] = useState("");
  const [grupoSelecionado, setGrupoSelecionado] = useState("A");

  const addGrupo = () => {
    const novoNome = prompt("Nome do Grupo (ex: B, C, D):");
    if (novoNome && !adminGrupos[novoNome]) {
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
    try {
      await setDoc(doc(db, "campeonatos_config", adminAno), {
        vagasClassificacao: parseInt(adminVagas),
        grupos: adminGrupos,
      });
      alert("Configuração salva com sucesso! Atualize a página.");
      loadData();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar configuração.");
    }
  };

  return (
    <div className="camp-admin-container">
      <h2 className="camp-admin-title">⚙️ Montar Estrutura do Torneio</h2>

      <div className="camp-admin-row">
        <div className="camp-admin-field">
          <label>Ano do Torneio:</label>
          <input
            type="text"
            value={adminAno}
            onChange={(e) => setAdminAno(e.target.value)}
          />
        </div>
        <div className="camp-admin-field">
          <label>Classificados por Grupo (Vagas):</label>
          <input
            type="number"
            value={adminVagas}
            onChange={(e) => setAdminVagas(e.target.value)}
            min="1"
            max="10"
          />
        </div>
      </div>

      <hr className="camp-admin-divider" />

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
        💾 SALVAR ESTRUTURA NO BANCO
      </button>
    </div>
  );
}
