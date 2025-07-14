(function(global){
  function exportPresets(data, filename='presets.json'){
    const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=filename;
    if(document.body && typeof document.body.appendChild==='function'){
      try{
        document.body.appendChild(a);
        a.click();
        if(typeof URL.revokeObjectURL==='function') URL.revokeObjectURL(a.href);
        a.remove();
      }catch(e){
        a.click();
        if(typeof URL.revokeObjectURL==='function') URL.revokeObjectURL(a.href);
      }
    }else{
      a.click();
      if(typeof URL.revokeObjectURL==='function') URL.revokeObjectURL(a.href);
    }
  }

  function importPresets(inputEl, callback){
    function handler(e){
      const file=e.target.files[0];
      if(!file) return;
      const reader=new FileReader();
      reader.onload=ev=>{
        try{
          const data=JSON.parse(ev.target.result);
          callback(data);
        }catch(err){
          alert('Fitxer inv\xE0lid');
        }
      };
      reader.readAsText(file);
      inputEl.value='';
      inputEl.removeEventListener('change',handler);
    }
    if(inputEl && typeof inputEl.addEventListener==='function'){
      inputEl.addEventListener('change',handler);
    }
    inputEl.click();
  }

  function saveLocal(key, data){
    if(!key) return;
    try{
      localStorage.setItem(key, JSON.stringify(data));
    }catch(e){}
  }

  function loadLocal(key){
    if(!key) return null;
    try{
      const txt = localStorage.getItem(key);
      return txt? JSON.parse(txt) : null;
    }catch(e){
      return null;
    }
  }

  function createSaveButton(onSave, label='Guardar'){
    const btn=document.createElement('button');
    btn.textContent=label;
    const handler=()=>{
      onSave();
      btn.classList.add('active');
      setTimeout(()=>btn.classList.remove('active'),150);
    };
    btn.onmousedown=handler;
    btn.ontouchstart=handler;
    return btn;
  }

  function onLongPress(el, cb, duration=2000){
    let timer=null;
    const start=e=>{
      if(timer!==null) clearTimeout(timer);
      timer=setTimeout(()=>{ timer=null; cb(e); }, duration);
    };
    const cancel=()=>{ if(timer!==null){ clearTimeout(timer); timer=null; } };
    el.addEventListener('mousedown', start);
    el.addEventListener('touchstart', start);
    el.addEventListener('mouseup', cancel);
    el.addEventListener('mouseleave', cancel);
    el.addEventListener('touchend', cancel);
    el.addEventListener('touchcancel', cancel);
    const origRemove=el.remove.bind(el);
    el.remove=()=>{
      cancel();
      el.removeEventListener('mousedown', start);
      el.removeEventListener('touchstart', start);
      el.removeEventListener('mouseup', cancel);
      el.removeEventListener('mouseleave', cancel);
      el.removeEventListener('touchend', cancel);
      el.removeEventListener('touchcancel', cancel);
      origRemove();
    };
    return el;
  }

  const Presets={
    exportPresets,
    importPresets,
    saveLocal,
    loadLocal,
    createSaveButton,
    onLongPress
  };
  if(typeof module!=='undefined' && module.exports){
    module.exports=Presets;
  }else{
    global.Presets=Presets;
  }
})(typeof window!=='undefined'?window:global);
