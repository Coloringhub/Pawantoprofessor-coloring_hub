(()=>{'use strict';
const $=(s)=>document.querySelector(s), $$=(s)=>Array.from(document.querySelectorAll(s));
const vocabJapan=[['ramen','RAH-men','Ramen is a noodle dish.'],['sushi','SOO-shee','Sushi is from Japan.'],['rice ball','RICE ball','This is a rice ball.'],['tempura','tem-POO-rah','I like crispy tempura.'],['miso soup','MEE-soh SOOP','Miso soup is warm.'],['sweet dumplings','sweet DUM-plings','These dumplings are sweet.']];
const samples=[
 {id:'japan-food',title:'Japanese Food',description:'Discover sushi, ramen and more.',country:'Japan',topic:'Food',tags:['sushi','ramen','rice','Japan'],image:'/assets/japan-food.png',editable:[16/736,254/1104,499/736,938/1104],vocabulary:vocabJapan,specialRegions:[[[90,811],[144,816],[145,869],[90,876]],[[143,786],[200,776],[198,852],[145,859]],[[197,759],[251,763],[251,836],[194,841]],[[266,735],[323,731],[324,802],[263,803]],[[364,383],[418,362],[449,415],[393,462]]].map(poly=>poly.map(([x,y])=>[x/736,y/1104]))},
 {id:'japan-festival',title:'Festival Food Stalls',description:'Street-food favorites at a Japanese festival.',country:'Japan',topic:'Festivals',tags:['takoyaki','yakisoba','festival'],image:'/assets/japan-festival.png',editable:[17/736,222/1104,495/736,951/1104],vocabulary:[['food stall','FOOD stawl','The food stall sells snacks.'],['noodles','NOO-duhlz','These are noodles.'],['festival','FES-tuh-vuhl','We go to a festival.'],['shaved ice','SHAYVD ICE','Shaved ice is cold.']]},
 {id:'japan-furin',title:'Summer Wind Chimes',description:'Discover summer sounds and wind chimes.',country:'Japan',topic:'Culture',tags:['wind','chimes','summer'],image:'/assets/japan-furin.png',editable:[18/736,192/1104,504/736,925/1104],vocabulary:[['wind chime','WIND CHIME','The wind chime rings.'],['wind','WIND','The wind is soft.'],['sound','SOWND','I hear a gentle sound.'],['cool','KOOL','The breeze feels cool.']]},
 {id:'japan-kendama',title:'Kendama Toy',description:'Play with traditional toys and games.',country:'Japan',topic:'Culture',tags:['kendama','toy','ball','game'],image:'/assets/japan-kendama.png',editable:[20/736,222/1104,481/736,873/1104],vocabulary:[['toy','TOY','This toy has a ball.'],['trick','TRIK','I can do a trick.'],['ball','BAWL','Catch the ball.'],['string','STRING','The string connects the ball.']]},
 {id:'japan-kintsugi',title:'Kintsugi Repair',description:'Beautiful repair and Japanese craft.',country:'Japan',topic:'Culture',tags:['pottery','repair','gold'],image:'/assets/japan-kintsugi.png',editable:[21/736,190/1104,485/736,871/1104],vocabulary:[['golden','GOHL-dən','The bowl has golden lines.'],['repair','rih-PAIR','We can repair the bowl.'],['bowl','BOHL','This bowl is beautiful.'],['powder','POW-der','The powder is yellow.']]},
 {id:'japan-pottery',title:'Kyoto Pottery',description:'Decorate beautiful bowls and pottery.',country:'Japan',topic:'Culture',tags:['Kyoto','ceramics','pottery','kiln'],image:'/assets/japan-pottery.png',editable:[11/736,189/1104,493/736,968/1104],vocabulary:[['pottery','POT-uh-ree','The pottery is beautiful.'],['bowl','BOHL','This is a blue bowl.'],['paint','PAYNT','I paint flowers.'],['kiln','KILN','A kiln heats pottery.']]}];
const palette=['#f45f91','#ef6351','#ff973a','#f3c749','#a5cc61','#2f9b73','#46c4b1','#72cdd7','#71a9ef','#9784dd','#9e7156','#ffffff','#424a55','#c9b0a3','#f7dadb','#101820'];
let sheets=samples.slice(), countries=['Japan','France','Taiwan'], topics=['Food','Culture','Festivals','Animals','Sports'];let current=null,sessionToken=null,sessionRefreshToken=null,sessionExpiresAt=0,refreshInFlight=null,adminStep=1,adminMode='',tempSrc=null,adminImageFile=null,prepared=false,adminTested=false,uploadImage=null;
const art={src:null,w:736,h:1104,pw:736,ph:1104,rect:[0,0,1,1],threshold:156,dilate:1,barriers:[],specialRegions:[],blocked:null,barrierMask:null,originalPixels:null,seen:null,tick:0,queue:null,tool:'bucket',color:'#2f9b73',size:18,history:[],dirty:false,pointer:false,last:null,zoom:1};
let toastTime;
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toastTime);toastTime=setTimeout(()=>e.classList.remove('show'),3600)}
function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function numClamp(v,a,b){return Math.max(a,Math.min(b,v))}
function slug(s){return String(s).toLowerCase().trim().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'item'}
function showPage(pg){if(pg!=='vocab'&&activeAudio){activeAudio.pause();activeAudio.currentTime=0;activeAudio=null}$$('.page').forEach(e=>e.classList.toggle('active',e.id==='page-'+pg));$$('.nav').forEach(e=>e.classList.toggle('active',e.dataset.page===pg));if(pg==='finish')renderFinish();if(pg==='vocab')renderVocab();if(pg==='admin')showAdmin();window.scrollTo({top:0,behavior:'instant'})}
$$('[data-page]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
function buildCategories(){const cc=$('#countryFilter'),ct=$('#topicFilter'),ac=$('#adminCountry'),at=$('#adminTopic');let prev=[cc.value,ct.value,ac.value,at.value];cc.innerHTML='<option value="">All countries</option>'+countries.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');ct.innerHTML='<option value="">All topics</option>'+topics.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');ac.innerHTML=countries.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');at.innerHTML=topics.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');[cc,ct,ac,at].forEach((e,i)=>{if(prev[i]&&[...e.options].some(x=>x.value===prev[i]))e.value=prev[i]});}
function themeColor(t){return ({forest:'#e5f7ee',sakura:'#ffeaf3',sky:'#e8f5ff',sunflower:'#fff5db'})[t]||'#e5f7ee'}
function renderLibrary(){const text=$('#searchInput').value.toLowerCase().trim(),country=$('#countryFilter').value,topic=$('#topicFilter').value;const items=sheets.filter(s=>(!country||s.country===country)&&(!topic||s.topic===topic)&&(!text||[s.title,s.country,s.topic,s.description,...(s.tags||[])].join(' ').toLowerCase().includes(text)));$('#workCount').textContent=items.length+' worksheet'+(items.length===1?'':'s');$('#libraryEmpty').hidden=items.length>0;$('#libraryCards').innerHTML=items.map(s=>`<article class="worksheet-card"><div class="card-img" style="background:${themeColor(s.theme)}"><img src="${escapeHTML(s.image)}" alt="${escapeHTML(s.title)}" loading="lazy"></div><div class="card-info"><div class="tagrow"><span class="tag">${escapeHTML(s.country)}</span><span class="tag">${escapeHTML(s.topic)}</span></div><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.description||'Choose, color and learn.')}</p><div class="card-foot"><span class="muted">Color • Listen • Download</span><button class="primary" data-opensheet="${escapeHTML(s.id)}">Color now →</button></div></div></article>`).join('');$$('[data-opensheet]').forEach(b=>b.onclick=()=>openSheet(sheets.find(s=>s.id===b.dataset.opensheet)))}
['searchInput','countryFilter','topicFilter'].forEach(id=>$('#'+id).addEventListener(id==='searchInput'?'input':'change',renderLibrary));$('#resetFilters').onclick=()=>{$('#searchInput').value='';$('#countryFilter').value='';$('#topicFilter').value='';renderLibrary()};$$('[data-demo]').forEach(b=>b.onclick=()=>openSheet(sheets.find(s=>s.id===b.dataset.demo)));
// Short English words are bundled as static audio to avoid online synthesis latency.
// Teacher-created words fall back to the device speech engine until a recorded file is added.
const readyAudio=new Map();
const bundledAudio=new Set(["ball", "bowl", "cool", "festival", "food-stall", "golden", "kiln", "miso-soup", "noodles", "paint", "pottery", "powder", "ramen", "repair", "rice-ball", "shaved-ice", "sound", "string", "sushi", "sweet-dumplings", "takoyaki", "tempura", "toy", "trick", "wind", "wind-chime"]);
let activeAudio=null;
function audioPath(word){const name=slug(word);return bundledAudio.has(name)?'/audio/en/'+name+'.mp3':null}
function preloadVocab(){
  if(!current)return;
  for(const row of current.vocabulary||[]){
    const path=audioPath(row[0]);if(!path||readyAudio.has(path))continue;
    const clip=new Audio();clip.preload='auto';clip.src=path;clip.load();readyAudio.set(path,clip);
  }
}
let deviceVoices=[];
function loadDeviceVoices(){if('speechSynthesis'in window)deviceVoices=window.speechSynthesis.getVoices()||[]}
if('speechSynthesis'in window){loadDeviceVoices();window.speechSynthesis.addEventListener?.('voiceschanged',loadDeviceVoices)}
function deviceSpeech(word){
  if(!('speechSynthesis'in window)){toast('Speech is unavailable on this browser');return}
  window.speechSynthesis.cancel();
  const phrase=new SpeechSynthesisUtterance(word);
  const local=deviceVoices.find(v=>v.lang.toLowerCase().startsWith('en')&&v.localService)||deviceVoices.find(v=>v.lang.toLowerCase().startsWith('en'));
  phrase.lang=local?.lang||'en-US';if(local)phrase.voice=local;phrase.rate=.88;phrase.pitch=1;
  window.speechSynthesis.speak(phrase);
}
async function playWord(word,button){
  if(activeAudio){activeAudio.pause();activeAudio.currentTime=0;activeAudio=null}
  if('speechSynthesis'in window)window.speechSynthesis.cancel();
  const path=audioPath(word);
  if(!path){deviceSpeech(word);return}
  let clip=readyAudio.get(path);
  if(!clip){clip=new Audio(path);clip.preload='auto';readyAudio.set(path,clip)}
  activeAudio=clip;button?.setAttribute('aria-busy','true');
  try{clip.currentTime=0;await clip.play()}
  catch(err){deviceSpeech(word);toast('Using device voice for this word')}
  finally{button?.removeAttribute('aria-busy')}
}
function renderVocab(){if(!current)return;$('#vocabHeadline').textContent=`${current.country} — ${current.title}`;$('#vocabCards').innerHTML=(current.vocabulary||[]).map(([word,hint,sentence])=>`<div class="vocabcard"><div><h3>${escapeHTML(word)}</h3><div class="phonetic">${escapeHTML(hint)}</div><p class="sentence">${escapeHTML(sentence)}</p></div><button class="sound" aria-label="Hear ${escapeHTML(word)} in English" data-say="${escapeHTML(word)}">🔊</button></div>`).join('');$$('[data-say]').forEach(b=>b.onclick=()=>playWord(b.dataset.say,b));preloadVocab()}

