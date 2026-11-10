import { db } from "../../firebase";

import MatchSetup from "../../components/adminmatches/MatchSetup";
import TeamPanel from "../../components/adminmatches/TeamPanel";
import MatchTimeline from "../../components/adminmatches/MatchTimeline";
import PenaltiesSection from "../../components/adminmatches/PenaltiesSection";
import FinishPanel from "../../components/adminmatches/FinishPanel";
import {
  AssistModal,
  MinuteModal,
  SubModal,
  VenueModal,
  PickPlayerModal,
} from "../../components/adminmatches/EventModals";
import useMatchClock from "../../components/adminmatches/useMatchClock";
import {
  STEPS,
  EVENT_META,
  emptyDraft,
  todayISO,
  readSavedDraft,
  writeSavedDraft,
  clearSavedDraft,
  countGoals,
  penaltyGoals,
  computeWinner,
  buildLineups,
  currentGoalkeeper,
  playerMatchStats,
  playerName,
  isExternalMatch,
  teamKeyOf,
  otherSide,
  compressLogoImage,
  fmtClock,
} from "../../components/adminmatches/adminMatchesUtils";
import { computeGkStats } from "../../utils/goalkeeperStats";
import { getShirtNumber, useClubMode } from "../../utils/Shirtnumber";
import { saveTeamPreset, loadTeamPresets } from "../../data/teamPresets";
import LogoADR from "../../assets/logo.png";

import "./adminmatches.css";

