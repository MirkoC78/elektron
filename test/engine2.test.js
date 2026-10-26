/* Test del motore, seconda parte: transitori, logica, numerazione, dispositivi, segnali.
   - Riferimenti: numeri fissi da formule chiuse (test/fixtures/riferimento.py), non dal motore.
   - Ogni transitorio è confrontato con un'integrazione numerica del circuito (Eulero all'indietro con l'analisi nodale:
     il condensatore diventa una conduttanza C/h con un generatore di corrente, l'induttore una resistenza L/h).
   - Ogni minimizzazione è confrontata con la tabella di verità completa; per 3 variabili anche con la ricerca
     esaustiva della forma minima fra tutti gli insiemi di implicanti.
   - Reti sequenziali, numerazione, formule di tutte le tracce, schede degli errori tipici. */
const U = require('../src/units.js');
const M = require('../src/mna.js');
const T = require('../src/transient.js');
const L = require('../src/logic.js');
const NS = require('../src/numsys.js');
const D = require('../src/devices.js');
const SG = require('../src/signals.js');
const MA = require('../src/math.js');
const MI = require('../src/mistakes.js');

const errors = [];
const err = (m) => { if (errors.length < 300) errors.push(m); };
const near = (got, exp, tol = 1e-6) => Math.abs(got - exp) <= Math.max(Math.abs(exp) * tol, 1e-12);
let checks = 0;
function expect(name, got, exp, tol = 1e-6) { for (const [k, v] of Object.entries(exp)) { checks++; if (got[k] == null || !near(got[k], v, tol)) err(`${name}: ${k} = ${got[k]} invece di ${v}`); } }

