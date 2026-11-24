// Warning-time maths and the sensor-placement optimizer. PURE (no DOM), unit-tested.
//
// For a city c, a set of buoys B and an earthquake scenario s:
//   confirmed warning time  lead(c) = tArrive_s(c) − ( min_{b∈B} tArrive_s(b) + T_proc )
// i.e. how long between "the first buoy has confirmed the tsunami and the centre has
// processed it" and "the wave reaches the city". A city is safe if lead ≥ T_evac.
import { cellOf, type Grid } from './geo';

/**
 * Nearest ocean cell deeper than `minDepth` to a lat/lon (ring search on the grid).
 * Cities are read offshore like this because we don't model inundation.
 */
export function snapToOcean(g: Grid, b: ArrayLike<number>, lat: number, lon: number, minDepth = 50, maxRing = 12): number {
  const c = cellOf(g, lat, lon);
  if (!c) return -1;
  const N = g.N;
  for (let r = 0; r <= maxRing; r++) {
    let best = -1, bestD = Infinity;
    for (let dj = -r; dj <= r; dj++)
      for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; // ring only
        const i = c.i + di, j = c.j + dj;
        if (i < 0 || j < 0 || i >= N || j >= N) continue;
        const k = j * N + i;
        const d2 = di * di + dj * dj;
        if (-b[k] > minDepth && d2 < bestD) { bestD = d2; best = k; }
      }
    if (best >= 0) return best;
  }
  return -1;
}

/** Seconds of confirmed warning; −Infinity if no buoy ever detects the wave, +Infinity if the wave never reaches the city. */
export function leadTime(cityArrive: number, buoyArrivals: ArrayLike<number>, tProc: number) {
  if (!Number.isFinite(cityArrive)) return Infinity;
  let first = Infinity;
  for (let k = 0; k < buoyArrivals.length; k++) if (buoyArrivals[k] < first) first = buoyArrivals[k];
  return first === Infinity ? -Infinity : cityArrive - (first + tProc);
}

export interface Scenario {
  /** Arrival time (s) at every candidate buoy cell. */
  cand: Float32Array;
  /** Arrival time (s) at every city cell. */
  city: Float32Array;
}

/**
 * Greedy sensor placement. For K = 1..maxK, add the candidate that maximises
 *   Σ_s Σ_c pop_c · [lead_{s,c} ≥ T_evac]
 * over all cities the wave reaches; ties are broken by total people·minutes of warning.
 * Each step is O(candidates × scenarios × cities), a few million operations.
 */
export function greedyPlace(scen: Scenario[], pop: ArrayLike<number>, opts: { k: number; tProc: number; tEvac: number }) {
  const S = scen.length, C = pop.length, M = scen[0]?.cand.length ?? 0;
  // first[s] = earliest detection so far in scenario s (Infinity = no buoys yet)
  const first = new Float64Array(S).fill(Infinity);
  const picks: number[] = [], protectedPeople: number[] = [];
  const score = (cand: number) => {
    let people = 0, peopleMin = 0;
    for (let s = 0; s < S; s++) {
      const det = Math.min(first[s], cand < 0 ? Infinity : scen[s].cand[cand]);
      if (det === Infinity) continue;
      const city = scen[s].city;
      for (let c = 0; c < C; c++) {
        if (!Number.isFinite(city[c])) continue;
        const lead = city[c] - (det + opts.tProc);
        if (lead >= opts.tEvac) people += pop[c];
        if (lead > 0) peopleMin += (pop[c] * Math.min(lead, 3600)) / 60;
      }
    }
    return { people, peopleMin };
  };
  for (let k = 0; k < opts.k; k++) {
    let best = -1, bp = -1, bm = -1;
    for (let m = 0; m < M; m++) {
      if (picks.includes(m)) continue;
      const { people, peopleMin } = score(m);
      if (people > bp || (people === bp && peopleMin > bm)) { best = m; bp = people; bm = peopleMin; }
    }
    if (best < 0) break;
    picks.push(best);
    protectedPeople.push(bp);
    for (let s = 0; s < S; s++) first[s] = Math.min(first[s], scen[s].cand[best]);
  }
  return { picks, protectedPeople };
}

/** How a fixed sensor set performs across scenarios: total people warned (summed over
 *  scenarios) and, per city, in how many scenarios it was reached and warned in time. */
export function coverage(scen: Scenario[], set: number[], pop: ArrayLike<number>, opts: { tProc: number; tEvac: number }) {
  const C = pop.length;
  const warned = new Int32Array(C), reached = new Int32Array(C);
  let people = 0;
  for (const s of scen) {
    let det = Infinity;
    for (const m of set) det = Math.min(det, s.cand[m]);
    for (let c = 0; c < C; c++) {
      if (!Number.isFinite(s.city[c])) continue;
      reached[c]++;
      if (s.city[c] - (det + opts.tProc) >= opts.tEvac) { warned[c]++; people += pop[c]; }
    }
  }
  return { people, warned, reached };
}
