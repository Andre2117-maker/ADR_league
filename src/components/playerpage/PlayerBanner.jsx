import React from "react";
import "../../styles/Playerpage/playerbanner.css";

const PlayerBanner = ({ player, getBestPartner }) => {
  if (!player) return null;

  // Cálculo da Idade Exato (Baseado em 20/03/2026)
  const calculateExactAge = (birthDate) => {
    if (!birthDate) return "—";

    // Suporta formatos DD/MM/AAAA ou AAAA-MM-DD
    let day, month, year;

    if (birthDate.includes("/")) {
      [day, month, year] = birthDate.split("/").map(Number);
    } else {
      [year, month, day] = birthDate.split("-").map(Number);
    }

    if (!year || !month || !day) return "—";

    const today = new Date(); // 20 de Março de 2026
    const birth = new Date(year, month - 1, day);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Se o mês atual é antes do mês de nascimento,
    // ou se é o mesmo mês mas o dia atual é antes do dia de nascimento:
    // ainda não fez aniversário este ano.
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  const age = calculateExactAge(player.birthDate);

  // Lógica de divisão de nome
  const nameParts = player.name ? player.name.trim().split(/\s+/) : ["—"];
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  return (
    <section className="ppg-player-banner">
      <div className="ppg-banner-content">
        <div className="ppg-banner-info">
          {player.clubRole && (
            <div className="ppg-banner-role">
              <span className="role-icon">🛡️</span>
              {player.clubRole.toUpperCase()}
            </div>
          )}

          <h2 className="ppg-banner-number">{player.number || "00"}</h2>

          <h1 className="ppg-banner-name">
            <span className="ppg-firstname">{firstName}</span>
            {lastName && <span className="ppg-lastname">{lastName}</span>}
          </h1>

          <div className="ppg-banner-details">
            <div className="ppg-detail-item">
              <span className="ppg-detail-label">Idade</span>
              <span className="ppg-detail-value">{age}</span>
            </div>

            <div className="ppg-detail-item">
              <span className="ppg-detail-label">Pé Forte</span>
              <span className="ppg-detail-value">
                {player.strongFoot || "—"}
              </span>
            </div>

            <div className="ppg-detail-item">
              <span className="ppg-detail-label">Parceiro</span>
              <span className="ppg-detail-value">
                {getBestPartner ? getBestPartner(player.id) : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="ppg-banner-photo-container">
          <img
            src={player.photo || ""}
            alt={player.name}
            className="ppg-banner-photo"
            crossOrigin="anonymous"
          />
        </div>
      </div>

      <div className="ppg-banner-overlay-grid"></div>
    </section>
  );
};

export default PlayerBanner;
