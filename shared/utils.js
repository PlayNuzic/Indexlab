import { randInt, clamp, wrapSym } from '../libs/utils/index.js';
import { scaleSemis } from './scales.js';

export { randInt, clamp, wrapSym };

export function absToDegInfo(abs, scale) {
  const { id, rot, root } = scale;
  const sems = scaleSemis(id).map(s => (s + root) % 12);
  const mod = (abs - root + 1200) % 12;
  let best = 0, diff = 12;
  sems.forEach((v, i) => {
    const d = Math.abs(mod - v);
    if (d < diff) {
      diff = d;
      best = i;
    }
  });
  const len = sems.length;
  const deg = (best - rot + len) % len;
  const off = wrapSym(mod - sems[best], 12);
  return { deg, off };
}

export function applyGlobalParams(state, row) {
  const p = state.params;
  if (p.start != null)
    row[0] = clamp(state.baseMidi + wrapSym(p.start, 12), 0, 96);
  const base = row[0];
  const range = p.rango ?? 24;
  for (let i = 0; i < row.length; i++)
    row[i] = clamp(row[i], base - range, base + range);
  if (p.iR != null)
    row[row.length - 1] = clamp(base + p.iR, base - range, base + range);
  if (!p.duplicates) {
    const used = new Set();
    for (let i = 0; i < row.length; i++) {
      let n = row[i], tries = 0;
      while (used.has(n) && tries < 50) {
        n = clamp(base + randInt(-range, range), 0, 96);
        tries++;
      }
      row[i] = n;
      used.add(n);
    }
  }
  if (p.caDif != null) {
    const used = new Set();
    for (let i = 0; i < row.length; i++) {
      if (used.size < p.caDif) {
        used.add(row[i]);
      } else if (!used.has(row[i])) {
        const arr = Array.from(used);
        row[i] = arr[randInt(0, arr.length - 1)];
      }
    }
  }
  return row;
}
