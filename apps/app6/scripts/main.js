import drawPentagram from '../../../libs/notation/pentagram.js';
import { motherScalesData, scaleSemis } from '../../../shared/scales.js';
import { generateComponents, ensureDuplicateComponents, transposeNotes,
  rotateLeft, rotateRight, shiftOct, moveCards as moveCardsLib,
  duplicateCards, omitCards, addCard } from '../../../shared/cards.js';

window.addEventListener('DOMContentLoaded', () => {
  const { parseNums, eAToNotes, notesToEA, notesToAc, toAbsolute } = window.Helpers;

  let mode = 'eA';
  let scale = { id: 'DIAT', rot: 0, root: 0 };
  let notes = eAToNotes([2,2,1], scaleSemis(scale.id).length);
  let octShifts = Array(notes.length).fill(0);
  let components = generateComponents(notes);
  let undoStack = [];
  let redoStack = [];

  const staffEl = document.getElementById('staff');
  const scaleSel = document.getElementById('scaleSel');
  const rotSel = document.getElementById('rotSel');
  const rootSel = document.getElementById('rootSel');
  const seqInput = document.getElementById('seq');
  const seqPrefix = document.getElementById('seqPrefix');
  const transposeControls = document.getElementById('transposeControls');
  const cardsWrap = document.getElementById('cards-wrap');
  const rotLeft = document.getElementById('rotLeft');
  const rotRight = document.getElementById('rotRight');
  const globUp = document.getElementById('globUp');
  const globDown = document.getElementById('globDown');
  const dupBtn = document.getElementById('dupBtn');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const generateBtn = document.getElementById('generate');

  const scaleIDs = Object.keys(motherScalesData);
  scaleIDs.forEach(id => scaleSel.add(new Option(`${id} – ${motherScalesData[id].name}`, id)));
  [...Array(12).keys()].forEach(i => rootSel.add(new Option(i, i)));

  function refreshRot(){
    rotSel.innerHTML='';
    motherScalesData[scale.id].rotNames.forEach((n,i)=> rotSel.add(new Option(`${i} – ${n}`, i)));
    rotSel.value = scale.rot;
  }
  refreshRot();
  scaleSel.value = scale.id;
  rootSel.value = scale.root;

  function pushUndo(){
    undoStack.push({ notes:notes.slice(), octShifts:octShifts.slice(), components:components.slice() });
    if(undoStack.length>20) undoStack.shift();
    redoStack = [];
  }

  function undo(){
    if(!undoStack.length) return;
    redoStack.push({ notes:notes.slice(), octShifts:octShifts.slice(), components:components.slice() });
    const snap = undoStack.pop();
    notes = snap.notes.slice();
    octShifts = snap.octShifts.slice();
    components = snap.components.slice();
    renderAll();
  }

  function redo(){
    if(!redoStack.length) return;
    undoStack.push({ notes:notes.slice(), octShifts:octShifts.slice(), components:components.slice() });
    const snap = redoStack.pop();
    notes = snap.notes.slice();
    octShifts = snap.octShifts.slice();
    components = snap.components.slice();
    renderAll();
  }

  function fitNotes(){
    const len = scaleSemis(scale.id).length;
    notes = notes.map(n => ((n % len) + len) % len);
    while(octShifts.length < notes.length) octShifts.push(0);
    if(octShifts.length > notes.length) octShifts = octShifts.slice(0, notes.length);
  }

  function diagMidis(){
    const sems = notes.map((d,i)=>{
      const semsArr = scaleSemis(scale.id);
      const len = semsArr.length;
      return (semsArr[(d + scale.rot) % len] + scale.root) % 12;
    });
    return toAbsolute(sems, 60).map((m,i)=>m + 12*(octShifts[i]||0));
  }

  function renderStaff(){
    drawPentagram(staffEl, diagMidis(), {
      scaleId: scale.id,
      root: scale.root,
      chord: true,
      duration: 'w'
    });
  }

  function renderCards(){
    cardsWrap.innerHTML='';
    const len = scaleSemis(scale.id).length;
    const diagNums = notes.slice();
    const comps = ensureDuplicateComponents(notes, components);
    diagNums.forEach((num,i)=>{
      const card = document.createElement('div');
      card.className='component-card';
      card.draggable = true;
      card.ondragstart=e=>{
        e.dataTransfer.setData('text/plain', String(i));
      };
      card.ondragover=e=>e.preventDefault();
      card.ondrop=e=>{
        e.preventDefault();
        const from = parseInt(e.dataTransfer.getData('text/plain'),10);
        if(isNaN(from)) return;
        pushUndo();
        moveCardsLib({notes, octShifts, components}, [from], i);
        renderAll();
      };
      const up=document.createElement('button');
      up.className='up';
      up.innerHTML='\u25B2';
      up.onclick=()=>{pushUndo();shiftOct(octShifts,i,1);renderAll();};
      const down=document.createElement('button');
      down.className='down';
      down.innerHTML='\u25BC';
      down.onclick=()=>{pushUndo();shiftOct(octShifts,i,-1);renderAll();};
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
      card.appendChild(up);
      card.appendChild(down);
      card.appendChild(close);
      card.appendChild(note);
      card.appendChild(label);
      cardsWrap.appendChild(card);
    });
  }

  function renderAll(){
    fitNotes();
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
    renderAll();
  };

  rotLeft.onclick=()=>{pushUndo();rotateLeft(notes, octShifts, components);renderAll();};
  rotRight.onclick=()=>{pushUndo();rotateRight(notes, octShifts, components);renderAll();};
  globUp.onclick=()=>{pushUndo();notes=transposeNotes(notes, scaleSemis(scale.id).length,1);renderAll();};
  globDown.onclick=()=>{pushUndo();notes=transposeNotes(notes, scaleSemis(scale.id).length,-1);renderAll();};
  dupBtn.onclick=()=>{pushUndo();duplicateCards({notes,octShifts,components},[notes.length-1]);renderAll();};
  undoBtn.onclick=undo;
  redoBtn.onclick=redo;

  scaleSel.onchange=()=>{scale.id=scaleSel.value;refreshRot();renderAll();};
  rotSel.onchange=()=>{scale.rot=parseInt(rotSel.value,10);renderAll();};
  rootSel.onchange=()=>{scale.root=parseInt(rootSel.value,10);renderAll();};

  document.getElementById('tabEA').onclick=()=>{mode='eA';seqPrefix.textContent='eA(';
    transposeControls.style.display='none'; renderAll();};
  document.getElementById('tabAc').onclick=()=>{mode='Ac';seqPrefix.textContent='Ac(';
    transposeControls.style.display='flex'; renderAll();};
  transposeControls.style.display='none';

  renderAll();
});
