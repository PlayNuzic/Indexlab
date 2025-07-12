const { rowToMidi } = require('../../../shared/midi.js');

test('rowToMidi creates a valid MIDI header and track', () => {
  const data = rowToMidi([60, 62, 64], 120);
  // "MThd" header
  expect(Array.from(data.slice(0,4))).toEqual([0x4d,0x54,0x68,0x64]);
  // "MTrk" marker at position 14
  expect(Array.from(data.slice(14,18))).toEqual([0x4d,0x54,0x72,0x6b]);
  expect(data instanceof Uint8Array).toBe(true);
});
