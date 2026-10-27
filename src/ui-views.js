/* ELEKTRON — interfaccia, parte 5: le viste. Percorso, palestra, teoria (con metodo, formulario e convertitore),
   glossario, profilo con il salvataggio, benvenuto e posizione nel percorso. Si mostra solo ciò che lo studente ha già aperto. */
let VIEW = 'path';
let openStone = null;
const NAV = [['path', I.path, 'Percorso'], ['gym', I.gym, 'Palestra'], ['lib', I.books, 'Teoria'], ['words', I.words, 'Glossario'], ['me', I.me, 'Profilo']];
const CLASS_COLOR = { 3: 'g-1', 4: 'g-2', 5: 'g-3' };
function render() {
  if (!S.onboarded) return drawOnb();
  const app = $('#app');
  const st = effectiveStreak();
  const v = VIEW;
  const view = v.startsWith('topic:') ? viewTopic(v.slice(6)) : v === 'formulas' ? viewFormulas() : v === 'conv' ? viewConverter() : v === 'path' ? viewPath() : v === 'gym' ? viewGym() : v === 'lib' ? viewLibrary() : v === 'words' ? viewWords() : viewMe();
  const cur = v.startsWith('topic:') || v === 'formulas' || v === 'conv' ? 'lib' : v;
  const nav = NAV.map(([k, ic, t]) => `<button data-act="tab" data-v="${k}" ${cur === k ? 'aria-current="page"' : ''}>${ic}<span>${t}</span></button>`).join('');
  app.innerHTML = `<div class="shell"><nav class="rail" aria-label="Sezioni"><div class="brand">${MARK}<b>ELEKTRON</b></div>${nav}</nav>
    <main class="main" id="main" tabindex="-1"><header class="topbar"><div class="bar-in"><div class="brand">${MARK}<b>ELEKTRON</b></div>
      <div class="chips"><span class="chip streak ${st ? '' : 'off'}" title="Giorni di fila">${I.flame}${st}<span class="sr"> giorni di fila</span></span><span class="chip xp" title="Punti esperienza">${I.bolt}${S.xp}<span class="sr"> XP</span></span></div></div></header>
      <div class="view">${view}</div></main>
    <aside class="side" aria-label="I tuoi progressi">${sidePanel()}</aside></div>
    <nav class="tabs" aria-label="Sezioni">${nav}</nav>`;
  if (v === 'conv') convUpdate();
  setTimeout(updateJump, 0);
}

/* ---------- Pannello dei progressi ---------- */
function ringSvg(p, label) {
  const r = 27, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, p));
  return `<svg class="ring" viewBox="0 0 66 66" width="66" height="66" role="img" aria-label="${esc(label)}"><circle class="ring-bg" cx="33" cy="33" r="${r}"/><circle class="ring-fg${v >= 1 ? ' full' : ''}" cx="33" cy="33" r="${r}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - v)).toFixed(2)}" transform="rotate(-90 33 33)"/><text class="ring-t" x="33" y="38" text-anchor="middle">${Math.round(v * 100)}%</text></svg>`;
}
const factOfDay = () => { const n = daysBetween('2026-01-01', dayKey()); return X.FACTS[((n % X.FACTS.length) + X.FACTS.length) % X.FACTS.length]; };
function goalCard() {
  const x = todayXP();
  return `<section class="card goal">${ringSvg(x / S.goal, `Obiettivo di oggi: ${x} su ${S.goal} XP`)}<div class="grow stack"><b>Obiettivo di oggi</b><span class="note">${x >= S.goal ? 'Raggiunto: ogni XP in più è un regalo.' : `${x} di ${S.goal} XP`}</span></div></section>`;
}
function factCard() { const f = factOfDay(); return `<section class="card fact"><span class="k">Curiosità del giorno</span><p>${esc(f[0])}</p><p class="note">${esc(f[1])}</p></section>`; }
function sidePanel() {
  const st = effectiveStreak();
  const rk = rankOf(S.xp);
  const pct = rk.next ? Math.round(((S.xp - rk.r.xp) / (rk.next.xp - rk.r.xp)) * 100) : 100;
  return `${goalCard()}
    <section class="card row">${I.flame}<div class="grow"><b>${plural(st, 'giorno', 'giorni')} di fila</b><p class="note">${S.fuses ? `${plural(S.fuses, 'fusibile di riserva protegge', 'fusibili di riserva proteggono')} la serie` : 'Ogni 7 giorni di fila guadagni un fusibile di riserva'}</p></div></section>
    <section class="card stack"><p class="note">Grado</p><b>${esc(rk.r.name)}</b><progress class="bar" max="100" value="${pct}" aria-label="Avanzamento verso il grado successivo"></progress><p class="note">${rk.next ? `${rk.next.xp - S.xp} XP a ${esc(rk.next.name)}` : 'Grado più alto'}</p></section>
    ${factCard()}`;
}

