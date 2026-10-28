const fs=require('node:fs');
const path=require('node:path');
const {createKit}=require('./ui-kit.cjs');
const k=createKit();
const {C,commands,links,frames,ref,cmd,node,rect,box,text,path:vec,icon,pill,button,screen,header,nav,workflow,card,input,metric,section,hotspot}=k;
const out=process.env.DISTILAB_DESIGN_OUT ? path.resolve(process.env.DISTILAB_DESIGN_OUT) : path.resolve(__dirname,'../../outputs/DistiLab-Desain-FigCraft');
fs.mkdirSync(out,{recursive:true});
cmd('file.rename',{name:'DistiLab — Desain Mobile & Prototype'});
cmd('page.rename',{id:1,name:'01 · Layar aplikasi'});
cmd('page.setBackground',{color:'#E6EEF1'});

// A native cover and labels keep the canvas easy to navigate.
const cover=box(null,0,-8,2222,128,C.navy,24,null,'DistiLab / Design overview');
text(cover,32,22,800,'DistiLab',36,C.white,'Bold',54);
text(cover,32,78,1000,'Laboratorium distilasi dalam genggaman.  /  Rancangan aplikasi Android',16,'#C5DADC','Regular',27);
pill(cover,1908,29,282,'MOBILE UI  ·  390 × 844','#294B5C','#E4F3EE');
text(cover,1908,74,282,'09 layar  /  prototipe terhubung',13,'#C5DADC','Regular',24,'right');
function label(col,row,num,title,desc){text(null,col*458,136+row*956,390,num+'  /  '+title.toUpperCase(),12,C.navy,'Bold',24);text(null,col*458,1038+row*956,390,desc,12,C.muted,'Regular',28);}
label(0,0,'01','Beranda','Mulai studi dan lanjutkan eksplorasi.');
label(1,0,'02','Proses','Pahami aliran sebelum mengisi parameter.');
label(2,0,'03','Data kasus','Input dikelompokkan sesuai proses.');
label(3,0,'04','Hasil','Angka utama dan grafik dalam satu layar.');
label(0,1,'05','Sensitivitas','Eksplorasi pengaruh parameter operasi.');
label(1,1,'06','Verifikasi','Acuan perhitungan dan pemeriksaan batas.');
label(2,1,'07','Riwayat','Studi tersimpan dan perbandingan skenario.');
label(3,1,'08','Metodologi','Persamaan, asumsi, dan konvensi tahap.');
label(4,1,'09','Perbandingan','Dua kondisi operasi, satu pandangan.');
text(null,1832,136,390,'PANDUAN  /  JELAJAHI PROTOTIPE',12,C.navy,'Bold',24);
const guide=box(null,1832,180,390,844,C.navy,28,null,'DistiLab / Panduan prototype');
pill(guide,26,30,155,'DESAIN SIAP EDIT','#294B5C','#BDE5D8');
text(guide,26,108,338,'Coba alurnya.\nUbah detailnya.\nJadikan milikmu.',32,C.white,'Bold',148);
text(guide,26,301,338,'01  Buka mode Presentasikan\n\n02  Mulai dari layar Beranda\n\n03  Ikuti tombol dan navigasi bawah',15,'#C5DADC','Regular',163);
rect(guide,26,506,338,1,'#426170',0);
text(guide,26,539,338,'DESAIN, BUKAN RUN PERHITUNGAN',10,'#A8D4C8','Semibold',22);
text(guide,26,576,326,'Nilai contoh berasal dari model C14.\nTombol ekspor dan isian adalah rancangan\nvisual; integrasinya ada di aplikasi.',13,'#C5DADC','Regular',81);
text(guide,26,696,338,'2 halaman · layer editable\nKomponen tombol, input, dan metrik\nSumber kode pembuat desain disertakan',12,'#8EB3BB','Regular',78);

