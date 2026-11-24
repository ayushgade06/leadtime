// Shared boxes (film pixels). Footage ends above y≈911 (captions sit at y≈944).
export type Rect = [number, number, number, number];
/** Full-width 16:9 footage box. */
export const FBOX: Rect = [264, 128, 1392, 783];
/** Split layout: map on the left, the app's side panel (portrait) on the right. */
export const MAPBOX: Rect = [96, 128, 1110, 783];
export const PANELBOX: Rect = [1236, 128, 588, 783];
/** Panel crop in source pixels with the same aspect as PANELBOX (588:783). */
export const panelCrop = (y: number, x = 1412, w = 504): Rect => [x, y, w, (w * 783) / 588];
/** Map crop in source pixels with the same aspect as MAPBOX. */
export const mapCrop = (x: number, y: number, w: number): Rect => [x, y, w, (w * 783) / 1110];
