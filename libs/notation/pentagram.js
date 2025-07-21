import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, StaveConnector } from '../vendor/vexflow/entry/vexflow.js';
import { midiToParts, keySignatureFrom } from './helpers.js';
import { getKeySignature } from '../../shared/scales.js';

const letterToPc = { c:0, d:2, e:4, f:5, g:7, a:9, b:11 };
const catLetterToPc = { do:0, re:2, mi:4, fa:5, sol:7, la:9, si:11 };

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

export function drawPentagram(container, midis=[], options={}){
  container.innerHTML='';
  if(!midis.length) return;
  const keySigName = keySignatureFrom(options);
  const ksMap = parseKeySignatureArray(getKeySignature(options.scaleId, options.root));
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(200,340);
  const context = renderer.getContext();

  const treble = new Stave(10,40,180);
  treble.addClef('treble');
  if(keySigName) treble.addKeySignature(keySigName);
  const bass = new Stave(10,160,180);
  bass.addClef('bass');
  if(keySigName) bass.addKeySignature(keySigName);
  treble.setContext(context).draw();
  bass.setContext(context).draw();

  const brace = new StaveConnector(treble,bass);
  brace.setType(StaveConnector.type.BRACE);
  brace.setContext(context).draw();
  const line = new StaveConnector(treble,bass);
  line.setType(StaveConnector.type.SINGLE_LEFT);
  line.setContext(context).draw();

  const trebleVoice = new Voice({ numBeats: midis.length, beatValue:4 });
  const bassVoice = new Voice({ numBeats: midis.length, beatValue:4 });
  trebleVoice.setStrict(false);
  bassVoice.setStrict(false);

  midis.forEach(m => {
    const parts = midiToParts(m, true);
    const clef = m < 60 ? 'bass' : 'treble';
    const note = new StaveNote({ keys:[parts.key], duration:'q', clef });
    if(needsAccidental(parts, ksMap)) note.addModifier(new Accidental(parts.accidental),0);
    (clef==='treble'?trebleVoice:bassVoice).addTickable(note);
  });

  const formatter = new Formatter();
  formatter.joinVoices([trebleVoice]);
  formatter.joinVoices([bassVoice]);
  formatter.format([trebleVoice,bassVoice], 140);
  trebleVoice.draw(context, treble);
  bassVoice.draw(context, bass);
}

export default drawPentagram;

