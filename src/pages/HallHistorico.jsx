import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import "../styles/Home/hallHistorico.css";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const HallHistorico = ({ isAdmin }) => {
  const navigate = useNavigate();
  const [listaHistorica, setListaHistorica] = useState([]);
  const [jogadoresDB, setJogadoresDB] = useState([]); // Lista de jogadores reais para o Select
  const [loading, setLoading] = useState(true);

  // States do Formulário
  const [novoNome, setNovoNome] = useState("");
  const [titulo, setTitulo] = useState("");
  const [anoIn, setAnoIn] = useState("");
  const [anoOut, setAnoOut] = useState("");
  const [linkedPlayerId, setLinkedPlayerId] = useState(""); // NOVO: ID do jogador vinculado
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    // 1. Busca Memorial
    const qMemorial = query(
      collection(db, "memorial"),
      orderBy("entrada", "desc"),
    );
    const unsubMemorial = onSnapshot(qMemorial, (snapshot) => {
      const dados = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setListaHistorica(dados);
      setLoading(false);
    });

    // 2. Busca Jogadores Atuais (para o dropdown de link)
    const qPlayers = query(collection(db, "players"), orderBy("name", "asc"));
    const unsubPlayers = onSnapshot(qPlayers, (snapshot) => {
      const pData = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setJogadoresDB(pData);
    });

    return () => {
      unsubMemorial();
      unsubPlayers();
    };
  }, []);

  const salvarNoHall = async () => {
    if (!novoNome || !anoIn) return;

    const data = {
      nome: novoNome,
      titulo: titulo,
      entrada: String(anoIn),
      saida: String(anoOut) || "",
      playerId: linkedPlayerId || null, // Salva o vínculo com o ID do banco
      updatedAt: new Date(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "memorial", editingId), data);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "memorial"), {
          ...data,
          createdAt: new Date(),
        });
      }
      limparCampos();
    } catch (e) {
      console.error("Erro ao salvar:", e);
    }
  };

  const prepararEdicao = (p) => {
    setEditingId(p.id);
    setNovoNome(p.nome);
    setTitulo(p.titulo || "");
    setAnoIn(p.entrada);
    setAnoOut(p.saida || "");
    setLinkedPlayerId(p.playerId || ""); // Carrega o link existente
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const limparCampos = () => {
    setNovoNome("");
    setTitulo("");
    setAnoIn("");
    setAnoOut("");
    setLinkedPlayerId("");
    setEditingId(null);
  };

  const removerDoHall = async (id) => {
    if (window.confirm("Deseja remover este membro do memorial?")) {
      await deleteDoc(doc(db, "memorial", id));
    }
  };

  const anos = [...new Set(listaHistorica.map((p) => p.entrada))].sort(
    (a, b) => b - a,
  );

  if (loading) return <div className="hall-loader">Carregando Memorial...</div>;

  const handlePlayerClick = (id) => {
    if (id) {
      navigate(`/player/${id}`); // Ajuste a rota conforme o seu App.js
    }
  };

  return (
    <div>
      <div className="hall-vertical-container">
        <h1 className="hall-title">MEMORIAL DE MEMBROS</h1>

        {isAdmin && (
          <div className="hall-admin-card">
            <h3>
              {editingId ? "📝 Editando Membro" : "➕ Adicionar novo membro"}
            </h3>
            <div className="hall-admin-form">
              <input
                type="text"
                placeholder="Nome do Jogador"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
              />

              {/* SELECT PARA LINKAR JOGADOR */}
              <select
                value={linkedPlayerId}
                onChange={(e) => setLinkedPlayerId(e.target.value)}
                className="hall-select-link"
              >
                <option value="">
                  Vincular a um jogador atual? (Opcional)
                </option>
                {jogadoresDB.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Título/Apelido (Ex: O Matador)"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              <input
                type="number"
                placeholder="Ano Entrada"
                value={anoIn}
                onChange={(e) => setAnoIn(e.target.value)}
              />
              <input
                type="number"
                placeholder="Ano Saída (vazio se ativo)"
                value={anoOut}
                onChange={(e) => setAnoOut(e.target.value)}
              />
              <div className="hall-form-btns">
                <button onClick={salvarNoHall} className="btn-save">
                  {editingId ? "Atualizar Dados" : "Gravar no Banco"}
                </button>
                {editingId && (
                  <button onClick={limparCampos} className="btn-cancel">
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="hall-list-vertical">
          {anos.map((ano) => (
            <div key={ano} className="hall-group">
              <h2 className="year-label">{ano}</h2>
              <div className="hall-items-grid">
                {listaHistorica
                  .filter((p) => p.entrada === ano)
                  .map((p) => (
                    <div
                      key={p.id}
                      className={`hall-item ${p.saida ? "retired" : "active"}`}
                    >
                      <div className="hall-item-info">
                        <div className="name-wrapper">
                          <span
                            className={`player-name ${p.playerId ? "clickable-link" : ""}`}
                            onClick={() => handlePlayerClick(p.playerId)}
                            style={{
                              cursor: p.playerId ? "pointer" : "default",
                            }}
                          >
                            {p.nome}{" "}
                            {p.playerId && (
                              <small className="linked-badge">🔗</small>
                            )}
                          </span>
                          {p.titulo && (
                            <span className="player-nickname">
                              "{p.titulo}"
                            </span>
                          )}
                        </div>
                        <span className="player-dates">
                          {p.entrada} — {p.saida || "Atualmente"}
                        </span>
                      </div>
                      {isAdmin && (
                        <div className="hall-item-actions">
                          <button
                            className="btn-edit"
                            onClick={() => prepararEdicao(p)}
                          >
                            ✎
                          </button>
                          <button
                            className="btn-del"
                            onClick={() => removerDoHall(p.id)}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HallHistorico;
