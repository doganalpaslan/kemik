import {notesForMuscles} from './muscle-study.js?v=7a098ad-20261111T101211286Z';
// Note-to-source mapping: KAYNAKLAR.md. Only notes linked to today’s question units are shown.
export const clinicalNotes=[
 {
  "ids": [
   "frontal",
   "parietal",
   "temporal",
   "sphenoid"
  ],
  "text": "Pterionun derininden a. meningea media’nın ön dalı geçer; bu bölgedeki kırık epidural kanamaya yol açabilir.",
  "source": "pterion"
 },
 {
  "ids": [
   "nasal"
  ],
  "text": "Burun kemikleri yüz kırıklarında en sık etkilenen kemiklerdir.",
  "source": "nasal"
 },
 {
  "ids": [
   "mandible"
  ],
  "text": "Alt çene boynu kırıklarında çene eklemi ve kapanış ilişkisi değerlendirilir.",
  "source": "mandible"
 },
 {
  "ids": [
   "scaphoid"
  ],
  "text": "Kayık kemiği belinin kırığında proksimal parçanın kanlanması bozulabilir; avasküler nekroz riski vardır.",
  "source": "scaphoid"
 },
 {
  "ids": [
   "humerus"
  ],
  "text": "Humerusun cerrahi boynu kırıklarında n. axillaris yaralanabilir.",
  "source": "humerus"
 },
 {
  "ids": [
   "radius"
  ],
  "text": "Radiusun distal uç kırıkları açık el üzerine düşmeyle oluşabilir.",
  "source": "radius"
 },
 {
  "ids": [
   "thoracic",
   "lumbar"
  ],
  "text": "Osteoporoz, omur gövdelerinde kompresyon kırıklarına yatkınlığı artırır.",
  "source": "spine"
 },
 {
  "ids": [
   "lumbar",
   "sacrum",
   "hip"
  ],
  "text": "Lomber ponksiyonda erişkinde omuriliğin altındaki L3–L4 veya L4–L5 aralığı tercih edilir.",
  "source": "puncture"
 },
 {
  "ids": [
   "true-ribs", "false-ribs", "floating-ribs", "first-rib",
   "manubrium", "sternal-body", "xiphoid"
  ],
  "text": "Kaburga kırıklarına pnömotoraks eşlik edebilir.",
  "source": "ribs"
 },
 {
  "ids": [
   "femur",
   "hip"
  ],
  "text": "Yaşlılarda femur boynu kırığı düşük enerjili düşmelerden sonra gelişebilir.",
  "source": "femur"
 },
 {
  "ids": [
   "fibula",
   "tibia"
  ],
  "text": "Fibula boynunu dolanan n. fibularis communis bu bölgedeki kırıklarda zedelenebilir.",
  "source": "fibula"
 },
 {
  "ids": [
   "calcaneus"
  ],
  "text": "Yüksekten düşme sonrasında topuk kemiği kırığına omurga kırığı da eşlik edebilir.",
  "source": "calcaneus"
 },
 {
  "ids": [
   "scaphoid",
   "lunate",
   "triquetral",
   "pisiform",
   "trapezium",
   "trapezoid",
   "capitate",
   "hamate",
   "metacarpals",
   "hand-phalanges", "hand-metacarpal-1", "hand-phalanx-proximal", "hand-phalanx-middle", "hand-phalanx-distal"
  ],
  "text": "Karpal oluğu el bileği kemikleri, çatısını retinaculum flexorum oluşturur; içinden n. medianus geçer ve sıkışması karpal tünel sendromuna yol açar.",
  "source": "carpal"
 },
 {
  "ids": [
   "lunate"
  ],
  "text": "Kienböck hastalığı, ay kemiğinin kanlanmasının bozulmasıyla ilişkili osteonekrozdur.",
  "source": "lunate"
 },
 {
  "ids": [
   "hamate"
  ],
  "text": "Çengel kemiğinin çengeli (hamulus) kırılırsa Guyon kanalındaki n. ulnaris etkilenebilir; yüzük ve serçe parmakta uyuşma ve kavrama gücünde azalma görülebilir.",
  "source": "hamate"
 },
 {
  "ids": [
   "clavicle",
   "scapula"
  ],
  "text": "Köprücük kemiği kırığında omuz kuşağı ve komşu damar, sinir ve akciğer yaralanmaları değerlendirilir.",
  "source": "clavicle"
 },
 {
  "ids": [
   "patella"
  ],
  "text": "Diz kapağı kırığında dizin aktif düzleştirilmesi değerlendirilerek ekstansör mekanizmanın bütünlüğü araştırılır.",
  "source": "patella"
 },
 {
  "ids": [
   "talus",
   "calcaneus",
   "navicular",
   "cuboid",
   "cuneiform-medial", "cuneiform-intermediate", "cuneiform-lateral",
   "metatarsals",
   "foot-phalanges", "foot-metatarsal-1", "foot-phalanx-proximal", "foot-phalanx-middle", "foot-phalanx-distal"
  ],
  "text": "Ayağın kemik kemerleri yükü topuk ile ön ayak arasında dağıtır; kemerlerin çökmesi düz tabanlıkla ilişkilidir.",
  "source": "foot-arches"
 },
 {
  "ids": [
   "ethmoid",
   "sphenoid",
   "temporal",
   "occipital"
  ],
  "text": "Kafatası tabanı kırıklarında burun veya kulaktan beyin omurilik sıvısı kaçağı görülebilir.",
  "source": "skull-base"
 },
 {
  "ids": [
   "hyoid",
   "atlas",
   "axis",
   "cervical"
  ],
  "text": "Boyun travmasında servikal omurga yaralanması değerlendirilir; omurilik hasarı ciddi nörolojik kayba yol açabilir.",
  "source": "cervical-injury"
 },
 {
  "ids": [
   "maxilla",
   "palatine",
   "lacrimal",
   "zygomatic"
  ],
  "text": "Göz çukurunun kemik duvarlarını içeren yüz kırıklarında çift görme ve göz hareketlerinde kısıtlılık araştırılır.",
  "source": "orbital"
 }
];
export function notesForDay(bones){if(bones[0]?.module==='muscles')return notesForMuscles(bones);const ids=new Set(bones.map(b=>b.id));return clinicalNotes.filter(n=>n.ids.some(id=>ids.has(id))).slice(0,3);}
