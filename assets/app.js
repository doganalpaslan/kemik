import {startPWA,resetProgress} from './pwa.js?v=88a2f45-20261110T220532222Z';
import {regions,levels,dailyBones,roundBones,recordGrade,progressFor,migrateLegacy,migrateCards,reinsert,dueSummary} from './curriculum.js?v=88a2f45-20261110T220532222Z';
import {bones,normalize,dayNumber,answerAliases} from './bones.js?v=88a2f45-20261110T220532222Z';
import {createSkull} from './skull.js?v=88a2f45-20261110T220532222Z';
import {notesForDay} from './study.js?v=88a2f45-20261110T220532222Z';
import {GameSound} from './sound.js?v=88a2f45-20261110T220532222Z';
await startPWA();
const $=s=>document.querySelector(s);
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{$('#storage-note').textContent='Tarayıcı depolaması kullanılamıyor. İlerlemeniz bu oturumda korunur.'}}
let date=localDate();let prefs={...read('gk2:preferences',{upper:false,sound:true}),mode:'latin'};
const fresh=()=>({round:0,index:0,typed:'',done:false,errors:0,keystrokes:0,correctKeys:0,attempts:0,first:0,misses:{},round3Misses:{},hints:{},between:false,questionErrors:0,round3Errors:0,started:Date.now(),elapsed:0});
prefs.region=regions.some(r=>r.id===prefs.region)?prefs.region:'all';
let progress=read('gk2:curriculum:v8',{learned:{},history:{}});
if(!progress||typeof progress!=='object'||Array.isArray(progress))progress={learned:{},history:{}};
if(!progress.migratedV4){const records={};try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('gk2:v4:'))records[key]=read(key,null);}}catch{}migrateLegacy(progress,records);write('gk2:curriculum:v8',progress);}
migrateCards(progress,date);
const stateKey=()=>`gk2:v8:${date}:${prefs.region}`;
function loadDay(){
 const stored=read(stateKey(),null);
 if(stored&&Array.isArray(stored.units)&&stored.units.length===8&&new Set(stored.units).size===8&&stored.units.every(id=>bones.some(b=>b.id===id))&&Number.isInteger(stored.round)&&stored.round>=0&&stored.round<=2&&Number.isInteger(stored.index)&&stored.index>=0&&stored.index<(stored.queues?.[stored.round]?.length||8)&&typeof stored.typed==='string'&&stored.misses&&typeof stored.misses==='object')return {...fresh(),...stored};
 // Preserve old partial days untouched; their question IDs differ from the new curriculum.
 return {...fresh(),units:dailyBones(date,prefs.region,progress).map(b=>b.id)};
}
let state=loadDay();
const dayUnits=()=>state.units.map(id=>bones.find(b=>b.id===id));
let skull,busy=false,submitted=false,timer=null;const sound=new GameSound(prefs.sound);
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>sound.unlock(),{capture:true});
const queue=()=>{state.queues??={};return state.queues[state.round]??=roundBones(date,state.round,dayUnits()).map(b=>({id:b.id,practice:false}));};
const current=()=>bones.find(b=>b.id===queue()[state.index].id);
const isPractice=()=>!!queue()[state.index].practice;
const name=b=>prefs.mode==='latin'?b.latin:b.tr;

