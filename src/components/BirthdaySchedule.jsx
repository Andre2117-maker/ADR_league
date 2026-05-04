import React, { useState } from "react";
import "../styles/Home/BirthdaySchedule.css";

const BirthdaySchedule = ({ players }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const itemsPerPage = 3;

  // 1. Processamento de datas (mantendo sua lógica correta)
  const sortedBirthdays = players
    .filter((p) => p.birthDate && !p.isAnonymous)
    .map((p) => {
      const [day, month, year] = p.birthDate.split("/");
      const bDate = new Date(year, parseInt(month) - 1, parseInt(day));
      const today = new Date();
      let nextBday = new Date(
        today.getFullYear(),
        bDate.getMonth(),
        bDate.getDate(),
      );
      if (
        nextBday <
        new Date(today.getFullYear(), today.getMonth(), today.getDate())
      ) {
        nextBday.setFullYear(today.getFullYear() + 1);
      }
      return {
        ...p,
        nextBday,
        formattedDate: nextBday
          .toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          })
          .toUpperCase(),
      };
    })
    .sort((a, b) => a.nextBday - b.nextBday);

  // 2. Cálculo dos grupos
  const totalPages = Math.ceil(sortedBirthdays.length / itemsPerPage);
  const currentItems = sortedBirthdays.slice(
    pageIndex * itemsPerPage,
    (pageIndex + 1) * itemsPerPage,
  );

  const changePage = (dir) => {
    setPageIndex((prev) =>
      dir === "next"
        ? (prev + 1) % totalPages
        : (prev - 1 + totalPages) % totalPages,
    );
  };

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h2 className="schedule-title">SCHEDULE</h2>
      </div>

      <div className="schedule-grid">
        {currentItems.map((player) => (
          <div key={player.id} className="schedule-card">
            <div className="card-header">
              <span className="bday-date">{player.formattedDate}</span>
            </div>
            <p className="bday-text">Feliz Aniversário, {player.name}!</p>
            <span className="bday-tag">Aniversário</span>
          </div>
        ))}
      </div>

      {/* Esta div nova centraliza tudo embaixo */}
      <div className="schedule-pagination-wrapper">
        <div className="carousel-controls">
          <button className="nav-arrow" onClick={() => changePage("prev")}>
            ‹
          </button>
          <div className="pagination-dots">
            {[...Array(totalPages)].map((_, i) => (
              <span
                key={i}
                className={`dot ${i === pageIndex ? "active" : ""}`}
              />
            ))}
          </div>
          <button className="nav-arrow" onClick={() => changePage("next")}>
            ›
          </button>
        </div>
      </div>
    </div>
  );
};

export default BirthdaySchedule;
