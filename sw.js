/* PWA V6.1 — cache repair; does not access localStorage, IndexedDB or user notes. */
const CACHE_NAME = 'exam-pwa-v6-1-20261106';
const CORE = ['./','./index.html','./school.html','./training.html','./physiology.html','./app.js','./backup.js','./media.js','./manifest.webmanifest','./icons/app-192.png','./icons/app-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('exam-pwa-') && k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    // Navigations use network first: online launches see freshly deployed HTML.
    // Offline launches still use the installed shell.
    if(req.mode==='navigate'){
      try{
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),3500);
        try{
          const response=await fetch(req,{cache:'no-store',signal:controller.signal});
          if(response.ok) await cache.put(req,response.clone());
          return response;
        }finally{clearTimeout(timer)}
      }catch(_){return (await cache.match(req))||(await cache.match('./index.html'))||Response.error()}
    }
    // Assets: serve local cache immediately and refresh in background.
    const cached=await cache.match(req);
    if(cached){event.waitUntil(fetch(req).then(r=>r.ok?cache.put(req,r.clone()):undefined).catch(()=>{}));return cached;}
    try{const r=await fetch(req);if(r.ok)event.waitUntil(cache.put(req,r.clone()));return r;}
    catch(_){return Response.error()}
  })());
});
