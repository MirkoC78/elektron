/* ELEKTRON — costruzione.
   Produce: dist/elektron.html (file unico autonomo, caratteri e formule incorporati, funziona anche aperto dal disco e senza rete)
            dist/sito/ (index.html, manifest.webmanifest, sw.js, icone, licenze) da pubblicare su un hosting statico HTTPS.
   Uso: node build.js */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = __dirname;
const r = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// 1. Caratteri incorporati: IBM Plex Sans (latino e greco), IBM Plex Mono, STIX Two Math ridotto ai simboli delle formule
const R_LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const R_GREEK = 'U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF';
const FONTS = [];
for (const w of [400, 500, 600, 700]) FONTS.push(['IBM Plex Sans', 'normal', w, `plex-sans-latin-${w}.woff2`, R_LATIN, 'woff2'], ['IBM Plex Sans', 'normal', w, `plex-sans-greek-${w}.woff2`, R_GREEK, 'woff2']);
for (const w of [400, 600]) FONTS.push(['IBM Plex Mono', 'normal', w, `plex-mono-latin-${w}.woff2`, R_LATIN, 'woff2']);
FONTS.push(['Elektron Math', 'normal', 400, 'stix-two-math-elektron.woff', null, 'woff']);
const fontCSS = FONTS.map(([fam, style, w, file, range, fmt]) => {
  const b64 = fs.readFileSync(path.join(ROOT, 'fonts', file)).toString('base64');
  return `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};font-display:swap;src:url(data:font/${fmt};base64,${b64}) format('${fmt}')${range ? `;unicode-range:${range}` : ''}}`;
}).join('\n');

// 2. Script nell'ordine di dipendenza: motore, schemi, percorso, interfaccia
const MODULES = [
  'src/units.js', 'src/cx.js', 'src/math.js', 'src/mna.js', 'src/circuit.js', 'src/mistakes.js', 'src/solve.js',
  'src/transient.js', 'src/logic.js', 'src/numsys.js', 'src/devices.js', 'src/signals.js', 'src/answers.js',
  'src/schematic.js', 'src/templates.js', 'src/gates.js', 'src/plots.js',
  'src/concepts.js', 'src/problems.js', 'src/problems2.js', 'src/course3.js', 'src/course45.js', 'src/lessons.js',
  'src/extras.js', 'src/savecode.js', 'src/guide.js',
  'src/ui-core.js', 'src/ui-render.js', 'src/ui-exercises.js', 'src/ui-session.js', 'src/ui-views.js', 'src/app.js',
].filter((m) => fs.existsSync(path.join(ROOT, m)));
const code = MODULES.map((m) => `/* ---- ${m} ---- */\n` + r(m)).join('\n;\n');
const css = ['src/app.css', 'src/sch.css'].filter((m) => fs.existsSync(path.join(ROOT, m))).map(r).join('\n');
const ASSETS_DIR = path.join(ROOT, 'assets');
const hasIcons = fs.existsSync(path.join(ASSETS_DIR, 'icon-192.png'));
const png = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(ASSETS_DIR, f)).toString('base64');
// anche questo file entra nella versione: un cambio del manifest o del service worker deve arrivare a chi ha già l'app
const hash = crypto.createHash('sha256').update(code + css + fontCSS + r('build.js'));
if (hasIcons) for (const f of fs.readdirSync(ASSETS_DIR).sort()) hash.update(fs.readFileSync(path.join(ASSETS_DIR, f)));
const version = hash.digest('hex').slice(0, 10);
const THEME = '#F1F3F5';
// il marchio: un nodo con tre conduttori (un punto di un circuito), disegnato con i gettoni dei temi
const MARK = '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 16h9M19 16h9M16 4v9" fill="none" stroke="var(--pri)" stroke-width="3.2" stroke-linecap="round"/><circle cx="16" cy="16" r="5.2" fill="var(--acc)"/></svg>';

