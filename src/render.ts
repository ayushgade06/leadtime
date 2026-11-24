// Leaflet map + canvas overlays. Each overlay is an N×N canvas (1 pixel per grid cell)
// stretched over the domain's lat/lon box. Because the grid rows are Mercator pixel rows,
// it lines up exactly with Leaflet's Web-Mercator basemap.
import L from 'leaflet';
import type { Grid } from './geo';

export interface Layer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  img: ImageData;
  overlay: L.SVGOverlay;
}

export function createMap(el: HTMLElement, g: Grid) {
  const bounds = L.latLngBounds([g.bbox.south, g.bbox.west], [g.bbox.north, g.bbox.east]);
  const map = L.map(el, {
    zoomControl: false, worldCopyJump: false, maxBounds: bounds.pad(0.25), minZoom: 2, maxZoom: 9,
    zoomSnap: 0.25, attributionControl: true,
  });
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    attribution: 'Basemap &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors · Bathymetry: Terrain Tiles (Mapzen / AWS Open Data; ETOPO1, SRTM, GMTED)',
  }).addTo(map);
  map.fitBounds(bounds, { padding: [0, 0] });
  return { map, bounds };
}

export function createLayer(map: L.Map, g: Grid, bounds: L.LatLngBounds, className: string, pane?: string): Layer {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = g.N;
  const ctx = canvas.getContext('2d')!;
  // svgOverlay accepts any element; we hand it a canvas so we can repaint it every frame.
  const overlay = L.svgOverlay(canvas as unknown as SVGElement, bounds, { className, interactive: false, pane: pane ?? 'overlayPane' }).addTo(map);
  return { canvas, ctx, img: ctx.createImageData(g.N, g.N), overlay };
}

export const flush = (l: Layer) => l.ctx.putImageData(l.img, 0, 0);
export const clear = (l: Layer) => { l.img.data.fill(0); flush(l); };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function ramp(stops: [number, number, number, number][], t: number): [number, number, number, number] {
  t = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const k = Math.min(stops.length - 2, Math.floor(t)), f = t - k;
  return stops[k].map((v, c) => lerp(v, stops[k + 1][c], f)) as [number, number, number, number];
}

/** Seafloor depth tint: light teal on shelves to near-black in the trenches. Land transparent. */
export function drawDepth(l: Layer, b: Float32Array) {
  const stops: [number, number, number, number][] = [
    [64, 134, 150, 200], [22, 70, 98, 220], [11, 38, 62, 235], [6, 20, 36, 245], [3, 9, 18, 250],
  ];
  const d = l.img.data;
  for (let k = 0; k < b.length; k++) {
    if (b[k] >= 0) { d[4 * k + 3] = 0; continue; }
    const c = ramp(stops, Math.sqrt(-b[k] / 7000));
    d.set(c, 4 * k);
  }
  flush(l);
}

// Diverging, colour-blind-safe wave palette: blue troughs, transparent calm, orange crests.
// A symmetric soft-log scale keeps 1-cm far-field waves visible next to metre-high ones.
const E0 = 0.005, EMAX = 2;
const LUT = (() => {
  const lut = new Uint8ClampedArray(512 * 4);
  const neg: [number, number, number, number][] = [[120, 190, 255, 0], [70, 150, 255, 150], [40, 90, 230, 230], [30, 40, 170, 255]];
  const pos: [number, number, number, number][] = [[255, 200, 120, 0], [255, 170, 60, 160], [255, 110, 20, 235], [255, 240, 200, 255]];
  for (let k = 0; k < 512; k++) {
    const v = (k - 256) / 256;
    lut.set(v < 0 ? ramp(neg, -v) : ramp(pos, v), 4 * k);
  }
  return lut;
})();
const softLog = (e: number) => Math.sign(e) * Math.min(1, Math.log1p(Math.abs(e) / E0) / Math.log1p(EMAX / E0));

/** η snapshot (m) → colours. `wet` = 1 for ocean cells. */
export function drawEta(l: Layer, eta: Float32Array, wet: Uint8Array) {
  const d = l.img.data;
  for (let k = 0; k < eta.length; k++) {
    if (!wet[k]) { d[4 * k + 3] = 0; continue; }
    const idx = Math.max(0, Math.min(511, Math.round(256 + 255 * softLog(eta[k]))));
    d[4 * k] = LUT[4 * idx]; d[4 * k + 1] = LUT[4 * idx + 1]; d[4 * k + 2] = LUT[4 * idx + 2]; d[4 * k + 3] = LUT[4 * idx + 3];
  }
  flush(l);
}

/** "Energy beam" map of the highest crest per cell, log scale 1 cm → 2 m. */
export function drawEtaMax(l: Layer, etaMax: Float32Array, wet: Uint8Array) {
  const stops: [number, number, number, number][] = [[40, 20, 90, 0], [90, 30, 130, 170], [200, 60, 90, 220], [250, 140, 40, 240], [255, 235, 150, 255]];
  const d = l.img.data;
  for (let k = 0; k < etaMax.length; k++) {
    const e = etaMax[k];
    if (!wet[k] || e < 0.01) { d[4 * k + 3] = 0; continue; }
    d.set(ramp(stops, Math.log(e / 0.01) / Math.log(200)), 4 * k);
  }
  flush(l);
}

/** Hourly arrival isochrones: mark cells whose arrival hour differs from a neighbour's. */
export function drawIsochrones(l: Layer, tArrive: Float32Array, N: number) {
  const d = l.img.data;
  d.fill(0);
  const hour = (k: number) => (Number.isFinite(tArrive[k]) ? Math.floor(tArrive[k] / 3600) : -1);
  for (let j = 0; j < N - 1; j++)
    for (let i = 0; i < N - 1; i++) {
      const k = j * N + i, h = hour(k);
      if (h < 0) continue;
      const hr = hour(k + 1), hd = hour(k + N);
      if ((hr >= 0 && hr !== h) || (hd >= 0 && hd !== h)) d.set([235, 245, 255, 230], 4 * k);
    }
  flush(l);
}

/** One label position per hour: the isochrone cell whose bearing from the epicentre is
 *  closest to `bearingDeg` (pointed at open ocean so labels don't pile up on coasts). */
export function isochroneLabels(g: Grid, tArrive: Float32Array, epi: { lat: number; lon: number }, bearingDeg: number) {
  const N = g.N, best = new Map<number, { k: number; err: number }>();
  for (let j = 0; j < N - 1; j++)
    for (let i = 0; i < N - 1; i++) {
      const k = j * N + i, t = tArrive[k], tr = tArrive[k + 1];
      if (!Number.isFinite(t) || !Number.isFinite(tr)) continue;
      const h = Math.floor(t / 3600), hr = Math.floor(tr / 3600);
      if (h === hr) continue;
      const hh = Math.max(h, hr);
      const brg = (Math.atan2((g.lon[i] - epi.lon) * Math.cos((epi.lat * Math.PI) / 180), g.lat[j] - epi.lat) * 180) / Math.PI;
      const err = Math.abs(((brg - bearingDeg + 540) % 360) - 180);
      if (!best.has(hh) || err < best.get(hh)!.err) best.set(hh, { k, err });
    }
  return [...best.entries()].filter(([, v]) => v.err < 25).map(([h, v]) => ({ hour: h, lat: g.lat[Math.floor(v.k / N)], lon: g.lon[v.k % N] }));
}