function columnDiagram(p,x,y,scale=1,small=false){
 const g=box(p,x,y,300*scale,300*scale,'none',0,null,'Diagram / Distillation column');
 // Geometry has deliberate independent editable shapes and paths.
 const s=scale, line=(d,color=C.teal,w=2)=>vec(g,0,0,d,color,w*scale,'Process connection');
 const X=v=>v*s;
 rect(g,X(126),X(45),X(61),X(206),'#EFF8F4',X(26),C.teal,'Column shell');
 for(let i=0;i<7;i++)rect(g,X(134),X(76+i*22),X(45),X(2),'#80BDB1',1,null,'Tray '+(i+1));
 line(`M ${X(156)} ${X(45)} L ${X(156)} ${X(20)} L ${X(236)} ${X(20)} L ${X(236)} ${X(49)}`);
 rect(g,X(215),X(49),X(42),X(27),C.white,X(8),C.teal,'Total condenser');
 line(`M ${X(236)} ${X(76)} L ${X(236)} ${X(98)} L ${X(187)} ${X(98)}`);
 line(`M ${X(236)} ${X(98)} L ${X(284)} ${X(98)}`);
 line(`M ${X(278)} ${X(93)} L ${X(284)} ${X(98)} L ${X(278)} ${X(103)}`);
 line(`M ${X(21)} ${X(151)} L ${X(126)} ${X(151)}`,C.blue,2.5);
 line(`M ${X(118)} ${X(145)} L ${X(126)} ${X(151)} L ${X(118)} ${X(157)}`,C.blue,2.5);
 rect(g,X(118),X(137),X(18),X(28),C.blueBg,X(6),null,'Feed junction');
 line(`M ${X(156)} ${X(251)} L ${X(156)} ${X(278)} L ${X(236)} ${X(278)} L ${X(236)} ${X(249)}`);
 rect(g,X(214),X(221),X(44),X(28),C.white,X(11),C.teal,'Reboiler');
 line(`M ${X(214)} ${X(235)} L ${X(187)} ${X(235)}`);
 line(`M ${X(236)} ${X(278)} L ${X(284)} ${X(278)}`);
 line(`M ${X(278)} ${X(273)} L ${X(284)} ${X(278)} L ${X(278)} ${X(283)}`);
 if(!small){
 text(g,0,X(111),X(110),'Umpan · F',12,C.blue,'Semibold',24);
 text(g,0,X(133),X(100),'100 kmol/jam',10,C.muted,'Regular',20);
 text(g,X(211),X(108),X(90),'Distilat · D',11,C.teal,'Semibold',20);
 text(g,X(212),X(128),X(88),'xD = 0,95',10,C.muted,'Regular',20);
 text(g,X(210),X(288),X(94),'Bawah · B',11,C.teal,'Semibold',20);
 text(g,X(87),X(264),X(78),'12 tahap',10,C.teal,'Semibold',20);
 } return g;
}