/* ---------- 1. Riferimenti ---------- */
const REF = [
  ['tau-RC', () => ({ tau: T.tauRC({ R: 10000, C: 100e-6 }).v }), { tau: 1 }],
  ['tau-RL', () => ({ tau: T.tauRL({ L: 0.1, R: 50 }).v }), { tau: 0.002 }],
  ['carica-1tau', () => ({ v: T.rc({ R: 1000, C: 1e-3, E: 12, t: 1, mode: 'carica', find: 'v' }).v }), { v: 7.585446706 }],
  ['carica-t', () => ({ v: T.rc({ R: 1e6, C: 1e-6, E: 10, t: 0.5, mode: 'carica', find: 'v' }).v }), { v: 3.934693403 }],
  ['scarica-t', () => ({ v: T.rc({ R: 1000, C: 1e-6, V0: 12, t: 2e-3, mode: 'scarica', find: 'v' }).v }), { v: 1.624023399 }],
  ['carica-tempo', () => ({ t: T.rc({ R: 1000, C: 1e-6, E: 10, vx: 6, mode: 'carica', find: 't' }).v }), { t: 0.0009162907319 }],
  ['scarica-corrente', () => ({ i: T.rc({ R: 1000, C: 1e-6, V0: 12, t: 1e-3, mode: 'scarica', find: 'i' }).v }), { i: -0.004414553294 }],
  ['RL-corrente', () => ({ i: T.rl({ R: 100, L: 0.1, E: 12, t: 1e-3, mode: 'carica', find: 'i' }).v }), { i: 0.07585446706 }],
  ['cinque-tau', () => ({ t: T.settle({ R: 4700, C: 10e-6 }).v }), { t: 0.235 }],
  ['led-R', () => ({ R: D.ledResistor({ V: 5, Vf: 2, I: 0.015, find: 'R' }).v, Rc: D.ledResistor({ V: 5, Vf: 2, I: 0.015, find: 'Rc' }).v, P: D.ledResistor({ V: 5, Vf: 2, I: 0.015, find: 'P' }).v }), { R: 200, Rc: 220, P: 0.04090909091 }],
  ['raddrizzatore-semi', () => ({ Vp: D.rectifier({ V2: 12, type: 'semi', find: 'Vp' }).v, Vmed: D.rectifier({ V2: 12, type: 'semi', find: 'Vmed' }).v }), { Vp: 16.27056275, Vmed: 5.179080977 }],
  ['raddrizzatore-ponte', () => { const p = { V2: 12, type: 'ponte', C: 1000e-6, I: 0.5 }; return { Vp: D.rectifier(Object.assign({ find: 'Vp' }, p)).v, Vr: D.rectifier(Object.assign({ find: 'Vr' }, p)).v, Vdc: D.rectifier(Object.assign({ find: 'Vdc' }, p)).v }; }, { Vp: 15.57056275, Vr: 5, Vdc: 13.07056275 }],
  ['bjt-guadagno', () => ({ IC: D.bjtGain({ find: 'IC', IB: 20e-6, beta: 150 }).v, IE: D.bjtGain({ find: 'IE', IB: 20e-6, IC: 0.003 }).v }), { IC: 0.003, IE: 0.00302 }],
  ['bjt-partitore-approx', () => { const p = { VCC: 12, R1: 47000, R2: 10000, RC: 2200, RE: 1000, beta: 100 }; return { VB: D.bjtDivider(Object.assign({ find: 'VB' }, p)).v, IE: D.bjtDivider(Object.assign({ find: 'IE' }, p)).v, VCE: D.bjtDivider(Object.assign({ find: 'VCE' }, p)).v }; }, { VB: 2.105263158, IE: 0.001405263158, VCE: 7.503157895 }],
  ['bjt-interruttore', () => ({ RB: D.bjtSwitch({ VCC: 12, RC: 100, Vin: 5, beta: 100, k: 2 }).v, RBc: D.bjtSwitch({ VCC: 12, RC: 100, Vin: 5, beta: 100, k: 2, find: 'RBc' }).v }), { RB: 1822.033898, RBc: 1800 }],
  ['mosfet-potenza', () => ({ P: D.mosfet({ VDD: 12, RD: 100, VGS: 5, Vth: 2, Ron: 0.1, find: 'P' }).v }), { P: 0.001437124314 }],
  ['schmitt', () => ({ VT: D.schmitt({ R1: 10000, R2: 47000, Vsat: 12, find: 'VTH' }).v, H: D.schmitt({ R1: 10000, R2: 47000, Vsat: 12, find: 'H' }).v }), { VT: 2.105263158, H: 4.210526316 }],
  ['astabile-op', () => ({ T: D.astableOA({ R: 10e3, C: 100e-9, R1: 10e3, R2: 10e3, find: 'T' }).v, f: D.astableOA({ R: 10e3, C: 100e-9, R1: 10e3, R2: 10e3, find: 'f' }).v }), { T: 0.002197224577, f: 455.1196133 }],
  ['ne555-astabile', () => { const p = { RA: 1000, RB: 10000, C: 100e-9 }; const g = (f) => D.ne555astable(Object.assign({ find: f }, p)).v; return { tH: g('tH'), tL: g('tL'), f: g('f'), D: g('D') }; }, { tH: 0.0007623, tL: 0.000693, f: 687.1435443, D: 52.38095238 }],
  ['ne555-mono', () => ({ T: D.ne555mono({ R: 100e3, C: 10e-6 }).v }), { T: 1.1 }],
  ['wien', () => ({ f0: D.wien({ R: 10e3, C: 10e-9 }).v }), { f0: 1591.549431 }],
  ['trasformatore', () => ({ V2: D.transformer({ V1: 230, N1: 1000, N2: 50 }).v }), { V2: 11.5 }],
  ['lineare', () => ({ P: D.linearReg({ Vin: 12, Vout: 5, I: 0.5, find: 'P' }).v, eta: D.linearReg({ Vin: 12, Vout: 5, find: 'eta' }).v }), { P: 3.5, eta: 41.66666667 }],
  ['lm317', () => ({ Vout: D.lm317({ R1: 240, R2: 720 }).v }), { Vout: 5 }],
  ['pt100', () => ({ R: D.pt100({ T: 50 }).v, T: D.pt100({ R: 119.25, find: 'T' }).v }), { R: 119.25, T: 50 }],
  ['lm35', () => ({ V: D.lm35({ T: 37 }).v, T: D.lm35({ V: 0.25, find: 'T' }).v }), { V: 0.37, T: 25 }],
  ['ntc', () => ({ R: D.ntc({ R0: 10000, B: 3950, T: 50 }).v }), { R: 3588.182582 }],
  ['condizionamento', () => { const p = { a: 0.2, b: 1.2, VFS: 5, Vs: 0.7 }; return { G: D.conditioning(Object.assign({ find: 'G' }, p)).v, Voff: D.conditioning(Object.assign({ find: 'Voff' }, p)).v, Vout: D.conditioning(Object.assign({ find: 'Vout' }, p)).v }; }, { G: 5, Voff: -1, Vout: 2.5 }],
  ['db', () => ({ G: SG.db({ ratio: 10, find: 'dB' }).v, Gp: SG.db({ ratio: 100, kind: 'potenza', find: 'dB' }).v, A: SG.db({ dB: -3, find: 'ratio' }).v }), { G: 20, Gp: 20, A: 0.7079457844 }],
  ['passa-basso', () => { const p = { kind: 'basso', R: 1000, C: 100e-9, f: 10000 }; const g = (f) => SG.filterRC(Object.assign({ find: f }, p)).v; return { fc: g('fc'), mod: g('mod'), dB: g('dB'), phi: g('phi') }; }, { fc: 1591.549431, mod: 0.1571767255, dB: -16.07223527, phi: -80.95693892 }],
  ['passa-alto', () => { const p = { kind: 'alto', R: 1000, C: 100e-9, f: 100 }; const g = (f) => SG.filterRC(Object.assign({ find: f }, p)).v; return { mod: g('mod'), phi: g('phi') }; }, { mod: 0.06270819398, phi: 86.40472622 }],
  ['bode-asintotico', () => ({ G: SG.filterRC({ kind: 'basso', R: 1000, C: 100e-9, f: 10000, find: 'asint' }).v }), { G: -15.96359737 }],
  ['filtro-attivo', () => ({ K: SG.activeFilter({ kind: 'basso', R1: 1000, Rf: 10e3, C: 10e-9, find: 'K' }).v, fc: SG.activeFilter({ kind: 'basso', R1: 1000, Rf: 10e3, C: 10e-9 }).v }), { K: -10, fc: 1591.549431 }],
  ['adc', () => ({ Q: SG.adc({ VFS: 5, n: 10, find: 'Q' }).v, err: SG.adc({ VFS: 5, n: 10, find: 'err' }).v, N: SG.adc({ VFS: 5, n: 10, Vin: 1.5, find: 'N' }).v, Vout: SG.adc({ VFS: 5, n: 10, N: 512, find: 'Vout' }).v }), { Q: 0.0048828125, err: 0.00244140625, N: 307, Vout: 2.5 }],
  ['adc8', () => ({ Q: SG.adc({ VFS: 10, n: 8, find: 'Q' }).v, N: SG.adc({ VFS: 10, n: 8, Vin: 3.3, find: 'N' }).v }), { Q: 0.0390625, N: 84 }],
  ['dac-pesato', () => ({ Vout: SG.dacWeighted({ Vref: 5, Rf: 1000, R: 1000, code: '1011' }).v }), { Vout: -6.875 }],
  ['campionamento', () => ({ fs: SG.sampling({ fmax: 20000 }).v, alias: SG.sampling({ f: 7000, fs: 6000, find: 'alias' }).v }), { fs: 40000, alias: 1000 }],
];
for (const [name, run, exp] of REF) { let got; try { got = run(); } catch (x) { err(`${name}: eccezione ${x.message}`); continue; } expect(name, got, exp); }

