/* ELEKTRON — segnali: decibel, filtri del primo ordine (RC passivi e attivi), diagrammi di Bode asintotici,
   conversione A/D e D/A, campionamento.
   Convenzioni dichiarate (docs/inventario-e-piano.md): guadagno in tensione G_dB = 20·log(V_out/V_in);
   quanto Q = V_FS/2ⁿ; il convertitore A/D arrotonda al livello più vicino (errore massimo Q/2);
   il convertitore D/A dà V_out = N·Q. */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const MA = root.ElekMath || require('./math.js');
  const NS = root.ElekNum || require('./numsys.js');
  const Q = (o) => (v, u, paren) => MA.q(v, u, { prefixes: o.prefixes, sig: o.sig ?? 3, paren });
  const num = (v, o) => '`' + U.num(v, o || { sig: 3 }) + '`';
  const step = (f, s, v, u) => ({ f, s, v, u });
  const sol = (sym, u, v, steps, mistakes = [], extra = {}) => Object.assign({ sym, u, v, steps, mistakes: mistakes.filter((m) => isFinite(m.v) && Math.abs(m.v - v) > 1e-12 * Math.max(1, Math.abs(v))) }, extra);
  const log10 = Math.log10;

  /* ======================= Decibel ======================= */
  // p = { ratio | dB, kind: 'tensione' | 'potenza', find: 'dB' | 'ratio' }
  function db(p, o = {}) {
    const k = p.kind === 'potenza' ? 10 : 20;
    if (p.find === 'ratio') {
      const v = 10 ** (p.dB / k);
      return sol('A', '', v, [step(`A = 10^{G_{dB}/${k}}`, `A = 10^{${num(p.dB)}/${k}} = ${num(v)}`, v, '')], [{ id: 'db-potenza', v: 10 ** (p.dB / (30 - k)) }, { id: 'formula-inversa', v: p.dB / k }]);
    }
    const v = k * log10(p.ratio);
    return sol('G_{dB}', 'dB', v, [step(`G_{dB} = ${k} * log(A)`, `G_{dB} = ${k} * log(${num(p.ratio)}) = \`${U.num(v, { dec: 1 })} dB\``, v, 'dB')], [{ id: 'db-potenza', v: (30 - k) * log10(p.ratio) }, { id: 'formula-inversa', v: k * Math.log(p.ratio) }], { abs: 0.1 });
  }

  /* ======================= Filtri RC del primo ordine ======================= */
  const fcRC = (R, C) => 1 / (2 * Math.PI * R * C);
  // modulo e fase della funzione di trasferimento alla frequenza f
  function H(kind, f, fc, K = 1) {
    const x = f / fc;
    const mod = kind === 'alto' ? x / Math.sqrt(1 + x * x) : 1 / Math.sqrt(1 + x * x);
    const ph = kind === 'alto' ? 90 - Math.atan(x) * 180 / Math.PI : -Math.atan(x) * 180 / Math.PI;
    return { mod: Math.abs(K) * mod, phase: ph + (K < 0 ? 180 : 0), dB: 20 * log10(Math.abs(K) * mod) };
  }
  // Bode asintotico: 0 dB (o 20·log K) fino a f_c, poi −20 dB/decade (passa-basso); il contrario per il passa-alto
  function bodeAsym(kind, f, fc, K = 1) {
    const g0 = 20 * log10(Math.abs(K));
    if (kind === 'alto') return f >= fc ? g0 : g0 + 20 * log10(f / fc);
    return f <= fc ? g0 : g0 - 20 * log10(f / fc);
  }
  /* p = { kind: 'basso' | 'alto', R, C, f, Vin, K (guadagno in banda per i filtri attivi), find: 'fc' | 'mod' | 'dB' | 'phi' | 'Vout' | 'asint' } */
  function filterRC(p, o = {}) {
    const q = Q(o);
    const fc = fcRC(p.R, p.C);
    const steps = [step('f_c = 1/{2 * pi * R * C}', `f_c = 1/{2 * pi * ${q(p.R, 'Ω')} * ${q(p.C, 'F')}} = ${q(fc, 'Hz')}`, fc, 'Hz')];
    if (p.find === 'fc') return sol('f_c', 'Hz', fc, steps, [{ id: 'omega-f', v: 1 / (p.R * p.C) }, { id: 'omega-f', v: 2 * Math.PI / (p.R * p.C) }]);
    const K = p.K ?? 1;
    const h = H(p.kind, p.f, fc, K);
    const x = p.f / fc;
    const fMod = p.kind === 'alto' ? '|H| = {f/f_c}/sqrt(1 + (f/f_c)^2)' : '|H| = 1/sqrt(1 + (f/f_c)^2)';
    const sMod = p.kind === 'alto' ? `|H| = {${num(x)}}/sqrt(1 + ${num(x)}^2) = ${num(h.mod / Math.abs(K), { dec: 3 })}` : `|H| = 1/sqrt(1 + ${num(x)}^2) = ${num(h.mod / Math.abs(K), { dec: 3 })}`;
    steps.push(step('f/f_c', `f/f_c = ${q(p.f, 'Hz')}/${q(fc, 'Hz')} = ${num(x)}`, x, ''));
    if (p.find === 'phi') {
      const f = p.kind === 'alto' ? 'phi = 90° - arctan(f/f_c)' : 'phi = -arctan(f/f_c)';
      steps.push(step(f, `phi = ${p.kind === 'alto' ? '90° - ' : '-'}arctan(${num(x)}) = \`${U.num(h.phase, { dec: 1 })}°\``, h.phase, '°'));
      return sol('phi', '°', h.phase, steps, [{ id: 'fase-filtro', v: -h.phase }, { id: 'fase-filtro', v: p.kind === 'alto' ? -Math.atan(x) * 180 / Math.PI : 90 - Math.atan(x) * 180 / Math.PI }], { abs: 0.5 });
    }
    steps.push(step(fMod, sMod, h.mod / Math.abs(K), ''));
    const modWrong = p.kind === 'alto' ? 1 / Math.sqrt(1 + x * x) : x / Math.sqrt(1 + x * x);
    if (p.find === 'mod') {
      if (K !== 1) steps.push(step('|A| = |K| * |H|', `|A| = ${num(Math.abs(K))} * ${num(h.mod / Math.abs(K), { dec: 3 })} = ${num(h.mod, { dec: 3 })}`, h.mod, ''));
      return sol(K !== 1 ? '|A|' : '|H|', '', h.mod, steps, [{ id: 'fase-filtro', v: Math.abs(K) * modWrong }, { id: 'omega-f', v: Math.abs(K) * H(p.kind, p.f * 2 * Math.PI, fc).mod }], { abs: 0.005 });
    }
    if (p.find === 'dB') {
      steps.push(step('G_{dB} = 20 * log(|A|)', `G_{dB} = 20 * log(${num(h.mod, { dec: 3 })}) = \`${U.num(h.dB, { dec: 1 })} dB\``, h.dB, 'dB'));
      return sol('G_{dB}', 'dB', h.dB, steps, [{ id: 'db-potenza', v: 10 * log10(h.mod) }, { id: 'bode-pendenza', v: bodeAsym(p.kind, p.f, fc, K) }, { id: 'fase-filtro', v: 20 * log10(Math.abs(K) * modWrong) }], { abs: 0.1, accept: [] });
    }
    if (p.find === 'asint') {
      const g = bodeAsym(p.kind, p.f, fc, K);
      const f = p.kind === 'alto' ? 'G = 20 * log(f/f_c)' : 'G = -20 * log(f/f_c)';
      const below = p.kind === 'alto' ? p.f < fc : p.f > fc;
      steps.push(below ? step(f, `G = ${p.kind === 'alto' ? '' : '-'}20 * log(${num(x)}) = \`${U.num(g, { dec: 1 })} dB\``, g, 'dB') : step('G = 0', `"in banda passante:" G = \`${U.num(g, { dec: 1 })} dB\``, g, 'dB'));
      return sol('G', 'dB', g, steps, [{ id: 'bode-pendenza', v: below ? g / 2 : g - 20 }, { id: 'segno', v: -g }], { abs: 0.2 });
    }
    // tensione d'uscita (efficace o di picco, come l'ingresso)
    const v = p.Vin * h.mod;
    steps.push(step('V_{out} = |H| * V_{in}', `V_{out} = ${num(h.mod, { dec: 3 })} * ${q(p.Vin, 'V')} = ${q(v, 'V')}`, v, 'V'));
    return sol('V_{out}', 'V', v, steps, [{ id: 'fase-filtro', v: p.Vin * Math.abs(K) * modWrong }, { id: 'carico-ignorato', v: p.Vin }]);
  }
  /* filtro attivo invertente del primo ordine: passa-basso con C in parallelo a R_f (f_c = 1/(2π·R_f·C)),
     passa-alto con C in serie a R_1 (f_c = 1/(2π·R_1·C)); guadagno in banda K = −R_f/R_1 */
  function activeFilter(p, o = {}) {
    const q = Q(o);
    const K = -p.Rf / p.R1;
    const Rc = p.kind === 'alto' ? p.R1 : p.Rf;
    const fc = fcRC(Rc, p.C);
    const steps = [step('K = -R_f/R_1', `K = -${q(p.Rf, 'Ω')}/${q(p.R1, 'Ω')} = ${num(K)}`, K, '')];
    if (p.find === 'K') return sol('K', '', K, steps, [{ id: 'segno-invertente', v: -K }]);
    if (p.find === 'KdB') { const v = 20 * log10(Math.abs(K)); steps.push(step('K_{dB} = 20 * log(|K|)', `K_{dB} = 20 * log(${num(Math.abs(K))}) = \`${U.num(v, { dec: 1 })} dB\``, v, 'dB')); return sol('K_{dB}', 'dB', v, steps, [{ id: 'db-potenza', v: v / 2 }], { abs: 0.1 }); }
    steps.push(step(p.kind === 'alto' ? 'f_c = 1/{2 * pi * R_1 * C}' : 'f_c = 1/{2 * pi * R_f * C}', `f_c = 1/{2 * pi * ${q(Rc, 'Ω')} * ${q(p.C, 'F')}} = ${q(fc, 'Hz')}`, fc, 'Hz'));
    return sol('f_c', 'Hz', fc, steps, [{ id: 'filtro-attivo-r', v: fcRC(p.kind === 'alto' ? p.Rf : p.R1, p.C) }, { id: 'omega-f', v: 1 / (Rc * p.C) }]);
  }

  /* ======================= Conversione A/D e D/A ======================= */
  // p = { VFS, n, Vin | N, find: 'Q' | 'levels' | 'N' | 'err' | 'Vout' | 'bits' }
  function adc(p, o = {}) {
    const q = Q(o);
    const L = 2 ** p.n;
    const Qv = p.VFS / L;
    const steps = [];
    if (p.find === 'levels') return sol('N_{livelli}', '', L, [step('N = 2^n', `N = 2^${p.n} = ${L}`, L, '')], [{ id: 'bit-livelli', v: 2 * p.n }, { id: 'bit-livelli', v: L - 1 }]);
    steps.push(step('Q = V_{FS}/2^n', `Q = ${q(p.VFS, 'V')}/2^${p.n} = ${q(Qv, 'V')}`, Qv, 'V'));
    if (p.find === 'Q') return sol('Q', 'V', Qv, steps, [{ id: 'quanto-meno-uno', v: p.VFS / (L - 1) }, { id: 'bit-livelli', v: p.VFS / p.n }, { id: 'bit-livelli', v: p.VFS / (2 * p.n) }]);
    if (p.find === 'err') { const v = Qv / 2; steps.push(step('e_{max} = Q/2', `e_{max} = ${q(Qv, 'V')}/2 = ${q(v, 'V')}`, v, 'V')); return sol('e_{max}', 'V', v, steps, [{ id: 'troncamento', v: Qv }]); }
    if (p.find === 'Vout') {
      const v = p.N * Qv;
      steps.push(step('V_{out} = N * Q', `V_{out} = ${p.N} * ${q(Qv, 'V')} = ${q(v, 'V')}`, v, 'V'));
      return sol('V_{out}', 'V', v, steps, [{ id: 'quanto-meno-uno', v: p.N * p.VFS / (L - 1) }, { id: 'bit-livelli', v: (p.N + 1) * Qv }]);
    }
    // codice d'uscita (arrotondato al livello più vicino, al massimo 2ⁿ − 1)
    const exact = p.Vin / Qv;
    const N = Math.min(L - 1, Math.max(0, Math.round(exact)));
    steps.push(step('N = V_{in}/Q', `N = ${q(p.Vin, 'V')}/${q(Qv, 'V')} = ${num(exact, { sig: 4 })} → ${N}`, N, ''));
    if (p.find === 'N') return sol('N', '', N, steps, [{ id: 'troncamento', v: Math.min(L - 1, Math.floor(exact)) }, { id: 'quanto-meno-uno', v: Math.round(p.Vin / (p.VFS / (L - 1))) }], { exact: 0 });
    // in binario
    const bits = NS.toBase(N, 2, { bits: p.n, group: false });
    steps.push(step('N_2', `N = ${N} → "${bits}"`, N, ''));
    return sol('N_2', '', bits, steps, [], { binary: true });
  }
  // D/A a resistori pesati con l'operazionale: V_out = −V_ref·(R_f/R)·Σ b_k/2^k (MSB con R, poi 2R, 4R…)
  function dacWeighted(p, o = {}) {
    const q = Q(o);
    const bits = String(p.code).split('').map(Number);
    const s = bits.reduce((a, b, i) => a + b / 2 ** i, 0);
    const v = -p.Vref * p.Rf / p.R * s;
    return sol('V_{out}', 'V', v, [step('V_{out} = -V_{ref} * R_f/R * (b_{n-1} + b_{n-2}/2 + b_{n-3}/4)', `V_{out} = -${q(p.Vref, 'V')} * ${q(p.Rf, 'Ω')}/${q(p.R, 'Ω')} * ${num(s, { sig: 4 })} = ${q(v, 'V')}`, v, 'V')], [{ id: 'segno-invertente', v: -v }]);
  }
  // campionamento: frequenza minima e frequenza apparente (aliasing)
  function sampling(p, o = {}) {
    const q = Q(o);
    if (p.find === 'alias') {
      const k = Math.round(p.f / p.fs);
      const v = Math.abs(p.f - k * p.fs);
      return sol('f_a', 'Hz', v, [step('f_a = |f - k * f_s|', `f_a = |${q(p.f, 'Hz')} - ${k} * ${q(p.fs, 'Hz')}| = ${q(v, 'Hz')}`, v, 'Hz')], [{ id: 'nyquist', v: p.f }, { id: 'nyquist', v: p.fs - p.f }]);
    }
    const v = 2 * p.fmax;
    return sol('f_{s,min}', 'Hz', v, [step('f_s >= 2 * f_{max}', `f_{s,min} = 2 * ${q(p.fmax, 'Hz')} = ${q(v, 'Hz')}`, v, 'Hz')], [{ id: 'nyquist', v: p.fmax }, { id: 'nyquist', v: p.fmax / 2 }]);
  }

  const api = { db, fcRC, H, bodeAsym, filterRC, activeFilter, adc, dacWeighted, sampling };
  root.ElekSignals = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
