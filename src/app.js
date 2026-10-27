/* ELEKTRON — interfaccia, parte 6: azioni, eventi, avvio. */

/* ---------- Azioni ---------- */
function rerenderKeep(focusSel) { const y = window.scrollY; render(); window.scrollTo(0, y); const b = focusSel && $(focusSel); if (b) b.focus({ preventScroll: true }); }
function act(name, el) { if (ACT[name]) ACT[name](el); }
const ACT = {
  tab: (el) => { VIEW = el.dataset.v; openStone = null; render(); window.scrollTo(0, 0); const m = $('#main'); if (m) m.focus({ preventScroll: true }); },
  jump: () => scrollToCurrent(),
  stone: (el) => { const i = +el.dataset.i; openStone = openStone === i ? null : i; rerenderKeep(`.stone[data-i="${i}"]`); },
  startLesson: (el) => { openStone = null; startLesson(+el.dataset.i); },
  startLessonTeach: (el) => { openStone = null; startLesson(+el.dataset.i, { teach: true }); },
  unlockUnit: (el) => { const ui = +el.dataset.u; askConfirm(`Aprire «${UNITS[ui].title}»? Fallo se l’hai già studiata in classe.`, 'Apri', () => { S.course.unlocked = Math.max(S.course.unlocked, firstLessonIdx(ui)); save(); openStone = null; render(); setTimeout(scrollToCurrent, 60); }); },
  goUnit: (el) => { VIEW = 'path'; render(); const u = $('#unit-' + el.dataset.u); if (u) u.scrollIntoView({ block: 'start' }); },
  topic: (el) => { VIEW = 'topic:' + el.dataset.t; openStone = null; render(); window.scrollTo(0, 0); },
  theory: (el) => { const id = el.dataset.t; const u = UNITS[unitIdx(id)]; if (!u) return; openSheet(u.title, viewTopic(id).replace(/<header class="page-head">[\s\S]*?<\/header>/, '')); },
  concept: (el) => conceptSheet(el.dataset.c),
  practice: (el) => startPractice(el.dataset.m),
  pracLevel: (el) => { S.prac.level = +el.dataset.v; save(); rerenderKeep(`[data-act="pracLevel"][data-v="${el.dataset.v}"]`); },
  methodSheet: () => methodSheet(),
  lab: () => labSheet(),
  labEl: (el) => { LAB.el = el.dataset.v; drawLab(); },
  labMode: (el) => { LAB.mode = el.dataset.v; LAB.range = el.dataset.v === 'V' ? 20 : 0.2; drawLab(); },
  labRange: (el) => { LAB.range = +el.dataset.v; drawLab(); },
  labVdiv: (el) => { LAB.vdiv = +el.dataset.v; drawLab(); },
  labTdiv: (el) => { LAB.tdiv = +el.dataset.v; drawLab(); },
  labSignal: () => { LAB.f = pick([250, 500, 1000, 2000, 2500]); LAB.Vp = pick([0.5, 1, 1.5, 2, 3, 4]); drawLab(); },
  quit: () => { const go = () => endSession(); if (SES && SES.i > 0 && !SES.done) askConfirm(SES.kind === 'lesson' ? 'Vuoi davvero uscire? I progressi di questa lezione andranno persi.' : 'Vuoi chiudere l’allenamento?', 'Esci', go, true, 'triste'); else go(); },
  modalOk: () => { const i = $('#mdIn'); const v = i ? i.value : true; const cb = modalCb; modalCb = null; closeModal(); if (cb) cb(v); },
  check: () => doCheck(),
  dunno: () => { const c = SES.cur; if (!c || c.answered) return; if (c.it.type === 'scelta' || c.it.type === 'bit') markOptions(false, (k) => (c.it.type === 'bit' ? k === c.it.problem.sol.v : c.it.choices[k].right)); finalize({ ok: false, note: 'Nessun problema: guarda lo svolgimento, poi lo rifai alla fine.' }); },
  next: () => { SES.i++; renderItem(); },
  retry: () => { const i = SES.idx; SES = null; closeOverlay(); startLesson(i, { teach: false }); },
  startReview: () => { SES = null; closeOverlay(); startPractice('review'); },
  endSession: () => endSession(),
  pick: (el) => pickOption(+el.dataset.k),
  key: (el) => insertKey(el.dataset.t, el.dataset.k),
  bit: (el) => toggleBit(el),
  cell: (el) => toggleCell(el),
  simIn: (el) => toggleSimInput(el),
  mL: (el) => matchStep('L', el),
  mR: (el) => matchStep('R', el),
  ord: (el) => orderStep(el),
  closeSheet: () => closeSheet(),
  closeModal: () => closeModal(),
  placement: () => placementSheet(),
  setPlace: (el) => {
    const before = S.course.unlocked, u = el.dataset.u || null;
    const apply = () => { placeAt(u); save(); closeSheet(); render(); window.scrollTo(0, 0); toast('Percorso aggiornato.'); };
    const ui = u ? unitIdx(u) : -1;
    const target = ui < 0 ? 0 : Math.min(FLAT.length - 1, lastLessonIdx(ui) + 1);
    if (target < before) { closeSheet(); askConfirm(ui < 0 ? 'Ricominciare dall’inizio? Le unità successive si richiudono; stelle e punti restano salvati.' : `Tornare a «${UNITS[Math.min(UNITS.length - 1, ui + 1)].title}»? Le unità successive si richiudono; stelle e punti restano salvati.`, 'Conferma', apply); }
    else apply();
  },
  goal: (el) => { S.goal = +el.dataset.v; save(); rerenderKeep(`[data-act="goal"][data-v="${el.dataset.v}"]`); },
  theme: (el) => { S.settings.theme = el.dataset.v; save(); applyTheme(); rerenderKeep(`[data-act="theme"][data-v="${el.dataset.v}"]`); },
  palette: (el) => { S.settings.palette = el.dataset.v; save(); applyTheme(); rerenderKeep(`[data-act="palette"][data-v="${el.dataset.v}"]`); },
  mascot: (el) => { S.settings.mascot = el.dataset.v; save(); rerenderKeep(`[data-act="mascot"][data-v="${el.dataset.v}"]`); },
  install: () => installFlow(),
  rename: () => askText('Il tuo nome (facoltativo)', S.name, (n) => { S.name = String(n).trim().slice(0, 16); save(); render(); }),
  saveCode: () => { S.backupAt = Date.now(); save(); codeSheet('save'); },
  restoreSheet: () => codeSheet('restore'),
  copyCode: () => {
    const el = $('#savecode'); if (!el) return;
    const done = () => toast('Codice copiato.');
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(el); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); toast('Codice selezionato: copialo con Copia.'); };
    try { navigator.clipboard.writeText(el.textContent.trim()).then(done, fallback); } catch (e) { fallback(); }
  },
  restoreCode: () => {
    const v = ($('#codeIn') || {}).value || '';
    const msg = $('#codeMsg');
    let part;
    try { part = SV.decode(v, LESSON_IDS(), BADGE_IDS(), ORDER); } catch (e) { if (msg) { msg.textContent = e.message; msg.classList.add('bad'); } return; }
    const go = () => applyRestore(part);
    if (S.onboarded && (S.xp || S.stats.lessons)) { closeSheet(); askConfirm('Sostituire i progressi di questo dispositivo con quelli del codice?', 'Ripristina', go); } else go();
  },
  export: () => { const blob = new Blob([JSON.stringify(S)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'elektron-progressi-' + dayKey() + '.json'; S.backupAt = Date.now(); save(); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Copia scaricata: conservala in un posto sicuro.'); },
  import: () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json,.json'; i.onchange = () => { const f = i.files[0]; if (!f) return; f.text().then((t) => { let d = null; try { d = JSON.parse(t); } catch (e) { /* non è JSON */ } const err = backupError(d); if (err) toast(err); else applyRestore(d); }); }; i.click(); },
  reset: () => askConfirm('Cancellare tutti i progressi da questo dispositivo?', 'Cancella', () => { try { localStorage.removeItem(KEY); } catch (e) { /* ignora */ } const keep = S.settings; S = DEFAULT(); S.settings.palette = keep.palette; S.settings.mascot = keep.mascot; onb = null; applyTheme(); render(); }, true, 'triste'),
  onbNext: () => { if (onb.step === 0) onb.name = ($('#nm').value || '').trim().slice(0, 16); onb.step++; drawOnb(); },
  onbBack: () => { onb.step--; drawOnb(); },
  onbCls: (el) => { onb.cls = +el.dataset.v; if (onb.place && UNITS[unitIdx(onb.place)].cls > onb.cls) onb.place = ''; drawOnb(); const b = $(`[data-act="onbCls"][data-v="${onb.cls}"]`); if (b) b.focus(); },
  onbPlace: (el) => { onb.place = el.dataset.u; drawOnb(); const b = $(`[data-act="onbPlace"][data-u="${onb.place}"]`); if (b) b.focus(); },
  onbGoal: (el) => { onb.goal = +el.dataset.v; drawOnb(); const b = $(`[data-act="onbGoal"][data-v="${onb.goal}"]`); if (b) b.focus(); },
  onbDone: () => { S.name = onb.name; S.goal = onb.goal; placeAt(onb.place || null); S.onboarded = true; save(); onb = null; VIEW = 'path'; render(); window.scrollTo(0, 0); },
};

/* ---------- Eventi ---------- */
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  if (ACT[el.dataset.act]) { ev.preventDefault(); ACT[el.dataset.act](el); }
});
document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.id === 'pracUnit') { S.prac.unit = t.value || null; save(); return; }
  if (t.id === 'pracCat') { S.prac.category = t.value; save(); return; }
  if (t.id === 'labK') { LAB.k = +t.value; LAB.el = null; drawLab(); return; }
  if (/^cc[123]$/.test(t.id)) { convUpdate(); return; }
  if (!t.dataset.set) return;
  const k = t.dataset.set;
  if (k === 'onlyDone') S.prac.onlyDone = t.checked;
  else S.settings[k] = t.checked;
  save();
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') { if ($('#modal')) closeModal(); else if ($('#sheet')) closeSheet(); else if (openStone != null) { openStone = null; rerenderKeep(); } return; }
  const typed = ev.target && ev.target.classList && ev.target.classList.contains('typed') && ev.target.closest('#ov');
  if (typed) {
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); if (SES && SES.cur && SES.cur.answered) { if ($('#nextBtn')) act('next'); } else { const b = $('#checkBtn'); if (b && !b.disabled) act('check'); } }
    return;
  }
  if (!SES || !$('#ov') || $('#modal') || $('#sheet')) return;
  if (ev.target.closest && ev.target.closest('input,textarea,select')) return;
  if (/^[1-5]$/.test(ev.key) && SES.cur && !SES.cur.answered && $$('#ovBody .opt').length >= +ev.key) { ev.preventDefault(); pickOption(+ev.key - 1); return; }
  if (ev.key === 'Enter' && !ev.target.closest('button')) {
    ev.preventDefault();
    if (SES.done) act('endSession');
    else if ((SES.cur.answered && $('#nextBtn')) || SES.cur.it.type === 'teach') act('next');
    else if (!SES.cur.answered) { const b = $('#checkBtn'); if (b && !b.disabled) act('check'); }
  }
});
document.addEventListener('input', (ev) => {
  const id = ev.target.id;
  if (id === 'fq') { FQ.q = ev.target.value.trim(); $('#fList').innerHTML = formulaRows(); return; }
  if (id === 'gq') { GQ.q = ev.target.value.trim(); $('#gList').innerHTML = termRows(); return; }
  if (['cvIn', 'cbIn', 'ccIn'].includes(id)) { convUpdate(); return; }
  if (SES && ev.target.closest('#ov')) syncCheck();
});
window.addEventListener('scroll', () => updateJump(), { passive: true });

