/** @jest-environment jsdom */
const { exportPresets, importPresets, saveLocal, loadLocal, createSaveButton, onLongPress, createHoldSaveButton, isHoldSave } = require('../shared/presets');

describe('preset utilities', () => {
  test('exportPresets triggers file download', async () => {
    const anchor = document.createElement('a');
    anchor.click = jest.fn();
    Object.defineProperty(anchor, 'download', { writable: true, value: '' });
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(anchor);
    const createObjectURL = jest.fn(() => 'blob:url');
    const revokeObjectURL = jest.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    const presetData = { a: 1, scale:{id:'DIAT', rot:3, root:7} };
    exportPresets(presetData, 'my.json');

    expect(createObjectURL).toHaveBeenCalled();
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob instanceof Blob).toBe(true);
    expect(anchor.download).toBe('my.json');
    expect(anchor.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  test('exportPresets handles missing appendChild gracefully', () => {
    const anchor = { click: jest.fn(), remove: jest.fn() };
    Object.defineProperty(anchor, 'download', { writable: true, value: '' });
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(anchor);
    const originalAppend = document.body.appendChild;
    document.body.appendChild = undefined;
    const createObjectURL = jest.fn(() => 'blob:url');
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = jest.fn();

    expect(() => exportPresets({ a: 1 }, 'test.json')).not.toThrow();
    expect(anchor.click).toHaveBeenCalled();

    document.body.appendChild = originalAppend;
    createElementSpy.mockRestore();
  });

  test('importPresets reads selected file and calls callback', () => {
    const input = document.createElement('input');
    const data = { foo: 'bar', scale:{id:'DIAT',rot:1,root:4} };
    const callback = jest.fn();

    class MockFileReader {
      constructor() {
        this.onload = null;
      }
      readAsText() {
        if (this.onload) this.onload({ target: { result: JSON.stringify(data) } });
      }
    }
    global.FileReader = MockFileReader;

    importPresets(input, callback);

    const file = new Blob([JSON.stringify(data)], { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));

    expect(callback).toHaveBeenCalledWith(data);
    expect(input.value).toBe('');

    callback.mockClear();
    input.dispatchEvent(new Event('change'));
    expect(callback).not.toHaveBeenCalled();
  });

  test('importPresets skips listener if API missing', () => {
    const input = { click: jest.fn() };
    expect(() => importPresets(input, jest.fn())).not.toThrow();
    expect(input.click).toHaveBeenCalled();
  });

  test('saveLocal and loadLocal round trip', () => {
    saveLocal('foo', { bar: 1 });
    expect(JSON.parse(localStorage.getItem('foo'))).toEqual({ bar: 1 });
    expect(loadLocal('foo')).toEqual({ bar: 1 });
  });

  test('createSaveButton triggers callback', () => {
    jest.useFakeTimers();
    const cb = jest.fn();
    const btn = createSaveButton(cb, 'save');
    document.body.appendChild(btn);
    btn.dispatchEvent(new Event('mousedown'));
    expect(cb).toHaveBeenCalled();
    expect(btn.classList.contains('active')).toBe(true);
    jest.runAllTimers();
    expect(btn.classList.contains('active')).toBe(false);
    btn.remove();
    jest.useRealTimers();
  });

  test('onLongPress calls callback after duration', () => {
    jest.useFakeTimers();
    const btn = document.createElement('button');
    let called = 0;
    onLongPress(btn, () => { called++; }, 1000);
    document.body.appendChild(btn);
    btn.dispatchEvent(new Event('mousedown'));
    jest.advanceTimersByTime(999);
    expect(called).toBe(0);
    jest.advanceTimersByTime(1);
    expect(called).toBe(1);
    btn.dispatchEvent(new Event('mouseup'));
    btn.remove();
    jest.useRealTimers();
  });

  test('hold button enables saving on slot activation', () => {
    const holdBtn = createHoldSaveButton('hold');
    document.body.appendChild(holdBtn);
    const slotBtn = document.createElement('button');
    let saved = false;
    slotBtn.onclick = () => { if(isHoldSave()) saved = true; };
    document.body.appendChild(slotBtn);
    holdBtn.dispatchEvent(new Event('mousedown'));
    slotBtn.click();
    expect(saved).toBe(true);
    document.dispatchEvent(new Event('mouseup'));
    expect(isHoldSave()).toBe(false);
    holdBtn.remove();
    slotBtn.remove();
  });

  test('hold button persists until originating touch ends', () => {
    const btn = createHoldSaveButton('hold');
    document.body.appendChild(btn);
    const startEvent = new Event('touchstart');
    startEvent.changedTouches = [{ identifier: 1 }];
    btn.dispatchEvent(startEvent);
    expect(isHoldSave()).toBe(true);
    const unrelatedEnd = new Event('touchend');
    unrelatedEnd.changedTouches = [{ identifier: 2 }];
    document.dispatchEvent(unrelatedEnd);
    expect(isHoldSave()).toBe(true);
    const relatedEnd = new Event('touchend');
    relatedEnd.changedTouches = [{ identifier: 1 }];
    document.dispatchEvent(relatedEnd);
    expect(isHoldSave()).toBe(false);
    btn.remove();
  });
});
