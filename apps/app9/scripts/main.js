import { init as initCards } from '../../../libs/cards/index.js';
import drawPentagram from '../../../libs/notation/pentagram.js';
import { init as initSound, playChord } from '../../../libs/sound/index.js';
import { motherScalesData, scaleSemis } from '../../../shared/scales.js';
import { generateRotationVoicings, generatePermutationVoicings, eAToNotes,
  transposeNotes, rotateLeft as rotLeftLib, rotateRight as rotRightLib,
  duplicateCards, omitCards, generateComponents } from '../../../shared/cards.js';
import { findChordRoot, intervalRoot } from '../../../shared/hindemith.js';

window.addEventListener('DOMContentLoaded', async () => {
  await initSound('piano');
  const { parseNums, eAToNotes: eaToNotes, notesToEA, notesToAc, toAbsolute } = window.Helpers;

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
  const toggleMini = document.getElementById('toggleMini');
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
  const rotLeft = document.getElementById('rotLeft');
  const rotRight = document.getElementById('rotRight');
  const globUp = document.getElementById('globUp');
  const globDown = document.getElementById('globDown');
  const dupBtn = document.getElementById('dupBtn');
  const reduceBtn = document.getElementById('reduceBtn');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const transposeControls = document.getElementById('transposeControls');
  const transposeUp = document.getElementById('transposeUp');
  const transposeDown = document.getElementById('transposeDown');

  let mode = 'eA';
  let scale = { id: 'DIAT', rot: 0, root: 0 };
  let baseMidi = 60;
  let notes = eaToNotes([2,2,1], scaleSemis(scale.id).length);
  let colorIntervals = false;
  let colorNotes = false;
  let useKeySig = true;
  let highlightRoot = false;
  let flashTimer = null;
  let snapshots = window.SnapUtils.initSnapshots(JSON.parse(localStorage.getItem('app9Snapshots')||'null'));
  let activeSnapshot = null;
  let cardsApi = initCards(cardsWrap, { notes, scaleLen: scaleSemis(scale.id).length, showIntervals:true });
  let undoStack=[];
  let redoStack=[];
  let lastSaved=null;

  const enNotes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  function pushUndo(){
    undoStack.push(notes.slice());
    if(undoStack.length>5) undoStack.shift();
    redoStack=[];
  }

  function undoAction(){
    if(!undoStack.length) return;
    redoStack.push(notes.slice());
    notes=undoStack.pop();
    renderAll();
  }

  function redoAction(){
    if(!redoStack.length) return;
    undoStack.push(notes.slice());
    if(undoStack.length>5) undoStack.shift();
    notes=redoStack.pop();
    renderAll();
  }

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
    cardsApi = initCards(cardsWrap, { notes, scaleLen: scaleSemis(scale.id).length, showIntervals:true });
  }

  function renderStaff(){
    const abs = toAbsolute(notes, baseMidi);
    let colors = [];
    if(colorNotes) colors = notes.map(n=>window.Helpers.noteColor ? window.Helpers.noteColor(n%12) : '');
    if(colorIntervals) colors = notes.map((n,i)=>window.Helpers.intervalColor ? window.Helpers.intervalColor((n-notes[0]+12)%12) : '');
    const options = { chord:true, noteColors:colors };
    if(useKeySig){
      options.scaleId = scale.id;
      options.root = scale.root;
    }else{
      options.scaleId = 'CROM';
      options.root = 0;
    }
    drawPentagram(staffEl, abs, options);
  }

  function renderMini(){
    miniWrap.innerHTML='';
    if(!toggleMini.checked) return;
    const comps = generateComponents(notes);
    const groups = voicingModeSel.value==='rot'
      ? generateRotationVoicings(notes, {voices:notes.length})
      : generatePermutationVoicings(notes, {voices:notes.length});
    groups.forEach(g=>{
      const list = voicingModeSel.value==='perm' ? [g.voicings[0]] : g.voicings;
      list.forEach(v=>{
        const mdiv=document.createElement('div');
        const midis=toAbsolute(eAToNotes(v, scaleSemis(scale.id).length), baseMidi);
        drawPentagram(mdiv, midis, { chord:true, noteColors:[] });
        mdiv.onclick=()=>{ pushUndo(); notes = eAToNotes(v, scaleSemis(scale.id).length); renderAll(); playChord(midis,2); };
        const info=document.createElement('div');
        let order;
        if(voicingModeSel.value==='rot'){
          const idx=comps.indexOf(g.bassComponent);
          order=comps.slice(idx).concat(comps.slice(0,idx)).join(' ');
        }else{
          order=g.pattern;
        }
        info.textContent=order;
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
    seqInput.value = mode==='eA'
      ? notesToEA(notes, scaleSemis(scale.id).length)
      : notesToAc(notes);
  }

  generateBtn.onclick=()=>{
    pushUndo();
    const nums = parseNums(seqInput.value);
    if(mode==='eA'){
      notes = eaToNotes(nums, scaleSemis(scale.id).length);
      if(notes.length>1 && notes[0]===notes[notes.length-1]) notes.pop();
    }else{
      notes = nums.map(n=>((n%12)+12)%12);
    }
    activeSnapshot = null;
    renderAll();
  };

  tabEA.onclick=()=>{ mode='eA'; tabEA.classList.add('active'); tabAc.classList.remove('active'); seqPrefix.textContent='eA('; transposeControls.style.display='none'; renderAll(); };
  tabAc.onclick=()=>{ mode='Ac'; tabAc.classList.add('active'); tabEA.classList.remove('active'); seqPrefix.textContent='Ac('; transposeControls.style.display='flex'; renderAll(); };

  baseSel.onchange=()=>{ baseMidi = parseInt(baseSel.value,10); renderStaff(); };
  scaleSel.onchange=()=>{ scale.id=scaleSel.value; refreshSelectors(); renderAll(); };
  rotSel.onchange=()=>{ scale.rot=parseInt(rotSel.value,10); renderAll(); };
  rootSel.onchange=()=>{ scale.root=parseInt(rootSel.value,10); renderStaff(); };
  voicingModeSel.onchange=renderMini;
  toggleMini.onchange=()=>{ miniWrap.style.display=toggleMini.checked?'':'none'; };

  rotLeft.onclick=()=>{ pushUndo(); rotLeftLib(notes); renderAll(); };
  rotRight.onclick=()=>{ pushUndo(); rotRightLib(notes); renderAll(); };
  globUp.onclick=()=>{ pushUndo(); notes=transposeNotes(notes, scaleSemis(scale.id).length,1); renderAll(); };
  globDown.onclick=()=>{ pushUndo(); notes=transposeNotes(notes, scaleSemis(scale.id).length,-1); renderAll(); };
  dupBtn.onclick=()=>{ pushUndo(); notes=notes.concat(notes); renderAll(); };
  reduceBtn.onclick=()=>{ pushUndo(); if(notes.length>1){ notes.pop(); renderAll(); } };
  undoBtn.onclick=undoAction;
  redoBtn.onclick=redoAction;
  transposeUp.onclick=()=>{ pushUndo(); notes=transposeNotes(notes, scaleSemis(scale.id).length,1); renderAll(); };
  transposeDown.onclick=()=>{ pushUndo(); notes=transposeNotes(notes, scaleSemis(scale.id).length,-1); renderAll(); };

  saveBtn.onclick=()=>{
    const free=snapshots.findIndex(s=>s===null);
    if(activeSnapshot!==null){
      const overwrite = free===-1 || confirm('Sobreescriure preset '+String.fromCharCode(65+activeSnapshot)+'? Cancel·la per guardar nou');
      if(overwrite){
        saveSnapshot(activeSnapshot);
        lastSaved=activeSnapshot;
      }else if(free!==-1){
        saveSnapshot(free);
        activeSnapshot=free;
        lastSaved=free;
      }
    }else if(free!==-1){
      saveSnapshot(free);
      activeSnapshot=free;
      lastSaved=free;
    }else{
      alert('No hi ha ranures lliures de preset.');
      return;
    }
  };
  resetSnapsBtn.onclick=()=>{ snapshots = window.SnapUtils.resetSnapshots(); activeSnapshot=null; lastSaved=null; localStorage.setItem('app9Snapshots', JSON.stringify(snapshots)); renderSnapshots(); };
  downloadBtn.onclick=()=>{ window.Presets.exportPresets(snapshots, 'app9-presets.json'); };
  uploadBtn.onclick=()=>{ window.Presets.importPresets(snapsFile, data=>{ snapshots = window.SnapUtils.initSnapshots(data); localStorage.setItem('app9Snapshots', JSON.stringify(snapshots)); renderSnapshots(); }); };

  modeBtn.onclick=()=>{ useKeySig=!useKeySig; modeBtn.textContent=useKeySig?'Armadura':'Accidentals'; renderStaff(); };
  iaColorBtn.onclick=()=>{ colorIntervals=!colorIntervals; iaColorBtn.classList.toggle('active', colorIntervals); if(colorIntervals){ colorNotes=false; noteColorBtn.classList.remove('active'); } renderStaff(); };
  noteColorBtn.onclick=()=>{ colorNotes=!colorNotes; noteColorBtn.classList.toggle('active', colorNotes); if(colorNotes){ colorIntervals=false; iaColorBtn.classList.remove('active'); } renderStaff(); };
  rootBtn.onclick=()=>{
    highlightRoot = !highlightRoot;
    rootBtn.classList.toggle('active', highlightRoot);
    if(highlightRoot){
      const semis = notes.map(d=>{
        const arr=scaleSemis(scale.id);const len=arr.length;return (arr[(d+scale.rot)%len]+scale.root)%12;});
      const pcs=[...new Set(semis.map(n=>n%12))];
      const pc=findChordRoot(semis);
      let just=[];
      for(let i=0;i<pcs.length;i++){
        for(let j=i+1;j<pcs.length;j++){
          const interval=(pcs[j]-pcs[i]+12)%12;
          const pos=intervalRoot[interval];
          if(pos==='lower' && pcs[i]===pc) just.push(interval);
          if(pos==='upper' && pcs[j]===pc) just.push(interval);
        }
      }
      just=[...new Set(just)].sort((a,b)=>a-b);
      rootContent.textContent=`Pitch Class: ${pcs.join(' ')}\nRaíz: ${pc}\niA: ${just.join(' ')}`;
      rootInfo.hidden=false;
      flashTimer=setInterval(()=>{ rootBtn.classList.toggle('flash'); },400);
    }else{
      rootInfo.hidden=true;
      if(flashTimer){ clearInterval(flashTimer); flashTimer=null; rootBtn.classList.remove('flash'); }
    }
    renderStaff();
  };
  rootClose.onclick=()=>{ highlightRoot=false; rootBtn.classList.remove('active'); rootInfo.hidden=true; if(flashTimer){ clearInterval(flashTimer); flashTimer=null; } renderStaff(); };

  let dragging=false,dx=0,dy=0;
  rootInfo.addEventListener('mousedown',e=>{
    if(e.target.tagName==='BUTTON') return;
    dragging=true;dx=e.offsetX;dy=e.offsetY;rootInfo.style.right='auto';
  });
  document.addEventListener('mousemove',e=>{
    if(!dragging) return;
    rootInfo.style.left=(e.clientX-dx)+'px';
    rootInfo.style.top=(e.clientY-dy)+'px';
  });
  document.addEventListener('mouseup',()=>{dragging=false;});

  staffEl.addEventListener('click', async () => {
    const abs = toAbsolute(notes, baseMidi);
    await initSound('piano');
    playChord(abs,2);
  });

  miniWrap.style.display = toggleMini.checked ? '' : 'none';

  renderAll();
});
