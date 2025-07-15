const fs = require('fs');
const path = require('path');

function loadCards(){
  const code = fs.readFileSync(path.join(__dirname, '../shared/cards.js'), 'utf8');
  const transformed = code.replace(/export function/g,'function').replace(/export const/g,'const') + '\nmodule.exports = { transposeNotes, rotateLeft, rotateRight, shiftOct, duplicateCards, omitCards, addCard, generateComponents, ensureDuplicateComponents };';
  const mod = { exports: {} };
  const fn = new Function('module','exports', transformed);
  fn(mod, mod.exports);
  return mod.exports;
}

describe('card transformation helpers', () => {
  const { transposeNotes, rotateLeft, rotateRight, shiftOct, duplicateCards, omitCards, addCard } = loadCards();

  test('transposeNotes wraps values', () => {
    expect(transposeNotes([0,3,11],12,2)).toEqual([2,5,1]);
    expect(transposeNotes([0],12,-3)).toEqual([9]);
  });

  test('rotateLeft/right mutate arrays', () => {
    const n=[0,1,2]; const o=[0,0,0]; const c=['a','b','c'];
    rotateLeft(n,o,c);
    expect(n).toEqual([1,2,0]);
    rotateRight(n,o,c);
    expect(n).toEqual([0,1,2]);
  });

  test('shiftOct changes value', () => {
    const o=[0,0];
    shiftOct(o,1,1); expect(o[1]).toBe(1);
    shiftOct(o,1,-2); expect(o[1]).toBe(-1);
  });

  test('duplicateCards duplicates indices', () => {
    const state={notes:[0,1],octShifts:[0,0],components:['a','b']};
    const idx=duplicateCards(state,[0]);
    expect(state.notes).toEqual([0,1,0]);
    expect(idx).toEqual([2]);
  });

  test('omitCards removes items', () => {
    const state={notes:[0,1,2],octShifts:[0,0,0],components:['a','b','c']};
    omitCards(state,[1]);
    expect(state.notes).toEqual([0,2]);
  });

  test('addCard inserts new item', () => {
    const state={notes:[0],octShifts:[0],components:['a']};
    addCard(state,5,'b',1);
    expect(state.notes).toEqual([0,5]);
    expect(state.octShifts[1]).toBe(1);
    expect(state.components[1]).toBe('b');
  });
});
