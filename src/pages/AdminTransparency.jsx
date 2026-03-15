import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import "../styles/admin-transparency.css";

export default function AdminTransparency({ isAdmin }) {
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("INCOME");
  const [loading, setLoading] = useState(false);
  const [transacoes, setTransacoes] = useState([]);

  // Carregar lista em tempo real do Firebase
  useEffect(() => {
    const q = query(
      collection(db, "transparency"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransacoes(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });
    return () => unsubscribe();
  }, []);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!desc || !valor) return alert("Preencha todos os campos!");

    setLoading(true);
    try {
      await addDoc(collection(db, "transparency"), {
        description: desc,
        value:
          tipo === "EXPENSE"
            ? -Math.abs(parseFloat(valor))
            : Math.abs(parseFloat(valor)),
        type: tipo,
        createdAt: serverTimestamp(),
      });
      setDesc("");
      setValor("");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao salvar no banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta movimentação?")) {
      try {
        await deleteDoc(doc(db, "transparency", id));
      } catch (err) {
        console.error("Erro ao deletar:", err);
        alert("Erro ao excluir item.");
      }
    }
  };

  return (
    <div className="admin-box">
      {isAdmin && (
        <form onSubmit={handleAddEntry} className="admin-form-transparency">
          <h3>Nova Movimentação</h3>
          <input
            placeholder="Descrição (ex: Aluguel da Quadra)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <input
            type="number"
            placeholder="Valor (R$)"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="INCOME">Entrada (+)</option>
            <option value="EXPENSE">Saída (-)</option>
          </select>
          <button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Adicionar Item"}
          </button>
        </form>
      )}

      <div className="transparency-list">
        <h3>Histórico Financeiro</h3>
        {transacoes.map((t) => (
          <div key={t.id} className="t-item">
            <div className="t-info">
              <span className="t-desc">{t.description}</span>
              <small className="t-date">
                {t.createdAt?.toDate().toLocaleDateString("pt-BR")}
              </small>
            </div>

            <div className="t-actions">
              <span className={t.value > 0 ? "text-green" : "text-red"}>
                {t.value.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
              {isAdmin && (
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(t.id)}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
