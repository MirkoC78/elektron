/* Prova del sito installabile (non fa parte del sito): serve dist/sito su http://127.0.0.1 sotto /elektron/,
   come su GitHub Pages, e controlla in Chrome senza finestra: manifest e icone, registrazione del service worker
   limitata alla sua cartella, nome della cache «elektron@/elektron/@versione», caricamento senza rete,
   e che le cache di altre app dello stesso dominio («verto@…», «hermeneus@…») restino intatte. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const B = require('./browser.js');
const SITE = path.join(__dirname, '..', 'dist', 'sito');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8' };
let online = true;
const server = http.createServer((req, res) => {
  if (!online) { req.socket.destroy(); return; }
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!u.startsWith('/elektron/')) { res.writeHead(404); res.end(); return; }
  let f = path.join(SITE, u.slice('/elektron/'.length));
  if (u.endsWith('/')) f = path.join(f, 'index.html');
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(d); });
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/elektron/`;
  const errs = [];
  const p = await B.open(base + '#onb=0', { w: 360, h: 780, wait: 1500 });
  // una cache di un'altra app dello stesso dominio, che non va toccata
  await p.eval("caches.open('verto@/verto/@prova').then((c) => c.put('/verto/x', new Response('x')))");
  await p.eval('navigator.serviceWorker.ready.then(() => true)');
  await B.sleep(800);
  const info = await p.eval(`(async () => ({
    scope: (await navigator.serviceWorker.getRegistration()).scope,
    caches: await caches.keys(),
    manifest: await (await fetch('./manifest.webmanifest')).json(),
    icons: await Promise.all(['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png'].map(async (f) => (await fetch('./icons/' + f)).status)),
    version: window.ELEK_VERSION,
  }))()`);
  if (info.scope !== base) errs.push('ambito del service worker: ' + info.scope);
  const own = info.caches.filter((k) => k.startsWith('elektron@'));
  if (own.length !== 1 || own[0] !== `elektron@/elektron/@${info.version}`) errs.push('nome della cache: ' + info.caches.join(', '));
  if (!info.caches.includes('verto@/verto/@prova')) errs.push('la cache di Verto è sparita');
  if (info.icons.some((s) => s !== 200)) errs.push('icone mancanti: ' + info.icons.join(','));
  if (info.manifest.scope !== './' || info.manifest.start_url !== './') errs.push('manifest: percorsi non relativi');
  // senza rete: si ricarica dalla cache
  online = false;
  await p.goto(base + '?v=senza-rete#onb=0');
  const txt = await p.eval("document.body.innerText.includes('ELEKTRON') && !!window.ElekApp");
  if (!txt) errs.push('senza rete l’app non si apre');
  errs.push(...p.errors.filter((e) => !/ERR_CONNECTION|Failed to load resource|net::/.test(e)));
  console.log('\nProva del sito installabile');
  console.log(`  Service worker: ${info.scope}; cache: ${info.caches.join(', ')}`);
  console.log(`  Manifest: ${info.manifest.name}; icone: ${info.icons.join(' ')}; senza rete: ${txt ? 'si apre' : 'NON si apre'}`);
  console.log(errs.length ? `  Errori: ${errs.length}` : '  Nessun errore.');
  errs.forEach((e) => console.log('  ✗ ' + e));
  await p.close();
  server.close();
  if (errs.length) process.exitCode = 1;
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
