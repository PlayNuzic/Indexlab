import { generateITPermutations } from '../../../shared/rhythm.js';
import { init, ensureAudio, playRhythm } from '../../../libs/sound/index.js';
import { Renderer, Stave, StaveNote, Voice, Formatter, Tuplet, Dot, Beam, StaveTie } from '../../../libs/vendor/vexflow/entry/vexflow.js';

const { initSnapshots, saveSnapshot, loadSnapshot, resetSnapshots } = window.SnapUtils;
const Presets = window.Presets;

document.addEventListener('DOMContentLoaded', async ()=>{
  await Promise.all([init('woodblocks'), document.fonts.ready]);
  const itSelect = document.getElementById('itSelect');
  const bpmInput = document.getElementById('bpm');
  const miniWrap = document.getElementById('miniWrap');
  const snapWrap = document.getElementById('snapshots');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetSnaps');
  const downloadBtn = document.getElementById('downloadSnaps');
  const uploadBtn = document.getElementById('uploadSnaps');
  const snapsFile = document.getElementById('snapsFile');
  const midiBtn = document.getElementById('midiBtn');

  for(let i=1;i<=9;i++){
    const opt=document.createElement('option');
    opt.value=String(i);
    opt.textContent=String(i);
    if(i===4) opt.selected=true;
    itSelect.appendChild(opt);
  }
  let iT = parseInt(itSelect.value,10);
  let permutations = [];
  let selectedPerm=null;
  let selectedDiv=null;
  let selectedSnap=null;

  let snapshots = initSnapshots(JSON.parse(localStorage.getItem('app10Snapshots')||'null'));

  function renderSnapshots(){
    snapWrap.innerHTML='';
    'ABCDEFGHIJ'.split('').forEach((ch,idx)=>{
      const btn=document.createElement('button');
      btn.textContent=ch;
      if(snapshots[idx]) btn.classList.add('saved');
      if(idx===selectedSnap) btn.classList.add('active');
      btn.onclick=()=>{
        selectedSnap=idx;
        if(snapshots[idx]){
          const snap=loadSnapshot(snapshots,idx);
          iT=snap.iT;
          itSelect.value=String(iT);
          bpmInput.value=String(snap.bpm);
          renderPerms();
          selectPerm(snap.permutation);
        }else{
          renderSnapshots();
        }
      };
      snapWrap.appendChild(btn);
    });
  }

  function getBaseDuration(n){
    if(n===1) return 'q';
    if(n<=3) return '8';
    if(n<=6) return '16';
    if(n<=9) return '32';
    return '64';
  }

  function notesFromUnits(units, baseDur){
    const denomMap={w:1,h:2,q:4,'8':8,'16':16,'32':32,'64':64};
    const noteMap={1:'w',2:'h',4:'q',8:'8',16:'16',32:'32',64:'64'};
    const baseDen=denomMap[baseDur];
    const simples=[];
    const dotted=[];
    Object.entries(noteMap).forEach(([denStr,dur])=>{
      const den=parseInt(denStr,10);
      if(baseDen%den===0) simples.push({units:baseDen/den,duration:dur,dots:0});
      if((3*baseDen)%(2*den)===0) dotted.push({units:(3*baseDen)/(2*den),duration:dur,dots:1});
    });
    simples.sort((a,b)=>b.units-a.units);
    dotted.sort((a,b)=>b.units-a.units);
    const res=[];
    let rem=units;
    while(rem>0){
      const match=simples.find(n=>n.units===rem)||dotted.find(n=>n.units===rem);
      if(match){ res.push(match); break; }
      let s=simples.find(n=>n.units<rem);
      if(s){ res.push(s); rem-=s.units; continue; }
      let d=dotted.find(n=>n.units<rem);
      if(d){ res.push(d); rem-=d.units; continue; }
      res.push({duration:baseDur,dots:0});
      rem-=1;
    }
    return res;
  }

  function drawPerm(container, perm, iT){
    container.innerHTML='';
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const { width, height } = container.getBoundingClientRect();
    renderer.resize(width, height);
    const ctx = renderer.getContext();
    const scale = 2;
    ctx.scale(scale, scale);
    const margin = 10;
    const stave = new Stave(margin/scale, margin/scale, (width - margin * 2)/scale);
    stave.addClef('treble');
    stave.setContext(ctx).draw();
    stave.setNoteStartX(stave.getNoteStartX() - 15/scale);
    const baseDur=getBaseDuration(iT);
    const allNotes=[];
    const ties=[];
    perm.forEach(n=>{
      const parts=notesFromUnits(n,baseDur);
      let prev=null;
      parts.forEach((p,idx)=>{
        const note=new StaveNote({keys:['c/5/x'],duration:p.duration});
        for(let i=0;i<p.dots;i++) Dot.buildAndAttach([note]);
        allNotes.push(note);
        if(prev) ties.push(new StaveTie({firstNote: prev, lastNote: note}));
        prev=note;
      });
    });
    const voice=new Voice({numBeats:perm.length,beatValue:4});
    voice.setStrict(false);
    voice.addTickables(allNotes);
    new Formatter().joinVoices([voice]).format([voice], (width - margin * 2 - 10)/scale);
    const beams=[];
    let group=[];
    allNotes.forEach(note=>{
      const d=note.getDuration();
      if(d==='w'||d==='h'||d==='q'){
        if(group.length>1) beams.push(new Beam(group));
        group=[];
      }else{
        group.push(note);
      }
    });
    if(group.length>1) beams.push(new Beam(group));
    const tuplet=new Tuplet(allNotes,{numNotes:iT,notesOccupied:iT>3?4:2,ratioed:false,bracketed:true});
    voice.draw(ctx,stave);
    beams.forEach(b=>b.setContext(ctx).draw());
    tuplet.setContext(ctx).draw();
    ties.forEach(t=>t.setContext(ctx).draw());

    const svg = container.querySelector('svg');
    const bbox = svg.getBBox();
    svg.setAttribute('viewBox', `${(bbox.x - margin)/scale} ${(bbox.y - margin)/scale} ${(bbox.width + margin * 2)/scale} ${(bbox.height + margin * 2)/scale}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
  }

  function selectPerm(arr){
    selectedPerm=arr;
    Array.from(miniWrap.querySelectorAll('.mini')).forEach(div=>{
      if(div.perm && JSON.stringify(div.perm)===JSON.stringify(arr)){
        div.classList.add('selected');
        selectedDiv=div;
      }else{div.classList.remove('selected');}
    });
  }

  function renderPerms(){
    permutations=generateITPermutations(iT);
    miniWrap.innerHTML='';
    const groups={};
    permutations.forEach(perm=>{
      const len=perm.length;
      (groups[len] ||= []).push(perm);
    });
    Object.keys(groups).map(Number).sort((a,b)=>b-a).forEach(len=>{
      const title=document.createElement('h3');
      title.className='attack-title';
      title.textContent=`${len} ataques`;
      miniWrap.appendChild(title);
      const row=document.createElement('div');
      row.className='attack-row';
      miniWrap.appendChild(row);
      groups[len].forEach(perm=>{
        const div=document.createElement('div');
        div.className='mini';
        div.perm=perm;
        const baseDur=getBaseDuration(iT);
        let totalNotes=0;
        perm.forEach(n=>{ totalNotes += notesFromUnits(n, baseDur).length; });
        let newWidth=240;
        if(totalNotes>6){ newWidth = 240 + (totalNotes - 6) * 20; }
        div.style.width = `${newWidth}px`;
        row.appendChild(div);
        drawPerm(div,perm,iT);
        div.onclick=async()=>{
          await ensureAudio();
          playRhythm(perm, parseFloat(bpmInput.value)||60);
          if(selectedDiv) selectedDiv.classList.remove('selected');
          div.classList.add('selected');
          selectedDiv=div;
          selectedPerm=perm;
        };
      });
    });
  }

  itSelect.onchange=()=>{ iT=parseInt(itSelect.value,10); renderPerms(); };

  saveBtn.onclick=()=>{
    if(selectedSnap==null || !selectedPerm) return;
    saveSnapshot(snapshots,selectedSnap,{iT,permutation:selectedPerm,bpm:parseFloat(bpmInput.value)||60});
    localStorage.setItem('app10Snapshots',JSON.stringify(snapshots));
    renderSnapshots();
  };
  resetBtn.onclick=()=>{
    snapshots=resetSnapshots();
    localStorage.removeItem('app10Snapshots');
    selectedSnap=null;
    renderSnapshots();
  };
  downloadBtn.onclick=()=>{ Presets.exportPresets(snapshots,'app10Snapshots.json'); };
  uploadBtn.onclick=()=>{ Presets.importPresets(snapsFile, data=>{
    snapshots=initSnapshots(data);
    localStorage.setItem('app10Snapshots', JSON.stringify(snapshots));
    renderSnapshots();
  }); };

  midiBtn.onclick=()=>{
    const seq=snapshots.filter(s=>s);
    if(!seq.length) return;
    const midi=new Midi();
    const bpm=parseFloat(bpmInput.value)||60;
    midi.header.setTempo(bpm);
    midi.header.timeSignatures=[{ticks:0,timeSignature:[4,4]}];
    const ppq=480;
    const track=midi.addTrack();
    seq.forEach((snap,idx)=>{
      const unit=(ppq*4)/snap.iT;
      let t=idx*ppq*4;
      snap.permutation.forEach(n=>{
        track.addNote({midi:76,ticks:t,durationTicks:unit*n,channel:9});
        t+=unit*n;
      });
    });
    const blob=new Blob([midi.toArray()],{type:'audio/midi'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='patterns.mid';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  };

  renderSnapshots();
  renderPerms();
});