// 01 — Home
{
 const p=screen('01 Beranda',0,0);
 const mark=box(p,24,54,42,42,C.teal,13,null,'Brand mark');icon(mark,9,8,'flask',C.white,24);
 text(p,77,52,208,'DistiLab',24,C.ink,'Bold',36);text(p,77,86,208,'VIRTUAL DISTILLATION LAB',8.5,C.muted,'Semibold',16);
 const about=box(p,326,58,40,36,C.white,12,C.border,'About methodology');icon(about,8,6,'book',C.teal,24);links.push([about,'08 Metodologi']);
 pill(p,24,126,116,'BELAJAR & RISET');
 text(p,24,166,342,'Dari proses ke\npemahaman.',30,C.ink,'Bold',88);
 text(p,24,263,330,'Eksplorasi pemisahan biner melalui\ndiagram, perhitungan, dan skenario.',14,C.muted,'Regular',46);
 const hero=box(p,24,330,342,168,C.navy,21,null,'Hero / Start a case');
 text(hero,20,18,220,'Satu kolom.\nBanyak kemungkinan.',19,C.white,'Semibold',58);
 text(hero,20,84,190,'Mulai dari parameter prosesmu.',11,'#BAD1D5','Regular',20);
 button(hero,18,116,216,'Kasus penelitian baru','02 Proses','primary','plus',38);
 // Abstract tray illustration, all geometry editable.
 rect(hero,270,30,45,97,'#2C5B67',21,'#66AE9E','Column motif');
 [50,67,84,101].forEach(y=>rect(hero,277,y,31,2,'#7FCDB5',1));
 vec(hero,250,19,'M 0 60 L 19 60 M 37 0 L 37 10 L 65 10 L 65 34','#90CDBC',2,'Flow motif');
 section(p,520,'Dua cara memahami kolom');
 [['McCabe–Thiele','Tahap demi tahap secara grafis.','chart'],['Fenske–Underwood–Gilliland','Estimasi cepat untuk desain awal.','layers']].forEach(([t,d,i],n)=>{
  const c=card(p,24,558+n*79,342,68,t);const ic=box(c,12,13,42,42,n?C.blueBg:C.mint,13);icon(ic,9,9,i,n?C.blue:C.teal,24);text(c,66,11,260,t,n?13:15,C.ink,'Semibold',24);text(c,66,36,260,d,11,C.muted,'Regular',20);links.push([c,'03 Data kasus']);
 });
 icon(p,26,726,'wifi',C.teal,20);text(p,55,727,290,'Bisa digunakan tanpa koneksi internet',11,C.muted,'Regular',20);
 nav(p,'Beranda');
}
// 02 — Process
{
 const p=screen('02 Proses',1,0);header(p,'Kasus penelitian baru','Jelajahi kolom');workflow(p,0);
 text(p,24,183,342,'Pahami aliran, lalu atur pemisahan.',14,C.muted,'Regular',24);
 const d=card(p,24,223,342,357,'Process / Interactive column');
 pill(d,16,14,148,'DISTILASI BINER');text(d,237,19,88,'q = 1',12,C.teal,'Semibold',22,'right');
 columnDiagram(d,18,43,1,false);
 hotspot(d,25,169,118,58,'03 Data kasus','Feed → input');hotspot(d,228,96,105,91,'03 Data kasus','Distillate → input');
 const info=box(p,24,597,342,73,C.mint,14,null,'Model / Research profile');icon(info,13,13,'info',C.teal,24);text(info,49,10,275,'Model biner ideal',13,C.tealDark,'Semibold',23);text(info,49,34,275,'α konstan · CMO · umpan cair jenuh',11,C.tealDark,'Regular',22);
 button(p,24,690,342,'Lanjut ke data kasus','03 Data kasus');nav(p);
}
// 03 — Input
{
 const p=screen('03 Data kasus',2,0);header(p,'Parameter proses','Siapkan pemisahan','02 Proses');workflow(p,1);
 const toggle=box(p,24,180,342,38,'#E6EEF0',12,null,'Profile selector');rect(toggle,3,3,218,32,C.white,10);text(toggle,11,9,205,'Penelitian · q = 1',12,C.teal,'Semibold',22,'center');text(toggle,225,9,107,'Umum',12,C.muted,'Regular',22,'center');
 const method=box(p,24,232,342,38,C.white,12,C.border,'Method selector');rect(method,3,3,167,32,C.mint,10);text(method,4,9,166,'McCabe–Thiele',12,C.teal,'Semibold',22,'center');text(method,174,9,163,'FUG',12,C.muted,'Regular',22,'center');
 section(p,286,'Campuran & target');input(p,24,321,106,'Umpan · zF','0,50');input(p,142,321,106,'Distilat · xD','0,95');input(p,260,321,106,'Bawah · xB','0,05');
 section(p,403,'Kondisi operasi');input(p,24,438,106,'Volatilitas · α','2,50');input(p,142,438,106,'Refluks · R','1,65');input(p,260,438,106,'Kualitas · q','1,00');
 input(p,24,516,342,'Laju umpan · F','100','kmol/jam',65);
 const info=box(p,24,599,342,64,C.mint,14,null,'Input / Domain validation');icon(info,12,16,'check',C.teal,24);text(info,47,10,280,'Parameter siap dihitung',12,C.tealDark,'Semibold',22);text(info,47,34,280,'0 < xB < zF < xD < 1  ·  α > 1',11,C.tealDark,'Regular',20);
 text(p,24,672,342,'Contoh C14 · campuran hipotetik, bukan eksperimen.',10,C.muted,'Regular',18,'center');
 button(p,24,701,342,'Hitung kolom','04 Hasil','primary','arrow',46);nav(p);
}

