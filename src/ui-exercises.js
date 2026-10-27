/* ELEKTRON — interfaccia, parte 3: gli esercizi. Per ogni tipo: come si mostra, come si risponde, come si controlla.
   Il controllo usa solo answers.js: meglio rifiutare e mostrare lo svolgimento che accettare un errore. */

// tipi che si risolvono con un numero (e la sua unità)
const NUMERIC = ['calc', 'conta', 'multimetro', 'oscilloscopio', 'grafico', 'colori-leggi'];
const TYPE_TITLE = {
  calc: 'Calcola', conta: 'Conta', multimetro: 'Leggi lo strumento', oscilloscopio: 'Leggi l’oscilloscopio', grafico: 'Leggi il grafico', 'colori-leggi': 'Codice colori',
  scelta: 'Scegli', complesso: 'Numeri complessi', base: 'Sistemi di numerazione', espressione: 'Espressione logica', bit: '0 oppure 1?', sequenza: 'Sequenza',
  tabella: 'Tabella di verità', kmap: 'Mappa di Karnaugh', simula: 'Simulatore logico', abbina: 'Abbina', ordina: 'Metti in ordine i passaggi', esperto: 'Problema completo',
};
const optKey = (k) => `<span class="k" aria-hidden="true">${k + 1}</span>`;
function exHead(it) {
  const c = SES.cur;
  const tags = [];
  if (it.quiz) tags.push('<span class="tag pri">Verifica veloce</span>');
  if (it.review) tags.push('<span class="tag pri">Ripasso</span>');
  if (it.requeued) tags.push('<span class="tag pri">Riproviamo</span>');
  for (const id of (it.problem && it.problem.newConcepts) || []) tags.push(conceptTag(id));
  c.tagsHtml = tags.join('');
  return `<div class="ex-head">${tags.length ? `<div class="ex-tags">${tags.join('')}</div>` : ''}<p class="note">${esc(TYPE_TITLE[it.type] || '')}</p><h2 class="prompt">${rich(it.problem.text)}</h2></div>`;
}

/* ---------- Risposta scritta con la tastierina ---------- */
function keysFor(it) {
  const sol = it.problem.sol;
  if (it.type === 'complesso') return ['j', '∠', '°', '−', ',', ...(sol.u ? [sol.u] : [])];
  if (it.type === 'espressione') return (sol.vars || ['A', 'B', 'C']).concat(['\'', '·', '+', '(', ')']);
  if (it.type === 'base') return sol.base === 16 ? ['A', 'B', 'C', 'D', 'E', 'F'] : [];
  if (it.type === 'conta' || !sol.u) return ['−', ','];
  const pre = (SES.prefixes || ['']).filter((p) => p && !U.NO_PREFIX.has(sol.u));
  return ['−', ','].concat(pre).concat([sol.u]);
}
function answerArea(it, id = 'typed', label = 'La tua risposta') {
  const keys = S.settings.keypad ? keysFor(it) : [];
  const numeric = NUMERIC.includes(it.type) || it.type === 'esperto';
  const mode = it.type === 'base' && it.problem.sol.base !== 16 ? 'numeric' : numeric && keys.length && S.settings.keypad ? 'decimal' : 'text';
  const ph = it.type === 'complesso' ? (it.problem.answerForm === 'polare' ? 'es. 5∠53,1°' : 'es. 3 + j4') : it.type === 'espressione' ? 'es. A·B + C\'' : it.type === 'base' ? '' : it.problem.sol.u ? `es. 4,7 k${it.problem.sol.u}` : '';
  return `<div class="answer"><div class="answer-row"><label class="sr" for="${id}">${esc(label)}</label><input id="${id}" class="typed${it.type === 'espressione' || it.type === 'base' ? ' mono' : ''}" inputmode="${mode}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(ph)}"></div>
    ${keys.length ? `<div class="keypad" role="group" aria-label="Simboli">${keys.map((k) => `<button type="button" class="key" data-act="key" data-k="${esc(k)}" data-t="${id}" aria-label="Scrivi ${esc(k === '−' ? 'meno' : k === '·' ? 'per' : k === '\'' ? 'negato' : k)}">${esc(k)}</button>`).join('')}</div>` : ''}
    ${hintFor(it)}</div>`;
}
function hintFor(it) {
  const sol = it.problem.sol;
  if (it.type === 'complesso') return `<p class="unit-hint">${it.problem.answerForm === 'polare' ? 'Forma polare: modulo, il simbolo ∠ e l’angolo in gradi.' : 'Forma algebrica (a + jb) oppure polare (modulo∠angolo).'}</p>`;
  if (it.type === 'espressione') return `<p class="unit-hint">Per la negazione scrivi l’apostrofo dopo la variabile (A' è A negato); AND con · o accostando le lettere, OR con +.</p>`;
  if (it.type === 'base') return `<p class="unit-hint">${sol.twos ? `Esattamente ${sol.bits} bit.` : sol.bcd ? 'Quattro bit per ogni cifra decimale; gli spazi fra i gruppi vanno bene.' : `Scrivi solo le cifre in base ${sol.base}; gli spazi fra i gruppi vanno bene.`}</p>`;
  if (it.type === 'conta') return '';
  if (sol.u) return `<p class="unit-hint">Scrivi il numero con l’unità (${esc(sol.u)}); vanno bene la virgola o il punto, i prefissi e la notazione scientifica. Tolleranza: ${sol.abs ? U.fmt(sol.abs, sol.u === '°' ? '°' : sol.u) : '1 %'}.</p>`;
  return '<p class="unit-hint">Il risultato è un numero puro, senza unità. Tolleranza: 1 %.</p>';
}
function insertKey(id, k) {
  const t = $('#' + id); if (!t || t.readOnly) return;
  const a = t.selectionStart ?? t.value.length, b = t.selectionEnd ?? a;
  // le unità e i prefissi si staccano dal numero con uno spazio
  const pad = /^[pnµmkMG]$|^[A-ZΩ°]/.test(k) && !['A', 'B', 'C', 'D', 'E', 'F'].includes(k) && /\d$/.test(t.value.slice(0, a)) && SES.cur.it.type !== 'espressione' && SES.cur.it.type !== 'base' ? ' ' : '';
  t.value = t.value.slice(0, a) + pad + k + t.value.slice(b);
  const p = a + pad.length + k.length;
  t.setSelectionRange(p, p); t.focus({ preventScroll: true });
  syncCheck();
}

