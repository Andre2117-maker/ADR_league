import { useState, useEffect, useMemo } from "react";
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
import "../styles/Home/admin-transparency.css";
import Footer from "../components/Footer";

// ==========================================
// CATEGORIAS (ícone + nome) POR TIPO
// ==========================================
const CATEGORIES = {
  INCOME: [
    { id: "Mensalidade", icon: "💳" },
    { id: "Patrocínio", icon: "🤝" },
    { id: "Doação", icon: "🎁" },
    { id: "Rifa / Evento", icon: "🎟️" },
    { id: "Venda de Uniformes", icon: "👕" },
    { id: "Outros", icon: "➕" },
  ],
  EXPENSE: [
    { id: "Aluguel de Quadra", icon: "🏟️" },
    { id: "Uniformes", icon: "👕" },
    { id: "Material Esportivo", icon: "⚽" },
    { id: "Arbitragem", icon: "🟨" },
    { id: "Inscrição / Campeonato", icon: "🏆" },
    { id: "Confraternização", icon: "🍻" },
    { id: "Outros", icon: "➖" },
  ],
};

const ALL_CATEGORY_NAMES = [
  ...new Set([
    ...CATEGORIES.INCOME.map((c) => c.id),
    ...CATEGORIES.EXPENSE.map((c) => c.id),
  ]),
];

const getCatIcon = (type, name) =>
  CATEGORIES[type]?.find((c) => c.id === name)?.icon ||
  (type === "EXPENSE" ? "➖" : "➕");

