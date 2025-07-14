const fs = require('fs');
const path = require('path');

function loadUtils(){
  const code = fs.readFileSync(path.join(__dirname, '../libs/utils/index.js'), 'utf8');
  const transformed = code.replace(/export function/g, 'function') + '\nmodule.exports = { randInt, clamp, wrapSym };';
  const mod = { exports: {} };
  const fn = new Function('module','exports', transformed);
  fn(mod, mod.exports);
  return mod.exports;
}

describe('utility helpers', () => {
  const { randInt, clamp, wrapSym } = loadUtils();

  test('randInt returns value within range', () => {
    for(let i=0;i<20;i++){
      const n = randInt(1,5);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(5);
    }
  });

  test('clamp limits values', () => {
    expect(clamp(5,0,10)).toBe(5);
    expect(clamp(-1,0,10)).toBe(0);
    expect(clamp(11,0,10)).toBe(10);
  });

  test('wrapSym wraps symmetrically', () => {
    expect(wrapSym(7,12)).toBe(-5);
    expect(wrapSym(6,12)).toBe(-6);
    expect(wrapSym(-7,12)).toBe(5);
  });
});
