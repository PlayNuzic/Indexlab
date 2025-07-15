import { wrapSym } from '../libs/utils/index.js';
import { scaleSemis } from './scales.js';

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
