import React, { useState, useMemo } from "react";
import "./BirthdaySchedule.css";
import { getShirtNumber, useClubMode } from "../../../utils/Shirtnumber";

/* Ícones desenhados (no lugar dos emojis) */
const BD_ICO = {
  cal: "M4 6h16v14H4zM4 10h16M8 3.5v4M16 3.5v4",
  cake: "M4 20h16v-7H4zM4 15.5c2 1.3 4 1.3 5.3 0 1.4 1.3 4 1.3 5.4 0 1.3 1.3 3.3 1.3 5.3 0M8 13V10M12 13V10M16 13V10M8 7.5v.5M12 7.5v.5M16 7.5v.5",
  hourglass: "M7 3.5h10M7 20.5h10M8 3.5c0 4.5 4 5.5 4 8.5s-4 4-4 8.5M16 3.5c0 4.5-4 5.5-4 8.5s4 4 4 8.5",
  party: "M4 20l4.5-12L16 15.5zM14 4l.5 2M18 6l-2 1M20 11l-2 .5M11 5.5c1.5 1 2 2.5 1.5 4",
  balloon: "M12 3a5.5 6.5 0 1 0 0 13 5.5 6.5 0 0 0 0-13zM12 16l-1 2h2zM12 18c0 2-2 2-1.5 3.5",
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
};
const BdIco = ({ n }) => (
  <svg className="bd-ico" viewBox="0 0 24 24" aria-hidden="true">
    <path d={BD_ICO[n]} />
  </svg>
);

const BirthdaySchedule = ({ players = [] }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const clubMode = useClubMode(); // "adr" | "idr" (muda o nº da camisa)
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
        <span className="schedule-kicker">
          CALENDÁRIO DO ELENCO • {clubMode === "idr" ? "IDR" : "O ADR"}
        </span>
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
          // Número conforme o modo (ADR / IDR); "" = sem número
          const shirt = getShirtNumber(player, clubMode, "");
          const photo =
            clubMode === "idr"
              ? player.photoIDR1 || player.photo
              : player.photo;

          return (
            <div
              key={player.id}
              className={`schedule-card ${
                player.isToday ? "is-birthday-today" : ""
              }`}
            >
              {/* TOPO DO CARD: DATA + BADGE DE CONTAGEM REGRESSIVA */}
              <div className="card-header">
                <span className="bday-date">
                  <BdIco n="cal" /> {player.formattedDate}
                </span>

                <span
                  className={`bday-countdown-pill ${
                    player.isToday
                      ? "today"
                      : player.daysUntil <= 7
                        ? "soon"
                        : ""
                  }`}
                >
                  {player.isToday ? (
                    <>
                      <BdIco n="cake" /> É HOJE!
                    </>
                  ) : player.isTomorrow ? (
                    <>
                      <BdIco n="hourglass" /> É AMANHÃ!
                    </>
                  ) : (
                    `Faltam ${player.daysUntil} dias`
                  )}
                </span>
              </div>

              {/* CORPO DO CARD: FOTO DO ATLETA + INFO */}
              <div className="bday-Card-body">
                <div className="bday-avatar-wrap">
                  <img
                    src={photo || "/players/Anonimo.png"}
                    alt={player.name}
                    className="bday-avatar-img"
                  />
                  {shirt !== "" && (
                    <span className="bday-shirt-num">#{shirt}</span>
                  )}
                </div>

                <div className="bday-player-info">
                  <h3 className="bday-player-name">{player.name}</h3>
                  <p className="bday-text">
                    {player.isToday
                      ? "Parabéns pelo seu dia, craque!"
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
                  {player.isToday ? (
                    <>
                      <BdIco n="party" /> Dia de festa no{" "}
                      {clubMode === "idr" ? "IDR" : "ADR"}
                    </>
                  ) : (
                    <>
                      <BdIco n="balloon" /> Aniversário
                    </>
                  )}
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
              <BdIco n="left" />
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
              <BdIco n="right" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default BirthdaySchedule;
