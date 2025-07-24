import { drawKeySignature } from '../../../libs/notation/index.js';
import { motherScalesData, getKeySignature } from '../../../shared/scales.js';

const scaleIDs = ['DIAT','ACUS','ARMm','ARMM'];
const rootNames = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  scaleIDs.forEach(id => {
    const row = document.createElement('div');
    row.className = 'scale-row';
    const title = document.createElement('h2');
    title.textContent = `${motherScalesData[id].name} (${id})`;
    row.appendChild(title);
    const wrap = document.createElement('div');
    wrap.className = 'ks-wrap';
    for(let r=0; r<12; r++){
      const cell = document.createElement('div');
      cell.className = 'ks';
      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = rootNames[r];
      const staff = document.createElement('div');
      cell.appendChild(label);
      cell.appendChild(staff);
      wrap.appendChild(cell);
      const ksArr = getKeySignature(id, r);
      drawKeySignature(staff, ksArr, 'treble');
    }
    row.appendChild(wrap);
    container.appendChild(row);
  });
});
