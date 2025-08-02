import { drawPentagram, drawIntervalEllipse } from '../../../libs/notation/index.js';
import { init as initSound, playNote, playChord, playMelody, ensureAudio } from '../../../libs/sound/index.js';
import { motherScalesData, scaleSemis, currentSemis, changeMode, isSymmetricScale, intervalColor } from '../../../shared/scales.js';

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
  const eeInfo = document.getElementById('eeInfo');
  const modeLock = document.getElementById('modeLock');

  let useKeySig = true;
  let lockMode = false;

  let midisData = [];

  function clearEEHighlight(){
    const svg = staffEl.querySelector('svg');
    if(!svg) return;
    svg.querySelectorAll('.ee-ellipse').forEach(el=>el.remove());
  }

  function highlightEE(idx, color){
    const svg = staffEl.querySelector('svg');
    if(!svg) return;
    clearEEHighlight();
    const pairIdx = idx + 1;
    const tEl = svg.querySelector(`[data-idx="${pairIdx}"][data-clef="treble"] .vf-notehead`);
    const bEl = svg.querySelector(`[data-idx="${pairIdx}"][data-clef="bass"] .vf-notehead`);
    if(!tEl || !bEl) return;
    const svgRect = svg.getBoundingClientRect();
    const tRect = tEl.getBoundingClientRect();
    const bRect = bEl.getBoundingClientRect();
    const p1 = { x: tRect.left - svgRect.left, y: tRect.top - svgRect.top + tRect.height / 2, w: tRect.width };
    const p2 = { x: bRect.left - svgRect.left, y: bRect.top - svgRect.top + bRect.height / 2, w: bRect.width };
    const ell = drawIntervalEllipse(svg, p1, p2, color);
    if(ell){
      ell.setAttribute('fill-opacity', '0.35');
      ell.classList.add('ee-ellipse');
    }
  }

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
    ksSwitch.style.display = isSymmetricScale(state.id) ? 'none' : 'inline-block';
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

  function contrastColor(color){
    const m = color.match(/hsla?\((\d+),(\d+)%?,(\d+)%?,?(\d+(?:\.\d+)?)?\)/);
    if(!m) return '#000';
    return Number(m[3]) > 60 ? '#000' : '#fff';
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
    const baseEE = motherScalesData[state.id].ee;
    const rot = ((state.rot % baseEE.length) + baseEE.length) % baseEE.length;
    const rotEE = baseEE.slice(rot).concat(baseEE.slice(0, rot));
    eeInfo.innerHTML = rotEE.map((sd,i) => {
      const bg = intervalColor(sd, 12);
      const txt = contrastColor(bg);
      return `<span data-idx="${i}" style="background:${bg};color:${txt};padding:0 .3rem;margin:0 .2rem;border-radius:4px;">${sd}</span>`;
    }).join(' ');
    eeInfo.querySelectorAll('span').forEach(span => {
      const i = parseInt(span.dataset.idx,10);
      span.addEventListener('mouseenter', () => highlightEE(i, intervalColor(rotEE[i], 12)));
      span.addEventListener('mouseleave', clearEEHighlight);
    });
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
