/* ELEKTRON — schemi «a modello» per i circuiti che non sono a scala: operazionale nelle sue configurazioni, BJT, MOSFET,
   NE555, raddrizzatori, trasformatore. Ogni modello restituisce { svg, desc, net, w, h }: net è la netlist per il risolutore
   (mna.js), così gli strumenti virtuali misurano sullo stesso circuito che si vede.
   Simboli CEI EN 60617; l'amplificatore operazionale è il triangolo con il simbolo ∞ (forma generale dell'amplificatore). */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const SC = root.ElekSchematic || require('./schematic.js');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const r1 = (x) => Math.round(x * 10) / 10;
  const UNIT = { R: 'Ω', C: 'F', L: 'H', V: 'V', I: 'A' };

  /* ---------- Kit di disegno ---------- */
  function Kit(o = {}) {
    const wires = [], els = [], labels = [], dots = [];
    const k = {
      // filo a gomito per una lista di punti
      w: (...p) => { wires.push(`<path class="sch-w" fill="none" d="M${p.map(([x, y]) => r1(x) + ' ' + r1(y)).join('L')}"/>`); return k; },
      dot: (x, y) => { dots.push(`<circle class="sch-d" cx="${r1(x)}" cy="${r1(y)}" r="3.2"/>`); return k; },
      // componente orizzontale (x, y) → (x + 60, y) o verticale (x, y) → (x, y + 60); etichetta: 'above' | 'below' | 'left' | 'right'
      el: (it, x, y, dir = 'h', side) => {
        els.push(SC.place(Object.assign({}, it), x, y, dir === 'v'));
        const v = it.label != null ? it.label : it.v != null && UNIT[it.t] && o.values !== false ? (it.unknown ? '?' : U.fmt(it.v, UNIT[it.t], { prefixes: o.prefixes })) : '';
        const noName = it.t === 'W' || it.t === 'AM' || it.t === 'VM';
        if (dir === 'h') {
          const below = side === 'below';
          const ly = below ? y + 26 : y - (v ? 26 : 16);
          if (!noName) labels.push(SC.tlabel(it.id, x + 30, ly, it.hl ? 'sch-t sch-hlt' : 'sch-t'));
          if (v) labels.push(SC.ttext(v, x + 30, ly + 13));
        } else {
          const left = side === 'left';
          const lx = left ? x - 14 : x + 14;
          if (!noName) labels.push(SC.tlabel(it.id, lx, y + 27, it.hl ? 'sch-t sch-hlt' : 'sch-t', left ? 'end' : 'start'));
          if (v) labels.push(SC.ttext(v, lx, y + 42, 'sch-v', left ? 'end' : 'start'));
        }
        return k;
      },
      gnd: (x, y) => { els.push(`<g class="sch-g">${SC.line(x, y, x, y + 10)}${SC.line(x - 10, y + 10, x + 10, y + 10, 'sch-c')}${SC.line(x - 6, y + 14, x + 6, y + 14, 'sch-c')}${SC.line(x - 2, y + 18, x + 2, y + 18, 'sch-c')}</g>`); return k; },
      // morsetto con il nome (ingresso o uscita)
      term: (x, y, name, anchor = 'start') => { els.push(`<circle class="sch-c sch-term" cx="${r1(x)}" cy="${r1(y)}" r="3.5"/>`); labels.push(SC.tlabel(name, anchor === 'start' ? x + 8 : x - 8, y + 5, 'sch-t', anchor)); return k; },
      // alimentazione: freccia o barretta con il nome (+V_CC)
      rail: (x, y, name) => { els.push(SC.line(x - 10, y, x + 10, y, 'sch-c')); labels.push(SC.tlabel(name, x, y - 8, 'sch-t')); return k; },
      text: (s, x, y, cls = 'sch-v', anchor = 'middle') => { labels.push(SC.ttext(s, x, y, cls, anchor)); return k; },
      raw: (s) => { els.push(s); return k; },
      svg: (w, h, desc) => `<svg class="sch" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(desc)}"><g class="sch-wires">${wires.join('')}</g>${els.join('')}${dots.join('')}<g class="sch-labels">${labels.join('')}</g></svg>`,
    };
    return k;
  }
  // operazionale: triangolo con il vertice a destra; ingressi a (x, y − 14) e (x, y + 14), uscita a (x + 56, y)
  function opampSym(k, x, y, plusTop = false) {
    k.raw(`<path class="sch-c" d="M${x} ${y - 32}L${x} ${y + 32}L${x + 56} ${y}Z"/>`);
    k.raw(`<text class="sch-s" x="${x + 9}" y="${y - 14}" text-anchor="middle" dominant-baseline="central">${plusTop ? '+' : '−'}</text><text class="sch-s" x="${x + 9}" y="${y + 14}" text-anchor="middle" dominant-baseline="central">${plusTop ? '−' : '+'}</text>`);
    k.raw(`<text class="sch-v" x="${x + 24}" y="${y + 4}" text-anchor="middle">∞</text>`);
    return { inTop: [x, y - 14], inBot: [x, y + 14], out: [x + 56, y] };
  }
  // BJT: base a (x, y), collettore in alto (x + 22, y − 30), emettitore in basso (x + 22, y + 30); cerchio dell'involucro
  function bjtSym(k, x, y, pol = 'npn') {
    let s = `<circle class="sch-c sch-open" cx="${x + 16}" cy="${y}" r="20"/>`;
    s += SC.line(x, y, x + 10, y, 'sch-w') + SC.line(x + 10, y - 13, x + 10, y + 13, 'sch-c sch-plate');
    s += SC.line(x + 10, y - 6, x + 22, y - 16, 'sch-c') + SC.line(x + 22, y - 16, x + 22, y - 30, 'sch-w');
    s += SC.line(x + 10, y + 6, x + 22, y + 16, 'sch-c') + SC.line(x + 22, y + 16, x + 22, y + 30, 'sch-w');
    // freccia sull'emettitore: uscente per l'NPN, entrante per il PNP
    s += pol === 'npn' ? SC.arrowHead(x + 22, y + 16, 39.8, 7, 'sch-ahc') : SC.arrowHead(x + 11, y + 7, 219.8, 7, 'sch-ahc');
    k.raw(`<g class="sch-el">${s}</g>`);
    return { b: [x, y], c: [x + 22, y - 30], e: [x + 22, y + 30] };
  }
  // MOSFET a canale N ad arricchimento: gate a (x, y), drain in alto (x + 22, y − 30), source in basso (x + 22, y + 30)
  function mosSym(k, x, y) {
    let s = SC.line(x, y, x + 8, y, 'sch-w') + SC.line(x + 8, y - 14, x + 8, y + 14, 'sch-c');
    for (const yy of [-12, 0, 12]) s += SC.line(x + 13, y + yy - 5, x + 13, y + yy + 5, 'sch-c sch-plate');
    s += SC.line(x + 13, y - 12, x + 22, y - 12, 'sch-c') + SC.line(x + 22, y - 12, x + 22, y - 30, 'sch-w');
    s += SC.line(x + 13, y + 12, x + 22, y + 12, 'sch-c') + SC.line(x + 22, y + 12, x + 22, y + 30, 'sch-w');
    s += SC.line(x + 13, y, x + 22, y, 'sch-c') + SC.line(x + 22, y, x + 22, y + 12, 'sch-c') + SC.arrowHead(x + 14, y, 180, 6, 'sch-ahc');
    k.raw(`<g class="sch-el">${s}</g>`);
    return { g: [x, y], d: [x + 22, y - 30], s: [x + 22, y + 30] };
  }
  const R = (id, v, x) => Object.assign({ id, t: 'R', v }, x || {});

  /* ---------- Operazionale ---------- */
  /* opamp(kind, p): kind 'invertente' | 'non-invertente' | 'inseguitore' | 'sommatore' | 'differenziale' | 'comparatore' |
     'schmitt' | 'passa-basso' | 'passa-alto' | 'astabile'; p contiene i valori (Vin, R1, Rf, …, Vsat) */
  function opamp(kind, p = {}, o = {}) {
    const k = Kit(o);
    const vs = p.Vsat ?? 12;
    const OA = (pp, nn, oo) => ({ id: 'OA', t: 'OA', p: pp, n: nn, o: oo, vpos: vs, vneg: -vs, open: kind === 'comparatore' });
    let net, desc, w = 300, h = 190;
    const src = (id, v, x, y, side = 'left') => { k.el({ id, t: 'V', v, ac: p.ac }, x, y, 'v', side); k.gnd(x, y + 60); };
    const out = (x, y) => { k.w([x, y], [x + 24, y]); k.term(x + 28, y, 'V_{out}'); };
    switch (kind) {
      case 'passa-alto': return opampHP(p, o);
      case 'invertente': case 'passa-basso': {
        const A = opampSym(k, 150, 112);
        src('V_{in}', p.Vin, 26, 98);
        k.w([26, 98], [48, 98]); k.el(R('R1', p.R1), 48, 98, 'h'); k.w([108, 98], [136, 98], A.inTop); k.dot(136, 98);
        // retroazione: R_f (con il condensatore in parallelo nel passa-basso)
        k.w([136, 98], [136, 44], [150, 44]); k.el(R('R_f', p.Rf), 150, 44, 'h', kind === 'passa-basso' ? 'below' : 'above'); k.w([210, 44], [226, 44], [226, 112]);
        if (kind === 'passa-basso') { k.w([136, 44], [136, 14], [150, 14]); k.el({ id: 'C1', t: 'C', v: p.C }, 150, 14, 'h', 'above'); k.w([210, 14], [226, 14], [226, 44]); k.dot(136, 44); k.dot(226, 44); }
        k.w(A.inBot, [136, 126], [136, 150]); k.gnd(136, 150);
        k.w(A.out, [226, 112]); k.dot(226, 112); out(226, 112);
        net = { elements: [{ id: 'VI', t: 'V', a: 'in', b: '0', v: p.Vin || 0 }, R('R1', p.R1, { a: 'in', b: 'n' }), R('RF', p.Rf, { a: 'n', b: 'o' }), kind === 'passa-basso' ? { id: 'C1', t: 'C', a: 'n', b: 'o', v: p.C } : null, OA('0', 'n', 'o')].filter(Boolean) };
        desc = kind === 'invertente' ? `Amplificatore invertente: il generatore V_in, attraverso R_1${p.R1 ? ' da ' + U.fmt(p.R1, 'Ω') : ''}, va all’ingresso invertente (−); R_f${p.Rf ? ' da ' + U.fmt(p.Rf, 'Ω') : ''} collega l’uscita all’ingresso invertente; l’ingresso non invertente (+) è a massa.`
          : 'Filtro attivo passa-basso invertente: V_in attraverso R_1 all’ingresso invertente (−); R_f e il condensatore C_1 in parallelo fra l’uscita e l’ingresso invertente; ingresso + a massa.';
        w = 290; h = 190;
        break;
      }
      case 'non-invertente': case 'inseguitore': {
        const A = opampSym(k, 150, 100, true);
        src('V_{in}', p.Vin, 40, 86);
        k.w([40, 86], [150, 86]);
        if (kind === 'inseguitore') { k.w(A.inBot, [136, 114], [136, 150], [226, 150], [226, 100]); k.w(A.out, [226, 100]); k.dot(226, 100); out(226, 100); net = { elements: [{ id: 'VI', t: 'V', a: 'in', b: '0', v: p.Vin || 0 }, { id: 'W1', t: 'W', a: 'o', b: 'n' }, OA('in', 'n', 'o')] }; desc = 'Inseguitore di tensione: V_in all’ingresso non invertente (+); l’uscita è collegata direttamente all’ingresso invertente (−).'; h = 170; }
        else {
          k.w(A.inBot, [120, 114], [120, 150]); k.dot(120, 150);
          k.el(R('R1', p.R1), 120, 150, 'v', 'left'); k.gnd(120, 210);
          k.w([120, 150], [150, 150]); k.el(R('R_f', p.Rf), 150, 150, 'h', 'below'); k.w([210, 150], [226, 150], [226, 100]);
          k.w(A.out, [226, 100]); k.dot(226, 100); out(226, 100);
          net = { elements: [{ id: 'VI', t: 'V', a: 'in', b: '0', v: p.Vin || 0 }, R('R1', p.R1, { a: 'n', b: '0' }), R('RF', p.Rf, { a: 'n', b: 'o' }), OA('in', 'n', 'o')] };
          desc = `Amplificatore non invertente: V_in all’ingresso non invertente (+); R_1 dall’ingresso invertente (−) a massa, R_f dall’uscita all’ingresso invertente.`;
          h = 240;
        }
        w = 290;
        break;
      }
      case 'sommatore': {
        const A = opampSym(k, 170, 122);
        const Vs = p.V || [1, 1];
        Vs.forEach((v, i) => {
          const y = 56 + i * 52;
          k.term(18, y, 'V_' + (i + 1), 'end').w([18, y], [40, y]);
          k.el(R('R' + (i + 1), (p.R || [])[i]), 40, y, 'h');
          k.w([100, y], [140, y]);
        });
        k.w([140, 56], [140, 56 + (Vs.length - 1) * 52]); k.dot(140, 108); k.w([140, 108], A.inTop);
        k.w([140, 56], [140, 26], [170, 26]); k.el(R('R_f', p.Rf), 170, 26, 'h'); k.w([230, 26], [246, 26], [246, 122]);
        k.w(A.inBot, [156, 136], [156, 160]); k.gnd(156, 160);
        k.w(A.out, [246, 122]); k.dot(246, 122); out(246, 122);
        net = { elements: [...Vs.map((v, i) => ({ id: 'V' + (i + 1), t: 'V', a: 'i' + i, b: '0', v })), ...Vs.map((_, i) => R('R' + (i + 1), (p.R || [])[i], { a: 'i' + i, b: 'n' })), R('RF', p.Rf, { a: 'n', b: 'o' }), OA('0', 'n', 'o')] };
        desc = `Sommatore invertente: ${Vs.map((_, i) => `V_${i + 1} attraverso R_${i + 1}`).join(' e ')} all’ingresso invertente (−); R_f dall’uscita all’ingresso invertente; ingresso + a massa.`;
        w = 320; h = 200;
        break;
      }
      case 'differenziale': {
        const A = opampSym(k, 170, 104);
        k.term(18, 90, 'V_1', 'end').w([18, 90], [40, 90]); k.el(R('R1', p.R1), 40, 90, 'h'); k.w([100, 90], [140, 90], A.inTop); k.dot(140, 90);
        k.w([140, 90], [140, 40], [170, 40]); k.el(R('R2', p.Rf), 170, 40, 'h'); k.w([230, 40], [246, 40], [246, 104]);
        k.term(18, 150, 'V_2', 'end').w([18, 150], [40, 150]); k.el(R('R3', p.R1), 40, 150, 'h', 'below'); k.w([100, 150], [140, 150]); k.dot(140, 150);
        k.w([140, 150], [140, 118], A.inBot); k.w([140, 150], [140, 160]); k.el(R('R4', p.Rf), 140, 160, 'v'); k.gnd(140, 220);
        k.w(A.out, [246, 104]); k.dot(246, 104); out(246, 104);
        net = { elements: [{ id: 'V1', t: 'V', a: 'a', b: '0', v: p.V1 || 0 }, { id: 'V2', t: 'V', a: 'b', b: '0', v: p.V2 || 0 }, R('R1', p.R1, { a: 'a', b: 'n' }), R('R2', p.Rf, { a: 'n', b: 'o' }), R('R3', p.R1, { a: 'b', b: 'p' }), R('R4', p.Rf, { a: 'p', b: '0' }), OA('p', 'n', 'o')] };
        desc = 'Amplificatore differenziale: V_1 attraverso R_1 all’ingresso invertente, con R_2 fra l’uscita e l’ingresso invertente; V_2 attraverso R_3 all’ingresso non invertente, con R_4 verso massa. R_1 = R_3 e R_2 = R_4.';
        w = 320; h = 250;
        break;
      }
      case 'comparatore': case 'schmitt': {
        const A = opampSym(k, 150, 100, kind === 'comparatore');
        src('V_{in}', p.Vin, 40, kind === 'comparatore' ? 86 : 86);
        if (kind === 'comparatore') {
          k.w([40, 86], [150, 86]);
          k.w(A.inBot, [110, 114], [110, 120]); k.el({ id: 'V_{ref}', t: 'V', v: p.Vref }, 110, 120, 'v', 'right'); k.gnd(110, 180);
          k.w(A.out, [226, 100]); out(226, 100);
          net = { elements: [{ id: 'VI', t: 'V', a: 'p', b: '0', v: p.Vin || 0 }, { id: 'VR', t: 'V', a: 'n', b: '0', v: p.Vref || 0 }, OA('p', 'n', 'o')] };
          desc = 'Comparatore: V_in all’ingresso non invertente (+), la tensione di riferimento V_ref all’ingresso invertente (−); nessuna retroazione.';
          h = 210;
        } else {
          k.w([40, 86], [150, 86]);
          k.w(A.inBot, [120, 114], [120, 150]); k.dot(120, 150); k.el(R('R1', p.R1), 120, 150, 'v', 'left'); k.gnd(120, 210);
          k.w([120, 150], [150, 150]); k.el(R('R2', p.R2), 150, 150, 'h', 'below'); k.w([210, 150], [226, 150], [226, 100]);
          k.w(A.out, [226, 100]); k.dot(226, 100); out(226, 100);
          net = { elements: [{ id: 'VI', t: 'V', a: 'n', b: '0', v: p.Vin || 0 }, R('R1', p.R1, { a: 'p', b: '0' }), R('R2', p.R2, { a: 'p', b: 'o' }), OA('p', 'n', 'o')] };
          desc = 'Trigger di Schmitt invertente: V_in all’ingresso invertente (−); l’ingresso non invertente (+) è al centro del partitore fra l’uscita (R_2) e la massa (R_1).';
          h = 240;
        }
        w = 290;
        break;
      }
      case 'astabile': {
        // trigger di Schmitt (R_1, R_2 sull'ingresso +) con la rete R, C sull'ingresso −
        const A = opampSym(k, 150, 110);
        k.w(A.inTop, [126, 96]); k.dot(126, 96);
        k.w([126, 96], [126, 40], [150, 40]); k.el(R('R', p.R), 150, 40, 'h'); k.w([210, 40], [236, 40], [236, 110]);
        k.w([126, 96], [100, 96], [100, 110]); k.el({ id: 'C', t: 'C', v: p.C }, 100, 110, 'v', 'left'); k.gnd(100, 170);
        k.w(A.inBot, [136, 124], [136, 150]); k.dot(136, 150); k.el(R('R1', p.R1), 136, 150, 'v', 'left'); k.gnd(136, 210);
        k.w([136, 150], [166, 150]); k.el(R('R2', p.R2), 166, 150, 'h', 'below'); k.w([226, 150], [236, 150], [236, 110]);
        k.w(A.out, [236, 110]); k.dot(236, 110); out(236, 110);
        net = null;
        desc = 'Astabile con l’operazionale: R fra l’uscita e l’ingresso invertente (−), C fra l’ingresso invertente e massa; l’ingresso non invertente (+) è al centro del partitore R_2 (dall’uscita) e R_1 (verso massa).';
        w = 300; h = 240;
        break;
      }
      default: throw new Error('opamp: modello ' + kind);
    }
    if (p.Vsat) k.text(`alimentazione ±${U.fmt(vs, 'V')}`, w - 6, h - 6, 'sch-v', 'end');
    return { svg: k.svg(w, h, (o.title ? o.title + '. ' : '') + desc), desc, net, w, h };
  }
  // passa-alto attivo: il condensatore in serie a R_1 sull'ingresso
  function opampHP(p, o = {}) {
    const k = Kit(o);
    const A = opampSym(k, 176, 112);
    k.el({ id: 'V_{in}', t: 'V', v: p.Vin }, 20, 98, 'v', 'left'); k.gnd(20, 158);
    k.w([20, 98], [34, 98]); k.el({ id: 'C1', t: 'C', v: p.C }, 34, 98, 'h'); k.el(R('R1', p.R1), 94, 98, 'h'); k.w([154, 98], [162, 98], A.inTop); k.dot(162, 98);
    k.w([162, 98], [162, 44], [176, 44]); k.el(R('R_f', p.Rf), 176, 44, 'h'); k.w([236, 44], [252, 44], [252, 112]);
    k.w(A.inBot, [162, 126], [162, 150]); k.gnd(162, 150);
    k.w(A.out, [252, 112]); k.dot(252, 112); k.w([252, 112], [270, 112]); k.term(274, 112, 'V_{out}');
    const desc = 'Filtro attivo passa-alto invertente: V_in attraverso il condensatore C_1 e R_1 in serie all’ingresso invertente (−); R_f fra l’uscita e l’ingresso invertente; ingresso + a massa.';
    const net = { elements: [{ id: 'VI', t: 'V', a: 'in', b: '0', v: p.Vin || 0 }, { id: 'C1', t: 'C', a: 'in', b: 'x', v: p.C }, R('R1', p.R1, { a: 'x', b: 'n' }), R('RF', p.Rf, { a: 'n', b: 'o' }), { id: 'OA', t: 'OA', p: '0', n: 'n', o: 'o', vpos: p.Vsat ?? 12, vneg: -(p.Vsat ?? 12) }] };
    return { svg: k.svg(316, 190, desc), desc, net, w: 316, h: 190 };
  }

  /* ---------- BJT ---------- */
  /* bjt(kind, p): 'base' (resistenza di base e di collettore), 'partitore' (polarizzazione a partitore con R_E),
     'led' (interruttore che accende un LED), 'rele' (interruttore con il relè e il diodo di ricircolo) */
  function bjt(kind, p = {}, o = {}) {
    const k = Kit(o);
    let net, desc, w = 290, h = 250;
    const vcc = p.VCC ?? 12;
    if (kind === 'partitore') {
      k.rail(126, 18, '+V_{CC}');
      k.w([90, 18], [162, 18]);
      k.el(R('R1', p.R1), 90, 18, 'v', 'left'); k.dot(90, 120);
      const Q = bjtSym(k, 140, 120);
      k.w([90, 78], [90, 120], Q.b); k.el(R('R2', p.R2), 90, 120 + 10, 'v', 'left'); k.w([90, 120], [90, 130]); k.gnd(90, 190);
      k.el(R('R_C', p.RC), 162, 18 + 10, 'v'); k.w([162, 18], [162, 28]); k.w([162, 88], Q.c);
      k.w(Q.e, [162, 160]); k.el(R('R_E', p.RE), 162, 160, 'v'); k.gnd(162, 220);
      k.text('Q₁', 116, 96, 'sch-t');
      net = { elements: [{ id: 'VCC', t: 'V', a: 'cc', b: '0', v: vcc }, R('R1', p.R1, { a: 'cc', b: 'b' }), R('R2', p.R2, { a: 'b', b: '0' }), R('RC', p.RC, { a: 'cc', b: 'c' }), R('RE', p.RE, { a: 'e', b: '0' }), { id: 'Q1', t: 'Q', c: 'c', b: 'b', e: 'e', beta: p.beta || 100 }] };
      desc = `Transistor NPN polarizzato con il partitore: R_1 da +V_CC alla base, R_2 dalla base a massa; R_C fra +V_CC e il collettore; R_E fra l’emettitore e massa.${p.VCC ? ' V_CC = ' + U.fmt(vcc, 'V') + '.' : ''}`;
      w = 260; h = 250;
    } else {
      k.rail(172, 18, '+V_{CC}');
      const Q = bjtSym(k, 150, 150);
      // carico di collettore
      if (kind === 'led') { k.el(R('R_C', p.RC), 172, 18, 'v'); k.el({ id: 'D1', t: 'LED' }, 172, 78, 'v'); k.w([172, 138], Q.c); }
      else if (kind === 'rele') {
        k.el({ id: 'K1', t: 'L', label: 'relè' }, 172, 30, 'v'); k.w([172, 18], [172, 30]); k.w([172, 90], Q.c);
        k.w([172, 24], [222, 24]); k.el({ id: 'D1', t: 'D', rev: true }, 222, 24, 'v'); k.w([222, 84], [222, 100], [172, 100]); k.dot(172, 100); k.dot(172, 24);
      } else { k.el(R('R_C', p.RC), 172, 18, 'v'); k.w([172, 78], Q.c); }
      // ingresso
      k.el({ id: 'V_{in}', t: 'V', v: p.Vin }, 30, 150, 'v', 'left'); k.gnd(30, 210);
      k.w([30, 150], [60, 150]); k.el(R('R_B', p.RB), 60, 150, 'h'); k.w([120, 150], Q.b);
      k.w(Q.e, [172, 206]); k.gnd(172, 206);
      k.text('Q₁', 140, 124, 'sch-t');
      const load = kind === 'led' ? [R('RC', p.RC, { a: 'cc', b: 'k' }), { id: 'D1', t: 'LED', a: 'k', b: 'c', vf: p.Vf ?? 2 }] : kind === 'rele' ? [R('RK', p.RK || 400, { a: 'cc', b: 'c' })] : [R('RC', p.RC, { a: 'cc', b: 'c' })];
      net = { elements: [{ id: 'VCC', t: 'V', a: 'cc', b: '0', v: vcc }, { id: 'VI', t: 'V', a: 'in', b: '0', v: p.Vin || 0 }, R('RB', p.RB, { a: 'in', b: 'b' }), ...load, { id: 'Q1', t: 'Q', c: 'c', b: 'b', e: '0', beta: p.beta || 100 }] };
      desc = kind === 'led' ? 'Transistor NPN come interruttore: il generatore V_in attraverso R_B comanda la base; il LED D_1 con la resistenza R_C è fra +V_CC e il collettore; l’emettitore è a massa.'
        : kind === 'rele' ? 'Transistor NPN che comanda un relè: la bobina del relè è fra +V_CC e il collettore, con il diodo di ricircolo D_1 in parallelo (catodo verso +V_CC); la base è comandata da V_in attraverso R_B; l’emettitore è a massa.'
          : 'Transistor NPN a emettitore comune: V_in attraverso R_B alla base; R_C fra +V_CC e il collettore; emettitore a massa.';
      w = 270; h = 240;
    }
    return { svg: k.svg(w, h, (o.title ? o.title + '. ' : '') + desc), desc, net, w, h };
  }

  /* ---------- MOSFET come interruttore ---------- */
  function mosfet(p = {}, o = {}) {
    const k = Kit(o);
    k.rail(172, 18, '+V_{DD}');
    const M = mosSym(k, 150, 150);
    k.el(p.load === 'lampada' ? { id: 'H1', t: 'LAMP' } : R('R_D', p.RD), 172, 18, 'v'); k.w([172, 78], [172, 120]);
    k.el({ id: 'V_{GS}', t: 'V', v: p.VGS }, 30, 150, 'v', 'left'); k.gnd(30, 210);
    k.w([30, 150], [60, 150]); k.el(R('R_G', p.RG ?? 220), 60, 150, 'h'); k.w([120, 150], M.g);
    k.w(M.s, [172, 206]); k.gnd(172, 206);
    k.text('M₁', 148, 120, 'sch-t');
    const net = { elements: [{ id: 'VDD', t: 'V', a: 'dd', b: '0', v: p.VDD ?? 12 }, { id: 'VG', t: 'V', a: 'in', b: '0', v: p.VGS || 0 }, R('RG', p.RG ?? 220, { a: 'in', b: 'g' }), R('RD', p.RD ?? 100, { a: 'dd', b: 'd' }), { id: 'M1', t: 'M', d: 'd', g: 'g', s: '0', vth: p.Vth ?? 2, ron: p.Ron ?? 0.1 }] };
    const desc = `MOSFET a canale N come interruttore: il carico ${p.load === 'lampada' ? '(una lampada)' : 'R_D'} è fra +V_DD e il drain; il gate è comandato da V_GS attraverso R_G; il source è a massa.`;
    return { svg: k.svg(260, 240, (o.title ? o.title + '. ' : '') + desc), desc, net, w: 260, h: 240 };
  }

  /* ---------- NE555 ---------- */
  // blocco a 8 piedini (1 GND, 2 TRIG, 3 OUT, 4 RESET, 5 CTRL, 6 THR, 7 DIS, 8 VCC); kind 'astabile' | 'monostabile'
  function ne555(kind, p = {}, o = {}) {
    const k = Kit(o);
    const bx = 140, by = 60, bw = 100, bh = 120;
    k.raw(`<rect class="sch-c" x="${bx}" y="${by}" width="${bw}" height="${bh}"/><text class="sch-t" x="${bx + bw / 2}" y="${by + 50}" text-anchor="middle">NE555</text>`);
    const pin = (n, name, x, y, anchor) => k.text(`${n} ${name}`, x, y, 'sch-v', anchor);
    pin(8, 'VCC', bx + 6, by + 14, 'start'); pin(4, 'RES', bx + bw - 6, by + 14, 'end');
    pin(7, 'DIS', bx + 6, by + 34, 'start'); pin(6, 'THR', bx + 6, by + 64, 'start'); pin(2, 'TRIG', bx + 6, by + 94, 'start');
    pin(3, 'OUT', bx + bw - 6, by + 64, 'end'); pin(5, 'CTRL', bx + bw - 6, by + 94, 'end'); pin(1, 'GND', bx + bw / 2, by + bh - 6, 'middle');
    k.rail(100, 16, '+V_{CC}');
    k.w([100, 16], [100, 30], [176, 30], [176, by]); k.w([176, 30], [bx + bw - 10, 30], [bx + bw - 10, by]); k.dot(176, 30);
    if (kind === 'astabile') {
      k.w([100, 16], [100, 20]); k.el(R('R_A', p.RA), 100, 20, 'v', 'left'); k.w([100, 80], [100, by + 30], [bx, by + 30]); k.dot(100, by + 30);
      k.el(R('R_B', p.RB), 100, by + 30, 'v', 'left'); k.w([100, by + 90], [100, by + 100]); k.dot(100, by + 100);
      k.w([100, by + 100], [120, by + 100], [120, by + 60], [bx, by + 60]); k.w([120, by + 90], [bx, by + 90]); k.dot(120, by + 90);
      k.el({ id: 'C', t: 'C', v: p.C }, 100, by + 100, 'v', 'left'); k.gnd(100, by + 160);
    } else {
      k.w([100, 16], [100, 20]); k.el(R('R', p.R), 100, 20, 'v', 'left'); k.w([100, 80], [100, by + 30], [bx, by + 30]); k.dot(100, by + 30);
      k.w([100, by + 30], [100, by + 60], [bx, by + 60]); k.dot(100, by + 60);
      k.el({ id: 'C', t: 'C', v: p.C }, 100, by + 60, 'v', 'left'); k.gnd(100, by + 120);
      k.term(24, by + 90, 'TRIG', 'end'); k.w([24, by + 90], [bx, by + 90]);
    }
    k.w([bx + bw / 2, by + bh], [bx + bw / 2, by + bh + 8]); k.gnd(bx + bw / 2, by + bh + 8);
    k.w([bx + bw, by + 60], [bx + bw + 28, by + 60]); k.term(bx + bw + 32, by + 60, 'V_{out}');
    k.w([bx + bw, by + 90], [bx + bw + 14, by + 90]); k.el({ id: 'C2', t: 'C', v: 10e-9 }, bx + bw + 14, by + 90, 'v'); k.gnd(bx + bw + 14, by + 150);
    const desc = kind === 'astabile'
      ? `NE555 astabile: R_A fra +V_CC e il piedino 7 (scarica); R_B fra il piedino 7 e i piedini 6 e 2 uniti; il condensatore C fra i piedini 6 e 2 e massa; piedini 8 e 4 a +V_CC, 1 a massa, 5 a massa con un condensatore da 10 nF; uscita al piedino 3.`
      : 'NE555 monostabile: R fra +V_CC e i piedini 7 e 6 uniti; C fra quei piedini e massa; l’impulso di comando entra nel piedino 2; piedini 8 e 4 a +V_CC, 1 a massa; uscita al piedino 3.';
    return { svg: k.svg(336, 230, (o.title ? o.title + '. ' : '') + desc), desc, net: null, w: 336, h: 230 };
  }

  /* ---------- Raddrizzatori e trasformatore ---------- */
  function transformerSym(k, x, y) {
    // due avvolgimenti affacciati con le linee del nucleo
    k.raw(`<path class="sch-c sch-open" d="M${x} ${y}a6 6 0 0 1 0 12a6 6 0 0 1 0 12a6 6 0 0 1 0 12a6 6 0 0 1 0 12"/>`);
    k.raw(`<path class="sch-c sch-open" d="M${x + 28} ${y}a6 6 0 0 0 0 12a6 6 0 0 0 0 12a6 6 0 0 0 0 12a6 6 0 0 0 0 12"/>`);
    k.raw(SC.line(x + 12, y - 4, x + 12, y + 52, 'sch-c') + SC.line(x + 16, y - 4, x + 16, y + 52, 'sch-c'));
    return { p1: [x, y], p2: [x, y + 48], s1: [x + 28, y], s2: [x + 28, y + 48] };
  }
  // rectifier(kind, p): 'semionda' | 'ponte'; p.C (filtro facoltativo), p.RL, p.V2 (efficace sul secondario)
  function rectifier(kind, p = {}, o = {}) {
    const k = Kit(o);
    const T = transformerSym(k, 70, 60);
    k.term(24, 60, ''); k.term(24, 108, ''); k.text('230 V', 8, 48, 'sch-t', 'start'); k.w([24, 60], T.p1); k.w([24, 108], T.p2);
    k.text('rete: non si misura', 40, 140, 'sch-v');
    let net;
    const xL = 266;
    if (kind === 'ponte') {
      // ponte di Graetz: rombo di quattro diodi
      const cx = 140, cy = 84, d = 26;
      const diode = (x1, y1, x2, y2) => { const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; k.raw(`<g class="sch-el" transform="translate(${x1} ${y1}) rotate(${r1(ang)}) scale(${r1(Math.hypot(x2 - x1, y2 - y1) / 60)})">${SC.SYM.D()}</g>`); };
      diode(cx - d, cy, cx, cy - d); diode(cx, cy + d, cx - d, cy); diode(cx + d, cy, cx, cy - d); diode(cx, cy + d, cx + d, cy);
      k.w(T.s1, [cx - d, 60], [cx - d, cy]); k.w(T.s2, [106, 108], [106, 124], [182, 124], [182, 84], [cx + d, cy]);
      k.dot(cx - d, cy); k.dot(cx + d, cy);
      k.w([cx, cy - d], [cx, 36], [xL, 36]); k.w([cx, cy + d], [cx, 140], [xL, 140]); k.dot(cx, cy - d); k.dot(cx, cy + d);
    } else {
      k.w(T.s1, [114, 60], [114, 36], [130, 36]); k.el({ id: 'D1', t: 'D' }, 130, 36, 'h'); k.w([190, 36], [xL, 36]);
      k.w(T.s2, [114, 108], [114, 140], [xL, 140]);
    }
    const xC = kind === 'ponte' ? 226 : 210;
    if (p.C) { k.w([xC, 36], [xC, 58]); k.el({ id: 'C1', t: 'C', v: p.C, pol: true }, xC, 58, 'v', 'left'); k.w([xC, 118], [xC, 140]); k.dot(xC, 36); k.dot(xC, 140); }
    k.w([xL, 36], [xL, 58]); k.el(R('R_L', p.RL), xL, 58, 'v'); k.w([xL, 118], [xL, 140]);
    const desc = `${kind === 'ponte' ? 'Raddrizzatore a doppia semionda con il ponte di Graetz (quattro diodi)' : 'Raddrizzatore a semionda con un diodo'}: il trasformatore abbassa la tensione di rete (230 V, da non misurare) a ${p.V2 ? U.fmt(p.V2, 'V') + ' efficaci' : 'una tensione bassa'} sul secondario${p.C ? '; il condensatore di filtro C_1 è in parallelo al carico' : ''}; il carico è R_L.`;
    return { svg: k.svg(316, 170, (o.title ? o.title + '. ' : '') + desc), desc, net: net || null, w: 316, h: 170 };
  }

  function demo() {
    const out = [];
    for (const [kind, p] of [['invertente', { Vin: 0.5, R1: 1000, Rf: 10000, Vsat: 12 }], ['non-invertente', { Vin: 1, R1: 1000, Rf: 4700 }], ['inseguitore', { Vin: 3.3 }], ['sommatore', { V: [1, 0.5], R: [10000, 10000], Rf: 20000 }], ['differenziale', { V1: 1, V2: 1.5, R1: 10000, Rf: 20000 }], ['comparatore', { Vin: 2, Vref: 1 }], ['schmitt', { R1: 10000, R2: 47000 }], ['passa-basso', { R1: 1000, Rf: 10000, C: 10e-9 }], ['passa-alto', { R1: 1000, Rf: 10000, C: 1e-6 }]]) {
      const d = opamp(kind, p);
      out.push(`<h2>${kind} — ${d.w}×${d.h}</h2>${d.svg}<p>${d.desc}</p>`);
    }
    for (const kind of ['base', 'led', 'rele', 'partitore']) { const d = bjt(kind, { RB: 10000, RC: 1000, R1: 47000, R2: 10000, RE: 1000 }); out.push(`<h2>BJT ${kind}</h2>${d.svg}<p>${d.desc}</p>`); }
    { const d = mosfet({ RD: 100 }); out.push(`<h2>MOSFET</h2>${d.svg}`); }
    for (const kind of ['astabile', 'monostabile']) { const d = ne555(kind, { RA: 1000, RB: 10000, C: 100e-9, R: 100000 }); out.push(`<h2>NE555 ${kind}</h2>${d.svg}`); }
    for (const kind of ['semionda', 'ponte']) { const d = rectifier(kind, { C: 1000e-6, RL: 100, V2: 12 }); out.push(`<h2>Raddrizzatore ${kind}</h2>${d.svg}<p>${d.desc}</p>`); }
    return out;
  }

  const api = { opamp, bjt, mosfet, ne555, rectifier, Kit, opampSym, bjtSym, mosSym, demo };
  root.ElekTemplates = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
