import { describe, expect, it } from 'vitest';
import { INDIAN_OCEAN, cellOf, makeGrid, tileOf } from '../src/geo';

describe('geo', () => {
  it('finds the known z4 tile for the open Indian Ocean', () => {
    // z4/11/7 was used to verify Terrarium has ocean depths (about 0–22°S, 67.5–90°E).
    expect(tileOf(-10, 80, 4)).toEqual({ x: 11, y: 8 });
    expect(tileOf(10, 80, 4)).toEqual({ x: 11, y: 7 });
  });

  it('covers 41°N–41°S and 22.5°E–112.5°E', () => {
    const g = makeGrid(INDIAN_OCEAN);
    expect(g.bbox.west).toBeCloseTo(22.5, 6);
    expect(g.bbox.east).toBeCloseTo(112.5, 6);
    expect(g.bbox.north).toBeCloseTo(40.98, 1);
    expect(g.bbox.south).toBeCloseTo(-40.98, 1);
  });

  it('cell size is ~19.6 km at the equator and halves at 60°', () => {
    const g = makeGrid(INDIAN_OCEAN);
    const eq = g.rowSize[255]; // row just north of the equator
    expect(eq / 1000).toBeCloseTo(19.57, 1);
    // Mercator scale on a whole-world grid: s(60°)/s(0°) = cos 60° = 0.5
    const w = makeGrid({ z: 2, x0: 0, y0: 0, n: 4, N: 2048 });
    const nearest = (lat: number) => w.lat.reduce((b, l, k) => (Math.abs(l - lat) < Math.abs(w.lat[b] - lat) ? k : b), 0);
    expect(w.rowSize[nearest(60)] / w.rowSize[nearest(0)]).toBeCloseTo(0.5, 2);
  });

  it('maps lat/lon to the right cell', () => {
    const g = makeGrid(INDIAN_OCEAN);
    const c = cellOf(g, 0, 67.5)!;
    expect(c.i).toBe(256);
    expect(c.j).toBe(256);
    expect(cellOf(g, 50, 80)).toBeNull();
  });
});
