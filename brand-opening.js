const dialog=document.querySelector('#brand-opening'),fill=document.querySelector('#opening-progress-fill');
const enter=document.querySelector('#enter-feast'),loading=document.querySelector('#box-loading'),hint=document.querySelector('#box-opening-hint'),boxTitle=document.querySelector('#box-opening-title');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),mobile=window.matchMedia('(max-width: 700px), (pointer: coarse)');
let frame=0,exitTimer=0,loadTimer=0,autoTimer=0,active=false,exiting=false,elapsed=0,lastTime=0,scene=null,controller=null,epoch=0,boxState='idle';
function clean(keepScene=false){cancelAnimationFrame(frame);clearTimeout(exitTimer);clearTimeout(loadTimer);clearTimeout(autoTimer);controller?.abort();controller=null;if(!keepScene){scene?.dispose();scene=null}}
function paintAd(ms){const still=reduced.matches,chapter=still?'royal':ms<1800?'brand':ms<4700?'grain':'royal';if(dialog.dataset.scene!==chapter)dialog.dataset.scene=chapter;let zoom=1.12;if(chapter==='grain')zoom=1.38-(ms-1800)/2900*.08;if(chapter==='royal')zoom=still?1:1.30-Math.min((ms-4700)/3400,1)*.30;dialog.style.setProperty('--ad-zoom',zoom.toFixed(4));dialog.style.setProperty('--ad-y',chapter==='grain'?'80%':'58%');fill.style.transform=`scaleX(${Math.min(ms/(still?2200:9000),1)})`}
function finish(){if(!active||exiting)return;exiting=true;epoch++;clean(true);enter.disabled=false;dialog.classList.add('opening-exit');document.body.classList.add('landing-arriving');exitTimer=setTimeout(()=>{dialog.close();active=false;exiting=false;document.body.classList.remove('landing-arriving')},reduced.matches?0:850)}
function tick(now){if(!active||exiting)return;const delta=now-lastTime;lastTime=now;if(!document.hidden)elapsed+=Math.min(delta,100);
 if(dialog.dataset.mode==='box'){
  const progress=Math.min(elapsed/5700,1);scene?.render(progress);fill.style.transform=`scaleX(${Math.min(elapsed/6900,1)})`;
  if(progress>.8&&boxState!=='revealed'){boxState='revealed';boxTitle.innerHTML='Your royal table<br><em>awaits.</em>';hint.textContent='The reveal is only the beginning.'}
  if(elapsed>=6900){finish();return}
 }else{paintAd(elapsed);if(elapsed>=(reduced.matches?2200:9000)){finish();return}}
 frame=requestAnimationFrame(tick)
}
function openBox(){if(!active||exiting||boxState!=='ready')return;clearTimeout(autoTimer);boxState='opening';hint.textContent='Royal Reveal · Packaging concept';enter.textContent='Enter the feast';elapsed=0;lastTime=performance.now();frame=requestAnimationFrame(tick)}
async function prepareBox(){const current=epoch;controller=new AbortController();const signal=controller.signal;boxState='loading';enter.disabled=true;enter.textContent='Open my feast';loading.hidden=false;loading.textContent='Preparing your royal reveal…';hint.textContent='Your Royal Reveal packaging design';boxTitle.innerHTML='A little ceremony.<br><em>Just for you.</em>';
 function fallback(){if(current!==epoch||!active||exiting||boxState!=='loading')return;boxState='fallback';clearTimeout(loadTimer);controller?.abort();loading.textContent='The box couldn’t load on this connection.';boxTitle.innerHTML='Your royal table<br><em>awaits.</em>';hint.textContent='Continue to the feast below.';enter.disabled=false;enter.textContent='Enter the feast';autoTimer=setTimeout(finish,2600)}
 loadTimer=setTimeout(fallback,12000);
 try{const {createOpeningScene}=await import('./opening-scene.js');if(current!==epoch||signal.aborted)return;const result=await createOpeningScene(document.querySelector('#box-opening-canvas'),signal);if(current!==epoch||!active||exiting||signal.aborted){result.dispose();return}clearTimeout(loadTimer);scene=result;scene.render(reduced.matches?1:0);dialog.classList.add('box-ready');loading.hidden=true;enter.disabled=false;
 if(reduced.matches){boxState='revealed';enter.textContent='Enter the feast';hint.textContent='Royal Reveal · Packaging concept';autoTimer=setTimeout(finish,2000)}else{boxState='ready';hint.textContent='Tap the box to open · Royal Reveal concept';autoTimer=setTimeout(openBox,1300)}
 }catch{fallback()}
}
function start(){if(active)return;clean();epoch++;active=true;exiting=false;elapsed=0;boxState='idle';enter.disabled=false;dialog.classList.remove('opening-exit','box-ready');dialog.dataset.mode=mobile.matches?'box':'ad';dialog.dataset.scene='brand';fill.style.transform='scaleX(0)';dialog.showModal();if(mobile.matches){prepareBox()}else{enter.textContent='Discover the feast';paintAd(0);lastTime=performance.now();frame=requestAnimationFrame(tick)}}
document.querySelector('#skip-opening').addEventListener('click',finish);
enter.addEventListener('click',()=>{if(dialog.dataset.mode==='box'&&boxState==='ready')openBox();else finish()});
document.querySelector('#box-opening-stage').addEventListener('pointerup',openBox);
dialog.addEventListener('cancel',e=>{e.preventDefault();finish()});
dialog.addEventListener('close',()=>{active=false;exiting=false;epoch++;clean();document.body.classList.remove('landing-arriving')});
document.querySelector('#replay-opening').addEventListener('click',start);
window.addEventListener('pagehide',()=>{epoch++;clean();active=false;if(dialog.open)dialog.close()});
if(!location.hash)start();
