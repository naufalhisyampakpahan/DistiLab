const C = {navy:'#15374B', teal:'#087F75', tealDark:'#05645D', mint:'#E4F3EE', bg:'#F5F8F9', white:'#FFFFFF', ink:'#183445', muted:'#6A7E89', border:'#DFE8ED', amber:'#D58C31', amberBg:'#FFF1D9', blue:'#397CB4', blueBg:'#EAF2FA', red:'#B85050'};
function createKit() {
 const commands=[], links=[], frames={}; let serial=0;
 const ref=id=>({$ref:id});
 const cmd=(command,params,as)=>commands.push({command,params,...(as?{as}:{})});
 function node(type,parent,x,y,w,h,name,props={},text,path) {
  const id='n'+(++serial); const params={type,name,x,y,width:w,height:h,select:false,props};
  if(parent) params.parent=ref(parent); if(text!==undefined)params.text=text; if(path)params.path=path;
  cmd('node.create',params,id); return id;
 }
 const rect=(p,x,y,w,h,fill=C.white,r=14,stroke=null,name='Surface')=>node('rectangle',p,x,y,w,h,name,{fill,cornerRadius:r,...(stroke?{stroke,strokeWeight:1}:{})});
 const box=(p,x,y,w,h,fill=C.white,r=16,stroke=null,name='Card')=>node('frame',p,x,y,w,h,name,{fill,cornerRadius:r,clip:false,...(stroke?{stroke,strokeWeight:1}:{})});
 function text(p,x,y,w,str,size=14,color=C.ink,style='Regular',h=undefined,align='left'){
  const height=h??Math.ceil(size*1.5);
  const id=node('text',p,x,y,w,height,str.slice(0,64),{fill:color,fontFamily:'Segoe UI',fontStyle:style,fontSize:size,lineHeight:Math.ceil(size*1.4),textAutoResize:'none',textAlign:align},str);
  // Older FigCraft builds initially measure text before the final font props.
  // Apply the authored bounds afterwards so selection and editing boxes fit.
  cmd('node.set',{ids:[ref(id)],props:{width:w,height}});return id;
 }
 function path(p,x,y,d,color=C.teal,weight=1.8,name='Vector',fill='none') {
  const id='n'+(++serial);cmd('node.create',{type:'vector',parent:ref(p),x,y,name,path:d,select:false,props:{fill,stroke:color,strokeWeight:weight,strokeCap:'round',strokeJoin:'round'}},id);return id;
 }
 function icon(p,x,y,type,color=C.teal,size=22) {
  const g=box(p,x,y,size,size,'none',0,null,'Icon / '+type); const s=size/24;
  const paths={arrow:'M 5 12 L 19 12 M 14 7 L 19 12 L 14 17',back:'M 15 5 L 8 12 L 15 19',plus:'M 12 5 L 12 19 M 5 12 L 19 12',check:'M 5 12 L 10 17 L 19 7',home:'M 3 11 L 12 3 L 21 11 M 5 10 L 5 21 L 10 21 L 10 15 L 14 15 L 14 21 L 19 21 L 19 10',history:'M 3 10 A 9 9 0 1 1 5 19 M 3 4 L 3 10 L 9 10 M 12 7 L 12 12 L 16 14',book:'M 12 5 C 7 2 3 3 3 3 L 3 19 C 7 18 10 19 12 21 C 15 19 18 18 21 19 L 21 3 C 17 3 14 3 12 5 L 12 21',chart:'M 4 3 L 4 21 L 22 21 M 7 16 L 11 11 L 15 14 L 21 6',search:'M 15.5 15.5 L 21 21 M 17 10 A 7 7 0 1 1 3 10 A 7 7 0 1 1 17 10',download:'M 12 3 L 12 15 M 7 10 L 12 15 L 17 10 M 4 17 L 4 21 L 20 21 L 20 17',dots:'M 5 12 L 5.1 12 M 12 12 L 12.1 12 M 19 12 L 19.1 12',flask:'M 9 3 L 15 3 M 10 3 L 10 10 L 4 20 L 4 21 L 20 21 L 20 20 L 14 10 L 14 3 M 7 15 L 17 15',layers:'M 3 8 L 12 3 L 21 8 L 12 13 Z M 3 13 L 12 18 L 21 13 M 3 18 L 12 23 L 21 18',shield:'M 12 2 L 21 6 L 20 14 C 19 18 16 21 12 23 C 8 21 5 18 4 14 L 3 6 Z M 8 12 L 11 15 L 16 9',save:'M 5 3 L 18 3 L 21 6 L 21 21 L 3 21 L 3 3 Z M 7 3 L 7 9 L 17 9 L 17 3 M 7 21 L 7 14 L 17 14 L 17 21',info:'M 12 8 L 12 8.1 M 12 11 L 12 17 M 22 12 A 10 10 0 1 1 2 12 A 10 10 0 1 1 22 12',compare:'M 8 4 L 8 20 M 3 9 L 8 4 L 13 9 M 16 20 L 16 4 M 11 15 L 16 20 L 21 15',wifi:'M 3 8 C 8 3 16 3 21 8 M 6 12 C 10 8 14 8 18 12 M 9 16 C 11 14 13 14 15 16 M 12 20 L 12.1 20'};
  // Every path is authored at a 24 px grid; the frame is metadata only.
  path(g,0,0,paths[type]||paths.chart,color,1.8,'Stroke / '+type);return g;
 }
 function pill(p,x,y,w,label,fill=C.mint,color=C.teal){const g=box(p,x,y,w,26,fill,13,null,label);text(g,0,4,w,label,11,color,'Semibold',18,'center');return g;}
 function button(p,x,y,w,label,target,kind='primary',ico='arrow',h=48){
  const primary=kind==='primary', secondary=kind==='secondary';
  const g=box(p,x,y,w,h,primary?C.teal:secondary?C.white:C.mint,13,secondary?C.border:null,'Button / '+label);
  const color=primary?C.white:C.teal;
  text(g,ico?18:0,(h-22)/2,w-(ico?52:0),label,14,color,'Semibold',22,ico?'left':'center');
  if(ico) icon(g,w-36,(h-24)/2,ico,color,24);
  if(target)links.push([g,target]); return g;
 }
 function status(p){text(p,24,14,70,'9:41',13,C.ink,'Semibold',20);path(p,306,17,'M 0 8 L 0 6 M 4 8 L 4 4 M 8 8 L 8 2 M 12 8 L 12 0',C.ink,2);path(p,327,18,'M 0 2 Q 6 -3 12 2 M 3 5 Q 6 2 9 5 M 6 8 L 6.1 8',C.ink,1.5);rect(p,348,18,19,10,'none',3,C.ink,'Battery');rect(p,351,21,13,4,C.ink,1);rect(p,369,21,2,4,C.ink,1);}
 function screen(key,col,row){const name=key; const p=node('frame',null,col*458,180+row*956,390,844,name,{fill:C.bg,cornerRadius:28,clip:true});frames[key]=p;status(p);return p;}
 function header(p,kicker,title,back='01 Beranda'){
  if(back){const b=box(p,20,52,36,36,C.white,12,C.border,'Back');icon(b,6,6,'back',C.ink,24);links.push([b,back]);}
  text(p,back?68:24,50,280,kicker.toUpperCase(),10,C.teal,'Bold',16);
  text(p,back?68:24,69,300,title,22,C.ink,'Bold',33);
 }
 function nav(p,active='Beranda'){
  const g=box(p,0,764,390,80,C.white,0,null,'Navigation / Bottom');rect(g,0,0,390,1,C.border,0);
  const items=[['Beranda','home','01 Beranda'],['Riwayat','history','07 Riwayat'],['Metodologi','book','08 Metodologi']];
  items.forEach(([label,ico,dest],i)=>{const n=box(g,i*130,5,130,57,'none',0,null,'Nav / '+label);if(label===active)rect(n,36,2,58,31,C.mint,16);icon(n,53,5,ico,label===active?C.teal:C.muted,24);text(n,0,35,130,label,10,label===active?C.teal:C.muted,label===active?'Semibold':'Regular',17,'center');links.push([n,dest]);});rect(g,137,70,116,4,C.ink,2);
 }
 function workflow(p,active){
  const g=box(p,24,116,342,48,C.white,14,C.border,'Workflow');
  ['Proses','Data','Hasil'].forEach((v,i)=>{const selected=i===active; const n=box(g,4+i*112,4,110,40,selected?C.mint:'none',11,null,v);text(n,10,11,20,String(i+1).padStart(2,'0'),10,selected?C.teal:C.muted,'Bold',18);text(n,34,9,72,v,12,selected?C.teal:C.muted,selected?'Semibold':'Regular',22);links.push([n,['02 Proses','03 Data kasus','04 Hasil'][i]]);});
 }
 function card(p,x,y,w,h,name){return box(p,x,y,w,h,C.white,18,C.border,name);}
 function input(p,x,y,w,label,value,unit='',height=62){const g=box(p,x,y,w,height,C.white,12,C.border,'Input / '+label);text(g,12,8,w-24,label,10,C.muted,'Semibold',17);text(g,12,28,w-24,value,18,C.ink,'Semibold',26);if(unit)text(g,w-81,34,69,unit,10,C.muted,'Regular',17,'right');return g;}
 function metric(p,x,y,w,value,label,unit='',color=C.ink,h=94){const g=card(p,x,y,w,h,'Metric / '+label);text(g,14,10,w-28,label,10,C.muted,'Semibold',18);text(g,14,31,w-28,value,29,color,'Bold',42);if(unit)text(g,14,71,w-28,unit,10,C.muted,'Regular',16);return g;}
 function section(p,y,title,action=''){text(p,24,y,250,title,16,C.ink,'Semibold',25);if(action)text(p,276,y+3,90,action,11,C.teal,'Semibold',19,'right');}
 function hotspot(p,x,y,w,h,target,name='Hotspot'){const id=box(p,x,y,w,h,'none',0,null,name);links.push([id,target]);return id;}
 return {C,commands,links,frames,ref,cmd,node,rect,box,text,path,icon,pill,button,screen,header,nav,workflow,card,input,metric,section,hotspot};
}
module.exports={createKit,C};
