import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import "./matchpage.css";
import "./friendlytabs.css";
import "./matchpage-extras.css";

import { calculateMatchStats } from "../../components/matchpages/matchUtils";
import { createEmptyFriendlyGame } from "../../components/matchpages/FriendlyGame/friendlyGamesUtils";
import { FORMATIONS_DATA } from "../../data/formationsConfig";

import MatchBanner from "../../components/matchpages/MatchBanner/MatchBanner";
import DualField from "../../components/matchpages/DualField/DualField";
import MatchStats from "../../components/matchpages/MatchStats/MatchStats";
import MatchTimeline from "../../components/matchpages/MatchTimeline/MatchTimeline";
import FriendlyGamesTabs from "../../components/matchpages/FriendlyGame/FriendlyGamesTabs";
import FriendlyGameField from "../../components/matchpages/FriendlyGame/FriendlyGameField";
import Footer from "../../components/Footer";

/* Ícones (SVG no lugar dos emojis) */
const BallIco = () => {
  // Bola clássica: branca com gomos pretos (id único para o recorte)
  const clip = `ball-${React.useId().replace(/:/g, "")}`;
  return (
    <svg className="mp-ico" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <circle cx="12" cy="12" r="9.1" />
        </clipPath>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="10.4"
        fill="#ffffff"
        stroke="#111111"
        strokeWidth="0.8"
      />
      <g clipPath={`url(#${clip})`} fill="#111111">
        <polygon points="12.00,8.60 15.23,10.95 14.00,14.75 10.00,14.75 8.77,10.95" />
        <polygon points="12.00,5.40 8.58,2.91 9.88,-1.11 14.12,-1.11 15.42,2.91" />
        <polygon points="18.28,9.96 19.58,5.94 23.82,5.94 25.12,9.96 21.70,12.45" />
        <polygon points="15.88,17.34 20.11,17.34 21.42,21.36 18.00,23.85 14.57,21.36" />
        <polygon points="8.12,17.34 9.43,21.36 6.00,23.85 2.58,21.36 3.89,17.34" />
        <polygon points="5.72,9.96 2.30,12.45 -1.12,9.96 0.18,5.94 4.42,5.94" />
      </g>
      <path
        d="M12.00 8.60L12.00 5.40 M15.23 10.95L18.28 9.96 M14.00 14.75L15.88 17.34 M10.00 14.75L8.12 17.34 M8.77 10.95L5.72 9.96"
        stroke="#111111"
        strokeWidth="0.7"
        fill="none"
      />
    </svg>
  );
};
const BootIco = () => (
  <svg
    className="mp-ico"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="currentColor"
  >
    <path d="M4.6 5.6h5.4l.9 3.8 6.4 2.3c2 .8 3.5 2.4 3.5 4.1v1.4H4.1c-.8 0-1.4-.6-1.4-1.4v-2.3c0-1.1.5-2 1.1-2.8z" />
    <path d="M5 18.4h2.2v1.8H5zM9.8 18.4H12v1.8H9.8zM14.6 18.4h2.2v1.8h-2.2z" />
  </svg>
);
const GloveIco = () => (
  <svg
    className="mp-ico"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="currentColor"
  >
    <path d="M8.2 3.4c.8 0 1.4.6 1.4 1.4v4.3h.6V3.6c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v5.5h.6V4.4c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v5.8h.6V6.6c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v7.2c0 3.3-2.7 6-6 6h-1.5c-2 0-3.8-1-4.9-2.6L4 12.6c-.5-.7-.3-1.6.4-2.1.6-.4 1.5-.3 2 .3l.4.5V4.8c0-.8.6-1.4 1.4-1.4z" />
  </svg>
);
const CloseIco = () => (
  <svg
    className="mp-ico"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/* Atalhos de teclado da página da partida */
const SHORTCUTS = [
  ["1", "Escalações"],
  ["2", "Estatísticas"],
  ["T", "Abrir / fechar a linha do tempo"],
  ["V", "Campo em 3D ou plano"],
  ["S", "Ver como o jogo terminou (vira as substituições)"],
  ["E", "Editar a partida (admin)"],
  ["←  →", "Partida anterior / próxima"],
  ["Esc", "Fechar avisos e janelas"],
  ["?", "Mostrar estes atalhos"],
];

const matchSortKey = (m) =>
  `${String(m.date || "").slice(0, 10)}|${String(m.order ?? 0).padStart(4, "0")}|${String(
    m.createdAt?.seconds ?? 0,
  ).padStart(12, "0")}`;

const readPref = (key, fallback) => {
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
};

const savePref = (key, value) => {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* sem armazenamento: só não lembra */
  }
};

