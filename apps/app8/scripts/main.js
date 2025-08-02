import { init as loadInstrument, playNote, playChord, ensureAudio } from '../../../libs/sound/index.js';
import EarTrainingGame from '../../../libs/ear-training/index.js';
import { randInt } from '../../../libs/utils/index.js';
import { drawPentagram } from '../../../libs/notation/index.js';
import { intervalColor } from '../../../shared/scales.js';
import { createTour } from '../../../libs/guide/index.js';

const game = new EarTrainingGame({ randInt });
const avatarFiles = [
  'avatar1.png',
  'avatar2.png',
  'avatar3.png',
  'avatar4.png',
  'avatar5.png',
  'avatar6.png',
  'avatar7.png',
  'avatar8.png',
  'avatar9.png',
  'avatar10.png',
  'avatar11.png',
  'avatar12.png',
  'avatar13.png',
  'avatar14.png',
  'avatar15.png'
];
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

const SYM_OPTS = { scaleId:'CROM', root:0 };
const staffOpts = extra => ({ ...SYM_OPTS, ...extra });

const profileSlots = 5;
let profiles = JSON.parse(localStorage.getItem('profiles')||'[]');
let currentProfile = null;
let nextMode = 'iA';
let consecutiveFails = 0;
let consecutiveWins = 0;
let practiceInfo = null;
let practiceIntervals = [];
let tutorialActive = false;
let tutorialDriver = null;
let tutorialTimeout = null;
let tutorialCleanup = null;
const tutorialInterval = 2;
let tutorialFlash = null;
let tutorialFlashTimeout = null;
const quickBubbleOffset = 400;
const tutorialDemoNotes = [60,62];
const disablePrevSteps = new Set(['notation','score','backBtn']);
const skipBtn = document.getElementById('skipTutorial');

function showSkipButton(){
  if(!skipBtn) return;
  skipBtn.style.display = 'block';
  skipBtn.onclick = () => {
    if (tutorialDriver) tutorialDriver.reset();
    clearTimeout(tutorialTimeout);
    if (typeof tutorialCleanup === 'function') tutorialCleanup();
    tutorialActive = false;
    hideSkipButton();
    nextMixedQuestion();
  };
}

function hideSkipButton(){
  if(!skipBtn) return;
  skipBtn.style.display = 'none';
  skipBtn.onclick = null;
}

function prepareTutorialQuestion(){
  game.mode = 'iS';
  game.level = 1;
  game.question = 1;
  game.currentInterval = tutorialInterval;
  game.note1 = 60;
  game.note2 = game.note1 + tutorialInterval;
  const levelLabel = `Nivell 1 – ${levelNames[1]}`;
  document.getElementById('question').textContent = `Pregunta 1 · ${levelLabel}`;
  const notationEl = document.getElementById('notation');
  notationEl.innerHTML = '';
  drawPentagram(notationEl, [], staffOpts({ singleClef:'treble', width:350 }));
  initButtons();
}

function playTutorialInterval(){
  prepareTutorialQuestion();
  playNotes(true);
  startFlashTimer();
}

function flashTutorialAnswer(){
  const btn=document.querySelector(`#quickAns button[data-interval="${tutorialInterval}"]`);
  if(!btn) return;
  btn.classList.add('flash');
  setTimeout(()=>btn.classList.remove('flash'),1250);
}

function startFlashTimer(){
  clearInterval(tutorialFlash);
  clearTimeout(tutorialFlashTimeout);
  tutorialFlashTimeout = setTimeout(() => {
    flashTutorialAnswer();
    tutorialFlash = setInterval(flashTutorialAnswer, 3000);
  }, 3000);
}

function stopFlashTimer(){
  clearInterval(tutorialFlash);
  clearTimeout(tutorialFlashTimeout);
}

