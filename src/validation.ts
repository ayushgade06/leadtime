// Physics test cases for the solver. Shared by vitest (test/solver.test.ts) and the in-app
// Science tab, so judges can re-run exactly what we test, live in their browser.
import { G, addSurface, createSim, step, volume, type Sim } from './solver';
import { faultFromMw, surfaceFromSegment } from './source';
import { makeGrid, INDIAN_OCEAN } from './geo';

export interface Check {
  value: number;
  expected: number;
  /** Optional chart series: x/y pairs. */
  series?: { x: number[]; y: number[]; y2?: number[] };
}

const flat = (nx: number, ny: number, depth: number) => new Float64Array(nx * ny).fill(-depth);
const uniformRows = (ny: number, s: number) => new Float64Array(ny).fill(s);
function gaussianHump(sim: Sim, ci: number, cj: number, sigma: number, amp: number) {
  const e = new Float64Array(sim.nx * sim.ny);
  for (let j = 0; j < sim.ny; j++)
    for (let i = 0; i < sim.nx; i++)
      e[j * sim.nx + i] = amp * Math.exp(-((i - ci) ** 2 + (j - cj) ** 2) / (2 * sigma * sigma));
  addSurface(sim, e);
}

/** 1. Closed basin with uneven floor and an island; |ΔV| / V_hump after 2000 steps. */
export function massConservation(): Check & { series: { x: number[]; y: number[] } } {
  const nx = 80, ny = 80;
  const b = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const island = (i - 50) ** 2 + (j - 30) ** 2 < 36;
      b[j * nx + i] = island ? 50 : -(1000 + 3000 * Math.sin(i / 9) ** 2 + 20 * j);
    }
  const sim = createSim(nx, ny, b, uniformRows(ny, 20000), { sponge: 0 });
  gaussianHump(sim, 25, 40, 4, 1);
  const v0 = volume(sim);
  const x: number[] = [], y: number[] = [];
  for (let s = 1; s <= 2000; s++) {
    step(sim);
    if (s % 100 === 0) { x.push(s); y.push(Math.abs(volume(sim) - v0) / v0); }
  }
  return { value: Math.abs(volume(sim) - v0) / v0, expected: 0, series: { x, y } };
}

/** 2. Real-like rough bathymetry with η = 0 must stay exactly still: max |η| after 1000 steps. */
export function oceanAtRest(): Check {
  const nx = 64, ny = 64, b = new Float64Array(nx * ny);
  for (let k = 0; k < b.length; k++) b[k] = -6000 * Math.abs(Math.sin(k * 12.9898) * 0.7 + Math.cos(k * 0.37) * 0.3) + 30;
  const sim = createSim(nx, ny, b, uniformRows(ny, 20000), { sponge: 0 });
  for (let s = 0; s < 1000; s++) step(sim);
  let m = 0;
  for (const e of sim.eta) m = Math.max(m, Math.abs(e));
  return { value: m, expected: 0 };
}

/** Time at which η at cell k peaks, sampled every step, with parabolic sub-step refinement. */
function peakTimes(sim: Sim, gauges: number[], tEnd: number) {
  const hist = gauges.map(() => [] as number[]);
  const times: number[] = [];
  while (sim.t < tEnd) {
    step(sim);
    times.push(sim.t);
    gauges.forEach((k, g) => hist[g].push(sim.eta[k]));
  }
  return hist.map((h) => {
    // First crest: the first local maximum after η passes half the gauge's highest value
    // (later crests can be reflections off the channel ends).
    const top = Math.max(...h);
    let m = Math.max(1, h.findIndex((v) => v > 0.5 * top));
    while (m < h.length - 2 && h[m + 1] > h[m]) m++;
    const a = h[m - 1], b0 = h[m], c = h[m + 1];
    const off = (a - c) / (2 * (a - 2 * b0 + c)) || 0; // parabola vertex
    return times[m] + off * sim.dt;
  });
}

/** 3. 1-D channel, flat 4000 m: the crest travels between two gauges at √(g·4000) ≈ 198 m/s. */
export function waveSpeed(): Check {
  const nx = 700, ny = 1, s = 10000, depth = 4000;
  const sim = createSim(nx, ny, flat(nx, ny, depth), uniformRows(ny, s), { sponge: 0 });
  gaussianHump(sim, 150, 0, 6, 1);
  const [t1, t2] = peakTimes(sim, [250, 450], 5 * 3600);
  return { value: (200 * s) / (t2 - t1), expected: Math.sqrt(G * depth) };
}

/** 4. Flat basin, centred Gaussian: η must be mirror- and transpose-symmetric. Max asymmetry (m). */
export function radialSymmetry(): Check {
  const n = 101;
  const sim = createSim(n, n, flat(n, n, 4000), uniformRows(n, 20000), { sponge: 0 });
  gaussianHump(sim, 50, 50, 5, 1);
  for (let s = 0; s < 300; s++) step(sim);
  let m = 0;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const e = sim.eta[j * n + i];
      m = Math.max(m, Math.abs(e - sim.eta[j * n + (n - 1 - i)]), Math.abs(e - sim.eta[(n - 1 - j) * n + i]), Math.abs(e - sim.eta[i * n + j]));
    }
  return { value: m, expected: 0 };
}

/** 5. Deep ocean → slope → 100 m shelf. Crest travel time between a deep and a shelf gauge
 *  vs the ray-theory integral ∫dx/√(g·h). Returns seconds. */
export function shelfSlowdown(): Check & { series: { x: number[]; y: number[]; y2: number[] } } {
  const nx = 600, s = 5000;
  const depth = (i: number) => (i < 300 ? 4000 : i < 360 ? 4000 - (3900 * (i - 300)) / 60 : 100);
  const b = new Float64Array(nx);
  for (let i = 0; i < nx; i++) b[i] = -depth(i);
  b[nx - 1] = 10; // coast (wall)
  const sim = createSim(nx, 1, b, uniformRows(1, s), { sponge: 0 });
  gaussianHump(sim, 120, 0, 6, 0.2);
  const gA = 250, gB = 380;
  const [tA, tB] = peakTimes(sim, [gA, gB], 4 * 3600);
  let ray = 0;
  for (let i = gA; i < gB; i++) ray += s / Math.sqrt(G * 0.5 * (depth(i) + depth(i + 1)));
  const x: number[] = [], y: number[] = [], y2: number[] = [];
  for (let i = 0; i < nx - 1; i += 5) { x.push((i * s) / 1000); y.push(-depth(i)); y2.push(Math.sqrt(G * depth(i))); }
  return { value: tB - tA, expected: ray, series: { x, y, y2 } };
}

/** 6. Strasser scaling at Mw 9.1, and the dipole has both an uplift and a subsidence lobe. */
export function sourceScaling() {
  const f = faultFromMw(9.1);
  const g = makeGrid({ ...INDIAN_OCEAN, N: 256 });
  const eta = surfaceFromSegment(g, { lat: 3, lon: 94, strikeDeg: 330, lengthKm: f.lengthKm, widthKm: f.widthKm, slipM: f.slipM });
  let up = 0, down = 0;
  for (const e of eta) { up = Math.max(up, e); down = Math.min(down, e); }
  return { L: f.lengthKm, W: f.widthKm, D: f.slipM, up, down };
}
