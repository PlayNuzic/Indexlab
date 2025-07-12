(function(global){
  function exportPresets(data, filename='presets.json'){
    const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
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
    inputEl.addEventListener('change',handler);
    inputEl.click();
  }

  const Presets={exportPresets,importPresets};
  if(typeof module!=='undefined' && module.exports){
    module.exports=Presets;
  }else{
    global.Presets=Presets;
  }
})(typeof window!=='undefined'?window:global);
