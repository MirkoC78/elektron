/* ELEKTRON — risolutori dei problemi. Ogni risolutore restituisce una soluzione:
     { sym, u, v, steps: [{ f, s, v, u }], mistakes: [{ id, v, why }] }
   sym è il simbolo dell'incognita nel linguaggio delle formule; steps è la traccia (formula, sostituzione, risultato con
   l'unità), mistakes sono le risposte sbagliate prodotte dagli errori tipici (mistakes.js).
   Il secondo argomento o porta il perimetro della lezione: o.prefixes (prefissi ammessi per scrivere i valori), o.sig.
   Convenzioni dei segni: docs/inventario-e-piano.md. */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const X = root.ElekCx || require('./cx.js');
  const MA = root.ElekMath || require('./math.js');
  const CI = root.ElekCircuit || require('./circuit.js');
  const MNA = root.ElekMNA || require('./mna.js');
  const PI = Math.PI;

  // quantità scritta secondo il perimetro: q(4700, 'Ω') → «`4,7 kΩ`» (i negativi fra parentesi, se serve)
  const Q = (o) => (v, u, paren) => MA.q(v, u, { prefixes: o.prefixes, sig: o.sig ?? 3, paren });
  const step = (f, s, v, u) => ({ f, s, v, u });
  const sol = (sym, u, v, steps, mistakes = [], extra = {}) => Object.assign({ sym, u, v, steps, mistakes: mistakes.filter((m) => isFinite(m.v) && m.v !== v) }, extra);
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const sfx = (id) => CI.suffix(id);

  /* ======================= Grandezze e legge di Ohm ======================= */
  function charge(p, o = {}) {
    const q = Q(o);
    if (p.find === 'Q') { const v = p.I * p.t; return sol('Q', 'C', v, [step('Q = I * t', `Q = ${q(p.I, 'A')} * ${q(p.t, 's')} = ${q(v, 'C')}`, v, 'C')], [{ id: 'formula-inversa', v: p.I / p.t }]); }
    if (p.find === 'I') { const v = p.Q / p.t; return sol('I', 'A', v, [step('I = Q/t', `I = ${q(p.Q, 'C')}/${q(p.t, 's')} = ${q(v, 'A')}`, v, 'A')], [{ id: 'formula-inversa', v: p.Q * p.t }, { id: 'formula-inversa', v: p.t / p.Q }]); }
    const v = p.Q / p.I;
    return sol('t', 's', v, [step('t = Q/I', `t = ${q(p.Q, 'C')}/${q(p.I, 'A')} = ${q(v, 's')}`, v, 's')], [{ id: 'formula-inversa', v: p.Q * p.I }, { id: 'formula-inversa', v: p.I / p.Q }]);
  }
  function ohm(p, o = {}) {
    const q = Q(o);
    if (p.find === 'V') { const v = p.R * p.I; return sol('V', 'V', v, [step('V = R * I', `V = ${q(p.R, 'Ω')} * ${q(p.I, 'A')} = ${q(v, 'V')}`, v, 'V')], [{ id: 'formula-inversa', v: p.R / p.I }, { id: 'formula-inversa', v: p.I / p.R }]); }
    if (p.find === 'I') { const v = p.V / p.R; return sol('I', 'A', v, [step('I = V/R', `I = ${q(p.V, 'V')}/${q(p.R, 'Ω')} = ${q(v, 'A')}`, v, 'A')], [{ id: 'formula-inversa', v: p.V * p.R }, { id: 'formula-inversa', v: p.R / p.V }]); }
    const v = p.V / p.I;
    return sol('R', 'Ω', v, [step('R = V/I', `R = ${q(p.V, 'V')}/${q(p.I, 'A')} = ${q(v, 'Ω')}`, v, 'Ω')], [{ id: 'formula-inversa', v: p.V * p.I }, { id: 'formula-inversa', v: p.I / p.V }]);
  }
  // potenza: p.find e i due dati (V, I, R, P)
  function power(p, o = {}) {
    const q = Q(o);
    const has = (k) => p[k] != null;
    if (p.find === 'P') {
      if (has('V') && has('I')) { const v = p.V * p.I; return sol('P', 'W', v, [step('P = V * I', `P = ${q(p.V, 'V')} * ${q(p.I, 'A')} = ${q(v, 'W')}`, v, 'W')], [{ id: 'formula-inversa', v: p.V / p.I }]); }
      if (has('R') && has('I')) { const v = p.R * p.I ** 2; return sol('P', 'W', v, [step('P = R * I^2', `P = ${q(p.R, 'Ω')} * (${q(p.I, 'A')})^2 = ${q(v, 'W')}`, v, 'W')], [{ id: 'quadrato', v: p.R * p.I }, { id: 'formula-inversa', v: p.I ** 2 / p.R }]); }
      const v = p.V ** 2 / p.R;
      return sol('P', 'W', v, [step('P = V^2/R', `P = (${q(p.V, 'V')})^2/${q(p.R, 'Ω')} = ${q(v, 'W')}`, v, 'W')], [{ id: 'quadrato', v: p.V / p.R }, { id: 'formula-inversa', v: p.R / p.V ** 2 }, { id: 'formula-inversa', v: p.V ** 2 * p.R }]);
    }
    if (p.find === 'I') {
      if (has('P') && has('V')) { const v = p.P / p.V; return sol('I', 'A', v, [step('I = P/V', `I = ${q(p.P, 'W')}/${q(p.V, 'V')} = ${q(v, 'A')}`, v, 'A')], [{ id: 'formula-inversa', v: p.P * p.V }, { id: 'formula-inversa', v: p.V / p.P }]); }
      const v = Math.sqrt(p.P / p.R);
      return sol('I', 'A', v, [step('I = sqrt(P/R)', `I = sqrt(${q(p.P, 'W')}/${q(p.R, 'Ω')}) = ${q(v, 'A')}`, v, 'A')], [{ id: 'radice', v: p.P / p.R }, { id: 'formula-inversa', v: Math.sqrt(p.P * p.R) }]);
    }
    if (p.find === 'V') {
      if (has('P') && has('I')) { const v = p.P / p.I; return sol('V', 'V', v, [step('V = P/I', `V = ${q(p.P, 'W')}/${q(p.I, 'A')} = ${q(v, 'V')}`, v, 'V')], [{ id: 'formula-inversa', v: p.P * p.I }, { id: 'formula-inversa', v: p.I / p.P }]); }
      const v = Math.sqrt(p.P * p.R);
      return sol('V', 'V', v, [step('V = sqrt(P * R)', `V = sqrt(${q(p.P, 'W')} * ${q(p.R, 'Ω')}) = ${q(v, 'V')}`, v, 'V')], [{ id: 'radice', v: p.P * p.R }, { id: 'formula-inversa', v: Math.sqrt(p.P / p.R) }]);
    }
    // R
    if (has('P') && has('I')) { const v = p.P / p.I ** 2; return sol('R', 'Ω', v, [step('R = P/I^2', `R = ${q(p.P, 'W')}/(${q(p.I, 'A')})^2 = ${q(v, 'Ω')}`, v, 'Ω')], [{ id: 'quadrato', v: p.P / p.I }]); }
    const v = p.V ** 2 / p.P;
    return sol('R', 'Ω', v, [step('R = V^2/P', `R = (${q(p.V, 'V')})^2/${q(p.P, 'W')} = ${q(v, 'Ω')}`, v, 'Ω')], [{ id: 'quadrato', v: p.V / p.P }, { id: 'formula-inversa', v: p.P / p.V ** 2 }]);
  }
  /* energia: p = { P, t (in secondi), out: 'J' | 'Wh' | 'kWh' }; con 'Wh' e 'kWh' il tempo si converte in ore */
  function energy(p, o = {}) {
    const q = Q(o);
    if (p.out === 'J') {
      const v = p.P * p.t;
      return sol('W', 'J', v, [step('W = P * t', `W = ${q(p.P, 'W')} * ${q(p.t, 's')} = ${q(v, 'J')}`, v, 'J')], [{ id: 'ore-secondi', v: p.P * p.t / 3600 }]);
    }
    const h = p.t / 3600;
    const steps = [step('t_h = t/3600', `t_h = ${q(p.t, 's')}/3600 = \`${U.num(h)} h\``, h, 'h')];
    // il risultato è in wattora; la scrittura sceglie Wh o kWh
    const wh = p.P * h;
    steps.push(step('W = P * t_h', `W = ${q(p.P, 'W')} * \`${U.num(h)} h\` = ${q(wh, 'Wh')}`, wh, 'Wh'));
    return sol('W', 'Wh', wh, steps, [{ id: 'ore-secondi', v: wh * 3600 }, { id: 'ore-secondi', v: wh / 3600 }]);
  }
  function resistivity(p, o = {}) {
    const q = Q(o);
    // sezione in mm²: ρ in Ω·mm²/m (rame 0,0175) oppure ρ in Ω·m con S in m²
    const v = p.rho * p.l / p.S;
    return sol('R', 'Ω', v, [step('R = rho * l/S', `R = \`${U.num(p.rho, { sig: 3 })} Ω·mm²/m\` * {\`${U.num(p.l)} m\`}/{\`${U.num(p.S)} mm²\`} = ${q(v, 'Ω')}`, v, 'Ω')], [{ id: 'formula-inversa', v: p.rho * p.S / p.l }]);
  }
  function tolerance(p, o = {}) {
    const q = Q(o);
    const d = p.R * p.tol / 100;
    const v = p.find === 'min' ? p.R - d : p.R + d;
    return sol(p.find === 'min' ? 'R_{min}' : 'R_{max}', 'Ω', v, [
      step('Delta R = R * {tol}/100', `Delta R = ${q(p.R, 'Ω')} * ${p.tol}/100 = ${q(d, 'Ω')}`, d, 'Ω'),
      step(p.find === 'min' ? 'R_{min} = R - Delta R' : 'R_{max} = R + Delta R', `${p.find === 'min' ? 'R_{min}' : 'R_{max}'} = ${q(p.R, 'Ω')} ${p.find === 'min' ? '-' : '+'} ${q(d, 'Ω')} = ${q(v, 'Ω')}`, v, 'Ω'),
    ], [{ id: 'percentuale', v: p.find === 'min' ? p.R - p.tol : p.R + p.tol }, { id: 'percentuale', v: d }, { id: 'segno', v: p.find === 'min' ? p.R + d : p.R - d }]);
  }

  /* ======================= Serie, parallelo, reti ======================= */
  // p = { R: [valori], ids?: ['R1', …], V?, find: 'Req' | 'I' | 'V1'… | 'P1'… | 'P' }
  function series(p, o = {}) {
    const q = Q(o);
    const ids = p.ids || p.R.map((_, i) => 'R' + (i + 1));
    const names = ids.map((id) => `R_{${sfx(id)}}`);
    const Req = sum(p.R);
    const Rpar = 1 / sum(p.R.map((r) => 1 / r));
    const steps = [step(`R_{eq} = ${names.join(' + ')}`, `R_{eq} = ${p.R.map((r) => q(r, 'Ω')).join(' + ')} = ${q(Req, 'Ω')}`, Req, 'Ω')];
    if (p.find === 'Req') return sol('R_{eq}', 'Ω', Req, steps, [{ id: 'serie-parallelo', v: Rpar }]);
    const I = p.V / Req;
    steps.push(step('I = V/R_{eq}', `I = ${q(p.V, 'V')}/${q(Req, 'Ω')} = ${q(I, 'A')}`, I, 'A'));
    if (p.find === 'I') return sol('I', 'A', I, steps, [{ id: 'serie-parallelo', v: p.V / Rpar }, { id: 'formula-inversa', v: p.V * Req }]);
    const m = String(p.find).match(/^([VP])(\d+)$/);
    if (m) {
      const k = +m[2] - 1, Rk = p.R[k], nm = names[k];
      if (m[1] === 'V') {
        const v = Rk * I;
        steps.push(step(`V_{${sfx(ids[k])}} = ${nm} * I`, `V_{${sfx(ids[k])}} = ${q(Rk, 'Ω')} * ${q(I, 'A')} = ${q(v, 'V')}`, v, 'V'));
        return sol(`V_{${sfx(ids[k])}}`, 'V', v, steps, [{ id: 'serie-parallelo', v: p.V }, { id: 'partitore-capovolto', v: p.V - v }]);
      }
      const v = Rk * I * I;
      steps.push(step(`P_{${sfx(ids[k])}} = ${nm} * I^2`, `P_{${sfx(ids[k])}} = ${q(Rk, 'Ω')} * (${q(I, 'A')})^2 = ${q(v, 'W')}`, v, 'W'));
      return sol(`P_{${sfx(ids[k])}}`, 'W', v, steps, [{ id: 'quadrato', v: Rk * I }, { id: 'serie-parallelo', v: p.V ** 2 / Rk }]);
    }
    const P = p.V * I;
    steps.push(step('P = V * I', `P = ${q(p.V, 'V')} * ${q(I, 'A')} = ${q(P, 'W')}`, P, 'W'));
    return sol('P', 'W', P, steps, [{ id: 'serie-parallelo', v: p.V * p.V / Rpar }]);
  }
  // p = { R: [valori], ids?, V?, find: 'Req' | 'I' | 'I1'… }
  function parallel(p, o = {}) {
    const q = Q(o);
    const ids = p.ids || p.R.map((_, i) => 'R' + (i + 1));
    const names = ids.map((id) => `R_{${sfx(id)}}`);
    const G = sum(p.R.map((r) => 1 / r));
    const Req = 1 / G;
    const Rs = sum(p.R);
    const steps = [];
    const same = p.R.every((r) => r === p.R[0]);
    if (p.R.length === 2) steps.push(step(`R_{eq} = {${names[0]} * ${names[1]}}/{${names[0]} + ${names[1]}}`, `R_{eq} = {${q(p.R[0], 'Ω')} * ${q(p.R[1], 'Ω')}}/{${q(p.R[0], 'Ω')} + ${q(p.R[1], 'Ω')}} = ${q(Req, 'Ω')}`, Req, 'Ω'));
    else if (same) steps.push(step(`R_{eq} = R/n`, `R_{eq} = ${q(p.R[0], 'Ω')}/${p.R.length} = ${q(Req, 'Ω')}`, Req, 'Ω'));
    else steps.push(step(`R_{eq} = 1/{${names.map((n) => '1/' + n).join(' + ')}}`, `R_{eq} = 1/{${p.R.map((r) => '1/' + q(r, 'Ω')).join(' + ')}} = ${q(Req, 'Ω')}`, Req, 'Ω'));
    if (p.find === 'Req') return sol('R_{eq}', 'Ω', Req, steps, [{ id: 'serie-parallelo', v: Rs }, { id: 'reciproco', v: G }]);
    const m = String(p.find).match(/^I(\d+)$/);
    if (m) {
      const k = +m[1] - 1;
      const v = p.V / p.R[k];
      return sol(`I_{${sfx(ids[k])}}`, 'A', v, [step(`I_{${sfx(ids[k])}} = V/${names[k]}`, `I_{${sfx(ids[k])}} = ${q(p.V, 'V')}/${q(p.R[k], 'Ω')} = ${q(v, 'A')}`, v, 'A')], [{ id: 'serie-parallelo', v: p.V / Rs }, { id: 'formula-inversa', v: p.V * p.R[k] }]);
    }
    const I = p.V / Req;
    steps.push(step('I = V/R_{eq}', `I = ${q(p.V, 'V')}/${q(Req, 'Ω')} = ${q(I, 'A')}`, I, 'A'));
    return sol('I', 'A', I, steps, [{ id: 'serie-parallelo', v: p.V / Rs }, { id: 'reciproco', v: p.V / G }]);
  }
  // scambia serie e parallelo nell'albero: tutti i livelli o solo la radice
  function swapTree(t, all) {
    if (!t.s && !t.p) return t;
    const kids = (t.s || t.p).map((k) => (all ? swapTree(k, true) : k));
    return t.s ? { p: kids } : { s: kids };
  }
  const treeZ = (t) => (t.s ? sum(t.s.map(treeZ)) : t.p ? 1 / sum(t.p.map((k) => 1 / treeZ(k))) : t.v);
  /* rete a scala con un solo generatore nella colonna 0: p = { spec, V (se serve), find: 'Req' | 'I' | 'I:R3' | 'V:R3' } */
  function network(p, o = {}) {
    const q = Q(o);
    const tree = CI.seenFrom(p.spec, 0);
    if (!CI.passive(tree)) throw new Error('rete non riducibile in serie e parallelo');
    const red = CI.reduce(tree, { finalName: 'R_{eq}' });
    const Req = red.z;
    const steps = red.steps.map((s) => step(s.f, s.s, s.v, 'Ω'));
    const wrong = [{ id: 'serie-parallelo', v: treeZ(swapTree(tree, false)) }, { id: 'serie-parallelo', v: treeZ(swapTree(tree, true)) }];
    if (p.find === 'Req') return sol('R_{eq}', 'Ω', Req, steps, wrong);
    const V = p.V;
    const I = V / Req;
    steps.push(step('I = V/R_{eq}', `I = ${q(V, 'V')}/${q(Req, 'Ω')} = ${q(I, 'A')}`, I, 'A'));
    if (p.find === 'I') return sol('I', 'A', I, steps, wrong.map((w) => ({ id: w.id, v: V / w.v })));
    const [kind, id] = p.find.split(':');
    const bp = CI.backprop(red, I, { target: id, prefixes: o.prefixes });
    const leaf = bp.leaves.get(id);
    for (const s of bp.steps) steps.push(step(s.f, s.s, s.v, s.u));
    const el = CI.toNetlist(p.spec).elements.find((e) => e.id === id);
    if (kind === 'I') {
      // l'ultimo passaggio dà la corrente del ramo; se il componente è in serie con il generatore la corrente è I
      const nm = `I_{${sfx(id)}}`;
      if (!bp.steps.length || bp.steps[bp.steps.length - 1].kind !== 'corrente') steps.push(step(`${nm} = I`, `${nm} = ${q(leaf.i, 'A')}`, leaf.i, 'A'));
      else { const last = steps[steps.length - 1]; last.f = last.f.replace(/^I_\{[^}]*\}/, nm); last.s = last.s.replace(/^I_\{[^}]*\}/, nm); }
      return sol(nm, 'A', leaf.i, steps, [{ id: 'serie-parallelo', v: I }, { id: 'partitore-corrente-capovolto', v: I - leaf.i }]);
    }
    const nm = `V_{${sfx(id)}}`;
    // se l'ultimo passaggio è già la tensione su questo componente (in serie sul cammino) non si ripete
    const lastBp = bp.steps[bp.steps.length - 1];
    if (lastBp && lastBp.kind === 'tensione' && lastBp.f.startsWith(nm + ' ')) return sol(nm, 'V', leaf.v, steps, [{ id: 'serie-parallelo', v: V }, { id: 'partitore-capovolto', v: V - leaf.v }]);
    steps.push(step(`${nm} = R_{${sfx(id)}} * I_{${sfx(id)}}`, `${nm} = ${q(el.v, 'Ω')} * ${q(leaf.i, 'A')} = ${q(leaf.v, 'V')}`, leaf.v, 'V'));
    return sol(nm, 'V', leaf.v, steps, [{ id: 'serie-parallelo', v: V }, { id: 'partitore-capovolto', v: V - leaf.v }]);
  }

  /* ======================= Partitori ======================= */
  function divider(p, o = {}) {
    const q = Q(o);
    const v = p.V * p.R2 / (p.R1 + p.R2);
    return sol('V_2', 'V', v, [step('V_2 = V * R_2/{R_1 + R_2}', `V_2 = ${q(p.V, 'V')} * ${q(p.R2, 'Ω')}/{${q(p.R1, 'Ω')} + ${q(p.R2, 'Ω')}} = ${q(v, 'V')}`, v, 'V')],
      [{ id: 'partitore-capovolto', v: p.V * p.R1 / (p.R1 + p.R2) }, { id: 'formula-inversa', v: p.V * p.R2 / p.R1 }]);
  }
  function loadedDivider(p, o = {}) {
    const q = Q(o);
    const RP = p.R2 * p.RL / (p.R2 + p.RL);
    const v = p.V * RP / (p.R1 + RP);
    return sol('V_L', 'V', v, [
      step('R_{2L} = {R_2 * R_L}/{R_2 + R_L}', `R_{2L} = {${q(p.R2, 'Ω')} * ${q(p.RL, 'Ω')}}/{${q(p.R2, 'Ω')} + ${q(p.RL, 'Ω')}} = ${q(RP, 'Ω')}`, RP, 'Ω'),
      step('V_L = V * R_{2L}/{R_1 + R_{2L}}', `V_L = ${q(p.V, 'V')} * ${q(RP, 'Ω')}/{${q(p.R1, 'Ω')} + ${q(RP, 'Ω')}} = ${q(v, 'V')}`, v, 'V'),
    ], [{ id: 'carico-ignorato', v: p.V * p.R2 / (p.R1 + p.R2) }, { id: 'partitore-capovolto', v: p.V * p.R1 / (p.R1 + RP) }, { id: 'serie-parallelo', v: p.V * (p.R2 + p.RL) / (p.R1 + p.R2 + p.RL) }]);
  }
  function currentDivider(p, o = {}) {
    const q = Q(o);
    const v = p.I * p.R2 / (p.R1 + p.R2);
    return sol('I_1', 'A', v, [step('I_1 = I * R_2/{R_1 + R_2}', `I_1 = ${q(p.I, 'A')} * ${q(p.R2, 'Ω')}/{${q(p.R1, 'Ω')} + ${q(p.R2, 'Ω')}} = ${q(v, 'A')}`, v, 'A')],
      [{ id: 'partitore-corrente-capovolto', v: p.I * p.R1 / (p.R1 + p.R2) }]);
  }

  /* ======================= Kirchhoff ======================= */
  /* primo principio: p = { known: [{ sym, v, dir: 'in'|'out' }], sym } — l'incognita è disegnata uscente dal nodo.
     Un risultato negativo vuol dire che la corrente in realtà entra nel nodo. */
  function kcl(p, o = {}) {
    const q = Q(o);
    const ins = p.known.filter((k) => k.dir === 'in'), outs = p.known.filter((k) => k.dir === 'out');
    const v = sum(ins.map((k) => k.v)) - sum(outs.map((k) => k.v));
    const lhs = ins.map((k) => k.sym).join(' + ') || '0';
    const rhs = [p.sym].concat(outs.map((k) => k.sym)).join(' + ');
    const f1 = `${lhs} = ${rhs}`;
    const f2 = `${p.sym} = ${ins.map((k) => k.sym).join(' + ') || '0'}${outs.map((k) => ' - ' + k.sym).join('')}`;
    const s = `${p.sym} = ${ins.map((k, i) => (i ? ' + ' : '') + q(k.v, 'A', true)).join('') || '0'}${outs.map((k) => ' - ' + q(k.v, 'A', true)).join('')} = ${q(v, 'A')}`;
    return sol(p.sym, 'A', v, [step(f1, f2, null, null), step(f2, s, v, 'A')], [{ id: 'segno', v: sum(p.known.map((k) => k.v)) }, { id: 'segno', v: sum(outs.map((k) => k.v)) - sum(ins.map((k) => k.v)) }]);
  }
  /* secondo principio: p = { known: [{ sym, v, sign: +1|−1 }], sym, sign } — sign: +1 se la freccia della tensione è
     concorde con il verso di percorrenza della maglia. Somma algebrica = 0 → incognita. */
  function kvl(p, o = {}) {
    const q = Q(o);
    const tot = sum(p.known.map((k) => k.sign * k.v));
    const v = -tot / p.sign;
    const term = (k, i) => (k.sign > 0 ? (i ? ' + ' : '') : ' - ') + k.sym;
    const all = p.known.map(term).join('').replace(/^ \+ /, '') + (p.sign > 0 ? ' + ' : ' - ') + p.sym;
    const s = `${p.sym} = ${p.sign > 0 ? '-' : ''}(${p.known.map((k, i) => (k.sign > 0 ? (i ? ' + ' : '') : ' - ') + q(k.v, 'V', true)).join('').replace(/^ \+ /, '')}) = ${q(v, 'V')}`;
    return sol(p.sym, 'V', v, [step(`${all.replace(/^ /, '')} = 0`, s, v, 'V')], [{ id: 'segno', v: -v }, { id: 'segno', v: sum(p.known.map((k) => k.v)) }]);
  }
  /* Millman: rami in parallelo fra A e B (B in basso). Ogni ramo: { E (con il + verso A; 0 se non c'è), R, id } */
  function millman(p, o = {}) {
    const q = Q(o);
    const br = p.branches;
    const num = sum(br.map((b) => (b.E || 0) / b.R)), den = sum(br.map((b) => 1 / b.R));
    const v = num / den;
    const n = br.map((b, i) => (b.E ? `E_{${i + 1}}/R_{${i + 1}}` : null)).filter(Boolean);
    const d = br.map((b, i) => `1/R_{${i + 1}}`);
    const ns = br.filter((b) => b.E).map((b) => `${q(b.E, 'V', true)}/${q(b.R, 'Ω')}`);
    const ds = br.map((b) => `1/${q(b.R, 'Ω')}`);
    const flip = br.filter((b) => b.E).map((b, k) => sum(br.map((c) => (c === b ? -(c.E || 0) : c.E || 0) / c.R)) / den);
    return sol('V_{AB}', 'V', v, [step(`V_{AB} = {${n.join(' + ')}}/{${d.join(' + ')}}`, `V_{AB} = {${ns.join(' + ')}}/{${ds.join(' + ')}} = ${q(v, 'V')}`, v, 'V')],
      [{ id: 'reciproco', v: num }, ...flip.map((x) => ({ id: 'segno', v: x })), { id: 'serie-parallelo', v: sum(br.map((b) => b.E || 0)) / br.length }]);
  }

  /* ======================= Thevenin, Norton, sovrapposizione ======================= */
  // la rete senza il ramo della porta (colonna k): i morsetti A (in alto) e B (in basso)
  function withoutPort(spec, k) {
    const cols = spec.cols.map((c, i) => (i === k ? null : c));
    const names = Object.assign({}, spec.names, { ['T' + k]: 'A' });
    return Object.assign({}, spec, { cols, names });
  }
  /* p = { spec, port: k (colonna del carico o dei morsetti), RL? (carico), find: 'Vth' | 'Rth' | 'IN' | 'IL' | 'VL' } */
  function thevenin(p, o = {}) {
    const q = Q(o);
    const open = withoutPort(p.spec, p.port);
    const net = CI.toNetlist(open);
    const r = MNA.solve(net);
    const vth = r.V('A');
    const tree = CI.seenFrom(p.spec, p.port);
    const red = CI.reduce(tree, { finalName: 'R_{th}' });
    const rth = red.z;
    const steps = [];
    const vStep = step('V_{th} = V_{AB}', `V_{th} = ${q(vth, 'V')}`, vth, 'V');
    vStep.note = 'tensione fra A e B con i morsetti aperti';
    // con un solo generatore e il partitore classico (generatore, R in serie, R in parallelo ai morsetti) si mostra la formula
    const pd = classicDivider(open, p.port);
    if (pd) { vStep.f = 'V_{th} = E * R_2/{R_1 + R_2}'; vStep.s = `V_{th} = ${q(pd.E, 'V')} * ${q(pd.R2, 'Ω')}/{${q(pd.R1, 'Ω')} + ${q(pd.R2, 'Ω')}} = ${q(vth, 'V')}`; }
    const rSteps = red.steps.map((s) => step(s.f, s.s, s.v, 'Ω'));
    // errore tipico: il generatore di tensione lasciato aperto invece che in corto
    const treeOpenV = CI.simplify(JSON.parse(JSON.stringify(rawSeen(p.spec, p.port)), (k, v) => (v && v.t === 'V' ? { t: 'OPEN', id: v.id } : v)));
    const rthWrong = treeOpenV && treeOpenV.t !== 'OPEN' && treeOpenV.t !== 'W' ? treeZ(treeOpenV) : NaN;
    if (p.find === 'Vth') return sol('V_{th}', 'V', vth, [vStep], pd ? [{ id: 'partitore-capovolto', v: pd.E * pd.R1 / (pd.R1 + pd.R2) }] : []);
    if (p.find === 'Rth') return sol('R_{th}', 'Ω', rth, rSteps.length ? rSteps : [step('R_{th} = R', `R_{th} = ${q(rth, 'Ω')}`, rth, 'Ω')], [{ id: 'generatore-spento', v: rthWrong }, { id: 'serie-parallelo', v: treeZ(swapTree(tree, true)) }]);
    steps.push(vStep, ...rSteps);
    if (p.find === 'IN') {
      const v = vth / rth;
      steps.push(step('I_N = V_{th}/R_{th}', `I_N = ${q(vth, 'V')}/${q(rth, 'Ω')} = ${q(v, 'A')}`, v, 'A'));
      return sol('I_N', 'A', v, steps, [{ id: 'formula-inversa', v: vth * rth }]);
    }
    const IL = vth / (rth + p.RL);
    steps.push(step('I_L = V_{th}/{R_{th} + R_L}', `I_L = ${q(vth, 'V')}/{${q(rth, 'Ω')} + ${q(p.RL, 'Ω')}} = ${q(IL, 'A')}`, IL, 'A'));
    if (p.find === 'IL') return sol('I_L', 'A', IL, steps, [{ id: 'serie-parallelo', v: vth / (rth * p.RL / (rth + p.RL)) }, { id: 'formula-inversa', v: vth / p.RL }]);
    const VL = IL * p.RL;
    steps.push(step('V_L = R_L * I_L', `V_L = ${q(p.RL, 'Ω')} * ${q(IL, 'A')} = ${q(VL, 'V')}`, VL, 'V'));
    return sol('V_L', 'V', VL, steps, [{ id: 'partitore-capovolto', v: vth - VL }, { id: 'carico-ignorato', v: vth }]);
  }
  // l'albero visto dalla porta senza spegnere i generatori (per calcolare l'errore «generatore lasciato acceso/aperto»)
  function rawSeen(spec, k) {
    const s2 = Object.assign({}, spec, { cols: spec.cols.map((c) => (c ? c.map((it) => Object.assign({}, it, it.t === 'V' ? { t: 'VKEEP' } : {})) : c)) });
    const t = CI.seenFrom(s2, k);
    return JSON.parse(JSON.stringify(t), (key, v) => (v && v.t === 'VKEEP' ? Object.assign({}, v, { t: 'V' }) : v));
  }
  // generatore nella colonna 0, un resistore sul binario alto, uno in colonna 1, porta alla colonna 2 (o 1)
  function classicDivider(spec, k) {
    const c = spec.cols;
    if (c.length < 2 || !c[0] || c[0].length !== 1 || c[0][0].t !== 'V') return null;
    const t0 = (spec.top || [])[0] || [];
    if (t0.length !== 1 || t0[0].t !== 'R') return null;
    if (k === 2 && c[1] && c[1].length === 1 && c[1][0].t === 'R' && !((spec.top || [])[1] || []).length && c.length === 3) return { E: c[0][0].v, R1: t0[0].v, R2: c[1][0].v };
    return null;
  }
  const norton = (p, o) => thevenin(Object.assign({}, p, { find: 'IN' }), o);
  /* sovrapposizione: p = { spec, target: id del componente, find: 'I' } — la corrente (da a verso b) nel componente.
     Per ogni generatore si spengono gli altri (tensione → corto, corrente → aperto). */
  function superposition(p, o = {}) {
    const q = Q(o);
    const net = CI.toNetlist(p.spec);
    const srcs = net.elements.filter((e) => e.t === 'V' || e.t === 'I');
    const steps = [];
    const parts = [];
    srcs.forEach((s, k) => {
      const els = net.elements.map((e) => (e === s || (e.t !== 'V' && e.t !== 'I') ? e : Object.assign({}, e, { t: e.t === 'V' ? 'W' : 'OPEN' })));
      const r = MNA.solve({ elements: els });
      const i = r.I(p.target);
      parts.push(i);
      const mark = "'".repeat(k + 1);
      const others = srcs.filter((x) => x !== s).map((x) => (x.t === 'V' ? `${x.id} in corto` : `${x.id} aperto`)).join(', ');
      const st = step(`I${mark}`, `I${mark} = ${q(i, 'A')}`, i, 'A');
      st.note = `agisce solo ${s.id} (${others})`;
      steps.push(st);
    });
    const v = sum(parts);
    const marks = parts.map((_, k) => 'I' + "'".repeat(k + 1));
    steps.push(step(`I_{${sfx(p.target)}} = ${marks.join(' + ')}`, `I_{${sfx(p.target)}} = ${parts.map((x, i) => (i ? ' + ' : '') + q(x, 'A', true)).join('')} = ${q(v, 'A')}`, v, 'A'));
    const wrong = parts.length === 2 ? [{ id: 'segno', v: parts[0] - parts[1] }, { id: 'segno', v: parts[1] - parts[0] }] : [];
    return sol(`I_{${sfx(p.target)}}`, 'A', v, steps, wrong.concat([{ id: 'segno', v: sum(parts.map(Math.abs)) }]));
  }
  function maxPower(p, o = {}) {
    const q = Q(o);
    const v = p.Vth ** 2 / (4 * p.Rth);
    return sol('P_{max}', 'W', v, [
      step('R_L = R_{th}', `R_L = ${q(p.Rth, 'Ω')}`, p.Rth, 'Ω'),
      step('P_{max} = V_{th}^2/{4 * R_{th}}', `P_{max} = (${q(p.Vth, 'V')})^2/{4 * ${q(p.Rth, 'Ω')}} = ${q(v, 'W')}`, v, 'W'),
    ], [{ id: 'massimo-trasferimento', v: p.Vth ** 2 / p.Rth }, { id: 'massimo-trasferimento', v: p.Vth ** 2 / (2 * p.Rth) }, { id: 'quadrato', v: p.Vth / (4 * p.Rth) }]);
  }

  /* ======================= Condensatori e induttori ======================= */
  function capacitors(p, o = {}) {
    const q = Q(o);
    const names = p.C.map((_, i) => `C_{${i + 1}}`);
    const par = sum(p.C), ser = 1 / sum(p.C.map((c) => 1 / c));
    if (p.conn === 'par') return sol('C_{eq}', 'F', par, [step(`C_{eq} = ${names.join(' + ')}`, `C_{eq} = ${p.C.map((c) => q(c, 'F')).join(' + ')} = ${q(par, 'F')}`, par, 'F')], [{ id: 'condensatori-come-resistori', v: ser }]);
    const f = p.C.length === 2 ? `C_{eq} = {C_1 * C_2}/{C_1 + C_2}` : `C_{eq} = 1/{${names.map((n) => '1/' + n).join(' + ')}}`;
    const s = p.C.length === 2 ? `C_{eq} = {${q(p.C[0], 'F')} * ${q(p.C[1], 'F')}}/{${q(p.C[0], 'F')} + ${q(p.C[1], 'F')}} = ${q(ser, 'F')}` : `C_{eq} = 1/{${p.C.map((c) => '1/' + q(c, 'F')).join(' + ')}} = ${q(ser, 'F')}`;
    return sol('C_{eq}', 'F', ser, [step(f, s, ser, 'F')], [{ id: 'condensatori-come-resistori', v: par }, { id: 'reciproco', v: sum(p.C.map((c) => 1 / c)) }]);
  }
  function capCharge(p, o = {}) {
    const q = Q(o);
    if (p.find === 'Q') { const v = p.C * p.V; return sol('Q', 'C', v, [step('Q = C * V', `Q = ${q(p.C, 'F')} * ${q(p.V, 'V')} = ${q(v, 'C')}`, v, 'C')], [{ id: 'formula-inversa', v: p.C / p.V }]); }
    if (p.find === 'C') { const v = p.Q / p.V; return sol('C', 'F', v, [step('C = Q/V', `C = ${q(p.Q, 'C')}/${q(p.V, 'V')} = ${q(v, 'F')}`, v, 'F')], [{ id: 'formula-inversa', v: p.Q * p.V }]); }
    const v = p.Q / p.C;
    return sol('V', 'V', v, [step('V = Q/C', `V = ${q(p.Q, 'C')}/${q(p.C, 'F')} = ${q(v, 'V')}`, v, 'V')], [{ id: 'formula-inversa', v: p.Q * p.C }]);
  }
  function capEnergy(p, o = {}) {
    const q = Q(o);
    const v = 0.5 * p.C * p.V ** 2;
    return sol('W', 'J', v, [step('W = 1/2 * C * V^2', `W = 1/2 * ${q(p.C, 'F')} * (${q(p.V, 'V')})^2 = ${q(v, 'J')}`, v, 'J')], [{ id: 'quadrato', v: 0.5 * p.C * p.V }, { id: 'formula-inversa', v: p.C * p.V ** 2 }]);
  }
  function indVoltage(p, o = {}) {
    const q = Q(o);
    const v = p.L * p.dI / p.dt;
    return sol('v_L', 'V', v, [step('v_L = L * {Delta I}/{Delta t}', `v_L = ${q(p.L, 'H')} * ${q(p.dI, 'A')}/${q(p.dt, 's')} = ${q(v, 'V')}`, v, 'V')], [{ id: 'formula-inversa', v: p.L * p.dI * p.dt }, { id: 'formula-inversa', v: p.L * p.dt / p.dI }]);
  }
  function indEnergy(p, o = {}) {
    const q = Q(o);
    const v = 0.5 * p.L * p.I ** 2;
    return sol('W', 'J', v, [step('W = 1/2 * L * I^2', `W = 1/2 * ${q(p.L, 'H')} * (${q(p.I, 'A')})^2 = ${q(v, 'J')}`, v, 'J')], [{ id: 'quadrato', v: 0.5 * p.L * p.I }, { id: 'formula-inversa', v: p.L * p.I ** 2 }]);
  }

  /* ======================= Alternata ======================= */
  // grandezze di una sinusoide: p = { find, Vp?, Veff?, f?, T?, omega? }
  function sinusoid(p, o = {}) {
    const q = Q(o);
    switch (p.find) {
      case 'f': { const v = 1 / p.T; return sol('f', 'Hz', v, [step('f = 1/T', `f = 1/${q(p.T, 's')} = ${q(v, 'Hz')}`, v, 'Hz')], [{ id: 'omega-f', v: 2 * PI / p.T }, { id: 'formula-inversa', v: p.T }]); }
      case 'T': { const v = 1 / p.f; return sol('T', 's', v, [step('T = 1/f', `T = 1/${q(p.f, 'Hz')} = ${q(v, 's')}`, v, 's')], [{ id: 'omega-f', v: 1 / (2 * PI * p.f) }]); }
      case 'omega': { const v = 2 * PI * p.f; return sol('omega', 'rad/s', v, [step('omega = 2 * pi * f', `omega = 2 * pi * ${q(p.f, 'Hz')} = \`${U.num(v)} rad/s\``, v, 'rad/s')], [{ id: 'omega-f', v: p.f }, { id: 'omega-f', v: p.f / (2 * PI) }, { id: 'omega-f', v: PI * p.f }]); }
      case 'Veff': { const v = p.Vp / Math.SQRT2; return sol('V_{eff}', 'V', v, [step('V_{eff} = V_p/sqrt(2)', `V_{eff} = ${q(p.Vp, 'V')}/sqrt(2) = ${q(v, 'V')}`, v, 'V')], [{ id: 'efficace-picco', v: p.Vp * Math.SQRT2 }, { id: 'efficace-picco', v: p.Vp }, { id: 'picco-piccopicco', v: p.Vp / 2 / Math.SQRT2 }]); }
      case 'Vp': { const v = p.Veff * Math.SQRT2; return sol('V_p', 'V', v, [step('V_p = V_{eff} * sqrt(2)', `V_p = ${q(p.Veff, 'V')} * sqrt(2) = ${q(v, 'V')}`, v, 'V')], [{ id: 'efficace-picco', v: p.Veff / Math.SQRT2 }, { id: 'efficace-picco', v: p.Veff }, { id: 'picco-piccopicco', v: 2 * v }]); }
      case 'Vpp': { const v = 2 * p.Vp; return sol('V_{pp}', 'V', v, [step('V_{pp} = 2 * V_p', `V_{pp} = 2 * ${q(p.Vp, 'V')} = ${q(v, 'V')}`, v, 'V')], [{ id: 'picco-piccopicco', v: p.Vp }, { id: 'efficace-picco', v: 2 * p.Vp / Math.SQRT2 }]); }
      // valore medio della sinusoide raddrizzata a semionda (V_p/π) o a doppia semionda (2·V_p/π)
      case 'Vmed': {
        const full = p.wave === 'doppia';
        const v = (full ? 2 : 1) * p.Vp / PI;
        return sol('V_{med}', 'V', v, [step(full ? 'V_{med} = {2 * V_p}/pi' : 'V_{med} = V_p/pi', full ? `V_{med} = {2 * ${q(p.Vp, 'V')}}/pi = ${q(v, 'V')}` : `V_{med} = ${q(p.Vp, 'V')}/pi = ${q(v, 'V')}`, v, 'V')],
          [{ id: 'efficace-picco', v: p.Vp / Math.SQRT2 }, { id: 'raddrizzatore', v: (full ? 1 : 2) * p.Vp / PI }]);
      }
      default: throw new Error('sinusoid: incognita ' + p.find);
    }
  }
  // sfasamento da un ritardo: phi = 360° · Δt/T
  function phaseShift(p, o = {}) {
    const q = Q(o);
    const v = 360 * p.dt / p.T;
    return sol('phi', '°', v, [step('phi = 360° * {Delta t}/T', `phi = 360° * ${q(p.dt, 's')}/${q(p.T, 's')} = \`${U.num(v, { sig: 3 })}°\``, v, '°')], [{ id: 'formula-inversa', v: 360 * p.T / p.dt }, { id: 'omega-f', v: 2 * PI * p.dt / p.T }]);
  }
  function reactance(p, o = {}) {
    const q = Q(o);
    if (p.kind === 'L') {
      const v = 2 * PI * p.f * p.L;
      return sol('X_L', 'Ω', v, [step('X_L = 2 * pi * f * L', `X_L = 2 * pi * ${q(p.f, 'Hz')} * ${q(p.L, 'H')} = ${q(v, 'Ω')}`, v, 'Ω')], [{ id: 'omega-f', v: p.f * p.L }, { id: 'formula-inversa', v: 1 / (2 * PI * p.f * p.L) }]);
    }
    const v = 1 / (2 * PI * p.f * p.C);
    return sol('X_C', 'Ω', v, [step('X_C = 1/{2 * pi * f * C}', `X_C = 1/{2 * pi * ${q(p.f, 'Hz')} * ${q(p.C, 'F')}} = ${q(v, 'Ω')}`, v, 'Ω')], [{ id: 'omega-f', v: 1 / (p.f * p.C) }, { id: 'formula-inversa', v: 2 * PI * p.f * p.C }]);
  }
  /* circuito R, L, C in serie in alternata: p = { R, L?, C?, f, V (efficace), find: 'X' | 'Z' | 'phi' | 'I' | 'VR' | 'VL' | 'VC' | 'P' | 'Q' | 'S' | 'cosphi' } */
  function seriesAC(p, o = {}) {
    const q = Q(o);
    const steps = [];
    const XL = p.L ? 2 * PI * p.f * p.L : 0, XC = p.C ? 1 / (2 * PI * p.f * p.C) : 0;
    if (p.L) steps.push(step('X_L = 2 * pi * f * L', `X_L = 2 * pi * ${q(p.f, 'Hz')} * ${q(p.L, 'H')} = ${q(XL, 'Ω')}`, XL, 'Ω'));
    if (p.C) steps.push(step('X_C = 1/{2 * pi * f * C}', `X_C = 1/{2 * pi * ${q(p.f, 'Hz')} * ${q(p.C, 'F')}} = ${q(XC, 'Ω')}`, XC, 'Ω'));
    const X0 = XL - XC;
    if (p.L && p.C) steps.push(step('X = X_L - X_C', `X = ${q(XL, 'Ω')} - ${q(XC, 'Ω')} = ${q(X0, 'Ω')}`, X0, 'Ω'));
    const Xs = p.L && p.C ? 'X' : p.L ? 'X_L' : 'X_C';
    const Z = Math.hypot(p.R, X0);
    // senza L il circuito è capacitivo: lo sfasamento della tensione sulla corrente è negativo
    const phi = Math.atan2(X0, p.R) * 180 / PI;
    const wf = 1 / (2 * PI); // ω scambiata con f
    const XLw = XL * wf, XCw = XC / wf;
    const Zwrong = { mod: p.R + Math.abs(X0), reatt: Math.hypot(p.R, XL + XC), omega: Math.hypot(p.R, (p.L ? XLw : 0) - (p.C ? XCw : 0)) };
    if (p.find === 'X') return sol('X', 'Ω', X0, steps, [{ id: 'reattanze-sommate', v: XL + XC }, { id: 'segno', v: XC - XL }]);
    steps.push(step(`|Z| = sqrt(R^2 + ${Xs}^2)`, `|Z| = sqrt((${q(p.R, 'Ω')})^2 + (${q(Math.abs(X0), 'Ω')})^2) = ${q(Z, 'Ω')}`, Z, 'Ω'));
    if (p.find === 'Z') return sol('|Z|', 'Ω', Z, steps, [{ id: 'moduli-sommati', v: Zwrong.mod }, { id: 'reattanze-sommate', v: Zwrong.reatt }, { id: 'omega-f', v: Zwrong.omega }]);
    const phiStep = step(`phi = arctan(${p.L && p.C ? 'X' : p.L ? 'X_L' : '-X_C'}/R)`, `phi = arctan(${q(X0, 'Ω', true)}/${q(p.R, 'Ω')}) = \`${U.num(phi, { dec: 1 })}°\``, phi, '°');
    if (p.find === 'phi') return sol('phi', '°', phi, steps.concat([phiStep]), [{ id: 'segno', v: -phi }, { id: 'formula-inversa', v: Math.atan2(p.R, X0) * 180 / PI }, { id: 'unita-angolo', v: phi * PI / 180 }], { abs: 0.5 });
    if (p.find === 'cosphi') { steps.push(phiStep); const v = Math.cos(phi * PI / 180); steps.push(step('cos(phi) = R/{|Z|}', `cos(phi) = ${q(p.R, 'Ω')}/${q(Z, 'Ω')} = \`${U.num(v, { dec: 3 })}\``, v, '')); return sol('cos(phi)', '', v, steps, [{ id: 'seno-coseno', v: Math.abs(Math.sin(phi * PI / 180)) }], { abs: 0.005 }); }
    const I = p.V / Z;
    steps.push(step('I = V/{|Z|}', `I = ${q(p.V, 'V')}/${q(Z, 'Ω')} = ${q(I, 'A')}`, I, 'A'));
    const Iw = [{ id: 'moduli-sommati', v: p.V / Zwrong.mod }, { id: 'reattanze-sommate', v: p.V / Zwrong.reatt }, { id: 'omega-f', v: p.V / Zwrong.omega }];
    if (p.find === 'I') return sol('I', 'A', I, steps, Iw.concat([{ id: 'efficace-picco', v: I * Math.SQRT2 }, { id: 'efficace-picco', v: I / Math.SQRT2 }]));
    const fin = {
      VR: ['V_R', 'V_R = R * I', p.R, 'V'], VL: ['V_L', 'V_L = X_L * I', XL, 'V'], VC: ['V_C', 'V_C = X_C * I', XC, 'V'],
      P: ['P', 'P = R * I^2', p.R, 'W'], Q: ['Q', `Q = ${Xs} * I^2`, Math.abs(X0), 'var'],
    }[p.find];
    if (fin) {
      const [sym, f, k, u] = fin;
      const sq = u !== 'V';
      const v = sq ? k * I * I : k * I;
      steps.push(step(f, `${sym} = ${q(k, 'Ω')} * ${sq ? `(${q(I, 'A')})^2` : q(I, 'A')} = ${q(v, u)}`, v, u));
      const sumV = p.find.startsWith('V') ? [{ id: 'moduli-sommati', v: p.V - (p.find === 'VR' ? Math.abs(X0) * I : p.R * I) }] : [];
      return sol(sym, u, v, steps, Iw.map((w) => ({ id: w.id, v: sq ? k * w.v * w.v : k * w.v })).concat(sq ? [{ id: 'quadrato', v: k * I }] : [], sumV, p.find === 'P' ? [{ id: 'seno-coseno', v: Math.abs(X0) * I * I }] : p.find === 'Q' ? [{ id: 'seno-coseno', v: p.R * I * I }] : []));
    }
    const S = p.V * I;
    steps.push(step('S = V * I', `S = ${q(p.V, 'V')} * ${q(I, 'A')} = ${q(S, 'VA')}`, S, 'VA'));
    return sol('S', 'VA', S, steps, Iw.map((w) => ({ id: w.id, v: p.V * w.v })));
  }
  // potenze da tensione, corrente e sfasamento: p = { V, I, phi (gradi), find: 'P' | 'Q' | 'S' }
  function powerAC(p, o = {}) {
    const q = Q(o);
    const c = Math.cos(p.phi * PI / 180), s = Math.sin(p.phi * PI / 180);
    const S = p.V * p.I;
    if (p.find === 'S') return sol('S', 'VA', S, [step('S = V * I', `S = ${q(p.V, 'V')} * ${q(p.I, 'A')} = ${q(S, 'VA')}`, S, 'VA')], [{ id: 'seno-coseno', v: S * c }]);
    if (p.find === 'P') { const v = S * c; return sol('P', 'W', v, [step('P = V * I * cos(phi)', `P = ${q(p.V, 'V')} * ${q(p.I, 'A')} * cos(\`${U.num(p.phi)}°\`) = ${q(v, 'W')}`, v, 'W')], [{ id: 'seno-coseno', v: S * Math.abs(s) }, { id: 'seno-coseno', v: S }]); }
    const v = S * s;
    return sol('Q', 'var', v, [step('Q = V * I * sin(phi)', `Q = ${q(p.V, 'V')} * ${q(p.I, 'A')} * sin(\`${U.num(p.phi)}°\`) = ${q(v, 'var')}`, v, 'var')], [{ id: 'seno-coseno', v: S * c }, { id: 'segno', v: -v }]);
  }
  // rifasamento: p = { P, V, f, cos1, cos2 } → capacità
  function pfCorrection(p, o = {}) {
    const q = Q(o);
    const t1 = Math.tan(Math.acos(p.cos1)), t2 = Math.tan(Math.acos(p.cos2));
    const Qc = p.P * (t1 - t2);
    const w = 2 * PI * p.f;
    const C = Qc / (w * p.V ** 2);
    return sol('C', 'F', C, [
      step('Q_C = P * (tan(phi_1) - tan(phi_2))', `Q_C = ${q(p.P, 'W')} * (\`${U.num(t1, { dec: 3 })}\` - \`${U.num(t2, { dec: 3 })}\`) = ${q(Qc, 'var')}`, Qc, 'var'),
      step('C = Q_C/{omega * V^2}', `C = ${q(Qc, 'var')}/{\`${U.num(w)} rad/s\` * (${q(p.V, 'V')})^2} = ${q(C, 'F')}`, C, 'F'),
    ], [{ id: 'omega-f', v: Qc / (p.f * p.V ** 2) }, { id: 'quadrato', v: Qc / (w * p.V) }, { id: 'seno-coseno', v: p.P * (Math.sin(Math.acos(p.cos1)) - Math.sin(Math.acos(p.cos2))) / (w * p.V ** 2) }]);
  }
  // risonanza serie: p = { L, C, R?, V?, find: 'f0' | 'Q' | 'B' | 'I0' }
  function resonance(p, o = {}) {
    const q = Q(o);
    const f0 = 1 / (2 * PI * Math.sqrt(p.L * p.C));
    const steps = [step('f_0 = 1/{2 * pi * sqrt(L * C)}', `f_0 = 1/{2 * pi * sqrt(${q(p.L, 'H')} * ${q(p.C, 'F')})} = ${q(f0, 'Hz')}`, f0, 'Hz')];
    if (p.find === 'f0') return sol('f_0', 'Hz', f0, steps, [{ id: 'omega-f', v: 2 * PI * f0 }, { id: 'radice', v: 1 / (2 * PI * p.L * p.C) }, { id: 'omega-f', v: 1 / Math.sqrt(p.L * p.C) / (4 * PI * PI) }]);
    if (p.find === 'I0') { const v = p.V / p.R; return sol('I_0', 'A', v, [step('I_0 = V/R', `I_0 = ${q(p.V, 'V')}/${q(p.R, 'Ω')} = ${q(v, 'A')}`, v, 'A')], [{ id: 'efficace-picco', v: v * Math.SQRT2 }]); }
    const X0 = 2 * PI * f0 * p.L;
    steps.push(step('X_0 = 2 * pi * f_0 * L', `X_0 = 2 * pi * ${q(f0, 'Hz')} * ${q(p.L, 'H')} = ${q(X0, 'Ω')}`, X0, 'Ω'));
    const Qf = X0 / p.R;
    steps.push(step('Q = X_0/R', `Q = ${q(X0, 'Ω')}/${q(p.R, 'Ω')} = \`${U.num(Qf)}\``, Qf, ''));
    if (p.find === 'Q') return sol('Q', '', Qf, steps, [{ id: 'formula-inversa', v: p.R / X0 }]);
    const B = f0 / Qf;
    steps.push(step('B = f_0/Q', `B = ${q(f0, 'Hz')}/\`${U.num(Qf)}\` = ${q(B, 'Hz')}`, B, 'Hz'));
    return sol('B', 'Hz', B, steps, [{ id: 'formula-inversa', v: f0 * Qf }, { id: 'omega-f', v: B * 2 * PI }]);
  }

  const api = {
    charge, ohm, power, energy, resistivity, tolerance,
    series, parallel, network, divider, loadedDivider, currentDivider,
    kcl, kvl, millman, thevenin, norton, superposition, maxPower,
    capacitors, capCharge, capEnergy, indVoltage, indEnergy,
    sinusoid, phaseShift, reactance, seriesAC, powerAC, pfCorrection, resonance,
    swapTree, treeZ, withoutPort,
  };
  root.ElekSolve = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
