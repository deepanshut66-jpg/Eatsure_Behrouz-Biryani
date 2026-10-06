const frame=document.getElementById('appFrame');
const allowed=hash=>/^#(?:home|brands|multi|packaging|checkout|tracking|brand\/(?:behrouz|faasos|ovenstory|mandarin|sweet|bowl))$/.test(hash);
const initial=allowed(location.hash)?location.hash:'#home';
if(matchMedia('(max-width:600px)').matches){location.replace('./index.html?mobile=1'+initial)}else{
 frame.src='./index.html?mobile=1'+initial;
 const names={home:'Discover',brands:'Restaurants',multi:'Multi Resto',packaging:'3D packaging',checkout:'Checkout',tracking:'Demo order tracking','brand/behrouz':'Behrouz Biryani'};
 const update=hash=>{const key=hash.replace(/^#/,'')||'home';document.querySelectorAll('[data-screen]').forEach(b=>{const active=b.dataset.screen===key;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});document.getElementById('screenCaption').textContent=(names[key]||'Restaurant menu')+' · 390 px mobile screen';history.replaceState(null,'',hash)};
 let appWindow;
 frame.addEventListener('load',()=>{try{appWindow=frame.contentWindow;update(appWindow.location.hash);appWindow.addEventListener('hashchange',()=>update(appWindow.location.hash))}catch{document.getElementById('screenCaption').textContent='Sign in to open your app preview.'}});
 document.querySelectorAll('[data-screen]').forEach(button=>button.addEventListener('click',()=>{const hash='#'+button.dataset.screen;try{appWindow=frame.contentWindow;appWindow.document.querySelectorAll('dialog[open]').forEach(d=>d.close());appWindow.location.hash=hash;appWindow.scrollTo({top:0,behavior:'instant'});update(hash)}catch{frame.src='./index.html?mobile=1'+hash}}));
}
