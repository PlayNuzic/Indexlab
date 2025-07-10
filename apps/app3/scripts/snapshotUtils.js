(function(global){
  function initSnapshots(raw){
    let snaps = raw;
    if(!Array.isArray(snaps) || snaps.length!==10){
      snaps = Array(10).fill(null);
    }else{
      snaps = snaps.map(s=>Array.isArray(s)?{notes:s,baseMidi:60}:s);
    }
    return snaps;
  }

  function saveSnapshot(snapshots, idx, notes, baseMidi){
    snapshots[idx] = { notes: [...notes], baseMidi };
    return snapshots;
  }

  function loadSnapshot(snapshots, idx){
    const snap = snapshots[idx];
    if(!snap) return null;
    if(Array.isArray(snap)){
      return { notes: [...snap], baseMidi: 60 };
    }
    return { notes: [...snap.notes], baseMidi: snap.baseMidi };
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
