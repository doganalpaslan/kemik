import {bones} from './bones.js?v=7e23d8b-20261113T075044921Z';
import {muscles} from './muscles.js?v=7e23d8b-20261113T075044921Z';
import {nerves} from './nerves.js?v=7e23d8b-20261113T075044921Z';
import {vessels} from './vessels.js?v=7e23d8b-20261113T075044921Z';
import {organs} from './organs.js?v=7e23d8b-20261113T075044921Z';
import {brain} from './brain.js?v=7e23d8b-20261113T075044921Z';
import {questions} from './viscera-questions.js?v=7e23d8b-20261113T075044921Z';
const organUnits=[...organs,...questions.filter(b=>b.module==='organs')];
const brainUnits=[...brain,...questions.filter(b=>b.module==='brain')];
export const regions=[{id:'all',label:'Tüm iskelet',short:'Tümü'},{id:'skull',label:'Kafatası',short:'Kafa'},{id:'trunk',label:'Omurga ve göğüs',short:'Gövde'},{id:'upper',label:'Üst ekstremite',short:'Kol'},{id:'lower',label:'Alt ekstremite',short:'Bacak'}];
export const muscleRegions=[{id:'all',label:'Tüm kaslar',short:'Tümü'},{id:'head',label:'Baş ve yüz',short:'Baş'},{id:'neck',label:'Boyun',short:'Boyun'},{id:'back',label:'Sırt',short:'Sırt'},{id:'chest',label:'Göğüs ve karın duvarı',short:'Gövde'},{id:'upper',label:'Üst ekstremite',short:'Kol'},{id:'lower',label:'Alt ekstremite',short:'Bacak'},{id:'perineum',label:'Pelvis ve perine',short:'Perine'}];
const neurovascularRegions=label=>[{id:'all',label,short:'Tümü'},{id:'head',label:'Baş ve kafa içi',short:'Baş'},{id:'neck',label:'Boyun',short:'Boyun'},{id:'trunk',label:'Göğüs ve karın',short:'Gövde'},{id:'upper',label:'Üst ekstremite',short:'Kol'},{id:'lower',label:'Pelvis ve alt ekstremite',short:'Bacak'}];
const organRegions=[{id:'all',label:'Tüm organlar',short:'Tümü'},{id:'thorax',label:'Göğüs',short:'Göğüs'},{id:'abdomen',label:'Karın',short:'Karın'},{id:'pelvis',label:'Üriner ve genital organlar',short:'Pelvis'},{id:'scrotum',label:'Skrotum',short:'Skrotum'},{id:'perineum',label:'Perine',short:'Perine'},{id:'head',label:'Baş ve boyun',short:'Baş'},{id:'senses',label:'Duyu organları',short:'Duyu'}];
const brainRegions=[{id:'all',label:'Tüm beyin yapıları',short:'Tümü'},{id:'surface',label:'Loblar ve beyin yüzeyi',short:'Yüzey'},{id:'stem',label:'Beyin sapı ve çekirdekleri',short:'Sap'},{id:'cerebellum',label:'Beyincik',short:'Beyincik'},{id:'csf',label:'Karıncıklar ve zarlar',short:'BOS'},{id:'deep',label:'Derin yapılar',short:'Derin'},{id:'spinal',label:'Omurilik yolları',short:'Omurilik'}];
export const landmarks=[];
let landmarkLoad;
export function loadLandmarks(){return landmarkLoad??=Promise.all([import('./landmarks-upper.js?v=7e23d8b-20261113T075044921Z'),import('./landmarks-lower.js?v=7e23d8b-20261113T075044921Z'),import('./landmarks-trunk.js?v=7e23d8b-20261113T075044921Z'),import('./landmarks-skull.js?v=7e23d8b-20261113T075044921Z')]).then(chunks=>{landmarks.push(...chunks.flatMap(m=>m.landmarks));return landmarks;});}
// Add a data import and an entry here to register another module throughout the app.
// Existing progress keys and day prefixes are intentional compatibility contracts.
export const moduleRegistry={
 bones:{id:'bones',label:'Kemikler',title:'Günün kemiği',noun:'yapı',plural:'yapılar',accusative:'yapısını',ready:'yapısı',start:'yapılarına',possessive:'yapının',regions,getUnits:()=>[...bones,...landmarks],load:loadLandmarks,staged:true,progressKey:'kemik:curriculum:v8',dayPrefix:'kemik:v8',dom:{progress:'home-progress',meter:'learned-progress',regions:'home-regions'}},
 muscles:{id:'muscles',label:'Kaslar',title:'Günün kası',noun:'kas',plural:'kaslar',accusative:'kasını',ready:'kası',start:'kaslarına',possessive:'kasın',regions:muscleRegions,getUnits:()=>muscles,progressKey:'kemik:curriculum:muscles:v17',dayPrefix:'kemik:muscles:v17',dom:{progress:'muscles-progress',meter:'muscles-learned-progress',regions:'muscles-regions'}},
 nerves:{id:'nerves',label:'Sinirler',title:'Günün siniri',noun:'sinir',plural:'sinirler',accusative:'sinirini',ready:'siniri',start:'sinirlerine',possessive:'sinirin',regions:neurovascularRegions('Tüm sinirler'),getUnits:()=>nerves,progressKey:'kemik:curriculum:nerves:v30',dayPrefix:'kemik:nerves:v30'},
 vessels:{id:'vessels',label:'Damarlar',title:'Günün damarı',noun:'damar',plural:'damarlar',accusative:'damarını',ready:'damarı',start:'damarlarına',possessive:'damarın',regions:neurovascularRegions('Tüm damarlar'),getUnits:()=>vessels,progressKey:'kemik:curriculum:vessels:v30',dayPrefix:'kemik:vessels:v30'},
 organs:{id:'organs',label:'Organlar',title:'Günün organı',noun:'organ',plural:'organlar',accusative:'organını',ready:'organı',start:'organlarına',possessive:'organın',regions:organRegions,getUnits:()=>organUnits,tiered:true,progressKey:'kemik:curriculum:organs:v32',dayPrefix:'kemik:organs:v32'},
 brain:{id:'brain',label:'Beyin',title:'Günün beyin yapısı',noun:'beyin yapısı',plural:'beyin yapıları',accusative:'beyin yapısını',ready:'beyin yapısı',start:'beyin yapılarına',possessive:'beyin yapısının',regions:brainRegions,getUnits:()=>brainUnits,tiered:true,progressKey:'kemik:curriculum:brain:v32',dayPrefix:'kemik:brain:v32'},
};
export const modules=Object.values(moduleRegistry);
export function getModule(id='bones'){const entry=moduleRegistry[id];if(!entry)throw Error('Unknown anatomy module: '+id);return entry;}
export const loadModule=async id=>{await getModule(id).load?.();return getModule(id).getUnits();};
export const unitsFor=id=>getModule(id).getUnits();
export const regionsFor=id=>getModule(id).regions.filter(r=>r.id==='all'||unitsFor(id).some(b=>b.curriculumRegion===r.id));
export const moduleDom=id=>getModule(id).dom||{progress:`${id}-progress`,meter:`${id}-learned-progress`,regions:`${id}-regions`};
