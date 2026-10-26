/* Test degli schemi, dei grafici e degli strumenti (tappa 3):
   - ogni SVG è ben formato, ha role="img" e una descrizione testuale non vuota, senza valori mancanti (NaN, undefined);
   - nella descrizione compare ogni componente della rete;
   - le etichette non si sovrappongono fra loro;
   - le reti a scala delle lezioni (fino a 4 colonne) stanno in 340 px di larghezza (si leggono a 360 px);
   - i modelli con l'operazionale e con i transistor danno, con il risolutore, gli stessi valori delle formule. */
const SC = require('../src/schematic.js');
const TP = require('../src/templates.js');
const GT = require('../src/gates.js');
const PL = require('../src/plots.js');
const LG = require('../src/logic.js');
const M = require('../src/mna.js');
const D = require('../src/devices.js');
const U = require('../src/units.js');

const errors = [];
const err = (m) => { if (errors.length < 200) errors.push(m); };
let checked = 0;
// ben formato: tag aperti e chiusi in ordine
function wellFormed(svg, where) {
  checked++;
  if (/NaN|undefined|Infinity/.test(svg)) err(`${where}: valori mancanti nello schema`);
  if (!/^<svg[^>]*role="img"[^>]*aria-label="[^"]{8,}"/.test(svg) && !/^<svg[^>]*aria-hidden="true"/.test(svg)) err(`${where}: manca la descrizione per i lettori di schermo`);
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)) {
    const [, close, tag, , self] = m;
    if (self) continue;
    if (close) { const top = stack.pop(); if (top !== tag) { err(`${where}: tag ${tag} chiuso male (aperto ${top})`); return; } }
    else stack.push(tag);
  }
  if (stack.length) err(`${where}: tag non chiusi ${stack.join(',')}`);
}
// etichette: rettangoli stimati dai testi (12–13 px, circa 6,4 px per carattere), sovrapposizioni oltre 3 px
function overlaps(svg, where) {
  const boxes = [];
  for (const m of svg.matchAll(/<text class="([^"]*)" x="([-\d.]+)" y="([-\d.]+)" text-anchor="(\w+)"[^>]*>(.*?)<\/text>/g)) {
    const [, cls, xs, ys, anchor, inner] = m;
    if (/sch-s|sch-m|sch-sub|cc-|km-|pl-|scope/.test(cls)) continue; // segni dentro i simboli, grafici con la loro griglia
    const txt = inner.replace(/<[^>]+>/g, '');
    if (!txt.trim()) continue;
    const w = txt.length * 6.4, x = +xs, y = +ys;
    const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    boxes.push({ x0, x1: x0 + w, y0: y - 11, y1: y + 3, txt });
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    if (ox > 3 && oy > 3) err(`${where}: etichette sovrapposte «${a.txt}» e «${b.txt}»`);
  }
}
const r = (id, v, x) => Object.assign({ id, t: 'R', v }, x || {});

