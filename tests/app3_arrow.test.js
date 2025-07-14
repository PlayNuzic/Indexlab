/** @jest-environment jsdom */

describe('diagonal input arrow behavior', () => {
  function attachListeners(inp) {
    inp.addEventListener('keydown', e => {
      if(['ArrowUp','ArrowDown','Tab','Shift','Control','Alt'].includes(e.key)) return;
      e.preventDefault();
    });
    inp.addEventListener('beforeinput', e => {
      if(e.inputType === 'insertReplacementText') return;
      e.preventDefault();
    });
  }

  test('arrow increment event not prevented', () => {
    const inp = document.createElement('input');
    inp.type = 'number';
    attachListeners(inp);
    const ev = new InputEvent('beforeinput', {bubbles:true, cancelable:true, inputType:'insertReplacementText'});
    const result = inp.dispatchEvent(ev);
    expect(result).toBe(true);
    expect(ev.defaultPrevented).toBe(false);
  });

  test('typing is blocked by beforeinput', () => {
    const inp = document.createElement('input');
    inp.type = 'number';
    attachListeners(inp);
    const ev = new InputEvent('beforeinput', {bubbles:true, cancelable:true, inputType:'insertText', data:'5'});
    const result = inp.dispatchEvent(ev);
    expect(result).toBe(false);
    expect(ev.defaultPrevented).toBe(true);
  });
});