const aliases=b=>answerAliases(b,prefs.mode);
const display=s=>prefs.upper?s.toLocaleUpperCase(prefs.mode==='tr'?'tr-TR':'en-US'):s.toLocaleLowerCase(prefs.mode==='tr'?'tr-TR':'en-US');
function save(){write(stateKey(),state);write('gk2:curriculum:v8',progress);write('gk2:preferences',prefs)}
function streak(){const s=read('gk2:streak',{count:0,last:null});return s.last&&(dayNumber(date)-dayNumber(s.last)<=1)?s.count:0;}
function paint(){
 $('#region-label').textContent=regions.find(r=>r.id===prefs.region)[matchMedia('(max-width:600px)').matches?'short':'label'];
 document.querySelectorAll('[data-region]').forEach(el=>el.setAttribute('aria-selected',String(el.dataset.region===prefs.region)));
 $('#date').textContent=new Date(date+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});$('#date').dateTime=date;
 $('#streak').textContent=streak();$('#case').setAttribute('aria-pressed',String(prefs.upper));$('#case').setAttribute('aria-label',prefs.upper?'Küçük harf kullan':'Büyük harf kullan');
 $('#sound').textContent=prefs.sound?'Ses açık':'Ses kapalı';$('#sound').setAttribute('aria-pressed',String(prefs.sound));
 $('#game').hidden=state.done;$('#results').hidden=!state.done;
 if(state.done){renderResults();return}
 $('#game').classList.toggle('round-ended',!!state.between);$('#round-end').hidden=!state.between;$('#answer-area').hidden=!!state.between;$('#keyboard').hidden=!!state.between;
 if(state.between){$('#round-end-title').textContent=`Tur ${state.round} bitti · ${state.lastRoundSize||8} / ${state.lastRoundSize||8}`;$('#round-end-copy').textContent=state.round===1?'Sekizi de toz oldu. Şimdi adlar kayboluyor. İlk harf ve bir ipucu kalıyor.':'Bir tur daha kaldı. Şimdi ezberden, öbür taraftan hatırlayın.';$('#next-round').innerHTML=`${state.round+1}. tura başla <kbd>gir</kbd>`;return}
 const b=current();const card=progress.cards[b.id]??={box:0,due:date,hints:0,errors:0,lastSeen:null};card.lastSeen=date;write('gk2:curriculum:v8',progress);$('#round').textContent=`Tur ${state.round+1} · ${['Görerek yazın','İlk harften hatırlayın','Diğer taraftan, ezberden yazın'][state.round]} · ${state.index+1} / ${queue().length}`;
 renderAnswer();$('#translation').textContent=state.round===1?b.clue:state.round===0?b.tr:'';
 $('#explanation').textContent=state.round===0||submitted?b.fact:'';
 skull?.setBone(b,state.round);buildKeyboard();
}
const questionKey=()=>`${state.round}:${current().id}${isPractice()?`:practice:${state.index}`:''}`;
const questionHint=()=>state.hints?.[questionKey()];
function hintTarget(){return aliases(current()).find(a=>a.startsWith(normalize(state.typed)))||name(current());}
function revealHint(){
 if(state.round===0||state.done||state.between||busy)return;
 if(!aliases(current()).some(a=>a.startsWith(normalize(state.typed)))){$('#feedback').textContent='Önce yanlış harfi silin.';return}
 const target=hintTarget(),old=questionHint(),start=Math.max(state.typed.length,old?.until||0);
 let until=start;while(until<target.length){until++;if(target[until-1]!==' ')break}
 if(until===start)return;
 (state.hints??={})[questionKey()]={count:(old?.count||0)+1,until};
 $('#feedback').textContent='';sound.play('hint');save();renderAnswer();
}
function renderAnswer(){
 const b=current(),out=$('#answer'),previous=out.dataset.typed||'';let target=name(b);const matched=aliases(b).find(a=>a.startsWith(normalize(state.typed)));if(state.typed&&matched&&matched!==normalize(target))target=matched;out.dataset.typed=state.typed;out.replaceChildren();out.classList.toggle('long',target.length>22||state.typed.length>22);
 const typed=state.typed;let prefix='';
 for(let i=0;i<typed.length;i++){prefix+=typed[i];const span=document.createElement('span');span.className=i>=previous.length&&typed.startsWith(previous)?'letter':'settled';if(!aliases(b).some(a=>a.startsWith(normalize(prefix))))span.classList.add('wrong');span.textContent=display(typed[i]);out.append(span)}
 let hint='';if(!submitted){if(state.round===0)hint=target.slice(typed.length);if(state.round===1){hint=typed.length===0?target[0]+'·'.repeat(Math.max(3,target.length-1)):'·'.repeat(Math.max(0,target.length-typed.length));}if(state.round===2&&typed.length===0)hint='';}
 const revealed=questionHint();if(!submitted&&state.round>0&&revealed){const n=Math.max(0,revealed.until-typed.length);hint=target.slice(typed.length,typed.length+n)+(state.round===1?'·'.repeat(Math.max(0,target.length-typed.length-n)):'');}
 $('#hint').hidden=state.round===0;$('#hint').disabled=submitted;
 const ghost=document.createElement('span');ghost.className='ghost';ghost.textContent=display(hint);
 const caret=document.createElement('span');caret.className='caret';caret.setAttribute('aria-hidden','true');if(!submitted)out.append(caret);out.append(ghost);
 const ready=aliases(b).includes(normalize(typed));document.querySelector('[data-key="Enter"]')?.classList.toggle('ready',ready);
 out.setAttribute('aria-valuetext',`${display(typed)}${hint?' '+display(hint):''}`);
}
function buildKeyboard(){
 const tr=true;const rows=[
 ['"','1','2','3','4','5','6','7','8','9','0','*','-',{label:'sil',key:'Backspace',width:'wide'}],
 [{label:'tab',key:'Tab',width:'wide'},'q','w','e','r','t','y','u','ı','o','p','ğ','ü',{label:'gir',key:'Enter',width:'wide'}],
 [{label:'caps',key:'CapsLock',width:'xwide'},'a','s','d','f','g','h','j','k','l','ş','i',','],
 [{label:'shift',key:'Shift',width:'xwide'},'<','z','x','c','v','b','n','m','ö','ç','.',{label:'shift',key:'Shift',width:'xwide'}],
 [{label:'',key:'none',width:'spacer'},{label:'boşluk',key:' ',width:'space'},{label:'',key:'none',width:'spacer'}]
 ];
 const keyboard=$('#keyboard');keyboard.replaceChildren();keyboard.classList.toggle('turkish',tr);
 for(const row of rows){const el=document.createElement('div');el.className='keyrow';for(const item of row){const k=typeof item==='string'?{label:prefs.upper?item.toLocaleUpperCase('tr-TR'):item,key:item}:item;const button=document.createElement('button');button.type='button';button.className='key '+(k.width||'');button.textContent=k.label;button.dataset.key=k.key;button.tabIndex=k.key==='none'?-1:0;button.setAttribute('aria-label',k.key===' '?'Boşluk':k.key==='Tab'?(state.round===0?'Sıradaki sözcük':'İpucu getir'):k.key==='Backspace'?'Son harfi sil':k.key==='Enter'?'Yanıtı gönder':k.label);if(k.key==='none')button.setAttribute('aria-hidden','true');if(k.key==='CapsLock'&&prefs.upper)button.classList.add('mod-on');el.append(button)}keyboard.append(el)}
 document.querySelector('[data-key="Enter"]').classList.toggle('ready',aliases(current()).includes(normalize(state.typed)));
}
function pressFeedback(key){for(const el of document.querySelectorAll('.key'))if(el.dataset.key===key||el.dataset.key.toLocaleLowerCase('tr-TR')===key.toLocaleLowerCase('tr-TR')){el.classList.add('pressed');setTimeout(()=>el.classList.remove('pressed'),110)}}
function noteMiss(){progress.history??={};const h=progress.history[current().id]??={};h.missed=date;}
function wrong(message){sound.play('wrong');if(prefs.sound)navigator.vibrate?.(15);$('#feedback').textContent=message;const el=$('#answer-area');el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake');}
function act(key){
 if(state.done||busy)return;if(state.between){if(key==='Enter')startRound();return}sound.unlock();pressFeedback(key);
 if(key==='Shift'||key==='CapsLock'){prefs.upper=!prefs.upper;save();paint();return}
 if(key==='Backspace'){state.typed=state.typed.slice(0,-1);sound.play('key');$('#feedback').textContent='';save();renderAnswer();return}
 if(key==='Enter'){submit();return}
 if(key==='Tab'){if(state.round===0)key=' ';else{revealHint();return}}
 if(key.length!==1||state.typed.length>=60||(!/[\p{L}0-9 "*<,.\-]/u.test(key)))return;
 state.typed+=key;state.keystrokes++;
 const okay=aliases(current()).some(a=>a.startsWith(normalize(state.typed)));
 if(okay){state.correctKeys++;if(key!==' ')sound.play('letter',state.typed.length-1);$('#feedback').textContent='';}else{state.errors++;state.questionErrors=(state.questionErrors||0)+1;if(state.round===2){state.round3Errors=(state.round3Errors||0)+1;(state.round3Misses??={})[current().id]=true;}state.misses[current().id]=(state.misses[current().id]||0)+1;noteMiss();wrong('Bu harfi kontrol edin. Sil tuşuyla düzeltebilirsiniz.');}
 save();renderAnswer();
}
function submit(){
 if(!state.typed.trim()){wrong('Önce kemiğin adını yazın.');return}
 state.attempts++;
 if(!aliases(current()).includes(normalize(state.typed))){state.questionErrors=(state.questionErrors||0)+1;if(state.round===2){state.round3Errors=(state.round3Errors||0)+1;(state.round3Misses??={})[current().id]=true;}state.misses[current().id]=(state.misses[current().id]||0)+1;noteMiss();wrong('Bu kemiğin adını yeniden deneyin.');save();return}
 if(state.round>0){
  const hints=questionHint()?.count||0,errors=state.questionErrors||0,practice=isPractice();
  state.answered??={};const receipt=questionKey();
  if(!state.answered[receipt]){recordGrade(progress,current().id,date,state.round,{hints,errors},practice);
  state.grades??={};if(!practice){const grades=state.grades[current().id]??={};grades[state.round]=hints||errors?'again':'good';if(hints||errors)state.queues[state.round]=reinsert(queue(),state.index);}
  state.answered[receipt]=true;}save();
 }
 busy=true;submitted=true;sound.play('correct');$('#feedback').textContent='Doğru.';state.first+=!isPractice()&&!state.questionErrors&&!questionHint()?.count?1:0;state.typed=name(current());paint();
 timer=setTimeout(()=>{submitted=false;$('#game').classList.add(state.index===queue().length-1?'dissolving':'transitioning');timer=setTimeout(()=>{next();$('#game').classList.remove('transitioning','dissolving');},state.index===queue().length-1?540:220)},700);
}
function next(){
 state.typed='';state.questionErrors=0;state.index++;if(state.index===queue().length){state.lastRoundSize=queue().length;state.index=0;state.round++;if(state.round<3){state.between=true;sound.play('round');}if(state.round===3){state.round=2;state.index=queue().length-1;state.done=true;sound.play('day');state.elapsed=Date.now()-state.started;const s=read('gk2:streak',{last:null,count:0});if(s.last!==date)write('gk2:streak',{last:date,count:s.last&&dayNumber(date)-dayNumber(s.last)===1?s.count+1:1});}}
 busy=false;$('#feedback').textContent='';save();paint();
}
function startRound(){if(!state.between)return;state.between=false;save();paint();$('#answer').focus({preventScroll:true});}
$('#next-round').onclick=startRound;
$('#hint').onclick=()=>act('Tab');
function renderResults(){
 const total=state.keystrokes||1,accuracy=Math.round(state.correctKeys/total*100),first=Math.round(state.first/24*100),wpm=Math.round(state.correctKeys/5/Math.max(state.elapsed/60000,.1));const host=$('#results');host.replaceChildren();
 const add=(tag,text,cls,parent=host)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;parent.append(el);return el};
 add('p',`Gün tamamlandı · ${date}`,'eyebrow');add('h2','Bugünün sekiz kemiğini üç turda çalıştınız.');
 const nextDue=dueSummary(progress,state.units,date)[0];
 const nextLabel=nextDue?(nextDue.days===1?'Yarın':`${nextDue.days} gün sonra`):'—';
 const stats=add('div','','stats');for(const [label,val] of [['İlk denemede',`%${first}`],['Sonraki tekrar',nextLabel],['Kelime/dk · isabet',`${wpm} · %${accuracy}`]]){const item=add('div','',null,stats);add('small',label,null,item);add('strong',val,null,item)}
 const again=dayUnits().filter(b=>Object.values(state.grades?.[b.id]||{}).includes('again'));
 add('h4',`Tekrar: ${again.length} kemik yarın geri gelecek`);
 if(again.length){const list=add('ul','','repetition-list');for(const b of again)add('li',b.latin,null,list);}
 for(const summary of dueSummary(progress,state.units,date))add('p',`${summary.days===1?'Yarın':summary.days+' gün sonra'}: ${summary.count} kemik`,'due-summary');
 const miles=add('div','','milestones');for(const [text,achieved] of [['Günü tamamla',true],['3. turu hatasız bitir',!state.round3Errors&&!Object.keys(state.hints||{}).some(k=>k.startsWith('2:'))],['Aralıklı tekrar planlandı',true]]){const p=add('div','',null,miles);add('span','★',achieved?'achieved':'pending',p);p.append(document.createTextNode(text))}
 const regional=progressFor(prefs.region,progress),whole=progressFor('all',progress);
 const wholeProgress=prefs.region==='all'?'':` · Tüm iskelet: ${whole.count} / ${whole.total}`;
 add('p',`${regions.find(r=>r.id===prefs.region).label}: ${regional.count} / ${regional.total} öğrenildi${wholeProgress} · Seviye: ${levels[regional.level]}`,'curriculum-progress');
 add('h4','Bildiklerin');const grid=add('div','','result-grid');for(const b of dayUnits()){const card=add('article','','result-card',grid);add('h3',display(name(b)),null,card);add('p',b.fact,null,card);const grades=state.grades?.[b.id]||{},missed=grades[2]==='again',retry=Object.values(grades).includes('again');add('p',missed?'3. turda kaçırıldı, yarın tekrar':retry?'ipucuyla, yarın tekrar':'ilk denemede',retry?'score retry':'score',card)}
 add('h4','Sınav için');for(const note of notesForDay(dayUnits()))add('p',note.text,'study-note');
 const button=add('button','Sonuçları kopyala','primary');button.onclick=async()=>{try{await navigator.clipboard.writeText(`Günün kemiği · ${date}\n8 kemik · 3 tur · %${accuracy} doğruluk\n${streak()} günlük seri`);button.textContent='Kopyalandı.'}catch{button.textContent='Kopyalama kullanılamıyor.'}};
}
$('#keyboard').addEventListener('click',e=>{const button=e.target.closest('[data-key]');if(button)act(button.dataset.key)});
document.addEventListener('keydown',e=>{if($('#instructions').open||e.ctrlKey||e.metaKey||e.altKey)return;if(e.target.closest('nav')||e.target.closest('#results')||e.target.closest('footer')||e.target.closest('#install-hint'))return;if(e.key==='Tab'){if(state.round>0&&!state.done&&!state.between){e.preventDefault();act('Tab')}return}if(e.key===' '||e.key==='Enter'||e.key==='Backspace'||e.key.length===1){e.preventDefault();act(e.key)}});
const regionButton=$('#region'),regionMenu=$('#region-menu');
for(const r of regions){const option=document.createElement('button');option.type='button';option.role='option';option.dataset.region=r.id;option.textContent=r.label;option.onclick=()=>{
 clearTimeout(timer);if(busy){submitted=false;next();}save();prefs.region=r.id;state=loadDay();busy=false;submitted=false;
 $('#game').classList.remove('transitioning','dissolving');$('#feedback').textContent='';
 regionMenu.hidden=true;regionButton.setAttribute('aria-expanded','false');save();paint();regionButton.focus();
 };regionMenu.append(option);}
regionButton.onclick=()=>{regionMenu.hidden=!regionMenu.hidden;regionButton.setAttribute('aria-expanded',String(!regionMenu.hidden));if(!regionMenu.hidden)regionMenu.querySelector(`[data-region="${prefs.region}"]`).focus();};
document.addEventListener('click',e=>{if(!e.target.closest('.region-picker')){regionMenu.hidden=true;regionButton.setAttribute('aria-expanded','false');}});
regionMenu.addEventListener('keydown',e=>{const options=[...regionMenu.children],i=options.indexOf(document.activeElement);if(e.key==='Escape'){regionMenu.hidden=true;regionButton.setAttribute('aria-expanded','false');regionButton.focus();}if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();options[e.key==='Home'?0:e.key==='End'?options.length-1:(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length].focus();}});
window.addEventListener('resize',()=>{$('#region-label').textContent=regions.find(r=>r.id===prefs.region)[innerWidth<=600?'short':'label'];});
$('#case').onclick=()=>{prefs.upper=!prefs.upper;save();paint();if(!state.done)$('#answer').focus({preventScroll:true})};
$('#sound').onclick=()=>{prefs.sound=!prefs.sound;sound.enabled=prefs.sound;sound.unlock();save();paint();if(!state.done)$('#answer').focus({preventScroll:true})};
$('#help').onclick=()=>{$('#reset-confirmation').hidden=true;$('#reset-progress').hidden=false;$('#instructions').showModal()};
$('#reset-progress').onclick=()=>{$('#reset-progress').hidden=true;$('#reset-confirmation').hidden=false;$('#cancel-reset').focus()};
$('#cancel-reset').onclick=()=>{$('#reset-confirmation').hidden=true;$('#reset-progress').hidden=false;$('#reset-progress').focus()};
$('#confirm-reset').onclick=()=>{if(resetProgress()){clearTimeout(timer);location.reload()}};
$('#close-help').onclick=$('#start').onclick=()=>{$('#instructions').close();$('#answer').focus({preventScroll:true})};
function checkDay(){if(date!==localDate()){clearTimeout(timer);save();date=localDate();state=loadDay();save();busy=false;submitted=false;$('#game').classList.remove('transitioning','dissolving');paint()}}
setInterval(checkDay,30000);document.addEventListener('visibilitychange',checkDay);
save();paint();createSkull($('#skull')).then(view=>{skull=view;$('#loading').hidden=true;paint();document.body.dataset.ready='true'}).catch(error=>{console.error(error);$('#loading').classList.add('error');$('#loading').textContent='3B model yüklenemedi. WebGL destekli bir tarayıcıda sayfayı yenileyin.';document.body.dataset.ready='error'});
