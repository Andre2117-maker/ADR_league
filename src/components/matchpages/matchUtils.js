// ==========================================
// NOVA FUNÇÃO: Pega TODOS que jogaram (Titulares + Reservas)
// ==========================================
export const getAllParticipatingPlayers = (match) => {
  const participantsA = new Set();
  const participantsB = new Set();

  // 1. Adiciona os Titulares (que estão na formação inicial)
  Object.values(match.tacticalA || {}).forEach((id) => {
    if (id) participantsA.add(id);
  });
  Object.values(match.tacticalB || {}).forEach((id) => {
    if (id) participantsB.add(id);
  });

  // 2. Adiciona os Reservas (vasculhando os eventos de substituição)
  match.events?.forEach((event) => {
    if (event.type === "SUB" && event.playerInId) {
      if (event.team === "A") participantsA.add(event.playerInId);
      if (event.team === "B") participantsB.add(event.playerInId);
    }
  });

  // Retorna arrays limpos apenas com os IDs de quem realmente jogou
  return {
    teamA: Array.from(participantsA),
    teamB: Array.from(participantsB),
  };
};

// ==========================================
// SUA FUNÇÃO ORIGINAL DE ESTATÍSTICAS (MVP, Gols, Cartões)
// ==========================================
export const calculateMatchStats = (match, players) => {
  const stats = {
    teamA: {
      goals: 0,
      assists: 0,
      ownGoals: 0,
      yellowCards: 0,
      redCards: 0,
      points: 0,
    },
    teamB: {
      goals: 0,
      assists: 0,
      ownGoals: 0,
      yellowCards: 0,
      redCards: 0,
      points: 0,
    },
    playerPoints: {}, // { playerId: score }
  };

  match.events?.forEach((event) => {
    const pId = String(event.playerId);

    if (!stats.playerPoints[pId]) {
      stats.playerPoints[pId] = 0;
    }

    const teamStats = stats[`team${event.team}`];

    // =====================
    // GOL
    // =====================
    if (event.type === "GOAL") {
      teamStats.goals++;
      stats.playerPoints[pId] += 3;

      // assistência
      if (event.assistId) {
        const aId = String(event.assistId);
        if (!stats.playerPoints[aId]) {
          stats.playerPoints[aId] = 0;
        }
        stats.playerPoints[aId] += 2;
        teamStats.assists++;
      }
    }

    // =====================
    // GOL CONTRA
    // =====================
    if (event.type === "OWN_GOAL") {
      teamStats.ownGoals++;
      stats.playerPoints[pId] -= 1;
    }

    // =====================
    // AMARELO
    // =====================
    if (event.type === "YELLOW" || event.type === "YELLOW_CARD") {
      teamStats.yellowCards++;
      stats.playerPoints[pId] -= 0.5;
    }

    // =====================
    // VERMELHO
    // =====================
    if (event.type === "RED" || event.type === "RED_CARD") {
      teamStats.redCards++;
      stats.playerPoints[pId] -= 2;
    }
  });

  // =====================
  // MVP
  // =====================
  let mvpId = null;
  let maxPoints = -1;

  Object.entries(stats.playerPoints).forEach(([id, pts]) => {
    if (pts > maxPoints) {
      maxPoints = pts;
      mvpId = id;
    }
  });

  const mvp = players.find((p) => String(p.id) === String(mvpId));

  return { stats, mvp, maxPoints };
};
