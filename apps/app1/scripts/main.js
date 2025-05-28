window.addEventListener('DOMContentLoaded',()=>{
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const $=id=>document.getElementById(id);
  const F={n:$('n'),d:$('d'),V:$('V'),Lg:$('Lg')};
  const F2={n:$('n2'),d:$('d2'),V:$('V2'),Lg:$('Lg2')};
  const toggleSecond=$('toggleSecond');
  const E={err:$('error'),der:$('derived'),i2:$('info2'),i3:$('info3'),light:$('light'),play:$('startBtn'),tap:$('tapBtn'),tapH:$('tapHint'),metro:$('metroToggle'),loopLg:$('lgLoopToggle'),loopInf:$('infLoopToggle'),cMinus:$('cycleMinus'),cPlus:$('cyclePlus'),cDisp:$('cycleDisp'),cViz:$('cycleViz'),hPA:$('handPA'),hPFr:$('handPFr'),hPFr2:$('handPFr2'),tl:$('timeline'),tlSub:$('timelinePFr'),tlSub2:$('timelinePFr2'),inputs2:$('inputs2')};
  let ctx=null,timers=[],playing=false,lines=[],paSp=[],subSp=[],subSp2=[],taps=[];

  const flash=(el,c)=>{if(el){el.style.background=c;setTimeout(()=>el.style.background='',60);}};
  const sched=(t,fn)=>timers.push(setTimeout(fn,Math.max(0,(t-ctx.currentTime)*1000)));
  const clearAll=()=>{timers.forEach(clearTimeout);timers=[];if(ctx){ctx.close();ctx=null;}E.light.style.background='var(--central)';E.hPA.style.transform=E.hPFr.style.transform='';};
  const beep=(t,f)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0.001,t);g.gain.linearRampToValueAtTime(0.25,t+0.005);g.gain.exponentialRampToValueAtTime(0.001,t+0.07);o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+0.1);};

  /* TAP tempo */
  E.tap.onclick=()=>{const now=Date.now();if(taps.length&&now-taps[taps.length-1]>2000)taps=[];taps.push(now);if(taps.length>=3){const diffs=taps.slice(1).map((t,i)=>t-taps[i]);const bpm=60000/(diffs.reduce((a,b)=>a+b,0)/diffs.length);F.V.value=bpm.toFixed(2);E.tapH.textContent=`${bpm.toFixed(1)} BPM`;compute();restart();}else E.tapH.textContent='Sigue tocando…';};

  function compute(){
    const fr1={
      n:+F.n.value||1,
      d:+F.d.value||1,
      V:+F.V.value||60,
      Lg:+F.Lg.value||(+F.n.value||1)
    };
    const fr2Active=toggleSecond.checked;
    const fr2={
      n:+F2.n.value||1,
      d:+F2.d.value||1,
      V:+F2.V.value||60,
      Lg:+F2.Lg.value||(+F2.n.value||1)
    };
    const loopInf=E.loopInf.checked,
          loopLg=E.loopLg.checked;

    if(!loopInf&&fr1.Lg%fr1.n!==0){
      const p=Math.floor(fr1.Lg/fr1.n)*fr1.n;
      E.err.textContent=`⚠️ Lg no múltiplo. Usa ${p||''} o ${p+fr1.n}`;
      return null;
    }
    if(fr2Active && !loopInf && fr2.Lg%fr2.n!==0){
      const p=Math.floor(fr2.Lg/fr2.n)*fr2.n;
      E.err.textContent=`⚠️ Lg2 no múltiplo. Usa ${p||''} o ${p+fr2.n}`;
      return null;
    }
    E.err.textContent='';

    const LgEff1 = loopInf ? fr1.n : fr1.Lg;
    fr1.LgEff = LgEff1;
    const LgFr1  = Math.round(LgEff1*fr1.d/fr1.n);
    const cycle1 = LgEff1/fr1.n;
    fr1.cycle = cycle1;
    const m1     = gcd(fr1.n,fr1.d);
    const nR1    = fr1.n/m1;
    const dR1    = fr1.d/m1;
    const VFr1   = fr1.V*dR1/nR1;

    let info=`LgPa ${LgEff1} · LgFr ${LgFr1} · Ciclo ${cycle1}`+
             `<br>MCD: n' ${nR1} d' ${dR1}`+
             `<br>BPM Fr ${VFr1.toFixed(2)} · BPM a ${fr1.V.toFixed(2)}`;

    let cycleCommon=cycle1;

    if(fr2Active){
      const LgEff2 = loopInf ? fr2.n : fr2.Lg;
      fr2.LgEff = LgEff2;
      const cycle2 = LgEff2/fr2.n;
      fr2.cycle = cycle2;
      const m2     = gcd(fr2.n,fr2.d);
      const nR2    = fr2.n/m2;
      const dR2    = fr2.d/m2;
      const VFr2   = fr2.V*dR2/nR2;
      info += `<br>2ª LgPa ${LgEff2} · Ciclo ${cycle2}`+
              `<br>BPM2 Fr ${VFr2.toFixed(2)} · BPM2 a ${fr2.V.toFixed(2)}`;
      cycleCommon = fr1.n*fr2.n/gcd(fr1.n,fr2.n);
    }

    E.der.innerHTML=info;
    E.i2.textContent=`Ciclo ${cycleCommon}`;
    E.i3.textContent=`Patrón cada ${nR1} PA`;

    drawCycle(cycleCommon);
    drawTL(LgEff1,fr1.d,fr1.n,fr2Active?fr2.d:0,fr2Active?fr2.n:0);

    return {fr1,fr2Active,fr2,cycleCommon,loopInf,loopLg};
  }

  function drawCycle(c){
    E.cDisp.textContent=c?`× ${c}`:'—';
    E.cViz.innerHTML='';
    lines=[];
    if(!c){E.hPA.style.display=E.hPFr.style.display=E.hPFr2.style.display='none';return;}
    E.hPA.style.display=E.hPFr.style.display=E.hPFr2.style.display='block';
    const cx=120,cy=120,r1=80,r2=105;
    for(let i=0;i<c;i++){
      const ang=2*Math.PI*i/c+Math.PI/2;
      const l=document.createElementNS('http://www.w3.org/2000/svg','line');
      l.setAttribute('x1',cx+r1*Math.cos(ang));
      l.setAttribute('y1',cy+r1*Math.sin(ang));
      l.setAttribute('x2',cx+r2*Math.cos(ang));
      l.setAttribute('y2',cy+r2*Math.sin(ang));
      l.setAttribute('stroke','var(--central)');
      l.setAttribute('stroke-width','2');
      E.cViz.appendChild(l);
      lines.push(l);
    }
    const circ=document.createElementNS('http://www.w3.org/2000/svg','circle');
    circ.setAttribute('cx',cx);
    circ.setAttribute('cy',cy);
    circ.setAttribute('r',r1-22);
    circ.setAttribute('fill','rgba(255,255,255,.05)');
    E.cViz.appendChild(circ);
  }

  function drawTL(Lg,d,n,d2=0,n2=0){
    E.tl.innerHTML='';
    E.tlSub.innerHTML='';
    E.tlSub2.innerHTML='';
    paSp=[];
    subSp=[];
    subSp2=[];
    for(let i=0;i<Lg;i++){
      const s=document.createElement('span');
      if(i%n===0)s.classList.add('startStatic');
      E.tl.appendChild(s);
      paSp.push(s);
    }
    const totalSub=Lg*d/n;
    const cycleSub=n*d;
    for(let j=0;j<totalSub;j++){
      const s=document.createElement('span');
      if(j%cycleSub===0)s.classList.add('accentStatic');
      E.tlSub.appendChild(s);
      subSp.push(s);
    }
    if(n2&&d2){
      const totalSub2=Lg*d2/n2;
      const cycleSub2=n2*d2;
      for(let k=0;k<totalSub2;k++){
        const s=document.createElement('span');
        if(k%cycleSub2===0)s.classList.add('accentStatic');
        E.tlSub2.appendChild(s);
        subSp2.push(s);
      }
    }
  }

  function play(){
    const d=compute();
    if(!d) return;
    if(!ctx) ctx=new(window.AudioContext||window.webkitAudioContext)();

    const start=ctx.currentTime+0.25;

    const beat1=60/d.fr1.V;
    const sub1 = beat1*d.fr1.n/d.fr1.d;
    const step1 = d.cycleCommon/d.fr1.n;


    for(let g=0;g<d.fr1.LgEff/d.fr1.n;g++){
      const gStart=start+g*d.fr1.n*beat1;
      const idxLine=Math.floor(g*step1);
      sched(gStart,()=>flash(lines[idxLine],'var(--accent)'));
      for(let p=0;p<d.fr1.d;p++){
        const t=gStart+p*sub1;
        const idx=g*d.fr1.d+p;
        beep(t,p===0?1400:350);
        sched(t,()=>{E.light.style.background=p===0?'var(--accent)':'var(--sub)';setTimeout(()=>E.light.style.background='var(--central)',50);});
        if(subSp[idx]) sched(t,()=>flash(subSp[idx],'var(--sub)'));
        sched(t,()=>E.hPFr.style.transform=`rotate(${(idx/(d.fr1.LgEff))*360}deg)`);
      }
    }

    if(d.fr2Active){
      const beat2=60/d.fr2.V;
      const sub2 = beat2*d.fr2.n/d.fr2.d;
      const step2=d.cycleCommon/d.fr2.n;
      for(let g=0;g<d.fr2.LgEff/d.fr2.n;g++){
        const gStart=start+g*d.fr2.n*beat2;
        const idxLine=Math.floor(g*step2);
        if(lines[idxLine]) sched(gStart,()=>flash(lines[idxLine],'var(--accent)'));
        for(let p=0;p<d.fr2.d;p++){
          const t=gStart+p*sub2;
          const idx=g*d.fr2.d+p;
          beep(t,p===0?1200:350);
          if(subSp2[idx]) sched(t,()=>flash(subSp2[idx],'var(--sub)'));
          sched(t,()=>E.hPFr2.style.transform=`rotate(${(idx/(d.fr2.LgEff))*360}deg)`);
        }
      }
    }

    for(let b=0;b<d.fr1.LgEff;b++){
      const t=start+b*beat1;
      sched(t,()=>E.hPA.style.transform=`rotate(${(b/d.fr1.LgEff)*360}deg)`);
      if(paSp[b]) sched(t,()=>flash(paSp[b],b===0?'var(--metro)':'var(--accent)'));
      if(E.metro.checked) beep(t,2600);
    }

    const end=start+Math.max(d.fr1.LgEff*beat1,d.fr2Active?d.fr2.LgEff*60/d.fr2.V:0);
    const loop=d.loopInf||d.loopLg;
    sched(loop?end:end+0.1,()=>{if(playing){clearAll();loop?play():toggle();}});
  }

  function toggle(){
    playing=!playing;
    E.play.textContent=playing?'■ Detener':'▶︎ Reproducir';
    playing?play():clearAll();
  }

  const restart=()=>{if(playing){clearAll();play();}};

  /* listeners */
  E.play.onclick=toggle;
  Object.values(F).forEach(inp=>inp.addEventListener('input',()=>{compute();restart();}));
  Object.values(F2).forEach(inp=>inp.addEventListener('input',()=>{compute();restart();}));
  toggleSecond.addEventListener('change',()=>{E.inputs2.style.display=toggleSecond.checked?'grid':'none';compute();restart();});
  [E.metro,E.loopLg,E.loopInf].forEach(chk=>chk.addEventListener('change',()=>{compute();restart();}));
  E.cMinus.onclick=()=>{const d=compute();if(d&&d.cycle>1){F.Lg.value=d.n*(d.cycle-1);compute();restart();}};
  E.cPlus.onclick=()=>{const d=compute();if(d){F.Lg.value=d.n*(d.cycle+1);compute();restart();}};

  compute();
});

