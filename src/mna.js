/* ELEKTRON — risolutore delle reti con l'analisi nodale modificata (MNA), in continua e in alternata.
   Netlist: { elements: [ { id, t, a, b, … } ] }, nodi con nomi qualsiasi, «0» è la massa.
   Convenzioni (docs/inventario-e-piano.md): per ogni bipolo la corrente I(id) va da a verso b attraverso il bipolo e la
   tensione V(id) = V(a) − V(b): con la convenzione degli utilizzatori P(id) = V·I è la potenza assorbita
   (negativa per un generatore che eroga). I generatori di tensione hanno il + in a; quelli di corrente spingono la corrente
   fuori dal morsetto a, nel circuito esterno.
   Tipi: R, C, L, Z (impedenza complessa), V, I, W (filo), AM (amperometro), VM (voltmetro), SW (interruttore, closed),
         E (generatore di tensione comandato in tensione), F (di corrente comandato in corrente),
         D (diodo: model 'ideale' | 'soglia', vf), LED (come D a soglia), DZ (Zener: vf, vz),
         Q (BJT: c, b, e, beta, pol 'npn'|'pnp', vbe, vcesat), M (MOSFET a canale N come interruttore: d, g, s, vth, ron),
         OA (operazionale ideale: p, n, o; vpos, vneg per la saturazione; open per l'anello aperto).
   I componenti non lineari hanno modelli a tratti: si provano le combinazioni di stati e si tiene quella coerente. */
