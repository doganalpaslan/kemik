import {bones,dayNumber} from './bones.js?v=2d5a341-20261111T153630630Z';
import {getModule,unitsFor,regionsFor,landmarks} from './module-registry.js?v=2d5a341-20261111T153630630Z';
export {moduleRegistry,modules,getModule,loadModule,regions,muscleRegions,regionsFor,unitsFor,landmarks,loadLandmarks} from './module-registry.js?v=2d5a341-20261111T153630630Z';
export function stageStatus(parent,stage,progress={}){
 const learned=learnedIds(progress),previous=landmarks.filter(b=>b.parentBone===parent&&b.stage===stage-1);
 const skullBones=bones.filter(b=>b.curriculumRegion==='skull');
 const parentLearned=parent==='skull-regions'?skullBones.filter(b=>learned.has(b.id)).length>=Math.ceil(skullBones.length*.5):learned.has(parent);
 const prerequisite=stage===1||!previous.length?parentLearned:previous.filter(b=>learned.has(b.id)).length/previous.length>=.8;
 const manual=!!progress.unlocks?.[`${parent}:${stage}`];
 // Stages without predecessors still require the preceding step to be open.
 const open=manual||(stage===1?prerequisite:stageStatus(parent,stage-1,progress).open&&prerequisite);
 const pool=landmarks.filter(b=>b.parentBone===parent&&b.stage===stage);
 return {open,manual,total:pool.length,count:pool.filter(b=>learned.has(b.id)).length,required:Math.ceil(previous.length*.8),previousCount:previous.filter(b=>learned.has(b.id)).length};
}
export function unlockStage(progress,parent,stage){
 if((parent!=='skull-regions'&&!bones.some(b=>b.id===parent))||![1,2,3].includes(stage))return;
 // Opening a higher step also opens its prerequisite steps; no cards or credit are created.
 progress.unlocks??={};for(let n=1;n<=stage;n++)progress.unlocks[`${parent}:${n}`]=true;
}
export function ladderFor(region,progress={}){
 const parents=bones.filter(b=>region==='all'||b.curriculumRegion===region),learned=learnedIds(progress);
 return {bones:{count:parents.filter(b=>learned.has(b.id)).length,total:parents.length},parents:[...parents,...(region==='skull'||region==='all'?[{id:'skull-regions',latin:'Kafatası bölgeleri · kemiklerin %50’si öğrenilince'}]:[])].filter(b=>landmarks.some(l=>l.parentBone===b.id)).map(b=>({id:b.id,latin:b.latin,steps:[1,2,3].map(n=>({stage:n,...stageStatus(b.id,n,progress)}))})),steps:[1,2,3].map(stage=>{const pool=landmarks.filter(b=>b.stage===stage&&(region==='all'||b.curriculumRegion===region));return {stage,total:pool.length,count:pool.filter(b=>learned.has(b.id)).length,open:pool.filter(b=>stageStatus(b.parentBone,stage,progress).open).length};})};
}
export const levels=['','kolay','orta','zor'];
export const poolFor=(region,module='bones')=>unitsFor(module).filter(b=>region==='all'||b.curriculumRegion===region);
export const intervals={1:1,2:3,3:7,4:14,5:30};
export function addDays(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function migrateCards(progress,today){
 if(progress.cards)return progress;
 progress.cards={};
 for(const id of new Set(Object.values(progress.learned||{}).flat()))progress.cards[id]={box:3,due:addDays(today,7),hints:0,errors:0,lastSeen:progress.history?.[id]?.seen||null};
 delete progress.learned;return progress;
}
export function learnedIds(progress={}){return new Set(progress.cards?Object.entries(progress.cards).filter(([,c])=>c.box>=3).map(([id])=>id):Object.values(progress.learned||{}).flat());}
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function shuffle(items,seed){const a=[...items];let n=hash(seed);for(let i=a.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function dailyBones(date,region='all',progress={},module='bones'){
 const cards=progress.cards||{},card=b=>cards[b.id];
 const pool=poolFor(region,module).filter(b=>!getModule(module).staged||!b.parentBone||card(b)?.box>0||stageStatus(b.parentBone,b.stage,progress).open);
 const order=(a,b)=>(a.stage||0)-(b.stage||0)||a.level-b.level||pool.indexOf(a)-pool.indexOf(b);
 if(getModule(module).staged){
  const due=pool.filter(b=>card(b)?.box>0&&card(b).due<=date).sort((a,b)=>card(a).due.localeCompare(card(b).due)||order(a,b));
  const highestOverride=parent=>Math.max(0,...[1,2,3].filter(n=>progress.unlocks?.[`${parent}:${n}`]));
  const fresh=pool.filter(b=>!card(b)?.box&&(b.parentBone?b.stage>=highestOverride(b.parentBone):highestOverride(b.id)===0)).sort(order);
  return shuffle([...due,...fresh].slice(0,8),`${date}:${region}`);
 }
 const due=pool.filter(b=>card(b)?.box>0&&card(b).due<=date).sort((a,b)=>card(a).due.localeCompare(card(b).due)||order(a,b)).slice(0,5);
 const fresh=pool.filter(b=>!card(b)?.box).sort(order);
 const selected=[...due,...fresh].slice(0,8),ids=new Set(selected.map(b=>b.id));
 const rest=pool.filter(b=>!ids.has(b.id)&&card(b)?.due>date).sort((a,b)=>card(a).box-card(b).box||card(a).due.localeCompare(card(b).due)||order(a,b));
 // If the entire pool is overdue, fill the lesson with the remaining oldest reviews.
 const fallback=pool.filter(b=>!ids.has(b.id)&&!rest.includes(b)).sort((a,b)=>(card(a)?.due||date).localeCompare(card(b)?.due||date)||order(a,b));
 return shuffle([...selected,...rest,...fallback].slice(0,8),`${date}:${region}`);
}
export function roundBones(date,round,units=dailyBones(date)){return round===0?[...units]:shuffle(units,`${date}:round:${round}`);}
export function recordGrade(progress,id,date,round,{hints=0,errors=0}={},practice=false){
 migrateCards(progress,date);
 const c=progress.cards[id]??={box:0,due:date,hints:0,errors:0,lastSeen:null};
 c.hints+=hints;c.errors+=errors;c.lastSeen=date;
 if(practice)return c;
 if(c.gradeDate!==date){c.gradeDate=date;c.baseBox=c.box;c.grades={};}
 const grade=hints||errors?'again':'good';
 c.grades[round]=c.grades[round]==='again'?'again':grade;
 c.grade=Object.values(c.grades).includes('again')?'again':'good';
 c.box=c.grade==='again'?1:Math.min(5,c.baseBox+1);
 c.due=addDays(date,c.grade==='again'?1:intervals[c.box]);return c;
}
// Legacy import uses the old learned representation, then migrates it once at startup.
export function recordAnswer(progress,region,b,date,clean){
 progress.learned??={};progress.history??={};const history=progress.history[b.id]??={};history.seen=date;
 if(clean)progress.learned[region]=[...new Set([...(progress.learned[region]||[]),b.id])];else history.missed=date;return progress;
}
export function reinsert(queue,index,random=Math.random){
 const item=queue[index];if(item.practice||queue.some((c,i)=>i>index&&c.id===item.id&&c.practice))return queue;
 const next=queue.map(c=>({...c}));
 // Leave two intervening cards even when an error occurs at the end of a round.
 const others=queue.filter(c=>c.id!==item.id);
 while(next.length<index+3){const spacer=others[(next.length-index-1)%others.length];if(!spacer)break;next.push({...spacer,practice:true});}
 const min=Math.min(index+3,next.length),position=min+Math.floor(random()*(next.length-min+1));
 next.splice(position,0,{id:item.id,practice:true});return next;
}
export function dueSummary(progress,ids,today){const counts={};for(const id of ids){const due=progress.cards?.[id]?.due;if(due>today)counts[due]=(counts[due]||0)+1;}return Object.entries(counts).sort(([a],[b])=>a.localeCompare(b)).map(([date,count])=>({date,count,days:dayNumber(date)-dayNumber(today)}));}
export function progressFor(region,progress,module='bones'){const learned=learnedIds(progress),pool=poolFor(region,module),remaining=pool.filter(b=>!learned.has(b.id));return {count:pool.length-remaining.length,total:pool.length,level:remaining.length?Math.min(...remaining.map(b=>b.level)):3};}

// Preserve only evidence from completed Latin v4 days. New split units need their own lesson.
const legacyIds=['frontal','parietal','occipital','temporal','sphenoid','ethmoid','maxilla','mandible','zygomatic','nasal','lacrimal','palatine','concha','vomer','hyoid','atlas','axis','cervical','thoracic','lumbar','sacrum','coccyx','sternum','ribs','clavicle','scapula','humerus','radius','ulna','scaphoid','lunate','triquetral','pisiform','trapezium','trapezoid','capitate','hamate','metacarpals','hand-phalanges','hip','femur','patella','tibia','fibula','talus','calcaneus','navicular','cuboid','cuneiforms','metatarsals','foot-phalanges'];
export function migrateLegacy(progress,records){
 if(progress.migratedV4)return progress;
 for(const [key,state] of Object.entries(records).sort(([a],[b])=>a.localeCompare(b))){
  const match=/^gk2:v4:(\d{4}-\d{2}-\d{2}):latin$/.exec(key);
  if(!match||!state?.done||state.round!==2||state.index!==7||!state.round3Misses||typeof state.round3Misses!=='object'||Array.isArray(state.round3Misses))continue;
  const date=match[1],start=((dayNumber(date)*8)%51+51)%51;
  for(let i=0;i<8;i++){
   const id=legacyIds[(start+i)%51],b=bones.find(b=>b.id===id);if(!b)continue;
   const previous={...progress.history?.[id]};recordAnswer(progress,'all',b,date,!state.round3Misses[id]);
   const h=progress.history[id];if(previous.seen&&previous.seen>h.seen)h.seen=previous.seen;if(previous.missed&&previous.missed>(h.missed||''))h.missed=previous.missed;
  }
 }
 progress.migratedV4=true;return progress;
}
