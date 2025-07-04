const { parseNums, eAToNotes, notesToEA } = require('../apps/app3/scripts/helpers');

describe('app3 helper functions', () => {
  test('parseNums converts string to numbers', () => {
    expect(parseNums('3 4 -2')).toEqual([3, 4, -2]);
  });

  test('eAToNotes converts intervals to notes', () => {
    expect(eAToNotes([3, 4, 3])).toEqual([0, 3, 7, 10]);
  });

  test('notesToEA converts notes to interval string', () => {
    const notes = [0, 3, 7, 10];
    expect(notesToEA(notes)).toBe('3 4 3');
  });
});
