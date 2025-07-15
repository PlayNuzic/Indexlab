const fs = require('fs');
const path = require('path');

function loadSharedUtils(){
  const libCode = fs.readFileSync(path.join(__dirname, '../../../libs/utils/index.js'), 'utf8');
  const libTrans = libCode.replace(/export function/g,'function') + '\nmodule.exports = { randInt, clamp, wrapSym };';
  const libMod = { exports: {} };
  new Function('module','exports', libTrans)(libMod, libMod.exports);
  const { randInt, clamp, wrapSym } = libMod.exports;

  const scaleCode = fs.readFileSync(path.join(__dirname, '../../../shared/scales.js'), 'utf8');
  const scaleTrans = scaleCode.replace(/export const/g,'const').replace(/export function/g,'function') + '\nmodule.exports = { scaleSemis };';
  const scaleMod = { exports: {} };
  new Function('module','exports', scaleTrans)(scaleMod, scaleMod.exports);
  const { scaleSemis } = scaleMod.exports;

  const utilCode = fs.readFileSync(path.join(__dirname, '../../../shared/utils.js'), 'utf8');
  const transformed = utilCode
    .replace(/import[^\n]+libs\/utils[^\n]+\n/, '')
    .replace(/import[^\n]+\.\/scales.js[^\n]*\n/, '')
    .replace(/export \{[^}]+\};\n/, '')
    .replace(/export function/g,'function') +
    '\nmodule.exports = { randInt, clamp, wrapSym, absToDegInfo, applyGlobalParams };';
  const utilMod = { exports: {} };
  new Function('randInt','clamp','wrapSym','scaleSemis','module','exports', transformed)(randInt, clamp, wrapSym, scaleSemis, utilMod, utilMod.exports);
  return { randInt, clamp, wrapSym, scaleSemis, absToDegInfo: utilMod.exports.absToDegInfo, applyGlobalParams: utilMod.exports.applyGlobalParams };
}

const { randInt, clamp, wrapSym, scaleSemis, absToDegInfo, applyGlobalParams } = loadSharedUtils();

const motherScalesData = {
  CROM:{name:'Cromática',ee:Array(12).fill(1),rotNames:['Único']},
  DIAT:{name:'Diatónica',ee:[2,2,1,2,2,2,1],rotNames:['Mayor','Dórica','Frigia','Lidia','Mixolidia','Eolia','Locria']},
  ACUS:{name:'Acústica',ee:[2,2,2,1,2,1,2],rotNames:['Acústica','Mixol b6','Semidim','Alterada','Menor Mel.','Dórica b2','Lidia Aum']},
  ARMm:{name:'Armónica Menor',ee:[2,1,2,2,1,3,1],rotNames:['Arm Menor','Locria Nat','Mayor Aum','Lidia Dim','Frigia Dom','Aeo Arm','Ultralocr']},
  ARMM:{name:'Armónica Mayor',ee:[2,2,1,2,1,3,1],rotNames:['Arm Mayor','Dórica b5','Frigia b4','Lidia b3','Mixo b9','Lidia #2','Locria bb7']},
  OCT:{name:'Octatónica',ee:[1,2,1,2,1,2,1,2],rotNames:['Modo 1','Modo 2']},
  HEX:{name:'Hexatónica',ee:[1,3,1,3,1,3],rotNames:['Aumentada','Inversa']},
  TON:{name:'Tonos',ee:[2,2,2,2,2,2],rotNames:['Único']}
};

function scaleSemisLocal(id){
  if(!scaleSemisLocal.cache) scaleSemisLocal.cache = new Map();
  if(scaleSemisLocal.cache.has(id)) return scaleSemisLocal.cache.get(id);
  let acc = 0, arr = [0];
  motherScalesData[id].ee.forEach(v => { acc += v; arr.push(acc % 12); });
  arr.pop();
  scaleSemisLocal.cache.set(id, arr);
  return arr;
}

const COLS = 8;

function genNaRow(){
  return Array.from({length: COLS}, () => randInt(0,96));
}

function genNmRow(state){
  return Array.from({length: COLS}, () => {
    const n = randInt(0,11);
    const d = Math.random()<state.octProb ? (Math.random()<0.5?12:-12) : 0;
    return clamp(4*12+n+d,0,96);
  });
}

function genScaleDegreeRow(state){
  const sems = scaleSemisLocal(state.scale.id);
  return Array.from({length: COLS}, () => {
    const deg = randInt(0,sems.length-1);
    const sem = (sems[(deg+state.scale.rot)%sems.length]+state.scale.root)%12;
    const d = Math.random()<state.octProb ? (Math.random()<0.5?12:-12) : 0;
    return clamp(4*12+sem+d,0,96);
  });
}

function genISmRow(state){
  let v = randInt(0,96);
  return Array.from({length: COLS}, (_,i) => {
    if(i===0) return v;
    let iv = randInt(-6,6);
    if(Math.random()<state.octProb) iv += (Math.random()<0.5?12:-12);
    v = clamp(v+iv,0,96);
    return v;
  });
}

function genIStepRow(state){
  const sems = scaleSemisLocal(state.scale.id);
  let idx = randInt(0,sems.length-1);
  let oct = 4;
  let sem = (sems[(idx+state.scale.rot)%sems.length]+state.scale.root)%12;
  let v = clamp(oct*12+sem,0,96);
  return Array.from({length: COLS}, (_,i) => {
    if(i===0) return v;
    let diff = randInt(-Math.floor(sems.length/2), Math.floor(sems.length/2));
    if(Math.random()<state.octProb) diff += (Math.random()<0.5?-sems.length:sems.length);
    idx = ((idx + diff) % sems.length + sems.length) % sems.length;
    sem = (sems[(idx+state.scale.rot)%sems.length]+state.scale.root)%12;
    oct += Math.sign(diff);
    v = clamp(oct*12+sem,0,96);
    return v;
  });
}

module.exports = { genNaRow, genNmRow, genScaleDegreeRow, genISmRow, genIStepRow, applyGlobalParams, absToDegInfo, scaleSemis: scaleSemisLocal, randInt };