/* ---------- 2. Transitori contro integrazione numerica ---------- */
let seed = 4242;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
// Eulero all'indietro sul circuito: generatore E, R in serie, C (o L) verso massa, valore iniziale x0
function integrateRC(E, R, C, v0, tEnd, n) {
  const h = tEnd / n;
  let v = v0;
  for (let k = 0; k < n; k++) {
    // modello del condensatore in un passo: conduttanza C/h in parallelo a un generatore di corrente (C/h)·v_precedente
    const r = M.solve({ elements: [{ id: 'E', t: 'V', a: 'in', b: '0', v: E }, { id: 'R', t: 'R', a: 'in', b: 'c', v: R }, { id: 'Gc', t: 'R', a: 'c', b: '0', v: h / C }, { id: 'Ic', t: 'I', a: 'c', b: '0', v: (C / h) * v }] });
    v = r.V('c');
  }
  return v;
}
function integrateRL(E, R, Lh, i0, tEnd, n) {
  const h = tEnd / n;
  let i = i0;
  for (let k = 0; k < n; k++) {
    // modello dell'induttore: resistenza L/h in serie a un generatore di tensione (L/h)·i_precedente
    const r = M.solve({ elements: [{ id: 'E', t: 'V', a: 'in', b: '0', v: E }, { id: 'R', t: 'R', a: 'in', b: 'x', v: R }, { id: 'RL', t: 'R', a: 'x', b: 'y', v: Lh / h }, { id: 'VL', t: 'V', a: '0', b: 'y', v: (Lh / h) * i }] });
    i = r.I('R');
  }
  return i;
}
let transChecks = 0;
for (let k = 0; k < 120; k++) {
  const R = pick(U.seriesValues('E12', 100, 1e6)), C = pick([1e-9, 10e-9, 100e-9, 1e-6, 10e-6, 100e-6]);
  const E = pick([5, 9, 12, 15]);
  const tau = R * C;
  const charge = rnd() < 0.5;
  const v0 = charge ? 0 : E, Ein = charge ? E : 0;
  const t = tau * pick([0.3, 0.5, 1, 2, 3]);
  const exact = T.value(v0, Ein, tau, t);
  const num = integrateRC(Ein, R, C, v0, t, 4000);
  // l'errore di Eulero all'indietro è dell'ordine di h: 4000 passi bastano per lo 0,1 %
  transChecks++;
  if (Math.abs(num - exact) > 1e-3 * Math.max(E, 1)) err(`transitorio RC ${k}: formula ${exact}, integrazione ${num}`);
  const s = T.rc({ R, C, E, V0: charge ? 0 : E, t, mode: charge ? 'carica' : 'scarica', find: 'v' });
  if (!near(s.v, exact, 1e-9)) err(`transitorio RC ${k}: risolutore ${s.v} ≠ formula ${exact}`);
}
for (let k = 0; k < 60; k++) {
  const R = pick([10, 22, 47, 100, 220, 470, 1000]), Lh = pick([1e-3, 10e-3, 100e-3, 1]), E = pick([5, 12, 24]);
  const tau = Lh / R, t = tau * pick([0.5, 1, 2, 3]);
  const exact = T.value(0, E / R, tau, t);
  const num = integrateRL(E, R, Lh, 0, t, 4000);
  transChecks++;
  if (Math.abs(num - exact) > 1e-3 * E / R) err(`transitorio RL ${k}: formula ${exact}, integrazione ${num}`);
  const s = T.rl({ R, L: Lh, E, t, mode: 'carica', find: 'i' });
  if (!near(s.v, exact, 1e-9)) err(`transitorio RL ${k}: risolutore ${s.v} ≠ formula ${exact}`);
}
// percentuali della tabella dei τ
const pct = [63.2, 86.5, 95.0, 98.2, 99.3];
T.TABLE.forEach((r, i) => { checks++; if (Math.abs(r.pct - pct[i]) > 0.05) err(`tabella dei τ: ${r.k}τ → ${r.pct}`); });

