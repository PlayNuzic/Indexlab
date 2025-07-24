import { generateComponents, ensureDuplicateComponents, transposeNotes,
  rotateLeft, rotateRight, shiftOct, moveCards as moveCardsLib,
  duplicateCards, omitCards, addCard } from '../../shared/cards.js';

export function init(container, {
  notes = [],
  scaleLen = 12,
  orientation = 'row',
  help = false
} = {}){
  const state = {
    notes: notes.slice(),
    octShifts: Array(notes.length).fill(0),
    components: generateComponents(notes)
  };
  let selected = new Set();
  const undoStack = [];
  const redoStack = [];

  const area = document.createElement('div');
  area.className = 'cards-area';
  const row = document.createElement('div');
  row.className = 'components-row';
  const wrap = document.createElement('div');
  wrap.className = 'components-wrap';
  row.appendChild(wrap);
  area.appendChild(row);
  container.appendChild(area);
  if(orientation==='column') area.classList.add('vertical');

  const rotLeftBtn = document.createElement('button');
  rotLeftBtn.className = 'rot-left';
  rotLeftBtn.textContent = '\u25C0';
  const rotRightBtn = document.createElement('button');
  rotRightBtn.className = 'rot-right';
  rotRightBtn.textContent = '\u25B6';
  row.prepend(rotLeftBtn);
  row.appendChild(rotRightBtn);

  const transpWrap = document.createElement('div');
  transpWrap.className = 'transp-controls';
  const upBtn = document.createElement('button');
  upBtn.className = 'glob-up';
  upBtn.textContent = '\u25B2';
  const downBtn = document.createElement('button');
  downBtn.className = 'glob-down';
  downBtn.textContent = '\u25BC';
  transpWrap.appendChild(upBtn);
  transpWrap.appendChild(downBtn);
  row.appendChild(transpWrap);

  const actions = document.createElement('div');
  actions.className = 'comp-actions';
  const dupBtn = document.createElement('button');
  dupBtn.className = 'dup';
  dupBtn.textContent = 'Duplicar';
  const undoBtn = document.createElement('button');
  undoBtn.className = 'undo';
  undoBtn.textContent = '\u21B6';
  const redoBtn = document.createElement('button');
  redoBtn.className = 'redo';
  redoBtn.textContent = '\u21B7';
  actions.appendChild(dupBtn);
  actions.appendChild(undoBtn);
  actions.appendChild(redoBtn);
  area.appendChild(actions);

  let infoToggle, infoCard;
  if(help){
    infoToggle = document.createElement('button');
    infoToggle.id = 'infoToggle';
    infoToggle.textContent = 'Mostra informació';
    infoCard = document.createElement('div');
    infoCard.id = 'infoCard';
    infoCard.className = 'card info';
    infoCard.setAttribute('hidden','');
    area.appendChild(infoToggle);
    area.appendChild(infoCard);
    infoToggle.onclick = () => {
      const hidden = infoCard.hasAttribute('hidden');
      if(hidden){
        infoCard.removeAttribute('hidden');
        infoToggle.textContent = 'Amaga informació';
      }else{
        infoCard.setAttribute('hidden','');
        infoToggle.textContent = 'Mostra informació';
      }
    };
  }

  function pushUndo(){
    undoStack.push({
      notes: state.notes.slice(),
      octShifts: state.octShifts.slice(),
      components: state.components.slice()
    });
    if(undoStack.length>5) undoStack.shift();
    redoStack.length = 0;
  }

  function undo(){
    if(!undoStack.length) return;
    redoStack.push({notes:state.notes.slice(),octShifts:state.octShifts.slice(),components:state.components.slice()});
    const snap=undoStack.pop();
    state.notes=snap.notes.slice();
    state.octShifts=snap.octShifts.slice();
    state.components=snap.components.slice();
    render();
  }

  function redo(){
    if(!redoStack.length) return;
    undoStack.push({notes:state.notes.slice(),octShifts:state.octShifts.slice(),components:state.components.slice()});
    if(undoStack.length>5) undoStack.shift();
    const snap=redoStack.pop();
    state.notes=snap.notes.slice();
    state.octShifts=snap.octShifts.slice();
    state.components=snap.components.slice();
    render();
  }

  function transpose(delta){
    pushUndo();
    state.notes = transposeNotes(state.notes, scaleLen, delta);
    render();
  }

  function moveCards(indices, target){
    pushUndo();
    const newIdx = moveCardsLib(state, indices, target);
    selected = new Set(newIdx);
    render();
  }

  function render(){
    wrap.innerHTML='';
    ensureDuplicateComponents(state.notes, state.components);
    state.notes.forEach((n,i)=>{
      const card = document.createElement('div');
      card.className='component-card';
      if(selected.has(i)) card.classList.add('selected');
      card.draggable=true;
      card.onmousedown=e=>{ if(e.shiftKey){ if(selected.has(i)) selected.delete(i); else selected.add(i); render(); } };
      card.ondragstart=e=>{ const grp=selected.has(i)?Array.from(selected).sort((a,b)=>a-b):[i]; e.dataTransfer.setData('text/plain',JSON.stringify(grp)); };
      card.ondragover=e=>e.preventDefault();
      card.ondrop=e=>{ e.preventDefault(); e.stopPropagation(); const grp=JSON.parse(e.dataTransfer.getData('text/plain')); const min=Math.min(...grp); const target=min<i?i+1:i; moveCards(grp,target); };
      const up=document.createElement('button'); up.className='up'; up.textContent='\u25B2'; up.onclick=()=>{pushUndo();shiftOct(state.octShifts,i,1);render();};
      const down=document.createElement('button'); down.className='down'; down.textContent='\u25BC'; down.onclick=()=>{pushUndo();shiftOct(state.octShifts,i,-1);render();};
      const close=document.createElement('div'); close.className='close'; close.textContent='x'; close.onclick=()=>{pushUndo();omitCards(state,[i]);render();};
      const note=document.createElement('div'); note.className='note'; note.textContent=n;
      const label=document.createElement('div'); label.className='label'; label.textContent=state.components[i];
      card.appendChild(up); card.appendChild(down); card.appendChild(close); card.appendChild(note); card.appendChild(label);
      wrap.appendChild(card);
    });
    wrap.ondragover=e=>e.preventDefault();
    wrap.ondrop=e=>{ e.preventDefault(); const grp=JSON.parse(e.dataTransfer.getData('text/plain')); moveCards(grp, state.notes.length); };
  }

  rotLeftBtn.onclick=()=>{pushUndo();rotateLeft(state.notes, state.octShifts, state.components);render();};
  rotRightBtn.onclick=()=>{pushUndo();rotateRight(state.notes, state.octShifts, state.components);render();};
  upBtn.onclick=()=>{transpose(1);};
  downBtn.onclick=()=>{transpose(-1);};
  dupBtn.onclick=()=>{if(!selected.size) return; pushUndo(); const idx=Array.from(selected).sort((a,b)=>a-b); const newIdx=duplicateCards(state, idx); selected=new Set(newIdx); render();};
  undoBtn.onclick=undo;
  redoBtn.onclick=redo;
  document.body.addEventListener('click',e=>{ if(!e.target.closest('.component-card')){ if(selected.size){ selected.clear(); render(); } } });

  render();

  return { getState:()=>({...state}), rotateLeft:()=>rotLeftBtn.onclick(), rotateRight:()=>rotRightBtn.onclick(), transpose, undo, redo };
}
