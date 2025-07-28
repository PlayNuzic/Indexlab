(function(global){
  const defaultScale = { id: 'DIAT', rot: 0, root: 0 };
  function initSnapshots(raw){
    let snaps = raw;
    if(!Array.isArray(snaps) || snaps.length !== 10){
      snaps = Array(10).fill(null);
    } else {
      snaps = snaps.map(s => {
        if(Array.isArray(s)) return {notes: s, baseMidi: 60, scale: {...defaultScale}, octShifts: Array(s.length).fill(0), components: null};
        if(!s) return null;
        if(!s.scale) s.scale = {...defaultScale};
        if(!Array.isArray(s.octShifts)) s.octShifts = Array(s.notes.length).fill(0);
        if(!Array.isArray(s.components)) s.components = null;
        return s;
      });
    }
    return snaps;
  }

  function saveSnapshot(snapshots, idx, notes, baseMidi, scale, octShifts = [], components = null){
    snapshots[idx] = {
      notes: [...notes],
      baseMidi,
      scale: {...scale},
      octShifts: octShifts.slice(),
      components: components ? components.slice() : null
    };
    return snapshots;
  }

  function loadSnapshot(snapshots, idx){
    const snap = snapshots[idx];
    if(!snap) return null;
    if(Array.isArray(snap)){
      return { notes: [...snap], baseMidi: 60, scale:{...defaultScale}, octShifts: Array(snap.length).fill(0), components: null };
    }
    return {
      notes: [...snap.notes],
      baseMidi: snap.baseMidi,
      scale: snap.scale || {...defaultScale},
      octShifts: snap.octShifts ? snap.octShifts.slice() : Array(snap.notes.length).fill(0),
      components: snap.components ? snap.components.slice() : null
    };
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
