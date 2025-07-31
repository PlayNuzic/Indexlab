import { KeySignature } from '../vendor/vexflow/entry/vexflow.js';

// Single reference array for diatonic letter cycle
const NOTE_CYCLE = ['c','d','e','f','g','a','b'];

export const letterToPc = { c:0, d:2, e:4, f:5, g:7, a:9, b:11 };

export function midiToLetterPart(midi, letter){
  const cycle = NOTE_CYCLE;
  const pc = ((midi % 12) + 12) % 12;
  let base = letterToPc[letter];
  let diff = (pc - base + 12) % 12;
  if(diff > 6) diff -= 12;
  if(diff === 2){
    letter = cycle[(cycle.indexOf(letter)+1)%7];
    base = letterToPc[letter];
    diff = (pc - base + 12) % 12;
    if(diff > 6) diff -= 12;
  }else if(diff === -2){
    letter = cycle[(cycle.indexOf(letter)+6)%7];
    base = letterToPc[letter];
    diff = (pc - base + 12) % 12;
    if(diff > 6) diff -= 12;
  }
  let acc = '';
  if(diff === -1) acc = 'b';
  else if(diff === 1) acc = '#';
  const octave = Math.floor(midi / 12) - 1;
  return { key:`${letter}/${octave}`, accidental: acc, pc, letter };
}