$('#openVocabQuick').onclick=()=>showPage('vocab');
function canvas(id,w,h){const e=$(id);e.width=w;e.height=h;return e}
function xyFromEvent(ev,elem,w=art.pw,h=art.ph){const r=elem.getBoundingClientRect();return {x:numClamp(Math.floor((ev.clientX-r.left)*w/r.width),0,w-1),y:numClamp(Math.floor((ev.clientY-r.top)*h/r.height),0,h-1)}}
function normalizedRect(){return art.rect.map((v,i)=>i%2===0?Math.round(v*art.pw):Math.round(v*art.ph))}
function inRect(x,y){const [l,t,r,b]=normalizedRect();return x>=l&&x<r&&y>=t&&y<b}
async function openSheet(s){if(!s)return;current=s;art.src=s.image;art.rect=s.editable||[0,0,1,1];art.threshold=s.threshold||156;art.dilate=s.dilate??1;art.barriers=s.barriers||[];art.specialRegions=s.specialRegions||[];art.history=[];art.dirty=false;art.zoom=1;art.tool='bucket';const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{art.w=im.naturalWidth;art.h=im.naturalHeight;let k=Math.min(1,1400/Math.max(art.w,art.h));art.pw=Math.max(1,Math.round(art.w*k));art.ph=Math.max(1,Math.round(art.h*k));$('#artOriginal').crossOrigin='anonymous';$('#artOriginal').src=s.image;canvas('#paintLayer',art.pw,art.ph);canvas('#inkLayer',art.pw,art.ph);canvas('#inputLayer',art.pw,art.ph);const wrap=$('#artStage');wrap.style.width=Math.round(Math.min(590,art.pw))*art.zoom+'px';wrap.style.height=(parseFloat(wrap.style.width)*art.ph/art.pw)+'px';buildWall(im);$('#colorTitle').textContent=`${s.country} · ${s.title}`;$('#qualityTag').textContent=`· ${art.w} × ${art.h} px`;$('[data-tool="bucket"]').click();renderVocab();showPage('color');toast('Ready! Color the illustration. Dark nori: try Tint dark ink.')};im.onerror=()=>toast('Image could not load');im.src=s.image;}
function buildWall(img){const c=document.createElement('canvas');c.width=art.pw;c.height=art.ph;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(img,0,0,art.pw,art.ph);art.originalPixels=cx.getImageData(0,0,art.pw,art.ph).data;const n=art.pw*art.ph,raw=new Uint8Array(n),[L,T,R,B]=normalizedRect();for(let y=T;y<B;y++)for(let x=L;x<R;x++){let q=y*art.pw+x,j=q*4;const r=art.originalPixels[j],g=art.originalPixels[j+1],b=art.originalPixels[j+2];const l=.3*r+.59*g+.11*b;raw[q]=(l<art.threshold&&Math.max(r,g,b)-Math.min(r,g,b)<70)?1:0}art.blocked=new Uint8Array(n);art.barrierMask=new Uint8Array(n);for(let y=T;y<B;y++)for(let x=L;x<R;x++){const i=y*art.pw+x;if(!raw[i])continue;for(let yy=Math.max(T,y-art.dilate);yy<=Math.min(B-1,y+art.dilate);yy++)for(let xx=Math.max(L,x-art.dilate);xx<=Math.min(R-1,x+art.dilate);xx++)art.blocked[yy*art.pw+xx]=1}for(const line of art.barriers){for(let k=1;k<line.length;k++){const a=line[k-1],b=line[k];lineToMask(a[0]*art.pw,a[1]*art.ph,b[0]*art.pw,b[1]*art.ph,2)}}art.seen=new Uint32Array(n);art.queue=new Int32Array(n);art.tick=0;}
function lineToMask(x1,y1,x2,y2,r){const d=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)));for(let i=0;i<=d;i++){const x=Math.round(x1+(x2-x1)*i/d),y=Math.round(y1+(y2-y1)*i/d);for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<art.pw&&yy<art.ph){art.blocked[yy*art.pw+xx]=1;art.barrierMask[yy*art.pw+xx]=1;}}}}
function history(){const a=$('#paintLayer').getContext('2d'),b=$('#inkLayer').getContext('2d');art.history.push([a.getImageData(0,0,art.pw,art.ph),b.getImageData(0,0,art.pw,art.ph)]);if(art.history.length>8)art.history.shift()}
function undo(){const z=art.history.pop();if(!z){toast('Nothing to undo');return}$('#paintLayer').getContext('2d').putImageData(z[0],0,0);$('#inkLayer').getContext('2d').putImageData(z[1],0,0);art.dirty=true;toast('Undone')}
$('#undoColor').onclick=undo;$('#resetColor').onclick=()=>{if(!confirm('Remove all colors from this worksheet?'))return;history();$('#paintLayer').getContext('2d').clearRect(0,0,art.pw,art.ph);$('#inkLayer').getContext('2d').clearRect(0,0,art.pw,art.ph);art.dirty=true;toast('Colors cleared. Original remains unchanged.')};
function parseRGB(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]}
function polygonInside(point,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];if((yi>point[1])!==(yj>point[1])&&point[0]<(xj-xi)*(point[1]-yi)/(yj-yi)+xi)inside=!inside}return inside}
function specialFill(x,y){const hit=art.specialRegions.find(poly=>polygonInside([x/art.pw,y/art.ph],poly));if(!hit)return false;history();const cx=$('#inkLayer').getContext('2d');cx.save();cx.beginPath();hit.forEach(([xx,yy],i)=>i?cx.lineTo(xx*art.pw,yy*art.ph):cx.moveTo(xx*art.pw,yy*art.ph));cx.closePath();cx.fillStyle=art.color;cx.fill();cx.restore();art.dirty=true;toast('Dark nori colored! The original ink remains underneath.');return true}
function flood(x,y){if(!inRect(x,y)){toast('This area is protected');return}if(specialFill(x,y))return;if(!art.blocked)return;let origin=y*art.pw+x;if(art.blocked[origin]){let alt=-1,best=9999;for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){const xx=x+dx,yy=y+dy,d=dx*dx+dy*dy;if(d>49||!inRect(xx,yy)||art.blocked[yy*art.pw+xx])continue;if(d<best){best=d;alt=yy*art.pw+xx}}if(alt===-1){toast('Dark area: use Tint dark ink to color black details');return}origin=alt}const [L,T,R,B]=normalizedRect(),mark=++art.tick;let head=0,tail=1;art.queue[0]=origin;art.seen[origin]=mark;const indices=[];const max=Math.floor((R-L)*(B-T)*.85);while(head<tail){const z=art.queue[head++],xx=z%art.pw,yy=(z/art.pw)|0;indices.push(z);if(indices.length>max){toast('Fill would escape the outlines. Use Brush or close the gap in Admin.');return}const tryNeighbor=n=>{if(!art.blocked[n]&&art.seen[n]!==mark){art.seen[n]=mark;art.queue[tail++]=n}};if(xx>L)tryNeighbor(z-1);if(xx<R-1)tryNeighbor(z+1);if(yy>T)tryNeighbor(z-art.pw);if(yy<B-1)tryNeighbor(z+art.pw)}if(indices.length===0)return;
// Precision Fill V2: extend the safe core only into blocked edge pixels.
// The existing mix-blend-mode:multiply keeps original black strokes intact.
const overlap=window.PTPPrecisionFillV2.expandIntoOutline({
 core:indices,blocked:art.blocked,seen:art.seen,stamp:mark,width:art.pw,
 bounds:[L,T,R,B],radius:art.dilate+1,protectedMask:art.barrierMask
});
history();const cx=$('#paintLayer').getContext('2d',{willReadFrequently:true});
const data=cx.getImageData(0,0,art.pw,art.ph),[r,g,b]=parseRGB(art.color);
for(const p of indices){const n=p*4;data.data[n]=r;data.data[n+1]=g;data.data[n+2]=b;data.data[n+3]=255}
for(const p of overlap){const n=p*4;data.data[n]=r;data.data[n+1]=g;data.data[n+2]=b;data.data[n+3]=255}
cx.putImageData(data,0,0);art.dirty=true;toast('Precision Fill: colored '+indices.length.toLocaleString()+' pixels · no white outline gap')}
function draw(a,b){const tint=art.tool==='tint',eraser=art.tool==='eraser',layer=$(tint?'#inkLayer':'#paintLayer'),cx=layer.getContext('2d');const [L,T,R,B]=normalizedRect();cx.save();cx.beginPath();cx.rect(L,T,R-L,B-T);cx.clip();cx.lineCap='round';cx.lineJoin='round';cx.lineWidth=art.size*(eraser?1.45:1);cx.globalCompositeOperation=eraser?'destination-out':'source-over';cx.strokeStyle=art.color;cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x+.01,b.y+.01);cx.stroke();if(eraser){const ink=$('#inkLayer').getContext('2d');ink.save();ink.beginPath();ink.rect(L,T,R-L,B-T);ink.clip();ink.lineCap='round';ink.lineWidth=cx.lineWidth;ink.globalCompositeOperation='destination-out';ink.beginPath();ink.moveTo(a.x,a.y);ink.lineTo(b.x+.01,b.y+.01);ink.stroke();ink.restore()}cx.restore();art.dirty=true}
const input=$('#inputLayer');input.onpointerdown=ev=>{if(ev.pointerType==='mouse'&&ev.button!==0)return;const p=xyFromEvent(ev,input);if(!inRect(p.x,p.y)){toast('The colorful border is locked');return}ev.preventDefault();if(art.tool==='bucket'){flood(p.x,p.y);return}history();art.pointer=true;art.last=p;input.setPointerCapture(ev.pointerId);draw(p,p)};input.onpointermove=ev=>{if(!art.pointer)return;ev.preventDefault();const p=xyFromEvent(ev,input);draw(art.last,p);art.last=p};const stop=ev=>{art.pointer=false;try{input.releasePointerCapture(ev.pointerId)}catch{}};input.onpointerup=stop;input.onpointercancel=stop;
$$('[data-tool]').forEach(b=>b.onclick=()=>{$$('[data-tool]').forEach(x=>x.classList.toggle('selected',x===b));art.tool=b.dataset.tool;const hints={bucket:'Precision Fill: click an enclosed area. Color reaches the black line without white gaps. Dark nori areas marked by admin are clickable.',brush:'Brush: color with a pencil-like stroke inside the selected illustration.',tint:'Tint dark ink: brush over black seaweed, sushi nori or textured details with green (or another color).',eraser:'Eraser: remove your paint and tint without changing the original.'};$('#toolHint').textContent=hints[art.tool]});
function colors(){const e=$('#palette');e.innerHTML=palette.map((hex,i)=>`<button class="swatch ${hex===art.color?'active':''}" aria-label="Choose ${hex}" data-c="${hex}" style="background:${hex}"></button>`).join('');$$('[data-c]').forEach(b=>b.onclick=()=>{art.color=b.dataset.c;$('#customColor').value=art.color;$$('[data-c]').forEach(x=>x.classList.toggle('active',x===b))})}$('#customColor').oninput=e=>{art.color=e.target.value;colors()};$('#brushSize').oninput=e=>art.size=+e.target.value;
function zoom(v){art.zoom=numClamp(art.zoom+v,.65,2.15);const w=Math.round(Math.min(590,art.pw)*art.zoom);$('#artStage').style.width=w+'px';$('#artStage').style.height=w*art.ph/art.pw+'px';$('#zoomLevel').textContent=Math.round(art.zoom*100)+'%'}$('#zoomIn').onclick=()=>zoom(.2);$('#zoomOut').onclick=()=>zoom(-.2);
function composite(out,w,h){const cx=out.getContext('2d');out.width=w;out.height=h;cx.globalCompositeOperation='source-over';cx.clearRect(0,0,w,h);cx.drawImage($('#artOriginal'),0,0,w,h);cx.globalCompositeOperation='multiply';cx.drawImage($('#paintLayer'),0,0,w,h);cx.globalCompositeOperation='screen';cx.drawImage($('#inkLayer'),0,0,w,h);cx.globalCompositeOperation='source-over'}
function renderFinish(){if(!current||!$('#artOriginal').complete)return;composite($('#finishPreview'),art.w,art.h)}
function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000)}
function resultName(ext){return 'Pawn_to_Professor_'+slug(current?.title||'Coloring')+'_'+new Date().toISOString().slice(0,10)+'.'+ext}
$('#downloadPng').onclick=()=>{renderFinish();$('#finishPreview').toBlob(b=>b?saveBlob(b,resultName('png')):toast('Download failed'),'image/png')};$('#printPdf').onclick=()=>{renderFinish();window.print()};$('#downloadBlank').onclick=async()=>{if(!current)return;const res=await fetch(current.image);saveBlob(await res.blob(),'Original_'+slug(current.title)+'.png')};
$('#downloadDraft').onclick=()=>{if(!current)return;const payload={format:'ptp-color-v1',worksheetId:current.id,width:art.w,height:art.h,paint:$('#paintLayer').toDataURL('image/png'),ink:$('#inkLayer').toDataURL('image/png')};saveBlob(new Blob([JSON.stringify(payload)],{type:'application/json'}),slug(current.title)+'.ptpcolor');toast('Editable draft downloaded to your device')};$('#loadDraft').onchange=async e=>{const f=e.target.files?.[0];if(!f||!current)return;try{const j=JSON.parse(await f.text());if(j.format!=='ptp-color-v1'||j.worksheetId!==current.id)throw Error('This draft belongs to another worksheet. Open that worksheet first.');async function restore(img,sel){const pic=new Image();pic.src=img;await pic.decode();let cx=$(sel).getContext('2d');cx.clearRect(0,0,art.pw,art.ph);cx.drawImage(pic,0,0,art.pw,art.ph)}await restore(j.paint,'#paintLayer');await restore(j.ink,'#inkLayer');art.dirty=true;renderFinish();toast('Draft restored — you can keep coloring')}catch(err){toast(err.message||'Invalid draft file')}e.target.value=''};
// Admin authentication stays in memory: refreshing the tab requires a new login,
// but publishing after an hour will renew the Supabase access token automatically.
// No student artwork or admin refresh tokens are stored in SQL or browser storage.
function setAdminTokens(payload){
  if(!payload?.access_token||!payload?.refresh_token)throw Error('Supabase did not return a complete session. Please sign in again.');
  sessionToken=payload.access_token;
  sessionRefreshToken=payload.refresh_token;
  const duration=Number(payload.expires_in);
  sessionExpiresAt=Number.isFinite(duration)&&duration>0?Date.now()+duration*1000:Date.now()+55*60*1000;
}
function clearAdminTokens(){sessionToken=null;sessionRefreshToken=null;sessionExpiresAt=0;}
async function refreshAdminSession(){
  if(refreshInFlight)return refreshInFlight;
  if(!sessionRefreshToken)throw Error('Administrator session expired. Sign out and sign in again without refreshing this page.');
  refreshInFlight=(async()=>{
    const configResp=await fetch('/api/config',{cache:'no-store'});
    if(!configResp.ok)throw Error('Cannot check Supabase connection. Please sign in again.');
    const config=await configResp.json();
    if(!config.url||!config.publishableKey)throw Error('Supabase public configuration is missing.');
    const r=await fetch(config.url+'/auth/v1/token?grant_type=refresh_token',{
      method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},
      body:JSON.stringify({refresh_token:sessionRefreshToken}),cache:'no-store'
    });
    let result={};try{result=await r.json()}catch{}
    if(!r.ok||!result.access_token||!result.refresh_token)throw Error('Administrator session has ended. Sign out and sign in again; keep this tab open to preserve your image preparation.');
    setAdminTokens(result);
  })();
  try{await refreshInFlight}catch(e){clearAdminTokens();throw e}finally{refreshInFlight=null}
}
async function api(path,options={}){
  const adminRequest=path==='admin'||path.startsWith('admin?');
  if(adminRequest&&sessionToken&&sessionRefreshToken&&Date.now()>sessionExpiresAt-90000){await refreshAdminSession()}
  async function run(){
    const headers={'Accept':'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...(sessionToken?{Authorization:'Bearer '+sessionToken}:{})};
    const response=await fetch('/api/'+path,{...options,headers:{...headers,...(options.headers||{})},cache:'no-store'});
    let data={};try{data=await response.json()}catch{}
    return {response,data};
  }
  let {response,data}=await run();
  const error=String(data.error||'');
  // A token can expire between our preflight check and the server's authorization.
  // Retry the same operation only once after a successful refresh.
  if(adminRequest&&!response.ok&&sessionRefreshToken&&
      (response.status===401||(/session (has )?expired|sign in again|login required/i.test(error)))){
    await refreshAdminSession();({response,data}=await run());
  }
  if(!response.ok)throw Error(data.error||'Server error ('+response.status+')');
  return data;
}
async function showAdmin(){if(sessionToken){$('#adminLogin').hidden=true;$('#adminPanel').hidden=false;$('#adminStatus').textContent='Authorized admin';adminRenderStep();return}$('#adminLogin').hidden=false;$('#adminPanel').hidden=true;$('#adminStatus').textContent='Sign-in required'}
$('#loginForm').onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;$('#loginInfo').textContent='Checking Supabase Auth...';try{const config=await api('config');if(!config.url||!config.publishableKey)throw Error('Vercel Supabase variables are missing.');const r=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:$('#adminEmail').value.trim(),password:$('#adminPassword').value})});const a=await r.json();if(!r.ok||!a.access_token){const message=a.msg||a.error_description||'Invalid email/password';throw Error((/invalid.login|invalid.credentials|invalid.grant/i.test(message)?'Email/password not recognized by Supabase Auth. Use an account created under Supabase Authentication → Users.':message))}setAdminTokens(a);await api('admin?action=status');$('#adminPassword').value='';$('#loginInfo').textContent='Signed in successfully';showAdmin();$('#adminTrouble').hidden=true;await refreshAdminLists();toast('Administrator verified')}catch(err){clearAdminTokens();$('#loginInfo').textContent=err.message;$('#adminTrouble').hidden=false;toast(err.message)}finally{btn.disabled=false}};
$('#checkAdminConnection').onclick=async()=>{
  const btn=$('#checkAdminConnection'),status=$('#adminCheckResult');
  btn.disabled=true;status.textContent='Checking secure project endpoints...';
  try{
    const c=await api('config');
    if(!c.url||!c.publishableKey)throw Error('Supabase public configuration missing in Vercel.');
    const catalog=await api('catalog');
    if(!Array.isArray(catalog.countries))throw Error('Catalog response was unexpected');
    status.textContent='✓ Website and Supabase connection OK. If Admin login fails, create an Auth user and register its UUID in studio_admins.';
  }catch(err){status.textContent='✗ '+err.message+'. Check Vercel deployment/environment variables and that SQL was installed.'}
  finally{btn.disabled=false}
};
$('#logoutBtn').onclick=()=>{clearAdminTokens();$('#adminPassword').value='';showAdmin();toast('Logged out')};
async function refreshAdminLists(){try{const data=await api('admin?action=taxonomy');countries=[...new Set([...countries,...(data.countries||[]).map(c=>c.name)])];topics=[...new Set([...topics,...(data.topics||[]).map(t=>t.name)])];buildCategories();renderLibrary()}catch(e){toast('Could not refresh categories: '+e.message)}}
$('#adminFile').onchange=e=>{const file=e.target.files?.[0];if(!file)return;if(!/^image\/(png|jpeg|webp)$/.test(file.type)){toast('Use a PNG, JPG, or WebP picture');return}adminImageFile=file;astate.rect=null;astate.polygons=[];astate.polygon=[];astate.barriers=[];astate.activeBarrier=[];astate.testMask=null;tempSrc=URL.createObjectURL(file);uploadImage=new Image();uploadImage.onload=()=>{const W=uploadImage.naturalWidth,H=uploadImage.naturalHeight;$('#adminImg').src=tempSrc;setupAdminOverlay();adminTested=false;prepared=false;adminMode='';const dpi=Math.round(Math.min(W/8.27,H/11.69));$('#fileMeta').textContent=file.name+' • '+W+' × '+H+' px • '+Math.round(file.size/1024)+' KB';$('#qualityMessage').textContent=dpi>=300?'Excellent: approximately '+dpi+' DPI on A4.':'Approximately '+dpi+' DPI on A4. For sharp printing, use 2480 × 3508 px or higher. Enlarging cannot recover lost detail.';$('#adminPreviewStatus').textContent='Original image preserved';$('#adminTitle').value=file.name.replace(/\.[^.]*$/,'').replace(/[_-]+/g,' ');toast('Original image loaded without changes')};uploadImage.src=tempSrc};
function setupAdminOverlay(){const img=$('#adminImg'),cv=$('#adminOverlay');const ratio=Math.min(1,1200/Math.max(img.naturalWidth,img.naturalHeight));cv.width=Math.max(1,Math.round(img.naturalWidth*ratio));cv.height=Math.max(1,Math.round(img.naturalHeight*ratio));renderAdminOverlay()}
const astate={rect:null,polygons:[],polygon:[],barriers:[],activeBarrier:[],threshold:156,dilate:1,testCanvas:null};
function adminRenderStep(){for(let i=1;i<=5;i++)$('#admin-step-'+i).classList.toggle('active',i===adminStep);$$('#adminSteps button').forEach(b=>b.classList.toggle('active',+b.dataset.step===adminStep));$('#stepIndex').textContent='Step '+adminStep+' of 5';$('#prevStep').disabled=adminStep===1;$('#nextStep').style.display=adminStep===5?'none':'';renderAdminOverlay()}
$$('#adminSteps button').forEach(b=>b.onclick=()=>{adminStep=+b.dataset.step;adminRenderStep()});$('#prevStep').onclick=()=>{adminStep=Math.max(1,adminStep-1);adminRenderStep()};$('#nextStep').onclick=()=>{if(adminStep===1&&!uploadImage){toast('First upload an image');return}adminStep=Math.min(5,adminStep+1);adminRenderStep()};
$('#thresholdRange').oninput=e=>{$('#thresholdNum').textContent=astate.threshold=+e.target.value;prepared=false};$('#dilateRange').oninput=e=>{$('#dilateNum').textContent=astate.dilate=+e.target.value;prepared=false};
$('#selectMode').onclick=()=>{if(!uploadImage)return toast('Upload a picture first');adminMode='select';toast('Drag across the picture to choose the coloring area')};$('#fullArtArea').onclick=()=>{if(!uploadImage)return;astate.rect=[0,0,1,1];$('#selectionInfo').textContent='Full image selected. Border and labels will also be colorable.';renderAdminOverlay()};
$('#prepareBtn').onclick=()=>{if(!uploadImage)return toast('Upload a picture first');if(!astate.rect)return toast('Step 3: select your coloring area');prepared=true;astate.testMask=null;adminTested=false;$('#regionSummary').textContent='Precision Fill V2 prepared. The fill overlaps the protected outlines without entering other open regions. Correct barriers or dark areas, then test.';renderAdminOverlay();toast('Coloring regions prepared for testing')};
$('#barrierBtn').onclick=()=>{if(!uploadImage)return;adminMode='barrier';toast('Draw over open gaps to close the outlines')};$('#darkRegionBtn').onclick=()=>{if(!uploadImage)return;adminMode='polygon';astate.polygon=[];toast('Tap points around dark nori, then press Finish dark-area polygon')};$('#finishPolygonBtn').onclick=()=>{if(astate.polygon.length<3){toast('Select at least 3 points');return}astate.polygons.push(astate.polygon.slice());astate.polygon=[];adminMode='';renderAdminOverlay();toast('Dark coloring area added')};
$('#testModeBtn').onclick=()=>{if(!prepared)return toast('First prepare the coloring region in Step 4');adminMode='test';toast('Tap a white space in the picture preview. It will show a Precision Fill V2 test color.')};
function adminXY(ev){const c=$('#adminOverlay'),r=c.getBoundingClientRect();return [numClamp((ev.clientX-r.left)/r.width,0,1),numClamp((ev.clientY-r.top)/r.height,0,1)]}
function adminTestColor(point){
 const cv=$('#adminOverlay'),W=cv.width,H=cv.height,rect=astate.rect;
 if(!rect)return toast('Select a coloring area first');
 const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;const tc=tmp.getContext('2d',{willReadFrequently:true});tc.drawImage(uploadImage,0,0,W,H);
 const data=tc.getImageData(0,0,W,H).data;
 const l=Math.floor(rect[0]*W),t=Math.floor(rect[1]*H),r=Math.min(W,Math.ceil(rect[2]*W)),b=Math.min(H,Math.ceil(rect[3]*H));
 const x=Math.floor(point[0]*W),y=Math.floor(point[1]*H);
 if(x<l||x>=r||y<t||y>=b)return toast('Outside the selected coloring area');
 const tint=document.createElement('canvas');tint.width=W;tint.height=H;const ctx=tint.getContext('2d');
 const poly=astate.polygons.find(shape=>polygonInside(point,shape));
 if(poly){ctx.fillStyle='rgba(38,170,109,.65)';ctx.beginPath();poly.forEach(([a,z],i)=>i?ctx.lineTo(a*W,z*H):ctx.moveTo(a*W,z*H));ctx.closePath();ctx.fill();astate.testMask=tint;adminTested=true;$('#testSummary').textContent='Dark region test passed. Review outline shape and publish when ready.';renderAdminOverlay();return}
 const n=W*H,blocked=new Uint8Array(n),manualMask=new Uint8Array(n),raw=new Uint8Array(n),dilate=astate.dilate;
 for(let yy=t;yy<b;yy++)for(let xx=l;xx<r;xx++){const i=yy*W+xx,k=i*4;const R=data[k],G=data[k+1],B=data[k+2];raw[i]=(.3*R+.59*G+.11*B<astate.threshold&&Math.max(R,G,B)-Math.min(R,G,B)<70)?1:0}
 for(let yy=t;yy<b;yy++)for(let xx=l;xx<r;xx++){const i=yy*W+xx;if(!raw[i])continue;for(let dy=-dilate;dy<=dilate;dy++)for(let dx=-dilate;dx<=dilate;dx++){const a=xx+dx,z=yy+dy;if(a>=l&&a<r&&z>=t&&z<b)blocked[z*W+a]=1}}
 const lines=astate.barriers;for(const line of lines)for(let i=1;i<line.length;i++){const a=line[i-1],z=line[i],x1=a[0]*W,y1=a[1]*H,x2=z[0]*W,y2=z[1]*H,steps=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)));for(let j=0;j<=steps;j++){const xx=Math.round(x1+(x2-x1)*j/steps),yy=Math.round(y1+(y2-y1)*j/steps);if(xx>=l&&xx<r&&yy>=t&&yy<b){blocked[yy*W+xx]=1;manualMask[yy*W+xx]=1}}}
 let origin=y*W+x;if(blocked[origin]){let near=-1,best=1e9;for(let dy=-9;dy<=9;dy++)for(let dx=-9;dx<=9;dx++){const xx=x+dx,yy=y+dy,d=dx*dx+dy*dy;if(d>81||xx<l||xx>=r||yy<t||yy>=b||blocked[yy*W+xx])continue;if(d<best){best=d;near=yy*W+xx}}if(near<0){toast('Cannot fill this dark line; add a dark polygon or use Tint Ink.');return}origin=near}
 const seen=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=1;seen[origin]=1;queue[0]=origin;const max=Math.round((r-l)*(b-t)*.8);let leaked=false;
 while(head<tail){const i=queue[head++],xx=i%W,yy=(i/W)|0;if(tail>=max){leaked=true;break}const add=z=>{if(!blocked[z]&&!seen[z]){seen[z]=1;queue[tail++]=z}};if(xx>l)add(i-1);if(xx<r-1)add(i+1);if(yy>t)add(i-W);if(yy<b-1)add(i+W)}
 if(leaked){$('#testSummary').textContent='Fill leak detected: try increasing outline protection or drawing a barrier. Publishing is blocked.';adminTested=false;toast('Fill leaked across most of the image; correct outlines first.');return}
 const overlap=window.PTPPrecisionFillV2.expandIntoOutline({
 core:queue.subarray(0,head),blocked,seen,stamp:1,width:W,bounds:[l,t,r,b],
 radius:dilate+1,protectedMask:manualMask
});
const painted=ctx.createImageData(W,H);
for(let i=0;i<head;i++){const k=queue[i]*4;painted.data[k]=20;painted.data[k+1]=170;painted.data[k+2]=100;painted.data[k+3]=120}
for(const p of overlap){const k=p*4;painted.data[k]=20;painted.data[k+1]=170;painted.data[k+2]=100;painted.data[k+3]=120}
ctx.putImageData(painted,0,0);astate.testMask=tint;adminTested=true;$('#testSummary').textContent='Tested '+head.toLocaleString()+' connected pixels + '+overlap.length+' edge pixels (Precision Fill V2). Inspect the preview for leaks.';renderAdminOverlay();toast('Test fill shown — check the green region for leaks');
}

