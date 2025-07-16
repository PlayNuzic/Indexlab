import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Factory, StaveConnector } from '../vendor/vexflow/entry/vexflow.js';

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

function needsDoubleStaff(n1, n2){
  return n1 < 60 || n2 < 60 || n1 > 81 || n2 > 81;
}

export function drawInterval(container, note1, note2, mode='iS'){
  container.innerHTML = '';
  const useDouble = needsDoubleStaff(note1, note2);

  if(useDouble){
    const vf = new Factory({ renderer:{ elementId: container, backend: Renderer.Backends.SVG, width:180, height:340 } });
    const asc = note2 >= note1;
    const trebleNotes = [];
    const bassNotes = [];

    function addNote(midi, dur){
      const parts = midiToParts(midi, asc);
      const clef = midi < 60 ? 'bass' : 'treble';
      const n = vf.StaveNote({ keys:[parts.key], duration:dur, clef });
      if(parts.accidental) n.addModifier(new Accidental(parts.accidental), 0);
      if(clef === 'bass') bassNotes.push(n); else trebleNotes.push(n);
    }

    if(mode === 'iS'){
      addNote(note1, 'q');
      addNote(note2, 'q');
    }else{
      const parts1 = midiToParts(note1, asc);
      const parts2 = midiToParts(note2, asc);
      const clef1 = note1 < 60 ? 'bass' : 'treble';
      const clef2 = note2 < 60 ? 'bass' : 'treble';
      if(clef1 === clef2){
        const n = vf.StaveNote({ keys:[parts1.key, parts2.key], duration:'h', clef:clef1 });
        if(parts1.accidental) n.addModifier(new Accidental(parts1.accidental), 0);
        if(parts2.accidental) n.addModifier(new Accidental(parts2.accidental), 1);
        if(clef1 === 'bass') bassNotes.push(n); else trebleNotes.push(n);
      }else{
        addNote(note1, 'h');
        addNote(note2, 'h');
      }
    }

    const trebleVoice = new Voice({ numBeats:2, beatValue:4 });
    const bassVoice = new Voice({ numBeats:2, beatValue:4 });

    if(mode === 'iS'){
      const restTreble = vf.StaveNote({ keys:['b/4'], duration:'qr', clef:'treble' });
      const restBass = vf.StaveNote({ keys:['b/4'], duration:'qr', clef:'bass' });
      trebleVoice.addTickable(trebleNotes[0] || restTreble);
      bassVoice.addTickable(bassNotes[0] || restBass);
      trebleVoice.addTickable(trebleNotes[1] || restTreble);
      bassVoice.addTickable(bassNotes[1] || restBass);
    }else{
      const restTreble = vf.StaveNote({ keys:['b/4'], duration:'hr', clef:'treble' });
      const restBass = vf.StaveNote({ keys:['b/4'], duration:'hr', clef:'bass' });
      trebleVoice.addTickables(trebleNotes.length ? trebleNotes : [restTreble]);
      bassVoice.addTickables(bassNotes.length ? bassNotes : [restBass]);
    }

    const system = vf.System({ x:10, y:40, width:160, spaceBetweenStaves:70 });
    system.addStave({ voices:[trebleVoice] }).addClef('treble');
    system.addStave({ voices:[bassVoice] }).addClef('bass');
    system.addConnector().setType(StaveConnector.type.BRACE);
    system.addConnector().setType(StaveConnector.type.SINGLE_LEFT);
    vf.draw();
    return;
  }

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
