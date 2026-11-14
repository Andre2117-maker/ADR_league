/* ==========================================================================
   CAMPO EM PERSPECTIVA (sem CSS 3D: tudo calculado e desenhado em SVG)
   O mesmo cálculo posiciona o gramado e os jogadores, então eles ficam
   sempre em cima do ponto certo do campo, em qualquer tela.

   Coordenadas do campo em metros: lx = 0..105 (do gol do time A até o gol
   do time B) e wy = 0..68 (lateral a lateral).
   ========================================================================== */

export const LEN = 105;
export const WID = 68;

/* Três "câmeras":
   - horizontal: computador, campo deitado (A esquerda, B direita)
   - vertical:   celular, os dois times (A embaixo, B em cima)
   - solo:       celular, meio campo de um time (gol embaixo) */
export const LAYOUTS = {
  horizontal: {
    vw: 1000,
    vh: 600,
    wNear: 940,
    top: 110,
    bottom: 548,
    ratio: 0.6,
  },
  vertical: { vw: 400, vh: 680, wNear: 384, top: 120, bottom: 640, ratio: 0.7 },
  solo: { vw: 400, vh: 560, wNear: 380, top: 120, bottom: 520, ratio: 0.85 },
  // Computador, um time só (amistoso/campeonato): meio campo mais largo
  soloWide: { vw: 700, vh: 720, wNear: 680, top: 130, bottom: 690, ratio: 0.8 },
};

/* Campo plano (visão de cima): mesmo layout, sem perspectiva */
const flatOf = (L) => ({ ...L, ratio: 1, top: L.top - 40 });

export const makeCamera = (layoutKey, is3D = true) => {
  // Nunca quebra: câmera desconhecida usa a de "um time só"
  const base =
    LAYOUTS[layoutKey] ||
    (layoutKey === "soloWide"
      ? { vw: 700, vh: 720, wNear: 680, top: 130, bottom: 690, ratio: 0.8 }
      : LAYOUTS.solo);
  const L = is3D ? base : flatOf(base);

  // u = 0..1 da esquerda para a direita; v = 0 (fundo) .. 1 (perto da câmera)
  const project = (u, v) => {
    let s;
    let y;
    if (L.ratio >= 0.999) {
      s = 1;
      y = L.top + v * (L.bottom - L.top);
    } else {
      const z = 1 + (1 - v) * (1 / L.ratio - 1); // distância até a câmera
      s = 1 / z; // 1 perto, "ratio" no fundo
      const B = (L.bottom - L.top) / (1 - L.ratio);
      y = L.bottom - B + B * s;
    }
    const x = L.vw / 2 + (u - 0.5) * L.wNear * s;
    return { x, y, s };
  };

  // Metros do campo -> (u, v) conforme o layout
  const toUV = (lx, wy) => {
    if (layoutKey === "horizontal") return [lx / LEN, wy / WID];
    if (layoutKey === "vertical") return [wy / WID, 1 - lx / LEN];
    return [wy / WID, 1 - lx / (LEN / 2)]; // solo: só o meio campo
  };

  const P = (lx, wy) => project(...toUV(lx, wy));

  // Pixels por metro perto da câmera (usado na altura das traves)
  const pxPerMeter = L.wNear / (layoutKey === "horizontal" ? LEN : WID);

  return { L, project, toUV, P, pxPerMeter, layoutKey, is3D };
};

/* ---------- Geometria das linhas (em metros) ---------- */
const circlePts = (cx, cy, r, a0 = 0, a1 = Math.PI * 2, n = 56) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

export const pitchShapes = (half = false) => {
  const C = WID / 2;
  const end = half ? LEN / 2 : LEN;
  const shapes = [];
  const poly = (pts, closed = false, fill = false) =>
    shapes.push({ pts, closed, fill });

  // Contorno
  poly(
    [
      [0, 0],
      [end, 0],
      [end, WID],
      [0, WID],
    ],
    true,
  );
  // Linha do meio
  poly([
    [LEN / 2, 0],
    [LEN / 2, WID],
  ]);
  // Círculo central (inteiro ou só a metade do time)
  poly(
    half
      ? circlePts(LEN / 2, C, 9.15, Math.PI / 2, (Math.PI * 3) / 2)
      : circlePts(LEN / 2, C, 9.15),
    !half,
  );
  shapes.push({ dot: [LEN / 2, C], r: 0.45 });

  const goalSide = (x0, dir) => {
    const box = (d, w) =>
      poly(
        [
          [x0, C - w],
          [x0 + dir * d, C - w],
          [x0 + dir * d, C + w],
          [x0, C + w],
        ],
        false,
      );
    box(16.5, 20.16);
    box(5.5, 9.16);
    const spot = x0 + dir * 11;
    shapes.push({ dot: [spot, C], r: 0.35 });
    // Meia-lua: parte do círculo do pênalti fora da grande área
    const a = Math.acos(5.5 / 9.15);
    poly(
      dir > 0
        ? circlePts(spot, C, 9.15, -a, a, 24)
        : circlePts(spot, C, 9.15, Math.PI - a, Math.PI + a, 24),
    );
  };
  goalSide(0, 1);
  if (!half) goalSide(LEN, -1);

  return shapes;
};

/* Faixas do gramado (cortes ao longo do comprimento) */
export const stripeBands = (half = false, n = 12) => {
  const end = half ? LEN / 2 : LEN;
  const bands = half ? n / 2 : n;
  return Array.from({ length: bands }, (_, i) => {
    const a = (end * i) / bands;
    const b = (end * (i + 1)) / bands;
    return {
      i,
      pts: [
        [a, 0],
        [b, 0],
        [b, WID],
        [a, WID],
      ],
    };
  });
};

export const toPath = (cam, pts, closed = false) =>
  pts
    .map(([lx, wy], i) => {
      const p = cam.P(lx, wy);
      return `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(" ") + (closed ? " Z" : "");
