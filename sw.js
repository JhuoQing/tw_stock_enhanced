const CACHE='tw-market-v3.2-public';
const SHELL=['./','index.html','app.js','indicators.js','enhancements.css','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','vendor/chart.umd.min.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tw-market-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const compressed=url.pathname.endsWith('/data.json.gz');const data=url.pathname.endsWith('/data.json')||compressed;
 const report=/\/reports\/\d{4}-\d{2}-\d{2}\.json$/.test(url.pathname);
 if(!data&&!report&&!SHELL.some(s=>url.pathname.endsWith('/'+s.replace('./','')))&&event.request.mode!=='navigate')return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),key=data?new Request(new URL(compressed?'data.json.gz':'data.json',self.registration.scope)):event.request;
  try{const response=await fetch(event.request);if(!response.ok)throw Error('HTTP');if(data){const value=compressed?await new Response(response.clone().body.pipeThrough(new DecompressionStream('gzip'))).json():await response.clone().json();if(!Array.isArray(value.quotes))throw Error('schema')}await cache.put(key,response.clone());return response}catch(error){const stored=await cache.match(key);if(stored)return stored;if(event.request.mode==='navigate'){const shell=await cache.match('index.html');if(shell)return shell}return new Response('Offline and no cached response',{status:503})}
 })());
});
