import 'leaflet/dist/leaflet.css';
import './style.css';
import L from 'leaflet';
import { INDIAN_OCEAN, cellOf } from './geo';
import { loadBathy } from './bathy';
import { createMap, createLayer, drawDepth, drawEta, drawEtaMax, drawIsochrones, isochroneLabels, clear } from './render';
import { customQuake, nearestTrench, quake2004, type Quake } from './scenarios';
import { T_MAX, type FromWorker, type ToWorker } from './worker';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const bathy = await loadBathy(INDIAN_OCEAN, [-20, 80]);
const { grid, b } = bathy;
const N = grid.N;
const wet = Uint8Array.from(b, (v) => (v < 0 ? 1 : 0));
{
  let min = 0, max = 0;
  for (const v of b) { if (v < min) min = v; if (v > max) max = v; }
  console.info(`[LeadTime] bathymetry ${N}×${N}: min ${min.toFixed(0)} m, max ${max.toFixed(0)} m`);
}

const { map, bounds } = createMap($('map'), grid);
const depthLayer = createLayer(map, grid, bounds, 'layer-depth');
const maxLayer = createLayer(map, grid, bounds, 'layer-max');
const waveLayer = createLayer(map, grid, bounds, 'layer-wave');
const isoLayer = createLayer(map, grid, bounds, 'layer-iso');
drawDepth(depthLayer, b);
const isoLabels = L.layerGroup().addTo(map);
$('loading').hidden = true;

// ---- simulation state -------------------------------------------------------------------
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
const send = (m: ToWorker) => worker.postMessage(m);
send({ type: 'init', domain: INDIAN_OCEAN, b });

let quake: Quake | null = null;
let playing = false, rate = 1200, simT = 0;
let latest: FromWorker & { type: 'frame' } | null = null;
let etaMax: Float32Array | null = null, tArrive: Float32Array | null = null;
const epiMarker = L.marker([0, 0], { icon: L.divIcon({ className: 'epi-marker', iconSize: [18, 18] }), keyboard: false, interactive: false });

worker.onmessage = (e: MessageEvent<FromWorker>) => {
  const m = e.data;
  if (m.type !== 'frame') return;
  latest = m;
  if (m.etaMax) etaMax = m.etaMax;
  if (m.tArrive) tArrive = m.tArrive;
  requestAnimationFrame(drawFrame);
};

function drawFrame() {
  const m = latest;
  if (!m) return;
  latest = null;
  simT = m.t;
  if (layerOn('wave')) drawEta(waveLayer, m.eta, wet);
  if (m.etaMax) redrawRecorders();
  $('clock').textContent = `+${hhmm(simT)}`;
  $('bar').style.width = `${(100 * simT) / T_MAX}%`;
  if (m.done) setPlaying(false);
  send({ type: 'ack' });
}

function redrawRecorders() {
  if (etaMax && layerOn('max')) drawEtaMax(maxLayer, etaMax, wet);
  if (tArrive && layerOn('iso')) {
    drawIsochrones(isoLayer, tArrive, N);
    isoLabels.clearLayers();
    if (quake)
      for (const l of isochroneLabels(grid, tArrive, quake, 200))
        L.marker([l.lat, l.lon], { icon: L.divIcon({ className: 'iso-label', html: `${l.hour} h`, iconSize: [30, 14] }), interactive: false, keyboard: false }).addTo(isoLabels);
  }
}

// Debug/validation handle (also used by the Science tab and browser checks).
Object.assign(window, { leadtime: { grid, b, get tArrive() { return tArrive; }, get etaMax() { return etaMax; } } });

const hhmm =(s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
const layerOn = (id: 'wave' | 'max' | 'iso') => $<HTMLInputElement>(`lyr-${id}`).checked;

function setPlaying(p: boolean) {
  playing = p;
  $('play').textContent = p ? '❚❚' : '▶';
  $('play').setAttribute('aria-label', p ? 'Pause' : 'Play');
  send(p ? { type: 'play', rate } : { type: 'pause' });
}

function startQuake(q: Quake, autoplay = true) {
  quake = q;
  etaMax = tArrive = null;
  clear(maxLayer); clear(isoLayer); isoLabels.clearLayers();
  epiMarker.setLatLng([q.lat, q.lon]).addTo(map);
  $('hud').hidden = false;
  $('quake-info').textContent = `${q.label} · ${q.segments.length} fault segment${q.segments.length > 1 ? 's' : ''}, ` +
    `${Math.round(q.segments.reduce((s, x) => s + x.lengthKm, 0))} km of rupture`;
  send({ type: 'start', segments: q.segments });
  setPlaying(autoplay);
}

// ---- controls ---------------------------------------------------------------------------
$('preset2004').onclick = () => startQuake(quake2004());
$('play').onclick = () => {
  if (!quake) return;
  if (!playing && simT >= T_MAX) return startQuake(quake);
  setPlaying(!playing);
};
$('reset').onclick = () => quake && startQuake(quake, false);
document.querySelectorAll<HTMLButtonElement>('.seg button').forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-checked', String(x === btn)));
    rate = Number(btn.dataset.rate);
    if (playing) send({ type: 'play', rate });
  };
});
for (const id of ['wave', 'max', 'iso'] as const)
  $<HTMLInputElement>(`lyr-${id}`).onchange = (e) => {
    const on = (e.target as HTMLInputElement).checked;
    const layer = { wave: waveLayer, max: maxLayer, iso: isoLayer }[id];
    if (!on) { clear(layer); if (id === 'iso') isoLabels.clearLayers(); } else redrawRecorders();
  };

const mwIn = $<HTMLInputElement>('mw'), strikeIn = $<HTMLInputElement>('strike');
const syncLabels = () => {
  $('mw-v').textContent = Number(mwIn.value).toFixed(1);
  $('strike-v').textContent = `${strikeIn.value}°`;
};
mwIn.oninput = strikeIn.oninput = syncLabels;
const rerunCustom = () => quake?.id === 'custom' && startQuake(customQuake(quake.lat, quake.lon, Number(mwIn.value), Number(strikeIn.value)));
mwIn.onchange = strikeIn.onchange = rerunCustom;
syncLabels();

map.on('click', (e: L.LeafletMouseEvent) => {
  const c = cellOf(grid, e.latlng.lat, e.latlng.lng);
  if (!c || !wet[c.j * N + c.i]) return;
  // Near a subduction trench, align the fault with it (that's where megathrust quakes happen).
  const tr = nearestTrench(e.latlng.lat, e.latlng.lng);
  if (tr) { strikeIn.value = String(Math.round(tr.strikeDeg)); syncLabels(); }
  startQuake(customQuake(e.latlng.lat, e.latlng.lng, Number(mwIn.value), Number(strikeIn.value)));
});
