import { drawPentagram } from '../../../libs/notation/index.js';
import { init, playChord, playMelody, ensureAudio } from '../../../libs/sound/index.js';
import { motherScalesData, scaleSemis, intervalColor, intervalCategory, intervalTypeBySemitone, intervalCategoryFor, degToSemi, degDiffToSemi, currentSemis } from '../../../shared/scales.js';
import { pitchColor } from '../../../libs/vendor/chromatone-theory/index.js';
import { findChordRoot } from '../../../shared/hindemith.js';

function pastelColor(color){
  const m = color.match(/hsla?\((\d+),(\d+)%?,(\d+)%?,?(\d+(?:\.\d+)?)?\)/);
  if(!m) return color;
  const h = Number(m[1]);
  const a = m[4] || 1;
  return `hsla(${h},60%,85%,${a})`;
}

function contrastColor(color){
  const m = color.match(/hsla?\((\d+),(\d+)%?,(\d+)%?,?(\d+(?:\.\d+)?)?\)/);
  if(!m) return '#000';
  const l = Number(m[3]);
  return l > 60 ? '#000' : '#fff';
}
import { generateComponents, ensureDuplicateComponents, transposeNotes,
  rotateLeft, rotateRight, shiftOct, moveCards as moveCardsLib,
  duplicateCards, omitCards, addCard } from '../../../shared/cards.js';
const { initSnapshots, saveSnapshot: saveSnapData, loadSnapshot: loadSnapData, resetSnapshots: resetSnapData } = window.SnapUtils;
const Presets = window.Presets;

