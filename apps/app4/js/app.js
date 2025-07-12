import { init as initSound, playNote } from '../../../libs/sound/index.js';
import { rowToMidi } from '../../../shared/midi.js';

const randInt=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const clamp=(x,min,max)=>x<min?min:x>max?max:x;
const wrapSym=(n,m)=>{const h=Math.floor(m/2);n=((n+h)%m+m)%m-h;return n===h?-h:n;};

// SCALE DATA
const scaleIDs=Object.keys(motherScalesData);

// STATE
const ROWS=8, COLS=8;
let state={
  bpm:90,
  view:'Na',
  octProb:0.15,
  scale:{id:'CROM', rot:0, root:0},
  params:{iR:null, caDif:null, rango:24, duplicates:true, start:null},
  naRows:[]
};
let presets=Array(8).fill(null), currentPreset=-1;

// DOM REFERENCES
const scaleSel=document.getElementById('scaleSel');
const rotSel=document.getElementById('rotSel');
const rootSel=document.getElementById('rootSel');
const viewSel=document.getElementById('viewSel');
const btnRoll=document.getElementById('btnRoll');
const btnClear=document.getElementById('btnClear');
const bpmInp=document.getElementById('bpmInp');
const octProb=document.getElementById('octProb');
const octProbVal=document.getElementById('octProbVal');
const grid=document.getElementById('grid');
const presetBar=document.getElementById('presetBar');
const downloadPresetsBtn=document.getElementById('downloadPresets');
const uploadPresetsBtn=document.getElementById('uploadPresets');
const presetsFileInput=document.getElementById('presetsFile');
const irSel=document.getElementById('irSel');
const cadifInp=document.getElementById('cadifInp');
const rangoInp=document.getElementById('rangoInp');
const dupChk=document.getElementById('dupChk');
const startSel=document.getElementById('startSel');

// INITIALIZE SELECTORS
scaleIDs.forEach(id=>scaleSel.add(new Option(`${id} – ${motherScalesData[id].name}`, id)));
[...Array(12).keys()].forEach(i=>rootSel.add(new Option(i, i)));
[...Array(12).keys()].forEach(i=>startSel.add(new Option(i, i)));
for(let i=-24;i<=24;i++) irSel.add(new Option(i===0?'+0':(i>0?`+${i}`:`${i}`), i));
irSel.insertBefore(new Option('Aleatorio',''), irSel.firstChild);
startSel.insertBefore(new Option('Aleatorio',''), startSel.firstChild);
function refreshRot(){
  rotSel.innerHTML='';
  motherScalesData[state.scale.id].rotNames.forEach((n,i)=>rotSel.add(new Option(`${i} – ${n}`, i)));
  rotSel.value=state.scale.rot;
}
refreshRot();

// CONVERSION UTILITY
function absToDegInfo(abs){
  const {id, rot, root}=state.scale;
  const sems=scaleSemis(id).map(s=> (s+root)%12 );
  const mod=(abs-root+1200)%12;
  let best=0, diff=12;
  sems.forEach((v,i)=>{const d=Math.abs(mod-v); if(d<diff){diff=d; best=i;}});
  const len=sems.length;
  const deg=(best-rot+len)%len;
  const off=wrapSym(mod-sems[best],12);
  return {deg, off};
}

