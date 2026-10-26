/* ELEKTRON — formule. Un piccolo linguaggio diventa MathML (leggibile dai lettori di schermo) e un testo alternativo in italiano.
   Sintassi:
     R_1  R_{eq}  V_{CE,sat}     simbolo con pedice (il simbolo è una lettera, eventualmente greca: tau, omega, phi, beta, Delta…)
     a + b   a - b   a * b (si scrive «·»)   a / b (frazione)   {a + b}/{c}  (graffe: gruppo invisibile)
     a^2  e^{-t/tau}   sqrt(x)   ln(x)  log(x)  sin(x)  cos(x)  arctan(x)   |x|   (x)
     `4,7 kΩ`   quantità già scritta all'italiana (numero e unità), tra apici inversi
     12  0,5   numeri;  "testo"  testo normale;  =  ≈  →  <  >  ≤  ≥  ∠  ±  °
   Uso: toMathML(src) → '<math …>…</math>'; toText(src) → testo semplice; speak(src) → lettura in italiano. */
(function (root) {
  'use strict';
  const GREEK = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', eta: 'η', theta: 'θ', lambda: 'λ', mu: 'μ',
    pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', varphi: 'φ', omega: 'ω', Omega: 'Ω', Phi: 'Φ',
  };
  const GREEK_SPEAK = { 'α': 'alfa', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'Δ': 'delta', 'ε': 'epsilon', 'η': 'eta', 'θ': 'teta', 'λ': 'lambda', 'μ': 'mu', 'π': 'pi greco', 'ρ': 'ro', 'σ': 'sigma', 'τ': 'tau', 'φ': 'fi', 'ω': 'omega', 'Ω': 'omega', 'Φ': 'fi' };
  const FUNCS = new Set(['sqrt', 'ln', 'log', 'sin', 'cos', 'tan', 'arctan', 'arcsin', 'arccos', 'exp', 'Re', 'Im', 'max', 'min']);
  const RELS = { '=': 'uguale', '≈': 'circa uguale a', '≠': 'diverso da', '<': 'minore di', '>': 'maggiore di', '≤': 'minore o uguale a', '≥': 'maggiore o uguale a', '→': 'quindi', '⇒': 'quindi', ':': ':' };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- Analisi lessicale ---------- */
  function lex(src) {
    const t = [];
    let i = 0;
    const s = String(src);
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '`') { const j = s.indexOf('`', i + 1); if (j < 0) throw new Error('quantità non chiusa in ' + src); t.push({ k: 'q', v: s.slice(i + 1, j) }); i = j + 1; continue; }
      if (c === '"') { const j = s.indexOf('"', i + 1); if (j < 0) throw new Error('testo non chiuso in ' + src); t.push({ k: 'txt', v: s.slice(i + 1, j) }); i = j + 1; continue; }
      if (/[0-9]/.test(c) || (c === ',' && /[0-9]/.test(s[i + 1] || ''))) {
        let j = i; while (j < s.length && /[0-9,]/.test(s[j])) j++;
        // una virgola finale è punteggiatura, non decimale
        let v = s.slice(i, j); if (v.endsWith(',')) { v = v.slice(0, -1); j--; }
        t.push({ k: 'num', v }); i = j; continue;
      }
      if (/[A-Za-zÀ-ÿΑ-ωµ]/.test(c)) {
        let j = i; while (j < s.length && /[A-Za-zÀ-ÿΑ-ωµ]/.test(s[j])) j++;
        t.push({ k: 'id', v: s.slice(i, j) }); i = j; continue;
      }
      if (s.startsWith('<=', i) || s.startsWith('>=', i)) { t.push({ k: 'rel', v: c === '<' ? '≤' : '≥' }); i += 2; continue; }
      if (s.startsWith('≤', i) || s.startsWith('≥', i)) { t.push({ k: 'rel', v: c }); i++; continue; }
      if ('=≈≠<>→⇒'.includes(c)) { t.push({ k: 'rel', v: c }); i++; continue; }
      if ('+-−±·*×/÷^_(){}|∠°\'⊕'.includes(c)) { t.push({ k: 'op', v: c === '−' ? '-' : c }); i++; continue; }
      if (c === ':' || c === ';' || c === '…' || c === ',') { t.push({ k: 'punct', v: c }); i++; continue; }
      throw new Error(`carattere inatteso «${c}» in ${src}`);
    }
    return t;
  }

  /* ---------- Analisi sintattica: albero di nodi ---------- */
  function parse(src) {
    const T = lex(src);
    let p = 0;
    const peek = () => T[p], next = () => T[p++];
    const isOp = (v) => T[p] && T[p].k === 'op' && T[p].v === v;
    const expect = (v) => { if (!isOp(v)) throw new Error(`atteso «${v}» in ${src}`); p++; };
    function rel() {
      const parts = [expr()];
      const ops = [];
      for (;;) {
        const tk = peek();
        if (!tk) break;
        if (tk.k === 'rel' || tk.k === 'punct') { ops.push(next().v); if (peek()) parts.push(expr()); else parts.push({ t: 'txt', v: '' }); continue; }
        // un testo o una quantità accostati senza operatore: «"supera" 12 V», «"valore commerciale:" 4,7 kΩ»
        if (tk.k === 'txt' || tk.k === 'q' || (parts[parts.length - 1].t === 'txt')) { ops.push(' '); parts.push(expr()); continue; }
        break;
      }
      return ops.length ? { t: 'rel', parts, ops } : parts[0];
    }
    function expr() {
      let first = null;
      if (isOp('-') || isOp('±') || isOp('+')) { const o = next().v; first = { t: 'neg', o, x: term() }; }
      else first = term();
      const items = [first], ops = [];
      while (isOp('+') || isOp('-') || isOp('±') || isOp('⊕')) { ops.push(next().v); items.push(term()); }
      return ops.length ? { t: 'sum', items, ops } : items[0];
    }
    // la frazione lega più del prodotto: L * {Delta I}/{Delta t} è L · (ΔI/Δt)
    function term() {
      let left = fracs();
      for (;;) {
        if (isOp('*') || isOp('·') || isOp('×')) { next(); left = { t: 'mul', a: left, b: fracs() }; }
        else if (isOp('÷')) { next(); left = { t: 'div', a: left, b: fracs() }; }
        else if (isOp('∠')) { next(); left = { t: 'ang', a: left, b: fracs() }; }
        else return left;
      }
    }
    function fracs() {
      let left = fact();
      while (isOp('/')) { next(); left = { t: 'frac', a: left, b: fact() }; }
      return left;
    }
    function fact() {
      let b = unary();
      if (isOp('^')) { next(); const e = unary(); b = { t: 'pow', a: b, b: e }; }
      while (isOp('°')) { next(); b = { t: 'deg', x: b }; }
      return b;
    }
    function unary() {
      if (isOp('-')) { next(); return { t: 'neg', o: '-', x: unary() }; }
      return primary();
    }
    function sub() {
      // pedice: una parola o un gruppo tra graffe (testo libero, anche con virgole)
      if (isOp('{')) {
        next();
        let txt = '';
        let depth = 1;
        while (p < T.length) {
          const tk = T[p];
          if (tk.k === 'op' && tk.v === '{') depth++;
          if (tk.k === 'op' && tk.v === '}') { depth--; if (!depth) break; }
          txt += tk.k === 'punct' ? tk.v : tk.v === '-' ? '−' : tk.v;
          p++;
        }
        expect('}');
        return txt.replace(/,/g, ',');
      }
      const tk = next();
      // V_+ e V_-: gli ingressi dell'operazionale
      if (tk && tk.k === 'op' && (tk.v === '+' || tk.v === '-')) return tk.v === '-' ? '−' : '+';
      if (!tk || (tk.k !== 'id' && tk.k !== 'num')) throw new Error('pedice mancante in ' + src);
      return tk.v;
    }
    function primary() {
      const tk = peek();
      if (!tk) throw new Error('formula incompleta: ' + src);
      if (tk.k === 'num') { next(); return { t: 'num', v: tk.v }; }
      if (tk.k === 'q') { next(); return { t: 'q', v: tk.v }; }
      if (tk.k === 'txt') { next(); return { t: 'txt', v: tk.v }; }
      if (tk.k === 'op' && tk.v === '(') { next(); const x = rel(); expect(')'); return { t: 'par', x }; }
      if (tk.k === 'op' && tk.v === '{') { next(); const x = rel(); expect('}'); return { t: 'grp', x }; }
      if (tk.k === 'op' && tk.v === '|') { next(); const x = expr(); expect('|'); return { t: 'abs', x }; }
      if (tk.k === 'id') {
        next();
        if (FUNCS.has(tk.v) && isOp('(')) { next(); const x = rel(); expect(')'); return { t: 'fn', f: tk.v, x }; }
        // «Delta I»: la variazione si scrive attaccata alla grandezza
        if (tk.v === 'Delta' && peek() && peek().k === 'id') { const x = primary(); return { t: 'delta', x }; }
        let name = GREEK[tk.v] || tk.v;
        const node = { t: 'id', v: name };
        if (tk.v === 'e' || tk.v === 'j') node.upright = tk.v === 'e';
        if (isOp('_')) { next(); node.sub = sub(); }
        while (isOp('\'')) { next(); node.prime = (node.prime || 0) + 1; }
        // una grandezza funzione del tempo o della frequenza: v_C(t), H(f)
        if (isOp('(')) { next(); const x = rel(); expect(')'); return { t: 'call', f: node, x }; }
        return node;
      }
      throw new Error(`simbolo inatteso «${tk.v}» in ${src}`);
    }
    const tree = rel();
    if (p < T.length) throw new Error(`resto inatteso «${T.slice(p).map((x) => x.v).join(' ')}» in ${src}`);
    return tree;
  }

  /* ---------- MathML ---------- */
  const isLetterName = (v) => /^[A-Za-zΑ-ωµ]$/.test(v);
  function mml(n) {
    switch (n.t) {
      case 'num': return `<mn>${esc(n.v)}</mn>`;
      case 'q': {
        // «4,7 kΩ» → numero e unità in tondo, separati da uno spazio stretto
        const m = String(n.v).match(/^([−-]?[\d\s ]*[\d](?:,\d+)?)(?:[\s ]+(.+))?$/);
        if (!m) return `<mtext>${esc(n.v)}</mtext>`;
        const num = m[1].replace(/^-/, '−');
        return `<mrow><mn>${esc(num)}</mn>${m[2] ? `<mspace width="0.25em"></mspace><mi mathvariant="normal">${esc(m[2])}</mi>` : ''}</mrow>`;
      }
      case 'txt': return `<mtext>${esc(n.v)}</mtext>`;
      case 'id': {
        const v = esc(n.v);
        let base = isLetterName(n.v) ? `<mi${n.upright ? ' mathvariant="normal"' : ''}>${v}</mi>` : `<mi mathvariant="normal">${v}</mi>`;
        if (n.prime) base = `<msup>${base}<mo>${'′'.repeat(n.prime)}</mo></msup>`;
        return n.sub != null ? `<msub>${base}<mrow><mtext>${esc(n.sub)}</mtext></mrow></msub>` : base;
      }
      case 'rel': return `<mrow>${n.parts.map((x, i) => (i ? (n.ops[i - 1] === ' ' ? '<mspace width="0.3em"></mspace>' : `<mo>${esc(n.ops[i - 1])}</mo>`) : '') + mml(x)).join('')}</mrow>`;
      case 'sum': return `<mrow>${n.items.map((x, i) => (i ? `<mo>${n.ops[i - 1] === '-' ? '−' : esc(n.ops[i - 1])}</mo>` : '') + mml(x)).join('')}</mrow>`;
      case 'neg': return `<mrow><mo form="prefix">${n.o === '-' ? '−' : esc(n.o)}</mo>${mml(n.x)}</mrow>`;
      case 'mul': return `<mrow>${unwrap(n.a).t === 'neg' ? mml(n.a) : mmlF(n.a)}<mo>·</mo>${mmlF(n.b)}</mrow>`;
      case 'div': return `<mrow>${mml(n.a)}<mo>/</mo>${mml(n.b)}</mrow>`;
      case 'ang': return `<mrow>${mml(n.a)}<mo>∠</mo>${mml(n.b)}</mrow>`;
      case 'frac': return `<mfrac>${mml(unwrap(n.a))}${mml(unwrap(n.b))}</mfrac>`;
      case 'pow': return `<msup>${mml(n.a)}${mml(unwrap(n.b))}</msup>`;
      case 'deg': return `<mrow>${mml(n.x)}<mo>°</mo></mrow>`;
      case 'par': return `<mrow><mo>(</mo>${mml(n.x)}<mo>)</mo></mrow>`;
      case 'grp': return `<mrow>${mml(n.x)}</mrow>`;
      case 'delta': return `<mrow><mi mathvariant="normal">Δ</mi>${mml(n.x)}</mrow>`;
      case 'call': return `<mrow>${mml(n.f)}<mo>&#x2061;</mo><mrow><mo>(</mo>${mml(n.x)}<mo>)</mo></mrow></mrow>`;
      case 'abs': return `<mrow><mo>|</mo>${mml(n.x)}<mo>|</mo></mrow>`;
      case 'fn':
        if (n.f === 'sqrt') return `<msqrt>${mml(unwrap(n.x))}</msqrt>`;
        if (n.f === 'exp') return `<msup><mi mathvariant="normal">e</mi>${mml(unwrap(n.x))}</msup>`;
        return `<mrow><mi>${n.f}</mi><mo>&#x2061;</mo><mrow><mo>(</mo>${mml(n.x)}<mo>)</mo></mrow></mrow>`;
      default: throw new Error('nodo sconosciuto ' + n.t);
    }
  }
  const unwrap = (n) => (n.t === 'grp' ? n.x : n);
  // un fattore che è una somma (o un negativo) va fra parentesi visibili
  const needsPar = (n) => ['sum', 'neg'].includes(unwrap(n).t);
  const mmlF = (n) => (needsPar(n) ? `<mrow><mo>(</mo>${mml(unwrap(n))}<mo>)</mo></mrow>` : mml(n));
  const txtF = (n) => (needsPar(n) ? '(' + txt(unwrap(n)) + ')' : txt(n));

  /* ---------- Testo semplice e lettura ---------- */
  const SUBD = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
  const SUPD = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '−': '⁻' };
  function txt(n) {
    switch (n.t) {
      case 'num': case 'q': case 'txt': return String(n.v).replace(/^-/, '−');
      case 'id': {
        const s = n.sub == null ? '' : /^\d+$/.test(n.sub) ? n.sub.split('').map((d) => SUBD[d]).join('') : n.sub;
        return n.v + '′'.repeat(n.prime || 0) + s;
      }
      case 'rel': return n.parts.map((x, i) => (i ? (n.ops[i - 1] === ' ' ? ' ' : n.ops[i - 1] === ',' ? ', ' : ` ${n.ops[i - 1]} `) : '') + txt(x)).join('').replace(/ : /g, ': ').replace(/ +/g, ' ').trim();
      case 'sum': return n.items.map((x, i) => (i ? ` ${n.ops[i - 1] === '-' ? '−' : n.ops[i - 1]} ` : '') + txt(x)).join('');
      case 'neg': return (n.o === '-' ? '−' : n.o) + txt(n.x);
      case 'mul': return (unwrap(n.a).t === 'neg' ? txt(n.a) : txtF(n.a)) + ' · ' + txtF(n.b);
      case 'div': return txt(n.a) + ' / ' + txt(n.b);
      case 'ang': return txt(n.a) + '∠' + txt(n.b);
      case 'frac': { const a = unwrap(n.a), b = unwrap(n.b); const w = (x) => (['sum', 'mul', 'frac', 'neg'].includes(x.t) ? '(' + txt(x) + ')' : txt(x)); return w(a) + ' / ' + w(b); }
      case 'pow': { const e = unwrap(n.b); const t = txt(e); return txt(n.a) + (/^[−\-\d]+$/.test(t) ? t.split('').map((c) => SUPD[c] || c).join('') : '^(' + t + ')'); }
      case 'deg': return txt(n.x) + '°';
      case 'par': return '(' + txt(n.x) + ')';
      case 'grp': return txt(n.x);
      case 'delta': return 'Δ' + txt(n.x);
      case 'call': return txt(n.f) + '(' + txt(n.x) + ')';
      case 'abs': return '|' + txt(n.x) + '|';
      case 'fn': return n.f === 'sqrt' ? '√(' + txt(unwrap(n.x)) + ')' : n.f === 'exp' ? 'e^(' + txt(unwrap(n.x)) + ')' : n.f + '(' + txt(n.x) + ')';
      default: return '';
    }
  }
  const sayId = (v) => GREEK_SPEAK[v] || v;
  const UNIT_SPEAK = { 'Ω': 'ohm', V: 'volt', A: 'ampere', W: 'watt', F: 'farad', H: 'henry', Hz: 'hertz', s: 'secondi', J: 'joule', C: 'coulomb', VA: 'voltampere', var: 'var', dB: 'decibel', '°': 'gradi' };
  const PREF_SPEAK = { p: 'pico', n: 'nano', 'µ': 'micro', m: 'milli', k: 'chilo', M: 'mega', G: 'giga' };
  function sayQ(q) {
    const m = String(q).match(/^([−-]?[\d\s ]*\d(?:,\d+)?)(?:[\s ]+(.+))?$/);
    if (!m) return String(q);
    let u = m[2] || '';
    let out = m[1].replace(/[\s ]/g, '').replace(/^[−-]/, 'meno ');
    if (u) {
      const base = UNIT_SPEAK[u] ? '' : u[0];
      const rest = UNIT_SPEAK[u] ? u : u.slice(1);
      out += ' ' + (base && PREF_SPEAK[base] ? PREF_SPEAK[base] : base) + (UNIT_SPEAK[rest] || rest);
    }
    return out;
  }
  function speakN(n) {
    switch (n.t) {
      case 'num': return n.v;
      case 'q': return sayQ(n.v);
      case 'txt': return n.v;
      case 'id': return sayId(n.v) + (n.prime ? (n.prime === 1 ? ' primo' : n.prime === 2 ? ' secondo' : ' terzo') : '') + (n.sub != null ? ' ' + n.sub : '');
      case 'rel': return n.parts.map((x, i) => (i ? (n.ops[i - 1] === ' ' ? ' ' : ` ${RELS[n.ops[i - 1]] || n.ops[i - 1]} `) : '') + speakN(x)).join('').replace(/ +/g, ' ').trim();
      case 'sum': return n.items.map((x, i) => (i ? ` ${n.ops[i - 1] === '-' ? 'meno' : n.ops[i - 1] === '±' ? 'più o meno' : n.ops[i - 1] === '⊕' ? 'xor' : 'più'} ` : '') + speakN(x)).join('');
      case 'neg': return (n.o === '-' ? 'meno ' : n.o === '±' ? 'più o meno ' : '') + speakN(n.x);
      case 'mul': return speakN(n.a) + ' per ' + speakN(n.b);
      case 'div': return speakN(n.a) + ' diviso ' + speakN(n.b);
      case 'ang': return speakN(n.a) + ' con angolo ' + speakN(n.b);
      case 'frac': return 'frazione: ' + speakN(unwrap(n.a)) + ', fratto ' + speakN(unwrap(n.b)) + ', fine frazione';
      case 'pow': { const e = unwrap(n.b); return speakN(n.a) + (e.t === 'num' && e.v === '2' ? ' al quadrato' : ' elevato a ' + speakN(e)); }
      case 'deg': return speakN(n.x) + ' gradi';
      case 'par': return 'aperta parentesi ' + speakN(n.x) + ' chiusa parentesi';
      case 'grp': return speakN(n.x);
      case 'delta': return 'delta ' + speakN(n.x);
      case 'call': return speakN(n.f) + ' di ' + speakN(n.x);
      case 'abs': return 'modulo di ' + speakN(n.x);
      case 'fn': return { sqrt: 'radice quadrata di ', ln: 'logaritmo naturale di ', log: 'logaritmo in base 10 di ', exp: 'e elevato a ' }[n.f] ? { sqrt: 'radice quadrata di ', ln: 'logaritmo naturale di ', log: 'logaritmo in base 10 di ', exp: 'e elevato a ' }[n.f] + speakN(unwrap(n.x)) : n.f + ' di ' + speakN(n.x);
      default: return '';
    }
  }

  const cache = new Map();
  function tree(src) { if (!cache.has(src)) { if (cache.size > 4000) cache.clear(); cache.set(src, parse(src)); } return cache.get(src); }
  function toMathML(src, o = {}) {
    const t = tree(src);
    const alt = speakN(t);
    return `<math${o.block ? ' display="block"' : ''} alttext="${esc(alt)}"><mrow>${mml(t)}</mrow></math>`;
  }
  const toText = (src) => txt(tree(src));
  const speak = (src) => speakN(tree(src));
  // una quantità scritta pronta per le formule: q(4700, 'Ω') → «`4,7 kΩ`»; con paren i negativi vanno tra parentesi
  function q(v, unit, o = {}) {
    const U = root.ElekUnits || require('./units.js');
    const s = U.fmt(v, unit, o);
    return (o.paren && /^−/.test(s) ? '(`' + s + '`)' : '`' + s + '`');
  }

  const api = { parse, toMathML, toText, speak, q, GREEK };
  root.ElekMath = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
