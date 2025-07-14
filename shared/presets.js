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

  const Presets={exportPresets,importPresets,saveLocal,loadLocal,createSaveButton};
  if(typeof module!=='undefined' && module.exports){
    module.exports=Presets;
  }else{
    global.Presets=Presets;
  }
})(typeof window!=='undefined'?window:global);
