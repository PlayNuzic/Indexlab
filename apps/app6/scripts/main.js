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
  let selectedCards = new Set();

  const staffEl = document.getElementById('staff');
  const scaleSel = document.getElementById('scaleSel');
  const rotSel = document.getElementById('rotSel');
  const rootSel = document.getElementById('rootSel');
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
  let useKeySig = true;
  let baseMidi = 60;
  baseSelect.value = String(baseMidi);
  baseSelect.onchange = () => { baseMidi = parseInt(baseSelect.value, 10); renderAll(); };
  const degToSemi = d => {
    const sems = scaleSemis(scale.id);
    const len = sems.length;
    return (sems[(d + scale.rot) % len] + scale.root) % 12;
  };

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

  function diagMidis(){
    const sems = notes.map((d,i)=>{
      const semsArr = scaleSemis(scale.id);
      const len = semsArr.length;
      return (semsArr[(d + scale.rot) % len] + scale.root) % 12;
    });
    return toAbsolute(sems, baseMidi).map((m,i)=>m + 12*(octShifts[i]||0));
  }

  function renderStaff(){
    drawPentagram(staffEl, diagMidis(), {
      scaleId: useKeySig ? scale.id : 'CROM',
      root: useKeySig ? scale.root : 0,
      chord: true,
      duration: 'w'
    });
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
    diagNums.forEach((num,i)=>{
      const card = document.createElement('div');
      card.className='component-card';
      if(selectedCards.has(i)) card.classList.add('selected');
      card.draggable = true;
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
      componentsWrap.appendChild(card);
    });
    componentsWrap.ondragover=e=>e.preventDefault();
    componentsWrap.ondrop=e=>{
      e.preventDefault();
      const grp=JSON.parse(e.dataTransfer.getData('text/plain'));
      moveCards(grp, notes.length);
    };
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
  };
  undoBtn.onclick=undoAction;
  redoBtn.onclick=redoAction;
  transposeUp.onclick=()=>transpose(1);
  transposeDown.onclick=()=>transpose(-1);
  document.body.addEventListener('click',e=>{
    if(!e.target.closest('.component-card')){
      if(selectedCards.size){ selectedCards.clear(); renderCards(); }
    }
  });

  scaleSel.onchange=()=>{scale.id=scaleSel.value;refreshRot();renderAll();};
  rotSel.onchange=()=>{scale.rot=parseInt(rotSel.value,10);renderAll();};
  rootSel.onchange=()=>{scale.root=parseInt(rootSel.value,10);renderAll();};

  modeBtn.onclick=()=>{
    useKeySig = !useKeySig;
    modeBtn.textContent = useKeySig ? 'Armadura' : 'Accidentals';
    renderStaff();
  };

  document.getElementById('tabEA').onclick=()=>{mode='eA';seqPrefix.textContent='eA(';
    transposeControls.style.display='none'; renderAll();};
  document.getElementById('tabAc').onclick=()=>{mode='Ac';seqPrefix.textContent='Ac(';
    transposeControls.style.display='flex'; renderAll();};
  transposeControls.style.display='none';

  renderAll();
});
