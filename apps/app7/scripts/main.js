import { drawPentagram } from '../../../libs/notation/index.js';
import { motherScalesData, scaleSemis, currentSemis } from '../../../shared/scales.js';

function toAbsolute(notes, base){
  const result=[base+notes[0]];
  for(let i=1;i<notes.length;i++){
    let next=base+notes[i];
    while(next<=result[i-1]) next+=12;
    result.push(next);
  }
  return result;
}

const scaleIDs = Object.keys(motherScalesData);
const ksScales = ['DIAT','ACUS','ARMme','ARMma'];

window.addEventListener('DOMContentLoaded', () => {
  const staffEl = document.getElementById('staff');
  const scaleSel = document.getElementById('scaleSel');
  const rotSel = document.getElementById('rotSel');
  const rootSel = document.getElementById('rootSel');
  const ksSwitch = document.getElementById('ksSwitch');

  let useKeySig = true;

  const state = { id: 'DIAT', rot: 0, root: 0 };

  scaleIDs.forEach(id => scaleSel.add(new Option(`${id} – ${motherScalesData[id].name}`, id)));
  [...Array(12).keys()].forEach(i => rootSel.add(new Option(i, i)));

  function refreshRot(){
    rotSel.innerHTML='';
    motherScalesData[state.id].rotNames.forEach((n,i)=>rotSel.add(new Option(`${i} – ${n}`, i)));
    rotSel.value = state.rot;
  }

  function render(){
    const len = scaleSemis(state.id).length;
    const degrees = Array.from({length: len + 1}, (_,i) => i);
    const sems = currentSemis(state, degrees);
    const asc = toAbsolute(sems, 60);
    const desc = asc.slice().reverse().map(m => m - 24);
    const midis = asc.map((n,i)=>[n, desc[i]]);
    const withKs = useKeySig && ksScales.includes(state.id);
    const options = { duration:'w' };
    if(withKs){
      options.scaleId = state.id;
      options.root = state.root;
    }else{
      options.scaleId = 'CROM';
      options.root = 0;
    }
    options.paired = true;
    drawPentagram(staffEl, midis, options);
  }

  refreshRot();
  scaleSel.value = state.id;
  rootSel.value = state.root;
  ksSwitch.classList.toggle('on', useKeySig);
  ksSwitch.setAttribute('aria-pressed', useKeySig);
  render();

  scaleSel.onchange = () => { state.id = scaleSel.value; refreshRot(); render(); };
  rotSel.onchange = () => { state.rot = parseInt(rotSel.value, 10); render(); };
  rootSel.onchange = () => { state.root = parseInt(rootSel.value, 10); render(); };
  ksSwitch.onclick = () => { useKeySig = !useKeySig; ksSwitch.classList.toggle('on', useKeySig); ksSwitch.setAttribute('aria-pressed', useKeySig); render(); };
});
