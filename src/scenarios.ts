// Earthquake presets and the synthetic scenario library used by the optimizer.
import trenches from './data/trenches.json';
import physics from './data/physics.json';
import { distanceKm } from './geo';
import { segmentFromMw, segments2004, type Segment } from './source';

export interface Quake {
  id: string;
  label: string;
  lat: number;
  lon: number;
  mw: number;
  strikeDeg: number;
  segments: Segment[];
}

/** 2004 Sumatra–Andaman: USGS epicentre and Mw, rupture from Grilli et al. 2007 (5 segments). */
export function quake2004(): Quake {
  const e = physics.rupture2004.epicenterUSGS.value;
  return { id: '2004', label: '2004 Sumatra–Andaman', lat: e.lat, lon: e.lon, mw: 9.1, strikeDeg: 329, segments: segments2004() };
}

/** A single-segment quake sized by Strasser et al. 2010 scaling. */
export function customQuake(lat: number, lon: number, mw: number, strikeDeg: number): Quake {
  return { id: 'custom', label: `Mw ${mw.toFixed(1)} at ${lat.toFixed(1)}°, ${lon.toFixed(1)}°`, lat, lon, mw, strikeDeg, segments: [segmentFromMw(lat, lon, mw, strikeDeg)] };
}

/** Nearest trench point within `maxKm`, with the fault strike implied there
 *  (the trench/ocean side lies 90° left of strike, so strike = oceanAzimuth + 90°). */
export function nearestTrench(lat: number, lon: number, maxKm = 350) {
  let best: { km: number; strikeDeg: number; trench: string } | null = null;
  for (const t of trenches.trenches)
    t.points.forEach((p, k) => {
      const km = distanceKm(lat, lon, p[0], p[1]);
      if (km < maxKm && (!best || km < best.km)) best = { km, strikeDeg: (t.oceanAzimuthDeg[k] + 90) % 360, trench: t.name };
    });
  return best as { km: number; strikeDeg: number; trench: string } | null;
}

/**
 * Synthetic library for the optimizer: Mw 8.8 events about every `spacingKm` along each trench
 * polyline (Bird 2003, PB2002). Each epicentre sits a little landward of the trench line
 * (where megathrust slip is centred), with strike following the trench.
 */
export function scenarioLibrary(mw = 8.8, spacingKm = 330): Quake[] {
  const out: Quake[] = [];
  for (const t of trenches.trenches) {
    let along = spacingKm / 2;
    for (let k = 1; k < t.points.length; k++) {
      const [la0, lo0] = t.points[k - 1], [la1, lo1] = t.points[k];
      const seg = distanceKm(la0, lo0, la1, lo1);
      while (along <= seg) {
        const f = along / seg, lat = la0 + f * (la1 - la0), lon = lo0 + f * (lo1 - lo0);
        const az = (t.oceanAzimuthDeg[k] * Math.PI) / 180;
        // shift 60 km landward (opposite the ocean azimuth) so the uplift lobe sits on the trench
        const dLat = (-60 * Math.cos(az)) / 111.195, dLon = (-60 * Math.sin(az)) / (111.195 * Math.cos((lat * Math.PI) / 180));
        const q = customQuake(lat + dLat, lon + dLon, mw, (t.oceanAzimuthDeg[k] + 90) % 360);
        out.push({ ...q, id: `${t.name}-${out.length}`, label: `${t.name.split(' ')[0]} Mw ${mw}` });
        along += spacingKm;
      }
      along -= seg;
    }
  }
  return out;
}
