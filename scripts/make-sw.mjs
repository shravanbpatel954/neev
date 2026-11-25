// Writes dist/sw.js with a precache list, so the whole app opens in airplane mode after one visit.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist = path.resolve('dist'), files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(path.relative(dist, p).replaceAll('\\', '/')); } })(dist);
const list = files.filter((f) => f !== 'sw.js');
const hash = crypto.createHash('sha1'); list.forEach((f) => hash.update(f).update(fs.readFileSync(path.join(dist, f))));
const name = 'neev-' + hash.digest('hex').slice(0, 10);
fs.writeFileSync(path.join(dist, 'sw.js'), `const C='${name}',F=${JSON.stringify(['./', ...list.filter((f) => f !== 'index.html')])};
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('neev-')&&x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.includes('/v1/'))return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('./')));return}
e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)))});
`);
console.log('sw.js:', name, list.length, 'files');
