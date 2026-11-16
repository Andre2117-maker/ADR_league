import "./panel.css";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import dadosIniciais from "../../dados_iniciais.json";
import PlayerButtons from "./PlayerButtons/PlayerButtons";

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


/* Ícones desenhados (no lugar dos emojis) */
const ADM_ICO = {
  back: "M15 5l-7 7 7 7",
  ball: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5l3.8 2.8-1.5 4.4H9.7l-1.5-4.4zM12 3v4.5M15.8 10.3l4.3-1.6M14.3 14.7l2.6 3.8M9.7 14.7l-2.6 3.8M8.2 10.3 3.9 8.7",
  wrench: "M14.5 5.5a4 4 0 0 0 4.9 4.9L12 17.8a2.1 2.1 0 0 1-3-3l7.4-7.4M14.5 5.5l2.3 2.3M6 21l3-3",
  upload: "M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v5h16v-5",
  sort: "M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l-3 3m3-3l3 3",
  open: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M3 3l18 18M10.6 6c.5-.1.9-.1 1.4-.1C18 5.9 21.5 12 21.5 12a17 17 0 0 1-2.9 3.6M6.5 7.2A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2",
  trash: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5",
};
const AdmIco = ({ n }) => (
  <svg className="adm-ico" viewBox="0 0 24 24" aria-hidden="true">
    <path d={ADM_ICO[n]} />
  </svg>
);

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
              <AdmIco n="back" /> Sair
            </button>
            <button
              onClick={() => navigate("/admin-matches")}
              className="adm-btn-matches"
            >
              <AdmIco n="ball" /> Partidas
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
          <summary>
            <AdmIco n="wrench" /> Ferramentas de manutenção
          </summary>
          <p>
            Use só quando souber o que está fazendo: elas escrevem em várias
            partidas e jogadores de uma vez.
          </p>
          <div className="adm-tools-actions">
            <button onClick={handleMigrateJSON}>
              <AdmIco n="upload" /> Migrar JSON
            </button>
            <button onClick={migrateOldMatches} className="is-danger">
              <AdmIco n="sort" /> Fix Order das partidas
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}

export default AdminPanel;
