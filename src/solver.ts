// LeadTime ocean solver: linear-depth "virtual pipe" shallow-water model on a Mercator grid.
// PURE module: no DOM, so it runs in the browser, in a Web Worker and in Node tests alike.
//
// Picture every ocean cell as a water column connected to its 4 neighbours by pipes.
// A difference in sea-surface height η between two cells accelerates the water in the pipe
// (that's gravity), and the pipe flow moves volume from one column to the other.
//
//   pipe momentum   dQ/dt = g · A/ℓ · Δη        A = h·s (pipe cross-section), ℓ = s (pipe length)
//   continuity      dη/dt = (ΣQ_in − ΣQ_out) / s²
//
// Because Mercator cells are square (s × s), A/ℓ = h, so dQ/dt = g·h·Δη. Combining the two
// equations: d²η/dt² = g·h·(Δ²η)/s², the 2-D wave equation with speed c = √(g·h).
// So the tsunami runs at ~200 m/s (720 km/h) over 4 km of water and slows to ~30 m/s on a
// 100 m shelf, which is what bends wave fronts towards shallow water (refraction).
//
// Design choices (documented simplifications):
// * One SIGNED flux per face (instead of two clamped one-way pipes). It is the same pipe idea,
//   but it reduces exactly to the staggered linear long-wave scheme used by classic tsunami
//   codes, and it doesn't add numerical damping each time the flow reverses.
// * No Coriolis, no frequency dispersion, no advection: fine for arrival times, documented.
// * Land cells (bed b ≥ 0) are walls: no flux crosses into them (no inundation).

export const G = 9.81; // gravity, m/s²

export interface SimOptions {
  /** Cells of absorbing "sponge" at the domain edge so waves leave instead of reflecting (0 = closed box). */
  sponge?: number;
  /** |η| that counts as "the wave has arrived", metres. */
  arrivalThreshold?: number;
  /** Manning roughness applied only in shallow water (hf < frictionDepth). 0 disables. */
  manningN?: number;
  frictionDepth?: number;
  /** CFL safety factor for the time step. */
  cfl?: number;
}

export interface Sim {
  nx: number;
  ny: number;
  /** Cell side per row (m). */
  rowSize: Float64Array;
  /** Rest water depth (m); 0 marks land. */
  h0: Float64Array;
  /** Sea-surface displacement η (m). Total water depth = h0 + η. */
  eta: Float64Array;
  /** Volume flux (m³/s) through each cell's EAST face (positive = flowing east). */
  qx: Float64Array;
  /** Volume flux (m³/s) through each cell's SOUTH face (positive = flowing south). */
  qy: Float64Array;
  /** Per-cell damping factor in (0,1]; 1 outside the sponge. */
  damp: Float64Array;
  t: number;
  dt: number;
  steps: number;
  /** First time |η| exceeded the threshold (s), Infinity if never. */
  tArrive: Float32Array;
  /** Highest crest seen (m). */
  etaMax: Float32Array;
  threshold: number;
  manningN: number;
  frictionDepth: number;
  /** Surface uplifts waiting for their trigger time (multi-segment ruptures break in sequence). */
  pending: { t: number; eta0: ArrayLike<number> }[];
}

export function createSim(
  nx: number, ny: number, b: ArrayLike<number>, rowSize: ArrayLike<number>, opts: SimOptions = {},
): Sim {
  const n = nx * ny;
  const h0 = new Float64Array(n);
  let hMax = 0;
  for (let k = 0; k < n; k++) {
    h0[k] = b[k] < 0 ? -b[k] : 0;
    if (h0[k] > hMax) hMax = h0[k];
  }
  const rs = Float64Array.from(rowSize);
  // Adaptive (CFL) time step: dt = cfl · min(s) / √(g · d_max). The fastest wave must not
  // cross more than a fraction of a cell per step or the explicit scheme blows up.
  const sMin = Math.min(...rs);
  const dt = (opts.cfl ?? 0.4) * sMin / Math.sqrt(G * (hMax + 10));

  // Sponge: inside `w` cells of the edge, damp η and the fluxes a little each step,
  // growing quadratically toward the edge so the wave is absorbed without reflecting.
  const w = opts.sponge ?? 20;
  const damp = new Float64Array(n).fill(1);
  if (w > 0)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const edge = Math.min(i, j, nx - 1 - i, ny - 1 - j);
        if (edge < w) damp[j * nx + i] = 1 - 0.1 * ((w - edge) / w) ** 2;
      }

  return {
    nx, ny, rowSize: rs, h0, damp, dt, t: 0, steps: 0,
    eta: new Float64Array(n), qx: new Float64Array(n), qy: new Float64Array(n),
    tArrive: new Float32Array(n).fill(Infinity), etaMax: new Float32Array(n),
    threshold: opts.arrivalThreshold ?? 0.05,
    manningN: opts.manningN ?? 0.025, frictionDepth: opts.frictionDepth ?? 200,
    pending: [],
  };
}