/* ---------- Reti a scala delle lezioni ---------- */
const LADDERS = [
  { cols: [[{ id: 'V1', t: 'V', v: 12 }], [r('R1', 470)]], top: [[]] },
  { cols: [[{ id: 'V1', t: 'V', v: 12 }], [r('R3', 330)]], top: [[r('R1', 100), r('R2', 220)]] },
  { cols: [[{ id: 'V1', t: 'V', v: 9 }], [r('R1', 1000)], [r('R2', 2200)], [r('R3', 4700)]], top: [[], [], []], names: { T1: 'A' } },
  { cols: [[{ id: 'V1', t: 'V', v: 12 }], [r('R2', 200)], [r('R3', 300)]], top: [[r('R1', 100)], []], names: { T1: 'A' } },
  { cols: [[{ id: 'V1', t: 'V', v: 12 }], [r('R2', 1000)], [r('RL', 4700)]], top: [[r('R1', 1000)], []], names: { T1: 'A' } },
  { cols: [[{ id: 'E1', t: 'V', v: 12 }, r('R1', 100)], [r('R3', 200)], [{ id: 'E2', t: 'V', v: 6 }, r('R2', 300)]], top: [[], []], names: { T1: 'A' } },
  { cols: [[{ id: 'V1', t: 'V', v: 12 }], [r('R2', 2000)], [{ id: 'AB', t: 'OPEN' }]], top: [[r('R1', 1000)], [r('R3', 470)]] },
  { cols: [[{ id: 'V1', t: 'V', v: 24 }], [r('R4', 1000)]], top: [[r('R1', 470), { par: [[r('R2', 1000)], [r('R3', 2200)]] }]] },
  { cols: [[{ id: 'V1', t: 'V', v: 12 }], [r('R2', 1000)], [r('R4', 1000)]], top: [[r('R1', 1000)], [r('R3', 1000)]], names: { T1: 'A', T2: 'B' } },
  { cols: [[{ id: 'V1', t: 'V', v: 5 }], [{ id: 'D1', t: 'LED' }]], top: [[r('R1', 220)]] },
  { cols: [[{ id: 'V1', t: 'V', v: 12 }], [{ id: 'DZ1', t: 'DZ', vz: 5.1, rev: true }], [r('RL', 1000)]], top: [[r('R1', 470)], []] },
  { cols: [[{ id: 'E', t: 'V', v: 10, style: 'pila' }], [{ id: 'C1', t: 'C', v: 1e-6 }]], top: [[{ id: 'SW1', t: 'SW', closed: true }, r('R1', 10000)]] },
  { cols: [[{ id: 'V1', t: 'V', v: 230, ac: true }], [{ id: 'C1', t: 'C', v: 10e-6 }]], top: [[r('R1', 100), { id: 'L1', t: 'L', v: 0.1 }]] },
  { cols: [[{ id: 'I1', t: 'I', v: 0.01 }], [r('R1', 1000)], [r('R2', 2000)]], top: [[], []] },
  { cols: [[{ id: 'V1', t: 'V', v: 9 }], [r('R2', 1000)], [{ id: 'VM1', t: 'VM' }]], top: [[{ id: 'AM1', t: 'AM' }, r('R1', 470)], []] },
];
const ids = (spec) => spec.cols.concat(spec.top || [], spec.bot || []).flatMap((c) => (c || []).flatMap((it) => (it.par ? it.par.flat() : [it])));
LADDERS.forEach((spec, k) => {
  for (const o of [{}, { currents: [{ el: ids(spec).find((x) => x.t === 'R').id, label: 'I' }], voltages: [{ el: ids(spec).filter((x) => x.t === 'R').pop().id, label: 'V_x' }], highlight: [ids(spec)[1].id] }]) {
    const d = SC.ladder(spec, o);
    const where = `scala ${k}${o.currents ? ' (con le frecce)' : ''}`;
    wellFormed(d.svg, where);
    overlaps(d.svg, where);
    if (d.w > (o.voltages ? 352 : 340)) err(`${where}: larga ${d.w} px`);
    for (const it of ids(spec)) if (it.t !== 'W' && it.t !== 'OPEN' && !d.desc.includes(SC.labelParts(it.id).join(' ').trim().replace(/ $/, '')) && !d.desc.includes(it.id)) err(`${where}: la descrizione non nomina ${it.id}`);
  }
});
// reti casuali: nessun errore di disegno, nessuna sovrapposizione
let seed = 99;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const E12 = U.seriesValues('E12', 10, 1e6);
for (let k = 0; k < 300; k++) {
  let n = 0;
  const el = () => { n++; const t = pick(['R', 'R', 'R', 'C', 'L']); return { id: t + n, t, v: t === 'R' ? pick(E12) : t === 'C' ? pick([1e-9, 100e-9, 10e-6]) : pick([1e-3, 0.1]) }; };
  const cols = [[{ id: 'V1', t: 'V', v: pick([5, 9, 12]) }]], top = [];
  const nc = 2 + Math.floor(rnd() * 3);
  for (let i = 1; i < nc; i++) { cols.push(rnd() < 0.8 ? [el()] : [el(), el()]); top.push(rnd() < 0.6 ? [el()] : rnd() < 0.5 ? [] : [{ par: [[el()], [el()]] }]); }
  const d = SC.ladder({ cols, top });
  wellFormed(d.svg, `scala casuale ${k}`);
  overlaps(d.svg, `scala casuale ${k}`);
}
// simboli singoli
for (const t of Object.keys(SC.SYM)) wellFormed(SC.symbol(t, { label: 'simbolo del componente ' + t }), `simbolo ${t}`);

