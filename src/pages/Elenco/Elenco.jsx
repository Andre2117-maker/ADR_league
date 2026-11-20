import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import "./Elenco.css";
import Footer from "../../components/Footer";
import { getShirtNumber, useClubMode } from "../../utils/Shirtnumber";

/* ==========================================================================
   ELENCO — página nova (o visual de cada tema fica no Elenco.css)
   ========================================================================== */

const SEASONS = ["2027", "2026", "2025", "2024", "2023"];
const GENDERS = ["Masculino", "Feminino"];
const SORTS = [
  { key: "nome", label: "Nome" },
  { key: "numero", label: "Número" },
  { key: "titulos", label: "Títulos" },
];

/* Ícones (SVG, herdam a cor do texto) */
const Ico = ({ d }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICO = {
  trophy:
    "M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v3.5M8.5 20.5h7M9.5 17.5h5v3h-5z",
  search: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.8-4.8",
  star: "M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z",
};

/* sem acento e minúsculo, pra busca achar "Josue" e "Josué" */
const normalizar = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/* span/div que funciona como botão (Enter e espaço também clicam).
   Não usamos <button> porque o global.css estiliza todos os botões. */
const pressable = (onActivate) => ({
  role: "button",
  tabIndex: 0,
  onClick: onActivate,
  onKeyDown: (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate();
    }
  },
});

