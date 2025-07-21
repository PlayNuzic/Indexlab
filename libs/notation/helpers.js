export function midiToParts(midi, preferSharp = true) {
  const sharpLetters = ['c','c','d','d','e','f','f','g','g','a','a','b'];
  const flatLetters  = ['c','d','d','e','e','f','g','g','a','a','b','b'];
  const sharps = ['', '#', '', '#', '', '', '#', '', '#', '', '#', ''];
  const flats  = ['', 'b', '', 'b', '', '', 'b', '', 'b', '', 'b', ''];
  const pc = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  const letters = preferSharp ? sharpLetters : flatLetters;
  return {
    key: `${letters[pc]}/${octave}`,
    accidental: preferSharp ? sharps[pc] : flats[pc]
  };
}

export function needsDoubleStaff(n1, n2) {
  return n1 < 60 || n2 < 60 || n1 > 81 || n2 > 81;
}

export function createNote(midi, duration, asc, clef, Accidental, StaveNote) {
  const parts = midiToParts(midi, asc);
  const note = new StaveNote({ keys: [parts.key], duration, clef });
  if (parts.accidental) note.addModifier(new Accidental(parts.accidental), 0);
  return note;
}

export function createChord(m1, m2, duration, asc, clef, Accidental, StaveNote) {
  let p1 = midiToParts(m1, asc);
  let p2 = midiToParts(m2, asc);
  if (p1.key[0] === p2.key[0]) {
    p2 = midiToParts(m2, !asc);
  }
  const chord = new StaveNote({ keys: [p1.key, p2.key], duration, clef });
  if (p1.accidental) chord.addModifier(new Accidental(p1.accidental), 0);
  if (p2.accidental) chord.addModifier(new Accidental(p2.accidental), 1);
  return chord;
}

export function keySignatureFrom({ scaleId, root } = {}) {
  if (scaleId !== 'DIAT' || typeof root !== 'number') return null;
  const map = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
  return map[((root % 12) + 12) % 12];
}
