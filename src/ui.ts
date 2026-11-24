// Panel UI: coastal-city table, headline numbers and the aria-live summary.
import citiesData from './data/cities.json';
import type { Grid } from './geo';
import { leadTime, snapToOcean } from './warning';

export interface City {
  name: string;
  country: string;
  lat: number;
  lon: number;
  population: number;
  popYear: number | null;
  /** Partly sheltered from the open Indian Ocean (Jakarta, Yangon...): left out of headline totals. */
  sheltered: boolean;
  url: string;
  /** Grid cell where we read the wave (nearest ocean cell deeper than 50 m). */
  cell: number;
}

export function loadCities(g: Grid, b: Float32Array): City[] {
  return citiesData.cities
    .map((c) => ({
      name: c.name, country: c.country, lat: c.lat, lon: c.lon, population: c.population, popYear: c.popYear,
      sheltered: !c.facesIndianOceanDirectly, url: c.url, cell: snapToOcean(g, b, c.lat, c.lon, 50),
    }))
    .filter((c) => c.cell >= 0);
}

export interface Row {
  city: City;
  arrive: number; // s, Infinity = not reached
  height: number; // m
  lead: number; // s; +Infinity not reached, −Infinity no sensor detected it
  safe: boolean;
}

export interface Eval {
  rows: Row[];
  protectedPop: number;
  reachedPop: number;
  warned: number;
  reachedCount: number;
}

export function evaluate(cities: City[], tArrive: Float32Array, etaMax: Float32Array | null, buoyCells: number[], tProc: number, tEvac: number): Eval {
  const buoyT = buoyCells.map((c) => tArrive[c]);
  const rows = cities.map((city) => {
    const arrive = tArrive[city.cell];
    const lead = leadTime(arrive, buoyT, tProc);
    return { city, arrive, height: etaMax ? etaMax[city.cell] : 0, lead, safe: Number.isFinite(arrive) && lead >= tEvac };
  });
  rows.sort((a, b) => a.arrive - b.arrive || b.city.population - a.city.population);
  let protectedPop = 0, reachedPop = 0, warned = 0, reachedCount = 0;
  for (const r of rows) {
    if (!Number.isFinite(r.arrive)) continue;
    reachedCount++;
    if (r.safe) warned++;
    if (r.city.sheltered) continue;
    reachedPop += r.city.population;
    if (r.safe) protectedPop += r.city.population;
  }
  return { rows, protectedPop, reachedPop, warned, reachedCount };
}

export const fmtPeople = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : n >= 1e3 ? `${Math.round(n / 1e3)} k` : `${n}`);
export const fmtDuration = (s: number) => `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')} min`;
export const fmtHM = (s: number) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;

function leadCell(r: Row, finished: boolean, nBuoys: number) {
  if (!Number.isFinite(r.arrive)) return `<span class="muted">${finished ? 'not reached' : '…'}</span>`;
  if (r.lead === -Infinity) return `<span class="bad" title="${nBuoys ? 'No sensor detected the wave before it arrived' : 'No sensors placed'}">✕ ${nBuoys ? 'undetected' : 'no sensor'}</span>`;
  const m = Math.round(r.lead / 60);
  return r.safe
    ? `<span class="good" title="Warned in time">✓ ${m} min</span>`
    : `<span class="bad" title="Not enough time to evacuate">✕ ${m} min</span>`;
}

export function renderCities(tbody: HTMLElement, ev: Eval, finished: boolean, nBuoys: number, scenarioHits?: Map<string, number>, scenarioCount?: number) {
  tbody.innerHTML = ev.rows
    .map((r, i) => {
      const reached = Number.isFinite(r.arrive);
      const prot = scenarioHits ? `<div class="sub">protected in ${scenarioHits.get(r.city.name) ?? 0} of ${scenarioCount} quakes</div>` : '';
      return `<tr data-i="${i}" tabindex="0" class="${reached ? '' : 'dim'}">
        <th scope="row">${r.city.sheltered ? '<span title="Partly sheltered; not counted in the headline">◐ </span>' : ''}${r.city.name}<div class="sub">${r.city.country}</div>${prot}</th>
        <td class="r num">${fmtPeople(r.city.population)}</td>
        <td class="r num">${reached ? fmtHM(r.arrive) : '—'}</td>
        <td class="r num">${reached && r.height > 0 ? `${Math.round(r.height * 100)} cm` : '—'}</td>
        <td class="r num">${leadCell(r, finished, nBuoys)}</td></tr>`;
    })
    .join('');
}

export function headlineHTML(ev: Eval, tEvac: number, finished: boolean) {
  if (!ev.reachedPop) return finished ? 'The wave reached none of the listed cities.' : 'Waiting for the wave to reach the coast…';
  const pct = Math.round((100 * ev.protectedPop) / ev.reachedPop);
  return `<strong class="num">${fmtPeople(ev.protectedPop)}</strong> people have ≥ ${Math.round(tEvac / 60)} min of confirmed warning
    <span class="muted">(${pct}% of the ${fmtPeople(ev.reachedPop)} people in coastal cities the wave ${finished ? 'reached' : 'has reached so far'})</span>`;
}

/** Plain-language summary for screen readers. */
export function liveSummary(ev: Eval, nBuoys: number) {
  const first = ev.rows.find((r) => Number.isFinite(r.arrive) && !r.city.sheltered);
  const parts = [];
  if (first) parts.push(`Wave reached ${first.city.name} at ${fmtDuration(first.arrive)}.`);
  parts.push(`${ev.warned} of ${ev.reachedCount} cities warned in time with ${nBuoys} sensor${nBuoys === 1 ? '' : 's'}.`);
  return parts.join(' ');
}
