/* Test del motore delle reti.
   1. Problemi di riferimento: i risultati attesi sono numeri fissi calcolati con le formule chiuse dei libri di testo
      (test/fixtures/riferimento.py), non con il motore. Ogni problema si risolve con il risolutore che userà l'app
      e, dove possibile, anche con l'analisi nodale.
   2. Controlli incrociati: migliaia di reti a scala casuali risolte con due metodi diversi (analisi nodale e riduzione
      serie/parallelo con il ritorno indietro; Thevenin con la porta aperta e con il generatore di prova; sovrapposizione
      e soluzione completa), in continua e in alternata.
   3. Numeri e unità: scrittura SI, lettura delle risposte, serie E, codice colori, numeri complessi. */
const U = require('../src/units.js');
const X = require('../src/cx.js');
const M = require('../src/mna.js');
const CI = require('../src/circuit.js');
const S = require('../src/solve.js');
const MA = require('../src/math.js');
const MI = require('../src/mistakes.js');

const errors = [];
const err = (m) => { if (errors.length < 300) errors.push(m); };
const near = (got, exp, tol = 1e-6) => Math.abs(got - exp) <= Math.max(Math.abs(exp) * tol, 1e-12);
let checks = 0;
function expect(name, got, exp, tol) {
  for (const [k, v] of Object.entries(exp)) {
    checks++;
    if (got[k] == null || !near(got[k], v, tol)) err(`${name}: ${k} = ${got[k]} invece di ${v}`);
  }
}

