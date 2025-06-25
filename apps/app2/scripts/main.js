let synth;
function loadInstrument(type){
  if(synth) synth.dispose();
  if(type==='piano'){
    // Use simple synth placeholder for piano (samples could be added here)
    synth = new Tone.Synth({oscillator:{type:'triangle'}}).toDestination();
  }else{
    synth = new Tone.Synth().toDestination();
  }
}
loadInstrument('sine');

let mode = 'iS';
let level = 1;
let question = 0;
let correct = 0;
let correctTotal = 0;
let wrongTotal = 0;
let currentInterval = 0;
let note1 = 60; // base midi
let note2 = 60;
let repeat = false;
const requiredToLevelUp = 10;

const intervals = {
  1: [0,1,2,3,4,5,-1,-2,-3,-4,-5],
  2: [0,1,2,3,4,5,7,8,9,-1,-2,-3,-4,-5,-7,-8,-9],
  3: [0,1,2,3,4,5,6,7,8,9,10,11,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11],
  4: [0,1,2,3,4,5,6,7,8,9,10,11,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11],
  5: [0,1,2,3,4,5,6,7,8,9,10,11,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11]
};

function startGame(selected){
  mode = selected;
  level = parseInt(document.getElementById('levelSelect').value) || 1;
  question = 0;
  correct = 0;
  correctTotal = 0;
  wrongTotal = 0;
  repeat = false;
  document.getElementById('welcome').style.display='none';
  document.getElementById('summary').style.display='none';
  document.getElementById('game').style.display='block';
  initButtons();
  loadInstrument(document.getElementById('instrument').value);
  document.getElementById('instrumentWrap').style.display = level>=3 ? 'block' : 'none';
  updateScore();
  nextQuestion();
}

document.getElementById('startIS').onclick=()=>startGame('iS');
document.getElementById('startIA').onclick=()=>startGame('iA');
document.getElementById('submitBtn').onclick=submitAnswer;
document.getElementById('playBtn').onclick=()=>playNotes();
document.getElementById('nextBlock').onclick=()=>{
  question=0;correct=0;repeat=false;
  document.getElementById('summary').style.display='none';
  document.getElementById('game').style.display='block';
  updateScore();
  nextQuestion();
};
document.getElementById('instrument').onchange=e=>loadInstrument(e.target.value);
document.getElementById('backBtn').onclick=()=>{
  document.getElementById('game').style.display='none';
  document.getElementById('welcome').style.display='block';
};

function playNotes(){
  if(mode==='iS'){
    synth.triggerAttackRelease(Tone.Frequency(note1,'midi'), '8n');
    setTimeout(()=>{
      synth.triggerAttackRelease(Tone.Frequency(note2,'midi'), '8n');
    },800);
  }else{
    synth.triggerAttackRelease([Tone.Frequency(note1,'midi'),Tone.Frequency(note2,'midi')],'8n');
  }
}

function nextQuestion(){
  if(!repeat && question>=10){
    showSummary();
    return;
  }
  if(!repeat){
    question++;
    const opts = intervals[level];
    currentInterval = opts[Math.floor(Math.random()*opts.length)];
    note1 = 60 + Math.floor(Math.random()*12);
    note2 = note1 + currentInterval;
  }
  playNotes();
  document.getElementById('question').textContent=`Pregunta ${question}/10 · Nivell ${level}`;
  document.getElementById('answer').value='';
  document.getElementById('feedback').textContent='';
  document.getElementById('answer').placeholder = `${mode}(?)`;
  initButtons();
}

function submitAnswer(){
  const ans = document.getElementById('answer').value.trim();
  const match = ans.match(/i[SA]\((-?\d+)\)/i);
  const expected = (mode==='iS'? 'iS(':'iA(')+currentInterval+')';
  if(match && parseInt(match[1])===currentInterval){
    correct++;
    correctTotal++;
    document.getElementById('feedback').textContent=`\u2714 Correcte! ${(note2%12)} - ${(note1%12)} = ${currentInterval} => ${mode}(${currentInterval})`;
    updateScore();
    repeat=false;
    setTimeout(()=>{
      if(correctTotal>=requiredToLevelUp && level<5){
        if(confirm('Has assolit 10 encerts! Vols passar de nivell?')){
          level++;
          correctTotal=0;
          wrongTotal=0;
        }
      }
      nextQuestion();
    },1500);
  }else{
    wrongTotal++;
    updateScore();
    if(!repeat){
      document.getElementById('feedback').textContent='\u274C Incorrecte. Torna-ho a provar!';
      repeat=true;
      setTimeout(()=>{playNotes();document.getElementById('answer').value='';},1000);
    }else{
      document.getElementById('feedback').textContent=`\u274C Era ${expected}`;
      repeat=false;
      setTimeout(nextQuestion,1000);
    }
  }
}

function showSummary(){
  document.getElementById('game').style.display='none';
  const total = correctTotal + wrongTotal;
  const percent = total ? Math.round(correctTotal*100/total) : 0;
  document.getElementById('result').textContent=`Acierts en aquest bloc: ${correct}/10.`;
  document.getElementById('totals').textContent=`Totals · Enc.: ${correctTotal} · Err.: ${wrongTotal} · Aciert: ${percent}% · Nivell ${level}`;
  document.getElementById('summary').style.display='block';
  document.getElementById('instrumentWrap').style.display = level>=3 ? 'block' : 'none';
}

function initButtons(){
  const wrap=document.getElementById('quickAns');
  wrap.innerHTML='';
  for(let i=-11;i<12;i++){
    const b=document.createElement('button');
    b.textContent=`${mode}(${i})`;
    b.addEventListener('click',()=>{document.getElementById('answer').value=`${mode}(${i})`;submitAnswer();});
    wrap.appendChild(b);
  }
}

function updateScore(){
  document.getElementById('score').textContent=`Encerts: ${correctTotal} · Errors: ${wrongTotal}`;
}
