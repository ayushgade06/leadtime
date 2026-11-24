// Web-Mercator tile math and the simulation grid geometry.
// The grid is a window of slippy-map tiles, so every grid row is a row of Mercator pixels:
// it lines up exactly with Leaflet's map, and cells stay square (Mercator is conformal).

export const EARTH_CIRCUMFERENCE_M = 40075016.686;
export const TILE_PX = 256;

/** A window of `n × n` tiles at zoom `z`, starting at tile (x0, y0), sampled to an N × N grid. */
export interface Domain {
  z: number;
  x0: number;
  y0: number;
  n: number;
  N: number;
}

export interface Grid extends Domain {
  /** Latitude of each row centre (row 0 = north). */
  lat: Float64Array;
  /** Longitude of each column centre. */
  lon: Float64Array;
  /** Cell side length in metres for each row: shrinks with cos(latitude). */
  rowSize: Float64Array;
  bbox: { north: number; south: number; west: number; east: number };
}

const worldPx = (z: number) => TILE_PX * 2 ** z;

export const lonOfPx = (X: number, z: number) => (X / worldPx(z)) * 360 - 180;
export const latOfPx = (Y: number, z: number) =>
  (Math.atan(Math.sinh(Math.PI * (1 - (2 * Y) / worldPx(z)))) * 180) / Math.PI;
export const pxOfLon = (lon: number, z: number) => ((lon + 180) / 360) * worldPx(z);
export const pxOfLat = (lat: number, z: number) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * worldPx(z);
};

/** Slippy-map tile containing a point. */
export function tileOf(lat: number, lon: number, z: number) {
  return { x: Math.floor(pxOfLon(lon, z) / TILE_PX), y: Math.floor(pxOfLat(lat, z) / TILE_PX) };
}

export function makeGrid(d: Domain): Grid {
  const f = (d.n * TILE_PX) / d.N; // Mercator pixels per grid cell
  const X0 = d.x0 * TILE_PX, Y0 = d.y0 * TILE_PX;
  const lat = new Float64Array(d.N), lon = new Float64Array(d.N), rowSize = new Float64Array(d.N);
  const pxMetresAtEquator = EARTH_CIRCUMFERENCE_M / worldPx(d.z);
  for (let k = 0; k < d.N; k++) {
    lat[k] = latOfPx(Y0 + (k + 0.5) * f, d.z);
    lon[k] = lonOfPx(X0 + (k + 0.5) * f, d.z);
    // s_j = (C / (256·2^z)) · (pixels per cell) · cos(lat_j)
    rowSize[k] = pxMetresAtEquator * f * Math.cos((lat[k] * Math.PI) / 180);
  }
  const span = d.n * TILE_PX;
  return {
    ...d, lat, lon, rowSize,
    bbox: {
      north: latOfPx(Y0, d.z), south: latOfPx(Y0 + span, d.z),
      west: lonOfPx(X0, d.z), east: lonOfPx(X0 + span, d.z),
    },
  };
}

/** Grid cell (column i, row j) containing a lat/lon, or null if outside the domain. */
export function cellOf(g: Grid, lat: number, lon: number): { i: number; j: number } | null {
  const f = (g.n * TILE_PX) / g.N;
  const i = Math.floor((pxOfLon(lon, g.z) - g.x0 * TILE_PX) / f);
  const j = Math.floor((pxOfLat(lat, g.z) - g.y0 * TILE_PX) / f);
  return i >= 0 && j >= 0 && i < g.N && j < g.N ? { i, j } : null;
}

/** Great-circle distance in km (haversine, R = 6371 km). */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

/** The Indian Ocean preset: z4 tiles x 9..12, y 6..9 (about 41°N–41°S, 22.5°E–112.5°E). */
export const INDIAN_OCEAN: Domain = { z: 4, x0: 9, y0: 6, n: 4, N: 512 };
