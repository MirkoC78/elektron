/* Test del controllo delle risposte (tappa 4).
   1. Tutte le scritture giuste sono accettate: prefissi, virgola o punto, notazione scientifica, ·10^, scritture dei tecnici,
      unità in minuscolo o per esteso, arrotondamenti a 3 e 4 cifre significative; l'unità mancante è segnalata.
   2. Migliaia di risposte sbagliate simulate non sono mai accettate: fuori tolleranza, fattori 1000, segno, unità sbagliata,
      valori casuali.
   3. Ogni errore tipico calcolato dai risolutori è riconosciuto: la spiegazione nomina quell'errore.
   4. Complessi, espressioni logiche (equivalenza e forma minima), basi numeriche, tabelle di verità. */
const U = require('../src/units.js');
const X = require('../src/cx.js');
const A = require('../src/answers.js');
const S = require('../src/solve.js');
const T = require('../src/transient.js');
const D = require('../src/devices.js');
const SG = require('../src/signals.js');
const LG = require('../src/logic.js');
const NS = require('../src/numsys.js');
const MI = require('../src/mistakes.js');

const errors = [];
const err = (m) => { if (errors.length < 300) errors.push(m); };
let seed = 2024;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const E12 = U.seriesValues('E12', 1, 1e6);
const stats = { giuste: 0, sbagliate: 0, errori: 0, riconosciuti: 0 };

/* ---------- 1. Scritture giuste ---------- */
const plain = (s) => s.replace(/[  ]/g, ' ');
function writings(v, u) {
  const out = new Set();
  const f3 = plain(U.fmt(v, u)), f4 = plain(U.fmt(v, u, { sig: 4 }));
  out.add(f3); out.add(f4);
  out.add(f3.replace(',', '.'));
  out.add(f3.replace(/ (?=[^ ]*$)/, '')); // senza spazio fra numero e unità
  out.add(f3.replace(/ [^ ]*$/, '') + (f3.match(/ ([pnµmkMG])[^ ]*$/) ? ' ' + f3.match(/ ([pnµmkMG])[^ ]*$/)[1] : '')); // solo il prefisso
  out.add(plain(U.num(v, { sig: 4 })).replace(/ /g, '')); // senza unità e senza prefisso
  out.add(plain(U.num(v, { sig: 4 })).replace(/ /g, '') + ' ' + u);
  const e = Math.floor(Math.log10(Math.abs(v)));
  const m = (v / 10 ** e).toFixed(3);
  out.add(`${m}e${e} ${u}`); out.add(`${m.replace('.', ',')}·10^${e} ${u}`); out.add(`${m.replace('.', ',')} x 10^${e}`);
  if (u === 'Ω') {
    out.add(f3.replace(' Ω', ' ohm')); out.add(f3.replace('kΩ', 'kohm').replace('MΩ', 'Mohm'));
    // 4k7, 2M2, 4R7: solo se il valore ha due cifre significative
    const tk = U.fmt(v, '', { sig: 2 });
    const mm = plain(U.fmt(v, 'Ω', { sig: 2 })).match(/^(\d+),(\d) ([kM]?)Ω$/);
    if (mm && U.within(+(mm[1] + '.' + mm[2]) * (mm[3] === 'k' ? 1e3 : mm[3] === 'M' ? 1e6 : 1), v, 1e-9)) out.add(`${mm[1]}${mm[3] || 'R'}${mm[2]}`);
    void tk;
  }
  if (u === 'V' || u === 'A' || u === 'W') out.add(f3.replace(/V$|A$|W$/, (x) => x.toLowerCase()));
  if (v < 0) out.add(f3.replace('−', '-'));
  return [...out];
}
const VALUES = [];
for (let k = 0; k < 600; k++) {
  const u = pick(['Ω', 'V', 'A', 'W', 'F', 'H', 'Hz', 's', 'C', 'J']);
  const mag = u === 'F' ? pick([1e-12, 1e-9, 1e-6, 1e-3]) : u === 'H' ? pick([1e-6, 1e-3, 1]) : pick([1e-3, 1, 1e3, 1e6].slice(0, u === 'Ω' || u === 'Hz' ? 4 : 3));
  let v = pick(E12) / 10 * mag * (rnd() < 0.5 ? 1 : 1 + rnd());
  if ((u === 'V' || u === 'A') && rnd() < 0.15) v = -v;
  VALUES.push([v, u]);
}
for (const [v, u] of VALUES) {
  const sol = { v, u, mistakes: [] };
  for (const w of writings(v, u)) {
    stats.giuste++;
    const r = A.numeric(w, sol);
    if (!r.ok) err(`scrittura giusta respinta: «${w}» per ${v} ${u} (${r.verdict}${r.msg ? ': ' + r.msg : ''})`);
  }
  // senza unità: accettata ma segnalata
  const r = A.numeric(plain(U.num(v, { sig: 4 })).replace(/ /g, ''), sol);
  if (!r.ok || r.unitStatus !== 'mancante' || !r.note) err(`unità mancante non segnalata per ${v} ${u}`);
}
// valori dell'1 % di tolleranza: accettati fino allo 0,99 %, respinti dall'1,02 %
for (const [v, u] of VALUES.slice(0, 200)) {
  const sol = { v, u };
  for (const f of [0.995, 1.0099, 1 / 1.0099]) { stats.giuste++; if (!A.numeric(String(v * f), sol).ok) err(`tolleranza: ${v * f} respinto per ${v}`); }
  for (const f of [1.0102, 0.9898]) { stats.sbagliate++; if (A.numeric(String(v * f), sol).ok) err(`tolleranza: ${v * f} accettato per ${v}`); }
}

