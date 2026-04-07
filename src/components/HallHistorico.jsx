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
import Footer from "./Footer";

const HallHistorico = ({ isAdmin }) => {
  const [listaHistorica, setListaHistorica] = useState([]);
  const [loading, setLoading] = useState(true);

  // States do Formulário (Add e Edit)
  const [novoNome, setNovoNome] = useState("");
  const [titulo, setTitulo] = useState(""); // Novo campo para títulos/apelidos
  const [anoIn, setAnoIn] = useState("");
  const [anoOut, setAnoOut] = useState("");
  const [editingId, setEditingId] = useState(null); // ID da pessoa sendo editada

  useEffect(() => {
    const q = query(collection(db, "memorial"), orderBy("entrada", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setListaHistorica(dados);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const salvarNoHall = async () => {
    if (!novoNome || !anoIn) return;

    const data = {
      nome: novoNome,
      titulo: titulo, // "O Matador", "Capitão", etc.
      entrada: String(anoIn),
      saida: String(anoOut) || "",
      updatedAt: new Date(),
    };

    try {
      if (editingId) {
        // MODO EDIÇÃO
        await updateDoc(doc(db, "memorial", editingId), data);
        setEditingId(null);
      } else {
        // MODO ADIÇÃO
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
    window.scrollTo({ top: 0, behavior: "smooth" }); // Sobe para o form
  };

  const limparCampos = () => {
    setNovoNome("");
    setTitulo("");
    setAnoIn("");
    setAnoOut("");
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
                placeholder="Nome do Jogador (Ex: João)"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
              />
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
                          <span className="player-name">{p.nome}</span>
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
