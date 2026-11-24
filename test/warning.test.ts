import { describe, expect, it } from 'vitest';
import { greedyPlace, leadTime, type Scenario } from '../src/warning';

describe('warning time', () => {
  it('lead = city arrival − (first buoy detection + processing)', () => {
    expect(leadTime(3600, [1200, 900], 600)).toBe(3600 - 900 - 600);
    expect(leadTime(3600, [], 600)).toBe(-Infinity); // no sensors
    expect(leadTime(Infinity, [100], 600)).toBe(Infinity); // wave never arrives
  });
});

describe('greedy optimizer', () => {
  // 3 candidates, 2 cities, 2 scenarios. Candidate 1 detects both quakes early enough to warn
  // the big city; candidate 0 only helps scenario A; candidate 2 detects nothing in time.
  const scen: Scenario[] = [
    { cand: Float32Array.from([300, 300, 5000]), city: Float32Array.from([3000, 1500]) }, // A
    { cand: Float32Array.from([4000, 400, 5000]), city: Float32Array.from([3000, 1500]) }, // B
  ];
  const pop = [1_000_000, 10_000];
  const opts = { tProc: 600, tEvac: 900 };

  it('finds the obvious best sensor first', () => {
    const r = greedyPlace(scen, pop, { ...opts, k: 1 });
    expect(r.picks).toEqual([1]);
    expect(r.protectedPeople[0]).toBe(2 * 1_000_000); // big city warned in both scenarios
  });

  it('never decreases coverage as sensors are added (diminishing returns)', () => {
    const r = greedyPlace(scen, pop, { ...opts, k: 3 });
    for (let k = 1; k < r.protectedPeople.length; k++) expect(r.protectedPeople[k]).toBeGreaterThanOrEqual(r.protectedPeople[k - 1]);
  });
});
