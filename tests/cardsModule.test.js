/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

function loadCardsModule(){
  let code = fs.readFileSync(path.join(__dirname, '../libs/cards/index.js'), 'utf8');
  const shared = fs.readFileSync(path.join(__dirname, '../shared/cards.js'), 'utf8')
    .replace(/export function/g,'function')
    .replace(/export const/g,'const');
  code = code.replace(/import[^;]+from '\.\.\/\.\.\/shared\/cards.js';/, shared);
  code = code.replace(/import\s+\{[^}]*pitchColor[^}]*\}\s+from '\.\.\/vendor\/chromatone-theory\/index.js';/, 'const noteColor = n => `hsl(${(n%12)*30},100%,50%)`;');
  code = code.replace(/export function/g,'function');
  code += '\nmodule.exports = { init };';
  const mod = { exports:{} };
  const fn = new Function('module','exports', code);
  fn(mod, mod.exports);
  return mod.exports.init;
}

function loadSharedCards(){
  const code = fs.readFileSync(path.join(__dirname, '../shared/cards.js'), 'utf8');
  const transformed = code.replace(/export function/g,'function').replace(/export const/g,'const') +
    '\nmodule.exports = { generateRotationVoicings, generatePermutationVoicings };';
  const mod = { exports:{} };
  new Function('module','exports', transformed)(mod, mod.exports);
  return mod.exports;
}

test('init creates cards and rotates', () => {
  document.body.innerHTML = '<div id="wrap"></div>';
  const init = loadCardsModule();
  const api = init(document.getElementById('wrap'), { notes:[0,1,2], scaleLen:7 });
  const cards = document.querySelectorAll('.component-card');
  expect(cards.length).toBe(3);
  api.rotateLeft();
  const first = document.querySelector('.component-card .note').textContent;
  expect(first).toBe('1');
});

describe('voicing helpers', () => {
  const { generateRotationVoicings, generatePermutationVoicings } = loadSharedCards();

  test('triad rotations', () => {
    const rot = generateRotationVoicings([4,3], { voices:3 });
    expect(rot.length).toBe(3);
    expect(rot[0].bassComponent).toBe('a');
    expect(rot[0].voicings[0]).toEqual([4,3]);
  });

  test('triad permutation patterns', () => {
    const per = generatePermutationVoicings([4,3], { voices:3 });
    expect(per.length).toBe(2);
    expect(per[0].pattern).toBe('a b c');
    expect(per[0].voicings[0]).toEqual([4,3]);
  });

  test('major seventh rotation count', () => {
    const rot = generateRotationVoicings([4,3,4], { voices:4 });
    expect(rot.length).toBe(4);
  });
});
