/* ==========================================================================
   PÁGINA DA PARTIDA TEMÁTICA PARA EVENTOS (Halloween, Natal...)
   - getEventTheme(match): devolve o tema do evento (ou null se não for evento)
   - <EventRibbon>: faixa "EVENTO ESPECIAL" em cima do banner
   - <EventSky>: morcegos / neve caindo sobre o banner
   Para criar um evento novo: acrescente uma entrada em EVENT_THEMES
   e as cores dele no matchpage-eventos.css (classe .mp-ev-<chave>).
   ========================================================================== */

const ICONS = {
  // abóbora
  pumpkin: (
    <>
      <path d="M12 7.2c-1.2-.9-2.9-1.2-4.4-.7C4.9 7.4 3.5 10.2 3.5 13.3c0 3.6 2.6 6.2 5.5 6.2 1.1 0 2.1-.4 3-1 .9.6 1.9 1 3 1 2.9 0 5.5-2.6 5.5-6.2 0-3.1-1.4-5.9-4.1-6.8-1.5-.5-3.2-.2-4.4.7z" />
      <path d="M12 7.2V4.2c0-.8.6-1.4 1.4-1.4h1" />
      <path d="M8.3 12.2l1.4 1.2M15.7 12.2l-1.4 1.2M9 16.2c1.9 1 4.1 1 6 0" />
    </>
  ),
  // pinheiro com estrela
  tree: (
    <>
      <path d="M12 2.6l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" />
      <path d="M12 8.5l-4.2 4.6h2.3L6.5 17.6h11L13.9 13.1h2.3z" />
      <path d="M12 17.6v3.4" />
    </>
  ),
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z" />,
};

export const EVENT_THEMES = {
  HALLOWEEN: {
    key: "halloween",
    label: "Halloween",
    tagline: "Noite das bruxas",
    icon: "pumpkin",
    banner: "/banner/BannerHallo.png",
    particle: "bat",
  },
  NATAL: {
    key: "natal",
    label: "Natal",
    tagline: "Jogo de fim de ano",
    icon: "tree",
    banner: "/banner/BannerNatal.png",
    particle: "snow",
  },
};

export const getEventTheme = (match) => {
  if (String(match?.type || "").toUpperCase() !== "EVENTO") return null;
  const k = String(match.eventType || "HALLOWEEN").toUpperCase();
  return (
    EVENT_THEMES[k] || {
      key: k.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: k.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()),
      tagline: "Evento especial",
      icon: "star",
      banner: null,
      particle: null,
    }
  );
};

export const EventIcon = ({ name, className = "mp-ev-ico" }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    {ICONS[name] || ICONS.star}
  </svg>
);

export function EventRibbon({ theme, year }) {
  if (!theme) return null;
  return (
    <div className="mp-ev-ribbon" role="note">
      <span className="mp-ev-ribbon-kicker">
        <span className="mp-ev-k-adr">Evento especial</span>
        <span className="mp-ev-k-idr">Edição especial</span>
      </span>
      <span className="mp-ev-ribbon-title">
        <EventIcon name={theme.icon} />
        {theme.label}
        {year ? <small>{year}</small> : null}
      </span>
      <span className="mp-ev-ribbon-tag">{theme.tagline}</span>
    </div>
  );
}

/* posições fixas (sem aleatório a cada render) */
const SPOTS = [
  [4, 0, 9, 1], [11, 3.2, 11, 0.7], [19, 1.4, 8, 1.2], [27, 5.1, 12, 0.8],
  [34, 2.3, 10, 1], [42, 6.4, 9, 0.6], [49, 0.6, 13, 1.1], [57, 4.2, 10, 0.9],
  [64, 2.9, 8, 1.3], [71, 7.1, 11, 0.7], [78, 1.1, 9, 1], [85, 3.8, 12, 0.8],
  [92, 5.6, 10, 1.2], [8, 8.3, 14, 0.6], [53, 9.1, 12, 0.9], [88, 8.7, 13, 0.7],
];

export function EventSky({ theme }) {
  if (!theme?.particle) return null;
  return (
    <div className={`mp-ev-sky is-${theme.particle}`} aria-hidden="true">
      {SPOTS.map(([x, delay, dur, size], i) => (
        <span
          key={i}
          style={{
            "--x": `${x}%`,
            "--delay": `${delay}s`,
            "--dur": `${dur}s`,
            "--size": size,
          }}
        />
      ))}
    </div>
  );
}
