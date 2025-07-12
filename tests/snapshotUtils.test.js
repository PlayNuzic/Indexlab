const { initSnapshots, saveSnapshot, loadSnapshot, resetSnapshots } = require('../apps/app3/scripts/snapshotUtils');

describe('snapshot utilities', () => {
  const defaultScale = { id: 'CROM', rot: 0, root: 0 };

  test('save/load preserves baseMidi and scale', () => {
    let snaps = initSnapshots(null);
    const notes = [0,3,7];
    const baseMidi = 48;
    saveSnapshot(snaps, 0, notes, baseMidi, defaultScale);
    const data = loadSnapshot(snaps, 0);
    expect(data).toEqual({ notes, baseMidi, scale: defaultScale });
  });

  test('initSnapshots upgrades old format', () => {
    const raw = Array(10).fill(null);
    raw[1] = [1,2,3];
    const snaps = initSnapshots(raw);
    expect(snaps[1]).toEqual({ notes: [1,2,3], baseMidi: 60, scale: defaultScale });
  });

  test('resetSnapshots returns empty array', () => {
    const snaps = resetSnapshots();
    expect(Array.isArray(snaps)).toBe(true);
    expect(snaps.length).toBe(10);
    expect(snaps.every(x => x === null)).toBe(true);
  });
});