/* ---------- 1. Problemi di riferimento ---------- */
const net = (els) => ({ elements: els });
const R = (id, a, b, v) => ({ id, t: 'R', a, b, v });
const V = (id, a, b, v) => ({ id, t: 'V', a, b, v });
const ladder = (cols, top, bot) => ({ cols, top, bot });
const r = (id, v) => ({ id, t: 'R', v });
const e = (id, v) => ({ id, t: 'V', v });
const W = (x) => (x && x.re != null ? x : X.C(x, 0));
const REF = [
  ['ohm-V', () => ({ V: S.ohm({ find: 'V', R: 4700, I: 0.002 }).v }), { V: 9.4 }],
  ['ohm-I', () => ({ I: S.ohm({ find: 'I', V: 12, R: 470 }).v }), { I: 0.02553191489 }],
  ['ohm-R', () => ({ R: S.ohm({ find: 'R', V: 230, I: 0.5 }).v }), { R: 460 }],
  ['pot-VI', () => ({ P: S.power({ find: 'P', V: 12, I: 0.5 }).v }), { P: 6 }],
  ['pot-RI', () => ({ P: S.power({ find: 'P', R: 1000, I: 0.01 }).v }), { P: 0.1 }],
  ['pot-VR', () => ({ P: S.power({ find: 'P', V: 9, R: 330 }).v }), { P: 0.2454545455 }],
  ['pot-Imax', () => ({ I: S.power({ find: 'I', P: 0.25, R: 1000 }).v }), { I: 0.0158113883 }],
  ['energia', () => ({ Wh: S.energy({ P: 2000, t: 5400, out: 'Wh' }).v }), { Wh: 3000 }],
  ['carica', () => ({ Q: S.charge({ find: 'Q', I: 2, t: 30 }).v }), { Q: 60 }],
  ['resistivita', () => ({ R: S.resistivity({ rho: 0.0175, l: 100, S: 1.5 }).v }), { R: 1.166666667 }],
  ['tolleranza', () => ({ min: S.tolerance({ R: 4700, tol: 5, find: 'min' }).v, max: S.tolerance({ R: 4700, tol: 5, find: 'max' }).v }), { min: 4465, max: 4935 }],
  ['serie', () => ({ Req: S.series({ R: [100, 220, 330], find: 'Req' }).v, I: S.series({ R: [100, 220, 330], V: 12, find: 'I' }).v, V2: S.series({ R: [100, 220, 330], V: 12, find: 'V2' }).v }), { Req: 650, I: 0.01846153846, V2: 4.061538462 }],
  ['parallelo3', () => ({ Req: S.parallel({ R: [100, 200, 300], find: 'Req' }).v }), { Req: 54.54545455 }],
  ['parallelo2', () => ({ Req: S.parallel({ R: [4700, 10000], find: 'Req' }).v }), { Req: 3197.278912 }],
  ['parallelo-uguali', () => ({ Req: S.parallel({ R: [330, 330, 330], find: 'Req' }).v }), { Req: 110 }],
  ['mista1', () => { const spec = ladder([[e('V1', 12)], [r('R2', 200)], [r('R3', 300)]], [[r('R1', 100)], []]); return { Req: S.network({ spec, find: 'Req' }).v, I3: S.network({ spec, V: 12, find: 'I:R3' }).v }; }, { Req: 220, I3: 0.02181818182 }],
  ['mista2', () => { const spec = ladder([[e('V1', 9)], [r('R1', 1000), r('R2', 2000)], [r('R3', 3000)]], [[], []]); return { Req: S.network({ spec, find: 'Req' }).v, I: S.network({ spec, V: 9, find: 'I' }).v, I3: S.network({ spec, V: 9, find: 'I:R3' }).v }; }, { Req: 1500, I: 0.006, I3: 0.003 }],
  ['scala', () => { const spec = ladder([[e('V1', 11)], [r('R2', 2000)], [r('R4', 2000)]], [[r('R1', 1000)], [r('R3', 1000)]]); return { Req: S.network({ spec, find: 'Req' }).v, I: S.network({ spec, V: 11, find: 'I' }).v, V4: S.network({ spec, V: 11, find: 'V:R4' }).v }; }, { Req: 2200, I: 0.005, V4: 4 }],
  ['partitore1', () => ({ V2: S.divider({ V: 12, R1: 1000, R2: 2000 }).v }), { V2: 8 }],
  ['partitore2', () => ({ V2: S.divider({ V: 5, R1: 10000, R2: 4700 }).v }), { V2: 1.598639456 }],
  ['partitore-carico1', () => ({ VL: S.loadedDivider({ V: 12, R1: 1000, R2: 1000, RL: 1000 }).v }), { VL: 4 }],
  ['partitore-carico2', () => ({ VL: S.loadedDivider({ V: 10, R1: 10000, R2: 10000, RL: 100000 }).v }), { VL: 4.761904762 }],
  ['partitore-corrente', () => ({ I1: S.currentDivider({ I: 0.03, R1: 1000, R2: 2000 }).v, I2: S.currentDivider({ I: 0.03, R1: 2000, R2: 1000 }).v }), { I1: 0.02, I2: 0.01 }],
  ['kcl1', () => ({ I3: S.kcl({ known: [{ sym: 'I_1', v: 0.002, dir: 'in' }, { sym: 'I_2', v: 0.005, dir: 'out' }], sym: 'I_3' }).v }), { I3: -0.003 }],
  ['kcl2', () => ({ I: S.kcl({ known: [{ sym: 'I_1', v: 0.010, dir: 'in' }, { sym: 'I_2', v: 0.005, dir: 'in' }, { sym: 'I_3', v: 0.003, dir: 'out' }], sym: 'I_4' }).v }), { I: 0.012 }],
  ['kvl1', () => ({ V2: S.kvl({ known: [{ sym: 'E', v: 12, sign: -1 }, { sym: 'V_1', v: 5, sign: 1 }], sym: 'V_2', sign: 1 }).v }), { V2: 7 }],
  ['millman1', () => {
    const spec = ladder([[e('E1', 12), r('R1', 100)], [r('R3', 200)], [e('E2', 6), r('R2', 300)]], [[], []]);
    spec.names = { T0: 'A' };
    const m = M.solve(CI.toNetlist(spec));
    // le correnti dei generatori: I1 erogata da E1 (verso l'alto), I2 erogata da E2
    return { VAB: S.millman({ branches: [{ E: 12, R: 100 }, { E: 0, R: 200 }, { E: 6, R: 300 }] }).v, VABn: m.V('A'), I3: m.I('R3'), I1: m.I('R1') * -1, I2: -m.I('R2') };
  }, { VAB: 7.636363636, VABn: 7.636363636, I3: 0.03818181818, I1: 0.04363636364, I2: -0.005454545455 }],
  ['millman2', () => ({ VAB: S.millman({ branches: [{ E: 12, R: 100 }, { E: 0, R: 200 }, { E: 12, R: 300 }] }).v }), { VAB: 8.727272727 }],
  ['millman3', () => {
    const spec = ladder([[e('E1', 10), r('R1', 1000)], [r('R3', 1000)], [e('E2', 5), r('R2', 2000)]], [[], []]);
    spec.names = { T0: 'A' };
    const m = M.solve(CI.toNetlist(spec));
    return { VAB: m.V('A'), I3: m.I('R3'), I2: -m.I('R2') };
  }, { VAB: 5, I3: 0.005, I2: 0 }],
  ['thevenin1', () => { const spec = ladder([[e('V1', 12)], [r('R2', 2000)], [r('RL', 1000)]], [[r('R1', 1000)], []]); return { Vth: S.thevenin({ spec, port: 2, find: 'Vth' }).v, Rth: S.thevenin({ spec, port: 2, find: 'Rth' }).v, IN: S.thevenin({ spec, port: 2, find: 'IN' }).v }; }, { Vth: 8, Rth: 666.6666667, IN: 0.012 }],
  ['thevenin2', () => { const spec = ladder([[e('V1', 12)], [r('R2', 2000)], [r('RL', 1000)]], [[r('R1', 1000)], [r('R3', 500)]]); return { Rth: S.thevenin({ spec, port: 2, find: 'Rth' }).v, IL: S.thevenin({ spec, port: 2, RL: 1000, find: 'IL' }).v, VL: S.thevenin({ spec, port: 2, RL: 1000, find: 'VL' }).v }; }, { Rth: 1166.666667, IL: 0.003692307692, VL: 3.692307692 }],
  ['thevenin3', () => { const spec = ladder([[e('V1', 24)], [r('R2', 3000)], [r('RL', 2000)]], [[r('R1', 6000)], []]); const t = S.thevenin({ spec, port: 2, find: 'Vth' }).v, rt = S.thevenin({ spec, port: 2, find: 'Rth' }).v; return { Vth: t, Rth: rt, IL: S.thevenin({ spec, port: 2, RL: 2000, find: 'IL' }).v, Pmax: S.maxPower({ Vth: t, Rth: rt }).v }; }, { Vth: 8, Rth: 2000, IL: 0.002, Pmax: 0.008 }],
  ['norton1', () => { const spec = ladder([[e('V1', 10)], [r('R2', 400)], [r('RL', 1000)]], [[r('R1', 100)], []]); return { IN: S.norton({ spec, port: 2 }).v }; }, { IN: 0.1 }],
  ['potenza-massima', () => ({ Pmax: S.maxPower({ Vth: 12, Rth: 50 }).v }), { Pmax: 0.72 }],
  ['thevenin-corrente', () => { const t = M.thevenin(net([{ id: 'I1', t: 'I', a: 'A', b: '0', v: 0.01 }, R('R1', 'A', '0', 1000)]), 'A', '0'); return { Vth: t.vth.re, Rth: t.zth.re }; }, { Vth: 10, Rth: 1000 }],
  ['sovrapposizione1', () => { const spec = ladder([[e('E1', 12), r('R1', 100)], [r('R3', 200)], [e('E2', 6), r('R2', 300)]], [[], []]); const s = S.superposition({ spec, target: 'R3' }); return { I3a: s.steps[0].v, I3b: s.steps[1].v, I3: s.v }; }, { I3a: 0.03272727273, I3b: 0.005454545455, I3: 0.03818181818 }],
  ['sovrapposizione2', () => { const spec = ladder([[e('E1', 10), r('R1', 1000)], [r('R3', 1000)], [e('E2', 5), r('R2', 2000)]], [[], []]); const s = S.superposition({ spec, target: 'R3' }); return { I3a: s.steps[0].v, I3b: s.steps[1].v }; }, { I3a: 0.004, I3b: 0.001 }],
  ['C-parallelo', () => ({ C: S.capacitors({ C: [10e-6, 22e-6, 47e-6], conn: 'par' }).v }), { C: 7.9e-05 }],
  ['C-serie', () => ({ C: S.capacitors({ C: [10e-6, 22e-6], conn: 'ser' }).v }), { C: 6.875e-06 }],
  ['C-carica', () => ({ Q: S.capCharge({ find: 'Q', C: 100e-6, V: 12 }).v }), { Q: 0.0012 }],
  ['C-energia', () => ({ W: S.capEnergy({ C: 470e-6, V: 25 }).v }), { W: 0.146875 }],
  ['L-tensione', () => ({ v: S.indVoltage({ L: 10e-3, dI: 2, dt: 1e-3 }).v }), { v: 20 }],
  ['L-energia', () => ({ W: S.indEnergy({ L: 0.1, I: 0.5 }).v }), { W: 0.0125 }],
  ['periodo', () => ({ T: S.sinusoid({ find: 'T', f: 50 }).v, w: S.sinusoid({ find: 'omega', f: 50 }).v }), { T: 0.02, w: 314.1592654 }],
  ['efficace', () => ({ Veff: S.sinusoid({ find: 'Veff', Vp: 325 }).v, Vp: S.sinusoid({ find: 'Vp', Veff: 230 }).v, Vpp: S.sinusoid({ find: 'Vpp', Vp: 230 * Math.SQRT2 }).v }), { Veff: 229.8097039, Vp: 325.2691193, Vpp: 650.5382387 }],
  ['medio', () => ({ semi: S.sinusoid({ find: 'Vmed', Vp: 10 }).v, doppia: S.sinusoid({ find: 'Vmed', Vp: 10, wave: 'doppia' }).v }), { semi: 3.183098862, doppia: 6.366197724 }],
  ['XL', () => ({ X: S.reactance({ kind: 'L', L: 0.1, f: 50 }).v }), { X: 31.41592654 }],
  ['XC', () => ({ X: S.reactance({ kind: 'C', C: 10e-6, f: 50 }).v }), { X: 318.3098862 }],
  ['RC-serie', () => {
    const p = { R: 1000, C: 100e-9, f: 1000, V: 10 };
    const w = 2 * Math.PI * 1000;
    const m = M.solve(net([V('V1', '1', '0', 10), R('R1', '1', '2', 1000), { id: 'C1', t: 'C', a: '2', b: '0', v: 100e-9 }]), { omega: w });
    // la fase di Z è l'opposto della fase della corrente rispetto alla tensione
    return { Z: S.seriesAC(Object.assign({ find: 'Z' }, p)).v, phi: S.seriesAC(Object.assign({ find: 'phi' }, p)).v, I: S.seriesAC(Object.assign({ find: 'I' }, p)).v, In: X.abs(m.Ic('R1')), phin: -X.argDeg(m.Ic('R1')) };
  }, { Z: 1879.635494, phi: -57.85809236, I: 0.005320180445, In: 0.005320180445, phin: -57.85809236 }],
  ['RL-serie', () => ({ Z: S.seriesAC({ R: 100, L: 0.1, f: 100, V: 1, find: 'Z' }).v, phi: S.seriesAC({ R: 100, L: 0.1, f: 100, V: 1, find: 'phi' }).v }), { Z: 118.1009812, phi: 32.14190764 }],
  ['RLC-serie', () => { const p = { R: 100, L: 0.1, C: 10e-6, f: 100, V: 230 }; const g = (f) => S.seriesAC(Object.assign({ find: f }, p)).v; return { X: g('X'), Z: g('Z'), I: g('I'), P: g('P'), Q: g('Q'), S: g('S'), phi: g('phi') }; }, { X: -96.32309002, Z: 138.8457334, I: 1.656514712, P: 274.4040991, Q: 264.3145074, S: 380.9983838, phi: -43.92704013 }],
  ['risonanza', () => { const p = { L: 0.01, C: 100e-9, R: 10 }; return { f0: S.resonance(Object.assign({ find: 'f0' }, p)).v, Q: S.resonance(Object.assign({ find: 'Q' }, p)).v, B: S.resonance(Object.assign({ find: 'B' }, p)).v }; }, { f0: 5032.92121, Q: 31.6227766, B: 159.1549431 }],
  ['potenze', () => ({ P: S.powerAC({ V: 230, I: 5, phi: 30, find: 'P' }).v, Q: S.powerAC({ V: 230, I: 5, phi: 30, find: 'Q' }).v, S: S.powerAC({ V: 230, I: 5, phi: 30, find: 'S' }).v }), { P: 995.9292144, Q: 575, S: 1150 }],
  ['rifasamento', () => { const s = S.pfCorrection({ P: 1000, V: 230, f: 50, cos1: 0.7, cos2: 0.95 }); return { Qc: s.steps[0].v, C: s.v }; }, { Qc: 691.519956, C: 4.16101396e-05 }],
  ['sfasamento', () => ({ phi: S.phaseShift({ dt: 0.002, T: 0.02 }).v }), { phi: 36 }],
  ['RLC-parallelo', () => { const m = M.solve(net([V('V1', '1', '0', 10), R('R1', '1', '0', 100), { id: 'L1', t: 'L', a: '1', b: '0', v: 0.1 }, { id: 'C1', t: 'C', a: '1', b: '0', v: 10e-6 }]), { omega: 2 * Math.PI * 100 }); return { I: X.abs(m.Ic('V1')) }; }, { I: 0.1388457334 }],
  ['passa-basso-fc', () => { const f = 1000, C = 1 / (2 * Math.PI * f * 1000); const m = M.solve(net([V('V1', '1', '0', 1), R('R1', '1', '2', 1000), { id: 'C1', t: 'C', a: '2', b: '0', v: C }]), { omega: 2 * Math.PI * f }); return { mod: X.abs(m.Vc('2')), phi: X.argDeg(m.Vc('2')) }; }, { mod: 0.7071067812, phi: -45 }],
  ['passa-alto-fc', () => { const f = 1000, C = 1 / (2 * Math.PI * f * 1000); const m = M.solve(net([V('V1', '1', '0', 1), { id: 'C1', t: 'C', a: '1', b: '2', v: C }, R('R1', '2', '0', 1000)]), { omega: 2 * Math.PI * f }); return { mod: X.abs(m.Vc('2')), phi: X.argDeg(m.Vc('2')) }; }, { mod: 0.7071067812, phi: 45 }],
  ['diodo-soglia', () => ({ I: M.solve(net([V('V1', '1', '0', 5), R('R1', '1', '2', 1000), { id: 'D1', t: 'D', a: '2', b: '0' }])).I('D1'), Iid: M.solve(net([V('V1', '1', '0', 5), R('R1', '1', '2', 1000), { id: 'D1', t: 'D', model: 'ideale', a: '2', b: '0' }])).I('D1') }), { I: 0.0043, Iid: 0.005 }],
  ['led', () => ({ I: M.solve(net([V('V1', '1', '0', 9), R('R1', '1', '2', 330), { id: 'D1', t: 'LED', vf: 2, a: '2', b: '0' }])).I('D1') }), { I: 0.02121212121 }],
  ['diodi-serie', () => ({ I: M.solve(net([V('V1', '1', '0', 12), R('R1', '1', '2', 1000), { id: 'D1', t: 'D', a: '2', b: '3' }, { id: 'D2', t: 'D', a: '3', b: '0' }])).I('R1') }), { I: 0.0106 }],
  ['zener1', () => { const m = M.solve(net([V('V1', '1', '0', 12), R('R1', '1', '2', 470), { id: 'DZ', t: 'DZ', vz: 5.1, a: '0', b: '2' }, R('RL', '2', '0', 1000)])); return { VL: m.V('2'), IR: m.I('R1'), IL: m.I('RL'), IZ: -m.I('DZ') }; }, { VL: 5.1, IR: 0.01468085106, IL: 0.0051, IZ: 0.009580851064 }],
  ['zener2', () => ({ VL: M.solve(net([V('V1', '1', '0', 12), R('R1', '1', '2', 470), { id: 'DZ', t: 'DZ', vz: 5.1, a: '0', b: '2' }, R('RL', '2', '0', 200)])).V('2') }), { VL: 3.582089552 }],
  ['bjt-sat', () => { const m = M.solve(net([V('VCC', 'cc', '0', 12), V('VI', 'in', '0', 5), R('RB', 'in', 'b', 10000), R('RC', 'cc', 'c', 1000), { id: 'Q1', t: 'Q', c: 'c', b: 'b', e: '0', beta: 100 }])); return { IB: m.I('Q1.ib'), IC: m.I('Q1.ic'), VCE: m.V('c') }; }, { IB: 0.00043, IC: 0.0118, VCE: 0.2 }],
  ['bjt-att', () => { const m = M.solve(net([V('VCC', 'cc', '0', 12), V('VI', 'in', '0', 5), R('RB', 'in', 'b', 470000), R('RC', 'cc', 'c', 1000), { id: 'Q1', t: 'Q', c: 'c', b: 'b', e: '0', beta: 100 }])); return { IB: m.I('Q1.ib'), IC: m.I('Q1.ic'), VCE: m.V('c') }; }, { IB: 9.14893617e-06, IC: 0.000914893617, VCE: 11.08510638 }],
  ['bjt-partitore', () => { const m = M.solve(net([V('VCC', 'cc', '0', 12), R('R1', 'cc', 'b', 47000), R('R2', 'b', '0', 10000), R('RC', 'cc', 'c', 2200), R('RE', 'e', '0', 1000), { id: 'Q1', t: 'Q', c: 'c', b: 'b', e: 'e', beta: 100 }])); return { IB: m.I('Q1.ib'), IC: m.I('Q1.ic'), VCE: m.V('c') - m.V('e') }; }, { IB: 1.286333708e-05, IC: 0.001286333708, VCE: 7.870868797 }],
  ['mosfet', () => ({ ID: M.solve(net([V('VDD', 'dd', '0', 12), V('VG', 'g', '0', 5), R('RD', 'dd', 'd', 100), { id: 'M1', t: 'M', d: 'd', g: 'g', s: '0', vth: 2, ron: 0.1 }])).I('RD') }), { ID: 0.1198801199 }],
  ['invertente', () => ({ Vo: M.solve(net([V('VI', 'in', '0', 0.5), R('R1', 'in', 'n', 1000), R('RF', 'n', 'o', 10000), { id: 'OA', t: 'OA', p: '0', n: 'n', o: 'o', vpos: 12, vneg: -12 }])).V('o') }), { Vo: -5 }],
  ['invertente-sat', () => ({ Vo: M.solve(net([V('VI', 'in', '0', 2), R('R1', 'in', 'n', 1000), R('RF', 'n', 'o', 10000), { id: 'OA', t: 'OA', p: '0', n: 'n', o: 'o', vpos: 12, vneg: -12 }])).V('o') }), { Vo: -12 }],
  ['non-invertente', () => ({ Vo: M.solve(net([V('VI', 'in', '0', 1), R('R1', 'n', '0', 1000), R('RF', 'n', 'o', 4700), { id: 'OA', t: 'OA', p: 'in', n: 'n', o: 'o', vpos: 12, vneg: -12 }])).V('o') }), { Vo: 5.7 }],
  ['inseguitore', () => ({ Vo: M.solve(net([V('VI', 'in', '0', 3.3), { id: 'W1', t: 'W', a: 'o', b: 'n' }, { id: 'OA', t: 'OA', p: 'in', n: 'n', o: 'o', vpos: 12, vneg: -12 }])).V('o') }), { Vo: 3.3 }],
  ['sommatore', () => ({ Vo: M.solve(net([V('V1', 'a', '0', 1), V('V2', 'b', '0', 0.5), R('R1', 'a', 'n', 10000), R('R2', 'b', 'n', 10000), R('RF', 'n', 'o', 20000), { id: 'OA', t: 'OA', p: '0', n: 'n', o: 'o', vpos: 12, vneg: -12 }])).V('o') }), { Vo: -3 }],
  ['differenziale', () => ({ Vo: M.solve(net([V('V1', 'a', '0', 1), V('V2', 'b', '0', 1.5), R('R1', 'a', 'n', 10000), R('R2', 'n', 'o', 20000), R('R3', 'b', 'p', 10000), R('R4', 'p', '0', 20000), { id: 'OA', t: 'OA', p: 'p', n: 'n', o: 'o', vpos: 12, vneg: -12 }])).V('o') }), { Vo: 1 }],
  ['comparatore', () => ({
    Vo1: M.solve(net([V('VP', 'p', '0', 2), V('VN', 'n', '0', 1), { id: 'OA', t: 'OA', open: true, p: 'p', n: 'n', o: 'o', vpos: 12, vneg: -12 }])).V('o'),
    Vo2: M.solve(net([V('VP', 'p', '0', 1), V('VN', 'n', '0', 2), { id: 'OA', t: 'OA', open: true, p: 'p', n: 'n', o: 'o', vpos: 12, vneg: -12 }])).V('o'),
  }), { Vo1: 12, Vo2: -12 }],
];
for (const [name, run, exp] of REF) {
  let got;
  try { got = run(); } catch (x) { err(`${name}: eccezione ${x.message}`); continue; }
  // il risolutore e l'analisi nodale (con la piccola conduttanza verso massa) devono dare il riferimento entro 10⁻⁶
  expect(name, got, exp, 1e-6);
}
const nRef = REF.length;