/* ---------- 3. Logica ---------- */
// 3 variabili: tutte le 256 funzioni, forma minima confrontata con la ricerca esaustiva
const V3 = ['A', 'B', 'C'];
const cubes3 = [];
for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) cubes3.push(['0', '1', '-'][a] + ['0', '1', '-'][b] + ['0', '1', '-'][c]);
const cubeMins = (c, n) => { const out = []; for (let m = 0; m < 1 << n; m++) if (L.covers(c, m, n)) out.push(m); return out; };
let minChecks = 0;
for (let f = 0; f < 256; f++) {
  const on = []; for (let m = 0; m < 8; m++) if ((f >> m) & 1) on.push(m);
  const r = L.minimalSOP(on, V3);
  // equivalenza con la tabella completa
  const tt = L.table(r.expr, V3);
  if (!tt.every((row) => row.out === ((f >> row.m) & 1))) err(`minimizzazione di f=${f}: ${L.text(r.expr)} non è equivalente`);
  // tutte le coperture minime riportate sono equivalenti
  for (const e of r.all) if (!L.table(e, V3).every((row) => row.out === ((f >> row.m) & 1))) err(`minimizzazione di f=${f}: soluzione alternativa ${L.text(e)} non equivalente`);
  // ricerca esaustiva: il minor numero di termini, poi di letterali
  const imps = cubes3.filter((c) => cubeMins(c, 3).every((m) => on.includes(m)));
  let best = on.length ? null : [0, 0];
  const onSet = new Set(on);
  const rec = (start, chosen, covered) => {
    if ([...onSet].every((m) => covered.has(m))) {
      const cost = [chosen.length, chosen.reduce((s, c) => s + [...c].filter((x) => x !== '-').length, 0)];
      if (!best || cost[0] < best[0] || (cost[0] === best[0] && cost[1] < best[1])) best = cost;
      return;
    }
    if (chosen.length >= 4) return;
    for (let i = start; i < imps.length; i++) { const nc = new Set(covered); cubeMins(imps[i], 3).forEach((m) => nc.add(m)); rec(i + 1, chosen.concat([imps[i]]), nc); }
  };
  if (on.length) rec(0, [], new Set());
  const got = on.length ? [r.cost.terms, r.cost.literals] : [0, 0];
  minChecks++;
  if (best[0] !== got[0] || best[1] !== got[1]) err(`minimizzazione di f=${f}: costo ${got} invece del minimo ${best}`);
  // prodotto di somme
  const pos = L.minimalPOS(on, V3);
  if (!L.table(pos.expr, V3).every((row) => row.out === ((f >> row.m) & 1))) err(`forma POS di f=${f}: ${L.text(pos.expr)} non è equivalente`);
}
// 4 variabili con le condizioni indifferenti: 3000 funzioni casuali
const V4 = ['A', 'B', 'C', 'D'];
for (let k = 0; k < 3000; k++) {
  const on = [], dc = [];
  for (let m = 0; m < 16; m++) { const x = rnd(); if (x < 0.4) on.push(m); else if (x < 0.5) dc.push(m); }
  const r = L.minimalSOP(on, V4, dc);
  const tt = L.table(r.expr, V4);
  for (const row of tt) if (!dc.includes(row.m) && row.out !== (on.includes(row.m) ? 1 : 0)) { err(`4 variabili ${k}: ${L.text(r.expr)} sbaglia il mintermine ${row.m}`); break; }
  // ogni termine è un implicante primo (togliendo un letterale si coprirebbe uno 0) e nessun termine è superfluo
  for (const imp of r.implicants) {
    for (let i = 0; i < 4; i++) if (imp[i] !== '-') { const wider = imp.slice(0, i) + '-' + imp.slice(i + 1); if (cubeMins(wider, 4).every((m) => on.includes(m) || dc.includes(m))) err(`4 variabili ${k}: ${imp} non è primo`); }
    const others = r.implicants.filter((x) => x !== imp);
    if (on.every((m) => others.some((x) => L.covers(x, m, 4)))) err(`4 variabili ${k}: ${imp} è superfluo`);
  }
  const pos = L.minimalPOS(on, V4, dc);
  for (const row of L.table(pos.expr, V4)) if (!dc.includes(row.m) && row.out !== (on.includes(row.m) ? 1 : 0)) { err(`4 variabili ${k}: POS ${L.text(pos.expr)} sbaglia ${row.m}`); break; }
  minChecks++;
}
// mappe di Karnaugh: ogni mintermine in una casella sola; caselle adiacenti differiscono di un bit (anche sui bordi)
for (const vars of [['A', 'B'], V3, V4]) {
  const Ly = L.kmapLayout(vars);
  const seen = new Set();
  Ly.rows.forEach((_, ri) => Ly.cols.forEach((_, ci) => {
    const m = Ly.cell(ri, ci); seen.add(m);
    const [r2, c2] = Ly.pos(m); if (r2 !== ri || c2 !== ci) err(`Karnaugh ${vars.length}: posizione di ${m}`);
    const right = Ly.cell(ri, (ci + 1) % Ly.cols.length), down = Ly.cell((ri + 1) % Ly.rows.length, ci);
    const bits = (x) => x.toString(2).split('').filter((b) => b === '1').length;
    if (Ly.cols.length > 1 && bits(m ^ right) !== 1) err(`Karnaugh ${vars.length}: caselle ${m} e ${right} non adiacenti`);
    if (Ly.rows.length > 1 && bits(m ^ down) !== 1) err(`Karnaugh ${vars.length}: caselle ${m} e ${down} non adiacenti`);
  }));
  checks++; if (seen.size !== 1 << vars.length) err(`Karnaugh ${vars.length}: caselle mancanti`);
}
// lettura delle espressioni scritte dallo studente
const exprCases = [["A'B + C", [1, 2, 3, 5, 7]], ['!A&B|C', [1, 2, 3, 5, 7]], ['not A and B or C', [1, 2, 3, 5, 7]], ['(A+B)(A+C)', [3, 4, 5, 6, 7]], ["(AB)'", [0, 1, 2, 3, 4, 5]], ['A ⊕ B ⊕ C', [1, 2, 4, 7]], ['A·B·C + A·B·C̄', [6, 7]], ["A'B'C'", [0]]];
for (const [s, mins] of exprCases) {
  checks++;
  let x;
  try { x = L.parse(s); } catch (e) { err(`espressione «${s}»: ${e.message}`); continue; }
  const got = L.mintermsOf(x, V3.filter((v) => true));
  if (JSON.stringify(got) !== JSON.stringify(mins)) err(`espressione «${s}»: mintermini ${got} invece di ${mins}`);
}
for (const s of ['A +', '(A', 'A $ B', '']) { checks++; try { L.parse(s); err(`espressione «${s}» non doveva essere letta`); } catch (e) { /* bene */ } }
// porte: ogni porta e la sua espressione
for (const [type, fn] of Object.entries({ AND: (a, b) => a & b, OR: (a, b) => a | b, NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b), XOR: (a, b) => a ^ b, XNOR: (a, b) => 1 - (a ^ b) })) {
  const net = { inputs: ['A', 'B'], gates: [{ id: 'G1', type, in: ['A', 'B'] }], outputs: { Y: 'G1' } };
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { checks++; if (L.simulate(net, { A: a, B: b }).out.Y !== fn(a, b)) err(`porta ${type} con ${a}${b}`); if (L.evalE(L.exprOf(net, 'G1'), { A: a, B: b }) !== fn(a, b)) err(`espressione della porta ${type}`); }
}
// dall'espressione alla rete e ritorno: 500 espressioni casuali
const randExpr = (d) => { if (d === 0 || rnd() < 0.3) { const v = L.V(pick(V3)); return rnd() < 0.3 ? L.NOT(v) : v; } const k = rnd(); const a = randExpr(d - 1), b = randExpr(d - 1); return k < 0.4 ? L.AND(a, b) : k < 0.8 ? L.OR(a, b) : k < 0.9 ? L.XOR(a, b) : L.NOT(L.AND(a, b)); };
for (let k = 0; k < 500; k++) {
  const x = randExpr(3);
  const net = L.netOf(x);
  const vs = L.varsOf(x);
  checks++;
  for (const row of L.table(x, vs)) { const a = {}; vs.forEach((v, i) => { a[v] = row.in[i]; }); if (L.simulate(net, a).out.Y !== row.out) { err(`rete da ${L.text(x)} sbaglia`); break; } }
  // il testo scritto si rilegge nella stessa funzione
  if (!L.equivalent(L.parse(L.text(x).replace(/¬\(/g, '!(')), x)) err(`testo di ${L.text(x)} non si rilegge`);
}
// blocchi combinatori
for (let s = 0; s < 4; s++) { checks++; const data = [0, 1, 1, 0]; if (L.mux([s >> 1, s & 1], data) !== data[s]) err('multiplexer'); if (L.decoder([s >> 1, s & 1], 4).indexOf(1) !== s) err('decoder'); }
for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) { checks++; const fa = L.fullAdder(a, b, c); if (fa.S + 2 * fa.C !== a + b + c) err('sommatore completo'); }
// sequenziali
const ffCases = [
  ['D', [{ D: 1 }, { D: 0 }, { D: 1 }, { D: 1 }], 0, [0, 1, 0, 1, 1]],
  ['T', [{ T: 1 }, { T: 1 }, { T: 0 }, { T: 1 }], 0, [0, 1, 0, 0, 1]],
  ['JK', [{ J: 1, K: 0 }, { J: 0, K: 0 }, { J: 1, K: 1 }, { J: 1, K: 1 }, { J: 0, K: 1 }], 0, [0, 1, 1, 0, 1, 0]],
  ['SR', [{ S: 1, R: 0 }, { S: 0, R: 0 }, { S: 0, R: 1 }, { S: 1, R: 1 }], 0, [0, 1, 1, 0, null]],
];
for (const [t, ins, q0, want] of ffCases) { checks++; const got = L.runFF(t, ins, q0); if (JSON.stringify(got) !== JSON.stringify(want)) err(`flip-flop ${t}: ${got} invece di ${want}`); }
for (let n = 1; n <= 4; n++) { checks++; const r = L.rippleCounter(n, 2 ** n * 2); if (r.some((v, i) => v !== i % 2 ** n)) err(`contatore asincrono a ${n} bit: ${r}`); }
checks++; if (JSON.stringify(L.counter(4, { mod: 10, steps: 12 })) !== JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1])) err('contatore modulo 10');
checks++; if (JSON.stringify(L.counter(3, { down: true, steps: 5 })) !== JSON.stringify([0, 7, 6, 5, 4])) err('contatore all’indietro');
checks++; if (JSON.stringify(L.shiftRegister(4, [1, 0, 1, 1]).map((s) => s.join(''))) !== JSON.stringify(['0000', '1000', '0100', '1010', '1101'])) err('registro a scorrimento');
checks++; if (!L.latchSR(0, 1, 1).vietato || L.latchSR(0, 1, 0).q !== 1 || L.latchSR(1, 0, 0).q !== 1 || L.latchSR(1, 0, 1).q !== 0) err('latch SR');

