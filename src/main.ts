import 'leaflet/dist/leaflet.css';
import './style.css';
import L from 'leaflet';
import { INDIAN_OCEAN, cellOf, makeGrid } from './geo';
import { keepConnectedOcean, loadBathy } from './bathy';
import buoysData from './data/buoys.json';
import { coverage, greedyPlace, snapToOcean, type Scenario } from './warning';
import { createMap, createLayer, drawDepth, drawEta, drawEtaMax, drawIsochrones, isochroneLabels, clear } from './render';
import { customQuake, nearestTrench, quake2004, scenarioLibrary, type Quake } from './scenarios';
import type { FromWorker, ToWorker } from './worker';
import { T_MAX } from './solver';
import { run2004, runPhysicsTests, scatterSVG, validationTableHTML, type ValidationResult } from './science';
import { evaluate, fmtPeople, gainChartSVG, headlineHTML, liveSummary, loadCities, renderCities, type Eval } from './ui';

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
  if (!d || (d.depth < MIN_BUOY_DEPTH && cls !== 'opt'))
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
  renderCities($('city-rows'), ev, done, buoys.length, libHits ?? undefined);
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

// ---- optimizer: scenario library + greedy placement -----------------------------------
// The library runs on a coarser 256² grid (cells ~39 km): 8× less work per quake, so ~15
// earthquakes simulate in parallel workers in well under a minute.
const LIB = { ...INDIAN_OCEAN, N: 256 };
const libGrid = makeGrid(LIB);
const libB = new Float32Array(LIB.N * LIB.N);
for (let j = 0; j < LIB.N; j++)
  for (let i = 0; i < LIB.N; i++) {
    const k = 2 * j * N + 2 * i;
    libB[j * LIB.N + i] = (b[k] + b[k + 1] + b[k + N] + b[k + N + 1]) / 4;
  }
keepConnectedOcean(libB, LIB.N, cellOf(libGrid, -20, 80)!);
// Keep epicentres out of the absorbing sponge at the east edge (112.5°E).
const library = scenarioLibrary(8.8, 300).filter((q) => q.lon < 110.5);
$('lib-n').textContent = String(library.length);
// Candidate sensor sites: every 3rd cell (≈ every 6th at full resolution) deeper than 1000 m,
// outside the sponge; then the real listed stations, so they can be scored the same way.
const SPONGE = Math.round((20 * LIB.N) / 512);
const candCells: number[] = [];
for (let j = SPONGE; j < LIB.N - SPONGE; j += 3)
  for (let i = SPONGE; i < LIB.N - SPONGE; i += 3) if (-libB[j * LIB.N + i] > 1000) candCells.push(j * LIB.N + i);
const nGrid = candCells.length;
const realBuoys = buoysData.buoys.map((bu) => ({ ...bu, cell: cellOf(libGrid, bu.lat, bu.lon) }));
for (const rb of realBuoys) candCells.push(rb.cell ? rb.cell.j * LIB.N + rb.cell.i : -1);
const libCityCells = cities.map((c) => snapToOcean(libGrid, libB, c.lat, c.lon, 50));
const libPop = cities.map((c) => (c.sheltered ? 0 : c.population));
let libScen: Scenario[] | null = null;
let libHits: Map<string, { warned: number; reached: number }> | null = null;
const libLayer = L.layerGroup();

function runLibrary(): Promise<Scenario[]> {
  const cells = Int32Array.from([...candCells, ...libCityCells]);
  const W = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1));
  let done = 0;
  const parts = Array.from({ length: W }, (_, w) => library.filter((_, i) => i % W === w));
  return Promise.all(parts.map((part) => new Promise<Float32Array[]>((resolve) => {
    const wk = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    wk.onmessage = (e: MessageEvent<FromWorker>) => {
      const m = e.data;
      if (m.type === 'progress') {
        done++;
        $('opt-bar').style.width = `${(100 * done) / library.length}%`;
        $('opt-status').textContent = `Simulating ${library.length} earthquakes… ${done} / ${library.length}`;
      } else if (m.type === 'batch-result') { wk.terminate(); resolve(m.tArrive); }
    };
    wk.postMessage({ type: 'batch', scenarios: part.map((q) => q.segments), cells, domain: LIB, b: libB } satisfies ToWorker);
  }))).then((res) => {
    // undo the round-robin split so scenario order matches `library`
    const out: Scenario[] = new Array(library.length);
    res.forEach((arrs, w) => arrs.forEach((tA, k) => {
      out[k * W + w] = { cand: tA.subarray(0, candCells.length), city: tA.subarray(candCells.length) };
    }));
    return out;
  });
}

const latLonOfLib = (cell: number) => ({ lat: libGrid.lat[Math.floor(cell / LIB.N)], lon: libGrid.lon[cell % LIB.N] });

