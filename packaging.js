import * as THREE from 'three';
import {OrbitControls} from './OrbitControls.js';
import {GLTFLoader} from './GLTFLoader.js';
import {RoomEnvironment} from './RoomEnvironment.js';
import {designs,modeLabels} from './model-designs.js';

export function mountPackaging(state){
 const canvas=document.querySelector('#modelCanvas'),stage=canvas.parentElement;
 const status=document.querySelector('#modelStatus'),error=document.querySelector('#modelError');
 const range=document.querySelector('#explodeRange'),play=document.querySelector('#playModel');
 let renderer,alive=true,frame,model,mixer,action,clips={},playing=false,elapsed=0,last=0,view='perspective',envelopes={},currentMode='closed';
 const originals=new Map(),faded=new Map();
 let design,requestId=0,ready=false;
 function enable(on){document.querySelectorAll('.studio-controls button,.studio-controls input,#resetModel').forEach(b=>b.disabled=!on)}
 enable(false);
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true})}catch{status.hidden=true;error.hidden=false;error.innerHTML='<p class="model-fallback">This viewer needs WebGL. Enable hardware acceleration in your browser, then reload.</p>';return()=>{}}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.001,100);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=true;controls.maxPolarAngle=Math.PI*.94;
 scene.add(new THREE.HemisphereLight(0xfff5e5,0x8a8191,2));
 const key=new THREE.DirectionalLight(0xfff4e1,3);key.position.set(2,4,3);scene.add(key);
 const fill=new THREE.DirectionalLight(0xffffff,1.5);fill.position.set(-3,2,-2);scene.add(fill);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
 function disposeObject(root){const geometries=new Set(),materials=new Set(),textures=new Set(),skeletons=new Set();root.traverse(o=>{if(o.skeleton)skeletons.add(o.skeleton);if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v)}});skeletons.forEach(s=>s.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.source?.data?.close?.();t.dispose()})}
 function selectClip(name){mixer.stopAllAction();action=mixer.clipAction(clips[name]);action.reset();action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();action.paused=true;action.time=0;mixer.update(0)}
 function seek(p){if(!action)return;elapsed=Math.max(0,Math.min(1,p))*action.getClip().duration;action.time=elapsed;mixer.update(0);range.value=String(Math.round(p*100));document.querySelector('#animationProgress').textContent=`${Math.round(p*100)}%`}
 function frameModel(){if(!model||!envelopes.closed)return;const bounds=envelopes[currentMode]||envelopes.closed,center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());const radius=size.length()/2;const vfov=THREE.MathUtils.degToRad(camera.fov),hfov=2*Math.atan(Math.tan(vfov/2)*camera.aspect);const distance=radius/Math.sin(Math.min(vfov,hfov)/2)*1.13;const direction={perspective:new THREE.Vector3(1,1.05,1.45),front:new THREE.Vector3(0,.22,1),top:new THREE.Vector3(0,1,.001)}[view].normalize();controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);camera.near=Math.max(radius/500,.0001);camera.far=Math.max(distance*30,10);camera.updateProjectionMatrix();controls.minDistance=radius*.6;controls.maxDistance=distance*4;controls.update()}
 function update(){document.querySelectorAll('[data-pack-mode]').forEach(b=>{const active=b.dataset.packMode===currentMode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});document.querySelectorAll('[data-layer]').forEach(b=>{const active=b.dataset.layer===state.packLayer;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});document.querySelectorAll('[data-camera]').forEach(b=>{const active=b.dataset.camera===view;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});play.textContent=playing?'Pause animation':'Play animation';play.setAttribute('aria-pressed',playing);document.querySelector('#modelStateLabel').textContent=currentMode==='closed'?'Closed package':modeLabels[currentMode];const c=design.components[state.packLayer]||design.components.all;document.querySelector('#componentTitle').textContent=c[0];document.querySelector('#componentDetail').textContent=c[1]}
 function choose(mode,animate=false){currentMode=mode;state.packMode=mode;selectClip(design.modes[mode]);playing=animate;seek(mode==='closed'||animate?0:1);frameModel();update()}
 function highlight(){for(const [mesh,material] of originals)mesh.material=state.packLayer==='all'||mesh.userData.layer===state.packLayer?material:faded.get(mesh);update()}
 const click=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.packDesign){if(b.dataset.packDesign!==state.packDesign||!ready)loadDesign(b.dataset.packDesign);return}if(!ready)return;if(b.dataset.packMode)choose(b.dataset.packMode,b.dataset.packMode!=='closed');if(b.dataset.camera){view=b.dataset.camera;frameModel();update()}if(b.dataset.layer){state.packLayer=b.dataset.layer;if(state.packLayer!=='all'&&state.packLayer!=='sleeve'&&currentMode==='closed')choose(state.packLayer==='seal'&&design.modes.peel?'peel':'exploded');highlight()}if(b.id==='playModel'){if(currentMode==='closed'){choose('open',true);return}if(elapsed>=action.getClip().duration-.001)seek(0);playing=!playing;update()}if(b.id==='resetModel'){view='perspective';state.packLayer='all';choose('closed');highlight()}};
 const input=e=>{if(e.target===range&&ready){const p=Number(range.value)/100;if(currentMode==='closed')choose('open');playing=false;seek(p);update()}};
 document.addEventListener('click',click);document.addEventListener('input',input);
 let lastWidth=0,lastHeight=0;const resize=()=>{const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h||w===lastWidth&&h===lastHeight)return;lastWidth=w;lastHeight=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();frameModel()};const observer=new ResizeObserver(resize);observer.observe(stage);resize();
 function clearModel(){ready=false;playing=false;action=null;if(model){mixer?.stopAllAction();mixer?.uncacheRoot(model);for(const [mesh,material] of originals)mesh.material=material;scene.remove(model);disposeObject(model)}for(const material of faded.values())for(const m of(Array.isArray(material)?material:[material]))m.dispose();originals.clear();faded.clear();model=null;mixer=null;clips={};envelopes={}}
 function loadDesign(id){
  const ticket=++requestId;clearModel();design=designs[id]||designs.dum;state.packDesign=designs[id]?id:'dum';state.packLayer='all';view='perspective';currentMode='closed';elapsed=0;
  const activeDesign=design;
  document.querySelectorAll('[data-pack-design]').forEach(b=>{const active=b.dataset.packDesign===state.packDesign;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});
  document.querySelector('#packagingTitle').textContent='The '+design.name+'.';document.querySelector('#packagingSubtitle').textContent=design.subtitle;document.querySelector('#exploreDesignTitle').textContent='Explore '+design.name;
  canvas.setAttribute('aria-label',`Interactive ${design.name} packaging model. Drag to rotate; scroll or pinch to zoom.`);
  document.querySelector('.model-overlay .eyebrow').textContent=design.name.toUpperCase()+' / BEHROUZ BIRYANI';
  document.querySelector('#modelModes').innerHTML=Object.keys(design.modes).map(id=>`<button class="tab" data-pack-mode="${id}">${modeLabels[id]}</button>`).join('');
  document.querySelector('#modelLayers').innerHTML=Object.entries(design.components).map(([id,c])=>`<button class="layer-button" data-layer="${id}">${id==='all'?'Complete assembly':c[0]}</button>`).join('');
  document.querySelector('#modelSteps').innerHTML=design.steps.map(([title,body],i)=>`<article><b>0${i+1}</b><h3>${title}</h3><p>${body}</p></article>`).join('');
  document.querySelector('#caseDimensions').textContent='Measuring model…';document.querySelector('#moduleCount').textContent=design.arrangement;
  range.value=0;document.querySelector('#animationProgress').textContent='0%';update();enable(false);status.textContent=`Loading ${design.name}…`;status.hidden=false;error.hidden=true;
  new GLTFLoader().load('./'+design.file,gltf=>{
   if(!alive||ticket!==requestId){disposeObject(gltf.scene);return}
   try{
    model=gltf.scene;scene.add(model);mixer=new THREE.AnimationMixer(model);clips=Object.fromEntries(gltf.animations.map(c=>[c.name,c]));
    model.traverse(o=>{if(!o.isMesh)return;let ancestor=o;while(ancestor&&!activeDesign.nodeLayer[ancestor.name])ancestor=ancestor.parent;o.userData.layer=activeDesign.nodeLayer[ancestor?.name]||'base';if(o.isSkinnedMesh)o.frustumCulled=false;
     originals.set(o,o.material);const make=m=>{const clone=m.clone();clone.transparent=true;clone.opacity=.10;clone.depthWrite=false;return clone};faded.set(o,Array.isArray(o.material)?o.material.map(make):make(o.material));for(const m of(Array.isArray(o.material)?o.material:[o.material]))for(const v of Object.values(m))if(v?.isTexture)v.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    });
    if(!Object.values(design.modes).every(n=>clips[n]))throw new Error('Expected packaging animations are missing');
    function bounds(){model.updateMatrixWorld(true);model.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingBox()}});return new THREE.Box3().setFromObject(model)}
    selectClip(design.modes.closed);seek(0);envelopes.closed=bounds();const size=envelopes.closed.getSize(new THREE.Vector3());document.querySelector('#caseDimensions').textContent=`${Math.round(size.x*1000)} × ${Math.round(size.z*1000)} × ${Math.round(size.y*1000)} mm`;
    for(const mode of Object.keys(design.modes).filter(n=>n!=='closed')){selectClip(design.modes[mode]);const box=new THREE.Box3();for(let i=0;i<=24;i++){seek(i/24);box.union(bounds())}envelopes[mode]=box}
    ready=true;choose('closed');highlight();status.hidden=true;enable(true);
   }catch(err){failed(err)}
  },e=>{if(alive&&ticket===requestId)status.textContent=e.total?`Loading ${activeDesign.name} · ${Math.round(e.loaded/e.total*100)}%`:`Loading ${activeDesign.name}…`},failed);
  function failed(err){if(!alive||ticket!==requestId)return;console.error(err);clearModel();enable(false);status.hidden=true;error.hidden=false;error.innerHTML='<div class="model-fallback"><h2>The model could not load</h2><p>Select this design again to retry, or explore the other design.</p></div>'}
 }
 loadDesign(state.packDesign||'dum');
 function tick(time){if(!alive)return;frame=requestAnimationFrame(tick);const dt=Math.min((time-last)/1000,.05);last=time;if(playing&&action){seek(Math.min(1,(elapsed+dt)/action.getClip().duration));if(elapsed>=action.getClip().duration){playing=false;update()}}controls.update();renderer.render(scene,camera)}frame=requestAnimationFrame(tick);
 return()=>{alive=false;requestId++;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('click',click);document.removeEventListener('input',input);controls.dispose();clearModel();env.dispose();renderer.dispose()};
}
