import { init as loadInstrument, playNote, playChord, ensureAudio } from '../../../libs/sound/index.js';
import EarTrainingGame from '../../../libs/ear-training/index.js';
import { randInt } from '../../../libs/utils/index.js';
import { drawPentagram } from '../../../libs/notation/index.js';
import { intervalColor } from '../../../shared/scales.js';

const game = new EarTrainingGame({ randInt });
const avatarFiles = ['avatar1.png','avatar2.png','avatar3.png','avatar4.png','avatar5.png'];
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

const profileSlots = 5;
let profiles = JSON.parse(localStorage.getItem('profiles')||'[]');
let currentProfile = null;
let nextMode = 'iA';
let consecutiveFails = 0;
let consecutiveWins = 0;

function saveProfiles(){
  localStorage.setItem('profiles', JSON.stringify(profiles));
}

function renderProfiles(){
  const wrap=document.getElementById('profiles');
  wrap.innerHTML='';
  for(let i=0;i<profileSlots;i++){
    const p=profiles[i];
    const div=document.createElement('div');
    div.className='profile-slot';
    div.dataset.id=i;
    if(p){
      const img=document.createElement('img');
      img.src=`./assets/avatars/${p.avatar}`;
      const label=document.createElement('p');
      label.textContent=p.name;
      div.appendChild(img);div.appendChild(label);
    }else{
      div.textContent='+';
    }
    div.addEventListener('click',()=>selectProfile(i));
    wrap.appendChild(div);
  }
  updateLevelButtons();
  updateProfileButtons();
}

document.getElementById('clearProfiles').onclick=()=>{
  if(!currentProfile) return;
  if(confirm('Segur que vols esborrar aquest perfil?')){
    profiles[currentProfile.id]=null;
    saveProfiles();
    currentProfile=null;
    renderProfiles();
    updateLevelButtons();
    updateProfileButtons();
  }
};

document.getElementById('editProfile').onclick=()=>{
  if(!currentProfile) return;
  const name=prompt('Nom del jugador?', currentProfile.name);
  if(!name) return;
  showAvatarChooser(avatar=>{
    currentProfile.name=name;
    currentProfile.avatar=avatar;
    profiles[currentProfile.id]=currentProfile;
    saveProfiles();
    renderProfiles();
    selectProfile(currentProfile.id);
  });
};

function updateLevelButtons(){
  document.querySelectorAll('#levelInfo button').forEach(btn=>{
    const lvl=parseInt(btn.dataset.level,10);
    const disabled = !currentProfile || lvl>currentProfile.level;
    btn.disabled = disabled;
    btn.classList.toggle('disabled', disabled);
  });
}

function updateProfileButtons(){
  const disabled = !currentProfile;
  const delBtn = document.getElementById('clearProfiles');
  const editBtn = document.getElementById('editProfile');
  delBtn.disabled = disabled;
  editBtn.disabled = disabled;
  delBtn.classList.toggle('disabled', disabled);
  editBtn.classList.toggle('disabled', disabled);
}

function selectProfile(idx){
  const p=profiles[idx];
  if(p){
    currentProfile=p;
    Array.from(document.querySelectorAll('.profile-slot')).forEach((el,i)=>{
      el.classList.toggle('active',i===idx);
    });
    updateLevelButtons();
    updateProfileButtons();
  }else{
    createProfile(idx);
  }
}

function createProfile(idx){
  const name=prompt('Nom del jugador?');
  if(!name) return;
  showAvatarChooser(avatar=>{
    profiles[idx]={id:idx,name,avatar,level:1};
    saveProfiles();
    renderProfiles();
    selectProfile(idx);
  });
}

function showAvatarChooser(cb){
  const sel=document.getElementById('avatarSelector');
  const list=sel.querySelector('.avatar-list');
  list.innerHTML='';
  avatarFiles.forEach(file=>{
    const img=document.createElement('img');
    img.src=`./assets/avatars/${file}`;
    img.dataset.avatar=file;
    img.addEventListener('click',()=>{
      sel.style.display='none';
      cb(file);
    },{once:true});
    list.appendChild(img);
  });
  sel.style.display='flex';
}

