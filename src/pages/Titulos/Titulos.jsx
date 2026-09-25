import React from "react";
import "./Titulos.css";
import Footer from "../../components/Footer";

export default function Titulos() {
  // Aqui você cadastra os troféus e os caminhos das imagens que vai colocar no VSCode
  const trofeus = [
    {
      id: 1,
      quantidade: 17,
      nome: "COPA RENZO",
      anos: "2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025",
      imagem: "/titulos/camp0.png",
    },
    {
      id: 2,
      quantidade: 0,
      nome: "CAMPEONATO LATO SENSU",
      anos: "",
      imagem: "/titulos/camp1.png",
    },
    {
      id: 3,
      quantidade: 0,
      nome: "PBA CUP",
      anos: "",
      imagem: "/titulos/camp2.png",
    },
  ];

  // Calcula o total de títulos automaticamente
  const totalTitulos = trofeus.reduce((acc, curr) => acc + curr.quantidade, 0);

  return (
    <div className="titulos-psg-wrapper">
      {/* O CONTEÚDO PRINCIPAL FICA AQUI DENTRO (ELE VAI ESTICAR E EMPURRAR O FOOTER) */}
      <div className="titulos-main-content">
        {/* BANNER TOPO (HERO) */}
        <section className="titulos-hero">
          <div className="titulos-hero-overlay"></div>
          <h1 className="titulos-hero-text">TÍTULOS</h1>
        </section>

        {/* INTRODUÇÃO E CONTAGEM */}
        <section className="titulos-intro">
          <h2 className="titulos-total">{totalTitulos} TÍTULOS</h2>
          <p className="titulos-desc">
            Desde a sua fundação, passando pelos primeiros troféus conquistados
            até os mais recentes sucessos da liga, o ADR soma um total de{" "}
            <strong>{totalTitulos} conquistas</strong> oficiais em sua galeria.
          </p>
        </section>

        {/* LISTA DE TROFÉUS */}
        <section className="titulos-list-container">
          {trofeus.map((trofeu) => (
            <div className="trofeu-row" key={trofeu.id}>
              <div className="trofeu-img-box">
                <img
                  src={trofeu.imagem}
                  alt={trofeu.nome}
                  className="trofeu-img"
                />
                <div className="trofeu-img-placeholder">
                  IMAGEM: {trofeu.imagem}
                </div>
              </div>
              <div className="trofeu-info">
                <h3>
                  {trofeu.quantidade}x {trofeu.nome}
                </h3>
                <p className="trofeu-anos">{trofeu.anos}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <Footer />
    </div>
  );
}
