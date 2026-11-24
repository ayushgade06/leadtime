// Science tab: re-runs the solver's physics tests live, and checks the 2004 simulation
// against tide-gauge arrival times published after the event.
import obs from './data/obs2004.json';
import { massConservation, oceanAtRest, radialSymmetry, shelfSlowdown, sourceScaling, waveSpeed } from './validation';
import { snapToOcean } from './warning';
import { segments2004 } from './source';
import type { Grid, Domain } from './geo';
import type { FromWorker, ToWorker } from './worker';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const nextFrame = () => new Promise((r) => setTimeout(r, 30));

interface TestRow { name: string; measured: string; expected: string; pass: boolean; chart?: string }

/** Tiny SVG line chart. */
function lineChart(xs: number[], ys: number[], o: { w?: number; h?: number; xLabel: string; yLabel: string; yFmt?: (v: number) => string; ref?: number[] }) {
  const w = o.w ?? 340, h = o.h ?? 130, pl = 44, pb = 26, pt = 10, pr = 8;
  const all = o.ref ? [...ys, ...o.ref] : ys;
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...all), y1 = Math.max(...all) || 1;
  const X = (v: number) => pl + ((w - pl - pr) * (v - x0)) / (x1 - x0 || 1);
  const Y = (v: number) => h - pb - ((h - pb - pt) * (v - y0)) / (y1 - y0 || 1);
  const path = (vs: number[]) => vs.map((v, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(v).toFixed(1)}`).join('');
  const f = o.yFmt ?? ((v: number) => v.toPrecision(2));
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" aria-hidden="true" class="sci-chart">
    <line x1="${pl}" x2="${w - pr}" y1="${h - pb}" y2="${h - pb}" class="axis"/><line x1="${pl}" x2="${pl}" y1="${pt}" y2="${h - pb}" class="axis"/>
    <text x="${pl - 4}" y="${pt + 8}" class="tick" text-anchor="end">${f(y1)}</text><text x="${pl - 4}" y="${h - pb}" class="tick" text-anchor="end">${f(y0)}</text>
    <text x="${(pl + w) / 2}" y="${h - 6}" class="tick" text-anchor="middle">${o.xLabel}</text>
    <text x="4" y="${pt - 1}" class="tick">${o.yLabel}</text>
    ${o.ref ? `<path d="${path(o.ref)}" class="ref"/>` : ''}<path d="${path(ys)}" class="line"/></svg>`;
}

export async function runPhysicsTests(list: HTMLElement) {
  list.innerHTML = '';
  const add = (r: TestRow) => {
    const li = document.createElement('li');
    li.className = r.pass ? 'pass' : 'fail';
    li.innerHTML = `<div class="t-head"><span class="badge">${r.pass ? 'PASS' : 'FAIL'}</span><strong>${r.name}</strong></div>
      <div class="t-vals num">measured ${r.measured} · expected ${r.expected}</div>${r.chart ?? ''}`;
    list.append(li);
  };
  const tests: (() => TestRow)[] = [
    () => {
      const r = massConservation();
      return { name: '1 · Mass conservation (closed basin, 2000 steps)', measured: `|ΔV|/V = ${r.value.toExponential(1)}`, expected: '< 1e-6', pass: r.value < 1e-6,
        chart: lineChart(r.series.x, r.series.y.map((v) => Math.log10(Math.max(v, 1e-18))), { xLabel: 'step', yLabel: 'log₁₀ volume error', yFmt: (v) => v.toFixed(0) }) };
    },
    () => { const r = oceanAtRest(); return { name: '2 · Ocean at rest over rough seafloor (1000 steps)', measured: `max |η| = ${r.value.toExponential(1)} m`, expected: '< 1e-6 m', pass: r.value < 1e-6 }; },
    () => { const r = waveSpeed(); const e = Math.abs(r.value - r.expected) / r.expected; return { name: '3 · Wave speed over 4000 m of water', measured: `${r.value.toFixed(1)} m/s`, expected: `√(g·h) = ${r.expected.toFixed(1)} m/s ± 5% (error ${(100 * e).toFixed(2)}%)`, pass: e < 0.05 }; },
    () => { const r = radialSymmetry(); return { name: '4 · Radial symmetry of a centred hump', measured: `max asymmetry ${r.value.toExponential(1)} m`, expected: '< 1e-5 m', pass: r.value < 1e-5 }; },
    () => {
      const r = shelfSlowdown(); const e = Math.abs(r.value - r.expected) / r.expected;
      return { name: '5 · Slowing over a continental shelf', measured: `${(r.value / 60).toFixed(1)} min`, expected: `∫dx/√(gh) = ${(r.expected / 60).toFixed(1)} min ± 10% (error ${(100 * e).toFixed(1)}%)`, pass: e < 0.1,
        chart: lineChart(r.series.x, r.series.y2, { xLabel: 'distance (km): deep ocean → slope → 100 m shelf', yLabel: 'wave speed √(gh), m/s', yFmt: (v) => v.toFixed(0) }) };
    },
    () => {
      const r = sourceScaling(); const ok = r.L > 600 && r.L < 800 && r.W > 170 && r.W < 240 && r.D > 8 && r.D < 20 && r.up > 0 && r.down < 0;
      return { name: '6 · Earthquake source at Mw 9.1 (Strasser 2010)', measured: `L ${r.L.toFixed(0)} km, W ${r.W.toFixed(0)} km, slip ${r.D.toFixed(1)} m, uplift +${r.up.toFixed(1)} m / ${r.down.toFixed(1)} m`, expected: 'L 600–800, W 170–240 km, slip 8–20 m, both lobes', pass: ok };
    },
  ];
  for (const t of tests) { await nextFrame(); add(t()); }
  return list.querySelectorAll('.pass').length;
}