export default function Elenco() {
  const [players, setPlayers] = useState([]);
  const [genderTab, setGenderTab] = useState("Masculino");
  const [seasonTab, setSeasonTab] = useState("2026");
  const [sortBy, setSortBy] = useState("nome");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const clubMode = useClubMode();
  const navigate = useNavigate();
  const location = useLocation();

  /* ?tab=feminino / ?tab=masculino na URL continua funcionando */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "feminino") setGenderTab("Feminino");
    else if (tabParam === "masculino") setGenderTab("Masculino");
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersSnapshot, memorialSnapshot] = await Promise.all([
          getDocs(collection(db, "players")),
          getDocs(collection(db, "memorial")),
        ]);

        const memorialData = memorialSnapshot.docs.map((d) => d.data());

        const playersData = playersSnapshot.docs.map((d) => {
          const pData = d.data();
          const memInfo = memorialData.find((m) => m.playerId === d.id) || {};
          return {
            id: d.id,
            ...pData,
            entrada: memInfo.entrada || "2023",
            saida: memInfo.saida || "",
          };
        });

        playersData.sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""), "pt-BR"),
        );

        setPlayers(playersData);
      } catch (error) {
        console.error("Erro ao buscar elenco:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* elenco da temporada + gênero escolhidos (base dos números do topo) */
  const seasonList = useMemo(() => {
    const activeSeason = parseInt(seasonTab, 10);
    return players.filter((p) => {
      if (p.isAnonymous || !p.name) return false;

      const isRightGender =
        genderTab === "Masculino"
          ? p.gender === "Male" || !p.gender
          : p.gender === "Female";
      if (!isRightGender) return false;

      const entryYear = parseInt(p.entrada, 10) || 2023;
      const exitYear = parseInt(p.saida, 10) || 9999;
      return activeSeason >= entryYear && activeSeason <= exitYear;
    });
  }, [players, genderTab, seasonTab]);

  const stats = useMemo(() => {
    const season = parseInt(seasonTab, 10);
    return {
      atletas: seasonList.length,
      estreantes: seasonList.filter((p) => parseInt(p.entrada, 10) === season)
        .length,
      titulos: seasonList.reduce((s, p) => s + (Number(p.titlesADR) || 0), 0),
    };
  }, [seasonList, seasonTab]);

  /* busca + ordem (só o que aparece na grade) */
  const shownList = useMemo(() => {
    const q = normalizar(search);
    const list = q
      ? seasonList.filter((p) => normalizar(p.name).includes(q))
      : [...seasonList];

    if (sortBy === "numero") {
      const num = (p) => {
        const n = parseInt(getShirtNumber(p, clubMode, ""), 10);
        return Number.isNaN(n) ? Infinity : n;
      };
      list.sort((a, b) => num(a) - num(b));
    } else if (sortBy === "titulos") {
      list.sort(
        (a, b) => (Number(b.titlesADR) || 0) - (Number(a.titlesADR) || 0),
      );
    }
    return list;
  }, [seasonList, search, sortBy, clubMode]);

  if (loading) {
    return (
      <div className="elenco-loading-screen">
        <div className="spinner"></div>
        <p>Carregando Elenco...</p>
      </div>
    );
  }

  const season = parseInt(seasonTab, 10);

  return (
    <div className="elenco-psg-wrapper">
      <div className="elenco-main-content">
        <div className="elenco-content-limit">
          {/* ---------- cabeçalho ---------- */}
          <header className="el-head">
            <span className="el-kicker">O ADR · Temporada {seasonTab}</span>
            <h1 className="el-title">Elenco</h1>
            <p className="el-sub">
              {genderTab === "Masculino" ? "Time masculino" : "Time feminino"}
              {" · "}toque num atleta para ver o perfil
            </p>

            <div className="el-stats">
              <div className="el-stat">
                <strong>{stats.atletas}</strong>
                <span>Atletas</span>
              </div>
              <div className="el-stat">
                <strong>{stats.estreantes}</strong>
                <span>Estreantes</span>
              </div>
              <div className="el-stat">
                <strong>{stats.titulos}</strong>
                <span>Títulos no elenco</span>
              </div>
            </div>
          </header>

          {/* ---------- filtros ---------- */}
          <div className="el-controls">
            <div className="el-group">
              <span className="el-group-label">Temporada</span>
              <div className="el-chips">
                {SEASONS.map((s) => (
                  <span
                    key={s}
                    className={`el-chip ${seasonTab === s ? "is-on" : ""}`}
                    aria-pressed={seasonTab === s}
                    {...pressable(() => setSeasonTab(s))}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="el-group">
              <span className="el-group-label">Time</span>
              <div className="el-chips">
                {GENDERS.map((g) => (
                  <span
                    key={g}
                    className={`el-chip ${genderTab === g ? "is-on" : ""}`}
                    aria-pressed={genderTab === g}
                    {...pressable(() => setGenderTab(g))}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div className="el-group">
              <span className="el-group-label">Ordenar</span>
              <div className="el-chips">
                {SORTS.map((s) => (
                  <span
                    key={s.key}
                    className={`el-chip ${sortBy === s.key ? "is-on" : ""}`}
                    aria-pressed={sortBy === s.key}
                    {...pressable(() => setSortBy(s.key))}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>

            <label className="el-search">
              <Ico d={ICO.search} />
              <input
                type="search"
                className="el-search-input"
                placeholder="Buscar atleta"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>

          {/* ---------- grade de atletas ---------- */}
          <section
            className="el-grid"
            key={`${genderTab}-${seasonTab}-${sortBy}`}
          >
            {shownList.length === 0 ? (
              <p className="el-empty">
                {search
                  ? "Nenhum atleta com esse nome nesta temporada."
                  : "Nenhum atleta encontrado nesta temporada."}
              </p>
            ) : (
              shownList.map((p, i) => {
                const nameParts = p.name.trim().split(/\s+/);
                const firstName = nameParts.length > 1 ? nameParts[0] : "";
                const lastName =
                  nameParts.length > 1
                    ? nameParts.slice(1).join(" ")
                    : nameParts[0];
                const num = getShirtNumber(p, clubMode, "-");
                const hasNum = num !== "-" && num !== "" && num != null;
                const titles = Number(p.titlesADR) || 0;
                const isNew = parseInt(p.entrada, 10) === season;

                return (
                  <article
                    key={p.id}
                    className={`el-card ${isNew ? "is-new" : ""}`}
                    style={{ "--i": Math.min(i, 20) }}
                    aria-label={`${p.name}, abrir perfil`}
                    {...pressable(() => navigate(`/player/${p.id}`))}
                  >
                    <div className="el-card-stage">
                      {hasNum && (
                        <span className="el-card-bignum" aria-hidden="true">
                          {num}
                        </span>
                      )}

                      <img
                        src={p.photo || "/players/Anonimo.png"}
                        alt=""
                        className="el-card-photo"
                        loading="lazy"
                      />

                      <div className="el-card-tags">
                        {titles > 0 && (
                          <span
                            className="el-tag el-tag-titles"
                            title={`${titles} ${titles === 1 ? "título" : "títulos"}`}
                          >
                            <Ico d={ICO.trophy} />
                            {titles}
                          </span>
                        )}
                        {isNew && (
                          <span className="el-tag el-tag-new">
                            <Ico d={ICO.star} />
                            Estreante
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="el-card-info">
                      <span className="el-card-num">{hasNum ? num : "–"}</span>
                      <div className="el-card-names">
                        {firstName && (
                          <span className="el-card-first">{firstName}</span>
                        )}
                        <strong className="el-card-last">{lastName}</strong>
                        <span className="el-card-since">
                          No ADR desde {p.entrada}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
