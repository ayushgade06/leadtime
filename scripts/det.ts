import { createSim, addSurface, step } from '../src/solver';
function run() {
  const N = 120, b = new Float64Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) b[j * N + i] = i > 100 ? 5 : -(20 + 40 * i + 30 * Math.sin(j / 7));
  const s = createSim(N, N, b, new Float64Array(N).fill(15000), { sponge: 0 });
  const e = new Float64Array(N * N); for (let k = 0; k < e.length; k++) e[k] = 2 * Math.exp(-(((k % N) - 40) ** 2 + (Math.floor(k / N) - 60) ** 2) / 30);
  addSurface(s, e); for (let t = 0; t < 1500; t++) step(s);
  let h = 0; for (let k = 0; k < s.eta.length; k++) h += s.eta[k] * (k % 97 + 1);
  return h;
}
const r = [run(), run(), run(), run()];
console.log(r.map((x) => x.toPrecision(17)), 'identical:', r.every((x) => x === r[0]));
