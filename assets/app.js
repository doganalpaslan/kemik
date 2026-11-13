import {chapters,sections,sectionByNumber,sectionStatus,recommendedSection,dailySection,mergeLumbarProgress} from './course.js?v=0276220-20261113T072829721Z';
import {answerOffset,answerHint,nextHintUntil,resultStatus,firstTryPercent,shouldAutoSubmit} from './game-logic.js?v=0276220-20261113T072829721Z';
import {startPWA,resetProgress} from './pwa.js?v=0276220-20261113T072829721Z';
import {regionsFor,unitsFor,levels,getModule,loadModule,modules,moduleRegistry,ladderFor,unlockStage,dailyBones as selectDaily,roundBones,recordGrade,progressFor as moduleProgress,migrateLegacy,migrateCards,reinsert,dueSummary} from './curriculum.js?v=0276220-20261113T072829721Z';
import {moduleDom} from './module-registry.js?v=0276220-20261113T072829721Z';
import {bones,normalize,dayNumber,answerAliases} from './bones.js?v=0276220-20261113T072829721Z';
import {BASE_URL} from './config.js?v=0276220-20261113T072829721Z';
import {notesForDay} from './study.js?v=0276220-20261113T072829721Z';
import {GameSound} from './sound.js?v=0276220-20261113T072829721Z';
const pwaReady=startPWA();
const $=s=>document.querySelector(s);
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const memory=new Map();
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??memory.get(key)??fallback}catch{return memory.get(key)??fallback}}
function write(key,value){memory.set(key,value);try{localStorage.setItem(key,JSON.stringify(value))}catch{$('#storage-note').textContent='Tarayıcı depolaması kullanılamıyor. İlerlemeniz bu oturumda korunur.'}}
let date=localDate();let prefs={...read('kemik:preferences',{upper:false,sound:true}),mode:read('kemik:preferences',{}).mode==='tr'?'tr':'latin'};
const fresh=()=>({round:0,index:0,typed:'',done:false,errors:0,keystrokes:0,correctKeys:0,attempts:0,first:0,misses:{},round3Misses:{},hints:{},between:false,questionErrors:0,round3Errors:0,started:Date.now(),elapsed:0});
prefs.module=Object.hasOwn(moduleRegistry,prefs.module)?prefs.module:'bones';
let activeSection=sectionByNumber(new URLSearchParams(location.hash.split('?')[1]||'').get('bolum'));
if(activeSection)prefs.module=activeSection.module;
await pwaReady;await loadModule('bones');await loadModule(prefs.module);
const activeModule=()=>getModule(prefs.module);
for(const selector of ['#home-module','#game-module']){const select=$(selector);select.replaceChildren(...modules.map(m=>{const option=document.createElement('option');option.value=m.id;option.textContent=m.label;return option}));}
$('.modules').replaceChildren(...modules.map(m=>{const card=document.createElement('article');card.className='module';card.id='module-'+m.id;const ids=moduleDom(m.id);card.innerHTML=`<div class="module-heading"><h3><button data-module="${m.id}">${m.label}</button></h3><span>Günlük çalışma</span></div><p id="${ids.progress}"></p><progress id="${ids.meter}" max="1" value="0" aria-label="${m.label} öğrenme durumu"></progress><div id="${ids.regions}" class="region-chips"></div>`;return card}));
let regions=regionsFor(prefs.module),units=unitsFor(prefs.module);
const dailyBones=(date,region,progress)=>activeSection?dailySection(date,activeSection,progress):selectDaily(date,region,progress,prefs.module);
const progressFor=(region,progress)=>moduleProgress(region,progress,prefs.module);
const progressKey=()=>activeModule().progressKey;
const noun=()=>activeModule().noun;
const title=()=>activeSection?`${activeSection.number} ${activeSection.title}`:activeModule().title;
prefs.region=regions.some(r=>r.id===prefs.region)?prefs.region:'all';
const landmarkKey='kemik:curriculum:landmarks:v22';
function readProgress(module=prefs.module){
 const stored=read(getModule(module).progressKey,{});const base=stored&&typeof stored==='object'&&!Array.isArray(stored)?stored:{};
 if(!getModule(module).staged)return base;
 const structures=read(landmarkKey,{})||{};
 return mergeLumbarProgress({...base,cards:base.cards?{...base.cards,...structures.cards}:undefined,history:{...base.history,...structures.history},unlocks:structures.unlocks||{}});
}
function saveProgress(){
 if(!activeModule().staged){write(progressKey(),progress);return;}
 const split=object=>[Object.fromEntries(Object.entries(object||{}).filter(([id])=>!id.startsWith('landmark-'))),Object.fromEntries(Object.entries(object||{}).filter(([id])=>id.startsWith('landmark-')))];
 const [cards,landmarkCards]=split(progress.cards),[history,landmarkHistory]=split(progress.history);
 const {unlocks,...base}=progress;write(progressKey(),{...base,cards,history});
 write(landmarkKey,{cards:landmarkCards,history:landmarkHistory,unlocks});
}
let progress=readProgress();
if(!progress||typeof progress!=='object'||Array.isArray(progress))progress={learned:{},history:{}};
if(activeModule().staged&&!progress.migratedV4){const records={};try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('kemik:v4:'))records[key]=read(key,null);}}catch{}migrateLegacy(progress,records);}
migrateCards(progress,date);if(activeModule().staged){Object.assign(progress.cards,read(landmarkKey,{})?.cards);mergeLumbarProgress(progress);}
const stateKey=()=>activeSection?`kemik:course:v31:${date}:${activeSection.number}`:`${activeModule().dayPrefix}:${date}:${prefs.region}`;
function loadDay(){
 const stored=read(stateKey(),null);
 if(stored?.units){stored.units=stored.units.map(id=>id==='landmark-v24-315'?'landmark-v24-353':id);for(const queue of Object.values(stored.queues||{}))for(const item of queue)if(item.id==='landmark-v24-315')item.id='landmark-v24-353';}
 if(stored&&Array.isArray(stored.units)&&stored.units.length>0&&stored.units.length<=8&&new Set(stored.units).size===stored.units.length&&stored.units.every(id=>units.some(b=>b.id===id)&&(!activeSection||activeSection.items.some(b=>b.id===id)))&&Number.isInteger(stored.round)&&stored.round>=0&&stored.round<=2&&Number.isInteger(stored.index)&&stored.index>=0&&stored.index<(stored.queues?.[stored.round]?.length||8)&&typeof stored.typed==='string'&&stored.misses&&typeof stored.misses==='object')return {...fresh(),...stored};
 // Preserve old partial days untouched; their question IDs differ from the new curriculum.
 const selected=dailyBones(date,prefs.region,progress).map(b=>b.id);return {...fresh(),units:selected,done:!selected.length};
}
let state=loadDay();
const dayUnits=()=>state.units.map(id=>units.find(b=>b.id===id));
let route='/',skullStarted=false;
let skull,busy=false,submitted=false,timer=null;const sound=new GameSound(prefs.sound);
const systemTheme=matchMedia('(prefers-color-scheme: dark)');
prefs.keyboard=prefs.keyboard==='phone'?'phone':'game';
function paintPreferences(){
 const dark=prefs.theme?prefs.theme==='dark':systemTheme.matches;
 document.documentElement.dataset.theme=dark?'dark':'light';
 document.querySelector('meta[name="theme-color"]').content=dark?'#1b1a19':'#e9e7e3';
 $('#theme').setAttribute('aria-pressed',String(dark));$('#theme').textContent=dark?'☀':'☾';
 skull?.setTheme(dark);
 const phone=prefs.keyboard==='phone';document.body.classList.toggle('phone-mode',phone);
 $('#keyboard-mode').setAttribute('aria-pressed',String(phone));
 $('#keyboard-mode').setAttribute('aria-label',`Klavye: ${phone?'Telefon klavyesi':'Oyun klavyesi'}`);
 $('#keyboard-mode').title=phone?'Telefon klavyesi':'Oyun klavyesi';
 $('#keyboard-switch').textContent=phone?'Oyun klavyesine dön':'Telefon klavyesiyle yaz';
 $('#keyboard-switch').setAttribute('aria-pressed',String(phone));
 $('#phone-input').disabled=!phone;fitViewport();
 $('#answer').setAttribute('aria-label',phone?`${noun()} adını telefon klavyesiyle yazmak için dokunun.`:`${noun()} adını ekran klavyesiyle veya fiziksel klavyeyle yazın.`);
}
function focusAnswer(){if(state.done||route!=='/oyun')return;(prefs.keyboard==='phone'?$('#phone-input'):$('#answer')).focus({preventScroll:true})}
$('#theme').onclick=()=>{prefs.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';save();paintPreferences()};
systemTheme.addEventListener('change',()=>{if(!prefs.theme)paintPreferences()});
function toggleKeyboard(){
 prefs.keyboard=prefs.keyboard==='phone'?'game':'phone';
 // Keep focus in this user gesture: iOS will not open its keyboard after a timer.
 phoneInput.disabled=prefs.keyboard!=='phone';focusAnswer();save();paint();
}
$('#keyboard-mode').onclick=toggleKeyboard;
$('#keyboard-switch').onclick=toggleKeyboard;
// Keep a sentinel before the caret so iOS emits backward deletion even after
// each committed text batch has been consumed. The game owns the answer value.
const phoneInput=$('#phone-input'),sentinel='\u200b';let composing=false,pendingComposition=null;
function resetPhoneInput(){phoneInput.value=sentinel;phoneInput.setSelectionRange(1,1)}
// Treat replacement/composition text as one commit, never accept its middle.
function insertPhoneText(text){
 for(const letter of (text||'').normalize('NFC'))if(letter!==sentinel)act(letter,false);
 autoSubmit();
}
resetPhoneInput();
phoneInput.addEventListener('beforeinput',e=>{
 if(e.isComposing||composing||pendingComposition||!e.cancelable)return;
 if(e.inputType==='deleteContentBackward'){e.preventDefault();act('Backspace');resetPhoneInput()}
 else if(e.inputType==='insertLineBreak'||e.inputType==='insertParagraph'){e.preventDefault();act('Enter');resetPhoneInput()}
 else if(e.inputType==='insertText'&&e.data!==null){e.preventDefault();insertPhoneText(e.data);resetPhoneInput()}
});
phoneInput.addEventListener('input',e=>{
 if(e.isComposing||composing)return;
 // Fallback for engines that only deliver input (paste, dictation, replacement).
 const value=phoneInput.value.replaceAll(sentinel,'');
 pendingComposition=null;
 if(e.inputType==='deleteContentBackward')act('Backspace');else if(['insertLineBreak','insertParagraph'].includes(e.inputType))act('Enter');else insertPhoneText(value);
 resetPhoneInput();
});
phoneInput.addEventListener('compositionstart',()=>{composing=true});
phoneInput.addEventListener('compositionend',e=>{
 composing=false;const pending=pendingComposition={text:e.data};
 // Safari and Chromium place the final input on different sides of
 // compositionend. Consume the committed batch once after either ordering.
 queueMicrotask(()=>{if(pendingComposition!==pending)return;pendingComposition=null;insertPhoneText(phoneInput.value.replaceAll(sentinel,'')||pending.text);resetPhoneInput()});
});
$('#answer').addEventListener('focus',()=>{if(prefs.keyboard==='phone')focusAnswer()});
document.addEventListener('pointerdown',e=>{
 if(route!=='/oyun'||prefs.keyboard!=='phone'||state.done||$('#instructions').open||e.target.closest('button,a,input,nav,dialog'))return;
 if(e.target.closest('#answer-area')||e.clientY>=(window.visualViewport?.height||innerHeight)/2){e.preventDefault();focusAnswer()}
});
// iOS resizes the visual viewport rather than 100vh when its keyboard opens.
function fitViewport(){
 const v=window.visualViewport,h=v?.height||innerHeight;
 document.documentElement.style.setProperty('--viewport-height',`${h}px`);
 document.documentElement.style.setProperty('--viewport-top',`${v?.offsetTop||0}px`);
 document.body.classList.toggle('system-keyboard-open',prefs.keyboard==='phone'&&innerHeight-h>120);
}
window.visualViewport?.addEventListener('resize',fitViewport);
window.visualViewport?.addEventListener('scroll',fitViewport);
window.addEventListener('resize',fitViewport);fitViewport();
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>sound.unlock(),{capture:true});
const queue=()=>{state.queues??={};return state.queues[state.round]??=(activeSection?dayUnits():roundBones(date,state.round,dayUnits())).map(b=>({id:b.id,practice:false}));};
const current=()=>units.find(b=>b.id===queue()[state.index].id);
const isPractice=()=>!!queue()[state.index].practice;
const name=b=>prefs.mode==='latin'?b.latin:b.tr;