function setupLevelTutorialListeners(driver){
  const playBtn = document.getElementById('playBtn');
  const answers = document.getElementById('quickAns');
  const onPlay = (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    playBtn.removeEventListener('click', onPlay);
    playTutorialInterval();
    if (driver && typeof driver.moveNext === 'function') driver.moveNext();
  };
  const onAnswer = (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    const btn = e.target.closest('button');
    if(btn && btn.dataset.interval === String(tutorialInterval)){
      answers.removeEventListener('click', onAnswer);
      stopFlashTimer();
      if (driver && typeof driver.moveNext === 'function') driver.moveNext();
    }
  };
  playBtn.addEventListener('click', onPlay, { once: true });
  answers.addEventListener('click', onAnswer);
  return () => {
    playBtn.removeEventListener('click', onPlay);
    answers.removeEventListener('click', onAnswer);
    stopFlashTimer();
  };
}

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
    if(!p.stats) p.stats = { iA:{perInterval:{}}, iS:{perInterval:{}} };
    if(!p.practice) p.practice = {};
    currentProfile=p;
    Array.from(document.querySelectorAll('.profile-slot')).forEach((el,i)=>{
      el.classList.toggle('active',i===idx);
    });
    updateLevelButtons();
    updateProfileButtons();
    setAvatar();
  }else{
    createProfile(idx);
  }
}

