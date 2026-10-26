/* ELEKTRON — generatori dei problemi, seconda parte: numerazione, logica, alternata, reti sequenziali, semiconduttori,
   operazionale, filtri, generatori di forme d'onda, conversione, alimentatori, sensori; e i generatori «trasversali»
   (riconoscere il simbolo, abbinare grandezza, unità e simbolo) che pescano solo fra i concetti già incontrati (sc.known). */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const X = root.ElekCx || require('./cx.js');
  const MA = root.ElekMath || require('./math.js');
  const S = root.ElekSolve || require('./solve.js');
  const MI = root.ElekMistakes || require('./mistakes.js');
  const LG = root.ElekLogic || require('./logic.js');
  const NS = root.ElekNum || require('./numsys.js');
  const D = root.ElekDevices || require('./devices.js');
  const SG = root.ElekSignals || require('./signals.js');
  const PB = root.ElekProblems || require('./problems.js');
  const { G, pick, shuffle } = PB;
  const Q = (sc) => (v, u, paren) => MA.q(v, u, { prefixes: sc.prefixes, sig: 3, paren });
  const R_E12 = (r, lo, hi) => pick(r, U.seriesValues('E12', lo, hi));
  const distinct = (sol) => typeof sol.v !== 'number' || MI.distinct(sol.v, sol.mistakes, 0.03);
  const tryN = (n, f) => { for (let k = 0; k < n; k++) { const x = f(k); if (x) return x; } return null; };
  const step = (f, s, v, u) => ({ f, s, v, u });

  /* ======================= Unità 10: numerazione ======================= */
  G('num.dec2bin', { topic: 'u10', kind: 'base', uses: ['l.bin'] }, (sc, r) => {
    const n = 5 + Math.floor(r() * (sc.level >= 2 ? 250 : 58));
    const rows = NS.divisions(n, 2);
    return { text: `Scrivi in binario il numero decimale ${n}.`, sol: { sym: 'N_2', u: '', v: n, base: 2, steps: [step('"divisioni successive per 2"', rows.map((x) => `${x.n} : 2 = ${x.q} "resto" ${x.r}`).join('; '), null, ''), step('"resti dal basso"', `${n} = "${NS.toBase(n, 2)} in binario"`, n, '')], mistakes: [] } };
  });
  G('num.bin2dec', { topic: 'u10', kind: 'calc', uses: ['l.bin'] }, (sc, r) => {
    const n = 5 + Math.floor(r() * (sc.level >= 2 ? 250 : 58));
    const b = NS.toBase(n, 2, { group: false });
    const w = NS.weights(b, 2).filter((x) => x.v);
    return { text: `Quanto vale in decimale il numero binario ${NS.toBase(n, 2)}?`, sol: { sym: 'N', u: '', v: n, tol: 0, abs: 0.1, steps: [step('"somma dei pesi"', `${w.map((x) => `2^{${x.p}}`).join(' + ')} = ${w.map((x) => x.w).join(' + ')} = ${n}`, n, '')], mistakes: [{ id: 'resti-al-contrario', v: parseInt(b.split('').reverse().join(''), 2) }] } };
  });
  G('num.bin2hex', { topic: 'u10', kind: 'base', uses: ['l.bin', 'l.hex'] }, (sc, r) => {
    const n = 16 + Math.floor(r() * 4000);
    const nib = NS.nibbles(n.toString(2));
    return { text: `Scrivi in esadecimale il numero binario ${NS.toBase(n, 2)}.`, sol: { sym: 'N_16', u: '', v: n, base: 16, steps: [step('"gruppi di 4 bit da destra"', nib.map((x) => `"${x.bits}" → "${x.hex}"`).join('; '), n, '')], mistakes: [] } };
  });
  G('num.hex2bin', { topic: 'u10', kind: 'base', uses: ['l.bin', 'l.hex'] }, (sc, r) => {
    const n = 16 + Math.floor(r() * 4000);
    const h = NS.toBase(n, 16);
    return { text: `Scrivi in binario il numero esadecimale ${h}.`, sol: { sym: 'N_2', u: '', v: n, base: 2, steps: [step('"ogni cifra esadecimale diventa 4 bit"', h.split('').map((c) => `"${c}" → "${parseInt(c, 16).toString(2).padStart(4, '0')}"`).join('; '), n, '')], mistakes: [] } };
  });
  G('num.hex2dec', { topic: 'u10', kind: 'calc', uses: ['l.hex'] }, (sc, r) => {
    const n = 16 + Math.floor(r() * 4000);
    const h = NS.toBase(n, 16);
    const w = NS.weights(h, 16);
    return { text: `Quanto vale in decimale il numero esadecimale ${h}?`, sol: { sym: 'N', u: '', v: n, tol: 0, abs: 0.1, steps: [step('"somma dei pesi"', w.map((x) => `${x.v} * 16^{${x.p}}`).join(' + ') + ` = ${n}`, n, '')], mistakes: [] } };
  });
  G('num.bcd', { topic: 'u10', kind: 'base', uses: ['l.bcd', 'l.bin'] }, (sc, r) => {
    const n = 10 + Math.floor(r() * 990);
    return { text: `Scrivi in codice BCD il numero decimale ${n}.`, sol: { sym: 'BCD', u: '', v: n, bcd: true, steps: [step('"ogni cifra in 4 bit"', String(n).split('').map((d) => `${d} → "${(+d).toString(2).padStart(4, '0')}"`).join('; '), n, '')], mistakes: [] } };
  });
  G('num.c2', { topic: 'u10', kind: 'base', uses: ['l.c2', 'l.bin'] }, (sc, r) => {
    const bits = pick(r, [4, 8, 8]);
    const { min } = NS.range2(bits);
    const v = -1 - Math.floor(r() * (-min - 1));
    const st = NS.twosSteps(v, bits);
    return { text: `Scrivi ${v} in complemento a due su ${bits} bit.`, sol: { sym: 'N_2', u: '', v, base: 2, twos: true, bits, steps: [step('"modulo in binario"', `|${v}| = "${st.mod}"`, null, ''), step('"inverti i bit"', `"${st.inv}"`, null, ''), step('"aggiungi 1"', `"${st.inv}" + 1 = "${st.res}"`, v, '')], mistakes: [] } };
  });
  G('num.c2dec', { topic: 'u10', kind: 'calc', uses: ['l.c2'] }, (sc, r) => {
    const bits = 8;
    const v = -1 - Math.floor(r() * 127);
    const b = NS.toTwos(v, bits);
    return { text: `Quanto vale in decimale il numero ${b.replace(/(\d{4})(\d{4})/, '$1 $2')}, scritto in complemento a due su ${bits} bit?`, sol: { sym: 'N', u: '', v, tol: 0, abs: 0.1, steps: [step('"il primo bit è 1: il numero è negativo"', `-2^7 + ${parseInt(b.slice(1), 2)} = ${v}`, v, '')], mistakes: [{ id: 'segno', v: -v }, { id: 'complemento-uno', v: parseInt(b, 2) }] } };
  });
  G('num.range', { topic: 'u10', kind: 'calc', uses: ['l.c2', 'l.bin'] }, (sc, r) => {
    const n = pick(r, [4, 6, 8, 10, 12, 16]);
    const which = pick(r, ['max', 'min', 'senza']);
    const { min, max } = NS.range2(n);
    const v = which === 'max' ? max : which === 'min' ? min : 2 ** n - 1;
    return { text: which === 'senza' ? `Qual è il numero più grande che si scrive con ${n} bit senza segno?` : `Qual è il numero ${which === 'max' ? 'più grande' : 'più piccolo'} che si scrive in complemento a due con ${n} bit?`, sol: { sym: 'N', u: '', v, tol: 0, abs: 0.1, steps: [step(which === 'senza' ? 'N_{max} = 2^n - 1' : which === 'max' ? 'N_{max} = 2^{n-1} - 1' : 'N_{min} = -2^{n-1}', `${v}`, v, '')], mistakes: [{ id: 'bit-livelli', v: which === 'senza' ? 2 ** n : which === 'max' ? 2 ** (n - 1) : -(2 ** (n - 1)) + 1 }] } };
  });
  G('num.somma', { topic: 'u10', kind: 'base', levels: [2], uses: ['l.somma', 'l.bin'] }, (sc, r) => {
    const a = Math.floor(r() * 120), b = Math.floor(r() * 120);
    const s = NS.addBinary(a.toString(2), b.toString(2), 8);
    return { text: `Esegui la somma binaria ${NS.toBase(a, 2, { bits: 8 })} + ${NS.toBase(b, 2, { bits: 8 })} (8 bit).`, sol: { sym: 'S', u: '', v: a + b, base: 2, bits: 8, steps: [step('"colonna per colonna, con i riporti"', `"${NS.toBase(a, 2, { bits: 8, group: false })}" + "${NS.toBase(b, 2, { bits: 8, group: false })}" = "${s.sum}"`, a + b, '')], mistakes: [] } };
  });

  /* ======================= Unità 11–12: logica ======================= */
  const GATES2 = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'];
  G('porta.tabella', { topic: 'u11', kind: 'tabella', uses: ['l.porte'] }, (sc, r) => {
    const avail = GATES2.filter((g) => (sc.known ? sc.known.has('l.' + g.toLowerCase()) : true));
    const t = pick(r, avail.length ? avail : ['AND', 'OR']);
    const net = { inputs: ['A', 'B'], gates: [{ id: 'G1', type: t, in: ['A', 'B'] }], outputs: { Y: 'G1' } };
    const rows = LG.table((a) => LG.simulate(net, a).out.Y, ['A', 'B']);
    return { gateType: t, net, vars: ['A', 'B'], want: rows.map((x) => x.out), text: `Completa la tabella di verità della porta ${t}.`, sol: { sym: 'Y', u: '', v: 0, steps: [step(`"porta ${t}"`, `"${rows.map((x) => x.in.join('') + '→' + x.out).join(', ')}"`, null, '')], mistakes: [] } };
  });
  G('porta.riconosci', { topic: 'u11', kind: 'scelta', uses: ['l.porte'] }, (sc, r) => {
    const avail = GATES2.filter((g) => (sc.known ? sc.known.has('l.' + g.toLowerCase()) : true));
    // solo le porte già incontrate (con due sole porte la scelta è fra due)
    const pool = avail.length >= 2 ? avail : ['AND', 'OR'];
    const t = pick(r, pool);
    const net = { inputs: ['A', 'B'], gates: [{ id: 'G1', type: t, in: ['A', 'B'] }], outputs: { Y: 'G1' } };
    const rows = LG.table((a) => LG.simulate(net, a).out.Y, ['A', 'B']);
    return { table: { vars: ['A', 'B'], rows }, text: 'Quale porta ha questa tabella di verità?', choices: shuffle(r, pool).slice(0, 4).concat(pool.slice(0, 4).includes(t) ? [] : [t]).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4).concat([t]).filter((x, i, a) => a.indexOf(x) === i).map((x) => ({ label: x, gate: x, right: x === t, mistake: x === t ? null : 'porta-sbagliata' })), sol: { sym: 'porta', u: '', v: 0, steps: [step('"tabella"', `"è la porta ${t}"`, null, '')], mistakes: [] } };
  });
  // valore dell'uscita per un ingresso dato: espressione o rete
  function randExpr(r, vars, depth, ops) {
    if (depth === 0 || r() < 0.25) { const v = LG.V(pick(r, vars)); return r() < 0.3 ? LG.NOT(v) : v; }
    const a = randExpr(r, vars, depth - 1, ops), b = randExpr(r, vars, depth - 1, ops);
    const o = pick(r, ops);
    return o === 'and' ? LG.AND(a, b) : o === 'or' ? LG.OR(a, b) : o === 'xor' ? LG.XOR(a, b) : o === 'nand' ? LG.NOT(LG.AND(a, b)) : LG.NOT(LG.OR(a, b));
  }
  G('logica.valuta', { topic: 'u11', kind: 'bit', uses: ['l.porte', 'l.espressioni'] }, (sc, r) => tryN(20, () => {
    const vars = ['A', 'B', 'C'];
    const ops = ['and', 'or'].concat(sc.known && sc.known.has('l.xor') ? ['xor'] : []);
    const x = randExpr(r, vars, 2, ops);
    if (LG.varsOf(x).length < 2) return null;
    const a = { A: r() < 0.5 ? 1 : 0, B: r() < 0.5 ? 1 : 0, C: r() < 0.5 ? 1 : 0 };
    const v = LG.evalE(x, a);
    return { expr: x, text: `Quanto vale $Y$ con A = ${a.A}, B = ${a.B}, C = ${a.C}?`, logicExpr: LG.toMathML(x, 'Y'), sol: { sym: 'Y', u: '', v, tol: 0, abs: 0.1, steps: [step('"sostituisci i valori"', `Y = ${v}`, v, '')], mistakes: [{ id: 'negazione', v: 1 - v }] } };
  }));
  G('logica.schema', { topic: 'u11', kind: 'espressione', levels: [2], uses: ['l.porte', 'l.espressioni'] }, (sc, r) => tryN(20, () => {
    const vars = ['A', 'B', 'C'];
    const x = randExpr(r, vars, 2, ['and', 'or']);
    if (LG.varsOf(x).length < 2 || LG.literals(x) > 5) return null;
    const net = LG.netOf(x);
    return { net, text: 'Scrivi l’espressione dell’uscita Y della rete.', sol: { sym: 'Y', u: '', v: 0, expr: x, vars: LG.varsOf(x), steps: [step('"porta per porta, dagli ingressi"', `"Y = ${LG.text(x)}"`, null, '')], mistakes: [] } };
  }));
  G('logica.simula', { topic: 'u11', kind: 'simula', uses: ['l.porte', 'l.espressioni'] }, (sc, r) => tryN(30, () => {
    const vars = ['A', 'B', 'C'];
    const x = randExpr(r, vars, 2, ['and', 'or'].concat(sc.known && sc.known.has('l.xor') ? ['xor'] : []));
    const vs = LG.varsOf(x);
    const ones = LG.table(x, vs).filter((row) => row.out);
    if (vs.length < 2 || !ones.length || ones.length === 2 ** vs.length) return null;
    const net = LG.netOf(x);
    return { net, text: 'Tocca gli ingressi fino ad accendere l’uscita: Y deve valere 1.', target: 1, sol: { sym: 'Y', u: '', v: 1, expr: x, vars: vs, steps: [step('"combinazioni con Y = 1"', `"${ones.map((row) => row.in.join('')).join(', ')}"`, null, '')], mistakes: [] } };
  }));
  G('demorgan', { topic: 'u11', kind: 'scelta', uses: ['l.demorgan'] }, (sc, r) => {
    const cases = [["(A·B)'", "A' + B'", ["A'·B'", "A + B", "(A + B)'"]], ["(A + B)'", "A'·B'", ["A' + B'", "A·B", "(A·B)'"]], ["(A·B·C)'", "A' + B' + C'", ["A'·B'·C'", "(A + B + C)'", "A·B·C"]], ["(A' + B)'", "A·B'", ["A' + B'", "A'·B", "A + B'"]]];
    const [q, right, wrong] = pick(r, cases);
    const mm = (s) => LG.toMathML(LG.parse(s));
    return { text: 'Con i teoremi di De Morgan, a quale espressione equivale questa?', logicExpr: mm(q), choices: shuffle(r, [right].concat(wrong)).map((s) => ({ html: mm(s), label: LG.text(LG.parse(s)), right: s === right, mistake: s === right ? null : 'demorgan' })), sol: { sym: 'Y', u: '', v: 0, steps: [step('"De Morgan: si nega ogni termine e AND diventa OR (e viceversa)"', `"${LG.text(LG.parse(q))} = ${LG.text(LG.parse(right))}"`, null, '')], mistakes: [] } };
  });
  G('teoremi.semplifica', { topic: 'u11', kind: 'espressione', levels: [2], uses: ['l.teoremi'] }, (sc, r) => {
    const cases = [['A + A·B', 'A'], ['A·(A + B)', 'A'], ["A + A'·B", 'A + B'], ["A·B + A·B'", 'A'], ["(A + B)·(A + B')", 'A'], ["A·A'", '0'], ["A + A'", '1'], ['A·B + A·B·C', 'A·B']];
    const [e, right] = pick(r, cases);
    const x = LG.parse(e), y = LG.parse(right);
    return { logicExpr: LG.toMathML(x, 'Y'), text: 'Semplifica l’espressione con i teoremi dell’algebra di Boole.', sol: { sym: 'Y', u: '', v: 0, expr: y, vars: LG.varsOf(x).length ? LG.varsOf(x) : ['A'], minimal: true, steps: [step('"teoremi"', `"${LG.text(x)} = ${LG.text(y)}"`, null, '')], mistakes: [] } };
  });
  // dalla tabella alla forma canonica e alla forma minima
  function randFn(r, n, k0 = 0.3, k1 = 0.7) {
    for (;;) {
      const on = [];
      for (let m = 0; m < 2 ** n; m++) if (r() < k0 + (k1 - k0) * r()) on.push(m);
      if (on.length && on.length < 2 ** n) return on;
    }
  }
  G('canonica', { topic: 'u12', kind: 'espressione', uses: ['l.canon', 'l.espressioni'] }, (sc, r) => {
    const vars = ['A', 'B', 'C'];
    const on = randFn(r, 3, 0.2, 0.5).slice(0, 4);
    const can = LG.canonicalSOP(on, vars);
    return { table: { vars, rows: LG.table(can, vars) }, text: 'Scrivi la funzione come somma di prodotti (un prodotto per ogni riga con Y = 1).', sol: { sym: 'Y', u: '', v: 0, minterms: on, vars, steps: [step('"mintermini"', `"Y = Σm(${on.join(', ')}) = ${LG.text(can)}"`, null, '')], mistakes: [] } };
  });
  G('km.minima', { topic: 'u12', kind: 'espressione', levels: [2], uses: ['l.km', 'l.espressioni'] }, (sc, r) => {
    const n = sc.known && sc.known.has('l.km4') && r() < 0.6 ? 4 : r() < 0.3 ? 2 : 3;
    const vars = ['A', 'B', 'C', 'D'].slice(0, n);
    const on = randFn(r, n);
    const dc = sc.known && sc.known.has('l.dc') && n === 4 && r() < 0.5 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].filter((m) => !on.includes(m) && r() < 0.15) : [];
    const best = LG.minimalSOP(on, vars, dc);
    return { kmap: { on, dc, vars }, text: `Dalla mappa di Karnaugh ricava la forma minima ${dc.length ? '(le caselle «–» sono indifferenti) ' : ''}come somma di prodotti.`, sol: { sym: 'Y', u: '', v: 0, minterms: on, dc, vars, minimal: true, groups: best.implicants, steps: [step('"gruppi di 1 più grandi possibile (potenze di 2)"', `"Y = ${LG.text(best.expr)}"`, null, '')], mistakes: [] } };
  });
  G('km.riempi', { topic: 'u12', kind: 'kmap', uses: ['l.km'] }, (sc, r) => tryN(20, () => {
    const vars = ['A', 'B', 'C'];
    const x = randExpr(r, vars, 2, ['and', 'or']);
    const on = LG.mintermsOf(x, vars);
    if (!on.length || on.length === 8) return null;
    return { kmap: { on: [], vars }, logicExpr: LG.toMathML(x, 'Y'), text: 'Riempi la mappa di Karnaugh: tocca le caselle in cui Y vale 1.', sol: { sym: 'Y', u: '', v: 0, minterms: on, vars, steps: [step('"caselle a 1"', `"mintermini ${on.join(', ')}"`, null, '')], mistakes: [] } };
  }));
  G('mux.uscita', { topic: 'u12', kind: 'bit', uses: ['l.mux'] }, (sc, r) => {
    const data = [0, 1, 2, 3].map(() => (r() < 0.5 ? 1 : 0));
    const s = Math.floor(r() * 4);
    const v = LG.mux([s >> 1, s & 1], data);
    return { text: `Un multiplexer a 4 ingressi ha I₀ = ${data[0]}, I₁ = ${data[1]}, I₂ = ${data[2]}, I₃ = ${data[3]}. Con i selettori S₁ = ${s >> 1} e S₀ = ${s & 1}, quanto vale l’uscita?`, sol: { sym: 'Y', u: '', v, tol: 0, abs: 0.1, steps: [step('"S₁S₀ in binario sceglie l’ingresso"', `"S₁S₀ = ${s >> 1}${s & 1} = ${s} → Y = I_${s} = ${v}"`, v, '')], mistakes: [] } };
  });
  G('decoder.uscita', { topic: 'u12', kind: 'calc', uses: ['l.dec'] }, (sc, r) => {
    const s = Math.floor(r() * 8);
    return { text: `In un decoder da 3 a 8 gli ingressi sono A₂ = ${(s >> 2) & 1}, A₁ = ${(s >> 1) & 1}, A₀ = ${s & 1}. Quale uscita (da 0 a 7) è attiva?`, sol: { sym: 'Y', u: '', v: s, tol: 0, abs: 0.1, steps: [step('"il codice d’ingresso in decimale"', `"${(s >> 2) & 1}${(s >> 1) & 1}${s & 1}" = ${s}`, s, '')], mistakes: [{ id: 'resti-al-contrario', v: parseInt(s.toString(2).padStart(3, '0').split('').reverse().join(''), 2) }] } };
  });
  G('sommatore', { topic: 'u12', kind: 'bit', uses: ['l.adder'] }, (sc, r) => {
    const a = r() < 0.5 ? 1 : 0, b = r() < 0.5 ? 1 : 0, c = r() < 0.5 ? 1 : 0;
    const which = pick(r, ['S', 'C']);
    const fa = LG.fullAdder(a, b, c);
    const v = fa[which];
    return { text: `Un sommatore completo ha A = ${a}, B = ${b} e riporto d’ingresso C_in = ${c}. Quanto vale ${which === 'S' ? 'la somma S' : 'il riporto C_out'}?`, sol: { sym: which, u: '', v, tol: 0, abs: 0.1, steps: [step('"A + B + C_in"', `${a} + ${b} + ${c} = ${a + b + c} = "${(a + b + c).toString(2).padStart(2, '0')} in binario" → "S = ${fa.S}, C_out = ${fa.C}"`, v, '')], mistakes: [] } };
  });

  /* ======================= Unità 13: grandezze sinusoidali ======================= */
  const FREQ = [50, 60, 100, 200, 400, 500, 1000, 2000, 5000, 10000];
  G('sin.fT', { topic: 'u13', uses: ['q.f', 'q.T', 'f.fT'] }, (sc, r) => {
    const f = pick(r, FREQ);
    const find = pick(r, ['f', 'T']);
    const sol = find === 'f' ? S.sinusoid({ find: 'f', T: 1 / f }, sc) : S.sinusoid({ find: 'T', f }, sc);
    return { text: find === 'f' ? `Una sinusoide ha periodo $T = ${Q(sc)(1 / f, 's')}$. Quanto vale la frequenza?` : `Una sinusoide ha frequenza $f = ${Q(sc)(f, 'Hz')}$. Quanto vale il periodo?`, sol };
  });
  G('sin.valori', { topic: 'u13', uses: ['q.Vp', 'q.Veff', 'f.eff'] }, (sc, r) => {
    const find = pick(r, ['Veff', 'Vp', 'Vpp']);
    const Vp = pick(r, [5, 10, 12, 15, 17, 24, 325]), Veff = pick(r, [6, 9, 12, 24, 230]);
    const sol = S.sinusoid({ find, Vp, Veff }, sc);
    return { text: find === 'Veff' ? `Una tensione sinusoidale ha valore di picco $V_p = ${Q(sc)(Vp, 'V')}$. Quanto vale il valore efficace?` : find === 'Vp' ? `Una tensione sinusoidale ha valore efficace $V_{eff} = ${Q(sc)(Veff, 'V')}$. Quanto vale il valore di picco?` : `Una tensione sinusoidale ha valore di picco $V_p = ${Q(sc)(Vp, 'V')}$. Quanto vale il valore picco-picco?`, sol };
  });
  G('sin.medio', { topic: 'u13', levels: [2], uses: ['q.Vp', 'f.medio'] }, (sc, r) => {
    const Vp = pick(r, [5, 10, 12, 15, 24]), wave = pick(r, ['semi', 'doppia']);
    const sol = S.sinusoid({ find: 'Vmed', Vp, wave }, sc);
    return { text: `Quanto vale il valore medio di una sinusoide di picco $V_p = ${Q(sc)(Vp, 'V')}$ raddrizzata a ${wave === 'semi' ? 'semionda' : 'doppia semionda'}?`, sol };
  });
  G('sin.omega', { topic: 'u13', uses: ['q.w', 'q.f', 'f.omega'] }, (sc, r) => {
    const f = pick(r, FREQ);
    const sol = S.sinusoid({ find: 'omega', f }, sc);
    return { text: `Quanto vale la pulsazione di una sinusoide a $f = ${Q(sc)(f, 'Hz')}$?`, sol };
  });
  G('sin.fase', { topic: 'u13', levels: [2], uses: ['q.phi', 'q.T', 'f.fase'] }, (sc, r) => {
    const T = 1 / pick(r, [50, 100, 1000]), k = pick(r, [1 / 8, 1 / 6, 1 / 4, 1 / 3, 1 / 12, 1 / 2]);
    const sol = S.phaseShift({ dt: T * k, T }, sc);
    sol.abs = 0.5;
    return { text: `Due sinusoidi con lo stesso periodo $T = ${Q(sc)(T, 's')}$ sono sfasate di $Delta t = ${Q(sc)(T * k, 's')}$. Quanto vale lo sfasamento in gradi?`, sol };
  });
  G('sin.radianti', { topic: 'u13', uses: ['m.rad'] }, (sc, r) => {
    const deg = pick(r, [30, 45, 60, 90, 120, 180, 270, 360]);
    const v = deg * Math.PI / 180;
    return { text: `Quanto vale l’angolo di ${deg}° in radianti?`, sol: { sym: 'alpha', u: 'rad', v, steps: [step('alpha_{rad} = alpha° * pi/180', `alpha = ${deg} * pi/180 = \`${U.num(v, { sig: 3 })} rad\``, v, 'rad')], mistakes: [{ id: 'unita-angolo', v: deg * 180 / Math.PI }] } };
  });
  // oscilloscopio: ampiezza e periodo letti dalle divisioni
  G('osc.lettura', { topic: 'u13', kind: 'oscilloscopio', uses: ['c.osc', 'q.Vp', 'q.T', 'q.f'] }, (sc, r) => tryN(30, () => {
    const vdiv = pick(r, [0.5, 1, 2, 5]), tdiv = pick(r, [0.1e-3, 0.2e-3, 0.5e-3, 1e-3, 2e-3]);
    const divV = pick(r, [1, 1.5, 2, 2.5, 3]), divT = pick(r, [2, 2.5, 4, 5]);
    const Vp = divV * vdiv, T = divT * tdiv, f = 1 / T;
    const find = pick(r, ['Vp', 'Vpp', 'T', 'f']);
    const v = { Vp, Vpp: 2 * Vp, T, f }[find];
    const u = { Vp: 'V', Vpp: 'V', T: 's', f: 'Hz' }[find];
    const steps = find.startsWith('V') ? [step(`V_p = "divisioni" * "V/div"`, `V_p = ${U.num(divV)} * ${Q(sc)(vdiv, 'V')} = ${Q(sc)(Vp, 'V')}`, Vp, 'V')] : [step('T = "divisioni" * "s/div"', `T = ${U.num(divT)} * ${Q(sc)(tdiv, 's')} = ${Q(sc)(T, 's')}`, T, 's')];
    if (find === 'Vpp') steps.push(step('V_{pp} = 2 * V_p', `V_{pp} = 2 * ${Q(sc)(Vp, 'V')} = ${Q(sc)(2 * Vp, 'V')}`, 2 * Vp, 'V'));
    if (find === 'f') steps.push(step('f = 1/T', `f = 1/${Q(sc)(T, 's')} = ${Q(sc)(f, 'Hz')}`, f, 'Hz'));
    const name = { Vp: 'il valore di picco', Vpp: 'il valore picco-picco', T: 'il periodo', f: 'la frequenza' }[find];
    return { scope: { traces: [{ Vp, f }], vdiv: [vdiv], tdiv }, text: `Sull’oscilloscopio (${U.fmt(vdiv, 'V')}/div, ${U.fmt(tdiv, 's')}/div) leggi ${name} del segnale.`, sol: { sym: find, u, v, steps, mistakes: [{ id: 'divisioni', v: find.startsWith('V') ? divV : divT }, { id: 'picco-piccopicco', v: find === 'Vp' ? 2 * Vp : find === 'Vpp' ? Vp : NaN }] } };
  }));

  /* ======================= Unità 14: complessi, fasori, impedenza ======================= */
  const cxv = (r) => X.C(pick(r, [1, 2, 3, 4, 5, 6, 8, 10, 12]) * (r() < 0.25 ? -1 : 1), pick(r, [1, 2, 3, 4, 5, 6, 8]) * (r() < 0.4 ? -1 : 1));
  G('cx.polare', { topic: 'u14', kind: 'complesso', uses: ['m.cx'] }, (sc, r) => {
    const z = cxv(r);
    return { text: `Scrivi in forma polare il numero complesso z = ${X.fmtRect(z)}.`, sol: { sym: 'z', u: '', z, steps: [step('|z| = sqrt(a^2 + b^2)', `|z| = sqrt(${U.num(z.re)}^2 + ${U.num(z.im)}^2) = \`${U.num(X.abs(z), { sig: 4 })}\``, X.abs(z), ''), step('phi = arctan(b/a)', `phi = \`${U.num(X.argDeg(z), { dec: 1 })}°\``, X.argDeg(z), '°')], mistakes: [] }, answerForm: 'polare' };
  });
  G('cx.operazioni', { topic: 'u14', kind: 'complesso', levels: [2], uses: ['m.cx'] }, (sc, r) => {
    const a = cxv(r), b = cxv(r);
    const op = pick(r, ['+', '-', '*', '/']);
    const z = op === '+' ? X.add(a, b) : op === '-' ? X.sub(a, b) : op === '*' ? X.mul(a, b) : X.div(a, b);
    if (X.abs(z) < 1e-9) return null;
    const A = X.fmtRect(a), B = X.fmtRect(b);
    return { text: `Calcola (${A}) ${op === '*' ? '·' : op === '/' ? '÷' : op === '-' ? '−' : '+'} (${B}).`, sol: { sym: 'z', u: '', z, steps: [step(op === '*' || op === '/' ? `"in forma polare: moduli ${op === '*' ? 'moltiplicati' : 'divisi'}, angoli ${op === '*' ? 'sommati' : 'sottratti'}"` : `"parte reale con parte reale, immaginaria con immaginaria"`, `z = "${X.fmtRect(z, '', { sig: 4 })}" = "${X.fmtPolar(z, '', { sig: 4 })}"`, null, '')], mistakes: [] } };
  });
  G('reattanza', { topic: 'u14', uses: ['q.X', 'f.XL', 'f.XC', 'f.omega'] }, (sc, r) => {
    const kind = pick(r, ['L', 'C']);
    const f = pick(r, FREQ);
    const L = pick(r, [1e-3, 10e-3, 47e-3, 100e-3, 0.5]), C = pick(r, [10e-9, 100e-9, 1e-6, 4.7e-6, 10e-6]);
    const sol = S.reactance({ kind, L, C, f }, sc);
    return { text: kind === 'L' ? `Quanto vale la reattanza di un induttore da $L = ${Q(sc)(L, 'H')}$ a $f = ${Q(sc)(f, 'Hz')}$?` : `Quanto vale la reattanza di un condensatore da $C = ${Q(sc)(C, 'F')}$ a $f = ${Q(sc)(f, 'Hz')}$?`, sol };
  });
  function seriesACspec(p) {
    return { cols: [[{ id: 'V1', t: 'V', v: p.V, ac: true }], [p.C ? { id: 'C1', t: 'C', v: p.C } : { id: 'L1', t: 'L', v: p.L }]], top: [[{ id: 'R1', t: 'R', v: p.R }].concat(p.C && p.L ? [{ id: 'L1', t: 'L', v: p.L }] : [])] };
  }
  G('ac.serie', { topic: 'u14', levels: [2, 3], uses: ['q.Z', 'q.X', 'f.XL', 'f.XC', 'f.Z', 'f.ohm'] }, (sc, r) => tryN(30, () => {
    const which = pick(r, sc.level >= 3 ? ['RLC'] : ['RC', 'RL']);
    const p = { R: R_E12(r, 10, 4700), f: pick(r, FREQ), V: pick(r, [5, 10, 12, 24]) };
    if (which !== 'RL') p.C = pick(r, [10e-9, 100e-9, 1e-6, 10e-6]);
    if (which !== 'RC') p.L = pick(r, [10e-3, 47e-3, 100e-3, 0.5]);
    const find = pick(r, ['Z', 'phi', 'I'].concat(sc.level >= 3 ? ['VR', 'P'] : []));
    const sol = S.seriesAC(Object.assign({ find }, p), sc);
    const X0 = (p.L ? 2 * Math.PI * p.f * p.L : 0) - (p.C ? 1 / (2 * Math.PI * p.f * p.C) : 0);
    // reattanza e resistenza dello stesso ordine: niente circuiti quasi puramente resistivi o reattivi
    if (Math.abs(X0) < p.R / 10 || Math.abs(X0) > p.R * 10 || !distinct(sol)) return null;
    const name = { Z: 'il modulo dell’impedenza', phi: 'lo sfasamento φ della tensione rispetto alla corrente', I: 'la corrente (efficace)', VR: 'la tensione su R', P: 'la potenza attiva' }[find];
    return { text: `Nel circuito ${which} serie ($R = ${Q(sc)(p.R, 'Ω')}$${p.L ? `, $L = ${Q(sc)(p.L, 'H')}$` : ''}${p.C ? `, $C = ${Q(sc)(p.C, 'F')}$` : ''}), alimentato con $V = ${Q(sc)(p.V, 'V')}$ efficaci a $f = ${Q(sc)(p.f, 'Hz')}$, quanto vale ${name}?`, schema: { ladder: seriesACspec(p) }, sol };
  }));

  /* ======================= Unità 15: potenze, rifasamento, risonanza ======================= */
  G('ac.potenze', { topic: 'u15', uses: ['q.P', 'q.Qr', 'q.S', 'f.PQS'] }, (sc, r) => {
    // a 45° seno e coseno coincidono: si scelgono angoli diversi
    const V = pick(r, [12, 24, 48, 230]), I = pick(r, [0.5, 1, 2, 5, 10]), phi = pick(r, [20, 30, 36.87, 53.13, 60]);
    const find = pick(r, ['P', 'Q', 'S']);
    const sol = S.powerAC({ V, I, phi, find }, sc);
    return { text: `Un carico assorbe $I = ${Q(sc)(I, 'A')}$ con $V = ${Q(sc)(V, 'V')}$ (efficaci), sfasamento $phi = \`${U.num(phi, { sig: 4 })}°\`$. Quanto vale la potenza ${find === 'P' ? 'attiva' : find === 'Q' ? 'reattiva' : 'apparente'}?`, sol };
  });
  G('rifasamento', { topic: 'u15', levels: [3], uses: ['f.rifasamento', 'q.Qr', 'f.omega'] }, (sc, r) => {
    const P = pick(r, [500, 1000, 1500, 2000, 3000]), c1 = pick(r, [0.6, 0.65, 0.7, 0.75, 0.8]), c2 = pick(r, [0.9, 0.95]);
    const sol = S.pfCorrection({ P, V: 230, f: 50, cos1: c1, cos2: c2 }, sc);
    return { warn: 'Solo calcolo: sulla rete a 230 V non si lavora.', text: `Un motore da $P = ${Q(sc)(P, 'W')}$ funziona a $\`230 V\`$, $\`50 Hz\`$, con $cos(phi) = \`${U.num(c1)}\`$. Quale condensatore serve per portare il fattore di potenza a $\`${U.num(c2)}\`$?`, sol };
  });
  G('risonanza', { topic: 'u15', levels: [2, 3], uses: ['f.f0', 'q.f'] }, (sc, r) => {
    const L = pick(r, [1e-3, 4.7e-3, 10e-3, 47e-3, 100e-3]), C = pick(r, [10e-9, 47e-9, 100e-9, 470e-9, 1e-6]), R = pick(r, [5, 10, 22, 47]);
    const find = sc.level >= 3 ? pick(r, ['f0', 'Q', 'B']) : 'f0';
    const sol = S.resonance({ L, C, R, find }, sc);
    return { text: `Un circuito RLC serie ha $R = ${Q(sc)(R, 'Ω')}$, $L = ${Q(sc)(L, 'H')}$ e $C = ${Q(sc)(C, 'F')}$. Quanto vale ${find === 'f0' ? 'la frequenza di risonanza' : find === 'Q' ? 'il fattore di merito Q' : 'la larghezza di banda'}?`, sol };
  });

  /* ======================= Unità 16: reti sequenziali ======================= */
  G('ff.sequenza', { topic: 'u16', kind: 'sequenza', uses: ['l.ff'] }, (sc, r) => {
    const types = ['D'].concat(sc.known && sc.known.has('l.jk') ? ['JK', 'T'] : []);
    const t = pick(r, types);
    const n = 5;
    const ins = Array.from({ length: n }, () => (t === 'D' ? { D: r() < 0.5 ? 1 : 0 } : t === 'T' ? { T: r() < 0.6 ? 1 : 0 } : { J: r() < 0.5 ? 1 : 0, K: r() < 0.5 ? 1 : 0 }));
    const q0 = 0;
    const out = LG.runFF(t, ins, q0);
    const want = out.slice(1).join('');
    return { ffType: t, inputs: ins, text: `Un flip-flop ${t}, con Q = 0 all’inizio, riceve questi ingressi prima di ognuno dei ${n} fronti di salita del clock. Scrivi i valori di Q dopo ogni fronte (${n} cifre, per esempio 10110).`, sol: { sym: 'Q', u: '', v: 0, seq: want, steps: [step(`"flip-flop ${t}"`, `"Q: ${want}"`, null, '')], mistakes: [] } };
  });
  G('latch.SR', { topic: 'u16', kind: 'scelta', uses: ['l.sr'] }, (sc, r) => {
    const q = r() < 0.5 ? 1 : 0, Sx = r() < 0.5 ? 1 : 0, R = Sx ? (r() < 0.3 ? 1 : 0) : (r() < 0.5 ? 1 : 0);
    const res = LG.latchSR(q, Sx, R);
    const right = res.vietato ? 'combinazione vietata' : `Q = ${res.q}`;
    return { text: `Un latch SR a porte NOR ha Q = ${q}. Arrivano S = ${Sx} e R = ${R}. Che cosa succede?`, choices: ['Q = 0', 'Q = 1', 'combinazione vietata'].map((x) => ({ label: x, right: x === right, mistake: x === right ? null : 'latch' })), sol: { sym: 'Q', u: '', v: 0, steps: [step('"S imposta, R azzera, 00 mantiene, 11 vietata"', `"${right}"`, null, '')], mistakes: [] } };
  });
  G('contatore', { topic: 'u16', kind: 'calc', uses: ['l.cont'] }, (sc, r) => {
    const n = pick(r, [3, 4]), mod = r() < 0.4 ? pick(r, [5, 6, 10, 12]) : 2 ** n;
    if (mod > 2 ** n) return null;
    const k = 3 + Math.floor(r() * 20);
    const v = k % mod;
    return { text: `Un contatore ${mod === 2 ** n ? `binario a ${n} bit` : `modulo ${mod}`} parte da 0. Che numero segna (in decimale) dopo ${k} impulsi di clock?`, sol: { sym: 'N', u: '', v, tol: 0, abs: 0.1, steps: [step('N = k "mod" M', `N = ${k} "mod" ${mod} = ${v}`, v, '')], mistakes: [{ id: 'contatore-modulo', v: k }, { id: 'contatore-modulo', v: (k + 1) % mod }] } };
  });
  G('contatore.bit', { topic: 'u16', kind: 'calc', uses: ['l.cont'] }, (sc, r) => {
    const mod = pick(r, [5, 6, 10, 12, 16, 20, 24, 60, 100]);
    const v = NS.bitsFor(mod - 1);
    return { text: `Quanti flip-flop servono, come minimo, per un contatore modulo ${mod}?`, sol: { sym: 'n', u: '', v, tol: 0, abs: 0.1, steps: [step('2^n >= M', `2^${v} = ${2 ** v} ≥ ${mod}`, v, '')], mistakes: [{ id: 'bit-livelli', v: v + 1 }, { id: 'bit-livelli', v: v - 1 }] } };
  });
  G('divisore.f', { topic: 'u16', uses: ['l.cont', 'q.f'] }, (sc, r) => {
    const f = pick(r, [1000, 4096, 32768, 1e6, 8000]), n = pick(r, [1, 2, 3, 4, 8]);
    const v = f / 2 ** n;
    return { text: `Un contatore binario a ${n} bit riceve un clock a $f = ${Q(sc)(f, 'Hz')}$. Quanto vale la frequenza dell’uscita dell’ultimo flip-flop?`, sol: { sym: 'f_{out}', u: 'Hz', v, steps: [step('f_{out} = f/2^n', `f_{out} = ${Q(sc)(f, 'Hz')}/2^${n} = ${Q(sc)(v, 'Hz')}`, v, 'Hz')], mistakes: [{ id: 'divisore', v: f / n }, { id: 'divisore', v: f / (2 * n) }] } };
  });
  G('registro', { topic: 'u16', kind: 'sequenza', uses: ['l.reg'] }, (sc, r) => {
    const bits = Array.from({ length: 4 }, () => (r() < 0.5 ? 1 : 0));
    const st = LG.shiftRegister(4, bits);
    const want = st[st.length - 1].join('');
    return { text: `Un registro a scorrimento a 4 bit (Q₀Q₁Q₂Q₃) parte da 0000. Entrano in serie, uno per ogni clock, i bit ${bits.join(', ')}; ogni bit nuovo entra in Q₀. Che cosa contiene il registro alla fine?`, sol: { sym: 'Q', u: '', v: 0, seq: want, steps: [step('"a ogni clock i bit scorrono di un posto"', st.map((x) => `"${x.join('')}"`).join(' → '), null, '')], mistakes: [] } };
  });

  /* ======================= Unità 17: diodi ======================= */
  G('diodo.I', { topic: 'u17', uses: ['c.D', 'f.diodo', 'f.ohm'] }, (sc, r) => {
    const V = pick(r, [3, 5, 9, 12]), R = R_E12(r, 220, 10000), n = pick(r, [1, 1, 2]);
    const sol = D.diode({ V, R, n }, sc);
    if (!sol.v || sol.v * sol.v * R > 0.25) return null;
    return { text: `${n === 1 ? 'Un diodo al silicio' : 'Due diodi al silicio in serie'}, ${n === 1 ? 'polarizzato' : 'polarizzati'} direttamente, ${n === 1 ? 'è collegato' : 'sono collegati'} con $R = ${Q(sc)(R, 'Ω')}$ a $V = ${Q(sc)(V, 'V')}$. Quanto vale la corrente? (Modello a soglia: 0,7 V.)`, schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: V }], n === 1 ? [{ id: 'D1', t: 'D' }] : [{ id: 'D1', t: 'D' }, { id: 'D2', t: 'D' }]], top: [[{ id: 'R1', t: 'R', v: R }]] } }, sol };
  });
  G('diodo.stato', { topic: 'u17', kind: 'scelta', uses: ['c.D'] }, (sc, r) => {
    const rev = r() < 0.5, V = pick(r, [5, 9, 12]);
    const right = rev ? 'interdetto: non passa corrente' : 'in conduzione';
    return { text: 'Il diodo dello schema conduce?', schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: V }], [{ id: 'D1', t: 'D', rev }]], top: [[{ id: 'R1', t: 'R', v: 1000 }]] } }, choices: ['in conduzione', 'interdetto: non passa corrente'].map((x) => ({ label: x, right: x === right, mistake: x === right ? null : 'diodo-verso' })), sol: { sym: 'stato', u: '', v: 0, steps: [step('"anodo verso il +?"', `"${rev ? 'il catodo è verso il + del generatore: polarizzazione inversa' : 'l’anodo è verso il + del generatore: polarizzazione diretta'}"`, null, '')], mistakes: [] } };
  });
  G('led.R', { topic: 'u17', levels: [1, 2], uses: ['c.LED', 'f.led', 'c.serieE'] }, (sc, r) => {
    const V = pick(r, [5, 9, 12]), color = pick(r, [['rosso', 1.8], ['verde', 2.1], ['giallo', 2], ['blu', 3]]), I = pick(r, [0.01, 0.015, 0.02]);
    const find = sc.level >= 2 ? pick(r, ['Rc', 'P']) : 'R';
    const sol = D.ledResistor({ V, Vf: color[1], I, find }, sc);
    if (!distinct(sol)) return null;
    return { text: `Un LED ${color[0]} ($V_F = ${Q(sc)(color[1], 'V')}$) deve lavorare con $I_F = ${Q(sc)(I, 'A')}$ alimentato da $V = ${Q(sc)(V, 'V')}$. ${find === 'R' ? 'Quanto vale la resistenza di limitazione?' : find === 'Rc' ? 'Quale valore commerciale della serie E12 scegli per la resistenza?' : 'Con il valore commerciale E12 subito sopra, quanta potenza dissipa la resistenza?'}`, schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: V }], [{ id: 'D1', t: 'LED' }]], top: [[{ id: 'R1', t: 'R', label: '?' }]] } }, sol };
  });
  G('raddrizzatore', { topic: 'u17', levels: [2, 3], uses: ['c.D', 'f.raddr', 'q.Vp', 'f.eff'] }, (sc, r) => {
    const type = pick(r, ['semi', 'ponte']), V2 = pick(r, [6, 9, 12, 15]);
    const find = sc.level >= 3 && sc.known && sc.known.has('f.ondulazione') ? pick(r, ['Vr', 'Vdc']) : pick(r, ['Vp', 'Vmed']);
    const p = { V2, type, C: pick(r, [470e-6, 1000e-6, 2200e-6]), I: pick(r, [0.1, 0.2, 0.5]), find };
    const sol = D.rectifier(p, sc);
    if (!distinct(sol)) return null;
    return { warn: 'Il trasformatore si collega alla rete: in laboratorio si parte dal secondario già pronto, in bassissima tensione.', text: `Un raddrizzatore ${type === 'semi' ? 'a semionda' : 'a ponte (doppia semionda)'} è alimentato dal secondario di un trasformatore con $V_2 = ${Q(sc)(V2, 'V')}$ efficaci. ${find === 'Vp' ? 'Quanto vale la tensione di picco sul carico?' : find === 'Vmed' ? 'Quanto vale il valore medio della tensione sul carico (senza condensatore)?' : find === 'Vr' ? `Con un condensatore di filtro da $C = ${Q(sc)(p.C, 'F')}$ e un carico che assorbe $I = ${Q(sc)(p.I, 'A')}$, quanto vale l’ondulazione picco-picco?` : `Con $C = ${Q(sc)(p.C, 'F')}$ e $I = ${Q(sc)(p.I, 'A')}$, quanto vale la tensione continua media sul carico?`}`, sol };
  });
  G('zener', { topic: 'u17', levels: [2, 3], uses: ['c.DZ', 'f.zener', 'f.kcl'] }, (sc, r) => tryN(30, () => {
    const V = pick(r, [9, 12, 15]), Vz = pick(r, [3.3, 4.7, 5.1, 6.2]), R = R_E12(r, 100, 1000), RL = R_E12(r, 470, 10000);
    const find = pick(r, sc.level >= 3 ? ['IZ', 'PZ', 'VL'] : ['IR', 'IL', 'VL']);
    const sol = D.zener({ V, R, Vz, RL, find }, sc);
    // resistore da 1/4 W, Zener da 1/2 W
    if ((V - Vz) ** 2 / R > 0.25 || Vz * ((V - Vz) / R) > 0.5) return null;
    if (!distinct(sol) || (sol.v === 0 && find !== 'VL')) return null;
    return { text: `Nello stabilizzatore $V = ${Q(sc)(V, 'V')}$, $R = ${Q(sc)(R, 'Ω')}$, Zener da $V_Z = ${Q(sc)(Vz, 'V')}$ e carico $R_L = ${Q(sc)(RL, 'Ω')}$, quanto vale ${{ IR: 'la corrente in R', IL: 'la corrente nel carico', IZ: 'la corrente nello Zener', PZ: 'la potenza dissipata dallo Zener', VL: 'la tensione sul carico' }[find]}?`, schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: V }], [{ id: 'DZ1', t: 'DZ', vz: Vz, rev: true }], [{ id: 'RL', t: 'R', v: RL }]], top: [[{ id: 'R1', t: 'R', v: R }], []] } }, sol };
  }));

  /* ======================= Unità 18–19: BJT e MOSFET ======================= */
  G('bjt.guadagno', { topic: 'u18', uses: ['c.Q', 'f.beta'] }, (sc, r) => {
    const beta = pick(r, [100, 150, 200, 250, 300]), IB = pick(r, [10e-6, 20e-6, 50e-6, 0.1e-3]);
    const find = pick(r, ['IC', 'IE', 'IB']);
    const IC = beta * IB;
    const sol = D.bjtGain({ find, IB, IC, beta }, sc);
    return { text: find === 'IC' ? `Un BJT con $beta = ${beta}$ in zona attiva ha $I_B = ${Q(sc)(IB, 'A')}$. Quanto vale $I_C$?` : find === 'IE' ? `Un BJT ha $I_B = ${Q(sc)(IB, 'A')}$ e $I_C = ${Q(sc)(IC, 'A')}$. Quanto vale $I_E$?` : `Un BJT con $beta = ${beta}$ in zona attiva ha $I_C = ${Q(sc)(IC, 'A')}$. Quanto vale $I_B$?`, sol };
  });
  G('bjt.base', { topic: 'u18', levels: [2, 3], uses: ['c.Q', 'f.beta', 'f.ohm', 'k.zone'] }, (sc, r) => tryN(30, () => {
    const VCC = 12, VBB = pick(r, [0.3, 3.3, 5, 5]), RB = R_E12(r, 4700, 1e6), RC = R_E12(r, 470, 4700), beta = pick(r, [100, 150, 200]);
    const find = pick(r, ['zona', 'IC', 'VCE'].concat(sc.level >= 3 ? [] : ['IB']));
    const sol = D.bjt({ VCC, VBB, RB, RC, beta, find }, sc);
    if (find !== 'zona' && !distinct(sol)) return null;
    const base = { text: `Nel circuito $V_{CC} = ${Q(sc)(VCC, 'V')}$, $V_{in} = ${Q(sc)(VBB, 'V')}$, $R_B = ${Q(sc)(RB, 'Ω')}$, $R_C = ${Q(sc)(RC, 'Ω')}$, $beta = ${beta}$: ${find === 'zona' ? 'in quale zona lavora il transistor?' : `quanto vale ${{ IB: '$I_B$', IC: '$I_C$', VCE: '$V_{CE}$' }[find]}?`}`, tpl: { name: 'bjt', kind: 'base', p: { VCC, Vin: VBB, RB, RC, beta } }, sol, zone: sol.zone };
    if (find === 'zona') base.choices = ['interdizione', 'attiva', 'saturazione'].map((z) => ({ label: z === 'attiva' ? 'zona attiva' : z, right: z === sol.zone, mistake: z === sol.zone ? null : 'saturazione-ignorata' }));
    return base;
  }));
  G('bjt.partitore', { topic: 'u18', levels: [3], uses: ['c.Q', 'f.part', 'f.beta', 'f.ohm'] }, (sc, r) => tryN(40, () => {
    const p = { VCC: 12, R1: R_E12(r, 10000, 100000), R2: R_E12(r, 2200, 22000), RC: R_E12(r, 1000, 4700), RE: R_E12(r, 470, 2200), beta: pick(r, [100, 150, 200]) };
    const find = pick(r, ['VB', 'IE', 'VCE']);
    const sol = D.bjtDivider(Object.assign({ find }, p), sc);
    // partitore «rigido» (corrente nel partitore ≥ 10 volte quella di base) e transistor in zona attiva
    const VB = p.VCC * p.R2 / (p.R1 + p.R2), IE = (VB - 0.7) / p.RE, Ip = p.VCC / (p.R1 + p.R2);
    const VCE = p.VCC - IE * (p.RC + p.RE);
    if (VB < 1 || Ip < 10 * IE / p.beta || VCE < 1 || !distinct(sol)) return null;
    return { text: `Nel circuito con la polarizzazione a partitore ($V_{CC} = ${Q(sc)(p.VCC, 'V')}$, $R_1 = ${Q(sc)(p.R1, 'Ω')}$, $R_2 = ${Q(sc)(p.R2, 'Ω')}$, $R_C = ${Q(sc)(p.RC, 'Ω')}$, $R_E = ${Q(sc)(p.RE, 'Ω')}$, $beta = ${p.beta}$), quanto vale ${{ VB: '$V_B$', IE: '$I_E$', VCE: '$V_{CE}$' }[find]}? (Trascura la corrente di base rispetto a quella del partitore.)`, tpl: { name: 'bjt', kind: 'partitore', p }, sol, zone: 'attiva' };
  }));
  G('bjt.interruttore', { topic: 'u18', levels: [2, 3], uses: ['c.Q', 'f.beta', 'f.ohm', 'k.zone'] }, (sc, r) => {
    const VCC = pick(r, [5, 12]), RC = R_E12(r, 100, 1000), beta = pick(r, [100, 150, 200]), k = pick(r, [2, 3]), Vin = pick(r, [3.3, 5]);
    const find = sc.level >= 3 ? 'RBc' : 'RB';
    const sol = D.bjtSwitch({ VCC, RC, Vin, beta, k, find }, sc);
    if (!distinct(sol)) return null;
    return { text: `Un BJT ($beta = ${beta}$) deve portare in saturazione un carico $R_C = ${Q(sc)(RC, 'Ω')}$ alimentato a $V_{CC} = ${Q(sc)(VCC, 'V')}$, comandato da un’uscita a $${Q(sc)(Vin, 'V')}$. Con un fattore di sovrasaturazione ${k}, quanto vale ${find === 'RB' ? 'la resistenza di base' : 'la resistenza di base, scelta fra i valori E12'}?`, tpl: { name: 'bjt', kind: 'base', p: { VCC, Vin, RC, RB: sol.v, beta } }, sol, zone: 'saturazione' };
  });
  G('mos.ID', { topic: 'u19', uses: ['c.M', 'f.mos', 'f.ohm'] }, (sc, r) => {
    const VDD = pick(r, [5, 12, 24]), RD = R_E12(r, 10, 470), VGS = pick(r, [0, 1, 3.3, 5, 10]), Vth = pick(r, [1, 2, 3]), Ron = pick(r, [0.05, 0.1, 0.5]);
    const find = pick(r, ['ID', 'P', 'VDS']);
    const sol = D.mosfet({ VDD, RD, VGS, Vth, Ron, find }, sc);
    return { text: `Un MOSFET a canale N ($V_{GS(th)} = ${Q(sc)(Vth, 'V')}$, $R_{DS(on)} = ${Q(sc)(Ron, 'Ω')}$) comanda un carico $R_D = ${Q(sc)(RD, 'Ω')}$ a $V_{DD} = ${Q(sc)(VDD, 'V')}$, con $V_{GS} = ${Q(sc)(VGS, 'V')}$. Quanto vale ${{ ID: 'la corrente di drain', P: 'la potenza dissipata dal MOSFET', VDS: 'la tensione fra drain e source' }[find]}?`, tpl: { name: 'mosfet', p: { VDD, RD, VGS, Vth, Ron } }, sol };
  });
  const FAM = { TTL: { VOH: 2.4, VOL: 0.4, VIH: 2.0, VIL: 0.8 }, CMOS: { VOH: 4.4, VOL: 0.1, VIH: 3.5, VIL: 1.5 } };
  G('famiglie.margine', { topic: 'u19', uses: ['l.famiglie'] }, (sc, r) => {
    const f = pick(r, ['TTL', 'CMOS']), which = pick(r, ['H', 'L']);
    const F = FAM[f];
    const v = which === 'H' ? F.VOH - F.VIH : F.VIL - F.VOL;
    return { text: `Per la famiglia ${f} (a 5 V) prendi $V_{OH} = ${Q(sc)(F.VOH, 'V')}$, $V_{OL} = ${Q(sc)(F.VOL, 'V')}$, $V_{IH} = ${Q(sc)(F.VIH, 'V')}$, $V_{IL} = ${Q(sc)(F.VIL, 'V')}$. Quanto vale il margine di rumore ${which === 'H' ? 'a livello alto' : 'a livello basso'}?`, sol: { sym: `N_{M${which}}`, u: 'V', v, steps: [step(which === 'H' ? 'N_{MH} = V_{OH} - V_{IH}' : 'N_{ML} = V_{IL} - V_{OL}', which === 'H' ? `N_{MH} = ${Q(sc)(F.VOH, 'V')} - ${Q(sc)(F.VIH, 'V')} = ${Q(sc)(v, 'V')}` : `N_{ML} = ${Q(sc)(F.VIL, 'V')} - ${Q(sc)(F.VOL, 'V')} = ${Q(sc)(v, 'V')}`, v, 'V')], mistakes: [{ id: 'margine', v: which === 'H' ? F.VOH - F.VIL : F.VIH - F.VOL }, { id: 'segno', v: -v }] } };
  });
  G('famiglie.compatibili', { topic: 'u19', kind: 'scelta', uses: ['l.famiglie'] }, (sc, r) => {
    const from = pick(r, ['TTL', 'CMOS']), to = from === 'TTL' ? 'CMOS' : 'TTL';
    const ok = FAM[from].VOH >= FAM[to].VIH && FAM[from].VOL <= FAM[to].VIL;
    const right = ok ? 'sì: i livelli d’uscita stanno dentro quelli d’ingresso' : 'no: il livello alto d’uscita è sotto il minimo richiesto dall’ingresso';
    return { text: `Un’uscita ${from} può comandare direttamente un ingresso ${to} (entrambi a 5 V)? Usa i livelli tipici: TTL $V_{OH} = \`2,4 V\`$, $V_{IH} = \`2 V\`$; CMOS $V_{OH} = \`4,4 V\`$, $V_{IH} = \`3,5 V\`$.`, choices: ['sì: i livelli d’uscita stanno dentro quelli d’ingresso', 'no: il livello alto d’uscita è sotto il minimo richiesto dall’ingresso'].map((x) => ({ label: x, right: x === right, mistake: x === right ? null : 'margine' })), sol: { sym: 'compatibili', u: '', v: 0, steps: [step('V_{OH} >= V_{IH}', `${MA.q(FAM[from].VOH, 'V')} ${ok ? '≥' : '<'} ${MA.q(FAM[to].VIH, 'V')}`, null, '')], mistakes: [] } };
  });

  /* ======================= Unità 20: operazionale ======================= */
  G('oa.amplificatore', { topic: 'u20', levels: [1, 2], uses: ['c.OA', 'f.oa'] }, (sc, r) => tryN(30, () => {
    const kinds = ['invertente'].concat(sc.known && sc.known.has('f.noninv') ? ['non-invertente'] : []);
    const kind = pick(r, kinds);
    const R1 = R_E12(r, 1000, 22000), Rf = R_E12(r, 2200, 220000), Vin = pick(r, [0.05, 0.1, 0.2, 0.25, 0.5, 1]) * (r() < 0.3 ? -1 : 1);
    const find = pick(r, ['Av', 'Vout']);
    const sol = D.opamp({ kind, R1, Rf, Vin, Vsat: sc.known && sc.known.has('f.saturazione') ? 12 : null, find }, sc);
    if (find === 'Vout' && Math.abs(sol.v) > 12 && !(sc.known && sc.known.has('f.saturazione'))) return null;
    if (!distinct(sol)) return null;
    return { text: `Nell’amplificatore ${kind} con $R_1 = ${Q(sc)(R1, 'Ω')}$ e $R_f = ${Q(sc)(Rf, 'Ω')}$${find === 'Vout' ? `, con $V_{in} = ${Q(sc)(Vin, 'V', true)}$` : ''}, quanto vale ${find === 'Av' ? 'il guadagno di tensione' : 'la tensione d’uscita'}?${sc.known && sc.known.has('f.saturazione') ? ' (Alimentazione ±12 V.)' : ''}`, tpl: { name: 'opamp', kind, p: { Vin, R1, Rf, Vsat: 12 } }, sol };
  }));
  G('oa.sommatore', { topic: 'u20', levels: [2], uses: ['c.OA', 'f.sommatore'] }, (sc, r) => tryN(30, () => {
    const V = [pick(r, [0.2, 0.5, 1, 1.5]), pick(r, [0.1, 0.3, 0.5, 2]) * (r() < 0.3 ? -1 : 1)];
    const R = [R_E12(r, 4700, 47000), R_E12(r, 4700, 47000)], Rf = R_E12(r, 10000, 100000);
    const sol = D.opamp({ kind: 'sommatore', V, R, Rf, Vsat: 12, find: 'Vout' }, sc);
    if (Math.abs(sol.v) >= 12 || !distinct(sol)) return null;
    return { text: `Nel sommatore invertente $V_1 = ${Q(sc)(V[0], 'V', true)}$, $V_2 = ${Q(sc)(V[1], 'V', true)}$, $R_1 = ${Q(sc)(R[0], 'Ω')}$, $R_2 = ${Q(sc)(R[1], 'Ω')}$, $R_f = ${Q(sc)(Rf, 'Ω')}$. Quanto vale $V_{out}$?`, tpl: { name: 'opamp', kind: 'sommatore', p: { V, R, Rf } }, sol };
  }));
  G('oa.differenziale', { topic: 'u20', levels: [2], uses: ['c.OA', 'f.differenziale'] }, (sc, r) => tryN(30, () => {
    const R1 = R_E12(r, 1000, 22000), Rf = R_E12(r, 1000, 100000), V1 = pick(r, [0.5, 1, 1.2, 2]), V2 = pick(r, [0.8, 1.5, 2.5, 3]);
    const sol = D.opamp({ kind: 'differenziale', R1, Rf, V1, V2, Vsat: 12, find: 'Vout' }, sc);
    if (Math.abs(sol.v) >= 12 || !distinct(sol)) return null;
    return { text: `Nel differenziale con $R_1 = R_3 = ${Q(sc)(R1, 'Ω')}$ e $R_2 = R_4 = ${Q(sc)(Rf, 'Ω')}$, gli ingressi sono $V_1 = ${Q(sc)(V1, 'V')}$ e $V_2 = ${Q(sc)(V2, 'V')}$. Quanto vale $V_{out}$?`, tpl: { name: 'opamp', kind: 'differenziale', p: { V1, V2, R1, Rf } }, sol };
  }));
  G('oa.comparatore', { topic: 'u20', uses: ['c.OA', 'f.comparatore'] }, (sc, r) => {
    const Vin = pick(r, [0.5, 1, 1.5, 2.5, 3, 4]), Vref = pick(r, [1, 2, 2.5, 3.3]);
    if (Vin === Vref) return null;
    const sol = D.comparator({ Vp: Vin, Vn: Vref, Vsat: 12 }, sc);
    return { text: `Un comparatore alimentato a ±12 V ha l’ingresso + a $V_{in} = ${Q(sc)(Vin, 'V')}$ e l’ingresso − a $V_{ref} = ${Q(sc)(Vref, 'V')}$. Quanto vale l’uscita? (Prendi $V_{sat} = \`12 V\`$.)`, tpl: { name: 'opamp', kind: 'comparatore', p: { Vin, Vref, Vsat: 12 } }, sol };
  });
  G('oa.saturazione', { topic: 'u20', levels: [2], uses: ['c.OA', 'f.oa', 'f.saturazione'] }, (sc, r) => tryN(30, () => {
    const R1 = 1000, Rf = pick(r, [10000, 22000, 47000, 100000]), Vin = pick(r, [0.2, 0.5, 1, 2]) * (r() < 0.5 ? -1 : 1);
    const sol = D.opamp({ kind: 'invertente', R1, Rf, Vin, Vsat: 12, find: 'Vout' }, sc);
    if (Math.abs(Rf / R1 * Vin) <= 12) return null;
    return { text: `Un invertente con $R_1 = ${Q(sc)(R1, 'Ω')}$ e $R_f = ${Q(sc)(Rf, 'Ω')}$, alimentato a ±12 V ($V_{sat} = \`12 V\`$), riceve $V_{in} = ${Q(sc)(Vin, 'V', true)}$. Quanto vale l’uscita?`, tpl: { name: 'opamp', kind: 'invertente', p: { Vin, R1, Rf, Vsat: 12 } }, sol };
  }));

  /* ======================= Unità 21: decibel e filtri ======================= */
  G('db', { topic: 'u21', uses: ['q.dB', 'm.log', 'f.dB'] }, (sc, r) => {
    const find = pick(r, ['dB', 'dB', 'ratio']);
    const kind = pick(r, ['tensione', 'tensione', 'potenza']);
    const ratio = pick(r, [2, 10, 100, 1000, 0.5, 0.1, 0.01, 1 / Math.SQRT2, 50]);
    const dB = pick(r, [-20, -6, -3, 3, 6, 20, 40]);
    const sol = find === 'dB' ? SG.db({ ratio, kind, find }, sc) : SG.db({ dB, kind, find }, sc);
    return { text: find === 'dB' ? `Un ${kind === 'potenza' ? 'rapporto di potenze' : 'guadagno di tensione'} vale $\`${U.num(ratio, { sig: 3 })}\`$. Quanto vale in decibel?` : `Un guadagno di ${kind} vale $\`${dB} dB\`$. Quanto vale il rapporto ${kind === 'potenza' ? 'fra le potenze' : 'fra le tensioni'}?`, sol };
  });
  G('filtro', { topic: 'u21', levels: [1, 2], uses: ['q.fc', 'f.fc', 'c.C'] }, (sc, r) => tryN(30, () => {
    const kinds = ['basso'].concat(sc.known && sc.known.has('f.passaalto') ? ['alto'] : []);
    const kind = pick(r, kinds), R = R_E12(r, 1000, 100000), C = pick(r, [1e-9, 10e-9, 100e-9, 1e-6]);
    const fc = 1 / (2 * Math.PI * R * C);
    const f = fc * pick(r, [0.1, 0.5, 1, 2, 10]);
    const find = sc.level >= 2 ? pick(r, ['mod', 'dB', 'phi', 'Vout']) : 'fc';
    if (fc < 1 || fc > 1e6) return null;
    const Vin = pick(r, [1, 2, 5, 10]);
    const sol = SG.filterRC({ kind, R, C, f, Vin, find }, sc);
    return { text: find === 'fc' ? `Quanto vale la frequenza di taglio del filtro passa-${kind} RC con $R = ${Q(sc)(R, 'Ω')}$ e $C = ${Q(sc)(C, 'F')}$?` : `Nel filtro passa-${kind} RC ($R = ${Q(sc)(R, 'Ω')}$, $C = ${Q(sc)(C, 'F')}$) a $f = ${Q(sc)(f, 'Hz')}$, quanto vale ${{ mod: 'il modulo della funzione di trasferimento |H|', dB: 'il guadagno in decibel', phi: 'lo sfasamento dell’uscita rispetto all’ingresso', Vout: 'la tensione d’uscita' }[find]}${find === 'Vout' ? ` con un ingresso di $${Q(sc)(Vin, 'V')}$` : ''}?`, schema: { ladder: kind === 'basso' ? { cols: [[{ id: 'V1', t: 'V', ac: true, label: '' }], [{ id: 'C1', t: 'C', v: C }]], top: [[{ id: 'R1', t: 'R', v: R }]] } : { cols: [[{ id: 'V1', t: 'V', ac: true, label: '' }], [{ id: 'R1', t: 'R', v: R }]], top: [[{ id: 'C1', t: 'C', v: C }]] } }, sol };
  }));
  G('bode', { topic: 'u21', levels: [2], uses: ['f.bode', 'q.fc', 'q.dB'] }, (sc, r) => {
    const fc = pick(r, [100, 159, 1000, 1590, 10000]), k = pick(r, [10, 100, 1000]);
    const kind = pick(r, ['basso', 'alto']);
    const f = kind === 'basso' ? fc * k : fc / k;
    const C = 100e-9, R = 1 / (2 * Math.PI * fc * C);
    const sol = SG.filterRC({ kind, R, C, f, find: 'asint' }, sc);
    return { plot: { kind: 'bode', fc, kindF: kind }, text: `Un filtro passa-${kind} del primo ordine ha $f_c = ${Q(sc)(fc, 'Hz')}$. Secondo il diagramma di Bode asintotico, quanto vale il guadagno a $f = ${Q(sc)(f, 'Hz')}$?`, sol };
  });
  G('filtro.attivo', { topic: 'u21', levels: [2], uses: ['f.attivo', 'c.OA', 'f.fc'] }, (sc, r) => {
    const kind = pick(r, ['basso', 'alto']), R1 = R_E12(r, 1000, 22000), Rf = R_E12(r, 2200, 100000), C = pick(r, [1e-9, 10e-9, 100e-9]);
    const find = pick(r, ['K', 'fc', 'KdB']);
    const sol = SG.activeFilter({ kind, R1, Rf, C, find }, sc);
    return { text: `Nel filtro attivo passa-${kind} invertente ($R_1 = ${Q(sc)(R1, 'Ω')}$, $R_f = ${Q(sc)(Rf, 'Ω')}$, $C = ${Q(sc)(C, 'F')}$${kind === 'basso' ? ' in parallelo a $R_f$' : ' in serie a $R_1$'}), quanto vale ${find === 'K' ? 'il guadagno in banda passante' : find === 'KdB' ? 'il guadagno in banda passante, in decibel' : 'la frequenza di taglio'}?`, tpl: { name: 'opamp', kind: kind === 'basso' ? 'passa-basso' : 'passa-alto', p: { R1, Rf, C } }, sol };
  });

  /* ======================= Unità 22: generatori di forme d'onda ======================= */
  G('schmitt', { topic: 'u22', uses: ['f.schmitt', 'c.OA'] }, (sc, r) => {
    const R1 = R_E12(r, 1000, 22000), R2 = R_E12(r, 4700, 100000), Vsat = pick(r, [10, 12, 13.5]);
    const find = pick(r, ['VTH', 'VTL', 'H']);
    const sol = D.schmitt({ R1, R2, Vsat, find }, sc);
    if (!distinct(sol)) return null;
    return { text: `Nel trigger di Schmitt invertente con $R_1 = ${Q(sc)(R1, 'Ω')}$ (verso massa), $R_2 = ${Q(sc)(R2, 'Ω')}$ (dall’uscita) e $V_{sat} = ${Q(sc)(Vsat, 'V')}$, quanto vale ${{ VTH: 'la soglia superiore', VTL: 'la soglia inferiore', H: 'l’isteresi' }[find]}?`, tpl: { name: 'opamp', kind: 'schmitt', p: { R1, R2 } }, sol };
  });
  G('astabile', { topic: 'u22', levels: [2], uses: ['f.astabile', 'm.log', 'c.OA'] }, (sc, r) => {
    const R = R_E12(r, 1000, 100000), C = pick(r, [10e-9, 100e-9, 1e-6]), R1 = R_E12(r, 4700, 47000), R2 = R_E12(r, 4700, 47000);
    const sol = D.astableOA({ R, C, R1, R2, find: pick(r, ['T', 'f']) }, sc);
    return { text: `Nell’astabile con l’operazionale $R = ${Q(sc)(R, 'Ω')}$, $C = ${Q(sc)(C, 'F')}$, $R_1 = ${Q(sc)(R1, 'Ω')}$, $R_2 = ${Q(sc)(R2, 'Ω')}$. Quanto vale ${sol.sym === 'f' ? 'la frequenza' : 'il periodo'} del segnale d’uscita?`, tpl: { name: 'opamp', kind: 'astabile', p: { R, C, R1, R2 } }, sol };
  });
  G('ne555', { topic: 'u22', levels: [1, 2], uses: ['c.555', 'f.555a'] }, (sc, r) => {
    const RA = R_E12(r, 1000, 47000), RB = R_E12(r, 1000, 100000), C = pick(r, [1e-9, 10e-9, 100e-9, 1e-6, 10e-6]);
    const find = sc.level >= 2 ? pick(r, ['f', 'D', 'T']) : pick(r, ['tH', 'tL']);
    const sol = D.ne555astable({ RA, RB, C, find }, sc);
    if (!distinct(sol)) return null;
    return { text: `Un NE555 astabile ha $R_A = ${Q(sc)(RA, 'Ω')}$, $R_B = ${Q(sc)(RB, 'Ω')}$, $C = ${Q(sc)(C, 'F')}$. Quanto vale ${{ tH: 'il tempo in cui l’uscita è alta', tL: 'il tempo in cui l’uscita è bassa', T: 'il periodo', f: 'la frequenza', D: 'il duty cycle' }[find]}?`, tpl: { name: 'ne555', kind: 'astabile', p: { RA, RB, C } }, sol };
  });
  G('ne555.mono', { topic: 'u22', uses: ['c.555', 'f.555m'] }, (sc, r) => {
    const R = R_E12(r, 1000, 1e6), C = pick(r, [1e-6, 10e-6, 47e-6, 100e-6]);
    const sol = D.ne555mono({ R, C }, sc);
    return { text: `Quanto dura l’impulso di un NE555 monostabile con $R = ${Q(sc)(R, 'Ω')}$ e $C = ${Q(sc)(C, 'F')}$?`, tpl: { name: 'ne555', kind: 'monostabile', p: { R, C } }, sol };
  });
  G('wien', { topic: 'u22', uses: ['f.wien', 'c.OA'] }, (sc, r) => {
    const find = pick(r, ['f0', 'f0', 'Rf']);
    const R = R_E12(r, 1000, 100000), C = pick(r, [1e-9, 10e-9, 100e-9]), R1 = R_E12(r, 1000, 22000);
    const sol = D.wien({ R, C, R1, find }, sc);
    return { text: find === 'Rf' ? `Nell’oscillatore a ponte di Wien l’amplificatore non invertente ha $R_1 = ${Q(sc)(R1, 'Ω')}$. Quanto deve valere $R_f$ perché il circuito oscilli?` : `Quanto vale la frequenza di oscillazione di un ponte di Wien con $R = ${Q(sc)(R, 'Ω')}$ e $C = ${Q(sc)(C, 'F')}$?`, sol };
  });

  /* ======================= Unità 23: conversione ======================= */
  G('adc', { topic: 'u23', levels: [1, 2], uses: ['f.quanto', 'l.bin'] }, (sc, r) => {
    const VFS = pick(r, [5, 10, 3.3, 2.56]), n = pick(r, [8, 10, 12]);
    const find = sc.level >= 2 ? pick(r, ['N', 'Vout', 'err']) : pick(r, ['Q', 'levels']);
    const Vin = +(VFS * (0.1 + 0.8 * r())).toFixed(2), N = Math.floor(r() * 2 ** n);
    const sol = SG.adc({ VFS, n, Vin, N, find }, sc);
    return { text: { Q: `Quanto vale il quanto di un convertitore a ${n} bit con tensione di fondo scala $V_{FS} = ${Q(sc)(VFS, 'V')}$?`, levels: `Quanti livelli distingue un convertitore a ${n} bit?`, N: `Un convertitore A/D a ${n} bit con $V_{FS} = ${Q(sc)(VFS, 'V')}$ riceve $V_{in} = ${Q(sc)(Vin, 'V')}$. Quale codice (in decimale) dà in uscita?`, Vout: `Un convertitore D/A a ${n} bit con $V_{FS} = ${Q(sc)(VFS, 'V')}$ riceve il codice ${N}. Quanto vale la tensione d’uscita?`, err: `Qual è l’errore di quantizzazione massimo di un convertitore a ${n} bit con $V_{FS} = ${Q(sc)(VFS, 'V')}$?` }[find], sol: Object.assign(sol, find === 'N' || find === 'levels' ? { tol: 0, abs: 0.1 } : {}) };
  });
  G('arduino', { topic: 'u23', uses: ['f.quanto', 'c.arduino'] }, (sc, r) => {
    const N = Math.floor(r() * 1024);
    const Qv = 5 / 1024, v = N * Qv;
    return { text: `Sulla scheda Arduino UNO il convertitore A/D è a 10 bit con riferimento a $\`5 V\`$. Una lettura dà il codice ${N}. A quale tensione corrisponde?`, sol: { sym: 'V', u: 'V', v, accept: [N * 5 / 1023], steps: [step('Q = V_{FS}/2^n', `Q = \`5 V\`/1024 = ${MA.q(Qv, 'V')}`, Qv, 'V'), step('V = N * Q', `V = ${N} * ${MA.q(Qv, 'V')} = ${MA.q(v, 'V')}`, v, 'V')], mistakes: [{ id: 'prefisso', v: v * 1000 }, { id: 'bit-livelli', v: N * 5 / 10 }] } };
  });
  G('dac.pesato', { topic: 'u23', levels: [2], uses: ['f.dac', 'c.OA'] }, (sc, r) => {
    const code = Array.from({ length: 4 }, () => (r() < 0.5 ? '1' : '0')).join('');
    if (code === '0000') return null;
    const Vref = pick(r, [2.5, 5, 10]), R = R_E12(r, 1000, 10000), Rf = R;
    const sol = SG.dacWeighted({ Vref, Rf, R, code }, sc);
    return { text: `Un D/A a resistori pesati a 4 bit ($V_{ref} = ${Q(sc)(Vref, 'V')}$, MSB su $R = ${Q(sc)(R, 'Ω')}$, poi 2R, 4R, 8R, e $R_f = R$) riceve il codice ${code}. Quanto vale l’uscita?`, sol };
  });
  G('campionamento', { topic: 'u23', uses: ['f.nyquist', 'q.f'] }, (sc, r) => {
    const find = pick(r, ['min', 'alias']);
    const fmax = pick(r, [3400, 4000, 15000, 20000, 22050]), fs = pick(r, [8000, 10000]), f = pick(r, [6000, 7000, 9000]);
    const sol = find === 'min' ? SG.sampling({ fmax }, sc) : SG.sampling({ f, fs, find: 'alias' }, sc);
    return { text: find === 'min' ? `Un segnale ha componenti fino a $f_{max} = ${Q(sc)(fmax, 'Hz')}$. Qual è la frequenza di campionamento minima?` : `Un segnale a $f = ${Q(sc)(f, 'Hz')}$ viene campionato a $f_s = ${Q(sc)(fs, 'Hz')}$, troppo poco. A quale frequenza apparente (alias) compare?`, sol };
  });

  /* ======================= Unità 24: alimentatori ======================= */
  G('trasformatore', { topic: 'u24', uses: ['c.T', 'f.trasf'] }, (sc, r) => {
    const V1 = 230, N1 = pick(r, [1000, 1150, 2300]), N2 = pick(r, [46, 60, 69, 115, 120]);
    const find = pick(r, ['V2', 'n']);
    const sol = find === 'V2' ? D.transformer({ V1, N1, N2 }, sc) : D.transformer({ V1, V2: V1 * N2 / N1, find: 'n' }, sc);
    return { warn: 'Solo calcolo: il primario è collegato alla rete e non si tocca.', text: find === 'V2' ? `Un trasformatore ha $N_1 = ${N1}$ spire al primario (a $\`230 V\`$) e $N_2 = ${N2}$ al secondario. Quanto vale la tensione efficace al secondario?` : `Un trasformatore riduce $\`230 V\`$ a $${Q(sc)(V1 * N2 / N1, 'V')}$. Quanto vale il rapporto di trasformazione $n = V_1/V_2$?`, sol };
  });
  G('regolatore', { topic: 'u24', uses: ['f.regolatore', 'q.P'] }, (sc, r) => {
    const Vout = pick(r, [3.3, 5, 9, 12]), Vin = Vout + pick(r, [2, 3, 4, 7]), I = pick(r, [0.1, 0.25, 0.5, 1]);
    const find = pick(r, ['P', 'eta']);
    const sol = D.linearReg({ Vin, Vout, I, find }, sc);
    return { text: find === 'P' ? `Un regolatore lineare porta $V_{in} = ${Q(sc)(Vin, 'V')}$ a $V_{out} = ${Q(sc)(Vout, 'V')}$ con un carico che assorbe $I = ${Q(sc)(I, 'A')}$. Quanta potenza dissipa?` : `Un regolatore lineare porta $V_{in} = ${Q(sc)(Vin, 'V')}$ a $V_{out} = ${Q(sc)(Vout, 'V')}$. Quanto vale il rendimento, in percentuale (trascurando la corrente di riposo)?`, sol };
  });
  G('lm317', { topic: 'u24', levels: [1, 2], uses: ['f.lm317'] }, (sc, r) => {
    const find = sc.level >= 2 ? 'R2' : 'Vout';
    const R1 = pick(r, [120, 220, 240, 270]), R2 = R_E12(r, 220, 4700), Vout = pick(r, [3.3, 5, 6, 9, 12]);
    const sol = find === 'Vout' ? D.lm317({ R1, R2 }, sc) : D.lm317({ R1, Vout, find: 'R2' }, sc);
    return { text: find === 'Vout' ? `Un regolatore LM317 ha $R_1 = ${Q(sc)(R1, 'Ω')}$ e $R_2 = ${Q(sc)(R2, 'Ω')}$. Quanto vale la tensione d’uscita? ($V_{ref} = \`1,25 V\`$.)` : `Con un LM317 e $R_1 = ${Q(sc)(R1, 'Ω')}$ vuoi $V_{out} = ${Q(sc)(Vout, 'V')}$. Quanto deve valere $R_2$? ($V_{ref} = \`1,25 V\`$.)`, sol };
  });
  G('switching', { topic: 'u24', uses: ['f.rendimento', 'q.P'] }, (sc, r) => {
    const Pout = pick(r, [5, 10, 12, 25, 60]), eta = pick(r, [80, 85, 90, 92]);
    const v = Pout / (eta / 100);
    return { text: `Un alimentatore switching con rendimento del ${eta} % fornisce $P_{out} = ${Q(sc)(Pout, 'W')}$ al carico. Quanta potenza assorbe in ingresso?`, sol: { sym: 'P_{in}', u: 'W', v, steps: [step('P_{in} = P_{out}/eta', `P_{in} = ${Q(sc)(Pout, 'W')}/\`${U.num(eta / 100)}\` = ${Q(sc)(v, 'W')}`, v, 'W')], mistakes: [{ id: 'rendimento-perdite', v: Pout * eta / 100 }] } };
  });

  /* ======================= Unità 25: trasduttori ======================= */
  G('pt100', { topic: 'u25', uses: ['c.pt100', 'f.pt100'] }, (sc, r) => {
    const find = pick(r, ['R', 'T']);
    const T = pick(r, [-20, 0, 25, 40, 50, 80, 100, 150]);
    const R = 100 * (1 + 0.00385 * T);
    const sol = find === 'R' ? D.pt100({ T }, sc) : D.pt100({ R, find: 'T' }, sc);
    return { text: find === 'R' ? `Quanto vale la resistenza di una PT100 ($alpha = \`0,00385 /°C\`$) a $\`${T} °C\`$?` : `Una PT100 ($alpha = \`0,00385 /°C\`$) misura $R = ${Q(sc)(R, 'Ω')}$. Quanto vale la temperatura?`, sol };
  });
  G('lm35', { topic: 'u25', uses: ['c.lm35', 'f.lm35'] }, (sc, r) => {
    const find = pick(r, ['V', 'T']), T = pick(r, [12, 20, 25, 37, 45, 60, 85]);
    const sol = find === 'V' ? D.lm35({ T }, sc) : D.lm35({ V: 0.01 * T, find: 'T' }, sc);
    return { text: find === 'V' ? `Il sensore LM35 (10 mV/°C) misura $\`${T} °C\`$. Quanto vale la sua tensione d’uscita?` : `L’uscita di un LM35 (10 mV/°C) vale $${Q(sc)(0.01 * T, 'V')}$. Quanto vale la temperatura?`, sol };
  });
  G('ntc', { topic: 'u25', levels: [2], uses: ['c.ntc', 'f.ntc', 'm.exp'] }, (sc, r) => {
    const R0 = pick(r, [10000, 4700, 100000]), B = pick(r, [3435, 3950, 4250]), T = pick(r, [0, 10, 40, 50, 60, 80]);
    const sol = D.ntc({ R0, B, T }, sc);
    return { text: `Un termistore NTC ha $R_{25} = ${Q(sc)(R0, 'Ω')}$ a 25 °C e $B = ${B} "K"$. Quanto vale la sua resistenza a $\`${T} °C\`$?`, sol };
  });
  G('ldr', { topic: 'u25', uses: ['c.ldr', 'f.part'] }, (sc, r) => {
    const V = 5, R = R_E12(r, 1000, 47000), Rs = pick(r, [200, 1000, 5000, 20000, 100000]);
    const sol = D.sensorDivider({ V, R, Rs }, sc);
    return { text: `Una fotoresistenza è in basso in un partitore con $R = ${Q(sc)(R, 'Ω')}$, alimentato a $\`5 V\`$. Con la luce di adesso la fotoresistenza vale $R_S = ${Q(sc)(Rs, 'Ω')}$. Quanto vale la tensione sul partitore (ai capi della fotoresistenza)?`, sol };
  });
  G('condizionamento', { topic: 'u25', levels: [2, 3], uses: ['f.condizionamento', 'f.quanto'] }, (sc, r) => {
    const a = pick(r, [0, 0.1, 0.2, 0.5, 1]), b = a + pick(r, [0.5, 1, 2]), VFS = pick(r, [5, 3.3]);
    const find = pick(r, ['G', 'Voff', 'Vout']);
    if (find === 'Voff' && a === 0) return null;
    const Vs = +(a + (b - a) * r()).toFixed(2);
    const sol = D.conditioning({ a, b, VFS, Vs, find }, sc);
    return { text: `Un sensore dà da $${Q(sc)(a, 'V')}$ a $${Q(sc)(b, 'V')}$ nel suo campo di misura; l’ingresso dell’A/D va da $\`0 V\`$ a $${Q(sc)(VFS, 'V')}$. ${{ G: 'Quale guadagno serve?', Voff: 'Quale spostamento (offset) va aggiunto dopo il guadagno?', Vout: `Quanto vale l’uscita del condizionamento quando il sensore dà $${Q(sc)(Vs, 'V')}$?` }[find]}`, sol };
  });
  G('sensibilita', { topic: 'u25', uses: ['f.sensibilita'] }, (sc, r) => {
    const T1 = 20, T2 = pick(r, [40, 60, 80, 100]), V1 = pick(r, [0.2, 0.5, 1]), S0 = pick(r, [0.01, 0.02, 0.005]);
    const V2 = V1 + S0 * (T2 - T1);
    const v = (V2 - V1) / (T2 - T1);
    return { text: `Un sensore di temperatura dà $${Q(sc)(V1, 'V')}$ a $\`${T1} °C\`$ e $${Q(sc)(V2, 'V')}$ a $\`${T2} °C\`$, con caratteristica lineare. Quanto vale la sensibilità, in volt per grado?`, sol: { sym: 'S', u: 'V/°C', v, steps: [step('S = {Delta V}/{Delta T}', `S = {${Q(sc)(V2, 'V')} - ${Q(sc)(V1, 'V')}}/{\`${T2} °C\` - \`${T1} °C\`} = \`${U.num(v, { sig: 3 })} V/°C\``, v, 'V/°C')], mistakes: [{ id: 'formula-inversa', v: (T2 - T1) / (V2 - V1) }, { id: 'prefisso', v: v * 1000 }] } };
  });

  /* ======================= Generatori trasversali ======================= */
  // grandezze, unità e simboli: si abbinano solo quelle già incontrate
  const QUANT = [
    ['q.Q', 'carica', 'Q', 'coulomb (C)'], ['q.I', 'corrente', 'I', 'ampere (A)'], ['q.V', 'tensione', 'V', 'volt (V)'], ['q.P', 'potenza', 'P', 'watt (W)'],
    ['q.W', 'energia', 'W', 'joule (J)'], ['q.R', 'resistenza', 'R', 'ohm (Ω)'], ['q.t', 'tempo', 't', 'secondo (s)'], ['q.C', 'capacità', 'C', 'farad (F)'],
    ['q.L', 'induttanza', 'L', 'henry (H)'], ['q.f', 'frequenza', 'f', 'hertz (Hz)'], ['q.T', 'periodo', 'T', 'secondo (s)'], ['q.w', 'pulsazione', 'ω', 'radianti al secondo (rad/s)'],
    ['q.Z', 'impedenza', 'Z', 'ohm (Ω)'], ['q.X', 'reattanza', 'X', 'ohm (Ω)'], ['q.S', 'potenza apparente', 'S', 'voltampere (VA)'], ['q.Qr', 'potenza reattiva', 'Q', 'var'],
    ['q.rho', 'resistività', 'ρ', 'ohm per metro (Ω·m)'], ['q.tau', 'costante di tempo', 'τ', 'secondo (s)'], ['q.dB', 'guadagno in decibel', 'G', 'decibel (dB)'],
  ];
  G('abbina.grandezze', { topic: 'u1', kind: 'abbina', uses: [] }, (sc, r) => {
    const known = QUANT.filter((q) => !sc.known || sc.known.has(q[0]));
    // unità diverse fra loro (tempo e periodo hanno la stessa: se ne tiene una sola)
    const seen = new Set();
    const pool = shuffle(r, known).filter((q) => { if (seen.has(q[3])) return false; seen.add(q[3]); return true; });
    if (pool.length < 3) return null;
    const chosen = pool.slice(0, Math.min(4, pool.length));
    const mode = r() < 0.5 ? 'unita' : 'simbolo';
    return { pairs: chosen.map((q) => ({ a: q[1], b: mode === 'unita' ? q[3] : q[2] })), text: mode === 'unita' ? 'Abbina ogni grandezza alla sua unità di misura.' : 'Abbina ogni grandezza al suo simbolo.', uses: chosen.map((q) => q[0]), sol: { sym: 'abbina', u: '', v: 0, steps: [step('"grandezze"', chosen.map((q) => `"${q[1]}: ${mode === 'unita' ? q[3] : q[2]}"`).join('; '), null, '')], mistakes: [] } };
  });
  // simboli dei componenti: dal simbolo al nome
  const COMP = [['c.R', 'R', 'resistore'], ['c.gen', 'V', 'generatore di tensione'], ['c.genI', 'I', 'generatore di corrente'], ['c.SW', 'SW', 'interruttore'], ['c.lamp', 'LAMP', 'lampada'], ['c.VM', 'VM', 'voltmetro'], ['c.AM', 'AM', 'amperometro'],
    ['c.C', 'C', 'condensatore'], ['c.L', 'L', 'induttore'], ['c.D', 'D', 'diodo'], ['c.LED', 'LED', 'LED'], ['c.DZ', 'DZ', 'diodo Zener'], ['c.pot', 'RV', 'resistore variabile'], ['c.ldr', 'LDR', 'fotoresistore'], ['c.ntc', 'NTC', 'termistore NTC']];
  G('simbolo', { topic: 'u2', kind: 'simbolo', uses: [] }, (sc, r) => {
    const known = COMP.filter((c) => !sc.known || sc.known.has(c[0]));
    if (known.length < 3) return null;
    const c = pick(r, known);
    const others = shuffle(r, known.filter((x) => x !== c)).slice(0, 3);
    return { symbol: c[1], text: 'Che componente rappresenta questo simbolo?', uses: [c[0]], choices: shuffle(r, [c].concat(others)).map((x) => ({ label: x[2], right: x === c, mistake: x === c ? null : 'simbolo' })), sol: { sym: 'simbolo', u: '', v: 0, steps: [step('"simbolo"', `"${c[2]}"`, null, '')], mistakes: [] } };
  });
  const api = { QUANT, COMP, FAM, randExpr, randFn };
  root.ElekProblems2 = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
