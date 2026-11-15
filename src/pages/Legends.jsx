import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home/legends.css";
import Footer from "../components/Footer";

/* ==========================================================================
   ÍCONES (SVG, herdam a cor do nível)
   ========================================================================== */
const DiamondIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.5 3.5h11l4 5.5L12 21 2.5 9z" />
    <path d="M2.5 9h19M9 3.5 7.5 9 12 21l4.5-12L15 3.5" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.8 4.5 5.6v5.8c0 4.8 3.2 8.4 7.5 9.8 4.3-1.4 7.5-5 7.5-9.8V5.6z" />
    <path d="m8.6 12 2.4 2.4 4.6-4.8" />
  </svg>
);

const CrownIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.5 7.5 8 11l4-6.5 4 6.5 4.5-3.5-1.8 10.5H5.3z" />
    <path d="M5.5 21h13" />
  </svg>
);

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.9" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
    <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
  </svg>
);

/* Níveis: a cor é do nível (diamante, platina, ouro, prata) e fica igual nos 3 temas */
const MILESTONES = [
  { goals: 200, key: "diamond", title: "Lenda Suprema", color: "#5ee7f2", Icon: DiamondIcon },
  { goals: 150, key: "platinum", title: "Imortal da ADR", color: "#dcdde3", Icon: ShieldIcon },
  { goals: 100, key: "gold", title: "Centenário de Ouro", color: "#e6c157", Icon: CrownIcon },
  { goals: 50, key: "silver", title: "Artilheiro de Elite", color: "#b9bec7", Icon: TargetIcon },
];

const Legends = ({ playersWithStats }) => {
  const navigate = useNavigate();

  const legendPlayers = useMemo(
    () =>
      (playersWithStats || [])
        .filter((p) => (p.goals || 0) >= 50)
        .sort((a, b) => (b.goals || 0) - (a.goals || 0)),
    [playersWithStats],
  );

  /* posição geral no ranking de artilheiros */
  const rankOf = useMemo(() => {
    const map = {};
    legendPlayers.forEach((p, i) => (map[p.id] = i + 1));
    return map;
  }, [legendPlayers]);

  const totalGoals = legendPlayers.reduce((s, p) => s + (p.goals || 0), 0);
  const top = legendPlayers[0];

  return (
    <div className="legends-wrapper">
      <header className="legends-header">
        <span className="legends-kicker">ADR · Galeria dos artilheiros</span>
        <h1 className="legends-main-title">Hall da Fama</h1>
        <p className="legends-subtitle">Os maiores artilheiros da história do ADR</p>

        {legendPlayers.length > 0 && (
          <div className="legends-summary">
            <div>
              <strong>{legendPlayers.length}</strong>
              <span>{legendPlayers.length === 1 ? "Lenda" : "Lendas"}</span>
            </div>
            <div>
              <strong>{totalGoals}</strong>
              <span>Gols somados</span>
            </div>
            {top && (
              <div>
                <strong>{top.goals}</strong>
                <span>Recorde · {top.nickname || top.name.split(" ")[0]}</span>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="legends-container">
        {MILESTONES.map((m, idx) => {
          const ceiling = MILESTONES[idx - 1]?.goals ?? Infinity;
          const next = MILESTONES[idx - 1];
          const inTier = legendPlayers.filter(
            (p) => p.goals >= m.goals && p.goals < ceiling,
          );
          const locked = inTier.length === 0;

          return (
            <section
              key={m.key}
              className={`milestone-section tier-${m.key} ${locked ? "is-locked" : ""}`}
              style={{ "--tier": m.color }}
            >
              <div className="milestone-banner">
                <span className="milestone-icon">
                  {locked ? <LockIcon /> : <m.Icon />}
                </span>
                <div className="milestone-text">
                  <span className="milestone-mark">Marca de {m.goals}+ gols</span>
                  <h2 className="milestone-name">{m.title}</h2>
                </div>
                <span className="milestone-count">
                  {locked
                    ? "Ninguém chegou ainda"
                    : `${inTier.length} ${inTier.length === 1 ? "jogador" : "jogadores"}`}
                </span>
              </div>

              {!locked && (
                <div className="legends-grid">
                  {inTier.map((p) => {
                    const goals = p.goals || 0;
                    const pct = next
                      ? Math.min(100, ((goals - m.goals) / (next.goals - m.goals)) * 100)
                      : 100;
                    const missing = next ? next.goals - goals : 0;

                    return (
                      <button
                        type="button"
                        key={p.id}
                        className={`legend-card ${p.isAnonymous ? "is-inactive" : ""}`}
                        onClick={() => navigate(`/player/${p.id}`)}
                      >
                        <span className="legend-rank">#{rankOf[p.id]}</span>

                        <span className="legend-photo-wrapper">
                          {p.photo ? (
                            <img src={p.photo} alt={p.name} className="legend-img" />
                          ) : (
                            <span className="legend-img legend-initial">
                              {p.name.charAt(0)}
                            </span>
                          )}
                        </span>

                        <span className="legend-goal-badge">
                          <b>{goals}</b> gols
                        </span>

                        <span className="legend-name">{p.name}</span>
                        {p.isAnonymous && <span className="legend-status">Inativo</span>}

                        <span className="legend-progress">
                          <span className="legend-progress-bar">
                            <i style={{ width: `${pct}%` }} />
                          </span>
                          <span className="legend-progress-label">
                            {next ? `Faltam ${missing} para ${next.title}` : "Nível máximo"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {legendPlayers.length === 0 && (
          <div className="no-legends">
            <p>Ainda não há jogadores com 50+ gols. A história está sendo escrita.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Legends;
