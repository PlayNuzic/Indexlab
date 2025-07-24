const fs = require('fs');
const path = require('path');

function loadNeedsAccidental(){
  const code = fs.readFileSync(path.join(__dirname, '../libs/notation/pentagram.js'), 'utf8');
  let transformed = code
    .replace(/import[^\n]+\n/g, '')
    .replace(/export function/g, 'function')
    .replace(/export default.*;/, '') +
    '\nconst letterToPc = { c:0, d:2, e:4, f:5, g:7, a:9, b:11 };' +
    '\nmodule.exports = { needsAccidental };';
  const mod = { exports:{} };
  const fn = new Function('module','exports', transformed);
  fn(mod, mod.exports);
  return mod.exports.needsAccidental;
}

function loadHelpers(){
  const code = fs.readFileSync(path.join(__dirname, '../libs/notation/helpers.js'), 'utf8');
  const transformed = code
    .replace(/import[^\n]+\n/g, '')
    .replace(/export function/g, 'function')
    .replace(/export const/g, 'const') +
    '\nmodule.exports = { parseKeySignatureArray };';
  const mod = { exports:{} };
  const fn = new Function('module','exports', transformed);
  fn(mod, mod.exports);
  return mod.exports;
}

describe('pentagram helpers', () => {
  const { parseKeySignatureArray } = loadHelpers();
  const needsAccidental = loadNeedsAccidental();

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

  test('drawPentagram forwards key signature to staves', () => {
    const apply = jest.fn();
    const { drawPentagram } = loadPentagram(apply);
    const container = { innerHTML:'', setAttribute(){} };
    drawPentagram(container, [], { scaleId: 'acus', root: 0 });
    expect(apply).toHaveBeenCalledWith(expect.anything(), ['fa#','sib'], 'treble');
    expect(apply).toHaveBeenCalledWith(expect.anything(), ['fa#','sib'], 'bass');
  });
});
