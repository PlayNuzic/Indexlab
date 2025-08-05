import { generateITPermutations } from '../../../shared/rhythm.js';
import { init, ensureAudio, playRhythm } from '../../../libs/sound/index.js';
import { Renderer, Stave, StaveNote, Voice, Formatter, Tuplet, Dot, Beam } from '../../../libs/vendor/vexflow/entry/vexflow.js';

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
    if(n<=8) return '32';
    return '64';
  }

  function noteFromUnits(units, baseDur){
    const denomMap={w:1,h:2,q:4,'8':8,'16':16,'32':32,'64':64};
    const noteMap={1:'w',2:'h',4:'q',8:'8',16:'16',32:'32',64:'64'};
    const baseDen=denomMap[baseDur];
    const simpleDen=baseDen/units;
    if(noteMap[simpleDen]) return {duration:noteMap[simpleDen],dots:0};
    const dottedDen=(3*baseDen)/(2*units);
    if(Number.isInteger(dottedDen) && noteMap[dottedDen]) return {duration:noteMap[dottedDen],dots:1};
    return {duration:baseDur,dots:0};
  }

  function drawPerm(container, perm, iT){
    container.innerHTML='';
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(240,100);
    const ctx = renderer.getContext();
    const stave = new Stave(0,40,240);
    stave.addClef('treble');
    stave.setContext(ctx).draw();
    const baseDur=getBaseDuration(iT);
    const notes=perm.map(n=>{
      const {duration,dots}=noteFromUnits(n,baseDur);
      const note=new StaveNote({keys:['c/5/x'],duration});
      for(let i=0;i<dots;i++) Dot.buildAndAttach([note]);
      return note;
    });
    const voice=new Voice({numBeats:perm.length,beatValue:4});
    voice.setStrict(false);
    voice.addTickables(notes);
    new Formatter().joinVoices([voice]).format([voice],230);
    const beams=[];
    let group=[];
    notes.forEach(note=>{
      const d=note.getDuration();
      if(d==='w'||d==='h'||d==='q'){
        if(group.length>1) beams.push(new Beam(group));
        group=[];
      }else{
        group.push(note);
      }
    });
    if(group.length>1) beams.push(new Beam(group));
    const tuplet=new Tuplet(notes,{numNotes:iT,notesOccupied:iT>3?4:2,ratioed:false,bracketed:true});
    voice.draw(ctx,stave);
    beams.forEach(b=>b.setContext(ctx).draw());
    tuplet.setContext(ctx).draw();

    const svg = container.querySelector('svg');
    const bbox = svg.getBBox();
    svg.setAttribute('viewBox', `0 0 ${bbox.width} ${bbox.height}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
  }

  function selectPerm(arr){
    selectedPerm=arr;
    Array.from(miniWrap.children).forEach(div=>{
      if(div.perm && JSON.stringify(div.perm)===JSON.stringify(arr)){
        div.classList.add('selected');
        selectedDiv=div;
      }else{div.classList.remove('selected');}
    });
  }

  function renderPerms(){
    permutations=generateITPermutations(iT);
    miniWrap.innerHTML='';
    permutations.forEach(perm=>{
      const div=document.createElement('div');
      div.className='mini';
      div.perm=perm;
      miniWrap.appendChild(div);
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