// ROW GENERATORS
function genNaRow(){ return Array.from({length:COLS}, ()=>randInt(0,96)); }
function genNmRow(){ return Array.from({length:COLS}, ()=>{ let n=randInt(0,11), d=Math.random()<state.octProb?(Math.random()<0.5?12:-12):0; return clamp(4*12+n+d,0,96); }); }
function genScaleDegreeRow(){ const sems=scaleSemis(state.scale.id); return Array.from({length:COLS}, ()=>{ let deg=randInt(0,sems.length-1), sem=(sems[(deg+state.scale.rot)%sems.length]+state.scale.root)%12, d=Math.random()<state.octProb?(Math.random()<0.5?12:-12):0; return clamp(4*12+sem+d,0,96); }); }
function genISmRow(){ let v=randInt(0,96); return Array.from({length:COLS},(_,i)=>{ if(i===0) return v; let iv=randInt(-6,6); if(Math.random()<state.octProb) iv+=(Math.random()<0.5?12:-12); v=clamp(v+iv,0,96); return v; }); }
function genIStepRow(){ const sems=scaleSemis(state.scale.id); let idx=randInt(0,sems.length-1), oct=4, sem=(sems[(idx+state.scale.rot)%sems.length]+state.scale.root)%12, v=clamp(oct*12+sem,0,96); return Array.from({length:COLS},(_,i)=>{ if(i===0) return v; let diff=randInt(-Math.floor(sems.length/2),Math.floor(sems.length/2)); if(Math.random()<state.octProb) diff+=(Math.random()<0.5?-sems.length:sems.length); idx=(idx+diff+sems.length)%sems.length; sem=(sems[(idx+state.scale.rot)%sems.length]+state.scale.root)%12; oct+=Math.sign(diff); v=clamp(oct*12+sem,0,96); return v; }); }