(function (root) {
  'use strict';
  const X = root.ElekCx || require('./cx.js');
  const { C, add, sub, mul, div, abs } = X;
  const GMIN = 1e-12;

  /* ---------- Sistema lineare complesso (eliminazione di Gauss con pivot parziale) ---------- */
  function solveLinear(A, b) {
    const n = b.length;
    const M = A.map((row, i) => row.map((x) => C(x.re, x.im)).concat([C(b[i].re, b[i].im)]));
    for (let k = 0; k < n; k++) {
      let p = k, best = abs(M[k][k]);
      for (let i = k + 1; i < n; i++) { const v = abs(M[i][k]); if (v > best) { best = v; p = i; } }
      if (best < 1e-30) throw new Error('rete non risolvibile: il sistema è singolare');
      if (p !== k) [M[p], M[k]] = [M[k], M[p]];
      for (let i = k + 1; i < n; i++) {
        const f = div(M[i][k], M[k][k]);
        if (f.re === 0 && f.im === 0) continue;
        for (let j = k; j <= n; j++) M[i][j] = sub(M[i][j], mul(f, M[k][j]));
      }
    }
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let s = M[i][n];
      for (let j = i + 1; j < n; j++) s = sub(s, mul(M[i][j], x[j]));
      x[i] = div(s, M[i][i]);
    }
    return x;
  }

  /* ---------- Stati dei componenti a tratti ---------- */
  const STATES = {
    D: ['on', 'off'], LED: ['on', 'off'], DZ: ['on', 'off', 'z'],
    Q: ['off', 'att', 'sat'], M: ['off', 'on'],
    OA: (el) => (el.open ? ['sat+', 'sat-'] : ['lin', 'sat+', 'sat-']),
  };
  const statesOf = (el) => { const s = STATES[el.t]; return typeof s === 'function' ? s(el) : s || null; };
  const vfOf = (el) => (el.t === 'D' && (el.model || 'soglia') === 'ideale' ? 0 : el.vf ?? (el.t === 'LED' ? 2 : 0.7));

  /* ---------- Costruzione del sistema per una combinazione di stati ---------- */
  // gmin: piccola conduttanza verso massa in ogni nodo, solo come ripiego quando un nodo resta isolato (sistema singolare)
  function build(net, omega, st, gmin = 0) {
    const nodes = new Map([['0', -1]]);
    const node = (n) => { n = String(n); if (!nodes.has(n)) nodes.set(n, nodes.size - 1); return nodes.get(n); };
    for (const el of net.elements) for (const k of ['a', 'b', 'c', 'e', 'd', 'g', 's', 'p', 'n', 'o', 'cp', 'cn']) if (el[k] != null) node(el[k]);
    // le correnti incognite: una per ogni generatore di tensione (anche i fili, gli amperometri e i modelli «on»)
    const branches = []; // { id, a, b, v, kind }
    const admit = []; // { a, b, y }
    const cur = []; // { a, b, i } corrente spinta fuori da a
    const vcvs = []; // { id, a, b, cp, cn, k }
    const cccs = []; // { a, b, ctrl, k }
    const oas = []; // operazionali in zona lineare: { id, p, n, o }
    const vsrc = (id, a, b, v, kind) => branches.push({ id, a, b, v: X.of(v), kind });
    for (const el of net.elements) {
      const s = st[el.id];
      switch (el.t) {
        case 'R': if (!(el.v > 0)) throw new Error(`${el.id}: resistenza non positiva`); admit.push({ a: el.a, b: el.b, y: C(1 / el.v, 0) }); break;
        case 'Z': admit.push({ a: el.a, b: el.b, y: X.inv(el.z) }); break;
        case 'C': if (omega > 0) admit.push({ a: el.a, b: el.b, y: C(0, omega * el.v) }); break;
        case 'L': if (omega > 0) admit.push({ a: el.a, b: el.b, y: X.inv(C(0, omega * el.v)) }); else vsrc(el.id, el.a, el.b, 0, 'L'); break;
        case 'V': vsrc(el.id, el.a, el.b, el.v, 'V'); break;
        case 'I': cur.push({ a: el.a, b: el.b, i: X.of(el.v) }); break;
        case 'W': case 'AM': vsrc(el.id, el.a, el.b, 0, el.t); break;
        case 'SW': if (el.closed) vsrc(el.id, el.a, el.b, 0, 'SW'); break;
        case 'VM': case 'OPEN': break;
        case 'E': vcvs.push({ id: el.id, a: el.a, b: el.b, cp: el.cp, cn: el.cn, k: el.k }); break;
        case 'F': cccs.push({ a: el.a, b: el.b, ctrl: el.ctrl, k: el.k }); break;
        case 'D': case 'LED': if (s === 'on') vsrc(el.id, el.a, el.b, vfOf(el), 'D'); break;
        case 'DZ':
          if (s === 'on') vsrc(el.id, el.a, el.b, el.vf ?? 0.7, 'D');
          else if (s === 'z') vsrc(el.id, el.a, el.b, -el.vz, 'D');
          break;
        case 'Q': {
          const npn = (el.pol || 'npn') === 'npn', sg = npn ? 1 : -1;
          if (s === 'off') break;
          // base-emettitore: generatore V_BE (per il PNP la base è più bassa dell'emettitore)
          vsrc(el.id + '.be', el.b, el.e, sg * (el.vbe ?? 0.7), 'BE');
          if (s === 'att') cccs.push({ a: el.c, b: el.e, ctrl: el.id + '.be', k: el.beta });
          else vsrc(el.id + '.ce', el.c, el.e, sg * (el.vcesat ?? 0.2), 'CE');
          break;
        }
        case 'M': if (s === 'on') admit.push({ a: el.d, b: el.s, y: C(1 / (el.ron ?? 0.1), 0) }); break;
        case 'OA':
          if (s === 'lin') oas.push({ id: el.id, p: el.p, n: el.n, o: el.o });
          else vsrc(el.id + '.o', el.o, '0', s === 'sat+' ? el.vpos ?? 12 : el.vneg ?? -12, 'OA');
          break;
        default: throw new Error(`${el.id}: tipo sconosciuto ${el.t}`);
      }
    }
    const nN = nodes.size - 1;
    const nB = branches.length + vcvs.length + oas.length;
    const N = nN + nB;
    const A = Array.from({ length: N }, () => Array.from({ length: N }, () => C(0, 0)));
    const z = Array.from({ length: N }, () => C(0, 0));
    const at = (i, j, v) => { if (i < 0 || j < 0) return; A[i][j] = add(A[i][j], v); };
    if (gmin) for (let i = 0; i < nN; i++) at(i, i, C(gmin, 0));
    for (const { a, b, y } of admit) {
      const i = node(a), j = node(b);
      at(i, i, y); at(j, j, y); at(i, j, X.neg(y)); at(j, i, X.neg(y));
    }
    for (const { a, b, i } of cur) { const p = node(a), q = node(b); if (p >= 0) z[p] = add(z[p], i); if (q >= 0) z[q] = sub(z[q], i); }
    const bIndex = new Map();
    branches.forEach((br, k) => {
      const r = nN + k; bIndex.set(br.id, r);
      const i = node(br.a), j = node(br.b);
      at(i, r, C(1, 0)); at(j, r, C(-1, 0)); at(r, i, C(1, 0)); at(r, j, C(-1, 0));
      z[r] = br.v;
    });
    vcvs.forEach((e, k) => {
      const r = nN + branches.length + k; bIndex.set(e.id, r);
      const i = node(e.a), j = node(e.b), p = node(e.cp), q = node(e.cn);
      at(i, r, C(1, 0)); at(j, r, C(-1, 0));
      at(r, i, C(1, 0)); at(r, j, C(-1, 0)); at(r, p, C(-e.k, 0)); at(r, q, C(e.k, 0));
    });
    oas.forEach((o, k) => {
      const r = nN + branches.length + vcvs.length + k; bIndex.set(o.id + '.o', r);
      // la corrente d'uscita entra nella rete dal nodo o; vincolo V(p) − V(n) = 0
      at(node(o.o), r, C(-1, 0));
      at(r, node(o.p), C(1, 0)); at(r, node(o.n), C(-1, 0));
    });
    for (const f of cccs) {
      const r = bIndex.get(f.ctrl);
      if (r == null) throw new Error(`comando di corrente sconosciuto ${f.ctrl}`);
      at(node(f.a), r, C(f.k, 0)); at(node(f.b), r, C(-f.k, 0));
    }
    return { A, z, nodes, nN, bIndex };
  }

  /* ---------- Risultati ---------- */
  function results(net, omega, st, sys, x) {
    const { nodes, bIndex } = sys;
    const V = (n) => { const i = nodes.get(String(n)); if (i == null) throw new Error(`nodo sconosciuto ${n}`); return i < 0 ? C(0, 0) : x[i]; };
    const Ibr = (id) => { const r = bIndex.get(id); return r == null ? C(0, 0) : x[r]; };
    const byId = new Map(net.elements.map((e) => [e.id, e]));
    // tensione e corrente di un bipolo (a → b); per i componenti a tre terminali si chiedono le grandezze per nome
    function I(id) {
      const el = byId.get(id);
      if (!el) {
        // grandezze dei transistor e dell'operazionale: Q1.ib, Q1.ic, Q1.ie, OA1.io
        const m = String(id).match(/^(.+)\.(ib|ic|ie|io)$/);
        if (m) {
          const q = byId.get(m[1]);
          if (q && q.t === 'Q') {
            const s = st[q.id];
            const sg = (q.pol || 'npn') === 'npn' ? 1 : -1;
            const ib = s === 'off' ? C(0, 0) : Ibr(q.id + '.be');
            const ic = s === 'off' ? C(0, 0) : s === 'att' ? X.scale(ib, q.beta) : Ibr(q.id + '.ce');
            const v = { ib, ic, ie: add(ib, ic) }[m[2]];
            return sg > 0 ? v : X.neg(v);
          }
          if (q && q.t === 'OA') return Ibr(q.id + '.o');
        }
        throw new Error(`componente sconosciuto ${id}`);
      }
      const vab = sub(V(el.a), V(el.b));
      switch (el.t) {
        case 'R': return X.scale(vab, 1 / el.v);
        case 'Z': return div(vab, el.z);
        case 'C': return omega > 0 ? mul(vab, C(0, omega * el.v)) : C(0, 0);
        case 'L': return omega > 0 ? div(vab, C(0, omega * el.v)) : Ibr(el.id);
        case 'V': case 'W': case 'AM': return Ibr(el.id);
        case 'SW': return el.closed ? Ibr(el.id) : C(0, 0);
        case 'I': return X.neg(X.of(el.v));
        case 'VM': case 'OPEN': return C(0, 0);
        case 'D': case 'LED': case 'DZ': return st[el.id] === 'off' ? C(0, 0) : Ibr(el.id);
        case 'M': return st[el.id] === 'on' ? X.scale(sub(V(el.d), V(el.s)), 1 / (el.ron ?? 0.1)) : C(0, 0);
        case 'E': return Ibr(el.id);
        case 'F': return X.scale(Ibr(el.ctrl), el.k);
        default: return C(0, 0);
      }
    }
    function Vel(id) {
      const el = byId.get(id);
      if (!el) throw new Error(`componente sconosciuto ${id}`);
      if (el.t === 'M') return sub(V(el.d), V(el.s));
      if (el.t === 'Q') return sub(V(el.c), V(el.e));
      if (el.t === 'OA') return V(el.o);
      return sub(V(el.a), V(el.b));
    }
    // potenza assorbita (in alternata la potenza attiva, con fasori efficaci)
    const P = (id) => { const s = mul(Vel(id), X.conj(I(id))); return s.re; };
    const S = (id) => mul(Vel(id), X.conj(I(id)));
    const re = (z) => z.re;
    return {
      omega, states: Object.assign({}, st),
      V: (n) => re(V(n)), Vc: V,
      I: (id) => re(I(id)), Ic: I,
      Vel: (id) => re(Vel(id)), Velc: Vel,
      P, S,
      nodes: [...nodes.keys()],
    };
  }

  /* ---------- Coerenza degli stati ---------- */
  const EPS = 1e-9;
  function consistent(net, r) {
    for (const el of net.elements) {
      const s = r.states[el.id];
      if (!s) continue;
      const v = (n) => r.V(n);
      switch (el.t) {
        case 'D': case 'LED': {
          const vf = vfOf(el);
          if (s === 'on' && r.I(el.id) < -EPS) return false;
          if (s === 'off' && v(el.a) - v(el.b) > vf + EPS) return false;
          break;
        }
        case 'DZ': {
          const vd = v(el.a) - v(el.b), vf = el.vf ?? 0.7;
          if (s === 'on' && r.I(el.id) < -EPS) return false;
          if (s === 'z' && r.I(el.id) > EPS) return false; // in zona Zener la corrente va dal catodo all'anodo
          if (s === 'off' && (vd > vf + EPS || vd < -el.vz - EPS)) return false;
          break;
        }
        case 'Q': {
          const sg = (el.pol || 'npn') === 'npn' ? 1 : -1;
          const vbe = sg * (v(el.b) - v(el.e)), vce = sg * (v(el.c) - v(el.e));
          // r.I restituisce già I_B e I_C positivi nel funzionamento normale, per NPN e PNP
          const ib = r.I(el.id + '.ib'), ic = r.I(el.id + '.ic');
          const VBE = el.vbe ?? 0.7, VCES = el.vcesat ?? 0.2;
          if (s === 'off' && vbe > VBE + EPS) return false;
          if (s === 'att' && (ib < -EPS || vce < VCES - EPS)) return false;
          if (s === 'sat' && (ib < -EPS || ic < -EPS || ic > el.beta * ib + EPS)) return false;
          break;
        }
        case 'M': {
          const vgs = v(el.g) - v(el.s);
          if (s === 'on' && vgs < el.vth - EPS) return false;
          if (s === 'off' && vgs >= el.vth - EPS) return false;
          break;
        }
        case 'OA': {
          const vd = v(el.p) - v(el.n), vo = v(el.o);
          if (s === 'lin' && (vo > (el.vpos ?? 12) + EPS || vo < (el.vneg ?? -12) - EPS)) return false;
          if (s === 'sat+' && vd < -EPS) return false;
          if (s === 'sat-' && vd > EPS) return false;
          break;
        }
        default: break;
      }
    }
    return true;
  }

  /* solve(net, { omega, prefer }): risolve la rete. omega = 0 per la continua (C aperto, L corto).
     Restituisce i risultati della combinazione di stati coerente; se ce n'è più d'una (per esempio un trigger di Schmitt)
     sceglie quella indicata in o.prefer ({ id: stato }) e le elenca tutte in r.alternatives. */
  function solve(net, o = {}) {
    const omega = o.omega || 0;
    const nl = net.elements.filter((e) => statesOf(e));
    const combos = [];
    const rec = (k, acc) => {
      if (k === nl.length) { combos.push(Object.assign({}, acc)); return; }
      const el = nl[k];
      const opts = o.fix && o.fix[el.id] ? [o.fix[el.id]] : statesOf(el);
      for (const s of opts) { acc[el.id] = s; rec(k + 1, acc); }
    };
    rec(0, {});
    if (combos.length > 4096) throw new Error('troppi componenti non lineari');
    const ok = [];
    let lastErr = null;
    for (const st of combos) {
      let r;
      const attempt = (g) => { const sys = build(net, omega, st, g); return results(net, omega, st, sys, solveLinear(sys.A, sys.z)); };
      try { r = attempt(0); } catch (e) {
        try { r = attempt(GMIN); r.gmin = true; } catch (e2) { lastErr = e2; continue; }
      }
      if (!nl.length || consistent(net, r)) ok.push(r);
    }
    if (!ok.length) throw lastErr || new Error('nessuno stato coerente dei componenti');
    let r = ok[0];
    if (o.prefer && ok.length > 1) r = ok.find((x) => Object.entries(o.prefer).every(([k, v]) => x.states[k] === v)) || r;
    r.alternatives = ok;
    return r;
  }

  /* ---------- Grandezze viste da due morsetti ---------- */
  // resistenza (o impedenza) equivalente fra a e b: si spengono i generatori indipendenti e si applica 1 A
  function killSources(net) {
    return { elements: net.elements.map((e) => (e.t === 'V' ? Object.assign({}, e, { t: 'W' }) : e.t === 'I' ? Object.assign({}, e, { t: 'OPEN' }) : e)) };
  }
  function zeq(net, a, b, o = {}) {
    const n2 = killSources(net);
    n2.elements = n2.elements.concat([{ id: '__test', t: 'I', a, b, v: 1 }]);
    const r = solve(n2, o);
    return sub(r.Vc(a), r.Vc(b));
  }
  // equivalente di Thevenin fra a e b: tensione a vuoto e impedenza interna
  function thevenin(net, a, b, o = {}) {
    const r = solve(net, o);
    const vth = sub(r.Vc(a), r.Vc(b));
    const zth = zeq(net, a, b, o);
    return { vth, zth, ino: abs(zth) > 1e-12 ? div(vth, zth) : null };
  }

  const api = { solve, solveLinear, thevenin, zeq, killSources, GMIN };
  root.ElekMNA = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
