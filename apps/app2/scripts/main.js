import { init as loadInstrument, playNote, playChord, ensureAudio } from '../../../libs/sound/index.js';
import EarTrainingGame from '../../../libs/ear-training/index.js';
import { randInt } from '../../../libs/utils/index.js';
import { drawInterval } from '../../../libs/notation/index.js';
import { getKeySignature } from '../../../shared/scales.js';

const game = new EarTrainingGame({ randInt });
const levelNames = {
  1: 'Intervals dissonants (iS 1 y 2)',
  2: 'Intervals consonants (iS 3 y 4)',
  3: 'Intervals resonants iS(5 y 7)',
  4: 'Intervals resonants i tritó iS(5, 6 y 7)',
  5: 'Intervals consonants (iS 8 y 9)',
  6: 'Intervals dissonants (iS 10 y 11)',
  7: 'Intervals dissonants (iS 1,2,10 y 11)',
  8: 'Intervals consonants (iS 3,4,8 y 9)',
  9: 'Mix dissonants i consonants: iS(1,2,3,4,8,9,10,11)',
  10: 'Tots els intervals: iS(1,2,3,4,5,6,7,8,9,10,11)'
};

let currentMode = 'iS';

function staffOpts(root){
  return { scaleId: 'CROM', root };
}

async function startGame(selected, level = 1){
  currentMode = selected;
  game.start(selected, level);
  document.getElementById('welcome').style.display='none';
  document.getElementById('summary').style.display='none';
  document.getElementById('game').style.display='block';
  initButtons();
  await loadInstrument(document.getElementById('instrument').value || 'piano');
  updateScore();
  nextQuestion();
}

document.querySelectorAll('#modeToggle button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    currentMode=btn.dataset.mode;
    document.querySelectorAll('#modeToggle button').forEach(b=>{
      b.classList.toggle('active', b===btn);
    });
  });
});
document.getElementById('playBtn').onclick=()=>playNotes();
document.getElementById('advanceLevel').onclick=()=>{
  if(game.level < 10){
    game.level++;
  }
  resetForNextLevel();
};

document.getElementById('repeatLevel').onclick=()=>{
  resetForNextLevel();
};
document.getElementById('instrument').onchange=async e=>{
  await loadInstrument(e.target.value);
};
document.getElementById('backBtn').onclick=()=>{
  document.getElementById('game').style.display='none';
  document.getElementById('welcome').style.display='block';
};
document.getElementById('backBtnSummary').onclick=()=>{
  document.getElementById('summary').style.display='none';
  document.getElementById('welcome').style.display='block';
};

document.querySelectorAll('#levelInfo button').forEach(btn=>{
  btn.addEventListener('click', async ()=>{
    await ensureAudio();
    const level=parseInt(btn.dataset.level,10);
    startGame(currentMode, level);
  });
});

function playNotes(){
  if(game.mode==='iS'){
    playNote(game.note1, 0.5);
    setTimeout(()=>{
      playNote(game.note2, 0.5);
    },800);
  }else{
    playChord([game.note1, game.note2], 0.5);
  }
}

function nextQuestion(){
  const q = game.next();
  playNotes();
  document.getElementById('question').textContent=`Pregunta ${q.question} · Nivell ${q.level} – ${levelNames[q.level]}`;
  document.getElementById('feedback').textContent='';
  document.getElementById('notation').innerHTML='';
  initButtons();
}

