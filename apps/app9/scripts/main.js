import { init as initCards } from '../../../libs/cards/index.js';
import drawPentagram from '../../../libs/notation/pentagram.js';
import { init as initSound, playChord } from '../../../libs/sound/index.js';
import { motherScalesData, scaleSemis, currentSemis } from '../../../shared/scales.js';
import { eAToNotes, transposeNotes, rotateLeft as rotLeftLib, rotateRight as rotRightLib,
  duplicateCards, omitCards, generateComponents, rotatePairs, permutePairsFixedBass } from '../../../shared/cards.js';
import { findChordRoot, intervalRoot } from '../../../shared/hindemith.js';

window.addEventListener('DOMContentLoaded', async () => {
  await initSound('piano');
  const { parseNums, eAToNotes: eaToNotes, notesToEA, notesToAc, toAbsolute, absoluteWithShifts } = window.Helpers;

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
  const CHROM_SCALES = ['CROM','OCT','HEX','TON'];

  let notes = eaToNotes([2,2,1], inputLen());
  let colorIntervals = false;
  let colorNotes = false;
  let useKeySig = true;
  let highlightRoot = false;
  let flashTimer = null;
  let snapshots = window.SnapUtils.initSnapshots(JSON.parse(localStorage.getItem('app9Snapshots')||'null'));
  let activeSnapshot = null;
  let cardsApi = null;
  let undoStack=[];
  let redoStack=[];
  let lastSaved=null;

  function inputLen(){
    return scaleSemis(scale.id).length;
  }

  function semisFromNotes(arr){
    return currentSemis(scale, arr);
  }

  function absoluteMidis(arr){
    return absoluteWithShifts(semisFromNotes(arr), baseMidi);
  }

  function updateRootInfo(){
    const semis = semisFromNotes(notes);
    const pcs = [...new Set(semis.map(n => n % 12))];
    const pc = findChordRoot(semis);
    let just = [];
    for(let i=0;i<pcs.length;i++){
      for(let j=i+1;j<pcs.length;j++){
        const interval = (pcs[j]-pcs[i]+12)%12;
        const pos = intervalRoot[interval];
        if(pos==='lower' && pcs[i]===pc) just.push(interval);
        if(pos==='upper' && pcs[j]===pc) just.push(interval);
      }
    }
    just = [...new Set(just)].sort((a,b)=>a-b);
    rootContent.textContent =
      `Pitch Class: ${pcs.join(' ')}\nRaíz: ${pc}\niA: ${just.join(' ')}`;
  }

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

  function fitNotes(){
    const len = inputLen();
    notes = notes.map(n => ((n % len) + len) % len);
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

  function onCardsChange(state){
    notes = state.notes.slice();
    if(highlightRoot) updateRootInfo();
    renderStaff();
    renderMini();
    seqInput.value = mode==='eA'
      ? notesToEA(notes, inputLen())
      : notesToAc(notes);
  }

  function renderCards(){
    cardsWrap.innerHTML='';
    cardsApi = initCards(cardsWrap, { notes, scaleLen: inputLen(), showIntervals:true, onChange:onCardsChange });
  }

  function renderStaff(){
    const abs = absoluteMidis(notes);
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
    let sets;
    if(voicingModeSel.value==='rot'){
      sets = rotatePairs(notes, comps);
    }else{
      sets = permutePairsFixedBass(notes, comps);
    }
    sets.forEach(obj=>{
      const mdiv=document.createElement('div');
      const midis=absoluteMidis(obj.notes);
      drawPentagram(mdiv, midis, { chord:true, noteColors:[], scaleId: useKeySig ? scale.id : 'CROM', root: useKeySig ? scale.root : 0 });
      const svg = mdiv.querySelector('svg');
      if(svg){
        svg.style.width='220px';
        svg.style.height='190px';
        svg.style.transform='none';
        svg.style.transformOrigin='top left';
        svg.setAttribute('viewBox','0 40 420 260');
        mdiv.style.width='220px';
        mdiv.style.height='190px';
        mdiv.style.overflow='hidden';
      }
      const info=document.createElement('div');
      info.textContent=obj.components.join(' ');
      const wrap=document.createElement('div');
      wrap.appendChild(mdiv); wrap.appendChild(info);
      miniWrap.appendChild(wrap);
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
    fitNotes();
    renderCards();
    renderStaff();
    renderMini();
    if(highlightRoot) updateRootInfo();
    renderSnapshots();
    seqInput.value = mode==='eA'
      ? notesToEA(notes, inputLen())
      : notesToAc(notes);
  }

  generateBtn.onclick=()=>{
    pushUndo();
    const nums = parseNums(seqInput.value);
    const len = inputLen();
    if(mode==='eA'){
      notes = eaToNotes(nums, len);
      if(notes.length>1 && notes[0]===notes[notes.length-1]) notes.pop();
    }else{
      notes = nums.map(n=>((n%len)+len)%len);
    }
    fitNotes();
    activeSnapshot = null;
    renderAll();
  };

  tabEA.onclick=()=>{ mode='eA'; tabEA.classList.add('active'); tabAc.classList.remove('active'); seqPrefix.textContent='eA('; transposeControls.style.display='none'; renderAll(); };
  tabAc.onclick=()=>{ mode='Ac'; tabAc.classList.add('active'); tabEA.classList.remove('active'); seqPrefix.textContent='Ac('; transposeControls.style.display='flex'; renderAll(); };

  baseSel.onchange=()=>{ baseMidi = parseInt(baseSel.value,10); renderStaff(); };
  scaleSel.onchange=()=>{
    scale.id=scaleSel.value;
    useKeySig = !CHROM_SCALES.includes(scale.id);
    modeBtn.textContent = useKeySig ? 'Armadura' : 'Accidentals';
    refreshSelectors();
    renderAll();
  };
  rotSel.onchange=()=>{ scale.rot=parseInt(rotSel.value,10); renderAll(); };
  rootSel.onchange=()=>{ scale.root=parseInt(rootSel.value,10); renderStaff(); };
  voicingModeSel.onchange=renderMini;
  toggleMini.onchange=()=>{ miniWrap.style.display=toggleMini.checked?'':'none'; };

  rotLeft.onclick=()=>{ pushUndo(); rotLeftLib(notes); fitNotes(); renderAll(); };
  rotRight.onclick=()=>{ pushUndo(); rotRightLib(notes); fitNotes(); renderAll(); };
  globUp.onclick=()=>{ pushUndo(); notes=transposeNotes(notes, inputLen(),1); fitNotes(); renderAll(); };
  globDown.onclick=()=>{ pushUndo(); notes=transposeNotes(notes, inputLen(),-1); fitNotes(); renderAll(); };
  dupBtn.onclick=()=>{ pushUndo(); notes=notes.concat(notes); renderAll(); };
  reduceBtn.onclick=()=>{ pushUndo(); if(notes.length>1){ notes.pop(); renderAll(); } };
  undoBtn.onclick=undoAction;
  redoBtn.onclick=redoAction;
  transposeUp.onclick=()=>{ pushUndo(); notes=transposeNotes(notes, inputLen(),1); fitNotes(); renderAll(); };
  transposeDown.onclick=()=>{ pushUndo(); notes=transposeNotes(notes, inputLen(),-1); fitNotes(); renderAll(); };

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
      updateRootInfo();
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
    const abs = absoluteMidis(notes);
    await initSound('piano');
    playChord(abs,2);
  });

  miniWrap.style.display = toggleMini.checked ? '' : 'none';

  modeBtn.textContent = useKeySig ? 'Armadura' : 'Accidentals';

  renderAll();
});
