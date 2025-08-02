import { drawPentagram, spellMidiSequence } from '../../../libs/notation/index.js';
import { init as initSound, playNote, playChord, playMelody, ensureAudio } from '../../../libs/sound/index.js';
import { motherScalesData, scaleSemis, currentSemis, changeMode, isSymmetricScale, getKeySignature } from '../../../shared/scales.js';

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
  const noteNamesEl = document.getElementById('noteNames');
  const modeLock = document.getElementById('modeLock');

  let useKeySig = true;
  let lockMode = false;

  let midisData = [];

  function updateModeBtn(){
    modeLock.textContent = lockMode ? 'Paralelo' : 'Relativo';
    modeLock.classList.toggle('on', lockMode);
    modeLock.setAttribute('aria-pressed', lockMode);
  }

  function updateKsBtn(){
    ksSwitch.textContent = useKeySig ? 'Armadura' : 'Accidentales';
    ksSwitch.classList.toggle('on', useKeySig);
    ksSwitch.setAttribute('aria-pressed', useKeySig);
  }

  const state = { id: 'DIAT', rot: 0, root: 0 };

  scaleIDs.forEach(id => scaleSel.add(new Option(`${id} – ${motherScalesData[id].name}`, id)));
  [...Array(12).keys()].forEach(i => rootSel.add(new Option(i, i)));

  function refreshRot(){
    rotSel.innerHTML='';
    const names = motherScalesData[state.id].rotNames;
    names.forEach((n,i)=>rotSel.add(new Option(`${i} – ${n}`, i)));
    if(state.rot >= names.length) state.rot = 0;
    rotSel.value = state.rot;
    const allowed = ['DIAT','ACUS','ARMma','ARMme'].includes(state.id);
    modeLock.style.display = allowed ? 'inline-block' : 'none';
    updateModeBtn();
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
    const ksArr = withKs ? getKeySignature(state.id, state.root) : [];
    const ascParts = spellMidiSequence(asc, ksArr);
    const names = ascParts.map(p => p.key[0].toUpperCase() + (p.accidental || ''));
    drawPentagram(staffEl, midisData, options);
    noteNamesEl.textContent = names.join(' ');
    setupNoteEvents();
  }

  refreshRot();
  scaleSel.value = state.id;
  rootSel.value = state.root;
  updateKsBtn();
  render();

  scaleSel.onchange = () => {
    state.id = scaleSel.value;
    if(motherScalesData[state.id].rotNames.length === 1) state.rot = 0;
    refreshRot();
    render();
  };
  rotSel.onchange = () => {
    const val = parseInt(rotSel.value, 10);
    changeMode(state, val, lockMode || isSymmetricScale(state.id));
    rootSel.value = state.root;
    render();
  };
  rootSel.onchange = () => { state.root = parseInt(rootSel.value, 10); render(); };
  modeLock.onclick = () => {
    lockMode = !lockMode;
    updateModeBtn();
  };
  ksSwitch.onclick = () => { useKeySig = !useKeySig; updateKsBtn(); render(); };

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