function submitAnswer(value){
  const res = game.answer(value);
  updateScore();
  if(res.correct){
    document.getElementById('feedback').textContent=`\u2714 Correcte! ${(game.note2%12)} - ${(game.note1%12)} = ${game.currentInterval} => ${game.mode}(${game.currentInterval})`;
    const notationEl = document.getElementById('notation');
    const root = game.note1 % 12;
    const ks = getKeySignature('CROM', root);
    drawInterval(notationEl, game.note1, game.note2, game.mode, ks, staffOpts(root));
    const proceed = () => {
      notationEl.removeEventListener('click', proceed);
      clearTimeout(timer);
      if(res.levelUp){
        showSummary();
      }else{
        nextQuestion();
      }
    };
    const timer = setTimeout(proceed, 2500);
    notationEl.addEventListener('click', proceed, { once:true });
  }else{
    if(res.retry){
      document.getElementById('feedback').textContent='\u274C Incorrecte. Torna-ho a provar!';
      setTimeout(()=>{playNotes();},1000);
    }else{
      document.getElementById('feedback').textContent=`\u274C Era ${game.mode}(${game.currentInterval})`;
      setTimeout(nextQuestion,1000);
    }
  }
}

function showSummary(){
  document.getElementById("game").style.display="none";
  const total = game.correctLevel + game.wrongLevel;
  const percent = total ? Math.round(game.correctLevel*100/total) : 0;
  document.getElementById("result").textContent=`Encerts en aquest nivell: ${game.correctLevel} · Errors: ${game.wrongLevel}`;
  document.getElementById("totals").textContent=`Totals sessió · Enc.: ${game.correctTotal} · Err.: ${game.wrongTotal} · Percentatge: ${percent}% · Nivell ${game.level} – ${levelNames[game.level]}`;
  const list=document.getElementById('attempts');
  list.innerHTML='';
  const grouped={};
  game.history.forEach(a=>{
    const key=`${a.mode}(${a.interval})`;
    if(!grouped[key]) grouped[key]={ok:0, fail:0};
    if(a.correct) grouped[key].ok++; else grouped[key].fail++;
  });
  Object.keys(grouped)
    .sort((a,b)=>{
      const ai=parseInt(a.match(/\(([-\d]+)\)/)[1]);
      const bi=parseInt(b.match(/\(([-\d]+)\)/)[1]);
      return ai-bi;
    })
    .forEach(label=>{
      const {ok,fail}=grouped[label];
      const li=document.createElement('li');
      const lbl=document.createElement('span');
      lbl.textContent=label;
      const okSpan=document.createElement('span');
      okSpan.textContent='\u2714'.repeat(ok);
      const failSpan=document.createElement('span');
      failSpan.textContent='\u274C'.repeat(fail);
      failSpan.style.marginLeft='1rem';
      li.appendChild(lbl);
      li.appendChild(okSpan);
      li.appendChild(failSpan);
      list.appendChild(li);
    });
  document.getElementById("summary").style.display="block";
}

function initButtons(){
  const wrap=document.getElementById('quickAns');
  wrap.innerHTML='';
  const positives = [0,1,2,3,4,5,6,7,8,9,10,11,12];
  const negatives = game.mode==='iS' ? positives.slice(1).map(n=>-n) : [];
  const base = game.intervals[game.level];
  const allowed = new Set(game.mode==='iA' ? base : [...base, ...base.filter(n=>n!==0).map(n=>-n)]);
  const create=(i)=>{
    const b=document.createElement('button');
    b.textContent=`${game.mode}(${i})`;
    if(!allowed.has(i)){
      b.classList.add('disabled');
      b.disabled=true;
    }else{
      b.addEventListener('click',()=>submitAnswer(i));
    }
    wrap.appendChild(b);
  };
  positives.forEach(create);
  if(negatives.length){
    const br=document.createElement('div');
    br.style.flexBasis='100%';
    wrap.appendChild(br);
    negatives.forEach(create);
  }
}

function updateScore(){
  document.getElementById('score').textContent=`Encerts: ${game.correctTotal} · Errors: ${game.wrongTotal}`;
}

function resetForNextLevel(){
  game.question=0;
  game.correctLevel=0;
  game.wrongLevel=0;
  game.repeat=false;
  game.history=[];
  document.getElementById('summary').style.display='none';
  document.getElementById('game').style.display='block';
  initButtons();
  updateScore();
  nextQuestion();
}

