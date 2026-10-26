/* ELEKTRON — numeri complessi per le reti in alternata.
   Un complesso è { re, im }. Angoli in gradi verso lo studente, in radianti solo dentro i calcoli.
   Scrittura: forma algebrica «3 + j4», forma polare «5∠53,1°»; lettura delle due forme nelle risposte. */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const C = (re, im = 0) => ({ re, im });
  const isC = (x) => x && typeof x === 'object' && 're' in x;
  const of = (x) => (isC(x) ? x : C(+x, 0));
  const add = (a, b) => { a = of(a); b = of(b); return C(a.re + b.re, a.im + b.im); };
  const sub = (a, b) => { a = of(a); b = of(b); return C(a.re - b.re, a.im - b.im); };
  const mul = (a, b) => { a = of(a); b = of(b); return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); };
  const div = (a, b) => {
    a = of(a); b = of(b);
    const d = b.re * b.re + b.im * b.im;
    if (d === 0) throw new Error('divisione per zero (complessa)');
    return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
  };
  const inv = (a) => div(1, a);
  const neg = (a) => { a = of(a); return C(-a.re, -a.im); };
  const conj = (a) => { a = of(a); return C(a.re, -a.im); };
  const abs = (a) => { a = of(a); return Math.hypot(a.re, a.im); };
  const RAD = Math.PI / 180;
  // argomento in gradi, fra −180° e 180°
  const argDeg = (a) => { a = of(a); return Math.atan2(a.im, a.re) / RAD; };
  const polar = (m, deg) => C(m * Math.cos(deg * RAD), m * Math.sin(deg * RAD));
  const scale = (a, k) => { a = of(a); return C(a.re * k, a.im * k); };
  const eq = (a, b, tol = 1e-9) => abs(sub(a, b)) <= tol * Math.max(1, abs(a), abs(b));
  // parallelo di impedenze: Z1·Z2/(Z1+Z2), generalizzato con i reciproci
  const par = (...zs) => inv(zs.reduce((s, z) => add(s, inv(z)), C(0, 0)));
  const ser = (...zs) => zs.reduce((s, z) => add(s, z), C(0, 0));

  /* ---------- Scrittura ---------- */
  // tiene conto degli zeri «numerici» (1e-13) che nascono dagli arrotondamenti
  const clean = (x, ref) => (Math.abs(x) < 1e-9 * Math.max(1, ref) ? 0 : x);
  // forma algebrica: «3 + j4», «3 − j4», «j4», «−3»; con l'unità: «(3 + j4) Ω»
  function fmtRect(z, unit = '', o = {}) {
    z = of(z);
    const m = abs(z);
    const re = clean(z.re, m), im = clean(z.im, m);
    const n = (x) => U.num(Math.abs(x), o);
    let s;
    if (im === 0) s = U.num(re, o);
    else if (re === 0) s = (im < 0 ? U.MINUS : '') + 'j' + n(im);
    else s = U.num(re, o) + ' ' + (im < 0 ? U.MINUS : '+') + ' j' + n(im);
    if (!unit) return s;
    return (im !== 0 && re !== 0 ? '(' + s + ')' : s) + U.NB + unit;
  }
  // forma polare: «5∠53,1°»; con l'unità dopo l'angolo e il prefisso scelto sul modulo: «2,2∠−30° kΩ»
  function fmtPolar(z, unit = '', o = {}) {
    z = of(z);
    const m = abs(z);
    const a = m === 0 ? 0 : argDeg(z);
    const p = unit ? U.pickPrefix(m, unit, o) : '';
    const mod = U.num(m / 10 ** U.PREFIX[p], o);
    return mod + '∠' + U.num(a, { dec: o.angDec ?? 1 }) + '°' + (unit ? U.NB + p + unit : '');
  }

  /* ---------- Lettura ---------- */
  /* forme accettate: «3+j4», «3 + 4j», «3-j4», «j4», «-j4», «5∠53,1», «5∠53,1°», «5 /53,1», «5 ang 53,1»;
     il modulo può avere prefisso e unità: «2,2k∠-30°», «(3+j4) Ω». Restituisce { ok, z, unit } o { ok:false, msg }. */
  function parse(input) {
    let s = U.normalizeInput(input).replace(/\s+/g, '');
    if (!s) return { ok: false, msg: 'Scrivi il risultato.' };
    // polare
    // polare; l'unità può stare sul modulo (2,2 kΩ∠−30°) o dopo l'angolo (2,2∠−30° kΩ), con il prefisso che vale per il modulo
    let m = s.match(/^(.+?)(?:∠|\/|ang)([+-]?\d+(?:[.,]\d+)?)°?(.*)$/);
    if (m) {
      const r = U.parse(m[1]);
      if (!r.ok) return { ok: false, msg: r.msg };
      let mod = r.value, unit = r.unit;
      if (m[3]) {
        const ru = U.readUnit(m[3]);
        if (!ru || r.unit) return { ok: false, msg: `Non riconosco l’unità «${m[3]}».` };
        mod *= 10 ** U.PREFIX[ru.prefix];
        unit = ru.unit;
      }
      return { ok: true, z: polar(mod, parseFloat(m[2].replace(',', '.'))), unit, form: 'polare' };
    }
    // algebrica, con l'unità facoltativa fuori dalle parentesi
    let unit = null;
    m = s.match(/^\((.+)\)(.*)$/);
    if (m) { s = m[1]; if (m[2]) { const ru = U.readUnit(m[2]); if (!ru || ru.prefix) return { ok: false, msg: `Non riconosco l’unità «${m[2]}».` }; unit = ru.unit; } }
    const num = '(\\d+(?:[.,]\\d+)?|[.,]\\d+)';
    const reIm = new RegExp(`^([+-]?)${num}?(?:([+-])(?:j${num}|${num}j|j))?$`);
    const onlyIm = new RegExp(`^([+-]?)(?:j${num}|${num}j|j)$`);
    const f = (x) => parseFloat(String(x).replace(',', '.'));
    m = s.match(onlyIm);
    if (m) { const v = m[2] ?? m[3] ?? '1'; return { ok: true, z: C(0, (m[1] === '-' ? -1 : 1) * f(v)), unit, form: 'algebrica' }; }
    m = s.match(reIm);
    if (m && m[2] != null) {
      const re = (m[1] === '-' ? -1 : 1) * f(m[2]);
      let im = 0;
      if (m[3]) { const v = m[4] ?? m[5] ?? '1'; im = (m[3] === '-' ? -1 : 1) * f(v); }
      return { ok: true, z: C(re, im), unit, form: 'algebrica' };
    }
    // un numero reale con prefisso e unità
    const r = U.parse(input);
    if (r.ok) return { ok: true, z: C(r.value, 0), unit: r.unit, form: 'reale' };
    return { ok: false, msg: 'Scrivi il numero complesso come 3 + j4 oppure come 5∠53,1°.' };
  }
  // confronto con tolleranza relativa sul modulo dell'errore
  function within(z, w, tol = U.TOL) { return abs(sub(z, w)) <= tol * Math.max(abs(w), 1e-15); }

  const api = { C, of, isC, add, sub, mul, div, inv, neg, conj, abs, argDeg, polar, scale, eq, par, ser, fmtRect, fmtPolar, parse, within, RAD };
  root.ElekCx = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