/* ---------- 4. Numerazione ---------- */
for (let n = 0; n < 4096; n++) for (const b of [2, 8, 16]) {
  checks++;
  const s = NS.toBase(n, b);
  const back = NS.parseBase(s, b);
  if (!back.ok || back.value !== n) { err(`base ${b}: ${n} → ${s} → ${back.value}`); break; }
  // divisioni successive: i resti letti dal basso danno le cifre
  const digits = NS.divisions(n, b).map((r) => NS.DIG[r.r]).reverse().join('');
  if (digits !== n.toString(b).toUpperCase()) { err(`divisioni successive di ${n} in base ${b}`); break; }
  if (NS.weights(n.toString(b), b).reduce((a, w) => a + w.v * w.w, 0) !== n) { err(`somma dei pesi di ${n} in base ${b}`); break; }
}
const refNum = [[45, 2, '10 1101'], [255, 16, 'FF'], [100, 16, '64'], [10, 2, '1010'], [2026, 16, '7EA']];
for (const [n, b, s] of refNum) { checks++; if (NS.toBase(n, b) !== s) err(`${n} in base ${b}: ${NS.toBase(n, b)} invece di ${s}`); }
checks++; if (NS.parseBase('0x1F', 16).value !== 31 || NS.parseBase('1011₂', 2).value !== 11 || NS.parseBase('1021', 2).ok) err('lettura delle basi');
checks++; if (NS.toBCD(2026) !== '0010 0000 0010 0110' || NS.fromBCD('0010 0000 0010 0110') !== 2026 || NS.fromBCD('1010') !== null) err('BCD');
for (let n = 3; n <= 8; n++) {
  const { min, max } = NS.range2(n);
  checks++;
  if (min !== -(2 ** (n - 1)) || max !== 2 ** (n - 1) - 1) err(`intervallo del complemento a due su ${n} bit`);
  for (let v = min; v <= max; v++) if (NS.fromTwos(NS.toTwos(v, n)) !== v) { err(`complemento a due di ${v} su ${n} bit`); break; }
  if (NS.toTwos(max + 1, n) !== null) err(`complemento a due: ${max + 1} non sta in ${n} bit`);
}
checks++; if (NS.toTwos(-5, 8) !== '11111011' || NS.twosSteps(-5, 8).inv !== '11111010') err('complemento a due di −5');
// somma binaria: overflow con segno e riporto contro l'aritmetica intera, tutte le coppie a 4 bit
for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) {
  checks++;
  const r = NS.addBinary(a.toString(2), b.toString(2), 4);
  if (parseInt(r.sum, 2) !== (a + b) % 16 || r.carryOut !== (a + b >= 16 ? 1 : 0)) { err(`somma ${a} + ${b}`); break; }
  const sa = NS.fromTwos(a.toString(2).padStart(4, '0')), sb = NS.fromTwos(b.toString(2).padStart(4, '0'));
  if (r.overflow !== (sa + sb > 7 || sa + sb < -8)) { err(`overflow ${sa} + ${sb}`); break; }
}

