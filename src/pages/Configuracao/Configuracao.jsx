import React, { useState, useEffect } from "react";
import Footer from "../../components/Footer";
import "./configuracao.css";

function Configuracao() {
  const [temaAtual, setTemaAtual] = useState("ADR");

  // Assim que a tela abre, checa o que estava salvo
  useEffect(() => {
    const temaSalvo = localStorage.getItem("app-theme") || "ADR";
    setTemaAtual(temaSalvo);
  }, []);

  const mudarTema = (novoTema) => {
    setTemaAtual(novoTema);
    localStorage.setItem("app-theme", novoTema); // Salva a escolha do usuário

    // Aplica a mudança visual instantaneamente
    if (novoTema === "IDR") {
      document.body.classList.add("theme-idr");
    } else {
      document.body.classList.remove("theme-idr");
    }
  };

  return (
    <div>
      <div className="page-container1 config-page">
        <h1 className="page-title1">Configurações</h1>

        <div className="config-wrapper">
          <p className="config-subtitle">
            Escolha a identidade visual do sistema:
          </p>

          <div className="theme-cards-container">
            {/* Cartão ADR */}
            <div
              className={`theme-card-option ${temaAtual === "ADR" ? "active-adr" : ""}`}
              onClick={() => mudarTema("ADR")}
            >
              <h2>ADR LEAGUE</h2>
              <p>Escuro e Dourado</p>
              <div className="color-preview">
                <span style={{ background: "#000" }}></span>
                <span style={{ background: "#1a1a1a" }}></span>
                <span style={{ background: "#d4af37" }}></span>
              </div>
            </div>

            {/* Cartão IDR */}
            <div
              className={`theme-card-option ${temaAtual === "IDR" ? "active-idr" : ""}`}
              onClick={() => mudarTema("IDR")}
            >
              <h2>IDR LEAGUE</h2>
              <p>Claro, Preto e Branco</p>
              <div className="color-preview">
                <span style={{ background: "#ffffff" }}></span>
                <span style={{ background: "#f0f0f0" }}></span>
                <span style={{ background: "#000000" }}></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Configuracao;