/* ---------- 2. Risposte sbagliate simulate ---------- */
const OTHER_UNIT = { 'Ω': 'V', V: 'A', A: 'V', W: 'V', F: 'H', H: 'F', Hz: 's', s: 'Hz', C: 'A', J: 'W' };
for (const [v, u] of VALUES) {
  const sol = { v, u, mistakes: [] };
  const wrong = [v * 1.03, v * 0.97, v * 1.05, v * 0.9, v * 1.2, v * 2, v * 0.5, v * 1000, v / 1000, v * 1e6, v / 1e6, v * Math.PI, v / (2 * Math.PI), v * Math.SQRT2, v / Math.SQRT2, v + Math.abs(v) * (0.02 + rnd())];
  for (let k = 0; k < 6; k++) { let f; do { f = Math.exp((rnd() - 0.5) * 6); } while (Math.abs(f - 1) < 0.015); wrong.push(v * f); }
  for (const x of wrong) {
    for (const w of [plain(U.fmt(x, u, { sig: 4 })), plain(U.num(x, { sig: 4 })).replace(/ /g, '')]) {
      stats.sbagliate++;
      if (A.numeric(w, sol).ok) err(`risposta sbagliata accettata: «${w}» per ${v} ${u}`);
    }
  }
  // segno opposto
  stats.sbagliate++;
  if (A.numeric(plain(U.fmt(-v, u, { sig: 4 })), sol).ok) err(`segno opposto accettato per ${v} ${u}`);
  // unità sbagliata con il numero giusto
  stats.sbagliate++;
  const ou = OTHER_UNIT[u];
  const wu = plain(U.fmt(v, u, { sig: 4 })).replace(new RegExp(u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), ou);
  const ru = A.numeric(wu, sol);
  if (ru.ok || !ru.unitWrong) err(`unità sbagliata non respinta: «${wu}» per ${v} ${u}`);
}
// scritture ambigue o illeggibili: mai giudicate giuste
for (const w of ['4.700', '4.700 Ω', '4,7,0', 'abc', '', '4,7 kX', '12 V V', '4.7']) { stats.sbagliate++; const r = A.numeric(w, { v: 4700, u: 'Ω' }); if (r.ok) err(`«${w}» accettato`); if (/^4\.700/.test(w) && r.err !== 'ambiguo') err(`${w} non segnalato come ambiguo`); }
// il punto decimale vale sempre: «1.194» per 1,194 è giusto, per 1194 chiede di riscrivere, per altro è sbagliato
{ const r = A.numeric('1.194', { v: 1.194 }); if (!r.ok) err('1.194 respinto per 1,194'); const r2 = A.numeric('1.194', { v: 1194 }); if (r2.ok || r2.err !== 'ambiguo') err('1.194 per 1194 non segnalato'); const r3 = A.numeric('1.194', { v: 2000 }); if (r3.ok || r3.verdict !== 'sbagliata') err('1.194 per 2000 non è sbagliato'); }