function MatchPage({ matches, players, isAdmin, setMatchToEdit }) {
  const { id } = useParams();
  const match = matches.find((m) => String(m.id) === String(id));

  const [formA, setFormA] = useState(match?.formationA || "5_JOG_2-1-1");
  const [formB, setFormB] = useState(match?.formationB || "5_JOG_2-1-1");
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);

  const [prevDbFormA, setPrevDbFormA] = useState(match?.formationA);
  const [prevDbFormB, setPrevDbFormB] = useState(match?.formationB);

  const [showGoldenGoalInfo, setShowGoldenGoalInfo] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [mainTab, setMainTab] = useState("ESCALACOES");

  // Estado para controlar qual justificativa de cartão/lesão está aberta (Funciona 100% no Mobile e PC)
  const [activePopover, setActivePopover] = useState(null);

  // Fecha o tooltip ao tocar em qualquer lugar livre da tela
  useEffect(() => {
    const handleOutsideClick = () => setActivePopover(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  /* ---------- Visão 3D, virar substituições, ajuda ---------- */
  const navigate = useNavigate();
  const [is3D, setIs3D] = useState(() => readPref("mp-3d", true));
  const [flipAll, setFlipAll] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const toggle3D = () =>
    setIs3D((v) => {
      savePref("mp-3d", !v);
      return !v;
    });

  /* Editar a partida: abre o painel de partidas já com ela carregada */
  const editMatch = () => {
    const current = (matches || []).find((m) => String(m.id) === String(id));
    if (!current) return;
    if (setMatchToEdit) setMatchToEdit(current);
    // createdAt fica de fora: a data do Firebase não passa inteira pela navegação
    // eslint-disable-next-line no-unused-vars
    const { createdAt, ...forEdit } = current;
    navigate("/admin-matches", { state: { matchToEdit: forEdit } });
  };

  /* Partida anterior / próxima (mesma ordem do histórico) */
  const { prevMatch, nextMatch } = useMemo(() => {
    const list = [...(matches || [])].sort((a, b) =>
      matchSortKey(a).localeCompare(matchSortKey(b)),
    );
    const i = list.findIndex((m) => String(m.id) === String(id));
    return {
      prevMatch: i > 0 ? list[i - 1] : null,
      nextMatch: i >= 0 && i < list.length - 1 ? list[i + 1] : null,
    };
  }, [matches, id]);

  // Ao trocar de partida, volta para o começo e fecha tudo
  useEffect(() => {
    setFlipAll(false);
    setActivePopover(null);
    setSelectedGameIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  /* Atalhos de teclado */
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = String(e.target?.tagName || "").toLowerCase();
      if (
        ["input", "select", "textarea"].includes(tag) ||
        e.target?.isContentEditable
      )
        return;

      const k = e.key;
      if (k === "Escape") {
        setActivePopover(null);
        setShowHelp(false);
        return;
      }
      if (k === "?") {
        setShowHelp((v) => !v);
        return;
      }
      if (k === "1") setMainTab("ESCALACOES");
      else if (k === "2") setMainTab("ESTATISTICAS");
      else if (k === "t" || k === "T") setIsTimelineExpanded((v) => !v);
      else if (k === "v" || k === "V") toggle3D();
      else if (k === "s" || k === "S") {
        setMainTab("ESCALACOES");
        setFlipAll((v) => !v);
      } else if ((k === "e" || k === "E") && isAdmin) editMatch();
      else if (k === "ArrowLeft" && prevMatch)
        navigate(`/match/${prevMatch.id}`);
      else if (k === "ArrowRight" && nextMatch)
        navigate(`/match/${nextMatch.id}`);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevMatch, nextMatch, isAdmin, matches, id]);

  if (match && match.formationA !== prevDbFormA) {
    setPrevDbFormA(match.formationA);
    setFormA(match.formationA || "5_JOG_2-1-1");
  }

  if (match && match.formationB !== prevDbFormB) {
    setPrevDbFormB(match.formationB);
    setFormB(match.formationB || "5_JOG_2-1-1");
  }

  if (!match) return <div className="loading">Partida não encontrada...</div>;

  const isFriendly = match.type === "AMISTOSO" || match.type === "CAMPEONATO";
  const currentFriendlyGame = match.friendlyGames?.[selectedGameIndex] || {
    name: "JOGO 1",
    formation: "5_JOG_2-1-1",
    tactical: {},
  };

  const scoreA =
    match.events?.filter(
      (e) =>
        (e.type === "GOAL" && e.team === "A") ||
        (e.type === "OWN_GOAL" && e.team === "B"),
    ).length || 0;

  const scoreB =
    match.events?.filter(
      (e) =>
        (e.type === "GOAL" && e.team === "B") ||
        (e.type === "OWN_GOAL" && e.team === "A"),
    ).length || 0;

  const { stats, mvp } = calculateMatchStats(match, players);

  /* ------------------------------------------------------------------
     TROCA DE GOLEIRO (sem substituição): titular sai do gol e um
     jogador de linha assume. Vira o card igual à substituição.
     Se a troca foi feita por substituição, o flip de SUB já mostra.
     ------------------------------------------------------------------ */
  const getGkSwap = (teamKey) => {
    const teamData = teamKey === "B" ? match.teamB : match.teamA;
    const startGk = teamData?.goalkeeperId
      ? String(teamData.goalkeeperId)
      : null;
    const changes = (match.events || []).filter(
      (e) => e.type === "GK_CHANGE" && e.team === teamKey && e.playerInId,
    );
    if (!startGk || changes.length === 0) return null;

    const last = changes[changes.length - 1];
    const finalGk = String(last.playerInId);
    if (finalGk === startGk) return null;

    const subs = (match.events || []).filter(
      (e) => e.type === "SUB" && e.team === teamKey,
    );
    // Goleiro saiu numa substituição e quem entrou foi pro gol: já é o flip de SUB
    const viaSub = subs.some(
      (e) =>
        String(e.playerOutId) === startGk && String(e.playerInId) === finalGk,
    );
    if (viaSub) return null;

    return {
      startGk,
      finalGk,
      minute: last.minute || "",
      // o antigo goleiro continuou em campo (para virar o card do slot de linha)
      startGkStayed: !subs.some((e) => String(e.playerOutId) === startGk),
    };
  };

  const gkSwaps = { A: getGkSwap("A"), B: getGkSwap("B") };

  const getScorers = (teamKey) => {
    const goals =
      match.events?.filter(
        (e) =>
          (e.team === teamKey && e.type === "GOAL") ||
          (e.team !== teamKey && e.type === "OWN_GOAL"),
      ) || [];

    const scorersMap = {};
    goals.forEach((g) => {
      const pId = g.playerId;
      const pInfo = players.find((p) => String(p.id) === String(pId));

      let rawName = "Desconhecido";

      if (pInfo) {
        rawName = pInfo.name;
      } else if (g.externalName && g.externalName.trim() !== "") {
        rawName = g.externalName;
      } else if (g.playerName && g.playerName.trim() !== "") {
        rawName = g.playerName;
      } else if (pId && pId !== "EXTERNO" && isNaN(Number(pId))) {
        rawName = String(pId);
      }

      const name = rawName.split(" ")[0];
      const suffix = g.type === "OWN_GOAL" ? " (GC)" : "";
      const fullName = name + suffix;

      scorersMap[fullName] = (scorersMap[fullName] || 0) + 1;
    });

    return Object.entries(scorersMap).map(([name, count]) => (
      <span key={name} className="scorer-item">
        <BallIco /> {name} {count > 1 ? `(${count})` : ""}
      </span>
    ));
  };

  const handleAddFriendlyGame = async () => {
    try {
      const newGame = createEmptyFriendlyGame(
        (match.friendlyGames?.length || 0) + 1,
      );
      await updateDoc(doc(db, "matches", match.id), {
        friendlyGames: arrayUnion(newGame),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFriendlyGame = async (index) => {
    try {
      const updated = match.friendlyGames.filter((_, i) => i !== index);
      await updateDoc(doc(db, "matches", match.id), {
        friendlyGames: updated,
      });
      setSelectedGameIndex(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFriendlyFormationChange = async (formation) => {
    try {
      const updated = [...(match.friendlyGames || [])];
      if (!updated[selectedGameIndex]) {
        updated[selectedGameIndex] = {
          name: `JOGO ${selectedGameIndex + 1}`,
          formation: "5_JOG_2-1-1",
          tactical: {},
        };
      }
      updated[selectedGameIndex].formation = formation;
      await updateDoc(doc(db, "matches", match.id), {
        friendlyGames: updated,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEscalar = async (teamKey, slotId, pId) => {
    try {
      if (isFriendly) {
        const updated = [...(match.friendlyGames || [])];
        if (!updated[selectedGameIndex]) {
          updated[selectedGameIndex] = {
            name: `JOGO ${selectedGameIndex + 1}`,
            formation: "5_JOG_2-1-1",
            tactical: {},
          };
        }
        updated[selectedGameIndex] = {
          ...updated[selectedGameIndex],
          tactical: {
            ...(updated[selectedGameIndex].tactical || {}),
            [slotId]: pId,
          },
        };
        await updateDoc(doc(db, "matches", match.id), {
          friendlyGames: updated,
        });
        return;
      }
      const field =
        teamKey === "A" ? `tacticalA.${slotId}` : `tacticalB.${slotId}`;
      await updateDoc(doc(db, "matches", match.id), {
        [field]: pId,
      });
    } catch (err) {
      console.error("Erro ao escalar:", err);
    }
  };

  const getActiveSlots = (formKey) => {
    const formFut4 = FORMATIONS_DATA.FUT4?.[formKey];
    const formFut5 = FORMATIONS_DATA.FUT5?.[formKey];
    const formFut6 = FORMATIONS_DATA.FUT6?.[formKey];
    const formFut7 = FORMATIONS_DATA.FUT7?.[formKey];
    const formFut8 = FORMATIONS_DATA.FUT8?.[formKey];
    return (
      (formFut4 || formFut5 || formFut6 || formFut7 || formFut8)?.slots || []
    );
  };

  const getPlayerStats = (pId, role, teamKey) => {
    if (!pId) return null;
    const pObj = players.find((player) => String(player.id) === String(pId));
    if (!pObj) return null;

    const teamData = teamKey === "B" ? match.teamB : match.teamA;
    const isTeamGK = String(teamData?.goalkeeperId) === String(pId);
    const isCaptain = String(teamData?.captainId) === String(pId);

    const isMVP = mvp && String(pObj.id) === String(mvp.id);
    const pEvents =
      match.events?.filter((e) => String(e.playerId) === String(pId)) || [];
    const goals = pEvents.filter((e) => e.type === "GOAL").length;
    const assists =
      match.events?.filter(
        (e) => e.type === "GOAL" && String(e.assistId) === String(pId),
      ).length || 0;
    const ownGoals = pEvents.filter((e) => e.type === "OWN_GOAL").length;
    const yellowEvents = pEvents.filter(
      (e) => e.type === "YELLOW_CARD" || e.type === "YELLOW",
    );
    const yellowReasons = yellowEvents
      .map((e) =>
        e.minute ? `${e.minute}' - ${e.reason || "Cartão Amarelo"}` : e.reason,
      )
      .filter(Boolean)
      .join(" • ");
    const redEvents = pEvents.filter(
      (e) => e.type === "RED_CARD" || e.type === "RED",
    );
    const redReasons = redEvents
      .map((e) =>
        e.minute ? `${e.minute}' - ${e.reason || "Cartão Vermelho"}` : e.reason,
      )
      .filter(Boolean)
      .join(" • ");

    return {
      pObj,
      isMVP,
      isTeamGK,
      isCaptain,
      goals,
      assists,
      ownGoals,
      yellowEvents,
      yellowReasons,
      redEvents,
      redReasons,
      role,
    };
  };

  // Alterna o popover de justificativa sem girar o card ou perder o clique no mobile
  const toggleBadgeInfo = (e, popKey, infoData) => {
    e.stopPropagation();
    e.preventDefault();
    setActivePopover((prev) =>
      prev?.key === popKey ? null : { key: popKey, ...infoData },
    );
  };

  // gkMode: "gk-out" | "gk-in" (slot do gol) · "field-out" | "field-in" (slot de linha)
  const GK_SWAP_TITLES = {
    "gk-out": "Saiu do gol",
    "gk-in": "Assumiu o gol",
    "field-out": "Foi para o gol",
    "field-in": "Saiu do gol e foi para a linha",
  };

  const renderPlayerUI = (
    stats,
    subType,
    subReason,
    slotUniqueKey = "",
    gkMode = null,
  ) => {
    if (!stats) return null;
    const {
      pObj,
      isMVP,
      isTeamGK,
      isCaptain,
      goals,
      assists,
      ownGoals,
      yellowEvents,
      yellowReasons,
      redEvents,
      redReasons,
      role,
    } = stats;

    // Luva: no slot do gol sempre; no slot de linha da troca nunca
    const showGlove =
      gkMode === "gk-out" || gkMode === "gk-in"
        ? true
        : gkMode === "field-out" || gkMode === "field-in"
          ? false
          : role === "GK" || isTeamGK;

    const isInjured =
      subType === "out" &&
      subReason &&
      subReason.toLowerCase().includes("lesão");

    const yellowKey = `${slotUniqueKey}_${pObj.id}_Y`;
    const redKey = `${slotUniqueKey}_${pObj.id}_R`;
    const injuryKey = `${slotUniqueKey}_${pObj.id}_INJ`;

    const isYellowOpen = activePopover?.key === yellowKey;
    const isRedOpen = activePopover?.key === redKey;
    const isInjuryOpen = activePopover?.key === injuryKey;

    return (
      <div
        className={`player-tactical ${isMVP ? "is-mvp" : ""} ${
          subType === "out" ? "is-sub-out" : ""
        }`}
      >
        {/* ==================== COLUNA DIREITA: ESTATÍSTICAS E CARTÕES ==================== */}
        <div className="player-badges-right">
          {goals > 0 && (
            <div className="pro-badge badge-goal" title={`${goals} Gol(s)`}>
              <span className="pro-badge-icon">
                <BallIco />
              </span>
              {goals > 1 && <span className="pro-badge-count">{goals}</span>}
            </div>
          )}

          {assists > 0 && (
            <div
              className="pro-badge badge-assist"
              title={`${assists} Assistência(s)`}
            >
              <span className="pro-badge-icon">
                <BootIco />
              </span>
              {assists > 1 && (
                <span className="pro-badge-count">{assists}</span>
              )}
            </div>
          )}

          {yellowEvents.length > 0 && (
            <button
              type="button"
              className={`pro-card-badge card-yellow ${
                isYellowOpen ? "is-open" : ""
              }`}
              onClick={(e) =>
                toggleBadgeInfo(e, yellowKey, {
                  playerName: pObj.name,
                  typeLabel: "CARTÃO AMARELO",
                  typeClass: "yellow",
                  text: yellowReasons || "Advertência disciplinar na partida",
                })
              }
            >
              <span className="card-3d-rect yellow-rect">
                {yellowEvents.length > 1 && (
                  <small className="card-multi-num">
                    {yellowEvents.length}
                  </small>
                )}
              </span>

              <span className={`pro-tooltip ${isYellowOpen ? "visible" : ""}`}>
                <strong className="pro-tooltip-head yellow">
                  CARTÃO AMARELO
                </strong>
                <span>{yellowReasons || "Motivo não especificado"}</span>
              </span>
            </button>
          )}

          {redEvents.length > 0 && (
            <button
              type="button"
              className={`pro-card-badge card-red ${
                isRedOpen ? "is-open" : ""
              }`}
              onClick={(e) =>
                toggleBadgeInfo(e, redKey, {
                  playerName: pObj.name,
                  typeLabel: "CARTÃO VERMELHO",
                  typeClass: "red",
                  text: redReasons || "Expulsão direta na partida",
                })
              }
            >
              <span className="card-3d-rect red-rect">
                {redEvents.length > 1 && (
                  <small className="card-multi-num">{redEvents.length}</small>
                )}
              </span>

              <span className={`pro-tooltip ${isRedOpen ? "visible" : ""}`}>
                <strong className="pro-tooltip-head red">
                  CARTÃO VERMELHO
                </strong>
                <span>{redReasons || "Motivo não especificado"}</span>
              </span>
            </button>
          )}

          {ownGoals > 0 && (
            <div className="pro-badge badge-og" title="Gol Contra">
              <span>GC</span>
              {ownGoals > 1 && (
                <span className="pro-badge-count">{ownGoals}</span>
              )}
            </div>
          )}
        </div>

        {/* ==================== COLUNA ESQUERDA: CAPITÃO, GOLEIRO, SUB E LESÃO ==================== */}
        <div className="player-badges-left">
          {/* BRAÇADEIRA DE CAPITÃO CADASTRADO NO BANCO */}
          {isCaptain && (
            <div className="pro-role-badge captain" title="Capitão da Equipe">
              C
            </div>
          )}

          {/* LUVA DE GOLEIRO (Mostra se for o Goleiro do banco OU estiver no slot GK) */}
          {showGlove && (
            <div className="pro-role-badge gk" title="Goleiro da Equipe">
              <GloveIco />
            </div>
          )}
          {subType === "out" && (
            <div
              className={`pro-sub-badge sub-out ${gkMode ? "is-gk-swap" : ""}`}
              title={GK_SWAP_TITLES[gkMode] || "Substituído (Saiu)"}
            >
              <img src="/setaVerm.png" alt="Saiu" />
            </div>
          )}

          {subType === "in" && (
            <div
              className={`pro-sub-badge sub-in ${gkMode ? "is-gk-swap" : ""}`}
              title={GK_SWAP_TITLES[gkMode] || "Entrou em campo"}
            >
              <img src="/setaVerd.png" alt="Entrou" />
            </div>
          )}

          {isInjured && (
            <button
              type="button"
              className={`pro-card-badge badge-injury ${
                isInjuryOpen ? "is-open" : ""
              }`}
              onClick={(e) =>
                toggleBadgeInfo(e, injuryKey, {
                  playerName: pObj.name,
                  typeLabel: "SUBSTITUIÇÃO POR LESÃO",
                  typeClass: "injury",
                  text: subReason || "Atleta substituído por lesão",
                })
              }
            >
              <img src="/lesao.png" alt="Lesão" className="injury-icon-img" />
              <span className={`pro-tooltip ${isInjuryOpen ? "visible" : ""}`}>
                <strong className="pro-tooltip-head injury">LESÃO</strong>
                <span>{subReason || "Saiu por lesão"}</span>
              </span>
            </button>
          )}
        </div>

        {/* FOTO E PLACA DE NOME DO ATLETA */}
        <img
          src={pObj.photo || "/players/default.png"}
          className="player-img"
          alt={pObj.name}
          style={
            subType === "out" ? { filter: "grayscale(45%) opacity(0.82)" } : {}
          }
        />

        <div className="player-card-label">
          <span className="p-card-num">{pObj.number || "0"}</span>
          <span className="p-card-name">{pObj.name.split(" ")[0]}</span>
        </div>
      </div>
    );
  };

  const renderSlot = (slot, teamKey, teamPlayersIds) => {
    const teamData = teamKey === "B" ? match.teamB : match.teamA;
    const savedGkId = teamData?.goalkeeperId;
    const savedCapId = teamData?.captainId;

    const occupantId = isFriendly
      ? currentFriendlyGame?.tactical?.[slot.id]
      : teamKey === "A"
        ? match.tacticalA?.[slot.id]
        : match.tacticalB?.[slot.id];

    const subEvent = match.events
      ?.slice()
      .reverse()
      .find(
        (e) =>
          e.type === "SUB" &&
          e.team === teamKey &&
          (String(e.playerInId) === String(occupantId) ||
            String(e.playerOutId) === String(occupantId)),
      );

    const outStats = subEvent
      ? getPlayerStats(subEvent.playerOutId, slot.role, teamKey)
      : null;
    const inStats = subEvent
      ? getPlayerStats(subEvent.playerInId, slot.role, teamKey)
      : getPlayerStats(occupantId, slot.role, teamKey);

    const slotUniqueKey = `${teamKey}_${slot.id}`;

    // Troca de goleiro: só quando o slot não tem substituição própria
    const swap = gkSwaps[teamKey];
    let gkFlip = null;
    if (!subEvent && swap && occupantId) {
      const occ = String(occupantId);
      const roleUp = String(slot.role || "").toUpperCase();
      const isGoalRole = ["GK", "GOL", "GOLEIRO", "G", "GL"].includes(roleUp);
      // Slot do gol = onde o goleiro titular está escalado (ou slot marcado como goleiro)
      const isGoalSlot =
        occ === swap.startGk || (occ === swap.finalGk && isGoalRole);

      if (isGoalSlot) {
        // Slot do gol: titular (frente) -> quem assumiu (verso)
        gkFlip = {
          front: getPlayerStats(swap.startGk, slot.role, teamKey),
          back: getPlayerStats(swap.finalGk, slot.role, teamKey),
          frontMode: "gk-out",
          backMode: "gk-in",
        };
      } else if (occ === swap.finalGk && swap.startGkStayed) {
        // Slot de linha: quem foi pro gol (frente) -> antigo goleiro na linha (verso)
        gkFlip = {
          front: getPlayerStats(swap.finalGk, slot.role, teamKey),
          back: getPlayerStats(swap.startGk, slot.role, teamKey),
          frontMode: "field-out",
          backMode: "field-in",
        };
      }
      if (gkFlip && (!gkFlip.front || !gkFlip.back)) gkFlip = null;
    }

    const hasOpenPopoverInSlot =
      activePopover && activePopover.key.startsWith(slotUniqueKey);

    // Se for o slot de Goleiro (GK), coloca o goleiro salvo no banco no topo da lista!
    const sortedOptionIds = [...(teamPlayersIds || [])].sort((a, b) => {
      if (slot.role === "GK") {
        if (String(a) === String(savedGkId)) return -1;
        if (String(b) === String(savedGkId)) return 1;
      }
      return 0;
    });

    return (
      <div
        key={slot.id}
        className={`tactical-slot ${slot.className || ""} ${
          hasOpenPopoverInSlot ? "slot-popover-active" : ""
        }`}
        style={{ left: slot.x, top: slot.y, ...(slot.style || {}) }}
      >
        {gkFlip ? (
          <div
            className="sub-flip-container gk-swap-flip"
            tabIndex="0"
            title={
              swap?.minute
                ? `Troca de goleiro aos ${swap.minute}`
                : "Troca de goleiro"
            }
          >
            <div className="sub-flip-inner">
              <div className="sub-flip-front">
                {renderPlayerUI(
                  gkFlip.front,
                  "out",
                  null,
                  `${slotUniqueKey}_GKOUT`,
                  gkFlip.frontMode,
                )}
              </div>
              <div className="sub-flip-back">
                {renderPlayerUI(
                  gkFlip.back,
                  "in",
                  null,
                  `${slotUniqueKey}_GKIN`,
                  gkFlip.backMode,
                )}
              </div>
            </div>
          </div>
        ) : outStats && inStats ? (
          <div className="sub-flip-container" tabIndex="0">
            <div className="sub-flip-inner">
              <div className="sub-flip-front">
                {renderPlayerUI(
                  outStats,
                  "out",
                  subEvent.reason,
                  `${slotUniqueKey}_OUT`,
                )}
              </div>
              <div className="sub-flip-back">
                {renderPlayerUI(inStats, "in", null, `${slotUniqueKey}_IN`)}
              </div>
            </div>
          </div>
        ) : inStats ? (
          renderPlayerUI(inStats, null, null, slotUniqueKey)
        ) : (
          <div
            className={`empty-slot-marker ${
              slot.role === "GK" ? "is-gk-slot" : ""
            }`}
          >
            {slot.role === "GK" ? <GloveIco /> : "?"}
          </div>
        )}

        {isAdmin && (
          <select
            className="slot-selector"
            value={occupantId || ""}
            onChange={(e) => handleEscalar(teamKey, slot.id, e.target.value)}
          >
            <option value="">
              {slot.role === "GK" ? "Escalar goleiro..." : "Escalar..."}
            </option>
            {sortedOptionIds.map((pId) => {
              const playerInfo = players.find(
                (pl) => String(pl.id) === String(pId),
              );
              const isThisGK = String(pId) === String(savedGkId);
              const isThisCap = String(pId) === String(savedCapId);

              const prefixBadges = "";

              const suffixTags = [
                isThisGK ? "[GOL]" : "",
                isThisCap ? "[CAP]" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <option key={pId} value={pId}>
                  {prefixBadges ? `${prefixBadges} ` : ""}
                  {playerInfo ? playerInfo.name : "Carregando..."}
                  {suffixTags ? ` ${suffixTags}` : ""}
                </option>
              );
            })}
          </select>
        )}
      </div>
    );
  };

  const renderPenalties = (teamPenalties) => {
    if (!teamPenalties || !Array.isArray(teamPenalties)) return null;
    return teamPenalties.map((p, index) => {
      const status = p?.result || p;
      const isGoal =
        status === "goal" || status === "scored" || status === "green";
      const isMiss = status === "miss" || status === "red" || status === "lost";
      return (
        <span
          key={index}
          className={`penalty-dot ${
            isGoal ? "bg-green-500" : isMiss ? "bg-red-500" : "bg-gray-300"
          }`}
          style={{
            display: "inline-block",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            margin: "0 2px",
            backgroundColor: isGoal ? "#28a745" : isMiss ? "#dc3545" : "#ccc",
          }}
        ></span>
      );
    });
  };

  const hasPenalties =
    match.penalties?.A?.length > 0 || match.penalties?.B?.length > 0;
  const teamsToRender = [
    { k: "A", f: formA, n: match.teamA.name, p: match.teamA.players },
    { k: "B", f: formB, n: match.teamB.name, p: match.teamB.players },
  ];

  return (
    <div
      className={`match-view-wrapper ${flipAll ? "flip-all" : ""}`}
      id="capture-area"
    >
      {showHelp && (
        <div className="mp-help-overlay" onClick={() => setShowHelp(false)}>
          <div
            className="mp-help"
            role="dialog"
            aria-label="Atalhos de teclado"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <span>Atalhos de teclado</span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Fechar"
              >
                <CloseIco />
              </button>
            </header>
            <ul>
              {SHORTCUTS.map(([key, label]) => (
                <li key={key}>
                  <kbd>{key}</kbd>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 1. Componente Extraído do Banner */}
      <MatchBanner
        match={match}
        scoreA={scoreA}
        scoreB={scoreB}
        getScorers={getScorers}
        hasPenalties={hasPenalties}
        renderPenalties={renderPenalties}
        showGoldenGoalInfo={showGoldenGoalInfo}
        setShowGoldenGoalInfo={setShowGoldenGoalInfo}
        isTimelineExpanded={isTimelineExpanded}
        setIsTimelineExpanded={setIsTimelineExpanded}
      />

      {/* 2. Timeline Condicional */}
      {isTimelineExpanded && (
        <div className="psg-timeline-dropdown">
          <MatchTimeline
            players={players}
            events={match.events || []}
            match={match}
          />
        </div>
      )}

      {/* NAVEGAÇÃO ENTRE PARTIDAS + ATALHOS */}
      <nav className="mp-nav" aria-label="Navegar entre partidas">
        {prevMatch ? (
          <Link
            to={`/match/${prevMatch.id}`}
            className="mp-nav-btn prev"
            title="Partida anterior (←)"
          >
            <span className="mp-nav-arrow" aria-hidden="true">
              ‹
            </span>
            <span className="mp-nav-text">
              <small>Anterior</small>
              <b>
                {String(prevMatch.date || "")
                  .slice(0, 10)
                  .split("-")
                  .reverse()
                  .join("/")}
              </b>
            </span>
          </Link>
        ) : (
          <span className="mp-nav-btn is-off" />
        )}

        <div className="mp-nav-mid">
          <button
            type="button"
            className={`mp-chip ${flipAll ? "on" : ""}`}
            onClick={() => {
              setMainTab("ESCALACOES");
              setFlipAll((v) => !v);
            }}
            title="Vira os cards de substituição (S)"
          >
            {flipAll ? "Escalação inicial" : "Como terminou"}
          </button>
          {isAdmin && (
            <button
              type="button"
              className="mp-chip mp-edit"
              onClick={editMatch}
              title="Editar partida (E)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="mp-ico">
                <path
                  d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              Editar partida
            </button>
          )}
          <button
            type="button"
            className="mp-chip mp-keys"
            onClick={() => setShowHelp(true)}
            title="Atalhos de teclado (?)"
          >
            Atalhos
          </button>
        </div>

        {nextMatch ? (
          <Link
            to={`/match/${nextMatch.id}`}
            className="mp-nav-btn next"
            title="Próxima partida (→)"
          >
            <span className="mp-nav-text">
              <small>Próxima</small>
              <b>
                {String(nextMatch.date || "")
                  .slice(0, 10)
                  .split("-")
                  .reverse()
                  .join("/")}
              </b>
            </span>
            <span className="mp-nav-arrow" aria-hidden="true">
              ›
            </span>
          </Link>
        ) : (
          <span className="mp-nav-btn is-off" />
        )}
      </nav>

      {/* 3. Menu de Abas */}
      <div className="psg-tabs-menu">
        <button
          className={mainTab === "ESCALACOES" ? "active" : ""}
          onClick={() => setMainTab("ESCALACOES")}
        >
          ESCALAÇÕES DAS EQUIPES
        </button>
        <button
          className={mainTab === "ESTATISTICAS" ? "active" : ""}
          onClick={() => setMainTab("ESTATISTICAS")}
        >
          ESTATÍSTICAS DA PARTIDA
        </button>
      </div>

      {/* 4. Conteúdo das Abas */}
      <div className="psg-tab-content">
        {mainTab === "ESTATISTICAS" && (
          <MatchStats
            match={match}
            teamStats={stats}
            teamAName={match.teamA.name}
            teamBName={match.teamB.name}
            players={players}
            matches={matches}
          />
        )}

        {mainTab === "ESCALACOES" && (
          <>
            {isFriendly && (
              <FriendlyGamesTabs
                games={match.friendlyGames || []}
                selectedGameIndex={selectedGameIndex}
                setSelectedGameIndex={setSelectedGameIndex}
                isAdmin={isAdmin}
                onAddGame={handleAddFriendlyGame}
                onRemoveGame={handleRemoveFriendlyGame}
              />
            )}

            {isFriendly ? (
              <FriendlyGameField
                game={currentFriendlyGame}
                players={players}
                match={match}
                renderSlot={renderSlot}
                isAdmin={isAdmin}
                onFormationChange={handleFriendlyFormationChange}
                is3D={is3D}
                onToggle3D={toggle3D}
              />
            ) : (
              <DualField
                match={match}
                teamsToRender={teamsToRender}
                isAdmin={isAdmin}
                formA={formA}
                setFormA={setFormA}
                formB={formB}
                setFormB={setFormB}
                getActiveSlots={getActiveSlots}
                renderSlot={renderSlot}
                players={players}
                is3D={is3D}
                onToggle3D={toggle3D}
              />
            )}
          </>
        )}
      </div>

      {/* BARRA FLUTUANTE DE JUSTIFICATIVA NO MOBILE (Nunca corta na tela do celular!) */}
      {activePopover && (
        <div
          className={`mobile-card-reason-toast type-${activePopover.typeClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="toast-left-indicator" />
          <div className="toast-body">
            <span className="toast-kicker">
              {activePopover.typeLabel} • {activePopover.playerName}
            </span>
            <p className="toast-reason-text">{activePopover.text}</p>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setActivePopover(null)}
          >
            <CloseIco />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default MatchPage;