const aliases=b=>answerAliases(b,prefs.mode);
const display=s=>prefs.upper?s.toLocaleUpperCase(prefs.mode==='tr'?'tr-TR':'en-US'):s.toLocaleLowerCase(prefs.mode==='tr'?'tr-TR':'en-US');
function save(){write(stateKey(),state);saveProgress();write('kemik:preferences',prefs)}
function streak(){const s=read('kemik:streak',{count:0,last:null});return s.last&&(dayNumber(date)-dayNumber(s.last)<=1)?s.count:0;}
function paint(){
 document.body.dataset.section=activeSection?'true':'false';$('#game-title').textContent=route==='/'?'İçindekiler':title();document.title=(route==='/'?'İçindekiler':title())+' · DocBrain';$('#game-module').value=prefs.module;$('#home-module').value=prefs.module;$('#game-module').hidden=!!activeSection;$('.region-picker').hidden=!!activeSection;
 $('#game').setAttribute('aria-label',noun()+' adlandırma oyunu');$('#phone-input').setAttribute('aria-label',noun()+' adını yazın');
 $('#region-label').textContent=regions.find(r=>r.id===prefs.region)[matchMedia('(max-width:600px)').matches?'short':'label'];
 document.querySelectorAll('[data-region]').forEach(el=>el.setAttribute('aria-selected',String(el.dataset.region===prefs.region)));
 $('#region').setAttribute('aria-label',`Vücut bölgesi: ${$('#region-label').textContent}`);
 $('#date').textContent=new Date(date+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});$('#date').dateTime=date;
 $('#streak').textContent=streak();$('#case').setAttribute('aria-pressed',String(prefs.upper));$('#case').setAttribute('aria-label',prefs.upper?'Küçük harf kullan':'Büyük harf kullan');
 $('#sound').textContent=prefs.sound?'Ses açık':'Ses kapalı';$('#sound').setAttribute('aria-pressed',String(prefs.sound));
 paintPreferences();
 $('#game').hidden=route!=='/oyun'||state.done;$('#results').hidden=route!=='/oyun'||!state.done;
 if(route!=='/oyun'){if(route==='/')homePaint();return;}
 if(state.done){$('#phone-input').blur();renderResults();return}
 $('#game').classList.toggle('round-ended',!!state.between);$('#round-end').hidden=!state.between;$('#answer-area').hidden=!!state.between;$('#keyboard').hidden=!!state.between||prefs.keyboard==='phone';
 $('#keyboard-switch').hidden=!!state.between;
 if(state.between){$('#round-end-title').textContent=`Tur ${state.round} bitti · ${state.lastRoundSize||8} / ${state.lastRoundSize||8}`;$('#round-end-copy').textContent=state.round===1?`${state.units.length} ${activeModule().accusative} gördünüz. Şimdi adlar gizleniyor: ilk harf ve kısa bir ipucu kalıyor.`:`Şimdi ipucu yok. ${activeModule().label} öbür taraftan, ezberden.`;$('#next-round').innerHTML=`${state.round+1}. tura başla <kbd>gir</kbd>`;return}
 const b=current();const card=progress.cards[b.id]??={box:0,due:date,hints:0,errors:0,lastSeen:null};card.lastSeen=date;saveProgress();$('#round').textContent=`${activeSection?'Düzey '+activeSection.items.find(i=>i.id===b.id).tier+' · ':''}Tur ${state.round+1} · ${['Görerek yazın','İlk harften hatırlayın','Diğer taraftan, ezberden yazın'][state.round]} · ${state.index+1} / ${queue().length}`;
 renderAnswer();$('#translation').textContent=state.round===1?b.clue:state.round===0?(prefs.mode==='tr'?b.latin:b.tr):'';
 $('#explanation').textContent=state.round===0||submitted?b.fact:'';
 skull?.setBone(b,state.round);buildKeyboard();
}
const questionKey=()=>`${state.round}:${current().id}${isPractice()?`:practice:${state.index}`:''}`;
const questionHint=()=>state.hints?.[questionKey()];
function hintTarget(){return aliases(current()).find(a=>a.startsWith(normalize(state.typed)))||name(current());}
function revealHint(){
 if(state.round===0||state.done||state.between||busy)return;
 if(!aliases(current()).some(a=>a.startsWith(normalize(state.typed)))){$('#feedback').textContent='Önce yanlış harfi silin.';return}
 const target=hintTarget(),old=questionHint(),offset=answerOffset(target,state.typed),start=Math.max(offset,old?.until||0);
 const until=nextHintUntil(target,state.round,offset,old?.until||0);
 if(until===start)return;
 (state.hints??={})[questionKey()]={count:(old?.count||0)+1,until};
 $('#feedback').textContent='';sound.play('hint');save();renderAnswer();
}
const autoPrefix=b=>(name(b).match(/^(?:mm?|nn?|aa?|vv?|rr?|ligg?)\. /)||[''])[0];
function fillPrefix(){const b=current(),p=autoPrefix(b);if(p&&!state.typed&&!(state.prefixCleared||{})[questionKey()])state.typed=p;}
function renderAnswer(){
 fillPrefix();
 const b=current(),out=$('#answer'),previous=out.dataset.typed||'';let target=name(b);const matched=aliases(b).find(a=>a.startsWith(normalize(state.typed)));if(state.typed&&matched&&matched!==normalize(target))target=matched;out.dataset.typed=state.typed;out.replaceChildren();out.classList.toggle('long',target.length>22||state.typed.length>22);
 const typed=state.typed;let prefix='';
 for(let i=0;i<typed.length;i++){prefix+=typed[i];const span=document.createElement('span');span.className=i>=previous.length&&typed.startsWith(previous)?'letter':'settled';if(!aliases(b).some(a=>a.startsWith(normalize(prefix))))span.classList.add('wrong');span.textContent=display(typed[i]);out.append(span)}
 const hint=submitted?'':answerHint(target,state.round,answerOffset(target,typed),questionHint()?.until||0);
 $('#hint').hidden=state.round===0;$('#hint').disabled=submitted;
 const ghost=document.createElement('span');ghost.className='ghost';ghost.textContent=display(hint);
 const caret=document.createElement('span');caret.className='caret';caret.setAttribute('aria-hidden','true');if(!submitted)out.append(caret);out.append(ghost);
 const ready=aliases(b).includes(normalize(typed));document.querySelector('[data-key="Enter"]')?.classList.toggle('ready',ready);
 out.setAttribute('aria-description',`${display(typed)}${hint?' '+display(hint):''}`);
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
 for(const row of rows){const el=document.createElement('div');el.className='keyrow';for(const item of row){const k=typeof item==='string'?{label:prefs.upper?item.toLocaleUpperCase('tr-TR'):item,key:item}:item;const button=document.createElement('button');button.type='button';button.className='key '+(k.width||'');button.textContent=k.label;button.dataset.key=k.key;button.tabIndex=k.key==='none'?-1:0;button.setAttribute('aria-label',k.key===' '?'Boşluk':k.key==='Tab'?(state.round===0?'tab · Sıradaki sözcük':'tab · İpucu getir'):k.key==='Backspace'?'Son harfi sil':k.key==='Enter'?'gir · Yanıtı gönder':k.label);if(k.key==='none')button.setAttribute('aria-hidden','true');if(k.key==='CapsLock'&&prefs.upper)button.classList.add('mod-on');el.append(button)}keyboard.append(el)}
 document.querySelector('[data-key="Enter"]').classList.toggle('ready',aliases(current()).includes(normalize(state.typed)));
}
function pressFeedback(key){for(const el of document.querySelectorAll('.key'))if(el.dataset.key===key||el.dataset.key.toLocaleLowerCase('tr-TR')===key.toLocaleLowerCase('tr-TR')){el.classList.add('pressed');setTimeout(()=>el.classList.remove('pressed'),110)}}
const clearPressed=()=>document.querySelectorAll('.key.pressed').forEach(el=>el.classList.remove('pressed'));
for(const event of ['pointerup','pointercancel','touchend','touchcancel','keyup'])document.addEventListener(event,clearPressed,{passive:true});
window.addEventListener('blur',clearPressed);
function noteMiss(){progress.history??={};const h=progress.history[current().id]??={};h.missed=date;}
function wrong(message){sound.play('wrong');if(prefs.sound)navigator.vibrate?.(15);$('#feedback').textContent=message;const el=$('#answer-area');el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake');}
function autoSubmit(){
 if(route==='/oyun'&&!state.done&&!state.between&&!busy&&!composing&&!pendingComposition&&shouldAutoSubmit(state.typed,aliases(current())))submit();
}
function act(key,auto=true){
 if(route!=='/oyun'||state.done||busy)return;if(state.between){if(key==='Enter')startRound();return}sound.unlock();pressFeedback(key);
 if(key==='Shift'||key==='CapsLock'){prefs.upper=!prefs.upper;save();paint();return}
 if(key==='Backspace'){if(state.typed&&state.typed===autoPrefix(current()))(state.prefixCleared??={})[questionKey()]=true;state.typed=state.typed.slice(0,-1);sound.play('key');$('#feedback').textContent='';save();renderAnswer();return}
 if(key==='Enter'){submit();return}
 if(key==='Tab'){if(state.round===0)key=' ';else{revealHint();return}}
 if(key.length!==1||state.typed.length>=Math.max(60,...aliases(current()).map(a=>a.length))||(!/[\p{L}0-9 "*<,.\-]/u.test(key)))return;
 {const p=autoPrefix(current()),ok=t=>aliases(current()).some(a=>a.startsWith(normalize(t)));if(p&&state.typed===p&&!ok(p+key)&&ok(key)){state.typed='';(state.prefixCleared??={})[questionKey()]=true;}}
 state.typed+=key;state.keystrokes++;
 const okay=aliases(current()).some(a=>a.startsWith(normalize(state.typed)));
 if(okay){state.correctKeys++;if(key!==' ')sound.play('letter',state.typed.length-1);$('#feedback').textContent='';}else{state.errors++;state.questionErrors=(state.questionErrors||0)+1;if(state.round===2){state.round3Errors=(state.round3Errors||0)+1;(state.round3Misses??={})[current().id]=true;}state.misses[current().id]=(state.misses[current().id]||0)+1;noteMiss();wrong('Bu harfi kontrol edin. Sil tuşuyla düzeltebilirsiniz.');}
 save();renderAnswer();if(auto)autoSubmit();
}
function submit(){
 if(busy)return;
 if(!state.typed.trim()){wrong(`Önce ${activeModule().possessive} adını yazın.`);return}
 state.attempts++;
 if(!aliases(current()).includes(normalize(state.typed))){state.questionErrors=(state.questionErrors||0)+1;if(state.round===2){state.round3Errors=(state.round3Errors||0)+1;(state.round3Misses??={})[current().id]=true;}state.misses[current().id]=(state.misses[current().id]||0)+1;noteMiss();wrong(`Bu ${activeModule().possessive} adını yeniden deneyin.`);save();return}
 if(state.round>0){
  const hints=questionHint()?.count||0,errors=state.questionErrors||0,practice=isPractice();
  state.answered??={};const receipt=questionKey();
  if(!state.answered[receipt]){recordGrade(progress,current().id,date,state.round,{hints,errors},practice);
  state.grades??={};if(!practice){const grades=state.grades[current().id]??={};grades[state.round]=hints||errors?'again':'good';if(hints||errors)state.queues[state.round]=reinsert(queue(),state.index);}
  state.answered[receipt]=true;}save();
 }
 busy=true;submitted=true;sound.play('correct');$('#feedback').textContent='Doğru.';state.first+=state.round>0&&!isPractice()&&!state.questionErrors&&!questionHint()?.count?1:0;state.typed=name(current());paint();
 timer=setTimeout(()=>{submitted=false;$('#game').classList.add(state.index===queue().length-1?'dissolving':'transitioning');timer=setTimeout(()=>{next();$('#game').classList.remove('transitioning','dissolving');},state.index===queue().length-1?540:220)},700);
}
function next(){
 state.typed='';state.questionErrors=0;state.index++;if(state.index===queue().length){state.lastRoundSize=queue().length;state.index=0;state.round++;if(state.round<3){state.between=true;sound.play('round');}if(state.round===3){state.round=2;state.index=queue().length-1;state.done=true;sound.play('day');state.elapsed=Date.now()-state.started;const s=read('kemik:streak',{last:null,count:0});if(s.last!==date)write('kemik:streak',{last:date,count:s.last&&dayNumber(date)-dayNumber(s.last)===1?s.count+1:1});}}
 busy=false;$('#feedback').textContent='';save();paint();
}
function startRound(){if(!state.between)return;state.between=false;save();paint();focusAnswer();}
$('#next-round').onclick=startRound;
$('#hint').onclick=()=>{act('Tab');focusAnswer()};$('#hint').addEventListener('pointerdown',e=>e.preventDefault());
function renderResults(){
 const total=state.keystrokes||1,accuracy=Math.round(state.correctKeys/total*100),first=firstTryPercent(state),wpm=Math.round(state.correctKeys/5/Math.max(state.elapsed/60000,.1));const host=$('#results');host.replaceChildren();
 const add=(tag,text,cls,parent=host)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;parent.append(el);return el};
 if(activeSection){const st=sectionStatus(activeSection,progress);add('p',`${activeSection.number} ${activeSection.title} · ${st.count}/${st.total} öğrenildi`);const nextSection=sections[sections.indexOf(activeSection)+1];const link=add('a','İçindekilere dön','text-button');link.href='#/';if(st.complete&&nextSection){const next=add('button',`Önerilen sıradaki bölüm · ${nextSection.number} ${nextSection.title}`,'primary');next.onclick=()=>openSection(nextSection);}}
 if(!state.units.length){add('h2','Bugün için tekrar yok.');add('p','Yeni adım açabilir veya tekrar zamanı geldiğinde dönebilirsiniz.');return;}
 add('p',`Gün tamamlandı · ${date}`,'eyebrow');add('h2',`Bugünün ${state.units.length} ${activeModule().accusative} üç turda çalıştınız.`);
 const nextDue=dueSummary(progress,state.units,date)[0];
 const nextLabel=nextDue?(nextDue.days===1?'Yarın':`${nextDue.days} gün sonra`):'Planlanmadı';
 const stats=add('div','','stats');for(const [label,val] of [['İlk denemede',`%${first}`],['Sonraki tekrar',nextLabel],['Kelime/dk · isabet',`${wpm} · %${accuracy}`]]){const item=add('div','',null,stats);add('small',label,null,item);add('strong',val,null,item)}
 const again=dayUnits().filter(b=>Object.values(state.grades?.[b.id]||{}).includes('again'));
 add('h4',`Tekrar: ${again.length} ${noun()} yarın geri gelecek`);
 if(again.length){const list=add('ul','','repetition-list');for(const b of again)add('li',b.latin,null,list);}
 for(const summary of dueSummary(progress,state.units,date))add('p',`${summary.days===1?'Yarın':summary.days+' gün sonra'}: ${summary.count} ${noun()}`,'due-summary');
 const miles=add('div','','milestones');for(const [text,achieved] of [['Günü tamamla',true],['3. turu hatasız bitir',!state.round3Errors&&!Object.keys(state.hints||{}).some(k=>k.startsWith('2:'))],['Aralıklı tekrar planlandı',true]]){const p=add('div','',null,miles);add('span','★',achieved?'achieved':'pending',p);p.append(document.createTextNode(text))}
 const regional=progressFor(prefs.region,progress),whole=progressFor('all',progress);
 const wholeProgress=prefs.region==='all'?'':` · ${regions[0].label}: ${whole.count} / ${whole.total}`;
 add('p',`${regions.find(r=>r.id===prefs.region).label}: ${regional.count} / ${regional.total} öğrenildi${wholeProgress} · Seviye: ${levels[regional.level]}`,'curriculum-progress');
 const reviewTitle=add('h4','Bildiklerin');reviewTitle.id='review-cards';reviewTitle.tabIndex=-1;const grid=add('div','','result-grid');for(const b of dayUnits()){const card=add('article','','result-card',grid);add('h3',display(name(b)),null,card);add('p',b.fact,null,card);const status=resultStatus(state,b.id);add('p',status,status==='ilk denemede'?'score':'score retry',card)}
 add('h4','Sınav için');for(const note of notesForDay(dayUnits())){const p=add('p',note.text,'study-note');if(note.url){const a=document.createElement('a');a.href=note.url;a.textContent=' Kaynak';a.target='_blank';a.rel='noreferrer';p.append(a)}}
 const button=add('button','Sonuçları paylaş','primary');button.onclick=()=>shareResults(button,accuracy);
 const review=add('button','Tekrar gözden geçir','text-button');review.onclick=reviewDay;
}
$('#keyboard').addEventListener('click',e=>{const button=e.target.closest('[data-key]');if(button)act(button.dataset.key)});
document.addEventListener('keydown',e=>{if(route!=='/oyun'||document.querySelector('dialog[open]'))return;if(e.target===$('#phone-input')){if(e.key==='Enter'&&!e.isComposing&&!composing&&!pendingComposition){e.preventDefault();act('Enter')}return}if(e.isComposing||$('#instructions').open||e.ctrlKey||e.metaKey||e.altKey)return;if(e.target.closest('nav')||e.target.closest('#results')||e.target.closest('footer')||e.target.closest('#install-hint'))return;if(e.key==='Tab')return;if(e.target.closest('a,button,select,textarea,input')&&['Enter',' '].includes(e.key))return;if(e.key===' '||e.key==='Enter'||e.key==='Backspace'||e.key.length===1){e.preventDefault();act(e.key)}});
const regionButton=$('#region'),regionMenu=$('#region-menu');
function rebuildRegions(){regionMenu.replaceChildren();$('#setting-region').replaceChildren();for(const r of regions){const o=document.createElement('option');o.value=r.id;o.textContent=r.label;$('#setting-region').append(o);const option=document.createElement('button');option.type='button';option.role='option';option.dataset.region=r.id;option.textContent=r.label;option.onclick=()=>{
 if(activeSection){save();activeSection=null;state=loadDay();}
 clearTimeout(timer);if(busy){submitted=false;next();}save();prefs.region=r.id;state=loadDay();busy=false;submitted=false;
 $('#game').classList.remove('transitioning','dissolving');$('#feedback').textContent='';
 regionMenu.hidden=true;regionButton.setAttribute('aria-expanded','false');save();paint();regionButton.focus();
 };regionMenu.append(option);}}
rebuildRegions();
regionButton.onclick=()=>{regionMenu.hidden=!regionMenu.hidden;regionButton.setAttribute('aria-expanded',String(!regionMenu.hidden));if(!regionMenu.hidden)regionMenu.querySelector(`[data-region="${prefs.region}"]`).focus();};
document.addEventListener('click',e=>{if(!e.target.closest('.region-picker')){regionMenu.hidden=true;regionButton.setAttribute('aria-expanded','false');}});
regionMenu.addEventListener('keydown',e=>{const options=[...regionMenu.children],i=options.indexOf(document.activeElement);if(e.key==='Escape'){regionMenu.hidden=true;regionButton.setAttribute('aria-expanded','false');regionButton.focus();}if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();options[e.key==='Home'?0:e.key==='End'?options.length-1:(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length].focus();}});
window.addEventListener('resize',()=>{$('#region-label').textContent=regions.find(r=>r.id===prefs.region)[innerWidth<=600?'short':'label'];});
$('#case').onclick=()=>{prefs.upper=!prefs.upper;save();paint();if(!state.done)focusAnswer()};
$('#sound').onclick=()=>{prefs.sound=!prefs.sound;sound.enabled=prefs.sound;sound.unlock();save();paint();if(!state.done)focusAnswer()};
$('#help').onclick=()=>{$('#reset-confirmation').hidden=true;$('#reset-progress').hidden=false;$('#instructions').showModal()};
$('#reset-progress').onclick=()=>{$('#reset-progress').hidden=true;$('#reset-confirmation').hidden=false;$('#cancel-reset').focus()};
$('#cancel-reset').onclick=()=>{$('#reset-confirmation').hidden=true;$('#reset-progress').hidden=false;$('#reset-progress').focus()};
$('#confirm-reset').onclick=()=>{if(resetProgress()){clearTimeout(timer);location.reload()}};
$('#close-help').onclick=$('#start').onclick=()=>{$('#instructions').close();focusAnswer()};
function checkDay(){if(date!==localDate()){clearTimeout(timer);save();date=localDate();state=loadDay();save();busy=false;submitted=false;$('#game').classList.remove('transitioning','dissolving');paint();if(route==='/'){homePaint();skull?.setBone(heroBone(),0)}}}
setInterval(checkDay,30000);document.addEventListener('visibilitychange',checkDay);
async function shareResults(button,accuracy){
 const text=`${title()} · ${date}\n${state.units.length} ${noun()} · 3 tur · %${accuracy} doğruluk\n${streak()} günlük seri\n${BASE_URL}`;
 try{if(navigator.share){await navigator.share({title:title(),text});return}}catch(e){if(e.name==='AbortError')return}
 try{await navigator.clipboard.writeText(text);button.textContent='Bağlantıyla birlikte kopyalandı.'}catch{const input=document.createElement('textarea');input.value=text;input.setAttribute('aria-label','Paylaşılacak sonuç');button.after(input);input.focus();input.select();button.textContent='Metni seçip kopyalayabilirsiniz.'}
}
function reviewDay(){location.hash='/oyun';requestAnimationFrame(()=>{renderResults();$('#review-cards')?.focus();$('#review-cards')?.scrollIntoView({behavior:'instant'});});}
$('#review-day').onclick=reviewDay;
const stage=$('#stage');
function coursePaint(){
 const progressByModule=Object.fromEntries(modules.map(m=>[m.id,m.id===prefs.module?progress:readProgress(m.id)]));
 const recommended=recommendedSection(progressByModule),host=$('#course-recommendation');host.replaceChildren();
 if(recommended){const st=sectionStatus(recommended,progressByModule[recommended.module]);const copy=document.createElement('p');copy.textContent=`Önerilen bölüm · ${recommended.number} ${recommended.title} · ${st.count}/${st.total} öğrenildi. Düzeyler: ${st.tiers.map(t=>t.tier+' '+(t.open?'açık':'kilitli')).join(' · ')}`;const button=document.createElement('button');button.id='course-continue';button.className='primary';button.textContent='Devam et';button.onclick=()=>openSection(recommended);host.append(copy,button);}else{host.textContent='Tüm bölümler öğrenildi. Tekrar için istediğiniz bölümü açın.';}
 const list=$('#course-chapters');list.replaceChildren();
 for(const chapter of chapters){const article=document.createElement('article');article.className='course-chapter';const h=document.createElement('h3');h.textContent=`${chapter.number}. ${chapter.title}`;article.append(h);
 if(chapter.soon){const p=document.createElement('p');p.className='muted';p.textContent='Yakında';article.append(p);}
 for(const section of sections.filter(s=>s.number.split('.')[0]===chapter.number)){const st=sectionStatus(section,progressByModule[section.module]),row=document.createElement('div');row.className='course-row';row.dataset.section=section.number;if(section===recommended)row.classList.add('recommended');const a=document.createElement('a');a.href=`#/oyun?bolum=${section.number}`;a.textContent=`${section.number} ${section.title}`;a.onclick=e=>{e.preventDefault();openSection(section)};const detail=document.createElement('span');detail.textContent=`${st.total} yapı · %${st.percent} öğrenildi`;const meter=document.createElement('progress');meter.max=st.total||1;meter.value=st.count;meter.setAttribute('aria-label',`${section.number} ${section.title}: ${st.count}/${st.total} öğrenildi`);row.append(a,detail,meter);article.append(row);}
 list.append(article);}
}
$('#home-start').onclick=()=>{if(activeSection){save();activeSection=null;state=loadDay();save();paint();}};
async function openSection(section){
 clearTimeout(timer);if(busy){submitted=false;next();}save();busy=false;submitted=false;
 await loadModule(section.module);prefs.module=section.module;activeSection=section;regions=regionsFor(prefs.module);units=unitsFor(prefs.module);prefs.region='all';progress=readProgress();migrateCards(progress,date);state=loadDay();rebuildRegions();save();
 $('#game').classList.remove('transitioning','dissolving');$('#feedback').textContent='';
 const hash=`#/oyun?bolum=${section.number}`;if(location.hash!==hash)location.hash=hash;applyRoute();
}
function homePaint(){
 coursePaint();
 const started=state.round>0||state.index>0||!!state.typed;
 const lesson=state.units.map(id=>units.find(b=>b.id===id)),onlyBones=lesson.every(b=>b&&!b.parentBone),onlyLandmarks=lesson.every(b=>b?.parentBone);
 const readyNoun=activeModule().staged?(onlyBones?'kemiği':onlyLandmarks?'yapısı':'soru'):activeModule().ready;
 const startNoun=activeModule().staged?(onlyBones?'kemiklerine':onlyLandmarks?'yapılarına':'sorularına'):activeModule().start;
 const lockedText=(stage,parent)=>stage===1?(parent==='skull-regions'?'kilitli · Kafatası kemiklerinin %50’sini öğren':'kilitli · önce kemiği öğren'):`kilitli · Adım ${stage-1}${stage===2?"'in":"'nin"} %80'i öğrenilince açılır`;
 $('#home-title').replaceChildren(document.createTextNode(title()));const dot=document.createElement('span');dot.className='accent';dot.textContent='.';$('#home-title').append(dot);
 $('.subtitle').textContent=`Her gün en çok sekiz ${noun()}, üç tur. ${prefs.mode==='tr'?'Türkçe':'Latince'} adlarıyla.`;
 $('#home-status').textContent=!state.units.length?'Bugün için tekrar yok. Yeni adım açabilirsiniz.':state.done?`Bugün tamamlandı · yarın yeni ${activeModule().plural}`:started?'Kaldığınız yer hazır.':activeModule().staged&&!onlyBones&&!onlyLandmarks?`Bugün ${state.units.length} soru hazır.`:`Bugünün ${state.units.length} ${readyNoun} hazır.`;
 $('#home-start').textContent=!state.units.length?'Çalışma durumunu gör':state.done?'Bugünün sonuçlarını gör':started?`Devam et · Tur ${state.round+1} · ${state.index+1} / ${queue().length}`:`Bugünün ${startNoun} başla`;
 $('#review-day').hidden=!state.done;
 const tomorrow=new Date(date+'T12:00:00');tomorrow.setDate(tomorrow.getDate()+1);const next=tomorrow.toLocaleDateString('sv-SE');
 const due=Object.values(progress.cards||{}).filter(c=>c.box>0&&c.due<=next).length;
 $('#home-stats').textContent=`${streak()} günlük seri · Yarın tekrar: ${due} ${noun()}`;
 for(const {id:module} of modules){
  const p=module===prefs.module?progress:readProgress(module),whole=moduleProgress('all',p,module),dom=moduleDom(module);
  $(`#module-${module}`).classList.toggle('active',module===prefs.module);
  $(`#module-${module} [data-module]`).setAttribute('aria-pressed',String(module===prefs.module));
  $('#'+dom.progress).textContent=`${whole.count} / ${whole.total} öğrenildi`;
  const meter=$('#'+dom.meter);meter.value=whole.count;meter.max=whole.total;
  const chips=$('#'+dom.regions);chips.replaceChildren();
  for(const r of regionsFor(module).filter(r=>r.id!=='all')){
   const count=moduleProgress(r.id,p,module),a=document.createElement('button');
   const ladder=getModule(module).staged?ladderFor(r.id,p):null;
   a.textContent=ladder?`${r.label} · Kemikler ${ladder.bones.count}/${ladder.bones.total}`:`${r.label} · ${count.count} / ${count.total}`;
   a.onclick=async()=>{await switchModule(module);regionMenu.querySelector(`[data-region="${r.id}"]`).click();location.hash='/oyun'};chips.append(a);
   if(ladder){const detail=document.createElement('details');detail.className='bone-ladder';
    const summary=document.createElement('summary');summary.textContent='Kemik yapıları · '+ladder.steps.filter(s=>s.total).map(s=>`Adım ${s.stage}: ${s.count}/${s.total}${s.open<s.total?' · '+lockedText(s.stage):''}`).join(' · ');detail.append(summary);
    for(const step of ladder.steps.filter(s=>s.total&&s.open<s.total)){
     const skip=document.createElement('button');skip.className='text-button';skip.textContent=`Adım ${step.stage} · Bu adımı zaten biliyorum, aç`;
     skip.onclick=async()=>{await switchModule('bones');for(const parent of [...bones.filter(b=>b.curriculumRegion===r.id),...(r.id==='skull'?[{id:'skull-regions'}]:[])])unlockStage(progress,parent.id,step.stage);prefs.region=r.id;
      state=loadDay();if(!state.units.length||!(state.round||state.index||state.typed||state.done))state={...fresh(),units:dailyBones(date,r.id,progress).map(b=>b.id)};
      save();paint();};detail.append(skip);
    }
    for(const parent of ladder.parents){const row=document.createElement('div'),label=document.createElement('strong');label.textContent=parent.latin;row.append(label);
     for(const step of parent.steps.filter(s=>s.total)){const line=document.createElement('p');line.textContent=`Adım ${step.stage}: ${step.count}/${step.total} · ${step.open?'Açık':lockedText(step.stage,parent.id)}`;
      if(!step.open){const open=document.createElement('button');open.className='text-button';open.textContent='Bu adımı zaten biliyorum, aç';open.onclick=async()=>{await switchModule('bones');unlockStage(progress,parent.id,step.stage);if(!state.units.length||!(state.round||state.index||state.typed||state.done)){state={...fresh(),units:dailyBones(date,prefs.region,progress).map(b=>b.id)};}save();homePaint();};line.append(open);}row.append(line);
     }detail.append(row);
    }chips.append(detail);
   }
  }
 }
}
async function switchModule(module){
 if(activeSection){save();activeSection=null;state=loadDay();}
 await loadModule(module);
 if(module===prefs.module){units=unitsFor(module);save();paint();return;}
 clearTimeout(timer);if(busy){submitted=false;next();}busy=false;submitted=false;save();
 prefs.module=module;regions=regionsFor(module);units=unitsFor(module);prefs.region='all';
 progress=readProgress();migrateCards(progress,date);if(activeModule().staged){Object.assign(progress.cards,read(landmarkKey,{})?.cards);mergeLumbarProgress(progress);}state=loadDay();
 $('#game').classList.remove('transitioning','dissolving');$('#feedback').textContent='';regionMenu.hidden=true;regionButton.setAttribute('aria-expanded','false');
 rebuildRegions();save();paint();if(route==='/')skull?.setBone(heroBone(),0);else focusAnswer();
}
for(const el of document.querySelectorAll('[data-module]'))el.onclick=()=>switchModule(el.dataset.module);
for(const id of ['home-module','game-module'])$('#'+id).onchange=e=>switchModule(e.target.value);

function syncSettings(){for(const [id,value] of Object.entries({sound:prefs.sound?'on':'off',theme:prefs.theme||'system',keyboard:prefs.keyboard,language:prefs.mode,case:prefs.upper?'upper':'lower',region:prefs.region}))$(`#setting-${id}`).value=value;}
for(const id of ['sound','theme','keyboard','case','region','language'])$(`#setting-${id}`).onchange=e=>{
 const v=e.target.value;
 if(id==='region'){regionMenu.querySelector(`[data-region="${v}"]`).click();return}
 if(id==='sound'){prefs.sound=v==='on';sound.enabled=prefs.sound}
 if(id==='theme'){if(v==='system')delete prefs.theme;else prefs.theme=v}
 if(id==='language'){prefs.mode=v;state.typed='';resetPhoneInput();}
 if(id==='keyboard')prefs.keyboard=v;if(id==='case')prefs.upper=v==='upper';save();paintPreferences();if(id==='language')paint();
};
$('#settings-reset').append($('#reset-area'));
$('#home-help').onclick=()=>$('#instructions').showModal();
function heroBone(){return dayUnits()[0]||bones.find(b=>prefs.region==='all'||b.curriculumRegion===prefs.region)||bones[0]}
function applyRoute(focus=true){
 const raw=location.hash.slice(1)||'/';const requested=raw.split('?')[0];
 const section=sectionByNumber(new URLSearchParams(raw.split('?')[1]||'').get('bolum'));
 if(section&&section!==activeSection){openSection(section);return;}
 route=['/','/oyun','/ayarlar','/hakkinda'].includes(requested)?requested:'/';
 document.body.dataset.route=route;
 $('#home').hidden=route!=='/';$('#settings').hidden=route!=='/ayarlar';$('#about').hidden=route!=='/hakkinda';
 $('#home-link').hidden=route==='/';$('.topbar nav').hidden=route!=='/oyun';
 $('#phone-input').blur();$('#home-model').append(...(route==='/'?[stage]:[]));if(route==='/oyun')$('#game').prepend(stage);
 if(route==='/'){homePaint();skull?.setBone(heroBone(),0)}
 if(route==='/ayarlar'){syncSettings();$('#reset-confirmation').hidden=true;$('#reset-progress').hidden=false}
 paint();
 if(focus){const title=$(route==='/'?'#contents-title':route==='/ayarlar'?'#settings-title':route==='/hakkinda'?'#about-title':'#answer');title?.focus({preventScroll:true})}
 if(route==='/'||route==='/oyun')loadRenderer();
}
async function loadRenderer(){
 if(skullStarted)return;skullStarted=true;
 // Two frames let the useful home content paint before parsing Three.js.
 requestAnimationFrame(()=>requestAnimationFrame(async()=>{try{
 await pwaReady;const {createSkull}=await import('./skull.js?v=0276220-20261113T072829721Z');skull=await createSkull($('#skull'));paintPreferences();if(route==='/')await skull.setBone(heroBone(),0);else paint();document.body.dataset.ready='true';
 }catch{ $('#loading').hidden=false;$('#loading').classList.add('error');$('#loading').textContent='3B görünüm açılamadı. Ad ve ipuçlarıyla çalışmaya devam edebilirsiniz.';document.body.dataset.ready='error';}}));
}
window.addEventListener('hashchange',()=>applyRoute());
const steps=[['Tur 1 · Gör ve yaz','Kırmızı yapıyı inceleyin. Adını görerek yazın. Doğru yazınca kendiliğinden geçer.','os frontale'],['Tur 2 · İlk harf ve ipucu','İlk harften hatırlayın. Gerekirse ipucu isteyin.','os f…'],['Tur 3 · Ezberden, öbür taraftan','Kemiği farklı açıdan tanıyın. Adını bu kez ezberden yazın.','…']];let onboardingStep=0;
function onboardingPaint(){const [title,copy,example]=steps[onboardingStep];$('#onboarding-title').textContent=title;$('#onboarding-copy').textContent=copy;$('#onboarding-example').textContent=example;$('#onboarding-count').textContent=`${onboardingStep+1} / 3`;$('#onboarding-next').textContent=onboardingStep===2?'Hazırım':'Sonraki'}
function closeOnboarding(){write('kemik:onboarded',true);$('#onboarding').close();$('#course-continue')?.focus()}
$('#onboarding-next').onclick=()=>{if(onboardingStep===2)closeOnboarding();else{onboardingStep++;onboardingPaint()}};$('#onboarding-skip').onclick=closeOnboarding;
$('#onboarding').addEventListener('cancel',e=>{e.preventDefault();closeOnboarding()});
save();applyRoute(false);document.body.dataset.shellReady='true';
if(!read('kemik:onboarded',false)){onboardingPaint();$('#onboarding').showModal()}
