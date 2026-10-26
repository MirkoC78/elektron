/* ELEKTRON — schemi elettrici in SVG, generati dalla stessa descrizione da cui il motore ricava la netlist.
   Simboli secondo CEI EN 60617: resistore rettangolare, induttore ad archi, generatore ideale di tensione (cerchio attraversato
   dal conduttore) e di corrente (cerchio con il segmento trasversale), diodo a triangolo, strumenti come cerchio con la lettera.
   Lo stile viene dalle classi (gettoni dei temi chiaro e scuro in app.css): fili .sch-w, componenti .sch-c, testi .sch-t.
   Correnti e tensioni si distinguono anche senza colori: la corrente è una freccia piena sul conduttore, la tensione una
   freccia tratteggiata accanto al componente con la punta verso il + e il segno +.
   Ogni schema ha una descrizione testuale per i lettori di schermo. */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const CI = root.ElekCircuit || require('./circuit.js');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const r1 = (x) => Math.round(x * 10) / 10;
  const EL = 60; // lunghezza di un componente (con i reofori)

  /* ---------- Testi con i pedici ---------- */
  // «R1» → R con 1 a pedice; «RL» → R con L a pedice; «V_{CE}» → V con CE a pedice
  function labelParts(id) {
    const s = String(id);
    let m = s.match(/^([A-Za-zΑ-ω]+?)_\{?([^}]*)\}?$/);
    if (m) return [m[1], m[2]];
    m = s.match(/^(DZ|LED|VCC|VDD|VEE|VI|VO|OA|SW|AM|VM)(.*)$/);
    if (m) return [m[1] === 'DZ' ? 'D' : m[1] === 'OA' ? 'A' : m[1], m[1] === 'DZ' ? 'Z' + m[2] : m[2]];
    m = s.match(/^([A-Za-z])(.*)$/);
    return m ? [m[1], m[2]] : [s, ''];
  }
  function tlabel(id, x, y, cls = 'sch-t', anchor = 'middle') {
    const sign = (String(id).match(/^[+\-−]/) || [''])[0];
    const [b0, sub] = labelParts(String(id).slice(sign.length));
    const b = (sign === '-' ? '−' : sign) + b0;
    return `<text class="${cls}" x="${r1(x)}" y="${r1(y)}" text-anchor="${anchor}">${esc(b)}${sub ? `<tspan class="sch-sub" dy="3">${esc(sub)}</tspan>` : ''}</text>`;
  }
  const ttext = (s, x, y, cls = 'sch-v', anchor = 'middle') => `<text class="${cls}" x="${r1(x)}" y="${r1(y)}" text-anchor="${anchor}">${esc(s)}</text>`;
  // testo centrato sul punto (lettere dentro i simboli, segni +): resta centrato anche quando il simbolo ruota
  const ctext = (s, x, y, cls = 'sch-s') => `<text class="${cls}" x="${r1(x)}" y="${r1(y)}" text-anchor="middle" dominant-baseline="central">${esc(s)}</text>`;
  // larghezza stimata di un testo (caratteri da circa 7 px)
  const tw = (s) => String(s).replace(/[_{}]/g, '').length * 6.4;

  /* ---------- Simboli (orizzontali, da x = 0 a x = 60, sull'asse y = 0) ---------- */
  const line = (x1, y1, x2, y2, cls = 'sch-w') => `<line class="${cls}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`;
  const lead = (a, b) => line(0, 0, a, 0) + line(b, 0, EL, 0);
  const arrowHead = (x, y, ang, size = 7, cls = 'sch-ah') => {
    const a = ang * Math.PI / 180, s = size;
    const p = [[x, y], [x - s * Math.cos(a) + s * 0.45 * Math.sin(a), y - s * Math.sin(a) - s * 0.45 * Math.cos(a)], [x - s * Math.cos(a) - s * 0.45 * Math.sin(a), y - s * Math.sin(a) + s * 0.45 * Math.cos(a)]];
    return `<path class="${cls}" d="M${p.map((q) => q.map(r1).join(' ')).join('L')}Z"/>`;
  };
  const SYM = {
    R: () => lead(12, 48) + '<rect class="sch-c" x="12" y="-6" width="36" height="12"/>',
    // reostato: resistore con la freccia obliqua
    RV: () => SYM.R() + line(14, 12, 46, -12, 'sch-c') + arrowHead(46, -12, -36.9, 6, 'sch-ahc'),
    // fotoresistore: due frecce entranti
    LDR: () => SYM.R() + line(18, -26, 26, -14, 'sch-c') + arrowHead(26, -14, 56.3, 5, 'sch-ahc') + line(28, -26, 36, -14, 'sch-c') + arrowHead(36, -14, 56.3, 5, 'sch-ahc'),
    // termistore NTC: tratto obliquo con il piede e «−t°»
    NTC: () => SYM.R() + `<path class="sch-c" d="M8 12L14 12L46 -12"/>` + ctext('−t°', 56, -14),
    C: (it) => line(0, 0, 27, 0) + line(33, 0, EL, 0) + line(27, -12, 27, 12, 'sch-c sch-plate') + (it && it.pol ? `<rect class="sch-c" x="33" y="-12" width="4" height="24"/>` + ctext('+', 19, -14) : line(33, -12, 33, 12, 'sch-c sch-plate')),
    L: () => line(0, 0, 10, 0) + '<path class="sch-c sch-open" d="M10 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0"/>' + line(50, 0, EL, 0),
    // generatore ideale di tensione (CEI EN 60617): cerchio attraversato dal conduttore; il + vicino al morsetto a
    V: (it) => (it && it.style === 'pila'
      ? line(0, 0, 27, 0) + line(33, 0, EL, 0) + line(27, -14, 27, 14, 'sch-c sch-plate') + `<rect class="sch-c sch-solid" x="32" y="-7" width="3" height="14"/>` + ctext('+', 20, -14)
      : line(0, 0, EL, 0) + '<circle class="sch-c sch-open" cx="30" cy="0" r="12"/>' + line(18, 0, 42, 0, 'sch-c') + ctext('+', 12, -12)),
    // generatore sinusoidale
    VAC: () => lead(18, 42) + '<circle class="sch-c" cx="30" cy="0" r="12"/><path class="sch-c sch-open" d="M22 0q4 -9 8 0t8 0"/>',
    // generatore ideale di corrente: cerchio con il segmento trasversale; la freccia indica il verso (verso il morsetto a)
    I: () => lead(18, 42) + '<circle class="sch-c" cx="30" cy="0" r="12"/>' + line(30, -12, 30, 12, 'sch-c') + line(42, -18, 20, -18, 'sch-c') + arrowHead(18, -18, 180, 6, 'sch-ahc'),
    D: () => line(0, 0, EL, 0) + '<path class="sch-c" d="M22 -10L22 10L38 0Z"/>' + line(38, -10, 38, 10, 'sch-c'),
    LED: () => SYM.D() + line(30, -12, 38, -22, 'sch-c') + arrowHead(40, -24, -51, 5, 'sch-ahc') + line(37, -9, 45, -19, 'sch-c') + arrowHead(47, -21, -51, 5, 'sch-ahc'),
    DZ: () => line(0, 0, EL, 0) + '<path class="sch-c" d="M22 -10L22 10L38 0Z"/>' + '<path class="sch-c sch-open" d="M34 -13L38 -10L38 10L42 13"/>',
    SW: (it) => line(0, 0, 20, 0) + line(40, 0, EL, 0) + '<circle class="sch-c sch-dotc" cx="20" cy="0" r="2.5"/><circle class="sch-c sch-dotc" cx="40" cy="0" r="2.5"/>' + (it && it.closed ? line(20, 0, 40, -2, 'sch-c') : line(20, 0, 39, -13, 'sch-c')),
    LAMP: () => lead(20, 40) + '<circle class="sch-c" cx="30" cy="0" r="10"/>' + line(23, -7, 37, 7, 'sch-c') + line(23, 7, 37, -7, 'sch-c'),
    AM: () => lead(18, 42) + '<circle class="sch-c" cx="30" cy="0" r="12"/>' + ctext('A', 30, 0, 'sch-m'),
    VM: () => lead(18, 42) + '<circle class="sch-c" cx="30" cy="0" r="12"/>' + ctext('V', 30, 0, 'sch-m'),
    W: () => line(0, 0, EL, 0),
    // morsetti aperti (la porta di Thevenin, i punti di misura)
    OPEN: () => '<circle class="sch-c sch-term" cx="4" cy="0" r="3.5"/><circle class="sch-c sch-term" cx="56" cy="0" r="3.5"/>' + line(-0, 0, 0.5, 0),
  };
  // nelle colonne il simbolo ruota di 90°: il morsetto a (inizio) in alto
  function place(it, x, y, vertical) {
    const key = it.t === 'V' && it.ac ? 'VAC' : it.t === 'R' && it.kind ? it.kind : it.t;
    const draw = SYM[key] || SYM.R;
    const rev = it.rev ? (vertical ? ' translate(0 60) scale(1 -1)' : ' translate(60 0) scale(-1 1)') : '';
    // nei generatori il segno + e le frecce non devono essere capovolti come testo: lo sono come disegno, che è quel che serve
    let body = draw(it);
    // nei simboli verticali (e capovolti) i testi tornano diritti: si ruotano attorno al proprio punto
    if (vertical || it.rev) body = body.replace(/<text class="([^"]*)" x="([-\d.]+)" y="([-\d.]+)"/g, (m0, c, tx, ty) => `${m0} transform="${it.rev && !vertical ? `scale(-1 1) translate(${-2 * tx} 0)` : ''}${vertical ? `rotate(-90 ${tx} ${ty})` : ''}${vertical && it.rev ? ` scale(-1 1) translate(${-2 * tx} 0)` : ''}"`);
    return `<g class="sch-el${it.hl ? ' sch-hl' : ''}" data-id="${esc(it.id)}" transform="translate(${r1(x)} ${r1(y)})${vertical ? ' rotate(90)' : ''}${vertical && it.rev ? ' translate(60 0) scale(-1 1)' : !vertical && it.rev ? rev : ''}">${body}</g>`;
  }

  /* ---------- Misure degli elementi ---------- */
  const isPar = (it) => !!it.par;
  // ingombro orizzontale (lungo il ramo) e trasversale di una sequenza di elementi
  function seqLen(items) { return (items || []).reduce((s, it) => s + (isPar(it) ? parLen(it) : EL), 0); }
  function parLen(it) { return Math.max(...it.par.map(seqLen)) + 24; }
  const PAR_GAP = 52; // distanza fra i rami di un gruppo in parallelo

  /* ---------- Valori da mostrare ---------- */
  const UNIT = { R: 'Ω', RV: 'Ω', LDR: 'Ω', NTC: 'Ω', C: 'F', L: 'H', V: 'V', I: 'A' };
  const NO_LABEL = new Set(['AM', 'VM', 'W']);
  function valueText(it, o) {
    if (it.label != null) return it.label;
    if (o.values === false || it.v == null) return '';
    if (it.t === 'D' || it.t === 'LED' || it.t === 'DZ') return it.t === 'DZ' && it.vz ? U.fmt(it.vz, 'V') : '';
    const u = UNIT[it.kind || it.t];
    if (!u) return '';
    if (it.unknown) return '?';
    return U.fmt(it.v, u, { prefixes: o.prefixes }) + (it.t === 'V' && it.ac ? ' eff.' : '');
  }

  /* ---------- Circuito a scala ---------- */
  /* ladder(spec, o) → { svg, desc, w, h }
     o.currents: [{ el, label, rev }]  frecce di corrente (verso da a a b del componente, rev per il contrario)
     o.voltages: [{ el, label, rev }]  frecce di tensione (punta verso il morsetto a, che è il +; rev per il contrario)
     o.nodes:    { A: '4,2 V' }         misure ai nodi;  o.highlight: ['R2'];  o.values: false per nascondere i valori;
     o.title: titolo per i lettori di schermo */
  function ladder(spec, o = {}) {
    const n = spec.cols.length;
    const hl = new Set(o.highlight || []);
    const mark = (items) => (items || []).map((it) => (isPar(it) ? { par: it.par.map(mark) } : Object.assign({}, it, { hl: hl.has(it.id) })));
    const cols = spec.cols.map((c) => (c ? mark(c) : null)), top = (spec.top || []).map(mark), bot = (spec.bot || []).map(mark);
    // distanza fra i binari: la colonna più lunga (o il gruppo in parallelo più alto del binario alto)
    const colH = cols.map((c) => (c ? seqLen(c) : 0));
    const topDrop = top.map((s) => Math.max(0, ...(s || []).filter(isPar).map((p) => (p.par.length - 1) * PAR_GAP)));
    const G = Math.max(80, ...colH.map((h) => h + 20), ...topDrop.map((d) => d + 64));
    // larghezza dei gruppi in parallelo dentro le colonne (rami affiancati)
    const colWide = cols.map((c) => Math.max(0, ...(c || []).filter(isPar).map((p) => (p.par.length - 1) * 64)));
    // spazio per le etichette a destra di ogni colonna
    const labelW = (c) => Math.max(0, ...(c || []).flatMap((it) => (isPar(it) ? it.par.flat() : [it])).filter((it) => !NO_LABEL.has(it.t)).map((it) => Math.max(tw(String(it.id)), tw(valueText(it, o))) + 14));
    // colonne con una freccia di tensione (disegnata a sinistra del componente)
    const volCol = new Set((o.voltages || []).map((v) => cols.findIndex((c) => (c || []).some((it) => it.id === v.el || (isPar(it) && it.par.flat().some((x) => x.id === v.el))))));
    const parShift = (i) => (i > 0 && cols[i] && (top[i] || []).some(isPar) ? labelW(cols[i]) : 0);
    const xs = [];
    const leftPad = Math.max(56, cols[0] ? labelW(cols[0]) + 18 : 24);
    xs[0] = leftPad;
    for (let i = 0; i < n - 1; i++) {
      const seg = Math.max(seqLen(top[i]), seqLen(bot[i]));
      // un gruppo in parallelo sul binario alto scende nella zona delle etichette della colonna a sinistra: parte dopo di esse
      const shift = parShift(i);
      const need = Math.max(seg + 24 + shift, colWide[i] + (i === 0 ? 0 : labelW(cols[i])) + 14 + (volCol.has(i + 1) ? 32 : 0), 64);
      xs[i + 1] = xs[i] + need;
    }
    const T = 44, B = T + G;
    const W = xs[n - 1] + colWide[n - 1] + Math.max(24, cols[n - 1] ? labelW(cols[n - 1]) + 12 : 24);
    const H = B + 40;
    const parts = [], labels = [];
    const pts = new Map(); // estremi dei conduttori: dove se ne incontrano tre c'è il pallino del nodo
    const pt = (x, y) => { const k = r1(x) + ',' + r1(y); pts.set(k, (pts.get(k) || 0) + 1); };
    const wire = (x1, y1, x2, y2) => { if (Math.abs(x1 - x2) < 0.01 && Math.abs(y1 - y2) < 0.01) return; parts.push(line(x1, y1, x2, y2)); pt(x1, y1); pt(x2, y2); };
    const geo = new Map(); // id → { x, y, vertical, len }
    // disegna una sequenza fra (x1,y) e (x2,y) orizzontale, o fra (x,y1) e (x,y2) verticale
    function seqH(items, x1, x2, y, labelSide) {
      const len = seqLen(items);
      if (!items || !items.length) { wire(x1, y, x2, y); return; }
      let x = (x1 + x2) / 2 - len / 2;
      wire(x1, y, x, y);
      for (const it of items) {
        if (isPar(it)) {
          const L0 = parLen(it), a = x + 12, b = x + L0 - 12;
          wire(x, y, a, y); wire(b, y, x + L0, y);
          it.par.forEach((br, j) => { const yy = y + j * PAR_GAP; if (j) { wire(a, y + (j - 1) * PAR_GAP, a, yy); wire(b, y + (j - 1) * PAR_GAP, b, yy); } seqH(br, a, b, yy, j === 0 ? labelSide : 'below'); });
          x += L0;
        } else {
          parts.push(place(it, x, y, false)); pt(x, y); pt(x + EL, y);
          geo.set(it.id, { x, y, vertical: false, rev: !!it.rev, side: labelSide });
          const v = valueText(it, o);
          const ly = labelSide === 'below' ? y + 26 : y - (v ? 26 : 16);
          if (!NO_LABEL.has(it.t)) labels.push(tlabel(it.id, x + EL / 2, ly, it.hl ? 'sch-t sch-hlt' : 'sch-t'));
          if (v) labels.push(ttext(v, x + EL / 2, ly + 13));
          x += EL;
        }
      }
      wire(x, y, x2, y);
    }
    function seqV(items, x, y1, y2, labelSide) {
      const len = seqLen(items);
      if (!items || !items.length) { wire(x, y1, x, y2); return; }
      let y = (y1 + y2) / 2 - len / 2;
      wire(x, y1, x, y);
      for (const it of items) {
        if (isPar(it)) {
          const L0 = parLen(it), a = y + 12, b = y + L0 - 12;
          wire(x, y, x, a); wire(x, b, x, y + L0);
          it.par.forEach((br, j) => { const xx = x + j * 64; if (j) { wire(x + (j - 1) * 64, a, xx, a); wire(x + (j - 1) * 64, b, xx, b); } seqV(br, xx, a, b, 'right'); });
          y += L0;
        } else {
          parts.push(place(it, x, y, true)); pt(x, y); pt(x, y + EL);
          geo.set(it.id, { x, y, vertical: true, rev: !!it.rev, side: labelSide });
          const v = valueText(it, o);
          const left = labelSide === 'left';
          const lx = left ? x - 14 : x + 14;
          if (!NO_LABEL.has(it.t)) labels.push(tlabel(it.id, lx, y + EL / 2 - (v ? 3 : -4), it.hl ? 'sch-t sch-hlt' : 'sch-t', left ? 'end' : 'start'));
          if (v) labels.push(ttext(v, lx, y + EL / 2 + 12, 'sch-v', left ? 'end' : 'start'));
          y += EL;
        }
      }
      wire(x, y, x, y2);
    }
    // binari
    for (let i = 0; i < n - 1; i++) {
      const sh = parShift(i);
      if (sh) { wire(xs[i], T, xs[i] + sh, T); seqH(top[i], xs[i] + sh, xs[i + 1], T, 'above'); } else seqH(top[i], xs[i], xs[i + 1], T, 'above');
      seqH(bot[i], xs[i], xs[i + 1], B, 'below');
    }
    // colonne (la prima ha le etichette a sinistra)
    cols.forEach((c, i) => {
      if (!c) return;
      if (c.length === 1 && c[0].t === 'OPEN') {
        // porta aperta: due morsetti con i nomi A e B
        parts.push(`<circle class="sch-c sch-term" cx="${r1(xs[i])}" cy="${r1(T + 16)}" r="3.5"/><circle class="sch-c sch-term" cx="${r1(xs[i])}" cy="${r1(B - 16)}" r="3.5"/>`);
        wire(xs[i], T, xs[i], T + 12.5); wire(xs[i], B - 12.5, xs[i], B);
        labels.push(ttext(c[0].a || 'A', xs[i] + 10, T + 21, 'sch-n', 'start'), ttext(c[0].b || 'B', xs[i] + 10, B - 11, 'sch-n', 'start'));
        return;
      }
      seqV(c, xs[i], T, B, i === 0 ? 'left' : 'right');
    });
    // massa sotto il primo morsetto in basso
    let ground = '';
    if (spec.ground !== false && o.ground !== false) {
      const gx = xs[0], gy = B;
      ground = `<g class="sch-g">${line(gx, gy, gx, gy + 10)}${line(gx - 10, gy + 10, gx + 10, gy + 10, 'sch-c')}${line(gx - 6, gy + 14, gx + 6, gy + 14, 'sch-c')}${line(gx - 2, gy + 18, gx + 2, gy + 18, 'sch-c')}</g>`;
    }
    // pallini dei nodi
    const dots = [...pts].filter(([, c]) => c >= 3).map(([k]) => { const [x, y] = k.split(',').map(Number); return `<circle class="sch-d" cx="${x}" cy="${y}" r="3.2"/>`; });
    // nomi dei nodi
    const names = spec.names || {};
    for (const [raw, nm] of Object.entries(names)) {
      const m = raw.match(/^([TB])(\d+)$/);
      if (!m) continue;
      const x = xs[+m[2]], y = m[1] === 'T' ? T : B;
      dots.push(`<circle class="sch-d" cx="${r1(x)}" cy="${r1(y)}" r="3.2"/>`);
      const meas = o.nodes && o.nodes[nm];
      labels.push(ttext(nm, x - 6, m[1] === 'T' ? y - 8 : y + 18, 'sch-n', 'end'));
      if (meas) labels.push(ttext(meas, x + 7, m[1] === 'T' ? y + 17 : y - 9, 'sch-meas', 'start'));
    }
    // frecce di corrente e di tensione
    const ann = [];
    for (const c of o.currents || []) {
      const g = geo.get(c.el);
      if (!g) continue;
      // sul reoforo d'ingresso; verso da a a b (a è l'inizio del ramo, salvo rev)
      const fwd = (g.rev ? -1 : 1) * (c.rev ? -1 : 1);
      if (g.vertical) { const y = fwd > 0 ? g.y + 7 : g.y + EL - 7; ann.push(arrowHead(g.x, y + fwd * 4, fwd > 0 ? 90 : -90, 8, 'sch-i')); ann.push(tlabel(c.label, g.x + (g.side === 'left' ? 9 : -9), y + 4, 'sch-ti', g.side === 'left' ? 'start' : 'end')); }
      else { const x = fwd > 0 ? g.x + 7 : g.x + EL - 7; ann.push(arrowHead(x + fwd * 4, g.y, fwd > 0 ? 0 : 180, 8, 'sch-i')); ann.push(tlabel(c.label, x, g.y + (g.side === 'below' ? -8 : 15), 'sch-ti')); }
    }
    for (const v of o.voltages || []) {
      const g = geo.get(v.el);
      if (!g) continue;
      // la punta va verso il morsetto a (il +), salvo rev; tratteggio e segno + distinguono la tensione dalla corrente
      const plusAtStart = (g.rev ? -1 : 1) * (v.rev ? -1 : 1) > 0;
      if (g.vertical) {
        const xo = g.side === 'left' ? g.x + 22 : g.x - 22;
        const y1 = g.y + 8, y2 = g.y + EL - 8;
        ann.push(`<line class="sch-u" x1="${r1(xo)}" y1="${r1(plusAtStart ? y2 : y1)}" x2="${r1(xo)}" y2="${r1(plusAtStart ? y1 + 6 : y2 - 6)}"/>`);
        ann.push(arrowHead(xo, plusAtStart ? y1 : y2, plusAtStart ? -90 : 90, 7, 'sch-uh'));
        ann.push(ttext('+', xo + (g.side === 'left' ? 7 : -7), plusAtStart ? y1 + 3 : y2 + 3, 'sch-s', 'middle'));
        ann.push(tlabel(v.label, xo + (g.side === 'left' ? 6 : -6), g.y + EL / 2 + 4, 'sch-tu', g.side === 'left' ? 'start' : 'end'));
      } else {
        const yo = g.side === 'below' ? g.y - 20 : g.y + 20;
        const x1 = g.x + 8, x2 = g.x + EL - 8;
        ann.push(`<line class="sch-u" x1="${r1(plusAtStart ? x2 : x1)}" y1="${r1(yo)}" x2="${r1(plusAtStart ? x1 + 6 : x2 - 6)}" y2="${r1(yo)}"/>`);
        ann.push(arrowHead(plusAtStart ? x1 : x2, yo, plusAtStart ? 180 : 0, 7, 'sch-uh'));
        ann.push(ttext('+', plusAtStart ? x1 - 2 : x2 + 2, yo - 5, 'sch-s', 'middle'));
        ann.push(tlabel(v.label, g.x + EL / 2, yo + (g.side === 'below' ? -6 : 15), 'sch-tu'));
      }
    }
    const desc = o.desc || describe(spec, o);
    const w = Math.ceil(W), h = Math.ceil(H);
    const svg = `<svg class="sch" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc((o.title ? o.title + '. ' : '') + desc)}"><g class="sch-wires">${parts.filter((p) => p.startsWith('<line')).join('')}</g>${parts.filter((p) => !p.startsWith('<line')).join('')}${ground}${dots.join('')}<g class="sch-labels">${labels.join('')}</g><g class="sch-ann">${ann.join('')}</g></svg>`;
    return { svg, desc, w, h, geo };
  }

  /* ---------- Descrizione per i lettori di schermo ---------- */
  const NAMES = { R: 'resistore', RV: 'reostato', LDR: 'fotoresistore', NTC: 'termistore NTC', C: 'condensatore', L: 'induttore', V: 'generatore di tensione', I: 'generatore di corrente', D: 'diodo', LED: 'LED', DZ: 'diodo Zener', SW: 'interruttore', LAMP: 'lampada', AM: 'amperometro', VM: 'voltmetro', W: 'filo', OPEN: 'morsetti aperti' };
  function say(it, o = {}) {
    if (isPar(it)) return 'il parallelo di ' + list(it.par.map((b) => b.map((x) => say(x, o)).join(' in serie con ')));
    const nm = it.t === 'V' && it.ac ? 'generatore sinusoidale' : NAMES[it.kind || it.t] || it.t;
    const [b, s] = labelParts(it.id);
    const v = valueText(it, o);
    const extra = it.t === 'SW' ? (it.closed ? ' chiuso' : ' aperto') : it.t === 'D' || it.t === 'LED' ? (it.rev ? ', con il catodo verso l’inizio del ramo' : '') : '';
    return `${nm} ${b}${s ? ' ' + s : ''}${v && v !== '?' ? ' da ' + v : v === '?' ? ', di valore incognito' : ''}${extra}`;
  }
  const list = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1]);
  function describe(spec, o = {}) {
    const out = [];
    const n = spec.cols.length;
    const nameOf = (raw) => (spec.names || {})[raw];
    const c0 = spec.cols[0];
    if (c0) out.push(`A sinistra, fra il conduttore in alto e quello in basso: ${c0.map((x) => say(x, o)).join(' in serie con ')}${c0.some((x) => x.t === 'V') ? ', con il + in ' + (c0.find((x) => x.t === 'V').rev ? 'basso' : 'alto') : ''}.`);
    for (let i = 1; i < n; i++) {
      const t = (spec.top || [])[i - 1] || [], b = (spec.bot || [])[i - 1] || [];
      if (t.length) out.push(`Sul conduttore in alto, procedendo verso destra: ${t.map((x) => say(x, o)).join(', poi ')}.`);
      if (b.length) out.push(`Sul conduttore in basso: ${b.map((x) => say(x, o)).join(', poi ')}.`);
      const c = spec.cols[i];
      const nd = nameOf('T' + i);
      if (c && c.length === 1 && c[0].t === 'OPEN') out.push(`Poi i morsetti aperti ${c[0].a || 'A'} e ${c[0].b || 'B'}.`);
      else if (c) out.push(`${nd ? `Nel nodo ${nd}` : 'Poi'}, verso il conduttore in basso: ${c.map((x) => say(x, o)).join(' in serie con ')}${i === n - 1 ? '' : ', in parallelo al resto del circuito a destra'}.`);
    }
    if (spec.ground !== false) out.push('Il conduttore in basso è la massa.');
    if (o.nodes) out.push('Misure: ' + Object.entries(o.nodes).map(([k, v]) => `nodo ${k}, ${v}`).join('; ') + '.');
    for (const c of o.currents || []) out.push(`La corrente ${c.label.replace(/[_{}]/g, ' ').trim()} attraversa ${c.el.replace(/^([A-Z]+)(\d+)$/, '$1 $2')}.`);
    for (const v of o.voltages || []) out.push(`La tensione ${v.label.replace(/[_{}]/g, ' ').trim()} è ai capi di ${v.el.replace(/^([A-Z]+)(\d+)$/, '$1 $2')}.`);
    return out.join(' ');
  }

  /* ---------- Un simbolo da solo (riconoscere il simbolo) ---------- */
  function symbol(t, o = {}) {
    const it = Object.assign({ id: o.id || 'X', t }, o.it || {});
    const w = 84, h = 52;
    return `<svg class="sch sch-sym" viewBox="-12 -26 ${w} ${h}" width="${w * (o.scale || 1.4)}" height="${h * (o.scale || 1.4)}" role="img" aria-label="${esc(o.label || 'simbolo')}">${place(it, 0, 0, false)}</svg>`;
  }

  const api = { ladder, describe, symbol, SYM, labelParts, NAMES, place, tlabel, ttext, line, arrowHead, EL };
  root.ElekSchematic = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
