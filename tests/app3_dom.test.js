/** @jest-environment jsdom */
const { buildMatrix, notesToEA, notesToAc } = require('../apps/app3/scripts/helpers');

describe('renderGrid diagonal input', () => {
  function setup() {
    const gridWrap = document.createElement('div');
    const seqInput = document.createElement('input');
    let mode = 'eA';
    let notes = [0, 3, 7];
    function notesChanged() {}
    function renderGrid() {
      const matrix = buildMatrix(notes);
      const size = notes.length;
      gridWrap.innerHTML = '';
      const table = document.createElement('table');
      for (let r = 0; r < size; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < size; c++) {
          const td = document.createElement('td');
          td.dataset.r = r;
          td.dataset.c = c;
          const isDiag = r + c === size - 1;
          const upper = r + c < size - 1;
          if (isDiag) {
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.value = matrix[r][c];
            inp.oninput = () => {
              notes[c] = ((parseInt(inp.value, 10) || 0) % 12 + 12) % 12;
              renderGrid();
              seqInput.value = mode === 'eA' ? notesToEA(notes) : notesToAc(notes);
              notesChanged();
            };
            td.appendChild(inp);
          } else {
            td.textContent = matrix[r][c];
            td.classList.add(upper ? 'upper' : 'lower');
          }
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }
      gridWrap.appendChild(table);
    }
    return { gridWrap, seqInput, renderGrid, notes, mode };
  }

  test('updating diagonal cell updates seqInput', () => {
    const { gridWrap, seqInput, renderGrid, notes, mode } = setup();
    seqInput.value = notesToEA(notes);
    renderGrid();

    const inp = gridWrap.querySelector('td input');
    inp.value = '11';
    inp.dispatchEvent(new Event('input', { bubbles: true }));

    const expected = mode === 'eA' ? notesToEA(notes) : notesToAc(notes);
    expect(seqInput.value).toBe(expected);
  });
});
