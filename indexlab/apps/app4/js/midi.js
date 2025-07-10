function varInt(v){
  const bytes=[];
  let buffer=v&0x7F;
  while(v>>=7){
    buffer<<=8;
    buffer|=(v&0x7F)|0x80;
  }
  while(true){
    bytes.push(buffer&0xFF);
    if(buffer&0x80) buffer>>=8;
    else break;
  }
  return bytes;
}

function rowToMidi(row,bpm){
  const tpq=480;
  const tempo=Math.floor(60000000/bpm);
  const events=[];
  events.push(...varInt(0),0xFF,0x51,0x03,(tempo>>16)&255,(tempo>>8)&255,tempo&255);
  events.push(...varInt(0),0xC0,0);
  row.forEach(n=>{
    events.push(...varInt(0),0x90,n+12,100);
    events.push(...varInt(tpq),0x80,n+12,64);
  });
  events.push(...varInt(0),0xFF,0x2F,0x00);
  const trackLen=events.length;
  const track=[0x4d,0x54,0x72,0x6b,(trackLen>>24)&255,(trackLen>>16)&255,(trackLen>>8)&255,trackLen&255,...events];
  const header=[0x4d,0x54,0x68,0x64,0x00,0x00,0x00,0x06,0x00,0x00,0x00,0x01,0x01,0xE0];
  return new Uint8Array([...header,...track]);
}

if (typeof module !== 'undefined') {
  module.exports = { rowToMidi };
}
