const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
// El contenido principal se renderiza a ~360 px de ancho en móvil.
// 720 px garantiza al menos 2x de densidad; 1200 px queda como objetivo premium.
const groups=[
  {label:'ejercicio',dir:path.join(root,'overrides/assets/exercises/premium'),minW:720,minH:600,recommendedW:1200,recommendedH:750},
  {label:'anatomía',dir:path.join(root,'overrides/assets/anatomy/premium'),minW:500,minH:650,recommendedW:700,recommendedH:900}
];

function webpSize(buf){
  if(buf.length<30||buf.toString('ascii',0,4)!=='RIFF'||buf.toString('ascii',8,12)!=='WEBP')throw new Error('WEBP inválido');
  const type=buf.toString('ascii',12,16);
  if(type==='VP8X')return {width:1+buf.readUIntLE(24,3),height:1+buf.readUIntLE(27,3)};
  if(type==='VP8L'){
    if(buf[20]!==0x2f)throw new Error('VP8L inválido');
    const bits=buf.readUInt32LE(21);
    return {width:1+(bits&0x3fff),height:1+((bits>>>14)&0x3fff)};
  }
  if(type==='VP8 '){
    if(buf[23]!==0x9d||buf[24]!==0x01||buf[25]!==0x2a)throw new Error('VP8 inválido');
    return {width:buf.readUInt16LE(26)&0x3fff,height:buf.readUInt16LE(28)&0x3fff};
  }
  throw new Error('Tipo WEBP no compatible: '+type);
}

let blockers=[];
let upgrades=[];
let total=0;
for(const g of groups){
  if(!fs.existsSync(g.dir))continue;
  const files=fs.readdirSync(g.dir).filter(x=>x.endsWith('.webp')).sort();
  for(const name of files){
    total++;
    const file=path.join(g.dir,name);
    let size;
    try{size=webpSize(fs.readFileSync(file));}
    catch(e){blockers.push(`${g.label}: ${name} · ${e.message}`);continue;}
    const row=`${g.label}: ${name} · ${size.width}×${size.height}`;
    if(size.width<g.minW||size.height<g.minH)blockers.push(row);
    else if(size.width<g.recommendedW||size.height<g.recommendedH)upgrades.push(row);
  }
}

console.log(`VFIT visual audit: ${total} WEBP premium revisados.`);
if(upgrades.length){
  console.log(`Recomendado mejorar (${upgrades.length}):`);
  upgrades.forEach(x=>console.log('  ~ '+x));
}
if(blockers.length){
  console.error(`Resolución insuficiente (${blockers.length}):`);
  blockers.forEach(x=>console.error('  ! '+x));
  process.exit(1);
}
console.log('PASS: ningún asset premium está por debajo del mínimo anti-pixelado.');
