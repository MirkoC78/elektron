/* ELEKTRON — interfaccia, parte 4: la sessione (lezione, prova, palestra, ripasso), la verifica con la spiegazione
   mirata dell'errore e lo svolgimento guidato, la fine con stelle e sblocchi, il ripasso del glossario. */

// punti per risposta giusta: una lezione completa vale circa 100 XP, gli obiettivi giornalieri (30–120) vanno da mezza lezione a poco più di una
const XP_BASE = { calc: 10, esperto: 16, complesso: 10, espressione: 10, kmap: 9, tabella: 8, simula: 7, ordina: 8, sequenza: 8, base: 8, abbina: 7, scelta: 6, bit: 5 };
let SES = null;

/* ---------- Avvio ---------- */
function startLesson(idx, o = {}) {
  const f = FLAT[idx];
  if (!f) return;
  const teach = o.teach ?? !S.course.times[f.lesson.id];
  const items = LS.buildLesson(f.lesson.id, { teach, avoid: S.recent.slice(-30) });
  // all'inizio di un'unità nuova la guida la presenta
  if (teach && f.li === 0 && f.unit.say) items.unshift({ type: 'teach', card: { say: f.unit.say }, intro: true, topic: f.unit.id });
  const sc = LS.scopeOf(f.lesson.id);
  begin({ kind: 'lesson', idx, items, title: f.lesson.title, test: !!f.lesson.test, prefixes: sc.prefixes, scope: sc });
}
const PRAC_N = 10;
function practiceScope() {
  const units = openUnits();
  const ui = FLAT[currentIdx()].ui;
  return { known: LS.knownForUnits(units), prefixes: ui >= ORDER.indexOf('u8') ? LS.ALL_PREFIXES : LS.knownForUnits(units).has('m.prefissi') ? ['', 'k', 'm'] : [''], num: 'free', bank: [], usedBank: new Set(), level: 2 };
}
function startPractice(mode) {
  const p = S.prac;
  const units = openUnits();
  if (mode === 'review') {
    const items = buildReview();
    if (!items.length) { toast('Nessun errore da ripassare: ottimo!'); return; }
    return begin({ kind: 'practice', mode, items, title: 'Ripasso degli errori', prefixes: practiceScope().prefixes });
  }
  if (mode === 'glossary' || (mode === 'custom' && p.category === 'glossario')) return startGlossaryDrill();
  const category = mode === 'calc' ? 'calcolo' : p.category;
  const r = LS.buildPractice({ units, unit: mode === 'calc' ? null : p.unit && units.has(p.unit) ? p.unit : null, category, level: p.level, onlyDone: p.onlyDone, n: PRAC_N });
  if (!r.items.length) { toast('Non ci sono ancora esercizi di questo tipo negli argomenti aperti.'); return; }
  if (r.relaxed) toastLater(`Negli argomenti aperti non ci sono ancora problemi di livello «${LEVEL_NAMES[p.level - 1]}»: questo allenamento è di livello «${LEVEL_NAMES[r.level - 1]}».`);
  begin({ kind: 'practice', mode, category, items: r.items, title: mode === 'calc' ? 'Problemi di calcolo' : 'Allenamento su misura', level: r.level, prefixes: practiceScope().prefixes });
  flushToasts();
}
const LEVEL_NAMES = ['Facile', 'Medio', 'Difficile', 'Esperto'];
// il ripasso rifà gli esercizi sbagliati con numeri nuovi, nello stesso perimetro della lezione in cui erano capitati
function buildReview() {
  const items = [];
  for (const m of S.mistakes.slice(-12).reverse()) {
    let it = null;
    if (m.q) it = { type: 'scelta', quiz: true, problem: { text: m.q[0], sol: { steps: [{ f: '"risposta"', s: '"' + String(m.q[1]).replace(/"/g, '') + '"' }] }, uses: [] }, choices: shuffle([{ label: m.q[1], right: true }].concat(m.q.slice(2).map((w) => ({ label: w, right: false })))) };
    else if (m.g) { try { it = LS.exercise(m.g, m.l && LS.BY_ID[m.l] ? LS.scopeOf(m.l) : practiceScope()); } catch (e) { it = null; } }
    if (it) { it.review = m; items.push(it); }
  }
  return items;
}
function begin(o) {
  const op = document.activeElement;
  SES = Object.assign({ opener: op && op.dataset ? { act: op.dataset.act, i: op.dataset.i } : null, backY: window.scrollY, i: 0, combo: 0, best: 0, xp: 0, ok: 0, ko: 0, start: Date.now(), cur: null, done: false, requeued: 0, prefixes: [''] }, o);
  openOverlay();
  renderItem();
}

/* ---------- La finestra della lezione ---------- */
function openOverlay() {
  closeOverlay();
  const ov = document.createElement('div');
  ov.className = 'overlay'; ov.id = 'ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', SES.title || 'Lezione');
  ov.innerHTML = `<div class="ov-head"><button class="iconbtn" data-act="quit" aria-label="Chiudi">${I.close}</button><progress class="bar" id="ovProg" max="100" value="0" aria-label="Avanzamento"></progress><div class="combo" id="combo" aria-live="polite"></div></div><div class="ov-inner"><div class="ov-body" id="ovBody"></div></div><div class="ov-foot" id="ovFootWrap"><div class="foot-in" id="ovFoot"></div></div>`;
  document.body.appendChild(ov);
  document.documentElement.classList.add('ov-open');
  layers();
}
function closeOverlay() { const o = $('#ov'); if (o) o.remove(); document.documentElement.classList.remove('ov-open'); layers(); }
function setProgress() { const b = $('#ovProg'); if (b) b.value = Math.max(3, Math.round(Math.min(1, SES.i / SES.items.length) * 100)); }
function setCombo() { const c = $('#combo'); if (c) c.innerHTML = SES.combo >= 2 ? I.flame + '<span>' + SES.combo + '</span><span class="sr"> risposte giuste di fila</span>' : ''; }
function renderItem() {
  const it = SES.items[SES.i];
  if (!it) return finishSession();
  setProgress(); setCombo();
  SES.cur = { it, answered: false, picked: null };
  const body = $('#ovBody');
  body.innerHTML = it.type === 'teach' ? renderTeach(it) : renderExercise(it) + '<div id="aux" class="aux" aria-live="polite"></div>';
  body.classList.remove('fx-in'); void body.offsetWidth; body.classList.add('fx-in');
  $('#ovFootWrap').className = 'ov-foot';
  renderFoot();
  const t = $('#typed') || $('#part0');
  if (t && !matchMedia('(pointer: coarse)').matches) t.focus({ preventScroll: true });
  else if (it.type !== 'teach') { const h = $('#ovBody .prompt'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
  $('.ov-inner').scrollTop = 0;
}
function renderTeach(it) {
  const f = SES.kind === 'lesson' ? FLAT[SES.idx] : null;
  const head = it.intro && f ? `<div class="teach-hero">${guide('contenta', 120)}<p class="note">Unità ${f.ui + 1}</p><h2>${esc(f.unit.title)}</h2></div>` : f ? `<p class="note">${esc(f.lesson.title)}</p>` : '';
  return `<div class="teach">${head}${it.intro ? `<div class="bubble big">${rich(it.card.say)}</div>` : cardHtml(it.card)}${exampleHtml(it.example)}</div>`;
}
function renderFoot() {
  const it = SES.cur.it;
  if (it.type === 'teach') { $('#ovFoot').innerHTML = `<button class="btn big block" data-act="next" id="nextBtn">Continua</button>`; setTimeout(() => { const n = $('#nextBtn'); if (n) n.focus({ preventScroll: true }); }, 60); return; }
  if (it.type === 'abbina') { $('#ovFoot').innerHTML = `<p class="foot-hint">Tocca una voce a sinistra, poi quella che le corrisponde a destra.</p>`; return; }
  const canSkip = !(SES.test);
  $('#ovFoot').innerHTML = `<div class="btns">${canSkip ? '<button class="btn ghost" data-act="dunno">Non lo so</button>' : ''}<button class="btn big" data-act="check" id="checkBtn" ${it.type === 'kmap' || it.type === 'simula' ? '' : 'disabled'}>Controlla</button></div>`;
}

/* ---------- Verifica ---------- */
function doCheck() {
  const c = SES.cur; if (!c || c.answered) return;
  const res = checkAnswer();
  if (!res) { toast('Rispondi prima di controllare.'); return; }
  // una risposta che non si legge (o ambigua, come 4.700) non conta: si chiede di riscriverla
  if (res.verdict === 'illeggibile') { $('#aux').innerHTML = say(esc(res.msg || 'Non riesco a leggere la risposta: riscrivila.'), 'pensierosa', 52); const t = $('#typed'); if (t) t.focus(); return; }
  finalize(res);
}
function finalize(res) {
  const c = SES.cur, it = c.it;
  c.answered = true; c.res = res;
  $$('#ovBody button:not(.tag), #ovBody input').forEach((b) => { if (b.tagName === 'INPUT') b.readOnly = true; else if (!b.closest('.fb-extra')) b.disabled = true; });
  S.stats.answered++;
  let gained = 0;
  if (res.ok) {
    SES.combo++; SES.best = Math.max(SES.best, SES.combo); SES.ok++; S.stats.correct++;
    gained = it.quiz ? 4 : (XP_BASE[it.type] || 8) + (SES.combo >= 3 ? 2 : 0);
    if (SES.kind === 'practice' && (it.type === 'calc' || it.type === 'esperto')) S.stats.calc++;
    if (it.gen === 'guasto') S.stats.faults++;
    if (it.review) S.mistakes = S.mistakes.filter((m) => m.at !== it.review.at);
    sfx.ok(); buzz(15);
  } else {
    SES.combo = 0; SES.ko++;
    addMistake(it);
    sfx.err(); buzz([30, 40, 30]);
    // l'esercizio sbagliato torna alla fine della lezione, con numeri nuovi quando si può
    if (SES.kind === 'lesson' && SES.requeued < 4 && !it.requeued && it.type !== 'abbina') {
      let again = null;
      if (it.gen && !it.quiz) { try { again = LS.exercise(it.gen, SES.scope); } catch (e) { again = null; } }
      again = again || Object.assign({}, it, { choices: it.choices ? shuffle(it.choices) : it.choices });
      SES.items.push(Object.assign(again, { requeued: true, quiz: it.quiz, lesson: it.lesson }));
      SES.requeued++;
    }
  }
  if (it.term) srsTerm(it.term, res.ok);
  if (it.problem && it.problem.text) S.recent = S.recent.filter((x) => x !== it.problem.text).concat([it.problem.text]).slice(-60);
  SES.xp += Math.round(gained);
  setCombo();
  save();
  showFeedback(res, Math.round(gained));
}
function addMistake(it) {
  let m = null;
  if (it.quiz && it.choices && !it.gen) m = { q: [it.problem.text, it.choices.find((c) => c.right).label].concat(it.choices.filter((c) => !c.right).map((c) => c.label)) };
  else if (it.gen && it.gen !== 'controllo') m = { g: it.gen, l: it.lesson || (SES.kind === 'lesson' ? FLAT[SES.idx].lesson.id : null) };
  if (!m) return;
  const sig = (a) => JSON.stringify(a.q || [a.g, a.l]);
  S.mistakes = S.mistakes.filter((a) => sig(a) !== sig(m)).concat([Object.assign(m, { at: Date.now() })]).slice(-40);
}
const CHEER = ['Esatto!', 'Giusto!', 'Ottimo!', 'Perfetto!', 'Bene così!'];
function showFeedback(res, gained) {
  const it = SES.cur.it;
  const p = it.problem;
  $('#ovFootWrap').className = 'ov-foot ' + (res.ok ? 'ok' : 'err');
  let body = '';
  const ans = answerText(it);
  if (res.ok) {
    body += `<h3>${pick(CHEER)}</h3>`;
    if (gained) body += `<p class="note">+${gained} XP${SES.combo >= 3 ? ', ' + SES.combo + ' di fila' : ''}</p>`;
    if (res.note) body += `<p class="note">${esc(res.note)}</p>`;
  } else {
    body += `<h3>${res.near ? 'Quasi!' : 'Non è giusto'}</h3>`;
    if (res.mistake && res.mistake.name) body += `<p class="mistake">Errore tipico: ${esc(res.mistake.name)}</p>`;
    if (res.msg) body += `<p class="note">${esc(res.msg)}</p>`;
    else if (res.near) body += '<p class="note">Il valore è vicino ma fuori tolleranza: forse hai arrotondato troppo presto. Tieni almeno tre cifre nei passaggi.</p>';
    if (res.note) body += `<p class="note">${esc(res.note)}</p>`;
    if (ans && !['scelta', 'bit'].includes(it.type)) body += `<p class="sol">${esc(ans)}</p>`;
  }
  const extra = [];
  const topic = (p && p.topic) || (SES.kind === 'lesson' ? FLAT[SES.idx].unit.id : null);
  if (!res.ok && topic) extra.push(`<button class="tool" data-act="theory" data-t="${topic}">${I.book}Teoria</button>`);
  $('#ovFoot').innerHTML = `<div class="fb-wrap"><div class="fb" role="status" aria-live="polite">${guide(res.ok ? 'contenta' : 'triste', 52)}<div class="fb-txt">${body}</div></div>${extra.length ? `<div class="fb-extra">${extra.join('')}</div>` : ''}</div>
    <button class="btn big block ${res.ok ? 'ok' : 'err'}" data-act="next" id="nextBtn">Continua</button>`;
  // la spiegazione mirata e lo svolgimento guidato, sotto l'esercizio (nella lezione: sempre dopo un errore; se è giusto, a richiesta)
  const steps = p && p.sol ? stepsHtml(p.sol) : '';
  const why = !res.ok && res.mistake && res.mistake.text ? say(rich(res.mistake.text), 'pensierosa', 52) : '';
  if (steps || why) {
    const sol = `<section class="card stack solution" aria-label="Svolgimento">${why}${steps ? `<h3>Svolgimento</h3>${steps}` : ''}</section>`;
    $('#aux').innerHTML = res.ok ? (steps ? `<details class="card"><summary>Vedi lo svolgimento</summary>${steps}</details>` : '') : sol;
    if (!res.ok) setTimeout(() => { const s = $('#aux .solution'); if (s) s.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }, 80);
  }
  setTimeout(() => { const n = $('#nextBtn'); if (n) n.focus({ preventScroll: true }); }, 60);
}

/* ---------- Fine ---------- */
function finishSession() {
  SES.done = true;
  const answered = SES.ok + SES.ko;
  const acc = answered ? SES.ok / answered : 1;
  const perfect = answered >= 4 && SES.ko === 0;
  let bonus = perfect ? 20 : 0;
  let stars = 0, ok = true, unlockedNew = null;
  if (SES.kind === 'lesson') {
    const f = FLAT[SES.idx];
    const id = f.lesson.id;
    ok = !SES.test || acc >= 0.7;
    stars = !ok ? 0 : acc >= 0.95 ? 3 : acc >= 0.8 ? 2 : 1;
    if (stars) S.course.stars[id] = Math.max(S.course.stars[id] || 0, stars);
    S.course.times[id] = (S.course.times[id] || 0) + 1;
    S.stats.lessons++;
    bonus += 10;
    if (ok && SES.idx + 1 > S.course.unlocked && SES.idx + 1 < FLAT.length) { S.course.unlocked = SES.idx + 1; unlockedNew = FLAT[SES.idx + 1]; }
  }
  const rankUp = addXP(SES.xp + bonus);
  if (answered > 0) touchStreak();
  S.stats.sessions++;
  if (perfect) S.stats.perfect++;
  if (SES.mode === 'review' && S.mistakes.length === 0 && answered > 0) S.stats.clearedReview++;
  const won = checkBadges();
  // promemoria del salvataggio: dopo la prima lezione e poi una volta alla settimana
  const nudge = SES.kind === 'lesson' && (S.stats.lessons === 1 || Date.now() - Math.max(S.backupAt || 0, S.nudgedAt || 0) > 7 * 864e5);
  if (nudge) S.nudgedAt = Date.now();
  save();
  setProgress();
  if (ok) { sfx.done(); if (SES.kind === 'lesson') confetti(); } else sfx.err();
  const mins = Math.max(1, Math.round((Date.now() - SES.start) / 60000));
  const goalDone = todayXP() >= S.goal;
  const starRow = SES.kind === 'lesson' && ok ? `<div class="bigstars" role="img" aria-label="${plural(stars, 'stella', 'stelle')} su 3">${[1, 2, 3].map((n) => I.star.replace('<svg', `<svg class="${n <= stars ? 'on' : ''}"`)).join('')}</div>` : '';
  const title = !ok ? 'Quasi!' : perfect ? 'Nessun errore!' : acc >= 0.8 ? 'Ottimo lavoro!' : SES.kind === 'lesson' ? 'Lezione completata' : 'Allenamento finito';
  const newUnit = unlockedNew && unlockedNew.ui !== FLAT[SES.idx].ui;
  const msg = !ok ? 'Per superare la prova serve il 70 % di risposte giuste. Rivedi gli errori e riprova: ci sei quasi.' : newUnit ? `Hai aperto l’unità «${unlockedNew.unit.title}».` : unlockedNew ? `Prossima lezione: «${unlockedNew.lesson.title}».` : acc >= 0.7 ? 'Continua così.' : 'Gli errori sono finiti nel ripasso: rifarli è il modo più rapido per imparare.';
  const rk = rankOf(S.xp);
  $('#ovBody').innerHTML = `<div class="finish fx-in">${guide(ok ? 'esultante' : 'pensierosa', 140)}<h2>${esc(title)}</h2>${starRow}<p>${esc(msg)}</p>
    <div class="stats3"><div class="stat c-star">${I.bolt}<b>+${SES.xp + bonus}</b><small>XP</small></div><div class="stat c-good">${I.check}<b>${Math.round(acc * 100)} %</b><small>Precisione</small></div><div class="stat c-pri">${I.clock}<b>${mins} min</b><small>Tempo</small></div></div>
    <p class="note">${goalDone ? `Obiettivo di oggi raggiunto: ${todayXP()} XP.` : `Oggi ${todayXP()} di ${S.goal} XP.`}</p>
    ${rankUp ? `<div class="card stack"><p class="note">Nuovo grado</p><b>${esc(rk.r.name)}</b></div>` : ''}
    ${won.map((b) => `<div class="card row">${medal(b, true)}<div class="grow"><b>Insegna «${esc(b.name)}»</b><p class="note">${esc(b.desc)}</p></div></div>`).join('')}
    ${nudge ? `<div class="card stack"><b>Metti al sicuro i tuoi progressi</b><p class="note">Si salvano da soli su questo dispositivo. Con il codice di salvataggio li ritrovi anche su un altro telefono.</p><div><button class="btn small ghost" data-act="saveCode">Mostra il codice</button></div></div>` : ''}</div>`;
  $('#aux') && $('#aux').remove();
  $('#ovFootWrap').className = 'ov-foot';
  const again = !ok && SES.kind === 'lesson' ? '<button class="btn big ghost" data-act="retry">Riprova</button>' : S.mistakes.length && SES.kind === 'practice' && SES.mode !== 'review' ? '<button class="btn big ghost" data-act="startReview">Ripassa gli errori</button>' : '';
  $('#ovFoot').innerHTML = `<div class="btns">${again}<button class="btn big ${ok ? 'ok' : ''}" data-act="endSession">Continua</button></div>`;
  setTimeout(() => { const b = $('#ovFoot .btn:last-child'); if (b) b.focus(); }, 60);
}
function endSession() {
  const y = SES ? SES.backY : 0, op = SES && SES.opener;
  SES = null; closeOverlay(); render(); window.scrollTo(0, y);
  const back = op && op.act && ($(`[data-act="${op.act}"]${op.i != null ? `[data-i="${op.i}"]` : ''}`) || $('.resume .btn'));
  (back || $('#main')).focus({ preventScroll: true });
  flushToasts();
}

/* ---------- Glossario: ripetizione dilazionata ---------- */
const BOX_DAYS = [0, 1, 3, 7, 14, 30];
// un solo passo avanti al giorno per termine; un errore lo riporta alla prima scatola
function srsTerm(it, ok) {
  const today = dayKey();
  const v = S.glossary[it] || { box: 0, due: today };
  if (!ok) { v.box = 1; v.due = addDays(today, BOX_DAYS[1]); v.last = today; }
  else if (v.last !== today) { v.box = Math.min(5, v.box + 1); v.due = addDays(today, BOX_DAYS[v.box]); v.last = today; }
  S.glossary[it] = v;
}
// termini incontrati: quelli delle unità già aperte
const metTerms = () => { const open = openUnits(); return X.GLOSSARY.filter((g) => open.has(g[2])); };
const termDue = (it) => !!S.glossary[it] && S.glossary[it].due <= dayKey();
function glossaryQueue() {
  const all = metTerms();
  const due = all.filter((g) => termDue(g[0]));
  const fresh = all.filter((g) => !S.glossary[g[0]]).slice(0, Math.max(0, 8 - due.length));
  return { all, due, fresh };
}
function startGlossaryDrill() {
  const q = glossaryQueue();
  if (q.all.length < 4) { toast('Per il glossario servono almeno quattro termini: fai qualche lezione in più.'); return; }
  const words = shuffle(q.due).concat(q.fresh);
  if (words.length < 4) words.push(...shuffle(q.all.filter((g) => !words.includes(g))).slice(0, 6 - words.length));
  const items = [];
  for (const g of words.slice(0, 8)) {
    const toEn = Math.random() < 0.6;
    const others = shuffle(q.all.filter((x) => x !== g)).slice(0, 3);
    const text = toEn ? `Come si dice in inglese «${g[0]}»?` : `Che cosa vuol dire «${g[1]}»?`;
    items.push({ type: 'scelta', term: g[0], quiz: false, problem: { text, sol: { steps: [{ f: `"${g[0]}"`, s: `"${g[0]} = ${g[1]}: ${g[3]}"` }] }, uses: [], topic: g[2] }, choices: shuffle([{ label: toEn ? g[1] : g[0], right: true }].concat(others.map((o) => ({ label: toEn ? o[1] : o[0], right: false })))) });
  }
  const pairs = shuffle(words).slice(0, 4).map((g) => ({ a: g[0], b: g[1] }));
  if (pairs.length >= 3) items.splice(Math.ceil(items.length / 2), 0, { type: 'abbina', problem: { text: 'Abbina ogni termine italiano a quello inglese.', pairs, sol: { steps: [] }, uses: [] } });
  begin({ kind: 'practice', mode: 'glossary', items, title: 'Glossario italiano–inglese', prefixes: [''] });
}
