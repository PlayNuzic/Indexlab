window.addEventListener('DOMContentLoaded',()=>{
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const $=id=>document.getElementById(id);
  const F={n:$('n'),d:$('d'),V:$('V'),Lg:$('Lg')};
  const E={err:$('error'),der:$('derived'),i2:$('info2'),i3:$('info3'),light:$('light'),play:$('startBtn'),tap:$('tapBtn'),tapH:$('tapHint'),metro:$('metroToggle'),loopLg:$('lgLoopToggle'),loopInf:$('infLoopToggle'),cMinus:$('cycleMinus'),cPlus:$('cyclePlus'),cDisp:$('cycleDisp'),cViz:$('cycleViz'),hPA:$('handPA'),hPFr:$('handPFr'),tl:$('timeline'),tlSub:$('timelinePFr')};
  let ctx=null,timers=[],playing=false,lines=[],paSp=[],subSp=[],taps=[];

  const flash=(el,c)=>{if(el){el.style.background=c;setTimeout(()=>el.style.background='',60);}};
  const sched=(t,fn)=>timers.push(setTimeout(fn,Math.max(0,(t-ctx.currentTime)*1000)));
  const clearAll=()=>{timers.forEach(clearTimeout);timers=[];if(ctx){ctx.close();ctx=null;}E.light.style.background='var(--central)';E.hPA.style.transform=E.hPFr.style.transform='';};
  const beep=(t,f)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0.001,t);g.gain.linearRampToValueAtTime(0.25,t+0.005);g.gain.exponentialRampToValueAtTime(0.001,t+0.07);o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+0.1);};

  /* TAP tempo */
  E.tap.onclick=()=>{const now=Date.now();if(taps.length&&now-taps[taps.length-1]>2000)taps=[];taps.push(now);if(taps.length>=3){const diffs=taps.slice(1).map((t,i)=>t-taps[i]);const bpm=60000/(diffs.reduce((a,b)=>a+b,0)/diffs.length);F.V.value=bpm.toFixed(2);E.tapH.textContent=`${bpm.toFixed(1)} BPM`;compute();restart();}else E.tapH.textContent='Sigue tocando…';};

  function compute(){
    const n=+F.n.value||1,
          d=+F.d.value||1,
          V=+F.V.value||60,
          Lg=+F.Lg.value||n;
    const loopInf=E.loopInf.checked,
          loopLg=E.loopLg.checked;
    if(!loopInf&&Lg%n!==0){
      const p=Math.floor(Lg/n)*n;
      E.err.textContent=`⚠️ Lg no múltiplo. Usa ${p||''} o ${p+n}`;
      return null;
    }
    E.err.textContent='';
    const LgEff = loopInf ? n : Lg;
    const LgFr  = Math.round(LgEff*d/n);
    const cycle = LgEff/n;
    const m     = gcd(n,d);
    const nR    = n/m;
    const dR    = d/m;
    const VFr   = V*dR/nR;

    /* panel info */
    E.der.innerHTML=`LgPa ${LgEff} · LgFr ${LgFr} · Ciclo ${cycle}`+
                    `<br>MCD: n' ${nR} d' ${dR}`+
                    `<br>BPM Fr ${VFr.toFixed(2)} · BPM a ${V.toFixed(2)}`;
    E.i2.textContent=`Ciclo ${cycle}`;
    E.i3.textContent=`Patrón cada ${nR} PA`;

    drawCycle(cycle);
    drawTL(LgEff,d,n);

    return {n,d,V,LgEff,cycle,loopInf,loopLg};
  }

  function drawCycle(c){
    E.cDisp.textContent=c?`× ${c}`:'—';
    E.cViz.innerHTML='';
    lines=[];
    if(!c){E.hPA.style.display=E.hPFr.style.display='none';return;}
    E.hPA.style.display=E.hPFr.style.display='block';
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

  function drawTL(Lg,d,n){
    E.tl.innerHTML='';
    E.tlSub.innerHTML='';
    paSp=[];
    subSp=[];
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
  }

  function play(){
    const d=compute();
    if(!d) return;
    if(!ctx) ctx=new(window.AudioContext||window.webkitAudioContext)();
    const beat=60/d.V;
    const sub = beat*d.n/d.d;
    const start=ctx.currentTime+0.25;

    /* grupos y sub‑beats */
    for(let g=0;g<d.cycle;g++){
      const gStart=start+g*d.n*beat;
      sched(gStart,()=>flash(lines[g],'var(--accent)'));
      for(let p=0;p<d.d;p++){
        const t=gStart+p*sub;
        const idx=g*d.d+p;
        beep(t,p===0?1400:350);
        sched(t,()=>{E.light.style.background=p===0?'var(--accent)':'var(--sub)';setTimeout(()=>E.light.style.background='var(--central)',50);});
        if(subSp[idx]) sched(t,()=>flash(subSp[idx],'var(--sub)'));
        sched(t,()=>E.hPFr.style.transform=`rotate(${(idx/(d.cycle*d.d))*360}deg)`);
      }
    }

    /* pulses absolutos */
    for(let b=0;b<d.LgEff;b++){
      const t=start+b*beat;
      sched(t,()=>E.hPA.style.transform=`rotate(${(b/d.LgEff)*360}deg)`);
      if(paSp[b]) sched(t,()=>flash(paSp[b],b===0?'var(--metro)':'var(--accent)'));
      if(E.metro.checked) beep(t,2600);
    }

    const end=start+d.LgEff*beat;
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
  [E.metro,E.loopLg,E.loopInf].forEach(chk=>chk.addEventListener('change',()=>{compute();restart();}));
  E.cMinus.onclick=()=>{const d=compute();if(d&&d.cycle>1){F.Lg.value=d.n*(d.cycle-1);compute();restart();}};
  E.cPlus.onclick=()=>{const d=compute();if(d){F.Lg.value=d.n*(d.cycle+1);compute();restart();}};

  compute();
});

