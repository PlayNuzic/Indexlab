import { init as initCards } from '../../../libs/cards/index.js';
import drawPentagram from '../../../libs/notation/pentagram.js';
import { init as initSound, playChord } from '../../../libs/sound/index.js';
import { motherScalesData, scaleSemis } from '../../../shared/scales.js';
import { generateRotationVoicings, generatePermutationVoicings, eAToNotes } from '../../../shared/cards.js';
import { findChordRoot } from '../../../shared/hindemith.js';

window.addEventListener('DOMContentLoaded', async () => {
  await initSound('piano');
  const { parseNums, eAToNotes: eaToNotes, toAbsolute } = window.Helpers;

  const scaleSel = document.getElementById('scaleSel');
  const rotSel = document.getElementById('rotSel');
  const rootSel = document.getElementById('rootSel');
  const baseSel = document.getElementById('baseNote');
  const seqInput = document.getElementById('seq');
  const tabEA = document.getElementById('tabEA');
  const tabAc = document.getElementById('tabAc');
  const generateBtn = document.getElementById('generate');
  const cardsWrap = document.getElementById('components-wrap');
  const voicingModeSel = document.getElementById('voicingMode');
  const miniWrap = document.getElementById('miniWrap');
  const staffEl = document.getElementById('staff');
  const snapshotsEl = document.getElementById('snapshots');
  const saveBtn = document.getElementById('saveBtn');
  const resetSnapsBtn = document.getElementById('resetSnaps');
  const downloadBtn = document.getElementById('downloadSnaps');
  const uploadBtn = document.getElementById('uploadSnaps');
  const snapsFile = document.getElementById('snapsFile');
  const modeBtn = document.getElementById('modeBtn');
  const iaColorBtn = document.getElementById('iaColorBtn');
  const noteColorBtn = document.getElementById('noteColorBtn');
  const rootBtn = document.getElementById('rootBtn');
  const rootInfo = document.getElementById('rootInfo');
  const rootClose = document.getElementById('rootClose');
  const rootContent = document.getElementById('rootContent');

  let mode = 'eA';
  let scale = { id: 'DIAT', rot: 0, root: 0 };
  let baseMidi = 60;
  let notes = eaToNotes([2,2,1], scaleSemis(scale.id).length);
  let colorIntervals = false;
  let colorNotes = false;
  let highlightRoot = false;
  let flashTimer = null;
  let snapshots = window.SnapUtils.initSnapshots(JSON.parse(localStorage.getItem('app9Snapshots')||'null'));
  let activeSnapshot = null;
  let cardsApi = initCards(cardsWrap, { notes, scaleLen: scaleSemis(scale.id).length });

  const enNotes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  function refreshSelectors(){
    const ids = Object.keys(motherScalesData);
    scaleSel.innerHTML='';
    ids.forEach(id=>scaleSel.add(new Option(`${id} – ${motherScalesData[id].name}`, id)));
    scaleSel.value = scale.id;
    rotSel.innerHTML='';
    motherScalesData[scale.id].rotNames.forEach((n,i)=>rotSel.add(new Option(`${i} – ${n}`, i)));
    rotSel.value = scale.rot;
    rootSel.innerHTML='';
    for(let i=0;i<12;i++) rootSel.add(new Option(i,i));
    rootSel.value = scale.root;
  }
  refreshSelectors();

  function renderCards(){
    cardsWrap.innerHTML='';
    cardsApi = initCards(cardsWrap, { notes, scaleLen: scaleSemis(scale.id).length });
  }

  function renderStaff(){
    const abs = toAbsolute(notes, baseMidi);
    let colors = [];
    if(colorNotes) colors = notes.map(n=>window.Helpers.noteColor ? window.Helpers.noteColor(n%12) : '');
    drawPentagram(staffEl, abs, { chord:true, noteColors:colors, scaleId:scale.id, root:scale.root });
  }

  function renderMini(){
    miniWrap.innerHTML='';
    const groups = voicingModeSel.value==='rot'
      ? generatePermutationVoicings(notes)
      : generateRotationVoicings(notes);
    groups.forEach(g=>{
      g.voicings.forEach(v=>{
        const mdiv=document.createElement('div');
        const midis=toAbsolute(eAToNotes(v), baseMidi);
        drawPentagram(mdiv, midis, { chord:true, noteColors:[] });
        mdiv.onclick=()=>{ notes = eAToNotes(v); renderAll(); playChord(midis,2); };
        const info=document.createElement('div');
        info.textContent=v.join(' ');
        const wrap=document.createElement('div');
        wrap.appendChild(mdiv); wrap.appendChild(info);
        miniWrap.appendChild(wrap);
      });
    });
  }

  function renderSnapshots(){
    snapshotsEl.innerHTML='';
    snapshots.forEach((s,i)=>{
      const b=document.createElement('button');
      b.textContent=String.fromCharCode(65+i);
      b.classList.toggle('saved', !!s);
      b.classList.toggle('active', i===activeSnapshot);
      b.onclick=()=>{ if(!snapshots[i]) return; loadSnapshot(i); };
      snapshotsEl.appendChild(b);
    });
  }

  function saveSnapshot(idx){
    window.SnapUtils.saveSnapshot(snapshots, idx, notes, baseMidi, scale);
    localStorage.setItem('app9Snapshots', JSON.stringify(snapshots));
    renderSnapshots();
  }

  function loadSnapshot(idx){
    const data = window.SnapUtils.loadSnapshot(snapshots, idx);
    if(!data) return;
    notes = data.notes.slice();
    baseMidi = data.baseMidi;
    scale = data.scale;
    activeSnapshot = idx;
    refreshSelectors();
    renderAll();
  }

  function renderAll(){
    renderCards();
    renderStaff();
    renderMini();
    renderSnapshots();
  }

  generateBtn.onclick=()=>{
    const nums = parseNums(seqInput.value);
    if(mode==='eA') notes = eaToNotes(nums, scaleSemis(scale.id).length);
    else notes = nums.map(n=>((n%12)+12)%12);
    renderAll();
  };

  tabEA.onclick=()=>{ mode='eA'; tabEA.classList.add('active'); tabAc.classList.remove('active'); seqPrefix.textContent='eA('; };
  tabAc.onclick=()=>{ mode='Ac'; tabAc.classList.add('active'); tabEA.classList.remove('active'); seqPrefix.textContent='Ac('; };

  baseSel.onchange=()=>{ baseMidi = parseInt(baseSel.value,10); renderStaff(); };
  scaleSel.onchange=()=>{ scale.id=scaleSel.value; refreshSelectors(); renderAll(); };
  rotSel.onchange=()=>{ scale.rot=parseInt(rotSel.value,10); renderAll(); };
  rootSel.onchange=()=>{ scale.root=parseInt(rootSel.value,10); renderStaff(); };
  voicingModeSel.onchange=renderMini;

  saveBtn.onclick=()=>{
    const free=snapshots.findIndex(s=>s===null);
    const idx=activeSnapshot!==null?activeSnapshot:free;
    if(idx===-1) return;
    saveSnapshot(idx);
    activeSnapshot=idx;
  };
  resetSnapsBtn.onclick=()=>{ snapshots = window.SnapUtils.resetSnapshots(); activeSnapshot=null; localStorage.setItem('app9Snapshots', JSON.stringify(snapshots)); renderSnapshots(); };
  downloadBtn.onclick=()=>{ window.Presets.exportPresets(snapshots, 'app9-presets.json'); };
  uploadBtn.onclick=()=>{ window.Presets.importPresets(snapsFile, data=>{ snapshots = window.SnapUtils.initSnapshots(data); localStorage.setItem('app9Snapshots', JSON.stringify(snapshots)); renderSnapshots(); }); };

  iaColorBtn.onclick=()=>{ colorIntervals=!colorIntervals; iaColorBtn.classList.toggle('active', colorIntervals); renderStaff(); };
  noteColorBtn.onclick=()=>{ colorNotes=!colorNotes; noteColorBtn.classList.toggle('active', colorNotes); renderStaff(); };
  rootBtn.onclick=()=>{
    highlightRoot = !highlightRoot;
    rootBtn.classList.toggle('active', highlightRoot);
    if(highlightRoot){
      const pc = findChordRoot(notes);
      rootContent.textContent = `PC: ${notes.map(n=>n%12).join(' ')}\nRoot: ${pc}`;
      rootInfo.hidden=false;
      flashTimer=setInterval(()=>{ rootBtn.classList.toggle('flash'); },400);
    }else{
      rootInfo.hidden=true;
      if(flashTimer){ clearInterval(flashTimer); flashTimer=null; rootBtn.classList.remove('flash'); }
    }
    renderStaff();
  };
  rootClose.onclick=()=>{ highlightRoot=false; rootBtn.classList.remove('active'); rootInfo.hidden=true; if(flashTimer){ clearInterval(flashTimer); flashTimer=null; } renderStaff(); };

  renderAll();
});
