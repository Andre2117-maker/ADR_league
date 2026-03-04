import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import "../styles/calendar.css";

function Calendar({
  matches,
  players,
  isAdmin,
  setPage,
  setMatchToEdit,
  onDeleteMatch,
}) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const printRef = useRef(null);
  const navigate = useNavigate();

  // --- FUNÇÃO DE DOWNLOAD DE IMAGEM ---
  const handleDownloadImage = async () => {
    const element = printRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      backgroundColor: "#121212",
      useCORS: true,
      scale: 2,
    });

    const data = canvas.toDataURL("image/png");
    const link = document.createElement("a");

    if (typeof link.download === "string") {
      link.href = data;
      link.download = `partidas_${selectedDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(data);
    }
  };

  // --- FUNÇÕES DE ADMIN ---
  const handleDeleteMatch = (id) => {
    if (
      window.confirm(
        "Deseja realmente eliminar esta partida? Os pontos serão recalculados.",
      )
    ) {
      onDeleteMatch(id); // <--- Chama a função que deleta no Firebase
    }
  };

  const handleEditMatch = (match) => {
    setMatchToEdit(match);
    setPage("adminMatches");
  };

  // --- LÓGICA DO CALENDÁRIO ---
  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysArray = [];

    for (let i = 0; i < firstDay; i++) daysArray.push(null);
    for (let i = 1; i <= days; i++) daysArray.push(i);
    return daysArray;
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${dayStr}`);
  };

  const hasMatchOnDate = (day) => {
    if (!day) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return matches.some((m) => m.date === dateStr);
  };

  const filteredMatches = matches.filter((m) => m.date === selectedDate);
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return (
    <div className="page-container">
      <div className="glass-card">
        <h1 className="page-title">Calendário da Temporada</h1>

        <div className="calendar-wrapper">
          {/* WIDGET DO CALENDÁRIO */}
          <div className="calendar-widget">
            <div className="calendar-header">
              <button onClick={prevMonth} className="nav-btn">
                ‹
              </button>
              <h2>
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </h2>
              <button onClick={nextMonth} className="nav-btn">
                ›
              </button>
            </div>

            <div className="calendar-grid-header">
              <span>D</span>
              <span>S</span>
              <span>T</span>
              <span>Q</span>
              <span>Q</span>
              <span>S</span>
              <span>S</span>
            </div>

            <div className="calendar-grid">
              {getDaysInMonth().map((day, index) => {
                const dateKey = day
                  ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  : null;
                const isSelected = day && selectedDate === dateKey;

                return (
                  <div
                    key={index}
                    className={`calendar-day ${day ? "" : "empty"} ${isSelected ? "selected" : ""}`}
                    onClick={() => handleDayClick(day)}
                  >
                    {day}
                    {hasMatchOnDate(day) && <div className="match-dot"></div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* LISTA DE PARTIDAS */}
          <div className="matches-list-container">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 className="date-title" style={{ margin: 0 }}>
                Jogos em {selectedDate.split("-").reverse().join("/")}
              </h3>

              <button
                onClick={handleDownloadImage}
                className="download-btn-style"
                style={{
                  padding: "6px 12px",
                  background: "#d4af37",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "12px",
                  color: "#121212",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                📸 SALVAR FOTO
              </button>
            </div>

            <div
              ref={printRef}
              style={{ padding: "5px", background: "transparent" }}
            >
              {filteredMatches.length > 0 ? (
                <div className="matches-feed">
                  {filteredMatches.map((match) => (
                    <div
                      key={match.id}
                      className="match-card-display"
                      onClick={() => navigate(`/match/${match.id}`)}
                      style={{
                        flexDirection: "column",
                        height: "auto",
                        cursor: "pointer",
                      }}
                    >
                      {/* BOTÕES DE ADMIN (IGNORADOS NO PRINT) */}
                      {isAdmin && (
                        <div
                          data-html2canvas-ignore="true"
                          className="admin-actions-bar"
                          style={{
                            display: "flex",
                            gap: "15px",
                            justifyContent: "flex-end",
                            width: "100%",
                            marginBottom: "10px",
                            borderBottom: "1px solid #333",
                            paddingBottom: "8px",
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMatch(match);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>✏️</span>
                            <span
                              style={{
                                color: "#2196f3",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              EDITAR
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMatch(match.id);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>🗑️</span>
                            <span
                              style={{
                                color: "#f44336",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              ELIMINAR
                            </span>
                          </button>
                        </div>
                      )}

                      <div
                        className="match-location"
                        style={{
                          textAlign: "center",
                          fontSize: "11px",
                          color: "#d4af37",
                          textTransform: "uppercase",
                          marginBottom: "8px",
                        }}
                      >
                        📍 {match.venue || "Local Indefinido"}
                      </div>

                      <div
                        className="match-main-info"
                        style={{
                          display: "flex",
                          width: "100%",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div className="team-side">
                          <span className="team-name-display">
                            {match.teamA.name}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <div className="score-board">
                            <span className="score-number">
                              {
                                match.events.filter(
                                  (e) =>
                                    (e.type === "GOAL" && e.team === "A") ||
                                    (e.type === "OWN_GOAL" && e.team === "B"),
                                ).length
                              }
                            </span>
                            <span className="versus">X</span>
                            <span className="score-number">
                              {
                                match.events.filter(
                                  (e) =>
                                    (e.type === "GOAL" && e.team === "B") ||
                                    (e.type === "OWN_GOAL" && e.team === "A"),
                                ).length
                              }
                            </span>
                          </div>
                          {match.penaltiesWinner && (
                            <div
                              className="penalties-tag"
                              style={{
                                marginTop: "5px",
                                color: "#d4af37",
                                fontSize: "11px",
                                fontWeight: "bold",
                              }}
                            >
                              🏆 Venceu nos Pênaltis:{" "}
                              {match.penaltiesWinner === "A"
                                ? match.teamA.name
                                : match.teamB.name}
                            </div>
                          )}
                        </div>

                        <div className="team-side">
                          <span className="team-name-display">
                            {match.teamB.name}
                          </span>
                        </div>
                      </div>

                      {/* DETALHES EXPANDIDOS (ESCALAÇÃO E GOLS) */}
                      <div
                        className="match-details-expanded"
                        style={{
                          borderTop: "1px solid #222",
                          marginTop: "10px",
                          paddingTop: "10px",
                        }}
                      >
                        {/* Lado A */}
                        <div className="events-column">
                          <div
                            style={{
                              fontSize: "7px",
                              color: "#666",
                              marginBottom: "5px",
                            }}
                          >
                            ESCALAÇÃO {match.teamA.name.toUpperCase()}
                          </div>
                          {match.teamA.players
                            .map((id) => players.find((p) => p.id === id))
                            .filter((p) => p)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((player) => {
                              const isGK =
                                match.teamA.goalkeeperId === player.id;
                              const pEvents = match.events.filter(
                                (e) => e.playerId === player.id,
                              );
                              return (
                                <div
                                  key={player.id}
                                  className="event-item"
                                  style={{
                                    opacity:
                                      pEvents.length > 0 || isGK ? 1 : 0.6,
                                  }}
                                >
                                  <span
                                    className="event-player"
                                    style={{
                                      fontWeight: isGK ? "bold" : "normal",
                                    }}
                                  >
                                    {player.name} {isGK && "🧤"}
                                  </span>
                                  <span className="event-icons-group">
                                    {pEvents.map((e, i) => (
                                      <span key={i}>
                                        {e.type === "GOAL"
                                          ? "⚽"
                                          : e.type === "ASSIST"
                                            ? "👟"
                                            : "GC"}
                                      </span>
                                    ))}
                                  </span>
                                </div>
                              );
                            })}
                        </div>

                        {/* Lado B */}
                        <div className="events-column text-right">
                          <div
                            style={{
                              fontSize: "7px",
                              color: "#666",
                              marginBottom: "5px",
                            }}
                          >
                            ESCALAÇÃO {match.teamB.name.toUpperCase()}
                          </div>
                          {match.teamB.players
                            .map((id) => players.find((p) => p.id === id))
                            .filter((p) => p)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((player) => {
                              const isGK =
                                match.teamB.goalkeeperId === player.id;
                              const pEvents = match.events.filter(
                                (e) => e.playerId === player.id,
                              );
                              return (
                                <div
                                  key={player.id}
                                  className="event-item"
                                  style={{
                                    justifyContent: "flex-end",
                                    opacity:
                                      pEvents.length > 0 || isGK ? 1 : 0.6,
                                  }}
                                >
                                  <span className="event-icons-group">
                                    {pEvents.map((e, i) => (
                                      <span key={i}>
                                        {e.type === "GOAL"
                                          ? "⚽"
                                          : e.type === "ASSIST"
                                            ? "👟"
                                            : "GC"}
                                      </span>
                                    ))}
                                  </span>
                                  <span
                                    className="event-player"
                                    style={{
                                      fontWeight: isGK ? "bold" : "normal",
                                    }}
                                  >
                                    {isGK && "🧤"} {player.name}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-matches">
                  <span style={{ fontSize: "30px" }}>💤</span>
                  <p>Nenhum jogo agendado para este dia.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;
