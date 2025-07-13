import { init, playNote, playChord, playMelody } from '../../../libs/sound/index.js';
import { motherScalesData, scaleSemis } from '../../../shared/scales.js';
const { initSnapshots, saveSnapshot: saveSnapData, loadSnapshot: loadSnapData, resetSnapshots: resetSnapData } = window.SnapUtils;
const Presets = window.Presets;

let audioReady;
const ensureAudio = async () => {
  if (!audioReady) {
    audioReady = Tone.start();
  }
  return audioReady;
};

window.addEventListener('DOMContentLoaded', async () => {
  await init();
  // -------- helpers --------
  const { parseNums, eAToNotes, notesToEA, notesToAc, toAbsolute, buildMatrix } = window.Helpers;

// -------- state --------
  let mode='eA';
  let scale={id:'CROM', rot:0, root:0};
  let notes=eAToNotes([3,4,3], scaleSemis(scale.id).length);
  let playMode='iA';
  let snapshots = initSnapshots(JSON.parse(localStorage.getItem('app3Snapshots')||'null'));
  let activeSnapshot=null;
  let recording=false;
  let recordStart=0;
  let recorded=[];
  let recordBpm=120;
  let playing=false;
  let playTimers=[];
  let showNm=false;
  // cache of diagonal MIDI notes for the currently rendered grid
  let diagArr=[];

  function fitNotes(){
    const len = scaleSemis(scale.id).length;
    notes = notes.map(n => ((n % len) + len) % len);
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
  baseSelect.onchange=()=>{baseMidi=parseInt(baseSelect.value,10);renderGrid();};

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
    return toAbsolute(sems, baseMidi);
  };
  const seqInput=document.getElementById('seq');
  const prefix=document.getElementById('seqPrefix');
  const errorEl=document.getElementById('error');
  const gridWrap=document.getElementById('grid');
  const toggleBtn=document.getElementById('togglePlay');
  const snapWrap=document.getElementById('snapshots');
  const resetSnapsBtn=document.getElementById('resetSnaps');
  const downloadSnapsBtn=document.getElementById('downloadSnaps');
  const uploadSnapsBtn=document.getElementById('uploadSnaps');
  const snapsFileInput=document.getElementById('snapsFile');
  const bpmInput=document.getElementById('bpm');
  const tapBtn=document.getElementById('tapBtn');
  const recBtn=document.getElementById('recBtn');
  const playSeqBtn=document.getElementById('playSeq');
  const midiBtn=document.getElementById('midiBtn');
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
    renderGrid();
    seqInput.value=mode==='eA'?notesToEA(notes, scaleSemis(scale.id).length):notesToAc(notes);
  };
  rotSel.onchange=()=>{ scale.rot=parseInt(rotSel.value,10); renderGrid(); };
  rootSel.onchange=()=>{ scale.root=parseInt(rootSel.value,10); renderGrid(); };
  showNmBtn.onmousedown=()=>{ showNm=true; showNmBtn.classList.add('active'); renderGrid(); };
  showNmBtn.onmouseup=showNmBtn.onmouseleave=()=>{ showNm=false; showNmBtn.classList.remove('active'); renderGrid(); };

  function switchMode(m){
    mode=m;
    document.getElementById('tabEA').classList.toggle('active',m==='eA');
    document.getElementById('tabAc').classList.toggle('active',m==='Ac');
    prefix.textContent=m+'(';
    seqInput.placeholder=m==='eA'?'3 4 3':'0 3 7';
    const len=scaleSemis(scale.id).length;
    seqInput.value=m==='eA'?notesToEA(notes, len):notesToAc(notes);
    transposeControls.style.display=m==='Ac'? 'flex' : 'none';
  }

  document.getElementById('tabEA').onclick=()=>switchMode('eA');
  document.getElementById('tabAc').onclick=()=>switchMode('Ac');

  function transpose(delta){
    const nums=parseNums(seqInput.value);
    if(!nums.length) return;
    const len=scaleSemis(scale.id).length;
    const transposed=nums.map(n=>((n+delta)%len+len)%len);
    seqInput.value=transposed.join(' ');
    notes=transposed;
    fitNotes();
    renderGrid();
    notesChanged();
  }

  transposeUp.onclick=()=>transpose(1);
  transposeDown.onclick=()=>transpose(-1);

  document.getElementById('generate').onclick=()=>{
    const nums=parseNums(seqInput.value);
    if(!nums.length){errorEl.textContent='Introduce números separados por espacios';return;}
    const len=scaleSemis(scale.id).length;
    notes= mode==='eA'? eAToNotes(nums, len) : nums.map(x=>((x%len)+len)%len);
    errorEl.textContent='';
    renderGrid();
    notesChanged();
  };

  function renderGrid(){
    const len=scaleSemis(scale.id).length;
    const matrix=showNm ? buildMatrix(notes.map(n=>degToSemi(n)),12) : buildMatrix(notes,len);
    const size=notes.length;
    diagArr = diagMidis();
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
          const inp=document.createElement('input');
          inp.type='number';
          inp.value=matrix[r][c];
          inp.readOnly=showNm;
          inp.addEventListener('keydown',e=>{
            if(['ArrowUp','ArrowDown','Tab','Shift','Control','Alt'].includes(e.key)) return;
            e.preventDefault();
          });
          inp.oninput=()=>{
            notes[c]=((parseInt(inp.value,10)||0)%len+len)%len;
            renderGrid();
            seqInput.value=mode==='eA'?notesToEA(notes, len):notesToAc(notes);
            notesChanged();
          };
          td.appendChild(inp);
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
          const melodicDur = 60 / bpm;
          if(melodic) playMelody(noteArr, melodicDur);
          else playChord(noteArr, chordDur);
          if(recording && Date.now()-recordStart >= 4*(60000/recordBpm)){
            const beat=(Date.now()-recordStart)/(60000/recordBpm);
            recorded.push({beat,notes:noteArr.slice(),melodic,coord:{r,c}});
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
      fitNotes();
      const len=scaleSemis(scale.id).length;
      seqInput.value=mode==='eA'?notesToEA(notes, len):notesToAc(notes);
      renderGrid();
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
      b.onclick=e=>{
        if(e.shiftKey){
          saveSnapshot(i);
        }else{
          loadSnapshot(i);
        }
        renderSnapshots();
      };
      snapWrap.appendChild(b);
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
    const size=notes.length;
    document.querySelectorAll('.matrix td').forEach(td=>{
      td.classList.remove('highlight-diag','highlight-pair');
    });
    if(!coord) return;
    const {r,c}=coord;
    const hoverIsDiag = r+c===size-1;
    if(hoverIsDiag){
      document.querySelectorAll('.matrix td').forEach(td=>{
        const rr=+td.dataset.r, cc=+td.dataset.c;
        if(rr+cc===size-1) td.classList.add('highlight-diag');
      });
    }else{
      const compR=size-1-c, compC=size-1-r;
      document.querySelectorAll('.matrix td').forEach(td=>{
        const rr=+td.dataset.r, cc=+td.dataset.c;
        if((rr===r&&cc===c)||(rr===compR&&cc===compC)) td.classList.add('highlight-pair');
      });
    }
  }

  function flashCell(coord){
    if(!coord) return;
    const size=notes.length;
    const {r,c}=coord;
    const cells=[];
    const isDiag=r+c===size-1;
    if(isDiag){
      document.querySelectorAll('.matrix td').forEach(td=>{
        const rr=+td.dataset.r, cc=+td.dataset.c;
        if(rr+cc===size-1){cells.push(td);}
      });
      cells.forEach(td=>td.classList.add('playing-diag'));
    }else{
      const compR=size-1-c, compC=size-1-r;
      document.querySelectorAll('.matrix td').forEach(td=>{
        const rr=+td.dataset.r, cc=+td.dataset.c;
        if((rr===r&&cc===c)||(rr===compR&&cc===compC)) cells.push(td);
      });
      cells.forEach(td=>td.classList.add('playing-pair'));
    }
    setTimeout(()=>{
      cells.forEach(td=>td.classList.remove('playing-diag','playing-pair'));
    },200);
  }

  renderGrid();
  renderSnapshots();
  updatePlayMode();
  switchMode(mode);
  resetSnapsBtn.onclick=resetSnapshots;
  downloadSnapsBtn.onclick=downloadSnapshots;
  uploadSnapsBtn.onclick=promptLoadSnapshots;

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
        const melodicDur = 60 / bpm;
        ev.melodic ? playMelody(ev.notes, melodicDur) : playChord(ev.notes, chordDur);
        if(ev.coord) flashCell(ev.coord);
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
        ev.notes.forEach((n,i)=>{
          track.addNote({
            midi:n,
            ticks: baseTick + i * ppq,
            durationTicks: ppq
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

  window.addEventListener('resize', resizeMatrix);
});
