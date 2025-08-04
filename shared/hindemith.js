import { eAToNotes } from './cards.js';

export const stabilityRank = {7:1,5:2,4:3,8:4,3:5,9:6,2:7,10:8,1:9,11:10,6:11};
export const intervalRoot = {
  7: 'lower',
  5: 'upper',
  4: 'lower',
  8: 'upper',
  3: 'lower',
  9: 'upper',
  2: 'lower',
 10: 'upper',
  1: 'upper',
 11: 'lower',
  6: 'none'
};

export function findChordRoot(chord, type = 'notes'){
  let notes = [];
  if(type === 'intervals'){
    notes = eAToNotes(chord);
  }else{
    notes = chord.slice();
  }
  notes = [...new Set(notes.map(n => ((n % 12) + 12) % 12))].sort((a,b)=>a-b);
  if(!notes.length) return null;
  // If chord contains root, major third and major seventh, root is the lower note
  for(const n of notes){
    const third = (n + 4) % 12;
    const seventh = (n + 11) % 12;
    if(notes.includes(third) && notes.includes(seventh)){
      return n;
    }
  }
  let bestRank = Infinity;
  let chordRoot = null;
  let bestLowerIndex = null;
  for(let i=0;i<notes.length;i++){
    for(let j=i+1;j<notes.length;j++){
      const interval = (notes[j]-notes[i]+12)%12;
      if(interval === 0) continue;
      const rank = stabilityRank[interval] ?? Infinity;
      if(rank < bestRank){
        bestRank = rank;
        bestLowerIndex = i;
        const pos = intervalRoot[interval];
        chordRoot = pos==='lower'?notes[i]:pos==='upper'?notes[j]:null;
      }else if(rank === bestRank){
        if(bestLowerIndex===null || i < bestLowerIndex){
          bestLowerIndex = i;
          const pos = intervalRoot[interval];
          chordRoot = pos==='lower'?notes[i]:pos==='upper'?notes[j]:null;
        }
      }
    }
  }
  // Additional pattern analysis for special root resolution
  const formsAny = (base, targets) => notes.some(n => n !== base && targets.includes((n - base + 12) % 12));

  let candidate = null;

  // Pattern 1: lowest note (without interval 7) forming 3/4 with upper note that also forms 10/11 or 1/2 with another note
  for (let i = 0; i < notes.length && candidate === null; i++) {
    const low = notes[i];
    if (formsAny(low, [7])) continue;
    for (let j = i + 1; j < notes.length && candidate === null; j++) {
      const high = notes[j];
      const interval = (high - low + 12) % 12;
      if (interval === 3 || interval === 4) {
        if (notes.some(n => n !== low && n !== high && [10,11,1,2].includes((n - high + 12) % 12))) {
          candidate = low;
        }
      }
    }
  }

  // Pattern 2: highest note (without interval 5) forming 8/9 with lower note that also forms 10/11 or 1/2 with another note
  if (candidate === null) {
    for (let j = notes.length - 1; j >= 0 && candidate === null; j--) {
      const high = notes[j];
      if (formsAny(high, [5])) continue;
      for (let i = j - 1; i >= 0 && candidate === null; i--) {
        const low = notes[i];
        const interval = (high - low + 12) % 12;
        if (interval === 8 || interval === 9) {
          if (notes.some(n => n !== low && n !== high && [10,11,1,2].includes((n - low + 12) % 12))) {
            candidate = low;
          }
        }
      }
    }
  }

  if (candidate !== null) {
    const lowerSeven = notes.some(n => n < candidate && notes.some(m => ((m - n + 12) % 12) === 7));
    if (!lowerSeven) {
      chordRoot = candidate;
    }
  }

  return chordRoot;
}