// Exact model geometry for the chosen sample; not an arbitrary plotted line.
function chartMcCabe(p,x,y,size){
 const g=box(p,x,y,size,size,'none',0,null,'Chart / McCabe–Thiele');
 const left=29,top=9,sz=size-43;const px=v=>left+v*sz, py=v=>top+(1-v)*sz;
 for(let i=0;i<=5;i++){const a=i/5;vec(g,0,0,`M ${px(a)} ${py(0)} L ${px(a)} ${py(1)}`,C.border,0.8,'Grid vertical');vec(g,0,0,`M ${px(0)} ${py(a)} L ${px(1)} ${py(a)}`,C.border,0.8,'Grid horizontal');text(g,px(a)-14,py(0)+7,28,a.toFixed(1),8,C.muted,'Regular',15,'center');text(g,0,py(a)-7,23,a.toFixed(1),8,C.muted,'Regular',15,'right');}
 const d=arr=>arr.map((pt,i)=>(i?'L':'M')+' '+px(pt[0]).toFixed(3)+' '+py(pt[1]).toFixed(3)).join(' ');
 const eq=Array.from({length:81},(_,i)=>{const a=i/80;return[a,2.5*a/(1+1.5*a)];});vec(g,0,0,d(eq),C.teal,2.3,'VLE / α = 2.5');
 const diag=vec(g,0,0,d([[0,0],[1,1]]),'#A8B7BE',1,'Diagonal / y = x');cmd('node.set',{ids:[ref(diag)],props:{dashes:[4,4]}});
 const z=.5,xd=.95,xb=.05,R=1.65,m=R/(R+1),b=xd/(R+1),yp=m*z+b,ms=(yp-xb)/(z-xb),bs=xb-ms*xb;
 vec(g,0,0,d([[xd,xd],[z,yp],[xb,xb]]),C.blue,1.4,'Operating lines');
 const q=vec(g,0,0,d([[z,0],[z,yp]]),C.blue,1,'q line');cmd('node.set',{ids:[ref(q)],props:{dashes:[3,3]}});
 let a=xd,v=xd;const steps=[[a,v]];for(let i=0;i<20;i++){const t=v/(2.5-1.5*v);steps.push([t,v]);if(t<xb)break;a=t;v=t>=z?m*t+b:ms*t+bs;steps.push([a,v]);}
 vec(g,0,0,d(steps),C.amber,1.9,'Stage staircase / C14');
 text(g,100,size-4,150,'x · fraksi mol cair',9,C.muted,'Regular',18,'center');
 return g;
}
// 04 — Result
{
 const p=screen('04 Hasil',3,0);header(p,'McCabe–Thiele · C14','Hasil perhitungan','03 Data kasus');workflow(p,2);
 const tabs=box(p,24,181,342,35,'none',0,null,'Result tabs');
 ['Ringkasan','Grafik','Hitungan','Eksplorasi'].forEach((v,i)=>{text(tabs,i*86,4,84,v,11,i===0?C.teal:C.muted,i===0?'Semibold':'Regular',22,'center');if(i===0)rect(tabs,4,31,76,3,C.teal,2);if(i===3)hotspot(tabs,i*86,0,84,35,'05 Sensitivitas');});
 const m=box(p,24,231,342,112,C.navy,18,null,'Result / Stages');
 text(m,16,13,180,'TAHAP YANG DIPERLUKAN',9.5,'#C5DADC','Semibold',18);text(m,15,32,90,'12',43,C.white,'Bold',60);text(m,84,60,120,'tahap teoritis',11,'#C5DADC','Regular',22);
 rect(m,221,19,1,76,'#47616D',0);text(m,240,17,85,'N desimal',10,'#C5DADC','Regular',18);text(m,240,39,92,'11,6748',18,C.white,'Semibold',29);text(m,240,73,85,'Rmin  1,10',10,'#C5DADC','Regular',18);
 const c=card(p,24,357,342,329,'Result / Equilibrium chart');
 text(c,15,12,215,'Diagram McCabe–Thiele',14,C.ink,'Semibold',24);pill(c,263,11,64,'C14',C.mint,C.teal);
 chartMcCabe(c,13,43,242);
 // Legend is beside the plot's upper right, compact but readable.
 const legend=box(c,255,99,73,75,C.white,9,C.border,'Legend');[['VLE',C.teal],['Operasi',C.blue],['Tahap',C.amber]].forEach(([t,col],i)=>{rect(legend,7,15+i*20,11,2,col,1);text(legend,24,6+i*20,47,t,9,C.muted,'Regular',18);});
 text(c,16,303,310,'Umpan: tahap 6  ·  R = 1,65  ·  D/B = 50/50',10,C.muted,'Regular',18);
 button(p,24,703,164,'Simpan studi','07 Riwayat','primary','save',43);button(p,202,703,164,'Sensitivitas','05 Sensitivitas','secondary','chart',43);
 nav(p);
}

