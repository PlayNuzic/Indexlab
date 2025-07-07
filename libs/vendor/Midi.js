// Placeholder for @tonejs/midi v2.0.27
console.warn('Midi.js offline placeholder loaded. Full functionality unavailable.');
function Midi(){
  this.header = { setTempo: () => {} };
}
Midi.prototype.addTrack = function(){
  return { addNote: () => {} };
};
Midi.prototype.toArray = function(){
  return new Uint8Array();
};
window.Midi = Midi;
