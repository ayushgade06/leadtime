// Physics checks for the solver. The same cases run live in the app's Science tab (validation.ts).
import { describe, expect, it } from 'vitest';
import { massConservation, oceanAtRest, radialSymmetry, shelfSlowdown, waveSpeed, sourceScaling } from '../src/validation';

describe('solver physics', () => {
  it('1. conserves mass in a closed basin', () => {
    const r = massConservation();
    expect(r.value).toBeLessThan(1e-6);
  });

  it('2. keeps an ocean at rest over real-like bathymetry (well-balanced)', () => {
    expect(oceanAtRest().value).toBeLessThan(1e-6);
  });

  it('3. propagates at √(g·h) over 4000 m of water (within 5%)', () => {
    const r = waveSpeed();
    expect(Math.abs(r.value - r.expected) / r.expected).toBeLessThan(0.05);
  });

  it('4. spreads a centred hump symmetrically', () => {
    expect(radialSymmetry().value).toBeLessThan(1e-5);
  });

  it('5. slows over a shelf as ∫dx/√(gh) predicts (within 10%)', () => {
    const r = shelfSlowdown();
    expect(Math.abs(r.value - r.expected) / r.expected).toBeLessThan(0.1);
  });

  it('6. Mw 9.1 source has realistic size, slip, and an uplift + subsidence lobe', () => {
    const r = sourceScaling();
    expect(r.L).toBeGreaterThan(600); expect(r.L).toBeLessThan(800);
    expect(r.W).toBeGreaterThan(170); expect(r.W).toBeLessThan(240);
    expect(r.D).toBeGreaterThan(8); expect(r.D).toBeLessThan(20);
    expect(r.up).toBeGreaterThan(0);
    expect(r.down).toBeLessThan(0);
  });
});
