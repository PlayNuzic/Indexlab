const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadModule(){
  let code = fs.readFileSync(path.resolve(__dirname,'../shared/scales.js'),'utf8');
  code = code.replace(/export const/g, 'const').replace(/export function/g, 'function');
  const context = { module: { exports: {} } };
  vm.runInNewContext(code + '\nmodule.exports = { motherScalesData, scaleSemis, degToSemi, degDiffToSemi };', context);
  return context.module.exports;
}

describe('scale helpers', () => {
  test('scaleSemis returns semitone offsets for DIAT', () => {
    const { scaleSemis } = loadModule();
    expect(scaleSemis('DIAT')).toEqual([0,2,4,5,7,9,11]);
  });

  test('scaleSemis caches results', () => {
    const mod = loadModule();
    const first = mod.scaleSemis('DIAT');
    mod.motherScalesData.DIAT.ee[0] = 99; // mutate source
    expect(mod.scaleSemis('DIAT')).toBe(first);
  });

  test('degToSemi handles negative degrees', () => {
    const { degToSemi } = loadModule();
    const scale = { id: 'DIAT', rot: 0, root: 0 };
    expect(degToSemi(scale, -1)).toBe(11);
  });

  test('degDiffToSemi wraps around scale length', () => {
    const { degDiffToSemi } = loadModule();
    const scale = { id: 'DIAT', rot: 0, root: 0 };
    expect(degDiffToSemi(scale, 0, 7)).toBe(0);
    expect(degDiffToSemi(scale, 0, -7)).toBe(0);
  });
});
