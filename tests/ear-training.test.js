const fs = require('fs');
const path = require('path');

function loadGame(){
  const code = fs.readFileSync(path.join(__dirname, '../libs/ear-training/index.js'), 'utf8');
  const transformed = code.replace('export default', 'module.exports =');
  const mod = { exports: {} };
  const fn = new Function('module','exports', transformed);
  fn(mod, mod.exports);
  return mod.exports;
}

describe('EarTrainingGame logic', () => {
  const EarTrainingGame = loadGame();

  test('next() uses only ascending intervals in iA mode', () => {
    const game = new EarTrainingGame({ randInt: () => 0 });
    game.start('iA', 1);
    const q = game.next();
    expect(q.currentInterval).toBeGreaterThanOrEqual(0);
  });

  test('iS mode can generate descending intervals', () => {
    const game = new EarTrainingGame({ randInt: (a,b) => b });
    game.start('iS', 1);
    const q = game.next();
    expect(q.currentInterval).toBeLessThan(0);
  });

  test('answer tracks score and retry flow', () => {
    const game = new EarTrainingGame({ randInt: () => 0 });
    game.start('iS', 1);
    game.next();
    let res = game.answer(game.currentInterval);
    expect(res.correct).toBe(true);
    expect(game.correctTotal).toBe(1);

    game.next();
    res = game.answer(game.currentInterval + 1); // wrong
    expect(res.retry).toBe(true);
    expect(game.wrongTotal).toBe(1);
    res = game.answer(game.currentInterval); // retry correct
    expect(res.correct).toBe(true);
    expect(game.correctTotal).toBe(2);
  });

  test('answer records attempt history', () => {
    const game = new EarTrainingGame({ randInt: () => 0 });
    game.start('iS', 1);
    game.next();
    game.answer(game.currentInterval + 1); // wrong
    game.answer(game.currentInterval); // correct after retry
    expect(game.history.length).toBe(2);
    expect(game.history[0].correct).toBe(false);
    expect(game.history[1].correct).toBe(true);
  });

  test('all levels include unison and octave', () => {
    const game = new EarTrainingGame({ randInt: () => 0 });
    for(let i=1;i<=10;i++){
      expect(game.intervals[i]).toContain(0);
      expect(game.intervals[i]).toContain(12);
    }
  });
});
