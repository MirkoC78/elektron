/* Test del codice di salvataggio: andata e ritorno su migliaia di stati casuali (anche con stelle oltre lo sblocco, come
   quando lo studente torna indietro nel percorso), errori di battitura e scambi di due caratteri riconosciuti, messaggi chiari. */
const H = require('../src/savecode.js');
const L = require('../src/lessons.js');
const X = require('../src/extras.js');
const LESSONS = L.FLAT.map((f) => f.lesson.id);
const UNITS = L.ORDER;
const BADGES = X.BADGES.map((b) => b.id);
const N = +process.argv[2] || 5000;
let seed = 11;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const pick = (a) => a[rnd(a.length)];
const errors = [];
const lens = [];
let typoCaught = 0, typoTried = 0, swapCaught = 0, swapTried = 0;
for (let k = 0; k < N; k++) {
  const unlocked = rnd(LESSONS.length);
  const stars = {};
  for (let i = 0; i <= unlocked; i++) if (rnd(4)) stars[LESSONS[i]] = 1 + rnd(3);
  if (rnd(3) === 0) for (let i = unlocked + 1; i < LESSONS.length; i++) if (rnd(3) === 0) stars[LESSONS[i]] = 1 + rnd(3);
  const badges = {};
  BADGES.forEach((b) => { if (rnd(3) === 0) badges[b] = '2026-10-01'; });
  const d = new Date(Date.UTC(2025, 0, 1) + rnd(4000) * 864e5);
  const S = {
    name: pick(['', 'Giulia', 'Niccolò', "D'Amico", 'Anna Maria R.', 'x', 'ÈLLA']), goal: pick([30, 50, 80, 120]), xp: rnd(4000000), streak: rnd(4000),
    lastDay: rnd(5) ? d.toISOString().slice(0, 10) : null, fuses: rnd(3), badges,
    course: { unlocked, stars, times: {} },
    stats: { lessons: rnd(4000), answered: rnd(130000), correct: rnd(130000), calc: rnd(16000), faults: rnd(1000), minimal: rnd(1000) },
    settings: { sound: !rnd(2), keypad: !rnd(2), online: !rnd(2), theme: pick(['auto', 'light', 'dark']) },
    prac: { level: pick([1, 2, 3, 4]), onlyDone: !rnd(2), category: pick(H.CATS), unit: rnd(4) ? pick(UNITS) : null },
  };
  const code = H.encode(S, LESSONS, BADGES, UNITS);
  lens.push(code.replace(/-/g, '').length);
  if (!/^[0-9A-HJKMNP-TV-Z-]+$/.test(code)) errors.push('carattere non ammesso nel codice: ' + code);
  let back;
  const typed = code.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'o').replace(/1/g, 'l');
  try { back = H.decode(typed, LESSONS, BADGES, UNITS); } catch (e) { errors.push('decodifica: ' + e.message); continue; }
  const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) errors.push(`${what}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`); };
  same(back.course.unlocked, unlocked, 'sblocco');
  same(Object.entries(back.course.stars).sort(), Object.entries(stars).sort(), 'stelle');
  same([back.xp, back.streak, back.fuses, back.goal], [Math.min(S.xp, 2 ** 22 - 1), Math.min(S.streak, 4095), S.fuses, S.goal], 'punti e serie');
  same(back.lastDay, S.lastDay, 'ultimo giorno');
  same(Object.keys(back.badges).sort(), Object.keys(badges).sort(), 'insegne');
  const capStats = Object.fromEntries(H.STATS.map(([kk, n]) => [kk, Math.min(S.stats[kk], 2 ** n - 1)]));
  same(back.stats, capStats, 'statistiche');
  same(back.settings, S.settings, 'impostazioni');
  same(back.prac, S.prac, 'palestra');
  same(back.name, [...S.name].slice(0, 16).join(''), 'nome');
  const raw = H.clean(code);
  const p = rnd(raw.length);
  const alt = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'.replace(raw[p], '');
  typoTried++;
  try { H.decode(raw.slice(0, p) + alt[rnd(alt.length)] + raw.slice(p + 1), LESSONS, BADGES, UNITS); } catch (e) { typoCaught++; }
  const q = rnd(raw.length - 1);
  if (raw[q] !== raw[q + 1]) { swapTried++; try { H.decode(raw.slice(0, q) + raw[q + 1] + raw[q] + raw.slice(q + 2), LESSONS, BADGES, UNITS); } catch (e) { swapCaught++; } }
}
const msg = (c) => { try { H.decode(c, LESSONS, BADGES, UNITS); return ''; } catch (e) { return e.message; } };
if (!/troppo corto/.test(msg('ABCD-EF'))) errors.push('codice corto senza messaggio chiaro');
if (!/carattere «U»/.test(msg('UUUU-UUUU-UUUU-UUUU-UUUU-UUUU'))) errors.push('carattere estraneo senza messaggio chiaro');
if (!/non torna/.test(msg('0000-0000-0000-0000-0000-0000'))) errors.push('controllo sbagliato senza messaggio chiaro');
console.log('\nTest del codice di salvataggio');
console.log(`  Stati codificati e ricostruiti: ${N}; lunghezza del codice ${Math.min(...lens)}–${Math.max(...lens)} caratteri`);
console.log(`  Errori di battitura riconosciuti: ${typoCaught}/${typoTried}; scambi di due caratteri: ${swapCaught}/${swapTried}`);
if (typoCaught < typoTried * 0.995) errors.push('troppi errori di battitura non riconosciuti');
if (swapCaught < swapTried * 0.99) errors.push('troppi scambi non riconosciuti');
console.log(errors.length ? `  Errori: ${errors.length}` : '  Nessun errore.');
[...new Set(errors)].slice(0, 20).forEach((e) => console.log('  ✗ ' + e));
if (errors.length) process.exitCode = 1;