/* ---------- 5. Tracce e schede degli errori ---------- */
const sols = [];
const add = (f) => { try { sols.push(f()); } catch (e) { err(`risolutore: ${e.message}`); } };
for (const find of ['v', 'i', 't']) { add(() => T.rc({ R: 1000, C: 1e-6, V0: 10, vx: 4, t: 1e-3, mode: 'scarica', find })); add(() => T.rc({ R: 1000, C: 1e-6, E: 10, vx: 4, t: 1e-3, mode: 'carica', find })); }
add(() => T.rl({ R: 100, L: 0.1, E: 12, t: 1e-3, find: 'v' })); add(() => T.settle({ L: 0.1, R: 10 })); add(() => T.tauRL({ L: 0.1, R: 10 }));
add(() => D.diode({ V: 0.5, R: 1000 })); add(() => D.diode({ V: 12, R: 1000, n: 2 })); add(() => D.diode({ V: 5, R: 1000, model: 'ideale' }));
for (const f of ['VL', 'IR', 'IL', 'IZ', 'PZ']) { add(() => D.zener({ V: 12, R: 470, Vz: 5.1, RL: 1000, find: f })); add(() => D.zener({ V: 12, R: 470, Vz: 5.1, RL: 200, find: f })); }
for (const f of ['Vp', 'Vmed', 'Vr', 'Vdc']) add(() => D.rectifier({ V2: 9, type: 'semi', C: 470e-6, I: 0.1, find: f }));
for (const f of ['IB', 'IC', 'VCE', 'zona']) { add(() => D.bjt({ VCC: 12, VBB: 5, RB: 10000, RC: 1000, beta: 100, find: f })); add(() => D.bjt({ VCC: 12, VBB: 0.3, RB: 10000, RC: 1000, beta: 100, find: f })); }
for (const f of ['VB', 'IE', 'IC', 'VCE']) add(() => D.bjtDivider({ VCC: 12, R1: 47000, R2: 10000, RC: 2200, RE: 1000, beta: 100, find: f }));
for (const f of ['ID', 'P', 'VDS']) { add(() => D.mosfet({ VDD: 12, RD: 100, VGS: 5, Vth: 2, Ron: 0.1, find: f })); add(() => D.mosfet({ VDD: 12, RD: 100, VGS: 1, Vth: 2, Ron: 0.1, find: f })); }
for (const kind of ['invertente', 'non-invertente', 'inseguitore', 'differenziale']) for (const f of ['Av', 'Vout']) add(() => D.opamp({ kind, Vin: 1.5, R1: 1000, Rf: 10000, V1: 1, V2: 2, Vsat: 12, find: f }));
add(() => D.comparator({ Vp: 1, Vn: 2, Vsat: 12 })); for (const f of ['VTH', 'VTL', 'H']) add(() => D.schmitt({ R1: 1e4, R2: 1e5, Vsat: 12, find: f }));
for (const f of ['tH', 'tL', 'T', 'f', 'D']) add(() => D.ne555astable({ RA: 4700, RB: 10e3, C: 10e-9, find: f }));
add(() => D.wien({ R1: 1000, find: 'Rf' })); add(() => D.transformer({ V1: 230, V2: 12, find: 'n' })); add(() => D.lm317({ R1: 240, Vout: 9, find: 'R2' }));
add(() => D.lm35({ V: 0.5, find: 'T' })); add(() => D.sensorDivider({ V: 5, R: 10000, Rs: 2200 }));
for (const f of ['fc', 'mod', 'dB', 'phi', 'Vout', 'asint']) { add(() => SG.filterRC({ kind: 'basso', R: 1000, C: 1e-6, f: 50, Vin: 5, find: f })); add(() => SG.filterRC({ kind: 'alto', R: 1000, C: 1e-6, f: 5000, Vin: 5, find: f })); }
add(() => SG.activeFilter({ kind: 'alto', R1: 1000, Rf: 4700, C: 1e-6, find: 'KdB' }));
for (const f of ['levels', 'Q', 'err', 'Vout', 'N', 'N2']) add(() => SG.adc({ VFS: 5, n: 8, Vin: 2, N: 100, find: f }));
add(() => SG.sampling({ fmax: 4000 }));
let stepsChecked = 0;
for (const s of sols) {
  for (const st of s.steps) for (const src of [st.f, st.s]) {
    stepsChecked++;
    try { const mm = MA.toMathML(src); if (/undefined|NaN/.test(mm)) err(`formula con valori mancanti: ${src}`); MA.toText(src); MA.speak(src); } catch (e) { err(`formula non leggibile «${src}»: ${e.message}`); }
  }
  for (const m of s.mistakes) if (!MI.CATALOG[m.id]) err(`errore tipico senza scheda: ${m.id}`);
  if (typeof s.v === 'number' && !isFinite(s.v)) err(`risultato non finito: ${s.sym}`);
  if (typeof s.v === 'number' && MI.match(s.v, s.mistakes, s.v)) err(`la risposta giusta di ${s.sym} è riconosciuta come errore`);
}

console.log('\nTest del motore, seconda parte');
console.log(`  Riferimenti: ${REF.length} problemi (formule chiuse, test/fixtures/riferimento.py)`);
console.log(`  Transitori confrontati con l'integrazione numerica: ${transChecks}`);
console.log(`  Minimizzazioni confrontate con la tabella completa: ${minChecks} (256 funzioni di 3 variabili anche con la ricerca esaustiva)`);
console.log(`  Controlli puntuali: ${checks}; formule delle tracce: ${stepsChecked} in ${sols.length} soluzioni`);
console.log(errors.length ? `  Errori: ${errors.length}` : '  Nessun errore.');
[...new Set(errors)].slice(0, 60).forEach((x) => console.log('  ✗ ' + x));
if (errors.length) process.exitCode = 1;
