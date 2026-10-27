// Raster export of the app's code-native SVG mark for Android launcher icons.
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');
const out = path.resolve(__dirname, '../assets');
fs.mkdirSync(out, { recursive: true });
const size = 1024;
const segments = [[512,280,512,224,22],[512,224,704,224,22],[704,224,704,352,22],[296,512,416,512,22],[512,700,512,784,22],[512,784,704,784,22], ...[360,445,530,615].map(y=>[440,y,584,y,18])];
const distanceToSegment = (x,y,a,b,c,d) => {const dx=c-a,dy=d-b,t=Math.max(0,Math.min(1,((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a-t*dx,y-b-t*dy);};
for(const [filename,transparent] of [['icon.png',false],['adaptive-icon.png',true]]) {
 const png = new PNG({width:size,height:size});
 for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
   const qx=Math.abs(x+0.5-512)-48,qy=Math.abs(y+0.5-490)-162;
   const boxDistance=Math.min(Math.max(qx,qy),0)+Math.hypot(Math.max(qx,0),Math.max(qy,0))-48;
   let coverage=Math.max(0,Math.min(1,11.5-Math.abs(boxDistance)));
   for(const [a,b,c,d,width] of segments)coverage=Math.max(coverage,Math.max(0,Math.min(1,width/2+0.5-distanceToSegment(x+0.5,y+0.5,a,b,c,d))));
   const i=(y*size+x)*4;
   const bg=[37,78,112];
   for(let channel=0;channel<3;channel++)png.data[i+channel]=transparent?255:Math.round(bg[channel]+(255-bg[channel])*coverage);
   png.data[i+3]=transparent?Math.round(255*coverage):255;
 }
 fs.writeFileSync(path.join(out,filename),PNG.sync.write(png));
}
const lines=segments.map(([x1,y1,x2,y2,width])=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${width}"/>`).join('');
fs.writeFileSync(path.join(out,'icon.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#254E70"/><g fill="none" stroke="#FFFFFF" stroke-linecap="round"><rect x="416" y="280" width="192" height="420" rx="48" stroke-width="22"/>${lines}</g></svg>`);
console.log('Ikon DistiLab dibuat.');