function applyGlobalParams(row){
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

// PARSE CELL INPUT
function parseCellInput(view,input,oldNa){ const parts=input.split(/r/i).map(s=>s.trim()); const value=parseInt(parts[0],10); const octave=parts[1]?parseInt(parts[1],10):Math.floor(oldNa/12); if(isNaN(value)) return oldNa; let newNa; switch(view){ case 'Na': newNa=clamp(value,0,96); break; case 'Nm': newNa=clamp(octave*12+wrapSym(value,12),0,96); break; case 'Nº':{ const sems=scaleSemis(state.scale.id), len=sems.length; const sem=(sems[(value+state.scale.rot+len)%len]+state.scale.root)%12; newNa=clamp(octave*12+sem,0,96); break; } case 'iSm': case 'iAm': newNa=clamp(oldNa+value,0,96); break; case 'iSº': case 'iAº':{ const info=absToDegInfo(oldNa), len=scaleSemis(state.scale.id).length; const newDeg=info.deg+value; const sem2=(scaleSemis(state.scale.id)[(newDeg+state.scale.rot+len)%len]+state.scale.root)%12; newNa=clamp(octave*12+sem2,0,96); break; } default: return oldNa;} return newNa; }

// RENDER GRID
function renderGrid(){
  grid.innerHTML='';
  const thead=document.createElement('thead');
  const htr=document.createElement('tr');
  htr.appendChild(document.createElement('th'));
  for(let c=1;c<=COLS;c++){
    const th=document.createElement('th');
    th.textContent=c;
    htr.appendChild(th);
  }
  thead.appendChild(htr);
  grid.appendChild(thead);
  const tb=document.createElement('tbody');
  state.naRows.forEach((row,r)=>{
    const tr=document.createElement('tr');
    const td0=document.createElement('td');
    const btn=document.createElement('button');
    btn.textContent=playingRow.idx===r?'⏹':'▶';
    btn.style.width='2.2rem';
    btn.onclick=()=>{ playRow(r); renderGrid(); };
    td0.appendChild(btn);
    const midiBtn=document.createElement('button');
    midiBtn.textContent='💾';
    midiBtn.className='midi-btn';
    midiBtn.onclick=()=>{ downloadRow(r); };
    td0.appendChild(midiBtn);
    tr.appendChild(td0);
    row.forEach((n,c)=>{
      const td=document.createElement('td');
      let txt='';
      switch(state.view){
        case 'Na':
          txt=n!=null?n:'';
          break;
        case 'Nm':
          txt=n!=null?`${((n%12)+12)%12}r${Math.floor(n/12)}`:'';
          break;
        case 'Nº':
          if(n!=null){
            const di=absToDegInfo(n), oct=Math.floor(n/12);
            const degStr=di.off===0?`${di.deg}`:di.off>0?`${di.deg}+${di.off}`:`${di.deg}-${Math.abs(di.off)}`;
            txt=`${degStr}r${oct}`;
          }
          break;
        case 'iSm':
        case 'iAm':
          if(c===0){
            txt=n!=null?`${((n%12)+12)%12}r${Math.floor(n/12)}`:'';
          }else{
            txt=row[c]-row[c-1];
          }
          break;
        case 'iSº':
        case 'iAº':
          if(c===0){
            if(n!=null){
              const di=absToDegInfo(n), oct=Math.floor(n/12);
              const degStr=di.off===0?`${di.deg}`:di.off>0?`${di.deg}+${di.off}`:`${di.deg}-${Math.abs(di.off)}`;
              txt=`${degStr}r${oct}`;
            }
          }else{
            const prev=row[c-1], pi=absToDegInfo(prev), ci=absToDegInfo(n);
            const offDiff=wrapSym(ci.off-pi.off,12);
            const len=scaleSemis(state.scale.id).length;
            const degDiff=wrapSym(ci.deg-pi.deg,len);
            const octDiff=Math.floor(n/12)-Math.floor(prev/12);
            const base=octDiff*len+degDiff;
            txt=offDiff===0?`${base}`:offDiff>0?`${base}${'+'.repeat(offDiff)}`:`${base}${'-'.repeat(-offDiff)}`;
          }
          break;
      }
      td.textContent=txt;
      td.contentEditable=true;
      td.onfocus=()=>{
        td.dataset.oldNa=row[c];
        td.dataset.rowSnapshot=JSON.stringify(row);
      };
      td.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); td.blur(); }};
      td.onblur=()=>{
        const v=td.textContent.trim();
        const oldNa=parseFloat(td.dataset.oldNa);
        if(v===''||v===String(oldNa)) return;
        let parseView=state.view;
        if(c===0 && ['iSm','iAm'].includes(state.view)) parseView='Nm';
        if(c===0 && ['iSº','iAº'].includes(state.view)) parseView='Nº';
        const newNa=parseCellInput(parseView,v,oldNa);
        if(newNa===oldNa) return;
        if(['iSm','iAm','iSº','iAº'].includes(state.view)){
          const snap=JSON.parse(td.dataset.rowSnapshot);
          const newRow=[...snap];
          newRow[c]=newNa;
          for(let k=c+1;k<newRow.length;k++){
            const origDiff=snap[k]-snap[k-1];
            newRow[k]=clamp(newRow[k-1]+origDiff,0,96);
          }
          state.naRows[r]=newRow;
        } else {
          state.naRows[r][c]=newNa;
        }
        renderGrid();
      };
      tr.appendChild(td);
    });
    const tdOp=document.createElement('td');
    tdOp.classList.add('row-op-cell');
    const opSelect=document.createElement('select');
    ['0','1','-1','2','-2','3','-3','4','-4'].forEach(val=>{
      const o=document.createElement('option');
      o.value=val;
      o.textContent=val==='0'?'R':(parseInt(val)>0?`+${val}`:val);
      opSelect.appendChild(o);
    });
    opSelect.onchange=()=>{
      const delta=parseInt(opSelect.value,10)*12;
      state.naRows[r]=state.naRows[r].map(x=>x!=null?clamp(x+delta,0,96):null);
      renderGrid();
    };
    tdOp.appendChild(opSelect);
    tr.appendChild(tdOp);
    tb.appendChild(tr);
  });
  grid.appendChild(tb);
}

// AUDIO PLAYBACK via Tone.js
let audioReady=false;
let playTimers=[];
const playingRow={idx:null};
async function ensureSampler(){
  if(!audioReady){
    await initSound('piano');
    audioReady=true;
  }
}

function stopCurrent(){
  playTimers.forEach(clearTimeout);
  playTimers=[];
  playingRow.idx=null;
}

async function playRow(r){
  if(playingRow.idx===r){ stopCurrent(); return; }
  await ensureSampler();
  stopCurrent();
  const row=state.naRows[r];
  const beat=60/state.bpm;
  row.forEach((n,i)=>{
    const id=setTimeout(()=>playNote(n+12,beat), i*beat*1000);
    playTimers.push(id);
  });
  playingRow.idx=r;
}