/* ---------- Rese ---------- */
function optsHtml(choices) {
  return `<div class="opts" role="group" aria-label="Risposte">${choices.map((c, k) => {
    const inner = c.html ? c.html : c.math ? mathml(c.math) : c.bands ? `${bandsMini(c.bands)}<span>${esc(c.label)}</span>` : rich(c.label);
    return `<button class="opt" data-act="pick" data-k="${k}" aria-pressed="false">${optKey(k)}<span class="grow">${inner}</span></button>`;
  }).join('')}</div>`;
}
function renderExercise(it) {
  const p = it.problem;
  const c = SES.cur;
  let h = exHead(it) + problemFigure(p);
  const t = it.type;
  if (t === 'scelta') h += optsHtml(it.choices);
  else if (t === 'bit') h += `<div class="opts two" role="group" aria-label="Risposte">${[0, 1].map((v, k) => `<button class="opt" data-act="pick" data-k="${k}" aria-pressed="false">${optKey(k)}<span class="grow mono">${v}</span></button>`).join('')}</div>`;
  else if (NUMERIC.includes(t) || ['complesso', 'base', 'espressione'].includes(t)) h += answerArea(it);
  else if (t === 'sequenza') {
    const n = String(p.sol.seq).length;
    c.bits = Array(n).fill(null);
    h += `<div class="row wrap" role="group" aria-label="Valori di Q, uno per ogni colpo di clock">${c.bits.map((_, k) => `<div class="stack center"><span class="note">${k + 1}</span><button class="bitbtn" data-act="bit" data-k="${k}" aria-label="Valore numero ${k + 1}: da scegliere">?</button></div>`).join('')}</div><p class="unit-hint">Tocca ogni casella per scegliere 0 o 1.</p>`;
  } else if (t === 'tabella') {
    const vars = p.vars;
    c.bits = Array(p.want.length).fill(null);
    h += `<table class="tt"><caption class="sr">Completa l’uscita Y</caption><thead><tr>${vars.map((v) => `<th scope="col">${esc(v)}</th>`).join('')}<th scope="col">Y</th></tr></thead><tbody>${p.want.map((_, m) => `<tr>${vars.map((v, i) => `<td>${(m >> (vars.length - 1 - i)) & 1}</td>`).join('')}<td><button class="bitbtn" data-act="bit" data-k="${m}" aria-label="Uscita per ${vars.map((v, i) => `${v} = ${(m >> (vars.length - 1 - i)) & 1}`).join(', ')}: da scegliere">?</button></td></tr>`).join('')}</tbody></table><p class="unit-hint">Tocca ogni casella dell’uscita per scegliere 0 o 1.</p>`;
  } else if (t === 'kmap') {
    const vars = p.kmap.vars;
    const L = LG.kmapLayout(vars);
    c.cells = new Set();
    h += `<div class="figure-box"><div class="kmgrid cols-${L.cols.length + 1}" role="group" aria-label="Mappa di Karnaugh: righe ${L.rowVars.join('')}, colonne ${L.colVars.join('')}"><span class="hd">${esc(L.rowVars.join(''))}\\${esc(L.colVars.join(''))}</span>${L.cols.map((cl) => `<span class="hd">${cl}</span>`).join('')}${L.rows.map((rw, ri) => `<span class="hd">${rw}</span>${L.cols.map((cl, ci) => { const m = L.cell(ri, ci); return `<button class="bitbtn" data-act="cell" data-m="${m}" data-v="0" aria-pressed="false" aria-label="${L.rowVars.join('')} = ${rw}, ${L.colVars.join('')} = ${cl}">0</button>`; }).join('')}`).join('')}</div></div><p class="unit-hint">Tocca le caselle in cui Y vale 1; le altre restano a 0.</p>`;
  } else if (t === 'simula') {
    c.inputs = Object.fromEntries(p.net.inputs.map((v) => [v, 0]));
    h += `<div class="sim"><div class="inputs" role="group" aria-label="Ingressi">${p.net.inputs.map((v) => `<button class="inbtn" data-act="simIn" data-v="${esc(v)}" aria-pressed="false">${esc(v)} = 0</button>`).join('')}</div><div id="simNet">${simNetHtml(p.net, c.inputs)}</div><p class="prompt" id="simOut" aria-live="polite">${simOutText(p.net, c.inputs)}</p></div>`;
  } else if (t === 'abbina') {
    c.right = shuffle(p.pairs.map((_, i) => i));
    c.paired = new Set(); c.selL = null; c.errors = 0;
    h += `<div class="match"><div class="col" role="group" aria-label="Da abbinare">${p.pairs.map((q, i) => `<button data-act="mL" data-i="${i}" aria-pressed="false">${rich(q.a)}</button>`).join('')}</div><div class="col" role="group" aria-label="Abbinamenti">${c.right.map((i) => `<button data-act="mR" data-i="${i}" aria-pressed="false">${rich(q2(p.pairs[i].b))}</button>`).join('')}</div></div>`;
  } else if (t === 'ordina') {
    c.seq = [];
    h += `<ol class="order" aria-label="Passaggi da ordinare">${it.order.map((i) => `<li><button data-act="ord" data-i="${i}" aria-pressed="false"><span class="k" aria-hidden="true"></span><span class="grow">${mathml(it.steps[i].f)}</span></button></li>`).join('')}</ol><p class="unit-hint">Tocca i passaggi nell’ordine in cui si fanno; tocca di nuovo per togliere l’ultimo.</p>`;
  } else if (t === 'esperto') {
    h += `<p class="note">Livello esperto: scrivi ogni risultato intermedio, poi quello finale. Lo svolgimento compare solo alla fine.</p>` + it.parts.map((s, k) => `<div class="field"><span class="label">${k + 1}. ${mathml(lhs(s.f))}</span>${answerArea({ type: 'calc', problem: { sol: { u: s.u } } }, 'part' + k, 'Risultato ' + (k + 1))}</div>`).join('');
  }
  return h;
}
const q2 = (s) => s; // le voci da abbinare sono già testo
// le bande di un resistore in piccolo, accanto ai nomi dei colori (il colore non è mai l'unico indizio)
const bandsMini = (bands) => `<svg class="bands-mini" viewBox="0 0 ${bands.length * 10} 20" width="${bands.length * 10}" height="20" aria-hidden="true">${bands.map((b, i) => `<rect class="cc-band" x="${i * 10 + 1}" y="1" width="8" height="18" rx="1" fill="${PL.COLOR_VAR[b] || '#999'}"/>`).join('')}</svg>`;
const lhs = (f) => String(f).split('=')[0].trim();
function simNetHtml(net, inputs) { return netHtml(net, inputs); }
function simOutText(net, inputs) { const o = LG.simulate(net, inputs).out; return Object.entries(o).map(([k, v]) => `${k} = ${v}`).join(', '); }

