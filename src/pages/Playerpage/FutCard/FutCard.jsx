import React, { forwardRef } from "react";
import { getShirtNumber } from "../../../utils/Shirtnumber";
import LogoADR from "../../../assets/logo.png";
import LogoIDR from "../../../assets/IDR.png";
import "./futcard.css";

/* Habilidades na ordem do site (mesmas chaves do admin do jogador) */
export const CARD_SKILLS = [
  { key: "velocidade", label: "VEL" },
  { key: "chute", label: "CHU" },
  { key: "passe", label: "PAS" },
  { key: "mira", label: "MIR" },
  { key: "defesa", label: "DEF" },
  { key: "corpo", label: "COR" },
];

export const playerOvr = (player) => {
  const vals = CARD_SKILLS.map((s) => Number(player?.skills?.[s.key]) || 0);
  const filled = vals.filter((v) => v > 0);
  if (filled.length === 0) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / CARD_SKILLS.length);
};

/* Nível do card pelo OVR */
export const cardTier = (ovr) => {
  if (ovr >= 85) return { id: "icon", label: "ÍCONE" };
  if (ovr >= 75) return { id: "gold", label: "OURO" };
  if (ovr >= 65) return { id: "silver", label: "PRATA" };
  return { id: "bronze", label: "BRONZE" };
};

/* Posição: usa o campo do jogador se existir; goleiro detectado pelas partidas */
const resolvePosition = (player, gkShare) =>
  player?.position ||
  player?.posicao ||
  player?.mainPosition ||
  (gkShare >= 0.5 ? "GOL" : "");

/* ---------- PAÍS ---------- */
/* Aceita "BR", "br", "Brasil", "Brazil", "Brasileiro"... e devolve o código ISO */
const COUNTRY_CODES = {
  brasil: "br",
  brazil: "br",
  brasileiro: "br",
  brasileira: "br",
  portugal: "pt",
  portugues: "pt",
  argentina: "ar",
  argentino: "ar",
  uruguai: "uy",
  uruguay: "uy",
  paraguai: "py",
  paraguay: "py",
  chile: "cl",
  bolivia: "bo",
  peru: "pe",
  colombia: "co",
  venezuela: "ve",
  equador: "ec",
  ecuador: "ec",
  mexico: "mx",
  "estados unidos": "us",
  eua: "us",
  usa: "us",
  canada: "ca",
  haiti: "ht",
  cuba: "cu",
  angola: "ao",
  mocambique: "mz",
  "cabo verde": "cv",
  nigeria: "ng",
  senegal: "sn",
  espanha: "es",
  spain: "es",
  italia: "it",
  italy: "it",
  franca: "fr",
  france: "fr",
  alemanha: "de",
  germany: "de",
  inglaterra: "gb-eng",
  england: "gb-eng",
  "reino unido": "gb",
  holanda: "nl",
  "paises baixos": "nl",
  belgica: "be",
  suica: "ch",
  japao: "jp",
  japan: "jp",
  china: "cn",
  coreia: "kr",
  "coreia do sul": "kr",
  india: "in",
  libano: "lb",
  siria: "sy",
  israel: "il",
};

const normalize = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

export const countryCode = (player) => {
  const raw =
    player?.country ??
    player?.pais ??
    player?.nacionalidade ??
    player?.nationality;
  if (!raw) return null;
  const n = normalize(raw);
  if (/^[a-z]{2}$/.test(n)) return n;
  return COUNTRY_CODES[n] || null;
};

/* Brasil desenhado aqui mesmo: sai perfeito na imagem exportada e não depende de internet */
const FlagBR = () => (
  <svg className="fc-flag-svg" viewBox="0 0 30 20" aria-hidden="true">
    <rect width="30" height="20" fill="#009c3b" />
    <path d="M15 2.4 27.2 10 15 17.6 2.8 10z" fill="#ffdf00" />
    <circle cx="15" cy="10" r="4.6" fill="#002776" />
    <path
      d="M10.5 9.1c3-.6 6.3-.2 9 1.2"
      stroke="#fff"
      strokeWidth="0.9"
      fill="none"
    />
  </svg>
);

const Flag = ({ code }) => {
  if (!code) return null;
  return (
    <span className="fc-flag" title={code.toUpperCase()}>
      {code === "br" ? (
        <FlagBR />
      ) : (
        <img
          className="fc-flag-img"
          src={`https://flagcdn.com/w80/${code}.png`}
          crossOrigin="anonymous"
          alt=""
        />
      )}
    </span>
  );
};

