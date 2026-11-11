import {bones} from './bones.js?v=2d5a341-20261111T153630630Z';
import {muscles} from './muscles.js?v=2d5a341-20261111T153630630Z';
import {nerves} from './nerves.js?v=2d5a341-20261111T153630630Z';
import {vessels} from './vessels.js?v=2d5a341-20261111T153630630Z';
export const regions=[{id:'all',label:'Tüm iskelet',short:'Tümü'},{id:'skull',label:'Kafatası',short:'Kafa'},{id:'trunk',label:'Omurga ve göğüs',short:'Gövde'},{id:'upper',label:'Üst ekstremite',short:'Kol'},{id:'lower',label:'Alt ekstremite',short:'Bacak'}];
export const muscleRegions=[{id:'all',label:'Tüm kaslar',short:'Tümü'},{id:'head',label:'Baş ve yüz',short:'Baş'},{id:'neck',label:'Boyun',short:'Boyun'},{id:'back',label:'Sırt',short:'Sırt'},{id:'chest',label:'Göğüs ve karın duvarı',short:'Gövde'},{id:'upper',label:'Üst ekstremite',short:'Kol'},{id:'lower',label:'Alt ekstremite',short:'Bacak'},{id:'perineum',label:'Pelvis ve perine',short:'Perine'}];
const neurovascularRegions=label=>[{id:'all',label,short:'Tümü'},{id:'head',label:'Baş ve kafa içi',short:'Baş'},{id:'neck',label:'Boyun',short:'Boyun'},{id:'trunk',label:'Göğüs ve karın',short:'Gövde'},{id:'upper',label:'Üst ekstremite',short:'Kol'},{id:'lower',label:'Pelvis ve alt ekstremite',short:'Bacak'}];
export const landmarks=[];
let landmarkLoad;
export function loadLandmarks(){return landmarkLoad??=Promise.all([import('./landmarks-upper.js?v=2d5a341-20261111T153630630Z'),import('./landmarks-lower.js?v=2d5a341-20261111T153630630Z'),import('./landmarks-trunk.js?v=2d5a341-20261111T153630630Z'),import('./landmarks-skull.js?v=2d5a341-20261111T153630630Z')]).then(chunks=>{landmarks.push(...chunks.flatMap(m=>m.landmarks));return landmarks;});}
// Add a data import and an entry here to register another module throughout the app.
// Existing progress keys and day prefixes are intentional compatibility contracts.
export const moduleRegistry={
 bones:{id:'bones',label:'Kemikler',title:'Günün kemiği',noun:'yapı',plural:'yapılar',accusative:'yapısını',ready:'yapısı',start:'yapılarına',possessive:'yapının',regions,getUnits:()=>[...bones,...landmarks],load:loadLandmarks,staged:true,progressKey:'gk2:curriculum:v8',dayPrefix:'gk2:v8',dom:{progress:'home-progress',meter:'learned-progress',regions:'home-regions'}},
 muscles:{id:'muscles',label:'Kaslar',title:'Günün kası',noun:'kas',plural:'kaslar',accusative:'kasını',ready:'kası',start:'kaslarına',possessive:'kasın',regions:muscleRegions,getUnits:()=>muscles,progressKey:'gk2:curriculum:muscles:v17',dayPrefix:'gk2:muscles:v17',dom:{progress:'muscles-progress',meter:'muscles-learned-progress',regions:'muscles-regions'}},
 nerves:{id:'nerves',label:'Sinirler',title:'Günün siniri',noun:'sinir',plural:'sinirler',accusative:'sinirini',ready:'siniri',start:'sinirlerine',possessive:'sinirin',regions:neurovascularRegions('Tüm sinirler'),getUnits:()=>nerves,progressKey:'gk2:curriculum:nerves:v30',dayPrefix:'gk2:nerves:v30'},
 vessels:{id:'vessels',label:'Damarlar',title:'Günün damarı',noun:'damar',plural:'damarlar',accusative:'damarını',ready:'damarı',start:'damarlarına',possessive:'damarın',regions:neurovascularRegions('Tüm damarlar'),getUnits:()=>vessels,progressKey:'gk2:curriculum:vessels:v30',dayPrefix:'gk2:vessels:v30'},
};
export const modules=Object.values(moduleRegistry);
export function getModule(id='bones'){const entry=moduleRegistry[id];if(!entry)throw Error('Unknown anatomy module: '+id);return entry;}
export const loadModule=async id=>{await getModule(id).load?.();return getModule(id).getUnits();};
export const unitsFor=id=>getModule(id).getUnits();
export const regionsFor=id=>getModule(id).regions.filter(r=>r.id==='all'||unitsFor(id).some(b=>b.curriculumRegion===r.id));
export const moduleDom=id=>getModule(id).dom||{progress:`${id}-progress`,meter:`${id}-learned-progress`,regions:`${id}-regions`};
