import {bones,dayNumber} from './bones.js?v=aaa2564-0037';
export const regions=[{id:'all',label:'Tüm iskelet',short:'Tümü'},{id:'skull',label:'Kafatası',short:'Kafa'},{id:'trunk',label:'Omurga ve göğüs',short:'Gövde'},{id:'upper',label:'Üst ekstremite',short:'Kol'},{id:'lower',label:'Alt ekstremite',short:'Bacak'}];
export const levels=['','kolay','orta','zor'];
export const poolFor=region=>bones.filter(b=>region==='all'||b.curriculumRegion===region);
export function learnedIds(progress={}){return new Set(Object.values(progress.learned||{}).flatMap(ids=>Array.isArray(ids)?ids:[]));}
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function dailyBones(date,region='all',progress={}){
 const learned=learnedIds(progress),pool=poolFor(region),rank=b=>hash(`${date}:${region}:${b.id}`);
 const unlearned=pool.filter(b=>!learned.has(b.id)).sort((a,b)=>a.level-b.level||rank(a)-rank(b)||a.id.localeCompare(b.id));
 const review=pool.filter(b=>learned.has(b.id)).sort((a,b)=>{
  const x=progress.history?.[a.id]||{},y=progress.history?.[b.id]||{};
  return (y.missed||'').localeCompare(x.missed||'')||(x.seen||'').localeCompare(y.seen||'')||rank(a)-rank(b);
 });
 return [...unlearned,...review].slice(0,8);
}
export function roundBones(date,round,units=dailyBones(date)){
 const a=[...units];if(round===0)return a;let seed=dayNumber(date)+round*7919;
 for(let i=a.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;
}
export function recordAnswer(progress,region,b,date,clean){
 progress.learned??={};progress.history??={};
 const history=progress.history[b.id]??={};history.seen=date;
 if(clean){for(const key of new Set([region,b.curriculumRegion,'all']))progress.learned[key]=[...new Set([...(progress.learned[key]||[]),b.id])];}
 else history.missed=date;
 return progress;
}
export function progressFor(region,progress){const learned=learnedIds(progress),pool=poolFor(region);return {count:pool.filter(b=>learned.has(b.id)).length,total:pool.length,level:pool.find(b=>!learned.has(b.id)&&b.level===Math.min(...pool.filter(b=>!learned.has(b.id)).map(b=>b.level)))?.level||3};}

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
