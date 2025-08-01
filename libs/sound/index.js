let synth;
let audioReady;
let muted = false;

export function ensureAudio(){
  if(!audioReady){
    audioReady = Tone.start();
  }
  return audioReady;
}

export function setMute(val){
  muted = !!val;
  if(typeof Tone !== 'undefined' && Tone.Destination){
    Tone.Destination.mute = muted;
  }
}

export function toggleMute(){
  setMute(!muted);
  return muted;
}

export function isMuted(){
  return muted;
}

export async function init(type='piano'){
  if(synth) synth.dispose();
  if(type==='piano'){
    const urls = {};
    for(let o=1;o<=7;o++){
      urls[`C${o}`] = `C${o}.mp3`;
      urls[`F#${o}`] = `Fs${o}.mp3`;
    }
    synth = new Tone.Sampler({
      urls,
      release:1,
      baseUrl:"https://tonejs.github.io/audio/salamander/"
    }).toDestination();
    try{
      await Tone.loaded();
    }catch(e){
      console.error('Error carregant mostres:', e);
    }
  }else{
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
  }
  setMute(muted);
}

export function playNote(midi, duration=1.5){
  if(!synth || muted) return;
  synth.triggerAttackRelease(Tone.Frequency(midi,'midi'), duration);
}

export function playChord(midis, duration=1.5){
  if(!synth || muted) return;
  synth.triggerAttackRelease(midis.map(n=>Tone.Frequency(n,'midi')), duration);
}

export function playMelody(midis,duration=1.5,gap=0.2){
  if(!synth || muted) return;
  midis.forEach((n,i)=>{
    setTimeout(()=>{
      synth.triggerAttackRelease(Tone.Frequency(n,'midi'), duration);
    },i*(duration*1000+gap*1000));
  });
}

