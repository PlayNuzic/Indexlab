(function(global){
  const DEFAULT_SCALE = { id: 'CROM', rot: 0, root: 0 };

  function withScale(s){
    if(!s) return null;
    if(!s.scale) s.scale = { ...DEFAULT_SCALE };
    else s.scale = { ...DEFAULT_SCALE, ...s.scale };
    return s;
  }

  function initSnapshots(raw){
    let snaps = raw;
    if(!Array.isArray(snaps) || snaps.length!==10){
      snaps = Array(10).fill(null);
    }else{
      snaps = snaps.map(s=>{
        if(Array.isArray(s)) return { notes:s, baseMidi:60, scale:{...DEFAULT_SCALE} };
        if(s) return withScale({ notes:[...s.notes], baseMidi:s.baseMidi, scale:s.scale });
        return null;
      });
    }
    return snaps;
  }

  function saveSnapshot(snapshots, idx, notes, baseMidi, scale = DEFAULT_SCALE){
    snapshots[idx] = { notes: [...notes], baseMidi, scale: { ...DEFAULT_SCALE, ...scale } };
    return snapshots;
  }

  function loadSnapshot(snapshots, idx){
    const snap = snapshots[idx];
    if(!snap) return null;
    if(Array.isArray(snap)){
      return { notes: [...snap], baseMidi: 60, scale: { ...DEFAULT_SCALE } };
    }
    return { notes: [...snap.notes], baseMidi: snap.baseMidi, scale: snap.scale ? { ...DEFAULT_SCALE, ...snap.scale } : { ...DEFAULT_SCALE } };
  }

  function resetSnapshots(){
    return Array(10).fill(null);
  }

  const SnapUtils = { initSnapshots, saveSnapshot, loadSnapshot, resetSnapshots };
  if(typeof module!== 'undefined' && module.exports){
    module.exports = SnapUtils;
  }else{
    global.SnapUtils = SnapUtils;
  }
})(typeof window !== 'undefined' ? window : global);