/* ---------- 2. Controlli incrociati su reti casuali ---------- */
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const E12 = U.seriesValues('E12', 10, 1e6);
let idn = 0;
const rr = () => ({ id: 'R' + ++idn, t: 'R', v: pick(E12) });
// rete a scala casuale: generatore nella colonna 0, da 1 a 4 colonne di resistori, tratti in serie o in parallelo
function randomLadder(ac) {
  idn = 0;
  const n = 2 + Math.floor(rnd() * 4);
  const elem = () => {
    if (!ac) return rr();
    const k = rnd();
    idn++;
    if (k < 0.5) return { id: 'R' + idn, t: 'R', v: pick(E12) };
    if (k < 0.75) return { id: 'L' + idn, t: 'L', v: pick([1e-3, 4.7e-3, 10e-3, 47e-3, 0.1, 0.47]) };
    return { id: 'C' + idn, t: 'C', v: pick([1e-9, 10e-9, 100e-9, 1e-6, 10e-6]) };
  };
  const group = () => { const k = rnd(); if (k < 0.6) return [elem()]; if (k < 0.85) return [elem(), elem()]; return [{ par: [[elem()], [elem()]] }]; };
  const cols = [[{ id: 'V1', t: 'V', v: pick([5, 9, 12, 15, 24]) }]];
  const top = [];
  for (let i = 1; i < n; i++) { cols.push(rnd() < 0.9 || i === n - 1 ? group() : null); top.push(rnd() < 0.8 ? group() : []); }
  // l'ultimo tratto alto con un filo e senza resistori sarebbe un corto sul generatore: nella colonna 1 ci va sempre un resistore in serie
  if (!top[0].length) top[0] = [elem()];
  return { cols, top };
}
let ladders = 0, acLadders = 0, theveninChecks = 0, superChecks = 0;
for (let k = 0; k < 2000; k++) {
  const ac = k % 2 === 1;
  const spec = randomLadder(ac);
  const omega = ac ? 2 * Math.PI * pick([50, 100, 1000, 10000]) : 0;
  const netl = CI.toNetlist(spec);
  let m;
  try { m = M.solve(netl, { omega }); } catch (x) { continue; }
  const tree = CI.seenFrom(spec, 0);
  let red;
  try { red = CI.reduce(tree, { omega }); } catch (x) { continue; } // risonanze esatte: impedenza infinita
  const I = X.neg(m.Ic('V1'));
  // 1) impedenza equivalente: tensione del generatore / corrente erogata
  const zMNA = X.div(W(12 && spec.cols[0][0].v), I);
  if (!X.within(zMNA, W(red.z), 1e-6)) err(`scala ${k}: Z equivalente ${X.fmtRect(W(red.z))} (riduzione) ≠ ${X.fmtRect(zMNA)} (nodale)`);
  // 2) corrente in ogni resistore con il ritorno indietro
  const bp = CI.backprop(red, I);
  for (const [id, x] of bp.leaves) {
    const mi = m.Ic(id);
    const bi = W(x.i);
    // il verso di riferimento può essere opposto (dipende da come il ramo è attraversato): si confronta il modulo
    if (Math.abs(X.abs(mi) - X.abs(bi)) > 1e-6 * Math.max(X.abs(bi), 1e-9) + 1e-12) err(`scala ${k}: corrente in ${id} ${X.abs(bi)} (ritorno indietro) ≠ ${X.abs(mi)} (nodale)`);
  }
  if (ac) acLadders++; else ladders++;
  // 3) Thevenin visto dall'ultima colonna: porta aperta + generatore di prova (MNA) contro riduzione con i generatori spenti
  if (!ac) {
    const last = spec.cols.length - 1;
    if (!spec.cols[last]) continue;
    const open = S.withoutPort(spec, last);
    const th = M.thevenin(CI.toNetlist(open), 'A', '0');
    const rRed = CI.reduce(CI.seenFrom(spec, last)).z;
    if (!near(th.zth.re, rRed, 1e-6)) err(`scala ${k}: R di Thevenin ${th.zth.re} (nodale) ≠ ${rRed} (riduzione)`);
    // la corrente nel carico dal circuito equivalente e dalla rete completa
    const load = spec.cols[last].length === 1 && spec.cols[last][0].t === 'R' ? spec.cols[last][0] : null;
    if (load) {
      const IL = th.vth.re / (th.zth.re + load.v);
      if (!near(Math.abs(m.I(load.id)), Math.abs(IL), 1e-6)) err(`scala ${k}: corrente nel carico ${m.I(load.id)} ≠ Thevenin ${IL}`);
      theveninChecks++;
    }
  }
}
// sovrapposizione: due e tre generatori in colonna, contro la soluzione completa
for (let k = 0; k < 1000; k++) {
  idn = 0;
  const n = 3 + Math.floor(rnd() * 2);
  const cols = [], top = [];
  for (let i = 0; i < n; i++) {
    const withE = i === 0 || i === n - 1 || rnd() < 0.3;
    cols.push(withE ? [{ id: 'E' + (i + 1), t: 'V', v: pick([3, 5, 6, 9, 12, 15]), rev: rnd() < 0.3 }, rr()] : [rr()]);
    if (i < n - 1) top.push(rnd() < 0.6 ? [rr()] : []);
  }
  const spec = { cols, top };
  const netl = CI.toNetlist(spec);
  const full = M.solve(netl);
  const target = netl.elements.filter((x) => x.t === 'R')[Math.floor(rnd() * 3)].id;
  const sp = S.superposition({ spec, target });
  if (!near(sp.v, full.I(target), 1e-6)) err(`sovrapposizione ${k}: ${sp.v} ≠ ${full.I(target)}`);
  superChecks++;
  // con tutti i rami fra gli stessi due nodi (top tutti fili) vale Millman
  if (top.every((t) => !t.length)) {
    const branches = cols.map((c) => { const E0 = c.find((x) => x.t === 'V'); const Rr = c.find((x) => x.t === 'R'); return { E: E0 ? (E0.rev ? -E0.v : E0.v) : 0, R: Rr.v }; });
    const vm = S.millman({ branches }).v;
    const spec2 = Object.assign({}, spec, { names: { T0: 'A' } });
    const vA = M.solve(CI.toNetlist(spec2)).V('A');
    if (!near(vm, vA, 1e-6)) err(`Millman ${k}: ${vm} ≠ ${vA}`);
  }
}

