import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import "../styles/BirthdayAlert.css";

const BirthdayAlert = ({ players }) => {
  const [birthdayPlayer, setBirthdayPlayer] = useState(null);

  useEffect(() => {
    if (!players || players.length === 0) return;

    const today = new Date();
    const tDay = today.getDate();
    const tMonth = today.getMonth() + 1; // +1 porque JS vai de 0 a 11

    const winner = players.find((p) => {
      // Verifica se a propriedade existe. No seu caso é birthDate
      if (!p.birthDate) return false;

      // "30/09/2005" -> ["30", "09", "2005"]
      const parts = p.birthDate.split("/");
      const pDay = parseInt(parts[0], 10);
      const pMonth = parseInt(parts[1], 10);

      // Compara apenas dia e mês
      return pDay === tDay && pMonth === tMonth;
    });

    if (winner) {
      setBirthdayPlayer(winner);
      triggerConfetti();
    }
  }, [players]);

  const triggerConfetti = () => {
    const end = Date.now() + 4 * 1000;
    const colors = ["#d4af37", "#ffffff", "#ffd700"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: colors,
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
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            <div className="bday-photo-wrapper">
              <img
                src={birthdayPlayer.photo}
                alt={birthdayPlayer.name}
                className="bday-player-img"
              />
              <span className="bday-crown">👑</span>
            </div>

            <h2 className="bday-title">
              HOJE É DIA DE <span className="highlight">FESTA!</span>
            </h2>
            <p className="bday-name">{birthdayPlayer.name.toUpperCase()}</p>
            <p className="bday-wish">
              A ADR LEAGUE TE DESEJA UM DIA DE MUITOS GOLS E VITÓRIAS!
            </p>

            <button
              onClick={() => setBirthdayPlayer(null)}
              className="bday-btn"
            >
              BORAAA! ⚽
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BirthdayAlert;
