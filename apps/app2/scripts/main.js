import { init as loadInstrument, playNote, playChord, ensureAudio } from '../../../libs/sound/index.js';
import EarTrainingGame from '../../../libs/ear-training/index.js';
import { randInt } from '../../../libs/utils/index.js';

const game = new EarTrainingGame({ randInt });
const levelNames = {
  1: 'Intervals dissonants',
  2: 'Intervals resonants',
  3: 'Intervals consonants',
  4: 'Mix dissonants i consonants',
  5: 'Tots els intervals'
};

async function startGame(selected){
  game.start(selected, parseInt(document.getElementById('levelSelect').value) || 1);
  document.getElementById('welcome').style.display='none';
  document.getElementById('summary').style.display='none';
  document.getElementById('game').style.display='block';
  initButtons();
  await loadInstrument(document.getElementById('instrument').value || 'piano');
  updateScore();
  nextQuestion();
}

document.getElementById('startIS').onclick=async ()=>{
  await ensureAudio();
  startGame('iS');
};
document.getElementById('startIA').onclick=async ()=>{
  await ensureAudio();
  startGame('iA');
};
document.getElementById('playBtn').onclick=()=>playNotes();
document.getElementById('advanceLevel').onclick=()=>{
  if(game.level < 5){
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
  initButtons();
}

function submitAnswer(value){
  const res = game.answer(value);
  updateScore();
  if(res.correct){
    document.getElementById('feedback').textContent=`\u2714 Correcte! ${(game.note2%12)} - ${(game.note1%12)} = ${game.currentInterval} => ${game.mode}(${game.currentInterval})`;
    setTimeout(()=>{
      if(res.levelUp){
        showSummary();
      }else{
        nextQuestion();
      }
    },1500);
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
  game.history.forEach(a=>{
    const li=document.createElement('li');
    li.textContent=`${a.correct?'\u2714':'\u274C'} ${a.mode}(${a.interval})`;
    list.appendChild(li);
  });
  document.getElementById("summary").style.display="block";
}

function initButtons(){
  const wrap=document.getElementById('quickAns');
  wrap.innerHTML='';
  const positives = [0,1,2,3,4,5,6,7,8,9,10,11];
  const negatives = game.mode==='iS' ? positives.slice(1).map(n=>-n) : [];
  const allowed=new Set(game.mode==='iA'?game.intervals[game.level].filter(n=>n>=0):game.intervals[game.level]);
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

