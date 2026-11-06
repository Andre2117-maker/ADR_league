import React from "react";
import "../../styles/Playerpage/playerbanner.css";

const PlayerBanner = ({ player, getBestPartner, careerDates }) => {
  if (!player) return null;

  const calculateExactAge = (birthDate) => {
    if (!birthDate) return "—";

    let day, month, year;

    if (birthDate.includes("/")) {
      [day, month, year] = birthDate.split("/").map(Number);
    } else {
      [year, month, day] = birthDate.split("-").map(Number);
    }

    if (!year || !month || !day) return "—";

    const today = new Date();
    const birth = new Date(year, month - 1, day);

    let age = today.getFullYear() - birth.getFullYear();

    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() &&
        today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };
  const country = player.country;
  const altura = player.height;
  const age = calculateExactAge(player.birthDate);

  const nameParts = player.name?.trim().split(/\s+/) || ["—"];
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  const positions =
    player.positions?.length > 0 ? player.positions.join(" / ") : "—";

  const shirtNumber = player.number || "00";

  const details = [
    { label: "Idade", value: age },
    { label: "Pé forte", value: player.strongFoot || "—" },
    { label: "País", value: country || "-" },
    { label: "Altura", value: altura || "-" },
  ];

  return (
    <div className="ppg-player-page">
      {/* BANNER PRINCIPAL */}
      <section className="ppg-player-banner">
        {/* Número gigante de fundo */}
        <span
          className="ppg-banner-bgnumber"
          data-len={String(shirtNumber).length}
          aria-hidden="true"
        >
          {shirtNumber}
        </span>

        {/* Informações do jogador */}
        <div className="ppg-banner-info">
          {player.clubRole && (
            <span className="ppg-banner-role">
              {player.clubRole.toUpperCase()}
            </span>
          )}

          <h1 className="ppg-banner-name">
            <span className="ppg-firstname">{firstName}</span>

            {lastName && <span className="ppg-lastname">{lastName}</span>}
          </h1>

          <p className="ppg-banner-position">{positions.toUpperCase()}</p>
        </div>

        {/* Foto do jogador */}
        <div className="ppg-banner-photo-container">
          <img
            src={player.photo || "/players/Anonimo.png"}
            alt={player.name}
            className="ppg-banner-photo"
            crossOrigin="anonymous"
          />
        </div>

        <div className="ppg-banner-overlay"></div>
      </section>

      {/* INFORMAÇÕES COMPLEMENTARES */}
      <section className="ppg-player-extras">
        <div className="ppg-banner-details">
          {details.map((item) => (
            <div key={item.label} className="ppg-detail-item">
              <span className="ppg-detail-label">{item.label}</span>

              <span className="ppg-detail-value">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="ppg-career-timeline">
          <div className="career-item">
            <span className="career-label">DESDE</span>
            <span className="career-value">{careerDates?.entrada || "—"}</span>
          </div>

          {careerDates?.saida && (
            <div className="career-item">
              <span className="career-label">ATÉ</span>
              <span className="career-value">{careerDates.saida}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PlayerBanner;
