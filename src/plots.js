/* ELEKTRON — grafici e strumenti in SVG: schermo dell'oscilloscopio, grafici x–y (transitori, Bode), diagrammi temporali,
   resistore con le bande del codice colori, mappa di Karnaugh con i gruppi, display del multimetro.
   Più tracce si distinguono anche per il tratteggio e per l'etichetta, non solo per il colore. Ogni disegno ha la descrizione. */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const LG = root.ElekLogic || require('./logic.js');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const r1 = (x) => Math.round(x * 10) / 10;
  // testo con i pedici scritti come x_y o x_{yz}
  const subT = (t) => esc(t).replace(/_\{([^}]*)\}|_([A-Za-z0-9]+)/g, (m, a, b) => `<tspan dy="3" font-size="9">${a || b}</tspan><tspan dy="-3"></tspan>`);
  const svgWrap = (w, h, body, label, cls = '') => `<svg class="sch${cls ? ' ' + cls : ''}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;

  /* ---------- Oscilloscopio ---------- */
  /* o = { traces: [{ Vp, f, phase (gradi), dc, label }], vdiv: [V/div per traccia], tdiv (s/div), divX = 10, divY = 8, wave: 'sin'|'square'|'tri' } */
  function scope(o) {
    const dx = 30, dy = 30, nx = o.divX || 10, ny = o.divY || 8;
    const W = nx * dx, H = ny * dy, pad = 10, top = 22;
    let s = `<rect class="scope-bg" x="0" y="0" width="${W + 2 * pad}" height="${H + top + 30}" rx="8"/>`;
    const X0 = pad, Y0 = top;
    for (let i = 0; i <= nx; i++) s += `<line class="${i === nx / 2 ? 'scope-axis' : 'scope-grid'}" x1="${X0 + i * dx}" y1="${Y0}" x2="${X0 + i * dx}" y2="${Y0 + H}"/>`;
    for (let j = 0; j <= ny; j++) s += `<line class="${j === ny / 2 ? 'scope-axis' : 'scope-grid'}" x1="${X0}" y1="${Y0 + j * dy}" x2="${X0 + W}" y2="${Y0 + j * dy}"/>`;
    // tacche di 1/5 di divisione sugli assi centrali
    for (let i = 0; i < nx * 5; i++) s += `<line class="scope-grid" x1="${r1(X0 + i * dx / 5)}" y1="${Y0 + H / 2 - 3}" x2="${r1(X0 + i * dx / 5)}" y2="${Y0 + H / 2 + 3}"/>`;
    for (let j = 0; j < ny * 5; j++) s += `<line class="scope-grid" x1="${X0 + W / 2 - 3}" y1="${r1(Y0 + j * dy / 5)}" x2="${X0 + W / 2 + 3}" y2="${r1(Y0 + j * dy / 5)}"/>`;
    const tTot = nx * o.tdiv;
    const descs = [];
    o.traces.forEach((t, k) => {
      const vdiv = (o.vdiv || [])[k] || o.vdiv || 1;
      const pts = [];
      for (let i = 0; i <= 400; i++) {
        const tt = tTot * i / 400;
        const ph = 2 * Math.PI * t.f * tt + (t.phase || 0) * Math.PI / 180;
        let v;
        if ((t.wave || o.wave) === 'square') v = Math.sin(ph) >= 0 ? t.Vp : -t.Vp;
        else if ((t.wave || o.wave) === 'tri') v = t.Vp * (2 / Math.PI) * Math.asin(Math.sin(ph));
        else v = t.Vp * Math.sin(ph);
        v += t.dc || 0;
        const y = Y0 + H / 2 - (v / vdiv) * dy;
        pts.push(`${r1(X0 + W * i / 400)} ${r1(Math.max(Y0 - 2, Math.min(Y0 + H + 2, y)))}`);
      }
      s += `<path class="scope-tr${k + 1}" d="M${pts.join('L')}"/>`;
      descs.push(`traccia ${k + 1}${t.label ? ' (' + t.label + ')' : ''}: ${U.fmt(vdiv, 'V')}/div`);
    });
    s += `<text class="scope-txt" x="${X0}" y="15">${esc(o.traces.map((t, k) => `CH${k + 1} ${U.fmt((o.vdiv || [])[k] || o.vdiv || 1, 'V')}/div`).join('   '))}</text>`;
    s += `<text class="scope-txt" x="${X0 + W}" y="15" text-anchor="end">${esc(U.fmt(o.tdiv, 's') + '/div')}</text>`;
    const label = o.label || `Schermo dell'oscilloscopio con ${nx} divisioni orizzontali e ${ny} verticali; base dei tempi ${U.fmt(o.tdiv, 's')} per divisione; ${descs.join('; ')}.`;
    return svgWrap(W + 2 * pad, H + top + 14, s, label, 'scope');
  }
  /* ---------- Grafico x–y ---------- */
  /* o = { series: [{ pts: [[x,y]…], cls: 'pl-tr1', label }], x: { min, max, log, label, ticks }, y: { min, max, label, ticks }, marks: [{ x, label }], w, h } */
  function plot(o) {
    const W = o.w || 300, H = o.h || 186, L = 44, R = 10, T = 22, B = 34;
    const pw = W - L - R, ph = H - T - B;
    const lx = (x) => (o.x.log ? Math.log10(x) : x);
    const X = (x) => L + (lx(x) - lx(o.x.min)) / (lx(o.x.max) - lx(o.x.min)) * pw;
    const Y = (y) => T + (1 - (y - o.y.min) / (o.y.max - o.y.min)) * ph;
    let s = '';
    const xt = o.x.ticks || (o.x.log ? decades(o.x.min, o.x.max) : linTicks(o.x.min, o.x.max));
    const yt = o.y.ticks || linTicks(o.y.min, o.y.max);
    for (const t of xt) s += `<line class="pl-grid" x1="${r1(X(t.v))}" y1="${T}" x2="${r1(X(t.v))}" y2="${T + ph}"/><text class="pl-lab" x="${r1(X(t.v))}" y="${T + ph + 14}" text-anchor="middle">${esc(t.l)}</text>`;
    for (const t of yt) s += `<line class="pl-grid" x1="${L}" y1="${r1(Y(t.v))}" x2="${L + pw}" y2="${r1(Y(t.v))}"/><text class="pl-lab" x="${L - 5}" y="${r1(Y(t.v) + 4)}" text-anchor="end">${esc(t.l)}</text>`;
    s += `<line class="pl-axis" x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}"/><line class="pl-axis" x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}"/>`;
    for (const m of o.marks || []) s += `<line class="pl-mark" x1="${r1(X(m.x))}" y1="${T}" x2="${r1(X(m.x))}" y2="${T + ph}"/><text class="pl-lab" x="${r1(X(m.x) + 3)}" y="${T + 10}">${subT(m.label)}</text>`;
    for (const sr of o.series) {
      const d = sr.pts.filter(([x]) => x >= o.x.min && x <= o.x.max).map(([x, y], i) => `${i ? 'L' : 'M'}${r1(X(x))} ${r1(Math.max(T - 4, Math.min(T + ph + 4, Y(y))))}`).join('');
      s += `<path class="${sr.cls || 'pl-tr1'}" d="${d}"/>`;
    }
    // legenda: esempio di tratto + nome
    let ly = T + 4;
    for (const sr of o.series) if (sr.label) { s += `<line class="${sr.cls || 'pl-tr1'}" x1="${L + pw - 92}" y1="${ly + 6}" x2="${L + pw - 70}" y2="${ly + 6}"/><text class="pl-key" x="${L + pw - 66}" y="${ly + 10}">${esc(sr.label)}</text>`; ly += 16; }
    s += `<text class="pl-lab" x="${L + pw}" y="${H - 4}" text-anchor="end">${esc(o.x.label || '')}</text><text class="pl-lab" x="4" y="12">${subT(o.y.label || '')}</text>`;
    return svgWrap(W, H, s, o.desc || 'Grafico');
  }
  function linTicks(a, b, n = 5) {
    const step = niceStep((b - a) / n);
    const out = [];
    for (let v = Math.ceil(a / step) * step; v <= b + 1e-12; v += step) out.push({ v, l: U.num(Math.abs(v) < 1e-12 ? 0 : v, { sig: 3 }) });
    return out;
  }
  function decades(a, b) { const out = []; for (let e = Math.ceil(Math.log10(a)); e <= Math.floor(Math.log10(b)); e++) out.push({ v: 10 ** e, l: U.fmt(10 ** e, '', { sig: 2 }).replace(/\s/g, '') }); return out; }
  function niceStep(x) { const e = 10 ** Math.floor(Math.log10(x)); const m = x / e; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * e; }
  // transitorio con i multipli di τ segnati
  function transient(o) {
    const TR = root.ElekTransient || require('./transient.js');
    const tEnd = 5 * o.tau;
    const pts = TR.curve(o.x0, o.xf, o.tau, tEnd, 160);
    const ymax = Math.max(o.x0, o.xf), ymin = Math.min(0, o.x0, o.xf);
    const ticks = [0, 1, 2, 3, 4, 5].map((k) => ({ v: k * o.tau, l: k ? k + 'τ' : '0' }));
    return plot({ series: [{ pts, cls: 'pl-tr1' }], x: { min: 0, max: tEnd, ticks, label: 't' }, y: { min: ymin, max: ymax * 1.05 || 1, label: o.ylabel || 'v_C (V)' }, w: o.w, h: o.h,
      desc: o.desc || `Grafico del transitorio: parte da ${U.fmt(o.x0, o.u || 'V')} e tende a ${U.fmt(o.xf, o.u || 'V')}; costante di tempo τ = ${U.fmt(o.tau, 's')}; dopo 1τ ha percorso il 63 % della variazione, dopo 5τ il 99 %.` });
  }
  // diagramma di Bode del modulo: curva vera e asintotica
  function bode(o) {
    const SG = root.ElekSignals || require('./signals.js');
    const f0 = o.fc / 100, f1 = o.fc * 100;
    const real = [], asym = [];
    for (let i = 0; i <= 120; i++) { const f = f0 * (f1 / f0) ** (i / 120); real.push([f, SG.H(o.kind, f, o.fc, o.K || 1).dB]); asym.push([f, SG.bodeAsym(o.kind, f, o.fc, o.K || 1)]); }
    const g0 = 20 * Math.log10(Math.abs(o.K || 1));
    return plot({ series: [{ pts: asym, cls: 'pl-asym', label: 'asintotico' }, { pts: real, cls: 'pl-tr1', label: 'reale' }], x: { min: f0, max: f1, log: true, label: 'f (Hz)' }, y: { min: g0 - 45, max: g0 + 5, label: '|A| (dB)' }, marks: [{ x: o.fc, label: 'f_c' }], w: o.w, h: o.h,
      desc: o.desc || `Diagramma di Bode del modulo di un filtro passa-${o.kind} del primo ordine con frequenza di taglio ${U.fmt(o.fc, 'Hz')}: ${o.kind === 'alto' ? 'sotto' : 'oltre'} la frequenza di taglio l’asintoto ${o.kind === 'alto' ? 'sale' : 'scende'} di 20 dB per decade; alla frequenza di taglio la curva reale è 3 dB sotto l’asintoto.` });
  }
  /* ---------- Diagramma temporale (segnali digitali) ---------- */
  // signals: [{ name, levels: [0,1,…] }] campionati a passi uguali; o.edges: indici dei fronti attivi del clock
  function timing(signals, o = {}) {
    const step = o.step || 22, rowH = 34, L = 40;
    const n = Math.max(...signals.map((s) => s.levels.length));
    const W = L + n * step + 10, H = signals.length * rowH + 10;
    let s = '';
    for (let k = 0; k <= n; k++) s += `<line class="pl-grid" x1="${L + k * step}" y1="4" x2="${L + k * step}" y2="${H - 4}"/>`;
    signals.forEach((sg, i) => {
      const y1 = 10 + i * rowH, y0 = y1 + 20;
      s += `<text class="sch-t" x="${L - 6}" y="${y0 - 5}" text-anchor="end">${esc(sg.name)}</text>`;
      let d = '';
      sg.levels.forEach((v, k) => { const y = v ? y1 : y0; d += k === 0 ? `M${L} ${y}` : `V${y}`; d += `H${L + (k + 1) * step}`; });
      s += `<path class="${i === 0 ? 'pl-tr3' : i % 2 ? 'pl-tr1' : 'pl-tr2'}" d="${d}"/>`;
      // la cifra sopra ogni tratto: il livello si legge anche senza la forma dell'onda
      if (o.bits !== false && i > 0) sg.levels.forEach((v, k) => { if (k === 0 || v !== sg.levels[k - 1]) s += `<text class="pl-lab" x="${L + k * step + 4}" y="${(v ? y1 : y0) - 3}">${v}</text>`; });
    });
    const desc = o.desc || 'Diagramma temporale. ' + signals.map((sg) => `${sg.name}: ${sg.levels.join(' ')}`).join('; ') + '.';
    return svgWrap(W, H, s, desc);
  }

  /* ---------- Resistore con le bande del codice colori ---------- */
  const COLOR_VAR = { nero: '#1A1A1A', marrone: '#7A4A21', rosso: '#C62828', arancio: '#EF6C00', giallo: '#F9D423', verde: '#2E7D32', blu: '#1565C0', viola: '#6A1B9A', grigio: '#8A8A8A', bianco: '#F5F5F5', oro: '#C9A227', argento: '#B8BEC4' };
  /* i colori delle bande sono quelli veri del codice: sono dati, non decorazione; sotto ogni banda c'è il suo nome abbreviato
     e la cifra, così il codice si legge anche senza distinguere i colori */
  function resistor(bands, o = {}) {
    const W = 300, H = 112;
    const n = bands.length;
    const bx0 = 92, bw = 12, gap = n === 4 ? 20 : 15;
    let s = `<line class="sch-w" x1="10" y1="40" x2="${W - 10}" y2="40"/><rect class="cc-body" x="70" y="18" width="160" height="44" rx="18"/>`;
    const meaning = (b, i) => {
      const c = U.COLOR[b];
      if (i < n - 2) return String(c.d);
      if (i === n - 2) return '×10' + supNum(c.m);
      return '±' + U.num(c.tol) + ' %';
    };
    const xs = bands.map((_, i) => (i === n - 1 ? (n === 5 ? 206 : 196) : (n === 5 ? 80 : bx0) + i * (bw + gap)));
    bands.forEach((b, i) => {
      const x = xs[i];
      s += `<rect class="cc-band" x="${x}" y="18" width="${bw}" height="44" fill="${COLOR_VAR[b] || '#999'}"/>`;
      if (!o.hideDigits) {
        s += `<text class="cc-txt" x="${x + bw / 2}" y="80" text-anchor="middle">${esc(o.hideMeaning ? (i + 1) + 'ª' : meaning(b, i))}</text>`;
        s += `<text class="cc-sub" x="${x + bw / 2}" y="94" text-anchor="middle">${esc(b.slice(0, 3))}</text>`;
      }
    });
    const desc = o.desc || `Resistore a ${n} bande: ${bands.map((b, i) => `${i + 1}ª banda ${b}${o.hideMeaning ? '' : ' (' + meaning(b, i).replace('×10', 'per 10 alla ').replace('±', 'più o meno ') + ')'}`).join(', ')}.`;
    return svgWrap(W, H - 6, s, desc, 'cc');
  }
  const supNum = (m) => String(m).split('').map((c) => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' })[c]).join('');

  /* ---------- Mappa di Karnaugh ---------- */
  // km: risultato di logic.kmap; groups: implicanti ('1-0-'); vars: nomi delle variabili
  function kmap(km, vars, groups = [], o = {}) {
    const cw = 44, ch = 40, L = 70, T = 46;
    const nr = km.rows.length, nc = km.cols.length;
    const W = L + nc * cw + 14, H = T + nr * ch + 14;
    let s = `<text class="km-hd" x="${L - 8}" y="${T - 26}" text-anchor="end">${esc(km.rowVars.join(''))}\\${esc(km.colVars.join(''))}</text>`;
    km.cols.forEach((c, j) => { s += `<text class="km-hd" x="${L + j * cw + cw / 2}" y="${T - 8}" text-anchor="middle">${c}</text>`; });
    km.rows.forEach((r, i) => { s += `<text class="km-hd" x="${L - 10}" y="${T + i * ch + ch / 2 + 5}" text-anchor="end">${r}</text>`; });
    km.grid.forEach((row, i) => row.forEach((v, j) => {
      s += `<rect class="km-cell" x="${L + j * cw}" y="${T + i * ch}" width="${cw}" height="${ch}"/>`;
      if (!o.empty) s += `<text class="km-val" x="${L + j * cw + cw / 2}" y="${T + i * ch + ch / 2 + 6}" text-anchor="middle">${v === '-' ? '–' : v}</text>`;
      if (o.index) s += `<text class="pl-lab" x="${L + j * cw + 4}" y="${T + i * ch + 11}">${km.cell(i, j)}</text>`;
    }));
    // gruppi: rettangoli con gli angoli arrotondati; un gruppo che passa dal bordo si disegna a pezzi
    groups.forEach((g, k) => {
      const cells = LG.groupCells(g, vars);
      const rows = [...new Set(cells.map((c) => c[0]))].sort((a, b) => a - b), cols = [...new Set(cells.map((c) => c[1]))].sort((a, b) => a - b);
      const runs = (idx, n) => { const out = []; let start = idx[0], prev = idx[0]; for (const x of idx.slice(1)) { if (x !== prev + 1) { out.push([start, prev]); start = x; } prev = x; } out.push([start, prev]); return out; };
      const inset = 4 + k * 3;
      for (const [r0, r1_] of runs(rows, nr)) for (const [c0, c1] of runs(cols, nc)) {
        s += `<rect class="km-g${(k % 4) + 1}" x="${L + c0 * cw + inset}" y="${T + r0 * ch + inset}" width="${(c1 - c0 + 1) * cw - 2 * inset}" height="${(r1_ - r0 + 1) * ch - 2 * inset}" rx="12"/>`;
      }
    });
    const ones = [];
    km.grid.forEach((row, i) => row.forEach((v, j) => { if (v === 1) ones.push(km.cell(i, j)); }));
    const desc = o.desc || `Mappa di Karnaugh di ${vars.length} variabili (righe ${km.rowVars.join('')}, colonne ${km.colVars.join('')}, in ordine di Gray). Caselle a 1: mintermini ${ones.join(', ') || 'nessuno'}.${groups.length ? ' Gruppi: ' + groups.map((g) => LG.text(LG.impToTerm(g, vars))).join(', ') + '.' : ''}`;
    return svgWrap(W, H, s, desc, 'km');
  }

  /* ---------- Multimetro (display) ---------- */
  // o = { mode: 'V'|'A'|'Ω', range: 20 (fondo scala, nell'unità base), reading (valore misurato) }
  function multimeter(o) {
    const W = 220, H = 86;
    const over = Math.abs(o.reading) > o.range;
    // le cifre dipendono dalla portata: 3 cifre e mezza (fondo scala 1999 conteggi)
    const e3 = Math.floor(Math.log10(o.range * 1.0000001) / 3) * 3;
    const p = Object.keys(U.PREFIX).find((k) => U.PREFIX[k] === e3) ?? '';
    const div = 10 ** U.PREFIX[p];
    const full = o.range / div;
    const dec = full >= 1000 ? 0 : full >= 100 ? 1 : full >= 10 ? 2 : 3;
    const txt = over ? '1.' : (o.reading / div).toFixed(dec).replace('.', ',');
    let s = `<rect class="cc-body" x="0" y="0" width="${W}" height="${H}" rx="12"/><rect class="scope-bg" x="14" y="12" width="${W - 28}" height="48" rx="6"/>`;
    s += `<text class="scope-txt mm-digits" x="${W - 52}" y="48" text-anchor="end">${esc(txt)}</text><text class="scope-txt" x="${W - 22}" y="48" text-anchor="end">${esc(p + (o.mode === 'Ω' ? 'Ω' : o.mode))}</text>`;
    s += `<text class="cc-sub" x="16" y="78">${esc('portata ' + U.fmt(o.range, o.mode === 'Ω' ? 'Ω' : o.mode))}</text>`;
    const desc = o.desc || (over ? `Display del multimetro: fuori portata (sulla portata ${U.fmt(o.range, o.mode)} compare 1 a sinistra).` : `Display del multimetro: ${txt} ${p}${o.mode}, portata ${U.fmt(o.range, o.mode)}.`);
    return svgWrap(W, H, s, desc, 'mm');
  }

  function demo() {
    const out = [];
    out.push(`<h2>Oscilloscopio</h2>${scope({ traces: [{ Vp: 3, f: 1000, label: 'ingresso' }, { Vp: 1.5, f: 1000, phase: -60, label: 'uscita' }], vdiv: [1, 1], tdiv: 0.0002 })}`);
    out.push(`<h2>Transitorio</h2>${transient({ x0: 0, xf: 10, tau: 0.001 })}`);
    out.push(`<h2>Bode</h2>${bode({ kind: 'basso', fc: 1000 })}`);
    out.push(`<h2>Diagramma temporale</h2>${timing([{ name: 'CLK', levels: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0] }, { name: 'D', levels: [1, 1, 0, 0, 1, 1, 1, 1, 0, 0] }, { name: 'Q', levels: [1, 1, 0, 0, 1, 1, 1, 1, 0, 0] }])}`);
    out.push(`<h2>Codice colori</h2>${resistor(['giallo', 'viola', 'rosso', 'oro'])}${resistor(['marrone', 'nero', 'nero', 'rosso', 'marrone'])}`);
    const vars = ['A', 'B', 'C', 'D'];
    const km = LG.kmap([0, 2, 5, 7, 8, 10, 13, 15], vars);
    out.push(`<h2>Karnaugh</h2>${kmap(km, vars, ['-0-0', '-1-1'])}`);
    out.push(`<h2>Multimetro</h2>${multimeter({ mode: 'V', range: 20, reading: 8.16 })}${multimeter({ mode: 'A', range: 0.2, reading: 0.0147 })}`);
    return out;
  }

  const api = { scope, plot, transient, bode, timing, resistor, kmap, multimeter, COLOR_VAR, demo, linTicks };
  root.ElekPlots = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
