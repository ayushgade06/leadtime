// Earthquake → initial sea-surface displacement (a simplified, Okada-style dipole).
//
// A megathrust earthquake pushes the seafloor UP on the ocean (trench) side of the fault and
// lets it drop DOWN on the landward side. Water is incompressible and the rupture is fast,
// so the sea surface copies that seafloor shape instantly: that is the tsunami's birth.
//
//   η0(u, v) = U · taper(u, L) · [ G(v − W/4, W/4) − 0.6 · G(v + W/4, W/4) ]
//
//   u = distance along strike, v = distance across strike (positive toward the trench)
//   U = 0.3 · D  (peak uplift as a fraction of fault slip D), G(x, σ) = exp(−x² / 2σ²)
//
// This is a documented simplification of the full Okada (1985) elastic solution.
import physics from './data/physics.json';
import type { Grid } from './geo';

export interface Segment {
  lat: number; // centroid
  lon: number;
  strikeDeg: number; // clockwise from north; the trench lies 90° to the LEFT of strike
  lengthKm: number;
  widthKm: number;
  slipM: number;
  triggerTimeS?: number;
}

const MU = 3e10; // crustal rigidity μ, Pa
const KM_PER_DEG = 111.195; // on a sphere of radius 6371 km

/**
 * Fault size from magnitude: Strasser et al. (2010) subduction-interface scaling,
 *   log10 L[km] = a + b·Mw,   log10 W[km] = a' + b'·Mw
 * then slip from the seismic moment: M0 = 10^(1.5·Mw + 9.1) N·m = μ · L · W · D.
 */
export function faultFromMw(mw: number) {
  const s = physics.strasser2010;
  const L = 10 ** (s.lengthInterface.a.value + s.lengthInterface.b.value * mw);
  const W = 10 ** (s.widthInterface.a.value + s.widthInterface.b.value * mw);
  const M0 = 10 ** (1.5 * mw + 9.1);
  const D = M0 / (MU * L * 1e3 * W * 1e3);
  return { lengthKm: L, widthKm: W, slipM: D, M0 };
}

export function segmentFromMw(lat: number, lon: number, mw: number, strikeDeg: number): Segment {
  const { lengthKm, widthKm, slipM } = faultFromMw(mw);
  return { lat, lon, strikeDeg, lengthKm, widthKm, slipM };
}

/** The 2004 Sumatra–Andaman rupture as 5 segments (Grilli et al. 2007, Table 1). */
export function segments2004(): Segment[] {
  return physics.rupture2004.segments.map((s) => ({
    lat: s.centroid[0], lon: s.centroid[1], strikeDeg: s.strikeDeg,
    lengthKm: s.lengthKm, widthKm: s.widthKm, slipM: s.slipM, triggerTimeS: s.triggerTimeS,
  }));
}

const gauss = (x: number, sigma: number) => Math.exp(-(x * x) / (2 * sigma * sigma));
/** Smooth boxcar: ≈1 for |u| < L/2, falling to 0 over a few `w`. */
const taper = (u: number, L: number, w: number) => 0.5 * (Math.tanh((u + L / 2) / w) - Math.tanh((u - L / 2) / w));

/** Sea-surface uplift (m) on every grid cell for one fault segment. */
export function surfaceFromSegment(g: Grid, seg: Segment): Float64Array {
  const N = g.N, out = new Float64Array(N * N);
  const th = (seg.strikeDeg * Math.PI) / 180;
  const sinT = Math.sin(th), cosT = Math.cos(th);
  const coslat0 = Math.cos((seg.lat * Math.PI) / 180);
  const L = seg.lengthKm, W = seg.widthKm, U = 0.3 * seg.slipM, sig = W / 4;
  const reach = L / 2 + 2 * W; // skip cells far from the fault
  for (let j = 0; j < N; j++) {
    const dy = (g.lat[j] - seg.lat) * KM_PER_DEG;
    if (Math.abs(dy) > reach) continue;
    for (let i = 0; i < N; i++) {
      const dx = (g.lon[i] - seg.lon) * coslat0 * KM_PER_DEG; // local flat-earth km (east, north)
      const u = dx * sinT + dy * cosT; // along strike
      const v = -dx * cosT + dy * sinT; // across strike, + toward the trench (left of strike)
      if (Math.abs(u) > reach || Math.abs(v) > reach) continue;
      out[j * N + i] = U * taper(u, L, sig) * (gauss(v - W / 4, sig) - 0.6 * gauss(v + W / 4, sig));
    }
  }
  return out;
}
