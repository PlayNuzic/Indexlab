let synth;
function loadInstrument(type){
  if(synth) synth.dispose();
  if(type==='piano'){
    synth = new Tone.Sampler({
      urls:{
        "A3":"A3.mp3",
        "C4":"C4.mp3",
        "D#4":"Ds4.mp3",
        "F#4":"Fs4.mp3"
      },
      release:1,
      baseUrl:"https://tonejs.github.io/audio/salamander/"
    }).toDestination();
  }else{
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
  }
}

let mode = 'iS';
let level = 1;
let question = 0;
let correctLevel = 0;
let wrongLevel = 0;
let correctTotal = 0;
let wrongTotal = 0;
let currentInterval = 0;
let note1 = 60; // base midi
let note2 = 60;
let repeat = false;
const requiredToLevelUp = 10;

// Interval sets per level. Unison (0) always included and placed first.
const intervals = {
  1: [0,1,-1,2,-2,10,-10,11,-11],
  2: [0,5,-5,6,-6,7,-7],
  3: [0,3,-3,4,-4,8,-8,9,-9]
};
intervals[4] = [...new Set([0, ...intervals[1].slice(1), ...intervals[3].slice(1)])];
intervals[5] = [...new Set([0, ...intervals[4].slice(1), ...intervals[2].slice(1)])];

function startGame(selected){
  mode = selected;
  level = parseInt(document.getElementById('levelSelect').value) || 1;
  question = 0;
  correctLevel = 0;
  correctTotal = 0;
  wrongLevel = 0;
  wrongTotal = 0;
  repeat = false;
  document.getElementById('welcome').style.display='none';
  document.getElementById('summary').style.display='none';
  document.getElementById('game').style.display='block';
  loadInstrument(document.getElementById('instrument').value || 'sine');
  initButtons();
  document.getElementById('instrumentWrap').style.display = level>=3 ? 'block' : 'none';
  updateScore();
  nextQuestion();
}

document.getElementById('startIS').onclick=()=>{
  Tone.start().then(()=>{
    startGame('iS');
  });
};
document.getElementById('startIA').onclick=()=>{
  Tone.start().then(()=>{
    startGame('iA');
  });
};
document.getElementById('playBtn').onclick=()=>playNotes();
document.getElementById('nextBlock').onclick=()=>{
  if(level < 5 && confirm('Vols passar al següent nivell?')){
    level++;
  }
  question=0;
  correctLevel=0;
  wrongLevel=0;
  repeat=false;
  document.getElementById('summary').style.display='none';
  document.getElementById('game').style.display='block';
  initButtons();
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
    synth.triggerAttackRelease([note1, note2].map(n=>Tone.Frequency(n,'midi')),'8n');
  }
}

function nextQuestion(){
  if(!repeat){
    question++;
    const opts = intervals[level];
    currentInterval = opts[Math.floor(Math.random()*opts.length)];
    note1 = 60 + Math.floor(Math.random()*12);
    note2 = note1 + currentInterval;
  }
  playNotes();
  document.getElementById('question').textContent=`Pregunta ${question} · Nivell ${level}`;
  document.getElementById('feedback').textContent='';
  initButtons();
}

function submitAnswer(value){
  const expected = currentInterval;
  if(value === expected){
    correctLevel++;
    correctTotal++;
    document.getElementById('feedback').textContent=`\u2714 Correcte! ${(note2%12)} - ${(note1%12)} = ${currentInterval} => ${mode}(${currentInterval})`;
    updateScore();
    repeat=false;
    setTimeout(()=>{
      if(correctLevel >= requiredToLevelUp){
        showSummary();
      }else{
        nextQuestion();
      }
    },1500);
  }else{
    wrongLevel++;
    wrongTotal++;
    updateScore();
    if(!repeat){
      document.getElementById('feedback').textContent='\u274C Incorrecte. Torna-ho a provar!';
      repeat=true;
      setTimeout(()=>{playNotes();},1000);
    }else{
      document.getElementById('feedback').textContent=`\u274C Era ${mode}(${expected})`;
      repeat=false;
      setTimeout(nextQuestion,1000);
    }
  }
}

function showSummary(){
  document.getElementById("game").style.display="none";
  const total = correctLevel + wrongLevel;
  const percent = total ? Math.round(correctLevel*100/total) : 0;
  document.getElementById("result").textContent=`Encerts en aquest nivell: ${correctLevel} · Errors: ${wrongLevel}`;
  document.getElementById("totals").textContent=`Totals sessió · Enc.: ${correctTotal} · Err.: ${wrongTotal} · Percentatge: ${percent}% · Nivell ${level}`;
  document.getElementById("summary").style.display="block";
  document.getElementById("instrumentWrap").style.display = level>=3 ? "block" : "none";
}

function initButtons(){
  const wrap=document.getElementById('quickAns');
  wrap.innerHTML='';
  const positives = [0,1,2,3,4,5,6,7,8,9,10,11];
  const negatives = positives.slice(1).map(n=>-n);
  const allowed=new Set(intervals[level]);
  const create=(i)=>{
    const b=document.createElement('button');
    b.textContent=`${mode}(${i})`;
    if(!allowed.has(i)){
      b.classList.add('disabled');
      b.disabled=true;
    }else{
      b.addEventListener('click',()=>submitAnswer(i));
    }
    wrap.appendChild(b);
  };
  positives.forEach(create);
  const br=document.createElement('div');
  br.style.flexBasis='100%';
  wrap.appendChild(br);
  negatives.forEach(create);
}

function updateScore(){
  document.getElementById('score').textContent=`Encerts: ${correctTotal} · Errors: ${wrongTotal}`;
}