const brl = (n) =>
  Number(n || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const toInputDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Data efetiva da movimentação (campo "date" novo, senão createdAt antigo)
const getTxDate = (t) => {
  if (t.date) {
    const [y, m, d] = t.date.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
};

export default function AdminTransparency({ isAdmin }) {
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [tipo, setTipo] = useState("INCOME");
  const [categoria, setCategoria] = useState("Outros");
  const [dataMov, setDataMov] = useState(toInputDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [transacoes, setTransacoes] = useState([]);

  // Filtros da lista
  const [filtroTipo, setFiltroTipo] = useState("ALL");
  const [filtroCat, setFiltroCat] = useState("ALL");
  const [busca, setBusca] = useState("");

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

  // ==========================================
  // RESUMO FINANCEIRO E DISTRIBUIÇÃO POR CATEGORIA
  // ==========================================
  const resumo = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCat = { INCOME: {}, EXPENSE: {} };

    transacoes.forEach((t) => {
      const v = Number(t.value) || 0;
      const type = v >= 0 ? "INCOME" : "EXPENSE";
      const cat = t.category || "Outros";
      if (type === "INCOME") income += v;
      else expense += Math.abs(v);
      byCat[type][cat] = (byCat[type][cat] || 0) + Math.abs(v);
    });

    const toList = (obj, total) =>
      Object.entries(obj)
        .map(([name, total_]) => ({
          name,
          total: total_,
          pct: total > 0 ? (total_ / total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

    return {
      income,
      expense,
      balance: income - expense,
      count: transacoes.length,
      incomeCats: toList(byCat.INCOME, income),
      expenseCats: toList(byCat.EXPENSE, expense),
    };
  }, [transacoes]);

  // ==========================================
  // LISTA FILTRADA E AGRUPADA POR MÊS
  // ==========================================
  const grupos = useMemo(() => {
    const term = busca.trim().toLowerCase();

    const filtradas = transacoes
      .filter((t) => {
        const v = Number(t.value) || 0;
        if (filtroTipo === "INCOME" && v < 0) return false;
        if (filtroTipo === "EXPENSE" && v >= 0) return false;
        if (filtroCat !== "ALL" && (t.category || "Outros") !== filtroCat)
          return false;
        if (
          term &&
          !String(t.description || "")
            .toLowerCase()
            .includes(term)
        )
          return false;
        return true;
      })
      .sort((a, b) => getTxDate(b) - getTxDate(a));

    const map = new Map();
    filtradas.forEach((t) => {
      const d = getTxDate(t);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: d
            .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
            .toUpperCase(),
          items: [],
          income: 0,
          expense: 0,
        });
      }
      const g = map.get(key);
      g.items.push(t);
      const v = Number(t.value) || 0;
      if (v >= 0) g.income += v;
      else g.expense += Math.abs(v);
    });

    return Array.from(map.values());
  }, [transacoes, filtroTipo, filtroCat, busca]);

  const totalFiltradas = grupos.reduce((acc, g) => acc + g.items.length, 0);

  // Troca de tipo mantém a categoria só se ela existir no novo tipo
  const changeTipo = (novo) => {
    setTipo(novo);
    if (!CATEGORIES[novo].some((c) => c.id === categoria)) {
      setCategoria("Outros");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setDesc("");
    setValor("");
    setQuantidade(1);
    setTipo("INCOME");
    setCategoria("Outros");
    setDataMov(toInputDate(new Date()));
  };

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

    const payload = {
      description: desc,
      value: numericValue,
      unitValue: parseFloat(valor),
      quantity: parseInt(quantidade),
      type: tipo,
      category: categoria,
      date: dataMov,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "transparency", editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "transparency"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
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
    setValor(t.unitValue || Math.abs(t.value));
    setQuantidade(t.quantity || 1);
    setTipo(t.type || (t.value < 0 ? "EXPENSE" : "INCOME"));
    setCategoria(t.category || "Outros");
    setDataMov(t.date || toInputDate(getTxDate(t)));
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  // Exporta o que está na tela (já filtrado) para CSV
  const exportCSV = () => {
    const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const linhas = [
      ["Data", "Descrição", "Categoria", "Tipo", "Qtd", "Valor Unit.", "Total"],
    ];
    grupos.forEach((g) =>
      g.items.forEach((t) => {
        const v = Number(t.value) || 0;
        linhas.push([
          getTxDate(t).toLocaleDateString("pt-BR"),
          t.description,
          t.category || "Outros",
          v >= 0 ? "Entrada" : "Saída",
          t.quantity || 1,
          String(t.unitValue ?? Math.abs(v)).replace(".", ","),
          String(v).replace(".", ","),
        ]);
      }),
    );
    const csv = "\uFEFF" + linhas.map((l) => l.map(esc).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transparencia-${toInputDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewTotal = (parseFloat(valor) || 0) * (parseInt(quantidade) || 0);

  return (
    <div className="transparency-page">
      <div className="admin-box">
        {/* ============ CABEÇALHO ============ */}
        <header className="tp-hero">
          <div>
            <h2 className="tp-title">TRANSPARÊNCIA</h2>
            <p className="tp-subtitle">
              Prestação de contas do clube · atualizada em tempo real
            </p>
          </div>
          <button
            type="button"
            className="tp-export-btn"
            onClick={exportCSV}
            disabled={totalFiltradas === 0}
          >
            ⬇ Exportar CSV
          </button>
        </header>

        {/* ============ CARDS DE RESUMO ============ */}
        <section className="tp-summary">
          <div className="tp-card balance">
            <span className="tp-card-label">Saldo em caixa</span>
            <span
              className={`tp-card-value ${resumo.balance >= 0 ? "text-green" : "text-red"}`}
            >
              {brl(resumo.balance)}
            </span>
            <span className="tp-card-sub">Entradas − saídas</span>
          </div>

          <div className="tp-card income">
            <span className="tp-card-label">Total arrecadado</span>
            <span className="tp-card-value">{brl(resumo.income)}</span>
            <span className="tp-card-sub">
              {resumo.incomeCats[0]
                ? `Maior fonte: ${resumo.incomeCats[0].name}`
                : "Sem entradas"}
            </span>
          </div>

          <div className="tp-card expense">
            <span className="tp-card-label">Total gasto</span>
            <span className="tp-card-value">{brl(resumo.expense)}</span>
            <span className="tp-card-sub">
              {resumo.expenseCats[0]
                ? `Maior gasto: ${resumo.expenseCats[0].name}`
                : "Sem saídas"}
            </span>
          </div>

          <div className="tp-card count">
            <span className="tp-card-label">Movimentações</span>
            <span className="tp-card-value">{resumo.count}</span>
            <span className="tp-card-sub">Registros no histórico</span>
          </div>
        </section>

        {/* ============ DE ONDE VEM / PARA ONDE VAI ============ */}
        {resumo.count > 0 && (
          <section className="tp-breakdown">
            <div className="tp-panel">
              <h4 className="tp-panel-title">💰 De onde vem o dinheiro</h4>
              {resumo.incomeCats.length === 0 && (
                <p className="no-data">Sem entradas.</p>
              )}
              {resumo.incomeCats.map((c) => (
                <div key={c.name} className="tp-bar-row">
                  <div className="tp-bar-head">
                    <span>
                      {getCatIcon("INCOME", c.name)} {c.name}
                    </span>
                    <span>
                      {brl(c.total)} · {c.pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="tp-bar-track">
                    <div
                      className="tp-bar-fill income"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="tp-panel">
              <h4 className="tp-panel-title">🧾 Para onde vai o dinheiro</h4>
              {resumo.expenseCats.length === 0 && (
                <p className="no-data">Sem saídas.</p>
              )}
              {resumo.expenseCats.map((c) => (
                <div key={c.name} className="tp-bar-row">
                  <div className="tp-bar-head">
                    <span>
                      {getCatIcon("EXPENSE", c.name)} {c.name}
                    </span>
                    <span>
                      {brl(c.total)} · {c.pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="tp-bar-track">
                    <div
                      className="tp-bar-fill expense"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ FORMULÁRIO (ADMIN) ============ */}
        {isAdmin && (
          <form onSubmit={handleSubmit} className="admin-form-transparency">
            <h3>
              {editingId ? "📝 Editar Movimentação" : "➕ Nova Movimentação"}
            </h3>

            <div className="f-field f-desc">
              <label>Descrição</label>
              <input
                placeholder="ex: Aluguel da Quadra"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="input-full"
              />
            </div>

            <div className="f-field f-val">
              <label>Valor unit. (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>

            <div className="f-field f-qty">
              <label>Qtd</label>
              <input
                type="number"
                placeholder="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>

            <div className="f-field f-type">
              <label>Tipo</label>
              <div className="tp-type-toggle">
                <button
                  type="button"
                  className={tipo === "INCOME" ? "active income" : ""}
                  onClick={() => changeTipo("INCOME")}
                >
                  Entrada (+)
                </button>
                <button
                  type="button"
                  className={tipo === "EXPENSE" ? "active expense" : ""}
                  onClick={() => changeTipo("EXPENSE")}
                >
                  Saída (−)
                </button>
              </div>
            </div>

            <div className="f-field f-cat">
              <label>Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIES[tipo].map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="f-field f-date">
              <label>Data</label>
              <input
                type="date"
                value={dataMov}
                onChange={(e) => setDataMov(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <span className="tp-preview">
                Total:{" "}
                <b className={tipo === "INCOME" ? "text-green" : "text-red"}>
                  {tipo === "EXPENSE" ? "−" : "+"}
                  {brl(previewTotal)}
                </b>
              </span>
              <div className="form-actions-btns">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="cancel-btn"
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" disabled={loading} className="save-btn">
                  {loading
                    ? "Salvando..."
                    : editingId
                      ? "Atualizar"
                      : "Adicionar Item"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ============ HISTÓRICO ============ */}
        <div className="transparency-list">
          <h3>Histórico Financeiro</h3>

          {/* Filtros */}
          <div className="tp-toolbar">
            <div className="tp-tabs">
              {[
                ["ALL", "Tudo"],
                ["INCOME", "Entradas"],
                ["EXPENSE", "Saídas"],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  className={`tp-tab ${filtroTipo === k ? "active" : ""}`}
                  onClick={() => setFiltroTipo(k)}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              className="tp-select"
              value={filtroCat}
              onChange={(e) => setFiltroCat(e.target.value)}
            >
              <option value="ALL">Todas as categorias</option>
              {ALL_CATEGORY_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              className="tp-search"
              placeholder="🔍 Buscar descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {transacoes.length === 0 && (
            <p className="no-data">Nenhuma movimentação registrada.</p>
          )}
          {transacoes.length > 0 && totalFiltradas === 0 && (
            <p className="no-data">Nada encontrado com esses filtros.</p>
          )}

          {grupos.map((g) => (
            <div key={g.key} className="t-month-group">
              <div className="t-month-header">
                <h4>{g.label}</h4>
                <div className="t-month-totals">
                  <span className="text-green">+{brl(g.income)}</span>
                  <span className="text-red">−{brl(g.expense)}</span>
                  <span
                    className={`t-month-balance ${g.income - g.expense >= 0 ? "text-green" : "text-red"}`}
                  >
                    = {brl(g.income - g.expense)}
                  </span>
                </div>
              </div>

              {g.items.map((t) => {
                const v = Number(t.value) || 0;
                const type = v >= 0 ? "INCOME" : "EXPENSE";
                const cat = t.category || "Outros";
                return (
                  <div key={t.id} className={`t-item ${type.toLowerCase()}`}>
                    <div className="t-icon">{getCatIcon(type, cat)}</div>

                    <div className="t-info">
                      <span className="t-desc">
                        {t.description}
                        {t.quantity > 1 && (
                          <span className="qty-tag"> x{t.quantity}</span>
                        )}
                      </span>
                      <div className="t-meta">
                        <span className="t-cat-pill">{cat}</span>
                        <small className="t-date">
                          {getTxDate(t).toLocaleDateString("pt-BR")}
                        </small>
                        {t.quantity > 1 && t.unitValue != null && (
                          <small className="t-unit">
                            {brl(t.unitValue)} / un.
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="t-actions">
                      <span className={v > 0 ? "text-green" : "text-red"}>
                        {brl(v)}
                      </span>

                      {isAdmin && (
                        <div className="admin-btns">
                          <button
                            className="edit-btn"
                            onClick={() => startEdit(t)}
                          >
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
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
