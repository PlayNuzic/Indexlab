(function(global){
  function initSnapshots(raw){
    return Array.isArray(raw) && raw.length===10 ? raw.map(s=>s?s:null) : Array(10).fill(null);
  }
  function saveSnapshot(snaps, idx, data){
    snaps[idx] = { ...data };
    return snaps;
  }
  function loadSnapshot(snaps, idx){
    const s = snaps[idx];
    return s ? { ...s } : null;
  }
  function resetSnapshots(){
    return Array(10).fill(null);
  }
  const SnapUtils = { initSnapshots, saveSnapshot, loadSnapshot, resetSnapshots };
  if(typeof module!=='undefined' && module.exports){
    module.exports = SnapUtils;
  }else{
    global.SnapUtils = SnapUtils;
  }
})(typeof window!=='undefined'?window:global);
