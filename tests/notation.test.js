const fs = require('fs');
const path = require('path');

function loadHelpers(){
  const code = fs.readFileSync(path.join(__dirname, '../libs/notation/helpers.js'), 'utf8');
  const transformed = code.replace(/export function/g, 'function') +
    '\nmodule.exports = { midiToParts, needsDoubleStaff, createNote, createChord, keySignatureFrom };';
  const mod = { exports: {} };
  const fn = new Function('module','exports', transformed);
  fn(mod, mod.exports);
  return mod.exports;
}

describe('notation helpers', () => {
  const { midiToParts, needsDoubleStaff, createNote, createChord, keySignatureFrom } = loadHelpers();

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
});