/* ---------- Modelli ---------- */
const OA = [['invertente', { Vin: 0.5, R1: 1000, Rf: 10000, Vsat: 12 }, () => D.opamp({ kind: 'invertente', Vin: 0.5, R1: 1000, Rf: 10000, Vsat: 12, find: 'Vout' }).v],
  ['non-invertente', { Vin: 1, R1: 1000, Rf: 4700, Vsat: 12 }, () => D.opamp({ kind: 'non-invertente', Vin: 1, R1: 1000, Rf: 4700, Vsat: 12, find: 'Vout' }).v],
  ['inseguitore', { Vin: 3.3, Vsat: 12 }, () => 3.3],
  ['sommatore', { V: [1, 0.5], R: [10000, 10000], Rf: 20000, Vsat: 12 }, () => D.opamp({ kind: 'sommatore', V: [1, 0.5], R: [10000, 10000], Rf: 20000, Vsat: 12, find: 'Vout' }).v],
  ['differenziale', { V1: 1, V2: 1.5, R1: 10000, Rf: 20000, Vsat: 12 }, () => D.opamp({ kind: 'differenziale', V1: 1, V2: 1.5, R1: 10000, Rf: 20000, Vsat: 12, find: 'Vout' }).v],
  ['comparatore', { Vin: 2, Vref: 1, Vsat: 12 }, () => 12],
  ['invertente', { Vin: 2, R1: 1000, Rf: 10000, Vsat: 12 }, () => -12],
  ['schmitt', { Vin: 5, R1: 10000, R2: 47000, Vsat: 12 }, () => -12],
  ['passa-basso', { Vin: 1, R1: 1000, Rf: 10000, C: 10e-9, Vsat: 12 }, () => -10],
  ['passa-alto', { Vin: 1, R1: 1000, Rf: 10000, C: 1e-6, Vsat: 12 }, null],
  ['astabile', { R: 10000, C: 100e-9, R1: 10000, R2: 10000 }, null]];
for (const [kind, p, want] of OA) {
  const d = TP.opamp(kind, p);
  wellFormed(d.svg, `operazionale ${kind}`); overlaps(d.svg, `operazionale ${kind}`);
  if (d.w > 340) err(`operazionale ${kind}: largo ${d.w} px`);
  if (want && d.net) {
    // in continua (C aperto) il passa-basso si comporta da invertente con guadagno −R_f/R_1
    const res = M.solve(d.net, kind === 'schmitt' ? { prefer: { OA: 'sat-' } } : {});
    checked++;
    if (Math.abs(res.V('o') - want()) > 1e-6) err(`operazionale ${kind}: il risolutore dà ${res.V('o')} invece di ${want()}`);
  }
}
for (const kind of ['base', 'led', 'rele', 'partitore']) {
  const p = { VCC: 12, Vin: 5, RB: 10000, RC: 1000, R1: 47000, R2: 10000, RE: 1000, beta: 100 };
  const d = TP.bjt(kind, p);
  wellFormed(d.svg, `BJT ${kind}`); overlaps(d.svg, `BJT ${kind}`);
  const res = M.solve(d.net);
  checked++;
  if (kind === 'base') { const want = D.bjt({ VCC: 12, VBB: 5, RB: 10000, RC: 1000, beta: 100, find: 'IC' }).v; if (Math.abs(res.I('Q1.ic') - want) > 1e-9) err(`BJT base: I_C ${res.I('Q1.ic')} ≠ ${want}`); }
  if (kind === 'partitore') { const ex = D.bjtDivider({ VCC: 12, R1: 47000, R2: 10000, RC: 1000, RE: 1000, beta: 100, find: 'IC' }).accept[0]; if (Math.abs(res.I('Q1.ic') - ex) > 1e-9) err(`BJT partitore: I_C ${res.I('Q1.ic')} ≠ calcolo esatto ${ex}`); }
}
{ const d = TP.mosfet({ RD: 100, VGS: 5, VDD: 12 }); wellFormed(d.svg, 'MOSFET'); overlaps(d.svg, 'MOSFET'); const res = M.solve(d.net); checked++; if (Math.abs(res.I('RD') - D.mosfet({ VDD: 12, RD: 100, VGS: 5, Vth: 2, Ron: 0.1, find: 'ID' }).v) > 1e-9) err('MOSFET: corrente di drain'); }
for (const kind of ['astabile', 'monostabile']) { const d = TP.ne555(kind, { RA: 1000, RB: 10000, C: 100e-9, R: 100000 }); wellFormed(d.svg, `NE555 ${kind}`); overlaps(d.svg, `NE555 ${kind}`); if (d.w > 340) err(`NE555 ${kind}: largo ${d.w}`); }
for (const kind of ['semionda', 'ponte']) for (const C of [0, 1000e-6]) { const d = TP.rectifier(kind, { C, RL: 100, V2: 12 }); wellFormed(d.svg, `raddrizzatore ${kind}`); overlaps(d.svg, `raddrizzatore ${kind}`); if (d.w > 340) err(`raddrizzatore ${kind}: largo ${d.w}`); }

