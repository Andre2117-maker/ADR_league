import React, { useEffect, useMemo, useState } from "react";
import { FORMATIONS_DATA } from "../../../data/formationsConfig";
import {
  makeCamera,
  pitchShapes,
  stripeBands,
  toPath,
  LEN,
  WID,
} from "./pitch3d";

/* ==========================================================================
   PEÇAS DO CAMPO 3D (usadas no DualField e no campo de amistoso/campeonato)
   ========================================================================== */

export const GROUPS = ["FUT4", "FUT5", "FUT6", "FUT7", "FUT8"];
const GK_ROLES = ["GK", "GOL", "GOLEIRO", "G", "GL"];

const pct = (v) => parseFloat(String(v ?? "").replace("%", "")) || 0;

export const formationInfo = (key) => {
  for (const g of GROUPS) {
    const f = FORMATIONS_DATA[g]?.[key];
    if (f) return f;
  }
  return null;
};

// "5_JOG_2-1-1" -> "2-1-1"
export const formationShort = (key) => {
  const m = String(key || "").match(/(\d+(?:-\d+)+)/);
  if (m) return m[1];
  return formationInfo(key)?.label || "";
};

/* Slot da formação (campo em pé, 0-100%) -> metros no campo
   solo = um time só no meio campo dele (gol perto da câmera) */
export const slotToMeters = (slots, side, solo) => {
  const gk = slots.find((s) =>
    GK_ROLES.includes(String(s.role || "").toUpperCase()),
  );
  const ownGoalBottom = gk ? pct(gk.y) >= 50 : true;

  return slots.map((s) => {
    const across = pct(s.x) / 100; // 0 = lado esquerdo do time
    const depth = (ownGoalBottom ? 100 - pct(s.y) : pct(s.y)) / 100; // 0 = no próprio gol
    let lx = solo ? 3 + depth * 46 : 3.5 + depth * 45;
    let wy = 6 + across * (WID - 12);
    if (!solo && side === "B") {
      lx = LEN - lx;
      wy = WID - wy;
    }
    return { slot: s, lx, wy };
  });
};

/* Tamanho base dos cards em cada câmera */
export const CARD_SCALE = {
  horizontal: 1.15,
  vertical: 0.68,
  solo: 0.74,
  soloWide: 0.86,
};