// MIDI EXPORT
function downloadRow(r){ const data=rowToMidi(state.naRows[r],state.bpm); const blob=new Blob([data],{type:'audio/midi'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`row-${r+1}.mid`; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(url); a.remove();},100); }

// PRESETS
function buildPresetBar(){ presetBar.innerHTML=''; presets.forEach((p,i)=>{ const b=document.createElement('button'); b.textContent=i+1; b.className=p?'filled':'empty'; if(i===currentPreset)b.classList.add('selected'); b.onclick=e=>{ if(e.altKey){ presets[i]=null; currentPreset=-1; buildPresetBar(); return;} if(e.shiftKey){ presets[i]=JSON.parse(JSON.stringify(state)); currentPreset=i; buildPresetBar(); return;} if(presets[i]){ state=JSON.parse(JSON.stringify(presets[i])); applyState();}}; presetBar.appendChild(b);});}

function downloadPresets(){
  Presets.exportPresets(presets, 'app4-presets.json');
}

function promptLoadPresets(){
  Presets.importPresets(presetsFileInput, data=>{
    presets=data;
    currentPreset=-1;
    buildPresetBar();
  });
}

// MAIN GENERATE
function genRows(){
  state.naRows=[];
  for(let r=0;r<ROWS;r++){
    let row;
    switch(state.view){
      case 'Na': row=genNaRow(); break;
      case 'Nm': row=genNmRow(); break;
      case 'Nº': row=genScaleDegreeRow(); break;
      case 'iSm':
      case 'iAm': row=genISmRow(); break;
      case 'iSº':
      case 'iAº': row=genIStepRow(); break;
    }
    state.naRows.push(applyGlobalParams(row));
  }
  renderGrid();
  stopCurrent();
}

// EVENTS
btnRoll.onclick=()=>{ genRows(); currentPreset=-1; buildPresetBar();};
viewSel.onchange=e=>{ state.view=e.target.value; renderGrid();};
bpmInp.onchange=e=>{ state.bpm=clamp(+bpmInp.value,20,300); };
octProb.oninput=e=>{ state.octProb=parseFloat(octProb.value); octProbVal.textContent=state.octProb.toFixed(2);};
scaleSel.onchange=e=>{ state.scale.id=e.target.value; refreshRot(); renderGrid();};
rotSel.onchange=e=>{ state.scale.rot=+rotSel.value; renderGrid();};
rootSel.onchange=e=>{ state.scale.root=+rootSel.value; renderGrid();};
irSel.onchange=e=>{ state.params.iR=irSel.value===''?null:+irSel.value; genRows(); };
cadifInp.onchange=e=>{ const v=cadifInp.value; state.params.caDif=v?+v:null; genRows(); };
rangoInp.onchange=e=>{ state.params.rango=+rangoInp.value; genRows(); };
dupChk.onchange=e=>{ state.params.duplicates=dupChk.checked; genRows(); };
startSel.onchange=e=>{ state.params.start=startSel.value===''?null:+startSel.value; genRows(); };
btnClear.onclick=e=>{ if(e.ctrlKey){ state.naRows=Array.from({length:ROWS},()=>Array(COLS).fill(null)); renderGrid(); return;} state.naRows.forEach(r=>r.fill(null)); renderGrid();};
downloadPresetsBtn.onclick=downloadPresets;
uploadPresetsBtn.onclick=promptLoadPresets;

// INIT
(function(){ state.naRows=Array.from({length:ROWS},()=>Array(COLS).fill(null)); applyState(); })();

function applyState(){
  scaleSel.value=state.scale.id;
  refreshRot();
  rotSel.value=state.scale.rot;
  rootSel.value=state.scale.root;
  viewSel.value=state.view;
  octProb.value=state.octProb;
  octProbVal.textContent=state.octProb.toFixed(2);
  bpmInp.value=state.bpm;
  irSel.value=state.params.iR==null?'' : state.params.iR;
  cadifInp.value=state.params.caDif==null?'' : state.params.caDif;
  rangoInp.value=state.params.rango;
  dupChk.checked=state.params.duplicates;
  startSel.value=state.params.start==null?'' : state.params.start;
  renderGrid();
  buildPresetBar();
}

