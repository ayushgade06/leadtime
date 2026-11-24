// Web Worker: runs the solver off the main thread so the map stays smooth.
//  • playback: steps the live simulation and streams η frames (transferable Float32Arrays)
//  • batch:    runs many scenarios headless and returns arrival times at chosen cells (optimizer)
import { makeGrid, type Domain, type Grid } from './geo';
import { T_MAX, addSurface, createSim, step, type Sim } from './solver';
import { surfaceFromSegment, type Segment } from './source';

export type ToWorker =
  | { type: 'init'; domain: Domain; b: Float32Array }
  | { type: 'start'; segments: Segment[] }
  | { type: 'play'; rate: number }
  | { type: 'pause' }
  | { type: 'ack' }
  | { type: 'batch'; scenarios: Segment[][]; cells: Int32Array; domain: Domain; b: Float32Array };

export type FromWorker =
  | { type: 'frame'; t: number; eta: Float32Array; etaMax?: Float32Array; tArrive?: Float32Array; done: boolean; msPerStep: number }
  | { type: 'progress'; done: number; total: number }
  | { type: 'batch-result'; tArrive: Float32Array[]; etaMax: Float32Array[] };

let grid: Grid, bed: Float32Array, sim: Sim | null = null;
let playing = false, rate = 1200, waitingAck = false, frames = 0, msPerStep = 0, lastTick = 0;

const post = (m: FromWorker, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(m, transfer);

/** Build a simulation with every fault segment scheduled at its trigger time. */
function newSim(g: Grid, b: Float32Array, segments: Segment[]) {
  const s = createSim(g.N, g.N, b, g.rowSize, { sponge: Math.round((20 * g.N) / 512) });
  for (const seg of segments) addSurface(s, surfaceFromSegment(g, seg), seg.triggerTimeS ?? 0);
  return s;
}

function sendFrame(full: boolean) {
  if (!sim) return;
  const done = sim.t >= T_MAX;
  const eta = Float32Array.from(sim.eta);
  const m: FromWorker = { type: 'frame', t: sim.t, eta, done, msPerStep };
  const tr: Transferable[] = [eta.buffer];
  if (full || done) {
    m.etaMax = sim.etaMax.slice(); m.tArrive = sim.tArrive.slice();
    tr.push(m.etaMax.buffer, m.tArrive.buffer);
  }
  waitingAck = true;
  post(m, tr);
}

function tick() {
  if (!playing || !sim || waitingAck) return;
  // Advance `rate` simulated seconds per real second at ~30 frames/s, capped at ~40 ms work.
  const t0 = performance.now();
  lastTick = t0;
  const target = Math.min(T_MAX, sim.t + rate / 30);
  let n = 0;
  const budget = rate > 1e6 ? 90 : 40; // "Max" trades frame rate for simulation speed
  while (sim.t < target && performance.now() - t0 < budget) { step(sim); n++; }
  if (n) msPerStep = 0.9 * msPerStep + 0.1 * ((performance.now() - t0) / n);
  if (sim.t >= T_MAX) playing = false;
  sendFrame(++frames % 8 === 0);
}

self.onmessage = (e: MessageEvent<ToWorker>) => {
  const m = e.data;
  switch (m.type) {
    case 'init':
      grid = makeGrid(m.domain); bed = m.b; sim = null; break;
    case 'start':
      sim = newSim(grid, bed, m.segments); frames = 0; waitingAck = false; sendFrame(true); break;
    case 'play':
      playing = true; rate = m.rate; if (!waitingAck) tick(); break;
    case 'pause':
      playing = false; break;
    case 'ack':
      // pace playback at ~30 frames per second of wall-clock time
      waitingAck = false; setTimeout(tick, Math.max(0, 33 - (performance.now() - lastTick))); break;
    case 'batch': {
      const g = makeGrid(m.domain);
      const tArrive: Float32Array[] = [], etaMax: Float32Array[] = [];
      m.scenarios.forEach((segs, s) => {
        const bs = newSim(g, m.b, segs);
        while (bs.t < T_MAX) step(bs);
        tArrive.push(Float32Array.from(m.cells, (c) => (c < 0 ? Infinity : bs.tArrive[c])));
        etaMax.push(Float32Array.from(m.cells, (c) => (c < 0 ? 0 : bs.etaMax[c])));
        post({ type: 'progress', done: s + 1, total: m.scenarios.length });
      });
      post({ type: 'batch-result', tArrive, etaMax });
      break;
    }
  }
};