export function parseKeySignatureArray(arr){
  const map = {};
  if(!Array.isArray(arr)) return map;
  for(const item of arr){
    const letter = item.replace(/[#b\u266E]/g, '').toLowerCase();
    let acc = '';
    if(item.includes('#')) acc = '#';
    else if(item.includes('b')) acc = 'b';
    else if(item.includes('\u266E') || item.includes('♮')) acc = 'n';
    const pc = letterToPc[letter];
    if(pc !== undefined) map[pc] = acc;
  }
  return map;
}

const SHARP_ORDER = ['F','C','G','D','A','E','B'];
const FLAT_ORDER  = ['B','E','A','D','G','C','F'];
const SHARP_LINES = [0,1.5,-0.5,1,2.5,0.5,2];
const FLAT_LINES  = [2,0.5,2.5,1,3,1.5,3.5];

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
  for(const [letter, basePc] of Object.entries(letterToPc)){
    const acc = ksMap[basePc] || '';
    const adj = acc === '#' ? 1 : acc === 'b' ? -1 : 0;
    if(((basePc + adj + 12) % 12) === pc){
      const octave = Math.floor((midi - basePc - adj) / 12) - 1;
      return { key: `${letter}/${octave}`, accidental: acc };
    }
  }
  return midiToParts(midi, true);
}

export function midiToChromaticPart(midi, prev, prefer, forced){
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
  let diff = null;
  let delta = null;
  let cand = candSharp;
  if(forced){
    if(forced === '#') cand = candSharp;
    else if(forced === 'b') cand = candFlat;
    else if(forced === 'n') {
      cand = candSharp.accidental === '' ? candSharp : candFlat;
    }
  }
  if(cand === candSharp && candSharp.accidental === '' && candFlat.accidental !== ''){
    cand = candSharp;
  }else if(cand === candSharp && candFlat.accidental === '' && candSharp.accidental !== ''){
    cand = candFlat;
  }else if(!prev && !forced){
    if(prefer === '#') cand = candSharp;
    else if(prefer === 'b') cand = candFlat;
    else cand = candFlat;
  }else if(prev && !forced){
    diff = Math.abs(pc - prev.pc) % 12;
    delta = (pc - prev.pc + 12) % 12;
    if(diff === 3 || diff === 4 || diff === 8 || diff === 9){
      const cycle = NOTE_CYCLE;
      const prevIdx = cycle.indexOf(prev.letter);
      const useStep = prev && prev.diff && (prev.diff === 1 || prev.diff === 2);
      if(useStep){
        const stepIdx = delta === diff ? (prevIdx + 1) % 7 : (prevIdx + 7 - 1) % 7;
        const thirdIdx = delta === diff ? (prevIdx + 2) % 7 : (prevIdx + 7 - 2) % 7;
        const stepLetter = cycle[stepIdx];
        const thirdLetter = cycle[thirdIdx];
        if(candSharp.letter === stepLetter){
          cand = candSharp;
        }else if(candFlat.letter === stepLetter){
          cand = candFlat;
        }else if(candSharp.letter === thirdLetter){
          cand = candSharp;
        }else if(candFlat.letter === thirdLetter){
          cand = candFlat;
        }
      }else{
        const targetIdx = delta === diff ? (prevIdx + 2) % 7 : (prevIdx + 7 - 2) % 7;
        const target = cycle[targetIdx];
        if(candSharp.letter === target){
          cand = candSharp;
        }else if(candFlat.letter === target){
          cand = candFlat;
        }
      }
    }else if(diff === 2 || diff === 10){
      const cycle = ['c','d','e','f','g','a','b'];
      const prevIdx = cycle.indexOf(prev.letter);
      const targetIdx = delta === diff ? (prevIdx + 1) % 7 : (prevIdx + 7 - 1) % 7;
      const target = cycle[targetIdx];
      if(candSharp.letter === target){
        cand = candSharp;
      }else if(candFlat.letter === target){
        cand = candFlat;
      }
    }else if(diff === 2 || diff === 10){
      const cycle = ['c','d','e','f','g','a','b'];
      const prevIdx = cycle.indexOf(prev.letter);
      const targetIdx = delta === diff ? (prevIdx + 1) % 7 : (prevIdx + 7 - 1) % 7;
      const target = cycle[targetIdx];
      if(candSharp.letter === target){
        cand = candSharp;
      }else if(candFlat.letter === target){
        cand = candFlat;
      }
    }else if(diff === 2 || diff === 10){
      const cycle = ['c','d','e','f','g','a','b'];
      const prevIdx = cycle.indexOf(prev.letter);
      const targetIdx = delta === diff ? (prevIdx + 1) % 7 : (prevIdx + 7 - 1) % 7;
      const target = cycle[targetIdx];
      if(candSharp.letter === target){
        cand = candSharp;
      }else if(candFlat.letter === target){
        cand = candFlat;
      }
    }else if(diff === 2 || diff === 10){
      const cycle = NOTE_CYCLE;
      const prevIdx = cycle.indexOf(prev.letter);
      const targetIdx = delta === diff ? (prevIdx + 1) % 7 : (prevIdx + 7 - 1) % 7;
      const target = cycle[targetIdx];
      if(candSharp.letter === target){
        cand = candSharp;
      }else if(candFlat.letter === target){
        cand = candFlat;
      }
    }else if(diff === 1 || diff === 11){
      const cycle = NOTE_CYCLE;
      const prevIdx = cycle.indexOf(prev.letter);
      const targetIdx = delta === diff ? (prevIdx + 1) % 7 : (prevIdx + 7 - 1) % 7;
      const target = cycle[targetIdx];
      if(candSharp.letter === target){
        cand = candSharp;
      }else if(candFlat.letter === target){
        cand = candFlat;
      }else if(candSharp.letter === prev.letter && candFlat.letter !== prev.letter){
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
  const stepDiffs = [1,2,3,4,8,9,10,11];
  const isContiguous = prev && stepDiffs.includes(diff);
  if(prefer === '#') {
    if(candSharp.accidental === '#') {
      if(!isContiguous || candSharp.letter === cand.letter){
        cand = candSharp;
      }
    }
  }else if(prefer === 'b') {
    if(candFlat.accidental === 'b') {
      if(!isContiguous || candFlat.letter === cand.letter){
        cand = candFlat;
      }
    }
  }
  if(!forced && prev && prev.letter === cand.letter){
    const alt = cand === candSharp ? candFlat : candSharp;
    if(alt.letter !== prev.letter){
      cand = alt;
    }
  }
  let acc = cand.accidental;
  if(forced === 'n') acc = '\u266E';
  if(prev && prev.letter === cand.letter && prev.accidental && acc === ''){
    acc = '\u266E';
  }
  return { key: `${cand.letter}/${octave}`, accidental: acc, pc, letter: cand.letter };
}

export function midiSequenceToChromaticParts(midis, prefMap = null){
  function build(prefer){
    const arr = [];
    midis.forEach(m => {
      const forced = prefMap ? prefMap[((m % 12) + 12) % 12] : null;
      const prev = arr[arr.length-1];
      const part = midiToChromaticPart(m, prev, prefer, forced);
      if(prev){
        part.diff = Math.abs(part.pc - prev.pc) % 12;
      }
      arr.push(part);
    });
    return arr;
  }

  const initial = build(null);
  let prefer = null;
  for(const p of initial){
    if(p.accidental && p.accidental !== '\u266E'){
      if(p.accidental.includes('b')) prefer = 'b';
      else if(p.accidental.includes('#')) prefer = '#';
      if(prefer) break;
    }
  }

  let full = initial;
  if(prefer){
    const prefSeq = build(prefer);
    const altSeq = build(prefer === '#' ? 'b' : '#');
    const letterIdx = l => ['c','d','e','f','g','a','b'].indexOf(l);
    const leaps = seq => seq.reduce((acc, p, i)=>{
      if(i===0) return acc;
      const diff = Math.abs(letterIdx(p.letter) - letterIdx(seq[i-1].letter));
      if(diff > 1 && (p.diff === 1 || p.diff === 2)) return acc + 1;
      return acc;
    },0);
    const prefLeaps = leaps(prefSeq);
    const altLeaps = leaps(altSeq);
    full = prefLeaps <= altLeaps ? prefSeq : altSeq;
    prefer = prefLeaps <= altLeaps ? prefer : (prefer === '#' ? 'b' : '#');
  }

  const cycle = ['c','d','e','f','g','a','b'];
  for(let i=1;i<full.length;i++){
    const prev = full[i-1];
    const curr = full[i];
    if(curr.diff === undefined){
      curr.diff = Math.abs(curr.pc - prev.pc) % 12;
    }
    const prevIdx = cycle.indexOf(prev.letter);
    const currIdx = cycle.indexOf(curr.letter);
    const letterDiff = (currIdx - prevIdx + 7) % 7;
    const stepDir = midis[i] >= midis[i-1] ? 1 : -1;
    const expectedIdx = (prevIdx + stepDir + 7) % 7;
    if((curr.diff === 1 || curr.diff === 2) && letterDiff !== (stepDir === 1 ? 1 : 6)){
      const targetLetter = cycle[expectedIdx];
      const repl = midiToLetterPart(midis[i], targetLetter);
      repl.diff = curr.diff;
      full[i] = repl;
    }
  }
  for(let i=0;i<full.length-1;i++){
    const curr = full[i];
    const next = full[i+1];
    const forcedNext = prefMap ? prefMap[((midis[i+1] % 12) + 12) % 12] : null;
    if(curr.letter === next.letter && !forcedNext){
      const alt = midiToChromaticPart(midis[i+1], curr, prefer === 'b' ? '#' : 'b', null);
      if(alt.letter !== curr.letter){
        full[i+1] = alt;
      }else if(curr.accidental && next.accidental === ''){
        next.accidental = '\u266E';
        full[i+1] = next;
      }
    }
  }
  const cycle = NOTE_CYCLE;
  for(let i=0;i<full.length-1;i++){
    const curr = full[i];
    const next = full[i+1];
    const forcedNext = prefMap ? prefMap[((midis[i+1] % 12) + 12) % 12] : null;
    if(forcedNext) continue;
    const semiDiff = Math.abs(midis[i+1] - midis[i]) % 12;
    if(semiDiff === 1 || semiDiff === 2 || semiDiff === 10 || semiDiff === 11){
      const currIdx = cycle.indexOf(curr.letter);
      const nextIdx = cycle.indexOf(next.letter);
      let diff = nextIdx - currIdx;
      if(diff > 3) diff -= 7;
      if(diff < -3) diff += 7;
      if(Math.abs(diff) > 1){
        const step = midis[i+1] >= midis[i] ? 1 : -1;
        const target = cycle[(currIdx + step + 7) % 7];
        full[i+1] = midiToLetterPart(midis[i+1], target);
      }
    }
  }
  return full.map(({key, accidental}) => ({key, accidental}));
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
  accArr.forEach(a=>{
    const m = a.match(/^([A-Ga-g])(.+)?$/);
    if(!m) return;
    const letter = m[1].toLowerCase();
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

import { getKeySignature } from '../../shared/scales.js';

const DOUBLE_SHARP = '\uD834\uDD2A';
const DOUBLE_FLAT = '\uD834\uDD2B';
const BECUADRO = '\u266E';
const EXTRA_ACC_SPACE = 1; // Additional horizontal spacing between accidentals

export function baseKeyHadSharp(note, root){
  const ks = getKeySignature('DIAT', root);
  return ks.some(a => a.startsWith(note) && a.includes('#'));
}

export function baseKeyHadFlat(note, root){
  const ks = getKeySignature('DIAT', root);
  return ks.some(a => a.startsWith(note) && a.includes('b'));
}

export function applyKeySignature(stave, accArr, clef='treble', root=null){
  const ks = new KeySignature('C');
  if (!accArr || accArr.length === 0) {
    ks.addToStave(stave);
    return ks;
  }

  const hasSharps = accArr.some(acc => acc.includes('#') || acc.includes(DOUBLE_SHARP));
  const hasFlats  = accArr.some(acc => acc.includes('b') || acc.includes(DOUBLE_FLAT));
  const offset = clef === 'bass' ? 1 : 0;

  let orientation;
  const first = accArr[0] || '';
  if(first.includes('\u266E') || first.includes('♮')){
    const note = first[0].toUpperCase();
    orientation = note === 'B' ? 'flat' : note === 'F' ? 'sharp' : undefined;
  }
  if(!orientation){
    if(hasSharps && !hasFlats) orientation = 'sharp';
    else if(hasFlats && !hasSharps) orientation = 'flat';
    else orientation = 'sharp';
  }

  const list = [];
  accArr.forEach(a => {
    const m = a.match(/^([A-Ga-g])(.+)?$/);
    if(!m) return;
    const note = m[1].toUpperCase();
    let sign = m[2] || '';
    sign = sign.replace(BECUADRO, 'n')
               .replace('♮', 'n')
               .replace(DOUBLE_SHARP, '##')
               .replace(DOUBLE_FLAT, 'bb');
    let line;
    if(sign.startsWith('b')){
      line = FLAT_LINES[FLAT_ORDER.indexOf(note)];
    }else if(sign.startsWith('#')){
      line = SHARP_LINES[SHARP_ORDER.indexOf(note)];
    }else{
      if(root !== null){
        if(baseKeyHadSharp(note, root)){
          line = SHARP_LINES[SHARP_ORDER.indexOf(note)];
        }else if(baseKeyHadFlat(note, root)){
          line = FLAT_LINES[FLAT_ORDER.indexOf(note)];
        }else{
          line = orientation === 'flat'
               ? FLAT_LINES[FLAT_ORDER.indexOf(note)]
               : SHARP_LINES[SHARP_ORDER.indexOf(note)];
        }
      }else{
        line = orientation === 'flat'
             ? FLAT_LINES[FLAT_ORDER.indexOf(note)]
             : SHARP_LINES[SHARP_ORDER.indexOf(note)];
      }
      sign = 'n';
    }
    list.push({ type: sign || 'n', line: line + offset });
  });

  ks.customList = list;
  ks.format = function(){
    this.width = 0;
    this.children = [];
    this.accList = this.customList;
    for(let i=0;i<this.accList.length;i++){
      this.convertToGlyph(this.accList[i], this.accList[i+1], stave);
      if(i>0){
        const glyph = this.children[this.children.length - 1];
        if(glyph && typeof glyph.getXShift === 'function' && typeof glyph.setXShift === 'function'){
          glyph.setXShift(glyph.getXShift() + EXTRA_ACC_SPACE);
        }
        this.width += EXTRA_ACC_SPACE;
      }
    }
    if(typeof this.calculateDimensions === 'function') {
      this.calculateDimensions();
    }
    this.formatted = true;
  };
  ks.addToStave(stave);
  ks.format();
  return ks;
}
