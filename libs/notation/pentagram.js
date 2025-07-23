import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, StaveConnector, GhostNote } from '../vendor/vexflow/entry/vexflow.js';
// Import helpers directly to avoid circular dependency with index.js
import { midiToParts, midiToPartsByKeySig, midiSequenceToChromaticParts, applyKeySignature } from './helpers.js';
import { getKeySignature } from '../../shared/scales.js';

const letterToPc = { c:0, d:2, e:4, f:5, g:7, a:9, b:11 };
const catLetterToPc = { do:0, re:2, mi:4, fa:5, sol:7, la:9, si:11 };


export function parseKeySignatureArray(arr){
  const map = {};
  if(!Array.isArray(arr)) return map;
  for(const item of arr){
    const letter = item.replace(/[#b\u266E]/g,'');
    let acc = '';
    if(item.includes('#')) acc = '#';
    else if(item.includes('b')) acc = 'b';
    const pc = catLetterToPc[letter];
    if(pc !== undefined) map[pc] = acc;
  }
  return map;
}

export function needsAccidental(parts, ksMap){
  if(!parts.accidental) return false;
  const basePc = letterToPc[parts.key[0]];
  const expected = ksMap ? ksMap[basePc] : undefined;
  return parts.accidental !== expected;
}

export function drawPentagram(container, midis = [], options = {}) {
  container.innerHTML = '';
  if (!midis.length) return;
  const { chord = false, duration = 'q' } = options;
  const scaleId = options.scaleId ? String(options.scaleId) : '';
  const ksArray = getKeySignature(scaleId, options.root);
  const ksMap = parseKeySignatureArray(ksArray);
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(400, 340);
  const context = renderer.getContext();

  const treble = new Stave(10, 40, 360);
  treble.addClef('treble');
  applyKeySignature(treble, ksArray, 'treble');
  const bass = new Stave(10, 160, 360);
  bass.addClef('bass');
  applyKeySignature(bass, ksArray, 'bass');
  treble.setContext(context).draw();
  bass.setContext(context).draw();

  const brace = new StaveConnector(treble,bass);
  brace.setType(StaveConnector.type.BRACE);
  brace.setContext(context).draw();
  const line = new StaveConnector(treble,bass);
  line.setType(StaveConnector.type.SINGLE_LEFT);
  line.setContext(context).draw();
  const trebleVoice = new Voice({ numBeats: midis.length, beatValue: 4 });
  const bassVoice = new Voice({ numBeats: midis.length, beatValue: 4 });
  trebleVoice.setStrict(false);
  bassVoice.setStrict(false);

  const normScaleId = scaleId.toUpperCase();
  const noKsIds = ['CROM','OCT','HEX','TON'];
  const useKs = !noKsIds.includes(normScaleId);
  if (chord) {
    const byClef = { treble: [], bass: [] };
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
      byClef[clef].push(parts);
    });
    ['treble', 'bass'].forEach(clef => {
      if (!byClef[clef].length) return;
      const keys = byClef[clef].map(p => p.key);
      const note = new StaveNote({ keys, duration, clef });
      byClef[clef].forEach((p, i) => {
        const need = useKs ? needsAccidental(p, ksMap) : !!p.accidental;
        if (need) note.addModifier(new Accidental(p.accidental), i);
      });
      (clef === 'treble' ? trebleVoice : bassVoice).addTickable(note);
    });
  } else {
    const partsSeq = useKs ? null : midiSequenceToChromaticParts(midis);
    midis.forEach((m, idx) => {
      const parts = useKs ? midiToPartsByKeySig(m, ksMap) : partsSeq[idx];
      const clef = m < 60 ? 'bass' : 'treble';
      const note = new StaveNote({ keys: [parts.key], duration, clef });
      const need = useKs ? needsAccidental(parts, ksMap) : !!parts.accidental;
      if (need) note.addModifier(new Accidental(parts.accidental), 0);
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
  }
}

export default drawPentagram;

