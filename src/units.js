/* ELEKTRON — numeri e unità.
   - Scrittura secondo il SI: virgola decimale, spazio non separabile fra numero e unità (4,7 kΩ), segno meno vero (−),
     cifre raggruppate a tre con uno spazio sottile da cinque cifre in su (12 000).
   - Lettura delle risposte: virgola o punto, prefissi, notazione scientifica e scritture dei tecnici
     (4,7 k · 4700 · 4,7e3 · 4,7·10^3 · 4k7 · 4R7 · R47 · 2M2), con l'unità facoltativa.
   - Serie E12 ed E24, codice colori dei resistori a 4 e 5 bande.
   Nessun accesso al DOM: si usa anche nei test. */
(function (root) {
  'use strict';
  const NB = ' ';       // spazio non separabile fra numero e unità
  const THIN = ' ';     // spazio sottile non separabile fra i gruppi di cifre
  const MINUS = '−';

  /* ---------- Prefissi ---------- */
  const PREFIX = { p: -12, n: -9, 'µ': -6, m: -3, '': 0, k: 3, M: 6, G: 9 };
  const PREFIX_NAME = { p: 'pico', n: 'nano', 'µ': 'micro', m: 'milli', '': '', k: 'chilo', M: 'mega', G: 'giga' };
  const PREFIX_ORDER = ['p', 'n', 'µ', 'm', '', 'k', 'M', 'G'];

  /* ---------- Unità ---------- */
  // simbolo canonico → nome della grandezza tipica e varianti accettate nella scrittura
  const UNITS = {
    'Ω': { name: 'ohm', q: 'resistenza', alias: ['ohm', 'ohms', 'Ohm', 'OHM', 'Ω'] },
    V: { name: 'volt', q: 'tensione', alias: ['v', 'volt'] },
    A: { name: 'ampere', q: 'corrente', alias: ['a', 'ampere'] },
    W: { name: 'watt', q: 'potenza', alias: ['w', 'watt'] },
    J: { name: 'joule', q: 'energia', alias: ['j', 'joule'] },
    Wh: { name: 'wattora', q: 'energia', alias: ['wh', 'WH'] },
    C: { name: 'coulomb', q: 'carica', alias: ['coulomb'] },
    F: { name: 'farad', q: 'capacità', alias: ['farad'] },
    H: { name: 'henry', q: 'induttanza', alias: ['henry'] },
    Hz: { name: 'hertz', q: 'frequenza', alias: ['hz', 'HZ', 'hertz'] },
    s: { name: 'secondo', q: 'tempo', alias: ['sec'] },
    h: { name: 'ora', q: 'tempo', alias: ['ore', 'ora'] },
    S: { name: 'siemens', q: 'conduttanza', alias: ['siemens'] },
    VA: { name: 'voltampere', q: 'potenza apparente', alias: ['va'] },
    var: { name: 'volt-ampere reattivo', q: 'potenza reattiva', alias: ['VAr', 'VAR', 'Var', 'VAR'] },
    'rad/s': { name: 'radianti al secondo', q: 'pulsazione', alias: ['rad/sec'] },
    rad: { name: 'radiante', q: 'angolo', alias: [] },
    '°': { name: 'grado', q: 'angolo', alias: ['gradi', 'deg'] },
    '°C': { name: 'grado Celsius', q: 'temperatura', alias: ['°c', 'C°'] },
    dB: { name: 'decibel', q: 'guadagno', alias: ['db', 'DB'] },
    '%': { name: 'per cento', q: 'percentuale', alias: [] },
    'Ω·m': { name: 'ohm per metro', q: 'resistività', alias: ['ohm*m', 'Ωm', 'ohm·m', 'Ω*m'] },
    'V/°C': { name: 'volt per grado Celsius', q: 'sensibilità', alias: ['V/C'] },
    bit: { name: 'bit', q: 'numero di bit', alias: ['bits'] },
    'V/µs': { name: 'volt al microsecondo', q: 'slew rate', alias: ['V/us'] },
  };
  const ALIAS = new Map();
  for (const [sym, u] of Object.entries(UNITS)) { ALIAS.set(sym, sym); for (const a of u.alias) ALIAS.set(a, sym); }
  // unità che non prendono prefissi (o che li prendono solo in casi che a scuola non servono)
  const NO_PREFIX = new Set(['°', '°C', '%', 'dB', 'rad', 'rad/s', 'bit', 'Ω·m', 'V/°C', 'V/µs', 'h']);
  // unità che a scuola si scrivono solo con i sottomultipli (niente «ks», «kF», «kH»)
  const ONLY_SUB = new Set(['s', 'F', 'H']);

  /* ---------- Scrittura ---------- */
  // arrotonda a sig cifre significative restituendo [mantissa intera, esponente]: x ≈ m·10^e
  function roundSig(x, sig) {
    if (x === 0 || !isFinite(x)) return x;
    const e = Math.floor(Math.log10(Math.abs(x)));
    const f = 10 ** (sig - 1 - e);
    return Math.round(x * f) / f;
  }
  // cifre decimali che servono per mostrare x con sig cifre significative
  function decimalsFor(x, sig) {
    if (x === 0) return 0;
    const e = Math.floor(Math.log10(Math.abs(x)));
    return Math.max(0, sig - 1 - e);
  }
  function groupInt(s) {
    // dalle cinque cifre in su: gruppi di tre separati da uno spazio sottile
    if (s.length < 5) return s;
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  }
  /* numero scritto all'italiana. o.sig: cifre significative (predefinito 3); o.dec: cifre decimali fisse;
     o.keepZeros: non togliere gli zeri finali (per i valori letti sugli strumenti) */
  function num(x, o = {}) {
    if (x == null || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : MINUS + '∞';
    const sig = o.sig ?? 3;
    let v = o.dec != null ? Math.round(x * 10 ** o.dec) / 10 ** o.dec : roundSig(x, sig);
    if (Object.is(v, -0) || Math.abs(v) < 1e-15) v = 0;
    let dec = o.dec != null ? o.dec : decimalsFor(v, sig);
    // gli errori di virgola mobile non devono produrre code come 0,30000000004
    let s = Math.abs(v).toFixed(Math.min(dec, 15));
    if (!o.keepZeros && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    const [ip, fp] = s.split('.');
    return (v < 0 ? MINUS : '') + groupInt(ip) + (fp ? ',' + fp : '');
  }
  // sceglie il prefisso: o.prefixes elenca quelli ammessi dal perimetro della lezione (predefiniti: tutti)
  function pickPrefix(v, unit, o = {}) {
    if (NO_PREFIX.has(unit) || o.prefix === 'none') return '';
    if (o.prefix != null && o.prefix !== 'auto') return o.prefix;
    if (v === 0) return '';
    const allowed = (o.prefixes || PREFIX_ORDER).filter((p) => !(ONLY_SUB.has(unit) && PREFIX[p] > 0)).sort((a, b) => PREFIX[a] - PREFIX[b]);
    if (!allowed.includes('')) allowed.push('');
    const sig = o.sig ?? 3;
    const a = Math.abs(roundSig(v, sig));
    // il prefisso più grande per cui la mantissa resta almeno 1
    let best = allowed.slice().sort((p, q) => PREFIX[p] - PREFIX[q])[0];
    for (const p of allowed.slice().sort((x, y) => PREFIX[x] - PREFIX[y])) if (a / 10 ** PREFIX[p] >= 1 - 1e-12) best = p;
    // come nei libri di testo: un valore fra 0,1 e 1 dell’unità, con al massimo due cifre significative, si scrive senza il milli
    // (0,7 V, 0,5 A, 0,25 W), mentre 126 mW e 12,5 mA restano così
    const up = allowed.filter((p) => PREFIX[p] > PREFIX[best]).sort((x, y) => PREFIX[x] - PREFIX[y])[0];
    if (up === '' && best === 'm') {
      const m2 = a / 10 ** PREFIX[up];
      const digits = String(roundSig(a, sig)).replace(/^0\.0*|\.|e.*$/g, '').replace(/0+$/, '').length;
      if (m2 >= 0.1 - 1e-12 && digits <= 2) best = up;
    }
    return best;
  }
  // valore con unità: fmt(4700, 'Ω') → «4,7 kΩ»; fmt(0.0125, 'A', { prefixes: ['', 'm'] }) → «12,5 mA»
  function fmt(v, unit = '', o = {}) {
    if (v == null || Number.isNaN(v)) return '—';
    const p = unit ? pickPrefix(v, unit, o) : (o.prefix && o.prefix !== 'auto' && o.prefix !== 'none' ? o.prefix : '');
    const m = v / 10 ** PREFIX[p];
    const n = num(m, o);
    if (!unit && !p) return n;
    // l'angolo in gradi si scrive attaccato al numero (57,9°); tutte le altre unità, °C compreso, con lo spazio
    return n + (unit === '°' ? '' : NB) + p + unit;
  }
  // notazione scientifica: 4,7 · 10³ (come testo; la versione con MathML la produce math.js)
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function sci(v, o = {}) {
    if (v === 0) return '0';
    const sig = o.sig ?? 3;
    let e = Math.floor(Math.log10(Math.abs(v)));
    if (o.eng) e = Math.floor(e / 3) * 3;
    let m = roundSig(v / 10 ** e, sig);
    if (Math.abs(m) >= (o.eng ? 1000 : 10)) { e += o.eng ? 3 : 1; m = roundSig(v / 10 ** e, sig); }
    const exp = String(e).split('').map((c) => SUP[c]).join('');
    return num(m, { sig }) + ' · 10' + exp;
  }

  /* ---------- Lettura delle risposte ---------- */
  const PREF_CHARS = { p: 'p', n: 'n', u: 'µ', 'µ': 'µ', 'μ': 'µ', m: 'm', k: 'k', K: 'k', M: 'M', G: 'G' };
  function normalizeInput(s) {
    return String(s)
      .replace(/[−–—]/g, '-')
      .replace(/Ω/g, 'Ω')              // segno di ohm → omega
      .replace(/μ/g, 'µ')
      .replace(/[   ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // unità scritta dopo il numero: restituisce { prefix, unit } oppure null
  function readUnit(s) {
    s = s.trim();
    if (!s) return { prefix: '', unit: null };
    if (ALIAS.has(s)) return { prefix: '', unit: ALIAS.get(s) };
    // prima il prefisso esatto (m e M sono diversi), poi l'unità; alcune unità si accettano anche in minuscolo
    const first = s[0];
    if (PREF_CHARS[first] && s.length > 1) {
      const rest = s.slice(1);
      const u = ALIAS.get(rest);
      if (u && !NO_PREFIX.has(u)) return { prefix: PREF_CHARS[first], unit: u };
    }
    // solo il prefisso: «4,7 k», «12 m» (milli: la M maiuscola è mega)
    if (s.length === 1 && PREF_CHARS[s]) return { prefix: PREF_CHARS[s], unit: null };
    return null;
  }
  /* legge una risposta numerica. Restituisce { ok:true, value, unit, prefix } (value nell'unità base)
     oppure { ok:false, err, msg } con un messaggio chiaro. */
  function parse(input) {
    const s = normalizeInput(input);
    if (!s) return { ok: false, err: 'vuoto', msg: 'Scrivi il risultato.' };
    // scritture dei tecnici: 4k7, 2M2, 4R7, R47, 47n (senza virgola: la lettera fa da virgola)
    let m = s.match(/^([+-]?)(\d+)([pnuµmkKMGR])(\d+)\s*(.*)$/);
    if (m) {
      const [, sg, a, p, b, rest] = m;
      const pre = p === 'R' ? '' : PREF_CHARS[p];
      const ru = readUnit(rest);
      if (!ru || ru.prefix) return { ok: false, err: 'unita', msg: `Non riconosco l’unità «${rest}».` };
      const v = parseFloat(a + '.' + b) * 10 ** PREFIX[pre];
      return { ok: true, value: sg === '-' ? -v : v, unit: ru.unit, prefix: pre, style: 'tecnico' };
    }
    m = s.match(/^R(\d+)\s*(.*)$/);
    if (m) {
      const ru = readUnit(m[2]);
      if (!ru || ru.prefix) return { ok: false, err: 'unita', msg: `Non riconosco l’unità «${m[2]}».` };
      return { ok: true, value: parseFloat('0.' + m[1]), unit: ru.unit, prefix: '', style: 'tecnico' };
    }
    // numero, eventuale esponente, eventuale unità
    m = s.match(/^([+-])?\s*((?:\d{1,3}(?: \d{3})+|\d+)(?:[.,]\d+)?|[.,]\d+)\s*(?:(?:e|E)\s*([+-]?\d+)|(?:[x×*·]|\s)\s*10\s*\^\s*\(?\s*([+-]?\d+)\s*\)?)?\s*(.*)$/);
    if (!m) return { ok: false, err: 'formato', msg: 'Non riesco a leggere il numero: scrivilo per esempio come 4,7 k oppure 4700.' };
    const [, sg, body, e1, e2, rest] = m;
    // «4.700» può voler dire 4,7 oppure 4700: meglio chiedere che indovinare
    // «4.700» si legge come 4,7 (punto decimale), ma potrebbe essere 4700 con il punto delle migliaia: si segna il dubbio
    // e decide il controllo della risposta (answers.js), che non accetta mai la lettura con le migliaia
    const thousands = e1 == null && e2 == null && /^[1-9]\d{0,2}(\.\d{3})+$/.test(body) ? parseFloat(body.replace(/\./g, '')) : null;
    if ((body.match(/[.,]/g) || []).length > 1) return { ok: false, err: 'formato', msg: 'C’è più di una virgola: scrivi il numero con una sola virgola decimale.' };
    let v = parseFloat(body.replace(/ /g, '').replace(',', '.'));
    const ex = e1 ?? e2;
    if (ex != null) v *= 10 ** +ex;
    const ru = readUnit(rest);
    if (!ru) return { ok: false, err: 'unita', msg: `Non riconosco l’unità «${rest}».` };
    v *= 10 ** PREFIX[ru.prefix];
    const amb = thousands == null ? null : (sg === '-' ? -1 : 1) * thousands * 10 ** PREFIX[ru.prefix];
    return { ok: true, value: sg === '-' ? -v : v, unit: ru.unit, prefix: ru.prefix, style: ex != null ? 'scientifica' : 'normale', thousands: amb };
  }
  /* confronta una risposta con il valore atteso. exp: { v, u, tol (relativa, predefinita 0,01), abs (assoluta) }.
     Esito: { ok, value, unitStatus: 'ok'|'mancante'|'sbagliata', near } */
  const TOL = 0.01;
  function within(x, v, tol = TOL, abs = 0) {
    if (!isFinite(x) || !isFinite(v)) return false;
    return Math.abs(x - v) <= Math.max(Math.abs(v) * tol, abs, 1e-15);
  }
  function check(input, exp) {
    const r = typeof input === 'string' ? parse(input) : input;
    if (!r.ok) return Object.assign({ ok: false, unreadable: true }, r);
    const unitStatus = !exp.u ? 'ok' : r.unit == null ? 'mancante' : r.unit === exp.u ? 'ok' : 'sbagliata';
    const valueOK = within(r.value, exp.v, exp.tol ?? TOL, exp.abs || 0);
    // il valore giusto con l'unità sbagliata non vale: un numero senza la sua grandezza non è un risultato
    return { ok: valueOK && unitStatus !== 'sbagliata', valueOK, value: r.value, unit: r.unit, prefix: r.prefix, unitStatus };
  }

  /* ---------- Serie E ---------- */
  const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
  const E24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91];
  const SERIES = { E12, E24 };
  // tutti i valori della serie fra lo e hi (in ohm)
  function seriesValues(name, lo = 1, hi = 10e6) {
    const out = [];
    for (let d = -2; d <= 7; d++) for (const b of SERIES[name]) { const v = +(b * 10 ** (d - 1)).toPrecision(3); if (v >= lo - 1e-12 && v <= hi + 1e-9) out.push(v); }
    return out;
  }
  // valore commerciale più vicino (in rapporto, come si fa con le serie logaritmiche)
  function nearest(v, name = 'E12') {
    let best = null, bd = Infinity;
    for (const x of seriesValues(name, v / 20, v * 20)) { const d = Math.abs(Math.log(x / v)); if (d < bd - 1e-12) { bd = d; best = x; } }
    return best;
  }
  // primo valore commerciale non minore (o non maggiore) di v
  function nextUp(v, name = 'E12') { return seriesValues(name, v / 20, v * 20).find((x) => x >= v * (1 - 1e-9)) ?? null; }
  function nextDown(v, name = 'E12') { return seriesValues(name, v / 20, v * 20).reverse().find((x) => x <= v * (1 + 1e-9)) ?? null; }
  function inSeries(v, name = 'E12') { return seriesValues(name, v / 2, v * 2).some((x) => Math.abs(x / v - 1) < 1e-9); }

  /* ---------- Codice colori ---------- */
  const COLORS = [
    { id: 'nero', d: 0, m: 0 }, { id: 'marrone', d: 1, m: 1, tol: 1 }, { id: 'rosso', d: 2, m: 2, tol: 2 }, { id: 'arancio', d: 3, m: 3 },
    { id: 'giallo', d: 4, m: 4 }, { id: 'verde', d: 5, m: 5, tol: 0.5 }, { id: 'blu', d: 6, m: 6, tol: 0.25 }, { id: 'viola', d: 7, m: 7, tol: 0.1 },
    { id: 'grigio', d: 8, m: 8, tol: 0.05 }, { id: 'bianco', d: 9, m: 9 }, { id: 'oro', m: -1, tol: 5 }, { id: 'argento', m: -2, tol: 10 },
  ];
  const COLOR = Object.fromEntries(COLORS.map((c) => [c.id, c]));
  // bande di un valore: n = 4 (due cifre) o 5 (tre cifre); restituisce null se il valore non si può scrivere
  function toBands(v, n = 4, tol = 5) {
    const digits = n === 4 ? 2 : 3;
    if (v <= 0) return null;
    let e = Math.floor(Math.log10(v)) - (digits - 1);
    let mant = Math.round(v / 10 ** e);
    if (mant >= 10 ** digits) { e++; mant = Math.round(v / 10 ** e); }
    if (Math.abs(mant * 10 ** e - v) > v * 1e-9) return null;
    const mult = COLORS.find((c) => c.m === e);
    const tc = COLORS.find((c) => c.tol === tol);
    if (!mult || !tc) return null;
    const ds = String(mant).padStart(digits, '0').split('').map((d) => COLORS[+d].id);
    return ds.concat([mult.id, tc.id]);
  }
  // valore e tolleranza dalle bande
  function fromBands(bands) {
    const n = bands.length;
    if (n !== 4 && n !== 5) return null;
    const digits = bands.slice(0, n - 2).map((b) => COLOR[b] && COLOR[b].d);
    if (digits.some((d) => d == null)) return null;
    const mult = COLOR[bands[n - 2]];
    const tol = COLOR[bands[n - 1]];
    if (!mult || mult.m == null || !tol || tol.tol == null) return null;
    const v = +(Number(digits.join('')) * 10 ** mult.m).toPrecision(6);
    return { v, tol: tol.tol, min: v * (1 - tol.tol / 100), max: v * (1 + tol.tol / 100) };
  }

  const api = {
    NB, THIN, MINUS, PREFIX, PREFIX_NAME, PREFIX_ORDER, UNITS, NO_PREFIX, TOL,
    roundSig, num, fmt, sci, pickPrefix, parse, check, within, readUnit, normalizeInput,
    E12, E24, seriesValues, nearest, nextUp, nextDown, inSeries, COLORS, COLOR, toBands, fromBands,
  };
  root.ElekUnits = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
