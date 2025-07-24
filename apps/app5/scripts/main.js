import { init, playNote, playChord, playMelody, ensureAudio } from '../../../libs/sound/index.js';
import drawPentagram from '../../../libs/notation/pentagram.js';
import { motherScalesData, scaleSemis } from '../../../shared/scales.js';
import { generateComponents, ensureDuplicateComponents, transposeNotes,
  rotateLeft, rotateRight, shiftOct, moveCards as moveCardsLib,
  duplicateCards, omitCards, addCard } from '../../../shared/cards.js';
const { initSnapshots, saveSnapshot: saveSnapData, loadSnapshot: loadSnapData, resetSnapshots: resetSnapData } = window.SnapUtils;
const Presets = window.Presets;


window.addEventListener('DOMContentLoaded', async () => {
  await init();
  // -------- helpers --------
  const { parseNums, eAToNotes, notesToEA, notesToAc, toAbsolute, buildMatrix } = window.Helpers;

// -------- state --------
  let mode='eA';
  let scale={id:'ACUS', rot:0, root:0};
  let notes=eAToNotes([2,2,2], scaleSemis(scale.id).length);
  let playMode='iA';
  let snapshots = initSnapshots(JSON.parse(localStorage.getItem('app3Snapshots')||'null'));
  let activeSnapshot=null;
  let lastSaved=null;
  let recording=false;
  let recordStart=0;
  let recorded=[];
  let recordBpm=120;
  let playing=false;
  let playTimers=[];
  let showNm=false;
  let undoStack=[];
  let redoStack=[];
  // cache of diagonal MIDI notes and numbers for the currently rendered grid
  let diagArr=[];
  let diagNumsArr=[];
  let octShifts=Array(notes.length).fill(0);
  let components = generateComponents(notes);

  function pushUndo(){
    undoStack.push({
      notes:notes.slice(),
      octShifts:octShifts.slice(),
      components:components.slice()
    });
    if(undoStack.length>5) undoStack.shift();
    redoStack=[];
  }

  function undoAction(){
    if(!undoStack.length) return;
    redoStack.push({notes:notes.slice(),octShifts:octShifts.slice(),components:components.slice()});
    const snap=undoStack.pop();
    notes=snap.notes.slice();
    octShifts=snap.octShifts.slice();
    components=snap.components.slice();
    renderAll();
    notesChanged();
  }

  function redoAction(){
    if(!redoStack.length) return;
    undoStack.push({notes:notes.slice(),octShifts:octShifts.slice(),components:components.slice()});
    if(undoStack.length>5) undoStack.shift();
    const snap=redoStack.pop();
    notes=snap.notes.slice();
    octShifts=snap.octShifts.slice();
    components=snap.components.slice();
    renderAll();
    notesChanged();
  }
  function getIntervals(){
    const len=scaleSemis(scale.id).length;
    return notes.slice(1).map((n,i)=>((n-notes[i]+len)%len));
  }

  function fitNotes(){
    const len = scaleSemis(scale.id).length;
    notes = notes.map(n => ((n % len) + len) % len);
    while(octShifts.length < notes.length) octShifts.push(0);
    if(octShifts.length > notes.length) octShifts = octShifts.slice(0, notes.length);
  }

  function notesChanged(){
    if(activeSnapshot!==null){
      activeSnapshot=null;
      renderSnapshots();
    }
  }
  // starting MIDI note for Nm(0r3) -> default C4 = MIDI 60
  let baseMidi = 60;
  const baseSelect=document.getElementById('baseNote');
  baseSelect.value=String(baseMidi);
  baseSelect.onchange=()=>{baseMidi=parseInt(baseSelect.value,10);renderAll();};
  const degToSemi = d => {
    const sems = scaleSemis(scale.id);
    const len = sems.length;
    return (sems[(d + scale.rot) % len] + scale.root) % 12;
  };

  const degDiffToSemi = (start, diff) => {
    const sems = scaleSemis(scale.id);
    const len = sems.length;
    const startIdx = (start + scale.rot) % len;
    const targetIdx = (start + diff + scale.rot) % len;
    const sem1 = (sems[startIdx] + scale.root) % 12;
    const sem2 = (sems[targetIdx] + scale.root) % 12;
    let out = sem2 - sem1;
    if (out < 0) out += 12;
    return out;
  };

  const diagMidis = () => {
    const sems = notes.map(degToSemi);
    const abs = toAbsolute(sems, baseMidi);
    return abs.map((n,i)=>n + 12*(octShifts[i]||0));
  };
  const diagNums = () => showNm ? notes.map(degToSemi) : notes.slice();
  const seqInput=document.getElementById('seq');
  const prefix=document.getElementById('seqPrefix');
  const errorEl=document.getElementById('error');
  const gridWrap=document.getElementById('grid');
  const toggleBtn=document.getElementById('togglePlay');
  const snapWrap=document.getElementById('snapshots');
  const resetSnapsBtn=document.getElementById('resetSnaps');
  const downloadSnapsBtn=document.getElementById('downloadSnaps');
  const staffEl=document.getElementById("staff");
  const uploadSnapsBtn=document.getElementById('uploadSnaps');
  const snapsFileInput=document.getElementById('snapsFile');
  const bpmInput=document.getElementById('bpm');
  const tapBtn=document.getElementById('tapBtn');
  const recBtn=document.getElementById('recBtn');
  const playSeqBtn=document.getElementById('playSeq');
  const midiBtn=document.getElementById('midiBtn');
  const infoToggle=document.getElementById('infoToggle');
  const infoCard=document.getElementById('infoCard');
  const componentsWrap=document.getElementById('components-wrap');
  const rotLeft=document.getElementById('rotLeft');
  const rotRight=document.getElementById('rotRight');
  const globUp=document.getElementById('globUp');
  const globDown=document.getElementById('globDown');
  const undoBtn=document.getElementById('undoBtn');
  const redoBtn=document.getElementById('redoBtn');
  const transposeControls=document.getElementById('transposeControls');
  const transposeUp=document.getElementById('transposeUp');
  const transposeDown=document.getElementById('transposeDown');
  const scaleSel=document.getElementById('scaleSel');
  const rotSel=document.getElementById('rotSel');
  const rootSel=document.getElementById('rootSel');
  const showNmBtn=document.getElementById('showNm');
  seqInput.value=notesToEA(notes, scaleSemis(scale.id).length);

  const scaleIDs = Object.keys(motherScalesData);
  scaleSel.innerHTML='';
  scaleIDs.forEach(id => scaleSel.add(new Option(`${id} – ${motherScalesData[id].name}`, id)));
  rootSel.innerHTML='';
  [...Array(12).keys()].forEach(i => rootSel.add(new Option(i, i)));
  function refreshRot(){
    rotSel.innerHTML='';
    motherScalesData[scale.id].rotNames.forEach((n,i)=>rotSel.add(new Option(`${i} – ${n}`, i)));
    rotSel.value=scale.rot;
  }
  refreshRot();
  scaleSel.value=scale.id;
  rootSel.value=scale.root;

  scaleSel.onchange=()=>{
    scale.id=scaleSel.value;
    refreshRot();
    fitNotes();
    renderAll();
    seqInput.value=mode==='eA'?notesToEA(notes, scaleSemis(scale.id).length):notesToAc(notes);
  };
  rotSel.onchange=()=>{
    scale.rot=parseInt(rotSel.value,10);
    fitNotes();
    renderAll();
  };
  rootSel.onchange=()=>{
    scale.root=parseInt(rootSel.value,10);
    fitNotes();
    renderAll();
  };
  showNmBtn.onmousedown=()=>{ showNm=true; showNmBtn.classList.add('active'); renderAll(); };
  showNmBtn.onmouseup=showNmBtn.onmouseleave=()=>{ showNm=false; showNmBtn.classList.remove('active'); renderAll(); };

  function switchMode(m){
    mode=m;
    document.getElementById('tabEA').classList.toggle('active',m==='eA');
    document.getElementById('tabAc').classList.toggle('active',m==='Ac');
    prefix.textContent=m+'(';
    seqInput.placeholder=m==='eA'?'3 4 3':'0 3 7';
    const len=scaleSemis(scale.id).length;
    seqInput.value=m==='eA'?notesToEA(notes, len):notesToAc(notes);
    transposeControls.style.display=m==='Ac'? 'flex' : 'none';
    renderStaff();
  }

  document.getElementById('tabEA').onclick=()=>switchMode('eA');
  document.getElementById('tabAc').onclick=()=>switchMode('Ac');

  function transpose(delta){
    pushUndo();
    const len=scaleSemis(scale.id).length;
    notes = transposeNotes(notes, len, delta);
    seqInput.value = mode==='eA' ? notesToEA(notes,len) : notesToAc(notes);
    fitNotes();
    ensureDuplicateComponents(notes, components);
    renderAll();
    notesChanged();
  }

  transposeUp.onclick=()=>transpose(1);
  transposeDown.onclick=()=>transpose(-1);

  document.getElementById('generate').onclick=()=>{
    pushUndo();
    const nums=parseNums(seqInput.value);
    if(!nums.length){errorEl.textContent='Introduce números separados por espacios';return;}
    const len=scaleSemis(scale.id).length;
    notes= mode==='eA'? eAToNotes(nums, len) : nums.map(x=>((x%len)+len)%len);
    octShifts = Array(notes.length).fill(0);
    components = generateComponents(notes);
    errorEl.textContent='';
    renderAll();
    notesChanged();
  };

  function renderGrid(){
    const len=scaleSemis(scale.id).length;
    const matrix=showNm ? buildMatrix(notes.map(n=>degToSemi(n)),12) : buildMatrix(notes,len);
    const size=notes.length;
    diagArr = notes.length ? diagMidis() : [];
    diagNumsArr = notes.length ? diagNums() : [];
    renderStaff();
    const comps = computeComponents();
    gridWrap.innerHTML='';
    const table=document.createElement('table');
    table.className='matrix';
    for(let r=0;r<size;r++){
      const tr=document.createElement('tr');
      for(let c=0;c<size;c++){
        const td=document.createElement('td');
        td.dataset.r=r;td.dataset.c=c;
        const isDiag=r+c===size-1;
        const upper=r+c<size-1;
        if(isDiag){
          td.classList.add('diag');
          td.textContent = matrix[r][c];
          const compSpan=document.createElement('span');
          compSpan.className='comp-id';
          compSpan.textContent=comps[c];
          td.appendChild(compSpan);
          const shift = Math.floor((diagArr[c] - baseMidi) / 12);
          if(shift!==0){
            const span=document.createElement('span');
            span.className='oct-shift';
            span.textContent=(shift>0?'+':'-').repeat(Math.abs(shift));
            td.appendChild(span);
          }
        }else{
          td.textContent = matrix[r][c];
          td.classList.add(upper?'upper':'lower');
        }
        td.onclick=async e=>{
          await ensureAudio();
          const size=notes.length;
          const melodic = playMode==='iS' ? !e.shiftKey : e.shiftKey;
          const fastMelodic = e.altKey && melodic;
          let noteArr;
          if(isDiag){
          noteArr = diagArr;
          }else{
            const idx1=c;
            const idx2=size-1-r;
            if(upper){
              noteArr=[diagArr[idx1], diagArr[idx2]];
            }else{
              const low=diagArr[idx1];
              let interval=Number(matrix[r][c]);
              if(!showNm) interval=degDiffToSemi(notes[idx1], interval);
              noteArr=[low, low+interval];
            }
          }
          const bpm = parseFloat(bpmInput.value) || 120;
          const chordDur = 2 * (60 / bpm);
          const melodicDur = (60 / bpm) * (fastMelodic ? 0.5 : 1);
          if(melodic) playMelody(noteArr, melodicDur);
          else playChord(noteArr, chordDur);
          flashCell({r,c}, (melodic ? melodicDur : chordDur) * 1000, false);
          if(recording && Date.now()-recordStart >= 4*(60000/recordBpm)){
            const beat=(Date.now()-recordStart)/(60000/recordBpm);
            recorded.push({beat,notes:noteArr.slice(),melodic,fast:fastMelodic,coord:{r,c}});
          }
        };
        td.onmouseenter=()=>setHover({r,c});
        td.onmouseleave=()=>setHover(null);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    gridWrap.appendChild(table);
    resizeMatrix();
  }

  function resizeMatrix(){
    const size = notes.length;
    if(!size) return;
    const margin = 40;
    const avail = Math.min(window.innerWidth, window.innerHeight) - margin;
    const px = Math.max(30, Math.floor((avail / size) * 0.66));
    document.documentElement.style.setProperty('--cell-size', px + 'px');
  }

  function computeComponents(){
    ensureDuplicateComponents(notes, components);
    return components.slice();
  }
function renderStaff(){
    drawPentagram(staffEl, [], {
      scaleId: scale.id,
      root: scale.root
    });
    if(diagArr.length){
      drawPentagram(staffEl, diagArr, {
        scaleId: scale.id,
        root: scale.root,
        chord: mode === 'eA',
        duration: mode === 'eA' ? 'w' : 'q'
      });
    }
  }


  function moveCards(indices, target){
    pushUndo();
    const newIdx = moveCardsLib({notes, octShifts, components}, indices, target);
    selectedCards = new Set(newIdx);
    renderAll();
  }

  let selectedCards=new Set();
  function renderComponents(){
    componentsWrap.innerHTML='';
    const comps=computeComponents();
    const intervals=getIntervals();
    diagNumsArr.forEach((num,i)=>{
      const card=document.createElement('div');
      card.className='component-card';
      if(selectedCards.has(i)) card.classList.add('selected');
      card.draggable=true;
      let pressTimer;
      card.onmousedown=e=>{
        if(e.shiftKey){
          if(selectedCards.has(i)) selectedCards.delete(i); else selectedCards.add(i);
          renderComponents();
        }else{
          pressTimer=setTimeout(()=>{ if(selectedCards.has(i)) selectedCards.delete(i); else selectedCards.add(i); renderComponents(); },1000);
        }
      };
      card.onmouseup=card.onmouseleave=()=>clearTimeout(pressTimer);
      card.ondragstart=e=>{ clearTimeout(pressTimer); const grp=selectedCards.has(i)?Array.from(selectedCards).sort((a,b)=>a-b):[i]; e.dataTransfer.setData('text/plain',JSON.stringify(grp)); };
      card.ondragover=e=>e.preventDefault();
      card.ondrop=e=>{
        e.preventDefault();
        e.stopPropagation();
        const grp=JSON.parse(e.dataTransfer.getData('text/plain'));
        const min=Math.min(...grp);
        const target=min < i ? i + 1 : i;
        moveCards(grp, target);
        card.classList.remove('drop-hover');
        card.classList.add('drop-flash');
        setTimeout(()=>card.classList.remove('drop-flash'),150);
      };
      card.ondragenter=e=>{
        if(!card.classList.contains('drop-hover')) card.classList.add('drop-hover');
      };
      card.ondragleave=e=>{
        if(!card.contains(e.relatedTarget)) card.classList.remove('drop-hover');
      };
      const up=document.createElement('button');
      up.className='up';
      up.innerHTML='&#9650;';
      up.onclick=()=>{pushUndo();shiftOct(octShifts, i, 1);renderAll();};
      const down=document.createElement('button');
      down.className='down';
      down.innerHTML='&#9660;';
      down.onclick=()=>{pushUndo();shiftOct(octShifts, i, -1);renderAll();};
      const close=document.createElement('div');
      close.className='close';
      close.textContent='x';
      close.onclick=()=>{pushUndo();omitCards({notes, octShifts, components}, [i]);selectedCards.clear();renderAll();};
      const note=document.createElement('div');
      note.className='note';
      note.textContent=num;
      const shift=Math.floor((diagArr[i]-baseMidi)/12);
      const reg=document.createElement('div');
      reg.className='shift-ind';
      reg.textContent=shift!==0?(shift>0?'+':'-').repeat(Math.abs(shift)):'\u00A0';
      const label=document.createElement('div');
      label.className='label';
      label.textContent=comps[i];
      card.appendChild(up);
      card.appendChild(down);
      card.appendChild(close);
      card.appendChild(note);
      card.appendChild(reg);
      card.appendChild(label);
      componentsWrap.appendChild(card);
      if(i<notes.length-1){
        const ia=document.createElement('input');
        ia.className='ia-field';
        ia.value=intervals[i];
        ia.onchange=()=>{
          pushUndo();
          const len=scaleSemis(scale.id).length;
          let ints=getIntervals();
          const val=parseInt(ia.value,10);
          if(!isNaN(val)) ints[i]=((val%len)+len)%len;
          const base=notes[0];
          const rel=eAToNotes(ints,len);
          notes=rel.map(n=>((n+base)%len+len)%len);
          fitNotes();
          ensureDuplicateComponents(notes, components);
          renderAll();
          notesChanged();
        };
        componentsWrap.appendChild(ia);
      }
    });
    componentsWrap.ondragover=e=>e.preventDefault();
    componentsWrap.ondrop=e=>{
      e.preventDefault();
      const grp=JSON.parse(e.dataTransfer.getData('text/plain'));
      moveCards(grp, notes.length);
    };
  }

  function renderAll(){
    renderGrid();
    renderComponents();
    const len=scaleSemis(scale.id).length;
    seqInput.value=mode==='eA'?notesToEA(notes,len):notesToAc(notes);
  }

  function saveSnapshot(idx){
    saveSnapData(snapshots, idx, notes, baseMidi, scale);
    localStorage.setItem('app3Snapshots',JSON.stringify(snapshots));
    activeSnapshot=null;
    renderSnapshots();
  }

  function loadSnapshot(idx){
    const data=loadSnapData(snapshots,idx);
    if(data){
      notes=[...data.notes];
      baseMidi=data.baseMidi;
      baseSelect.value=String(baseMidi);
      scale = { ...data.scale };
      scaleSel.value=scale.id;
      rootSel.value=scale.root;
      refreshRot();
      rotSel.value=scale.rot;
      octShifts = Array(notes.length).fill(0);
      components = generateComponents(notes);
      fitNotes();
      const len=scaleSemis(scale.id).length;
      seqInput.value=mode==='eA'?notesToEA(notes, len):notesToAc(notes);
      renderAll();
      activeSnapshot=idx;
      renderSnapshots();
    }
  }

  function renderSnapshots(){
    snapWrap.innerHTML='';
    for(let i=0;i<10;i++){
      const b=document.createElement('button');
      b.textContent=i+1;
      b.classList.toggle('saved',!!snapshots[i]);
      b.classList.toggle('active',activeSnapshot===i);
      let long=false;
      Presets.onLongPress(b, () => {
        saveSnapshot(i);
        Presets.saveLocal('app3Snapshots', snapshots);
        long=true;
        lastSaved=i;
        renderSnapshots();
      });
      b.onclick=()=>{
        if(long){ long=false; return; }
        loadSnapshot(i);
        renderSnapshots();
      };
      snapWrap.appendChild(b);
      if(lastSaved===i){
        b.classList.add('lp-complete');
        setTimeout(()=>{ b.classList.remove('lp-complete'); lastSaved=null; },300);
      }
    }
  }

  function resetSnapshots(){
    snapshots = resetSnapData();
    localStorage.setItem('app3Snapshots', JSON.stringify(snapshots));
    activeSnapshot = null;
    renderSnapshots();
  }

  function downloadSnapshots(){
    Presets.exportPresets(snapshots, 'app3-presets.json');
  }

  function promptLoadSnapshots(){
    Presets.importPresets(snapsFileInput, data=>{
      snapshots=initSnapshots(data);
      localStorage.setItem('app3Snapshots', JSON.stringify(snapshots));
      activeSnapshot=null;
      renderSnapshots();
    });
  }

  function updatePlayMode(){
    toggleBtn.textContent=playMode==='iA'? 'Interval harm\xF2nic (iA)' : 'Interval mel\xF2dic (iS)';
  }

  function setHover(coord){
    const size = notes.length;
    document.querySelectorAll('.matrix td').forEach(td => {
      td.classList.remove('highlight-diag', 'highlight-pair');
    });
    if(!coord) return;
    const { r, c } = coord;
    const hoverIsDiag = r + c === size - 1;
    if(hoverIsDiag){
      document.querySelectorAll('.matrix td').forEach(td => {
        const rr = +td.dataset.r, cc = +td.dataset.c;
        if(rr + cc === size - 1) td.classList.add('highlight-diag');
      });
    }else{
      const compR = size - 1 - c, compC = size - 1 - r;
      const d1R = size - 1 - c, d1C = c;
      const d2R = r, d2C = size - 1 - r;
      document.querySelectorAll('.matrix td').forEach(td => {
        const rr = +td.dataset.r, cc = +td.dataset.c;
        if((rr === r && cc === c) || (rr === compR && cc === compC)) {
          td.classList.add('highlight-pair');
        }
        if((rr === d1R && cc === d1C) || (rr === d2R && cc === d2C)) {
          td.classList.add('highlight-diag');
        }
      });
    }
  }

  function flashCell(coord, duration = 200, playback = false){
    if(!coord) return;
    const size = notes.length;
    const { r, c } = coord;
    const pairCells = [];
    const diagCells = [];
    const isDiag = r + c === size - 1;

    if(isDiag){
      document.querySelectorAll('.matrix td').forEach(td => {
        const rr = +td.dataset.r, cc = +td.dataset.c;
        if(rr + cc === size - 1) diagCells.push(td);
      });
    }else{
      const compR = size - 1 - c, compC = size - 1 - r;
      const d1R = size - 1 - c, d1C = c;
      const d2R = r, d2C = size - 1 - r;
      document.querySelectorAll('.matrix td').forEach(td => {
        const rr = +td.dataset.r, cc = +td.dataset.c;
        if(rr === r && cc === c) pairCells.push(td);
        if(!playback && rr === compR && cc === compC) pairCells.push(td);
        if((rr === d1R && cc === d1C) || (rr === d2R && cc === d2C)) diagCells.push(td);
      });
    }

    diagCells.forEach(td => td.classList.add('playing-diag'));
    pairCells.forEach(td => td.classList.add('playing-pair'));
    setTimeout(() => {
      diagCells.forEach(td => td.classList.remove('playing-diag'));
      pairCells.forEach(td => td.classList.remove('playing-pair'));
    }, duration);
  }

  renderAll();
  renderSnapshots();
  updatePlayMode();
  switchMode(mode);
  // removed dedicated save button; hold any snapshot button for 2s to save
  resetSnapsBtn.onclick=resetSnapshots;
  downloadSnapsBtn.onclick=downloadSnapshots;
  uploadSnapsBtn.onclick=promptLoadSnapshots;
  rotLeft.onclick=()=>{pushUndo();rotateLeft(notes, octShifts, components);selectedCards.clear();renderAll();};
  rotRight.onclick=()=>{pushUndo();rotateRight(notes, octShifts, components);selectedCards.clear();renderAll();};
  globUp.onclick=()=>{selectedCards.clear();transpose(1);};
  globDown.onclick=()=>{selectedCards.clear();transpose(-1);};
  document.getElementById('dupBtn').onclick=()=>{
    if(!selectedCards.size) return;
    pushUndo();
    const idx=Array.from(selectedCards).sort((a,b)=>a-b);
    const newIdx = duplicateCards({notes, octShifts, components}, idx);
    selectedCards=new Set(newIdx);
    renderAll();
    notesChanged();
  };
  document.getElementById('reduceBtn').onclick=()=>{
    pushUndo();
    const len=scaleSemis(scale.id).length;
    const arr=notes.map((n,i)=>({
      note:((n%len)+len)%len,
      comp:components[i],
      val:degToSemi(n)+12*(octShifts[i]||0)
    }));
    arr.sort((a,b)=>a.val-b.val);
    notes=arr.map(o=>o.note);
    components=arr.map(o=>o.comp);
    octShifts=Array(notes.length).fill(0);
    ensureDuplicateComponents(notes, components);
    fitNotes();
    selectedCards.clear();
    renderAll();
    notesChanged();
  };
  undoBtn.onclick=undoAction;
  redoBtn.onclick=redoAction;
  document.body.addEventListener('click',e=>{
    if(!e.target.closest('.component-card') && !e.target.classList.contains('ia-field')){
      if(selectedCards.size){selectedCards.clear();renderComponents();}
    }
  });

  toggleBtn.onclick=()=>{ playMode= playMode==='iA'?'iS':'iA'; updatePlayMode(); };

  let taps=[];
  tapBtn.onclick=()=>{
    const now=Date.now();
    if(taps.length && now - taps[taps.length-1] > 2000) taps=[];
    taps.push(now);
    if(taps.length>=3){
      const diffs=taps.slice(1).map((t,i)=>t-taps[i]);
      const bpm=60000/(diffs.reduce((a,b)=>a+b,0)/diffs.length);
      bpmInput.value=bpm.toFixed(1);
      taps=[];
    }
  };

  recBtn.onclick=async()=>{
    await ensureAudio();
    if(recording){
      recording=false;
      recBtn.textContent='Gravar';
    }else{
      recordBpm=parseFloat(bpmInput.value)||120;
      recorded=[];
      const interval=60000/recordBpm;
      recordStart=Date.now();
      for(let i=0;i<4;i++){
        recorded.push({beat:i,notes:[84],melodic:false,coord:null});
        setTimeout(()=>playNote(84,60/recordBpm),i*interval);
      }
      recording=true;
      recBtn.textContent='Atura';
    }
  };

  function stopPlayback(){
    playTimers.forEach(clearTimeout);
    playTimers=[];
    playing=false;
    playSeqBtn.textContent='Reproduir';
  }

  playSeqBtn.onclick=async()=>{
    await ensureAudio();
    if(playing){
      stopPlayback();
      return;
    }
    if(!recorded.length) return;
    const bpm=parseFloat(bpmInput.value)||120;
    playing=true;
    playSeqBtn.textContent='Atura';
    recorded.forEach(ev=>{
      const t = ev.beat * 60000 / bpm;
      const id = setTimeout(() => {
        const chordDur = 2 * (60 / bpm);
        const melodicDur = (60 / bpm) * (ev.fast ? 0.5 : 1);
        ev.melodic ? playMelody(ev.notes, melodicDur) : playChord(ev.notes, chordDur);
        if(ev.coord) flashCell(ev.coord, (ev.melodic ? melodicDur : chordDur) * 1000, true);
      }, t);
      playTimers.push(id);
    });
    const last=recorded[recorded.length-1];
    const end=last.beat*60000/bpm+2000;
    const endTimer=setTimeout(stopPlayback,end);
    playTimers.push(endTimer);
  };

  midiBtn.onclick=()=>{
    if(!recorded.length) return;
    const midi=new Midi();
    const bpm=parseFloat(bpmInput.value)||120;
    midi.header.setTempo(bpm);
    // use fixed PPQ and ticks for note placement
    const ppq = 480; // Midi.js defaults to 480 and the property is read-only
    const track=midi.addTrack();
    recorded.forEach(ev=>{
      const baseTick = Math.round(ev.beat * ppq);
      if(ev.melodic){
        const step = ev.fast ? ppq / 2 : ppq;
        ev.notes.forEach((n,i)=>{
          track.addNote({
            midi:n,
            ticks: baseTick + i * step,
            durationTicks: step
          });
        });
      }else{
        ev.notes.forEach(n=>track.addNote({
          midi:n,
          ticks: baseTick,
          durationTicks: ppq
        }));
      }
    });
    const blob=new Blob([midi.toArray()],{type:'audio/midi'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='sequence.mid';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  };

  infoToggle.onclick=()=>{
    const hidden = infoCard.hasAttribute('hidden');
    if(hidden){
      infoCard.removeAttribute('hidden');
      infoToggle.textContent='Amaga informació';
    }else{
      infoCard.setAttribute('hidden','');
      infoToggle.textContent='Mostra informació';
    }
  };

  window.addEventListener('resize', resizeMatrix);
});
