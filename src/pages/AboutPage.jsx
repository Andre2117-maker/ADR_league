import React from "react";
import HistoryCarousel from "../components/HistoryCarousel";
import Footer from "../components/Footer";
import "../styles/Aboutus/aboutpage.css";

function AboutPage() {
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
    {
      name: "ADR 1.0",
      src: "/ADR 1.0.png",
      year: "2023 - O Início",
    },
    {
      name: "ADR Atual",
      src: "/logo.png",
      year: "2025 - A Evolução",
    },
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
            A história do <strong>ADR (Amigos do Renzo)</strong> começou em
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

        <section className="about-section highlight-border">
          <h2 className="section-title">O Batismo de Fogo</h2>
          <p className="section-text">
            O ADR nasceu para o desafio, estreando no{" "}
            <strong>Campeonato do Lato Sensu</strong>. O resultado em campo foi
            duro: quatro jogos, quatro derrotas. Mas ali o clube provou que não
            era um time comum. Enquanto muitos ruiriam, nós nos fortalecemos.
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
            <div className="logo-timeline-item future">
              <div className="logo-container placeholder">
                <span>?</span>
              </div>
              <div className="logo-info">
                <span className="logo-version">Próximo Passo</span>
                <span className="logo-year">Em breve</span>
              </div>
            </div>
          </div>
        </section>

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