/* ---------- 3. Numeri, unità, serie E, codice colori, complessi ---------- */
const fmtCases = [
  [4700, 'Ω', {}, '4,7 kΩ'], [0.0043, 'A', {}, '4,3 mA'], [-12, 'V', {}, '−12 V'], [1500000, 'Ω', {}, '1,5 MΩ'], [0.000047, 'F', {}, '47 µF'],
  [100e-9, 'F', {}, '100 nF'], [0.02, 's', {}, '20 ms'], [5400, 's', {}, '5400 s'], [50, 'Hz', {}, '50 Hz'], [5032.92, 'Hz', {}, '5,03 kHz'],
  [0.0125, 'A', { prefixes: ['', 'm'] }, '12,5 mA'], [0.0125, 'A', { prefixes: [''] }, '0,0125 A'], [4700, 'Ω', { prefixes: [''] }, '4700 Ω'],
  [12345, 'Ω', { prefixes: [''], sig: 5 }, '12 345 Ω'], [-57.86, '°', {}, '−57,9°'], [25, '°C', {}, '25 °C'], [0, 'V', {}, '0 V'], [999.96, 'Ω', {}, '1 kΩ'],
];
for (const [v, u, o, want] of fmtCases) { checks++; const got = U.fmt(v, u, o).replace(/ /g, ' ').replace(/ /g, ' '); if (got !== want) err(`scrittura: ${v} ${u} → «${got}» invece di «${want}»`); }
const parseCases = [
  ['4,7 k', 4700, null], ['4700', 4700, null], ['4,7e3', 4700, null], ['4k7', 4700, null], ['4,7·10^3 Ω', 4700, 'Ω'], ['4.7kΩ', 4700, 'Ω'], ['4,7 KOhm', 4700, 'Ω'],
  ['2M2', 2.2e6, null], ['R47', 0.47, null], ['4R7', 4.7, null], ['12 mA', 0.012, 'A'], ['12mA', 0.012, 'A'], ['500 µA', 500e-6, 'A'], ['500 uA', 500e-6, 'A'],
  ['−3 dB', -3, 'dB'], ['-0,5 V', -0.5, 'V'], ['100 nF', 100e-9, 'F'], ['10 µF', 10e-6, 'F'], ['47n', 47e-9, null], ['1 000 000', 1e6, null],
  ['3 kWh', 3000, 'Wh'], ['50 Hz', 50, 'Hz'], ['2,5 kHz', 2500, 'Hz'], ['20 ms', 0.02, 's'], ['0,5', 0.5, null], [',5', 0.5, null], ['1,2 mC', 1.2e-3, 'C'], ['36°', 36, '°'],
];
for (const [s, v, u] of parseCases) { checks++; const p = U.parse(s); if (!p.ok || !near(p.value, v, 1e-9) || p.unit !== u) err(`lettura: «${s}» → ${JSON.stringify(p)} invece di ${v} ${u}`); }
for (const s of ['4.700', 'abc', '4,7 Xq', '4,7,1', '']) { checks++; if (U.parse(s).ok) err(`lettura: «${s}» non doveva essere accettato`); }
// confronto: unità mancante segnalata, unità sbagliata respinta, tolleranza 1 %
const ck = (s, v, u) => U.check(s, { v, u });
const cmp = [['4,7 kΩ', 4700, 'Ω', true, 'ok'], ['4700', 4700, 'Ω', true, 'mancante'], ['4,7 kV', 4700, 'Ω', false, 'sbagliata'], ['4,74 k', 4700, 'Ω', true, 'mancante'], ['4,8 k', 4700, 'Ω', false, 'mancante'], ['4,7', 4700, 'Ω', false, 'mancante']];
for (const [s, v, u, ok, us] of cmp) { checks++; const c = ck(s, v, u); if (c.ok !== ok || c.unitStatus !== us) err(`confronto «${s}» con ${v} ${u}: ${JSON.stringify(c)}`); }
// serie E e codice colori
const eCases = [[4300, 'E12', 4700], [4300, 'E24', 4300], [1000, 'E12', 1000], [5000, 'E12', 4700], [5200, 'E12', 5600], [150, 'E24', 150], [1.05e5, 'E12', 1e5]];
for (const [v, s, want] of eCases) { checks++; if (U.nearest(v, s) !== want) err(`serie ${s}: vicino a ${v} → ${U.nearest(v, s)} invece di ${want}`); }
checks++; if (U.nextUp(4300, 'E12') !== 4700 || U.nextDown(4300, 'E12') !== 3900) err('serie E12: valori sopra e sotto 4300');
checks++; if (U.seriesValues('E12', 1, 9.99).length !== 12 || U.seriesValues('E24', 1, 9.99).length !== 24) err('serie E: numero di valori per decade');
const bands = [[4700, 4, 5, ['giallo', 'viola', 'rosso', 'oro']], [10, 4, 5, ['marrone', 'nero', 'nero', 'oro']], [1, 4, 5, ['marrone', 'nero', 'oro', 'oro']], [0.47, 4, 10, ['giallo', 'viola', 'argento', 'argento']],
  [220000, 4, 5, ['rosso', 'rosso', 'giallo', 'oro']], [4700, 5, 1, ['giallo', 'viola', 'nero', 'marrone', 'marrone']], [100, 5, 1, ['marrone', 'nero', 'nero', 'nero', 'marrone']], [3.3e6, 4, 5, ['arancio', 'arancio', 'verde', 'oro']]];
