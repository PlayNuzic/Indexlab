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

// -------- voicing generators --------

// internal helper to generate all unique permutations for an array that may
// contain duplicate values.
function uniquePermutations(items){
  const counts=new Map();
  items.forEach(i=>counts.set(i,(counts.get(i)||0)+1));
  const keys=[...counts.keys()];
  const out=[];
  function permute(path){
    if(path.length===items.length){ out.push(path.slice()); return; }
    for(const k of keys){
      if(counts.get(k)>0){
        counts.set(k,counts.get(k)-1);
        path.push(k);
        permute(path);
        path.pop();
        counts.set(k,counts.get(k)+1);
      }
    }
  }
  permute([]);
  return out;
}

// convert an array of intervals or notes to absolute notes anchored at root.
function normalizeNotes(seq, root=0, voices){
  let notes;
  if(voices && seq.length===voices-1){
    notes=eAToNotes(seq);
  }else if(!voices && seq.length && seq.reduce((a,b)=>a+b,0)<=11){
    // heuristic: treat as intervals when their sum stays within an octave
    notes=eAToNotes(seq);
  }else{
    notes=seq.slice();
  }
  return transposeNotes(notes,12,root);
}

// common routine to compute all unique voiced permutations for given notes.
function computeVoicings(notes){
  const comps=generateComponents(notes);
  const base=new Map();
  comps.forEach((c,i)=>{ if(!base.has(c)) base.set(c,notes[i]); });
  const perms=uniquePermutations(comps);
  const seen=new Set();
  const voicings=[];
  for(const p of perms){
    const vals=[];
    for(const c of p){
      let v=base.get(c);
      if(vals.length){ while(v<=vals[vals.length-1]) v+=12; }
      vals.push(v);
    }
    const key=vals.join(',');
    if(seen.has(key)) continue;
    seen.add(key);
    const ints=vals.slice(1).map((n,i)=>n-vals[i]);
    voicings.push({perm:p,vals,intervals:ints,range:vals[vals.length-1]-vals[0]});
  }
  return voicings;
}

/**
 * Generate all unique chord voicings grouped by bass component (rotation).
 * @param {number[]} seq Array of intervals between voices or modular notes.
 * @param {object|number} [opts] optional root or options object.
 * @param {number} [opts.rootNote=0] anchor pitch for the root component.
 * @param {number} [opts.voices] number of voices if `seq` contains intervals.
 * @returns {{bassComponent:string, voicings:number[][]}[]}
 */
export function generateRotationVoicings(seq, opts={}){
  if(typeof opts==='number') opts={rootNote:opts};
  const {rootNote=0, voices}=opts;
  const notes=normalizeNotes(seq, rootNote, voices);
  const voicings=computeVoicings(notes);
  const groups=new Map();
  for(const v of voicings){
    const bass=v.perm[0];
    if(!groups.has(bass)) groups.set(bass,[]);
    groups.get(bass).push(v);
  }
  return [...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([bass,vs])=>({bassComponent:bass,
      voicings:vs.sort((x,y)=>x.range-y.range).map(v=>v.intervals)}));
}

/**
 * Generate all unique chord voicings grouped by permutation pattern.
 * @param {number[]} seq Array of intervals between voices or modular notes.
 * @param {object|number} [opts] optional root or options object.
 * @param {number} [opts.rootNote=0] anchor pitch for the root component.
 * @param {number} [opts.voices] number of voices if `seq` contains intervals.
 * @returns {{pattern:string, voicings:number[][]}[]}
 */
export function generatePermutationVoicings(seq, opts={}){
  if(typeof opts==='number') opts={rootNote:opts};
  const {rootNote=0, voices}=opts;
  const notes=normalizeNotes(seq, rootNote, voices);
  const voicings=computeVoicings(notes);
  const groups=new Map();
  for(const v of voicings){
    const idx=v.perm.indexOf('a');
    const patt=v.perm.slice(idx).concat(v.perm.slice(0,idx)).join(' ');
    if(!groups.has(patt)) groups.set(patt,[]);
    groups.get(patt).push(v);
  }
  const arr=[...groups.entries()].map(([pattern,vs])=>{
    const span=Math.min(...vs.map(v=>v.range));
    return {pattern,span,voicings:vs.sort((x,y)=>x.perm[0].localeCompare(y.perm[0])).map(v=>v.intervals)};
  });
  arr.sort((a,b)=>a.span-b.span);
  arr.forEach(g=>delete g.span);
  return arr;
}
