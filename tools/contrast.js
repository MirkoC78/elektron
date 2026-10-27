/* Controllo dei contrasti WCAG 2.1 AA della tavolozza Ardesia, in tema chiaro e scuro, ricostruendo la cascata delle variabili di app.css.
   Comprende i colori degli schemi e degli strumenti (sch.css usa gli stessi gettoni).
   Uso: node tools/contrast.js [--md]   (con --md stampa una tabella per docs/accessibilita.md).
   Le tavolozze scartate (Rame, Viola elettrico) sono nella storia del repository, tappa 6. */
const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// blocchi di variabili: selettore → { --nome: valore }
const blocks = [];
const re = /(@media[^{]*\{)?\s*([^{}@]+)\{([^{}]*)\}/g;
let m;
while ((m = re.exec(css))) {
  const vars = Object.fromEntries([...m[3].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((x) => [x[1], x[2].trim()]));
  if (Object.keys(vars).length) blocks.push({ sel: m[2].trim(), vars });
}
const find = (sel) => (blocks.find((b) => b.sel === sel) || { vars: {} }).vars;
function palette(p, dark) {
  const v = Object.assign({}, ...blocks.filter((b) => b.sel === ':root').map((b) => b.vars));
  if (dark) Object.assign(v, find(':root:not([data-theme="light"])'));
  if (p) Object.assign(v, find(`:root[data-palette="${p}"]`));
  if (p && dark) Object.assign(v, find(`:root[data-palette="${p}"]:not([data-theme="light"])`));
  return v;
}
const lum = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// [primo piano, sfondo, soglia, dove si vede]
const PAIRS = [
  ['--ink', '--bg', 4.5, 'testo sullo sfondo'], ['--ink', '--surface', 4.5, 'testo sulle schede'], ['--ink', '--surface-2', 4.5, 'testo sui riquadri grigi'],
  ['--muted', '--bg', 4.5, 'testo secondario sullo sfondo'], ['--muted', '--surface', 4.5, 'testo secondario sulle schede'], ['--muted', '--surface-2', 4.5, 'testo secondario sui riquadri grigi'],
  ['--pri-text', '--bg', 4.5, 'collegamenti e testo attivo'], ['--pri-text', '--surface', 4.5, 'collegamenti sulle schede'], ['--pri-text', '--pri-soft', 4.5, 'etichette e scelte attive'],
  ['--pri-ink', '--pri', 4.5, 'testo dei pulsanti principali'], ['--on-state', '--good', 4.5, 'pulsante «giusto»'], ['--on-state', '--bad', 4.5, 'pulsante «sbagliato»'],
  ['--ink', '--good-soft', 4.5, 'riquadro della risposta giusta'], ['--ink', '--bad-soft', 4.5, 'riquadro della risposta sbagliata'],
  ['--good-text', '--good-soft', 4.5, 'risposta giusta, titolo e scelta'], ['--bad-text', '--bad-soft', 4.5, 'risposta sbagliata, titolo e scelta'], ['--star-d', '--star-soft', 4.5, 'etichetta «Nuova»'], ['--star-d', '--surface', 4.5, 'punti XP'],
  ['--flame', '--surface', 4.5, 'serie di giorni'], ['--on-state', '--bad', 4.5, 'contatore errori'],
  ['--on-g', '--g-1', 4.5, 'intestazione unità, classe 3ª'], ['--on-g', '--g-2', 4.5, 'intestazione unità, classe 4ª'], ['--on-g', '--g-3', 4.5, 'intestazione unità, classe 5ª'],
  ['--acc-text', '--surface', 4.5, 'termini inglesi del glossario'], ['--muted', '--surface-2', 4.5, 'intestazione delle unità chiuse'],
  ['--sch-text', '--sch-fill', 4.5, 'scritte degli schemi'], ['--sch-muted', '--sch-fill', 4.5, 'valori dei componenti'], ['--sch-wire', '--sch-fill', 3, 'conduttori'],
  ['--sch-cur', '--sch-fill', 4.5, 'frecce e nomi delle correnti'], ['--sch-vol', '--sch-fill', 4.5, 'frecce e nomi delle tensioni'], ['--sch-node', '--sch-fill', 4.5, 'nomi dei nodi'], ['--sch-hl', '--sch-fill', 3, 'componente evidenziato'],
  ['--scope-txt', '--scope-bg', 4.5, 'scritte dell’oscilloscopio e del multimetro'], ['--scope-tr1', '--scope-bg', 3, 'traccia 1'], ['--scope-tr2', '--scope-bg', 3, 'traccia 2'],
  ['--pri', '--bg', 3, 'pietra della lezione attuale'], ['--road-done', '--bg', 3, 'pietre completate'], ['--focus', '--bg', 3, 'anello di focus'], ['--focus', '--surface', 3, 'focus sulle schede'],
  ['--line-strong', '--surface', 3, 'bordi dei campi e dei pulsanti chiari'], ['--line-strong', '--bg', 3, 'bordi sullo sfondo'], ['--star', '--surface', 3, 'stelle e anello obiettivo'],
  ['--good', '--surface', 3, 'segno di spunta'], ['--bad', '--bad-soft', 3, 'bordo della risposta sbagliata'], ['--pri', '--surface', 3, 'interruttori accesi'],
];
const md = process.argv.includes('--md');
let fails = 0;
const rows = [];
for (const p of [null]) for (const dark of [false, true]) {
  const v = palette(p, dark);
  for (const [fg, bg, min, where] of PAIRS) {
    const a = v[fg], b = v[bg];
    if (!a || !b) { rows.push([p || 'Ardesia', dark ? 'scuro' : 'chiaro', fg, bg, 'mancante', min, where, false]); fails++; continue; }
    const r = ratio(a, b);
    const ok = r >= min;
    if (!ok) fails++;
    rows.push([p || 'Ardesia', dark ? 'scuro' : 'chiaro', fg, bg, r.toFixed(2), min, where, ok]);
  }
}
if (md) {
  console.log('| Palette | Tema | Colore | Sfondo | Contrasto | Minimo | Dove |\n|---|---|---|---|---|---|---|');
  rows.forEach((x) => console.log(`| ${x[0]} | ${x[1]} | \`${x[2]}\` | \`${x[3]}\` | ${x[4]}${x[7] ? '' : ' ✗'} | ${x[5]} | ${x[6]} |`));
} else {
  rows.filter((x) => !x[7]).forEach((x) => console.log(`✗ ${x[0]} ${x[1]}: ${x[2]} su ${x[3]} = ${x[4]} (minimo ${x[5]}) — ${x[6]}`));
  console.log(`Coppie controllate: ${rows.length}; sotto la soglia: ${fails}`);
}
if (fails) process.exitCode = 1;
