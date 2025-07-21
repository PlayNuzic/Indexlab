const fs = require('fs');
const path = require('path');

function loadMove(){
  const code = fs.readFileSync(path.join(__dirname, '../shared/cards.js'), 'utf8');
  const transformed = code.replace(/export function/g, 'function').replace(/export const/g,'const') + '\nmodule.exports = { moveCards };';
  const mod = { exports: {} };
  const fn = new Function('module','exports', transformed);
  fn(mod, mod.exports);
  return mod.exports.moveCards;
}

describe('moveCards', () => {
  const moveCards = loadMove();
  function setup(notes){
    return { notes: notes.slice(), octShifts: Array(notes.length).fill(0), components: notes.map((_,i)=>String.fromCharCode(97+i)) };
  }

  test('move single index forward', () => {
    const state = setup([0,1,2,3]);
    const res = moveCards(state,[1],3);
    expect(state.notes).toEqual([0,2,1,3]);
    expect(res).toEqual([2]);
  });

  test('move single index backward', () => {
    const state = setup([0,1,2,3]);
    const res = moveCards(state,[3],0);
    expect(state.notes).toEqual([3,0,1,2]);
    expect(res).toEqual([0]);
  });

  test('move multiple indices forward', () => {
    const state = setup([0,1,2,3,4]);
    const res = moveCards(state,[1,2],4);
    expect(state.notes).toEqual([0,3,1,2,4]);
    expect(res).toEqual([2,3]);
  });

  test('move multiple indices backward', () => {
    const state = setup([0,1,2,3,4]);
    const res = moveCards(state,[3,4],1);
    expect(state.notes).toEqual([0,3,4,1,2]);
    expect(res).toEqual([1,2]);
  });

  test('move after target index', () => {
    const state = setup([0,1,2,3]);
    const res = moveCards(state,[1],2,true);
    expect(state.notes).toEqual([0,2,1,3]);
    expect(res).toEqual([2]);
  });
});
