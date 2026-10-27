/* Icone di Elektron: Erre su fondo ardesia, disegnate da src/guide.js e fotografate da Chrome senza finestra.
   Uso: node tools/icons.js  → assets/icon-192.png, icon-512.png, icon-maskable-512.png (zona sicura 80 %), apple-touch-icon.png (180), favicon-32.png */
const fs = require('fs');
const path = require('path');
const B = require('./browser.js');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets');
fs.mkdirSync(OUT, { recursive: true });
const G = require('../src/guide.js');
const BG = '#263442';
// la figura intera per le icone grandi; per la favicon solo il corpo (a 32 px braccia e gambe non si leggono)
function page(size, scale, bust) {
  const fig = bust ? G.svg('contenta', 40).replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"') : G.svg('contenta', 120).replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"');
  const s = Math.round(size * scale);
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:${BG};width:${size}px;height:${size}px;display:grid;place-items:center;overflow:hidden"><div style="width:${s}px;height:${s}px">${fig}</div></body></html>`;
}
(async () => {
  const jobs = [['icon-512.png', 512, 0.86, false], ['icon-192.png', 192, 0.86, false], ['icon-maskable-512.png', 512, 0.64, false], ['apple-touch-icon.png', 180, 0.8, false], ['favicon-32.png', 32, 1.05, true]];
  for (const [name, size, scale, bust] of jobs) {
    const file = path.join(OUT, '_tmp.html');
    fs.writeFileSync(file, page(size, scale, bust));
    const p = await B.open('file:///' + file.split(path.sep).join('/'), { w: size, h: size, scale: 1, wait: 300 });
    await p.shot(path.join(OUT, name));
    await p.close();
    console.log('  ' + name);
  }
  fs.unlinkSync(path.join(OUT, '_tmp.html'));
})().catch((e) => { console.error(e); process.exit(1); });
