export const letterToPc = { c:0, d:2, e:4, f:5, g:7, a:9, b:11 };

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

export function midiToPartsByKeySig(midi, ksMap) {
  if(!ksMap) return midiToParts(midi, true);
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  for(const [letter, basePc] of Object.entries(letterToPc)){
    const acc = ksMap[basePc] || '';
    const adj = acc === '#' ? 1 : acc === 'b' ? -1 : 0;
    if(((basePc + adj + 12) % 12) === pc){
      return { key: `${letter}/${octave}`, accidental: acc };
    }
  }
  return midiToParts(midi, true);
}

export function midiToChromaticPart(midi, prev){
  const sharpLetters = ['c','c','d','d','e','f','f','g','g','a','a','b'];
  const flatLetters  = ['c','d','d','e','e','f','g','g','a','a','b','b'];
  const sharps = ['', '#', '', '#', '', '', '#', '', '#', '', '#', ''];
  const flats  = ['', 'b', '', 'b', '', '', 'b', '', 'b', '', 'b', ''];
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const candSharp = {
    letter: sharpLetters[pc],
    accidental: sharps[pc]
  };
  const candFlat = {
    letter: flatLetters[pc],
    accidental: flats[pc]
  };
  let cand = candSharp;
  if(candSharp.accidental === '' && candFlat.accidental !== ''){
    cand = candSharp;
  }else if(candFlat.accidental === '' && candSharp.accidental !== ''){
    cand = candFlat;
  }else if(!prev){
    cand = candFlat;
  }else if(prev){
    const diff = Math.abs(pc - prev.pc) % 12;
    const delta = (pc - prev.pc + 12) % 12;
    if(diff === 3 || diff === 9){
      const cycle = ['c','d','e','f','g','a','b'];
      const prevIdx = cycle.indexOf(prev.letter);
      const targetIdx = delta === diff ? (prevIdx + 2) % 7 : (prevIdx + 7 - 2) % 7;
      const target = cycle[targetIdx];
      if(candSharp.letter === target){
        cand = candSharp;
      }else if(candFlat.letter === target){
        cand = candFlat;
      }
    }else if(diff === 1 || diff === 11){
      if(candSharp.letter === prev.letter && candFlat.letter !== prev.letter){
        cand = candFlat;
      }else if(candFlat.letter === prev.letter && candSharp.letter !== prev.letter){
        cand = candSharp;
      }
    }else{
      if(candSharp.letter === prev.letter && candFlat.letter !== prev.letter){
        cand = candFlat;
      }else if(candFlat.letter === prev.letter && candSharp.letter !== prev.letter){
        cand = candSharp;
      }
    }
  }
  let acc = cand.accidental;
  if(prev && prev.letter === cand.letter && prev.accidental && acc === ''){
    acc = '\u266E';
  }
  return { key: `${cand.letter}/${octave}`, accidental: acc, pc, letter: cand.letter };
}

export function midiSequenceToChromaticParts(midis){
  const out = [];
  midis.forEach(m => {
    out.push(midiToChromaticPart(m, out[out.length-1]));
  });
  return out.map(({key, accidental}) => ({key, accidental}));
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

export function keySignatureFrom(options){
  if(!options || options.scaleId !== 'DIAT') return null;
  const names = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const root = typeof options.root === 'number' ? options.root : 0;
  const idx = ((root % 12) + 12) % 12;
  return names[idx];
}
