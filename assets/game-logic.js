import {normalize} from './bones.js?v=bfbdb39-20261111T155240608Z';

// A complete alias waits for Enter if it could still become a longer alias.
export function shouldAutoSubmit(typed,aliases){
 const answer=normalize(typed),accepted=aliases.map(normalize);
 return answer.length>0&&accepted.includes(answer)&&!accepted.some(alias=>alias.length>answer.length&&alias.startsWith(answer));
}

// Match the answer's whitespace normalization while retaining a typed word boundary.
// Raw input length would skip ghost letters after repeated spaces.
export function answerOffset(target,typed){
 const length=normalize(typed).length;
 return length+Number(/\s$/.test(typed)&&length>0&&target[length]===' ');
}
// Automatic clues never count as a requested hint.
export function initialMask(target){
 if(/^(os|ossa|phalanges|m\.|mm\.|n\.|nn\.|a\.|aa\.|v\.|vv\.|r\.|rr\.) /.test(target))return target.split(' ').map((word,i)=>i===0?word:word[0]+'·'.repeat(word.length-1)).join(' ');
 return target[0]+'·'.repeat(target.length-1);
}
export function answerHint(target,round,typedLength=0,until=0){
 if(round===0)return target.slice(typedLength);
 const mask=round===1?initialMask(target):' '.repeat(target.length);
 return [...target].map((letter,i)=>i<until?letter:round===1?mask[i]:'').join('').slice(typedLength);
}
export function nextHintUntil(target,round,typedLength=0,until=0){
 const mask=round===1?initialMask(target):'·'.repeat(target.length);
 let i=Math.max(typedLength,until);
 while(i<target.length){const hidden=target[i]!==' '&&mask[i]==='·';i++;if(hidden)break;}
 return i;
}
export function resultStatus(state,id){
 const hinted=Object.entries(state.hints||{}).some(([key,h])=>key.split(':')[1]===id&&h.count>0);
 const retry=Object.values(state.grades?.[id]||{}).includes('again');
 return hinted?'ipucuyla, yarın tekrar':retry?'hatayla, yarın tekrar':'ilk denemede';
}
export function firstTryPercent(state){
 const clean=state.units.reduce((n,id)=>n+[1,2].filter(round=>state.grades?.[id]?.[round]==='good').length,0);
 return Math.round(clean/(state.units.length*2)*100);
}
