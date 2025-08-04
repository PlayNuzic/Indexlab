// Utility functions
function normalize(pitchClasses){
  if(!Array.isArray(pitchClasses)) throw new Error('Input must be an array');
  return [...new Set(pitchClasses.map(n => ((n % 12) + 12) % 12))].sort((a,b)=>a-b);
}

function rotate(arr, n){
  return arr.slice(n).concat(arr.slice(0,n));
}

function span(arr){
  return arr[arr.length-1] - arr[0];
}

function toNormalForm(pcs){
  if(pcs.length <= 1) return pcs.slice();
  const candidates = [];
  for(let i=0;i<pcs.length;i++){
    const r = rotate(pcs,i);
    const first = r[0];
    const adjusted = r.map(v => v < first ? v + 12 : v);
    candidates.push(adjusted);
  }
  candidates.sort((a,b)=>{
    const spanA = span(a);
    const spanB = span(b);
    if(spanA !== spanB) return spanA - spanB;
    const penA = a[a.length-2] - a[0];
    const penB = b[b.length-2] - b[0];
    if(penA !== penB) return penA - penB;
    for(let i=0;i<a.length;i++){
      const diff = (a[i]-a[0]) - (b[i]-b[0]);
      if(diff) return diff;
    }
    return 0;
  });
  return candidates[0].map(v=>v%12);
}

function transpose(pcs, n){
  return pcs.map(v=> (v+n+1200)%12).sort((a,b)=>a-b);
}

function invert(pcs){
  return pcs.map(v=> (-v+1200)%12).sort((a,b)=>a-b);
}

function lexicographicMin(a,b){
  for(let i=0;i<a.length;i++){
    if(a[i] < b[i]) return a;
    if(a[i] > b[i]) return b;
  }
  return a;
}

function primeForm(pcs){
  const normal = toNormalForm(pcs);
  const transposed = transpose(normal, -normal[0]);
  const inv = toNormalForm(invert(transposed));
  const invTransposed = transpose(inv, -inv[0]);
  const prime = lexicographicMin(transposed, invTransposed);
  return { prime, inversion: prime===transposed ? invTransposed : transposed, normal };
}

function intervalVector(pcs){
  const iv = [0,0,0,0,0,0];
  for(let i=0;i<pcs.length;i++){
    for(let j=i+1;j<pcs.length;j++){
      const interval = Math.abs(pcs[j]-pcs[i]);
      const ic = Math.min(interval, 12-interval);
      if(ic>=1 && ic<=6) iv[ic-1]++;
    }
  }
  return iv;
}

// Generate Forte table dynamically
function generateForteTable(){
  const table = {};
  const byCard = Array.from({length:13},()=>[]);
  for(let mask=1; mask< (1<<12); mask++){
    const pcs=[];
    for(let p=0;p<12;p++) if(mask & (1<<p)) pcs.push(p);
    const {prime} = primeForm(pcs);
    const key = prime.join(',');
    if(!table[key]){
      const iv = intervalVector(prime);
      const entry={prime, iv, card:prime.length};
      table[key]=entry;
      byCard[prime.length].push(entry);
    }
  }
  for(let n=1;n<byCard.length;n++){
    const arr = byCard[n].sort((a,b)=>a.prime.join(',').localeCompare(b.prime.join(',')));
    const ivMap={};
    arr.forEach((e,i)=>{
      e.index=i+1;
      const ivKey=e.iv.join('');
      if(!ivMap[ivKey]) ivMap[ivKey]=[];
      ivMap[ivKey].push(e);
    });
    arr.forEach(e=>{
      const ivKey=e.iv.join('');
      const z=ivMap[ivKey];
      e.name = `${n}-${z.length===2?'Z':''}${e.index}`;
    });
  }
  return table;
}

const forteTable = generateForteTable();

const infoMap={
  // Intervalos (2 notas)
  '0,1':'Segunda menor/Séptima mayor',
  '0,2':'Segunda mayor/Séptima menor',
  '0,3':'Tercera menor/Sexta mayor',
  '0,4':'Tercera mayor/Sexta menor',
  '0,5':'Cuarta justa/Quinta justa (Power Chord)',
  '0,6':'Tritono (cuarta aumentada/quinta disminuida)',

  // Tríadas (3 notas)
  '0,3,7':'Tríada mayor/menor',
  '0,4,8':'Tríada aumentada',
  '0,3,6':'Tríada disminuida',
  '0,2,7':'Acorde suspendido (sus2/sus4)',
  '0,1,2':'Acorde cluster (3 notas contiguas)',

  // Cuatriadas (4 notas)
  '0,2,5,8':'Acorde de séptima de dominante / Acorde de séptima semidisminuida / Acorde menor con sexta',
  '0,1,5,8':'Acorde de séptima mayor',
  '0,3,5,8':'Acorde menor séptima / Acorde de sexta mayor',
  '0,1,4,8':'Acorde menor con séptima mayor / Acorde aumentado con séptima mayor',
  '0,2,4,8':'Acorde de séptima con quinta aumentada',
  '0,2,6,8':'Acorde de séptima con quinta disminuida',
  '0,2,4,7':'Acorde mayor add9 / Acorde 7sus2',
  '0,2,3,7':'Acorde menor add9',
  '0,2,5,7':'Acorde suspendido con segunda añadida (sus4 add9 / 7sus4)',
  '0,3,6,9':'Acorde séptima disminuida',

  // Otros
  '0,2,4,6,8,10':'Escala de tonos enteros'
};

export function identificarConjuntoForte(pitchClasses){
  const pcs = normalize(pitchClasses);
  if(!pcs.length) return { error: 'Conjunto vacío o inválido.' };
  const {prime, inversion, normal} = primeForm(pcs);
  const primeKey = prime.join(',');
  const invPrime = transpose(inversion, -inversion[0]);
  const invKey = invPrime.join(',');
  const entry = forteTable[primeKey];
  const invEntry = forteTable[invKey];
  const invertedForm = primeKey===invKey ? null : invPrime;
  const iv = entry ? entry.iv : intervalVector(prime);
  const info = infoMap[primeKey] || infoMap[invKey] || null;
  return {
    nombreForte: entry?entry.name:null,
    cardinalidad: prime.length,
    formaNormal: normal,
    formaPrima: prime,
    formaInvertida: invertedForm,
    vectorIntervalos: iv,
    infoAdicional: info
  };
}

