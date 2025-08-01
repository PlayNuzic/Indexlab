const fs = require('fs');
const path = require('path');

function loadScaleModule(){
  const code = fs.readFileSync(path.join(__dirname, '../shared/scales.js'), 'utf8');
  const transformed = code
    .replace(/export const/g, 'const')
    .replace(/export function/g, 'function') +
    '\nmodule.exports = { getKeySignature, scaleKeySignatures, BECUADRO };';
  const mod = { exports: {} };
  const fn = new Function('module','exports', transformed);
  fn(mod, mod.exports);
  return mod.exports;
}

describe('getKeySignature', () => {
  const { getKeySignature, BECUADRO } = loadScaleModule();

  test('E major has four sharps', () => {
    expect(getKeySignature('DIAT',4)).toEqual(['F#','C#','G#','D#']);
  });

  test('C major has no accidentals', () => {
    expect(getKeySignature('DIAT',0)).toEqual([]);
  });

  test('ACUS root 9 uses natural', () => {
    expect(getKeySignature('ACUS',9)).toEqual(['F#','C#','G'+BECUADRO,'D#']);
  });
  test('ARMme root 0', () => {
    expect(getKeySignature('ARMme',0)).toEqual(['B'+BECUADRO,'Eb','Ab']);
  });

  test('ARMma root 1', () => {
    expect(getKeySignature('ARMma',1)).toEqual(['F#','C#','G#','D#','A'+BECUADRO,'E#','B#']);
  });
});
