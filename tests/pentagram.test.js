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

function loadPentagram(apply){
  const code = fs.readFileSync(path.join(__dirname, '../libs/notation/pentagram.js'), 'utf8');
  let transformed = code
    .replace(/import[^\n]+\n/g, '')
    .replace(/export default.*;/, '')
    .replace(/export function/g, 'function');
  const wrapper =
    'return (function(Renderer,Stave,StaveNote,Voice,Formatter,Accidental,StaveConnector,GhostNote,midiToParts,midiToPartsByKeySig,midiSequenceToChromaticParts,applyKeySignature,parseKeySignatureArray,getKeySignature){\n' +
    transformed +
    '\nreturn { drawPentagram };});';
  const factory = new Function(wrapper)();
  class Renderer{static Backends={SVG:1};resize(){}getContext(){return {};}}
  class Stave{addClef(){}setContext(){return this;}addGlyph(){}draw(){}}
  class StaveConnector{static type={BRACE:"BRACE",SINGLE_LEFT:"SINGLE_LEFT"};setType(){return this;}setContext(){return this;}draw(){}}
  const noop = ()=>{};
  function loadKeySig(){
    const sc = fs.readFileSync(path.join(__dirname, '../shared/scales.js'), 'utf8');
    const tf = sc
      .replace(/export const/g, 'const')
      .replace(/export function/g, 'function') +
      '\nmodule.exports = { getKeySignature };';
    const mod = { exports:{} };
    new Function('module','exports', tf)(mod, mod.exports);
    return mod.exports.getKeySignature;
  }
  const getKeySignature = loadKeySig();
  const { parseKeySignatureArray } = loadHelpers();
  return factory(Renderer,Stave,noop,noop,noop,noop,StaveConnector,noop,noop,noop,noop,apply,parseKeySignatureArray,getKeySignature);
}

describe('pentagram helpers', () => {
  const { parseKeySignatureArray } = loadHelpers();
  const needsAccidental = loadNeedsAccidental();

  test('parseKeySignatureArray maps notes', () => {
    const map = parseKeySignatureArray(['F#','C#']);
    expect(map[5]).toBe('#');
    expect(map[0]).toBe('#');
  });

  test('parseKeySignatureArray handles naturals', () => {
    const nat = '\u266E';
    const map = parseKeySignatureArray(['G' + nat]);
    expect(map[7]).toBe('');
  });

  test('needsAccidental honors key signature', () => {
    const map = parseKeySignatureArray(['F#','C#']);
    expect(needsAccidental({ key:'f/4', accidental:'#' }, map)).toBe(false);
    expect(needsAccidental({ key:'f/4', accidental:'b' }, map)).toBe(true);
  });

  test('drawPentagram forwards key signature to staves', () => {
    const apply = jest.fn();
    const { drawPentagram } = loadPentagram(apply);
    const container = { innerHTML:'', setAttribute(){} };
    drawPentagram(container, [], { scaleId: 'acus', root: 0 });
    expect(apply).toHaveBeenCalledWith(expect.anything(), ['F#','Bb'], 'treble', 0);
    expect(apply).toHaveBeenCalledWith(expect.anything(), ['F#','Bb'], 'bass', 0);
  });
});
