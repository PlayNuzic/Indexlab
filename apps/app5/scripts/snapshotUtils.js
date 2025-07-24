(function(global){
  const defaultScale = { id: 'ACUS', rot: 0, root: 0 };
  function initSnapshots(raw){
    let snaps = raw;
    if(!Array.isArray(snaps) || snaps.length!==10){
      snaps = Array(10).fill(null);
    }else{
      snaps = snaps.map(s=>{
        if(Array.isArray(s)) return {notes:s, baseMidi:60, scale:{...defaultScale}};
        if(!s) return null;
        if(!s.scale) s.scale = {...defaultScale};
        return s;
      });
    }
    return snaps;
  }

  function saveSnapshot(snapshots, idx, notes, baseMidi, scale){
    snapshots[idx] = { notes: [...notes], baseMidi, scale: {...scale} };
    return snapshots;
  }

  function loadSnapshot(snapshots, idx){
    const snap = snapshots[idx];
    if(!snap) return null;
    if(Array.isArray(snap)){
      return { notes: [...snap], baseMidi: 60, scale:{...defaultScale} };
    }
    return { notes: [...snap.notes], baseMidi: snap.baseMidi, scale: snap.scale || {...defaultScale} };
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
