const fs = require('fs');
const path = require('path');

function loadRhythmModule() {
  const code = fs.readFileSync(path.join(__dirname, '../shared/rhythm.js'), 'utf8');
  const transformed = code.replace(/export function/g, 'function') + '\nmodule.exports = { generateITPermutations };';
  const mod = { exports: {} };
  const fn = new Function('module', 'exports', transformed);
  fn(mod, mod.exports);
  return mod.exports;
}

describe('generateITPermutations', () => {
  const { generateITPermutations } = loadRhythmModule();

  test('iT=1 returns [[1]]', () => {
    expect(generateITPermutations(1)).toEqual([[1]]);
  });

  test('iT=2 returns [[1,1],[2]]', () => {
    expect(generateITPermutations(2)).toEqual([[1,1],[2]]);
  });

  test('iT=3 returns all compositions', () => {
    expect(generateITPermutations(3)).toEqual([[1,1,1],[1,2],[2,1],[3]]);
  });

  test('iT=4 returns eight permutations', () => {
    const perms = generateITPermutations(4);
    const expected = [
      [1,1,1,1],
      [1,1,2],
      [1,2,1],
      [1,3],
      [2,1,1],
      [2,2],
      [3,1],
      [4],
    ];
    expect(perms).toEqual(expected);
  });

  test('permutation counts and sums are correct for 1..9', () => {
    for (let n = 1; n <= 9; n++) {
      const perms = generateITPermutations(n);
      expect(perms.length).toBe(Math.pow(2, n - 1));
      perms.forEach(p => {
        const sum = p.reduce((a, b) => a + b, 0);
        expect(sum).toBe(n);
      });
    }
  });
});
