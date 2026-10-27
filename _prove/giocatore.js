/* Giocatore automatico di Elektron: rigioca le lezioni nell'app vera dando sempre la risposta giusta con gli stessi
   comandi dello studente (scelte, tastiera, caselle, coppie, ordine) e controlla che ogni risposta giusta sia accettata,
   che ogni lezione finisca con tre stelle, che nulla esca dalla larghezza dello schermo e che la console resti pulita.
   Si carica nella pagina dist/elektron.html#demo=0 (stato dimostrativo, mai salvato); poi giocaTutto({ da, a }).
   Il risultato è in window.__giocatore. Non fa parte del sito. */
(function () {
  'use strict';
  const A = window.ElekApp, U = window.ElekUnits, LG = window.ElekLogic, NS = window.ElekNum, CX = window.ElekCx;
  const R = window.__giocatore = { lezioni: 0, esercizi: 0, schede: 0, tipi: {}, errori: [], console: [], fuori: [], stelle: {}, fatto: false, corrente: null };
  window.addEventListener('error', (e) => R.console.push('errore: ' + e.message));
  window.addEventListener('unhandledrejection', (e) => R.console.push('promessa: ' + String(e.reason).slice(0, 200)));
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const click = (el, what) => { if (!el) throw new Error('elemento mancante: ' + what); el.click(); };
  // nessun elemento visibile deve uscire dalla larghezza della finestra
  function checkWidth(where) {
    const W = document.documentElement.clientWidth;
    let worst = null;
    for (const el of $$('#ov *')) {
      if (el.closest('.tbl-wrap, .mathbox, .mathin, .figure-box') && !el.matches('.tbl-wrap, .mathbox, .mathin, .figure-box')) continue; // riquadri che scorrono da soli
      const r = el.getBoundingClientRect();
      if (!r.width || r.right <= W + 1) continue;
      worst = el;
    }
    if (worst) { const r = worst.getBoundingClientRect(); R.fuori.push(`${where}: <${worst.tagName.toLowerCase()} class="${typeof worst.className === 'string' ? worst.className : ''}"> esce di ${Math.round(r.right - W)} px`); }
  }
  // accessibilità dello strato attivo: ogni comando ha un nome, ogni disegno una descrizione, bersagli di almeno 40 px, identificatori unici
  R.a11y = R.a11y || [];
  function checkA11y(where) {
    const layer = document.querySelector('#modal') || document.querySelector('#sheet') || document.querySelector('#ov') || document.querySelector('#app');
    const name = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim() || (el.id && layer.querySelector('label[for="' + el.id + '"]') ? 'etichetta' : '') || (el.closest('label') ? 'etichetta' : '');
    for (const el of layer.querySelectorAll('button, a[href], input, select, textarea')) {
      if (el.offsetParent === null && el.type !== 'checkbox') continue;
      if (!name(el)) R.a11y.push(where + ': comando senza nome <' + el.tagName.toLowerCase() + ' class="' + el.className + '">');
      const r = el.getBoundingClientRect();
      if (el.type !== 'checkbox' && el.tagName !== 'A' && !el.closest('.legend') && r.height && r.height < 39.5) R.a11y.push(where + ': bersaglio basso ' + Math.round(r.height) + ' px <' + el.tagName.toLowerCase() + ' class="' + el.className + '">');
    }
    for (const s of layer.querySelectorAll('svg')) if (!s.closest('[aria-hidden="true"]') && s.getAttribute('aria-hidden') !== 'true' && !(s.getAttribute('role') === 'img' && (s.getAttribute('aria-label') || '').length > 3)) R.a11y.push(where + ': disegno senza descrizione <svg class="' + (s.getAttribute('class') || '') + '">');
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    if (dup.length) R.a11y.push(where + ': identificatori ripetuti ' + [...new Set(dup)].join(', '));
    for (const m of layer.querySelectorAll('math')) if (!(m.getAttribute('alttext') || '').trim()) R.a11y.push(where + ': formula senza lettura');
  }
  // la risposta giusta, scritta come la scriverebbe uno studente
  function typedAnswer(it) {
    const sol = it.problem.sol;
    if (it.type === 'complesso') return it.problem.answerForm === 'polare' ? CX.fmtPolar(sol.z, sol.u || '') : CX.fmtRect(sol.z, sol.u || '');
    if (it.type === 'base') return sol.twos ? NS.toTwos(sol.v, sol.bits) : sol.bcd ? NS.toBCD(sol.v) : NS.toBase(sol.v, sol.base);
    if (it.type === 'espressione') {
      if (sol.expr && !sol.minimal) return LG.text(sol.expr);
      const vars = sol.vars || LG.varsOf(sol.expr);
      const mt = sol.minterms || LG.mintermsOf(sol.expr, vars);
      const m = sol.form === 'POS' ? LG.minimalPOS(mt, vars, sol.dc || []) : LG.minimalSOP(mt, vars, sol.dc || []);
      return LG.text(m.expr);
    }
    return sol.u ? U.fmt(sol.v, sol.u, { sig: 5 }) : U.num(sol.v, { sig: 5 });
  }
  async function answer(it) {
    const t = it.type, p = it.problem, sol = p.sol;
    if (t === 'scelta') click($(`#ovBody .opt[data-k="${it.choices.findIndex((c) => c.right)}"]`), 'opzione giusta');
    else if (t === 'bit') click($(`#ovBody .opt[data-k="${sol.v}"]`), 'bit giusto');
    else if (t === 'sequenza' || t === 'tabella') {
      const want = t === 'sequenza' ? String(sol.seq).split('').map(Number) : p.want;
      $$('#ovBody [data-act="bit"]').forEach((b) => { const k = +b.dataset.k; b.click(); if (want[k] === 1) b.click(); });
    } else if (t === 'kmap') sol.minterms.forEach((m) => click($(`#ovBody [data-act="cell"][data-m="${m}"]`), 'casella ' + m));
    else if (t === 'simula') {
      const ins = p.net.inputs;
      let combo = null;
      for (let m = 0; m < 1 << ins.length && !combo; m++) { const a = Object.fromEntries(ins.map((v, i) => [v, (m >> (ins.length - 1 - i)) & 1])); if (Object.values(LG.simulate(p.net, a).out)[0] === p.target) combo = a; }
      for (const v of ins) if (combo[v]) click($(`#ovBody [data-act="simIn"][data-v="${v}"]`), 'ingresso ' + v);
    } else if (t === 'abbina') {
      for (let i = 0; i < p.pairs.length; i++) { click($(`#ovBody [data-act="mL"][data-i="${i}"]`), 'sinistra'); click($(`#ovBody [data-act="mR"][data-i="${i}"]`), 'destra'); }
      return;
    } else if (t === 'ordina') for (let i = 0; i < it.steps.length; i++) click($(`#ovBody [data-act="ord"][data-i="${i}"]`), 'passaggio ' + i);
    else if (t === 'esperto') it.parts.forEach((s, k) => { const inp = $('#part' + k); inp.value = U.fmt(s.v, s.u, { sig: 5 }); inp.dispatchEvent(new Event('input', { bubbles: true })); });
    else { const inp = $('#typed'); if (!inp) throw new Error('casella della risposta mancante'); inp.value = typedAnswer(it); inp.dispatchEvent(new Event('input', { bubbles: true })); }
    await wait(5);
    const b = $('#checkBtn');
    if (!b) throw new Error('pulsante Controlla mancante');
    if (b.disabled) throw new Error('Controlla resta disattivato dopo la risposta');
    b.click();
  }
  async function playLesson(idx) {
    A.startLesson(idx, { teach: true });
    const id = A.FLAT[idx].lesson.id;
    for (let guard = 0; guard < 80; guard++) {
      const ses = A.ses();
      if (!ses) throw new Error('sessione chiusa prima della fine');
      if (ses.done) break;
      const it = ses.cur.it;
      const where = `${id} n. ${ses.i + 1} (${it.type}${it.gen ? ' ' + it.gen : ''})`;
      R.corrente = where;
      checkWidth(where);
      checkA11y(where);
      if (it.type === 'teach') { R.schede++; click($('#nextBtn'), 'Continua'); await wait(2); continue; }
      R.esercizi++; R.tipi[it.type] = (R.tipi[it.type] || 0) + 1;
      try { await answer(it); } catch (e) { R.errori.push(`${where}: ${e.message}`); }
      await wait(5);
      const aux = $('#aux');
      if (!A.cur().answered) {
        R.errori.push(`${where}: risposta non accettata come leggibile («${(($('#typed') || {}).value) || ''}»): ${aux ? aux.innerText.slice(0, 160) : ''}`);
        A.act('dunno');
        await wait(5);
      } else if (!A.cur().res.ok) R.errori.push(`${where}: risposta giusta rifiutata («${(($('#typed') || {}).value) || ''}»): ${$('#ovFoot').innerText.replace(/\s+/g, ' ').slice(0, 200)}`);
      checkWidth(where + ' dopo la verifica');
      checkA11y(where + ' dopo la verifica');
      click($('#nextBtn'), 'Continua dopo la verifica');
      await wait(2);
    }
    R.stelle[id] = A.S().course.stars[id] || 0;
    if (R.stelle[id] !== 3) R.errori.push(`${id}: finita con ${R.stelle[id]} stelle`);
    A.act('endSession');
    R.lezioni++;
  }
  // la palestra, con diverse posizioni nel percorso: i quattro livelli dei problemi di calcolo, ogni tipo, il ripasso, il glossario
  async function playSession(where) {
    for (let guard = 0; guard < 60; guard++) {
      const ses = A.ses();
      if (!ses || ses.done) break;
      const it = ses.cur.it;
      const w = `${where} n. ${ses.i + 1} (${it.type}${it.gen ? ' ' + it.gen : ''})`;
      checkWidth(w);
      R.esercizi++; R.tipi[it.type] = (R.tipi[it.type] || 0) + 1;
      try { await answer(it); } catch (e) { R.errori.push(`${w}: ${e.message}`); }
      await wait(5);
      if (!A.cur().answered) { R.errori.push(`${w}: risposta non accettata come leggibile`); A.act('dunno'); }
      else if (!A.cur().res.ok) R.errori.push(`${w}: risposta giusta rifiutata («${(($('#typed') || {}).value) || ''}»)`);
      checkWidth(w + ' dopo la verifica');
      click($('#nextBtn'), 'Continua');
      await wait(2);
    }
    if (A.ses()) A.act('endSession');
  }
  window.giocaPalestra = async function () {
    const cats = ['tutti', 'calcolo', 'schemi', 'logica', 'strumenti', 'glossario'];
    for (const at of [3, 20, 40, 60, 80, 100, 120, 135]) {
      A.set({ course: Object.assign(A.S().course, { unlocked: at }) });
      for (const level of [1, 2, 3, 4]) { A.S().prac.level = level; A.startPractice('calc'); if (A.ses()) await playSession(`palestra ${at} calcolo livello ${level}`); }
      for (const c of cats) { A.S().prac.category = c; A.S().prac.level = 2; A.startPractice('custom'); if (A.ses()) await playSession(`palestra ${at} ${c}`); }
      // un errore voluto, poi il ripasso
      A.S().prac.category = 'calcolo'; A.startPractice('custom');
      if (A.ses()) { A.act('dunno'); A.act('endSession'); }
      A.startPractice('review'); if (A.ses()) await playSession(`ripasso ${at}`);
    }
    for (const v of ['path', 'gym', 'lib', 'formulas', 'conv', 'words', 'me', 'topic:u4']) { A.setVIEW(v); await wait(5); checkA11y('vista ' + v); }
    R.fatto = true;
    return R;
  };
  window.giocaTutto = async function (o = {}) {
    const da = o.da || 0, a = Math.min(o.a ?? A.FLAT.length - 1, A.FLAT.length - 1);
    for (let i = da; i <= a; i++) {
      try { await playLesson(i); } catch (e) { R.errori.push(`${A.FLAT[i].lesson.id}: ${e.message}`); try { A.act('endSession'); } catch (x) { /* già chiusa */ } }
    }
    R.fatto = true;
    return R;
  };
})();
