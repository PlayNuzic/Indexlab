window.addEventListener('DOMContentLoaded', async () => {
  await Sound.init();
  document.body.addEventListener('click',()=>Tone.start(),{once:true});
  // -------- helpers --------
  const parseNums = txt => txt.trim().split(/\s+/).map(n => parseInt(n.replace(/[^0-9-]/g,''),10)).filter(n => !isNaN(n));

  const eAToNotes = intervals => {
    const notes=[0];
    intervals.forEach(i=>notes.push((notes.at(-1)+i)%12));
    return notes;
  };

  const notesToEA = notes => notes.slice(1).map((n,i)=>((n-notes[i]+12)%12)).join(' ');
  const notesToAc = notes => notes.join(' ');

  const toAbsolute = (notes, base) => {
    const result=[base+notes[0]];
    for(let i=1;i<notes.length;i++){
      let next=base+notes[i];
      while(next<=result[i-1]) next+=12;
      result.push(next);
    }
    return result;
  };

  const buildMatrix = notes => {
    const N=notes.length;
    const m=Array.from({length:N},()=>Array(N).fill(''));
    notes.forEach((note,idx)=>{
      const r=N-1-idx;
      const c=idx;
      m[r][c]=note;
    });
    for(let i=0;i<N;i++){
      for(let j=i+1;j<N;j++){
        const asc=(notes[j]-notes[i]+12)%12;
        const desc=(12-asc)%12;
        m[N-1-j][i]=asc;
        m[N-1-i][j]=desc;
      }
    }
    return m;
  };

  // -------- state --------
  let mode='eA';
  let notes=eAToNotes([3,4,3]);
  let playMode='iA';
  let snapshots = JSON.parse(localStorage.getItem('app3Snapshots')||'null');
  if(!Array.isArray(snapshots) || snapshots.length!==10){
    snapshots = Array(10).fill(null);
  }
  let recording=false;
  let recordStart=0;
  let recorded=[];
  let recordBpm=120;
  let playing=false;
  let playTimers=[];
  // starting MIDI note for Nm(0r3)
  // starting MIDI note for Nm(0r3) -> C4 = MIDI 60
  const BASE = 60;

  const diagMidis = () => {
    const result = [];
    let current = BASE + notes[0];
    result.push(current);
    for (let i = 1; i < notes.length; i++) {
      let diff = notes[i] - notes[i - 1];
      if (diff <= 0) diff += 12;
      current += diff;
      result.push(current);
    }
    return result;
  };
  const seqInput=document.getElementById('seq');
  const prefix=document.getElementById('seqPrefix');
  const errorEl=document.getElementById('error');
  const gridWrap=document.getElementById('grid');
  const toggleBtn=document.getElementById('togglePlay');
  const snapWrap=document.getElementById('snapshots');
  const bpmInput=document.getElementById('bpm');
  const tapBtn=document.getElementById('tapBtn');
  const recBtn=document.getElementById('recBtn');
  const playSeqBtn=document.getElementById('playSeq');
  const midiBtn=document.getElementById('midiBtn');
  seqInput.value=notesToEA(notes);

  function switchMode(m){
    mode=m;
    document.getElementById('tabEA').classList.toggle('active',m==='eA');
    document.getElementById('tabAc').classList.toggle('active',m==='Ac');
    prefix.textContent=m+'(';
    seqInput.placeholder=m==='eA'?'3 4 3':'0 3 7';
    seqInput.value=m==='eA'?notesToEA(notes):notesToAc(notes);
  }

  document.getElementById('tabEA').onclick=()=>switchMode('eA');
  document.getElementById('tabAc').onclick=()=>switchMode('Ac');

  document.getElementById('generate').onclick=()=>{
    const nums=parseNums(seqInput.value);
    if(!nums.length){errorEl.textContent='Introduce números separados por espacios';return;}
    notes= mode==='eA'? eAToNotes(nums) : nums.map(x=>((x%12)+12)%12);
    errorEl.textContent='';
    renderGrid();
  };

  function renderGrid(){
    const matrix=buildMatrix(notes);
    const size=notes.length;
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
          inp.oninput=()=>{notes[c]=((parseInt(inp.value,10)||0)%12+12)%12;renderGrid();};
          td.appendChild(inp);
        }else{
          td.textContent=matrix[r][c];
          td.classList.add(upper?'upper':'lower');
        }
        td.onclick=e=>{
          const size=notes.length;
          const diag=diagMidis();
          const melodic = playMode==='iS' ? !e.shiftKey : e.shiftKey;
          let noteArr;
          if(isDiag){
            noteArr = diag;
          }else{
            const idx1=c;
            const idx2=size-1-r;
            if(upper){
              noteArr=[diag[idx1], diag[idx2]];
            }else{
              const low=diag[idx1];
              const interval=Number(matrix[r][c]);
              noteArr=[low, low+interval];
            }
          }
          const bpm = parseFloat(bpmInput.value) || 120;
          const dur = 2 * (60 / bpm);
          if(melodic) Sound.playMelody(noteArr, dur);
          else Sound.playChord(noteArr, dur);
          if(recording && Date.now()-recordStart >= 4*(60000/recordBpm)){
            const beat=(Date.now()-recordStart)/(60000/recordBpm);
            recorded.push({beat,notes:noteArr.slice(),melodic});
          }
        };
        td.onmouseenter=()=>setHover({r,c});
        td.onmouseleave=()=>setHover(null);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    gridWrap.appendChild(table);
  }

  function saveSnapshot(idx){
    snapshots[idx]=[...notes];
    localStorage.setItem('app3Snapshots',JSON.stringify(snapshots));
    renderSnapshots();
  }

  function loadSnapshot(idx){
    if(snapshots[idx]){
      notes=[...snapshots[idx]];
      seqInput.value=mode==='eA'?notesToEA(notes):notesToAc(notes);
      renderGrid();
      renderSnapshots();
    }
  }

  function renderSnapshots(){
    snapWrap.innerHTML='';
    for(let i=0;i<10;i++){
      const b=document.createElement('button');
      b.textContent=i+1;
      b.classList.toggle('saved',!!snapshots[i]);
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

  renderGrid();
  renderSnapshots();
  updatePlayMode();

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

  recBtn.onclick=()=>{
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
        setTimeout(()=>Sound.playNote(84),i*interval);
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

  playSeqBtn.onclick=()=>{
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
        const dur = 2 * (60 / bpm);
        ev.melodic ? Sound.playMelody(ev.notes, dur) : Sound.playChord(ev.notes, dur);
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
    const track=midi.addTrack();
    recorded.forEach(ev=>{
      if(ev.melodic){
        ev.notes.forEach((n,i)=>{
          track.addNote({midi:n,time:ev.beat+i*0.5,duration:0.5});
        });
      }else{
        ev.notes.forEach(n=>track.addNote({midi:n,time:ev.beat,duration:1}));
      }
    });
    const blob=new Blob([midi.toArray()],{type:'audio/midi'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='sequence.mid';
    a.click();
  };
});
