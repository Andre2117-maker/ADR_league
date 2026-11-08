import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import "./hallHistorico.css";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { getShirtNumber, useClubMode } from "../../utils/shirtNumber";

const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Ativos" },
  { id: "retired", label: "Aposentados" },
];

const HallHistorico = ({ isAdmin }) => {
  const navigate = useNavigate();
  const clubMode = useClubMode();
  const currentYear = new Date().getFullYear();

  const [listaHistorica, setListaHistorica] = useState([]);
  const [jogadoresDB, setJogadoresDB] = useState([]); // jogadores completos (foto, nº, posições...)
  const [matches, setMatches] = useState([]); // para calcular J/G/A de carreira
  const [awardsByName, setAwardsByName] = useState({}); // prêmios do Hall da Fama
  const [loading, setLoading] = useState(true);

  // Filtros da página
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // States do formulário (admin)
  const [novoNome, setNovoNome] = useState("");
  const [titulo, setTitulo] = useState("");
  const [anoIn, setAnoIn] = useState("");
  const [anoOut, setAnoOut] = useState("");
  const [linkedPlayerId, setLinkedPlayerId] = useState("");
  const [editingId, setEditingId] = useState(null);

  /* ---------- dados em tempo real ---------- */
  useEffect(() => {
    const qMemorial = query(
      collection(db, "memorial"),
      orderBy("entrada", "desc"),
    );
    const unsubMemorial = onSnapshot(qMemorial, (snapshot) => {
      setListaHistorica(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const qPlayers = query(collection(db, "players"), orderBy("name", "asc"));
    const unsubPlayers = onSnapshot(qPlayers, (snapshot) => {
      setJogadoresDB(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubMemorial();
      unsubPlayers();
    };
  }, []);

  /* ---------- dados de leitura única (partidas e prêmios) ---------- */
  useEffect(() => {
    let alive = true;

    getDocs(collection(db, "matches"))
      .then((snap) => {
        if (alive) setMatches(snap.docs.map((d) => d.data()));
      })
      .catch((err) => console.error("Erro ao carregar partidas:", err));

    getDocs(collection(db, "awards"))
      .then((snap) => {
        const map = {};
        snap.forEach((d) => {
          (d.data().items || []).forEach((it) => {
            if (!it.winner) return;
            const k = norm(it.winner);
            map[k] = (map[k] || 0) + 1;
          });
        });
        if (alive) setAwardsByName(map);
      })
      .catch(() => {}); // coleção opcional

    return () => {
      alive = false;
    };
  }, []);

  /* ---------- derivados ---------- */
  const playersById = useMemo(() => {
    const m = {};
    jogadoresDB.forEach((p) => (m[p.id] = p));
    return m;
  }, [jogadoresDB]);

  // Estatísticas de carreira por jogador (partidas + ajustes manuais)
  const careerById = useMemo(() => {
    const map = {};
    jogadoresDB.forEach((p) => {
      map[p.id] = {
        games: 0,
        goals: Number(p.manualGoals || 0),
        assists: Number(p.manualAssists || 0),
      };
    });
    matches.forEach((m) => {
      [...(m.teamA?.players || []), ...(m.teamB?.players || [])].forEach(
        (id) => {
          if (map[id]) map[id].games++;
        },
      );
      (m.events || []).forEach((e) => {
        const t = map[e.playerId];
        if (!t) return;
        if (e.type === "GOAL") t.goals++;
        if (e.type === "ASSIST") t.assists++;
      });
    });
    return map;
  }, [jogadoresDB, matches]);

  const firstYear = useMemo(() => {
    const ys = listaHistorica.map((p) => Number(p.entrada)).filter(Boolean);
    return ys.length ? Math.min(...ys) : currentYear;
  }, [listaHistorica, currentYear]);

  const summary = useMemo(() => {
    const total = listaHistorica.length;
    const active = listaHistorica.filter((p) => !p.saida).length;
    const founders = listaHistorica.filter(
      (p) => Number(p.entrada) === firstYear,
    ).length;
    return {
      total,
      active,
      retired: total - active,
      founders,
      years: currentYear - firstYear + 1,
    };
  }, [listaHistorica, firstYear, currentYear]);

  const visible = useMemo(() => {
    const q = norm(search);
    return listaHistorica.filter((p) => {
      if (filter === "active" && p.saida) return false;
      if (filter === "retired" && !p.saida) return false;
      if (q && !norm(`${p.nome} ${p.titulo || ""}`).includes(q)) return false;
      return true;
    });
  }, [listaHistorica, filter, search]);

  const anos = useMemo(
    () =>
      [...new Set(visible.map((p) => p.entrada))].sort(
        (a, b) => Number(b) - Number(a),
      ),
    [visible],
  );

  /* ---------- admin ---------- */
  const salvarNoHall = async () => {
    if (!novoNome.trim() || !anoIn) return;

    if (anoOut && Number(anoOut) < Number(anoIn)) {
      alert("O ano de saída não pode ser menor que o ano de entrada.");
      return;
    }

    const data = {
      nome: novoNome.trim(),
      titulo: titulo.trim(),
      entrada: String(anoIn),
      saida: anoOut ? String(anoOut) : "",
      playerId: linkedPlayerId || null,
      updatedAt: new Date(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "memorial", editingId), data);
      } else {
        await addDoc(collection(db, "memorial"), {
          ...data,
          createdAt: new Date(),
        });
      }
      limparCampos();
    } catch (e) {
      console.error("Erro ao salvar:", e);
      alert("Não foi possível salvar.");
    }
  };

  // Sugere o vínculo automaticamente quando o nome bate com um jogador
  const handleNomeChange = (value) => {
    setNovoNome(value);
    if (linkedPlayerId) return;
    const n = norm(value);
    if (!n) return;
    const match = jogadoresDB.find((p) => norm(p.name) === n);
    if (match) setLinkedPlayerId(match.id);
  };

  const prepararEdicao = (p) => {
    setEditingId(p.id);
    setNovoNome(p.nome);
    setTitulo(p.titulo || "");
    setAnoIn(p.entrada);
    setAnoOut(p.saida || "");
    setLinkedPlayerId(p.playerId || "");
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

  const handlePlayerClick = (id) => {
    if (id) navigate(`/player/${id}`); // ajuste a rota conforme o seu App.js
  };

  if (loading) return <div className="hall-loader">Carregando Memorial...</div>;

  /* ---------- um cartão de membro ---------- */
  const renderMember = (p, idx) => {
    const player = p.playerId ? playersById[p.playerId] : null;
    const career = player ? careerById[player.id] : null;
    const isRetired = Boolean(p.saida);
    const startYear = Number(p.entrada);
    const endYear = isRetired ? Number(p.saida) : currentYear;
    const tenure = Math.max(1, endYear - startYear + (isRetired ? 0 : 1));
    const isFounder = startYear === firstYear;
    const isVeteran = !isFounder && tenure >= 3;

    const photo =
      clubMode === "idr" ? player?.photoIDR1 || player?.photo : player?.photo;
    const shirt = player ? getShirtNumber(player, clubMode, "") : "";
    const pos = player?.positions?.[0] || player?.position || "";
    const awards =
      awardsByName[norm(p.nome)] ||
      (player ? awardsByName[norm(player.name)] : 0) ||
      0;
    const titles = Number(player?.titlesADR || 0);
    const clickable = Boolean(p.playerId);

    return (
      <div
        key={p.id}
        className={`hall-item ${isRetired ? "retired" : "active"} ${
          clickable ? "is-link" : ""
        }`}
        style={{ "--i": Math.min(idx, 12) }}
      >
        <div className="hall-item-main">
          <div className="hall-avatar">
            {photo ? (
              <img src={photo} alt={p.nome} />
            ) : (
              <span>{p.nome.charAt(0)}</span>
            )}
          </div>

          <div className="hall-item-info">
            <div className="name-wrapper">
              <span
                className={`player-name ${clickable ? "clickable-link" : ""}`}
                onClick={() => handlePlayerClick(p.playerId)}
              >
                {p.nome}
                {clickable && <small className="linked-badge">↗</small>}
              </span>

              {p.titulo && (
                <span className="player-nickname">"{p.titulo}"</span>
              )}
            </div>

            <div className="hall-meta">
              <span className="player-dates">
                {p.entrada} — {p.saida || "Atualmente"}
              </span>
              <span className="hall-tenure">
                {tenure} {tenure === 1 ? "ano" : "anos"}
              </span>
              {pos && <span className="hall-pos">{pos}</span>}
              {shirt !== "" && <span className="hall-shirt">#{shirt}</span>}
            </div>

            <div className="hall-tags">
              <span className={`hall-status ${isRetired ? "is-off" : "is-on"}`}>
                {isRetired ? "Aposentado" : "Ativo"}
              </span>
              {isFounder && <span className="hall-tag is-gold">Fundador</span>}
              {isVeteran && <span className="hall-tag">Veterano</span>}
              {titles > 0 && (
                <span className="hall-tag is-gold">🏆 {titles}</span>
              )}
              {awards > 0 && (
                <span className="hall-tag is-gold">🏅 {awards}</span>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="hall-item-actions">
              <button className="btn-edit" onClick={() => prepararEdicao(p)}>
                ✎
              </button>
              <button className="btn-del" onClick={() => removerDoHall(p.id)}>
                ×
              </button>
            </div>
          )}
        </div>

        {/* Números de carreira (só quando está vinculado a um jogador) */}
        {career && (
          <div className="hall-career">
            <div>
              <strong>{career.games}</strong>
              <span>Jogos</span>
            </div>
            <div>
              <strong>{career.goals}</strong>
              <span>Gols</span>
            </div>
            <div>
              <strong>{career.assists}</strong>
              <span>Assist.</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="hall-vertical-container">
        {/* ================= CABEÇALHO ================= */}
        <header className="hall-header">
          <span className="hall-kicker">O ADR • DESDE {firstYear}</span>
          <h1 className="hall-title">MEMORIAL DE MEMBROS</h1>
          <p className="hall-subtitle">
            Todos que vestiram a camisa, de {firstYear} até hoje.
          </p>
        </header>

        {/* ================= RESUMO ================= */}
        <section className="hall-summary" aria-label="Resumo do memorial">
          <div>
            <strong>{summary.total}</strong>
            <span>Membros</span>
          </div>
          <div>
            <strong>{summary.active}</strong>
            <span>Ativos</span>
          </div>
          <div>
            <strong>{summary.retired}</strong>
            <span>Aposentados</span>
          </div>
          <div>
            <strong>{summary.founders}</strong>
            <span>Fundadores</span>
          </div>
          <div>
            <strong>{summary.years}</strong>
            <span>Anos de história</span>
          </div>
        </section>

        {/* ================= ADMIN ================= */}
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
                onChange={(e) => handleNomeChange(e.target.value)}
              />

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

        {/* ================= BUSCA E FILTROS ================= */}
        <div className="hall-toolbar">
          <input
            type="search"
            className="hall-search"
            placeholder="Buscar por nome ou apelido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="hall-filters" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                className={`hall-filter ${filter === f.id ? "is-active" : ""}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= LISTA POR ANO ================= */}
        <div className="hall-list-vertical">
          {anos.length === 0 && (
            <p className="hall-empty">Nenhum membro encontrado.</p>
          )}

          {anos.map((ano) => {
            const doAno = visible
              .filter((p) => p.entrada === ano)
              .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

            return (
              <section key={ano} className="hall-group">
                <div className="hall-year-row">
                  <h2 className="year-label">{ano}</h2>
                  <span className="hall-year-count">
                    {doAno.length} {doAno.length === 1 ? "entrada" : "entradas"}
                  </span>
                </div>

                <div className="hall-items-grid">
                  {doAno.map((p, i) => renderMember(p, i))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HallHistorico;
