/* Test del generatore dei problemi (tappa 5): 10 000 problemi casuali da tutti i generatori, senza errori e fisicamente sensati:
   - nessuna eccezione, nessun valore mancante (NaN, infinito, divisione per zero);
   - nelle reti in continua ogni resistore dissipa al massimo 1/4 W (salvo i problemi sulla potenza nominale);
   - il transistor lavora nella zona dichiarata (verificato risolvendo la sua netlist con l'analisi nodale);
   - i risultati stanno in un intervallo ragionevole per la loro unità;
   - gli errori tipici sono distinti dalla risposta giusta (almeno il 3 %), così si possono riconoscere. */
const PB = require('../src/problems.js');
require('../src/problems2.js');
const CI = require('../src/circuit.js');
const M = require('../src/mna.js');
const TP = require('../src/templates.js');
const U = require('../src/units.js');
const MA = require('../src/math.js');
const MI = require('../src/mistakes.js');

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const r = mulberry32(2026);
const N = +process.argv[2] || 10000;
const errors = [];
const err = (m) => { if (errors.length < 300) errors.push(m); };
// intervalli ragionevoli per unità (valore assoluto, quando non è zero)
const RANGE = { 'Ω': [0.01, 1e8], V: [1e-6, 700], A: [1e-9, 20], W: [1e-6, 5000], F: [1e-13, 1], H: [1e-7, 10], Hz: [0.01, 1e9], s: [1e-10, 1e4], C: [1e-12, 1e4], J: [1e-12, 1e7], Wh: [0.01, 1e5], VA: [1e-3, 1e5], var: [1e-3, 1e5], 'rad/s': [0.1, 1e10], '°': [0, 360], dB: [0, 200], '%': [0, 100], '°C': [0, 300], rad: [0, 7], 'V/°C': [1e-5, 1] };
const ALL = ['p', 'n', 'µ', 'm', '', 'k', 'M'];
// tutti i concetti: i generatori trasversali (simboli, grandezze) pescano fra quelli noti
const KNOWN = new Set(Object.keys(require('../src/concepts.js').C));
const gens = PB.list().filter((g) => g.id !== 'domande');
const stats = { problemi: 0, reti: 0, transistor: 0, nulli: 0 };
const perGen = {};
for (let k = 0; k < N; k++) {
  const g = gens[k % gens.length];
  const level = 1 + Math.floor(r() * 3);
  const sc = { prefixes: ALL, num: 'free', level, known: KNOWN, bank: [], usedBank: new Set() };
  let p;
  try { p = PB.make(g.id, sc, r); } catch (e) { err(`${g.id}: eccezione ${e.message}`); continue; }
  if (!p) { stats.nulli++; perGen[g.id] = (perGen[g.id] || 0) + 1; continue; }
  stats.problemi++;
  const where = `${g.id} (${k})`;
  const sol = p.sol;
  if (/undefined|NaN|Infinity/.test(p.text)) err(`${where}: testo con valori mancanti: ${p.text.slice(0, 100)}`);
  if (typeof sol.v === 'number') {
    if (!isFinite(sol.v)) err(`${where}: risultato non finito`);
    const rg = RANGE[sol.u];
    const a = Math.abs(sol.v);
    if (rg && a !== 0 && (a < rg[0] || a > rg[1])) err(`${where}: risultato fuori intervallo ${U.fmt(sol.v, sol.u)}`);
    // gli errori tipici distinti dalla risposta giusta
    for (const m of sol.mistakes || []) {
      if (!MI.CATALOG[m.id]) err(`${where}: errore tipico senza scheda ${m.id}`);
      if (isFinite(m.v) && sol.v !== 0 && U.within(m.v, sol.v, 0.03) && !(p.kind === 'calc' && sol.tol === 0)) err(`${where}: l’errore ${m.id} dà quasi la risposta giusta (${m.v} contro ${sol.v})`);
    }
  }
  if (sol.z && (!isFinite(sol.z.re) || !isFinite(sol.z.im))) err(`${where}: complesso non finito`);
  for (const st of sol.steps || []) {
    for (const src of [st.f, st.s]) { try { MA.toText(src); } catch (e) { err(`${where}: passaggio non leggibile «${src}»`); } }
    if (typeof st.v === 'number' && !isFinite(st.v)) err(`${where}: passaggio con valore non finito`);
  }
  // reti in continua: potenza nei resistori
  if (p.schema && p.schema.ladder && !/joule\.nominale/.test(g.id)) {
    const spec = p.schema.ladder;
    const els = CI.toNetlist(spec).elements;
    const dc = els.every((e) => ['R', 'V', 'I', 'W', 'SW', 'OPEN', 'D', 'LED', 'DZ', 'AM', 'VM'].includes(e.t)) && els.every((e) => e.t !== 'V' || !e.ac) && els.every((e) => !(e.t === 'R' && e.v == null));
    if (dc && els.some((e) => e.t === 'V' && e.v != null)) {
      stats.reti++;
      try {
        const res = M.solve({ elements: els });
        for (const e of els.filter((x) => x.t === 'R')) { const P = Math.abs(res.P(e.id)); if (P > 0.25 + 1e-9) err(`${where}: ${e.id} dissipa ${U.fmt(P, 'W')} (più di 1/4 W)`); }
      } catch (e) { err(`${where}: la rete non si risolve: ${e.message}`); }
    }
  }
  // transistor: zona dichiarata contro la soluzione della netlist
  if (p.tpl && p.tpl.name === 'bjt' && p.zone) {
    stats.transistor++;
    const d = TP.bjt(p.tpl.kind, Object.assign({ VCC: 12, beta: 100 }, p.tpl.p));
    const res = M.solve(d.net);
    const st = res.states.Q1;
    const want = p.zone === 'attiva' ? 'att' : p.zone === 'saturazione' ? 'sat' : 'off';
    if (st !== want) err(`${where}: zona dichiarata ${p.zone}, il risolutore dice ${st}`);
  }
}
// ogni generatore produce problemi (non resta vuoto)
const empty = gens.filter((g) => (perGen[g.id] || 0) >= Math.ceil(N / gens.length) * 0.5);
for (const g of empty) err(`il generatore ${g.id} fallisce in più di metà dei casi`);

console.log('\nTest del generatore dei problemi');
console.log(`  Generatori: ${gens.length}; problemi: ${stats.problemi} su ${N} (rifiutati dal perimetro: ${stats.nulli})`);
console.log(`  Reti in continua controllate (1/4 W): ${stats.reti}; transistor nella zona dichiarata: ${stats.transistor}`);
console.log(errors.length ? `  Errori: ${errors.length}` : '  Nessun errore.');
[...new Set(errors)].slice(0, 60).forEach((e) => console.log('  ✗ ' + e));
if (errors.length) process.exitCode = 1;
