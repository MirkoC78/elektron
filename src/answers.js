/* ELEKTRON — controllo delle risposte. Meglio rifiutare e mostrare lo svolgimento che accettare un errore.
   Numeri: tolleranza dell'1 % sul valore esatto (o una tolleranza assoluta dichiarata, per angoli e decibel), tutte le
   scritture dei tecnici; l'unità mancante si segnala ma non rende sbagliato un valore giusto; l'unità sbagliata sì.
   Una risposta ambigua (4.700) non si giudica: si chiede di riscriverla.
   Quando la risposta coincide con un errore tipico la spiegazione nomina quell'errore (mistakes.js).
   Anche: numeri complessi, espressioni logiche (equivalenza e, se chiesta, forma minima), basi numeriche, tabelle di verità. */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const X = root.ElekCx || require('./cx.js');
  const MI = root.ElekMistakes || require('./mistakes.js');
  const LG = root.ElekLogic || require('./logic.js');
  const NS = root.ElekNum || require('./numsys.js');

  const UNIT_WHAT = { 'Ω': 'una resistenza si misura in ohm (Ω)', V: 'una tensione si misura in volt (V)', A: 'una corrente si misura in ampere (A)', W: 'una potenza attiva si misura in watt (W)', J: 'un’energia si misura in joule (J)', Wh: 'qui l’energia è chiesta in wattora (Wh o kWh)', C: 'una carica si misura in coulomb (C)', F: 'una capacità si misura in farad (F)', H: 'un’induttanza si misura in henry (H)', Hz: 'una frequenza si misura in hertz (Hz)', s: 'un tempo si misura in secondi (s)', VA: 'la potenza apparente si misura in voltampere (VA)', var: 'la potenza reattiva si misura in var', '°': 'qui l’angolo è chiesto in gradi (°)', dB: 'qui il guadagno è chiesto in decibel (dB)', '%': 'qui il risultato è una percentuale (%)', 'rad/s': 'la pulsazione si misura in radianti al secondo (rad/s)', '°C': 'una temperatura si misura in gradi Celsius (°C)' };

  /* risposta numerica. sol = { v, u, tol?, abs?, accept?: [altri valori giusti], mistakes } (come i risolutori).
     Esito: { ok, verdict: 'giusta' | 'sbagliata' | 'illeggibile', value, unitStatus, note, mistake, near } */
  function numeric(input, sol, o = {}) {
    const p = U.parse(input);
    if (!p.ok) return { ok: false, verdict: 'illeggibile', msg: p.msg, err: p.err };
    const tol = sol.tol ?? o.tol ?? U.TOL, abs = sol.abs ?? 0;
    const unit = sol.u || '';
    // l'unità: mancante, giusta o sbagliata (per le grandezze senza unità — guadagni, rapporti — non si controlla)
    let unitStatus = 'ok';
    if (unit && p.unit == null) unitStatus = 'mancante';
    else if (unit && p.unit !== unit && !(unit === 'Wh' && p.unit === 'Wh')) unitStatus = 'sbagliata';
    else if (!unit && p.unit) unitStatus = p.unit === '%' && sol.u === '' ? 'sbagliata' : 'superflua';
    const good = [sol.v].concat(sol.accept || []);
    const valueOK = good.some((g) => U.within(p.value, g, tol, abs));
    // «4.700»: se giusta è solo la lettura con il punto delle migliaia non si giudica, si chiede di riscrivere
    if (!valueOK && p.thousands != null && good.some((g) => U.within(p.thousands, g, tol, abs))) return { ok: false, verdict: 'illeggibile', err: 'ambiguo', msg: `«${String(input).trim()}»: il punto qui vale come virgola decimale. Se intendevi ${U.num(p.thousands)}, scrivilo senza il punto delle migliaia.` };
    const res = { value: p.value, unitStatus, prefix: p.prefix, valueOK };
    if (valueOK && unitStatus !== 'sbagliata' && unitStatus !== 'superflua') {
      res.ok = true; res.verdict = 'giusta';
      if (unitStatus === 'mancante') res.note = `Giusto. Scrivi anche l’unità: ${U.fmt(sol.v, unit)}.`;
      return res;
    }
    res.ok = false; res.verdict = 'sbagliata';
    if (valueOK && unitStatus === 'sbagliata') { res.msg = `Il numero è giusto, ma l’unità no: ${UNIT_WHAT[unit] || 'l’unità giusta è ' + unit}.`; res.unitWrong = true; return res; }
    if (valueOK && unitStatus === 'superflua') { res.msg = `Il numero è giusto, ma il risultato non ha unità di misura (è un rapporto o un numero puro).`; return res; }
    // errore tipico riconosciuto
    const m = MI.match(p.value, sol.mistakes || [], sol.v, tol);
    if (m) { res.mistake = m; return res; }
    // vicino ma fuori tolleranza: arrotondamenti troppo presto
    if (isFinite(sol.v) && sol.v !== 0 && Math.abs(p.value - sol.v) <= Math.abs(sol.v) * 0.05) res.near = true;
    if (unitStatus === 'sbagliata') res.msg = `Controlla anche l’unità: ${UNIT_WHAT[unit] || unit}.`;
    return res;
  }

  /* numero complesso: sol = { z (complesso), u, tol } */
  function complex(input, sol, o = {}) {
    const p = X.parse(input);
    if (!p.ok) return { ok: false, verdict: 'illeggibile', msg: p.msg };
    const tol = sol.tol ?? o.tol ?? U.TOL;
    const ok = X.within(p.z, sol.z, tol);
    const unitStatus = !sol.u ? 'ok' : p.unit == null ? 'mancante' : p.unit === sol.u ? 'ok' : 'sbagliata';
    if (ok && unitStatus !== 'sbagliata') return { ok: true, verdict: 'giusta', unitStatus, note: unitStatus === 'mancante' ? `Giusto. Scrivi anche l’unità (${sol.u}).` : '' };
    const res = { ok: false, verdict: 'sbagliata', unitStatus };
    if (ok) { res.msg = `Il numero è giusto, ma l’unità no: ${UNIT_WHAT[sol.u] || sol.u}.`; return res; }
    // errori tipici sui complessi: coniugato (segno della parte immaginaria), modulo giusto ma fase sbagliata, parti scambiate
    const z = sol.z;
    if (X.within(p.z, X.conj(z), tol)) res.mistake = { id: 'segno', name: 'segno della parte immaginaria sbagliato', text: 'La parte reale è giusta ma la parte immaginaria ha il segno sbagliato: ricorda che la reattanza capacitiva è negativa (−jX_C), quella induttiva positiva (+jX_L).' };
    else if (Math.abs(X.abs(p.z) - X.abs(z)) <= tol * X.abs(z)) res.mistake = { id: 'fase', name: 'fase sbagliata', text: 'Il modulo è giusto ma l’angolo no: l’angolo è arctan(parte immaginaria / parte reale), controlla il quadrante e la calcolatrice in gradi.' };
    else if (X.within(p.z, X.C(z.im, z.re), tol)) res.mistake = { id: 'parti-scambiate', name: 'parte reale e immaginaria scambiate', text: 'La parte reale è la resistenza, la parte immaginaria (con la j) la reattanza.' };
    return res;
  }

  /* espressione logica: sol = { expr (albero) oppure minterms + vars, dc, minimal: true per chiedere la forma minima, form: 'SOP' | 'POS' } */
  function logic(input, sol, o = {}) {
    let x;
    try { x = LG.parse(input); } catch (e) { return { ok: false, verdict: 'illeggibile', msg: 'Non riesco a leggere l’espressione: ' + e.message + '. Scrivi per esempio A·B + C̄ oppure AB + C\'.' }; }
    const vars = sol.vars || LG.varsOf(sol.expr);
    const extra = LG.varsOf(x).filter((v) => !vars.includes(v));
    if (extra.length) return { ok: false, verdict: 'sbagliata', msg: `L’espressione usa ${extra.length === 1 ? 'la variabile' : 'le variabili'} ${extra.join(', ')}, che non c’${extra.length === 1 ? 'è' : 'sono'} nella funzione.` };
    const target = sol.minterms || LG.mintermsOf(sol.expr, vars);
    const dc = sol.dc || [];
    const rows = LG.table(x, vars);
    const wrongRows = rows.filter((r) => !dc.includes(r.m) && r.out !== (target.includes(r.m) ? 1 : 0)).map((r) => r.m);
    if (wrongRows.length) {
      const res = { ok: false, verdict: 'sbagliata', wrongRows };
      res.msg = `L’espressione non dà la stessa funzione: ${wrongRows.length === 1 ? 'sbaglia la riga' : 'sbaglia le righe'} ${wrongRows.slice(0, 4).map((m) => vars.map((v, i) => (m >> (vars.length - 1 - i)) & 1).join('')).join(', ')}${wrongRows.length > 4 ? '…' : ''} della tabella di verità.`;
      // De Morgan applicato a metà: negazione di tutto al posto delle negazioni dei singoli
      if (wrongRows.length === rows.length - dc.length) res.mistake = { id: 'negazione', name: 'funzione negata', text: 'L’espressione dà esattamente il contrario: forse hai applicato De Morgan senza cambiare anche le operazioni (AND ↔ OR), oppure hai preso gli 0 della mappa invece degli 1.' };
      return res;
    }
    if (sol.minimal) {
      const best = sol.form === 'POS' ? LG.minimalPOS(target, vars, dc) : LG.minimalSOP(target, vars, dc);
      const cost = best.cost || { terms: best.implicants.length, literals: best.implicants.reduce((s, i) => s + [...i].filter((c) => c !== '-').length, 0) };
      const terms = sol.form === 'POS' ? (x.op === 'and' ? x.xs.length : 1) : (x.op === 'or' ? x.xs.length : 1);
      const lits = LG.literals(x);
      const twoLevel = sol.form === 'POS' ? isPOS(x) : isSOP(x);
      if (!twoLevel) return { ok: false, verdict: 'sbagliata', equivalent: true, msg: sol.form === 'POS' ? 'L’espressione è equivalente, ma non è un prodotto di somme.' : 'L’espressione è equivalente, ma non è una somma di prodotti: togli le parentesi.' };
      if (terms > cost.terms || lits > cost.literals) return { ok: false, verdict: 'sbagliata', equivalent: true, msg: `L’espressione è equivalente ma non è minima: la forma minima ha ${cost.terms} ${cost.terms === 1 ? 'termine' : 'termini'} e ${cost.literals} letterali (la tua ${terms} e ${lits}). Cerca gruppi più grandi nella mappa.`, minimal: best.all.map(LG.text) };
    }
    return { ok: true, verdict: 'giusta' };
  }
  const isLit = (y) => y.op === 'var' || (y.op === 'not' && y.x.op === 'var') || y.op === 'const';
  const isProd = (y) => isLit(y) || (y.op === 'and' && y.xs.every(isLit));
  const isSum = (y) => isLit(y) || (y.op === 'or' && y.xs.every(isLit));
  const isSOP = (y) => isProd(y) || (y.op === 'or' && y.xs.every(isProd));
  const isPOS = (y) => isSum(y) || (y.op === 'and' && y.xs.every(isSum));

  /* numero in una base: sol = { v (valore), base, bits? (numero di cifre richiesto, per il complemento a due e il BCD) } */
  function base(input, sol) {
    if (sol.bcd) {
      const s = String(input).replace(/\s/g, '');
      if (!/^[01]+$/.test(s)) return { ok: false, verdict: 'illeggibile', msg: 'Scrivi il codice BCD con 0 e 1, a gruppi di 4 bit.' };
      const v = NS.fromBCD(s);
      if (v == null) return { ok: false, verdict: 'sbagliata', msg: s.length % 4 ? 'Ogni cifra decimale occupa 4 bit: il numero di bit deve essere un multiplo di 4.' : 'Un gruppo di 4 bit vale più di 9: non è un codice BCD.' };
      if (v === sol.v) return { ok: true, verdict: 'giusta' };
      // il numero scritto in binario puro invece che cifra per cifra
      if (parseInt(s, 2) === sol.v) return { ok: false, verdict: 'sbagliata', mistake: { id: 'bcd-binario', name: 'binario puro al posto del BCD', text: 'In BCD ogni cifra decimale si scrive con i suoi 4 bit: 25 è 0010 0101, non 11001.' } };
      return { ok: false, verdict: 'sbagliata' };
    }
    const p = NS.parseBase(input, sol.base);
    if (!p.ok) return { ok: false, verdict: 'illeggibile', msg: p.msg };
    if (sol.twos) {
      const want = NS.toTwos(sol.v, sol.bits);
      const got = p.digits;
      if (p.digits.length !== sol.bits) return { ok: false, verdict: 'sbagliata', msg: `Il complemento a due si scrive con esattamente ${sol.bits} bit.` };
      if (got === want) return { ok: true, verdict: 'giusta' };
      const one = NS.twosSteps(sol.v, sol.bits).inv;
      if (sol.v < 0 && got === one) return { ok: false, verdict: 'sbagliata', mistake: { id: 'complemento-uno', name: MI.CATALOG['complemento-uno'].name, text: MI.CATALOG['complemento-uno'].text } };
      if (got === NS.toBase(Math.abs(sol.v), 2, { bits: sol.bits, group: false })) return { ok: false, verdict: 'sbagliata', mistake: { id: 'segno', name: 'segno dimenticato', text: 'Hai scritto il modulo: per un numero negativo bisogna invertire i bit e aggiungere 1.' } };
      return { ok: false, verdict: 'sbagliata' };
    }
    if (sol.bits && p.digits.replace(/^0+(?=.)/, '').length > sol.bits) return { ok: false, verdict: 'sbagliata', msg: `Il risultato non sta in ${sol.bits} bit.` };
    if (p.value === sol.v) return { ok: true, verdict: 'giusta' };
    const res = { ok: false, verdict: 'sbagliata' };
    // errori tipici: cifre lette al contrario (resti delle divisioni presi dall'alto)
    const rev = p.digits.split('').reverse().join('');
    if (parseInt(rev, sol.base) === sol.v && rev !== p.digits) res.mistake = { id: 'resti-al-contrario', name: 'resti letti nell’ordine sbagliato', text: 'Con le divisioni successive le cifre si leggono dall’ultimo resto al primo (dal basso verso l’alto).' };
    return res;
  }
  // tabella di verità completata: answer e want sono array di 0/1 (o null per le caselle vuote)
  function table(answer, want, dc = []) {
    if (answer.some((a, i) => a == null && !dc.includes(i))) return { ok: false, verdict: 'illeggibile', msg: 'Completa tutte le righe della tabella.' };
    const wrong = want.map((w, i) => (dc.includes(i) ? false : +answer[i] !== +w)).map((b, i) => (b ? i : -1)).filter((i) => i >= 0);
    return wrong.length ? { ok: false, verdict: 'sbagliata', wrongRows: wrong } : { ok: true, verdict: 'giusta' };
  }
  // scelta fra opzioni: le opzioni giuste possono essere più d'una (stesso valore scritto in modi diversi)
  function choice(index, opts) {
    const o = opts[index];
    if (!o) return { ok: false, verdict: 'illeggibile' };
    if (o.right) return { ok: true, verdict: 'giusta' };
    return { ok: false, verdict: 'sbagliata', mistake: o.mistake ? Object.assign({ id: o.mistake }, MI.CATALOG[o.mistake] || {}) : null };
  }

  const api = { numeric, complex, logic, base, table, choice, UNIT_WHAT, isSOP, isPOS };
  root.ElekAnswers = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
