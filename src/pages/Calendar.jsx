import { useState, useRef, useEffect } from "react"; // Adicionado useEffect
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import "../styles/calendar.css";
import Footer from "../components/Footer";
import MatchCard from "../components/calendar/MatchCard";

function Calendar({
  matches,
  players,
  isAdmin,
  setMatchToEdit,
  onDeleteMatch,
}) {
  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  // 1. Tenta recuperar a data salva ou usa hoje
  const savedDate =
    localStorage.getItem("adr_calendar_selected_date") || todayStr;

  const [selectedDate, setSelectedDate] = useState(savedDate);

  // 2. Define o mês inicial baseado na data salva (para não abrir em março se você estava vendo abril)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [sYear, sMonth] = savedDate.split("-");
    return new Date(parseInt(sYear), parseInt(sMonth) - 1, 1);
  });

  const printRef = useRef(null);
  const navigate = useNavigate();

  // 3. Efeito para salvar a data e o mês sempre que mudarem
  useEffect(() => {
    localStorage.setItem("adr_calendar_selected_date", selectedDate);
  }, [selectedDate]);

  // --- FUNÇÕES DE ADMIN ---
  const handleDeleteMatch = (id) => {
    if (
      window.confirm(
        "Deseja realmente eliminar esta partida? Os pontos serão recalculados.",
      )
    ) {
      onDeleteMatch(id);
    }
  };

  const handleEditMatch = (match) => {
    setMatchToEdit(match);
    navigate("/admin", { state: { matchData: match } });
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

  const getBirthdayOnDate = (day) => {
    if (!day) return null;
    const month = currentMonth.getMonth() + 1;
    const dayStr = String(day).padStart(2, "0");
    const monthStr = String(month).padStart(2, "0");

    return players.find((p) => {
      if (!p.birthDate) return false;
      const bday = p.birthDate.split("/");
      return bday[1] === monthStr && bday[0] === dayStr;
    });
  };

  const handleSwapOrder = async (currentMatch, direction) => {
    // Encontra o vizinho na lista ordenada
    const sorted = [...matches].sort((a, b) => b.order - a.order);
    const currentIndex = sorted.findIndex((m) => m.id === currentMatch.id);
    const targetIndex =
      direction === "UP" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex >= 0 && targetIndex < sorted.length) {
      const targetMatch = sorted[targetIndex];

      // Inverte as ordens no Firebase
      await updateDoc(doc(db, "matches", currentMatch.id), {
        order: targetMatch.order,
      });
      await updateDoc(doc(db, "matches", targetMatch.id), {
        order: currentMatch.order,
      });

      // Opcional: recarregar os dados
    }
  };

  return (
    <div className="page-container">
      <div className="glass-card">
        <h1 className="page-title2">Calendário da Temporada</h1>

        <div className="calendar-wrapper">
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
                    {getBirthdayOnDate(day) && (
                      <div className="birthday-dot"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="matches-list-container">
            <h3 className="date-title">
              Jogos em {selectedDate.split("-").reverse().join("/")}
            </h3>

            {getBirthdayOnDate(parseInt(selectedDate.split("-")[2])) && (
              <div
                className="birthday-card"
                style={{
                  background: "#122a3d",
                  padding: "15px",
                  borderRadius: "10px",
                  marginBottom: "15px",
                  border: "1px solid #2196f3",
                  color: "#fff",
                  textAlign: "center",
                }}
              >
                <span>🎂</span>
                <h4>
                  Aniversário de{" "}
                  {getBirthdayOnDate(parseInt(selectedDate.split("-")[2])).name}
                  !
                </h4>
                <p style={{ fontSize: "12px", color: "#b3e5fc" }}>
                  Hoje o dia é todo dele(a)!
                </p>
              </div>
            )}

            <div ref={printRef}>
              {filteredMatches.length > 0 ? (
                <div className="matches-feed">
                  {filteredMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      players={players}
                      isAdmin={isAdmin}
                      onEdit={handleEditMatch}
                      onDelete={handleDeleteMatch}
                      onNavigate={(id) => navigate(`/match/${id}`)}
                      onSwapOrder={handleSwapOrder}
                    />
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
      <Footer />
    </div>
  );
}

export default Calendar;
