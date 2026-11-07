import "../styles/panel.css";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import dadosIniciais from "../dados_iniciais.json";
import PlayerButtons from "../components/adminpanel/PlayerButtons/PlayerButtons";

/* ==========================================================
   O QUE FICA AQUI x O QUE FICA NO ADMIN DO JOGADOR
   ----------------------------------------------------------
   Admin individual (PlayerAdminMode): nome, nº ADR/IDR, aniversário,
   perna, títulos, país, altura, posições, ajuste manual por
   temporada, atributos e conquistas.

   Este painel (visão da turma toda): criar/excluir jogador,
   gênero, cargo, All-Star, as 3 fotos, modo anônimo, busca,
   filtros e pendências de cadastro.
   ========================================================== */

const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Ativos" },
  { id: "anon", label: "Anônimos" },
  { id: "nophoto", label: "Sem foto" },
  { id: "nonumber", label: "Sem nº" },
];

const matchesFilter = (p, filter) => {
  switch (filter) {
    case "active":
      return !p.isAnonymous;
    case "anon":
      return Boolean(p.isAnonymous);
    case "nophoto":
      return !p.photo || !p.photoIDR1;
    case "nonumber":
      return p.number === "" || p.number === undefined || p.number === null;
    default:
      return true;
  }
};

function AdminPanel({ players, matches }) {
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState("Male");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [players],
  );

  const counts = useMemo(() => {
    const c = {};
    FILTERS.forEach((f) => {
      c[f.id] = sortedPlayers.filter((p) => matchesFilter(p, f.id)).length;
    });
    return c;
  }, [sortedPlayers]);

  const visiblePlayers = useMemo(() => {
    const q = norm(search);
    return sortedPlayers.filter((p) => {
      if (!matchesFilter(p, filter)) return false;
      if (genderFilter !== "all" && (p.gender || "Male") !== genderFilter)
        return false;
      if (q && !norm(p.name).includes(q)) return false;
      return true;
    });
  }, [sortedPlayers, filter, genderFilter, search]);

  // Totais (somente leitura): ajuste manual + eventos das partidas
  const totalsById = useMemo(() => {
    const map = {};
    sortedPlayers.forEach((p) => {
      map[p.id] = {
        goals: p.manualGoals || 0,
        assists: p.manualAssists || 0,
        games: 0,
      };
    });
    (matches || []).forEach((m) => {
      const inA = m.teamA?.players || [];
      const inB = m.teamB?.players || [];
      [...inA, ...inB].forEach((id) => {
        if (map[id]) map[id].games++;
      });
      (m.events || []).forEach((e) => {
        const t = map[e.playerId];
        if (!t) return;
        if (e.type === "GOAL") t.goals++;
        if (e.type === "ASSIST") t.assists++;
      });
    });
    return map;
  }, [sortedPlayers, matches]);

  /* ---------- FIREBASE ---------- */
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await addDoc(collection(db, "players"), {
        name: newName.trim(),
        gender: newGender,
        manualGoals: 0,
        manualAssists: 0,
        titlesADR: 0,
        photo: "",
        photoIDR1: "",
        photoIDR2: "",
        clubRole: "",
        number: "",
        numberIDR: "",
        country: "",
        height: "",
        birthDate: "",
        positions: [],
        statsBySeason: {},
        achievements: [],
        isAllStar: false,
        isAnonymous: false,
        strongFoot: "Destro",
        currentRank: 0,
        previousRank: 0,
        skills: {
          velocidade: 50,
          corpo: 50,
          chute: 50,
          mira: 50,
          passe: 50,
          defesa: 50,
        },
      });
      setNewName("");
      setNewGender("Male");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (id, field, value) => {
    try {
      await updateDoc(doc(db, "players", id), { [field]: value });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Excluir ${name}?\nEssa ação não pode ser desfeita.`))
      return;
    try {
      await deleteDoc(doc(db, "players", id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMigrateJSON = async () => {
    if (
      !window.confirm("Deseja importar todos os dados do JSON para o Firebase?")
    )
      return;
    const batch = writeBatch(db);
    dadosIniciais.players.forEach((player) => {
      batch.set(doc(db, "players", String(player.id)), { ...player });
    });
    dadosIniciais.matches.forEach((match) => {
      batch.set(doc(db, "matches", String(match.id)), { ...match });
    });
    try {
      await batch.commit();
      alert("Dados migrados com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro na migração.");
    }
  };

  const migrateOldMatches = async () => {
    if (
      !window.confirm(
        "Isso vai atribuir ordem numérica a todas as partidas. Confirmar?",
      )
    )
      return;
    const batch = writeBatch(db);
    const sorted = [...matches].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    sorted.forEach((match, index) => {
      batch.update(doc(db, "matches", match.id), { order: index });
    });
    try {
      await batch.commit();
      alert("Migração concluída com sucesso!");
    } catch (err) {
      console.error("Erro na migração:", err);
      alert("Erro ao salvar no banco.");
    }
  };

  return (
    <div className="adm-main-layout">
      <div className="adm-wrap">
        {/* ================= TOPO ================= */}
        <header className="adm-header-nav">
          <div className="adm-nav-left">
            <button onClick={() => navigate("/")} className="adm-btn-exit">
              ← Sair
            </button>
            <button
              onClick={() => navigate("/admin-matches")}
              className="adm-btn-matches"
            >
              ⚽ Partidas
            </button>
          </div>

          <h1 className="adm-title-main">
            PAINEL <span className="adm-title-highlight">ADMIN</span>
          </h1>
        </header>

        {/* ================= RESUMO / FILTROS RÁPIDOS ================= */}
        <section className="adm-summary" aria-label="Resumo do elenco">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`adm-summary-cell ${filter === f.id ? "is-active" : ""} ${
                f.id !== "all" && f.id !== "active" && counts[f.id] > 0
                  ? "is-warn"
                  : ""
              }`}
              onClick={() => setFilter(f.id)}
            >
              <span className="adm-summary-num">{counts[f.id]}</span>
              <span className="adm-summary-label">{f.label}</span>
            </button>
          ))}
        </section>

        {/* ================= ADICIONAR + BUSCA ================= */}
        <section className="adm-toolbar">
          <form onSubmit={handleAddPlayer} className="adm-add-form">
            <input
              type="text"
              className="adm-input-new-player"
              placeholder="Novo jogador..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <select
              className="adm-select-gender"
              value={newGender}
              onChange={(e) => setNewGender(e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <button type="submit" className="adm-btn-add-confirm">
              Adicionar +
            </button>
          </form>

          <div className="adm-search-form">
            <input
              type="search"
              className="adm-input-new-player"
              placeholder="Buscar jogador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="adm-select-gender"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              aria-label="Filtrar por gênero"
            >
              <option value="all">Todos os gêneros</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </section>

        {/* ================= LISTA ================= */}
        <div className="adm-table-container">
          <div className="adm-table">
            <div className="adm-thead-fake-pc">
              <span>JOGADOR</span>
              <span>RESUMO</span>
              <span>PERFIL</span>
              <span>FOTOS</span>
              <span>AÇÕES</span>
            </div>

            <div className="adm-tbody">
              {visiblePlayers.length === 0 ? (
                <p className="adm-empty">Nenhum jogador encontrado.</p>
              ) : (
                visiblePlayers.map((p) => (
                  <PlayerButtons
                    key={p.id}
                    p={p}
                    total={
                      totalsById[p.id] || { goals: 0, assists: 0, games: 0 }
                    }
                    onUpdateProfile={handleUpdateProfile}
                    onDelete={handleDelete}
                    onOpen={() => navigate(`/player/${p.id}`)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ================= FERRAMENTAS (raramente usadas) ================= */}
        <details className="adm-tools">
          <summary>🔧 Ferramentas de manutenção</summary>
          <p>
            Use só quando souber o que está fazendo: elas escrevem em várias
            partidas e jogadores de uma vez.
          </p>
          <div className="adm-tools-actions">
            <button onClick={handleMigrateJSON}>🚀 Migrar JSON</button>
            <button onClick={migrateOldMatches} className="is-danger">
              🔧 Fix Order das partidas
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}

export default AdminPanel;
