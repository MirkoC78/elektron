/* ELEKTRON — transitori del primo ordine (RC e RL).
   Ogni transitorio è x(t) = x_f + (x_0 − x_f)·e^(−t/τ): x_0 valore iniziale, x_f valore finale, τ costante di tempo
   (τ = R·C, τ = L/R; con una rete si usa la resistenza di Thevenin vista dal condensatore o dall'induttore).
   Dopo 5τ il transitorio si considera esaurito (99,3 %). */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const MA = root.ElekMath || require('./math.js');
  const Q = (o) => (v, u, paren) => MA.q(v, u, { prefixes: o.prefixes, sig: o.sig ?? 3, paren });
  const step = (f, s, v, u) => ({ f, s, v, u });
  const sol = (sym, u, v, steps, mistakes = [], extra = {}) => Object.assign({ sym, u, v, steps, mistakes: mistakes.filter((m) => isFinite(m.v) && m.v !== v) }, extra);

  const value = (x0, xf, tau, t) => xf + (x0 - xf) * Math.exp(-t / tau);
  // istante in cui x raggiunge il valore x (fra x0 e xf)
  const timeTo = (x0, xf, tau, x) => -tau * Math.log((x - xf) / (x0 - xf));
  // percentuale del salto compiuta dopo k costanti di tempo
  const percent = (k) => 100 * (1 - Math.exp(-k));
  const TABLE = [1, 2, 3, 4, 5].map((k) => ({ k, pct: percent(k) }));

  function tauRC(p, o = {}) {
    const q = Q(o);
    const v = p.R * p.C;
    return sol('tau', 's', v, [step('tau = R * C', `tau = ${q(p.R, 'Ω')} * ${q(p.C, 'F')} = ${q(v, 's')}`, v, 's')], [{ id: 'costante-tempo', v: p.R / p.C }, { id: 'costante-tempo', v: p.C / p.R }, { id: 'costante-tempo', v: 5 * v }]);
  }
  function tauRL(p, o = {}) {
    const q = Q(o);
    const v = p.L / p.R;
    return sol('tau', 's', v, [step('tau = L/R', `tau = ${q(p.L, 'H')}/${q(p.R, 'Ω')} = ${q(v, 's')}`, v, 's')], [{ id: 'costante-tempo', v: p.L * p.R }, { id: 'costante-tempo', v: p.R / p.L }, { id: 'costante-tempo', v: 5 * v }]);
  }
  // durata del transitorio: 5τ
  function settle(p, o = {}) {
    const q = Q(o);
    const tau = p.tau ?? (p.L ? p.L / p.R : p.R * p.C);
    const v = 5 * tau;
    const steps = [];
    if (p.tau == null) steps.push(p.L ? step('tau = L/R', `tau = ${q(p.L, 'H')}/${q(p.R, 'Ω')} = ${q(tau, 's')}`, tau, 's') : step('tau = R * C', `tau = ${q(p.R, 'Ω')} * ${q(p.C, 'F')} = ${q(tau, 's')}`, tau, 's'));
    steps.push(step('t_5 = 5 * tau', `t_5 = 5 * ${q(tau, 's')} = ${q(v, 's')}`, v, 's'));
    return sol('t_5', 's', v, steps, [{ id: 'costante-tempo', v: tau }, { id: 'costante-tempo', v: 5 * (p.L ? p.L * p.R : p.R / p.C) }]);
  }
  /* carica o scarica del condensatore: p = { R, C, E (tensione del generatore in carica), V0 (tensione iniziale, per la scarica),
     mode: 'carica' | 'scarica', t (istante), find: 'v' | 'i' | 't' (istante a cui si raggiunge p.vx) } */
  function rc(p, o = {}) {
    const q = Q(o);
    const tau = p.R * p.C;
    const charge = p.mode !== 'scarica';
    const x0 = charge ? (p.V0 || 0) : p.V0, xf = charge ? p.E : 0;
    const steps = [step('tau = R * C', `tau = ${q(p.R, 'Ω')} * ${q(p.C, 'F')} = ${q(tau, 's')}`, tau, 's')];
    if (p.find === 't') {
      const v = timeTo(x0, xf, tau, p.vx);
      steps.push(charge
        ? step('t = -tau * ln(1 - v_C/E)', `t = -${q(tau, 's')} * ln(1 - ${q(p.vx, 'V')}/${q(p.E, 'V')}) = ${q(v, 's')}`, v, 's')
        : step('t = -tau * ln(v_C/V_0)', `t = -${q(tau, 's')} * ln(${q(p.vx, 'V')}/${q(p.V0, 'V')}) = ${q(v, 's')}`, v, 's'));
      return sol('t', 's', v, steps, [{ id: 'carica-scarica', v: timeTo(xf, x0, tau, p.vx) }, { id: 'costante-tempo', v: -tau * Math.log(p.vx / (charge ? p.E : p.V0)) }]);
    }
    const ratio = p.t / tau;
    const ex = Math.exp(-ratio);
    if (p.find === 'i') {
      // corrente: in carica (E − V0)/R·e^(−t/τ), in scarica −V0/R·e^(−t/τ) (verso opposto)
      const I0 = (xf - x0) / p.R;
      const v = I0 * ex;
      steps.push(step(charge ? 'i(t) = {E - V_0}/R * e^{-t/tau}' : 'i(t) = -V_0/R * e^{-t/tau}', `i = ${q(I0, 'A', true)} * e^{-${q(p.t, 's')}/${q(tau, 's')}} = ${q(v, 'A')}`, v, 'A'));
      return sol('i', 'A', v, steps, [{ id: 'carica-scarica', v: I0 * (1 - ex) }, { id: 'segno', v: -v }]);
    }
    const v = value(x0, xf, tau, p.t);
    if (charge && !x0) steps.push(step('v_C(t) = E * (1 - e^{-t/tau})', `v_C = ${q(p.E, 'V')} * (1 - e^{-${q(p.t, 's')}/${q(tau, 's')}}) = ${q(v, 'V')}`, v, 'V'));
    else if (charge) steps.push(step('v_C(t) = E + (V_0 - E) * e^{-t/tau}', `v_C = ${q(p.E, 'V')} + (${q(x0, 'V')} - ${q(p.E, 'V')}) * e^{-${q(p.t, 's')}/${q(tau, 's')}} = ${q(v, 'V')}`, v, 'V'));
    else steps.push(step('v_C(t) = V_0 * e^{-t/tau}', `v_C = ${q(p.V0, 'V')} * e^{-${q(p.t, 's')}/${q(tau, 's')}} = ${q(v, 'V')}`, v, 'V'));
    return sol('v_C', 'V', v, steps, [{ id: 'carica-scarica', v: value(xf, x0, tau, p.t) }, { id: 'costante-tempo', v: value(x0, xf, p.R / p.C, p.t) }, { id: 'costante-tempo', v: value(x0, xf, tau, p.t * tau) }]);
  }
  /* induttore: p = { R, L, E, mode: 'carica' (si chiude l'interruttore: la corrente sale a E/R) | 'scarica', I0, t, find: 'i' | 'v' } */
  function rl(p, o = {}) {
    const q = Q(o);
    const tau = p.L / p.R;
    const charge = p.mode !== 'scarica';
    const I0 = charge ? 0 : p.I0, If = charge ? p.E / p.R : 0;
    const steps = [step('tau = L/R', `tau = ${q(p.L, 'H')}/${q(p.R, 'Ω')} = ${q(tau, 's')}`, tau, 's')];
    if (charge) steps.push(step('I_f = E/R', `I_f = ${q(p.E, 'V')}/${q(p.R, 'Ω')} = ${q(If, 'A')}`, If, 'A'));
    const ex = Math.exp(-p.t / tau);
    if (p.find === 'v') {
      // tensione sull'induttore: E·e^(−t/τ) all'accensione
      const v = (charge ? p.E : -p.I0 * p.R) * ex;
      steps.push(step(charge ? 'v_L(t) = E * e^{-t/tau}' : 'v_L(t) = -R * I_0 * e^{-t/tau}', `v_L = ${q(charge ? p.E : -p.I0 * p.R, 'V', true)} * e^{-${q(p.t, 's')}/${q(tau, 's')}} = ${q(v, 'V')}`, v, 'V'));
      return sol('v_L', 'V', v, steps, [{ id: 'carica-scarica', v: (charge ? p.E : -p.I0 * p.R) * (1 - ex) }, { id: 'segno', v: -v }]);
    }
    const v = value(I0, If, tau, p.t);
    steps.push(charge ? step('i(t) = I_f * (1 - e^{-t/tau})', `i = ${q(If, 'A')} * (1 - e^{-${q(p.t, 's')}/${q(tau, 's')}}) = ${q(v, 'A')}`, v, 'A')
      : step('i(t) = I_0 * e^{-t/tau}', `i = ${q(I0, 'A')} * e^{-${q(p.t, 's')}/${q(tau, 's')}} = ${q(v, 'A')}`, v, 'A'));
    return sol('i', 'A', v, steps, [{ id: 'carica-scarica', v: value(If, I0, tau, p.t) }, { id: 'costante-tempo', v: value(I0, If, p.L * p.R, p.t) }]);
  }
  // campioni della curva per i grafici: n punti da 0 a tEnd
  function curve(x0, xf, tau, tEnd, n = 120) {
    const out = [];
    for (let i = 0; i <= n; i++) { const t = tEnd * i / n; out.push([t, value(x0, xf, tau, t)]); }
    return out;
  }

  const api = { value, timeTo, percent, TABLE, tauRC, tauRL, settle, rc, rl, curve };
  root.ElekTransient = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
