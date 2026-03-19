import React, { useRef } from "react";
import "../styles/historyCarousel.css";

const HistoryCarousel = () => {
  const carouselRef = useRef(null);

  // IMPORTANTE: Coloque suas fotos em public/assets/history/
  const dadosHistoricos = [
    {
      ano: "2023",
      titulo: "ADR: O INÍCiO",
      img: "/public/elenco/2023.png", // Caminho direto da pasta public
    },
    {
      ano: "2024",
      titulo: "ADR 2: A RESSUREIÇÃO",
      img: "/public/elenco/2024.png",
    },
    {
      ano: "2025",
      titulo: "ADR 3: A VINGANÇA",
      img: "/public/elenco/2025.png",
    },
  ];

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="history-carousel-wrapper">
      <h2 className="history-main-title">🏛️ NOSSA TRAJETÓRIA</h2>

      <div className="carousel-controls">
        <button className="arrow-btn" onClick={() => scroll("left")}>
          &lt;
        </button>

        <div className="history-carousel-container" ref={carouselRef}>
          {dadosHistoricos.map((item, index) => (
            <div key={index} className="history-card">
              <div className="img-wrapper">
                <img src={item.img} alt={item.ano} className="card-bg-img" />
              </div>
              <div className="card-overlay">
                <span className="card-year">{item.ano}</span>
                <h3 className="card-title">{item.titulo}</h3>
              </div>
            </div>
          ))}
        </div>

        <button className="arrow-btn" onClick={() => scroll("right")}>
          &gt;
        </button>
      </div>
    </div>
  );
};

export default HistoryCarousel;
