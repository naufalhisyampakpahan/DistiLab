const fs=require('fs'),path=require('path');
const src=path.join(__dirname,'build-design.cjs');
process.env.DISTILAB_DESIGN_OUT=path.join(__dirname,'generated'); require(src);
const light=JSON.parse(fs.readFileSync(path.join(process.env.DISTILAB_DESIGN_OUT,'DistiLab-Desain.commands.json')));
let n=2;const nodes=new Map();for(const c of light){if(c.command==='node.create'||c.command==='page.add'){nodes.set(n,c);n++;}}
const darkPage=n,offset=darkPage-1;
const palette={'#15374B':'#203A4D','#087F75':'#61D9C7','#05645D':'#8AE3D3','#E4F3EE':'#163D38','#F5F8F9':'#0D141C','#183445':'#E6EDF3','#6A7E89':'#A5B7C5','#596F7C':'#A5B7C5','#DFE8ED':'#344554','#D58C31':'#F3B95F','#FFF1D9':'#3A2D19','#397CB4':'#80BFFF','#EAF2FA':'#1B3048','#B85050':'#FF9999','#E6EEF1':'#080E15','#E6EEF0':'#223240','#EFF8F4':'#163D38','#A8B7BE':'#7993A6','#2C5B67':'#2C5B67'};
function recolor(v,type,key){if(Array.isArray(v))return v.map(x=>recolor(x,type,key));if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,recolor(x,type,k)]));if(typeof v==='string'){if(v==='#FFFFFF')return ['text','vector'].includes(type)?'#FFFFFF':'#18232E';return palette[v.toUpperCase()]||v;}return v;}
function remap(v,key){if(Array.isArray(v))return v.map(x=>remap(x,key==='ids'?'id':key));if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,remap(x,k)]));return typeof v==='number'&&['id','parent','dest','start'].includes(key)?v+offset:v;}
const lightControl=[...nodes].find(([id,c])=>c.params.name==='Theme / Terang')[0];
const dark=light.map(c=>{const d=structuredClone(c); d.params=remap(recolor(d.params,d.params.type),'');
if(d.command==='node.set' && d.params.ids?.includes(lightControl+offset) && d.params.props.visible===false)d.params.props.visible=true;
if(d.command==='page.rename')d.params.name='03 · Layar gelap';
if(d.command==='page.add')d.params.name='04 · Sistem desain gelap';
if(d.command==='page.select')d.params.index=2;
if(d.command==='proto.flow.add')d.params.name='DistiLab · Mode gelap';
if(d.command==='node.create'){
const p=d.params;
if(p.name==='Theme / Gelap'){p.props.visible=false;}
if(p.name==='Theme / Terang'){p.props.visible=true;p.props.fill='#18232E';p.props.stroke='#344554';}
if(p.text==='Gelap'){p.props.fill='#61D9C7';}
if(p.text==='Terang'){p.props.fill='#A5B7C5';}
if(p.text==='DistiLab — Sistem desain')p.text='DistiLab — Sistem desain gelap';
if(p.text==='DESAIN SIAP EDIT')p.text='MODE GELAP';
if(p.text&&palette[p.text.toUpperCase()])p.text=palette[p.text.toUpperCase()];
// Keep white labels on solid teal buttons; brighten teal only as ink or outlines.
if(p.props.fill==='#61D9C7'&&p.type==='frame')p.props.fill='#087F75';
}
return d;}).filter(c=>c.command!=='file.rename');
const find=name=>[...nodes].find(([id,c])=>c.params.name===name)[0];
const home=find('01 Beranda'),switchLight=find('Theme / Terang'),switchDark=find('Theme / Gelap');
const combined=[...light,{command:'page.add',params:{name:'03 · Layar gelap'}},...dark,
{command:'proto.interaction.add',params:{id:switchDark,dest:home+offset}},
{command:'proto.interaction.add',params:{id:switchLight+offset,dest:home}},
{command:'file.rename',params:{name:'DistiLab — UI Revisi · Terang & Gelap'}},
{command:'page.select',params:{index:0}},{command:'select.set',params:{ids:[home]}},{command:'view.zoomFit',params:{}}];
fs.writeFileSync(path.join(__dirname,'DistiLab-Desain.commands.json'),JSON.stringify(combined));

console.log(JSON.stringify({home,darkHome:home+offset,darkPage,nodes:2*(n-2),commands:combined.length}));



const cli=process.env.FIGCRAFT_CLI || (process.platform==='win32' ? 'C:/Program Files/FigCraft/figcraft-cli.exe' : 'figcraft-cli');
const result=require('node:child_process').spawnSync(cli,['run',path.join(__dirname,'DistiLab-Desain.commands.json'),'--out',path.resolve(__dirname,'../DistiLab-Desain.figcraft')],{stdio:'inherit'});if(result.error)throw result.error;process.exitCode=result.status;
