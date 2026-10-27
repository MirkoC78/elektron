/* ELEKTRON — interfaccia, parte 1: riferimenti al motore, utilità, icone, stato e salvataggio, progressi, suoni, avvisi,
   fogli e finestre. I file ui-*.js e app.js si leggono in quest'ordine nello stesso script (build.js). */
const U = window.ElekUnits, MA = window.ElekMath, SCH = window.ElekSchematic, TPL = window.ElekTemplates, GT = window.ElekGates;
const PL = window.ElekPlots, LG = window.ElekLogic, AN = window.ElekAnswers, MI = window.ElekMistakes, CO = window.ElekConcepts;
const LS = window.ElekLessons, X = window.ELEK_EXTRAS, SV = window.ElekSave, CX = window.ElekCx, NS = window.ElekNum, G = window.ELEK_GUIDE;
const UNITS = LS.UNITS, FLAT = LS.FLAT, ORDER = LS.ORDER;
const SITE = !!window.ELEK_SITE;

/* ---------- Utilità ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function dayKey(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function addDays(k, n) { const [y, m, d] = k.split('-').map(Number); return dayKey(new Date(y, m - 1, d + n)); }
function daysBetween(a, b) { const [y1, m1, d1] = a.split('-').map(Number); const [y2, m2, d2] = b.split('-').map(Number); return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 864e5); }
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/* ---------- Icone (tratto uniforme, 24 × 24) ---------- */
const svg = (d, o = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${o}>${d}</svg>`;
const I = {
  path: svg('<path d="M4 18h5v-6h6V6h5"/><circle cx="4" cy="18" r="1.6" fill="currentColor"/><circle cx="20" cy="6" r="1.6" fill="currentColor"/>'),
  gym: svg('<path d="M3 12h3l2-6 4 12 3-9 2 3h4"/>'),
  books: svg('<path d="M5 4h4v16H5zM10 4h4v16h-4z"/><path d="m15.5 5 3.6-.9 2.4 15.5-3.6.9z"/>'),
  words: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h4M7 14h7M15 10h2"/>'),
  me: svg('<circle cx="12" cy="8" r="3.6"/><path d="M5 20c1-3.7 3.7-5.6 7-5.6s6 1.9 7 5.6"/>'),
  flame: svg('<path d="M12.5 3c.4 2.8-1.1 4.4-2.5 6S7 12 7 14.8C7 18.2 9.3 21 12.3 21c3.3 0 5.7-2.6 5.7-6.1 0-2.5-1.3-4.4-2.6-5.6.1 1.6-.5 2.9-1.6 3.5.4-3.4-.4-6.6-1.3-8.8Z" fill="currentColor" stroke="none"/>'),
  bolt: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/>'),
  star: svg('<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z" fill="currentColor" stroke="none"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  book: svg('<path d="M4 5.5C7 4.5 10 4.5 12 6.5c2-2 5-2 8-1V19c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6.5V20"/>'),
  trophy: svg('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4v3h-4z"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 'stroke-width="3"'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>', 'stroke-width="2.4"'),
  back: svg('<path d="M15 6 9 12l6 6"/>'),
  chev: svg('<path d="m9 6 6 6-6 6"/>', 'class="chev"'),
  lens: svg('<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/>'),
  table: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/>'),
  cards: svg('<rect x="6" y="3.5" width="13" height="16" rx="2" transform="rotate(8 12 12)"/><rect x="4" y="5" width="13" height="16" rx="2"/>'),
  retry: svg('<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>'),
  bulb: svg('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>'),
  method: svg('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>'),
  globe: svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5Z"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  match: svg('<path d="M4 7h6M4 12h6M4 17h6M14 7h6M14 12h6M14 17h6"/>'),
  download: svg('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/>'),
  calc: svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h4"/>'),
  meter: svg('<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8" y="6" width="8" height="4" rx="1"/><circle cx="12" cy="15.5" r="2.6"/>'),
  scope: svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M5 11c1.5-4 3-4 4.5 0s3 4 4.5 0 3-4 4.5 0M9 21h6M12 17v4"/>'),
  gate: svg('<path d="M4 8h4M4 16h4M8 5h5a7 7 0 0 1 0 14H8z"/><path d="M20 12h-1"/>'),
  fuse: svg('<rect x="6" y="9" width="12" height="6" rx="1.5"/><path d="M2 12h4M18 12h4M8 12c1.3-2 2.7 2 4 0s2.7 2 4 0"/>'),
  swap: svg('<path d="M4 8h13l-3-3M20 16H7l3 3"/>'),
  warn: svg('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5M12 17.5h.01"/>'),
  info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>'),
  copy: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
};
// il marchio: un nodo con tre conduttori, nei colori del tema
const MARK = '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 16h9M19 16h9M16 4v9" fill="none" stroke="var(--pri)" stroke-width="3.2" stroke-linecap="round"/><circle cx="16" cy="16" r="5.2" fill="var(--acc)"/></svg>';

/* ---------- La guida ---------- */
const guide = (mood = 'normale', size = 96) => G.svg(mood, size, S.settings.mascot);
const say = (text, mood = 'normale', size = 72) => `<div class="say">${guide(mood, size)}<div class="bubble">${text}</div></div>`;

/* ---------- Stato ---------- */
// le chiavi del dispositivo iniziano con «elektron.»: sullo stesso dominio ci sono altre app
const KEY = 'elektron.v1';
const PALETTES = ['rame', 'ardesia', 'viola'];
const DEFAULT = () => ({
  v: 1, onboarded: false, name: '', goal: 50, xp: 0, days: {}, streak: 0, lastDay: null, fuses: 0,
  badges: {}, mistakes: [], glossary: {}, recent: [], backupAt: 0, savedAt: 0, nudgedAt: 0,
  course: { unlocked: 0, stars: {}, times: {} },
  prac: { level: 2, onlyDone: true, category: 'tutti', unit: null },
  stats: { lessons: 0, answered: 0, correct: 0, calc: 0, faults: 0, minimal: 0, sessions: 0, perfect: 0, clearedReview: 0 },
  settings: { sound: true, keypad: true, online: true, theme: 'auto', palette: 'rame', mascot: 'a' },
});
let S = DEFAULT();
function merge(d) {
  const def = DEFAULT();
  return Object.assign(def, d, { stats: Object.assign(def.stats, d.stats || {}), settings: Object.assign(def.settings, d.settings || {}), course: Object.assign(def.course, d.course || {}), prac: Object.assign(def.prac, d.prac || {}) });
}
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) S = merge(JSON.parse(raw)); } catch (e) { /* archiviazione non disponibile */ }
}
let saveFailed = false, NOSAVE = false;
function save() { S.savedAt = Date.now(); if (NOSAVE) return; try { localStorage.setItem(KEY, JSON.stringify(S)); saveFailed = false; } catch (e) { saveFailed = true; } }
function applyTheme() {
  const r = document.documentElement;
  if (S.settings.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.settings.theme);
  r.setAttribute('data-palette', PALETTES.includes(S.settings.palette) ? S.settings.palette : 'rame');
  const m = $('meta[name="theme-color"]');
  if (m) m.content = getComputedStyle(r).getPropertyValue('--bg').trim() || '#F5F2EC';
}

/* ---------- Percorso: sblocchi ---------- */
const unitIdx = (id) => UNITS.findIndex((u) => u.id === id);
const firstLessonIdx = (ui) => FLAT.findIndex((f) => f.ui === ui);
const lastLessonIdx = (ui) => FLAT.map((f) => f.ui).lastIndexOf(ui);
// colloca lo studente: le unità fino a quella indicata sono aperte, si riparte dalla successiva; le stelle restano
function placeAt(unitId) {
  const ui = unitId ? unitIdx(unitId) : -1;
  S.course.unlocked = ui < 0 ? 0 : Math.min(FLAT.length - 1, lastLessonIdx(ui) + 1);
}
const isUnlocked = (idx) => idx <= S.course.unlocked;
const currentIdx = () => Math.min(S.course.unlocked, FLAT.length - 1);
// unità aperte: fino a quella della lezione attuale
const openUnits = () => new Set(UNITS.slice(0, FLAT[currentIdx()].ui + 1).map((u) => u.id));
const unitDone = (ui) => (S.course.stars[FLAT[lastLessonIdx(ui)].lesson.id] || 0) > 0;
const doneUnits = () => UNITS.filter((u, ui) => unitDone(ui)).length;

/* ---------- Progressi ---------- */
const todayXP = () => S.days[dayKey()] || 0;
// la serie: i giorni di fila con almeno un esercizio; un fusibile di riserva salta al posto della serie se manca un giorno
function effectiveStreak() {
  if (!S.lastDay) return 0;
  const gap = daysBetween(S.lastDay, dayKey());
  if (gap <= 1) return S.streak;
  return gap - 1 <= S.fuses ? S.streak : 0;
}
function touchStreak() {
  const today = dayKey();
  if (S.lastDay === today) return false;
  const gap = S.lastDay ? daysBetween(S.lastDay, today) : 99;
  if (gap === 1) S.streak++;
  else if (gap > 1 && gap - 1 <= S.fuses) { S.fuses -= gap - 1; S.streak++; toastLater(`${gap - 1 === 1 ? 'Un fusibile di riserva è saltato' : `${gap - 1} fusibili di riserva sono saltati`} al posto della tua serie.`); }
  else S.streak = 1;
  S.lastDay = today;
  if (S.streak > 0 && S.streak % 7 === 0 && S.fuses < 2) { S.fuses++; toastLater('Nuovo fusibile di riserva: protegge la serie se salti un giorno.'); }
  return true;
}
function rankOf(xp) { let i = 0; X.RANKS.forEach((r, k) => { if (xp >= r.xp) i = k; }); return { i, r: X.RANKS[i], next: X.RANKS[i + 1] || null }; }
function addXP(n) { const before = rankOf(S.xp).i; S.xp += n; const k = dayKey(); S.days[k] = (S.days[k] || 0) + n; return rankOf(S.xp).i > before; }
const passed = (id) => (S.course.stars[id] || 0) > 0;
const learnedTerms = () => Object.values(S.glossary).filter((v) => v.box >= 3).length;
// le condizioni delle insegne (nomi e descrizioni in extras.js)
const BADGE_TEST = {
  coulomb: () => S.stats.lessons >= 1, volta: () => passed('u1t'), ohm: () => passed('u3t'), kirchhoff: () => passed('u6t'),
  thevenin: () => passed('u7t'), faraday: () => passed('u8t'), boole: () => passed('u11t'), maxwell: () => passed('u14t'),
  shockley: () => passed('u18t'), shannon: () => passed('u23t'), faggin: () => doneUnits() >= UNITS.length,
  ampere: () => S.stats.correct >= 100, joule: () => S.stats.correct >= 500, hertz: () => S.streak >= 7, tesla: () => S.streak >= 30,
  henry: () => S.stats.perfect >= 1, marconi: () => S.stats.calc >= 50, galvani: () => S.stats.faults >= 10, karnaugh: () => S.stats.minimal >= 20,
  bode: () => S.stats.clearedReview >= 1, kilby: () => learnedTerms() >= 50,
};
function checkBadges() {
  const won = [];
  for (const b of X.BADGES) if (!S.badges[b.id] && BADGE_TEST[b.id] && BADGE_TEST[b.id]()) { S.badges[b.id] = dayKey(); won.push(b); }
  return won;
}

/* ---------- Suoni, vibrazione, avvisi ---------- */
let actx = null;
function tone(freqs, dur = 0.12, type = 'sine', gain = 0.05) {
  if (!S.settings.sound) return;
  // il browser permette l'audio solo dopo un tocco dello studente
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    let t = actx.currentTime;
    for (const f of freqs) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f; g.gain.value = gain;
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur); t += dur * 0.8;
    }
  } catch (e) { /* audio non disponibile */ }
}
const sfx = { ok: () => tone([660, 880]), err: () => tone([220, 180], 0.16, 'triangle'), done: () => tone([523, 659, 784, 1046], 0.14), tap: () => tone([440], 0.04, 'sine', 0.02), match: () => tone([740], 0.07) };
// la vibrazione è permessa solo durante un tocco reale (e non dentro i riquadri incorporati)
function buzz(p) { try { if (navigator.vibrate && window.top === window && (!navigator.userActivation || navigator.userActivation.isActive)) navigator.vibrate(p); } catch (e) { /* ignora */ } }
let toastTimer = null;
function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3400);
}
const pendingToasts = [];
const toastLater = (m) => pendingToasts.push(m);
function flushToasts() { if (pendingToasts.length) { toast(pendingToasts.shift()); if (pendingToasts.length) setTimeout(flushToasts, 3600); } }
// coriandoli discreti, nei colori dei gruppi di unità; con il movimento ridotto non compaiono
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; c.setAttribute('aria-hidden', 'true');
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 3000);
  const dpr = window.devicePixelRatio || 1; c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const cs = getComputedStyle(document.documentElement);
  const cols = ['--g-1', '--g-2', '--g-3', '--g-4', '--star'].map((v) => cs.getPropertyValue(v).trim());
  const P = Array.from({ length: 60 }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 160, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 3, w: Math.random() * 8 + 6, c: pick(cols), a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3 }));
  let f = 0;
  (function step() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of P) { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -1.5, p.w, 3); ctx.restore(); }
    if (++f < 100) requestAnimationFrame(step); else c.remove();
  })();
}

/* ---------- Strati, fogli e finestre ---------- */
// solo lo strato più in alto (finestra, foglio, lezione, app) risponde alla tastiera e ai lettori di schermo
function layers() {
  const L = ['#app', '#ov', '#sheet', '#modal'].map((s) => $(s)).filter(Boolean);
  L.forEach((el, i) => { el.inert = i < L.length - 1; });
  const skip = $('.skip'); if (skip) skip.inert = L.length > 1;
}
// chiudendo un foglio o una finestra, il focus torna al pulsante che li aveva aperti
const focusBack = [];
function rememberFocus() { focusBack.push(document.activeElement); }
function restoreFocus() { const el = focusBack.pop(); if (el && el.isConnected && !el.closest('[inert]')) el.focus({ preventScroll: true }); }
function openSheet(title, html) {
  closeSheet();
  rememberFocus();
  const bg = document.createElement('div');
  bg.id = 'sheet';
  bg.innerHTML = `<div class="sheet-veil" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-in"><div class="sheet-head"><h2>${esc(title)}</h2><button class="iconbtn" data-act="closeSheet" aria-label="Chiudi">${I.close}</button></div>${html}</div></div>`;
  document.body.appendChild(bg);
  layers();
  setTimeout(() => { const b = $('#sheet .sheet-head .iconbtn'); if (b) b.focus(); }, 30);
}
function closeSheet() { const s = $('#sheet'); if (!s) return; s.remove(); layers(); restoreFocus(); }
function showModal(html) {
  closeModal();
  rememberFocus();
  const bg = document.createElement('div');
  bg.id = 'modal';
  bg.innerHTML = `<div class="modal-veil" data-act="closeModal"></div><div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(bg);
  layers();
  setTimeout(() => { const b = $('#modal .btn:last-of-type') || $('#modal button'); if (b) b.focus(); }, 30);
}
function closeModal() { const m = $('#modal'); if (!m) return; m.remove(); layers(); restoreFocus(); }
let modalCb = null;
function askConfirm(text, okLabel, cb, danger, mood = 'pensierosa') { modalCb = cb; showModal(`${guide(mood, 88)}<h2>${esc(text)}</h2><div class="btns"><button class="btn ghost" data-act="closeModal">Annulla</button><button class="btn ${danger ? 'err' : ''}" data-act="modalOk">${esc(okLabel)}</button></div>`); }
function askText(label, value, cb) { modalCb = cb; showModal(`<div class="field"><label for="mdIn">${esc(label)}</label><input id="mdIn" class="typed" maxlength="16" autocomplete="off" value="${esc(value)}"></div><div class="btns"><button class="btn ghost" data-act="closeModal">Annulla</button><button class="btn" data-act="modalOk">Salva</button></div>`); setTimeout(() => { const i = $('#mdIn'); if (i) i.focus(); }, 40); }
