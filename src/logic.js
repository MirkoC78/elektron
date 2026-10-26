/* ELEKTRON — logica: espressioni booleane, tabelle di verità, forme canoniche, minimizzazione esatta (Quine–McCluskey
   con il metodo di Petrick), mappe di Karnaugh, reti di porte, reti sequenziali simulate fronte per fronte.
   Notazione: AND «·», OR «+», NOT con la barra sopra (nel testo semplice A̅), XOR «⊕».
   Le espressioni scritte dallo studente si leggono anche come A'B + C, !A&B|C, AB̄+C, not A and B. */
(function (root) {
  'use strict';
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ======================= Espressioni ======================= */
  // nodi: { op: 'var', v } | { op: 'const', v } | { op: 'not', x } | { op: 'and', xs } | { op: 'or', xs } | { op: 'xor', xs }
  const V = (v) => ({ op: 'var', v });
  const K = (v) => ({ op: 'const', v: v ? 1 : 0 });
  const NOT = (x) => ({ op: 'not', x });
  const AND = (...xs) => ({ op: 'and', xs });
  const OR = (...xs) => ({ op: 'or', xs });
  const XOR = (...xs) => ({ op: 'xor', xs });

  function lex(src) {
    // la barra sopra una lettera (combinante: macron U+0304 o sopralineatura U+0305) vale come negazione
    const s = String(src).replace(/[̄̅]/g, "'").replace(/[’′`´]/g, "'");
    const t = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      const w = s.slice(i).match(/^(not|and|or|xor|nand|nor)\b/i);
      if (w && (i === 0 || !/[A-Za-z]/.test(s[i - 1]))) { t.push({ k: 'w', v: w[1].toLowerCase() }); i += w[1].length; continue; }
      if (/[A-Za-z]/.test(c)) { t.push({ k: 'var', v: c.toUpperCase() }); i++; continue; }
      if (c === '0' || c === '1') { t.push({ k: 'const', v: +c }); i++; continue; }
      if ("()'!¬~·*&.+|⊕^".includes(c)) { t.push({ k: 'op', v: c }); i++; continue; }
      throw new Error(`carattere non ammesso «${c}»`);
    }
    return t;
  }
  // precedenza: NOT, poi AND, poi XOR, poi OR
  function parse(src) {
    const T = lex(src);
    let p = 0;
    const peek = () => T[p];
    const isOp = (...v) => T[p] && T[p].k === 'op' && v.includes(T[p].v);
    const isW = (v) => T[p] && T[p].k === 'w' && T[p].v === v;
    function orE() { const xs = [xorE()]; while (isOp('+', '|') || isW('or')) { p++; xs.push(xorE()); } return xs.length > 1 ? OR(...xs) : xs[0]; }
    function xorE() { const xs = [andE()]; while (isOp('⊕', '^') || isW('xor')) { p++; xs.push(andE()); } return xs.length > 1 ? XOR(...xs) : xs[0]; }
    function startsFactor() { const t = peek(); return t && (t.k === 'var' || t.k === 'const' || (t.k === 'op' && '(!¬~'.includes(t.v)) || (t.k === 'w' && t.v === 'not')); }
    function andE() {
      const xs = [notE()];
      for (;;) {
        if (isOp('·', '*', '&', '.') || isW('and')) { p++; xs.push(notE()); continue; }
        // AND sottinteso: AB, A(B+C), (A+B)(C+D)
        if (startsFactor()) { xs.push(notE()); continue; }
        break;
      }
      return xs.length > 1 ? AND(...xs) : xs[0];
    }
    function notE() {
      if (isOp('!', '¬', '~') || isW('not')) { p++; return NOT(notE()); }
      let x = prim();
      while (isOp("'")) { p++; x = NOT(x); }
      return x;
    }
    function prim() {
      const t = peek();
      if (!t) throw new Error('espressione incompleta');
      if (t.k === 'var') { p++; return V(t.v); }
      if (t.k === 'const') { p++; return K(t.v); }
      if (t.k === 'op' && t.v === '(') { p++; const x = orE(); if (!isOp(')')) throw new Error('manca una parentesi chiusa'); p++; return x; }
      throw new Error(`simbolo inatteso «${t.v}»`);
    }
    const x = orE();
    if (p < T.length) throw new Error(`simbolo inatteso «${T[p].v}»`);
    return x;
  }
  function evalE(x, a) {
    switch (x.op) {
      case 'var': if (!(x.v in a)) throw new Error('variabile senza valore ' + x.v); return a[x.v] ? 1 : 0;
      case 'const': return x.v;
      case 'not': return evalE(x.x, a) ? 0 : 1;
      case 'and': return x.xs.every((y) => evalE(y, a)) ? 1 : 0;
      case 'or': return x.xs.some((y) => evalE(y, a)) ? 1 : 0;
      case 'xor': return x.xs.reduce((s, y) => s ^ evalE(y, a), 0);
      default: throw new Error('nodo ' + x.op);
    }
  }
  function varsOf(x, set = new Set()) {
    if (x.op === 'var') set.add(x.v);
    else if (x.op === 'not') varsOf(x.x, set);
    else if (x.xs) x.xs.forEach((y) => varsOf(y, set));
    return [...set].sort();
  }
  // numero di letterali (costo di una forma a due livelli)
  const literals = (x) => (x.op === 'var' ? 1 : x.op === 'const' ? 0 : x.op === 'not' ? literals(x.x) : x.xs.reduce((s, y) => s + literals(y), 0));

  /* ---------- Scrittura ---------- */
  const PREC = { or: 1, xor: 2, and: 3, not: 4, var: 5, const: 5 };
  function text(x, parent = 0) {
    let s;
    switch (x.op) {
      case 'var': return x.v;
      case 'const': return String(x.v);
      case 'not': return x.x.op === 'var' ? x.x.v + '̅' : '¬(' + text(x.x) + ')';
      case 'and': s = x.xs.map((y) => text(y, PREC.and)).join('·'); break;
      case 'or': s = x.xs.map((y) => text(y, PREC.or)).join(' + '); break;
      case 'xor': s = x.xs.map((y) => text(y, PREC.xor)).join(' ⊕ '); break;
      default: s = '';
    }
    return PREC[x.op] < parent ? '(' + s + ')' : s;
  }
  function mml(x, parent = 0) {
    let s;
    switch (x.op) {
      case 'var': return `<mi>${esc(x.v)}</mi>`;
      case 'const': return `<mn>${x.v}</mn>`;
      case 'not': return `<mover accent="true"><mrow>${mml(x.x)}</mrow><mo stretchy="true">‾</mo></mover>`;
      case 'and': s = x.xs.map((y) => mml(y, PREC.and)).join('<mo>·</mo>'); break;
      case 'or': s = x.xs.map((y) => mml(y, PREC.or)).join('<mo>+</mo>'); break;
      case 'xor': s = x.xs.map((y) => mml(y, PREC.xor)).join('<mo>⊕</mo>'); break;
      default: s = '';
    }
    return PREC[x.op] < parent ? `<mrow><mo>(</mo>${s}<mo>)</mo></mrow>` : `<mrow>${s}</mrow>`;
  }
  function speak(x, parent = 0) {
    let s;
    switch (x.op) {
      case 'var': return x.v;
      case 'const': return String(x.v);
      case 'not': return x.x.op === 'var' ? x.x.v + ' negato' : 'negazione di (' + speak(x.x) + ')';
      case 'and': s = x.xs.map((y) => speak(y, PREC.and)).join(' and '); break;
      case 'or': s = x.xs.map((y) => speak(y, PREC.or)).join(' or '); break;
      case 'xor': s = x.xs.map((y) => speak(y, PREC.xor)).join(' xor '); break;
      default: s = '';
    }
    return PREC[x.op] < parent ? 'aperta parentesi ' + s + ' chiusa parentesi' : s;
  }
  const toMathML = (x, lhs) => `<math alttext="${esc((lhs ? lhs + ' uguale ' : '') + speak(x))}"><mrow>${lhs ? `<mi>${esc(lhs)}</mi><mo>=</mo>` : ''}${mml(x)}</mrow></math>`;

  /* ======================= Tabelle di verità ======================= */
  // righe nell'ordine binario: la prima variabile è il bit più significativo
  function table(fn, vars) {
    const n = vars.length;
    const rows = [];
    for (let m = 0; m < 1 << n; m++) {
      const a = {};
      vars.forEach((v, i) => { a[v] = (m >> (n - 1 - i)) & 1; });
      rows.push({ m, in: vars.map((v) => a[v]), out: typeof fn === 'function' ? fn(a) : evalE(fn, a) });
    }
    return rows;
  }
  const mintermsOf = (x, vars) => table(x, vars).filter((r) => r.out).map((r) => r.m);
  function equivalent(x, y) {
    const vars = [...new Set(varsOf(x).concat(varsOf(y)))].sort();
    return table(x, vars).every((r, i) => r.out === table(y, vars)[i].out);
  }
  // forme canoniche: somma di mintermini e prodotto di maxtermini
  function canonicalSOP(minterms, vars) {
    if (!minterms.length) return K(0);
    const n = vars.length;
    return OR(...minterms.map((m) => AND(...vars.map((v, i) => ((m >> (n - 1 - i)) & 1 ? V(v) : NOT(V(v)))))));
  }
  function canonicalPOS(minterms, vars) {
    const n = vars.length;
    const max = [];
    for (let m = 0; m < 1 << n; m++) if (!minterms.includes(m)) max.push(m);
    if (!max.length) return K(1);
    return AND(...max.map((m) => OR(...vars.map((v, i) => ((m >> (n - 1 - i)) & 1 ? NOT(V(v)) : V(v))))));
  }

  /* ======================= Minimizzazione ======================= */
  const toBits = (m, n) => m.toString(2).padStart(n, '0');
  const covers = (imp, m, n) => { const b = toBits(m, n); for (let i = 0; i < n; i++) if (imp[i] !== '-' && imp[i] !== b[i]) return false; return true; };
  function primes(terms, n) {
    let cur = [...new Set(terms.map((m) => toBits(m, n)))];
    const primeSet = new Set();
    while (cur.length) {
      const used = new Set(), next = new Set();
      for (let i = 0; i < cur.length; i++) for (let j = i + 1; j < cur.length; j++) {
        const a = cur[i], b = cur[j];
        let diff = -1, ok = true;
        for (let k = 0; k < n; k++) if (a[k] !== b[k]) { if (a[k] === '-' || b[k] === '-' || diff >= 0) { ok = false; break; } diff = k; }
        if (ok && diff >= 0) { used.add(a); used.add(b); next.add(a.slice(0, diff) + '-' + a.slice(diff + 1)); }
      }
      for (const a of cur) if (!used.has(a)) primeSet.add(a);
      cur = [...next];
    }
    return [...primeSet];
  }
  const impLits = (imp) => [...imp].filter((c) => c !== '-').length;
  /* tutte le coperture minime: prima il numero di implicanti, poi il numero di letterali.
     minterms: gli 1 della funzione; dc: le condizioni indifferenti. */
  function minimize(minterms, n, dc = []) {
    if (!minterms.length) return { solutions: [[]], primes: [], zero: true };
    const P = primes(minterms.concat(dc), n);
    // metodo di Petrick: per ogni mintermine, l'insieme degli implicanti primi che lo coprono
    const sets = minterms.map((m) => P.map((p, i) => (covers(p, m, n) ? i : -1)).filter((i) => i >= 0));
    let prods = [new Set()];
    for (const s of sets) {
      const next = [];
      for (const pr of prods) for (const i of s) { const x = new Set(pr); x.add(i); next.push(x); }
      // assorbimento: si tengono solo gli insiemi che non ne contengono un altro
      const uniq = [...new Map(next.map((x) => [[...x].sort().join(','), x])).values()].sort((a, b) => a.size - b.size);
      prods = uniq.filter((x, k) => !uniq.slice(0, k).some((y) => y.size < x.size && [...y].every((e) => x.has(e))));
      if (prods.length > 5000) prods = prods.slice(0, 5000);
    }
    const cost = (x) => [x.size, [...x].reduce((s, i) => s + impLits(P[i]), 0)];
    let best = null;
    for (const x of prods) { const c = cost(x); if (!best || c[0] < best[0] || (c[0] === best[0] && c[1] < best[1])) best = c; }
    const sols = prods.filter((x) => { const c = cost(x); return c[0] === best[0] && c[1] === best[1]; }).map((x) => [...x].map((i) => P[i]).sort());
    const uniqSols = [...new Map(sols.map((s) => [s.join('|'), s])).values()];
    return { solutions: uniqSols, primes: P, cost: { terms: best[0], literals: best[1] } };
  }
  function impToTerm(imp, vars) {
    const lits = [];
    [...imp].forEach((c, i) => { if (c === '1') lits.push(V(vars[i])); else if (c === '0') lits.push(NOT(V(vars[i]))); });
    return lits.length === 0 ? K(1) : lits.length === 1 ? lits[0] : AND(...lits);
  }
  function impToSum(imp, vars) {
    const lits = [];
    [...imp].forEach((c, i) => { if (c === '0') lits.push(V(vars[i])); else if (c === '1') lits.push(NOT(V(vars[i]))); });
    return lits.length === 0 ? K(0) : lits.length === 1 ? lits[0] : OR(...lits);
  }
  // forma minima somma di prodotti (una delle coperture minime; tutte in .all)
  function minimalSOP(minterms, vars, dc = []) {
    const n = vars.length;
    const r = minimize(minterms, n, dc);
    const build = (sol) => (r.zero ? K(0) : sol.length === 1 ? impToTerm(sol[0], vars) : OR(...sol.map((i) => impToTerm(i, vars))));
    return { expr: build(r.solutions[0]), all: r.solutions.map(build), implicants: r.solutions[0], solutions: r.solutions, cost: r.cost, primes: r.primes };
  }
  // forma minima prodotto di somme: si minimizza la funzione negata (gli 0) e si applica De Morgan
  function minimalPOS(minterms, vars, dc = []) {
    const n = vars.length;
    const zeros = [];
    for (let m = 0; m < 1 << n; m++) if (!minterms.includes(m) && !dc.includes(m)) zeros.push(m);
    if (!zeros.length) return { expr: K(1), all: [K(1)], implicants: [], solutions: [[]] };
    const r = minimize(zeros, n, dc);
    const build = (sol) => (sol.length === 1 ? impToSum(sol[0], vars) : AND(...sol.map((i) => impToSum(i, vars))));
    return { expr: build(r.solutions[0]), all: r.solutions.map(build), implicants: r.solutions[0], solutions: r.solutions, cost: r.cost };
  }

  /* ======================= Mappe di Karnaugh ======================= */
  const GRAY2 = [0, 1, 3, 2];
  // disposizione: 2 variabili (righe A, colonne B), 3 (righe A, colonne BC), 4 (righe AB, colonne CD)
  function kmapLayout(vars) {
    const n = vars.length;
    if (n < 2 || n > 4) throw new Error('mappe di Karnaugh da 2 a 4 variabili');
    const rv = n === 4 ? vars.slice(0, 2) : vars.slice(0, 1);
    const cv = n === 2 ? vars.slice(1) : n === 3 ? vars.slice(1) : vars.slice(2);
    const rOrder = rv.length === 2 ? GRAY2 : [0, 1];
    const cOrder = cv.length === 2 ? GRAY2 : [0, 1];
    const lab = (k, len) => k.toString(2).padStart(len, '0');
    const cell = (ri, ci) => (rOrder[ri] << cv.length) | cOrder[ci];
    return {
      rowVars: rv, colVars: cv,
      rows: rOrder.map((k) => lab(k, rv.length)), cols: cOrder.map((k) => lab(k, cv.length)),
      cell, // minterm della casella (riga, colonna)
      pos: (m) => { const r = m >> cv.length, c = m & ((1 << cv.length) - 1); return [rOrder.indexOf(r), cOrder.indexOf(c)]; },
    };
  }
  // caselle di un implicante (gruppo): per disegnare i rettangoli, anche quelli che passano dal bordo
  function groupCells(imp, vars) {
    const n = vars.length, L = kmapLayout(vars);
    const out = [];
    for (let m = 0; m < 1 << n; m++) if (covers(imp, m, n)) out.push(L.pos(m));
    return out;
  }
  // mappa di una funzione: valori 0, 1, «-» (indifferente) nelle caselle
  function kmap(minterms, vars, dc = []) {
    const L = kmapLayout(vars);
    const grid = L.rows.map((_, ri) => L.cols.map((_, ci) => { const m = L.cell(ri, ci); return minterms.includes(m) ? 1 : dc.includes(m) ? '-' : 0; }));
    return Object.assign({ grid }, L);
  }

  /* ======================= Reti di porte ======================= */
  const GATES = {
    AND: (xs) => (xs.every(Boolean) ? 1 : 0), OR: (xs) => (xs.some(Boolean) ? 1 : 0), NOT: (xs) => (xs[0] ? 0 : 1), BUF: (xs) => (xs[0] ? 1 : 0),
    NAND: (xs) => (xs.every(Boolean) ? 0 : 1), NOR: (xs) => (xs.some(Boolean) ? 0 : 1), XOR: (xs) => xs.reduce((s, x) => s ^ (x ? 1 : 0), 0), XNOR: (xs) => (xs.reduce((s, x) => s ^ (x ? 1 : 0), 0) ? 0 : 1),
  };
  /* rete: { inputs: ['A','B'], gates: [{ id, type, in: ['A','G1'] }], outputs: { Y: 'G2' } } — valuta in ordine topologico */
  function simulate(net, a) {
    const val = Object.assign({}, a);
    const pending = net.gates.slice();
    let guard = 0;
    while (pending.length) {
      if (++guard > 1000) throw new Error('rete con un anello: non è combinatoria');
      const g = pending.shift();
      if (!g.in.every((s) => s in val)) { pending.push(g); continue; }
      val[g.id] = GATES[g.type](g.in.map((s) => val[s]));
    }
    const out = {};
    for (const [k, s] of Object.entries(net.outputs)) out[k] = val[s];
    return { out, signals: val };
  }
  // espressione di un segnale della rete (per «dallo schema all'espressione»)
  function exprOf(net, sig) {
    const g = net.gates.find((x) => x.id === sig);
    if (!g) return V(sig);
    const xs = g.in.map((s) => exprOf(net, s));
    switch (g.type) {
      case 'AND': return AND(...xs); case 'OR': return OR(...xs); case 'XOR': return XOR(...xs);
      case 'NOT': return NOT(xs[0]); case 'BUF': return xs[0];
      case 'NAND': return NOT(AND(...xs)); case 'NOR': return NOT(OR(...xs)); case 'XNOR': return NOT(XOR(...xs));
      default: throw new Error('porta ' + g.type);
    }
  }
  // rete di porte da un'espressione (una porta per operatore, NOT sugli ingressi)
  function netOf(x) {
    const gates = [];
    let k = 0;
    const inputs = varsOf(x);
    function go(y) {
      if (y.op === 'var') return y.v;
      if (y.op === 'const') return String(y.v);
      if (y.op === 'not') { const s = go(y.x); const id = 'G' + ++k; gates.push({ id, type: 'NOT', in: [s] }); return id; }
      const ins = y.xs.map(go);
      const id = 'G' + ++k;
      gates.push({ id, type: y.op.toUpperCase(), in: ins });
      return id;
    }
    const out = go(x);
    return { inputs, gates, outputs: { Y: out } };
  }
  // blocchi combinatori notevoli
  const mux = (sel, data) => data[sel.reduce((s, b) => (s << 1) | b, 0)];
  const decoder = (sel, n) => { const k = sel.reduce((s, b) => (s << 1) | b, 0); return Array.from({ length: n }, (_, i) => (i === k ? 1 : 0)); };
  const halfAdder = (a, b) => ({ S: a ^ b, C: a & b });
  const fullAdder = (a, b, c) => ({ S: a ^ b ^ c, C: (a & b) | (c & (a ^ b)) });

  /* ======================= Reti sequenziali ======================= */
  // stato successivo dei flip-flop (sul fronte attivo del clock)
  const NEXT = {
    D: (q, i) => i.D,
    T: (q, i) => (i.T ? 1 - q : q),
    JK: (q, i) => (i.J && i.K ? 1 - q : i.J ? 1 : i.K ? 0 : q),
    SR: (q, i) => { if (i.S && i.R) return null; return i.S ? 1 : i.R ? 0 : q; }, // null: combinazione vietata
  };
  // latch SR a porte NOR (asincrono): stato dopo gli ingressi
  function latchSR(q, S, R) { if (S && R) return { q: 0, nq: 0, vietato: true }; const nq = S ? 1 : R ? 0 : q; return { q: nq, nq: 1 - nq, vietato: false }; }
  /* simulazione di un flip-flop: inputs = [{ D: 1 }, { D: 0 }, …] (gli ingressi presenti prima di ogni fronte); q0 iniziale */
  function runFF(type, inputs, q0 = 0) {
    let q = q0;
    const out = [q];
    for (const i of inputs) { const n = NEXT[type](q, i); if (n == null) { out.push(null); continue; } q = n; out.push(q); }
    return out;
  }
  // contatore binario a n bit (sincrono o asincrono: la sequenza degli stati è la stessa); modulo N con il reset
  function counter(n, o = {}) {
    const mod = o.mod || 2 ** n;
    const states = [];
    let s = o.start || 0;
    for (let k = 0; k < (o.steps || mod + 1); k++) { states.push(s); s = o.down ? (s - 1 + mod) % mod : (s + 1) % mod; }
    return states;
  }
  // contatore asincrono a n bit: ogni flip-flop T commuta sul fronte di discesa dell'uscita precedente (il primo sul clock)
  function rippleCounter(n, clocks) {
    const q = Array(n).fill(0);
    const seq = [q.slice()];
    for (let k = 0; k < clocks; k++) {
      // fronte di discesa del clock: commuta Q0; se Q0 passa da 1 a 0 commuta Q1, e così via
      for (let i = 0; i < n; i++) { const before = q[i]; q[i] = 1 - q[i]; if (!(before === 1 && q[i] === 0)) break; }
      seq.push(q.slice());
    }
    // valore del conteggio (Q0 bit meno significativo)
    return seq.map((b) => b.reduce((s, x, i) => s + (x << i), 0));
  }
  // registro a scorrimento a n bit (verso destra: il bit entra in Q0 e i precedenti scorrono)
  function shiftRegister(n, serialIn, init = 0) {
    let reg = Array(n).fill(init);
    const states = [reg.slice()];
    for (const b of serialIn) { reg = [b].concat(reg.slice(0, n - 1)); states.push(reg.slice()); }
    return states;
  }
  // diagramma temporale: per ogni periodo di clock due mezzi periodi (alto, basso); il segnale Q cambia sul fronte di salita
  function timing(qs) { const clk = [], q = []; qs.slice(1).forEach((v, k) => { clk.push(1, 0); q.push(qs[k] == null ? 0 : qs[k], v == null ? 0 : v); }); return { clk, q }; }

  const api = {
    V, K, NOT, AND, OR, XOR, parse, evalE, varsOf, literals, text, mml, speak, toMathML,
    table, mintermsOf, equivalent, canonicalSOP, canonicalPOS, primes, minimize, minimalSOP, minimalPOS, impToTerm, covers, toBits,
    kmapLayout, kmap, groupCells, GATES, simulate, exprOf, netOf, mux, decoder, halfAdder, fullAdder,
    NEXT, latchSR, runFF, counter, rippleCounter, shiftRegister, timing,
  };
  root.ElekLogic = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