/* ---------- Interazioni ---------- */
function syncCheck() {
  const c = SES && SES.cur; if (!c) return;
  const b = $('#checkBtn'); if (!b) return;
  const it = c.it, t = it.type;
  let ready = true;
  if (t === 'scelta' || t === 'bit') ready = c.picked != null;
  else if (t === 'sequenza' || t === 'tabella') ready = c.bits.every((x) => x != null);
  else if (t === 'ordina') ready = c.seq.length === it.steps.length;
  else if (t === 'esperto') ready = it.parts.every((_, k) => ($('#part' + k) || {}).value);
  else if ($('#typed')) ready = !!$('#typed').value.trim();
  b.disabled = !ready;
}
function pickOption(k) {
  const c = SES.cur; if (!c || c.answered) return;
  c.picked = k;
  $$('#ovBody .opt').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.k === k));
  sfx.tap();
  syncCheck();
}
function toggleBit(el) {
  const c = SES.cur; if (c.answered) return;
  const k = +el.dataset.k;
  c.bits[k] = c.bits[k] === 1 ? 0 : c.bits[k] === 0 ? 1 : 0;
  el.textContent = c.bits[k]; el.dataset.v = c.bits[k];
  el.setAttribute('aria-label', el.getAttribute('aria-label').replace(/: .*$/, ': ' + c.bits[k]));
  sfx.tap(); syncCheck();
}
function toggleCell(el) {
  const c = SES.cur; if (c.answered) return;
  const m = +el.dataset.m;
  if (c.cells.has(m)) c.cells.delete(m); else c.cells.add(m);
  const on = c.cells.has(m);
  el.textContent = on ? 1 : 0; el.dataset.v = on ? 1 : 0; el.setAttribute('aria-pressed', on);
  sfx.tap();
}
function toggleSimInput(el) {
  const c = SES.cur; if (c.answered) return;
  const v = el.dataset.v;
  c.inputs[v] = c.inputs[v] ? 0 : 1;
  el.textContent = `${v} = ${c.inputs[v]}`; el.setAttribute('aria-pressed', !!c.inputs[v]);
  const net = c.it.problem.net;
  $('#simNet').innerHTML = simNetHtml(net, c.inputs);
  $('#simOut').textContent = simOutText(net, c.inputs);
  sfx.tap();
}
function matchStep(side, el) {
  const c = SES.cur; if (c.answered || el.classList.contains('paired')) return;
  const i = +el.dataset.i;
  if (side === 'L') {
    $$('[data-act="mL"]').forEach((b) => b.setAttribute('aria-pressed', b === el));
    c.selL = i; sfx.tap(); return;
  }
  if (c.selL == null) { toast('Tocca prima una voce della colonna di sinistra.'); return; }
  const L = $(`[data-act="mL"][data-i="${c.selL}"]`);
  if (i === c.selL) {
    [L, el].forEach((b) => { b.classList.add('paired'); b.setAttribute('aria-pressed', 'false'); b.disabled = true; });
    c.paired.add(i); c.selL = null; sfx.match();
    if (c.paired.size === c.it.problem.pairs.length) finalize({ ok: c.errors === 0, note: c.errors ? `Tutte abbinate, con ${plural(c.errors, 'errore', 'errori')} lungo la strada.` : '' });
  } else {
    c.errors++; el.classList.add('bad'); sfx.err(); buzz(30);
    setTimeout(() => el.classList.remove('bad'), 600);
  }
}
function orderStep(el) {
  const c = SES.cur; if (c.answered) return;
  const i = +el.dataset.i;
  const at = c.seq.indexOf(i);
  if (at >= 0) { if (at === c.seq.length - 1) c.seq.pop(); else return; } else c.seq.push(i);
  $$('[data-act="ord"]').forEach((b) => { const k = c.seq.indexOf(+b.dataset.i); b.setAttribute('aria-pressed', k >= 0); b.querySelector('.k').textContent = k >= 0 ? k + 1 : ''; });
  sfx.tap(); syncCheck();
}

