import { init as initCards } from '../../../libs/cards/index.js';
import { drawPentagram } from '../../../libs/notation/index.js';
import { init as initSound, playChord, ensureAudio, toggleMute, isMuted } from '../../../libs/sound/index.js';
import { motherScalesData, scaleSemis, currentSemis, intervalColor } from '../../../shared/scales.js';
import { eAToNotes, transposeNotes, rotateLeft as rotLeftLib, rotateRight as rotRightLib,
  duplicateCards, omitCards, generateComponents, rotatePairs, permutePairsFixedBass } from '../../../shared/cards.js';
import { findChordRoot } from '../../../shared/hindemith.js';
import { identificarConjuntoForte } from '../../../shared/forte.js';

function contrastColor(color){
  const m = color.match(/hsla?\((\d+),(\d+)%?,(\d+)%?,?(\d+(?:\.\d+)?)?\)/);
  if(!m) return '#000';
  const l = Number(m[3]);
  return l > 60 ? '#000' : '#fff';
}

window.addEventListener('DOMContentLoaded', async () => {
  await initSound('piano');
  const { parseNums, eAToNotes: eaToNotes, notesToEA, notesToAc, toAbsolute, absoluteWithShifts } = window.Helpers;

  const scaleSel = document.getElementById('scaleSel');
  const rotSel = document.getElementById('rotSel');
  const rootSel = document.getElementById('rootSel');
  const scaleMode = document.getElementById('scaleMode');
  const baseSel = document.getElementById('baseNote');
  const seqInput = document.getElementById('seq');
  const tabEA = document.getElementById('tabEA');
  const tabAc = document.getElementById('tabAc');
  const generateBtn = document.getElementById('generate');
  const cardsWrap = document.getElementById('components-wrap');
  const rotModeBtn = document.getElementById('rotMode');
  const permModeBtn = document.getElementById('permMode');
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
  const rootBtn = document.getElementById('rootBtn');
  const rootInfo = document.getElementById('rootInfo');
  const rootHandle = document.getElementById('rootHandle');
  const rootClose = document.getElementById('rootClose');
  const rootCopy = document.getElementById('rootCopy');
  const rootContent = document.getElementById('rootContent');
  const iaLegend = document.getElementById('iaLegend');
  const rotLeft = document.getElementById('rotLeft');
  const rotRight = document.getElementById('rotRight');
  const globUp = document.getElementById('globUp');
  const globDown = document.getElementById('globDown');
  const muteBtn = document.getElementById('muteBtn');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const resetBtn = document.getElementById('resetBtn');
  const transposeControls = document.getElementById('transposeControls');
  const transposeUp = document.getElementById('transposeUp');
  const transposeDown = document.getElementById('transposeDown');

  let mode = 'eA';
  let scale = { id: 'DIAT', rot: 0, root: 0 };
  let baseMidi = 60;
  const asymScales = ['DIAT','ACUS','ARMma','ARMme'];
  const symScales = ['CROM','OCT','HEX','TON'];
  const allScales = [...asymScales, ...symScales];

  let notes = eaToNotes([2,2,1], inputLen());
  let colorIntervals = false;
  let useKeySig = true;
  let highlightRoot = false;
  let voicingMode = 'rot';
  let flashTimer = null;
  let snapshots = window.SnapUtils.initSnapshots(null);
  let activeSnapshot = null;
  let cardsApi = null;
  let components = generateComponents(notes);
  const UNDO_LIMIT = 100;
  let undoStack=[];
  let redoStack=[];
  let resetPoint=null;
  let lastSaved=null;
  let lastStaffMidis = absoluteMidis(notes);
  let isMuted = false;
  let miniSets = [];
  let regenMiniFlag = true;

  function inputLen(){
    return scaleSemis(scale.id).length;
  }

  function semisFromNotes(arr){
    return currentSemis(scale, arr);
  }

  function absoluteMidis(arr){
    return absoluteWithShifts(semisFromNotes(arr), baseMidi);
  }

  function consecutiveSemiDiffs(){
    const sems = semisFromNotes(notes);
    return sems.slice(1).map((s,i)=> (s - sems[i] + 12) % 12);
  }

  function playStaffIfChanged(midis){
    if(
      Array.isArray(lastStaffMidis) &&
      lastStaffMidis.length === midis.length &&
      midis.every((n,i)=>n===lastStaffMidis[i])
    ) return;
    lastStaffMidis = midis.slice();
    ensureAudio().then(()=>playChord(midis,2));
  }

  function updateRootInfo(){
    const semis = semisFromNotes(notes);
    const pcs = [...new Set(semis.map(n => n % 12))];
    const pc = findChordRoot(semis);
    const forte = identificarConjuntoForte(pcs);
    const rows = [
      forte.nombreForte ? ['Pitch Class', forte.nombreForte] : null,
      ['Raíz', pc],
      ['Vector intervalos', `&lang;${forte.vectorIntervalos.join(' ')}&rang;`],
      ['Forma normal', forte.formaNormal.join(' ')],
      ['Forma prima', forte.formaPrima.join(' ')]
    ].filter(Boolean);
    if(forte.infoAdicional) rows.push([forte.infoAdicional, '']);
    const table = rows.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('');
    rootContent.innerHTML = `<table><tbody>${table}</tbody></table>`;
  }

  function renderIaLegend(){
    if(!iaLegend) return;
    const rows = iaLegend.querySelectorAll('.legend-row');
    if(rows.length < 2) return;
    const build = nums => nums.map(n => {
      const col = intervalColor(n);
      const txt = contrastColor(col);
      return `<span style="background:${col};color:${txt};padding:0 .3rem;margin:0 .2rem;border-radius:4px;">iA(${n})</span>`;
    }).join(' ');
    rows[0].innerHTML = build([1,2,3,4,5,6]);
    rows[1].innerHTML = build([11,10,9,8,7,6]);
  }

  function pushUndo(){
    undoStack.push({notes:notes.slice(), components:components.slice()});
    if(undoStack.length>UNDO_LIMIT){
      undoStack.shift();
      if(resetPoint!==null) resetPoint = Math.max(0, resetPoint-1);
    }
    redoStack=[];
  }

  function undoAction(){
    if(!undoStack.length) return;
    redoStack.push({notes:notes.slice(), components:components.slice()});
    const snap=undoStack.pop();
    notes=snap.notes.slice();
    components=snap.components.slice();
    renderAll(false);
  }

  function redoAction(){
    if(!redoStack.length) return;
    undoStack.push({notes:notes.slice(), components:components.slice()});
    if(undoStack.length>UNDO_LIMIT){
      undoStack.shift();
      if(resetPoint!==null) resetPoint = Math.max(0, resetPoint-1);
    }
    const snap=redoStack.pop();
    notes=snap.notes.slice();
    components=snap.components.slice();
    renderAll(false);
  }

  function fitNotes(){
    const len = inputLen();
    notes = notes.map(n => ((n % len) + len) % len);
  }


  function refreshSelectors(){
    scaleSel.innerHTML='';
    allScales.forEach(id=>scaleSel.add(new Option(`${id} – ${motherScalesData[id].name}`, id)));
    if(!allScales.includes(scale.id)) scale.id = allScales[0];
    scaleSel.value = scale.id;
    rotSel.innerHTML='';
    motherScalesData[scale.id].rotNames.forEach((n,i)=>rotSel.add(new Option(`${i} – ${n}`, i)));
    rotSel.value = scale.rot;
    rootSel.innerHTML='';
    for(let i=0;i<12;i++) rootSel.add(new Option(i,i));
    rootSel.value = scale.root;
  }
  refreshSelectors();
  useKeySig=!symScales.includes(scale.id);
  modeBtn.textContent = useKeySig ? 'Armadura' : 'Accidentals';

  function onCardsChange(state){
    notes = state.notes.slice();
    components = state.components.slice();
    if(highlightRoot) updateRootInfo();
    renderStaff();
    if(regenMiniFlag) generateMiniSets();
    renderMini();
    seqInput.value = mode==='eA'
      ? notesToEA(notes, inputLen())
      : notesToAc(notes);
  }

  function renderCards(){
    cardsWrap.innerHTML='';
    cardsApi = initCards(cardsWrap, {
      notes,
      components,
      scaleLen: inputLen(),
      showIntervals: true,
      onChange: onCardsChange,
      draggable: false,
      showShift: false
    });
  }

  function renderStaff(){
    const container = document.getElementById('staff');
    if(!container) return;
    const abs = absoluteMidis(notes);
    const options = { chord:true, noteColors:[] };
    if(useKeySig){
      options.scaleId = scale.id;
      options.root = scale.root;
    }else{
      options.scaleId = 'CROM';
      options.root = 0;
    }
    if(colorIntervals){
      const semiDiffs = consecutiveSemiDiffs();
      options.highlightIntervals = semiDiffs.map((sd,i)=>[
        i,
        i+1,
        intervalColor(sd,12)
      ]);
    }
    drawPentagram(container, abs, options);
    playStaffIfChanged(abs);
  }

  function generateMiniSets(){
    if(!toggleMini.checked){
      miniSets = [];
      return;
    }
    if(voicingMode==='rot'){
      miniSets = rotatePairs(notes, components);
    }else{
      miniSets = permutePairsFixedBass(notes, components);
    }
  }

  function renderMini(){
    miniWrap.innerHTML='';
    if(!toggleMini.checked) return;
    miniSets.forEach(obj=>{
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
      wrap.style.cursor='pointer';
      wrap.onclick=()=>{ pushUndo(); notes=obj.notes.slice(); components=obj.components.slice(); renderAll(false); };
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
    window.SnapUtils.saveSnapshot(snapshots, idx, notes, baseMidi, scale, [], components);
    localStorage.setItem('app9Snapshots', JSON.stringify(snapshots));
    renderSnapshots();
  }

  function loadSnapshot(idx){
    const data = window.SnapUtils.loadSnapshot(snapshots, idx);
    if(!data) return;
    notes = data.notes.slice();
    components = data.components ? data.components.slice() : generateComponents(notes);
    baseMidi = data.baseMidi;
    scale = data.scale;
    activeSnapshot = idx;
    refreshSelectors();
    useKeySig = !symScales.includes(scale.id);
    modeBtn.textContent = useKeySig ? 'Armadura' : 'Accidentals';
    renderAll();
  }

  function renderAll(regenMini=true){
    regenMiniFlag = regenMini;
    fitNotes();
    renderCards();
    renderStaff();
    if(regenMini) generateMiniSets();
    renderMini();
    if(highlightRoot) updateRootInfo();
    renderSnapshots();
    seqInput.value = mode==='eA'
      ? notesToEA(notes, inputLen())
      : notesToAc(notes);
  }

  function generateChord(){
    pushUndo();
    const nums = parseNums(seqInput.value);
    const len = inputLen();
    if(mode==='eA'){
      notes = eaToNotes(nums, len);
      if(notes.length>1 && notes[0]===notes[notes.length-1]) notes.pop();
    }else{
      notes = nums.map(n=>((n%len)+len)%len);
    }
    components = generateComponents(notes);
    fitNotes();
    activeSnapshot = null;
    renderAll();
  }

  generateBtn.onclick=()=>{ generateChord(); resetPoint = undoStack.length; };

  tabEA.onclick=()=>{ mode='eA'; tabEA.classList.add('active'); tabAc.classList.remove('active'); seqPrefix.textContent='eA('; transposeControls.style.display='none'; renderAll(); };
  tabAc.onclick=()=>{ mode='Ac'; tabAc.classList.add('active'); tabEA.classList.remove('active'); seqPrefix.textContent='Ac('; transposeControls.style.display='flex'; renderAll(); };

  baseSel.onchange=()=>{ baseMidi = parseInt(baseSel.value,10); renderStaff(); };
  scaleSel.onchange=()=>{
    scale.id=scaleSel.value;
    useKeySig = !symScales.includes(scale.id);
    modeBtn.textContent = useKeySig ? 'Armadura' : 'Accidentals';
    refreshSelectors();
    fitNotes();
    renderAll();
  };
  rotSel.onchange=()=>{ scale.rot=parseInt(rotSel.value,10); fitNotes(); renderAll(); };
  rootSel.onchange=()=>{ scale.root=parseInt(rootSel.value,10); fitNotes(); renderAll(); };
  rotModeBtn.onclick=()=>{ voicingMode='rot'; rotModeBtn.classList.add('active'); permModeBtn.classList.remove('active'); generateMiniSets(); renderMini(); };
  permModeBtn.onclick=()=>{ voicingMode='perm'; permModeBtn.classList.add('active'); rotModeBtn.classList.remove('active'); generateMiniSets(); renderMini(); };
  toggleMini.onchange=()=>{ miniWrap.style.display=toggleMini.checked?'':'none'; };

  // Invert rotation buttons to match apps 5 and 6 behavior
  rotLeft.onclick=()=>{ pushUndo(); rotRightLib(notes, components); fitNotes(); renderAll(false); };
  rotRight.onclick=()=>{ pushUndo(); rotLeftLib(notes, components); fitNotes(); renderAll(false); };
  globUp.onclick=()=>{ pushUndo(); notes=transposeNotes(notes, inputLen(),1); fitNotes(); renderAll(false); };
  globDown.onclick=()=>{ pushUndo(); notes=transposeNotes(notes, inputLen(),-1); fitNotes(); renderAll(false); };
  let muted = false;
  muteBtn.onclick=()=>{
    muted = !muted;
    if(typeof Tone !== 'undefined' && Tone.Destination){
      Tone.Destination.mute = muted;
    }
    muteBtn.classList.toggle('muted', muted);
    muteBtn.textContent = muted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
  };
  resetBtn.onclick=()=>{
    if(resetPoint!==null){
      while(undoStack.length>resetPoint) undoAction();
    }
  };
  undoBtn.onclick=undoAction;
  redoBtn.onclick=redoAction;
  transposeUp.onclick=()=>{ pushUndo(); notes=transposeNotes(notes, inputLen(),1); fitNotes(); renderAll(false); };
  transposeDown.onclick=()=>{ pushUndo(); notes=transposeNotes(notes, inputLen(),-1); fitNotes(); renderAll(false); };

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
  iaColorBtn.onclick=()=>{ colorIntervals=!colorIntervals; iaColorBtn.classList.toggle('active', colorIntervals); renderStaff(); };
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
  rootCopy.onclick=()=>{ navigator.clipboard.writeText(rootContent.innerText).catch(()=>{}); };

  let dragging=false,dx=0,dy=0,parentRect=null,dragW=0,dragH=0;
  rootHandle.addEventListener('mousedown',e=>{
    if(e.target.tagName==='BUTTON') return;
    dragging=true;
    const rect=rootInfo.getBoundingClientRect();
    parentRect=rootInfo.offsetParent.getBoundingClientRect();
    dx=rect.right-e.clientX;
    dy=rect.bottom-e.clientY;
    dragW=rect.width;
    dragH=rect.height;
    rootInfo.style.right='auto';
    rootInfo.style.width=dragW+'px';
  });
  document.addEventListener('mousemove',e=>{
    if(!dragging) return;
    rootInfo.style.left=(e.clientX-parentRect.left+dx-dragW)+'px';
    rootInfo.style.top=(e.clientY-parentRect.top+dy-dragH)+'px';
  });
  document.addEventListener('mouseup',()=>{dragging=false;});

  if(staffEl){
    staffEl.addEventListener('click', async () => {
      const abs = absoluteMidis(notes);
      await initSound('piano');
      playChord(abs,2);
    });
  }

  miniWrap.style.display = toggleMini.checked ? '' : 'none';

  rotModeBtn.classList.add('active');
  permModeBtn.classList.remove('active');

  modeBtn.textContent = useKeySig ? 'Armadura' : 'Accidentals';

  Tone.Destination.mute = muted;
  muteBtn.classList.toggle('muted', muted);
  muteBtn.textContent = muted ? '\uD83D\uDD07' : '\uD83D\uDD0A';

  renderIaLegend();
  renderAll();
});