function AdminMatches({ players, isAdmin, matchToEdit, setMatchToEdit }) {
  const navigate = useNavigate();
  const location = useLocation();
  const clubMode = useClubMode();

  /* ---------- ESTADO ---------- */
  const [loading, setLoading] = useState(false);
  const [loadingLast, setLoadingLast] = useState(false);
  const [matchType, setMatchType] = useState(matchToEdit?.type || "TREINO");
  const [eventType, setEventType] = useState(matchToEdit?.eventType || "NATAL");
  const [isOfficial, setIsOfficial] = useState(matchToEdit?.isOfficial ?? true);
  const [generateFoul, setGenerateFoul] = useState(
    matchToEdit?.generateFoul ?? true,
  );
  const [teamPresets, setTeamPresets] = useState([]);
  const [venues, setVenues] = useState([]);

  const [step, setStep] = useState("setup");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const { clock, setClock, seconds, minute, toggle, adjust, reset } =
    useMatchClock();
  const [autoMinute, setAutoMinute] = useState(true);
  const [showClock, setShowClock] = useState(false);

  const [pendingRestore, setPendingRestore] = useState(() =>
    matchToEdit ? null : readSavedDraft(),
  );

  const initialDate = useMemo(
    () => matchToEdit?.date || location.state?.initialDate || todayISO(),
    [matchToEdit, location.state],
  );
  const [draft, setDraft] = useState(() =>
    matchToEdit
      ? { ...emptyDraft(initialDate), ...matchToEdit }
      : emptyDraft(initialDate),
  );

  /* ---------- CARREGAMENTOS ---------- */
  useEffect(() => {
    getDocs(collection(db, "locais"))
      .then((snap) =>
        setVenues(snap.docs.map((d) => d.data().name).filter(Boolean)),
      )
      .catch((err) => console.error("Erro ao carregar locais:", err));
  }, []);

  useEffect(() => {
    if (!matchToEdit && location.state?.initialDate) {
      setDraft((prev) => ({ ...prev, date: location.state.initialDate }));
    }
  }, [location.state, matchToEdit]);

  useEffect(() => {
    loadTeamPresets(draft.date).then(setTeamPresets).catch(console.error);
  }, [draft.date]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ---------- RASCUNHO AUTOMÁTICO ---------- */
  useEffect(() => {
    if (matchToEdit || pendingRestore) return undefined;
    const t = setTimeout(
      () =>
        writeSavedDraft({
          draft,
          matchType,
          eventType,
          isOfficial,
          generateFoul,
          clock,
          autoMinute,
          savedAt: Date.now(),
        }),
      400,
    );
    return () => clearTimeout(t);
  }, [
    draft,
    matchType,
    eventType,
    isOfficial,
    generateFoul,
    clock,
    autoMinute,
    matchToEdit,
    pendingRestore,
  ]);

  const events = draft.events || [];
  const isDirty =
    !matchToEdit &&
    (events.length > 0 ||
      draft.teamA.players.length > 0 ||
      draft.teamB.players.length > 0);

  useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  /* ---------- DERIVADOS ---------- */
  const externalMode = isExternalMatch(matchType);
  const isExternalSide = (side) => externalMode && side === "B";

  const sortedPlayers = useMemo(
    () =>
      [...players].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [players],
  );
  const playersById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players],
  );

  const { a: goalsA, b: goalsB } = countGoals(events);
  const pensA = penaltyGoals(draft.penalties, "A");
  const pensB = penaltyGoals(draft.penalties, "B");
  const isDraw = goalsA === goalsB;
  const result = computeWinner({
    goalsA,
    goalsB,
    goldenGoalWinner: draft.goldenGoalWinner,
    pensA,
    pensB,
  });

  const lineups = useMemo(() => buildLineups(draft), [draft]);
  const stats = useMemo(() => playerMatchStats(events), [events]);
  const gkStats = useMemo(() => computeGkStats(draft), [draft]);
  const gkNow = {
    A: currentGoalkeeper(draft, "A"),
    B: currentGoalkeeper(draft, "B"),
  };

  const withShirt = (p) => ({ ...p, shirt: getShirtNumber(p, clubMode, "") });
  const participantsOf = (side) =>
    [...lineups[side].participants]
      .map((id) => playersById[id])
      .filter(Boolean)
      .map(withShirt);
  const onFieldOf = (side) =>
    [...lineups[side].onField]
      .map((id) => playersById[id])
      .filter(Boolean)
      .map(withShirt);

  const autoMinuteActive = clock.running && autoMinute;

  // Nome do time na tela: se os dois têm o mesmo nome (treino "ADR x ADR"), usa "Time A/B"
  const sameNames = (draft.teamA.name || "") === (draft.teamB.name || "");
  const teamName = (side) => {
    const n = draft[teamKeyOf(side)].name;
    return !n || sameNames ? `Time ${side}` : n;
  };

  /* ---------- UI ---------- */
  const showToast = (msg, undo = null) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, undo });
    toastTimer.current = setTimeout(() => setToast(null), undo ? 5000 : 3200);
  };

  const goStep = (id) => {
    setStep(id);
    setShowClock(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  /* ---------- TIMES ---------- */
  const updateTeam = (side, patch) =>
    setDraft((prev) => {
      const key = teamKeyOf(side);
      return {
        ...prev,
        [key]: {
          ...prev[key],
          ...(typeof patch === "function" ? patch(prev[key]) : patch),
        },
      };
    });

  const togglePlayer = (side, id) => {
    const other = otherSide(side);
    const inOther =
      !isExternalSide(other) && draft[teamKeyOf(other)].players.includes(id);
    const adding = !draft[teamKeyOf(side)].players.includes(id);

    setDraft((prev) => {
      const key = teamKeyOf(side);
      const okey = teamKeyOf(other);
      const tm = prev[key];
      const has = tm.players.includes(id);
      const next = {
        ...prev,
        [key]: {
          ...tm,
          players: has
            ? tm.players.filter((p) => p !== id)
            : [...tm.players, id],
          goalkeeperId: has && tm.goalkeeperId === id ? null : tm.goalkeeperId,
          captainId: has && tm.captainId === id ? null : tm.captainId,
        },
      };
      // No treino, ninguém fica nos dois times: move automaticamente
      if (!has && inOther) {
        const ot = prev[okey];
        next[okey] = {
          ...ot,
          players: ot.players.filter((p) => p !== id),
          goalkeeperId: ot.goalkeeperId === id ? null : ot.goalkeeperId,
          captainId: ot.captainId === id ? null : ot.captainId,
        };
      }
      return next;
    });

    if (adding && inOther) {
      showToast(
        `${playersById[id]?.name || "Jogador"} saiu do Time ${other} e foi pro Time ${side}`,
      );
    }
  };

  const setStarterGK = (side, id) => {
    const tm = draft[teamKeyOf(side)];
    const changing = tm.goalkeeperId && tm.goalkeeperId !== id;
    if (
      changing &&
      events.length > 0 &&
      !window.confirm(
        "Isso troca o goleiro TITULAR (desde o início do jogo). Para troca durante a partida use 🧤 Troca de goleiro. Continuar?",
      )
    )
      return;
    updateTeam(side, (t) => ({
      goalkeeperId: t.goalkeeperId === id ? null : id,
    }));
  };

  const setCaptain = (side, id) =>
    updateTeam(side, (t) => ({ captainId: t.captainId === id ? null : id }));

  const handleLogoFile = async (side, file) => {
    try {
      updateTeam(side, { logo: await compressLogoImage(file, 160) });
    } catch (err) {
      console.error(err);
      showToast("Não foi possível carregar a imagem.");
    }
  };

  const applyPreset = (side, presetId) => {
    const p = teamPresets.find((x) => x.id === presetId);
    if (!p) return;
    updateTeam(side, {
      name: p.name,
      players: p.players || [],
      goalkeeperId: p.goalkeeperId || null,
      captainId: p.captainId || null,
      logo: p.logo || "",
    });
    showToast(`Preset "${p.name}" aplicado`);
  };

  const savePreset = async (side) => {
    const team = draft[teamKeyOf(side)];
    if (!team.players.length) return showToast("Selecione jogadores primeiro.");
    if (!team.name) return showToast("Dê um nome ao time para salvar.");
    try {
      await saveTeamPreset(team, draft.date, team.name);
      setTeamPresets(await loadTeamPresets(draft.date));
      showToast(`Preset "${team.name}" salvo`);
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar preset.");
    }
    return null;
  };

  const clearTeam = (side) => {
    if (!window.confirm("Limpar todos os jogadores deste time?")) return;
    updateTeam(side, { players: [], goalkeeperId: null, captainId: null });
  };

  const changeType = (type) => {
    setMatchType(type);
    if (type === "TREINO" || type === "EVENTO") {
      setDraft((prev) => ({ ...prev, teamB: { ...prev.teamB, name: "ADR" } }));
    }
  };

  const saveVenue = async (name) => {
    if (!venues.includes(name)) {
      setVenues((v) => [...v, name]);
      try {
        await addDoc(collection(db, "locais"), { name });
      } catch (err) {
        console.error(err);
        showToast("Erro ao salvar o local no banco.");
      }
    }
    setDraft((prev) => ({ ...prev, venue: name }));
    setModal(null);
  };

  const loadLastTrainingTeams = async () => {
    try {
      setLoadingLast(true);
      const snap = await getDocs(
        query(collection(db, "matches"), orderBy("order", "desc"), limit(10)),
      );
      const last = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .find((m) => m.type === "TREINO");
      if (!last) return showToast("Nenhum treino encontrado.");

      const pick = (t) => ({
        players: t?.players || [],
        goalkeeperId: t?.goalkeeperId || null,
        captainId: t?.captainId || null,
        logo: t?.logo || "",
        name: t?.name || "ADR",
      });
      setDraft((prev) => ({
        ...prev,
        venue: last.venue || prev.venue,
        teamA: { ...prev.teamA, ...pick(last.teamA) },
        teamB: { ...prev.teamB, ...pick(last.teamB) },
        events: [],
      }));
      showToast("Times do último treino carregados");
    } catch (err) {
      console.error(err);
      showToast("Erro ao carregar últimos times.");
    } finally {
      setLoadingLast(false);
    }
    return null;
  };

  /* ---------- LANCES ---------- */
  // pending: { kind: "play" | "sub" | "gk", side, ... }
  const buildEvents = (p, minuteValue) => {
    const base = { team: p.side, minute: minuteValue, matchType };
    if (p.kind === "gk") {
      return [
        {
          id: crypto.randomUUID(),
          ...base,
          type: "GK_CHANGE",
          playerInId: p.playerInId || null,
          externalName: p.externalName || null,
        },
      ];
    }
    if (p.kind === "sub") {
      const evs = [
        {
          id: crypto.randomUUID(),
          ...base,
          type: "SUB",
          playerOutId: p.playerOutId,
          playerInId: p.playerInId,
          reason: p.reason || "",
        },
      ];
      if (p.takesGoal) {
        evs.push({
          id: crypto.randomUUID(),
          ...base,
          type: "GK_CHANGE",
          playerInId: p.playerInId,
          externalName: null,
        });
      }
      return evs;
    }
    return [
      {
        id: crypto.randomUUID(),
        ...base,
        type: p.type,
        playerId: p.playerId,
        assistId: p.assistId || null,
        externalName: p.externalName || null,
        reason: p.reason || "",
      },
    ];
  };

  const commit = (pending, minuteValue) => {
    const evs = buildEvents(pending, minuteValue);
    setDraft((prev) => ({ ...prev, events: [...(prev.events || []), ...evs] }));
    const first = evs[0];
    const who = playerName(
      playersById,
      first.playerId || first.playerInId,
      first.externalName,
    );
    const ids = evs.map((e) => e.id);
    showToast(
      `${EVENT_META[first.type]?.icon || ""} ${EVENT_META[first.type]?.label || "Lance"} ${minuteValue} ${who}`.replace(
        /\s+/g,
        " ",
      ),
      () =>
        setDraft((prev) => ({
          ...prev,
          events: prev.events.filter((e) => !ids.includes(e.id)),
        })),
    );
  };

  const queue = (pending) => {
    if (autoMinuteActive) {
      commit(pending, `${minute}'`);
      setModal(null);
    } else {
      setModal({ type: "minute", pending });
    }
  };

  const removeEvent = (id) => {
    const index = events.findIndex((e) => e.id === id);
    if (index < 0) return;
    const ev = events[index];
    setDraft((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id),
    }));
    showToast("Lance removido", () =>
      setDraft((prev) => {
        const list = [...prev.events];
        list.splice(Math.min(index, list.length), 0, ev);
        return { ...prev, events: list };
      }),
    );
  };

  const saveEditedMinute = (id, value) => {
    setDraft((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === id ? { ...e, minute: value } : e,
      ),
    }));
    setModal(null);
  };

  // Lance rápido (aba Lances): escolhe time + tipo, depois o jogador
  const quickAction = (side, action) => {
    if (action === "SUB") return setModal({ type: "sub", side });
    if (action === "GK") return setModal({ type: "gk", side });
    return setModal({ type: "pick", side, action });
  };

  const onPicked = (side, action, playerId, externalName) => {
    if (externalName) {
      return queue({
        kind: "play",
        side,
        type: action,
        playerId: "EXTERNO",
        externalName,
      });
    }
    if (action === "GOAL")
      return setModal({ type: "assist", side, scorerId: playerId });
    return queue({ kind: "play", side, type: action, playerId });
  };

  /* ---------- PÊNALTIS ---------- */
  const addPenalty = (side, resultValue, playerId, externalName) =>
    setDraft((prev) => ({
      ...prev,
      penalties: {
        ...prev.penalties,
        [side]: [
          ...(prev.penalties?.[side] || []),
          {
            result: resultValue,
            playerId: playerId || null,
            externalName: externalName || "",
          },
        ],
      },
    }));

  const removePenalty = (side, index) =>
    setDraft((prev) => {
      const list = [...(prev.penalties?.[side] || [])];
      list.splice(index, 1);
      return { ...prev, penalties: { ...prev.penalties, [side]: list } };
    });

  /* ---------- RASCUNHO: RESTAURAR ---------- */
  const restoreDraft = () => {
    const s = pendingRestore;
    if (!s) return;
    setDraft({ ...emptyDraft(initialDate), ...s.draft });
    setMatchType(s.matchType || "TREINO");
    setEventType(s.eventType || "NATAL");
    setIsOfficial(s.isOfficial ?? true);
    setGenerateFoul(s.generateFoul ?? true);
    if (s.clock) setClock(s.clock);
    if (typeof s.autoMinute === "boolean") setAutoMinute(s.autoMinute);
    setPendingRestore(null);
    showToast("Rascunho restaurado");
  };

  const discardDraft = () => {
    clearSavedDraft();
    setPendingRestore(null);
  };

  /* ---------- CHECKLIST ---------- */
  const checklist = [
    {
      id: "where",
      label: "Data e local preenchidos",
      ok: !!draft.date && !!draft.venue,
      required: true,
      step: "setup",
    },
    matchType === "CAMPEONATO" && {
      id: "phase",
      label: "Fase do campeonato",
      ok: !!draft.championshipPhase,
      step: "setup",
    },
    {
      id: "playersA",
      label: `${teamName("A")} com jogadores`,
      ok: draft.teamA.players.length > 0,
      step: "A",
    },
    !externalMode && {
      id: "playersB",
      label: `${teamName("B")} com jogadores`,
      ok: draft.teamB.players.length > 0,
      step: "B",
    },
    {
      id: "gkA",
      label: `Goleiro de ${teamName("A")}`,
      ok: gkStats.A.length > 0,
      step: "A",
    },
    {
      id: "gkB",
      label: `Goleiro de ${teamName("B")}`,
      ok: gkStats.B.length > 0,
      step: "B",
    },
    {
      id: "winner",
      label: "Vencedor definido",
      ok: !!result.winner,
      required: true,
      step: "events",
    },
  ].filter(Boolean);

  /* ---------- SALVAR ---------- */
  const saveMatch = async () => {
    if (loading) return;

    const blocking = checklist.find((c) => c.required && !c.ok);
    if (blocking) {
      goStep(blocking.step);
      return showToast(`Falta: ${blocking.label}`);
    }
    const warnings = checklist.filter((c) => !c.required && !c.ok);
    if (
      warnings.length &&
      !window.confirm(
        `Atenção:\n• ${warnings.map((w) => w.label).join("\n• ")}\n\nSalvar mesmo assim?`,
      )
    ) {
      return goStep("finish");
    }

    setLoading(true);
    try {
      const pensData =
        isDraw && (pensA || pensB)
          ? {
              penaltiesScoreA: pensA,
              penaltiesScoreB: pensB,
              penaltiesWinner: pensA > pensB ? "A" : pensB > pensA ? "B" : null,
            }
          : {};

      const currentMatchData = {
        ...draft,
        ...pensData,
        actualParticipantsA: [...lineups.A.participants],
        actualParticipantsB: [...lineups.B.participants],
        events,
        goalsA,
        goalsB,
        winner: result.winner,
        type: matchType,
        eventType: matchType === "EVENTO" ? eventType : null,
        isOfficial,
        generateFoul,
        championshipPhase:
          matchType === "CAMPEONATO" ? draft.championshipPhase || "" : null,
        gkStats,
        updatedAt: serverTimestamp(),
      };
      delete currentMatchData.id;

      let savedId = matchToEdit?.id;

      if (savedId) {
        await updateDoc(doc(db, "matches", savedId), currentMatchData);
      } else {
        const matchesRef = collection(db, "matches");
        const snap = await getDocs(query(matchesRef, orderBy("order", "asc")));
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        all.push(currentMatchData);
        all.sort((a, b) =>
          a.date !== b.date
            ? new Date(a.date) - new Date(b.date)
            : (a.order || 999) - (b.order || 999),
        );

        const newDoc = await addDoc(matchesRef, {
          ...currentMatchData,
          createdAt: serverTimestamp(),
        });
        savedId = newDoc.id;
        all[all.findIndex((m) => m === currentMatchData)].id = newDoc.id;

        // Só reescreve a ordem de quem mudou
        const changed = all
          .map((m, i) => ({ id: m.id, order: i + 1, prev: m.order }))
          .filter((m) => m.prev !== m.order);
        for (let i = 0; i < changed.length; i += 400) {
          const batch = writeBatch(db);
          changed
            .slice(i, i + 400)
            .forEach((m) =>
              batch.update(doc(db, "matches", m.id), { order: m.order }),
            );
          await batch.commit();
        }
      }

      clearSavedDraft();
      setMatchToEdit?.(null);
      navigate(`/match/${savedId}`);
    } catch (e) {
      console.error(e);
      showToast(`Erro ao salvar: ${e.message}`);
    } finally {
      setLoading(false);
    }
    return null;
  };

  // Ctrl/Cmd + S
  const saveRef = useRef(saveMatch);
  saveRef.current = saveMatch;
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ---------- ACESSO ---------- */
  if (!isAdmin) {
    return (
      <div className="am-root am-denied">
        <h2>🚫 Acesso negado</h2>
      </div>
    );
  }

  /* ---------- RENDER ---------- */
  const stepBadge = (id) => {
    if (id === "A") return draft.teamA.players.length || null;
    if (id === "B")
      return externalMode ? null : draft.teamB.players.length || null;
    if (id === "events")
      return isDraw && events.length > 0 && !result.winner
        ? "!"
        : events.length || null;
    if (id === "finish")
      return checklist.some((c) => c.required && !c.ok) ? "!" : null;
    return null;
  };

  const renderTeam = (side) => {
    const other = otherSide(side);
    return (
      <TeamPanel
        side={side}
        team={draft[teamKeyOf(side)]}
        isExternal={isExternalSide(side)}
        lockName={externalMode && side === "A"}
        clubMode={clubMode}
        players={sortedPlayers}
        lineup={lineups[side]}
        otherTeamIds={
          isExternalSide(other)
            ? new Set()
            : new Set(draft[teamKeyOf(other)].players)
        }
        showHideTaken={!externalMode}
        stats={stats}
        currentGk={gkNow[side]}
        teamEvents={events.filter((e) => e.team === side)}
        teamPresets={teamPresets}
        onUpdateTeam={(patch) => updateTeam(side, patch)}
        onTogglePlayer={(id) => togglePlayer(side, id)}
        onSetGK={(id) => setStarterGK(side, id)}
        onSetCaptain={(id) => setCaptain(side, id)}
        onLogoFile={(f) => handleLogoFile(side, f)}
        onApplyPreset={(id) => applyPreset(side, id)}
        onSavePreset={() => savePreset(side)}
        onClearTeam={() => clearTeam(side)}
        onGoal={(id) => setModal({ type: "assist", side, scorerId: id })}
        onOwnGoal={(id) =>
          queue({ kind: "play", side, type: "OWN_GOAL", playerId: id })
        }
        onCard={(id, type, reason) =>
          queue({ kind: "play", side, type, playerId: id, reason })
        }
        onOpenSub={() => setModal({ type: "sub", side })}
        onOpenGk={() => setModal({ type: "gk", side })}
        onExternalEvent={(type, name, assist) =>
          queue({
            kind: "play",
            side,
            type,
            playerId: "EXTERNO",
            externalName: name,
            assistId: assist,
          })
        }
        onRemoveEvent={removeEvent}
      />
    );
  };

  const externalNames = (side) => [
    ...new Set(
      events
        .filter((e) => e.team === side && e.externalName)
        .map((e) => e.externalName),
    ),
  ];

  return (
    <div className="am-root">
      {pendingRestore && (
        <div className="am-restore">
          <div>
            <strong>Rascunho encontrado</strong>
            <span>
              {new Date(pendingRestore.savedAt).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
              {" · "}
              {pendingRestore.draft?.events?.length || 0} lances
            </span>
          </div>
          <div className="am-inline">
            <button
              type="button"
              className="am-btn am-btn-primary"
              onClick={restoreDraft}
            >
              Restaurar
            </button>
            <button
              type="button"
              className="am-btn am-btn-ghost"
              onClick={discardDraft}
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* ====== BARRA FIXA: PLACAR + RELÓGIO + ETAPAS ====== */}
      <div className="am-sticky">
        <div className="am-scorebar">
          <div className="am-sb-team">
            <img src={draft.teamA.logo || LogoADR} alt="" />
            <span>{teamName("A")}</span>
          </div>
          <div className="am-sb-score">
            <b>{goalsA}</b>
            <i>×</i>
            <b>{goalsB}</b>
            {isDraw && (pensA > 0 || pensB > 0) && (
              <small>
                pên. {pensA}–{pensB}
              </small>
            )}
          </div>
          <div className="am-sb-team am-sb-right">
            <span>{teamName("B")}</span>
            <img src={draft.teamB.logo || LogoADR} alt="" />
          </div>
          <button
            type="button"
            className={`am-clock-chip ${clock.running ? "running" : ""}`}
            onClick={() => setShowClock((v) => !v)}
            aria-expanded={showClock}
          >
            ⏱ {fmtClock(seconds)}
          </button>
        </div>

        {showClock && (
          <div className="am-clock-panel">
            <button
              type="button"
              className="am-btn am-btn-primary"
              onClick={() => {
                if (!clock.running) setShowClock(false);
                toggle();
              }}
            >
              {clock.running ? "⏸ Pausar" : "▶ Iniciar"}
            </button>
            <button type="button" className="am-btn" onClick={() => adjust(-1)}>
              −1'
            </button>
            <button type="button" className="am-btn" onClick={() => adjust(1)}>
              +1'
            </button>
            <button
              type="button"
              className="am-btn am-btn-ghost"
              onClick={reset}
            >
              Zerar
            </button>
            <label className="am-switch am-switch-inline">
              <input
                type="checkbox"
                checked={autoMinute}
                onChange={(e) => setAutoMinute(e.target.checked)}
              />
              <span>
                <b>Minuto automático</b>
              </span>
            </label>
            <p className="am-hint">
              Com o relógio rodando, os lances entram direto no minuto{" "}
              <b>{minute}'</b>, sem perguntar.
            </p>
          </div>
        )}

        <nav className="am-tabs" aria-label="Etapas">
          {STEPS.map((s) => {
            const badge = stepBadge(s.id);
            return (
              <button
                key={s.id}
                type="button"
                className={`am-tab ${step === s.id ? "is-active" : ""}`}
                onClick={() => goStep(s.id)}
              >
                <span className="am-tab-icon">{s.icon}</span>
                <span className="am-tab-label">
                  {s.id === "A" || s.id === "B" ? teamName(s.id) : s.label}
                </span>
                {badge !== null && (
                  <span
                    className={`am-tab-badge ${badge === "!" ? "warn" : ""}`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ====== ETAPA 1: JOGO ====== */}
      <section
        className={`am-step am-step-setup ${step === "setup" ? "is-active" : ""}`}
      >
        <MatchSetup
          matchType={matchType}
          onChangeType={changeType}
          draft={draft}
          setField={(k, v) => setDraft((prev) => ({ ...prev, [k]: v }))}
          venues={venues}
          onOpenVenue={() => setModal({ type: "venue" })}
          eventType={eventType}
          setEventType={setEventType}
          isOfficial={isOfficial}
          setIsOfficial={setIsOfficial}
          generateFoul={generateFoul}
          setGenerateFoul={setGenerateFoul}
          onLoadLast={loadLastTrainingTeams}
          loadingLast={loadingLast}
        />
      </section>

      {/* ====== ETAPAS 2 E 3: TIMES ====== */}
      <div className="am-teams">
        <section className={`am-step ${step === "A" ? "is-active" : ""}`}>
          {renderTeam("A")}
        </section>
        <section className={`am-step ${step === "B" ? "is-active" : ""}`}>
          {renderTeam("B")}
        </section>
      </div>

      {/* ====== ETAPA 4: LANCES ====== */}
      <section
        className={`am-step am-step-events ${step === "events" ? "is-active" : ""}`}
      >
        <div className="am-panel am-quick">
          <div className="am-panel-head">
            <span className="am-kicker">LANCE RÁPIDO</span>
            <h2>Registrar sem trocar de aba</h2>
          </div>
          <div className="am-quick-grid">
            {["A", "B"].map((side) => (
              <div key={side} className="am-quick-col">
                <h4>{teamName(side)}</h4>
                <button
                  type="button"
                  className="amp-act amp-goal am-quick-goal"
                  onClick={() => quickAction(side, "GOAL")}
                >
                  ⚽ Gol
                </button>
                <div className="am-quick-row">
                  <button
                    type="button"
                    className="amp-act amp-og"
                    onClick={() => quickAction(side, "OWN_GOAL")}
                  >
                    GC
                  </button>
                  <button
                    type="button"
                    className="amp-act amp-yellow"
                    onClick={() => quickAction(side, "YELLOW")}
                    aria-label="Amarelo"
                  >
                    🟨
                  </button>
                  <button
                    type="button"
                    className="amp-act amp-red"
                    onClick={() => quickAction(side, "RED")}
                    aria-label="Vermelho"
                  >
                    🟥
                  </button>
                </div>
                <div className="am-quick-row">
                  {!isExternalSide(side) && (
                    <button
                      type="button"
                      className="amp-act"
                      onClick={() => quickAction(side, "SUB")}
                    >
                      🔄 Sub
                    </button>
                  )}
                  <button
                    type="button"
                    className="amp-act"
                    onClick={() => quickAction(side, "GK")}
                  >
                    🧤 Goleiro
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!clock.running && (
            <p className="am-hint">
              Dica: inicie o ⏱ no placar e os lances já entram com o minuto
              certo.
            </p>
          )}
        </div>

        <MatchTimeline
          events={events}
          playersById={playersById}
          teamA={{ ...draft.teamA, name: teamName("A") }}
          teamB={{ ...draft.teamB, name: teamName("B") }}
          onReorder={(list) => setDraft((prev) => ({ ...prev, events: list }))}
          onEditMinute={(e) =>
            setModal({ type: "editMinute", id: e.id, initial: e.minute })
          }
          onRemove={removeEvent}
        />

        {isDraw && (
          <PenaltiesSection
            penalties={draft.penalties}
            teamA={{ ...draft.teamA, name: teamName("A") }}
            teamB={{ ...draft.teamB, name: teamName("B") }}
            playersById={playersById}
            candidates={{
              A: participantsOf("A"),
              B: isExternalSide("B") ? [] : participantsOf("B"),
            }}
            onAdd={addPenalty}
            onRemove={removePenalty}
          />
        )}
      </section>

      {/* ====== ETAPA 5: FIM ====== */}
      <section className={`am-step ${step === "finish" ? "is-active" : ""}`}>
        <FinishPanel
          teamA={{ ...draft.teamA, name: teamName("A") }}
          teamB={{ ...draft.teamB, name: teamName("B") }}
          goalsA={goalsA}
          goalsB={goalsB}
          pensA={pensA}
          pensB={pensB}
          result={result}
          goldenGoalWinner={draft.goldenGoalWinner}
          onGoldenGoal={(side) =>
            setDraft((prev) => ({ ...prev, goldenGoalWinner: side }))
          }
          gkStats={gkStats}
          playersById={playersById}
          checklist={checklist}
          onGoStep={goStep}
          eventsCount={events.length}
        />
      </section>

      {/* ====== MODAIS ====== */}
      {modal?.type === "venue" && (
        <VenueModal onSave={saveVenue} onClose={() => setModal(null)} />
      )}

      {modal?.type === "pick" && (
        <PickPlayerModal
          title={`${EVENT_META[modal.action]?.icon} ${EVENT_META[modal.action]?.label} · ${teamName(modal.side)}`}
          subtitle={
            isExternalSide(modal.side)
              ? "Digite ou toque num nome já usado"
              : "Toque em quem fez o lance"
          }
          external={isExternalSide(modal.side)}
          suggestions={externalNames(modal.side)}
          candidates={participantsOf(modal.side)}
          onPick={(id, ext) => onPicked(modal.side, modal.action, id, ext)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "assist" && (
        <AssistModal
          scorerName={playersById[modal.scorerId]?.name || ""}
          candidates={participantsOf(modal.side).filter(
            (p) => p.id !== modal.scorerId,
          )}
          onPick={(assistId) =>
            queue({
              kind: "play",
              side: modal.side,
              type: "GOAL",
              playerId: modal.scorerId,
              assistId,
            })
          }
          onClose={() => setModal(null)}
        />
      )}

      {(modal?.type === "sub" || modal?.type === "gk") && (
        <SubModal
          mode={modal.type}
          side={modal.side}
          teamName={teamName(modal.side)}
          onField={onFieldOf(modal.side)}
          bench={sortedPlayers.filter(
            (p) =>
              !lineups[modal.side].onField.has(p.id) &&
              (isExternalSide(otherSide(modal.side)) ||
                !lineups[otherSide(modal.side)].onField.has(p.id)),
          )}
          currentGkId={gkNow[modal.side]?.id || null}
          external={isExternalSide(modal.side)}
          onConfirm={(data) =>
            queue(
              modal.type === "gk"
                ? { kind: "gk", side: modal.side, ...data }
                : { kind: "sub", side: modal.side, ...data },
            )
          }
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "minute" && (
        <MinuteModal
          suggestion={seconds > 0 ? minute : null}
          onSave={(m) => {
            commit(modal.pending, m);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "editMinute" && (
        <MinuteModal
          title="⏱️ Editar minuto"
          initial={modal.initial}
          onSave={(m) => saveEditedMinute(modal.id, m)}
          onClose={() => setModal(null)}
        />
      )}

      {/* ====== TOAST ====== */}
      {toast && (
        <div className="am-toast" role="status">
          <span>{toast.msg}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo();
                setToast(null);
              }}
            >
              Desfazer
            </button>
          )}
        </div>
      )}

      {/* ====== BARRA INFERIOR ====== */}
      <div className="am-bottom">
        <button
          type="button"
          className="am-btn am-nav-btn"
          onClick={() => stepIndex > 0 && goStep(STEPS[stepIndex - 1].id)}
          disabled={stepIndex <= 0}
          aria-label="Etapa anterior"
        >
          ‹
        </button>
        <button
          type="button"
          className="am-btn am-nav-btn"
          onClick={() =>
            stepIndex < STEPS.length - 1 && goStep(STEPS[stepIndex + 1].id)
          }
          disabled={stepIndex >= STEPS.length - 1}
          aria-label="Próxima etapa"
        >
          ›
        </button>
        <button
          type="button"
          className="am-btn am-btn-primary am-save"
          onClick={saveMatch}
          disabled={loading}
          title="Ctrl + S"
        >
          {loading
            ? "SALVANDO..."
            : matchToEdit
              ? "ATUALIZAR PARTIDA"
              : "SALVAR PARTIDA"}
        </button>
      </div>
    </div>
  );
}

export default AdminMatches;
