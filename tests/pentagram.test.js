const fs = require('fs');
const path = require('path');

function loadPentagram(){
  const code = fs.readFileSync(path.join(__dirname, '../libs/notation/pentagram.js'), 'utf8');
  const transformed = code
    .replace(/import[^\n]+\n/g, '')
    .replace(/export function/g, 'function')
    .replace(/export default.*;/, '') +
    '\nmodule.exports = { parseKeySignatureArray, needsAccidental };';
  const mod = { exports:{} };
  const fn = new Function('module','exports', transformed); 
  fn(mod, mod.exports);
  return mod.exports;
}

describe('pentagram helpers', () => {
  const { parseKeySignatureArray, needsAccidental } = loadPentagram();

  test('parseKeySignatureArray maps notes', () => {
    const map = parseKeySignatureArray(['fa#','do#']);
    expect(map[5]).toBe('#');
    expect(map[0]).toBe('#');
  });

  test('parseKeySignatureArray handles naturals', () => {
    const nat = '\u266E';
    const map = parseKeySignatureArray(['sol' + nat]);
    expect(map[7]).toBe('');
  });

  test('needsAccidental honors key signature', () => {
    const map = parseKeySignatureArray(['fa#','do#']);
    expect(needsAccidental({ key:'f/4', accidental:'#' }, map)).toBe(false);
    expect(needsAccidental({ key:'f/4', accidental:'b' }, map)).toBe(true);
  });
});
