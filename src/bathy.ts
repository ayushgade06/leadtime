// Loads real seafloor depth (bathymetry) + land height for a Domain from Terrarium tiles.
// Terrarium PNGs encode elevation in metres as  h = R·256 + G + B/256 − 32768
// (Terrain Tiles, Mapzen / AWS Open Data; sources ETOPO1, SRTM, GMTED and others).
import { TILE_PX, makeGrid, cellOf, type Domain, type Grid } from './geo';

// The 16 Indian Ocean tiles are copied into /public so the demo never depends on S3.
// Any other window falls back to the public bucket (CORS *).
const LOCAL = `${import.meta.env.BASE_URL}tiles/{z}/{x}/{y}.png`;
const REMOTE = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

export interface Bathy {
  grid: Grid;
  /** Bed elevation per cell in metres (row-major, row 0 = north). Ocean < 0, land ≥ 0. */
  b: Float32Array;
}

async function loadTile(z: number, x: number, y: number): Promise<ImageBitmap> {
  for (const tpl of [LOCAL, REMOTE, REMOTE]) {
    try {
      const res = await fetch(tpl.replace('{z}', `${z}`).replace('{x}', `${x}`).replace('{y}', `${y}`));
      if (res.ok) return await createImageBitmap(await res.blob());
    } catch { /* try the next source */ }
  }
  throw new Error(`Could not load bathymetry tile ${z}/${x}/${y}`);
}

/**
 * Fetch the tile window, decode elevations, box-average down to N×N cells, and turn every
 * below-sea-level cell that is NOT connected to the open ocean (Caspian, Dead Sea, the
 * Mediterranean cut by the domain edge...) into land, so only the real ocean is simulated.
 */
export async function loadBathy(d: Domain, oceanSeed: [number, number]): Promise<Bathy> {
  const px = d.n * TILE_PX;
  const canvas = new OffscreenCanvas(px, px);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const jobs: Promise<void>[] = [];
  for (let tx = 0; tx < d.n; tx++)
    for (let ty = 0; ty < d.n; ty++)
      jobs.push(loadTile(d.z, d.x0 + tx, d.y0 + ty).then((img) => ctx.drawImage(img, tx * TILE_PX, ty * TILE_PX)));
  await Promise.all(jobs);
  const rgba = ctx.getImageData(0, 0, px, px).data;

  const grid = makeGrid(d);
  const N = d.N, f = px / N;
  const b = new Float32Array(N * N);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let y = j * f; y < (j + 1) * f; y++)
        for (let x = i * f; x < (i + 1) * f; x++) {
          const p = (y * px + x) * 4;
          sum += rgba[p] * 256 + rgba[p + 1] + rgba[p + 2] / 256 - 32768;
        }
      b[j * N + i] = sum / (f * f);
    }

  keepConnectedOcean(b, N, cellOf(grid, oceanSeed[0], oceanSeed[1])!);
  return { grid, b };
}

/** 4-connected flood fill from a seed ocean cell; unreached ocean cells become land (+1 m). */
export function keepConnectedOcean(b: Float32Array, N: number, seed: { i: number; j: number }) {
  const seen = new Uint8Array(N * N);
  const stack = [seed.j * N + seed.i];
  seen[stack[0]] = 1;
  while (stack.length) {
    const c = stack.pop()!;
    const i = c % N, j = (c - i) / N;
    for (const [ni, nj] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
      const k = nj * N + ni;
      if (!seen[k] && b[k] < 0) { seen[k] = 1; stack.push(k); }
    }
  }
  for (let k = 0; k < N * N; k++) if (b[k] < 0 && !seen[k]) b[k] = 1;
}
