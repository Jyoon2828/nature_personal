(async()=>{
const $=id=>document.getElementById(id);let objects=[],selected=null,mode='select',history=[],future=[],drag=null;const images=[];

const toast=t=>{ $('toast').textContent=t;$('toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').style.display='none',3500)};
const safe=async f=>{try{await f()}catch(e){console.error(e);toast(e.message||'연결을 확인해 주세요.')}};
const names=['초록 잎','버들잎','단풍잎','은행잎','붉은 잎','갈색 잎','고사리','둥근 잎','회색 돌','얼룩 돌','베이지 돌','흰 돌','검은 돌','갈색 돌','작은 돌','긴 돌','노란 자작나무 낙엽','주황 느티나무 낙엽'];
await Promise.all(Array.from({length:18},(_,i)=>new Promise(resolve=>{const im=new Image();im.onload=()=>{images[i]=im;resolve()};im.onerror=resolve;im.src=`assets/material-${String(i+1).padStart(2,'0')}.png?v=materials3`})));
function palette(filter='all'){ $('materials').replaceChildren();images.forEach((im,i)=>{if((filter==='leaf'&&i>=8&&i<16)||(filter==='stone'&&(i<8||i>=16)))return;const b=document.createElement('button');b.title=names[i];const img=im.cloneNode();img.alt=names[i];img.draggable=true;img.ondragstart=e=>e.dataTransfer.setData('text/plain',String(i));b.append(img);b.onclick=()=>add(i,500,350);$('materials').append(b)})}palette();
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>palette(b.dataset.filter));
const canvas=$('canvas'),ctx=canvas.getContext('2d');const position=(e,c=canvas)=>{const r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height}};
function stash(){history.push(JSON.stringify(objects));if(history.length>40)history.shift();future=[]}
function persist(){try{localStorage.setItem('nature-personal-draft-v1',JSON.stringify({objects,title:$('title').value,description:$('description').value,paper:$('paper').value,paperColor:$('paperColor').value,includeCaption:$('includeCaption').checked}))}catch{toast('자동 저장 공간이 부족합니다. PNG로 저장하세요.')}}
function render(target=ctx,list=objects,selection=true){target.clearRect(0,0,target.canvas.width,target.canvas.height);for(const o of list){target.save();if(o.kind==='image'){target.translate(o.x,o.y);target.rotate(o.angle||0);target.scale(o.flip?-1:1,1);if(images[o.asset])target.drawImage(images[o.asset],-o.w/2,-o.h/2,o.w,o.h);if(selection&&o.id===selected){target.strokeStyle='#38816b';target.lineWidth=2;target.setLineDash([8,5]);target.strokeRect(-o.w/2,-o.h/2,o.w,o.h)}}else{target.globalCompositeOperation=o.erase?'destination-out':'source-over';target.lineCap='round';target.lineJoin='round';target.strokeStyle=o.color;target.lineWidth=o.width;target.beginPath();o.points.forEach((p,i)=>i?target.lineTo(p.x,p.y):target.moveTo(p.x,p.y));if(o.points.length===1)target.lineTo(o.points[0].x+.01,o.points[0].y);target.stroke()}target.restore()}}
function changed(){render();persist()}
function add(i,x,y){if(objects.length>=250)return toast('재료가 많아요. 사용하지 않는 재료를 지워 주세요.');const im=images[i];if(!im)return toast('재료를 불러오지 못했어요.');stash();const o={kind:'image',id:crypto.randomUUID(),asset:i,x,y,w:180,h:180*im.height/im.width,angle:0};objects.push(o);selected=o.id;setMode('select');changed()}
function hit(p,o){if(o.kind!=='image')return false;const dx=p.x-o.x,dy=p.y-o.y,a=-(o.angle||0);return Math.abs(dx*Math.cos(a)-dy*Math.sin(a))<o.w/2&&Math.abs(dx*Math.sin(a)+dy*Math.cos(a))<o.h/2}
function setMode(m){finish();mode=m;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===m))}document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
const activePointers=new Map();let gesture=null;
function pairGeometry(){const [a,b]=[...activePointers.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)),angle:Math.atan2(b.y-a.y,b.x-a.x)}}
function rebaseGesture(){if(!drag||drag.o.kind!=='image')return;if(activePointers.size>=2){const g=pairGeometry(),o=drag.o;gesture={...g,ox:o.x,oy:o.y,w:o.w,h:o.h,rotation:o.angle||0}}else{gesture=null;const p=[...activePointers.values()][0];if(p){drag.x=p.x-drag.o.x;drag.y=p.y-drag.o.y}}}
canvas.onpointerdown=e=>{
 e.preventDefault();if(e.button!==undefined&&e.button!==0)return;
 if(activePointers.size>=2)return;
 const p=position(e);activePointers.set(e.pointerId,p);canvas.setPointerCapture(e.pointerId);
 if(activePointers.size>1){if(mode==='select')rebaseGesture();return;}
 if(mode==='select'){const o=[...objects].reverse().find(o=>hit(p,o));selected=o?.id||null;if(o){stash();drag={o,x:p.x-o.x,y:p.y-o.y};}render();}
 else{if(objects.length>=250)return toast('그림이 많아요. 일부를 지워 주세요.');stash();const o={kind:'path',id:crypto.randomUUID(),points:[p],color:$('color').value,width:Number($('brush').value),erase:mode==='eraser'};objects.push(o);drag={o,pointer:e.pointerId};render();}
};
canvas.onpointermove=e=>{
 if(!activePointers.has(e.pointerId))return;e.preventDefault?.();const p=position(e);activePointers.set(e.pointerId,p);if(!drag)return;
 if(drag.o.kind==='image'){
  const o=drag.o;
  if(gesture&&activePointers.size>=2){
   const g=pairGeometry();const delta=Math.atan2(Math.sin(g.angle-gesture.angle),Math.cos(g.angle-gesture.angle));
   const scale=Math.max(35/Math.min(gesture.w,gesture.h),Math.min(700/Math.max(gesture.w,gesture.h),g.d/gesture.d));
   const dx=gesture.ox-gesture.x,dy=gesture.oy-gesture.y;
   o.x=Math.max(0,Math.min(1000,g.x+scale*(dx*Math.cos(delta)-dy*Math.sin(delta))));
   o.y=Math.max(0,Math.min(700,g.y+scale*(dx*Math.sin(delta)+dy*Math.cos(delta))));
   o.w=gesture.w*scale;o.h=gesture.h*scale;o.angle=gesture.rotation+delta;
  }else{o.x=Math.max(0,Math.min(1000,p.x-drag.x));o.y=Math.max(0,Math.min(700,p.y-drag.y));}
 }else if(e.pointerId===drag.pointer&&drag.o.points.length<2000)drag.o.points.push(p);
 render();
};
function finish(e){
 if(!e){activePointers.clear();gesture=null;if(drag){drag=null;changed();}return;}
 if(!activePointers.has(e.pointerId))return;activePointers.delete(e.pointerId);
 if(drag?.o.kind==='path'&&e.pointerId===drag.pointer){drag=null;gesture=null;changed();}
 else if(activePointers.size&&drag?.o.kind==='image')rebaseGesture();
 else if(!activePointers.size){gesture=null;if(drag){drag=null;changed();}}
}
canvas.onpointerup=finish;canvas.onpointercancel=finish;canvas.onlostpointercapture=finish;
canvas.ondragover=e=>e.preventDefault();canvas.ondrop=e=>{e.preventDefault();const i=Number(e.dataTransfer.getData('text/plain'));if(Number.isInteger(i)&&i>=0&&i<18){const p=position(e);add(i,p.x,p.y)}};
function alter(f){const o=objects.find(o=>o.id===selected);if(!o)return toast('먼저 재료를 선택하세요.');stash();f(o);changed()}
$('smaller').onclick=()=>alter(o=>{o.w=Math.max(35,o.w*.85);o.h=Math.max(35,o.h*.85)});$('bigger').onclick=()=>alter(o=>{o.w=Math.min(700,o.w*1.15);o.h=Math.min(700,o.h*1.15)});$('rotate').onclick=()=>alter(o=>o.angle+=Math.PI/12);$('flip').onclick=()=>alter(o=>o.flip=!o.flip);$('front').onclick=()=>alter(o=>{objects=objects.filter(v=>v!==o);objects.push(o)});$('remove').onclick=()=>alter(o=>objects=objects.filter(v=>v!==o));$('clear').onclick=()=>{if(confirm('내 작업판을 모두 지울까요?')){stash();objects=[];changed()}};
$('undo').onclick=()=>{if(history.length){future.push(JSON.stringify(objects));objects=JSON.parse(history.pop());selected=null;changed()}};$('redo').onclick=()=>{if(future.length){history.push(JSON.stringify(objects));objects=JSON.parse(future.pop());selected=null;changed()}};
function png(){return exportCanvas().toDataURL('image/png')}
function download(c,file){const a=document.createElement('a');a.download=file+'.png';a.href=typeof c==='string'?c:c.toDataURL('image/png');a.click()}
$('download').onclick=()=>{if(!objects.length)return toast('먼저 생물을 만들어 주세요.');download(png(),($('title').value||'나의-생물').replace(/[\\/:*?"<>|]/g,'-'));toast('이미지를 저장했어요. 다운로드 폴더에서 확인하세요.')};$('title').oninput=persist;$('description').oninput=persist;

function applyPaper(){const color=$('paper').value==='custom'?$('paperColor').value:$('paper').value;canvas.style.background=color==='transparent'?'repeating-conic-gradient(#eff1ec 0% 25%, white 0% 50%) 0 / 20px 20px':color;persist()}
$('paper').onchange=()=>{$('paperColor').value=$('paper').value==='transparent'?'#ffffff':$('paper').value==='custom'?$('paperColor').value:$('paper').value;applyPaper()};
const opt=document.createElement('option');opt.value='custom';opt.textContent='내가 고른 색';$('paper').append(opt);
$('paperColor').oninput=()=>{$('paper').value='custom';applyPaper()};$('includeCaption').onchange=persist;
function wrapText(t,text,maxWidth){const rows=[];let line='';for(const ch of text){if(ch==='\n'){rows.push(line);line='';continue}if(t.measureText(line+ch).width>maxWidth&&line){rows.push(line);line=ch}else line+=ch}if(line)rows.push(line);return rows}
function exportCanvas(){const c=document.createElement('canvas'),a=document.createElement('canvas');a.width=1000;a.height=700;render(a.getContext('2d'),objects,false);c.width=1600;const withCaption=$('includeCaption').checked&&($('title').value.trim()||$('description').value.trim());const t=c.getContext('2d');t.font='28px sans-serif';const lines=wrapText(t,$('description').value.trim(),1480);c.height=1120+(withCaption?110+lines.length*40:0);const paper=$('paper').value==='custom'?$('paperColor').value:$('paper').value;if(paper!=='transparent'){t.fillStyle=paper;t.fillRect(0,0,c.width,c.height)}t.drawImage(a,0,0,1600,1120);if(withCaption){t.fillStyle='#ffffff';t.fillRect(0,1120,1600,c.height-1120);t.fillStyle='#263f33';t.font='bold 38px sans-serif';t.fillText($('title').value.trim(),60,1180);t.font='28px sans-serif';lines.forEach((line,i)=>t.fillText(line,60,1225+i*40))}return c}
$('help').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=()=>$('helpDialog').close();
try{const draft=JSON.parse(localStorage.getItem('nature-personal-draft-v1')||'null');if(draft&&Array.isArray(draft.objects)){objects=draft.objects;$('title').value=draft.title||'';$('description').value=draft.description||'';$('paper').value=draft.paper||'#ffffff';$('paperColor').value=draft.paperColor||'#ffffff';$('includeCaption').checked=draft.includeCaption!==false}}catch{toast('임시 저장 자료를 불러오지 못했어요. 새로 만들 수 있어요.')}
applyPaper();render();$('ready').textContent=images.filter(Boolean).length===18?'나뭇잎 10종 · 돌 8종 준비 완료':'일부 재료를 불러오지 못했어요. 새로고침해 주세요.';
})();
