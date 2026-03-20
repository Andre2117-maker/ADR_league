import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Ajuste o caminho conforme seu projeto
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import "../styles/hallHistorico.css";

const HallHistorico = ({ isAdmin }) => {
  const [listaHistorica, setListaHistorica] = useState([]);
  const [loading, setLoading] = useState(true);

  // States do Formulário
  const [novoNome, setNovoNome] = useState("");
  const [anoIn, setAnoIn] = useState("");
  const [anoOut, setAnoOut] = useState("");

  // BUSCAR DADOS DO FIREBASE EM TEMPO REAL
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

  const adicionarAoHall = async () => {
    if (!novoNome || !anoIn) return;

    try {
      await addDoc(collection(db, "memorial"), {
        nome: novoNome,
        entrada: String(anoIn),
        saida: String(anoOut) || "",
        createdAt: new Date(),
      });

      // Limpar campos
      setNovoNome("");
      setAnoIn("");
      setAnoOut("");
    } catch (e) {
      console.error("Erro ao salvar:", e);
    }
  };

  const removerDoHall = async (id) => {
    if (window.confirm("Deseja remover este membro do memorial?")) {
      await deleteDoc(doc(db, "memorial", id));
    }
  };

  // Agrupar por ano de entrada para o layout
  const anos = [...new Set(listaHistorica.map((p) => p.entrada))].sort(
    (a, b) => b - a,
  );

  if (loading) return <div className="hall-loader">Carregando Memorial...</div>;

  return (
    <div className="hall-vertical-container">
      <h1 className="hall-title"> MEMORIAL DE MEMBROS</h1>

      {isAdmin && (
        <div className="hall-admin-card">
          <h3>Adicionar novo membro</h3>
          <div className="hall-admin-form">
            <input
              type="text"
              placeholder="Nome do Jogador"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
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
            <button onClick={adicionarAoHall}>Gravar no Banco</button>
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
                      <span className="player-name">{p.nome}</span>
                      <span className="player-dates">
                        {p.entrada} — {p.saida || "Atualmente"}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        className="btn-del"
                        onClick={() => removerDoHall(p.id)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HallHistorico;
