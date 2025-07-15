import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from '../vendor/vexflow/entry/vexflow.js';

function midiToParts(midi, preferSharp=true){
  const letters = ['c','c','d','d','e','f','f','g','g','a','a','b'];
  const sharps =  ['', '#', '', '#', '', '', '#', '', '#', '', '#', ''];
  const flats  =  ['', 'b', '', 'b', '', '', 'b', '', 'b', '', 'b', ''];
  const pc = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return {
    key: `${letters[pc]}/${octave}`,
    accidental: (preferSharp ? sharps[pc] : flats[pc])
  };
}

export function drawInterval(container, note1, note2, mode='iS'){
  container.innerHTML = '';
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(180, 240);
  const context = renderer.getContext();
  const stave = new Stave(10, 80, 160);
  stave.addClef('treble');
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
