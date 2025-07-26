import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, StaveConnector, GhostNote } from '../vendor/vexflow/entry/vexflow.js';
// Import helpers directly to avoid circular dependency with index.js
import { midiToParts, midiToPartsByKeySig, midiSequenceToChromaticParts, applyKeySignature, parseKeySignatureArray, letterToPc } from './helpers.js';
import { getKeySignature } from '../../shared/scales.js';

export function needsAccidental(parts, ksMap){
  if(!parts.accidental) return false;
  const basePc = letterToPc[parts.key[0]];
  const expected = ksMap ? ksMap[basePc] : undefined;
  return parts.accidental !== expected;
}

export function drawPentagram(container, midis = [], options = {}) {
  container.innerHTML = '';
  const { chord = false, duration = 'q', noteColors = [], highlightInterval = null } = options;
  const scaleId = options.scaleId ? String(options.scaleId) : '';
  const ksArray = getKeySignature(scaleId, options.root);
  const ksMap = parseKeySignatureArray(ksArray);
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(420, 340);
  const context = renderer.getContext();

  const treble = new Stave(20, 40, 360);
  treble.addClef('treble');
  // Sólo aplicamos la armadura en notación inglesa. Eliminamos la conversión a solfeo.
  applyKeySignature(treble, ksArray, 'treble', options.root);
  const bass = new Stave(20, 160, 360);
  bass.addClef('bass');
  // Sólo aplicamos la armadura en notación inglesa. Eliminamos la conversión a solfeo.
  applyKeySignature(bass, ksArray, 'bass', options.root);
  treble.setContext(context).draw();
  bass.setContext(context).draw();

  const brace = new StaveConnector(treble,bass);
  brace.setType(StaveConnector.type.BRACE);
  brace.setContext(context).draw();
  const line = new StaveConnector(treble,bass);
  line.setType(StaveConnector.type.SINGLE_LEFT);
  line.setContext(context).draw();

  if (midis.length) {
    const trebleVoice = new Voice({ numBeats: midis.length, beatValue: 4 });
    const bassVoice = new Voice({ numBeats: midis.length, beatValue: 4 });
    trebleVoice.setStrict(false);
    bassVoice.setStrict(false);

  const normScaleId = scaleId.toUpperCase();
  const noKsIds = ['CROM','OCT','HEX','TON'];
  const useKs = !noKsIds.includes(normScaleId);
  let byClef = { treble: [], bass: [] };
  let trebleNoteObj = null;
  let bassNoteObj = null;
  if (chord) {
    let partsSeq;
    if(useKs){
      partsSeq = midis.map(m => midiToPartsByKeySig(m, ksMap));
    }else{
      const sorted = midis.map((m,i)=>({m,i})).sort((a,b)=>a.m-b.m);
      const chromParts = midiSequenceToChromaticParts(sorted.map(s=>s.m));
      partsSeq = new Array(midis.length);
      sorted.forEach((obj, idx)=>{ partsSeq[obj.i] = chromParts[idx]; });
    }
    midis.forEach((m, idx) => {
      const parts = partsSeq[idx];
      const clef = m < 60 ? 'bass' : 'treble';
      byClef[clef].push({ parts, idx });
    });
    ['treble', 'bass'].forEach(clef => {
      if (!byClef[clef].length) return;
      const keys = byClef[clef].map(obj => obj.parts.key);
      const note = new StaveNote({ keys, duration, clef });
      byClef[clef].forEach((obj, i) => {
        const p = obj.parts;
        const need = useKs ? needsAccidental(p, ksMap) : !!p.accidental;
        if (need) note.addModifier(new Accidental(p.accidental), i);
        const color = noteColors[obj.idx];
        if (color) note.setKeyStyle(i, { fillStyle: color, strokeStyle: color });
      });
      if(clef === 'treble'){ trebleNoteObj = note; trebleVoice.addTickable(note); }
      else { bassNoteObj = note; bassVoice.addTickable(note); }
    });
  } else {
    const partsSeq = useKs ? null : midiSequenceToChromaticParts(midis);
    midis.forEach((m, idx) => {
      const parts = useKs ? midiToPartsByKeySig(m, ksMap) : partsSeq[idx];
      const clef = m < 60 ? 'bass' : 'treble';
      const note = new StaveNote({ keys: [parts.key], duration, clef });
      const need = useKs ? needsAccidental(parts, ksMap) : !!parts.accidental;
      if (need) note.addModifier(new Accidental(parts.accidental), 0);
      const color = noteColors[idx];
      if (color) note.setStyle({ fillStyle: color, strokeStyle: color });
      const target = clef === 'treble' ? trebleVoice : bassVoice;
      const other = clef === 'treble' ? bassVoice : trebleVoice;
      target.addTickable(note);
      other.addTickable(new GhostNote(duration));
    });
  }

  const voices = [];
  if(trebleVoice.getTickables().length){
    voices.push(trebleVoice);
  }
  if(bassVoice.getTickables().length){
    voices.push(bassVoice);
  }
  if(voices.length){
    const formatter = new Formatter();
    voices.forEach(v => formatter.joinVoices([v]));
    formatter.format(voices, 280);
    if(trebleVoice.getTickables().length) trebleVoice.draw(context, treble);
    if(bassVoice.getTickables().length) bassVoice.draw(context, bass);

    if(highlightInterval && (trebleNoteObj || bassNoteObj)){
      const [i1,i2,color] = highlightInterval;
      const svg = container.querySelector('svg');
      const getY = idx => {
        let pos = byClef.treble.findIndex(o=>o.idx===idx);
        if(pos!==-1 && trebleNoteObj) return trebleNoteObj.getYs()[pos];
        pos = byClef.bass.findIndex(o=>o.idx===idx);
        if(pos!==-1 && bassNoteObj) return bassNoteObj.getYs()[pos];
        return null;
      };
      const y1 = getY(i1);
      const y2 = getY(i2);
      if(y1!==null && y2!==null && svg){
        const yTop = Math.min(y1,y2);
        const yBot = Math.max(y1,y2);
        const x = Math.min(
          trebleNoteObj ? trebleNoteObj.getAbsoluteX() : Infinity,
          bassNoteObj ? bassNoteObj.getAbsoluteX() : Infinity
        );
        const w = Math.max(
          trebleNoteObj ? trebleNoteObj.getWidth() : 0,
          bassNoteObj ? bassNoteObj.getWidth() : 0
        );
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x', x - 5);
        rect.setAttribute('y', yTop - 4);
        rect.setAttribute('width', w + 10);
        rect.setAttribute('height', (yBot - yTop) + 8);
        rect.setAttribute('fill', color);
        svg.prepend(rect);
      }
    }
  }
  }
}

export default drawPentagram;

