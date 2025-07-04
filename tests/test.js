const _ = require('lodash');
const Tone = require('tone');

describe('basic modules', () => {
  test('lodash random range', () => {
    const n = _.random(1, 10);
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(10);
  });

  test('tone loads', () => {
    expect(typeof Tone).toBe('object');
  });
});
