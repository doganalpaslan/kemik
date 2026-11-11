// Context surfaces retain their registered world positions; framing never moves anatomy.
export function headNeckGroup(id){
 if(/levator-palpebrae|rectus-(superior|inferior|medialis|lateralis)|obliquus-(superior|inferior)/.test(id))return 'orbit';
 if(/genioglossus|hyoglossus/.test(id))return 'tongue';
 if(/pharyng/.test(id))return 'pharynx';
 return 'larynx';
}
export const headNeckProfiles={
 orbit:{regions:['skull','z-head-neck-context'],minimum:85},
 tongue:{regions:['skull','neck'],minimum:125},
 pharynx:{regions:['skull','neck'],minimum:150},
 larynx:{regions:['neck','z-head-neck-context'],minimum:85}
};
export function contextVisible(group,item){
 if(item.kind==='muscle'){
  const name=item.sourceObject||item.id;
  if(group==='orbit')return /rectus|oblique|Levator_palpebrae/.test(name);
  if(group==='tongue')return /Genioglossus|Hyoglossus/.test(name);
  if(group==='pharynx')return /pharyn/.test(name);
  return !/pharyn/.test(name);
 }
 if(group==='orbit')return item.contextKind==='eyeball'||['52734','52736','52740','52892','52893','53645','53646','53649','53650','53655','53656'].includes(item.id);
 if(group==='larynx')return item.id==='52749'||['cartilage','trachea'].includes(item.contextKind);
 if(group==='tongue')return item.region==='skull'||item.id==='52749';
 // Skull vault is outside the pharyngeal region; keep skull base and facial bones.
 return item.region==='neck'||item.region==='skull'&&!['52734','52788','52789'].includes(item.id);
}
