/* Test del percorso e dei perimetri (tappa 5). Per ogni lezione, costruita più volte:
   - da 8 a 12 esercizi; ogni scheda ha la sua domanda di controllo;
   - ogni esercizio usa solo concetti già introdotti (al massimo uno nuovo, segnalato, e mai nelle prove);
   - i numeri rispettano il dosaggio della lezione (interi, una cifra decimale) e i prefissi ammessi
     (nessuno prima della lezione sui prefissi, solo k e m fino all'unità 8);
   - le scelte hanno almeno due opzioni distinte e una sola giusta; gli esercizi da ordinare hanno almeno tre passaggi;
   - ogni generatore citato esiste; ogni concetto introdotto è nel dizionario; ogni unità ha da 3 a 5 lezioni e la prova. */
const L = require('../src/lessons.js');
const PB = require('../src/problems.js');
const CO = require('../src/concepts.js');
const U = require('../src/units.js');
const MA = require('../src/math.js');

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
L.init({ rand: mulberry32(7) });
const REPS = +process.argv[2] || 5;
const errors = [];
const err = (m) => { if (errors.length < 400) errors.push(m); };
let lessons = 0, items = 0, cards = 0, quizzes = 0, minEx = 99, maxEx = 0, newFlagged = 0;
const types = {};

// struttura
const ids = new Set();
for (const u of L.UNITS) {
  const normal = u.lessons.filter((l) => !l.test), tests = u.lessons.filter((l) => l.test);
  if (normal.length < 3 || normal.length > 5) err(`${u.id}: ${normal.length} lezioni (servono da 3 a 5)`);
  if (tests.length !== 1 || !u.lessons[u.lessons.length - 1].test) err(`${u.id}: la prova finale manca o non è l’ultima`);
  for (const l of u.lessons) {
    if (ids.has(l.id)) err(`lezione ripetuta ${l.id}`);
    ids.add(l.id);
    for (const c of l.intro || []) if (!CO.has(c)) err(`${l.id}: concetto senza voce nel dizionario ${c}`);
    for (const s of l.mix || []) { const g = s.includes(':') ? s.split(':')[1] : s; if (!PB.REG.has(g)) err(`${l.id}: generatore inesistente ${g}`); }
    for (const c of l.teach || []) {
      if (c.ex && !PB.REG.has(c.ex)) err(`${l.id}: esempio con generatore inesistente ${c.ex}`);
      if (c.q && !Array.isArray(c.q) && !PB.REG.has(c.q.gen)) err(`${l.id}: domanda di controllo con generatore inesistente ${c.q.gen}`);
      if (!c.q) err(`${l.id}: scheda senza domanda di controllo (${JSON.stringify(c).slice(0, 60)})`);
      if (Array.isArray(c.q) && (c.q.length < 3 || new Set(c.q.slice(1)).size !== c.q.length - 1)) err(`${l.id}: domanda di controllo con meno di due risposte o risposte ripetute`);
      // le formule delle schede si leggono
      const texts = [c.p || '', c.say || ''].concat(c.f ? [c.f] : []).concat(c.inv || []);
      for (const t of texts) for (const m of String(t).match(/\$([^$]+)\$/g) || []) { try { MA.toText(m.slice(1, -1)); } catch (e) { err(`${l.id}: formula non leggibile ${m}: ${e.message}`); } }
      if (c.f) { try { MA.toText(c.f); } catch (e) { err(`${l.id}: formula ${c.f}: ${e.message}`); } }
    }
    for (const q of l.bank || []) if (q.length < 3 || new Set(q.slice(1)).size !== q.length - 1) err(`${l.id}: domanda della banca malformata «${q[0]}»`);
  }
}
// i concetti di ogni generatore sono nel dizionario
for (const g of PB.list()) for (const c of g.uses) if (!CO.has(c)) err(`generatore ${g.id}: concetto ${c} senza voce`);