function page(site) {
  const icons = !hasIcons ? '' : site
    ? `<link rel="manifest" href="./manifest.webmanifest">\n<link rel="icon" href="./icons/favicon-32.png" sizes="32x32">\n<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">`
    : `<link rel="icon" href="${png('favicon-32.png')}" sizes="32x32">\n<link rel="apple-touch-icon" href="${png('apple-touch-icon.png')}">`;
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Elektron</title>
<meta name="description" content="Corso guidato di elettronica per l’istituto tecnico: lezioni brevi, problemi con lo svolgimento, laboratorio virtuale, teoria, formulario e glossario. Tutto sul dispositivo, senza account.">
<meta name="theme-color" content="${THEME}">
<meta name="color-scheme" content="light dark">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Elektron">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="format-detection" content="telephone=no">
<meta name="generator" content="Elektron ${version}">
${icons}
<style>
${fontCSS}
${css}
</style>
</head>
<body>
<a class="skip" href="#main">Vai al contenuto</a>
<div id="app" class="app"><div class="splash" role="status">${MARK}<b>ELEKTRON</b><span>Preparo le lezioni…</span></div><noscript><p class="noscript">Elektron ha bisogno di JavaScript attivo nel browser.</p></noscript></div>
<script>window.ELEK_SITE = ${site ? 'true' : 'false'}; window.ELEK_VERSION = '${version}';</script>
<script>
${code}
</script>
</body>
</html>
`;
}

const DIST = path.join(ROOT, 'dist');
const SITE = path.join(DIST, 'sito');
fs.mkdirSync(path.join(SITE, 'icons'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'elektron.html'), page(false));
fs.writeFileSync(path.join(SITE, 'index.html'), page(true));
if (hasIcons) for (const f of fs.readdirSync(ASSETS_DIR)) fs.copyFileSync(path.join(ASSETS_DIR, f), path.join(SITE, 'icons', f));
fs.copyFileSync(path.join(ROOT, 'fonts', 'LICENZE-CARATTERI.txt'), path.join(SITE, 'LICENZE-CARATTERI.txt'));
fs.writeFileSync(path.join(SITE, 'manifest.webmanifest'), JSON.stringify({
  name: 'Elektron: elettronica per l’istituto tecnico', short_name: 'Elektron', description: 'Corso guidato di elettronica: lezioni, problemi con lo svolgimento, laboratorio virtuale, teoria e glossario.',
  // l'identità dell'app si risolve rispetto alla radice del dominio, non alla cartella: con «./» tutte le app
  // di mirkoc78.github.io avrebbero la stessa (e il telefono direbbe «app già installata»). Ci vuole il nome.
  id: 'elektron', lang: 'it', dir: 'ltr', start_url: './', scope: './', display: 'standalone', orientation: 'portrait',
  background_color: THEME, theme_color: THEME, categories: ['education'],
  icons: [
    { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: './icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];
fs.writeFileSync(path.join(SITE, 'sw.js'), `/* Elektron — service worker: tutto in cache per l'uso senza rete. Versione ${version}.
   Il dominio ospita altre app (mirkoc78.github.io/verto/, /hermeneus/): questo service worker vale solo per la sua cartella,
   chiama le cache «elektron@/cartella/@versione» e all'attivazione cancella soltanto le proprie versioni vecchie.
   Non tocca mai le cache che iniziano con «verto@» o «hermeneus@» (né quelle di qualunque altra app). */
const APP = 'elektron';
const VERSION = '${version}';
const SCOPE = new URL('./', self.location).pathname;
const PREFIX = APP + '@' + SCOPE + '@';
const CACHE = PREFIX + VERSION;
const FOREIGN = ['verto@', 'hermeneus@'];
const ASSETS = ${JSON.stringify(ASSETS)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIX) && k !== CACHE && !FOREIGN.some((f) => k.startsWith(f))).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then((c) => c.match('./index.html')).then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true }).then((r) => r || fetch(req).then((res) => {
    if (res.ok) c.put(req, res.clone());
    return res;
  }))));
});
`);
fs.writeFileSync(path.join(SITE, '.nojekyll'), '');
fs.writeFileSync(path.join(SITE, 'LEGGIMI.txt'), `ELEKTRON — pacchetto per la pubblicazione (versione ${version})

Contenuto
  index.html             l'applicazione completa (caratteri e formule incorporati)
  manifest.webmanifest   dati per l'installazione su telefono
  sw.js                  service worker: rende l'app utilizzabile senza rete (solo nella sua cartella)
  .nojekyll              per GitHub Pages: pubblica i file così come sono
  icons/                 icone dell'app
  LICENZE-CARATTERI.txt  licenze SIL OFL 1.1 di IBM Plex Sans, IBM Plex Mono e STIX Two Math

Pubblicazione
  Carica l'intera cartella su un hosting statico con HTTPS (GitHub Pages, Netlify, spazio web della scuola).
  Non serve un server: niente database, niente account, nessun dato degli studenti lascia il dispositivo.
  L'installazione («Installa» / «Aggiungi alla schermata Home») richiede HTTPS.

Aggiornamenti
  Ricostruisci con «node build.js» e ricarica i file: il service worker cambia nome di cache
  a ogni versione e sostituisce la vecchia copia offline al primo accesso.
`);
const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';
console.log(`Elektron ${version}`);
console.log('  dist/elektron.html    ' + kb(path.join(DIST, 'elektron.html')));
console.log('  dist/sito/index.html  ' + kb(path.join(SITE, 'index.html')));
if (!hasIcons) console.log('  (icone non ancora generate: python tools/icons.py)');