async function optimize() {
  const K = Number($<HTMLSelectElement>('opt-k').value);
  const btn = $<HTMLButtonElement>('optimize');
  btn.disabled = true;
  libLayer.clearLayers().addTo(map);
  for (const q of library) L.circleMarker([q.lat, q.lon], { radius: 5, color: '#ffb547', weight: 1, fillOpacity: 0.15, interactive: false }).addTo(libLayer);
  if (!libScen) {
    $('opt-progress').hidden = false;
    const t0 = performance.now();
    libScen = await runLibrary();
    $('opt-status').textContent = `Simulated ${library.length} earthquakes in ${((performance.now() - t0) / 1000).toFixed(0)} s.`;
  }
  const opts = { k: K, tProc: minutes('tproc'), tEvac: minutes('tevac') };
  const gridOnly = libScen.map((s) => ({ cand: s.cand.subarray(0, nGrid), city: s.city }));
  const res = greedyPlace(gridOnly, libPop, opts);
  const S = library.length;
  // Animate: clear the user's sensors, then drop the optimized ones in pick order.
  buoyLayer.clearLayers(); buoys = []; renumberBuoys();
  const gains = res.protectedPeople.map((p, i) => (p - (i ? res.protectedPeople[i - 1] : 0)) / S);
  $('opt-result').hidden = false;
  for (let i = 0; i < res.picks.length; i++) {
    const p = latLonOfLib(candCells[res.picks[i]]);
    addBuoy(p.lat, p.lon, 'opt');
    $('gain-chart').innerHTML = gainChartSVG(gains.slice(0, i + 1));
    await new Promise((r) => setTimeout(r, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450));
  }
  $('gain-chart').setAttribute('aria-label', `Extra people warned per quake for each added sensor: ${gains.map((g) => fmtPeople(Math.round(g))).join(', ')}`);
  // Score the real network with exactly the same metric.
  const realIdx = realBuoys.map((_, i) => nGrid + i).filter((i) => candCells[i] >= 0);
  const reportingIdx = realBuoys.map((rb, i) => (rb.reportingRecently ? nGrid + i : -1)).filter((i) => i >= 0 && candCells[i] >= 0);
  const best = coverage(libScen, res.picks, libPop, opts);
  const real = coverage(libScen, realIdx, libPop, opts);
  const rep = coverage(libScen, reportingIdx, libPop, opts);
  let reachedPop = 0;
  for (const s of libScen) s.city.forEach((t, c) => { if (Number.isFinite(t)) reachedPop += libPop[c]; });
  libHits = new Map(cities.map((c, i) => [c.name, { warned: best.warned[i], reached: best.reached[i] }]));
  $('opt-compare').innerHTML = `Across ${S} quakes, on average <strong>${fmtPeople(best.people / S)}</strong> of the ${fmtPeople(reachedPop / S)} people in reached cities get ≥ ${opts.tEvac / 60} min with these ${K} sensors.
    The ${realIdx.length} real stations we have positions for score ${fmtPeople(real.people / S)} (the ${reportingIdx.length} reporting on 24 Nov 2026: ${fmtPeople(rep.people / S)}).
    Real networks also weigh cost, maintenance, false alarms and politics, and Indonesia's buoys are missing from our data, so this is a teaching comparison, not a verdict.`;
  btn.disabled = false;
  refreshWarnings(finished);
}
$('optimize').onclick = () => void optimize();

const realLayer = L.layerGroup();
for (const rb of realBuoys)
  L.marker([rb.lat, rb.lon], { icon: L.divIcon({ className: 'buoy-marker real', html: '<span></span>', iconSize: [14, 14] }), keyboard: false })
    .bindTooltip(`${rb.name}<br>${rb.operator} · ${rb.reportingRecently ? 'reporting on 24 Nov 2026' : rb.status === 'historical' ? 'historical' : 'listed, not reporting'}`).addTo(realLayer);
$<HTMLInputElement>('lyr-real').onchange = (e) => ((e.target as HTMLInputElement).checked ? realLayer.addTo(map) : realLayer.remove());

// ---- science tab -----------------------------------------------------------------------
$('run-tests').onclick = async () => {
  $<HTMLButtonElement>('run-tests').disabled = true;
  $('tests-summary').textContent = 'Running…';
  const passed = await runPhysicsTests($('tests'));
  $('tests-summary').textContent = `${passed} of 6 checks passed.`;
  $<HTMLButtonElement>('run-tests').disabled = false;
};
let v2004: ValidationResult | null = null;
$('run-2004').onclick = async () => {
  const btn = $<HTMLButtonElement>('run-2004');
  btn.disabled = true;
  const t0 = performance.now();
  v2004 ??= await run2004(INDIAN_OCEAN, grid, b, (msg) => ($('v2004-status').textContent = msg));
  $('v2004-status').textContent = `Done in ${((performance.now() - t0) / 1000).toFixed(0)} s. Hover a dot for the station.`;
  $('v2004').hidden = false;
  $('v2004-summary').innerHTML = `Mean absolute error <strong class="num">${v2004.mae.toFixed(0)} min</strong> over ${v2004.n} tide gauges
    <span class="muted">(simulated waves arrive on average ${Math.abs(v2004.bias).toFixed(0)} min ${v2004.bias < 0 ? 'early' : 'late'}). Read at the ocean cell nearest each gauge; read further offshore (> 50 m deep, as the warning tool does) the error is ${v2004.maeDeep.toFixed(0)} min, always early, so warning times err on the short side. Hollow dots are soft checks left out of the error.</span>`;
  $('v2004-chart').innerHTML = scatterSVG(v2004);
  $('v2004-table').innerHTML = validationTableHTML(v2004);
  btn.disabled = false;
};

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