window.addEventListener('DOMContentLoaded', async () => {
  await init('piano');
  const { parseNums, eAToNotes, notesToEA, notesToAc, toAbsolute, absoluteWithShifts } = window.Helpers;

  let mode = 'eA';
  let scale = { id: 'DIAT', rot: 0, root: 0 };
  let notes = eAToNotes([2,2,1], scaleSemis(scale.id).length);
  let octShifts = Array(notes.length).fill(0);
  let components = generateComponents(notes);
  let undoStack = [];
  let redoStack = [];
  let selectedCards = new Set();
  let hoverIdx = null;
  let hoverIntervalIdx = null;
  const DRAGGABLE = true;
  const SHOW_SHIFT = true;
  let colorIntervals = false;
  let colorNotes = false;
  let noteColors = [];
  let highlightRoot = false;
  let rootFlash = false;
  let rootFlashTimer = null;
  let rootPc = null;
  let snapshots = initSnapshots(JSON.parse(localStorage.getItem('app6Snapshots') || 'null'));
  let activeSnapshot = null; // snapshot being auto-saved
  let selectedSnapshot = null; // currently selected preset button
  let lastSaved = null;
  let recording = false;
  let recordStart = 0;
  let recorded = [];
  let recordBpm = 120;
  let playing = false;
  let playTimers = [];
  let taps = [];

  const staffEl = document.getElementById('staff');
  const seqStaffEl = document.getElementById('seqStaff');
  const scaleSel = document.getElementById('scaleSel');
  const rotSel = document.getElementById('rotSel');
  const rootSel = document.getElementById('rootSel');
  const scaleMode = document.getElementById('scaleMode');
  const seqInput = document.getElementById('seq');
  const seqPrefix = document.getElementById('seqPrefix');
  const baseSelect = document.getElementById('baseNote');
  const transposeControls = document.getElementById('transposeControls');
  const transposeUp = document.getElementById('transposeUp');
  const transposeDown = document.getElementById('transposeDown');
  const componentsWrap = document.getElementById('components-wrap');
  const rotLeft = document.getElementById('rotLeft');
  const rotRight = document.getElementById('rotRight');
  const globUp = document.getElementById('globUp');
  const globDown = document.getElementById('globDown');
  const dupBtn = document.getElementById('dupBtn');
  const reduceBtn = document.getElementById('reduceBtn');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const generateBtn = document.getElementById('generate');
  const modeBtn = document.getElementById('modeBtn');
  const iaColorBtn = document.getElementById('iaColorBtn');
  const noteColorBtn = document.getElementById('noteColorBtn');
  const rootBtn = document.getElementById('rootBtn');
  const snapWrap = document.getElementById('snapshots');
  const resetSnapsBtn = document.getElementById('resetSnaps');
  const downloadSnapsBtn = document.getElementById('downloadSnaps');
  const uploadSnapsBtn = document.getElementById('uploadSnaps');
  const snapsFileInput = document.getElementById('snapsFile');
  const saveBtn = document.getElementById('saveBtn');
  const bpmInput = document.getElementById('bpm');
  const tapBtn = document.getElementById('tapBtn');
  const recBtn = document.getElementById('recBtn');
  const playSeqBtn = document.getElementById('playSeq');
  const midiBtn = document.getElementById('midiBtn');
  let useKeySig = true;
  let baseMidi = 60;
  baseSelect.value = String(baseMidi);
  baseSelect.onchange = () => { baseMidi = parseInt(baseSelect.value, 10); renderAll(); };
  const degToSemiLocal = d => degToSemi(scale, d);

  const degDiffToSemiLocal = (start, diff) => degDiffToSemi(scale, start, diff);

  const currentSemisLocal = () => currentSemis(scale, notes, octShifts);

  const consecutiveSemiDiffs = () => {
    const sems = currentSemisLocal();
    return sems.slice(1).map((s,i)=>((s - sems[i] + 12) % 12));
  };

  const asymScales=['DIAT','ACUS','ARMma','ARMme'];
  const symScales=['CROM','OCT','HEX','TON'];

  function refreshRot(){
    rotSel.innerHTML='';
    motherScalesData[scale.id].rotNames.forEach((n,i)=> rotSel.add(new Option(`${i} – ${n}`, i)));
    rotSel.value = scale.rot;
  }

  function populateScales(){
    const ids = scaleMode.value==='sym'?symScales:asymScales;
    scaleSel.innerHTML='';
    ids.forEach(id=>scaleSel.add(new Option(`${id} – ${motherScalesData[id].name}`, id)));
    if(!ids.includes(scale.id)) scale.id = ids[0];
    scaleSel.value = scale.id;
    refreshRot();
  }

  [...Array(12).keys()].forEach(i => rootSel.add(new Option(i, i)));

  populateScales();
  scaleMode.onchange=()=>{ populateScales(); useKeySig = !symScales.includes(scale.id); modeBtn.textContent = useKeySig ? 'Armadura' : 'Accidentals'; fitNotes(); renderAll(); seqInput.value=mode==='eA'?notesToEA(notes, scaleSemis(scale.id).length):notesToAc(notes); };
  rootSel.value = scale.root;

  const enNotes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

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
  }

  function transpose(delta){
    pushUndo();
    const len = scaleSemis(scale.id).length;
    notes = transposeNotes(notes, len, delta);
    seqInput.value = mode==='eA'? notesToEA(notes,len) : notesToAc(notes);
    fitNotes();
    ensureDuplicateComponents(notes, components);
    renderAll();
  }

  function fitNotes(){
    const len = scaleSemis(scale.id).length;
    notes = notes.map(n => ((n % len) + len) % len);
    while(octShifts.length < notes.length) octShifts.push(0);
    if(octShifts.length > notes.length) octShifts = octShifts.slice(0, notes.length);
  }

  function getIntervals(){
    const len = scaleSemis(scale.id).length;
    return notes.slice(1).map((n,i)=>((n-notes[i]+len)%len));
  }

  function diagMidis(){
    const sems = currentSemis(scale, notes);
    return absoluteWithShifts(sems, baseMidi, octShifts);
  }

  function rootMidi(snap){
    const semi = currentSemis(snap.scale, [snap.notes[0]], [snap.octShifts?.[0]||0])[0];
    return snap.baseMidi + semi;
  }

  function renderStaff(){
    const seq = [];
    const seqIdx = [];
    snapshots.forEach((s,i)=>{ if(s){ seq.push(s); seqIdx.push(i); } });
    const sems=currentSemisLocal();
    noteColors=sems.map(s=>pitchColor((s+3)%12));
    let colors=colorNotes?noteColors.slice():noteColors.map((c,i)=>i===hoverIdx?c:null);
    if(highlightRoot && rootPc!==null){
      colors = colors.map((c,i)=>{
        if(sems[i]%12===rootPc){
          return rootFlash ? '#fff' : '#f00';
        }
        return c;
      });
    }
    const opts={scaleId:useKeySig?scale.id:'CROM',root:useKeySig?scale.root:0,chord:true,duration:'w',noteColors:colors};
    const len=scaleSemis(scale.id).length;
    const intervals=getIntervals();
    const semiDiffs = consecutiveSemiDiffs();
    if(colorIntervals){
      opts.highlightIntervals=semiDiffs.map((sd,i)=>[i,i+1,intervalColor(sd,12)]);
    }else if(hoverIntervalIdx!==null){
      const sd=consecutiveSemiDiffs()[hoverIntervalIdx];
      const col=intervalColor(sd,12);
      opts.highlightIntervals=[[hoverIntervalIdx,hoverIntervalIdx+1,col]];
    }
    drawPentagram(staffEl, diagMidis(), opts);
    seqStaffEl.innerHTML='';
    seq.forEach((snap,idx)=>{
      const div=document.createElement('div');
      div.style.display='inline-block';
      div.draggable = true;
      div.ondragstart = e => { e.dataTransfer.setData('text/plain', idx); };
      div.ondragover = e => e.preventDefault();
      div.ondrop = e => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData('text/plain'));
        const to = idx;
        if(from===to) return;
        const [moved] = snapshots.splice(from,1);
        snapshots.splice(to,0,moved);
        if(activeSnapshot===from) activeSnapshot=to;
        else if(from<activeSnapshot && activeSnapshot<=to) activeSnapshot--;
        else if(to<=activeSnapshot && activeSnapshot<from) activeSnapshot++;
        if(selectedSnapshot===from) selectedSnapshot=to;
        else if(from<selectedSnapshot && selectedSnapshot<=to) selectedSnapshot--;
        else if(to<=selectedSnapshot && selectedSnapshot<from) selectedSnapshot++;
        localStorage.setItem('app6Snapshots', JSON.stringify(snapshots));
        renderSnapshots();
        renderStaff();
      };
      const sems=currentSemis(snap.scale, snap.notes);
      const midis=absoluteWithShifts(sems, snap.baseMidi, snap.octShifts || []);
      drawPentagram(div, midis, {scaleId:useKeySig?snap.scale.id:'CROM',root:useKeySig?snap.scale.root:0,chord:true,duration:'w'});
      const svg = div.querySelector('svg');
      svg.style.width = '140px';
      svg.style.transform = 'none';
      svg.style.transformOrigin = 'top left';
      svg.setAttribute('viewBox', '0 40 420 260');
      svg.style.height = '87px';
      div.style.width = '140px';
      div.style.height = '87px';
      div.style.overflow = 'hidden';
      div.onclick=async e=>{
        await ensureAudio();
        if(e.shiftKey){
          playMelody(midis.slice().sort((a,b)=>a-b),60/150*(e.altKey?0.5:1));
        }else playChord(midis,2);
        if(recording && Date.now()-recordStart>=4*(60000/recordBpm)){
          const beat=(Date.now()-recordStart)/(60000/recordBpm);
          recorded.push({beat,notes:midis.slice(),melodic:e.shiftKey,fast:e.shiftKey&&e.altKey});
        }
      };
      seqStaffEl.appendChild(div);
      if(idx<seq.length-1){
        const nextSnap = seq[idx+1];
        let intervalVal = rootMidi(nextSnap) - rootMidi(snap);
        const ia=document.createElement('input');
        ia.className='ia-field';
        ia.value=intervalVal;
        ia.style.borderColor=intervalCategory[intervalCategoryFor(intervalVal,12)].color;
        ia.onchange=()=>{
          const val=parseInt(ia.value,10);
          if(isNaN(val)) return;
          const delta=val-intervalVal;
          for(let j=idx+1;j<seq.length;j++){
            snapshots[seqIdx[j]].baseMidi+=delta;
          }
          localStorage.setItem('app6Snapshots', JSON.stringify(snapshots));
          renderSnapshots();
          renderStaff();
        };
        seqStaffEl.appendChild(ia);
      }
    });
    seqStaffEl.ondragover = e => e.preventDefault();
    seqStaffEl.ondrop = e => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData('text/plain'));
      const to = seq.length;
      if(from===to) return;
      const [moved] = snapshots.splice(from,1);
      snapshots.splice(to,0,moved);
      if(activeSnapshot===from) activeSnapshot=to;
      else if(from<activeSnapshot && activeSnapshot<=to) activeSnapshot--;
      else if(to<=activeSnapshot && activeSnapshot<from) activeSnapshot++;
      if(selectedSnapshot===from) selectedSnapshot=to;
      else if(from<selectedSnapshot && selectedSnapshot<=to) selectedSnapshot--;
      else if(to<=selectedSnapshot && selectedSnapshot<from) selectedSnapshot++;
      localStorage.setItem('app6Snapshots', JSON.stringify(snapshots));
      renderSnapshots();
      renderStaff();
    };
    renderLegend();
  }

  function renderLegend(){
    const noteLegend = document.getElementById('noteLegend');
    noteLegend.innerHTML = enNotes.map((n,i)=>{
      const col = pastelColor(pitchColor((i+3)%12));
      const txt = contrastColor(col);
      return `<span style="background:${col};color:${txt};padding:0 .3rem;margin:0 .2rem;border-radius:4px;">${n}</span>`;
    }).join(' ');
    const intLegend = document.getElementById('intervalLegend');
    intLegend.innerHTML = Object.entries(intervalCategory).map(([k,v])=>{
      const txt = contrastColor(v.color);
      return `<span style="background:${v.color};color:${txt};padding:0 .3rem;margin:0 .2rem;border-radius:4px;">${v.label}</span>`;
    }).join(' ');
  }

  function renderSnapshots(){
    snapWrap.innerHTML = '';
    for(let i=0;i<10;i++){
      const b = document.createElement('button');
      b.textContent = String.fromCharCode(65+i);
      b.classList.toggle('saved', !!snapshots[i]);
      b.classList.toggle('active', selectedSnapshot===i);
      b.draggable = true;
      b.ondragstart = e => { e.dataTransfer.setData('text/plain', i); };
      b.ondragover = e => e.preventDefault();
      b.ondrop = e => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData('text/plain'));
        const to = i;
        if(from===to) return;
        const [moved] = snapshots.splice(from,1);
        snapshots.splice(to,0,moved);
        if(activeSnapshot===from) activeSnapshot=to;
        else if(from<activeSnapshot && activeSnapshot<=to) activeSnapshot--;
        else if(to<=activeSnapshot && activeSnapshot<from) activeSnapshot++;
        if(selectedSnapshot===from) selectedSnapshot=to;
        else if(from<selectedSnapshot && selectedSnapshot<=to) selectedSnapshot--;
        else if(to<=selectedSnapshot && selectedSnapshot<from) selectedSnapshot++;
        localStorage.setItem('app6Snapshots', JSON.stringify(snapshots));
        renderSnapshots();
        renderStaff();
      };
      b.onclick = async () => {
        const data = loadSnapData(snapshots, i);
        if(!data) return;
        notes = data.notes.slice();
        baseMidi = data.baseMidi;
        baseSelect.value = String(baseMidi);
        scale = {...data.scale};
        scaleSel.value = scale.id;
        rootSel.value = scale.root;
        refreshRot();
        rotSel.value = scale.rot;
        octShifts = data.octShifts ? data.octShifts.slice() : Array(notes.length).fill(0);
        components = data.components ? data.components.slice() : generateComponents(notes);
        selectedSnapshot = i;
        activeSnapshot = i;
        renderAll();
        renderSnapshots();
        await ensureAudio();
        playChord(diagMidis(), 2);
      };
      snapWrap.appendChild(b);
      if(lastSaved===i){
        b.classList.add('lp-complete');
        setTimeout(()=>{ b.classList.remove('lp-complete'); lastSaved=null; },300);
      }
    }
  }

  function moveCards(indices, target){
    pushUndo();
    const newIdx = moveCardsLib({notes, octShifts, components}, indices, target);
    selectedCards = new Set(newIdx);
    renderAll();
  }

  function renderCards(){
    componentsWrap.innerHTML='';
    const len = scaleSemis(scale.id).length;
    const diagNums = notes.slice();
    const comps = ensureDuplicateComponents(notes, components);
    const intervals = getIntervals();
    const midis = diagMidis();
    noteColors = currentSemisLocal().map(s => pastelColor(pitchColor((s+3)%12)));
    diagNums.forEach((num,i)=>{
      const card = document.createElement('div');
      card.className='component-card';
      if(selectedCards.has(i)) card.classList.add('selected');
      if(DRAGGABLE) card.draggable = true;
      const color = noteColors[i];
      card.style.backgroundColor = color;
      card.style.color = contrastColor(color);
      card.onmouseenter = () => { hoverIdx = i; renderStaff(); };
      card.onmouseleave = () => { hoverIdx = null; renderStaff(); };
      let pressTimer;
      card.onmousedown=e=>{
        if(e.shiftKey){
          if(selectedCards.has(i)) selectedCards.delete(i); else selectedCards.add(i);
          renderCards();
        }else{
          pressTimer=setTimeout(()=>{ if(selectedCards.has(i)) selectedCards.delete(i); else selectedCards.add(i); renderCards(); },1000);
        }
      };
      card.onmouseup=card.onmouseleave=()=>clearTimeout(pressTimer);
      if(DRAGGABLE){
        card.ondragstart=e=>{
          clearTimeout(pressTimer);
          const grp=selectedCards.has(i)?Array.from(selectedCards).sort((a,b)=>a-b):[i];
          e.dataTransfer.setData('text/plain',JSON.stringify(grp));
        };
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
        card.ondragenter=e=>{ if(!card.classList.contains('drop-hover')) card.classList.add('drop-hover'); };
        card.ondragleave=e=>{ if(!card.contains(e.relatedTarget)) card.classList.remove('drop-hover'); };
      }
      let up, down;
      if(SHOW_SHIFT){
        up=document.createElement('button');
        up.className='up';
        up.innerHTML='\u25B2';
        up.draggable = false;
        up.onmousedown = e => { e.preventDefault(); e.stopPropagation(); };
        up.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); };
        up.ondragstart = e => { e.preventDefault(); e.stopPropagation(); };
        up.onclick=()=>{pushUndo();shiftOct(octShifts,i,1);renderAll();};
        down=document.createElement('button');
        down.className='down';
        down.innerHTML='\u25BC';
        down.draggable = false;
        down.onmousedown = e => { e.preventDefault(); e.stopPropagation(); };
        down.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); };
        down.ondragstart = e => { e.preventDefault(); e.stopPropagation(); };
        down.onclick=()=>{pushUndo();shiftOct(octShifts,i,-1);renderAll();};
      }
      const close=document.createElement('div');
      close.className='close';
      close.textContent='x';
      close.onclick=()=>{pushUndo();omitCards({notes,octShifts,components},[i]);renderAll();};
      const note=document.createElement('div');
      note.className='note';
      note.textContent = mode==='eA' ? num : ((num+scaleSemis(scale.id).length)%len);
      const label=document.createElement('div');
      label.className='label';
      label.textContent=comps[i];
      const shiftVal=Math.floor((midis[i]-baseMidi)/12);
      const reg=document.createElement('div');
      reg.className='shift-ind';
      reg.textContent=shiftVal!==0?(shiftVal>0?'+':'-').repeat(Math.abs(shiftVal)):'\u00A0';
      if(SHOW_SHIFT){
        card.appendChild(up);
        card.appendChild(down);
      }
      card.appendChild(close);
      card.appendChild(note);
      card.appendChild(reg);
      card.appendChild(label);
      componentsWrap.appendChild(card);
      if(i<notes.length-1){
        const ia=document.createElement('input');
        ia.className='ia-field';
        ia.value=intervals[i];
        ia.onmouseenter=()=>{ hoverIntervalIdx = i; renderStaff(); };
        ia.onmouseleave=()=>{ hoverIntervalIdx = null; renderStaff(); };
        ia.onchange=()=>{
          pushUndo();
          const ints=getIntervals();
          const val=parseInt(ia.value,10);
          if(!isNaN(val)) ints[i]=((val%len)+len)%len;
          const base=notes[0];
          const rel=eAToNotes(ints,len);
          notes=transposeNotes(rel,len,base);
          fitNotes();
          ensureDuplicateComponents(notes, components);
          renderAll();
        };
        componentsWrap.appendChild(ia);
      }
    });
    if(DRAGGABLE){
      componentsWrap.ondragover=e=>e.preventDefault();
      componentsWrap.ondrop=e=>{
        e.preventDefault();
        const grp=JSON.parse(e.dataTransfer.getData('text/plain'));
        moveCards(grp, notes.length);
      };
    }
    componentsWrap.onmouseleave=()=>{ hoverIdx = null; hoverIntervalIdx = null; renderStaff(); };
  }

  function renderAll(){
    fitNotes();
    if(activeSnapshot!==null){
      saveSnapData(snapshots, activeSnapshot, notes, baseMidi, scale, octShifts, components);
      localStorage.setItem('app6Snapshots', JSON.stringify(snapshots));
    }
    renderCards();
    renderStaff();
    seqInput.value = mode==='eA'? notesToEA(notes, scaleSemis(scale.id).length) : notesToAc(notes);
  }

  generateBtn.onclick=()=>{
    pushUndo();
    const nums = parseNums(seqInput.value);
    const len = scaleSemis(scale.id).length;
    notes = mode==='eA' ? eAToNotes(nums, len) : nums.map(n=>((n%len)+len)%len);
    octShifts = Array(notes.length).fill(0);
    components = generateComponents(notes);
    activeSnapshot = null;
    lastSaved = null;
    renderAll();
  };

  rotLeft.onclick=()=>{pushUndo();rotateRight(notes, octShifts, components);renderAll();};
  rotRight.onclick=()=>{pushUndo();rotateLeft(notes, octShifts, components);renderAll();};
  globUp.onclick=()=>{pushUndo();notes=transposeNotes(notes, scaleSemis(scale.id).length,1);renderAll();};
  globDown.onclick=()=>{pushUndo();notes=transposeNotes(notes, scaleSemis(scale.id).length,-1);renderAll();};
  dupBtn.onclick=()=>{
    if(!selectedCards.size) return;
    pushUndo();
    const idx = Array.from(selectedCards).sort((a,b)=>a-b);
    const newIdx = duplicateCards({notes,octShifts,components}, idx);
    selectedCards = new Set(newIdx);
    renderAll();
  };
  reduceBtn.onclick=()=>{
    pushUndo();
    const len=scaleSemis(scale.id).length;
    const arr=notes.map((n,i)=>({
      note:((n%len)+len)%len,
      comp:components[i],
      val:degToSemiLocal(n)+12*(octShifts[i]||0)
    }));
    arr.sort((a,b)=>a.val-b.val);
    notes=arr.map(o=>o.note);
    components=arr.map(o=>o.comp);
    octShifts=Array(notes.length).fill(0);
    ensureDuplicateComponents(notes, components);
    fitNotes();
    selectedCards.clear();
    renderAll();
  };
  undoBtn.onclick=undoAction;
  redoBtn.onclick=redoAction;
  transposeUp.onclick=()=>transpose(1);
  transposeDown.onclick=()=>transpose(-1);
  document.body.addEventListener('click',e=>{
    if(!e.target.closest('.component-card') && !e.target.classList.contains('ia-field')){
      if(selectedCards.size){ selectedCards.clear(); renderCards(); }
    }
  });

  scaleSel.onchange=()=>{scale.id=scaleSel.value;useKeySig=!symScales.includes(scale.id);modeBtn.textContent = useKeySig ? 'Armadura' : 'Accidentals';refreshRot();fitNotes();renderAll();seqInput.value=mode==='eA'?notesToEA(notes, scaleSemis(scale.id).length):notesToAc(notes);};
  rotSel.onchange=()=>{scale.rot=parseInt(rotSel.value,10);fitNotes();renderAll();};
  rootSel.onchange=()=>{scale.root=parseInt(rootSel.value,10);fitNotes();renderAll();};

  modeBtn.onclick=()=>{
    useKeySig = !useKeySig;
    modeBtn.textContent = useKeySig ? 'Armadura' : 'Accidentals';
    renderStaff();
  };

  iaColorBtn.onclick = () => {
    colorIntervals = !colorIntervals;
    iaColorBtn.classList.toggle('active', colorIntervals);
    renderStaff();
  };

  noteColorBtn.onclick = () => {
    colorNotes = !colorNotes;
    noteColorBtn.classList.toggle('active', colorNotes);
    renderStaff();
  };

  rootBtn.onmousedown = () => {
    rootPc = findChordRoot(currentSemisLocal());
    if(rootPc === null) return;
    highlightRoot = true;
    rootFlash = true;
    renderStaff();
    rootFlashTimer = setInterval(() => {
      rootFlash = !rootFlash;
      renderStaff();
    }, 400);
  };

  const stopRootFlash = () => {
    highlightRoot = false;
    rootFlash = false;
    if(rootFlashTimer){
      clearInterval(rootFlashTimer);
      rootFlashTimer = null;
    }
    renderStaff();
  };

  rootBtn.onmouseup = stopRootFlash;
  rootBtn.onmouseleave = stopRootFlash;

  function stopPlayback(){
    playTimers.forEach(clearTimeout);
    playTimers = [];
    playing = false;
    playSeqBtn.textContent = 'Reproduir';
  }

  saveBtn.onclick = () => {
    const freeIdx = snapshots.findIndex(s=>s===null);
    let target = activeSnapshot;
    if(target===null){
      if(freeIdx!==-1){
        target = freeIdx;
      }else if(selectedSnapshot!==null){
        target = selectedSnapshot;
      }else{
        alert('No hi ha ranures lliures de preset.');
        return;
      }
    }
    saveSnapData(snapshots, target, notes, baseMidi, scale, octShifts, components);
    activeSnapshot = target;
    selectedSnapshot = target;
    lastSaved = target;
    localStorage.setItem('app6Snapshots', JSON.stringify(snapshots));
    renderSnapshots();
    renderStaff();
  };

  resetSnapsBtn.onclick = () => {
    snapshots = resetSnapData();
    activeSnapshot = null;
    selectedSnapshot = null;
    lastSaved = null;
    localStorage.setItem('app6Snapshots', JSON.stringify(snapshots));
    renderSnapshots();
    renderStaff();
  };

  downloadSnapsBtn.onclick = () => {
    Presets.exportPresets(snapshots, 'app6-presets.json');
  };

  uploadSnapsBtn.onclick = () => {
    Presets.importPresets(snapsFileInput, data => {
      snapshots = initSnapshots(data);
      activeSnapshot = null;
      selectedSnapshot = null;
      localStorage.setItem('app6Snapshots', JSON.stringify(snapshots));
      renderSnapshots();
      renderStaff();
    });
  };

  tapBtn.onclick = () => {
    const now = Date.now();
    if(taps.length && now - taps[taps.length-1] > 2000) taps=[];
    taps.push(now);
    if(taps.length>=3){
      const diffs=taps.slice(1).map((t,i)=>t-taps[i]);
      const bpm=60000/(diffs.reduce((a,b)=>a+b,0)/diffs.length);
      bpmInput.value=bpm.toFixed(1);
      taps=[];
    }
  };

  recBtn.onclick = async () => {
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
        recorded.push({beat:i,notes:[84],melodic:false});
        setTimeout(()=>playChord([84],60/recordBpm),i*interval);
      }
      recording=true;
      recBtn.textContent='Atura';
    }
  };

  playSeqBtn.onclick = async () => {
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
      const t=ev.beat*60000/bpm;
      const id=setTimeout(()=>{
        const chordDur=4*(60/bpm);
        const melodicDur=(60/bpm)*(ev.fast?0.5:1);
        ev.melodic?playMelody(ev.notes,melodicDur):playChord(ev.notes,chordDur);
      },t);
      playTimers.push(id);
    });
    const last=recorded[recorded.length-1];
    const end=last.beat*60000/bpm+2000;
    playTimers.push(setTimeout(stopPlayback,end));
  };

  midiBtn.onclick = () => {
    const seq = snapshots.filter(s=>s);
    if(!seq.length) return;
    const midi = new Midi();
    const bpm = parseFloat(bpmInput.value)||120;
    midi.header.setTempo(bpm);
    midi.header.timeSignatures = [{ ticks: 0, timeSignature: [4,4] }];
    const ppq = 480;
    const track = midi.addTrack();
    seq.forEach((snap,idx)=>{
      const sems=currentSemis(snap.scale, snap.notes);
      const mids=absoluteWithShifts(sems, snap.baseMidi, snap.octShifts || []);
      const tick=idx*ppq*4;
      mids.forEach(n=>track.addNote({midi:n,ticks:tick,durationTicks:ppq*4}));
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

  staffEl.addEventListener('click', async e => {
    await ensureAudio();
    const midis = diagMidis();
    if (e.shiftKey) {
      const dur = 60 / 150;
      playMelody(midis.slice().sort((a,b)=>a-b), dur, 0);
    } else {
      playChord(midis, 2);
    }
    if(recording && Date.now()-recordStart >= 4*(60000/recordBpm)){
      const beat=(Date.now()-recordStart)/(60000/recordBpm);
      recorded.push({beat,notes:midis.slice(),melodic:e.shiftKey,fast:e.shiftKey&&e.altKey});
    }
  });

  const tabEA = document.getElementById('tabEA');
  const tabAc = document.getElementById('tabAc');
  tabEA.onclick=()=>{
    mode='eA';
    tabEA.classList.add('active');
    tabAc.classList.remove('active');
    seqPrefix.textContent='eA(';
    transposeControls.style.display='none';
    renderAll();
  };
  tabAc.onclick=()=>{
    mode='Ac';
    tabAc.classList.add('active');
    tabEA.classList.remove('active');
    seqPrefix.textContent='Ac(';
    transposeControls.style.display='flex';
    renderAll();
  };
  transposeControls.style.display='none';

  renderAll();
  renderLegend();
  renderSnapshots();
});
