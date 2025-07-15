const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadMoveCards(ctx){
  const code = fs.readFileSync(path.join(__dirname, '../apps/app5/scripts/main.js'), 'utf8');
  const start = code.indexOf('function moveCards');
  let idx = start;
  let open = false, depth = 0;
  for(; idx < code.length; idx++){
    const ch = code[idx];
    if(ch === '{' && !open){ open = true; depth = 1; }
    else if(ch === '{' && open){ depth++; }
    else if(ch === '}' && open){ depth--; if(depth === 0){ idx++; break; } }
  }
  const fnCode = code.slice(start, idx);
  ctx.module = { exports: {} };
  vm.runInNewContext(fnCode + '\nmodule.exports = moveCards;', ctx);
  return ctx.module.exports;
}

describe('moveCards', () => {
  function setup(notes){
    return {
      notes: notes.slice(),
      octShifts: Array(notes.length).fill(0),
      components: notes.map((_,i)=>String.fromCharCode(97+i)),
      selectedCards: new Set(),
      pushUndo: jest.fn(),
      ensureDuplicateComponents: jest.fn(),
      renderAll: jest.fn()
    };
  }

  test('move single index forward', () => {
    const ctx = setup([0,1,2,3]);
    const moveCards = loadMoveCards(ctx);
    moveCards([1], 3);
    expect(ctx.notes).toEqual([0,2,1,3]);
    expect(Array.from(ctx.selectedCards)).toEqual([2]);
  });

  test('move single index backward', () => {
    const ctx = setup([0,1,2,3]);
    const moveCards = loadMoveCards(ctx);
    moveCards([3], 0);
    expect(ctx.notes).toEqual([3,0,1,2]);
    expect(Array.from(ctx.selectedCards)).toEqual([0]);
  });

  test('move multiple indices forward', () => {
    const ctx = setup([0,1,2,3,4]);
    const moveCards = loadMoveCards(ctx);
    moveCards([1,2], 4);
    expect(ctx.notes).toEqual([0,3,1,2,4]);
    expect(Array.from(ctx.selectedCards)).toEqual([2,3]);
  });

  test('move multiple indices backward', () => {
    const ctx = setup([0,1,2,3,4]);
    const moveCards = loadMoveCards(ctx);
    moveCards([3,4], 1);
    expect(ctx.notes).toEqual([0,3,4,1,2]);
    expect(Array.from(ctx.selectedCards)).toEqual([1,2]);
  });
});
