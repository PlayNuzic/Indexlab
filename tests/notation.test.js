const fs = require('fs');
const path = require('path');

function loadHelpers(){
  const code = fs.readFileSync(path.join(__dirname, '../libs/notation/helpers.js'), 'utf8');
  const stub = 'class KeySignature{constructor(){this.children=[];}addToStave(){ }convertToGlyph(acc,next,stave){this.children.push({getYShift:()=>stave.getYForLine(acc.line)});}}';
  const transformed = code
    .replace(/import[^\n]+\n/g, '')
    .replace(/export function/g, 'function')
    .replace(/export const/g, 'const') +
    `\n${stub}\nmodule.exports = { midiToParts, midiToPartsByKeySig, needsDoubleStaff, createNote, createChord, keySignatureFrom, midiSequenceToChromaticParts, spellMidiSequence, applyKeySignature, parseKeySignatureArray, SHARP_LINES, FLAT_LINES };`;
  const mod = { exports: {} };
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
    '\nreturn drawPentagram;});';
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

describe('notation helpers', () => {
  const { midiToParts, needsDoubleStaff, createNote, createChord, keySignatureFrom, midiSequenceToChromaticParts, spellMidiSequence, applyKeySignature } = loadHelpers();

  class StubNote {
    constructor(opts){ this.opts = opts; this.mods = []; }
    addModifier(acc,i){ this.mods[i] = acc; }
  }
  class StubAcc {
    constructor(type){ this.type = type; }
  }

  test('midiToParts maps MIDI to VexFlow parts', () => {
    expect(midiToParts(60)).toEqual({ key: 'c/4', accidental: '' });
    expect(midiToParts(61)).toEqual({ key: 'c/4', accidental: '#' });
    expect(midiToParts(61,false)).toEqual({ key: 'd/4', accidental: 'b' });
    expect(midiToParts(63,false)).toEqual({ key: 'e/4', accidental: 'b' });
  });

  test('midiToPartsByKeySig adjusts octave for boundary notes', () => {
    const { parseKeySignatureArray, midiToPartsByKeySig } = loadHelpers();
    const ks = ['Bb','Eb','Ab','Db','G\u266E','Cb'];
    const map = parseKeySignatureArray(ks);
    expect(midiToPartsByKeySig(71, map)).toEqual({ key: 'c/5', accidental: 'b' });
  });

  test('needsDoubleStaff detects out of range', () => {
    expect(needsDoubleStaff(60,64)).toBe(false);
    expect(needsDoubleStaff(59,64)).toBe(true);
    expect(needsDoubleStaff(60,82)).toBe(true);
  });

  test('createNote builds a note with accidentals', () => {
    const n = createNote(61,'q',true,'treble', StubAcc, StubNote);
    expect(n.opts.keys).toEqual(['c/4']);
    expect(n.mods[0].type).toBe('#');
  });

  test('createChord builds a chord with both notes', () => {
    const ch = createChord(60,64,'h',true,'treble', StubAcc, StubNote);
    expect(ch.opts.keys).toEqual(['c/4','e/4']);
    expect(ch.mods.every(m => m instanceof StubAcc)).toBe(true);
  });

  test('keySignatureFrom returns major key name', () => {
    expect(keySignatureFrom({ scaleId: 'DIAT', root: 0 })).toBe('C');
    expect(keySignatureFrom({ scaleId: 'DIAT', root: 10 })).toBe('Bb');
    expect(keySignatureFrom({ scaleId: 'CROM', root: 0 })).toBeNull();
  });

  test('midiSequenceToChromaticParts avoids repeated letters', () => {
    const parts = midiSequenceToChromaticParts([65,66]);
    expect(parts).toEqual([
      { key:'f/4', accidental:'' },
      { key:'g/4', accidental:'b' }
    ]);
  });

  test('midiSequenceToChromaticParts prefers different notes for seconds', () => {
    const parts = midiSequenceToChromaticParts([60,61]);
    expect(parts).toEqual([
      { key:'c/4', accidental:'' },
      { key:'d/4', accidental:'b' }
    ]);
  });

  test('midiSequenceToChromaticParts adds naturals', () => {
    const nat = '\u266E';
    const parts = midiSequenceToChromaticParts([60,61,63,64]);
    expect(parts).toEqual([
      { key:'c/4', accidental:'' },
      { key:'d/4', accidental:'b' },
      { key:'e/4', accidental:'b' },
      { key:'e/4', accidental:'\u266E' }
    ]);
  });

  test('midiSequenceToChromaticParts handles minor thirds', () => {
    expect(midiSequenceToChromaticParts([60,63])).toEqual([
      { key:'c/4', accidental:'' },
      { key:'e/4', accidental:'b' }
    ]);
    expect(midiSequenceToChromaticParts([63,66])).toEqual([
      { key:'e/4', accidental:'b' },
      { key:'g/4', accidental:'b' }
    ]);
  });

  test('midiSequenceToChromaticParts handles major thirds', () => {
    expect(midiSequenceToChromaticParts([60,64])).toEqual([
      { key:'c/4', accidental:'' },
      { key:'e/4', accidental:'' }
    ]);
  });

  test('midiSequenceToChromaticParts keeps accidental preference', () => {
    expect(midiSequenceToChromaticParts([61,66])).toEqual([
      { key:'d/4', accidental:'b' },
      { key:'g/4', accidental:'b' }
    ]);
  });

  test('midiSequenceToChromaticParts spells full chromatic scale with naturals', () => {
    const nat = '\u266E';
    const midis = Array.from({length:12}, (_,i) => 60 + i);
    expect(midiSequenceToChromaticParts(midis)).toEqual([
      { key:'c/4', accidental:'' },
      { key:'d/4', accidental:'b' },
      { key:'d/4', accidental:nat },
      { key:'e/4', accidental:'b' },
      { key:'e/4', accidental:nat },
      { key:'f/4', accidental:'' },
      { key:'g/4', accidental:'b' },
      { key:'g/4', accidental:nat },
      { key:'a/4', accidental:'b' },
      { key:'a/4', accidental:nat },
      { key:'b/4', accidental:'b' },
      { key:'b/4', accidental:nat }
    ]);
  });

  test('midiSequenceToChromaticParts spells HEX scale with naturals', () => {
    const nat = '\u266E';
    const midis = [60,61,64,65,68,69];
    expect(midiSequenceToChromaticParts(midis)).toEqual([
      { key:'c/4', accidental:'' },
      { key:'d/4', accidental:'b' },
      { key:'e/4', accidental:'' },
      { key:'f/4', accidental:'' },
      { key:'g/4', accidental:'#' },
      { key:'a/4', accidental:'' }
    ]);
  });

  test('midiSequenceToChromaticParts spells OCT scale with naturals', () => {
    const nat = '\u266E';
    const midis = [60,61,63,64,66,67,69,70];
    expect(midiSequenceToChromaticParts(midis)).toEqual([
      { key:'c/4', accidental:'' },
      { key:'d/4', accidental:'b' },
      { key:'e/4', accidental:'b' },
      { key:'e/4', accidental:nat },
      { key:'f/4', accidental:'#' },
      { key:'g/4', accidental:'' },
      { key:'a/4', accidental:'' },
      { key:'b/4', accidental:'b' }
    ]);
  });

  test('midiSequenceToChromaticParts spells TON scale consistently', () => {
    const midis = [60,62,64,66,68,70];
    expect(midiSequenceToChromaticParts(midis)).toEqual([
      { key:'c/4', accidental:'' },
      { key:'d/4', accidental:'' },
      { key:'e/4', accidental:'' },
      { key:'f/4', accidental:'#' },
      { key:'g/4', accidental:'#' },
      { key:'a/4', accidental:'#' }
    ]);
  });

  test('spellMidiSequence tracks accidentals within measures', () => {
    const nat = '\\u266E';
    const seq = [61,62,null,62];
    expect(spellMidiSequence(seq)).toEqual([
      { key:'d/4', accidental:'b' },
      { key:'d/4', accidental:nat },
      null,
      { key:'d/4', accidental:'' }
    ]);
  });

  test('spellMidiSequence respects key signatures and octaves', () => {
    const nat = '\\u266E';
    expect(spellMidiSequence([65,66,null,66], ['F#'])).toEqual([
      { key:'f/4', accidental:nat },
      { key:'f/4', accidental:'#' },
      null,
      { key:'f/4', accidental:'' }
    ]);
  });

  test('spellMidiSequence adds courtesy naturals after bar', () => {
    const nat = '\\u266E';
    expect(spellMidiSequence([61,null,62])).toEqual([
      { key:'d/4', accidental:'b' },
      null,
      { key:'d/4', accidental:nat, cautionary:true }
    ]);
  });

  test('applyKeySignature is a function', () => {
    expect(typeof applyKeySignature).toBe('function');
  });

  test('drawPentagram displays accidentals for ACUS root 0 with empty midis', () => {
    const apply = jest.fn();
    const draw = loadPentagram(apply);
    const container = { innerHTML:'', setAttribute(){} };
    draw(container, [], { scaleId: 'ACUS', root: 0 });
    expect(apply).toHaveBeenCalledWith(expect.anything(), ['F#','Bb'], 'treble', 0);
    expect(apply).toHaveBeenCalledWith(expect.anything(), ['F#','Bb'], 'bass', 0);
  });

  test('applyKeySignature uses flat lines for B natural', () => {
    const { applyKeySignature, FLAT_LINES } = loadHelpers();
    const nat = '\u266E';
    const stave = { getYForLine: l => l, addModifier(){} };
    const ks = applyKeySignature(stave, ['B'+nat,'Eb'], 'treble');
    expect(ks.children[0].getYShift()).toBe(FLAT_LINES[0]);
  });

  test('applyKeySignature uses sharp lines for F natural', () => {
    const { applyKeySignature, SHARP_LINES } = loadHelpers();
    const nat = '\u266E';
    const stave = { getYForLine: l => l, addModifier(){} };
    const ks = applyKeySignature(stave, ['F'+nat,'C#'], 'treble');
    expect(ks.children[0].getYShift()).toBe(SHARP_LINES[0]);
  });
});