function createProfile(idx){
  const name=prompt('Nom del jugador?');
  if(!name) return;
  showAvatarChooser(avatar=>{
    profiles[idx]={
      id:idx,
      name,
      avatar,
      level:1,
      stats:{iA:{perInterval:{}},iS:{perInterval:{}}},
      practice:{}
    };
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

async function startGame(level = 1, opts = {}){
  nextMode = 'iA';
  const set = opts.intervals || [];
  if(opts.practice){
    practiceInfo = { baseLevel: level };
    if(currentProfile){
      currentProfile.practice = currentProfile.practice || {};
      const p = currentProfile.practice[level] || { sessions: 0, intervals: [], history: [] };
      p.sessions += 1;
      set.forEach(i=>{ if(!p.intervals.includes(i)) p.intervals.push(i); });
      currentProfile.practice[level] = p;
      saveProfiles();
    }
    practiceIntervals = set;
    game.intervals[0] = [...set, 0, 12];
    game.requiredToLevelUp = set.length || 1;
    game.start('iS', 0);
  }else{
    practiceInfo = null;
    game.requiredToLevelUp = 5;
    game.start('iS', level);
  }
  document.getElementById('welcome').style.display='none';
  document.getElementById('summary').style.display='none';
  document.getElementById('game').style.display='block';
  setAvatar();
  initButtons();
  try {
    await loadInstrument(document.getElementById('instrument').value || 'piano');
  } catch (err) {
    console.error('Instrument load error', err);
  }
  updateScore();
  tutorialActive = level === 1 && !opts.practice;
  if (tutorialActive) {
    const backBtn = document.getElementById('backBtn');
    backBtn.disabled = true;
    backBtn.classList.add('disabled');
    prepareTutorialQuestion();
    showSkipButton();
    const finish = () => {
      clearTimeout(tutorialTimeout);
      if (typeof tutorialCleanup === 'function') tutorialCleanup();
      tutorialActive = false;
      backBtn.disabled = false;
      backBtn.classList.remove('disabled');
      hideSkipButton();
      nextMixedQuestion();
    };
    tutorialDriver = startLevelTour({ onEnd: finish });
    tutorialCleanup = setupLevelTutorialListeners(tutorialDriver);
    tutorialTimeout = setTimeout(() => {
      if (tutorialActive) {
        if (tutorialDriver) tutorialDriver.reset();
        finish();
      }
    }, 30000);
  } else {
    nextMixedQuestion();
  }
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
document.getElementById('practiceLevel').onclick=()=>{
  startGame(game.level, { practice: true, intervals: practiceIntervals });
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

const tourSteps = [
  {
    element: '#profiles',
    popover: {
      title: 'Perfiles de usuario',
      description: 'Aquí puedes crear un perfil o seleccionar tu perfil existente. Usa un perfil para guardar tu progreso y estadísticas.'
    }
  },
  {
    element: '#levelInfo',
    popover: {
      title: 'Niveles de entrenamiento',
      description: 'Estos son los niveles disponibles. Comienza por el nivel 1 e irá desbloqueando niveles superiores a medida que completes cada uno.'
    }
  },
  {
    element: '#showStats',
    popover: {
      title: 'Estadísticas',
      description: 'Puedes consultar en cualquier momento tus estadísticas y medallas obtenidas haciendo clic aquí.'
    }
  }
];

const startWelcomeTour = createTour(tourSteps, {
  stageBackground: 'transparent',
  opacity: 0.8,
  nextBtnText: 'Siguiente',
  prevBtnText: 'Anterior',
  closeBtnText: 'Cerrar',
  doneBtnText: 'Cerrar'
});

const levelTourSteps = [
  {
    element: '#question',
    popover: {
      title: 'Seguimiento',
      description: 'Aquí puedes ver el seguimiento del nivel de juego actual. Si aciertas verás el intervalo en un pentagrama, si fallas verás solamente el color del tipo de sonoridad. Se supera el nivel con 5 aciertos'
    }
  },
  {
    element: '#playBtn',
    popover: {
      title: 'Escuchar intervalo',
      description: 'El botón "Escolta de nou" vuelve a reproducir el intervalo tantas veces como necesites.',
      showButtons: false
    }
  },
  {
    element: '#quickAns',
    popover: {
      title: 'Respuestas rápidas',
      description: 'escoge la respuesta correcta apretando los botones de intervalo iluminados.',
      showButtons: false
    }
  },
  {
    element: '#notation',
    popover: {
      title: 'El pentagrama',
      description: 'Aquí verás el intervalo en pentagrama si aciertas y el color de la sonoridad del intervalo si fallas.'
    }
  },
  {
    element: '#score',
    popover: {
      title: 'Puntuación',
      description: 'Tus aciertos y errores por nivel.'
    }
  },
  {
    element: '#backBtn',
    popover: {
      title: 'Volver al menú',
      description: 'Con este botón sales del nivel y regresas al menú principal.'
    }
  }
];

function onLevelHighlight(element){
  const pop = document.getElementById('driver-popover-item');
  const prev = document.querySelector('.driver-prev-btn');
  const id = element && element.node ? element.node.id : null;

  if (prev) {
    const disable = disablePrevSteps.has(id);
    prev.classList.toggle('driver-disabled', disable);
    prev.disabled = disable;
    prev.setAttribute('aria-disabled', disable ? 'true' : 'false');
    prev.style.pointerEvents = disable ? 'none' : '';
  }

  if (id === 'quickAns') {
    flashTutorialAnswer();
    if (pop) {
      if (!pop.dataset.origLeft) {
        pop.dataset.origLeft = pop.style.left || '0px';
      }
      pop.style.left = `${parseInt(pop.dataset.origLeft, 10) + quickBubbleOffset}px`;
    }
  } else if (pop && pop.dataset.origLeft) {
    pop.style.left = pop.dataset.origLeft;
    delete pop.dataset.origLeft;
  }

  if (id === 'notation') {
    requestAnimationFrame(() => {
      const el = document.getElementById('notation');
      const [n1, n2] = tutorialDemoNotes;
      const col = intervalColor(tutorialInterval, 12);
      drawPentagram(el, tutorialDemoNotes, {
        chord: false,
        duration: 'q',
        highlightIntervals: [[0, 1, col]],
        noteColors: ['#000', '#000'],
        scaleId: 'CROM',
        root: 0,
        singleClef: bestClef(n1, n2),
        width: 350
      });
    });
  }
}

const startLevelTour = createTour(levelTourSteps, {
  allowClose: false,
  stageBackground: 'transparent',
  opacity: 0.8,
  nextBtnText: 'Siguiente',
  prevBtnText: 'Anterior',
  closeBtnText: 'Cerrar',
  doneBtnText: 'Cerrar',
  onHighlightStarted: onLevelHighlight,
  onHighlighted: onLevelHighlight
});
document.getElementById('showStats').onclick=()=>{
  if(!currentProfile) return;
  const el=document.getElementById('statsContent');
  el.innerHTML=generateStatsHTML(currentProfile);
  document.getElementById('statsPopup').style.display='flex';
};
document.getElementById('closeStats').onclick=()=>{
  document.getElementById('statsPopup').style.display='none';
};
document.getElementById('practiceNext').onclick=()=>{
  const lvl = practiceInfo ? practiceInfo.baseLevel : game.level;
  practiceInfo = null;
  document.getElementById('practicePopup').style.display='none';
  startGame(lvl);
};
document.getElementById('practiceMenu').onclick=()=>{
  const lvl = practiceInfo ? practiceInfo.baseLevel : game.level;
  practiceInfo = null;
  document.getElementById('practicePopup').style.display='none';
  document.getElementById('game').style.display='none';
  document.getElementById('welcome').style.display='block';
  renderProfiles();
  updateLevelButtons();
  updateProfileButtons();
};

function bestClef(n1, n2){
  const ranges = {
    treble: { min: 64, max: 77 },
    bass: { min: 43, max: 57 }
  };
  const ledger = (midi, {min, max}) => {
    if(midi < min) return min - midi;
    if(midi > max) return midi - max;
    return 0;
  };
  const t = ledger(n1, ranges.treble) + ledger(n2, ranges.treble);
  const b = ledger(n1, ranges.bass) + ledger(n2, ranges.bass);
  return t <= b ? 'treble' : 'bass';
}

function playNotes(force=false){
  if((!force && tutorialActive) || game.note1 === undefined || game.note2 === undefined) return;
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
  document.getElementById('modeTitle').textContent = game.mode === 'iA' ? 'interval harm\u00f2nic' : 'interval sonor';
  const q = { question: game.question, level: game.level };
  const levelLabel = practiceInfo ? `Nivell ${practiceInfo.baseLevel} - Pr\u00e0ctica` : `Nivell ${q.level}`;
  document.getElementById('question').textContent=`Pregunta ${q.question} · ${levelLabel} – ${levelNames[q.level]}`;
  document.getElementById('feedback').textContent='';
  const notationEl = document.getElementById('notation');
  notationEl.innerHTML='';
  drawPentagram(notationEl, [], staffOpts({ singleClef:'treble', width:350 }));
  initButtons();
}

function submitAnswer(value){
  if (tutorialActive) return;
  const res = game.answer(value);
  updateScore();
  if(res.correct){
    document.getElementById('feedback').textContent=`\u2714 Correcte! ${game.mode}(${game.currentInterval})`;
    const notationEl = document.getElementById('notation');
    const color = intervalColor(game.currentInterval);
    const highlight = [[0,1,color]];
    const clef = bestClef(game.note1, game.note2);
    drawPentagram(notationEl, [game.note1, game.note2], staffOpts({
      chord: game.mode==='iA',
      duration: game.mode==='iA' ? 'h' : 'q',
      highlightIntervals: highlight,
      noteColors:[],
      singleClef: clef,
      width:350
    }));
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
      notationEl.innerHTML='';
      drawPentagram(notationEl, [], staffOpts({ singleClef: bestClef(game.note1, game.note2), width:350 }));
      const color = intervalColor(game.currentInterval);
      const ball=document.createElement('div');
      ball.className='fail-ball';
      ball.style.background=color;
      notationEl.appendChild(ball);
      consecutiveWins=0; consecutiveFails++;
      if(consecutiveFails>=3) showAvatarMessage('No et rendeixis!');
      setTimeout(nextMixedQuestion,1000);
    }
  }
}

function showSummary(){
  updateProfileStats();
  if(practiceInfo){
    const stats = `Encerts: ${game.correctLevel} · Errors: ${game.wrongLevel}`;
    document.getElementById('practiceStats').textContent = stats;
    if(currentProfile){
      const lvl = practiceInfo.baseLevel;
      const p = currentProfile.practice && currentProfile.practice[lvl];
      if(p){
        const total = game.correctLevel + game.wrongLevel;
        const pct = total ? Math.round(game.correctLevel*100/total) : 0;
        p.history = p.history || [];
        p.history.push(pct);
        currentProfile.practice[lvl] = p;
        saveProfiles();
      }
    }
    document.getElementById('game').style.display='none';
    document.getElementById('practicePopup').style.display='flex';
    return;
  }
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
  const failedIntervals = Object.keys(grouped)
    .filter(k => grouped[k].fail > 0)
    .map(k => parseInt(k.match(/\(([-\d]+)\)/)[1]));
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
  const practiceBtn = document.getElementById('practiceLevel');
  if(percent < 50 && failedIntervals.length){
    practiceIntervals = failedIntervals;
    practiceBtn.style.display = 'inline-block';
  }else{
    practiceBtn.style.display = 'none';
  }
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
    b.dataset.interval = i;
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
  if(game.mode === 'iS'){
    const lbl=document.createElement('span');
    lbl.textContent='Ascendents';
    lbl.className='row-label';
    wrap.appendChild(lbl);
  }
  positives.forEach(create);
  if(negatives.length){
    const br=document.createElement('div');
    br.style.flexBasis='100%';
    wrap.appendChild(br);
    if(game.mode === 'iS'){
      const lbl=document.createElement('span');
      lbl.textContent='Descendents';
      lbl.className='row-label';
      wrap.appendChild(lbl);
    }
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

function setAvatar(){
  if(currentProfile){
    document.getElementById('avatarImg').src = `./assets/avatars/${currentProfile.avatar}`;
  }
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

function updateProfileStats(){
  if(!currentProfile) return;
  currentProfile.stats = currentProfile.stats || { iA:{perInterval:{}}, iS:{perInterval:{}} };
  game.history.forEach(a=>{
    const mode = a.mode;
    const s = currentProfile.stats[mode];
    s.correct = s.correct || 0;
    s.wrong = s.wrong || 0;
    s.perInterval[a.interval] = s.perInterval[a.interval] || { ok:0, fail:0 };
    if(a.correct){
      s.correct++; s.perInterval[a.interval].ok++; 
    }else{
      s.wrong++; s.perInterval[a.interval].fail++; 
    }
  });
  saveProfiles();
}

function generateStatsHTML(profile){
  let html = `<img src="./assets/avatars/${profile.avatar}" class="stats-avatar">`;
  html += `<h3>${profile.name}</h3>`;
  html += `<p>Nivell assolit: ${profile.level}</p>`;
  const practiceLevels = Object.keys(profile.practice||{}).sort((a,b)=>a-b);
  if(practiceLevels.length){
    html += '<h4>Nivells de pr\u00e0ctica</h4><ul>';
    practiceLevels.forEach(l=>{
      const info = profile.practice[l];
      const ivals = (info.intervals||[]).sort((a,b)=>a-b).map(i=>`iS(${i}) iA(${i})`).join(' ');
      const sessions = info.sessions || 0;
      let improvement = '';
      if(info.history && info.history.length>1){
        const diff = info.history[info.history.length-1] - info.history[0];
        const sign = diff>0 ? '+' : '';
        improvement = ` · Millora: ${sign}${diff}%`;
      }
      html += `<li>Nivell ${l}: ${sessions} sessions · ${ivals}${improvement}</li>`;
    });
    html += '</ul>';
  }
  html += '<h4>Percentatges</h4><ul>';
  const allIntervals = new Set([
    ...Object.keys((profile.stats && profile.stats.iS && profile.stats.iS.perInterval)||{}),
    ...Object.keys((profile.stats && profile.stats.iA && profile.stats.iA.perInterval)||{})
  ]);
  Array.from(allIntervals).sort((a,b)=>parseInt(a)-parseInt(b)).forEach(k=>{
    const sIS = profile.stats && profile.stats.iS && profile.stats.iS.perInterval[k] || {ok:0,fail:0};
    const sIA = profile.stats && profile.stats.iA && profile.stats.iA.perInterval[k] || {ok:0,fail:0};
    const totIS = sIS.ok + sIS.fail; const pctIS = totIS ? Math.round(sIS.ok*100/totIS) : 0;
    const totIA = sIA.ok + sIA.fail; const pctIA = totIA ? Math.round(sIA.ok*100/totIA) : 0;
    html += `<li>iS(${k}): ${pctIS}% iA(${k}): ${pctIA}%</li>`;
  });
  html += '</ul>';
  return html;
}

startWelcomeTour();

