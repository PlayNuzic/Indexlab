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

export function scaleSemis(id){
  if(!scaleSemis.cache) scaleSemis.cache = new Map();
  if(scaleSemis.cache.has(id)) return scaleSemis.cache.get(id);
  let acc = 0, arr = [0];
  motherScalesData[id].ee.forEach(v => { acc += v; arr.push(acc % 12); });
  arr.pop();
  scaleSemis.cache.set(id, arr);
  return arr;
}