// quantità scritte nel testo: «`4,7 kΩ`»
const QTY = /`([−-]?[\d  ]+(?:,\d+)?)[  ]([pnµmkMG]?)(Ω|V|A|W|F|H|Hz|s|C|J|Wh|VA|var)`/g;
function checkNumbers(it, sc, where) {
  const p = it.problem;
  const txt = p.text + ' ' + (it.choices || []).map((c) => c.label || '').join(' ');
  for (const m of txt.matchAll(QTY)) {
    const [, num, pre, unit] = m;
    if (!sc.prefixes.includes(pre)) err(`${where}: prefisso «${pre}» non ammesso in «${m[0]}» (ammessi: ${sc.prefixes.join(' ') || 'nessuno'})`);
    const dec = (num.split(',')[1] || '').length;
    if (sc.num === 'int' && dec > 0) err(`${where}: numero non intero «${m[0]}»`);
    if ((sc.num === 'dec1' || sc.num === 'dati1') && dec > 1) err(`${where}: più di una cifra decimale «${m[0]}»`);
  }
  // la risposta numerica stessa, nelle lezioni con i numeri dosati
  // con «dati1» solo i dati sono dosati: il risultato (una radice, una percentuale) può avere più cifre
  if ((it.type === 'calc') && typeof p.sol.v === 'number' && (sc.num === 'int' || sc.num === 'dec1') && p.sol.u) {
    if (!PB.exact(p.sol.v, p.sol.u, sc)) err(`${where}: risultato «${U.fmt(p.sol.v, p.sol.u, { prefixes: sc.prefixes, sig: 6 })}» fuori dal dosaggio ${sc.num}`);
  }
}
for (const f of L.FLAT) {
  const l = f.lesson;
  lessons++;
  const sc = L.scopeOf(l.id);
  for (let rep = 0; rep < REPS; rep++) {
    let its;
    try { its = L.buildLesson(l.id, { teach: rep === 0 }); } catch (e) { err(`${l.id}: eccezione ${e.stack.split('\n').slice(0, 3).join(' ')}`); continue; }
    const ex = its.filter((x) => x.type !== 'teach' && !x.quiz);
    minEx = Math.min(minEx, ex.length); maxEx = Math.max(maxEx, ex.length);
    if (ex.length < 8 || ex.length > 12) err(`${l.id}: ${ex.length} esercizi (servono da 8 a 12)`);
    // dopo ogni scheda, la domanda di controllo
    its.forEach((x, k) => { if (x.type === 'teach') { cards++; if (!(its[k + 1] && its[k + 1].quiz)) err(`${l.id}: scheda senza domanda di controllo dopo (${JSON.stringify(x.card).slice(0, 50)})`); if (x.card.ex && !x.example) err(`${l.id}: esempio non costruito (${x.card.ex})`); } });
    for (const it of its) {
      if (it.type === 'teach') continue;
      items++;
      if (it.quiz) quizzes++;
      types[it.type] = (types[it.type] || 0) + 1;
      const where = `${l.id} ${it.gen || ''}`;
      const p = it.problem;
      if (!p || !p.text || /undefined|NaN/.test(p.text)) { err(`${where}: testo mancante o con valori mancanti`); continue; }
      // perimetro dei concetti
      const fresh = (p.uses || []).filter((c) => !sc.known.has(c));
      if (fresh.length > 1) err(`${where}: ${fresh.length} concetti nuovi (${fresh.join(', ')})`);
      if (fresh.length && l.test) err(`${where}: concetto nuovo in una prova (${fresh.join(', ')})`);
      if (fresh.length) { newFlagged++; if (!p.newConcepts || !p.newConcepts.includes(fresh[0])) err(`${where}: concetto nuovo non segnalato`); }
      checkNumbers(it, sc, where);
      if (it.type === 'scelta') {
        const labels = it.choices.map((c) => c.label || c.html || (c.bands || []).join() || c.math);
        if (labels.length < 2) err(`${where}: meno di due opzioni`);
        if (new Set(labels).size !== labels.length) err(`${where}: opzioni ripetute ${labels.join(' | ')}`);
        if (it.choices.filter((c) => c.right).length !== 1) err(`${where}: ${it.choices.filter((c) => c.right).length} opzioni giuste`);
      }
      if (it.type === 'ordina' && it.steps.length < 3) err(`${where}: meno di tre passaggi da ordinare`);
      // passaggi della traccia leggibili
      for (const s of p.sol.steps || []) for (const src of [s.f, s.s]) { try { MA.toText(src); } catch (e) { err(`${where}: passaggio non leggibile «${src}»: ${e.message}`); } }
      for (const m of p.text.match(/\$([^$]+)\$/g) || []) { try { MA.toText(m.slice(1, -1)); } catch (e) { err(`${where}: formula del testo non leggibile ${m}`); } }
    }
  }
}
console.log('\nTest del percorso e dei perimetri');
console.log(`  Unità: ${L.UNITS.length}; lezioni: ${lessons} (${L.FLAT.filter((f) => f.lesson.test).length} prove); schede: ${cards}`);
console.log(`  Costruzioni: ${REPS} per lezione; esercizi per lezione: da ${minEx} a ${maxEx}; esercizi costruiti: ${items} (domande di controllo: ${quizzes}; con un concetto nuovo segnalato: ${newFlagged})`);
console.log('  Tipi: ' + Object.entries(types).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
console.log(errors.length ? `  Errori: ${errors.length}` : '  Nessun errore.');
[...new Set(errors)].slice(0, 80).forEach((e) => console.log('  ✗ ' + e));
if (errors.length) process.exitCode = 1;
