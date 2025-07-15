import { Renderer, Stave, StaveNote, Voice, Formatter } from '../vendor/vexflow/entry/vexflow.js';

function midiToVexflow(midi){
  const pcs = ['c','c#','d','d#','e','f','f#','g','g#','a','a#','b'];
  const pc = pcs[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${pc}/${octave}`;
}

export function drawInterval(container, note1, note2, mode='iS'){
  container.innerHTML = '';
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(180, 120);
  const context = renderer.getContext();
  const stave = new Stave(10, 40, 160);
  stave.addClef('treble');
  stave.setContext(context).draw();

  if(mode === 'iS'){
    const notes = [
      new StaveNote({ keys:[midiToVexflow(note1)], duration:'q' }),
      new StaveNote({ keys:[midiToVexflow(note2)], duration:'q' })
    ];
    const voice = new Voice({ num_beats:2, beat_value:4 });
    voice.addTickables(notes);
    new Formatter().joinVoices([voice]).format([voice], 120);
    voice.draw(context, stave);
  }else{
    const chord = new StaveNote({ keys:[midiToVexflow(note1), midiToVexflow(note2)], duration:'h' });
    const voice = new Voice({ num_beats:2, beat_value:4 });
    voice.addTickables([chord]);
    new Formatter().joinVoices([voice]).format([voice], 120);
    voice.draw(context, stave);
  }
}
