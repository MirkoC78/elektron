/* Schermate di Elektron in Chrome senza finestra (non fa parte del sito). Salva in _schermate/.
   node tools/schermate.js tavolozze   → le tre tavolozze sulle stesse schermate, chiaro e scuro, a 360 px
   node tools/schermate.js mascotte    → la pagina _prove/mascotte.html
   node tools/schermate.js tutte       → le schermate principali a 360 px e su desktop, chiaro e scuro */
const path = require('path');
const fs = require('fs');
const B = require('./browser.js');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '_schermate');
fs.mkdirSync(OUT, { recursive: true });
const fileUrl = (f) => 'file:///' + path.join(ROOT, f).split(path.sep).join('/');
const app = (hash) => fileUrl('dist/elektron.html') + '?v=' + Date.now() + '#' + hash;

// porta la lezione al primo esercizio con uno schema; con «sbaglia» mostra anche la spiegazione dell'errore
const TO_SCHEMA = (lessonId, wrong) => `(async () => {
  const A = ElekApp; const idx = A.FLAT.findIndex((f) => f.lesson.id === '${lessonId}');
  A.startLesson(idx, { teach: false });
  for (let k = 0; k < 20; k++) { const it = A.cur().it; if (it.problem && it.problem.schema && it.type === 'calc') break; A.act('dunno'); A.act('next'); }
  ${wrong ? "const t = document.querySelector('#typed'); t.value = '12'; t.dispatchEvent(new Event('input', { bubbles: true })); A.act('check');" : ''}
  document.querySelector('.ov-inner').scrollTop = 0;
  return A.cur().it.gen;
})()`;

async function tavolozze() {
  const p = await B.open(null, { w: 360, h: 780, scale: 1 });
  for (const theme of ['light', 'dark']) {
    await p.dark(theme === 'dark');
    for (const pal of ['rame', 'ardesia', 'viola']) {
      await p.goto(app(`demo=12&pal=${pal}&theme=${theme}`));
      await p.shot(path.join(OUT, `tav-${theme}-${pal}-1-percorso.png`));
      await p.goto(app(`demo=20&pal=${pal}&theme=${theme}`));
      await p.eval(TO_SCHEMA('u4l3', false));
      await p.shot(path.join(OUT, `tav-${theme}-${pal}-2-esercizio.png`));
      await p.eval(TO_SCHEMA('u4l3', true));
      await B.sleep(200);
      await p.shot(path.join(OUT, `tav-${theme}-${pal}-3-errore.png`));
      await p.goto(app(`demo=40&view=me&pal=${pal}&theme=${theme}`));
      await p.shot(path.join(OUT, `tav-${theme}-${pal}-4-profilo.png`));
    }
  }
  console.log('errori della console:', p.errors.length ? p.errors : 'nessuno');
  await p.close();
}
async function mascotte() {
  const p = await B.open(fileUrl('_prove/mascotte.html'), { w: 900, h: 900, scale: 1 });
  await p.shot(path.join(OUT, 'mascotte.png'), true);
  await p.close();
}
async function tutte() {
  const views = [['percorso', 'demo=12'], ['palestra', 'demo=40&view=gym'], ['teoria', 'demo=40&view=lib'], ['glossario', 'demo=40&view=words'], ['profilo', 'demo=40&view=me'], ['benvenuto', 'onb=1']];
  for (const [w, h, tag] of [[360, 780, 'tel'], [1280, 800, 'desk']]) {
    const p = await B.open(null, { w, h, scale: 1 });
    for (const theme of ['light', 'dark']) {
      await p.dark(theme === 'dark');
      for (const [name, hash] of views) { await p.goto(app(`${hash}&theme=${theme}`)); await p.shot(path.join(OUT, `${tag}-${theme}-${name}.png`)); }
    }
    console.log(tag, 'errori della console:', p.errors.length ? p.errors : 'nessuno');
    await p.close();
  }
}
const what = process.argv[2] || 'tutte';
({ tavolozze, mascotte, tutte })[what]().catch((e) => { console.error(e); process.exit(1); });
