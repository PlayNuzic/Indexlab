function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function clamp(x, min, max) {
  return x < min ? min : x > max ? max : x;
}

function wrapSym(n, m) {
  const h = Math.floor(m / 2);
  n = ((n + h) % m + m) % m - h;
  return n === h ? -h : n;
}

const motherScalesData = {
  CROM:{name:'Cromática',ee:Array(12).fill(1),rotNames:['Único']},
  DIAT:{name:'Diatónica',ee:[2,2,1,2,2,2,1],rotNames:['Mayor','Dórica','Frigia','Lidia','Mixolidia','Eolia','Locria']},
  ACUS:{name:'Acústica',ee:[2,2,2,1,2,1,2],rotNames:['Acústica','Mixol b6','Semidim','Alterada','Menor Mel.','Dórica b2','Lidia Aum']},
  ARMm:{name:'Armónica Menor',ee:[2,1,2,2,1,3,1],rotNames:['Arm Menor','Locria Nat','Mayor Aum','Lidia Dim','Frigia Dom','Aeo Arm','Ultralocr']},
  ARMM:{name:'Armónica Mayor',ee:[2,2,1,2,1,3,1],rotNames:['Arm Mayor','Dórica b5','Frigia b4','Lidia b3','Mixo b9','Lidia #2','Locria bb7']},
  OCT:{name:'Octatónica',ee:[1,2,1,2,1,2,1,2],rotNames:['Modo 1','Modo 2']},
  HEX:{name:'Hexatónica',ee:[1,3,1,3,1,3],rotNames:['Aumentada','Inversa']},
  TON:{name:'Tonos',ee:[2,2,2,2,2,2],rotNames:['Único']}
};

function scaleSemis(id){
  if(!scaleSemis.cache) scaleSemis.cache = new Map();
  if(scaleSemis.cache.has(id)) return scaleSemis.cache.get(id);
  let acc = 0, arr = [0];
  motherScalesData[id].ee.forEach(v => { acc += v; arr.push(acc % 12); });
  arr.pop();
  scaleSemis.cache.set(id, arr);
  return arr;
}

const COLS = 8;

function absToDegInfo(state, abs){
  const {id, rot, root} = state.scale;
  const sems = scaleSemis(id).map(s => (s + root) % 12);
  const mod = (abs - root + 1200) % 12;
  let best = 0, diff = 12;
  sems.forEach((v,i)=>{ const d=Math.abs(mod-v); if(d<diff){ diff=d; best=i; }});
  const len = sems.length;
  const deg = (best - rot + len) % len;
  const off = wrapSym(mod - sems[best],12);
  return {deg, off};
}

function genNaRow(){
  return Array.from({length: COLS}, () => randInt(0,96));
}
function genNmRow(state){
  return Array.from({length: COLS}, ()=>{
    const n=randInt(0,11);
    const d=Math.random()<state.octProb ? (Math.random()<0.5?12:-12) : 0;
    return clamp(4*12+n+d,0,96);
  });
}
function genScaleDegreeRow(state){
  const sems=scaleSemis(state.scale.id);
  return Array.from({length: COLS}, ()=>{
    const deg=randInt(0,sems.length-1);
    const sem=(sems[(deg+state.scale.rot)%sems.length]+state.scale.root)%12;
    const d=Math.random()<state.octProb ? (Math.random()<0.5?12:-12) : 0;
    return clamp(4*12+sem+d,0,96);
  });
}
function genISmRow(state){
  let v=randInt(0,96);
  return Array.from({length: COLS}, (_,i)=>{
    if(i===0) return v;
    let iv=randInt(-6,6);
    if(Math.random()<state.octProb) iv+=(Math.random()<0.5?12:-12);
    v=clamp(v+iv,0,96);
    return v;
  });
}
function genIStepRow(state){
  const sems=scaleSemis(state.scale.id);
  let idx=randInt(0,sems.length-1);
  let oct=4;
  let sem=(sems[(idx+state.scale.rot)%sems.length]+state.scale.root)%12;
  let v=clamp(oct*12+sem,0,96);
  return Array.from({length: COLS}, (_,i)=>{
    if(i===0) return v;
    let diff=randInt(-Math.floor(sems.length/2),Math.floor(sems.length/2));
    if(Math.random()<state.octProb) diff+=(Math.random()<0.5?-sems.length:sems.length);
    idx=(idx+diff+sems.length)%sems.length;
    sem=(sems[(idx+state.scale.rot)%sems.length]+state.scale.root)%12;
    oct+=Math.sign(diff);
    v=clamp(oct*12+sem,0,96);
    return v;
  });
}
function applyGlobalParams(state,row){
  const p=state.params;
  if(p.start!=null) row[0]=clamp(4*12+wrapSym(p.start,12),0,96);
  const base=row[0];
  const range=p.rango??24;
  for(let i=0;i<row.length;i++) row[i]=clamp(row[i], base-range, base+range);
  if(p.iR!=null) row[row.length-1]=clamp(base+p.iR, base-range, base+range);
  if(!p.duplicates){
    const used=new Set();
    for(let i=0;i<row.length;i++){
      let n=row[i], tries=0;
      while(used.has(n)&&tries<50){
        n=clamp(base+randInt(-range,range),0,96); tries++; }
      row[i]=n; used.add(n);
    }
  }
  if(p.caDif!=null){
    const used=new Set();
    for(let i=0;i<row.length;i++){
      if(used.size<p.caDif){ used.add(row[i]); }
      else if(!used.has(row[i])){ const arr=Array.from(used); row[i]=arr[randInt(0,arr.length-1)]; }
    }
  }
  return row;
}

module.exports = { genNaRow, genNmRow, genScaleDegreeRow, genISmRow, genIStepRow, applyGlobalParams, absToDegInfo, scaleSemis, randInt };
