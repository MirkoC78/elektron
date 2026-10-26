/* ELEKTRON — generatori dei problemi. Ogni generatore costruisce un problema dentro il perimetro della lezione:
     G(id, { topic, levels, uses, kind }, (sc, r) => problema)
   sc: perimetro (prefixes: prefissi ammessi; num: 'int' | 'dec1' | 'free'; level: 1–4); r: generatore casuale.
   Un problema: { gen, topic, kind, text (con le formule fra $…$ nel linguaggio di math.js), schema, sol, uses, level }.
   sol viene dai risolutori del motore (valore, unità, traccia, errori tipici). Nulla di calcolato è scritto a mano.
   Vincoli fisici controllati dal test dei generatori (test/generator.test.js): niente divisioni per zero, potenze nei
   resistori entro 1/4 W, transistor nella zona dichiarata, risultati in un intervallo ragionevole, errori tipici distinti. */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const MA = root.ElekMath || require('./math.js');
  const S = root.ElekSolve || require('./solve.js');
  const CI = root.ElekCircuit || require('./circuit.js');
  const MNA = root.ElekMNA || require('./mna.js');
  const MI = root.ElekMistakes || require('./mistakes.js');

  const REG = new Map();
  function G(id, meta, fn) { REG.set(id, Object.assign({ id, fn, levels: [1], kind: 'calc', uses: [] }, meta)); }

  /* ---------- Numeri dentro il perimetro ---------- */
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
  // valori scritti come li vede lo studente: q(sc)(v, u) → «`4,7 kΩ`»
  const Q = (sc) => (v, u, paren) => MA.q(v, u, { prefixes: sc.prefixes, sig: 3, paren });
  const T = (sc) => (v, u) => U.fmt(v, u, { prefixes: sc.prefixes });
  // il valore si scrive esattamente (senza arrotondare) con i prefissi ammessi e il tipo di numeri della lezione
  function exact(v, u, sc) {
    if (!isFinite(v)) return false;
    const s = U.fmt(v, u, { prefixes: sc.prefixes, sig: 6 });
    const m = s.replace(/[  ]/g, ' ').match(/^−?([\d ]+)(?:,(\d+))?/);
    if (!m) return false;
    const dec = (m[2] || '').length;
    const sig = (m[1].replace(/ /g, '').replace(/^0+/, '') + (m[2] || '')).replace(/^0+/, '').replace(/0+$/, '').length;
    if (sc.num === 'int' && dec > 0) return false;
    if (sc.num === 'dec1' && dec > 1) return false;
    if (sc.num !== 'free' && sig > 3) return false;
    return true;
  }
  // quanti decimali e cifre: nelle prime unità i dati e i risultati devono essere «facili»
  const okAll = (sc, pairs) => pairs.every(([v, u]) => exact(v, u, sc));
  // prova più volte a costruire un problema che rispetti i vincoli
  function tryN(n, f) { for (let k = 0; k < n; k++) { const x = f(k); if (x) return x; } return null; }
  // gli errori tipici devono essere distinti dalla risposta giusta (altrimenti non si potrebbero riconoscere)
  const distinct = (sol) => typeof sol.v !== 'number' || MI.distinct(sol.v, sol.mistakes.filter((m) => m.id !== 'segno' || sol.v !== 0), 0.03);
  const hasPrefix = (sc) => (sc.prefixes || []).some((p) => p !== '');
  const R_E12 = (r, lo, hi) => pick(r, U.seriesValues('E12', lo, hi));
  const R_E24 = (r, lo, hi) => pick(r, U.seriesValues('E24', lo, hi));
  // resistenze adatte al perimetro: senza prefissi valori da 10 a 990 Ω, con il «k» fino a 100 kΩ
  const resistor = (r, sc, lo = 100, hi = 47000) => (hasPrefix(sc) ? R_E12(r, lo, hi) : R_E12(r, 10, 820));
  const voltage = (r, sc) => pick(r, sc.num === 'int' ? [3, 5, 6, 9, 12, 15, 24] : [1.5, 3, 4.5, 5, 6, 9, 12, 15, 24]);
  // potenza dissipata da ogni resistore di una netlist (per il vincolo di 1/4 W)
  function maxResistorPower(net) { const res = MNA.solve(net); return Math.max(...net.elements.filter((e) => e.t === 'R').map((e) => Math.abs(res.P(e.id)))); }

  /* ======================= Unità 1: grandezze e unità ======================= */
  G('carica.I', { topic: 'u1', uses: ['q.Q', 'q.I', 'q.t', 'f.IQt'] }, (sc, r) => tryN(50, () => {
    const t = pick(r, [2, 4, 5, 10, 20, 30, 60]), I = pick(r, sc.num === 'int' ? [1, 2, 3, 4, 5, 10] : [0.5, 1, 1.5, 2, 2.5, 4]);
    const Qv = I * t;
    const sol = S.charge({ find: 'I', Q: Qv, t }, sc);
    if (!okAll(sc, [[Qv, 'C'], [t, 's'], [I, 'A']]) || !distinct(sol)) return null;
    return { text: `In un conduttore passano $Q = ${Q(sc)(Qv, 'C')}$ di carica in $t = ${Q(sc)(t, 's')}$. Quanto vale la corrente?`, sol };
  }));
  G('carica.Q', { topic: 'u1', uses: ['q.Q', 'q.I', 'q.t', 'f.IQt'] }, (sc, r) => tryN(50, () => {
    const t = pick(r, [5, 10, 20, 30, 60, 120]), I = pick(r, sc.num === 'int' ? [1, 2, 3, 4, 5] : [0.2, 0.5, 1.5, 2, 2.5]);
    const sol = S.charge({ find: 'Q', I, t }, sc);
    if (!okAll(sc, [[sol.v, 'C'], [I, 'A']]) || !distinct(sol)) return null;
    return { text: `Una corrente di $I = ${Q(sc)(I, 'A')}$ scorre per $t = ${Q(sc)(t, 's')}$. Quanta carica attraversa il conduttore?`, sol };
  }));
  G('carica.t', { topic: 'u1', levels: [2], uses: ['q.Q', 'q.I', 'q.t', 'f.IQt'] }, (sc, r) => tryN(50, () => {
    const t = pick(r, [5, 10, 20, 40, 50]), I = pick(r, [1, 2, 4, 5]);
    const sol = S.charge({ find: 't', Q: I * t, I }, sc);
    if (!okAll(sc, [[I * t, 'C'], [t, 's']]) || !distinct(sol)) return null;
    return { text: `Quanto tempo serve perché una corrente di $I = ${Q(sc)(I, 'A')}$ trasporti $Q = ${Q(sc)(I * t, 'C')}$ di carica?`, sol };
  }));
  // tensione come energia per unità di carica: V = W/Q
  G('tensione.V', { topic: 'u1', uses: ['q.V', 'q.W', 'q.Q', 'f.VWQ'] }, (sc, r) => tryN(50, () => {
    const Qv = pick(r, [1, 2, 4, 5, 10]), V = pick(r, [3, 5, 6, 9, 12]);
    const W = V * Qv;
    const sol = { sym: 'V', u: 'V', v: V, steps: [{ f: 'V = W/Q', s: `V = ${Q(sc)(W, 'J')}/${Q(sc)(Qv, 'C')} = ${Q(sc)(V, 'V')}`, v: V, u: 'V' }], mistakes: [{ id: 'formula-inversa', v: W * Qv }, { id: 'formula-inversa', v: Qv / W }] };
    if (!distinct(sol)) return null;
    return { text: `Per spostare $Q = ${Q(sc)(Qv, 'C')}$ di carica fra due punti un generatore fornisce $W = ${Q(sc)(W, 'J')}$ di energia. Quanto vale la tensione fra i due punti?`, sol };
  }));
  // potenze di 10 e notazione scientifica: da un numero alla notazione scientifica (risposta numerica)
  G('sci.leggi', { topic: 'u1', kind: 'calc', uses: ['m.pot10', 'm.sci'] }, (sc, r) => {
    const m = pick(r, [1.2, 2.5, 3.3, 4.7, 5, 6.8, 8.2]), e = pick(r, [-6, -4, -3, -2, 2, 3, 4, 6]);
    const v = m * 10 ** e;
    const shown = U.num(m, { sig: 2 }) + ' · 10^' + e;
    return { text: `Scrivi in forma normale (senza potenze di 10) il numero $${shown.replace(' · 10^', ' * 10^{').replace(/$/, '}')}$.`, sol: { sym: 'x', u: '', v, steps: [{ f: `x = ${U.num(m, { sig: 2 })} * 10^{${e}}`, s: `x = \`${U.num(v, { sig: 2 })}\``, v, u: '' }], mistakes: [{ id: 'potenze-10', v: m * 10 ** -e }, { id: 'potenze-10', v: m * 10 ** (e + (e > 0 ? -1 : 1)) }], tol: 1e-6 } };
  });
  G('sci.prodotto', { topic: 'u1', kind: 'calc', uses: ['m.pot10', 'm.sci'] }, (sc, r) => {
    const a = pick(r, [2, 3, 4, 5]), b = pick(r, [2, 3, 1.5]), e1 = pick(r, [2, 3, -3]), e2 = pick(r, [-2, -3, 3, 4]);
    const v = a * b * 10 ** (e1 + e2);
    return { text: `Quanto fa $(${a} * 10^{${e1}}) * (${U.num(b)} * 10^{${e2}})$? Scrivi il risultato in forma normale.`, sol: { sym: 'x', u: '', v, steps: [{ f: '10^a * 10^b = 10^{a+b}', s: `x = ${U.num(a * b)} * 10^{${e1 + e2}} = \`${U.num(v, { sig: 3 })}\``, v, u: '' }], mistakes: [{ id: 'potenze-10', v: a * b * 10 ** (e1 * e2) }, { id: 'potenze-10', v: (a + b) * 10 ** (e1 + e2) }], tol: 1e-6 } };
  });
  // prefissi: conversione fra multipli e sottomultipli
  const PREF_CASES = [['k', 'Ω'], ['M', 'Ω'], ['m', 'A'], ['µ', 'A'], ['m', 'V'], ['k', 'V'], ['µ', 'F'], ['n', 'F'], ['p', 'F'], ['m', 's'], ['µ', 's'], ['k', 'Hz'], ['M', 'Hz'], ['m', 'W'], ['k', 'W']];
  const PREF_CAP = { V: 1000, A: 10, W: 5000, 'Ω': 1e7, Hz: 1e9, F: 0.01, s: 1000, H: 10 };
  G('prefissi.base', { topic: 'u1', uses: ['m.prefissi', 'm.pot10'] }, (sc, r) => tryN(30, () => {
    const allowed = PREF_CASES.filter(([p]) => (sc.prefixes || []).includes(p));
    if (!allowed.length) return null;
    const [p, u] = pick(r, allowed);
    const m = pick(r, U.PREFIX[p] >= 6 || (u === 'W' && p === 'k') ? [1, 1.5, 2.2, 4.7] : [1.5, 2.2, 4.7, 10, 15, 33, 47, 100, 220, 470]);
    const v = m * 10 ** U.PREFIX[p];
    if (v > (PREF_CAP[u] || 1e9)) return null;
    const sol = { sym: 'x', u, v, steps: [{ f: `1 "${p}${u}" = 10^{${U.PREFIX[p]}} "${u}"`, s: `\`${U.num(m)} ${p}${u}\` = ${U.num(m)} * 10^{${U.PREFIX[p]}} "${u}" = \`${U.num(v, { sig: 3 })} ${u}\``, v, u }], mistakes: [{ id: 'prefisso', v: v * 1000 }, { id: 'prefisso', v: v / 1000 }] };
    return { text: `Quanto vale $\`${U.num(m)} ${p}${u}\`$ senza prefisso, in ${U.UNITS[u].name}?`, sol, answerPrefixes: [''] };
  }));
  G('prefissi.verso', { topic: 'u1', uses: ['m.prefissi', 'm.pot10'] }, (sc, r) => tryN(30, () => {
    const allowed = PREF_CASES.filter(([p]) => (sc.prefixes || []).includes(p));
    if (!allowed.length) return null;
    const [p, u] = pick(r, allowed);
    const m = pick(r, U.PREFIX[p] >= 6 || (u === 'W' && p === 'k') ? [1, 1.5, 2.2, 4.7] : [1.5, 2.2, 4.7, 10, 15, 33, 47, 100, 220, 470]);
    const v = m * 10 ** U.PREFIX[p];
    if (v > (PREF_CAP[u] || 1e9)) return null;
    const sol = { sym: 'x', u, v, steps: [{ f: `1 "${u}" = 10^{${-U.PREFIX[p]}} "${p}${u}"`, s: `\`${U.num(v, { sig: 3 })} ${u}\` = \`${U.num(m)} ${p}${u}\``, v, u }], mistakes: [{ id: 'prefisso', v: v * 1000 }, { id: 'prefisso', v: v / 1000 }] };
    return { text: `Scrivi $\`${U.num(v, { sig: 3 })} ${u}\`$ con il prefisso ${U.PREFIX_NAME[p]} (${p}).`, sol, wantPrefix: p };
  }));
  // la scrittura dei tecnici: 4k7, 2M2, R47
  G('prefissi.tecnici', { topic: 'u1', uses: ['m.prefissi'] }, (sc, r) => {
    const cases = [['4k7', 4700], ['2k2', 2200], ['1k5', 1500], ['6k8', 6800], ['3k3', 3300], ['1M2', 1.2e6], ['2M2', 2.2e6], ['4R7', 4.7], ['R47', 0.47], ['8k2', 8200], ['47k', 47000], ['3M3', 3.3e6]];
    const [w, v] = pick(r, cases);
    return { text: `Sullo schema di un tecnico c’è scritto «${w}». Quanti ohm sono?`, sol: { sym: 'R', u: 'Ω', v, steps: [{ f: `"${w}"`, s: `"${w}: la lettera fa da virgola e da prefisso" → ${MA.q(v, 'Ω')}`, v, u: 'Ω' }], mistakes: [{ id: 'prefisso', v: v * 1000 }, { id: 'prefisso', v: v / 1000 }] } };
  });
  G('potenza.PVI', { topic: 'u1', uses: ['q.P', 'q.V', 'q.I', 'f.PVI'] }, (sc, r) => tryN(60, () => {
    const V = voltage(r, sc), I = pick(r, hasPrefix(sc) ? [0.02, 0.05, 0.1, 0.25, 0.5, 1, 2] : [0.5, 1, 2, 3]);
    const sol = S.power({ find: 'P', V, I }, sc);
    if (!okAll(sc, [[V, 'V'], [I, 'A'], [sol.v, 'W']]) || !distinct(sol)) return null;
    return { text: `Un apparecchio alimentato a $V = ${Q(sc)(V, 'V')}$ assorbe $I = ${Q(sc)(I, 'A')}$. Quanta potenza assorbe?`, sol };
  }));
  G('potenza.IPV', { topic: 'u1', levels: [2], uses: ['q.P', 'q.V', 'q.I', 'f.PVI'] }, (sc, r) => tryN(60, () => {
    const V = pick(r, [5, 6, 9, 12, 24]), I = pick(r, [0.1, 0.2, 0.25, 0.5, 1, 2]);
    const sol = S.power({ find: 'I', P: V * I, V }, sc);
    if (!okAll(sc, [[V * I, 'W'], [I, 'A']]) || !distinct(sol)) return null;
    return { text: `Una lampadina da $P = ${Q(sc)(V * I, 'W')}$ funziona a $V = ${Q(sc)(V, 'V')}$. Quale corrente assorbe?`, sol };
  }));
  G('energia.J', { topic: 'u1', uses: ['q.W', 'q.P', 'q.t', 'f.WPt'] }, (sc, r) => tryN(60, () => {
    const P = pick(r, [2, 5, 10, 20, 50, 100]), t = pick(r, [10, 30, 60, 120, 300]);
    const sol = S.energy({ P, t, out: 'J' }, sc);
    if (!okAll(sc, [[sol.v, 'J']]) || !distinct(sol)) return null;
    return { text: `Un dispositivo da $P = ${Q(sc)(P, 'W')}$ resta acceso per $t = ${Q(sc)(t, 's')}$. Quanta energia consuma, in joule?`, sol };
  }));
  G('energia.kWh', { topic: 'u1', levels: [2], uses: ['q.W', 'q.P', 'q.t', 'f.WPt', 'u.Wh'] }, (sc, r) => tryN(60, () => {
    const P = pick(r, [500, 1000, 1500, 2000, 2500]), h = pick(r, [0.5, 1, 1.5, 2, 3, 4]);
    const sol = S.energy({ P, t: h * 3600, out: 'kWh' }, sc);
    if (!distinct(sol)) return null;
    return { text: `Uno scaldabagno da $P = ${Q(sc)(P, 'W')}$ resta acceso $\`${U.num(h)} h\`$. Quanta energia consuma, in kilowattora?`, sol, answerPrefixes: ['k'] };
  }));

  /* ======================= Unità 2: circuito, componenti, strumenti ======================= */
  G('tolleranza.min', { topic: 'u2', uses: ['q.R', 'q.tol', 'm.perc'] }, (sc, r) => tryN(40, () => {
    const R = R_E12(r, 100, 47000), tol = pick(r, [5, 10, 1, 2]);
    const find = pick(r, ['min', 'max']);
    const sol = S.tolerance({ R, tol, find }, sc);
    if (!okAll(Object.assign({}, sc, { num: 'free' }), [[sol.v, 'Ω']]) || !distinct(sol)) return null;
    return { text: `Un resistore da $${Q(sc)(R, 'Ω')}$ ha una tolleranza del ${tol} %. Quanto vale la resistenza ${find === 'min' ? 'minima' : 'massima'} che può avere?`, sol };
  }));
  G('serieE.vicino', { topic: 'u2', kind: 'scelta', uses: ['c.serieE', 'q.R'] }, (sc, r) => tryN(40, () => {
    const x = pick(r, [13, 25, 37, 52, 64, 75, 88]) * pick(r, hasPrefix(sc) ? [1, 10, 100, 1000] : [1, 10]);
    if (U.inSeries(x, 'E12')) return null;
    const right = U.nearest(x, 'E12');
    const vals = [right, U.nextUp(right * 1.0001, 'E12'), U.nextDown(right * 0.9999, 'E12'), U.nearest(x, 'E24')].filter((v, i, a) => v && a.indexOf(v) === i);
    if (vals.length < 3) return null;
    // il valore E24 può coincidere con quello E12: le opzioni restano distinte
    return { text: `Il calcolo dà $R = ${MA.q(x, 'Ω')}$. Quale valore della serie E12 è il più vicino?`, choices: vals.slice(0, 4).map((v) => ({ label: U.fmt(v, 'Ω'), right: v === right, mistake: v === right ? null : 'serie-e' })), sol: { sym: 'R', u: 'Ω', v: right, steps: [{ f: '"serie E12"', s: `"valori E12 vicini:" ${MA.q(U.nextDown(x, 'E12'), 'Ω')} "e" ${MA.q(U.nextUp(x, 'E12'), 'Ω')} → ${MA.q(right, 'Ω')}`, v: right, u: 'Ω' }], mistakes: [] } };
  }));
  // codice colori: dalle bande al valore (risposta numerica) e dal valore alle bande (scelta)
  const colorMax = (sc) => ((sc.prefixes || []).includes('M') ? 1e6 : 820000);
  G('colori.valore', { topic: 'u2', kind: 'colori-leggi', uses: ['c.R', 'c.codice'] }, (sc, r) => {
    const n = r() < 0.75 ? 4 : 5;
    const v = n === 4 ? R_E12(r, 10, colorMax(sc)) : R_E24(r, 10, colorMax(sc));
    const tol = n === 4 ? pick(r, [5, 5, 10]) : pick(r, [1, 2]);
    const bands = U.toBands(v, n, tol);
    const digits = bands.slice(0, n - 2).map((b) => U.COLOR[b].d).join('');
    const mult = U.COLOR[bands[n - 2]].m;
    return { bands, text: `Quanto vale il resistore con le bande ${bands.join(', ')}?`, sol: { sym: 'R', u: 'Ω', v, steps: [{ f: `"cifre" ${digits}, "moltiplicatore" 10^{${mult}}`, s: `R = ${digits} * 10^{${mult}} "Ω" = ${Q(sc)(v, 'Ω')} "± ${tol} %"`, v, u: 'Ω' }], mistakes: [{ id: 'colori-moltiplicatore', v: v * 10 }, { id: 'colori-moltiplicatore', v: v / 10 }, { id: 'prefisso', v: v * 1000 }, { id: 'prefisso', v: v / 1000 }] } };
  });
  G('colori.bande', { topic: 'u2', kind: 'colori-scegli', uses: ['c.R', 'c.codice'] }, (sc, r) => {
    const v = R_E12(r, 10, colorMax(sc) / 10);
    const right = U.toBands(v, 4, 5);
    // distrattori: moltiplicatore sbagliato di uno, cifre scambiate
    const swap = [right[1], right[0], right[2], right[3]];
    const m1 = U.toBands(v * 10, 4, 5), m2 = U.toBands(v / 10, 4, 5);
    const opts = [right, m1, m2, swap].filter((b, i, a) => b && a.findIndex((x) => x && x.join() === b.join()) === i);
    return { value: v, text: `Quali bande ha un resistore da $${Q(sc)(v, 'Ω')}$ con tolleranza 5 %?`, choices: opts.map((b) => ({ bands: b, label: b.join(', '), right: b === right, mistake: b === right ? null : b === swap ? 'colori-ordine' : 'colori-moltiplicatore' })), sol: { sym: 'R', u: 'Ω', v, steps: [{ f: '"cifre, moltiplicatore, tolleranza"', s: `${MA.q(v, 'Ω')} → "${right.join(', ')}"`, v, u: 'Ω' }], mistakes: [] } };
  });
  // multimetro: dove si collega, quale portata, che cosa si legge
  G('multimetro.collega', { topic: 'u2', kind: 'scelta', uses: ['c.VM', 'c.AM', 'c.R'] }, (sc, r) => {
    const what = pick(r, ['tensione', 'corrente', 'resistenza']);
    const right = { tensione: 'in parallelo al componente, con il circuito acceso', corrente: 'in serie al componente, aprendo il circuito', resistenza: 'ai capi del componente, con il circuito spento' }[what];
    const all = ['in parallelo al componente, con il circuito acceso', 'in serie al componente, aprendo il circuito', 'ai capi del componente, con il circuito spento', 'in serie al componente, con il circuito spento'];
    return { text: `Vuoi misurare ${what === 'tensione' ? 'la tensione ai capi di' : what === 'corrente' ? 'la corrente che attraversa' : 'la resistenza di'} un resistore. Come colleghi il multimetro?`, choices: all.map((a) => ({ label: a, right: a === right, mistake: a === right ? null : 'strumento-collegamento' })), sol: { sym: what, u: '', v: 0, steps: [{ f: `"${what}"`, s: `"${right}"`, v: null, u: '' }], mistakes: [] } };
  });
  const RANGES = { V: [0.2, 2, 20, 200], A: [0.0002, 0.002, 0.02, 0.2], 'Ω': [200, 2000, 20000, 200000, 2e6] };
  G('multimetro.portata', { topic: 'u2', kind: 'scelta', uses: ['c.VM', 'c.AM', 's.portata', 'm.prefissi'] }, (sc, r) => {
    const mode = pick(r, ['V', 'A', 'Ω']);
    const rs = RANGES[mode];
    const k = 1 + Math.floor(r() * (rs.length - 1));
    const x = rs[k] * pick(r, [0.15, 0.3, 0.45, 0.6, 0.8]);
    const right = rs.find((g) => g >= x);
    return { text: `Il valore che ti aspetti è circa $${Q(sc)(x, mode)}$. Quale portata scegli per leggerlo con la massima precisione senza andare fuori scala?`, choices: rs.map((g) => ({ label: T(sc)(g, mode), right: g === right, mistake: g === right ? null : g < x ? 'portata-piccola' : 'portata-grande' })), sol: { sym: 'portata', u: mode, v: right, steps: [{ f: '"la portata più piccola che contiene il valore"', s: `${MA.q(x, mode)} ≤ ${MA.q(right, mode)}`, v: right, u: mode }], mistakes: [] } };
  });
  G('multimetro.leggi', { topic: 'u2', kind: 'multimetro', uses: ['c.VM', 'c.AM', 's.portata', 'm.prefissi'] }, (sc, r) => {
    const mode = pick(r, ['V', 'A']);
    const rs = RANGES[mode];
    const range = pick(r, rs.slice(1));
    const reading = +(range * pick(r, [0.12, 0.25, 0.43, 0.61, 0.735, 0.88])).toPrecision(3);
    return { meter: { mode, range, reading }, text: `Il multimetro, sulla portata ${U.fmt(range, mode)}, mostra il display qui sotto. Quanto vale la ${mode === 'V' ? 'tensione' : 'corrente'} misurata?`, sol: { sym: mode, u: mode, v: reading, steps: [{ f: '"lettura del display"', s: `"portata" ${MA.q(range, mode)}: ${MA.q(reading, mode)}`, v: reading, u: mode }], mistakes: [{ id: 'prefisso', v: reading * 1000 }, { id: 'prefisso', v: reading / 1000 }] } };
  });

  /* ======================= Unità 3: legge di Ohm ======================= */
  // corrente in mA con un decimale al massimo, resistenze E12
  function ohmValues(r, sc, tries = 80) {
    return tryN(tries, () => {
      const R = resistor(r, sc, 100, 22000), V = voltage(r, sc);
      const I = V / R;
      if (!okAll(sc, [[R, 'Ω'], [V, 'V'], [I, 'A']])) return null;
      if (I * I * R > 0.25 || I < 1e-4) return null;
      return { R, V, I };
    });
  }
  G('ohm.V', { topic: 'u3', uses: ['q.V', 'q.R', 'q.I', 'f.ohm'] }, (sc, r) => {
    const x = ohmValues(r, sc);
    if (!x) return null;
    const sol = S.ohm({ find: 'V', R: x.R, I: x.I }, sc);
    if (!distinct(sol)) return null;
    return { text: `Un resistore da $R = ${Q(sc)(x.R, 'Ω')}$ è attraversato da una corrente $I = ${Q(sc)(x.I, 'A')}$. Quanto vale la tensione ai suoi capi?`, schema: loop(x.V, x.R, { voltages: [{ el: 'R1', label: 'V' }], currents: [{ el: 'R1', label: 'I' }], unknownV: true, I: x.I }), sol };
  });
  G('ohm.I', { topic: 'u3', uses: ['q.V', 'q.R', 'q.I', 'f.ohm', 'm.eq1'] }, (sc, r) => {
    const x = ohmValues(r, sc);
    if (!x) return null;
    const sol = S.ohm({ find: 'I', V: x.V, R: x.R }, sc);
    if (!distinct(sol)) return null;
    return { text: `Un generatore da $V = ${Q(sc)(x.V, 'V')}$ alimenta un resistore da $R = ${Q(sc)(x.R, 'Ω')}$. Quanta corrente circola?`, schema: loop(x.V, x.R, { currents: [{ el: 'R1', label: 'I' }] }), sol };
  });
  G('ohm.R', { topic: 'u3', uses: ['q.V', 'q.R', 'q.I', 'f.ohm', 'm.eq1'] }, (sc, r) => {
    const x = ohmValues(r, sc);
    if (!x) return null;
    const sol = S.ohm({ find: 'R', V: x.V, I: x.I }, sc);
    if (!distinct(sol)) return null;
    return { text: `Ai capi di un resistore c’è una tensione di $V = ${Q(sc)(x.V, 'V')}$ e lo attraversa una corrente di $I = ${Q(sc)(x.I, 'A')}$. Quanto vale la resistenza?`, schema: loop(x.V, x.R, { currents: [{ el: 'R1', label: 'I' }], unknownR: true }), sol };
  });
  // formula inversa: scelta fra tre formule
  G('ohm.inversa', { topic: 'u3', kind: 'formula', uses: ['f.ohm', 'm.eq1'] }, (sc, r) => {
    const which = pick(r, ['I', 'R', 'V']);
    const right = { I: 'I = V/R', R: 'R = V/I', V: 'V = R * I' }[which];
    const opts = { I: ['I = V/R', 'I = R/V', 'I = V * R'], R: ['R = V/I', 'R = I/V', 'R = V * I'], V: ['V = R * I', 'V = R/I', 'V = I/R'] }[which];
    return { text: `Dalla legge di Ohm $V = R * I$ ricava ${which === 'I' ? 'la corrente' : which === 'R' ? 'la resistenza' : 'la tensione'}.`, choices: opts.map((f) => ({ math: f, right: f === right, mistake: f === right ? null : 'formula-inversa' })), sol: { sym: which, u: '', v: 0, steps: [{ f: 'V = R * I', s: right, v: null, u: '' }], mistakes: [] } };
  });
  G('joule.P', { topic: 'u3', uses: ['q.P', 'q.R', 'q.I', 'q.V', 'f.PRI2', 'f.PV2R'] }, (sc, r) => tryN(60, () => {
    const R = resistor(r, sc, 100, 10000), V = voltage(r, sc);
    const I = V / R;
    const mode = pick(r, ['RI', 'VR']);
    const sol = mode === 'RI' ? S.power({ find: 'P', R, I }, sc) : S.power({ find: 'P', V, R }, sc);
    if (sol.v > 0.25 || !okAll(sc, [[R, 'Ω'], [mode === 'RI' ? I : V, mode === 'RI' ? 'A' : 'V']]) || !distinct(sol)) return null;
    return { text: mode === 'RI' ? `Un resistore da $R = ${Q(sc)(R, 'Ω')}$ è attraversato da $I = ${Q(sc)(I, 'A')}$. Quanta potenza dissipa?` : `Ai capi di un resistore da $R = ${Q(sc)(R, 'Ω')}$ c’è una tensione di $V = ${Q(sc)(V, 'V')}$. Quanta potenza dissipa?`, schema: loop(V, R, {}), sol };
  }));
  G('joule.Imax', { topic: 'u3', levels: [2], uses: ['q.P', 'q.R', 'q.I', 'f.PRI2', 'm.eq1', 'c.potenza-nominale'] }, (sc, r) => tryN(60, () => {
    const R = R_E12(r, 100, 10000), P = pick(r, [0.25, 0.5]);
    const sol = S.power({ find: 'I', P, R }, sc);
    if (!distinct(sol)) return null;
    return { text: `Un resistore da $R = ${Q(sc)(R, 'Ω')}$ ha una potenza nominale di $${Q(sc)(P, 'W')}$. Qual è la corrente massima che lo può attraversare?`, sol };
  }));
  G('joule.nominale', { topic: 'u3', kind: 'scelta', uses: ['q.P', 'c.potenza-nominale', 'f.PRI2', 'f.PV2R'] }, (sc, r) => tryN(60, () => {
    const R = R_E12(r, 47, 4700), V = pick(r, [5, 9, 12, 15, 24]);
    const P = V * V / R;
    const ratings = [0.125, 0.25, 0.5, 1, 2];
    const right = ratings.find((x) => x >= P);
    if (!right || P > 2 || P < 0.02) return null;
    return { text: `Un resistore da $R = ${Q(sc)(R, 'Ω')}$ deve lavorare con $V = ${Q(sc)(V, 'V')}$ ai capi. Quale potenza nominale scegli, la più piccola che basta?`, choices: ratings.map((x) => ({ label: x < 1 ? `1/${Math.round(1 / x)} W` : `${x} W`, right: x === right, mistake: x === right ? null : x < P ? 'potenza-piccola' : null })), sol: { sym: 'P', u: 'W', v: right, steps: [{ f: 'P = V^2/R', s: `P = (${Q(sc)(V, 'V')})^2/${Q(sc)(R, 'Ω')} = ${Q(sc)(P, 'W')}`, v: P, u: 'W' }], mistakes: [] } };
  }));
  G('resistivita.R', { topic: 'u3', uses: ['q.rho', 'q.R', 'f.rho'] }, (sc, r) => {
    const mat = pick(r, [['rame', 0.0175], ['alluminio', 0.028], ['nichel-cromo', 1.1]]);
    const l = pick(r, mat[0] === 'nichel-cromo' ? [0.5, 1, 2, 5] : [10, 25, 50, 100, 200]), Sx = pick(r, mat[0] === 'nichel-cromo' ? [0.1, 0.25, 0.5] : [0.5, 0.75, 1, 1.5, 2.5]);
    const sol = S.resistivity({ rho: mat[1], l, S: Sx }, sc);
    return { text: `Un filo di ${mat[0]} ($rho = \`${U.num(mat[1])} Ω·mm²/m\`$) è lungo $\`${U.num(l)} m\`$ e ha una sezione di $\`${U.num(Sx)} mm²\`$. Quanto vale la sua resistenza?`, sol };
  });
  // caratteristica V–I: dalla pendenza alla resistenza (grafico)
  G('ohm.grafico', { topic: 'u3', kind: 'grafico', uses: ['q.R', 'f.ohm'] }, (sc, r) => {
    const R = pick(r, [100, 200, 470, 500, 1000, 2000]);
    const Vmax = pick(r, [5, 10, 12]);
    const V0 = Vmax * pick(r, [0.5, 0.6, 0.8, 1]);
    const I0 = V0 / R;
    const sol = S.ohm({ find: 'R', V: V0, I: I0 }, sc);
    if (!okAll(sc, [[V0, 'V'], [I0, 'A']])) return null;
    return { plot: { kind: 'vi', R, Vmax, point: [V0, I0] }, text: `Il grafico mostra la caratteristica tensione–corrente di un resistore. Nel punto segnato $V = ${Q(sc)(V0, 'V')}$ e $I = ${Q(sc)(I0, 'A')}$. Quanto vale la resistenza?`, sol };
  });

  /* ---------- Schemi di uso comune ---------- */
  function loop(V, R, o = {}) {
    return { ladder: { cols: [[{ id: 'V1', t: 'V', v: V }], [{ id: 'R1', t: 'R', v: R, unknown: o.unknownR }]], top: [[]] }, opts: { currents: o.currents, voltages: o.voltages } };
  }

  /* ======================= Unità 4: serie e parallelo ======================= */
  const ids = (n) => Array.from({ length: n }, (_, i) => 'R' + (i + 1));
  G('serie.Req', { topic: 'u4', uses: ['f.serie', 'q.R'] }, (sc, r) => tryN(40, () => {
    const n = pick(r, sc.level >= 2 ? [3, 4] : [2, 3]);
    const R = Array.from({ length: n }, () => resistor(r, sc, 100, 10000));
    const sol = S.series({ R, find: 'Req' }, sc);
    if (!okAll(sc, R.map((x) => [x, 'Ω']).concat([[sol.v, 'Ω']])) || !distinct(sol)) return null;
    return { text: `Quanto vale la resistenza equivalente di ${n} resistori in serie da ${R.map((x) => '$' + Q(sc)(x, 'Ω') + '$').join(', ')}?`, schema: { ladder: { cols: [[{ id: 'V1', t: 'V', label: '' }], [{ id: 'R' + n, t: 'R', v: R[n - 1] }]], top: [R.slice(0, -1).map((v, i) => ({ id: 'R' + (i + 1), t: 'R', v }))] } }, sol };
  }));
  G('serie.IV', { topic: 'u4', levels: [2], uses: ['f.serie', 'f.ohm', 'q.R', 'q.V', 'q.I'] }, (sc, r) => tryN(60, () => {
    const n = pick(r, [2, 3]);
    const R = Array.from({ length: n }, () => resistor(r, sc, 100, 10000));
    const V = voltage(r, sc);
    const find = pick(r, ['I', 'V' + (1 + Math.floor(r() * n)), 'P1']);
    const sol = S.series({ R, V, find }, sc);
    const Req = R.reduce((a, b) => a + b, 0);
    if (V * V / Req > 0.25 * n || !okAll(Object.assign({}, sc, { num: 'free' }), [[sol.v, sol.u]]) || !distinct(sol)) return null;
    if (R.some((x) => (V / Req) ** 2 * x > 0.25)) return null;
    const what = find === 'I' ? 'la corrente nel circuito' : find.startsWith('V') ? `la tensione ai capi di $R_${find.slice(1)}$` : 'la potenza dissipata da $R_1$';
    return { text: `Un generatore da $V = ${Q(sc)(V, 'V')}$ alimenta ${n} resistori in serie (${R.map((x, i) => `$R_${i + 1} = ${Q(sc)(x, 'Ω')}$`).join(', ')}). Quanto vale ${what}?`, schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: V }], [{ id: 'R' + n, t: 'R', v: R[n - 1] }]], top: [R.slice(0, -1).map((v, i) => ({ id: 'R' + (i + 1), t: 'R', v }))] } }, sol };
  }));
  G('parallelo.Req', { topic: 'u4', uses: ['f.par', 'q.R'] }, (sc, r) => tryN(60, () => {
    const n = sc.level >= 2 ? pick(r, [2, 3]) : 2;
    const same = r() < 0.25;
    const R0 = resistor(r, sc, 100, 10000);
    const R = Array.from({ length: n }, () => (same ? R0 : resistor(r, sc, 100, 10000)));
    const sol = S.parallel({ R, find: 'Req' }, sc);
    if (!distinct(sol)) return null;
    return { text: `Quanto vale la resistenza equivalente di ${n} resistori in parallelo da ${R.map((x) => '$' + Q(sc)(x, 'Ω') + '$').join(', ')}?`, schema: { ladder: { cols: [[{ id: 'V1', t: 'V', label: '' }]].concat(R.map((v, i) => [{ id: 'R' + (i + 1), t: 'R', v }])), top: R.map(() => []) } }, sol };
  }));
  G('parallelo.I', { topic: 'u4', levels: [2], uses: ['f.par', 'f.ohm', 'q.R', 'q.I'] }, (sc, r) => tryN(60, () => {
    const R = [resistor(r, sc, 220, 10000), resistor(r, sc, 220, 10000)];
    const V = voltage(r, sc);
    const find = pick(r, ['I', 'I1', 'I2']);
    if (R.some((x) => V * V / x > 0.25)) return null;
    const sol = S.parallel({ R, V, find }, sc);
    if (!distinct(sol)) return null;
    return { text: `Due resistori in parallelo, $R_1 = ${Q(sc)(R[0], 'Ω')}$ e $R_2 = ${Q(sc)(R[1], 'Ω')}$, sono alimentati da $V = ${Q(sc)(V, 'V')}$. Quanto vale ${find === 'I' ? 'la corrente erogata dal generatore' : `la corrente in $R_${find.slice(1)}$`}?`, schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: V }], [{ id: 'R1', t: 'R', v: R[0] }], [{ id: 'R2', t: 'R', v: R[1] }]], top: [[], []] }, opts: { currents: find === 'I' ? [] : [{ el: 'R' + find.slice(1), label: 'I_' + find.slice(1) }] } }, sol };
  }));
  // rete mista a scala: R1 in serie, poi parallelo (ed eventualmente un altro gradino)
  function mixedSpec(r, sc, steps) {
    const val = () => resistor(r, sc, 100, 10000);
    if (steps === 1) return { cols: [[{ id: 'V1', t: 'V', v: voltage(r, sc) }], [{ id: 'R2', t: 'R', v: val() }], [{ id: 'R3', t: 'R', v: val() }]], top: [[{ id: 'R1', t: 'R', v: val() }], []], names: { T1: 'A' } };
    return { cols: [[{ id: 'V1', t: 'V', v: voltage(r, sc) }], [{ id: 'R2', t: 'R', v: val() }], [{ id: 'R4', t: 'R', v: val() }]], top: [[{ id: 'R1', t: 'R', v: val() }], [{ id: 'R3', t: 'R', v: val() }]], names: { T1: 'A', T2: 'B' } };
  }
  const specPowerOK = (spec) => maxResistorPower(CI.toNetlist(spec)) <= 0.25;
  G('mista.Req', { topic: 'u4', levels: [2, 3], uses: ['f.serie', 'f.par', 'q.R'] }, (sc, r) => tryN(60, () => {
    const spec = mixedSpec(r, sc, sc.level >= 3 ? 2 : pick(r, [1, 2]));
    const sol = S.network({ spec, find: 'Req' }, sc);
    if (!distinct(sol)) return null;
    spec.cols[0] = [{ id: 'V1', t: 'V', label: '' }];
    return { text: 'Quanto vale la resistenza equivalente vista dal generatore?', schema: { ladder: spec }, sol };
  }));
  G('mista.ramo', { topic: 'u4', levels: [3], uses: ['f.serie', 'f.par', 'f.ohm', 'q.R', 'q.I', 'q.V'] }, (sc, r) => tryN(80, () => {
    const spec = mixedSpec(r, sc, pick(r, [1, 2]));
    if (!specPowerOK(spec)) return null;
    const rs = CI.toNetlist(spec).elements.filter((e) => e.t === 'R').map((e) => e.id);
    const target = pick(r, rs);
    const kind = pick(r, ['I', 'V']);
    const sol = S.network({ spec, V: spec.cols[0][0].v, find: kind + ':' + target }, sc);
    if (!distinct(sol)) return null;
    return { text: `Quanto vale ${kind === 'I' ? 'la corrente' : 'la tensione'} ${kind === 'I' ? 'in' : 'ai capi di'} $R_${target.slice(1)}$?`, schema: { ladder: spec, opts: { highlight: [target] } }, sol };
  }));
  // lettura dello schema: in serie o in parallelo?
  G('schema.serieparallelo', { topic: 'u4', kind: 'scelta', uses: ['f.serie', 'f.par'] }, (sc, r) => {
    const spec = mixedSpec(r, Object.assign({}, sc, { prefixes: ['', 'k'] }), 1);
    spec.cols[0] = [{ id: 'V1', t: 'V', label: '' }];
    const q = pick(r, [['R2', 'R3', 'in parallelo'], ['R1', 'V1', 'in serie'], ['R1', 'R2', 'né in serie né in parallelo']]);
    const all = ['in serie', 'in parallelo', 'né in serie né in parallelo'];
    const [a, b, right] = q;
    return { text: `Come sono collegati $${a.replace(/(\d)/, '_$1')}$ e $${b.replace(/(\d)/, '_$1')}$?`, schema: { ladder: spec, opts: { highlight: [a, b] } }, choices: all.map((x) => ({ label: x, right: x === right, mistake: x === right ? null : 'serie-parallelo' })), sol: { sym: 'collegamento', u: '', v: 0, steps: [{ f: `"${a} e ${b}"`, s: `"${right}: ${right === 'in serie' ? 'sono attraversati dalla stessa corrente, uno dopo l’altro, senza nodi in mezzo' : right === 'in parallelo' ? 'sono collegati fra gli stessi due nodi' : 'fra i due c’è un nodo da cui parte un altro ramo'}"`, v: null, u: '' }], mistakes: [] } };
  });

  /* ======================= Unità 5: partitori ======================= */
  G('partitore.V2', { topic: 'u5', uses: ['f.part', 'q.V', 'q.R'] }, (sc, r) => tryN(60, () => {
    const R1 = resistor(r, sc, 470, 47000), R2 = resistor(r, sc, 470, 47000), V = voltage(r, sc);
    if (R1 === R2) return null;
    const sol = S.divider({ V, R1, R2 }, sc);
    if (!distinct(sol) || V * V / (R1 + R2) > 0.25) return null;
    return { text: `Nel partitore $R_1 = ${Q(sc)(R1, 'Ω')}$, $R_2 = ${Q(sc)(R2, 'Ω')}$, alimentato da $V = ${Q(sc)(V, 'V')}$, quanto vale la tensione $V_2$ ai capi di $R_2$?`, schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: V }], [{ id: 'R2', t: 'R', v: R2 }]], top: [[{ id: 'R1', t: 'R', v: R1 }]] }, opts: { voltages: [{ el: 'R2', label: 'V_2' }] } }, sol };
  }));
  G('partitore.carico', { topic: 'u5', levels: [2, 3], uses: ['f.part', 'f.par', 'q.V', 'q.R'] }, (sc, r) => tryN(60, () => {
    const R1 = resistor(r, sc, 470, 22000), R2 = resistor(r, sc, 470, 22000), RL = resistor(r, sc, 470, 47000), V = voltage(r, sc);
    const sol = S.loadedDivider({ V, R1, R2, RL }, sc);
    if (!distinct(sol)) return null;
    return { text: `Al partitore $R_1 = ${Q(sc)(R1, 'Ω')}$, $R_2 = ${Q(sc)(R2, 'Ω')}$ (alimentato da $V = ${Q(sc)(V, 'V')}$) si collega un carico $R_L = ${Q(sc)(RL, 'Ω')}$ in parallelo a $R_2$. Quanto vale la tensione sul carico?`, schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: V }], [{ id: 'R2', t: 'R', v: R2 }], [{ id: 'RL', t: 'R', v: RL }]], top: [[{ id: 'R1', t: 'R', v: R1 }], []] }, opts: { voltages: [{ el: 'RL', label: 'V_L' }] } }, sol };
  }));
  G('partitore.corrente', { topic: 'u5', uses: ['f.partI', 'q.I', 'q.R'] }, (sc, r) => tryN(60, () => {
    const R1 = resistor(r, sc, 100, 10000), R2 = resistor(r, sc, 100, 10000), I = pick(r, [0.002, 0.005, 0.01, 0.02]);
    if (R1 === R2) return null;
    const sol = S.currentDivider({ I, R1, R2 }, sc);
    if (!distinct(sol)) return null;
    return { text: `Una corrente $I = ${Q(sc)(I, 'A')}$ si divide fra $R_1 = ${Q(sc)(R1, 'Ω')}$ e $R_2 = ${Q(sc)(R2, 'Ω')}$ in parallelo. Quanto vale la corrente in $R_1$?`, schema: { ladder: { cols: [[{ id: 'I1', t: 'I', v: I }], [{ id: 'R1', t: 'R', v: R1 }], [{ id: 'R2', t: 'R', v: R2 }]], top: [[], []] }, opts: { currents: [{ el: 'R1', label: 'I_1' }] } }, sol };
  }));
  G('potenziometro.V', { topic: 'u5', uses: ['f.part', 'c.pot'] }, (sc, r) => {
    const Rt = pick(r, [1000, 4700, 10000, 47000]), k = pick(r, [0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8]), V = voltage(r, sc);
    const R2 = Rt * k, R1 = Rt - R2;
    const sol = S.divider({ V, R1, R2 }, sc);
    sol.steps.unshift({ f: 'R_2 = k * R_P', s: `R_2 = ${U.num(k)} * ${Q(sc)(Rt, 'Ω')} = ${Q(sc)(R2, 'Ω')}`, v: R2, u: 'Ω' });
    return { text: `Un potenziometro da $R_P = ${Q(sc)(Rt, 'Ω')}$ è collegato fra $V = ${Q(sc)(V, 'V')}$ e la massa. Il cursore è al ${Math.round(k * 100)} % della corsa partendo dalla massa. Quanto vale la tensione fra il cursore e la massa?`, sol };
  });

  /* ======================= Unità 6: Kirchhoff ======================= */
  G('kcl.I', { topic: 'u6', uses: ['f.kcl', 'q.I', 'kir.nodo'] }, (sc, r) => {
    const nIn = pick(r, [1, 2]), nOut = pick(r, [1, 2]);
    const val = () => pick(r, [0.001, 0.002, 0.003, 0.005, 0.008, 0.01, 0.015, 0.02]);
    const known = [];
    let k = 1;
    for (let i = 0; i < nIn; i++) known.push({ sym: `I_${k++}`, v: val(), dir: 'in' });
    for (let i = 0; i < nOut; i++) known.push({ sym: `I_${k++}`, v: val(), dir: 'out' });
    const sol = S.kcl({ known, sym: `I_${k}` }, sc);
    if (Math.abs(sol.v) < 1e-12 || !distinct(sol)) return null;
    return { node: { known, unknown: `I_${k}` }, text: `Nel nodo ${known.filter((x) => x.dir === 'in').map((x) => `$${x.sym} = ${Q(sc)(x.v, 'A')}$`).join(' e ')} ${nIn === 1 ? 'entra' : 'entrano'}, ${known.filter((x) => x.dir === 'out').map((x) => `$${x.sym} = ${Q(sc)(x.v, 'A')}$`).join(' e ')} ${nOut === 1 ? 'esce' : 'escono'}. La corrente $I_${k}$ è disegnata uscente dal nodo: quanto vale? (Se viene negativa, scrivila con il segno meno: vuol dire che in realtà entra.)`, sol };
  });
  G('kvl.V', { topic: 'u6', uses: ['f.kvl', 'q.V', 'kir.maglia'] }, (sc, r) => tryN(40, () => {
    const E = voltage(r, sc);
    const V1 = +(E * pick(r, [0.2, 0.25, 0.3, 0.4])).toFixed(1);
    const V2 = +(E * pick(r, [0.1, 0.2, 0.3])).toFixed(1);
    const known = [{ sym: 'E', v: E, sign: -1 }, { sym: 'V_1', v: V1, sign: 1 }, { sym: 'V_2', v: V2, sign: 1 }];
    const sol = S.kvl({ known, sym: 'V_3', sign: 1 }, sc);
    if (sol.v <= 0 || !distinct(sol)) return null;
    return { text: `In una maglia c’è un generatore $E = ${Q(sc)(E, 'V')}$ e tre resistori in serie. Ai capi dei primi due si misurano $V_1 = ${Q(sc)(V1, 'V')}$ e $V_2 = ${Q(sc)(V2, 'V')}$. Quanto vale la tensione $V_3$ sul terzo?`, schema: { ladder: { cols: [[{ id: 'E', t: 'V', v: E }], [{ id: 'R3', t: 'R', label: '' }]], top: [[{ id: 'R1', t: 'R', label: '' }, { id: 'R2', t: 'R', label: '' }]] }, opts: { voltages: [{ el: 'R1', label: 'V_1', rev: false }, { el: 'R2', label: 'V_2' }, { el: 'R3', label: 'V_3' }], values: false } }, sol };
  }));
  G('potenziale.VAB', { topic: 'u6', uses: ['q.potenziale', 'q.V', 'c.massa'] }, (sc, r) => {
    const VA = pick(r, [12, 9, 7.5, 5, 3.3]), VB = pick(r, [4.5, 3, 2.5, 1.2, -2]);
    const v = VA - VB;
    return { text: `Rispetto alla massa il punto A è a $V_A = ${Q(sc)(VA, 'V', true)}$ e il punto B a $V_B = ${Q(sc)(VB, 'V', true)}$. Quanto vale la tensione $V_{AB}$?`, sol: { sym: 'V_{AB}', u: 'V', v, steps: [{ f: 'V_{AB} = V_A - V_B', s: `V_{AB} = ${Q(sc)(VA, 'V', true)} - ${Q(sc)(VB, 'V', true)} = ${Q(sc)(v, 'V')}`, v, u: 'V' }], mistakes: [{ id: 'segno', v: VB - VA }, { id: 'segno', v: VA + VB }] } };
  });
  // nodi, rami, maglie di una rete a scala
  G('schema.nodi', { topic: 'u6', kind: 'conta', uses: ['kir.nodo', 'kir.ramo', 'kir.maglia'] }, (sc, r) => {
    const spec = r() < 0.5 ? mixedSpec(r, Object.assign({}, sc, { prefixes: ['', 'k'] }), 1) : { cols: [[{ id: 'E1', t: 'V', v: 12 }, { id: 'R1', t: 'R', v: 1000 }], [{ id: 'R3', t: 'R', v: 2200 }], [{ id: 'E2', t: 'V', v: 6 }, { id: 'R2', t: 'R', v: 3300 }]], top: [[], []] };
    if (spec.cols[0][0].t === 'V' && spec.cols[0].length === 1) spec.cols[0] = [{ id: 'V1', t: 'V', label: '' }];
    const { nodes, branches: realBranches, meshes } = topology(spec);
    const what = pick(r, ['nodi', 'rami', 'maglie']);
    const v = what === 'nodi' ? nodes : what === 'rami' ? realBranches : meshes;
    return { text: `Quanti ${what}${what === 'maglie' ? ' indipendenti' : ''} ha questa rete? (Un nodo è un punto in cui si incontrano almeno tre conduttori.)`, schema: { ladder: spec }, sol: { sym: what, u: '', v, steps: [{ f: what === 'maglie' ? 'm = r - n + 1' : `"${what}"`, s: what === 'maglie' ? `m = ${realBranches} - ${nodes} + 1 = ${meshes}` : `"${what}:" ${v}`, v, u: '' }], mistakes: [{ id: 'nodi-punti', v: v + 1 }, { id: 'nodi-punti', v: Math.max(0, v - 1) }], tol: 0, abs: 0.1 } };
  });
  // nodi veri (almeno tre conduttori), rami (tratti fra due nodi veri: somma dei gradi diviso 2), maglie indipendenti r − n + 1
  function topology(spec) {
    const deg = CI.toNetlist(spec).degree;
    const real = Object.values(deg).filter((d) => d >= 3);
    if (!real.length) return { nodes: 0, branches: 1, meshes: 1 };
    const branches = real.reduce((a, b) => a + b, 0) / 2;
    return { nodes: real.length, branches, meshes: branches - real.length + 1 };
  }
  // due maglie con il metodo delle correnti di maglia (regola di Cramer)
  G('maglie.due', { topic: 'u6', levels: [3], uses: ['f.kvl', 'm.sist2', 'q.I'] }, (sc, r) => tryN(80, () => {
    const E1 = pick(r, [6, 9, 12, 15, 24]), E2 = pick(r, [3, 5, 6, 9, 12]);
    const R1 = resistor(r, sc, 100, 4700), R2 = resistor(r, sc, 100, 4700), R3 = resistor(r, sc, 100, 4700);
    const spec = { cols: [[{ id: 'E1', t: 'V', v: E1 }, { id: 'R1', t: 'R', v: R1 }], [{ id: 'R3', t: 'R', v: R3 }], [{ id: 'E2', t: 'V', v: E2 }, { id: 'R2', t: 'R', v: R2 }]], top: [[], []], names: { T1: 'A' } };
    if (!specPowerOK(spec)) return null;
    const sol = twoMesh({ E1, E2, R1, R2, R3 }, sc);
    if (!distinct(sol) || Math.abs(sol.v) < 1e-5) return null;
    return { text: `Con il metodo delle correnti di maglia (versi orari) calcola la corrente nel ramo centrale $R_3$, dall’alto verso il basso.`, schema: { ladder: spec, opts: { currents: [{ el: 'R3', label: 'I_3' }] } }, sol };
  }));
  function twoMesh(p, sc) {
    const q = Q(sc);
    // maglia a (sinistra) e b (destra), versi orari; E1 a sinistra con il + in alto, E2 a destra con il + in alto
    const a11 = p.R1 + p.R3, a12 = -p.R3, a22 = p.R2 + p.R3, b1 = p.E1, b2 = -p.E2;
    const det = a11 * a22 - a12 * a12;
    const Ia = (b1 * a22 - a12 * b2) / det, Ib = (a11 * b2 - a12 * b1) / det;
    const I3 = Ia - Ib;
    const steps = [
      { f: '(R_1 + R_3) * I_a - R_3 * I_b = E_1', s: `${q(a11, 'Ω')} * I_a - ${q(p.R3, 'Ω')} * I_b = ${q(b1, 'V')}`, v: null, u: '' },
      { f: '-R_3 * I_a + (R_2 + R_3) * I_b = -E_2', s: `-${q(p.R3, 'Ω')} * I_a + ${q(a22, 'Ω')} * I_b = ${q(b2, 'V', true)}`, v: null, u: '' },
      { f: 'Delta = (R_1 + R_3) * (R_2 + R_3) - R_3^2', s: `Delta = ${q(a11, 'Ω')} * ${q(a22, 'Ω')} - (${q(p.R3, 'Ω')})^2 = \`${U.num(det / 1e6, { sig: 4 })} kΩ²\``, v: det, u: 'Ω²' },
      { f: 'I_a = {E_1 * (R_2 + R_3) - R_3 * E_2}/Delta', s: `I_a = ${q(Ia, 'A')}`, v: Ia, u: 'A' },
      { f: 'I_b = {-(R_1 + R_3) * E_2 + R_3 * E_1}/Delta', s: `I_b = ${q(Ib, 'A', true)}`, v: Ib, u: 'A' },
      { f: 'I_3 = I_a - I_b', s: `I_3 = ${q(Ia, 'A', true)} - ${q(Ib, 'A', true)} = ${q(I3, 'A')}`, v: I3, u: 'A' },
    ];
    return { sym: 'I_3', u: 'A', v: I3, steps, mistakes: [{ id: 'segno', v: Ia + Ib }, { id: 'segno', v: -I3 }, { id: 'segno', v: (b1 * a22 + a12 * b2) / det - (a11 * b2 + a12 * b1) / det }] };
  }
  // trova il guasto: un componente interrotto o in corto, misure ai nodi
  G('guasto', { topic: 'u6', kind: 'guasto', levels: [2, 3], uses: ['q.potenziale', 'c.VM', 'f.ohm', 'f.part'] }, (sc, r) => tryN(60, () => {
    const val = () => R_E12(r, 1000, 22000);
    const spec = { cols: [[{ id: 'V1', t: 'V', v: 12 }], [{ id: 'R2', t: 'R', v: val() }], [{ id: 'R4', t: 'R', v: val() }]], top: [[{ id: 'R1', t: 'R', v: val() }], [{ id: 'R3', t: 'R', v: val() }]], names: { T1: 'A', T2: 'B' } };
    const comps = ['R1', 'R2', 'R3', 'R4'];
    const measure = (fault) => {
      const net = CI.toNetlist(spec);
      if (fault) net.elements = net.elements.map((e) => (e.id === fault.id ? Object.assign({}, e, { t: fault.kind === 'aperto' ? 'OPEN' : 'W' }) : e));
      const res = MNA.solve(net);
      return ['A', 'B'].map((n) => res.V(n));
    };
    const faults = [];
    for (const id of comps) for (const kind of ['aperto', 'corto']) faults.push({ id, kind });
    const sigs = faults.map((f) => ({ f, m: measure(f) }));
    const f = pick(r, faults);
    const m = measure(f);
    // il guasto deve essere l'unico compatibile con le misure (entro 0,05 V)
    const same = sigs.filter((x) => x.m.every((v, i) => Math.abs(v - m[i]) < 0.05));
    if (same.length !== 1) return null;
    const normal = measure(null);
    // il guasto deve vedersi: almeno un nodo cambia di mezzo volt
    if (m.every((v, i) => Math.abs(v - normal[i]) < 0.5)) return null;
    const right = `${f.id} ${f.kind === 'aperto' ? 'interrotto' : 'in corto'}`;
    const opts = faults.map((x) => `${x.id} ${x.kind === 'aperto' ? 'interrotto' : 'in corto'}`);
    const fmtV = (v) => U.fmt(Math.abs(v) < 1e-9 ? 0 : v, 'V', { sig: 3 });
    return { text: `Il circuito funzionante avrebbe $V_A = ${MA.q(normal[0], 'V')}$ e $V_B = ${MA.q(normal[1], 'V')}$. Con il voltmetro (verso massa) misuri invece $V_A = ${MA.q(m[0], 'V')}$ e $V_B = ${MA.q(m[1], 'V')}$. Quale componente è guasto?`, schema: { ladder: spec, opts: { nodes: { A: fmtV(m[0]), B: fmtV(m[1]) } } }, choices: shuffle(r, opts.filter((x) => x !== right)).slice(0, 5).concat([right]).filter((x, i, a) => a.indexOf(x) === i).map((x) => ({ label: x, right: x === right, mistake: x === right ? null : 'guasto' })).sort((a, b) => a.label.localeCompare(b.label)), sol: { sym: 'guasto', u: '', v: 0, steps: [{ f: '"misure contro valori attesi"', s: `"${right}: ${explainFault(f, spec)}"`, v: null, u: '' }], mistakes: [] } };
  }));
  function explainFault(f, spec) {
    if (f.kind === 'aperto') return f.id === 'R1' ? 'non arriva corrente al resto del circuito, quindi A e B sono a 0 V' : f.id === 'R2' ? 'tutta la corrente passa nel ramo di destra: A sale' : f.id === 'R3' ? 'nel ramo di destra non passa corrente: B va a 0 V e A sale' : 'R3 non porta corrente, quindi B è allo stesso potenziale di A';
    return f.id === 'R1' ? 'A è collegato direttamente al generatore: V_A = 12 V' : f.id === 'R2' ? 'A è collegato a massa: A e B a 0 V' : f.id === 'R3' ? 'A e B sono allo stesso potenziale' : 'B è collegato a massa: V_B = 0 V';
  }
  function shuffle(r, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ======================= Unità 7: metodi di analisi ======================= */
  function twoSource(r, sc) {
    const E1 = pick(r, [6, 9, 12, 15]), E2 = pick(r, [3, 5, 6, 9]);
    return { cols: [[{ id: 'E1', t: 'V', v: E1 }, { id: 'R1', t: 'R', v: resistor(r, sc, 100, 4700) }], [{ id: 'R3', t: 'R', v: resistor(r, sc, 100, 4700) }], [{ id: 'E2', t: 'V', v: E2 }, { id: 'R2', t: 'R', v: resistor(r, sc, 100, 4700) }]], top: [[], []], names: { T1: 'A' } };
  }
  G('sovrapposizione.I', { topic: 'u7', levels: [3], uses: ['f.sovr', 'f.serie', 'f.par', 'f.partI'] }, (sc, r) => tryN(60, () => {
    const spec = twoSource(r, sc);
    if (!specPowerOK(spec)) return null;
    const sol = S.superposition({ spec, target: 'R3' }, sc);
    if (!distinct(sol) || Math.abs(sol.v) < 1e-5) return null;
    return { text: 'Con la sovrapposizione degli effetti calcola la corrente nel resistore $R_3$, dall’alto verso il basso: prima con il solo $E_1$ (e $E_2$ in corto), poi con il solo $E_2$, e somma.', schema: { ladder: spec, opts: { currents: [{ el: 'R3', label: 'I_3' }] } }, sol };
  }));
  function theveninSpec(r, sc, withR3) {
    return { cols: [[{ id: 'V1', t: 'V', v: voltage(r, sc) }], [{ id: 'R2', t: 'R', v: resistor(r, sc, 470, 22000) }], [{ id: 'AB', t: 'OPEN' }]], top: [[{ id: 'R1', t: 'R', v: resistor(r, sc, 470, 22000) }], withR3 ? [{ id: 'R3', t: 'R', v: resistor(r, sc, 470, 22000) }] : []] };
  }
  G('thevenin.Vth', { topic: 'u7', levels: [2], uses: ['f.th', 'f.part'] }, (sc, r) => tryN(40, () => {
    const spec = theveninSpec(r, sc, r() < 0.5);
    const sol = S.thevenin({ spec, port: 2, find: 'Vth' }, sc);
    if (!distinct(sol)) return null;
    return { text: 'Quanto vale la tensione di Thevenin $V_{th}$ fra i morsetti A e B?', schema: { ladder: spec }, sol };
  }));
  G('thevenin.Rth', { topic: 'u7', levels: [2], uses: ['f.th', 'f.serie', 'f.par'] }, (sc, r) => tryN(40, () => {
    const spec = theveninSpec(r, sc, r() < 0.6);
    const sol = S.thevenin({ spec, port: 2, find: 'Rth' }, sc);
    if (!distinct(sol)) return null;
    return { text: 'Quanto vale la resistenza di Thevenin $R_{th}$ vista dai morsetti A e B?', schema: { ladder: spec }, sol };
  }));
  G('thevenin.IL', { topic: 'u7', levels: [3], uses: ['f.th', 'f.serie', 'f.par', 'f.part', 'f.ohm'] }, (sc, r) => tryN(60, () => {
    const spec = theveninSpec(r, sc, true);
    const RL = resistor(r, sc, 470, 22000);
    const find = pick(r, ['IL', 'VL']);
    const withLoad = Object.assign({}, spec, { cols: spec.cols.slice(0, 2).concat([[{ id: 'RL', t: 'R', v: RL }]]) });
    if (!specPowerOK(withLoad)) return null;
    const sol = S.thevenin({ spec: withLoad, port: 2, RL, find }, sc);
    if (!distinct(sol)) return null;
    return { text: `Con il teorema di Thevenin calcola ${find === 'IL' ? 'la corrente' : 'la tensione'} nel carico $R_L = ${Q(sc)(RL, 'Ω')}$.`, schema: { ladder: withLoad, opts: { highlight: ['RL'] } }, sol };
  }));
  G('norton.IN', { topic: 'u7', levels: [2], uses: ['f.no', 'f.th'] }, (sc, r) => tryN(40, () => {
    const spec = theveninSpec(r, sc, r() < 0.5);
    const sol = S.norton({ spec, port: 2 }, sc);
    if (!distinct(sol)) return null;
    return { text: 'Quanto vale la corrente di Norton $I_N$ (la corrente di cortocircuito fra A e B)?', schema: { ladder: spec }, sol };
  }));
  G('millman.VAB', { topic: 'u7', levels: [2], uses: ['f.mil'] }, (sc, r) => tryN(40, () => {
    const spec = twoSource(r, sc);
    if (!specPowerOK(spec)) return null;
    const b = spec.cols.map((c) => { const E = c.find((x) => x.t === 'V'); const R = c.find((x) => x.t === 'R'); return { E: E ? E.v : 0, R: R.v }; });
    const sol = S.millman({ branches: b }, sc);
    if (!distinct(sol)) return null;
    return { text: 'Con il teorema di Millman calcola la tensione $V_{AB}$ fra il nodo in alto (A) e quello in basso (B).', schema: { ladder: spec }, sol };
  }));
  G('pmax', { topic: 'u7', uses: ['f.pmax', 'f.th'] }, (sc, r) => tryN(40, () => {
    const Vth = voltage(r, sc), Rth = resistor(r, sc, 47, 4700);
    const sol = S.maxPower({ Vth, Rth }, sc);
    if (!distinct(sol) || sol.v > 5) return null;
    return { text: `Un generatore equivalente ha $V_{th} = ${Q(sc)(Vth, 'V')}$ e $R_{th} = ${Q(sc)(Rth, 'Ω')}$. Qual è la potenza massima che può cedere a un carico?`, sol };
  }));

  /* ======================= Unità 8: condensatori e induttori ======================= */
  const CAP = (r) => pick(r, [1e-9, 2.2e-9, 4.7e-9, 10e-9, 22e-9, 47e-9, 100e-9, 220e-9, 470e-9, 1e-6, 2.2e-6, 4.7e-6, 10e-6, 22e-6, 47e-6, 100e-6, 220e-6, 470e-6]);
  G('cond.Q', { topic: 'u8', uses: ['q.C', 'f.QCV'] }, (sc, r) => {
    const C = CAP(r), V = voltage(r, sc);
    const find = pick(r, ['Q', 'C']);
    const sol = find === 'Q' ? S.capCharge({ find: 'Q', C, V }, sc) : S.capCharge({ find: 'C', Q: C * V, V }, sc);
    return { text: find === 'Q' ? `Un condensatore da $C = ${Q(sc)(C, 'F')}$ è caricato a $V = ${Q(sc)(V, 'V')}$. Quanta carica accumula?` : `Un condensatore caricato a $V = ${Q(sc)(V, 'V')}$ accumula $Q = ${Q(sc)(C * V, 'C')}$. Quanto vale la capacità?`, sol };
  });
  G('cond.codice', { topic: 'u8', uses: ['q.C', 'c.codiceC'] }, (sc, r) => {
    const code = pick(r, ['104', '103', '102', '473', '223', '474', '105', '101', '222', '471', '332', '681']);
    const v = (+code.slice(0, 2)) * 10 ** (+code[2]) * 1e-12;
    return { text: `Su un condensatore ceramico c’è stampato «${code}». Quanto vale la capacità? (Le prime due cifre e il numero di zeri, in picofarad.)`, sol: { sym: 'C', u: 'F', v, steps: [{ f: '"cifre, zeri, in pF"', s: `"${code}" → ${code.slice(0, 2)} * 10^{${code[2]}} "pF" = ${MA.q(v, 'F')}`, v, u: 'F' }], mistakes: [{ id: 'prefisso', v: v * 1000 }, { id: 'prefisso', v: v / 1000 }, { id: 'codice-cifre', v: (+code) * 1e-12 }] } };
  });
  G('cond.serieparallelo', { topic: 'u8', uses: ['q.C', 'f.Cpar', 'f.Cser'] }, (sc, r) => {
    const n = pick(r, [2, 2, 3]), conn = pick(r, ['par', 'ser']);
    const C = Array.from({ length: n }, () => CAP(r));
    const sol = S.capacitors({ C, conn }, sc);
    if (!distinct(sol)) return null;
    return { text: `Quanto vale la capacità equivalente di ${n} condensatori in ${conn === 'par' ? 'parallelo' : 'serie'} da ${C.map((x) => '$' + Q(sc)(x, 'F') + '$').join(', ')}?`, sol };
  });
  G('cond.energia', { topic: 'u8', uses: ['q.C', 'q.W', 'f.WC'] }, (sc, r) => {
    const C = CAP(r), V = voltage(r, sc);
    const sol = S.capEnergy({ C, V }, sc);
    return { text: `Quanta energia è immagazzinata in un condensatore da $C = ${Q(sc)(C, 'F')}$ caricato a $V = ${Q(sc)(V, 'V')}$?`, sol };
  });
  G('ind.vL', { topic: 'u8', uses: ['q.L', 'f.vL'] }, (sc, r) => {
    const L = pick(r, [1e-3, 4.7e-3, 10e-3, 47e-3, 100e-3]), dI = pick(r, [0.1, 0.2, 0.5, 1]), dt = pick(r, [1e-3, 2e-3, 5e-3, 10e-3, 100e-6]);
    const sol = S.indVoltage({ L, dI, dt }, sc);
    if (sol.v > 100) return null;
    return { text: `La corrente in un induttore da $L = ${Q(sc)(L, 'H')}$ aumenta di $Delta I = ${Q(sc)(dI, 'A')}$ in $Delta t = ${Q(sc)(dt, 's')}$, in modo uniforme. Quanto vale la tensione ai suoi capi?`, sol };
  });
  G('ind.energia', { topic: 'u8', uses: ['q.L', 'q.W', 'f.WL'] }, (sc, r) => {
    const L = pick(r, [1e-3, 10e-3, 47e-3, 100e-3, 0.5]), I = pick(r, [0.1, 0.2, 0.5, 1, 2]);
    const sol = S.indEnergy({ L, I }, sc);
    return { text: `Quanta energia è immagazzinata in un induttore da $L = ${Q(sc)(L, 'H')}$ attraversato da $I = ${Q(sc)(I, 'A')}$?`, sol };
  });

  /* ======================= Unità 9: transitori ======================= */
  const TR = root.ElekTransient || require('./transient.js');
  G('tau.RC', { topic: 'u9', uses: ['f.tau', 'q.tau'] }, (sc, r) => {
    const R = R_E12(r, 1000, 1e6), C = CAP(r);
    const sol = TR.tauRC({ R, C }, sc);
    if (sol.v < 1e-6 || sol.v > 100) return null;
    return { text: `Quanto vale la costante di tempo di un circuito con $R = ${Q(sc)(R, 'Ω')}$ e $C = ${Q(sc)(C, 'F')}$?`, sol };
  });
  G('tau.cinque', { topic: 'u9', uses: ['f.tau', 'q.tau', 'f.5tau'] }, (sc, r) => {
    const R = R_E12(r, 1000, 1e6), C = CAP(r);
    const sol = TR.settle({ R, C }, sc);
    if (sol.v < 1e-6 || sol.v > 500) return null;
    return { text: `Dopo quanto tempo, in pratica, il condensatore da $C = ${Q(sc)(C, 'F')}$ si carica del tutto attraverso $R = ${Q(sc)(R, 'Ω')}$? (Usa la regola delle 5τ.)`, sol };
  });
  G('carica.vC', { topic: 'u9', levels: [2], uses: ['f.tau', 'f.carica', 'm.exp'] }, (sc, r) => {
    const R = R_E12(r, 1000, 100000), C = pick(r, [1e-6, 10e-6, 100e-6]), E = voltage(r, sc);
    const tau = R * C, t = tau * pick(r, [0.5, 1, 1.5, 2, 3]);
    const sol = TR.rc({ R, C, E, t, mode: 'carica', find: 'v' }, sc);
    return { text: `Il condensatore $C = ${Q(sc)(C, 'F')}$, scarico, si carica attraverso $R = ${Q(sc)(R, 'Ω')}$ da un generatore $E = ${Q(sc)(E, 'V')}$. Quanto vale la sua tensione dopo $t = ${Q(sc)(t, 's')}$?`, schema: { ladder: { cols: [[{ id: 'E', t: 'V', v: E }], [{ id: 'C1', t: 'C', v: C }]], top: [[{ id: 'SW1', t: 'SW', closed: true }, { id: 'R1', t: 'R', v: R }]] }, opts: { voltages: [{ el: 'C1', label: 'v_C' }] } }, sol };
  });
  G('scarica.vC', { topic: 'u9', levels: [2], uses: ['f.tau', 'f.scarica', 'm.exp'] }, (sc, r) => {
    const R = R_E12(r, 1000, 100000), C = pick(r, [1e-6, 10e-6, 100e-6]), V0 = voltage(r, sc);
    const tau = R * C, t = tau * pick(r, [0.5, 1, 2, 3]);
    const sol = TR.rc({ R, C, V0, t, mode: 'scarica', find: 'v' }, sc);
    return { text: `Un condensatore $C = ${Q(sc)(C, 'F')}$ carico a $V_0 = ${Q(sc)(V0, 'V')}$ si scarica su $R = ${Q(sc)(R, 'Ω')}$. Quanto vale la sua tensione dopo $t = ${Q(sc)(t, 's')}$?`, sol };
  });
  G('carica.tempo', { topic: 'u9', levels: [3], uses: ['f.tau', 'f.carica', 'm.exp', 'm.log'] }, (sc, r) => {
    const R = R_E12(r, 1000, 100000), C = pick(r, [1e-6, 10e-6, 100e-6]), E = 10, vx = pick(r, [3, 5, 6, 8, 9]);
    const sol = TR.rc({ R, C, E, vx, mode: 'carica', find: 't' }, sc);
    return { text: `Il condensatore $C = ${Q(sc)(C, 'F')}$, scarico, si carica attraverso $R = ${Q(sc)(R, 'Ω')}$ da $E = ${Q(sc)(E, 'V')}$. Dopo quanto tempo raggiunge $${Q(sc)(vx, 'V')}$?`, sol };
  });
  G('rl.i', { topic: 'u9', levels: [2], uses: ['f.tau', 'f.rl', 'm.exp'] }, (sc, r) => {
    const R = pick(r, [10, 22, 47, 100, 220]), L = pick(r, [10e-3, 47e-3, 100e-3, 0.5]), E = voltage(r, sc);
    const tau = L / R, t = tau * pick(r, [0.5, 1, 2, 3]);
    if (E / R > 1) return null;
    const sol = TR.rl({ R, L, E, t, mode: 'carica', find: 'i' }, sc);
    return { text: `Si chiude l’interruttore di un circuito con $E = ${Q(sc)(E, 'V')}$, $R = ${Q(sc)(R, 'Ω')}$ e $L = ${Q(sc)(L, 'H')}$. Quanto vale la corrente dopo $t = ${Q(sc)(t, 's')}$?`, sol };
  });

  /* ======================= Domande della lezione ======================= */
  // le domande di teoria scritte nella lezione (sc.bank): [domanda, giusta, sbagliata, sbagliata…]
  G('domande', { topic: '*', kind: 'scelta', uses: [] }, (sc, r) => {
    const bank = sc.bank || [];
    if (!bank.length) return null;
    const used = sc.usedBank || new Set();
    const fresh = bank.filter((q) => !used.has(q[0]));
    const q = pick(r, fresh.length ? fresh : bank);
    used.add(q[0]);
    const [text, right, ...wrong] = q;
    return { text, choices: shuffle(r, [right].concat(wrong)).map((x) => ({ label: x, right: x === right, mistake: null })), sol: { sym: 'domanda', u: '', v: 0, steps: [{ f: '"risposta"', s: '"' + right.replace(/"/g, '') + '"', v: null, u: '' }], mistakes: [] } };
  });

  /* ---------- Accesso ---------- */
  // costruisce un problema: restituisce null se il generatore non riesce a stare nel perimetro
  // quantità scritte nel testo e nelle opzioni: «`4,7 kΩ`»
  const QTY = /`([−-]?[\d\u202F ]+(?:,\d+)?)[\u00A0 ]([pnµmkMG]?)(Ω|V|A|W|F|H|Hz|s|C|J|Wh|VA|var)`/g;
  // il problema rispetta il perimetro: prefissi ammessi, dati interi o con una cifra decimale, risultato «facile» se richiesto
  function fits(p, sc) {
    const txt = p.text + ' ' + (p.choices || []).map((c) => c.label || '').join(' ');
    for (const m of txt.matchAll(QTY)) {
      if (sc.prefixes && !sc.prefixes.includes(m[2])) return false;
      const dec = (m[1].split(',')[1] || '').length;
      if (sc.num === 'int' && dec > 0) return false;
      if ((sc.num === 'dec1' || sc.num === 'dati1') && dec > 1) return false;
    }
    const k = p.kind || 'calc';
    if ((sc.num === 'int' || sc.num === 'dec1') && k === 'calc' && typeof p.sol.v === 'number' && p.sol.u && !exact(p.sol.v, p.sol.u, sc)) return false;
    return true;
  }
  function make(id, sc, r) {
    const g = REG.get(id);
    if (!g) throw new Error('generatore sconosciuto ' + id);
    let p = null;
    for (let k = 0; k < 30 && !p; k++) { const x = g.fn(sc, r); if (x && fits(Object.assign({ kind: g.kind }, x), sc)) p = x; }
    if (!p) return null;
    if (p.sol && typeof p.sol.v === 'number' && Array.isArray(p.sol.mistakes)) p.sol.mistakes = p.sol.mistakes.filter((m) => !isFinite(m.v) || !(p.sol.v === 0 ? Math.abs(m.v) < 1e-12 : U.within(m.v, p.sol.v, 0.03)));
    const uses = g.uses.slice();
    if (hasPrefix(sc) && /\d[\u00A0 ][pnµmkMG](Ω|V|A|W|F|H|Hz|s|C|J)(?![A-Za-z])/.test(p.text)) uses.push('m.prefissi');
    return Object.assign({ gen: id, topic: g.topic, kind: g.kind, uses, level: sc.level || 1 }, p);
  }
  const list = () => [...REG.values()];
  const byTopic = (t) => list().filter((g) => g.topic === t);
  const api = { fits, QTY, topology, G, REG, make, list, byTopic, exact, okAll, pick, shuffle, loop, mixedSpec, twoSource, theveninSpec, twoMesh, maxResistorPower, CAP, RANGES, PREF_CASES };
  root.ElekProblems = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