let dragStart=null;
$('#adminOverlay').onpointerdown=ev=>{if(!uploadImage)return;const p=adminXY(ev);if(adminMode==='select'){dragStart=p;$('#adminOverlay').setPointerCapture(ev.pointerId)}else if(adminMode==='barrier'){astate.activeBarrier=[p];$('#adminOverlay').setPointerCapture(ev.pointerId)}else if(adminMode==='polygon'){astate.polygon.push(p);renderAdminOverlay()}else if(adminMode==='test'){adminTestColor(p)}};
$('#adminOverlay').onpointermove=ev=>{if(!dragStart&&!astate.activeBarrier.length)return;const p=adminXY(ev);if(dragStart){astate.rect=[Math.min(dragStart[0],p[0]),Math.min(dragStart[1],p[1]),Math.max(dragStart[0],p[0]),Math.max(dragStart[1],p[1])];renderAdminOverlay()}if(astate.activeBarrier.length){astate.activeBarrier.push(p);renderAdminOverlay()}};
$('#adminOverlay').onpointerup=ev=>{if(dragStart){dragStart=null;adminMode='';prepared=false;astate.testMask=null;adminTested=false;$('#selectionInfo').textContent='Editable region set ('+astate.rect.map(v=>Math.round(v*100)+'%').join(', ')+').';renderAdminOverlay()}if(astate.activeBarrier.length){astate.barriers.push(astate.activeBarrier.slice());astate.activeBarrier=[];prepared=false;astate.testMask=null;adminTested=false;renderAdminOverlay();toast('Outline correction saved') }try{$('#adminOverlay').releasePointerCapture(ev.pointerId)}catch{}};
function renderAdminOverlay(testPoint){const c=$('#adminOverlay');if(!c.width)return;const cx=c.getContext('2d');cx.clearRect(0,0,c.width,c.height);if(astate.testMask)cx.drawImage(astate.testMask,0,0,c.width,c.height);if(astate.rect){const [x,y,r,b]=astate.rect;cx.fillStyle='#2aa77322';cx.fillRect(x*c.width,y*c.height,(r-x)*c.width,(b-y)*c.height);cx.strokeStyle='#007b4d';cx.lineWidth=Math.max(2,c.width/180);cx.setLineDash([10,7]);cx.strokeRect(x*c.width,y*c.height,(r-x)*c.width,(b-y)*c.height);cx.setLineDash([])}cx.save();cx.lineWidth=Math.max(3,c.width/135);cx.strokeStyle='#fa812a';for(const line of [...astate.barriers,astate.activeBarrier]){if(line.length<2)continue;cx.beginPath();line.forEach(([x,y],i)=>i?cx.lineTo(x*c.width,y*c.height):cx.moveTo(x*c.width,y*c.height));cx.stroke()}cx.restore();cx.fillStyle='#13a0c066';cx.strokeStyle='#0082a5';for(const poly of [...astate.polygons,astate.polygon]){if(!poly.length)continue;cx.beginPath();poly.forEach(([x,y],i)=>i?cx.lineTo(x*c.width,y*c.height):cx.moveTo(x*c.width,y*c.height));if(poly.length>=3)cx.closePath();cx.fill();cx.stroke()}if(testPoint){cx.beginPath();cx.fillStyle='#45c5a2aa';cx.arc(testPoint[0]*c.width,testPoint[1]*c.height,Math.max(7,c.width/40),0,2*Math.PI);cx.fill()}}
async function addTaxonomy(kind){const id=kind==='country'?'newCountry':'newTopic';const name=$('#'+id).value.trim();if(!name)return toast('Enter a name first');try{await api('admin',{method:'POST',body:JSON.stringify({action:'taxonomy',kind,name})});$('#'+id).value='';await refreshAdminLists();toast(kind==='country'?'Country added':'Topic added')}catch(e){toast(e.message)}}$('#addCountry').onclick=()=>addTaxonomy('country');$('#addTopic').onclick=()=>addTaxonomy('topic');
async function publish(){if(!uploadImage||!adminImageFile)return toast('Upload an image first');if(!astate.rect)return toast('Select the coloring area');if(!prepared)return toast('Prepare the coloring region first');if(!adminTested)return toast('Run the preview test first');const title=$('#adminTitle').value.trim();if(!title)return toast('Enter a worksheet title');const country=$('#adminCountry').value,topic=$('#adminTopic').value,keywords=$('#adminTags').value.split(',').map(x=>x.trim()).filter(Boolean),vocab=$('#adminVocab').value.split('\n').map(s=>s.split('|').map(x=>x.trim())).filter(x=>x[0]);const b=$('#publishBtn');b.disabled=true;b.textContent='Uploading and publishing...';try{const ext=(adminImageFile.type.split('/')[1]==='jpeg'?'jpg':adminImageFile.type.split('/')[1]);const signed=await api('admin',{method:'POST',body:JSON.stringify({action:'upload-link',ext,contentType:adminImageFile.type})});const uploaded=await fetch(signed.uploadUrl,{method:'PUT',headers:{'Content-Type':adminImageFile.type},body:adminImageFile});if(!uploaded.ok)throw Error('Upload failed ('+uploaded.status+')');const out=await api('admin',{method:'POST',body:JSON.stringify({action:'publish',title,country,topic,keywords,vocabulary:vocab,original:{bucket:'coloring-masters',path:signed.path,width:uploadImage.naturalWidth,height:uploadImage.naturalHeight,mime:adminImageFile.type},editable:astate.rect,preparation:{threshold:astate.threshold,dilate:astate.dilate,barriers:astate.barriers,specialRegions:astate.polygons},theme:$('#adminTheme').value})});$('#publishInfo').textContent='Published: '+title;toast('Worksheet published! Refresh the library to see it.');await getCatalog()}catch(err){toast('Publish failed: '+err.message);$('#publishInfo').textContent=err.message}finally{b.disabled=false;b.textContent='✓ Publish to library'}}$('#publishBtn').onclick=publish;
async function getCatalog(){try{const data=await api('catalog');if(Array.isArray(data.worksheets)&&data.worksheets.length){const mapped=data.worksheets.map(s=>({id:s.id,title:s.title,country:s.country,topic:s.topic,description:s.description||'Color and learn!',tags:s.tags||[],image:s.image,editable:s.editable||[0,0,1,1],barriers:s.barriers||[],specialRegions:s.specialRegions||[],theme:s.theme||'forest',threshold:s.threshold||156,dilate:s.dilate??1,vocabulary:s.vocabulary?.length?s.vocabulary:vocabJapan}));sheets=[...samples,...mapped.filter(s=>!samples.some(t=>t.id===s.id))]}if(data.countries)countries=[...new Set([...countries,...data.countries])];if(data.topics)topics=[...new Set([...topics,...data.topics])];buildCategories();renderLibrary()}catch(e){console.warn('Running the built-in Japan demo; database catalog unavailable:',e.message)}}
colors();buildCategories();renderLibrary();current=samples[0];renderVocab();showPage(location.hash==='#admin'?'admin':'home');getCatalog();})();
