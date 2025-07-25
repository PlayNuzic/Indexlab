export const motherScalesData = {
  CROM:{name:'Cromática',ee:Array(12).fill(1),rotNames:['Único']},
  DIAT:{name:'Diatónica',ee:[2,2,1,2,2,2,1],rotNames:['Mayor','Dórica','Frigia','Lidia','Mixolidia','Eolia','Locria']},
  ACUS:{name:'Acústica',ee:[2,2,2,1,2,1,2],rotNames:['Acústica','Mixol b6','Semidim','Alterada','Menor Mel.','Dórica b2','Lidia Aum']},
  ARMme:{name:'Armónica Menor',ee:[2,1,2,2,1,3,1],rotNames:['Arm Menor','Locria Nat','Mayor Aum','Lidia Dim','Frigia Dom','Aeo Arm','Ultralocr']},
  ARMma:{name:'Armónica Mayor',ee:[2,2,1,2,1,3,1],rotNames:['Arm Mayor','Dórica b5','Frigia b4','Lidia b3','Mixo b9','Lidia #2','Locria bb7']},
  OCT:{name:'Octatónica',ee:[1,2,1,2,1,2,1,2],rotNames:['Modo 1','Modo 2']},
  HEX:{name:'Hexatónica',ee:[1,3,1,3,1,3],rotNames:['Aumentada','Inversa']},
  TON:{name:'Tonos',ee:[2,2,2,2,2,2],rotNames:['Único']}
};

export const SHARP = '#';
export const FLAT = 'b';
export const DOUBLE_SHARP = '\uD834\uDD2A';
export const DOUBLE_FLAT = '\uD834\uDD2B';
export const BECUADRO = '\u266E';
export const NATURAL = BECUADRO;

export function scaleSemis(id){
  if(!scaleSemis.cache) scaleSemis.cache = new Map();
  if(scaleSemis.cache.has(id)) return scaleSemis.cache.get(id);
  let acc = 0, arr = [0];
  motherScalesData[id].ee.forEach(v => { acc += v; arr.push(acc % 12); });
  arr.pop();
  scaleSemis.cache.set(id, arr);
  return arr;
}

export const scaleKeySignatures = {
  DIAT: [
    [],
    ['Bb','Eb','Ab','Db','Gb'],
    ['F#','C#'],
    ['Bb','Eb','Ab'],
    ['F#','C#','G#','D#'],
    ['Bb'],
    ['F#','C#','G#','D#','A#','E#'],
    ['F#'],
    ['Bb','Eb','Ab','Db'],
    ['F#','C#','G#'],
    ['Bb','Eb'],
    ['F#','C#','G#','D#','A#']
  ],
  ACUS: [
    ['F#','Bb'],
    ['Bb','Eb','Ab','Db','G' + BECUADRO,'Cb'],
    ['F#','C' + BECUADRO,'G#'],
    ['Bb','Eb','A' + BECUADRO,'Db'],
    ['F#','C#','G#','D' + BECUADRO,'A#'],
    ['B' + BECUADRO,'Eb'],
    ['Bb','Eb','Ab','Db','Gb','C' + BECUADRO,'Fb'],
    ['F' + BECUADRO,'C#'],
    ['Bb','Eb','Ab','D' + BECUADRO,'Gb'],
    ['F#','C#','G' + BECUADRO,'D#'],
    ['Bb','E' + BECUADRO,'Ab'],
    ['F#','C#','G#','D#','A' + BECUADRO,'E#']
  ],
  ARMme: [
    ['B'+BECUADRO,'Eb','Ab'],
    ['F#','C#','G#','D#','A'+BECUADRO,'E'+BECUADRO,'B#'],
    ['F'+BECUADRO,'C#','Bb'],
    ['Bb','Eb','Ab','D'+BECUADRO,'Gb','Cb'],
    ['F#','C'+BECUADRO,'G'+BECUADRO,'D#'],
    ['Bb','E'+BECUADRO,'Ab','Db'],
    ['F#','C#','G#','D'+BECUADRO,'A'+BECUADRO,'E#'],
    ['F#','Bb','Eb'],
    ['Bb','Eb','Ab','Db','G'+BECUADRO,'Cb','Fb'],
    ['F'+BECUADRO,'C'+BECUADRO,'G#'],
    ['Bb','Eb','A'+BECUADRO,'Db','Gb'],
    ['F#','C#','G'+BECUADRO,'D'+BECUADRO,'A#']
  ],
  ARMma: [
    ['B'+BECUADRO,'E'+BECUADRO,'Ab'],
    ['F#','C#','G#','D#','A'+BECUADRO,'E#'],
    ['F#','C#','Bb'],
    ['Bb','Eb','Ab','D'+BECUADRO,'G'+BECUADRO,'Cb'],
    ['F#','C'+BECUADRO,'G#','D#'],
    ['Bb','E'+BECUADRO,'A'+BECUADRO,'Db'],
    ['F#','C#','G#','D'+BECUADRO,'A#','E#'],
    ['F#','B'+BECUADRO,'Eb'],
    ['Bb','Eb','Ab','Db','G'+BECUADRO,'C'+BECUADRO,'Fb'],
    ['F'+BECUADRO,'C#','G#'],
    ['Bb','Eb','A'+BECUADRO,'D'+BECUADRO,'Gb'],
    ['F#','C#','G'+BECUADRO,'D#','A#']
  ]
};

export function getKeySignature(scaleId, root){
  const table = scaleKeySignatures[scaleId];
  if(!table) return [];
  const idx = ((root % 12) + 12) % 12;
  return table[idx] || [];
}
