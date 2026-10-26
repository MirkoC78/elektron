/* Verifica del sistema di design (docs/sistema-design.md):
   - colori, dimensioni del testo, raggi e ombre solo dai gettoni;
   - altezze dei controlli interattivi solo dai tre gettoni --h-sm, --h-md, --h-lg;
   - ogni misura in px multipla di 4 (tranne 1–3 px per bordi e linee sottili);
   - nessuno stile scritto a mano nel markup generato da app.js.
   Uso: node tools/audit-tokens.js   (esce con errore se trova valori non ammessi) */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'src/app.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const js = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const rules = [];
const re = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = re.exec(css))) rules.push({ sel: m[1].trim().split('\n').pop().trim(), body: m[2], at: css.slice(0, m.index).split('\n').length + 1 });
// il controllo stesso, con i suoi stati e varianti (non gli elementi al suo interno)
const CONTROLS = /^(\.btn|\.iconbtn|\.typed|\.select select|\.seg button|\.opt|\.tile|\.match button|\.rowbtn|\.choice|\.linkbtn|\.tool|\.jump|\.chip|\.tabs button|\.rail button|\.stone|\.switch)([:.[][^ ]*)?$/;
const out = { colori: [], testo: [], raggi: [], ombre: [], altezze: [], griglia4: [], markup: [] };
for (const r of rules) {
  if (/^:root/.test(r.sel) || r.sel.startsWith('@')) continue;
  for (const decl of r.body.split(';').map((d) => d.trim()).filter(Boolean)) {
    const i = decl.indexOf(':');
    const p = decl.slice(0, i).trim(), val = decl.slice(i + 1).trim();
    const where = `${r.sel.slice(0, 70)} { ${p}: ${val.slice(0, 70)} } (riga ${r.at})`;
    if (/#[0-9a-f]{3,8}\b|rgb\(/i.test(val)) out.colori.push(where);
    if (p === 'font-size' && !/^var\(--fs-[a-z0-9]+\)$|^inherit$/.test(val)) out.testo.push(where);
    if (p === 'border-radius' && !/^((var\(--r-[a-z]+\)|50%|0)\s*)+$/.test(val)) out.raggi.push(where);
    if (p === 'box-shadow' && !/^(0 var\(--depth\) 0 var\(--[\w-]+\)|0 0 0 var\(--[\w-]+\)|var\(--sh-float\)|none)$/.test(val)) out.ombre.push(where);
    if (CONTROLS.test(r.sel) && /^(min-)?height$/.test(p) && !/^var\(--h-(sm|md|lg)\)$/.test(val)) out.altezze.push(where);
    for (const px of val.match(/-?\d+(\.\d+)?px/g) || []) {
      const n = Math.abs(parseFloat(px));
      if (n > 3 && n % 4 !== 0) out.griglia4.push(where);
    }
  }
}
// stili nel markup: ammessi solo i valori calcolati sul momento (posizione del popup)
for (const mm of js.matchAll(/style="[^"]*"|\.style\.(?!left|top)\w+\s*=/g)) out.markup.push(mm[0]);
// gettoni definiti ma mai usati (nel foglio di stile, nell'app o nella costruzione)
const all = css + js + fs.readFileSync(path.join(root, 'build.js'), 'utf8');
const defs = [...new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((x) => x[1]))];
out.inutili = defs.filter((d) => !all.includes(`var(${d})`) && !all.includes(`var(${d},`) && !all.includes(`'${d}'`));
let n = 0;
for (const [k, list] of Object.entries(out)) {
  const u = [...new Set(list)];
  console.log(`${k}: ${u.length}`);
  u.slice(0, 40).forEach((x) => console.log('   ' + x));
  n += u.length;
}
console.log(n ? `Valori fuori dal sistema: ${n}` : 'Nessun valore fuori dal sistema.');
if (n) process.exitCode = 1;
