import React, { useState, useMemo } from "react";
import "../styles/Home/BirthdaySchedule.css";

const BirthdaySchedule = ({ players = [] }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const itemsPerPage = 3;

  // 1. Processamento inteligente de datas, contagem regressiva e idade
  const sortedBirthdays = useMemo(() => {
    const now = new Date();
    const todayZero = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    return players
      .filter((p) => p.birthDate && !p.isAnonymous)
      .map((p) => {
        const parts = String(p.birthDate).split("/");
        if (parts.length < 2) return null;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const birthYear = parts[2] ? parseInt(parts[2], 10) : null;

        if (isNaN(day) || isNaN(month)) return null;

        let nextBday = new Date(todayZero.getFullYear(), month - 1, day);
        if (nextBday < todayZero) {
          nextBday.setFullYear(todayZero.getFullYear() + 1);
        }

        const diffTime = nextBday.getTime() - todayZero.getTime();
        const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const isToday = daysUntil === 0;
        const isTomorrow = daysUntil === 1;

        const turningAge =
          birthYear && birthYear > 1900
            ? nextBday.getFullYear() - birthYear
            : null;

        const formattedDate = nextBday
          .toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })
          .replace(".", "")
          .toUpperCase();

        return {
          ...p,
          nextBday,
          daysUntil,
          isToday,
          isTomorrow,
          turningAge,
          formattedDate,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.nextBday - b.nextBday);
  }, [players]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedBirthdays.length / itemsPerPage),
  );
  const safePageIndex = pageIndex >= totalPages ? 0 : pageIndex;

  const currentItems = sortedBirthdays.slice(
    safePageIndex * itemsPerPage,
    (safePageIndex + 1) * itemsPerPage,
  );

  const changePage = (dir) => {
    setPageIndex((prev) =>
      dir === "next"
        ? (prev + 1) % totalPages
        : (prev - 1 + totalPages) % totalPages,
    );
  };

  if (sortedBirthdays.length === 0) return null;

  return (
    <section className="schedule-container">
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="schedule-header">
        <span className="schedule-kicker">CALENDÁRIO DO ELENCO • O ADR</span>
        <h2 className="schedule-title">
          PRÓXIMOS <span>ANIVERSÁRIOS</span>
        </h2>
        <div className="schedule-underline" />
      </div>

      {/* GRID DE CARDS */}
      <div className="schedule-grid">
        {currentItems.map((player) => {
          const primaryPos =
            player.positions?.[0] || player.position || "ATLETA";

          return (
            <div
              key={player.id}
              className={`schedule-card ${
                player.isToday ? "is-birthday-today" : ""
              }`}
            >
              {/* TOPO DO CARD: DATA + BADGE DE CONTAGEM REGRESSIVA */}
              <div className="card-header">
                <span className="bday-date">📅 {player.formattedDate}</span>

                <span
                  className={`bday-countdown-pill ${
                    player.isToday
                      ? "today"
                      : player.daysUntil <= 7
                        ? "soon"
                        : ""
                  }`}
                >
                  {player.isToday
                    ? "🎂 É HOJE!"
                    : player.isTomorrow
                      ? "⏳ É AMANHÃ!"
                      : `Faltam ${player.daysUntil} dias`}
                </span>
              </div>

              {/* CORPO DO CARD: FOTO DO ATLETA + INFO */}
              <div className="bday-Card-body">
                <div className="bday-avatar-wrap">
                  <img
                    src={player.photo || "/players/Anonimo.png"}
                    alt={player.name}
                    className="bday-avatar-img"
                  />
                  {player.number !== undefined && player.number !== "" && (
                    <span className="bday-shirt-num">#{player.number}</span>
                  )}
                </div>

                <div className="bday-player-info">
                  <h3 className="bday-player-name">{player.name}</h3>
                  <p className="bday-text">
                    {player.isToday
                      ? "🎉 Parabéns pelo seu dia, craque!"
                      : player.turningAge
                        ? `Completa ${player.turningAge} anos`
                        : "Aniversariante do Elenco"}
                  </p>
                </div>
              </div>

              {/* RODAPÉ DO CARD */}
              <div className="bday-card-footer">
                <span className="bday-pos-badge">{primaryPos}</span>
                <span className="bday-tag">
                  {player.isToday ? "🥳 Dia de Festa no ADR" : "🎈 Aniversário"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINAÇÃO E CONTROLES */}
      {totalPages > 1 && (
        <div className="schedule-pagination-wrapper">
          <div className="carousel-controls1">
            <button
              type="button"
              className="nav-arrow"
              onClick={() => changePage("prev")}
              aria-label="Anterior"
            >
              ‹
            </button>

            <div className="pagination-dots">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPageIndex(i)}
                  className={`dot ${i === safePageIndex ? "active" : ""}`}
                  aria-label={`Página ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              className="nav-arrow"
              onClick={() => changePage("next")}
              aria-label="Próximo"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default BirthdaySchedule;
