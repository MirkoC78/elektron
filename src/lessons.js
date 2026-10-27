/* ELEKTRON — motore delle lezioni e della palestra. Costruisce le schede, le domande di controllo e gli esercizi di ogni
   lezione dentro il suo perimetro (concetti già introdotti, tipo di numeri, prefissi ammessi), e gli allenamenti della palestra.
   Nessun accesso al DOM: si usa anche nei test. */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const PB = root.ElekProblems || require('./problems.js');
  if (!root.ElekProblems2) { try { require('./problems2.js'); } catch (e) { /* nel browser è già caricato */ } }
  const CO = root.ElekConcepts || require('./concepts.js');
  const C3 = root.ELEK_COURSE3 || require('./course3.js');
  const C45 = root.ELEK_COURSE45 || require('./course45.js');
  const UNITS = C3.concat(C45);

  let rand = Math.random;
  const rnd = (n) => Math.floor(rand() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const ALL_PREFIXES = ['p', 'n', 'µ', 'm', '', 'k', 'M'];

  /* ---------- Struttura del percorso ---------- */
  const FLAT = [];
  UNITS.forEach((u, ui) => u.lessons.forEach((l, li) => FLAT.push({ unit: u, lesson: l, ui, li, idx: FLAT.length })));
  const BY_ID = Object.fromEntries(FLAT.map((x) => [x.lesson.id, x]));
  const UNIT_BY_ID = Object.fromEntries(UNITS.map((u, i) => [u.id, Object.assign({ i }, u)]));
  const ORDER = UNITS.map((u) => u.id);
  // concetti introdotti fino alla lezione (compresa)
  const knownCache = new Map();
  function knownUpTo(idx) {
    if (knownCache.has(idx)) return knownCache.get(idx);
    const s = new Set();
    for (const f of FLAT.slice(0, idx + 1)) for (const c of f.lesson.intro || []) s.add(c);
    knownCache.set(idx, s);
    return s;
  }
  // prefissi: nessuno fino alla lezione che li introduce; k e m fino all'unità 8; poi tutti
  function prefixesFor(f, known) {
    if (f.lesson.prefixes) return f.lesson.prefixes;
    if (!known.has('m.prefissi')) return [''];
    return f.ui >= ORDER.indexOf('u8') ? ALL_PREFIXES : ['', 'k', 'm'];
  }
  function scopeOf(lessonId) {
    const f = BY_ID[lessonId];
    const known = knownUpTo(f.idx);
    return {
      lessonId, known, prefixes: prefixesFor(f, known), num: f.lesson.num || 'free', level: f.lesson.level || 1,
      bank: f.lesson.bank || [], usedBank: new Set(), topic: f.unit.id, test: !!f.lesson.test,
    };
  }
  function init(o = {}) { if (o.rand) rand = o.rand; }

  /* ---------- Da un problema a un esercizio ---------- */
  const fmtAns = (v, u, sc) => (u ? U.fmt(v, u, { prefixes: sc.prefixes, sig: 3 }) : U.num(v, { sig: 3 }));
  // scelta fra risposte: la giusta e gli errori tipici calcolati dal motore (distinti fra loro e dalla giusta)
  function asChoice(p, sc) {
    if (p.choices) return { type: 'scelta', problem: p, choices: shuffle(p.choices) };
    const sol = p.sol;
    if (typeof sol.v !== 'number' || !isFinite(sol.v)) return null;
    const right = fmtAns(sol.v, sol.u, sc);
    const seen = new Set([right]);
    const opts = [{ label: right, right: true }];
    const cands = shuffle(sol.mistakes || []).concat([{ id: 'prefisso', v: sol.v * 1000 }, { id: 'prefisso', v: sol.v / 1000 }]);
    for (const m of cands) {
      if (!isFinite(m.v) || m.v === 0 || U.within(m.v, sol.v, 0.03)) continue;
      const lab = fmtAns(m.v, sol.u, sc);
      if (seen.has(lab)) continue;
      seen.add(lab);
      opts.push({ label: lab, right: false, mistake: m.id, v: m.v });
      if (opts.length >= 4) break;
    }
    if (opts.length < 3) return null;
    return { type: 'scelta', problem: p, choices: shuffle(opts) };
  }
  // ordinare i passaggi dello svolgimento (almeno tre)
  function asOrder(p) {
    const steps = (p.sol.steps || []).filter((s) => s.f && s.s);
    if (steps.length < 3) return null;
    return { type: 'ordina', problem: p, steps, order: shuffle(steps.map((_, i) => i)) };
  }
  const NATIVE = { calc: 'calc', scelta: 'scelta', formula: 'scelta' };
  function exercise(spec, sc, avoid) {
    const [mode, gen] = spec.includes(':') ? spec.split(':') : [null, spec];
    let p = null;
    for (let k = 0; k < 8 && !p; k++) {
      const x = PB.make(gen, sc, rand);
      if (x && avoid && avoid.has(x.text) && k < 7) continue;
      p = x;
    }
    if (!p) return null;
    if (avoid) avoid.add(p.text);
    // il perimetro: segnala i concetti non ancora introdotti (al massimo uno, e mai nelle prove)
    const fresh = p.uses.filter((c) => !sc.known.has(c));
    if (fresh.length) p.newConcepts = fresh;
    let it = null;
    if (mode === 's') it = asChoice(p, sc);
    else if (mode === 'o') it = asOrder(p);
    if (!it) {
      const k = p.kind;
      if (k === 'scelta' || k === 'formula' || p.choices) it = { type: 'scelta', problem: p, choices: shuffle(p.choices || []) };
      else it = { type: NATIVE[k] || k, problem: p };
    }
    it.gen = gen;
    return it;
  }
  // domanda di controllo dopo una scheda
  function controlQuestion(card, sc) {
    const q = card.q;
    if (!q) return null;
    if (Array.isArray(q)) {
      const [text, right, ...wrong] = q;
      return { type: 'scelta', quiz: true, problem: { text, sol: { sym: '', u: '', v: 0, steps: [{ f: '"risposta"', s: '"' + right.replace(/"/g, '') + '"', v: null, u: '' }], mistakes: [] }, uses: [], gen: 'controllo' }, choices: shuffle([{ label: right, right: true }].concat(wrong.map((w) => ({ label: w, right: false })))) };
    }
    const p = PB.make(q.gen, sc, rand);
    if (!p) return null;
    const it = asChoice(p, sc) || (p.choices ? { type: 'scelta', problem: p, choices: shuffle(p.choices) } : { type: NATIVE[p.kind] || p.kind, problem: p });
    it.quiz = true;
    it.gen = q.gen;
    return it;
  }

  /* ---------- Costruzione della lezione ---------- */
  function buildLesson(lessonId, o = {}) {
    const f = BY_ID[lessonId];
    const l = f.lesson;
    const sc = Object.assign(scopeOf(lessonId), o.scope || {});
    const items = [];
    const avoid = new Set(o.avoid || []);
    if (o.teach !== false && l.teach) {
      for (const card of l.teach) {
        const t = { type: 'teach', card, topic: f.unit.id };
        if (card.ex) t.example = PB.make(card.ex, sc, rand);
        items.push(t);
        const q = controlQuestion(card, sc);
        if (q) items.push(q);
      }
    }
    for (const spec of l.mix || []) {
      const it = exercise(spec, sc, avoid);
      if (it) { it.lesson = lessonId; items.push(it); }
    }
    return items;
  }

  /* ---------- Palestra ---------- */
  // categorie della palestra
  const CATEGORY = {
    calcolo: (g) => g.kind === 'calc' || g.kind === 'complesso',
    schemi: (g) => ['conta', 'guasto', 'simbolo'].includes(g.kind) || /schema|guasto|simbolo/.test(g.id),
    logica: (g) => ['base', 'tabella', 'bit', 'espressione', 'simula', 'kmap', 'sequenza'].includes(g.kind) || /^porta|^logica|^km|demorgan|teoremi|canonica|latch/.test(g.id),
    strumenti: (g) => ['multimetro', 'oscilloscopio', 'colori-leggi', 'colori-scegli', 'grafico'].includes(g.kind) || /^multimetro|^osc|^colori/.test(g.id),
  };
  // concetti di un insieme di unità
  function knownForUnits(units) {
    const s = new Set();
    for (const f of FLAT) if (units.has(f.unit.id)) for (const c of f.lesson.intro || []) s.add(c);
    return s;
  }
  /* o = { units: Set di unità aperte, unit (facoltativa: solo quella), category: 'tutti'|'calcolo'|'schemi'|'logica'|'strumenti',
     level: 1–4, onlyDone: true (solo concetti già incontrati), n: numero di esercizi } */
  function buildPractice(o) {
    const units = o.units;
    const known = o.known || knownForUnits(units);
    const topics = o.unit ? new Set([o.unit]) : units;
    const lastUnit = ORDER.filter((u) => units.has(u)).pop();
    const ui = ORDER.indexOf(lastUnit);
    const sc0 = { known, prefixes: ui >= ORDER.indexOf('u8') ? ALL_PREFIXES : known.has('m.prefissi') ? ['', 'k', 'm'] : [''], num: 'free', bank: [], usedBank: new Set() };
    const cat = CATEGORY[o.category] || (() => true);
    const gens = PB.list().filter((g) => topics.has(g.topic) && g.id !== 'domande' && cat(g) && (!o.onlyDone || g.uses.every((c) => known.has(c))));
    const want = o.level || 2;
    // livello richiesto; se gli argomenti aperti non lo permettono il limite si allenta da solo
    let level = Math.min(want, 3);
    let pool = [];
    for (; level >= 1; level--) { pool = gens.filter((g) => g.levels.includes(level)); if (pool.length) break; }
    if (!pool.length) { pool = gens; level = 1; }
    const items = [];
    const avoid = new Set();
    const n = o.n || 10;
    for (let k = 0; k < n * 3 && items.length < n && pool.length; k++) {
      const g = pick(pool);
      const sc = Object.assign({}, sc0, { level: Math.max(level, 1), topic: g.topic });
      const it = exercise(g.id, sc, avoid);
      if (!it) continue;
      if (want === 4) {
        // esperto: tutto il problema, senza suggerimenti, con la verifica di ogni risultato intermedio
        // solo i risultati con un'unità che si scrive (non i passaggi di servizio, come il determinante in Ω²)
        const parts = (it.problem.sol.steps || []).filter((s) => typeof s.v === 'number' && isFinite(s.v) && s.u != null && (s.u === '' || U.UNITS[s.u]));
        if (it.type === 'calc' && parts.length >= 2) { it.type = 'esperto'; it.parts = parts; }
        else if (it.type !== 'calc') continue;
      }
      items.push(it);
    }
    return { items, level: want === 4 ? 4 : level, relaxed: level < Math.min(want, 3) };
  }

  const api = { UNITS, FLAT, BY_ID, UNIT_BY_ID, ORDER, ALL_PREFIXES, init, knownUpTo, scopeOf, prefixesFor, buildLesson, buildPractice, exercise, asChoice, asOrder, controlQuestion, knownForUnits, CATEGORY };
  root.ElekLessons = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