/* ---------- Percorso ---------- */
function viewPath() {
  const cur = currentIdx();
  const cf = FLAT[cur];
  const greet = S.name ? `Ciao, ${esc(S.name)}!` : 'Ciao!';
  const ul = cf.unit.lessons.length, li = cf.li + 1;
  const doneInUnit = cf.unit.lessons.filter((l) => S.course.stars[l.id]).length;
  let h = `<h1 class="sr">Percorso</h1><section class="resume" aria-label="Lezione attuale"><div class="resume-top">${guide('contenta', 76)}<div class="resume-txt"><p class="note">${greet} ${S.course.times[cf.lesson.id] ? 'Ripassiamo questa lezione.' : 'Si riparte da qui.'}</p><h2>${esc(cf.lesson.title)}</h2><p class="note">Unità ${cf.ui + 1}, ${esc(cf.unit.title)}: ${cf.lesson.test ? 'prova finale' : `lezione ${li} di ${ul - 1}`}</p></div></div>
    <progress class="bar" max="${ul}" value="${doneInUnit}" aria-label="Lezioni completate nell’unità: ${doneInUnit} su ${ul}"></progress>
    <div class="btns"><button class="btn big" data-act="startLesson" data-i="${cur}">${cf.lesson.test ? 'Inizia la prova' : S.course.times[cf.lesson.id] ? 'Ripeti' : 'Continua'}</button></div></section>`;
  h += `<div class="only-narrow sec stack">${goalCard()}</div>`;
  let lastCls = 0;
  UNITS.forEach((u, ui) => {
    if (u.cls !== lastCls) { lastCls = u.cls; h += `<h2 class="sec-title class-title">Classe ${u.cls}ª</h2>`; }
    const fi = firstLessonIdx(ui);
    const locked = !isUnlocked(fi);
    h += `<section class="unit ${CLASS_COLOR[u.cls]}${locked ? ' locked' : ''}" id="unit-${u.id}" aria-label="Unità ${ui + 1}: ${esc(u.title)}"><div class="unit-head"><span class="unum" aria-hidden="true">${ui + 1}</span><div class="t"><small>Unità ${ui + 1}</small><b>${esc(u.title)}</b></div>${locked ? '' : `<button class="iconbtn" data-act="topic" data-t="${u.id}" aria-label="Teoria: ${esc(u.title)}" title="Teoria">${I.book}</button>`}</div><ol class="via">`;
    u.lessons.forEach((l, k) => {
      const idx = fi + k;
      const st = S.course.stars[l.id] || 0;
      const unlocked = isUnlocked(idx);
      const isCur = idx === cur;
      const cls = ['stone', l.test ? 'test' : '', !unlocked ? 'locked' : st ? 'done' : '', isCur ? 'current' : ''].filter(Boolean).join(' ');
      const mark = !unlocked ? I.lock : st && !isCur ? (l.test ? I.trophy : I.check) : l.test ? I.trophy : `<span>${k + 1}</span>`;
      const stars = !l.test && st ? `<span class="stars" aria-hidden="true">${[1, 2, 3].map((n) => I.star.replace('<svg', `<svg class="${n <= st ? 'on' : ''}"`)).join('')}</span>` : '';
      h += `<li><button class="${cls}" data-act="stone" data-i="${idx}" aria-expanded="${openStone === idx}" aria-label="${esc(l.title)}${l.test ? ', prova' : ''}${!unlocked ? ', bloccata' : st ? `, ${plural(st, 'stella', 'stelle')}` : ''}${isCur ? ', lezione attuale' : ''}"><span class="mile" aria-hidden="true">${mark}</span><span class="info"><b>${esc(l.title)}</b>${l.sub ? `<span>${rich(l.sub)}</span>` : ''}${stars}</span></button>${openStone === idx ? stonePop(idx) : ''}</li>`;
    });
    h += '</ol></section>';
  });
  h += `<button class="jump" id="jump" data-act="jump" hidden>${I.path}<span>Lezione attuale</span></button>`;
  h += `<div class="finale">${I.trophy}<span>In fondo al percorso: il diploma di perito.</span></div>`;
  return h;
}
function stonePop(idx) {
  const f = FLAT[idx];
  const l = f.lesson;
  const st = S.course.stars[l.id] || 0;
  if (!isUnlocked(idx)) {
    const unitLocked = !isUnlocked(firstLessonIdx(f.ui));
    return `<div class="stone-pop" role="group" aria-label="${esc(l.title)}"><p>${unitLocked ? 'Questa unità è ancora chiusa. Se l’hai già studiata in classe, puoi aprirla.' : 'Completa prima le lezioni precedenti.'}</p>${unitLocked ? `<div><button class="btn" data-act="unlockUnit" data-u="${f.ui}">Apri l’unità</button></div>` : ''}</div>`;
  }
  return `<div class="stone-pop" role="group" aria-label="${esc(l.title)}">${l.test ? '<p class="note">Per superare la prova serve il 70 % di risposte giuste. Nelle prove non ci sono concetti nuovi.</p>' : ''}
    <div class="btns"><button class="btn" data-act="startLesson" data-i="${idx}">${st ? 'Ripeti' : l.test ? 'Inizia la prova' : 'Inizia'}</button>${st && l.teach ? `<button class="btn ghost" data-act="startLessonTeach" data-i="${idx}">Rivedi la spiegazione</button>` : ''}</div></div>`;
}
function scrollToCurrent() { const n = $('.stone.current'); if (n) n.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
function updateJump() {
  const j = $('#jump'), n = $('.stone.current');
  if (!j || !n) return;
  const r = n.getBoundingClientRect();
  const off = r.bottom < 70 || r.top > innerHeight - 90;
  // in cima c'è già la scheda «Continua»: il pulsante serve solo dopo aver scorso il percorso
  const res = $('.resume');
  j.hidden = !off || (res && res.getBoundingClientRect().bottom > 0);
}

/* ---------- Palestra ---------- */
const LEVEL_DESC = ['Un solo passaggio, numeri semplici.', 'Due o tre passaggi.', 'Reti e problemi con più passaggi.', 'Tutto il problema, senza aiuti: scrivi ogni risultato intermedio.'];
const CATS = [['tutti', 'Tutti i tipi'], ['calcolo', 'Calcolo'], ['schemi', 'Schemi'], ['logica', 'Logica'], ['strumenti', 'Strumenti'], ['glossario', 'Glossario']];
function viewGym() {
  const p = S.prac;
  const units = UNITS.filter((u) => openUnits().has(u.id));
  const nErr = S.mistakes.length;
  const row = (act, m, icon, title, sub, extra = '', dis = false) => `<li><button class="rowbtn" data-act="${act}" ${m ? `data-m="${m}"` : ''} ${dis ? 'disabled' : ''}><span class="ico">${icon}</span><span class="txt"><b>${title}</b><span>${sub}</span></span>${extra}${I.chev}</button></li>`;
  const seg = (act, list, curV, label) => `<div class="seg" role="group" aria-label="${label}">${list.map(([v, l]) => `<button data-act="${act}" data-v="${v}" aria-pressed="${curV === v}">${l}</button>`).join('')}</div>`;
  return `<header class="page-head"><h1>Palestra</h1><p class="lede">Allenati come vuoi sugli argomenti che hai già aperto. Ogni problema è nuovo: i numeri li sceglie il motore.</p></header>
    <section class="sec"><h2 class="sec-title">Problemi di calcolo</h2>
      <div class="card stack"><div class="field"><span class="label" id="lvLab">Livello</span>${seg('pracLevel', LEVEL_NAMES.map((n, i) => [String(i + 1), n]), String(p.level), 'Livello')}</div><p class="note">${esc(LEVEL_DESC[p.level - 1])} Se gli argomenti aperti non hanno ancora problemi di quel livello, si scende da solo.</p>
      <button class="btn big block" data-act="practice" data-m="calc">${I.calc}Risolvi 10 problemi</button></div></section>
    <section class="sec"><h2 class="sec-title">Allenamento su misura</h2>
      <div class="card stack">
        <div class="field"><label for="pracUnit">Argomento</label><div class="select"><select id="pracUnit"><option value="">Tutti gli argomenti aperti</option>${units.map((u) => `<option value="${u.id}" ${u.id === p.unit ? 'selected' : ''}>${esc(u.title)}</option>`).join('')}</select></div></div>
        <div class="field"><label for="pracCat">Tipo di esercizi</label><div class="select"><select id="pracCat">${CATS.map(([v, l]) => `<option value="${v}" ${p.category === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
        <div class="setting"><div class="grow"><b>Solo argomenti già fatti</b><span>Spegni per avere anche, ogni tanto, un concetto nuovo spiegato al momento</span></div><label class="switch"><input type="checkbox" data-set="onlyDone" ${p.onlyDone ? 'checked' : ''} aria-label="Solo argomenti già fatti"><i></i></label></div>
        <button class="btn big block" data-act="practice" data-m="custom">Allenati</button></div></section>
    <section class="sec"><h2 class="sec-title">Altro</h2><div class="card flush"><ul class="list">
      ${row('practice', 'review', I.retry, 'Ripasso degli errori', nErr ? 'Gli esercizi sbagliati, con numeri nuovi' : 'Nessun errore da rivedere', nErr ? `<span class="count">${nErr}</span>` : '', !nErr)}
      ${row('lab', '', I.meter, 'Laboratorio libero', 'Multimetro e oscilloscopio sui circuiti delle lezioni aperte')}
      ${row('methodSheet', '', I.method, 'Il metodo', 'Sette passi per risolvere un problema')}</ul></div></section>`;
}

/* ---------- Laboratorio libero ---------- */
// i circuiti delle lezioni aperte: si sceglie dove mettere il multimetro e la portata; l'oscilloscopio con V/div e s/div
let LAB = null;
function labCircuits() {
  const out = [];
  FLAT.forEach((f, idx) => { if (idx > currentIdx()) return; for (const c of f.lesson.teach || []) if (c.schema && c.schema.ladder) out.push({ f, ladder: c.schema.ladder }); });
  return out.filter((x) => x.ladder.cols.flat().some((e) => e.t === 'V' && e.v) && x.ladder.cols.flat().concat(x.ladder.top.flat()).every((e) => ['V', 'R', 'LAMP', 'SW'].includes(e.t) || e.par));
}
function labSheet() {
  const list = labCircuits();
  const hasScope = openUnits().has('u13');
  LAB = LAB || { k: 0, el: null, mode: 'V', range: 20, vdiv: 1, tdiv: 0.0005, f: 1000, Vp: 2 };
  if (!list.length && !hasScope) { toast('Il laboratorio si apre con le lezioni sui circuiti.'); return; }
  openSheet('Laboratorio libero', `<div class="warn-card">${I.warn}<div><b>Solo bassissima tensione</b><p>Qui, come in laboratorio, si lavora fino a 12 V in continua. La presa di rete non si misura mai.</p></div></div><div id="labBody" class="stack"></div>`);
  drawLab();
}
function drawLab() {
  const list = labCircuits();
  const box = $('#labBody'); if (!box) return;
  let h = '';
  if (list.length) {
    LAB.k = Math.min(LAB.k, list.length - 1);
    const c = list[LAB.k];
    const els = c.ladder.cols.flat().concat(c.ladder.top.flat()).filter((e) => e.t === 'R' || e.t === 'LAMP');
    if (!els.find((e) => e.id === LAB.el)) LAB.el = els[0] && els[0].id;
    const net = window.ElekCircuit.toNetlist(c.ladder);
    const res = window.ElekMNA.solve({ elements: net.elements.map((e) => (e.t === 'LAMP' ? Object.assign({}, e, { t: 'R', v: e.v || 48 }) : e)) });
    const V = Math.abs(res.Vel[LAB.el] || 0), Ia = Math.abs(res.I[LAB.el] || 0);
    const reading = LAB.mode === 'V' ? V : Ia;
    const ranges = LAB.mode === 'V' ? [0.2, 2, 20, 200] : [0.002, 0.02, 0.2, 2];
    if (!ranges.includes(LAB.range)) LAB.range = ranges[2];
    h += `<section class="stack"><h3>Multimetro</h3><div class="field"><label for="labK">Circuito</label><div class="select"><select id="labK">${list.map((x, i) => `<option value="${i}" ${i === LAB.k ? 'selected' : ''}>Unità ${x.f.ui + 1}: ${esc(x.f.lesson.title)}</option>`).join('')}</select></div></div>
      ${schemaHtml({ ladder: c.ladder, opts: { highlight: [LAB.el] } })}
      <div class="field"><span class="label">Componente da misurare</span><div class="seg" role="group" aria-label="Componente">${els.map((e) => `<button data-act="labEl" data-v="${e.id}" aria-pressed="${LAB.el === e.id}">${esc(e.id)}</button>`).join('')}</div></div>
      <div class="field"><span class="label">Grandezza</span><div class="seg" role="group" aria-label="Grandezza"><button data-act="labMode" data-v="V" aria-pressed="${LAB.mode === 'V'}">Tensione (in parallelo)</button><button data-act="labMode" data-v="A" aria-pressed="${LAB.mode === 'A'}">Corrente (in serie)</button></div></div>
      <div class="field"><span class="label">Portata</span><div class="seg" role="group" aria-label="Portata">${ranges.map((r) => `<button data-act="labRange" data-v="${r}" aria-pressed="${LAB.range === r}">${esc(U.fmt(r, LAB.mode))}</button>`).join('')}</div></div>
      ${meterHtml({ mode: LAB.mode, range: LAB.range, reading })}
      <p class="note">${reading > LAB.range ? 'Fuori portata: il display mostra 1 a sinistra. Scegli una portata più alta.' : LAB.mode === 'V' ? `Il voltmetro è collegato ai capi di ${LAB.el}, in parallelo.` : `L’amperometro è inserito in serie a ${LAB.el}: per misurare si apre il circuito.`}</p></section>`;
  }
  if (openUnits().has('u13')) {
    h += `<section class="stack"><h3>Oscilloscopio</h3>${scopeHtml({ traces: [{ Vp: LAB.Vp, f: LAB.f }], vdiv: [LAB.vdiv], tdiv: LAB.tdiv })}
      <div class="field"><span class="label">V/div</span><div class="seg" role="group" aria-label="Volt per divisione">${[0.5, 1, 2, 5].map((v) => `<button data-act="labVdiv" data-v="${v}" aria-pressed="${LAB.vdiv === v}">${esc(U.fmt(v, 'V'))}</button>`).join('')}</div></div>
      <div class="field"><span class="label">s/div</span><div class="seg" role="group" aria-label="Secondi per divisione">${[0.0001, 0.0002, 0.0005, 0.001].map((v) => `<button data-act="labTdiv" data-v="${v}" aria-pressed="${LAB.tdiv === v}">${esc(U.fmt(v, 's'))}</button>`).join('')}</div></div>
      <p class="note">Segnale: ${esc(U.fmt(LAB.Vp, 'V'))} di picco, ${esc(U.fmt(LAB.f, 'Hz'))}. Prova a contare le divisioni di un periodo e moltiplicarle per s/div.</p>
      <div><button class="btn small ghost" data-act="labSignal">Cambia segnale</button></div></section>`;
  }
  box.innerHTML = h;
}

/* ---------- Teoria ---------- */
function viewLibrary() {
  const open = openUnits();
  const row = (act, attrs, icon, title, sub, dis) => `<li><button class="rowbtn" data-act="${act}" ${attrs} ${dis ? 'disabled' : ''}><span class="ico">${icon}</span><span class="txt"><b>${title}</b><span>${sub}</span></span>${dis ? I.lock : I.chev}</button></li>`;
  let h = `<header class="page-head"><h1>Teoria</h1><p class="lede">Le spiegazioni delle unità aperte, con schemi e tabelle disegnati dal motore. Le altre si aprono con il percorso.</p></header>
    <div class="card flush"><ul class="list">${row('tab', 'data-v="formulas"', I.table, 'Formulario', 'Tutte le formule incontrate, con le inverse e le unità')}${row('methodSheet', '', I.method, 'Il metodo', 'Sette passi per risolvere un problema')}${row('tab', 'data-v="conv"', I.swap, 'Convertitore', 'Prefissi, basi numeriche, codice colori')}</ul></div>`;
  for (const cls of [3, 4, 5]) {
    const list = UNITS.filter((u) => u.cls === cls);
    h += `<section class="sec"><h2 class="sec-title">Classe ${cls}ª</h2><div class="card flush"><ul class="list">${list.map((u) => { const ui = unitIdx(u.id); return row('topic', `data-t="${u.id}"`, `<span class="num">${ui + 1}</span>`, esc(u.title), open.has(u.id) ? `${u.lessons.length - 1} lezioni` : 'Si apre nel percorso', !open.has(u.id)); }).join('')}</ul></div></section>`;
  }
  return h;
}
function viewTopic(id) {
  const ui = unitIdx(id);
  const u = UNITS[ui];
  if (!openUnits().has(id)) return viewLibrary();
  let h = `<header class="page-head"><div class="row"><button class="iconbtn" data-act="tab" data-v="lib" aria-label="Torna alla teoria">${I.back}</button><span class="note">Classe ${u.cls}ª, unità ${ui + 1}</span></div><h1>${esc(u.title)}</h1>${u.say ? `<p class="lede">${rich(u.say)}</p>` : ''}
    <div><button class="btn small ghost" data-act="goUnit" data-u="${id}">${I.path}Vai all’unità nel percorso</button></div></header>`;
  const fi = firstLessonIdx(ui);
  u.lessons.forEach((l, k) => {
    if (l.test || !l.teach) return;
    const done = isUnlocked(fi + k);
    h += `<section class="sec"><h2 class="sec-title">${k + 1}. ${esc(l.title)}</h2>${done ? `<div class="card theory">${l.teach.map((c) => cardHtml(c)).join('')}</div>` : '<p class="note">Questa lezione si apre nel percorso.</p>'}</section>`;
  });
  return h;
}
function methodSheet() { openSheet('Il metodo', `${say('Sette passi per non perdersi in nessun problema.', 'contenta', 64)}<ol class="steps">${X.METHOD.map(([t, d]) => `<li><div class="stepbox"><b>${esc(t)}</b><span class="stepnote">${rich(d)}</span></div></li>`).join('')}</ol>`); }
// formulario: le formule delle schede delle lezioni già aperte, con le inverse e le unità
function formulaList() {
  const out = [];
  FLAT.forEach((f, idx) => { if (idx > currentIdx()) return; for (const c of f.lesson.teach || []) if (c.f) out.push({ c, f }); });
  return out;
}
const FQ = { q: '' };
function formulaMatches(x) {
  if (!FQ.q) return true;
  const q = FQ.q.toLowerCase();
  let t = x.f.lesson.title + ' ' + x.f.unit.title + ' ' + (x.c.leg || []).map((l) => l.join(' ')).join(' ');
  try { t += ' ' + MA.toText(x.c.f); } catch (e) { /* ignora */ }
  return t.toLowerCase().includes(q);
}
function formulaRows() {
  const list = formulaList().filter(formulaMatches);
  if (!list.length) return '<p class="note">Nessuna formula corrisponde alla ricerca.</p>';
  return `<div class="card flush">${list.map((x) => `<div class="formula-row"><span class="fname">${esc(x.f.lesson.title)}</span><span class="note">Unità ${x.f.ui + 1}, ${esc(x.f.unit.title)}</span>${formulaCard(x.c)}</div>`).join('')}</div>`;
}
function viewFormulas() {
  return `<header class="page-head"><div class="row"><button class="iconbtn" data-act="tab" data-v="lib" aria-label="Torna alla teoria">${I.back}</button><span class="note">Teoria</span></div><h1>Formulario</h1><p class="lede">${plural(formulaList().length, 'formula', 'formule')} delle lezioni aperte, ciascuna con le formule inverse e le unità.</p></header>
    <div class="field"><label for="fq">Cerca (grandezza, simbolo o argomento)</label><div class="search">${I.lens}<input id="fq" class="typed" type="search" autocomplete="off" spellcheck="false" placeholder="es. potenza, partitore, tau" value="${esc(FQ.q)}"></div></div>
    <div id="fList" class="sec">${formulaRows()}</div>`;
}
// convertitore: prefissi, basi numeriche, codice colori
function viewConverter() {
  const bands4 = ['nero', 'marrone', 'rosso', 'arancio', 'giallo', 'verde', 'blu', 'viola', 'grigio', 'bianco'];
  const mult = ['argento', 'oro', ...bands4.slice(0, 7)];
  const sel = (id, list, v) => `<div class="select"><select id="${id}">${list.map((c) => `<option value="${c}" ${c === v ? 'selected' : ''}>${c}</option>`).join('')}</select></div>`;
  return `<header class="page-head"><div class="row"><button class="iconbtn" data-act="tab" data-v="lib" aria-label="Torna alla teoria">${I.back}</button><span class="note">Teoria</span></div><h1>Convertitore</h1><p class="lede">Per controllare un passaggio, non per saltarlo: prima prova a mano.</p></header>
    <section class="sec"><h2 class="sec-title">Prefissi</h2><div class="card conv"><div class="field"><label for="cvIn">Valore con l’unità</label><input id="cvIn" class="typed" autocomplete="off" spellcheck="false" placeholder="es. 4k7 Ω, 0,000 22 F, 2,5e-3 A" value="4,7 kΩ"></div><div id="cvOut" class="conv-out" aria-live="polite"></div></div></section>
    <section class="sec"><h2 class="sec-title">Basi numeriche</h2><div class="card conv"><div class="field"><label for="cbIn">Numero decimale (da 0 a 65 535)</label><input id="cbIn" class="typed" inputmode="numeric" autocomplete="off" value="200"></div><div id="cbOut" class="conv-out" aria-live="polite"></div></div></section>
    <section class="sec"><h2 class="sec-title">Codice colori</h2><div class="card conv"><div class="field"><label for="ccIn">Valore del resistore</label><input id="ccIn" class="typed" autocomplete="off" spellcheck="false" value="4,7 kΩ"></div><div id="ccOut" aria-live="polite"></div>
      <div class="row wrap"><div class="field"><label for="cc1">1ª banda</label>${sel('cc1', bands4.slice(1), 'giallo')}</div><div class="field"><label for="cc2">2ª banda</label>${sel('cc2', bands4, 'viola')}</div><div class="field"><label for="cc3">Moltiplicatore</label>${sel('cc3', mult, 'rosso')}</div></div><div id="ccBack" class="conv-out" aria-live="polite"></div></div></section>`;
}
function convUpdate() {
  const o1 = $('#cvOut'), i1 = $('#cvIn');
  if (o1 && i1) {
    const p = U.parse(i1.value);
    o1.innerHTML = !p.ok ? esc(p.msg || 'Scrivi un numero con l’unità.') : !p.unit ? 'Aggiungi l’unità (Ω, V, A, F, H, s, Hz, W…).' : ['', 'k', 'M', 'm', 'µ', 'n', 'p'].filter((pr) => !pr || !U.NO_PREFIX.has(p.unit)).map((pr) => esc(U.fmt(p.value, p.unit, { prefix: pr, sig: 4 }))).join('<br>') + `<br>${esc(U.sci ? U.sci(p.value) + ' ' + p.unit : '')}`;
  }
  const o2 = $('#cbOut'), i2 = $('#cbIn');
  if (o2 && i2) {
    const n = parseInt(String(i2.value).replace(/\s/g, ''), 10);
    o2.innerHTML = !(n >= 0 && n <= 65535) ? 'Scrivi un intero da 0 a 65 535.' : `binario ${esc(NS.toBase(n, 2))}<br>esadecimale ${esc(NS.toBase(n, 16))}<br>BCD ${esc(NS.toBCD(n))}`;
  }
  const o3 = $('#ccOut'), i3 = $('#ccIn');
  if (o3 && i3) {
    const p = U.parse(i3.value);
    let b = null; try { b = p.ok ? U.toBands(p.value) : null; } catch (e) { b = null; }
    o3.innerHTML = b ? bandsHtml(b.concat(['oro'])) + `<p class="note">${esc(b.join(', '))}, oro (± 5 %)${U.inSeries && !U.inSeries(p.value, 'E24') ? '. Attenzione: non è un valore delle serie E12/E24.' : ''}</p>` : '<p class="note">Scrivi un valore in ohm, per esempio 4,7 kΩ o 220.</p>';
  }
  const back = $('#ccBack');
  if (back && $('#cc1')) {
    const bands = [$('#cc1').value, $('#cc2').value, $('#cc3').value, 'oro'];
    let v = null; try { v = U.fromBands(bands); } catch (e) { v = null; }
    back.textContent = v ? `${bands.slice(0, 3).join(', ')} → ${U.fmt(v.v != null ? v.v : v, 'Ω')}` : '';
  }
}

/* ---------- Glossario ---------- */
const GQ = { q: '' };
const pips = (it) => { const b = S.glossary[it] ? S.glossary[it].box : 0; return `<span class="pips" role="img" aria-label="${b ? `scatola ${b} di 5` : 'non ancora ripassato'}">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= b ? 'on' : ''}"></i>`).join('')}</span>`; };
const wikiLink = (t) => `<a class="tool" href="https://it.wikipedia.org/wiki/${encodeURIComponent(t.replace(/ /g, '_'))}" target="_blank" rel="noopener noreferrer">${I.globe}Wikipedia</a>`;
function termRows() {
  const q = GQ.q.toLowerCase();
  const list = metTerms().filter((g) => !q || g[0].toLowerCase().includes(q) || g[1].toLowerCase().includes(q));
  if (!list.length) return '<p class="note">Nessun termine corrisponde alla ricerca.</p>';
  return `<div class="card flush">${list.map((g) => `<div class="term"><div class="row"><b class="grow">${esc(g[0])}</b>${pips(g[0])}</div><span class="en" lang="en">${esc(g[1])}</span><span class="def">${esc(g[3])}</span>${S.settings.online ? `<div>${wikiLink(g[0])}</div>` : ''}</div>`).join('')}</div>`;
}
function viewWords() {
  const q = glossaryQueue();
  if (!q.all.length) return `<header class="page-head"><h1>Glossario</h1><p class="lede">I termini tecnici in italiano e in inglese (CLIL), con il ripasso.</p></header><div class="card">${say('I termini compariranno qui man mano che apri le unità.', 'contenta', 64)}</div>`;
  const nDue = q.due.length + q.fresh.length;
  const learned = q.all.filter((g) => S.glossary[g[0]] && S.glossary[g[0]].box >= 3).length;
  return `<header class="page-head"><h1>Glossario</h1><p class="lede">${plural(q.all.length, 'termine incontrato', 'termini incontrati')}, ${learned} imparati. Italiano e inglese, come nei datasheet.</p></header>
    <section class="sec"><h2 class="sec-title">Ripasso di oggi</h2><div class="card stack"><p class="note">${nDue ? `${q.due.length} da ripassare, ${q.fresh.length} nuovi` : 'Per oggi hai finito: torna domani.'}</p><p class="note">Ogni termine che sai passa alla scatola successiva e torna dopo più giorni (1, 3, 7, 14, 30); se lo sbagli, riparte dalla prima.</p>
      <button class="btn big block" data-act="practice" data-m="glossary" ${q.all.length >= 4 ? '' : 'disabled'}>${I.cards}Ripassa</button></div></section>
    <section class="sec"><h2 class="sec-title">I termini</h2><div class="field"><label for="gq">Cerca in italiano o in inglese</label><div class="search">${I.lens}<input id="gq" class="typed" type="search" autocomplete="off" spellcheck="false" placeholder="es. resistore, gain" value="${esc(GQ.q)}"></div></div>
      <div id="gList" class="stack">${termRows()}</div></section>`;
}

/* ---------- Profilo e salvataggio ---------- */
const BADGE_IDS = () => X.BADGES.map((b) => b.id);
const LESSON_IDS = () => FLAT.map((f) => f.lesson.id);
function weekSvg() {
  const days = [...Array(7)].map((_, i) => addDays(dayKey(), i - 6));
  const vals = days.map((d) => S.days[d] || 0);
  const max = Math.max(S.goal, ...vals);
  const names = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
  const gy = 92 - Math.round((S.goal / max) * 80);
  return `<svg class="week" viewBox="0 0 280 120" role="img" aria-label="XP degli ultimi sette giorni: ${vals.join(', ')}; obiettivo ${S.goal}">${days.map((d, i) => {
    const hgt = Math.round((vals[i] / max) * 80);
    const [y, m, dd] = d.split('-').map(Number);
    return `<rect class="${vals[i] ? 'bar-g' : 'bar-0'}" x="${i * 40 + 8}" y="${92 - Math.max(2, hgt)}" width="24" height="${Math.max(2, hgt)}" rx="4"/><text x="${i * 40 + 20}" y="110" text-anchor="middle">${names[new Date(y, m - 1, dd).getDay()]}</text>`;
  }).join('')}<line class="goal-line" x1="0" x2="280" y1="${gy}" y2="${gy}"/></svg>`;
}
const medal = (b, on) => `<span class="medal" aria-hidden="true">${esc(b.name.charAt(0))}</span>`;
function sinceText(t) {
  if (!t) return 'mai';
  const d = daysBetween(dayKey(new Date(t)), dayKey());
  return d <= 0 ? 'oggi' : d === 1 ? 'ieri' : d + ' giorni fa';
}
function saveCard() {
  const old = !S.backupAt || Date.now() - S.backupAt > 7 * 864e5;
  return `<section class="card savecard stack"><div class="save-head"><span class="save-dot ${saveFailed ? 'bad' : ''}" aria-hidden="true">${saveFailed ? I.close : I.check}</span><div class="grow"><b>${saveFailed ? 'Il browser non permette di salvare' : 'Progressi salvati su questo dispositivo'}</b><span>${saveFailed ? 'Usa il codice di salvataggio prima di chiudere la pagina.' : `Si salvano da soli dopo ogni risposta (ultimo salvataggio: ${S.savedAt ? new Date(S.savedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : 'non ancora'}). Copia di sicurezza: ${sinceText(S.backupAt)}.`}</span></div></div>
    ${old && S.stats.lessons ? '<p class="note">Per non perderli se cambi telefono o cancelli i dati del browser, tieni da parte il codice di salvataggio.</p>' : ''}
    <div class="btns"><button class="btn" data-act="saveCode">Codice</button><button class="btn ghost" data-act="export">${I.download}Scarica copia</button></div>
    <button class="linkbtn" data-act="restoreSheet">Ripristina da un codice o da un file</button></section>`;
}
function codeSheet(mode) {
  const code = SV.encode(S, LESSON_IDS(), BADGE_IDS(), ORDER);
  const body = mode === 'restore' ? '' : `<p>Il codice contiene percorso e stelle, punti, serie, insegne, impostazioni e nome. Copialo dove vuoi (note, messaggi, quaderno) e inseriscilo su un altro dispositivo, nel profilo o nella schermata di benvenuto.</p>
    <div class="savecode" id="savecode" tabindex="0" aria-label="Codice di salvataggio">${esc(code)}</div>
    <button class="btn block" data-act="copyCode">${I.copy}Copia il codice</button>
    <p class="note">Il ripasso degli errori e le scatole del glossario restano solo nella copia su file.</p>`;
  openSheet(mode === 'restore' ? 'Ripristina i progressi' : 'Codice di salvataggio', body + `
    <div class="field"><label for="codeIn">Inserisci un codice</label><textarea id="codeIn" class="typed mono" rows="3" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Per esempio 1A2B-C3D4-…"></textarea><p class="note" id="codeMsg" role="status"></p></div>
    <div class="btns"><button class="btn" data-act="restoreCode">Ripristina dal codice</button><button class="btn ghost" data-act="import">Da file</button></div>`);
}
// una copia su file è valida se ha la forma dello stato di Elektron: altrimenti si spiega che cosa non va e non si tocca nulla
function backupError(d) {
  const bad = 'Il file non è una copia di Elektron valida: i tuoi progressi non sono stati toccati.';
  if (!d || typeof d !== 'object' || d.v !== 1 || !d.course || typeof d.course !== 'object') return 'Il file non è una copia di Elektron.';
  const num = (x) => typeof x === 'number' && isFinite(x) && x >= 0;
  if (!num(d.course.unlocked) || d.course.unlocked >= FLAT.length) return bad;
  if (d.course.stars && (typeof d.course.stars !== 'object' || Object.values(d.course.stars).some((s) => ![1, 2, 3].includes(s)))) return bad;
  if (d.xp != null && !num(d.xp)) return bad;
  for (const k of ['settings', 'stats', 'glossary', 'days', 'badges', 'prac']) if (d[k] != null && (typeof d[k] !== 'object' || Array.isArray(d[k]))) return bad;
  for (const k of ['mistakes', 'recent']) if (d[k] != null && !Array.isArray(d[k])) return bad;
  return '';
}
function applyRestore(part) {
  S = merge(Object.assign({}, part, { onboarded: true, v: 1 }));
  S.backupAt = Date.now();
  onb = null; save(); applyTheme(); closeSheet(); VIEW = 'path'; render(); window.scrollTo(0, 0);
  toast('Progressi ripristinati.');
}
function viewMe() {
  const rk = rankOf(S.xp);
  const acc = S.stats.answered ? Math.round((S.stats.correct / S.stats.answered) * 100) : 0;
  const set = S.settings;
  const sw = (k, label, sub, on) => `<div class="setting"><div class="grow"><b>${label}</b><span>${sub}</span></div><label class="switch"><input type="checkbox" data-set="${k}" ${on ? 'checked' : ''} aria-label="${esc(label)}"><i></i></label></div>`;
  const seg = (act, list, curV, label) => `<div class="seg" role="group" aria-label="${label}">${list.map(([v, l]) => `<button data-act="${act}" data-v="${v}" aria-pressed="${curV === v}">${l}</button>`).join('')}</div>`;
  const cu = FLAT[currentIdx()];
  return `<header class="profile-head">${guide('contenta', 72)}<div class="grow"><h1>${S.name ? esc(S.name) : 'Il tuo profilo'}</h1><p class="note">${esc(rk.r.name)}</p></div></header>
    <div class="stats3"><div class="stat c-flame">${I.flame}<b>${effectiveStreak()}</b><small>Serie</small></div><div class="stat c-star">${I.bolt}<b>${S.xp}</b><small>XP</small></div><div class="stat c-good">${I.check}<b>${acc} %</b><small>Precisione</small></div></div>
    <div class="sec">${saveCard()}</div>
    <section class="sec"><h2 class="sec-title">Ultimi sette giorni</h2><div class="card stack">${weekSvg()}<p class="note">Lezioni completate: ${S.stats.lessons}; unità superate: ${doneUnits()} su ${UNITS.length}; fusibili di riserva: ${S.fuses}.</p></div></section>
    <section class="sec"><h2 class="sec-title">Gradi</h2><div class="card flush"><ul class="list">${X.RANKS.map((r, i) => `<li><div class="setting"><div class="grow"><b>${esc(r.name)}</b><span>da ${r.xp} XP</span></div>${i <= rk.i ? I.check : ''}</div></li>`).join('')}</ul></div></section>
    <section class="sec"><h2 class="sec-title">Insegne</h2><div class="card flush"><ul class="badges">${X.BADGES.map((b) => `<li class="badge ${S.badges[b.id] ? '' : 'off'}">${medal(b, !!S.badges[b.id])}<div class="grow"><b>${esc(b.name)}</b><span>${esc(b.desc)}${S.badges[b.id] ? '' : ' (da ottenere)'}</span></div></li>`).join('')}</ul></div></section>
    <section class="sec"><h2 class="sec-title">Studio</h2><div class="card flush">
      <div class="setting"><div class="grow"><b>Posizione nel percorso</b><span>Unità ${cu.ui + 1}, ${esc(cu.unit.title)}: ${esc(cu.lesson.title)}</span></div><button class="btn small ghost" data-act="placement">Cambia</button></div>
      <div class="setting wrap"><div class="grow"><b>Obiettivo giornaliero</b><span>XP al giorno</span></div>${seg('goal', SV.GOALS.map((g) => [String(g), String(g)]), String(S.goal), 'Obiettivo giornaliero')}</div>
      ${sw('keypad', 'Tastierina dei simboli', 'Prefissi, unità e simboli sotto la casella della risposta', set.keypad)}</div></section>
    <section class="sec"><h2 class="sec-title">Suoni e aspetto</h2><div class="card flush">
      ${sw('sound', 'Suoni', 'Segnali sonori discreti per le risposte', set.sound)}
      <div class="setting wrap"><div class="grow"><b>Tema</b><span>Colori dell’app</span></div>${seg('theme', [['auto', 'Automatico'], ['light', 'Chiaro'], ['dark', 'Scuro']], set.theme, 'Tema')}</div>
      <div class="setting wrap"><div class="grow"><b>Tavolozza</b><span>Proposta da scegliere (prova)</span></div>${seg('palette', [['rame', 'Rame'], ['ardesia', 'Ardesia'], ['viola', 'Viola']], set.palette, 'Tavolozza')}</div>
      <div class="setting wrap"><div class="grow"><b>Mascotte</b><span>Proposta da scegliere (prova)</span></div>${seg('mascot', G.CHOICES.map((c) => [c.id, c.name]), set.mascot, 'Mascotte')}</div></div></section>
    <section class="sec"><h2 class="sec-title">App e dati</h2><div class="card flush">
      ${sw('online', 'Collegamenti a Wikipedia', 'Facoltativi, nel glossario: si apre la voce in italiano', set.online)}
      <div class="setting"><div class="grow"><b>Installa l’app</b><span>${isStandalone() ? 'Elektron è già installata.' : 'Sul telefono funziona anche senza rete.'}</span></div><button class="btn small ghost" data-act="install" ${isStandalone() ? 'disabled' : ''}>Installa</button></div>
      <div class="setting"><div class="grow"><b>Nome</b><span>Facoltativo, resta sul dispositivo</span></div><button class="btn small ghost" data-act="rename">Cambia</button></div>
      <div class="setting"><div class="grow"><b>Azzera i progressi</b><span>Cancella tutto da questo dispositivo</span></div><button class="btn small err" data-act="reset">Azzera</button></div></div></section>
    <section class="sec"><h2 class="sec-title">Informazioni</h2><div class="card stack"><p class="note">Elektron funziona tutto sul tuo dispositivo: nessun account, nessuna raccolta di dati, nessuna intelligenza artificiale. I calcoli li fa il motore dell’app, con lo svolgimento. Caratteri: IBM Plex Sans, IBM Plex Mono, STIX Two Math (licenza SIL OFL 1.1).</p>
      <p class="note">Convenzioni: verso convenzionale della corrente; freccia della tensione verso il morsetto +; in alternata valori efficaci, angoli in gradi; simboli CEI EN 60617; scrittura delle unità secondo il SI.</p>
      <p class="note">${UNITS.length} unità, ${FLAT.length} lezioni, ${X.GLOSSARY.length} termini nel glossario. Versione ${esc(window.ELEK_VERSION || 'di prova')}.</p></div></section>`;
}

/* ---------- Benvenuto e posizione nel percorso ---------- */
let onb = null;
function placementList(selId, actName, cls) {
  const list = UNITS.filter((u) => !cls || u.cls < cls || u.cls === cls);
  return `<div class="choices"><button class="choice" data-act="${actName}" data-u="" aria-pressed="${selId === ''}"><span class="num" aria-hidden="true">0</span><span class="grow"><b>Comincio dall’inizio</b><span>Si parte da «${esc(UNITS[0].title)}»</span></span></button>
    ${list.filter((u) => unitIdx(u.id) < UNITS.length - 1).map((u) => { const i = unitIdx(u.id); return `<button class="choice" data-act="${actName}" data-u="${u.id}" aria-pressed="${selId === u.id}"><span class="num" aria-hidden="true">${i + 1}</span><span class="grow"><b>Fino a: ${esc(u.title)}</b><span>Si riparte da «${esc(UNITS[i + 1].title)}»</span></span></button>`; }).join('')}</div>`;
}
function drawOnb() {
  onb = onb || { step: 0, name: S.name || '', cls: 3, place: '', goal: S.goal };
  const dots = `<div class="steps-dots" aria-hidden="true">${[0, 1, 2].map((i) => `<i class="${i <= onb.step ? 'on' : ''}"></i>`).join('')}</div>`;
  let h = `<div class="onb">${dots}<p class="sr">Passo ${onb.step + 1} di 3</p>`;
  if (onb.step === 0) {
    h += `<div class="onb-hero">${guide('esultante', 150)}<h1>ELEKTRON</h1><p>${esc(G.intro(S.settings.mascot))}</p></div>
      <div class="card field"><label for="nm">Come ti chiami? <span class="muted">(facoltativo)</span></label><input id="nm" class="typed" maxlength="16" autocomplete="off" value="${esc(onb.name)}" placeholder="Nome o soprannome"><p class="note">Tutto resta su questo dispositivo: nessun account, nessun dato inviato a nessuno.</p></div>
      <button class="btn big block" data-act="onbNext">Cominciamo</button>
      <button class="linkbtn" data-act="restoreSheet">Hai già usato Elektron? Ripristina i progressi</button>`;
  } else if (onb.step === 1) {
    h += say('In che classe sei, e fin dove siete arrivati? Apro le unità che hai già studiato; le altre si aprono facendo le lezioni. Potrai cambiarlo dal profilo, anche tornando indietro.', 'pensierosa', 76)
      + `<div class="field"><span class="label">Classe</span><div class="seg" role="group" aria-label="Classe">${[3, 4, 5].map((c) => `<button data-act="onbCls" data-v="${c}" aria-pressed="${onb.cls === c}">${c}ª</button>`).join('')}</div></div>`
      + placementList(onb.place, 'onbPlace', onb.cls) + `<div class="onb-foot"><button class="btn big block" data-act="onbNext">Avanti</button></div>`;
  } else {
    h += say('Ultima scelta: quanto vuoi studiare ogni giorno? Potrai cambiarlo quando vuoi nel profilo.', 'contenta', 76) + `<div class="card flush"><div class="setting wrap"><div class="grow"><b>Obiettivo giornaliero</b><span>Una lezione completa vale circa 100 XP</span></div><div class="seg" role="group" aria-label="Obiettivo giornaliero">${[[30, 'Calmo'], [50, 'Normale'], [80, 'Serio'], [120, 'Intenso']].map(([g, l]) => `<button data-act="onbGoal" data-v="${g}" aria-pressed="${onb.goal === g}">${l}</button>`).join('')}</div></div></div>
      <button class="btn big block" data-act="onbDone">Iniziamo</button>`;
  }
  h += `${onb.step ? '<button class="btn ghost block" data-act="onbBack">Indietro</button>' : ''}</div>`;
  $('#app').innerHTML = h;
  window.scrollTo(0, 0);
}
function placementSheet() {
  const cu = FLAT[currentIdx()];
  openSheet('Posizione nel percorso', say(`Ora sei all’unità ${cu.ui + 1}, «${esc(cu.unit.title)}». Scegli fin dove hai studiato in classe: le unità fino a lì si aprono, le stelle già guadagnate restano.`, 'pensierosa', 64) + placementList(null, 'setPlace'));
}

/* ---------- Installazione ---------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (ev) => { ev.preventDefault(); deferredPrompt = ev; });
window.addEventListener('appinstalled', () => { deferredPrompt = null; toast('Elektron è installata.'); });
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function installFlow() {
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.finally(() => { deferredPrompt = null; render(); }); return; }
  if (isIOS()) { showModal(`${guide('contenta', 80)}<h2>Installa su iPhone o iPad</h2><ol class="steps"><li><span>Apri questa pagina con <b>Safari</b>.</span></li><li><span>Tocca <b>Condividi</b>.</span></li><li><span>Scegli <b>Aggiungi alla schermata Home</b>.</span></li><li><span>Tocca <b>Aggiungi</b>: l’icona di Elektron comparirà tra le app.</span></li></ol><button class="btn block" data-act="closeModal">Ho capito</button>`); return; }
  showModal(`${guide('contenta', 80)}<h2>Installa l’app</h2><p>Su Android apri il menu del browser (⋮) e scegli <b>Installa app</b> o <b>Aggiungi a schermata Home</b>. Sul computer usa l’icona di installazione nella barra dell’indirizzo.</p>${SITE ? '' : '<p class="note">L’installazione richiede la versione pubblicata sul sito; questo file si apre comunque in qualunque browser, anche senza rete.</p>'}<button class="btn block" data-act="closeModal">Ho capito</button>`);
}
