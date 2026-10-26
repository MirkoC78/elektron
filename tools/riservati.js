/* Controllo prima della pubblicazione: nei file tracciati da git non devono esserci email, password, chiavi o dati di studenti.
   È ammessa solo l'email anonima di GitHub dell'autore. Uso: node tools/riservati.js (esce con errore se trova qualcosa). */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
const ALLOWED_MAIL = /^292388911\+MirkoC78@users\.noreply\.github\.com$|^noreply@anthropic\.com$/;
const RULES = [
  ['email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (m) => !ALLOWED_MAIL.test(m)],
  ['password', /\b(password|passwd|pwd)\s*[:=]\s*['"][^'"]{3,}['"]/gi, () => true],
  ['chiave', /\b(api[_-]?key|secret|token|bearer)\s*[:=]\s*['"][A-Za-z0-9_\-]{12,}['"]/gi, () => true],
  ['chiave GitHub', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, () => true],
  ['chiave privata', /-----BEGIN [A-Z ]*PRIVATE KEY-----/g, () => true],
  ['codice fiscale', /\b[A-Z]{6}\d{2}[A-EHLMPR-T]\d{2}[A-Z]\d{3}[A-Z]\b/g, () => true],
];
const found = [];
for (const f of files) {
  const p = path.join(root, f);
  if (!fs.existsSync(p) || /\.(png|jpe?g|woff2?|ico)$/i.test(f)) continue;
  const txt = fs.readFileSync(p, 'utf8');
  // i caratteri incorporati in base64 non contengono testo leggibile
  const plain = txt.replace(/data:[\w/+-]+;base64,[A-Za-z0-9+/=]+/g, '');
  for (const [what, re, bad] of RULES) for (const m of plain.matchAll(re)) if (bad(m[0])) found.push(`${f}: ${what} «${m[0].slice(0, 60)}»`);
}
console.log(found.length ? `Dati riservati trovati: ${found.length}` : `Nessun dato riservato in ${files.length} file.`);
found.slice(0, 40).forEach((x) => console.log('  ✗ ' + x));
if (found.length) process.exitCode = 1;
