const fs = require('fs');
const path = require('path');

function loadModule(){
  const code = fs.readFileSync(path.join(__dirname,'../shared/hindemith.js'),'utf8');
  const cards = fs.readFileSync(path.join(__dirname,'../shared/cards.js'),'utf8')
    .replace(/export function/g,'function')
    .replace(/export const/g,'const');
  const transformed = code
    .replace("import { eAToNotes } from './cards.js';", cards)
    .replace(/export const/g,'const')
    .replace(/export function/g,'function') + '\nmodule.exports = { findChordRoot };';
  const mod = { exports:{} };
  new Function('module','exports', transformed)(mod, mod.exports);
  return mod.exports.findChordRoot;
}

describe('findChordRoot', () => {
  const findChordRoot = loadModule();

  test('major triad', () => {
    expect(findChordRoot([0,4,7])).toBe(0);
  });

  test.each([
    [[0,4,11], 0],
    [[1,5,0], 1]
  ])('major seventh chord root %p', (chord, root) => {
    expect(findChordRoot(chord)).toBe(root);
  });

  test('quartal chord root', () => {
    expect(findChordRoot([0,5,9])).toBe(5);
  });

  test('tritone returns null', () => {
    expect(findChordRoot([0,6])).toBeNull();
  });
});