for (const [v, n, tol, want] of bands) {
  checks += 2;
  const b = U.toBands(v, n, tol);
  if (JSON.stringify(b) !== JSON.stringify(want)) err(`codice colori di ${v}: ${b} invece di ${want}`);
  const f = U.fromBands(want);
  if (!f || !near(f.v, v, 1e-9) || f.tol !== tol) err(`valore dalle bande ${want}: ${JSON.stringify(f)}`);
}
// andata e ritorno su tutti i valori E24 da 1 Ω a 10 MΩ, a 4 e a 5 bande
for (const v of U.seriesValues('E24', 1, 9.1e6)) for (const n of [4, 5]) { checks++; const b = U.toBands(v, n, n === 4 ? 5 : 1); const f = b && U.fromBands(b); if (!f || !near(f.v, v, 1e-9)) err(`codice colori: ${v} a ${n} bande non torna (${b})`); }
// complessi
const cxCases = [['3+j4', 3, 4], ['3 - j4', 3, -4], ['j5', 0, 5], ['-j2,2', 0, -2.2], ['5∠53,13°', 3, 4], ['10∠-90', 0, -10], ['(3+j4) Ω', 3, 4], ['4j', 0, 4], ['2+3j', 2, 3]];
for (const [s, re, im] of cxCases) { checks++; const p = X.parse(s); if (!p.ok || Math.abs(p.z.re - re) > 1e-3 || Math.abs(p.z.im - im) > 1e-3) err(`complesso «${s}» → ${p.ok ? X.fmtRect(p.z) : p.msg}`); }
const cf = [[X.C(3, -4), 'Ω', '(3 − j4) Ω'], [X.C(0, 1000), 'Ω', 'j1000 Ω'], [X.C(3, 4), '', '3 + j4']];
for (const [z, u, want] of cf) { checks++; const got = X.fmtRect(z, u).replace(/ /g, ' '); if (got !== want) err(`complesso scritto «${got}» invece di «${want}»`); }
checks++; if (X.fmtPolar(X.C(3, 4), 'Ω').replace(/ /g, ' ') !== '5∠53,1° Ω') err('forma polare: ' + X.fmtPolar(X.C(3, 4), 'Ω'));

