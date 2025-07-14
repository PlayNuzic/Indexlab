/** @jest-environment jsdom */
const { exportPresets, importPresets, saveLocal, loadLocal, createSaveButton, createHoldSaveButton, isHoldSave } = require('../shared/presets');

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

  test('createHoldSaveButton toggles hold flag', () => {
    const btn = createHoldSaveButton('hold');
    document.body.appendChild(btn);
    expect(isHoldSave()).toBe(false);
    btn.dispatchEvent(new Event('mousedown'));
    expect(isHoldSave()).toBe(true);
    document.dispatchEvent(new Event('mouseup'));
    expect(isHoldSave()).toBe(false);
    btn.remove();
  });
});