/* ---------- Controllo ---------- */
// res: { ok, msg (risposta da riscrivere: non conta), mistake {name, text}, note, near, wrongRows }
function checkAnswer() {
  const c = SES.cur, it = c.it, p = it.problem, sol = p.sol, t = it.type;
  const val = () => ($('#typed') ? $('#typed').value.trim() : '');
  if (t === 'scelta') {
    if (c.picked == null) return null;
    const r = AN.choice(c.picked, it.choices);
    markOptions(r.ok, (k) => it.choices[k].right);
    return r;
  }
  if (t === 'bit') {
    if (c.picked == null) return null;
    const ok = c.picked === sol.v;
    markOptions(ok, (k) => k === sol.v);
    const m = !ok && (sol.mistakes || []).find((x) => x.v === c.picked);
    return { ok, mistake: m ? Object.assign({ id: m.id }, MI.CATALOG[m.id] || {}) : null };
  }
  if (NUMERIC.includes(t)) { if (!val()) return null; return AN.numeric(val(), sol); }
  if (t === 'complesso') {
    if (!val()) return null;
    const r = AN.complex(val(), sol);
    if (r.ok && p.answerForm === 'polare' && !/∠|<|ang/i.test(val())) return { ok: false, verdict: 'illeggibile', msg: 'Il valore è giusto, ma qui serve la forma polare: modulo∠angolo.' };
    return r;
  }
  if (t === 'base') { if (!val()) return null; return AN.base(val(), sol); }
  if (t === 'espressione') { if (!val()) return null; const r = AN.logic(val(), sol); if (r.ok && sol.minimal) S.stats.minimal++; return r; }
  if (t === 'sequenza') {
    if (c.bits.some((x) => x == null)) return null;
    const got = c.bits.join(''), want = String(sol.seq);
    markBits((k) => got[k] !== want[k]);
    return { ok: got === want };
  }
  if (t === 'tabella') {
    const r = AN.table(c.bits, p.want);
    if (r.verdict === 'illeggibile') return r;
    markBits((k) => (r.wrongRows || []).includes(k));
    return r;
  }
  if (t === 'kmap') {
    const want = new Set(sol.minterms);
    const wrong = $$('#ovBody [data-act="cell"]').filter((b) => want.has(+b.dataset.m) !== c.cells.has(+b.dataset.m));
    wrong.forEach((b) => b.classList.add('wrongcell'));
    return { ok: wrong.length === 0, note: wrong.length ? `${plural(wrong.length, 'casella sbagliata', 'caselle sbagliate')}, segnate in rosso.` : '' };
  }
  if (t === 'simula') {
    const o = LG.simulate(p.net, c.inputs).out;
    const ok = Object.values(o)[0] === p.target;
    return { ok, note: ok ? `Con ${Object.entries(c.inputs).map(([k, v]) => `${k} = ${v}`).join(', ')} l’uscita vale ${p.target}.` : `Con questi ingressi l’uscita vale ${Object.values(o)[0]}: cambia qualche ingresso e riprova la prossima volta.` };
  }
  if (t === 'ordina') {
    if (c.seq.length < it.steps.length) return null;
    const ok = c.seq.every((x, k) => x === k);
    return { ok, note: ok ? '' : 'Ogni passaggio usa il risultato di quello prima: parti da ciò che puoi calcolare subito con i dati.' };
  }
  if (t === 'esperto') {
    const rs = it.parts.map((s, k) => AN.numeric(($('#part' + k) || {}).value || '', { v: s.v, u: s.u, mistakes: [] }));
    const bad = rs.map((r, k) => (r.ok ? -1 : k)).filter((k) => k >= 0);
    rs.forEach((r, k) => { const inp = $('#part' + k); if (inp) inp.classList.add(r.ok ? 'is-ok' : 'is-bad'); });
    return { ok: !bad.length, note: bad.length ? `Da rivedere: ${bad.map((k) => 'risultato ' + (k + 1)).join(', ')}.` : 'Tutti i risultati intermedi sono giusti.' };
  }
  return { ok: false };
}
function markOptions(ok, isRight) {
  $$('#ovBody .opt').forEach((b, k) => {
    b.disabled = true; b.setAttribute('aria-pressed', 'false');
    if (isRight(k)) b.classList.add('right');
    else if (k === SES.cur.picked && !ok) b.classList.add('wrong');
  });
}
function markBits(isWrong) { $$('#ovBody [data-act="bit"]').forEach((b) => { if (isWrong(+b.dataset.k)) b.classList.add('wrongcell'); }); }
