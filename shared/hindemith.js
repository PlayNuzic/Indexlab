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
  return chordRoot;
}
