// Tests for scaleSemis from shared/scales.js
const fs = require('fs');
const path = require('path');

function loadScaleModule(){
  const code = fs.readFileSync(path.join(__dirname, '../shared/scales.js'), 'utf8');
  const transformed = code.replace(/export const/g, 'const')
    .replace(/export function/g, 'function') + '\nmodule.exports = { motherScalesData, scaleSemis };';
  const mod = { exports: {} };
  const fn = new Function('module','exports', transformed);
  fn(mod, mod.exports);
  return mod.exports;
}

describe('scaleSemis', () => {
  const { scaleSemis } = loadScaleModule();

  test('DIAT scale', () => {
    expect(scaleSemis('DIAT')).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  test('HEX scale', () => {
    expect(scaleSemis('HEX')).toEqual([0, 1, 4, 5, 8, 9]);
  });
});
