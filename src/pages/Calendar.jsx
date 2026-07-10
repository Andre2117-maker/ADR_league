import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import MatchCard from "../components/calendar/MatchCard";
import Footer from "../components/Footer";
import "../styles/calendar.css";

function Calendar({ matches, isAdmin, setMatchToEdit, onDeleteMatch }) {
  const navigate = useNavigate();
  const localDate = new Date();
  const currentMonthIndex = localDate.getMonth();

  // Estados de Filtro
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex); // 0 a 11, ou 'ALL'
  const [selectedComp, setSelectedComp] = useState("TODAS AS COMPETIÇÕES");

  const mesesNav = [
    "JUL",
    "AGO",
    "SET",
    "OUT",
    "NOV",
    "DEZ",
    "JAN",
    "FEV",
    "MAR",
    "ABR",
    "MAI",
    "JUN",
  ];
  const mesesFull = [
    "JANEIRO",
    "FEVEREIRO",
    "MARÇO",
    "ABRIL",
    "MAIO",
    "JUNHO",
    "JULHO",
    "AGOSTO",
    "SETEMBRO",
    "OUTUBRO",
    "NOVEMBRO",
    "DEZEMBRO",
  ];

  // Funções de Admin
  const handleAddMatch = () => {
    setMatchToEdit(null);
    navigate("/admin");
  };

  const handleEditMatch = (match) => {
    setMatchToEdit(match);
    navigate("/admin", { state: { matchData: match } });
  };

  const handleDeleteMatch = (id) => {
    if (window.confirm("Deseja realmente eliminar esta partida?")) {
      onDeleteMatch(id);
    }
  };

  // Lógica de Filtro
  const filteredMatches = matches.filter((m) => {
    if (!m.date) return false;
    const matchMonth = parseInt(m.date.split("-")[1], 10) - 1;

    const passMonth = selectedMonth === "ALL" || matchMonth === selectedMonth;
    const passComp =
      selectedComp === "TODAS AS COMPETIÇÕES" || m.type === selectedComp;

    return passMonth && passComp;
  });

  // Identifica o índice do mês real a partir da sigla
  const getMonthIndexFromSigla = (sigla) => {
    const map = {
      JAN: 0,
      FEV: 1,
      MAR: 2,
      ABR: 3,
      MAI: 4,
      JUN: 5,
      JUL: 6,
      AGO: 7,
      SET: 8,
      OUT: 9,
      NOV: 10,
      DEZ: 11,
    };
    return map[sigla];
  };

  return (
    <div className={`psg-page-container`}>
      <div className="psg-calendar-wrapper">
        {/* Cabeçalho */}
        <div className="psg-header">
          <h1 className="psg-season-title">
            2026 <span style={{ fontSize: "14px" }}>v</span>
          </h1>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {isAdmin && (
              <button onClick={handleAddMatch} className="psg-add-btn">
                + ADD PARTIDA
              </button>
            )}
          </div>
        </div>

        {/* Navegação de Meses */}
        <div className="psg-month-nav">
          <span
            className={selectedMonth === "ALL" ? "active" : ""}
            onClick={() => setSelectedMonth("ALL")}
          >
            TODA A TEMPORADA
          </span>
          {mesesNav.map((sigla) => {
            const mIndex = getMonthIndexFromSigla(sigla);
            return (
              <span
                key={sigla}
                className={selectedMonth === mIndex ? "active" : ""}
                onClick={() => setSelectedMonth(mIndex)}
              >
                {sigla}
              </span>
            );
          })}
        </div>

        {/* Navegação de Competições */}
        <div className="psg-comp-nav">
          {["TODAS AS COMPETIÇÕES", "TREINO", "AMISTOSO"].map((comp) => (
            <span
              key={comp}
              className={selectedComp === comp ? "active" : ""}
              onClick={() => setSelectedComp(comp)}
            >
              {comp}
            </span>
          ))}
        </div>

        {/* Título do Mês Atual */}
        <h2 className="psg-month-title">
          {selectedMonth === "ALL"
            ? "TODA A TEMPORADA"
            : mesesFull[selectedMonth]}
        </h2>

        {/* Grid de Cards */}
        {filteredMatches.length > 0 ? (
          <div className="psg-cards-grid">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                isAdmin={isAdmin}
                onEdit={handleEditMatch}
                onDelete={handleDeleteMatch}
                onNavigate={(id) => navigate(`/match/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="psg-no-matches">
            <p>Nenhum jogo agendado para este período.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Calendar;
