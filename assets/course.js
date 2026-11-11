import {chapters,sections} from './course-data.js?v=bfbdb39-20261111T155240608Z';
import {unitsFor} from './module-registry.js?v=bfbdb39-20261111T155240608Z';
import {learnedIds} from './curriculum.js?v=bfbdb39-20261111T155240608Z';
export {chapters,sections};
export const sectionByNumber=number=>sections.find(s=>s.number===number);
export function sectionUnits(section){const index=new Map(unitsFor(section.module).map(b=>[b.id,b]));return section.items.map(item=>({...index.get(item.id),tier:item.tier,textbookOrder:item.order}));}
export function sectionStatus(section,progress={}){
 const learned=learnedIds(progress),count=section.items.filter(b=>learned.has(b.id)).length;
 const tiers=[1,2,3].map(tier=>{const items=section.items.filter(b=>b.tier===tier),previous=section.items.filter(b=>b.tier<tier);return {tier,total:items.length,count:items.filter(b=>learned.has(b.id)).length,open:previous.every(b=>learned.has(b.id))};});
 return {count,total:section.items.length,percent:section.items.length?Math.round(count/section.items.length*100):0,complete:count===section.items.length,tiers};
}
export function recommendedSection(progressByModule={}){return sections.find(s=>!sectionStatus(s,progressByModule[s.module]).complete);}
export function dailySection(date,section,progress={}){
 const cards=progress.cards||{},status=sectionStatus(section,progress),pool=sectionUnits(section);
 // Reviews already learned/introduced remain available even if a prerequisite regresses.
 const available=pool.filter(b=>status.tiers[b.tier-1].open||cards[b.id]?.box>0);
 const due=available.filter(b=>cards[b.id]?.box>0&&cards[b.id].due<=date);
 const fresh=available.filter(b=>!cards[b.id]?.box);
 const ids=new Set([...due,...fresh].slice(0,8).map(b=>b.id));
 return pool.filter(b=>ids.has(b.id));
}
export function mergeLumbarProgress(progress){
 const old=progress.cards?.['landmark-v24-315'];if(old){const kept=progress.cards['landmark-v24-353'];if(!kept||old.box>kept.box)progress.cards['landmark-v24-353']={...old};delete progress.cards['landmark-v24-315'];}
 return progress;
}