export interface ValidationResult { rows: { name: string; obs: number; sim: number; simDeep: number; soft: boolean; source: string; url: string }[]; mae: number; bias: number; maeDeep: number; n: number }

/** Run the 2004 preset headless at full resolution and read arrivals at each tide gauge. */
export function run2004(domain: Domain, grid: Grid, b: Float32Array, onProgress: (msg: string) => void): Promise<ValidationResult> {
  const near = obs.stations.map((s) => snapToOcean(grid, b, s.lat, s.lon, 0));
  const deep = obs.stations.map((s) => snapToOcean(grid, b, s.lat, s.lon, 50));
  return new Promise((resolve) => {
    const wk = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    onProgress('Simulating 12 h of the 2004 tsunami at full resolution (about 30 s)…');
    wk.onmessage = (e: MessageEvent<FromWorker>) => {
      if (e.data.type !== 'batch-result') return;
      wk.terminate();
      const t = e.data.tArrive[0], n = obs.stations.length;
      const rows = obs.stations.map((s, i) => ({
        name: s.name, obs: s.arrivalMinutes, sim: t[i] / 60, simDeep: t[n + i] / 60,
        // Port Blair (possible land subsidence) and Kuraburi (gauge clock ~12 min off) are soft checks.
        soft: /UNCERTAIN|delayed by 12 minutes/.test(s.note ?? ''), source: s.source, url: s.url,
      }));
      const hard = rows.filter((r) => !r.soft && Number.isFinite(r.sim));
      const mae = hard.reduce((a, r) => a + Math.abs(r.sim - r.obs), 0) / hard.length;
      const bias = hard.reduce((a, r) => a + (r.sim - r.obs), 0) / hard.length;
      const maeDeep = hard.reduce((a, r) => a + Math.abs(r.simDeep - r.obs), 0) / hard.length;
      resolve({ rows, mae, bias, maeDeep, n: hard.length });
    };
    wk.postMessage({ type: 'batch', scenarios: [segments2004()], cells: Int32Array.from([...near, ...deep]), domain, b } satisfies ToWorker);
  });
}

/** Observed vs simulated arrival scatter with a 1:1 line. */
export function scatterSVG(v: ValidationResult) {
  const w = 340, h = 320, pl = 42, pb = 38, pt = 12, pr = 12, max = 660;
  const X = (m: number) => pl + ((w - pl - pr) * m) / max, Y = (m: number) => h - pb - ((h - pb - pt) * m) / max;
  const ticks = [0, 120, 240, 360, 480, 600];
  const grid = ticks.map((t) => `<line x1="${X(t)}" x2="${X(t)}" y1="${Y(0)}" y2="${Y(max)}" class="grid"/><line x1="${X(0)}" x2="${X(max)}" y1="${Y(t)}" y2="${Y(t)}" class="grid"/>
    <text x="${X(t)}" y="${h - pb + 14}" class="tick" text-anchor="middle">${t / 60} h</text><text x="${pl - 6}" y="${Y(t) + 3}" class="tick" text-anchor="end">${t / 60} h</text>`).join('');
  const pts = v.rows.filter((r) => Number.isFinite(r.sim)).map((r) =>
    `<g><circle cx="${X(r.obs).toFixed(1)}" cy="${Y(r.sim).toFixed(1)}" r="4.5" class="${r.soft ? 'soft' : 'pt'}"><title>${esc(r.name)}: observed ${r.obs.toFixed(0)} min, simulated ${r.sim.toFixed(0)} min${r.soft ? ' (soft check)' : ''}</title></circle></g>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" class="sci-chart scatter" role="img" aria-label="Observed versus simulated 2004 arrival times; mean absolute error ${v.mae.toFixed(1)} minutes over ${v.n} tide gauges">
    ${grid}<line x1="${X(0)}" y1="${Y(0)}" x2="${X(max)}" y2="${Y(max)}" class="one"/>
    <text x="${X(560)}" y="${Y(590)}" class="tick">1 : 1</text>${pts}
    <text x="${(pl + w) / 2}" y="${h - 6}" class="tick" text-anchor="middle">observed arrival (tide gauge)</text>
    <text x="10" y="${(h - pb) / 2}" class="tick" text-anchor="middle" transform="rotate(-90 10 ${(h - pb) / 2})">simulated arrival</text></svg>`;
}

export function validationTableHTML(v: ValidationResult) {
  const sources = [...new Map(v.rows.map((r) => [r.url, r.source.split(' (')[0].split(', doi')[0]])).entries()];
  return `<table class="cities val"><thead><tr><th>Gauge</th><th class="r">Observed</th><th class="r">Simulated</th><th class="r">Δ</th></tr></thead><tbody>
    ${v.rows.map((r) => `<tr class="${r.soft ? 'dim' : ''}"><th scope="row">${esc(r.name)}${r.soft ? ' <span class="sub">(soft)</span>' : ''}</th><td class="r num">${r.obs.toFixed(0)} min</td><td class="r num">${r.sim.toFixed(0)} min</td><td class="r num">${(r.sim - r.obs > 0 ? '+' : '') + (r.sim - r.obs).toFixed(0)}</td></tr>`).join('')}
    </tbody></table>
    <p class="hint">Sources: ${sources.map(([url, s]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(s)}</a>`).join('; ')}. Gauge coordinates from UHSLC / PSMSL station lists.</p>`;
}