/* ---------- Avvio ---------- */
// anteprima per le prove e le schermate: #demo=12&view=gym&theme=dark&pal=ardesia&mas=b (stato dimostrativo, mai salvato)
const HASH = Object.fromEntries(location.hash.slice(1).split('&').filter(Boolean).map((kv) => kv.split('=')));
function demoState(n) {
  const today = dayKey();
  const stars = {};
  FLAT.slice(0, n).forEach((f, i) => { stars[f.lesson.id] = 1 + ((i * 7 + 3) % 3 === 0 ? 1 : 2); });
  const days = {};
  [6, 5, 4, 3, 2, 1, 0].forEach((k, i) => { days[addDays(today, -k)] = [40, 0, 85, 60, 55, 90, 35][i]; });
  S = merge({ onboarded: true, name: 'Giulia', xp: 1240, streak: 5, lastDay: today, fuses: 1, days, goal: 50, course: { unlocked: n, stars, times: Object.fromEntries(Object.keys(stars).map((k) => [k, 1])) }, stats: { lessons: n, answered: 300, correct: 262, sessions: n + 4 } });
  S.badges = { coulomb: today, volta: today, henry: today, ampere: today };
  const g = {};
  X.GLOSSARY.slice(0, 30).forEach((t, i) => { g[t[0]] = { box: 1 + (i % 5), due: addDays(today, (i % 4) - 1) }; });
  S.glossary = g;
}
function boot() {
  if (HASH.seed) { let a = +HASH.seed; LS.init({ rand: () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } }); }
  if (HASH.demo != null) { NOSAVE = true; demoState(Math.min(FLAT.length - 1, +HASH.demo || 0)); if (HASH.view) VIEW = decodeURIComponent(HASH.view); }
  else if (HASH.onb != null) { NOSAVE = true; onb = { step: Math.min(2, +HASH.onb || 0), name: '', cls: 3, place: '', goal: 50 }; }
  else load();
  if (NOSAVE && HASH.theme) S.settings.theme = HASH.theme;
  if (HASH.pal && PALETTES.includes(HASH.pal)) S.settings.palette = HASH.pal;
  if (HASH.mas && G.CHOICES.some((c) => c.id === HASH.mas)) S.settings.mascot = HASH.mas;
  try { if (!NOSAVE && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* ignora */ }
  applyTheme();
  const mq = matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', applyTheme);
  render();
  if (NOSAVE && HASH.lesson != null) { startLesson(+HASH.lesson, { teach: true }); if (HASH.step) { SES.i = Math.min(SES.items.length - 1, +HASH.step); renderItem(); } }
  if (NOSAVE && HASH.practice) startPractice(HASH.practice);
  if (SITE && 'serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
}
// per la verifica automatica nel browser (_prove/giocatore.html)
window.ElekApp = { S: () => S, ses: () => SES, cur: () => SES && SES.cur, show: (i) => { if (SES) { SES.i = i; renderItem(); } }, startLesson, startPractice, FLAT, render, act, set: (o) => { Object.assign(S, o); save(); render(); }, setVIEW: (v) => { VIEW = v; render(); } };
// prima si mostra la schermata di avvio, poi si parte; in una scheda in secondo piano il primo disegno non arriva: si parte comunque
let booted = false;
const go = () => { if (!booted) { booted = true; boot(); } };
setTimeout(go, 0);
