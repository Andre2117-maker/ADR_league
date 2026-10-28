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

export function calculateMatchStats(match, players = []) {
  if (!match) {
    return {
      stats: {
        A: { goals: 0, assists: 0, yellow: 0, red: 0, ownGoals: 0, subs: 0 },
        B: { goals: 0, assists: 0, yellow: 0, red: 0, ownGoals: 0, subs: 0 },
      },
      mvp: null,
    };
  }

  const events = match.events || [];

  // 1. ESTATÍSTICAS COLETIVAS POR EQUIPE (Mantém compatibilidade com MatchStats)
  const teamStats = {
    A: { goals: 0, assists: 0, yellow: 0, red: 0, ownGoals: 0, subs: 0 },
    B: { goals: 0, assists: 0, yellow: 0, red: 0, ownGoals: 0, subs: 0 },
  };

  events.forEach((e) => {
    const t = e.team === "A" ? "A" : "B";
    const opp = t === "A" ? "B" : "A";

    if (e.type === "GOAL") {
      teamStats[t].goals += 1;
      if (e.assistId) teamStats[t].assists += 1;
    } else if (e.type === "OWN_GOAL") {
      teamStats[t].ownGoals += 1;
      teamStats[opp].goals += 1; // Gol contra soma no placar do adversário
    } else if (e.type === "YELLOW" || e.type === "YELLOW_CARD") {
      teamStats[t].yellow += 1;
    } else if (e.type === "RED" || e.type === "RED_CARD") {
      teamStats[t].red += 1;
    } else if (e.type === "SUB") {
      teamStats[t].subs += 1;
    }
  });

  // 2. DESCOBRIR O TIME VENCEDOR DA PARTIDA
  const scoreA = teamStats.A.goals;
  const scoreB = teamStats.B.goals;

  let winningTeam = null;
  if (match.goldenGoalWinner) {
    winningTeam =
      String(match.goldenGoalWinner).toUpperCase() === "A" ? "A" : "B";
  } else if (scoreA > scoreB) {
    winningTeam = "A";
  } else if (scoreB > scoreA) {
    winningTeam = "B";
  } else {
    const pensA =
      match.penalties?.A?.filter(
        (p) => (p?.result || p) === "goal" || (p?.result || p) === "scored",
      ).length ?? Number(match.penaltiesScoreA || 0);
    const pensB =
      match.penalties?.B?.filter(
        (p) => (p?.result || p) === "goal" || (p?.result || p) === "scored",
      ).length ?? Number(match.penaltiesScoreB || 0);

    if (pensA > pensB) winningTeam = "A";
    else if (pensB > pensA) winningTeam = "B";
    else if (match.penaltiesWinner || match.winner) {
      const w = String(match.penaltiesWinner || match.winner).toUpperCase();
      if (w.includes("A")) winningTeam = "A";
      else if (w.includes("B")) winningTeam = "B";
    }
  }

  // 3. REUNIR TODOS OS JOGADORES QUE PARTICIPARAM DA PARTIDA
  const participantsA = new Set(
    (match.actualParticipantsA || match.teamA?.players || []).map(String),
  );
  const participantsB = new Set(
    (match.actualParticipantsB || match.teamB?.players || []).map(String),
  );

  events.forEach((e) => {
    if (e.playerId && e.playerId !== "OPONENTE_EXTERNO") {
      if (e.team === "A") participantsA.add(String(e.playerId));
      if (e.team === "B") participantsB.add(String(e.playerId));
    }
    if (e.assistId) {
      if (e.team === "A") participantsA.add(String(e.assistId));
      if (e.team === "B") participantsB.add(String(e.assistId));
    }
    if (e.type === "SUB" && e.playerInId) {
      if (e.team === "A") participantsA.add(String(e.playerInId));
      if (e.team === "B") participantsB.add(String(e.playerInId));
    }
  });

  const allParticipantIds = new Set([...participantsA, ...participantsB]);

  // 4. CÁLCULO DE RATING JUSTO DE MVP PARA CADA ATLETA
  let bestPlayer = null;
  let bestBreakdown = null;

  allParticipantIds.forEach((pIdStr) => {
    const playerObj = players.find((p) => String(p.id) === pIdStr);
    if (!playerObj) return;

    const isTeamA = participantsA.has(pIdStr);
    const playerTeam = isTeamA ? "A" : "B";
    const isWinner = winningTeam === playerTeam;

    // Contabiliza ações individuais na partida
    let goals = 0;
    let assists = 0;
    let ownGoals = 0;
    let yellows = 0;
    let reds = 0;

    events.forEach((e) => {
      if (e.type === "GOAL") {
        if (String(e.playerId) === pIdStr) goals += 1;
        if (String(e.assistId) === pIdStr) assists += 1;
      } else if (e.type === "ASSIST" && String(e.playerId) === pIdStr) {
        assists += 1;
      } else if (e.type === "OWN_GOAL" && String(e.playerId) === pIdStr) {
        ownGoals += 1;
      } else if (
        (e.type === "YELLOW" || e.type === "YELLOW_CARD") &&
        String(e.playerId) === pIdStr
      ) {
        yellows += 1;
      } else if (
        (e.type === "RED" || e.type === "RED_CARD") &&
        String(e.playerId) === pIdStr
      ) {
        reds += 1;
      }
    });

    // Verifica se atuou como Goleiro Oficial da equipe
    const isGK =
      (playerTeam === "A" && String(match.teamA?.goalkeeperId) === pIdStr) ||
      (playerTeam === "B" && String(match.teamB?.goalkeeperId) === pIdStr);

    const goalsConceded = playerTeam === "A" ? scoreB : scoreA;
    const teamGoalsScored = playerTeam === "A" ? scoreA : scoreB;

    // Pênaltis batidos pelo jogador (se houver disputa de pênaltis)
    const teamPens = match.penalties?.[playerTeam] || [];
    let penScored = 0;
    let penMissed = 0;
    teamPens.forEach((p) => {
      if (p && typeof p === "object" && String(p.playerId) === pIdStr) {
        if (p.result === "goal" || p.result === "scored") penScored += 1;
        else if (p.result === "miss" || p.result === "lost") penMissed += 1;
      }
    });

    // =========================================================================
    // FÓRMULA BALANCEADA DE IMPACTO (MVP SCORE)
    // =========================================================================
    let rating = 6.0; // Nota base de partida

    // A) Impacto Ofensivo (Gols e Assistências equilibrados)
    rating += goals * 3.5;
    rating += assists * 2.8;

    // Bônus Playmaker (Fez gol E deu assistência na mesma partida)
    if (goals >= 1 && assists >= 1) {
      rating += 1.2;
    }

    // Bônus de Hat-Trick (3+ gols) ou Dobradinha de Garçom (3+ assists)
    if (goals >= 3) rating += 1.5;
    if (assists >= 3) rating += 1.2;

    // Bônus de Participação Decisiva (% dos gols do time que passaram por ele)
    if (teamGoalsScored > 0 && goals + assists > 0) {
      const share = Math.min(1, (goals + assists) / teamGoalsScored);
      rating += share * 1.2; // Valoriza quem carregou um jogo difícil (ex: 1x0 ou 2x1)
    }

    // B) Impacto Defensivo para Goleiros (Permite Goleiro ser MVP!)
    if (isGK) {
      if (goalsConceded === 0) {
        rating += 5.0; // Clean Sheet (SG)
      } else if (goalsConceded <= 2) {
        rating += 2.5; // Sofreu poucos gols
      } else {
        rating -= (goalsConceded - 2) * 0.45;
      }

      // Se o time venceu nos pênaltis, o goleiro recebe bônus decisivo
      if (scoreA === scoreB && isWinner && teamPens.length > 0) {
        rating += 2.0;
      }
    }

    // C) Resultado Coletivo (Vencer a partida pesa de verdade)
    if (isWinner) {
      rating += 2.5;
      // Se teve Gol de Ouro para o time dele, bônus extra
      if (match.goldenGoalWinner) rating += 0.5;
    }

    // D) Disputa de Pênaltis
    rating += penScored * 1.0;
    rating -= penMissed * 1.2;

    // E) Punições Disciplinares e Gols Contra
    rating -= ownGoals * 2.5;
    rating -= yellows * 1.0;
    rating -= reds * 3.5;

    // Só concorre a MVP quem teve impacto positivo acima da nota base (ou fechou o gol)
    const hadPositiveAction =
      goals > 0 ||
      assists > 0 ||
      (isGK && goalsConceded <= 1 && isWinner) ||
      penScored > 0;

    if (!hadPositiveAction) return;

    const candidate = {
      rating,
      isWinner,
      totalContributions: goals + assists,
      goals,
      assists,
      cardsPenalty: yellows + reds * 2,
    };

    // Comparação com critérios de desempate justos
    if (!bestBreakdown) {
      bestBreakdown = candidate;
      bestPlayer = { ...playerObj, mvpRating: rating.toFixed(1) };
    } else {
      const diff = candidate.rating - bestBreakdown.rating;

      if (diff > 0.05) {
        bestBreakdown = candidate;
        bestPlayer = { ...playerObj, mvpRating: rating.toFixed(1) };
      } else if (Math.abs(diff) <= 0.05) {
        // EMPATE TÉCNICO NA NOTA -> Desempates:
        // 1º: Jogador do time vencedor
        // 2º: Maior soma de (Gols + Assistências)
        // 3º: Menos cartões
        const winsTiebreaker =
          (candidate.isWinner && !bestBreakdown.isWinner) ||
          (candidate.isWinner === bestBreakdown.isWinner &&
            candidate.totalContributions > bestBreakdown.totalContributions) ||
          (candidate.isWinner === bestBreakdown.isWinner &&
            candidate.totalContributions === bestBreakdown.totalContributions &&
            candidate.cardsPenalty < bestBreakdown.cardsPenalty);

        if (winsTiebreaker) {
          bestBreakdown = candidate;
          bestPlayer = { ...playerObj, mvpRating: rating.toFixed(1) };
        }
      }
    }
  });

  return {
    stats: teamStats,
    mvp: bestPlayer,
  };
}