/* ---------- 4. Formule e tracce ---------- */
// ogni passaggio di ogni risolutore si scrive in MathML e in testo senza errori; gli errori tipici esistono nel catalogo
const traces = [];
const probe = () => {
  const spec = ladder([[e('V1', 12)], [r('R2', 2000)], [r('RL', 1000)]], [[r('R1', 1000)], [r('R3', 470)]]);
  traces.push(S.network({ spec, V: 12, find: 'I:RL' }), S.network({ spec, V: 12, find: 'V:R3' }), S.thevenin({ spec, port: 2, RL: 1000, find: 'VL' }));
  traces.push(S.series({ R: [100, 220], V: 5, find: 'P1' }), S.parallel({ R: [100, 220, 330], V: 5, find: 'I' }), S.loadedDivider({ V: 9, R1: 1000, R2: 2200, RL: 4700 }));
  traces.push(S.energy({ P: 60, t: 7200, out: 'Wh' }), S.tolerance({ R: 330, tol: 10, find: 'max' }), S.kcl({ known: [{ sym: 'I_1', v: 0.004, dir: 'in' }], sym: 'I_2' }));
  for (const f of ['X', 'Z', 'phi', 'cosphi', 'I', 'VR', 'VL', 'VC', 'P', 'Q', 'S']) traces.push(S.seriesAC({ R: 100, L: 0.1, C: 10e-6, f: 50, V: 230, find: f }));
  traces.push(S.resonance({ L: 1e-3, C: 1e-6, R: 5, find: 'B' }), S.pfCorrection({ P: 2000, V: 230, f: 50, cos1: 0.6, cos2: 0.9 }), S.powerAC({ V: 230, I: 2, phi: 60, find: 'Q' }));
  for (const f of ['f', 'T', 'omega', 'Veff', 'Vp', 'Vpp', 'Vmed']) traces.push(S.sinusoid({ find: f, Vp: 10, Veff: 7, f: 50, T: 0.02 }));
  traces.push(S.capacitors({ C: [1e-6, 2.2e-6, 4.7e-6], conn: 'ser' }), S.capEnergy({ C: 1e-6, V: 10 }), S.indVoltage({ L: 0.01, dI: 0.5, dt: 0.001 }), S.millman({ branches: [{ E: 12, R: 100 }, { E: -5, R: 220 }] }));
  const two = ladder([[e('E1', 12), r('R1', 100)], [r('R3', 200)], [e('E2', 6), r('R2', 300)]], [[], []]);
  traces.push(S.superposition({ spec: two, target: 'R3' }));
};
probe();
let stepsChecked = 0;
for (const t of traces) {
  for (const s of t.steps) {
    for (const src of [s.f, s.s]) {
      stepsChecked++;
      try { const mm = MA.toMathML(src); if (!/^<math[\s>]/.test(mm) || /undefined|NaN/.test(mm)) err(`formula difettosa: ${src}`); MA.toText(src); MA.speak(src); } catch (x) { err(`formula non leggibile «${src}»: ${x.message}`); }
    }
    if (s.v != null && typeof s.v === 'number' && !isFinite(s.v)) err(`passaggio con valore non finito: ${s.f}`);
  }
  for (const m of t.mistakes) if (!MI.CATALOG[m.id]) err(`errore tipico senza scheda nel catalogo: ${m.id}`);
}
// il riconoscimento degli errori tipici non scambia mai la risposta giusta per un errore
for (const t of traces) { checks++; if (typeof t.v === 'number' && MI.match(t.v, t.mistakes, t.v)) err(`la risposta giusta di ${t.sym} è riconosciuta come errore`); }

console.log('\nTest del motore delle reti');
console.log(`  Problemi di riferimento: ${nRef} (risultati da formule chiuse, test/fixtures/riferimento.py)`);
console.log(`  Controlli incrociati: ${ladders} reti in continua e ${acLadders} in alternata (nodale contro riduzione e ritorno indietro), ${theveninChecks} Thevenin, ${superChecks} sovrapposizioni`);
console.log(`  Controlli puntuali: ${checks}; formule delle tracce scritte in MathML: ${stepsChecked}`);
console.log(errors.length ? `  Errori: ${errors.length}` : '  Nessun errore.');
[...new Set(errors)].slice(0, 60).forEach((x) => console.log('  ✗ ' + x));
if (errors.length) process.exitCode = 1;
