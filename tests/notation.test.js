const fs = require('fs');
const path = require('path');

function loadHelpers(){
  const code = fs.readFileSync(path.join(__dirname, '../libs/notation/helpers.js'), 'utf8');
  const transformed = code
    .replace(/import[^\n]+\n/g, '')
    .replace(/export function/g, 'function')
    .replace(/export const/g, 'const') +
    '\nmodule.exports = { midiToParts, midiToPartsByKeySig, needsDoubleStaff, createNote, createChord, keySignatureFrom, midiSequenceToChromaticParts, applyKeySignature };';
  const mod = { exports: {} };
  const fn = new Function('module','exports', transformed);
  fn(mod, mod.exports);
  return mod.exports;
}

describe('notation helpers', () => {
  const { midiToParts, needsDoubleStaff, createNote, createChord, keySignatureFrom, midiSequenceToChromaticParts, applyKeySignature } = loadHelpers();

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

  test('midiSequenceToChromaticParts adds naturals', () => {
    const nat = '\u266E';
    const parts = midiSequenceToChromaticParts([60,61,63,64]);
    expect(parts).toEqual([
      { key:'c/4', accidental:'' },
      { key:'d/4', accidental:'b' },
      { key:'e/4', accidental:'b' },
      { key:'e/4', accidental:nat }
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

  test('applyKeySignature is a function', () => {
    expect(typeof applyKeySignature).toBe('function');
  });
});
