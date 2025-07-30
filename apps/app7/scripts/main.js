import { drawPentagram } from '../../../libs/notation/index.js';
import { init as initSound, playNote, playChord, playMelody, ensureAudio } from '../../../libs/sound/index.js';
import { motherScalesData, scaleSemis, currentSemis } from '../../../shared/scales.js';

function toAbsolute(notes, base){
  const result=[base+notes[0]];
  for(let i=1;i<notes.length;i++){
    let next=base+notes[i];
    while(next<=result[i-1]) next+=12;
    result.push(next);
  }
  return result;
}

const scaleIDs = Object.keys(motherScalesData);
const ksScales = ['DIAT','ACUS','ARMme','ARMma'];

window.addEventListener('DOMContentLoaded', async () => {
  await initSound('piano');
  const staffEl = document.getElementById('staff');
  const playTrebleFwd = document.getElementById('playTrebleFwd');
  const playTrebleRev = document.getElementById('playTrebleRev');
  const playBassFwd = document.getElementById('playBassFwd');
  const playBassRev = document.getElementById('playBassRev');
  const scaleSel = document.getElementById('scaleSel');
  const rotSel = document.getElementById('rotSel');
  const rootSel = document.getElementById('rootSel');
  const ksSwitch = document.getElementById('ksSwitch');

  let useKeySig = true;

  let midisData = [];

  const state = { id: 'DIAT', rot: 0, root: 0 };

  scaleIDs.forEach(id => scaleSel.add(new Option(`${id} – ${motherScalesData[id].name}`, id)));
  [...Array(12).keys()].forEach(i => rootSel.add(new Option(i, i)));

  function refreshRot(){
    rotSel.innerHTML='';
    motherScalesData[state.id].rotNames.forEach((n,i)=>rotSel.add(new Option(`${i} – ${n}`, i)));
    rotSel.value = state.rot;
  }

  function setupNoteEvents(){
    const els = staffEl.querySelectorAll('[data-idx][data-clef]');
    els.forEach(el => {
      const idx = parseInt(el.dataset.idx,10);
      const clef = el.dataset.clef;
      el.addEventListener('click', async e=>{
        await ensureAudio();
        if(e.shiftKey){
          playChord(midisData[idx], 0.5);
        }else{
          playNote(clef==='treble'?midisData[idx][0]:midisData[idx][1], 0.5);
        }
      });
    });
  }

  function render(){
    const len = scaleSemis(state.id).length;
    const degrees = Array.from({length: len + 1}, (_,i) => i);
    const sems = currentSemis(state, degrees);
    const asc = toAbsolute(sems, 60);
    const desc = asc.slice().reverse().map(m => m - 24);
    midisData = asc.map((n,i)=>[n, desc[i]]);
    const withKs = useKeySig && ksScales.includes(state.id);
    const options = { duration:'w', scaleId: state.id, root: state.root, paired:true, useKeySig: withKs };
    drawPentagram(staffEl, midisData, options);
    setupNoteEvents();
  }

  refreshRot();
  scaleSel.value = state.id;
  rootSel.value = state.root;
  ksSwitch.classList.toggle('on', useKeySig);
  ksSwitch.setAttribute('aria-pressed', useKeySig);
  render();

  scaleSel.onchange = () => { state.id = scaleSel.value; refreshRot(); render(); };
  rotSel.onchange = () => { state.rot = parseInt(rotSel.value, 10); render(); };
  rootSel.onchange = () => { state.root = parseInt(rootSel.value, 10); render(); };
  ksSwitch.onclick = () => { useKeySig = !useKeySig; ksSwitch.classList.toggle('on', useKeySig); ksSwitch.setAttribute('aria-pressed', useKeySig); render(); };

  playTrebleFwd.onclick = async () => {
    await ensureAudio();
    playMelody(midisData.map(m=>m[0]), 0.5, 0);
  };
  playTrebleRev.onclick = async () => {
    await ensureAudio();
    playMelody(midisData.slice().reverse().map(m=>m[0]), 0.5, 0);
  };
  playBassFwd.onclick = async () => {
    await ensureAudio();
    playMelody(midisData.map(m=>m[1]), 0.5, 0);
  };
  playBassRev.onclick = async () => {
    await ensureAudio();
    playMelody(midisData.slice().reverse().map(m=>m[1]), 0.5, 0);
  };
});
