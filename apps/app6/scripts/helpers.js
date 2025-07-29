(function(global){
  const parseNums = txt => txt.trim().split(/\s+/)
    .map(n => parseInt(n.replace(/[^0-9-]/g, ''), 10))
    .filter(n => !isNaN(n));

  const eAToNotes = (intervals, len=12) => {
    const notes = [0];
    intervals.forEach(i => notes.push(((notes.at(-1) + i) % len + len) % len));
    return notes;
  };

  const notesToEA = (notes, len=12) =>
    notes.slice(1).map((n, i) => ((n - notes[i] + len) % len)).join(' ');

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

  const absoluteWithShifts = (notes, base, shifts=[]) => {
    const abs = toAbsolute(notes, base);
    return abs.map((m,i)=>m + 12*(shifts[i] || 0));
  };

  const buildMatrix = (notes, len=12) => {
    const N = notes.length;
    const m = Array.from({ length: N }, () => Array(N).fill(''));
    notes.forEach((note, idx) => {
      const r = N - 1 - idx;
      const c = idx;
      m[r][c] = note;
    });
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const asc = (notes[j] - notes[i] + len) % len;
        const desc = (len - asc) % len;
        m[N - 1 - j][i] = asc;
        m[N - 1 - i][j] = desc;
      }
    }
    return m;
  };

  const Helpers = { parseNums, eAToNotes, notesToEA, notesToAc, toAbsolute, absoluteWithShifts, buildMatrix };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Helpers;
  } else {
    global.Helpers = Helpers;
  }
})(typeof window !== 'undefined' ? window : global);
