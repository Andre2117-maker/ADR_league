import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import HistoryCarousel from "../../components/HistoryCarousel";
import Footer from "../../components/Footer";
import "./aboutpage.css";

// ==========================================
// CONTEÚDO EDITÁVEL (edite aqui)
// ==========================================
const FOUNDING_YEAR = 2023;

// Marcos da linha do tempo
const MILESTONES = [
  {
    year: "2023",
    title: "A Fundação",
    desc: "João e Jairo dão o primeiro passo e o grupo sela o pacto de se tornar, oficialmente, um time.",
  },
  {
    year: "2023",
    title: "O Batismo de Fogo",
    desc: "Estreia no Campeonato do Lato Sensu: quatro jogos, quatro derrotas e muito combustível.",
  },
  {
    year: "2025",
    title: "ADR 2.0",
    desc: "A evolução do escudo e da identidade visual do clube.",
  },
  {
    year: "2026",
    title: "IDR",
    desc: "O Ódio: uma nova identidade para uma nova fase.",
  },
];

// Fundadores. Preencha playerId (id do jogador no banco) para linkar o perfil e usar a foto.
const FOUNDERS = [
  { name: "João", role: "Fundador", playerId: "" },
  { name: "Jairo", role: "Fundador", playerId: "" },
  { name: "André", role: "Primeiro a embarcar", playerId: "" },
  { name: "Carlos", role: "Primeiro a embarcar", playerId: "" },
];

// Sala de troféus. A seção só aparece se houver itens.
// Exemplo: { title: "Campeão do ...", season: "2026", desc: "..." }
const TROPHIES = [];

// Botões do final da página (ajuste as rotas para as do seu projeto)
const CTA_LINKS = [
  { to: "/elenco", label: "Conhecer o elenco", primary: true },
  { to: "/campeonato", label: "Ver o campeonato" },
  { to: "/transparency", label: "Transparência" },
];

// Número que sobe de 0 até o valor
function StatNumber({ value }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (value == null) return;
    const duration = 1400;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  if (value == null) return <>—</>;
  return <>{shown}</>;
}