/* ---------- TÍTULOS ---------- */
/* Usa a prop `titles`; senão player.titles / player.titulos (número ou lista);
   senão o número de conquistas cadastradas */
export const titlesCount = (player, titles) => {
  if (titles !== undefined && titles !== null) return Number(titles) || 0;
  const t = player?.titles ?? player?.titulos;
  if (Array.isArray(t)) return t.length;
  if (t !== undefined && t !== null && t !== "") return Number(t) || 0;
  return Array.isArray(player?.achievements) ? player.achievements.length : 0;
};

const TrophyIcon = () => (
  <svg className="fc-trophy-svg" viewBox="0 0 24 24" aria-hidden="true">
    {/* alças */}
    <path
      d="M7 5H3.6v1.6A4.4 4.4 0 0 0 8 11M17 5h3.4v1.6A4.4 4.4 0 0 1 16 11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* taça */}
    <path d="M6.5 3h11v5.2a5.5 5.5 0 0 1-11 0z" fill="currentColor" />
    {/* brilho */}
    <path
      d="M9 5v3.2a3 3 0 0 0 1.4 2.5"
      fill="none"
      stroke="rgba(255,255,255,.45)"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
    {/* haste e base */}
    <path d="M10.8 13.4h2.4v3.4h-2.4z" fill="currentColor" />
    <path d="M8 17.6h8l.9 3.4H7.1z" fill="currentColor" />
  </svg>
);

/**
 * Card do jogador no estilo "carta de game".
 * props: player, mode ("adr" | "idr"), season, stats ({games, goals, assists}),
 *        gkShare (0-1), titles (número de títulos, opcional)
 */
const FutCard = forwardRef(function FutCard(
  { player, mode = "adr", season, stats, gkShare = 0, titles, className = "" },
  ref,
) {
  if (!player) return null;

  const ovr = playerOvr(player);
  const tier = cardTier(ovr);
  const isIdr = mode === "idr";
  const photo =
    (isIdr ? player.photoIDR1 || player.photo : player.photo) ||
    "/players/default.png";
  const shirt = getShirtNumber(player, mode, "");
  const position = resolvePosition(player, gkShare);
  const name = player.nickname || String(player.name || "").split(" ")[0];
  const flag = countryCode(player);
  const trophies = titlesCount(player, titles);

  return (
    <div
      ref={ref}
      className={`fc-card tier-${tier.id} ${isIdr ? "is-idr" : ""} ${className}`}
      aria-label={`Card de ${player.name}: OVR ${ovr}`}
    >
      <div className="fc-frame" />
      <div className="fc-shine" />

      {/* TOPO: OVR, posição, número, país, escudo, títulos */}
      <div className="fc-top">
        <div className="fc-rating">
          <span className="fc-ovr">{ovr || "—"}</span>
          {position && <span className="fc-pos">{position}</span>}
          {shirt !== "" && <span className="fc-shirt">#{shirt}</span>}

          <span className="fc-divider" />

          <Flag code={flag} />

          <span className="fc-club-badge">
            <img className="fc-club" src={isIdr ? LogoIDR : LogoADR} alt="" />
          </span>

          <span className="fc-trophies" title={`${trophies} títulos`}>
            <TrophyIcon />
            <b>{trophies}</b>
          </span>
        </div>

        <div className="fc-photo-wrap">
          <img className="fc-photo" src={photo} alt="" />
          <div className="fc-photo-fade" />
        </div>
      </div>

      {/* NOME */}
      <div className="fc-name-band">
        <span className="fc-name">{name}</span>
      </div>

      {/* HABILIDADES */}
      <div className="fc-skills">
        {CARD_SKILLS.map((s) => (
          <div key={s.key} className="fc-skill">
            <b>{Number(player.skills?.[s.key]) || "—"}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* RODAPÉ: temporada */}
      <div className="fc-foot">
        <span className="fc-tier">{tier.label}</span>
        {stats ? (
          <span className="fc-season">
            {season} · {stats.games}J · {stats.goals}G · {stats.assists}A
          </span>
        ) : (
          <span className="fc-season">{isIdr ? "IDR" : "ADR"} LEAGUE</span>
        )}
      </div>
    </div>
  );
});

export default FutCard;
