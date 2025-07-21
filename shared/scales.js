export const motherScalesData = {
  CROM:{name:'Cromática',ee:Array(12).fill(1),rotNames:['Único']},
  DIAT:{name:'Diatónica',ee:[2,2,1,2,2,2,1],rotNames:['Mayor','Dórica','Frigia','Lidia','Mixolidia','Eolia','Locria']},
  ACUS:{name:'Acústica',ee:[2,2,2,1,2,1,2],rotNames:['Acústica','Mixol b6','Semidim','Alterada','Menor Mel.','Dórica b2','Lidia Aum']},
  ARMm:{name:'Armónica Menor',ee:[2,1,2,2,1,3,1],rotNames:['Arm Menor','Locria Nat','Mayor Aum','Lidia Dim','Frigia Dom','Aeo Arm','Ultralocr']},
  ARMM:{name:'Armónica Mayor',ee:[2,2,1,2,1,3,1],rotNames:['Arm Mayor','Dórica b5','Frigia b4','Lidia b3','Mixo b9','Lidia #2','Locria bb7']},
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
    ['sib','mib','lab','reb','solb'],
    ['fa#','do#'],
    ['sib','mib','lab'],
    ['fa#','do#','sol#','re#'],
    ['sib'],
    ['fa#','do#','sol#','re#','la#','mi#'],
    ['fa#'],
    ['sib','mib','lab','reb'],
    ['fa#','do#','sol#'],
    ['sib','mib'],
    ['fa#','do#','sol#','re#','la#']
  ],
  ACUS: [
    ['fa#','sib'],
    ['sib','mib','lab','reb','sol' + BECUADRO,'dob'],
    ['fa#','do' + BECUADRO,'sol#'],
    ['sib','mib','la' + BECUADRO,'reb'],
    ['fa#','do#','sol#','re' + BECUADRO,'la#'],
    ['si' + BECUADRO,'mib'],
    ['sib','mib','lab','reb','solb','do' + BECUADRO,'lab'],
    ['fa' + BECUADRO,'do#'],
    ['sib','mib','lab','re' + BECUADRO,'solb'],
    ['fa#','do#','sol' + BECUADRO,'re#'],
    ['sib','mi' + BECUADRO,'lab'],
    ['fa#','do#','sol#','re#','la' + BECUADRO,'do#']
  ],
  ARMm: [
    ['si'+BECUADRO,'mib','lab'],
    ['fa#','do#','sol#','re#','la'+BECUADRO,'mi'+BECUADRO,'si#'],
    ['fa'+BECUADRO,'do#','sib'],
    ['sib','mib','lab','re'+BECUADRO,'solb','dob'],
    ['fa#','do'+BECUADRO,'sol'+BECUADRO,'re#'],
    ['sib','mi'+BECUADRO,'lab','reb'],
    ['fa#','do#','sol#','re'+BECUADRO,'la'+BECUADRO,'mi#'],
    ['fa#','sib','mib'],
    ['sib','mib','lab','reb','sol'+BECUADRO,'dob','fab'],
    ['fa'+BECUADRO,'do'+BECUADRO,'sol#'],
    ['sib','mib','la'+BECUADRO,'reb','solb'],
    ['fa#','do#','sol'+BECUADRO,'re'+BECUADRO,'la#']
  ],
  ARMM: [
    ['lab'],
    ['fa#','do#','sol#','re#','la'+BECUADRO,'mi#'],
    ['fa#','do#','sib'],
    ['sib','mib','lab','re'+BECUADRO,'sol'+BECUADRO,'dob'],
    ['fa#','do'+BECUADRO,'sol#','re#'],
    ['sib','mi'+BECUADRO,'la'+BECUADRO,'reb'],
    ['fa#','do#','sol#','re'+BECUADRO,'la#','mi#'],
    ['fa#','sib'],
    ['sib','mib','lab','reb','sol'+BECUADRO,'do'+BECUADRO,'fab'],
    ['fa'+BECUADRO,'do#','sol#'],
    ['sib','mib','la'+BECUADRO,'re'+BECUADRO,'solb'],
    ['fa#','do#','sol'+BECUADRO,'re#','la#']
  ]
};

export function getKeySignature(scaleId, root){
  const table = scaleKeySignatures[scaleId];
  if(!table) return [];
  const idx = ((root % 12) + 12) % 12;
  return table[idx] || [];
}
