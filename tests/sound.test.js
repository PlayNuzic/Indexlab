const fs = require('fs');
const path = require('path');

function loadSound(Tone) {
  const code = fs.readFileSync(path.join(__dirname, '../libs/sound/index.js'), 'utf8');
  const transformed = code
    .replace(/export async function/g, 'async function')
    .replace(/export function/g, 'function') +
    '\nmodule.exports = { init, playNote, playChord, playMelody, playRhythm, ensureAudio, getSynth: () => synth };';
  const mod = { exports: {} };
  const fn = new Function('module', 'exports', 'Tone', 'console', transformed);
  fn(mod, mod.exports, Tone, console);
  return mod.exports;
}

describe('sound module', () => {
  let ToneMock, samplerInstance, polyInstance;

  beforeEach(() => {
    samplerInstance = {
      toDestination: jest.fn().mockReturnThis(),
      triggerAttackRelease: jest.fn(),
      dispose: jest.fn()
    };
    polyInstance = {
      toDestination: jest.fn().mockReturnThis(),
      triggerAttackRelease: jest.fn(),
      dispose: jest.fn()
    };
    ToneMock = {
      Sampler: jest.fn(() => samplerInstance),
      PolySynth: jest.fn(() => polyInstance),
      Synth: {},
      Frequency: jest.fn(n => `F${n}`),
      loaded: jest.fn(() => Promise.resolve()),
      start: jest.fn(() => Promise.resolve()),
      now: jest.fn(() => 0)
    };
  });

  test('init loads piano sampler', async () => {
    const sound = loadSound(ToneMock);
    await sound.init('piano');
    expect(ToneMock.Sampler).toHaveBeenCalled();
    expect(ToneMock.loaded).toHaveBeenCalled();
    expect(sound.getSynth()).toBe(samplerInstance);
  });

  test('init uses PolySynth for other types', async () => {
    const sound = loadSound(ToneMock);
    await sound.init('saw');
    expect(ToneMock.PolySynth).toHaveBeenCalledWith(ToneMock.Synth);
    expect(sound.getSynth()).toBe(polyInstance);
  });

  test('playNote triggers synth', async () => {
    const sound = loadSound(ToneMock);
    await sound.init('saw');
    sound.playNote(60, 1);
    expect(ToneMock.Frequency).toHaveBeenCalledWith(60, 'midi');
    expect(polyInstance.triggerAttackRelease).toHaveBeenCalledWith('F60', 1);
  });

  test('playChord triggers all notes', async () => {
    const sound = loadSound(ToneMock);
    await sound.init('saw');
    sound.playChord([60, 64, 67], 2);
    expect(ToneMock.Frequency).toHaveBeenCalledTimes(3);
    expect(polyInstance.triggerAttackRelease).toHaveBeenCalledWith(['F60','F64','F67'], 2);
  });

  test('playMelody schedules sequential notes', async () => {
    jest.useFakeTimers();
    const sound = loadSound(ToneMock);
    await sound.init('saw');
    sound.playMelody([60, 62], 0.5, 0.1);
    jest.runAllTimers();
    expect(polyInstance.triggerAttackRelease).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  test('playRhythm triggers hits for permutation', async () => {
    const sound = loadSound(ToneMock);
    await sound.init('saw');
    sound.playRhythm([2,1], 120);
    expect(polyInstance.triggerAttackRelease).toHaveBeenCalledTimes(2);
  });

  test('ensureAudio starts Tone only once', async () => {
    const sound = loadSound(ToneMock);
    const p1 = sound.ensureAudio();
    const p2 = sound.ensureAudio();
    await Promise.all([p1, p2]);
    expect(ToneMock.start).toHaveBeenCalledTimes(1);
    expect(p1).toBe(p2);
  });
});
