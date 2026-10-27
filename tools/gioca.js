/* Verifica nel browser: costruisce prima con «node build.js», poi «node tools/gioca.js [da] [a] [larghezza]».
   Apre dist/elektron.html in Chrome senza finestra, carica _prove/giocatore.js e rigioca le lezioni. */
const fs = require('fs');
const path = require('path');
const B = require('./browser.js');
const ROOT = path.join(__dirname, '..');
(async () => {
  const [da = 0, a = 999, w = 360] = process.argv.slice(2).map(Number);
  const url = 'file:///' + path.join(ROOT, 'dist', 'elektron.html').split(path.sep).join('/') + '?v=' + Date.now() + '#demo=0';
  const p = await B.open(url, { w, h: 780, scale: 1 });
  await p.eval(fs.readFileSync(path.join(ROOT, '_prove', 'giocatore.js'), 'utf8'));
  const t0 = Date.now();
  const R = await p.eval(process.env.PALESTRA ? 'giocaPalestra()' : `giocaTutto({ da: ${da}, a: ${a} })`);
  console.log(`Giocatore: ${R.lezioni} lezioni, ${R.schede} schede, ${R.esercizi} esercizi in ${Math.round((Date.now() - t0) / 1000)} s (larghezza ${w} px)`);
  console.log('  Tipi: ' + Object.entries(R.tipi).map(([k, v]) => `${k} ${v}`).join(', '));
  const errs = R.errori.concat(R.console, p.errors);
  console.log(errs.length ? `  Errori: ${errs.length}` : '  Ogni risposta giusta accettata, tre stelle in ogni lezione, console pulita.');
  [...new Set(errs)].slice(0, 60).forEach((e) => console.log('  ✗ ' + e));
  const ax = [...new Set(R.a11y || [])];
  console.log(ax.length ? `  Accessibilità: ${ax.length} problemi` : '  Accessibilità: ogni comando ha un nome, ogni disegno una descrizione, bersagli di almeno 40 px.');
  ax.slice(0, 40).forEach((e) => console.log('  ♿ ' + e));
  const out = [...new Set(R.fuori)];
  console.log(out.length ? `  Fuori dalla larghezza: ${out.length}` : '  Niente esce dalla larghezza dello schermo.');
  out.slice(0, 30).forEach((e) => console.log('  ↔ ' + e));
  await p.close();
  if (errs.length || out.length || ax.length) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
