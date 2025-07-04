(function(global){
  const parseNums = txt => txt.trim().split(/\s+/)
    .map(n => parseInt(n.replace(/[^0-9-]/g, ''), 10))
    .filter(n => !isNaN(n));

  const eAToNotes = intervals => {
    const notes = [0];
    intervals.forEach(i => notes.push((notes.at(-1) + i) % 12));
    return notes;
  };

  const notesToEA = notes =>
    notes.slice(1).map((n, i) => ((n - notes[i] + 12) % 12)).join(' ');

  const notesToAc = notes => notes.join(' ');

  const toAbsolute = (notes, base) => {
    const result = [base + notes[0]];
    for (let i = 1; i < notes.length; i++) {
      let next = base + notes[i];
      while (next <= result[i - 1]) next += 12;
      result.push(next);
    }
    return result;
  };

  const buildMatrix = notes => {
    const N = notes.length;
    const m = Array.from({ length: N }, () => Array(N).fill(''));
    notes.forEach((note, idx) => {
      const r = N - 1 - idx;
      const c = idx;
      m[r][c] = note;
    });
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const asc = (notes[j] - notes[i] + 12) % 12;
        const desc = (12 - asc) % 12;
        m[N - 1 - j][i] = asc;
        m[N - 1 - i][j] = desc;
      }
    }
    return m;
  };

  const Helpers = { parseNums, eAToNotes, notesToEA, notesToAc, toAbsolute, buildMatrix };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Helpers;
  } else {
    global.Helpers = Helpers;
  }
})(typeof window !== 'undefined' ? window : global);
