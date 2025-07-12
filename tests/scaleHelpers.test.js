const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadModule(){
  let code = fs.readFileSync(path.resolve(__dirname,'../shared/scales.js'),'utf8');
  code = code.replace(/export const/g, 'const').replace(/export function/g, 'function');
  const context = { module: { exports: {} } };
  vm.runInNewContext(code + '\nmodule.exports = { motherScalesData, scaleSemis };', context);
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
});