async function startGame(level = 1){
  nextMode = 'iA';
  game.start('iS', level);
  document.getElementById('welcome').style.display='none';
  document.getElementById('summary').style.display='none';
  document.getElementById('game').style.display='block';
  initButtons();
  await loadInstrument(document.getElementById('instrument').value || 'piano');
  updateScore();
  nextMixedQuestion();
}
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
    startGame(level);
  });
});

renderProfiles();

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

function nextMixedQuestion(){
  if(!game.repeat){
    nextMode = nextMode === 'iS' ? 'iA' : 'iS';
    game.mode = nextMode;
    game.generateQuestion();
  }
  playNotes();
  const q = { question: game.question, level: game.level };
  document.getElementById('question').textContent=`Pregunta ${q.question} · Nivell ${q.level} – ${levelNames[q.level]}`;
  document.getElementById('feedback').textContent='';
  document.getElementById('notation').innerHTML='';
  initButtons();
}

function submitAnswer(value){
  const res = game.answer(value);
  updateScore();
  if(res.correct){
    document.getElementById('feedback').textContent=`\u2714 Correcte! ${game.mode}(${game.currentInterval})`;
    const notationEl = document.getElementById('notation');
    const color = intervalColor(game.currentInterval);
    drawPentagram(notationEl, [game.note1, game.note2], {
      chord: game.mode==='iA',
      duration: game.mode==='iA' ? 'h' : 'q',
      highlightIntervals:[[0,1,color]],
      scaleId:'CROM',
      root:0
    });
    consecutiveFails=0; consecutiveWins++;
    if(consecutiveWins>=3) showAvatarMessage('Molt bé!');
    const proceed = () => {
      notationEl.removeEventListener('click', proceed);
      clearTimeout(timer);
      if(res.levelUp){
        showSummary();
      }else{
        nextMixedQuestion();
      }
    };
    const timer = setTimeout(proceed, 2500);
    notationEl.addEventListener('click', proceed, { once:true });
  }else{
    if(res.retry){
      document.getElementById('feedback').textContent='\u274C Incorrecte. Torna-ho a provar!';
      setTimeout(()=>{playNotes();},1000);
      consecutiveWins=0; consecutiveFails++;
    }else{
      document.getElementById('feedback').textContent=`\u274C Era ${game.mode}(${game.currentInterval})`;
      const notationEl = document.getElementById('notation');
      const color = intervalColor(game.currentInterval);
      drawPentagram(notationEl, [game.note1, game.note2], {
        chord: game.mode==='iA',
        duration: game.mode==='iA' ? 'h' : 'q',
        highlightIntervals:[[0,1,color]],
        noteColors:['transparent','transparent'],
        scaleId:'CROM',
        root:0
      });
      consecutiveWins=0; consecutiveFails++;
      if(consecutiveFails>=3) showAvatarMessage('No et rendeixis!');
      setTimeout(nextMixedQuestion,1000);
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
  if(currentProfile && currentProfile.level<=game.level){
    currentProfile.level = game.level+1;
    profiles[currentProfile.id]=currentProfile;
    saveProfiles();
    renderProfiles();
    updateProfileButtons();
  }
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
      const color = intervalColor(Math.abs(i));
      b.style.background = color;
      b.style.color = '#000';
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
  nextMixedQuestion();
}

function showAvatarMessage(text){
  if(!currentProfile) return;
  const img=document.getElementById('avatarImg');
  img.src=`./assets/avatars/${currentProfile.avatar}`;
  const bubble=document.getElementById('avatarBubble');
  bubble.textContent=text;
  bubble.classList.add('show');
  setTimeout(()=>bubble.classList.remove('show'),2000);
}

