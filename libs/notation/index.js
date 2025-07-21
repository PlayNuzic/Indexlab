import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, StaveConnector } from '../vendor/vexflow/entry/vexflow.js';
import {
  midiToParts,
  needsDoubleStaff,
  createNote,
  createChord,
  keySignatureFrom
} from './helpers.js';

/**
 * Render an interval to a container using VexFlow.
 * @param {HTMLElement} container DOM element where the SVG will be attached.
 * @param {number} note1 MIDI value of the first note.
 * @param {number} note2 MIDI value of the second note.
 * @param {string} [mode='iS'] 'iS' for melodic intervals, 'iA' for harmonic.
 * @param {Object} [options]
 * @param {string} [options.scaleId] Mother scale ID used for the key signature.
 * @param {number} [options.root] Root pitch class (0=C) for the key signature.
 */
export function drawInterval(container, note1, note2, mode='iS', options={}){
  container.innerHTML = '';
  const useDouble = needsDoubleStaff(note1, note2);
  const keySig = keySignatureFrom(options);
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(180, useDouble ? 340 : 240);
  const context = renderer.getContext();

  if(useDouble){
    const treble = new Stave(10, 40, 160);
    treble.addClef('treble');
    if(keySig) treble.addKeySignature(keySig);
    const bass = new Stave(10, 160, 160);
    bass.addClef('bass');
    if(keySig) bass.addKeySignature(keySig);
    treble.setContext(context).draw();
    bass.setContext(context).draw();

    const brace = new StaveConnector(treble, bass);
    brace.setType(StaveConnector.type.BRACE);
    brace.setContext(context).draw();
    const line = new StaveConnector(treble, bass);
    line.setType(StaveConnector.type.SINGLE_LEFT);
    line.setContext(context).draw();

    const trebleVoice = new Voice({ numBeats:2, beatValue:4 });
    const bassVoice = new Voice({ numBeats:2, beatValue:4 });

    const asc = note2 >= note1;

    if(mode === 'iS'){
      const restTreble = new StaveNote({ keys:['b/4'], duration:'qr', clef:'treble' });
      const restBass = new StaveNote({ keys:['b/4'], duration:'qr', clef:'bass' });
      const n1Clef = note1 < 60 ? 'bass' : 'treble';
      const n2Clef = note2 < 60 ? 'bass' : 'treble';
      const n1 = createNote(note1, 'q', asc, n1Clef, Accidental, StaveNote);
      const n2 = createNote(note2, 'q', asc, n2Clef, Accidental, StaveNote);
      trebleVoice.addTickable(n1Clef === 'treble' ? n1 : restTreble);
      bassVoice.addTickable(n1Clef === 'bass' ? n1 : restBass);
      trebleVoice.addTickable(n2Clef === 'treble' ? n2 : restTreble);
      bassVoice.addTickable(n2Clef === 'bass' ? n2 : restBass);
    }else{
      const restTreble = new StaveNote({ keys:['b/4'], duration:'hr', clef:'treble' });
      const restBass = new StaveNote({ keys:['b/4'], duration:'hr', clef:'bass' });
      const clef1 = note1 < 60 ? 'bass' : 'treble';
      const clef2 = note2 < 60 ? 'bass' : 'treble';
      if(clef1 === clef2){
        const chord = createChord(note1, note2, 'h', asc, clef1, Accidental, StaveNote);
        if(clef1 === 'treble'){
          trebleVoice.addTickable(chord);
          bassVoice.addTickable(restBass);
        }else{
          bassVoice.addTickable(chord);
          trebleVoice.addTickable(restTreble);
        }
      }else{
        const n1 = createNote(note1, 'h', asc, clef1, Accidental, StaveNote);
        const n2 = createNote(note2, 'h', asc, clef2, Accidental, StaveNote);
        if(clef1 === 'treble') trebleVoice.addTickable(n1); else bassVoice.addTickable(n1);
        if(clef2 === 'treble') trebleVoice.addTickable(n2); else bassVoice.addTickable(n2);
        if(clef1 === 'treble' && clef2 !== 'treble') trebleVoice.addTickable(restTreble);
        if(clef1 === 'bass' && clef2 !== 'bass') bassVoice.addTickable(restBass);
      }
    }

    const formatter = new Formatter();
    formatter.joinVoices([trebleVoice]);
    formatter.joinVoices([bassVoice]);
    formatter.format([trebleVoice, bassVoice], 120);
    trebleVoice.draw(context, treble);
    bassVoice.draw(context, bass);
    return;
  }

  const stave = new Stave(10, 80, 160);
  stave.addClef('treble');
  if(keySig) stave.addKeySignature(keySig);
  stave.setContext(context).draw();

  if(mode === 'iS'){
    const asc = note2 >= note1;
    const p1 = midiToParts(note1, asc);
    const n1 = new StaveNote({ keys:[p1.key], duration:'q' });
    if(p1.accidental) n1.addModifier(new Accidental(p1.accidental), 0);
    const p2 = midiToParts(note2, asc);
    const n2 = new StaveNote({ keys:[p2.key], duration:'q' });
    if(p2.accidental) n2.addModifier(new Accidental(p2.accidental), 0);
    const notes = [n1, n2];
    const voice = new Voice({ numBeats:2, beatValue:4 });
    voice.addTickables(notes);
    new Formatter().joinVoices([voice]).format([voice], 120);
    voice.draw(context, stave);
  }else{
    const asc = note2 >= note1;
    const p1 = midiToParts(note1, asc);
    const p2 = midiToParts(note2, asc);
    const chord = new StaveNote({ keys:[p1.key, p2.key], duration:'h' });
    if(p1.accidental) chord.addModifier(new Accidental(p1.accidental), 0);
    if(p2.accidental) chord.addModifier(new Accidental(p2.accidental), 1);
    const voice = new Voice({ numBeats:2, beatValue:4 });
    voice.addTickables([chord]);
    new Formatter().joinVoices([voice]).format([voice], 120);
    voice.draw(context, stave);
  }
}

export * from './helpers.js';
export { drawPentagram } from './pentagram.js';
