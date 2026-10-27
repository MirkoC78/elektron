/* ELEKTRON — codice di salvataggio: i progressi essenziali in una stringa da copiare su un altro dispositivo.
   Nessun server: il codice resta allo studente. Contiene percorso e stelle (anche delle unità richiuse tornando indietro),
   punti, serie e fusibili di riserva, insegne, impostazioni, scelte della palestra, nome e statistiche principali;
   il ripasso degli errori e le scatole del glossario restano solo nella copia completa su file.
   Formato (lo stesso di Verto): bit impacchettati, controllo di Fletcher a 16 bit, base32 di Crockford in gruppi di 4
   (si ignorano trattini, spazi e maiuscole; I e L valgono 1, O vale 0). */
(function (root) {
  'use strict';
  const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const NAME_CH = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789àèéìòùÀÈÉÌÒÙ'-.";
  const GOALS = [30, 50, 80, 120];
  const THEMES = ['auto', 'light', 'dark'];
  const LEVELS = [1, 2, 3, 4];
  const CATS = ['tutti', 'calcolo', 'schemi', 'logica', 'strumenti', 'glossario'];
  const EPOCH = Date.UTC(2025, 0, 1);
  const VERSION = 1;
  // statistiche salvate nel codice, con il numero di bit
  const STATS = [['lessons', 12], ['answered', 17], ['correct', 17], ['calc', 14], ['faults', 10], ['minimal', 10]];

  function Writer() { const bits = []; return { put(v, n) { v = Math.max(0, Math.min(Math.floor(v) || 0, 2 ** n - 1)); for (let i = n - 1; i >= 0; i--) bits.push(Math.floor(v / 2 ** i) % 2); }, bits }; }
  function Reader(bits) { let p = 0; return { get(n) { let v = 0; for (let i = 0; i < n; i++) { if (p >= bits.length) throw new Error('Il codice è troppo corto: controlla di averlo copiato tutto.'); v = v * 2 + bits[p++]; } return v; } }; }
  function check(bits) { let a = 1, b = 0; for (let i = 0; i < bits.length; i += 8) { let byte = 0; for (let j = 0; j < 8; j++) byte = byte * 2 + (bits[i + j] || 0); a = (a + byte) % 255; b = (b + a) % 255; } return a * 256 + b; }
  const dayNum = (k) => { if (!k) return 0; const [y, m, d] = k.split('-').map(Number); return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 864e5) + 1; };
  const dayKey = (n) => { if (!n) return null; const d = new Date(EPOCH + (n - 1) * 864e5); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); };

  // S: stato dell'app; lessonIds: id delle lezioni in ordine; badgeIds: id delle insegne; unitIds: id delle unità
  function encode(S, lessonIds, badgeIds, unitIds) {
    const w = Writer();
    const c = S.course || {}, st = S.stats || {}, set = S.settings || {}, pr = S.prac || {};
    const unlocked = Math.min(c.unlocked || 0, lessonIds.length - 1);
    w.put(VERSION, 4);
    let last = unlocked;
    lessonIds.forEach((id, i) => { if ((c.stars || {})[id]) last = Math.max(last, i); });
    w.put(unlocked, 8); w.put(last, 8);
    for (let i = 0; i <= last; i++) w.put((c.stars || {})[lessonIds[i]] || 0, 2);
    w.put(S.xp, 22);
    w.put(S.streak, 12); w.put(dayNum(S.lastDay), 15); w.put(S.fuses, 2);
    w.put(Math.max(0, GOALS.indexOf(S.goal)), 2);
    w.put(set.sound !== false ? 1 : 0, 1); w.put(set.keypad !== false ? 1 : 0, 1); w.put(set.online !== false ? 1 : 0, 1);
    w.put(Math.max(0, THEMES.indexOf(set.theme || 'auto')), 2);
    w.put(Math.max(0, LEVELS.indexOf(pr.level || 2)), 2); w.put(pr.onlyDone === false ? 0 : 1, 1);
    w.put(Math.max(0, CATS.indexOf(pr.category || 'tutti')), 3);
    const ui = unitIds ? unitIds.indexOf(pr.unit) : -1;
    w.put(ui + 1, 5);
    badgeIds.forEach((b) => w.put((S.badges || {})[b] ? 1 : 0, 1));
    for (const [k, n] of STATS) w.put(st[k], n);
    const name = [...String(S.name || '')].filter((ch) => NAME_CH.includes(ch)).slice(0, 16);
    w.put(name.length, 5); name.forEach((ch) => w.put(NAME_CH.indexOf(ch), 7));
    const bits = w.bits;
    while (bits.length % 5 !== 4) bits.push(0); // con i 16 bit di controllo il totale diventa multiplo di 5
    const ck = check(bits);
    for (let i = 15; i >= 0; i--) bits.push(Math.floor(ck / 2 ** i) % 2);
    let out = '';
    for (let i = 0; i < bits.length; i += 5) out += ALPHA[bits.slice(i, i + 5).reduce((a, x) => a * 2 + x, 0)];
    return out.match(/.{1,4}/g).join('-');
  }
  function clean(code) { return String(code).toUpperCase().replace(/[\s-]/g, '').replace(/[IL]/g, '1').replace(/O/g, '0'); }
  // restituisce un oggetto parziale da fondere nello stato, oppure lancia un errore leggibile
  function decode(code, lessonIds, badgeIds, unitIds) {
    const s = clean(code);
    if (!s) throw new Error('Scrivi o incolla il codice di salvataggio.');
    if (s.length < 20) throw new Error('Il codice è troppo corto: controlla di averlo copiato tutto.');
    const bits = [];
    for (const ch of s) {
      const v = ALPHA.indexOf(ch);
      if (v < 0) throw new Error(`Il carattere «${ch}» non fa parte dei codici di Elektron: controlla di averlo copiato bene.`);
      for (let i = 4; i >= 0; i--) bits.push(Math.floor(v / 2 ** i) % 2);
    }
    const body = bits.slice(0, -16), ck = bits.slice(-16).reduce((a, x) => a * 2 + x, 0);
    if (check(body) !== ck) throw new Error('Il codice non torna: forse manca un carattere o ce n’è uno sbagliato. Ricontrollalo gruppo per gruppo.');
    const r = Reader(body);
    if (r.get(4) !== VERSION) throw new Error('Questo codice viene da una versione diversa di Elektron.');
    const unlocked = Math.min(r.get(8), lessonIds.length - 1);
    const last = r.get(8);
    const stars = {};
    for (let i = 0; i <= last; i++) { const v = r.get(2); if (v && lessonIds[i]) stars[lessonIds[i]] = v; }
    const xp = r.get(22), streak = r.get(12), lastDay = dayKey(r.get(15)), fuses = r.get(2);
    const goal = GOALS[r.get(2)];
    const settings = { sound: !!r.get(1), keypad: !!r.get(1), online: !!r.get(1), theme: THEMES[r.get(2)] || 'auto' };
    const prac = { level: LEVELS[r.get(2)], onlyDone: !!r.get(1), category: CATS[r.get(3)] || 'tutti' };
    const ui = r.get(5) - 1;
    prac.unit = unitIds && ui >= 0 ? unitIds[ui] || null : null;
    const badges = {};
    badgeIds.forEach((b) => { if (r.get(1)) badges[b] = lastDay || '2025-01-01'; });
    const stats = {};
    for (const [k, n] of STATS) stats[k] = r.get(n);
    const nl = r.get(5);
    let name = '';
    for (let i = 0; i < nl; i++) name += NAME_CH[r.get(7)] || '';
    const times = {};
    Object.keys(stars).forEach((id) => { times[id] = 1; });
    return { course: { unlocked, stars, times }, xp, streak, lastDay, fuses, goal, settings, prac, badges, stats, name };
  }
  const api = { encode, decode, clean, STATS, CATS, GOALS };
  root.ElekSave = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
