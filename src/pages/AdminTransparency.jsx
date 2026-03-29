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
  const [quantidade, setQuantidade] = useState(1);
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
    if (!desc || !valor || !quantidade)
      return alert("Preencha todos os campos!");

    setLoading(true);

    // Cálculo: Valor Unitário * Quantidade
    const totalValue = parseFloat(valor) * parseInt(quantidade);
    const numericValue =
      tipo === "EXPENSE" ? -Math.abs(totalValue) : Math.abs(totalValue);

    try {
      if (editingId) {
        // ATUALIZAR
        await updateDoc(doc(db, "transparency", editingId), {
          description: desc,
          value: numericValue,
          unitValue: parseFloat(valor),
          quantity: parseInt(quantidade),
          type: tipo,
          updatedAt: serverTimestamp(),
        });
        setEditingId(null);
      } else {
        // ADICIONAR NOVO
        await addDoc(collection(db, "transparency"), {
          description: desc,
          value: numericValue,
          unitValue: parseFloat(valor),
          quantity: parseInt(quantidade),
          type: tipo,
          createdAt: serverTimestamp(),
        });
      }

      // Limpar campos
      setDesc("");
      setValor("");
      setQuantidade(1);
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
    // Tenta carregar o unitValue salvo, senão pega o absoluto do total
    setValor(t.unitValue || Math.abs(t.value));
    setQuantidade(t.quantity || 1);
    setTipo(t.type);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDesc("");
    setValor("");
    setQuantidade(1);
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
    <div className="transparency-page">
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
              className="input-full"
            />

            <div
              className="input-group-row"
              style={{ display: "flex", gap: "10px", width: "100%" }}
            >
              <input
                type="number"
                step="0.01"
                placeholder="Valor Unit. (R$)"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                style={{ flex: 2 }}
              />
              <input
                type="number"
                placeholder="Qtd"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>

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
          {transacoes.length === 0 && (
            <p className="no-data">Nenhuma movimentação registrada.</p>
          )}

          {transacoes.map((t) => (
            <div key={t.id} className="t-item">
              <div className="t-info">
                <span className="t-desc">
                  {t.description}
                  {t.quantity > 1 && (
                    <span className="qty-tag"> x{t.quantity}</span>
                  )}
                </span>
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
