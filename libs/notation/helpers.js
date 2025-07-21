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

export function createNote(midi, duration, asc, clef, Accidental, StaveNote, keyMap) {
  const parts = midiToParts(midi, asc);
  const note = new StaveNote({ keys: [parts.key], duration, clef });
  const letter = parts.key[0];
  const sig = keyMap && keyMap.get(letter);
  if (parts.accidental && parts.accidental !== sig) {
    note.addModifier(new Accidental(parts.accidental), 0);
  }
  return note;
}

export function createChord(m1, m2, duration, asc, clef, Accidental, StaveNote, keyMap) {
  let p1 = midiToParts(m1, asc);
  let p2 = midiToParts(m2, asc);
  if (p1.key[0] === p2.key[0]) {
    p2 = midiToParts(m2, !asc);
  }
  const chord = new StaveNote({ keys: [p1.key, p2.key], duration, clef });
  if (p1.accidental && (!keyMap || keyMap.get(p1.key[0]) !== p1.accidental)) chord.addModifier(new Accidental(p1.accidental), 0);
  if (p2.accidental && (!keyMap || keyMap.get(p2.key[0]) !== p2.accidental)) chord.addModifier(new Accidental(p2.accidental), 1);
  return chord;
}

export function keySignatureMap(accArr){
  const map = new Map();
  const noteMap = { do:'c', re:'d', mi:'e', fa:'f', sol:'g', la:'a', si:'b' };
  accArr.forEach(a=>{
    const m=a.match(/^(do|re|mi|fa|sol|la|si)(.*)$/);
    if(!m) return;
    const letter = noteMap[m[1]];
    let acc = m[2] || '';
    acc = acc.replace('\u266E','n').replace('♮','n').replace('\uD834\uDD2A','##').replace('\uD834\uDD2B','bb');
    map.set(letter, acc);
  });
  return map;
}