/** Add an initial sea-surface uplift (only on ocean cells), now or at a later trigger time. */
export function addSurface(sim: Sim, eta0: ArrayLike<number>, atTime = sim.t) {
  if (atTime > sim.t) { sim.pending.push({ t: atTime, eta0 }); return; }
  for (let k = 0; k < sim.eta.length; k++) if (sim.h0[k] > 0) sim.eta[k] += eta0[k];
}

/** Advance the ocean by one time step dt. */
export function step(sim: Sim) {
  const { nx, ny, h0, eta, qx, qy, rowSize, dt, damp } = sim;
  const n2 = sim.manningN * sim.manningN, fd = sim.frictionDepth;

  // 1. Pipe momentum: the surface slope accelerates the flux through each face.
  for (let j = 0; j < ny; j++) {
    const s = rowSize[j];
    const sy = j < ny - 1 ? 0.5 * (s + rowSize[j + 1]) : s; // face between rows j and j+1
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      if (h0[k] === 0) continue;
      if (i < nx - 1 && h0[k + 1] > 0) qx[k] = pipe(qx[k], eta[k], eta[k + 1], h0[k], h0[k + 1], s, dt, n2, fd);
      if (j < ny - 1 && h0[k + nx] > 0) qy[k] = pipe(qy[k], eta[k], eta[k + nx], h0[k], h0[k + nx], sy, dt, n2, fd);
    }
  }

  // 2. Positivity limiter: a cell can't send out more water than it holds this step.
  //    K = min(1, d·s² / (ΣQ_out·dt)), applied to that cell's outgoing faces only.
  for (let j = 0; j < ny; j++) {
    const area = rowSize[j] * rowSize[j];
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      if (h0[k] === 0) continue;
      const out = (qx[k] > 0 ? qx[k] : 0) + (i > 0 && qx[k - 1] < 0 ? -qx[k - 1] : 0)
        + (qy[k] > 0 ? qy[k] : 0) + (j > 0 && qy[k - nx] < 0 ? -qy[k - nx] : 0);
      const avail = (h0[k] + eta[k]) * area;
      if (out * dt > avail) {
        const K = Math.max(0, avail) / (out * dt);
        if (qx[k] > 0) qx[k] *= K;
        if (i > 0 && qx[k - 1] < 0) qx[k - 1] *= K;
        if (qy[k] > 0) qy[k] *= K;
        if (j > 0 && qy[k - nx] < 0) qy[k - nx] *= K;
      }
    }
  }

  // 3. Continuity: η changes by net inflow / cell area. Every face flux leaves one cell and
  //    enters the other, so total volume Σ η·s² is conserved exactly (up to rounding).
  sim.t += dt;
  sim.steps++;
  const t = sim.t, thr = sim.threshold, tA = sim.tArrive, eM = sim.etaMax;
  for (let j = 0; j < ny; j++) {
    const inv = dt / (rowSize[j] * rowSize[j]);
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      if (h0[k] === 0) continue;
      const net = (i > 0 ? qx[k - 1] : 0) - qx[k] + (j > 0 ? qy[k - nx] : 0) - qy[k];
      let e = eta[k] + inv * net;
      const dmp = damp[k];
      if (dmp < 1) { e *= dmp; qx[k] *= dmp; qy[k] *= dmp; }
      eta[k] = e;
      // 4. Recorders: arrival time and the highest crest, for the maps and warnings.
      if (e > eM[k]) eM[k] = e;
      if ((e > thr || e < -thr) && tA[k] === Infinity) tA[k] = t;
    }
  }

  for (let p = sim.pending.length - 1; p >= 0; p--)
    if (sim.pending[p].t <= sim.t) { addSurface(sim, sim.pending[p].eta0); sim.pending.splice(p, 1); }
}

/** Flux update for one pipe between cells a → b. */
function pipe(q: number, ea: number, eb: number, ha: number, hb: number, s: number, dt: number, n2: number, fd: number) {
  const dEta = ea - eb;
  // Upwind water depth: the column the water flows out of sets the pipe's cross-section.
  const hf = dEta > 0 ? ha + ea : hb + eb;
  if (hf <= 0) return 0;
  q += dt * G * hf * dEta; // dQ/dt = g·h·Δη  (A/ℓ = h for square cells)
  // Manning bottom friction, shallow water only, semi-implicit so it can't flip the flow:
  // dQ/dt = −g·n²·|u|·Q / h^(4/3), with u = Q / (s·h).
  if (n2 > 0 && hf < fd) q /= 1 + dt * G * n2 * Math.abs(q) / (s * hf ** (7 / 3));
  return q;
}

/** Volume displaced from rest, Σ η·s² (m³). Conserved when there is no sponge. */
export function volume(sim: Sim) {
  let v = 0;
  for (let j = 0; j < sim.ny; j++) {
    const a = sim.rowSize[j] ** 2;
    for (let i = 0; i < sim.nx; i++) v += sim.eta[j * sim.nx + i] * a;
  }
  return v;
}

/** Run until simulated time `tEnd` (s). */
export function runUntil(sim: Sim, tEnd: number) {
  while (sim.t < tEnd) step(sim);
}