function AboutPage({ players = [], isAdmin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // O estado inicial começa vazio ou com o que vier do banco
  const [primeiroElenco, setPrimeiroElenco] = useState([]);

  // Estatísticas calculadas a partir das partidas (null enquanto carrega)
  const [matchStats, setMatchStats] = useState(null);

  const values = [
    {
      title: "Excelência",
      icon: "🏆",
      desc: "Busca constante pelo alto nível técnico e organizacional em cada partida.",
    },
    {
      title: "Comunidade",
      icon: "🤝",
      desc: "Fortalecimento dos laços entre jogadores, amigos e entusiastas do esporte.",
    },
    {
      title: "Transparência",
      icon: "🔎",
      desc: "Gestão clara de estatísticas, finanças e regras da liga.",
    },
    {
      title: "História",
      icon: "📜",
      desc: "Respeito à trajetória de cada atleta que veste a camisa do ADR.",
    },
  ];

  const teamLogos = [
    { name: "ADR 1.0", src: "/ADR 1.0.png", year: "2023 - O Início" },
    { name: "ADR 2.0", src: "/logo.png", year: "2025 - A Evolução" },
    { name: "IDR", src: "/IDR.png", year: "2026 - O Ódio" },
  ];

  const teamKits = [
    {
      name: "Primeiro Manto",
      src: "/camisa/primeira camisa.png",
      season: "Temporada 2023/24",
    },
    {
      name: "Segundo Manto",
      src: "/camisa/segunda camisa.png",
      season: "Temporada 2024/25",
    },
    {
      name: "Terceiro Manto",
      src: "/camisa/terceira camisa.png",
      season: "Temporada 2025/26",
    },
    {
      name: "Quarto Manto",
      src: "/camisa/quarta camisa.png",
      season: "Temporada 2026/27",
    },
  ];

  // ==========================================
  // LISTA DE MASCOTES (Edite as imagens aqui)
  // ==========================================
  const mascotes = [
    {
      name: "Renzo Flores",
      src: "/players/15.png",
      desc: "Nome do time e principal símbolo.",
    },
    {
      name: "Rico Nunes",
      src: "/Rico Nunes.png",
      desc: "Pássaro do Davi.",
    },
  ];

  // ==========================================
  // ANIMAÇÃO DE ENTRADA AO ROLAR A PÁGINA
  // ==========================================
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const items = wrapper.querySelectorAll(".reveal");

    // Sem suporte (ou movimento reduzido): mostra tudo direto
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    wrapper.classList.add("js-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchElenco = async () => {
      try {
        const docRef = doc(db, "settings", "aboutPage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().primeiroElenco) {
          setPrimeiroElenco(docSnap.data().primeiroElenco);
        } else if (docSnap.exists() && docSnap.data().primordiais) {
          // Migração de dados caso ainda esteja salvo com o nome antigo no banco
          setPrimeiroElenco(docSnap.data().primordiais);
        }
      } catch (error) {
        console.error("Erro ao carregar o elenco:", error);
      }
    };
    fetchElenco();
  }, []);

  // Jogos, gols e vitórias do ADR (considera o time A como ADR)
  useEffect(() => {
    const fetchMatchStats = async () => {
      try {
        const snap = await getDocs(collection(db, "matches"));
        let jogos = 0;
        let gols = 0;
        let vitorias = 0;

        snap.docs.forEach((d) => {
          const m = d.data();
          if (m.type === "TREINO" || m.type === "EVENTO") return;

          const events = m.events || [];
          const finished = m.status === "FINISHED" || events.length > 0;
          if (!finished) return;

          const scoreA = events.filter(
            (e) =>
              (e.type === "GOAL" && e.team === "A") ||
              (e.type === "OWN_GOAL" && e.team === "B"),
          ).length;
          const scoreB = events.filter(
            (e) =>
              (e.type === "GOAL" && e.team === "B") ||
              (e.type === "OWN_GOAL" && e.team === "A"),
          ).length;

          jogos += 1;
          gols += scoreA;

          let won = scoreA > scoreB;
          if (scoreA === scoreB) {
            const penA = Number(m.penaltiesScoreA) || 0;
            const penB = Number(m.penaltiesScoreB) || 0;
            won = penA > penB || m.goldenGoalWinner === "A";
          }
          if (won) vitorias += 1;
        });

        setMatchStats({ jogos, gols, vitorias });
      } catch (error) {
        console.error("Erro ao calcular estatísticas:", error);
      }
    };
    fetchMatchStats();
  }, []);

  // Salva no banco de dados
  const handleSaveElenco = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "aboutPage");
      await setDoc(docRef, { primeiroElenco }, { merge: true });
      setIsEditing(false);
      alert("Primeiro Elenco salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar no banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Funções de manipulação do painel ADM
  // ==========================================
  const handleAddMember = () => {
    setPrimeiroElenco([
      ...primeiroElenco,
      { nome: "Novo Jogador", id: "", isManual: false },
    ]);
  };

  const handleRemoveMember = (indexToRemove) => {
    setPrimeiroElenco(primeiroElenco.filter((_, idx) => idx !== indexToRemove));
  };

  const handleToggleType = (index) => {
    const updated = [...primeiroElenco];
    const currentlyManual = updated[index].isManual || false;

    updated[index].isManual = !currentlyManual;

    // Reseta os valores ao trocar de tipo para não dar conflito
    if (updated[index].isManual) {
      updated[index].id = "";
      updated[index].nome = "Nome Manual";
    } else {
      updated[index].nome = "";
      updated[index].id = "";
    }

    setPrimeiroElenco(updated);
  };

  const handleNameChange = (index, newName) => {
    const updated = [...primeiroElenco];
    updated[index].nome = newName;
    setPrimeiroElenco(updated);
  };

  const handleSelectChange = (index, playerId) => {
    const selectedPlayer = players.find(
      (p) => String(p.id) === String(playerId),
    );
    const updated = [...primeiroElenco];
    updated[index].id = playerId;

    if (selectedPlayer) {
      // Pega o primeiro nome do jogador selecionado
      updated[index].nome = selectedPlayer.name.split(" ")[0];
    } else {
      updated[index].nome = "";
    }

    setPrimeiroElenco(updated);
  };

  return (
    <div className="about-wrapper" ref={wrapperRef}>
      <section className="about-hero">
        <span className="hero-kicker">Desde 2023</span>
        <h1 className="hero-title">
          ADR <span className="gold-text">ORGANIZATION</span>
        </h1>
        <p className="hero-subtitle">
          Mais que uma liga, um legado digital no futebol.
        </p>
        <div className="hero-line"></div>
      </section>

      {/* FAIXA DE NÚMEROS */}
      <section className="stats-strip reveal">
        {[
          {
            label: "Anos de história",
            value: new Date().getFullYear() - FOUNDING_YEAR,
          },
          {
            label: "Atletas",
            value: players.filter((p) => !p.isAnonymous).length,
          },
          { label: "Jogos", value: matchStats ? matchStats.jogos : null },
          { label: "Gols", value: matchStats ? matchStats.gols : null },
          {
            label: "Vitórias",
            value: matchStats ? matchStats.vitorias : null,
          },
          ...(TROPHIES.length > 0
            ? [{ label: "Títulos", value: TROPHIES.length }]
            : []),
        ].map((s, i) => (
          <div key={s.label} className="stat-card stagger" style={{ "--i": i }}>
            <span className="stat-value">
              <StatNumber value={s.value} />
            </span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      <div className="about-content">
        <section className="about-section reveal">
          <h2 className="section-title">A Fundação</h2>
          <p className="section-text">
            A história d<strong>o ADR (Amigos do Renzo)</strong> começou em
            2023, fruto da visão de <strong>João e Jairo</strong>. O que era
            apenas uma ideia foi compartilhada com{" "}
            <strong>André e Carlos</strong>, servindo como a faísca que
            disseminou o projeto para o grupo.
          </p>
          <p className="section-text">
            Como em toda grande jornada, o início foi marcado pela dualidade:
            enquanto alguns abraçaram o plano com entusiasmo, outros mantiveram
            o ceticismo. Porém, a união falou mais alto e o grupo finalmente
            selou o pacto de se tornar, oficialmente, um time.
          </p>
        </section>

        {/* FUNDADORES */}
        <section className="founders-section reveal">
          <h2 className="section-title center">Os Fundadores</h2>
          <p className="section-subtitle">
            Quem acreditou antes de existir um time.
          </p>
          <div className="founders-grid">
            {FOUNDERS.map((f, idx) => {
              const jogador = f.playerId
                ? players.find((p) => String(p.id) === String(f.playerId))
                : null;
              const foto =
                jogador?.photo || jogador?.image || jogador?.photoURL;
              const CardElement = jogador ? Link : "div";
              const cardProps = jogador ? { to: `/player/${jogador.id}` } : {};

              return (
                <CardElement
                  key={f.name}
                  className={`founder-card stagger ${jogador ? "is-link" : ""}`}
                  style={{ "--i": idx }}
                  {...cardProps}
                >
                  <div
                    className={`primordial-avatar ${foto ? "has-photo" : ""}`}
                  >
                    {foto ? (
                      <img
                        src={foto}
                        alt={f.name}
                        className="primordial-photo"
                      />
                    ) : (
                      f.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h3 className="founder-name">{f.name}</h3>
                  <span className="founder-role">{f.role}</span>
                </CardElement>
              );
            })}
          </div>
        </section>

        {/* ==================================================== */}
        {/* SEÇÃO DINÂMICA: PRIMEIRO ELENCO */}
        {/* ==================================================== */}
        <section className="primordiais-section reveal">
          <h2 className="section-title center">O Primeiro Elenco</h2>
          <p className="section-subtitle">
            Os nomes e os pilares que deram início à história do ADR em 2023.
          </p>

          {isAdmin && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`primordial-edit-toggle ${isEditing ? "active" : ""}`}
            >
              {isEditing ? "Cancelar Edição" : "✏️ Editar Primeiro Elenco"}
            </button>
          )}

          {isEditing && isAdmin ? (
            <div className="primordial-editor">
              {primeiroElenco.map((membro, idx) => {
                const isManual = membro.isManual || false;

                return (
                  <div key={idx} className="primordial-edit-card">
                    <div className="pe-head">
                      <span className="pe-label">Membro {idx + 1}</span>

                      <div className="pe-actions">
                        <button
                          onClick={() => handleToggleType(idx)}
                          className="pe-switch"
                        >
                          🔄 Trocar para{" "}
                          {isManual ? "Jogador do Banco" : "Nome Manual"}
                        </button>

                        <button
                          onClick={() => handleRemoveMember(idx)}
                          className="pe-remove"
                        >
                          ❌
                        </button>
                      </div>
                    </div>

                    {isManual ? (
                      <input
                        type="text"
                        value={membro.nome}
                        onChange={(e) => handleNameChange(idx, e.target.value)}
                        placeholder="Digite o nome de exibição..."
                        className="pe-input"
                      />
                    ) : (
                      <select
                        value={membro.id || ""}
                        onChange={(e) =>
                          handleSelectChange(idx, e.target.value)
                        }
                        className="pe-input"
                      >
                        <option value="">Selecione um jogador...</option>
                        {[...players]
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                );
              })}

              <button onClick={handleAddMember} className="pe-add">
                + Adicionar Novo Membro
              </button>

              <button
                onClick={handleSaveElenco}
                disabled={loading}
                className="pe-save"
              >
                {loading ? "Salvando..." : "Salvar no Banco de Dados"}
              </button>
            </div>
          ) : (
            <div className="primordiais-grid">
              {primeiroElenco.map((membro, idx) => {
                const isLinked = Boolean(membro.id && !membro.isManual);
                // Se tiver ID do banco, renderiza como <Link>. Se for manual, renderiza como <div>
                const CardElement = isLinked ? Link : "div";
                const cardProps = isLinked
                  ? { to: `/player/${membro.id}` }
                  : {};

                // Encontra o jogador na lista pelo ID para pegar a imagem dele
                const jogadorBanco = isLinked
                  ? players.find((p) => String(p.id) === String(membro.id))
                  : null;
                const fotoURL =
                  jogadorBanco?.photo ||
                  jogadorBanco?.image ||
                  jogadorBanco?.photoURL;

                return (
                  <CardElement
                    key={idx}
                    className={`primordial-card stagger ${isLinked ? "is-link" : ""}`}
                    style={{ "--i": idx }}
                    {...cardProps}
                  >
                    <div
                      className={`primordial-avatar ${fotoURL ? "has-photo" : ""}`}
                    >
                      {fotoURL ? (
                        <img
                          src={fotoURL}
                          alt={membro.nome}
                          className="primordial-photo"
                        />
                      ) : membro.nome ? (
                        membro.nome.charAt(0).toUpperCase()
                      ) : (
                        "?"
                      )}
                    </div>
                    <h3 className="primordial-name">
                      {membro.nome || "Não Definido"}
                    </h3>
                  </CardElement>
                );
              })}
            </div>
          )}
        </section>

        <section className="about-section highlight-border reveal">
          <h2 className="section-title">O Batismo de Fogo</h2>
          <p className="section-text">
            O ADR nasceu para o desafio, estreando no{" "}
            <Link to="/campeonato" className="gold-link">
              <strong>Campeonato do Lato Sensu</strong>
            </Link>
            . O resultado em campo foi duro: quatro jogos, quatro derrotas. Mas
            ali o clube provou que não era um time comum. Enquanto muitos
            ruiriam, nós nos fortalecemos.
          </p>
          <p className="section-text">
            Aquelas derrotas não foram o fim, mas o combustível. O time seguiu
            treinando arduamente, com a disciplina de quem sabe que a Arena
            ainda ouvirá o nosso grito de vitória.
          </p>
        </section>

        {/* LINHA DO TEMPO */}
        <section className="milestones-section reveal">
          <h2 className="section-title center">Linha do Tempo</h2>
          <p className="section-subtitle">Os marcos que moldaram o ADR.</p>
          <div className="milestones">
            {MILESTONES.map((m, i) => (
              <div
                key={`${m.year}-${m.title}`}
                className={`milestone stagger ${i % 2 === 0 ? "left" : "right"}`}
                style={{ "--i": i }}
              >
                <div className="milestone-dot"></div>
                <div className="milestone-card">
                  <span className="milestone-year">{m.year}</span>
                  <h3 className="milestone-title">{m.title}</h3>
                  <p className="milestone-desc">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* EVOLUÇÃO DAS LOGOS */}
        <section className="teams-logos-section reveal">
          <h2 className="section-title center">Evolução do Escudo</h2>
          <p className="section-subtitle">
            A transformação da nossa identidade visual.
          </p>
          <div className="logos-timeline">
            {teamLogos.map((logo, idx) => (
              <div
                key={idx}
                className="logo-timeline-item stagger"
                style={{ "--i": idx }}
              >
                <div className="logo-container">
                  <img src={logo.src} alt={logo.name} />
                </div>
                <div className="logo-info">
                  <span className="logo-version">{logo.name}</span>
                  <span className="logo-year">{logo.year}</span>
                </div>
                {idx !== teamLogos.length - 1 && (
                  <div className="timeline-connector"></div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SEÇÃO: MASCOTES */}
        <section className="mascotes-section reveal">
          <h2 className="section-title center">Nossos Mascotes</h2>
          <p className="section-subtitle">
            A energia e o carisma que representam a garra do ADR.
          </p>
          <div className="mascotes-grid">
            {mascotes.map((mascote, idx) => (
              <div
                key={idx}
                className="mascote-card stagger"
                style={{ "--i": idx }}
              >
                <div className="mascote-image-wrapper">
                  <img src={mascote.src} alt={mascote.name} />
                </div>
                <div className="mascote-details">
                  <h3 className="mascote-name">{mascote.name}</h3>
                  <span className="mascote-desc">{mascote.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEÇÃO: MANTOS */}
        <section className="kits-section reveal">
          <h2 className="section-title center">Nossos Mantos</h2>
          <p className="section-subtitle">
            A pele que representa a história do ADR.
          </p>
          <div className="kits-grid">
            {teamKits.map((kit, idx) => (
              <div
                key={idx}
                className="kit-card stagger"
                style={{ "--i": idx }}
              >
                <div className="kit-image-wrapper">
                  <img src={kit.src} alt={kit.name} />
                </div>
                <div className="kit-details">
                  <h3 className="kit-name">{kit.name}</h3>
                  <span className="kit-season">{kit.season}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SALA DE TROFÉUS (só aparece se TROPHIES tiver itens) */}
        {TROPHIES.length > 0 && (
          <section className="trophies-section reveal">
            <h2 className="section-title center">Sala de Troféus</h2>
            <p className="section-subtitle">
              A glória que o suor transformou em prata e ouro.
            </p>
            <div className="trophies-grid">
              {TROPHIES.map((t, i) => (
                <div
                  key={`${t.title}-${t.season}`}
                  className="trophy-card stagger"
                  style={{ "--i": i }}
                >
                  <span className="trophy-icon">🏆</span>
                  <h3 className="trophy-title">{t.title}</h3>
                  <span className="trophy-season">{t.season}</span>
                  {t.desc && <p className="trophy-desc">{t.desc}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="about-vision reveal">
          <div className="vision-card">
            <h2 className="vision-title">O Amanhã é Dourado</h2>
            <p className="vision-text">
              O ADR não é apenas um registro de 2023; é uma promessa de
              grandeza. O suor de cada treino e a resiliência nas quedas estão
              moldando um clube destinado aos títulos. Estamos em constante
              evolução, e o futuro reserva o lugar mais alto do pódio para
              aqueles que nunca desistiram de jogar juntos.
            </p>
            <div className="vision-quote">
              "Onde houver um Amigo do Renzo, haverá a busca pela glória."
            </div>
          </div>
        </section>

        <div className="values-grid reveal">
          {values.map((v, index) => (
            <div
              key={index}
              className="value-card stagger"
              style={{ "--i": index }}
            >
              <span className="value-icon">{v.icon}</span>
              <h3 className="value-title">{v.title}</h3>
              <p className="value-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CHAMADA FINAL */}
      <section className="about-cta reveal">
        <h2 className="cta-title">Faça parte da história</h2>
        <p className="cta-text">
          Acompanhe os jogos, conheça o elenco e veja para onde vai cada centavo
          do clube.
        </p>
        <div className="cta-buttons">
          {CTA_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`cta-btn ${l.primary ? "primary" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </section>

      <HistoryCarousel />
      <Footer />
    </div>
  );
}

export default AboutPage;
