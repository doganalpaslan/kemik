const VERSION='7a098ad-20261111T101211286Z';
export function resetProgress(){
 try{
  // Repository history used gk2:DATE, gk2:v2/v4/v8, preferences and streak.
  for(const key of Object.keys(localStorage))if(key.startsWith('gk2:'))localStorage.removeItem(key);
  return true;
 }catch{document.querySelector('#storage-note').textContent='İlerleme silinemedi. Tarayıcı depolama iznini kontrol edin.';return false;}
}
export async function startPWA(){
 const url=new URL(location.href);
 if(url.searchParams.get('sifirla')==='1'){
  if(resetProgress()){url.searchParams.delete('sifirla');history.replaceState(null,'',url);}
 }
 installHint();
 if(VERSION==='__BUILD_'+'VERSION__'||!('serviceWorker' in navigator))return;
 try{
  const registration=await navigator.serviceWorker.register(`./sw.js?v=${VERSION}`,{scope:'./',updateViaCache:'none'});
  // Only a worker already waiting at startup may take over. Later downloads wait.
  if(registration.waiting&&navigator.serviceWorker.controller){
   const channel=new MessageChannel();
   const decision=new Promise(resolve=>{channel.port1.onmessage=e=>{channel.port1.close();resolve(e.data.activate);};});
   const changed=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
   registration.waiting.postMessage({type:'ACTIVATE_ON_START'},[channel.port2]);
   if(await decision){await changed;location.reload();await new Promise(()=>{});}
  }
  // Claim the first visit before model requests, so its first region is offline too.
  if(!navigator.serviceWorker.controller){
   await Promise.race([new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true})),new Promise(resolve=>setTimeout(resolve,8000))]);
  }
 }catch(error){console.warn('Çevrimdışı kurulum şu anda kullanılamıyor.',error);}
}
function installHint(){
 const hint=document.querySelector('#install-hint'),copy=document.querySelector('#install-copy'),button=document.querySelector('#install-app');
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const dismissed=()=>{try{return localStorage.getItem('gk2:install-dismissed')==='1'}catch{return false}};
 const hide=()=>{hint.hidden=true;};
 const dismiss=()=>{hide();try{localStorage.setItem('gk2:install-dismissed','1')}catch{}};
 document.querySelector('#dismiss-install').onclick=dismiss;
 let prompt;
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const safari=/Safari/.test(navigator.userAgent)&&!/(CriOS|FxiOS|EdgiOS|OPiOS)/.test(navigator.userAgent);
 if(ios&&safari&&!standalone()&&!dismissed()){
  copy.textContent="Uygulama olarak kurmak için Paylaş ve Ana Ekrana Ekle'ye dokunun.";hint.hidden=false;
 }
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();prompt=event;
  if(standalone()||dismissed())return;
  copy.textContent='';button.hidden=false;hint.hidden=false;
 });
 button.onclick=async()=>{if(!prompt)return;await prompt.prompt();await prompt.userChoice;prompt=null;dismiss();};
 window.addEventListener('appinstalled',dismiss);
 matchMedia('(display-mode: standalone)').addEventListener('change',()=>{if(standalone())hide();});
}
