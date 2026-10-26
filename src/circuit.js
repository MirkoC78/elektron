/* ELEKTRON — circuiti «a scala»: la stessa descrizione produce la netlist per il risolutore, la riduzione serie/parallelo
   con la traccia dei passaggi e (in schematic.js) lo schema.
   Descrizione:
     { cols: [ramo, ramo, …],   rami verticali fra il binario alto e quello basso, dall'alto in basso (null: nessun ramo)
       top:  [tratto, …],        tratti del binario alto fra la colonna i e la i+1, da sinistra a destra ([] o assente: filo)
       bot:  [tratto, …],        tratti del binario basso (assenti: fili)
       names: { T1: 'A', B1: 'B' }, nomi dei nodi da mostrare;  ground: false se la massa non è il binario basso }
   ramo o tratto: [elemento, …] in serie; un elemento è { id, t, v, … } oppure un gruppo { par: [ramo, ramo, …] }.
   Verso: il morsetto a dell'elemento è dalla parte dell'inizio del ramo (in alto nelle colonne, a sinistra nei tratti);
   con rev: true si inverte. Così un generatore di tensione in colonna ha il + in alto, un diodo in colonna conduce verso il basso. */
(function (root) {
  'use strict';
  const X = root.ElekCx || require('./cx.js');
  const U = root.ElekUnits || require('./units.js');
  const MA = root.ElekMath || require('./math.js');

  /* ---------- Netlist ---------- */
  function toNetlist(spec) {
    const parent = new Map();
    const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
    const mk = (x) => { if (!parent.has(x)) parent.set(x, x); return x; };
    const union = (a, b) => { a = find(mk(a)); b = find(mk(b)); if (a !== b) parent.set(b, a); };
    const els = [];
    const place = []; // dove sta ogni elemento: { id, where: 'col'|'top'|'bot', i }
    let k = 0;
    function branch(items, from, to, where, i) {
      mk(from); mk(to);
      if (!items || !items.length) { union(from, to); return; }
      let cur = from;
      items.forEach((it, j) => {
        const end = j === items.length - 1 ? to : mk(`${where}${i}.${j}`);
        if (it.par) it.par.forEach((b) => branch(b, cur, end, where, `${i}.${j}p${k++}`));
        else {
          const [a, b] = it.rev ? [end, cur] : [cur, end];
          els.push(Object.assign({}, it, { a, b }));
          place.push({ id: it.id, where, i });
        }
        cur = end;
      });
    }
    const n = spec.cols.length;
    spec.cols.forEach((c, i) => { mk('T' + i); mk('B' + i); if (c) branch(c, 'T' + i, 'B' + i, 'c', i); });
    for (let i = 0; i < n - 1; i++) {
      branch((spec.top || [])[i] || [], 'T' + i, 'T' + (i + 1), 't', i);
      branch((spec.bot || [])[i] || [], 'B' + i, 'B' + (i + 1), 'b', i);
    }
    // nomi canonici dei nodi: «0» per la massa, il nome scelto se c'è, altrimenti N1, N2…
    const groundRoot = spec.ground === false ? null : find('B0');
    const names = spec.names || {};
    const canon = new Map();
    let nn = 0;
    const order = [...parent.keys()].sort((a, b) => rank(a) - rank(b));
    for (const raw of order) {
      const r = find(raw);
      if (canon.has(r)) continue;
      if (r === groundRoot) { canon.set(r, '0'); continue; }
      const lab = [...parent.keys()].find((x) => find(x) === r && names[x]);
      canon.set(r, lab ? names[lab] : 'N' + ++nn);
    }
    const nodeOf = (raw) => canon.get(find(raw));
    for (const e of els) { e.a = nodeOf(e.a); e.b = nodeOf(e.b); }
    // grado dei nodi (numero di elementi che vi arrivano): un «nodo» vero ne ha almeno tre
    const degree = {};
    for (const e of els) for (const x of [e.a, e.b]) degree[x] = (degree[x] || 0) + 1;
    return { elements: els, nodeOf, degree, place };
  }
  // T0, T1… prima dei nodi interni, così la numerazione N1, N2… segue il binario alto da sinistra
  function rank(x) { const m = String(x).match(/^([TB])(\d+)$/); return m ? (m[1] === 'T' ? 0 : 1e6) + +m[2] : 5e5 + String(x).length; }

  /* ---------- Albero serie/parallelo ---------- */
  // un albero: { id, t, v } (foglia) | { s: [alberi] } | { p: [alberi] }
  const leaf = (it) => Object.assign({}, it);
  const ser = (...xs) => { const a = xs.filter(Boolean).flatMap((x) => (x.s ? x.s : [x])); return a.length === 0 ? null : a.length === 1 ? a[0] : { s: a }; };
  const par = (...xs) => { const a = xs.filter(Boolean).flatMap((x) => (x.p ? x.p : [x])); return a.length === 0 ? null : a.length === 1 ? a[0] : { p: a }; };
  function itemsTree(items) {
    if (!items || !items.length) return { t: 'W', id: '—' };
    return ser(...items.map((it) => (it.par ? par(...it.par.map(itemsTree)) : leaf(it))));
  }
  const segTree = (spec, side, i) => { const s = (spec[side] || [])[i]; return s && s.length ? itemsTree(s) : null; };
  // impedenza vista dai morsetti della colonna k (il ramo k è tolto: è la porta, per esempio il generatore o il carico)
  function seenFrom(spec, k) {
    const n = spec.cols.length;
    const colT = (i) => (spec.cols[i] ? itemsTree(spec.cols[i]) : null);
    // verso destra: dalla colonna i in poi, vista dai nodi Ti, Bi
    const right = (i) => {
      if (i >= n) return null;
      const further = i + 1 < n ? ser(segTree(spec, 'top', i), right(i + 1), segTree(spec, 'bot', i)) : null;
      const c = colT(i);
      return c && further ? par(c, further) : c || further;
    };
    const left = (i) => {
      if (i < 0) return null;
      const further = i - 1 >= 0 ? ser(segTree(spec, 'top', i - 1), left(i - 1), segTree(spec, 'bot', i - 1)) : null;
      const c = colT(i);
      return c && further ? par(c, further) : c || further;
    };
    const R = k + 1 < n ? ser(segTree(spec, 'top', k), right(k + 1), segTree(spec, 'bot', k)) : null;
    const L = k - 1 >= 0 ? ser(segTree(spec, 'top', k - 1), left(k - 1), segTree(spec, 'bot', k - 1)) : null;
    return simplify(par(L, R));
  }
  // generatori spenti (tensione → filo, corrente → aperto), fili e aperti semplificati
  function simplify(t) {
    if (!t) return null;
    if (!t.s && !t.p) {
      if (t.t === 'V') return { t: 'W', id: t.id };
      if (t.t === 'I' || t.t === 'OPEN' || t.t === 'VM') return { t: 'OPEN', id: t.id };
      if (t.t === 'AM' || t.t === 'SW' && t.closed) return { t: 'W', id: t.id };
      return t;
    }
    if (t.s) {
      const a = t.s.map(simplify).filter(Boolean);
      if (a.some((x) => x.t === 'OPEN')) return { t: 'OPEN', id: 'aperto' };
      const b = a.filter((x) => x.t !== 'W');
      return b.length ? ser(...b) : { t: 'W', id: 'filo' };
    }
    const a = t.p.map(simplify).filter(Boolean);
    if (a.some((x) => x.t === 'W')) return { t: 'W', id: 'corto' };
    const b = a.filter((x) => x.t !== 'OPEN');
    return b.length ? par(...b) : { t: 'OPEN', id: 'aperto' };
  }
  // l'albero contiene solo bipoli passivi?
  const passive = (t) => (!t ? true : t.s || t.p ? (t.s || t.p).every(passive) : ['R', 'C', 'L', 'Z', 'W', 'OPEN'].includes(t.t));

  /* ---------- Riduzione con la traccia dei passaggi ---------- */
  const suffix = (id) => { const m = String(id).match(/^[A-Za-z]+(.*)$/); return m && m[1] ? m[1] : String(id); };
  const symOf = (id, letter) => { const sfx = suffix(id); return `${letter}_{${sfx}}`; };
  // impedenza di una foglia alla pulsazione omega (per la continua: numero reale)
  function zLeaf(l, omega) {
    if (l.t === 'R') return X.C(l.v, 0);
    if (l.t === 'Z') return X.of(l.z);
    if (l.t === 'L') return X.C(0, omega * l.v);
    if (l.t === 'C') { if (!omega) throw new Error('condensatore in continua: è un aperto'); return X.C(0, -1 / (omega * l.v)); }
    throw new Error('foglia non passiva ' + l.t);
  }
  /* reduce(albero, { omega }): impedenza equivalente e passaggi. In continua i valori sono numeri reali e la grandezza è R;
     in alternata sono complessi e la grandezza è Z. Ogni passaggio: { kind, name, parts, f, s, v } con f e s nel linguaggio
     delle formule (math.js). */
  function reduce(tree, o = {}) {
    const ac = !!o.omega;
    const L = ac ? 'Z' : 'R';
    const steps = [];
    const info = new Map(); // nodo dell'albero → { name, z }
    const used = new Set();
    let letter = 0;
    // valore da sostituire: i negativi (e i complessi con la parte reale) fra parentesi quando servono
    const show = (v, wrap) => {
      const t = ac ? X.fmtRect(v, 'Ω') : U.fmt(v.re, 'Ω');
      return wrap && t.startsWith('−') ? '(`' + t + '`)' : '`' + t + '`';
    };
    // in alternata le foglie si chiamano con il loro simbolo (Z_R1, Z_C1); i gruppi con i pedici uniti, se non si confondono
    const leafName = (t) => (ac ? `Z_{${t.id}}` : symOf(t.id, L));
    function go(t) {
      if (!t.s && !t.p) { const name = leafName(t); used.add(name); const r = { z: zLeaf(t, o.omega), name, id: t.id, leaf: true }; info.set(t, r); return r; }
      // figli in ordine naturale (R1, R2, R10): R₁₂, non R₂₁
      const kids = (t.s || t.p).map(go).sort((a, b) => String(a.id).localeCompare(String(b.id), 'it', { numeric: true }));
      const sfx = kids.map((k) => (ac ? k.id : suffix(k.id)));
      // in continua R_23, R_123…; in alternata (e quando i pedici si confonderebbero) Z_a, Z_b…
      let name = `${L}_{${sfx.join('')}}`;
      if (ac || new Set(sfx).size < sfx.length || used.has(name) || name.length > 14) name = `${L}_{${'abcdefgh'[letter++]}}`;
      used.add(name);
      const id = (ac ? '' : L) + sfx.join('');
      let z, f, s;
      if (t.s) {
        z = X.ser(...kids.map((k) => k.z));
        f = `${name} = ${kids.map((k) => k.name).join(' + ')}`;
        s = kids.map((k, i) => show(k.z, i > 0)).join(' + ');
      } else {
        z = X.par(...kids.map((k) => k.z));
        const same = kids.every((k) => X.eq(k.z, kids[0].z));
        if (kids.length === 2) {
          f = `${name} = {${kids[0].name} * ${kids[1].name}}/{${kids[0].name} + ${kids[1].name}}`;
          s = `{${show(kids[0].z, true)} * ${show(kids[1].z, true)}}/{${show(kids[0].z)} + ${show(kids[1].z, true)}}`;
        } else if (same) {
          f = `${name} = ${kids[0].name}/${kids.length}`;
          s = `${show(kids[0].z)}/${kids.length}`;
        } else {
          f = `${name} = 1/{${kids.map((k) => `1/${k.name}`).join(' + ')}}`;
          s = `1/{${kids.map((k) => `1/${show(k.z)}`).join(' + ')}}`;
        }
      }
      const step = { kind: t.s ? 'serie' : 'parallelo', name, parts: kids.map((k) => k.name), f, s: `${name} = ${s} = ${show(z)}`, v: ac ? z : z.re };
      steps.push(step);
      const res = { z, name, id, step };
      info.set(t, res);
      return res;
    }
    const r = go(tree);
    if (o.finalName && steps.length) {
      const last = steps[steps.length - 1], old = last.name;
      last.name = o.finalName;
      last.f = last.f.replace(old, o.finalName);
      last.s = last.s.replace(old, o.finalName);
      r.name = o.finalName;
    }
    return { z: ac ? r.z : r.z.re, name: r.name, steps, info, tree, ac };
  }

  /* ritorno indietro: data la corrente I che attraversa l'albero (o la tensione ai suoi capi), corrente e tensione di ogni
     foglia; con target (id di una foglia) restituisce anche i passaggi lungo il cammino fino a quella foglia. */
  function backprop(red, I0, o = {}) {
    const ac = red.ac;
    const L = ac ? 'Z' : 'R';
    const C0 = X.of(I0);
    const out = new Map(); // id della foglia → { i, v }
    const steps = [];
    const rootName = red.info.get(red.tree).name;
    // la corrente totale si chiama I (o come dice il chiamante), la tensione totale V
    const Iname = (n) => (n === rootName ? o.iName || 'I' : n.replace(/^[RZ]_/, 'I_')), Vname = (n) => (n === rootName ? o.vName || 'V' : n.replace(/^[RZ]_/, 'V_'));
    const show = (v, u, wrap) => { const t = ac ? X.fmtRect(v, u) : U.fmt(v.re, u, o); return wrap && t.startsWith('−') ? '(`' + t + '`)' : '`' + t + '`'; };
    const contains = (t, id) => (!t.s && !t.p ? t.id === id : (t.s || t.p).some((k) => contains(k, id)));
    function go(t, i, v, onPath) {
      const me = red.info.get(t);
      if (!t.s && !t.p) { out.set(t.id, { i: ac ? i : i.re, v: ac ? v : v.re }); return; }
      const kids = t.s || t.p;
      for (const k of kids) {
        const kk = red.info.get(k);
        const path = onPath && o.target && contains(k, o.target);
        if (t.s) {
          const vk = X.mul(i, kk.z);
          if (path) steps.push({ kind: 'tensione', f: `${Vname(kk.name)} = ${kk.name} * ${Iname(me.name)}`, s: `${Vname(kk.name)} = ${show(kk.z, 'Ω')} * ${show(i, 'A', true)} = ${show(vk, 'V')}`, v: ac ? vk : vk.re, u: 'V' });
          go(k, i, vk, path);
        } else {
          const ik = X.div(v, kk.z);
          if (path) steps.push({ kind: 'corrente', f: `${Iname(kk.name)} = ${Vname(me.name)}/${kk.name}`, s: `${Iname(kk.name)} = ${show(v, 'V')}/${show(kk.z, 'Ω')} = ${show(ik, 'A')}`, v: ac ? ik : ik.re, u: 'A' });
          go(k, ik, v, path);
        }
      }
    }
    const root0 = red.tree;
    go(root0, C0, X.mul(C0, red.info.get(root0).z), true);
    return { leaves: out, steps };
  }

  const api = { backprop, toNetlist, seenFrom, simplify, passive, reduce, itemsTree, ser, par, suffix };
  root.ElekCircuit = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
