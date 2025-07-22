import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, StaveConnector, GhostNote, KeySignature } from '../vendor/vexflow/entry/vexflow.js';
// Import helpers directly to avoid circular dependency with index.js
import { midiToParts, midiToPartsByKeySig } from './helpers.js';
import { getKeySignature } from '../../shared/scales.js';

const letterToPc = { c:0, d:2, e:4, f:5, g:7, a:9, b:11 };
const catLetterToPc = { do:0, re:2, mi:4, fa:5, sol:7, la:9, si:11 };

const SHARP_ORDER = ['fa','do','sol','re','la','mi','si'];
const FLAT_ORDER  = ['si','mi','la','re','sol','do','fa'];
const SHARP_LINES = [0,1.5,-0.5,1,2.5,0.5,2];
const FLAT_LINES  = [2,0.5,2.5,1,3,1.5,3.5];

function applyKeySignature(stave, accArr, clef='treble'){
  if(!accArr || !accArr.length) return new KeySignature('C').addToStave(stave);
  const offset = clef==='bass'?1:0;
  const list = accArr.map(a=>{
    const m=a.match(/^(do|re|mi|fa|sol|la|si)(.*)$/);
    if(!m) return null;
    const note=m[1];
    let sign=m[2]||'';
    sign=sign.replace('\u266E','n').replace('♮','n').replace('\uD834\uDD2A','##').replace('\uD834\uDD2B','bb');
    let idx=SHARP_ORDER.indexOf(note);
    let line;
    if(idx!==-1){ line=SHARP_LINES[idx]; }
    else { idx=FLAT_ORDER.indexOf(note); line=FLAT_LINES[idx]; }
    return {type:sign||'n', line:line+offset};
  }).filter(Boolean);
  const ks = new KeySignature('C');
  ks.accList = list;
  ks.addToStave(stave);
  return ks;
}

export function parseKeySignatureArray(arr){
  const map = {};
  if(!Array.isArray(arr)) return map;
  for(const item of arr){
    const letter = item.replace(/[#b]/,'');
    const acc = item.includes('#') ? '#' : 'b';
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
  const ksArray = getKeySignature(options.scaleId, options.root);
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

  const trebleV = new Voice({ numBeats: midis.length, beatValue: 4 });
  const bassV = new Voice({ numBeats: midis.length, beatValue: 4 });
  trebleV.setStrict(false);
  bassV.setStrict(false);

  const useKs = options.scaleId !== 'CROM';
  if (chord) {
    const byClef = { treble: [], bass: [] };
    midis.forEach(m => {
      const parts = useKs ? midiToPartsByKeySig(m, ksMap) : midiToParts(m, true);
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
      (clef === 'treble' ? trebleV : bassV).addTickable(note);
    });
  } else {
    midis.forEach(m => {
      const parts = useKs ? midiToPartsByKeySig(m, ksMap) : midiToParts(m, true);
      const clef = m < 60 ? 'bass' : 'treble';
      const note = new StaveNote({ keys: [parts.key], duration, clef });
      const need = useKs ? needsAccidental(parts, ksMap) : !!parts.accidental;
      if (need) note.addModifier(new Accidental(parts.accidental), 0);
      const target = clef === 'treble' ? trebleV : bassV;
      const other = clef === 'treble' ? bassV : trebleV;
      target.addTickable(note);
      other.addTickable(new GhostNote(duration));
    });
  }

  const voices = [];
  if(trebleV.getTickables().length){
    voices.push(trebleV);
  }
  if(bassV.getTickables().length){
    voices.push(bassV);
  }
  if(voices.length){
    const formatter = new Formatter();
    voices.forEach(v => formatter.joinVoices([v]));
    formatter.format(voices, 280);
    if(trebleV.getTickables().length) trebleV.draw(context, treble);
    if(bassV.getTickables().length) bassV.draw(context, bass);
  }
}

export default drawPentagram;

