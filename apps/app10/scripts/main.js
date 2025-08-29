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
  // Arrancamos con tamaño mínimo; re-dimensionamos tras calcular el contenido
  renderer.resize(10, 10);
  const ctx = renderer.getContext();

  const baseDur = getBaseDuration(iT);
  let totalNotes = 0;
  perm.forEach(n => { totalNotes += notesFromUnits(n, baseDur).length; });

  // Escala global coherente con los previews anteriores
  const SCALE_FACTOR = 0.75;
  const BASE_SMALL = 1.6; // >8 notas
  const BASE_LARGE = 1.8; // <=8 notas
  const scale = (totalNotes > 8 ? BASE_SMALL : BASE_LARGE) * SCALE_FACTOR;
  ctx.scale(scale, scale);

  const margin = 8; // margen visual alrededor del SVG

  // Construye notas primero (sin dibujar) para medir ancho mínimo real
  const allNotes=[];
  const ties=[];
  perm.forEach(n=>{
    const parts=notesFromUnits(n,baseDur);
    let prev=null;
    parts.forEach((p)=>{
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

  const formatter = new Formatter();
  formatter.joinVoices([voice]);

  // Stave provisional solo para calcular desplazamientos de la clave
  const stave = new Stave(margin/scale, margin/scale, 10);
  stave.addClef('treble');

  // Ancho mínimo necesario para las notas (sin sumar el espacio previo de clave)
  const contentWidth = Math.ceil(formatter.preCalculateMinTotalWidth([voice]));
  const left = stave.getNoteStartX(); // incluye efecto de clave/barra inicial
  const x = stave.getX();
  const leftPad = left - x;
  const rightPad = 12; // pequeño margen tras la última nota para el bracket
  const staveWidth = leftPad + contentWidth + rightPad;

  // Ahora sí, dimensionamos el renderer en píxeles (tras aplicar escala)
  const widthPx = Math.ceil((staveWidth + margin/scale) * scale);
  const heightPx = Math.ceil((stave.getBottomY() + margin/scale) * scale);
  renderer.resize(widthPx, heightPx);

  // Debemos volver a establecer el contexto tras el resize
  const ctx2 = renderer.getContext();
  ctx2.scale(scale, scale);

  // Redefine el mismo pentagrama con el ancho final y dibuja
  const finalStave = new Stave(margin/scale, margin/scale, staveWidth);
  finalStave.addClef('treble');
  finalStave.setContext(ctx2).draw();

  // Formatea exactamente al ancho calculado
  formatter.format([voice], contentWidth);

  // Beams, tuplets y ligaduras
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

  voice.draw(ctx2,finalStave);
  beams.forEach(b=>b.setContext(ctx2).draw());
  tuplet.setContext(ctx2).draw();
  ties.forEach(t=>t.setContext(ctx2).draw());

  // Ajusta viewBox exacto al contenido dibujado
  const svg = container.querySelector('svg');
  try{
    // Intenta medir el grupo principal si existe; si no, el propio SVG
    const g = svg.querySelector('g') || svg;
    const bb = g.getBBox();
    const pad = 6;
    svg.setAttribute('viewBox', `${Math.floor(bb.x - pad)} ${Math.floor(bb.y - pad)} ${Math.ceil(bb.width + pad*2)} ${Math.ceil(bb.height + pad*2)}`);
    container.style.width = `${Math.ceil(bb.width + pad*2)}px`;
    container.style.height = `${Math.ceil(bb.height + pad*2)}px`;
  }catch(_e){ /* getBBox puede fallar antes del paint en algunos navegadores */ }
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
    const baseDur=getBaseDuration(iT);
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
        // Deja que drawPerm mida y ajuste tamaño exacto
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
