const { eAToNotes, notesToEA, notesToAc } = require('../apps/app3/scripts/helpers');
const fs = require('fs');
const path = require('path');

function loadScaleModule() {
  const code = fs.readFileSync(path.join(__dirname, '../shared/scales.js'), 'utf8');
  const transformed = code.replace(/export const/g, 'const')
    .replace(/export function/g, 'function') + '\nmodule.exports = { scaleSemis };';
  const mod = { exports: {} };
  const fn = new Function('module','exports', transformed);
  fn(mod, mod.exports);
  return mod.exports;
}

const { scaleSemis } = loadScaleModule();

describe('helpers eA/Ac/degree conversions', () => {
  test('convert sequence through eA, Ac and degrees', () => {
    const sems = scaleSemis('OCT');

    const intervals = [3, 4, 3];
    const notes = eAToNotes(intervals); // [0,3,7,10]
    expect(notesToEA(notes)).toBe('3 4 3');
    expect(notesToAc(notes)).toBe('0 3 7 10');

    const toDegrees = ns => ns.map(n => sems.indexOf(n));
    const fromDegrees = ds => ds.map(d => sems[d]);

    const degs = toDegrees(notes);
    expect(degs).toEqual([0, 2, 5, 7]);
    expect(fromDegrees(degs)).toEqual(notes);
  });
});
