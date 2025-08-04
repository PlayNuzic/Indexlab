const fs = require('fs');
const path = require('path');

function loadModule(){
  const code = fs.readFileSync(path.join(__dirname,'../shared/forte.js'),'utf8');
  const transformed = code
    .replace(/export function/g,'function')
    .replace(/export const/g,'const') + '\nmodule.exports = { identificarConjuntoForte };';
  const mod = { exports:{} };
  new Function('module','exports', transformed)(mod, mod.exports);
  return mod.exports.identificarConjuntoForte;
}

describe('identificarConjuntoForte', () => {
  const identificarConjuntoForte = loadModule();

  test('triada mayor', () => {
    const res = identificarConjuntoForte([0,4,7]);
    expect(res.nombreForte).toBe('3-11');
    expect(res.formaPrima).toEqual([0,3,7]);
    expect(res.vectorIntervalos).toEqual([0,0,1,1,1,0]);
    expect(res.formaInvertida).toEqual([0,4,7]);
  });

  test('acorde aumentado', () => {
    const res = identificarConjuntoForte([0,4,8]);
    expect(res.nombreForte).toBe('3-12');
    expect(res.formaPrima).toEqual([0,4,8]);
    expect(res.formaInvertida).toBeNull();
    expect(res.vectorIntervalos).toEqual([0,0,0,3,0,0]);
  });

  test('hexacorde 0,1,4,5,8,9', () => {
    const res = identificarConjuntoForte([0,1,4,5,8,9]);
    expect(res.nombreForte).toBe('6-40');
    expect(res.formaPrima).toEqual([0,1,4,5,8,9]);
    expect(res.vectorIntervalos).toEqual([3,0,3,6,3,0]);
  });
});

