let synth;

async function init(type='piano'){
  if(synth) synth.dispose();
  if(type==='piano'){
    synth = new Tone.Sampler({
      urls:{
        "A3":"A3.mp3",
        "C4":"C4.mp3",
        "D#4":"Ds4.mp3",
        "F#4":"Fs4.mp3"
      },
      release:1,
      baseUrl:"https://tonejs.github.io/audio/salamander/"
    }).toDestination();
    await Tone.loaded();
  }else{
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
  }
}

function playNote(midi, duration=1.5){
  if(!synth) return;
  synth.triggerAttackRelease(Tone.Frequency(midi,'midi'), duration);
}

function playChord(midis, duration=1.5){
  if(!synth) return;
  synth.triggerAttackRelease(midis.map(n=>Tone.Frequency(n,'midi')), duration);
}

function playMelody(midis,duration=1.5,gap=0.2){
  if(!synth) return;
  midis.forEach((n,i)=>{
    setTimeout(()=>{
      synth.triggerAttackRelease(Tone.Frequency(n,'midi'), duration);
    },i*(duration*1000+gap*1000));
  });
}

window.Sound = { init, playNote, playChord, playMelody };

