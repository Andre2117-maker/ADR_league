import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import HistoryCarousel from "../components/HistoryCarousel";
import Footer from "../components/Footer";
import "../styles/Aboutus/aboutpage.css";

function AboutPage({ players = [], isAdmin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // O estado inicial começa vazio ou com o que vier do banco
  const [primeiroElenco, setPrimeiroElenco] = useState([]);

  const values = [
    {
      title: "Excelência",
      desc: "Busca constante pelo alto nível técnico e organizacional em cada partida.",
    },
    {
      title: "Comunidade",
      desc: "Fortalecimento dos laços entre jogadores, amigos e entusiastas do esporte.",
    },
    {
      title: "Transparência",
      desc: "Gestão clara de estatísticas, finanças e regras da liga.",
    },
    {
      title: "História",
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
    <div className="about-wrapper">
      <section className="about-hero">
        <h1 className="hero-title">
          ADR <span className="gold-text">ORGANIZATION</span>
        </h1>
        <p className="hero-subtitle">
          Mais que uma liga, um legado digital no futebol.
        </p>
      </section>

      <div className="about-content">
        <section className="about-section">
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

        {/* ==================================================== */}
        {/* NOVA SEÇÃO DINÂMICA: PRIMEIRO ELENCO (EX-PRIMORDIAIS) */}
        {/* ==================================================== */}
        <section className="primordiais-section">
          <h2 className="section-title">O Primeiro Elenco</h2>
          <p className="section-subtitle">
            Os nomes e os pilares que deram início à história do ADR em 2023.
          </p>

          {isAdmin && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                background: isEditing ? "#ff4d4d" : "#111",
                color: isEditing ? "#fff" : "#d4af37",
                border: `1px solid ${isEditing ? "#ff4d4d" : "#d4af37"}`,
                padding: "8px 20px",
                borderRadius: "50px",
                cursor: "pointer",
                fontWeight: "bold",
                margin: "0 auto 20px",
                display: "block",
              }}
            >
              {isEditing ? "Cancelar Edição" : "✏️ Editar Primeiro Elenco"}
            </button>
          )}

          {isEditing && isAdmin ? (
            <div
              style={{
                background: "#151515",
                border: "1px dashed #d4af37",
                borderRadius: "12px",
                padding: "20px",
                maxWidth: "500px",
                margin: "0 auto 30px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              {primeiroElenco.map((membro, idx) => {
                const isManual = membro.isManual || false;

                return (
                  <div
                    key={idx}
                    style={{
                      background: "#000",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      padding: "15px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: "#d4af37", fontWeight: "bold" }}>
                        Membro {idx + 1}
                      </span>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => handleToggleType(idx)}
                          style={{
                            background: "#222",
                            color: "#aaa",
                            border: "1px solid #444",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                        >
                          🔄 Trocar para{" "}
                          {isManual ? "Jogador do Banco" : "Nome Manual"}
                        </button>

                        <button
                          onClick={() => handleRemoveMember(idx)}
                          style={{
                            background: "transparent",
                            color: "#ff4d4d",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                          }}
                        >
                          ❌
                        </button>
                      </div>
                    </div>

                    {isManual ? (
                      /* INPUT MANUAL */
                      <input
                        type="text"
                        value={membro.nome}
                        onChange={(e) => handleNameChange(idx, e.target.value)}
                        placeholder="Digite o nome de exibição..."
                        style={{
                          padding: "8px",
                          background: "#111",
                          color: "#fff",
                          border: "1px solid #444",
                          borderRadius: "6px",
                        }}
                      />
                    ) : (
                      /* SELECT DO BANCO */
                      <select
                        value={membro.id || ""}
                        onChange={(e) =>
                          handleSelectChange(idx, e.target.value)
                        }
                        style={{
                          padding: "8px",
                          background: "#111",
                          color: "#aaa",
                          border: "1px solid #444",
                          borderRadius: "6px",
                        }}
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

              <button
                onClick={handleAddMember}
                style={{
                  background: "transparent",
                  color: "#00ff7f",
                  border: "1px dashed #00ff7f",
                  padding: "10px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                + Adicionar Novo Membro
              </button>

              <button
                onClick={handleSaveElenco}
                disabled={loading}
                style={{
                  background: "#d4af37",
                  color: "#000",
                  border: "none",
                  padding: "12px",
                  borderRadius: "6px",
                  fontWeight: "900",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
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

                // --- LÓGICA DA FOTO ---
                // Encontra o jogador na lista pelo ID para pegar a imagem dele
                const jogadorBanco = isLinked
                  ? players.find((p) => String(p.id) === String(membro.id))
                  : null;
                // Busca a propriedade de foto (tenta várias opções comuns caso seu banco varie)
                const fotoURL =
                  jogadorBanco?.photo ||
                  jogadorBanco?.image ||
                  jogadorBanco?.photoURL;

                return (
                  <CardElement
                    key={idx}
                    className="primordial-card"
                    {...cardProps}
                    style={{ cursor: isLinked ? "pointer" : "default" }}
                  >
                    {/* Alterado aqui: Adicionado overflow hidden e checagem da foto */}
                    <div
                      className="primordial-avatar"
                      style={{
                        overflow: "hidden",
                        padding: fotoURL ? "0" : undefined, // Remove o padding se tiver foto para ela preencher tudo
                      }}
                    >
                      {fotoURL ? (
                        <img
                          src={fotoURL}
                          alt={membro.nome}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "50%",
                          }}
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

        <section className="about-section highlight-border">
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

        {/* EVOLUÇÃO DAS LOGOS */}
        <section className="teams-logos-section">
          <h2 className="section-title">Evolução do Escudo</h2>
          <p className="section-subtitle">
            A transformação da nossa identidade visual.
          </p>
          <div className="logos-timeline">
            {teamLogos.map((logo, idx) => (
              <div key={idx} className="logo-timeline-item">
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

        {/* ==================================================== */}
        {/* SEÇÃO: MASCOTES */}
        {/* ==================================================== */}
        <section className="mascotes-section">
          <h2 className="section-title">Nossos Mascotes</h2>
          <p className="section-subtitle">
            A energia e o carisma que representam a garra do ADR.
          </p>
          <div className="mascotes-grid">
            {mascotes.map((mascote, idx) => (
              <div key={idx} className="mascote-card">
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

        {/* ==================================================== */}
        {/* SEÇÃO: MANTOS */}
        {/* ==================================================== */}
        <section className="kits-section">
          <h2 className="section-title">Nossos Mantos</h2>
          <p className="section-subtitle">
            A pele que representa a história do ADR.
          </p>
          <div className="kits-grid">
            {teamKits.map((kit, idx) => (
              <div key={idx} className="kit-card">
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

        <section className="about-vision">
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

        <div className="values-grid">
          {values.map((v, index) => (
            <div key={index} className="value-card">
              <h3 className="value-title">{v.title}</h3>
              <p className="value-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <HistoryCarousel />
      <Footer />
    </div>
  );
}

export default AboutPage;
