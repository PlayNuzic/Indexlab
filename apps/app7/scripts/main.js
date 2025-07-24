import drawPentagram from '../../../libs/notation/pentagram.js';
import { motherScalesData } from '../../../shared/scales.js';

const scaleIDs = ['DIAT','ACUS','ARMm','ARMM'];

window.addEventListener('DOMContentLoaded', () => {
  const staffEl = document.getElementById('staff');
  const scaleSel = document.getElementById('scaleSel');
  const rotSel = document.getElementById('rotSel');
  const rootSel = document.getElementById('rootSel');

  const state = { id: 'DIAT', rot: 0, root: 0 };

  scaleIDs.forEach(id => scaleSel.add(new Option(`${id} – ${motherScalesData[id].name}`, id)));
  [...Array(12).keys()].forEach(i => rootSel.add(new Option(i, i)));

  function refreshRot(){
    rotSel.innerHTML='';
    motherScalesData[state.id].rotNames.forEach((n,i)=>rotSel.add(new Option(`${i} – ${n}`, i)));
    rotSel.value = state.rot;
  }

  function render(){
    drawPentagram(staffEl, [], { scaleId: state.id, root: state.root });
  }

  refreshRot();
  scaleSel.value = state.id;
  rootSel.value = state.root;
  render();

  scaleSel.onchange = () => { state.id = scaleSel.value; refreshRot(); render(); };
  rotSel.onchange = () => { state.rot = parseInt(rotSel.value, 10); render(); };
  rootSel.onchange = () => { state.root = parseInt(rootSel.value, 10); render(); };
});
