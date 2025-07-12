/** @jest-environment jsdom */
const { exportPresets, importPresets } = require('../shared/presets');

describe('preset utilities', () => {
  test('exportPresets triggers file download', () => {
    const anchor = document.createElement('a');
    anchor.click = jest.fn();
    Object.defineProperty(anchor, 'download', { writable: true, value: '' });
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(anchor);
    const createObjectURL = jest.fn(() => 'blob:url');
    const revokeObjectURL = jest.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    exportPresets({ a: 1 }, 'my.json');

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
    const data = { foo: 'bar' };
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
});
