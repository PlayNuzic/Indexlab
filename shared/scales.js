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

export const intervalCategory = {
  resonant: { color: 'hsla(120,70%,50%,0.5)', label: 'Resonante' },
  consonant: { color: 'hsla(210,70%,50%,0.5)', label: 'Consonante' },
  dissonant: { color: 'hsla(0,70%,50%,0.5)', label: 'Disonante' },
  neutral:  { color: 'hsla(45,90%,50%,0.5)', label: 'Neutro' }
};

export const intervalColorBySemitone = {
  0: intervalCategory.resonant.color,
  1: intervalCategory.dissonant.color,
  2: 'hsla(15,70%,50%,0.5)',
  3: 'hsla(190,70%,50%,0.5)',
  4: intervalCategory.consonant.color,
  5: 'hsla(150,70%,50%,0.5)',
  6: intervalCategory.neutral.color,
  7: 'hsla(150,70%,50%,0.5)',
  8: intervalCategory.consonant.color,
  9: 'hsla(190,70%,50%,0.5)',
 10: 'hsla(15,70%,50%,0.5)',
 11: intervalCategory.dissonant.color,
};

export const intervalTypeBySemitone = {
  0:'resonant', 1:'dissonant', 2:'dissonant',
  3:'consonant',4:'consonant',
  5:'resonant',6:'neutral',
  7:'resonant',8:'consonant',9:'consonant',
 10:'dissonant',11:'dissonant'
};

export function intervalCategoryFor(interval, len=12){
  interval = ((interval % len) + len) % len;
  if(len === 12) return intervalTypeBySemitone[interval];
  if(interval === 0) return 'resonant';
  if(len % 2 === 0 && interval === len/2) return 'neutral';
  if(interval === 1 || interval === len-1) return 'dissonant';
  if(interval === 2 || interval === len-2) return 'consonant';
  return 'resonant';
}

export function intervalColor(interval, len=12){
  interval = ((interval % len) + len) % len;
  if(len === 12){
    return intervalColorBySemitone[interval];
  }
  const cat = intervalCategoryFor(interval, len);
  const base = intervalCategory[cat].color;
  const m = base.match(/hsla\((\d+),(\d+)%,(\d+)%,?(\d+(?:\.\d+)?)?\)/);
  if(!m) return base;
  const hue = Number(m[1]);
  const sat = Number(m[2]);
  const light = Number(m[3]);
  const alpha = m[4] || 1;
  const candidates = [];
  for(let i=0;i<len;i++) if(intervalCategoryFor(i,len)===cat) candidates.push(i);
  const idx = candidates.indexOf(interval);
  const step = 8;
  const newL = Math.max(20, Math.min(80, light + step*(idx - (candidates.length-1)/2)));
  return `hsla(${hue},${sat}%,${newL}%,${alpha})`;
}