require('./secondary.cjs')(k);

// 08 — Methodology
{
 const p=screen('08 Metodologi',3,1);header(p,'Dasar perhitungan','Kenali modelnya',null);
 text(p,24,122,342,'Dua metode, satu tujuan:\nmemahami pemisahan biner.',24,C.ink,'Bold',75);
 const c=card(p,24,216,342,166,'Methodology / McCabe');pill(c,16,15,101,'METODE 01');text(c,16,53,308,'McCabe–Thiele',19,C.ink,'Semibold',30);text(c,16,88,308,'Kurva kesetimbangan dan garis operasi\nmenjelaskan kebutuhan tahap secara grafis.',12,C.muted,'Regular',44);text(c,16,138,308,'y = αx / [1 + (α − 1)x]',13,C.teal,'Semibold',24);
 const f=card(p,24,397,342,146,'Methodology / FUG');pill(f,16,15,101,'METODE 02',C.blueBg,C.blue);text(f,16,52,310,'Fenske–Underwood–Gilliland',16,C.ink,'Semibold',26);text(f,16,89,308,'Nmin → Rmin → estimasi jumlah tahap.\nPendekatan awal dengan korelasi empiris.',12,C.muted,'Regular',44);
 const a=box(p,24,559,342,106,C.mint,16,null,'Methodology / Assumptions');text(a,16,13,310,'Asumsi & konvensi',13,C.tealDark,'Semibold',23);text(a,16,43,310,'Biner ideal · α konstan · CMO\nReboiler termasuk tahap.\nKondensor total tidak dihitung.',11,C.tealDark,'Regular',54);
 button(p,24,688,342,'Lihat acuan verifikasi','06 Verifikasi','secondary','shield',48);
 nav(p,'Metodologi');
}

