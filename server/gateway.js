// API gateway: zero dependencies. Serves the PWA and /v1 with role checks, rate limits, audit and live rooms.
import http from 'node:http';
import dgram from 'node:dgram';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createServices, memoryStore, validCheck } from './services.js';
import { CHECK, ITEM, PROBES, validEvent } from '../core/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 4173);
const DATA = process.env.NEEV_DATA || path.join(ROOT, 'data');
const SECRET = process.env.NEEV_SECRET || crypto.randomBytes(32).toString('hex');

// append-only event log on disk (stands in for PostgreSQL 16)
function fileStore() {
  fs.mkdirSync(DATA, { recursive: true });
  const f = path.join(DATA, 'events.ndjson');
  const seed = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').flatMap((l) => { try { const e = JSON.parse(l); return validEvent(e) ? [e] : []; } catch { return []; } }) : [];
  const m = memoryStore(seed);
  return { ...m, add: (e) => { m.add(e); fs.appendFileSync(f, JSON.stringify(e) + '\n'); } };
}
const audit = [];
const log = (who, what) => { audit.push({ at: new Date().toISOString(), who, what }); if (audit.length > 500) audit.shift(); };

// short-lived signed tokens (HS256 JWT shape); demo stand-in for OIDC SSO
const b64 = (x) => Buffer.from(x).toString('base64url');
const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
function issue(role) { const body = `${b64('{"alg":"HS256","typ":"JWT"}')}.${b64(JSON.stringify({ role, exp: Date.now() + 15 * 60e3 }))}`; return `${body}.${sign(body)}`; }
function roleOf(req) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, ''), i = t.lastIndexOf('.'); if (i < 0) return null;
  const want = Buffer.from(sign(t.slice(0, i))), got = Buffer.from(t.slice(i + 1));
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  try { const p = JSON.parse(Buffer.from(t.split('.')[1], 'base64url')); return p.exp > Date.now() ? p.role : null; } catch { return null; }
}
// behind a host's proxy every visitor shares one socket address, so read the forwarded one there only
const PROXIED = !!(process.env.RENDER || process.env.TRUST_PROXY);
const clientIp = (req) => (PROXIED && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress;
const MAX_EVENTS = 50000;
const hits = new Map();
function limited(ip) {
  const now = Date.now(); let h = hits.get(ip);
  if (!h || now - h.t > 10000) { h = { t: now, n: 0 }; hits.set(ip, h); if (hits.size > 5000) hits.clear(); }
  return ++h.n > 400;
}

// Live rooms: every phone in the hall becomes a NeevCard
const rooms = new Map();
const clean = (s) => String(s || '').replace(/[^\p{L}\p{N} .'-]/gu, '').trim().slice(0, 16);
const pub = (r) => ({ code: r.code, item: r.item, open: r.open, reveal: r.reveal, players: [...r.players.values()].map(({ id, name, answers }) => ({ id, name, answers })) });
const cast = (r) => { const s = `data: ${JSON.stringify(pub(r))}\n\n`; for (const c of r.clients) c.write(s); };
setInterval(() => { for (const [k, r] of rooms) if (Date.now() - r.t > 3 * 3600e3) { r.clients.forEach((c) => c.end()); rooms.delete(k); } }, 60e3).unref();

function body(req) {
  return new Promise((ok, no) => { let s = ''; req.on('data', (c) => { s += c; if (s.length > 1e6) { no(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); } }); req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch { no(Object.assign(new Error('bad json'), { status: 400 })); } }); req.on('error', no); });
}
// the address this machine actually uses on the network (a UDP connect picks the route, nothing is sent)
let mainIp = null;
function findRoute() { const s = dgram.createSocket('udp4'); s.on('error', () => s.close()); s.connect(53, '192.0.2.1', () => { try { mainIp = s.address().address; } catch { /* offline */ } s.close(); }); }
const lan = () => Object.values(os.networkInterfaces()).flat().filter((n) => n && n.family === 'IPv4' && !n.internal).map((n) => n.address).sort((a, b) => (b === mainIp) - (a === mainIp));

export function createGateway(store = fileStore()) {
  const svc = createServices(store);
  async function api(req, res, url) {
    const send = (code, o) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(o)); };
    const p = url.pathname.split('/').filter(Boolean).slice(1), m = req.method;
    if (limited(clientIp(req))) return send(429, { error: 'rate limited' });
    const check = validCheck(url.searchParams.get('check')) ? url.searchParams.get('check') : undefined;
    const need = (...roles) => { const r = roleOf(req); if (r && roles.includes(r)) return r; send(r ? 403 : 401, { error: r ? 'role not allowed' : 'sign in first' }); return null; };

    if (p[0] === 'health') { findRoute(); await new Promise((r) => setTimeout(r, 30)); } 
    if (p[0] === 'health') return send(200, { ok: true, events: svc.sync.count(), lan: /^(localhost|127\.0\.0\.1)(:|$)/.test(req.headers.host || '') && !PROXIED ? lan() : [], port: server.address()?.port });
    if (p[0] === 'auth' && m === 'POST') { const { role } = await body(req); if (!['teacher', 'leader', 'content'].includes(role)) return send(400, { error: 'unknown role' }); log(role, 'sign-in'); return send(200, { token: issue(role), expiresIn: 900 }); }
    if (p[0] === 'engine' && p[1] === 'golden') return send(200, svc.diagnosis.golden());
    if (p[0] === 'packs') return send(200, svc.content.pack());
    if (p[0] === 'events' && m === 'POST') { const r = need('teacher'); if (!r) return; const b = await body(req); if (!Array.isArray(b.events) || b.events.length > 2000) return send(400, { error: 'events[] expected' }); if (b.check !== undefined && !validCheck(b.check)) return send(400, { error: 'bad check id' }); if (svc.sync.count() + b.events.length > MAX_EVENTS) return send(507, { error: 'demo log is full' }); const out = svc.sync.upload(b.events, b.check); log(r, `events +${out.accepted} dup ${out.duplicates} held ${out.held}`); return send(200, { ...out, total: svc.sync.count() }); }
    if (p[0] === 'sections' && p[2] === 'board') { if (!need('teacher', 'leader')) return; return send(200, svc.insights.board(p[1], check)); }
    if (p[0] === 'sections' && p[2] === 'roster') { if (!need('teacher')) return; return send(200, svc.erp.roster(p[1])); }
    if (p[0] === 'sections' && p[2] === 'replay') { if (!need('teacher')) return; return send(200, Object.fromEntries(Object.entries(svc.diagnosis.replay(p[1], check)).map(([k, d]) => [k, { label: d.label, post: d.post }]))); }
    if (p[0] === 'content' && p[1] === 'check' && m === 'POST') { if (!need('content', 'teacher')) return; return send(200, svc.content.check((await body(req)).p)); }
    if (p[0] === 'audit') { if (!need('leader')) return; return send(200, audit.slice(-50)); }

    if (p[0] === 'rooms') {
      if (!p[1] && m === 'POST') { if (rooms.size > 200) return send(503, { error: 'busy' }); let code; do code = String(1000 + crypto.randomInt(9000)); while (rooms.has(code)); const r = { code, host: crypto.randomUUID(), item: CHECK[0].id, open: true, reveal: false, players: new Map(), clients: new Set(), t: Date.now() }; rooms.set(code, r); return send(200, { code, host: r.host }); }
      const r = rooms.get(p[1]); if (!r) return send(404, { error: 'room not found' });
      if (p[2] === 'live') { res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' }); res.write(`data: ${JSON.stringify(pub(r))}\n\n`); r.clients.add(res); const beat = setInterval(() => res.write(': hi\n\n'), 20000); req.on('close', () => { clearInterval(beat); r.clients.delete(res); }); return; }
      if (p[2] === 'join' && m === 'POST') { if (r.players.size >= 60) return send(409, { error: 'room full' }); const id = crypto.randomUUID(), b = await body(req); r.players.set(id, { id: r.players.size + 1, name: clean(b.name) || `Guest ${r.players.size + 1}`, answers: [] }); cast(r); return send(200, { player: id, n: r.players.size }); }
      if (p[2] === 'answer' && m === 'POST') { const b = await body(req), pl = r.players.get(b.player); if (!pl || !r.open) return send(409, { error: 'closed' }); if (!['A', 'B', 'C', 'D'].includes(b.option) || !['sure', 'guess'].includes(b.side)) return send(400, { error: 'bad answer' }); if (!pl.answers.some((a) => a.item === r.item)) pl.answers.push({ item: r.item, option: b.option, side: b.side }); cast(r); return send(200, { ok: true }); }
      if (p[2] === 'host' && m === 'POST') { const b = await body(req); if (b.host !== r.host) return send(403, { error: 'host only' }); if (b.item && [...CHECK, ...PROBES].some((i) => i.id === b.item) && ITEM[b.item]) { r.item = b.item; r.open = true; r.reveal = false; } if (typeof b.reveal === 'boolean') { r.reveal = b.reveal; r.open = !b.reveal; } cast(r); return send(200, { ok: true }); }
    }
    send(404, { error: 'no such endpoint' });
  }
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
  const gz = new Map();
  function serve(req, res, url) {
    let f = path.normalize(path.join(DIST, decodeURIComponent(url.pathname)));
    if (f !== DIST && !f.startsWith(DIST + path.sep)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
    if (!fs.existsSync(f)) { res.writeHead(503); return res.end('Run "npm run build" first.'); }
    const ext = path.extname(f), h = { 'content-type': TYPES[ext] || 'application/octet-stream', 'x-content-type-options': 'nosniff', 'x-frame-options': 'SAMEORIGIN', 'permissions-policy': 'camera=(self), microphone=(), geolocation=()', 'referrer-policy': 'same-origin', 'cache-control': f.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache' };
    let buf = fs.readFileSync(f);
    if (/gzip/.test(req.headers['accept-encoding'] || '') && /html|js|css|svg|json/.test(ext)) { const k = f + fs.statSync(f).mtimeMs; if (!gz.has(k)) gz.set(k, zlib.gzipSync(buf)); buf = gz.get(k); h['content-encoding'] = 'gzip'; }
    res.writeHead(200, h); res.end(buf);
  }
  const server = http.createServer((req, res) => {
    let url; try { url = new URL(req.url, 'http://x'); decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
    if (url.pathname.startsWith('/v1/')) return api(req, res, url).catch((e) => { if (!res.headersSent) { res.writeHead(e.status || 500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: e.status ? e.message : 'server error' })); } });
    serve(req, res, url);
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  findRoute();
  createGateway().listen(PORT, '0.0.0.0', () => {
    console.log(`\n  Neev is running\n  This computer : http://localhost:${PORT}`);
    for (const a of lan()) console.log(`  Phone (Wi-Fi) : http://${a}:${PORT}`);
    console.log('');
  });
}