/* Celular */
export const useVertical = (query = "(max-width: 760px)") => {
  const [v, setV] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setV(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return v;
};

/* Quantos TITULARES o time tem nesta partida.
   Conta só quem começou: tira quem entrou por substituição (reserva).
   Usa os participantes reais se existirem; senão, a lista do time. */
export const startersCount = (match, k) => {
  const team = k === "B" ? match?.teamB : match?.teamA;
  const actual =
    k === "B" ? match?.actualParticipantsB : match?.actualParticipantsA;
  const base = (actual && actual.length ? actual : team?.players || []).map(
    String,
  );
  const subsIn = new Set(
    (match?.events || [])
      .filter((e) => e.type === "SUB" && e.team === k && e.playerInId)
      .map((e) => String(e.playerInId)),
  );
  let n = new Set(base.filter((id) => !subsIn.has(id))).size;
  // Goleiro de fora (não está na lista de jogadores)
  if (!team?.goalkeeperId && team?.externalGoalkeeperName) n += 1;
  return n;
};

const groupOfKey = (key) => GROUPS.find((g) => FORMATIONS_DATA[g]?.[key]);
const groupSize = (g) => Number(String(g).replace(/\D/g, "")) || 0;

/* Seletor de formação (admin)
   size = nº de titulares: mostra primeiro só as formações desse tamanho */
export const FormationSelect = ({ value, onChange, size }) => {
  const [showAll, setShowAll] = useState(false);
  const fitGroup = GROUPS.find(
    (g) => groupSize(g) === size && FORMATIONS_DATA[g],
  );
  const currentGroup = groupOfKey(value);
  const filtering = !!fitGroup && !showAll;

  const groups = filtering
    ? [
        fitGroup,
        ...(currentGroup && currentGroup !== fitGroup ? [currentGroup] : []),
      ]
    : GROUPS;

  return (
    <select
      className="pf-select"
      value={value}
      title={fitGroup ? `${size} titulares` : undefined}
      onChange={(e) => {
        if (e.target.value === "__all__") {
          setShowAll(true);
          return;
        }
        if (e.target.value === "__fit__") {
          setShowAll(false);
          return;
        }
        onChange(e.target.value);
      }}
    >
      {groups.map((g) => (
        <optgroup
          key={g}
          label={
            g === fitGroup
              ? `${g.replace("FUT", "FUT ")} · ${size} titulares`
              : g === currentGroup && filtering
                ? `${g.replace("FUT", "FUT ")} · atual`
                : g.replace("FUT", "FUT ")
          }
        >
          {Object.keys(FORMATIONS_DATA[g] || {}).map((k) => (
            <option key={k} value={k}>
              {FORMATIONS_DATA[g][k].label}
            </option>
          ))}
        </optgroup>
      ))}
      {filtering && <option value="__all__">Ver todas as formações…</option>}
      {fitGroup && showAll && (
        <option value="__fit__">Só as de {size} titulares</option>
      )}
    </select>
  );
};

/* Botões 3D | Plano */
export const ViewSwitch = ({ is3D, onToggle3D }) =>
  onToggle3D ? (
    <div className="pf-viewswitch" role="group" aria-label="Visão do campo">
      <button
        type="button"
        className={is3D ? "on" : ""}
        onClick={() => !is3D && onToggle3D()}
      >
        3D
      </button>
      <button
        type="button"
        className={!is3D ? "on" : ""}
        onClick={() => is3D && onToggle3D()}
      >
        Plano
      </button>
    </div>
  ) : null;

/* ---------- Gramado + linhas + traves (SVG) ---------- */
function PitchSVG({ cam, half }) {
  const { L } = cam;
  const shapes = useMemo(() => pitchShapes(half), [half]);
  const bands = useMemo(() => stripeBands(half), [half]);
  const end = half ? LEN / 2 : LEN;

  const apron = toPath(
    cam,
    [
      [-4, -4],
      [end + (half ? 0 : 4), -4],
      [end + (half ? 0 : 4), WID + 4],
      [-4, WID + 4],
    ],
    true,
  );

  // Trave com rede (fica em pé, como os jogadores)
  const goal = (lx, dir) => {
    const h = 2.44 * cam.pxPerMeter;
    const a = cam.P(lx, WID / 2 - 3.66);
    const b = cam.P(lx, WID / 2 + 3.66);
    const c = cam.P(lx - dir * 1.8, WID / 2 + 3.66);
    const d = cam.P(lx - dir * 1.8, WID / 2 - 3.66);
    const up = (p, k = 1) => ({ x: p.x, y: p.y - h * p.s * k });
    const at = up(a);
    const bt = up(b);
    const ct = up(c, 0.8);
    const dt = up(d, 0.8);
    const pts = (arr) =>
      arr.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    return (
      <g className="pf-goal" key={`goal-${lx}`}>
        <polygon className="pf-net" points={pts([a, at, dt, d])} />
        <polygon className="pf-net" points={pts([b, bt, ct, c])} />
        <polygon className="pf-net" points={pts([at, bt, ct, dt])} />
        <polygon className="pf-net back" points={pts([d, dt, ct, c])} />
        <polyline className="pf-post" points={pts([a, at, bt, b])} />
      </g>
    );
  };

  return (
    <svg
      className="pf-svg"
      viewBox={`0 0 ${L.vw} ${L.vh}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pfLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      <path className="pf-apron" d={apron} />
      {bands.map((b) => (
        <path
          key={b.i}
          className={`pf-band ${b.i % 2 ? "odd" : ""}`}
          d={toPath(cam, b.pts, true)}
        />
      ))}

      <g className="pf-markings">
        {shapes.map((sh, i) => {
          if (sh.dot) {
            const p = cam.P(...sh.dot);
            return (
              <ellipse
                key={i}
                cx={p.x}
                cy={p.y}
                rx={2.6 * p.s}
                ry={2.6 * p.s * (cam.is3D ? 0.6 : 1)}
              />
            );
          }
          return <path key={i} d={toPath(cam, sh.pts, sh.closed)} />;
        })}
      </g>

      {goal(0, 1)}
      {!half && goal(LEN, -1)}

      <path className="pf-light" d={apron} fill="url(#pfLight)" />
    </svg>
  );
}

/* ---------- Palco: gramado + sombras + jogadores em pé ----------
   teams: [{ k: "A"|"B", slots: [...slots da formação], ids: [...] }] */
export function PitchStage({
  layoutKey,
  is3D = true,
  half = false,
  solo = false,
  teams,
  renderSlot,
  children,
}) {
  const cam = useMemo(() => makeCamera(layoutKey, is3D), [layoutKey, is3D]);
  const k = (CARD_SCALE[layoutKey] || 1) * (is3D ? 1 : 0.9);

  const placed = teams.flatMap((t) =>
    slotToMeters(t.slots, t.k, solo).map(({ slot, lx, wy }) => {
      const p = cam.P(lx, wy);
      return {
        t,
        slot,
        p,
        style: {
          left: `${((p.x / cam.L.vw) * 100).toFixed(3)}%`,
          top: `${((p.y / cam.L.vh) * 100).toFixed(3)}%`,
          transform: `translate(-50%, -100%) scale(${(k * p.s).toFixed(3)})`,
          transformOrigin: "50% 100%",
          zIndex: 10 + Math.round(p.y),
        },
        shadowW: 64 * k * p.s,
      };
    }),
  );

  return (
    <div
      className="pf-stage"
      style={{ aspectRatio: `${cam.L.vw} / ${cam.L.vh}` }}
    >
      <PitchSVG cam={cam} half={half} />

      <div className="pf-shadows" aria-hidden="true">
        {placed.map(({ t, slot, p, shadowW }) => (
          <span
            key={`sh-${t.k}-${slot.id}`}
            className="pf-shadow"
            style={{
              left: `${(p.x / cam.L.vw) * 100}%`,
              top: `${(p.y / cam.L.vh) * 100}%`,
              width: shadowW,
              height: shadowW * (is3D ? 0.32 : 0.5),
            }}
          />
        ))}
      </div>

      <div className="pf-players">
        {placed.map(({ t, slot, style }) => (
          <React.Fragment key={`${t.k}-${slot.id}`}>
            {renderSlot(
              {
                ...slot,
                x: style.left,
                y: style.top,
                style,
                className: `pf-on-pitch side-${t.k.toLowerCase()}`,
              },
              t.k,
              t.ids,
            )}
          </React.Fragment>
        ))}
      </div>

      {children}
    </div>
  );
}