// A second page: reusable native components, typography and colour tokens.
cmd('page.add',{name:'02 · Sistem desain'},'systemPage');
cmd('page.setBackground',{color:'#E6EEF1'});
const sys=box(null,0,0,1120,980,C.bg,24,null,'DistiLab / Design system');
text(sys,40,34,1000,'DistiLab — Sistem desain',34,C.ink,'Bold',52);
text(sys,40,92,1000,'Komponen native yang bisa diedit  ·  grid 8 px  ·  radius 12–20 px  ·  Segoe UI',15,C.muted,'Regular',26);
text(sys,40,150,1000,'01   WARNA',12,C.teal,'Bold',24);
[['Navy',C.navy],['Teal',C.teal],['Mint',C.mint],['Canvas',C.bg],['Teks',C.ink],['Garis',C.border]].forEach(([name,color],i)=>{rect(sys,40+i*174,191,154,78,color,14,C.border,name);text(sys,40+i*174,283,154,name,14,C.ink,'Semibold',23);text(sys,40+i*174,310,154,color,12,C.muted,'Regular',21);});
text(sys,40,367,450,'02   TIPOGRAFI',12,C.teal,'Bold',24);
text(sys,40,407,450,'Dari proses ke pemahaman.',30,C.ink,'Bold',50);
text(sys,40,471,450,'Judul layar / 22 Semibold',22,C.ink,'Semibold',35);
text(sys,40,521,450,'Isi / 14 Regular · tinggi baris 20',14,C.muted,'Regular',25);
text(sys,40,557,450,'LABEL / 11 SEMIBOLD',11,C.teal,'Semibold',20);
text(sys,580,367,470,'03   KOMPONEN',12,C.teal,'Bold',24);
const b=button(sys,580,411,400,'Hitung kolom',null,'primary','arrow');cmd('component.create',{ids:[ref(b)]});
const b2=button(sys,580,477,400,'Ekspor hasil',null,'secondary','download');cmd('component.create',{ids:[ref(b2)]});
const inp=input(sys,580,545,190,'Refluks · R','1,65');cmd('component.create',{ids:[ref(inp)]});
const mt=metric(sys,790,545,190,'12','Jumlah tahap','tahap teoritis');cmd('component.create',{ids:[ref(mt)]});
pill(sys,580,663,120,'Model ideal');pill(sys,718,663,150,'Cocok acuan kode');pill(sys,887,663,150,'Perlu perhatian',C.amberBg,C.amber);
text(sys,40,670,450,'04   PERILAKU PROTOTIPE',12,C.teal,'Bold',24);
text(sys,40,715,450,'Beranda → Proses → Data → Hasil\nHasil → Sensitivitas / Riwayat\nNavigasi bawah → Beranda / Riwayat / Metodologi',14,C.muted,'Regular',87);
const notes=box(sys,580,735,460,179,C.white,18,C.border,'Notes / Handoff');
text(notes,20,16,420,'Catatan implementasi',17,C.ink,'Semibold',28);
text(notes,20,57,420,'• Area sentuh utama minimal 44 px\n• Warna grafik dibedakan juga lewat bentuk garis\n• Nilai desimal Indonesia; CSV memakai angka asli\n• Contoh C14; bukan hasil eksperimen\n• Ekspor & simpan di aplikasi perlu integrasi nyata',12,C.muted,'Regular',108);

// Wire navigation after every screen exists; never point at missing frames.
for(const [id,dest] of links){if(!frames[dest])throw Error('Unknown navigation target '+dest);cmd('proto.interaction.add',{id:ref(id),dest:ref(frames[dest])});}
cmd('page.select',{index:0});
cmd('proto.settings',{device:'Custom size',width:390,height:844,background:C.navy});
cmd('proto.flow.add',{start:ref(frames['01 Beranda']),name:'DistiLab · Studi distilasi biner'});
cmd('select.set',{ids:[ref(frames['01 Beranda'])]});
cmd('view.zoomFit',{});
// The installed CLI predates symbolic step references. Resolve aliases to
// deterministic document ids (the initial page is 1) before submitting.
let nextNativeId=2;const nativeIds={};
for(const step of commands){if(step.as && ['node.create','page.add'].includes(step.command))nativeIds[step.as]=nextNativeId++;}
function resolve(value){
 if(Array.isArray(value))return value.map(resolve);
 if(value && typeof value==='object'){
  if(value.$ref){if(!nativeIds[value.$ref])throw Error('Unresolved '+value.$ref);return nativeIds[value.$ref];}
  return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,resolve(v)]));
 }return value;
}
const nativeCommands=commands.map(step=>({command:step.command,params:resolve(step.params)}));
fs.writeFileSync(path.join(out,'DistiLab-Desain.commands.json'),JSON.stringify(nativeCommands,null,2));
fs.writeFileSync(path.join(out,'design-manifest.json'),JSON.stringify({name:'DistiLab — Desain Mobile & Prototype',screens:Object.keys(frames),commands:commands.length,prototypeLinks:links.length,frameSize:{width:390,height:844},colors:C,font:'Segoe UI',sample:'C14 · hypothetical binary model',scope:'Design and connected navigation prototype; not a replacement for the calculation engine.'},null,2));
console.log(JSON.stringify({commands:commands.length,prototypeLinks:links.length,out},null,2));