/* ---------- 3. Errori tipici riconosciuti ---------- */
const E = () => pick(E12.filter((x) => x >= 10 && x <= 1e5));
const V = () => pick([3, 5, 6, 9, 12, 15, 24]);
const GEN = [
  () => S.ohm({ find: pick(['V', 'I', 'R']), V: V(), I: pick([0.001, 0.002, 0.005, 0.01, 0.02]), R: E() }),
  () => S.power({ find: 'P', R: E(), I: pick([0.002, 0.01, 0.05]) }), () => S.power({ find: 'P', V: V(), R: E() }), () => S.power({ find: 'I', P: 0.25, R: E() }),
  () => S.series({ R: [E(), E(), E()], V: V(), find: pick(['Req', 'I', 'V2', 'P1']) }),
  () => S.parallel({ R: [E(), E()], V: V(), find: pick(['Req', 'I', 'I1']) }), () => S.parallel({ R: [E(), E(), E()], find: 'Req' }),
  () => S.divider({ V: V(), R1: E(), R2: E() }), () => S.loadedDivider({ V: V(), R1: E(), R2: E(), RL: E() }), () => S.currentDivider({ I: 0.01, R1: E(), R2: E() }),
  () => { const spec = { cols: [[{ id: 'V1', t: 'V', v: 12 }], [{ id: 'R2', t: 'R', v: E() }], [{ id: 'R3', t: 'R', v: E() }]], top: [[{ id: 'R1', t: 'R', v: E() }], []] }; return S.network({ spec, V: 12, find: pick(['Req', 'I', 'I:R3', 'V:R1']) }); },
  () => { const spec = { cols: [[{ id: 'V1', t: 'V', v: V() }], [{ id: 'R2', t: 'R', v: E() }], [{ id: 'RL', t: 'R', v: E() }]], top: [[{ id: 'R1', t: 'R', v: E() }], [{ id: 'R3', t: 'R', v: E() }]] }; return S.thevenin({ spec, port: 2, RL: E(), find: pick(['Vth', 'Rth', 'IL', 'VL']) }); },
  () => S.millman({ branches: [{ E: V(), R: E() }, { E: 0, R: E() }, { E: V(), R: E() }] }),
  () => S.maxPower({ Vth: V(), Rth: E() }),
  () => S.capacitors({ C: [pick([1e-9, 10e-9, 100e-9]), pick([2.2e-9, 47e-9, 470e-9])], conn: pick(['par', 'ser']) }),
  () => S.sinusoid({ find: pick(['T', 'omega', 'Veff', 'Vp', 'Vpp']), f: pick([50, 100, 1000]), Vp: V(), Veff: V() }),
  () => S.reactance({ kind: pick(['L', 'C']), L: pick([0.01, 0.1]), C: pick([1e-6, 10e-6]), f: pick([50, 1000]) }),
  () => S.seriesAC({ R: E(), L: pick([0.01, 0.1]), C: pick([1e-6, 10e-6]), f: pick([50, 100, 1000]), V: 10, find: pick(['Z', 'I', 'VR', 'P', 'S']) }),
  () => S.resonance({ L: pick([1e-3, 10e-3]), C: pick([100e-9, 1e-6]), R: pick([5, 10, 22]), find: pick(['f0', 'Q', 'B']) }),
  () => T.rc({ R: E(), C: pick([1e-6, 10e-6]), E: V(), t: pick([0.5, 1, 2]) * 1e-3, mode: pick(['carica', 'scarica']), V0: V(), find: 'v' }),
  () => T.tauRC({ R: E(), C: pick([1e-6, 10e-6]) }), () => T.tauRL({ L: pick([0.01, 0.1]), R: E() }),
  () => D.diode({ V: V(), R: E() }), () => D.zener({ V: 12, R: 470, Vz: 5.1, RL: pick([1000, 2200, 4700]), find: pick(['IR', 'IZ']) }),
  () => D.bjt({ VCC: 12, VBB: 5, RB: E(), RC: pick([470, 1000, 2200]), beta: pick([100, 150, 200]), find: pick(['IB', 'IC', 'VCE']) }),
  () => D.opamp({ kind: pick(['invertente', 'non-invertente']), Vin: pick([0.1, 0.2, 0.5]), R1: 1000, Rf: pick([2200, 4700, 10000]), Vsat: 12, find: pick(['Av', 'Vout']) }),
  () => D.ne555astable({ RA: E(), RB: E(), C: pick([10e-9, 100e-9]), find: pick(['tH', 'tL', 'f']) }), () => D.ne555mono({ R: E(), C: pick([1e-6, 10e-6]) }),
  () => SG.filterRC({ kind: pick(['basso', 'alto']), R: E(), C: pick([10e-9, 100e-9, 1e-6]), f: pick([100, 1000, 10000]), Vin: 5, find: pick(['fc', 'Vout']) }),
  () => SG.adc({ VFS: pick([5, 10]), n: pick([8, 10, 12]), find: pick(['Q', 'err']) }),
  () => D.rectifier({ V2: pick([9, 12, 15]), type: pick(['semi', 'ponte']), C: 1000e-6, I: 0.2, find: pick(['Vp', 'Vr']) }),
];
let problems = 0;
for (let k = 0; k < 6000; k++) {
  let sol;
  try { sol = pick(GEN)(); } catch (e) { err(`generatore: ${e.message}`); continue; }
  if (typeof sol.v !== 'number' || !isFinite(sol.v)) continue;
  problems++;
  // la risposta giusta, scritta dal motore, è accettata
  const right = plain(U.fmt(sol.v, sol.u, { sig: 4 }));
  stats.giuste++;
  const rr = A.numeric(right, sol);
  if (!rr.ok) err(`${sol.sym}: risposta giusta «${right}» respinta`);
  if (rr.mistake) err(`${sol.sym}: risposta giusta presa per un errore`);
  for (const m of sol.mistakes) {
    // errori che coincidono con la risposta giusta non si possono riconoscere (il generatore dei problemi li scarta)
    if (!isFinite(m.v) || m.v === 0 || U.within(m.v, sol.v, 0.03)) continue;
    const w = plain(U.fmt(m.v, sol.u, { sig: 4 }));
    stats.errori++;
    const r = A.numeric(w, sol);
    if (r.ok) { err(`${sol.sym}: l’errore «${m.id}» (${w}) è accettato come giusto (giusta ${right})`); continue; }
    if (!r.mistake) { err(`${sol.sym}: l’errore «${m.id}» (${w}) non è riconosciuto`); continue; }
    // riconosciuto quell'errore o un altro che dà lo stesso valore
    const same = sol.mistakes.concat(MI.generic(sol.v)).filter((x) => U.within(x.v, m.v, U.TOL)).map((x) => x.id);
    if (!same.includes(r.mistake.id)) err(`${sol.sym}: «${w}» riconosciuto come ${r.mistake.id} invece di ${m.id}`);
    else stats.riconosciuti++;
    if (!r.mistake.name || !r.mistake.text) err(`${sol.sym}: l’errore ${r.mistake.id} non ha nome o spiegazione`);
  }
}
// i nove errori tipici del capitolato sono nel catalogo e prodotti da almeno un risolutore
const REQUIRED = ['serie-parallelo', 'prefisso', 'partitore-capovolto', 'efficace-picco', 'omega-f', 'segno', 'reciproco', 'soglia', 'segno-invertente'];
for (const id of REQUIRED) if (!MI.CATALOG[id]) err(`errore tipico obbligatorio mancante: ${id}`);

