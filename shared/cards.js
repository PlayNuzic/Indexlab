export function generateComponents(notes){
  const letters='abcdefghijklmnopqrstuvwxyz';
  const map=new Map();
  let idx=0;
  return notes.map(n=>{
    if(map.has(n)) return map.get(n);
    const l=letters[idx++]||'?';
    map.set(n,l);
    return l;
  });
}

export function ensureDuplicateComponents(notes, components){
  const map=new Map();
  components.forEach((comp,i)=>{
    const val=notes[i];
    if(map.has(val)) components[i]=map.get(val);
    else map.set(val, comp);
  });
  return components;
}

export function transposeNotes(notes, len, delta){
  return notes.map(n=>((n+delta)%len+len)%len);
}

export function eAToNotes(intervals, len=12){
  const out=[0];
  intervals.forEach(i=>{
    const prev=out[out.length-1];
    out.push(((prev+i)%len+len)%len);
  });
  return out;
}

export function rotateLeft(arr, arr2, arr3){
  if(!arr.length) return;
  arr.push(arr.shift());
  if(arr2) arr2.push(arr2.shift());
  if(arr3) arr3.push(arr3.shift());
}

export function rotateRight(arr, arr2, arr3){
  if(!arr.length) return;
  arr.unshift(arr.pop());
  if(arr2) arr2.unshift(arr2.pop());
  if(arr3) arr3.unshift(arr3.pop());
}

export function shiftOct(octShifts, idx, delta){
  octShifts[idx]=(octShifts[idx]||0)+delta;
  return octShifts[idx];
}

export function moveCards(state, indices, target, after=false){
  const {notes, octShifts, components}=state;
  indices=indices.slice().sort((a,b)=>a-b);
  const vals=indices.map(i=>notes[i]);
  const shifts=indices.map(i=>octShifts[i]);
  const comps=indices.map(i=>components[i]);
  for(let j=indices.length-1;j>=0;j--){
    notes.splice(indices[j],1);
    octShifts.splice(indices[j],1);
    components.splice(indices[j],1);
  }
  let insert=after?target+1:target;
  indices.forEach(i=>{ if(i<insert) insert--; });
  notes.splice(insert,0,...vals);
  octShifts.splice(insert,0,...shifts);
  components.splice(insert,0,...comps);
  ensureDuplicateComponents(notes, components);
  return indices.map((_,k)=>insert+k);
}

export function duplicateCards(state, indices){
  const {notes, octShifts, components}=state;
  indices=indices.slice().sort((a,b)=>a-b);
  const vals=indices.map(i=>notes[i]);
  const shifts=indices.map(i=>octShifts[i]);
  const comps=indices.map(i=>components[i]);
  notes.push(...vals);
  octShifts.push(...shifts);
  components.push(...comps);
  return Array.from({length:vals.length},(_,k)=>notes.length-vals.length+k);
}

export function omitCards(state, indices){
  const {notes, octShifts, components}=state;
  indices=indices.slice().sort((a,b)=>b-a);
  for(const i of indices){
    notes.splice(i,1);
    octShifts.splice(i,1);
    components.splice(i,1);
  }
  ensureDuplicateComponents(notes, components);
}

export function addCard(state, note, comp, shift=0, index=state.notes.length){
  const {notes, octShifts, components}=state;
  notes.splice(index,0,note);
  octShifts.splice(index,0,shift);
  components.splice(index,0,comp);
}
