import { drawPentagram } from '../../../libs/notation/index.js';
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
  const chordsSwitch = document.getElementById('chordsSwitch');
  const voicesLabel = document.getElementById('voicesLabel');
  const voicesSel = document.getElementById('voicesSel');
  const thirdsLabel = document.getElementById('thirdsLabel');
  const thirdsSel = document.getElementById('thirdsSel');

  let useKeySig = true;
  let lockMode = false;
  let chordMode = false;
  let chordVoices = 3;
  let chordPattern = null;

  let midisData = [];
  let hoverEEIdx = null;
  let hoverEAIdx = null;
  let lastEA = null;
  let selectedChordIdx = null;

  function clearEEHighlight(){
    hoverEEIdx = null;
    hoverEAIdx = null;
    render();
  }

  function highlightEE(idx){
    hoverEEIdx = idx;
    render();
  }

  function highlightEA(idx){
    hoverEAIdx = idx;
    render();
  }

  eeInfo.addEventListener('mouseleave', clearEEHighlight);
  staffEl.addEventListener('mouseleave', clearEEHighlight);

  staffEl.addEventListener('click', async e => {
    const el = e.target.closest('[data-idx]');
    if (!el) return;
    await ensureAudio();
    const idx = parseInt(el.dataset.idx, 10);
    if (chordMode) {
      const chordNotes = midisData[idx];
      if (e.shiftKey && e.altKey) {
        const desc = chordNotes.slice().sort((a,b)=>b-a);
        playMelody(desc, 0.3, 0);
      } else if (e.shiftKey) {
        const ascNotes = chordNotes.slice().sort((a,b)=>a-b);
        playMelody(ascNotes, 0.3, 0);
      } else {
        playChord(chordNotes, 1);
      }
      const intervals = chordNotes.slice(1).map((m,i)=>(m - chordNotes[i] + 12)%12);
      lastEA = intervals;
      selectedChordIdx = idx;
      renderEA();
    } else {
      if (e.shiftKey) {
        playChord(midisData[idx], 1);
      } else {
        const clef = el.dataset.clef;
        const midi = clef === 'treble' ? midisData[idx][0] : midisData[idx][1];
        playNote(midi, 1);
      }
    }
  });

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

  function defaultPattern(){
    const map = { 3:[4,3], 4:[4,3,3], 5:[4,3,3,4] };
    return map[chordVoices];
  }

  const thirdOptions = {
    3:['4 3','3 4','4 4','3 3'],
    4:['4 3 3','3 4 3','4 3 4','3 3 4','3 3 3','3 4 4','4 4 3'],
    5:['4 4 3 3','4 3 4 4','3 4 4 3','4 4 3 4','4 3 4 3','3 4 3 4','3 4 3 3']
  };

  function populateThirdsOptions(){
    const opts = thirdOptions[chordVoices] || [];
    thirdsSel.innerHTML = '';
    opts.forEach(p => thirdsSel.add(new Option(p, p)));
    const def = defaultPattern();
    if(def){
      const defStr = def.join(' ');
      thirdsSel.value = defStr;
      chordPattern = def;
    }
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

  function contrastColor(color){
    const m = color.match(/hsla?\((\d+),(\d+)%?,(\d+)%?,?(\d+(?:\.\d+)?)?\)/);
    if(!m) return '#000';
    return Number(m[3]) > 60 ? '#000' : '#fff';
  }

  function renderEA(){
    if(lastEA && chordMode){
      eeInfo.innerHTML = lastEA.map((sd,i)=>{
        const bg = intervalColor(sd,12);
        const txt = contrastColor(bg);
        return `<span data-idx="${i}" style="background:${bg};color:${txt};padding:0 .3rem;margin:0 .2rem;border-radius:4px;">${sd}</span>`;
      }).join(' ');
      eeInfo.querySelectorAll('span').forEach(span => {
        const i = parseInt(span.dataset.idx,10);
        span.addEventListener('mouseenter',()=>highlightEA(i));
        span.addEventListener('mouseleave',clearEEHighlight);
      });
    }else{
      eeInfo.textContent = '(Seleccione un acorde para ver su estructura)';
    }
  }

  function render(){
    const len = scaleSemis(state.id).length;
    if(chordMode){
      const degrees = Array.from({length: len + 1}, (_,i) => i);
      const sems = currentSemis(state, degrees);
      const asc = toAbsolute(sems, 60);
      midisData = asc.map((root,i) => {
        if(state.id === 'CROM'){
          const pattern = chordPattern || defaultPattern();
          const notes = [root];
          let acc = root;
          (pattern||[]).forEach(step=>{ acc += step; notes.push(acc); });
          return notes;
        }else{
          const degList = [];
          for(let j=0;j<chordVoices;j++) degList.push(i + 2*j);
          const semis = currentSemis(state, degList);
          const base = root - semis[0];
          return toAbsolute(semis, base);
        }
      });
      const withKs = useKeySig && ksScales.includes(state.id);
      const width = ['CROM','OCT'].includes(state.id) ? 145 + midisData.length * 55 : 550;
      const options = { singleClef:'treble', chord:true, duration:'w', scaleId: state.id, root: state.root, useKeySig: withKs, width };
      if(hoverEAIdx !== null && selectedChordIdx !== null && lastEA){
        const col = intervalColor(lastEA[hoverEAIdx],12);
        options.highlightChordIdx = selectedChordIdx;
        options.highlightIntervals = [[hoverEAIdx, hoverEAIdx + 1, col]];
      }
      drawPentagram(staffEl, midisData, options);
      renderEA();
      playTrebleFwd.style.display = 'none';
      playTrebleRev.style.display = 'none';
      playBassFwd.style.display = 'none';
      playBassRev.style.display = 'none';
      return;
    }
    playTrebleFwd.style.display = '';
    playTrebleRev.style.display = '';
    playBassFwd.style.display = '';
    playBassRev.style.display = '';
    const degrees = Array.from({length: len + 1}, (_,i) => i);
    const sems = currentSemis(state, degrees);
    const asc = toAbsolute(sems, 60);
    const desc = asc.slice().reverse().map(m => m - 24);
    midisData = asc.map((n,i)=>[n, desc[i]]);
    const baseEE = motherScalesData[state.id].ee;
    const rot = ((state.rot % baseEE.length) + baseEE.length) % baseEE.length;
    const rotEE = baseEE.slice(rot).concat(baseEE.slice(0, rot));
    const withKs = useKeySig && ksScales.includes(state.id);
    const options = { duration:'w', scaleId: state.id, root: state.root, paired:true, useKeySig: withKs };
    if(hoverEEIdx !== null){
      options.highlightInterval = [hoverEEIdx, hoverEEIdx + 1, intervalColor(rotEE[hoverEEIdx], 12)];
    }
    drawPentagram(staffEl, midisData, options);
    eeInfo.innerHTML = rotEE.map((sd,i) => {
      const bg = intervalColor(sd, 12);
      const txt = contrastColor(bg);
      return `<span data-idx="${i}" style="background:${bg};color:${txt};padding:0 .3rem;margin:0 .2rem;border-radius:4px;">${sd}</span>`;
    }).join(' ');
    eeInfo.querySelectorAll('span').forEach(span => {
      const i = parseInt(span.dataset.idx,10);
      span.addEventListener('mouseenter', () => highlightEE(i));
      span.addEventListener('mouseleave', clearEEHighlight);
    });
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
    if(chordMode){
      if(state.id === 'CROM'){
        thirdsLabel.style.display = 'inline-block';
        populateThirdsOptions();
      }else{
        thirdsLabel.style.display = 'none';
        chordPattern = null;
      }
    }
    hoverEEIdx = null;
    hoverEAIdx = null;
    lastEA = null;
    selectedChordIdx = null;
    render();
  };
  rotSel.onchange = () => {
    const val = parseInt(rotSel.value, 10);
    changeMode(state, val, lockMode || isSymmetricScale(state.id));
    rootSel.value = state.root;
    hoverEEIdx = null;
    hoverEAIdx = null;
    lastEA = null;
    selectedChordIdx = null;
    render();
  };
  rootSel.onchange = () => {
    state.root = parseInt(rootSel.value, 10);
    hoverEEIdx = null;
    hoverEAIdx = null;
    lastEA = null;
    selectedChordIdx = null;
    render();
  };
  modeLock.onclick = () => {
    lockMode = !lockMode;
    updateModeBtn();
  };
  ksSwitch.onclick = () => { useKeySig = !useKeySig; updateKsBtn(); render(); };
  chordsSwitch.onclick = () => {
    chordMode = !chordMode;
    chordsSwitch.classList.toggle('on', chordMode);
    chordsSwitch.setAttribute('aria-pressed', chordMode);
    hoverEEIdx = null;
    hoverEAIdx = null;
    lastEA = null;
    selectedChordIdx = null;
    voicesLabel.style.display = chordMode ? 'inline-block' : 'none';
    if(!chordMode){
      thirdsLabel.style.display = 'none';
      chordPattern = null;
    }else if(state.id === 'CROM'){
      thirdsLabel.style.display = 'inline-block';
      populateThirdsOptions();
    }
    render();
  };
  voicesSel.onchange = () => {
    chordVoices = parseInt(voicesSel.value,10);
    if(chordMode && state.id === 'CROM'){
      populateThirdsOptions();
      thirdsLabel.style.display = 'inline-block';
    }
    render();
  };
  thirdsSel.onchange = () => {
    chordPattern = thirdsSel.value.trim().split(' ').map(n=>parseInt(n,10));
    render();
  };

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