/* ---------- Schemi logici, grafici, strumenti ---------- */
const V3 = ['A', 'B', 'C'];
for (let k = 0; k < 200; k++) {
  const mk = (d) => { if (d === 0 || rnd() < 0.3) { const v = LG.V(pick(V3)); return rnd() < 0.3 ? LG.NOT(v) : v; } const a = mk(d - 1), b = mk(d - 1); const t = rnd(); return t < 0.4 ? LG.AND(a, b) : t < 0.8 ? LG.OR(a, b) : LG.XOR(a, b); };
  const x = mk(3);
  const net = LG.netOf(x);
  const vals = Object.fromEntries(net.inputs.map((v) => [v, rnd() < 0.5 ? 1 : 0]));
  const b = GT.both(net, { values: vals });
  wellFormed(b.iec.svg, `logica ${k} CEI`); wellFormed(b.ansi.svg, `logica ${k} ANSI`);
  if (!b.html.includes('Simboli CEI') || !b.html.includes('Forme americane')) err(`logica ${k}: mancano le due rappresentazioni`);
  for (const g of net.gates) if (!b.desc.includes(GT.NAME[g.type])) err(`logica ${k}: la descrizione non nomina la porta ${g.type}`);
  // il valore d'uscita mostrato coincide con la simulazione
  const y = LG.simulate(net, vals).out.Y;
  if (!b.iec.svg.includes(`Y = ${y}`)) err(`logica ${k}: l’uscita mostrata non è ${y}`);
}
for (const t of ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR']) for (const st of ['iec', 'ansi']) wellFormed(GT.gateSymbol(t, st, { label: 'porta ' + t }), `porta ${t} ${st}`);
for (const t of ['D', 'JK', 'T', 'SR']) wellFormed(GT.flipflop(t), `flip-flop ${t}`);
wellFormed(PL.scope({ traces: [{ Vp: 3, f: 1000 }, { Vp: 1, f: 1000, phase: -45 }], vdiv: [1, 0.5], tdiv: 0.0002 }), 'oscilloscopio');
wellFormed(PL.transient({ x0: 0, xf: 12, tau: 0.01 }), 'transitorio');
wellFormed(PL.bode({ kind: 'alto', fc: 159 }), 'Bode');
wellFormed(PL.timing([{ name: 'CLK', levels: [1, 0, 1, 0] }, { name: 'Q', levels: [0, 0, 1, 1] }]), 'diagramma temporale');
for (const v of U.seriesValues('E12', 1, 1e6)) for (const n of [4, 5]) { const b = U.toBands(v, n, n === 4 ? 5 : 1); const svg = PL.resistor(b); wellFormed(svg, `codice colori ${v}`); overlaps(svg, `codice colori ${v}`); }
for (let k = 0; k < 100; k++) {
  const on = []; for (let m = 0; m < 16; m++) if (rnd() < 0.45) on.push(m);
  const vars = ['A', 'B', 'C', 'D'];
  const r0 = LG.minimalSOP(on, vars);
  const svg = PL.kmap(LG.kmap(on, vars), vars, r0.implicants);
  wellFormed(svg, `Karnaugh ${k}`);
  // le caselle a 1 sono quelle dei mintermini
  const ones = (svg.match(/class="km-val"[^>]*>1</g) || []).length;
  if (ones !== on.length) err(`Karnaugh ${k}: ${ones} caselle a 1 invece di ${on.length}`);
}
for (const [mode, range, reading, txt] of [['V', 20, 8.16, '8,16'], ['V', 2, 1.5, '1,500'], ['A', 0.2, 0.0147, '14,7'], ['Ω', 2000, 1000, '1,000'], ['V', 2, 8.16, '1.']]) {
  const svg = PL.multimeter({ mode, range, reading });
  wellFormed(svg, `multimetro ${mode} ${range}`);
  if (!svg.includes(`>${txt}<`)) err(`multimetro ${mode} portata ${range}: il display non mostra ${txt}`);
}

console.log('\nTest degli schemi, dei grafici e degli strumenti');
console.log(`  Disegni controllati: ${checked} (reti a scala delle lezioni e casuali, modelli, logica in due stili, grafici, codice colori, Karnaugh, multimetro)`);
console.log(errors.length ? `  Errori: ${errors.length}` : '  Nessun errore.');
[...new Set(errors)].slice(0, 60).forEach((x) => console.log('  ✗ ' + x));
if (errors.length) process.exitCode = 1;
