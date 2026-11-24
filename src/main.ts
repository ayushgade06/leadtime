import 'leaflet/dist/leaflet.css';
import './style.css';
import L from 'leaflet';
import { INDIAN_OCEAN, cellOf } from './geo';
import { loadBathy } from './bathy';
import { createMap, createLayer, drawDepth, drawEta, drawEtaMax, drawIsochrones, isochroneLabels, clear } from './render';
import { customQuake, nearestTrench, quake2004, type Quake } from './scenarios';
import { T_MAX, type FromWorker, type ToWorker } from './worker';
import { evaluate, headlineHTML, liveSummary, loadCities, renderCities, type Eval } from './ui';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const { grid, b } = await loadBathy(INDIAN_OCEAN, [-20, 80]);
const N = grid.N;
const wet = Uint8Array.from(b, (v) => (v < 0 ? 1 : 0));

const { map, bounds } = createMap($('map'), grid);
const depthLayer = createLayer(map, grid, bounds, 'layer-depth');
const maxLayer = createLayer(map, grid, bounds, 'layer-max');
const waveLayer = createLayer(map, grid, bounds, 'layer-wave');
const isoLayer = createLayer(map, grid, bounds, 'layer-iso');
drawDepth(depthLayer, b);
const isoLabels = L.layerGroup().addTo(map);
const cityLayer = L.layerGroup().addTo(map);
const buoyLayer = L.layerGroup().addTo(map);
$('loading').hidden = true;

const cities = loadCities(grid, b);

// ---- simulation state -------------------------------------------------------------------
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
const send = (m: ToWorker) => worker.postMessage(m);
send({ type: 'init', domain: INDIAN_OCEAN, b });

let quake: Quake | null = null;
let playing = false, rate = 1200, simT = 0, finished = false;
let latest: (FromWorker & { type: 'frame' }) | null = null;
let etaMax: Float32Array | null = null, tArrive: Float32Array | null = null;
const epiMarker = L.marker([0, 0], { icon: L.divIcon({ className: 'epi-marker', iconSize: [18, 18] }), keyboard: false, interactive: false });

let recordersDirty = false;
worker.onmessage = (e: MessageEvent<FromWorker>) => {
  const m = e.data;
  if (m.type !== 'frame') return;
  // Ack right away (not after painting) so a throttled/background tab can't stall the physics.
  send({ type: 'ack' });
  if (!latest) requestAnimationFrame(drawFrame);
  latest = m;
  simT = m.t;
  if (m.etaMax) { etaMax = m.etaMax; tArrive = m.tArrive!; recordersDirty = true; finished = m.done; refreshWarnings(m.done); }
  if (m.done) setPlaying(false);
};

function drawFrame() {
  const m = latest;
  if (!m) return;
  latest = null;
  if (layerOn('wave')) drawEta(waveLayer, m.eta, wet);
  if (recordersDirty) { recordersDirty = false; redrawRecorders(); }
  $('clock').textContent = `+${hhmm(m.t)}`;
  $('bar').style.width = `${Math.min(100, (100 * m.t) / T_MAX)}%`;
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

// Debug/validation handle (also used by browser checks).
Object.assign(window, { leadtime: { grid, b, cities, map, get tArrive() { return tArrive; }, get etaMax() { return etaMax; } } });

const hhmm = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
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
  finished = false;
  clear(maxLayer); clear(isoLayer); isoLabels.clearLayers();
  epiMarker.setLatLng([q.lat, q.lon]).addTo(map);
  $('hud').hidden = false;
  $('quake-info').textContent = `${q.label} · ${q.segments.length} fault segment${q.segments.length > 1 ? 's' : ''}, ` +
    `${Math.round(q.segments.reduce((s, x) => s + x.lengthKm, 0))} km of rupture`;
  send({ type: 'start', segments: q.segments });
  setPlaying(autoplay);
  refreshWarnings(false);
}

// ---- warning engineer: sensors, cities, headline ----------------------------------------
const MAX_BUOYS = 8, MIN_BUOY_DEPTH = 1000;
interface Buoy { marker: L.Marker; cell: number }
let buoys: Buoy[] = [];
const minutes = (id: string) => Number($<HTMLInputElement>(id).value) * 60;
let lastEval: Eval | null = null;

function buoyIcon(n: number, cls = '') {
  return L.divIcon({ className: `buoy-marker ${cls}`, html: `<span>${n}</span>`, iconSize: [24, 24] });
}

function depthAt(lat: number, lon: number) {
  const c = cellOf(grid, lat, lon);
  return c ? { cell: c.j * N + c.i, depth: -b[c.j * N + c.i] } : null;
}

function addBuoy(lat: number, lon: number, cls = ''): string | null {
  if (buoys.length >= MAX_BUOYS) return `You already have ${MAX_BUOYS} sensors. Remove one first.`;
  const d = depthAt(lat, lon);
  if (!d || d.depth < MIN_BUOY_DEPTH)
    return `Too shallow here (${d ? Math.max(0, Math.round(d.depth)) : 0} m). DART-style pressure sensors sit on the deep-ocean floor; this tool needs > ${MIN_BUOY_DEPTH} m.`;
  const marker = L.marker([lat, lon], { icon: buoyIcon(buoys.length + 1, cls), draggable: true, keyboard: true, title: 'Sensor (drag to move, right-click to remove)' });
  const buoy: Buoy = { marker, cell: d.cell };
  let from = marker.getLatLng();
  marker.on('dragstart', () => (from = marker.getLatLng()));
  marker.on('dragend', () => {
    const p = marker.getLatLng(), dd = depthAt(p.lat, p.lng);
    if (!dd || dd.depth < MIN_BUOY_DEPTH) { marker.setLatLng(from); toast(`Too shallow there. Sensors need > ${MIN_BUOY_DEPTH} m of water.`); return; }
    buoy.cell = dd.cell;
    refreshWarnings(finished);
  });
  marker.on('contextmenu', () => removeBuoy(buoy));
  marker.addTo(buoyLayer);
  buoys.push(buoy);
  renumberBuoys();
  refreshWarnings(finished);
  return null;
}

