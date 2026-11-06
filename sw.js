const CACHE_NAME='exam-pwa-v6-20261106';
const CORE=['./','./index.html','./school.html','./training.html','./physiology.html','./app.js','./backup.js','./media.js','./manifest.webmanifest','./icons/app-192.png','./icons/app-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('exam-pwa-')&&k!==CACHE_NAME).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
// Fast startup after install: serve cached app shell immediately, refresh silently for later visits.
event.respondWith((async()=>{const cache=await caches.open(CACHE_NAME);const cached=await cache.match(req,{ignoreSearch:true});if(cached){event.waitUntil(fetch(req).then(response=>{if(response.ok)return cache.put(req,response.clone());}).catch(()=>{}));return cached;}
try{const response=await fetch(req);if(response.ok)event.waitUntil(cache.put(req,response.clone()));return response;}catch(e){if(req.mode==='navigate')return (await cache.match('./index.html'))||Response.error();return Response.error();}})());});
