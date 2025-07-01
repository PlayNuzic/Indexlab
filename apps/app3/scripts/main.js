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
  // starting MIDI note for Nm(0r3)
  const BASE=12*3;

  const diagMidis=()=>notes.map((n,i)=>BASE+n+12*i);
  const seqInput=document.getElementById('seq');
  const prefix=document.getElementById('seqPrefix');
  const errorEl=document.getElementById('error');
  const gridWrap=document.getElementById('grid');
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
        td.onclick=()=>{
          const size=notes.length;
          const diag=diagMidis();
          if(isDiag){
            Sound.playChord(diag);
          }else{
            const idx1=c;
            const idx2=size-1-r;
            if(upper){
              Sound.playChord([diag[idx1], diag[idx2]]);
            }else{
              const low = diag[idx1];
              const interval = Number(matrix[r][c]);
              Sound.playChord([low, low + interval]);
            }
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
});