function removeBuoy(bu: Buoy) {
  buoyLayer.removeLayer(bu.marker);
  buoys = buoys.filter((x) => x !== bu);
  renumberBuoys();
  refreshWarnings(finished);
}

function renumberBuoys() {
  buoys.forEach((bu, i) => bu.marker.setIcon(buoyIcon(i + 1, bu.marker.options.icon?.options.className?.includes('opt') ? 'opt' : '')));
  $('buoy-count').textContent = `${buoys.length} / ${MAX_BUOYS}`;
  const list = $('buoy-list');
  list.innerHTML = '';
  buoys.forEach((bu, i) => {
    const p = bu.marker.getLatLng();
    const li = document.createElement('li');
    li.innerHTML = `<span class="num">#${i + 1} · ${p.lat.toFixed(1)}°, ${p.lng.toFixed(1)}° · ${Math.round(-b[bu.cell])} m deep</span>`;
    const x = document.createElement('button');
    x.className = 'btn icon ghost'; x.textContent = '✕'; x.setAttribute('aria-label', `Remove sensor ${i + 1}`);
    x.onclick = () => removeBuoy(bu);
    li.append(x);
    list.append(li);
  });
}

function refreshWarnings(done: boolean) {
  $('tproc-v').textContent = `${minutes('tproc') / 60} min`;
  $('tevac-v').textContent = `${minutes('tevac') / 60} min`;
  if (!tArrive) { $('headline').textContent = quake ? 'Simulating…' : 'Run an earthquake first (tab 1).'; $('city-rows').innerHTML = ''; cityLayer.clearLayers(); return; }
  const ev = evaluate(cities, tArrive, etaMax, buoys.map((x) => x.cell), minutes('tproc'), minutes('tevac'));
  lastEval = ev;
  $('headline').innerHTML = headlineHTML(ev, minutes('tevac'), done);
  renderCities($('city-rows'), ev, done, buoys.length);
  cityLayer.clearLayers();
  for (const r of ev.rows) {
    const reached = Number.isFinite(r.arrive);
    L.circleMarker([r.city.lat, r.city.lon], {
      radius: 3 + Math.sqrt(r.city.population / 1e6) * 2.5, weight: 1.5,
      color: !reached ? '#5b6b7d' : r.safe ? '#4fd69c' : '#ff6b5a', fillOpacity: 0.35,
    }).bindTooltip(`${r.city.name}`, { direction: 'top' }).addTo(cityLayer);
  }
  if (done) $('live').textContent = liveSummary(ev, buoys.length);
}

$('city-rows').addEventListener('click', (e) => {
  const tr = (e.target as HTMLElement).closest('tr');
  if (tr && lastEval) { const c = lastEval.rows[Number(tr.dataset.i)].city; map.flyTo([c.lat, c.lon], 6, { duration: 0.8 }); }
});
$('city-rows').addEventListener('keydown', (e) => { if (e.key === 'Enter') (e.target as HTMLElement).click(); });
$('tproc').oninput = $('tevac').oninput = () => refreshWarnings(finished);
$('clear-buoys').onclick = () => { buoyLayer.clearLayers(); buoys = []; renumberBuoys(); refreshWarnings(finished); };

let toastTimer = 0;
function toast(msg: string) {
  let t = document.querySelector<HTMLElement>('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.querySelector('.stage')!.append(t); }
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (t!.hidden = true), 4000);
}

// ---- tabs -------------------------------------------------------------------------------
let activeTab = 'quake';
function selectTab(id: string) {
  activeTab = id;
  document.querySelectorAll<HTMLButtonElement>('[role=tab]').forEach((t) => {
    const on = t.id === `tab-${id}`;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    $(t.getAttribute('aria-controls')!).hidden = !on;
  });
  $('map').dataset.mode = id === 'warn' ? 'sensor' : 'quake';
}
document.querySelectorAll<HTMLButtonElement>('[role=tab]').forEach((t, i, all) => {
  t.onclick = () => selectTab(t.id.slice(4));
  t.onkeydown = (e) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (d) { const n = all[(i + d + all.length) % all.length]; n.focus(); n.click(); }
  };
});
selectTab('quake');

// ---- quake controls ---------------------------------------------------------------------
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
  const { lat, lng } = e.latlng;
  if (activeTab === 'warn') { const err = addBuoy(lat, lng); if (err) toast(err); return; }
  const c = cellOf(grid, lat, lng);
  if (!c || !wet[c.j * N + c.i]) { toast('Click on the ocean to place an earthquake.'); return; }
  // Near a subduction trench, align the fault with it (that's where megathrust quakes happen).
  const tr = nearestTrench(lat, lng);
  if (tr) { strikeIn.value = String(Math.round(tr.strikeDeg)); syncLabels(); }
  startQuake(customQuake(lat, lng, Number(mwIn.value), Number(strikeIn.value)));
});

