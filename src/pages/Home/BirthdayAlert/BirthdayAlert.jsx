import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import "./BirthdayAlert.css";

/* Coroa desenhada (no lugar do emoji) */
const CrownIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.5 8 8 11.5l4-6.5 4 6.5L20.5 8l-1.8 10H5.3z" />
    <path d="M5.5 21h13" />
    <circle cx="12" cy="14.5" r="1.2" />
  </svg>
);

/* Cores do confete de acordo com o tema do site */
const confettiColors = () => {
  const b = document.body.classList;
  if (b.contains("theme-idr")) return ["#000000", "#ffffff", "#9a9a9a"];
  if (b.contains("theme-classic"))
    return ["#7b3aa8", "#b8307a", "#e3263a", "#ff8aa5", "#ffffff"];
  return ["#d4af37", "#ffffff", "#ffd700", "#10b981"];
};

const clubName = () =>
  document.body.classList.contains("theme-idr") ? "IDR" : "O ADR";

const BirthdayAlert = ({ players }) => {
  const [birthdayPlayer, setBirthdayPlayer] = useState(null);

  useEffect(() => {
    if (!players || players.length === 0) return;

    const today = new Date();
    const tDay = today.getDate();
    const tMonth = today.getMonth() + 1; // Janeiro = 1

    const winner = players.find((p) => {
      if (!p.birthDate || p.isAnonymous) return false;

      const parts = p.birthDate.split("/");
      if (parts.length < 2) return false;

      const pDay = parseInt(parts[0], 10);
      const pMonth = parseInt(parts[1], 10);

      return pDay === tDay && pMonth === tMonth;
    });

    if (winner) {
      setBirthdayPlayer(winner);
      triggerConfetti();
    }
  }, [players]);

  const triggerConfetti = () => {
    const end = Date.now() + 5 * 1000;
    const colors = confettiColors();

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.65 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.65 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  return (
    <AnimatePresence>
      {birthdayPlayer && (
        <motion.div
          className="bday-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bday-card"
            role="dialog"
            aria-label="Aniversariante do dia"
            initial={{ scale: 0.8, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div className="bday-glow-effect" />

            <div className="bday-photo-wrapper">
              <img
                src={birthdayPlayer.photo || "/players/Anonimo.png"}
                alt={birthdayPlayer.name}
                className="bday-player-img"
              />
              <span className="bday-crown" title="Aniversariante do Dia">
                <CrownIcon />
              </span>
            </div>

            <span className="bday-kicker">PARABÉNS OFICIAL · {clubName()}</span>
            <h2 className="bday-title">
              HOJE É DIA DE <span className="highlight">FESTA!</span>
            </h2>

            <p className="bday-name">{birthdayPlayer.name.toUpperCase()}</p>
            <p className="bday-wish">
              O clube e todo o elenco desejam um dia incrível, repleto de
              conquistas, alegria e muitos gols!
            </p>

            <button
              type="button"
              onClick={() => setBirthdayPlayer(null)}
              className="bday-btn"
            >
              VAMO, CRAQUE!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BirthdayAlert;
