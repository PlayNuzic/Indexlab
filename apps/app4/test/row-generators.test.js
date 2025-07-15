const rowGenerators = require('./row-generators');
const { genScaleDegreeRow, genIStepRow, applyGlobalParams, scaleSemis } = rowGenerators;

describe('row generator functions', () => {
  test('generated rows respect selected scale and octave range', () => {
    const state = {
      octProb: 0,
      scale: { id: 'DIAT', rot: 0, root: 0 },
      params: { iR: null, caDif: null, rango: 12, duplicates: true, start: null }
    };
    const row = applyGlobalParams(state, genScaleDegreeRow(state));
    const allowed = scaleSemis(state.scale.id).map(s => (s + state.scale.root) % 12);
    const base = row[0];
    row.forEach(n => {
      expect(allowed).toContain(n % 12);
      expect(n).toBeGreaterThanOrEqual(base - state.params.rango);
      expect(n).toBeLessThanOrEqual(base + state.params.rango);
    });
  });

  test('genIStepRow handles multi-octave steps', () => {
    const origRandom = Math.random;

    const randValues = [0, 0.5, 0, 0.8];
    Math.random = () => (randValues.length ? randValues.shift() : 0);

    const state = {
      octProb: 1,
      scale: { id: 'DIAT', rot: 0, root: 0 },
      params: { iR: null, caDif: null, rango: 24, duplicates: true, start: null }
    };

    const row = genIStepRow(state);
    expect(row[1] - row[0]).toBe(12);

    Math.random = origRandom;
  });
});

