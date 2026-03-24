import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import "../styles/admin-transparency.css";
import Footer from "../components/Footer";

export default function AdminTransparency({ isAdmin }) {
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("INCOME");
  const [loading, setLoading] = useState(false);
  const [transacoes, setTransacoes] = useState([]);

  // Estado para controle de edição
  const [editingId, setEditingId] = useState(null);

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

  // Função para salvar (Novo ou Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desc || !valor) return alert("Preencha todos os campos!");

    setLoading(true);
    const numericValue =
      tipo === "EXPENSE"
        ? -Math.abs(parseFloat(valor))
        : Math.abs(parseFloat(valor));

    try {
      if (editingId) {
        // LÓGICA DE ATUALIZAR
        await updateDoc(doc(db, "transparency", editingId), {
          description: desc,
          value: numericValue,
          type: tipo,
          updatedAt: serverTimestamp(), // opcional: saber quando foi editado
        });
        setEditingId(null);
      } else {
        // LÓGICA DE ADICIONAR NOVO
        await addDoc(collection(db, "transparency"), {
          description: desc,
          value: numericValue,
          type: tipo,
          createdAt: serverTimestamp(),
        });
      }

      // Limpar campos
      setDesc("");
      setValor("");
      setTipo("INCOME");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao processar operação.");
    } finally {
      setLoading(false);
    }
  };

  // Prepara os campos para edição
  const startEdit = (t) => {
    setEditingId(t.id);
    setDesc(t.description);
    setValor(Math.abs(t.value)); // Carrega valor positivo para o input
    setTipo(t.type);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDesc("");
    setValor("");
    setTipo("INCOME");
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
    <div>
      <div className="admin-box">
        {isAdmin && (
          <form onSubmit={handleSubmit} className="admin-form-transparency">
            <h3>
              {editingId ? "📝 Editar Movimentação" : "➕ Nova Movimentação"}
            </h3>
            <input
              placeholder="Descrição (ex: Aluguel da Quadra)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor (R$)"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="INCOME">Entrada (+)</option>
              <option value="EXPENSE">Saída (-)</option>
            </select>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="save-btn">
                {loading
                  ? "Salvando..."
                  : editingId
                    ? "Atualizar"
                    : "Adicionar Item"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="cancel-btn"
                >
                  Cancelar
                </button>
              )}
            </div>
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
                  <div className="admin-btns">
                    <button className="edit-btn" onClick={() => startEdit(t)}>
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(t.id)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
