/* Controllo: le classi usate nell'interfaccia esistono nel foglio di stile (e viceversa, per trovare regole morte).
   Uso: node tools/check-classes.js */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const js = ['src/app.js', 'src/guide.js'].filter((f) => fs.existsSync(path.join(root, f))).map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const css = fs.readFileSync(path.join(root, 'src/app.css'), 'utf8');
const used = new Set();
const add = (s) => s.split(/\s+/).forEach((c) => { if (/^[a-z][\w-]*$/i.test(c)) used.add(c); });
for (const m of js.matchAll(/class="([^"]*)"/g)) add(m[1].replace(/\$\{[^}]*\}/g, ' '));
for (const m of js.matchAll(/className\s*=\s*'([^']*)'/g)) add(m[1]);
for (const m of js.matchAll(/classList\.(?:add|toggle|remove)\('([^']+)'/g)) add(m[1]);
const defined = new Set([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const missing = [...used].filter((c) => !defined.has(c) && !/^(on|off)$/.test(c)).sort();
const unused = [...defined].filter((c) => !js.includes(c)).sort();
console.log('Classi usate senza regola:', missing.join(' ') || 'nessuna');
console.log('Regole senza uso apparente:', unused.join(' ') || 'nessuna');