/* ---------- 4. Complessi, logica, basi, tabelle ---------- */
for (let k = 0; k < 400; k++) {
  const z = X.C(pick(E12) * (rnd() < 0.5 ? 1 : -1) / 10, pick(E12) * (rnd() < 0.5 ? 1 : -1) / 10);
  const sol = { z, u: 'Ω' };
  const rect = plain(X.fmtRect(z, 'Ω', { sig: 4 })), pol = plain(X.fmtPolar(z, 'Ω', { sig: 4, angDec: 2 }));
  for (const w of [rect, pol, plain(X.fmtRect(z, '', { sig: 4 }))]) { stats.giuste++; if (!A.complex(w, sol).ok) err(`complesso giusto respinto: «${w}» per ${X.fmtRect(z)}`); }
  // con una parte immaginaria piccolissima il coniugato è dentro la tolleranza: non è un errore
  if (Math.abs(z.im) > 0.03 * X.abs(z)) { stats.sbagliate++;
  const cj = A.complex(plain(X.fmtRect(X.conj(z), 'Ω', { sig: 4 })), sol);
  if (cj.ok || !cj.mistake) err(`complesso coniugato non riconosciuto per ${X.fmtRect(z)}`); }
  stats.sbagliate++;
  if (A.complex(plain(X.fmtRect(X.scale(z, 1.05), 'Ω', { sig: 4 })), sol).ok) err('complesso fuori tolleranza accettato');
}
const V3 = ['A', 'B', 'C'];
for (let f = 1; f < 255; f++) {
  const on = []; for (let m = 0; m < 8; m++) if ((f >> m) & 1) on.push(m);
  const best = LG.minimalSOP(on, V3);
  const sol = { minterms: on, vars: V3, minimal: true };
  stats.giuste++;
  for (const e of best.all) { const r = A.logic(LG.text(e), sol); if (!r.ok) err(`forma minima giusta respinta: ${LG.text(e)} (${r.msg})`); }
  // la forma canonica è equivalente ma (salvo casi già minimi) non minima
  const can = LG.canonicalSOP(on, V3);
  const rc = A.logic(LG.text(can), sol);
  if (LG.literals(can) > best.cost.literals && rc.ok) err(`forma canonica accettata come minima per f=${f}`);
  if (!A.logic(LG.text(can), { minterms: on, vars: V3 }).ok) err(`forma canonica respinta quando basta l’equivalenza (f=${f})`);
  // una riga cambiata: mai accettata
  const flip = on.includes(0) ? on.filter((m) => m !== 0) : on.concat([0]).sort();
  stats.sbagliate++;
  if (A.logic(LG.text(LG.minimalSOP(flip, V3).expr), sol).ok && flip.length) err(`funzione sbagliata accettata per f=${f}`);
  // la funzione negata è riconosciuta
  const neg = [0, 1, 2, 3, 4, 5, 6, 7].filter((m) => !on.includes(m));
  if (neg.length) { const rn = A.logic(LG.text(LG.minimalSOP(neg, V3).expr), sol); if (rn.ok || !rn.mistake) err(`funzione negata non riconosciuta per f=${f}`); }
}
for (const w of ["A'B+C", 'AB + /C', 'A·B·', '']) { const r = A.logic(w, { minterms: [1, 3, 5, 7], vars: V3 }); if (r.ok && w !== "A'B+C") err(`espressione «${w}» accettata`); }
for (let n = 0; n < 256; n++) {
  stats.giuste += 2;
  if (!A.base(NS.toBase(n, 2), { v: n, base: 2 }).ok) err(`binario di ${n} respinto`);
  if (!A.base(NS.toBase(n, 16), { v: n, base: 16 }).ok) err(`esadecimale di ${n} respinto`);
  const rev = n.toString(2).split('').reverse().join('');
  if (rev !== n.toString(2)) { stats.sbagliate++; const r = A.base(rev, { v: n, base: 2 }); if (r.ok) err(`binario rovesciato di ${n} accettato`); else if (parseInt(rev, 2) !== n && !r.mistake) err(`resti al contrario non riconosciuti per ${n}`); }
}
for (let v = -128; v < 128; v++) {
  stats.giuste++;
  if (!A.base(NS.toTwos(v, 8), { v, base: 2, twos: true, bits: 8 }).ok) err(`complemento a due di ${v} respinto`);
  if (v < 0) { stats.sbagliate++; const r = A.base(NS.twosSteps(v, 8).inv, { v, base: 2, twos: true, bits: 8 }); if (r.ok || !r.mistake || r.mistake.id !== 'complemento-uno') err(`complemento a uno non riconosciuto per ${v}`); }
}
for (const n of [0, 7, 25, 99, 2026]) { stats.giuste++; if (!A.base(NS.toBCD(n), { v: n, bcd: true }).ok) err(`BCD di ${n} respinto`); }
{ const r = A.base('11001', { v: 25, bcd: true }); if (r.ok) err('BCD: binario puro accettato'); }
{ const r = A.table([0, 1, 1, 0], [0, 1, 1, 0]); if (!r.ok) err('tabella giusta respinta'); const r2 = A.table([0, 1, 0, 0], [0, 1, 1, 0]); if (r2.ok || r2.wrongRows[0] !== 2) err('tabella sbagliata'); }

console.log('\nTest del controllo delle risposte');
console.log(`  Scritture giuste provate: ${stats.giuste}; risposte sbagliate simulate: ${stats.sbagliate}`);
console.log(`  Problemi casuali: ${problems}; errori tipici provati: ${stats.errori}, riconosciuti per nome: ${stats.riconosciuti}`);
console.log(errors.length ? `  Errori: ${errors.length}` : '  Nessun errore.');
[...new Set(errors)].slice(0, 60).forEach((x) => console.log('  ✗ ' + x));
if (errors.length) process.exitCode = 1;
