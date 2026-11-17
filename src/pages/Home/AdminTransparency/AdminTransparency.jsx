import { useState, useEffect, useMemo } from "react";
import { db } from "../../../firebase";
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
import "./admin-transparency.css";
import Footer from "../../../components/Footer";

// ==========================================
// ÍCONES DESENHADOS (no lugar dos emojis)
// ==========================================
const TP_ICO = {
  card: "M3 6.5h18v11H3zM3 10h18M6.5 14.5h4",
  duo: "M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM16 11a3 3 0 1 0 0-6M2.5 20c.4-3.6 2.9-6 6-6s5.6 2.4 6 6M16.5 14c2.6.3 4.6 2.6 5 6",
  gift: "M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1.5-3-5-3.5-5-1.2C7 7 9.5 7 12 7zM12 7c1.5-3 5-3.5 5-1.2C17 7 14.5 7 12 7z",
  ticket:
    "M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3zM14 4v2.5M14 9v2M14 13.5V16",
  shirt:
    "M8.5 3.5 4 6l1.5 4L8 9v11h8V9l2.5 1L20 6l-4.5-2.5a3.5 3.5 0 0 1-7 0z",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  court: "M3 5h18v14H3zM12 5v14M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h3v6H3M21 9h-3v6h3",
  ball: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5l3.8 2.8-1.5 4.4H9.7l-1.5-4.4zM12 3v4.5M15.8 10.3l4.3-1.6M14.3 14.7l2.6 3.8M9.7 14.7l-2.6 3.8M8.2 10.3 3.9 8.7",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  trophy:
    "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3M12 13v4M8.5 20h7M10 17h4",
  cheers: "M6 3h6l-.5 7a2.5 2.5 0 0 1-5 0zM9 12.5V20M6.5 20h5M14 6h5l-.4 5a2.1 2.1 0 0 1-4.2 0zM16.5 13v7M14.5 20h4",
  download: "M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M4 19h16",
  coins: "M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
  edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  trash: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5",
  search: "M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM16 16l5 5",
};
const TpIco = ({ n, className = "tp-ico" }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d={TP_ICO[n] || TP_ICO.plus} />
  </svg>
);

// ==========================================
// CATEGORIAS (ícone + nome) POR TIPO
// ==========================================
const CATEGORIES = {
  INCOME: [
    { id: "Mensalidade", icon: "card" },
    { id: "Patrocínio", icon: "duo" },
    { id: "Doação", icon: "gift" },
    { id: "Rifa / Evento", icon: "ticket" },
    { id: "Venda de Uniformes", icon: "shirt" },
    { id: "Outros", icon: "plus" },
  ],
  EXPENSE: [
    { id: "Aluguel de Quadra", icon: "court" },
    { id: "Uniformes", icon: "shirt" },
    { id: "Material Esportivo", icon: "ball" },
    { id: "Arbitragem", icon: "flag" },
    { id: "Inscrição / Campeonato", icon: "trophy" },
    { id: "Confraternização", icon: "cheers" },
    { id: "Outros", icon: "minus" },
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
  (type === "EXPENSE" ? "minus" : "plus");

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
            <TpIco n="download" /> Exportar CSV
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
              <h4 className="tp-panel-title">
                <TpIco n="coins" /> De onde vem o dinheiro
              </h4>
              {resumo.incomeCats.length === 0 && (
                <p className="no-data">Sem entradas.</p>
              )}
              {resumo.incomeCats.map((c) => (
                <div key={c.name} className="tp-bar-row">
                  <div className="tp-bar-head">
                    <span className="tp-bar-name">
                      <TpIco n={getCatIcon("INCOME", c.name)} /> {c.name}
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
              <h4 className="tp-panel-title">
                <TpIco n="receipt" /> Para onde vai o dinheiro
              </h4>
              {resumo.expenseCats.length === 0 && (
                <p className="no-data">Sem saídas.</p>
              )}
              {resumo.expenseCats.map((c) => (
                <div key={c.name} className="tp-bar-row">
                  <div className="tp-bar-head">
                    <span className="tp-bar-name">
                      <TpIco n={getCatIcon("EXPENSE", c.name)} /> {c.name}
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
              <TpIco n={editingId ? "edit" : "plus"} />
              {editingId ? "Editar movimentação" : "Nova movimentação"}
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
                    {c.id}
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

            <label className="tp-search-wrap">
              <TpIco n="search" />
              <input
                className="tp-search"
                placeholder="Buscar descrição..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </label>
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
                    <div className="t-icon">
                      <TpIco n={getCatIcon(type, cat)} />
                    </div>

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
                      <span
                        className={`t-value ${v > 0 ? "text-green" : "text-red"}`}
                      >
                        {brl(v)}
                      </span>

                      {isAdmin && (
                        <div className="admin-btns">
                          <button
                            className="edit-btn"
                            onClick={() => startEdit(t)}
                            title="Editar"
                            aria-label="Editar"
                          >
                            <TpIco n="edit" />
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(t.id)}
                            title="Excluir"
                            aria-label="Excluir"
                          >
                            <TpIco n="trash" />
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
