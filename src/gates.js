/* ELEKTRON — schemi logici in SVG: porte con i simboli CEI EN 60617 (rettangolo con &, ≥1, =1, 1 e il cerchietto della
   negazione) e con le forme americane, sempre affiancati; blocchi di flip-flop, multiplexer e decoder.
   Nella simulazione il livello 1 è un tratto spesso pieno, lo 0 un tratto sottile punteggiato, e la cifra è scritta sul filo:
   il colore non è mai l'unico indizio. */
(function (root) {
  'use strict';
  const LG = root.ElekLogic || require('./logic.js');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const r1 = (x) => Math.round(x * 10) / 10;
  const GW = 40, GH = 44; // ingombro di una porta
  const QUAL = { AND: '&', NAND: '&', OR: '≥1', NOR: '≥1', XOR: '=1', XNOR: '=1', NOT: '1', BUF: '1' };
  const NEG = new Set(['NAND', 'NOR', 'XNOR', 'NOT']);
  const NAME = { AND: 'AND', NAND: 'NAND', OR: 'OR', NOR: 'NOR', XOR: 'XOR', XNOR: 'XNOR', NOT: 'NOT', BUF: 'buffer' };

  // posizione degli ingressi di una porta con k ingressi (relativa all'angolo in alto a sinistra)
  const inY = (k, i) => (k === 1 ? GH / 2 : 8 + (GH - 16) * i / (k - 1));
  // corpo della porta: stile 'iec' (CEI EN 60617) o 'ansi' (forme americane); restituisce anche il punto d'uscita
  function body(type, x, y, style) {
    const neg = NEG.has(type);
    const outX = x + GW + (neg ? 8 : 0);
    let s = '';
    if (style === 'iec') {
      s += `<rect class="sch-gate" x="${r1(x)}" y="${r1(y)}" width="${GW}" height="${GH}"/>`;
      s += `<text class="sch-q" x="${r1(x + GW / 2)}" y="${r1(y + 16)}" text-anchor="middle">${esc(QUAL[type])}</text>`;
    } else {
      const X = x, Y = y, W = GW, H = GH;
      if (type === 'AND' || type === 'NAND') s += `<path class="sch-gate" d="M${X} ${Y}h${W / 2}a${W / 2} ${H / 2} 0 0 1 0 ${H}h${-W / 2}Z"/>`;
      else if (type === 'OR' || type === 'NOR' || type === 'XOR' || type === 'XNOR') {
        s += `<path class="sch-gate" d="M${X} ${Y}q${W * 0.6} 0 ${W} ${H / 2}q${-W * 0.4} ${H / 2} ${-W} ${H / 2}q${W * 0.3} ${-H / 2} 0 ${-H}Z"/>`;
        if (type === 'XOR' || type === 'XNOR') s += `<path class="sch-gate" fill="none" d="M${X - 6} ${Y}q${W * 0.3} ${H / 2} 0 ${H}"/>`;
      } else s += `<path class="sch-gate" d="M${X} ${Y + 4}L${X + W - 4} ${Y + H / 2}L${X} ${Y + H - 4}Z"/>`;
    }
    const nx = style === 'iec' ? x + GW + 4 : (type === 'NOT' || type === 'BUF' ? x + GW : x + GW + 4);
    if (neg) s += `<circle class="sch-gate" cx="${r1(nx)}" cy="${r1(y + GH / 2)}" r="4"/>`;
    return { s, out: [style === 'iec' ? x + GW + 8 * (neg ? 1 : 0) : (type === 'NOT' || type === 'BUF' ? x + GW + 4 * (neg ? 1 : 0) + (neg ? 4 : 0) : outX), y + GH / 2] };
  }
  // ingresso della forma americana: le porte OR arretrano un poco la linea curva
  const inX = (type, x, style) => (style === 'ansi' && /OR/.test(type) ? x + 6 : x);

  /* rete combinatoria: net = { inputs, gates: [{ id, type, in }], outputs: { Y: 'G2' } }; o.style 'iec' | 'ansi';
     o.values: { A: 1, B: 0 } per mostrare i livelli della simulazione */
  function network(net, o = {}) {
    const style = o.style || 'iec';
    // livello di ogni porta: il percorso più lungo dagli ingressi
    const lvl = {};
    net.inputs.forEach((i) => { lvl[i] = 0; });
    let changed = true, guard = 0;
    while (changed && guard++ < 100) {
      changed = false;
      for (const g of net.gates) { const l = 1 + Math.max(...g.in.map((s) => lvl[s] ?? 0)); if (lvl[g.id] !== l) { lvl[g.id] = l; changed = true; } }
    }
    const maxL = Math.max(1, ...net.gates.map((g) => lvl[g.id]));
    const byL = Array.from({ length: maxL + 1 }, () => []);
    net.gates.forEach((g) => byL[lvl[g.id]].push(g));
    const rowsMax = Math.max(net.inputs.length, ...byL.map((c) => c.length));
    const colW = 92, rowH = GH + 22;
    const H = Math.max(rowsMax * rowH, 2 * rowH) + 20;
    const x0 = 34;
    const pos = {}; // segnale → [x, y] del punto d'uscita
    // ingressi: lettere a sinistra
    const parts = [], wires = [], labels = [];
    const sig = o.values ? LG.simulate(net, o.values).signals : null;
    net.inputs.forEach((name, i) => {
      const y = 14 + (H - 28) * (net.inputs.length === 1 ? 0.5 : i / (net.inputs.length - 1));
      pos[name] = [x0, y];
      labels.push(`<text class="sch-t" x="${x0 - 22}" y="${r1(y + 5)}" text-anchor="middle">${esc(name)}</text>`);
      labels.push(`<circle class="sch-d" cx="${x0}" cy="${r1(y)}" r="3"/>`);
    });
    const gpos = {};
    for (let l = 1; l <= maxL; l++) {
      const col = byL[l];
      col.forEach((g, j) => {
        const k = g.in.length;
        const x = x0 + 40 + (l - 1) * colW + 20;
        const y = (H - col.length * rowH) / 2 + j * rowH + 10;
        gpos[g.id] = { x, y, g };
        const b = body(g.type, x, y, style);
        parts.push(`<g class="sch-el" data-id="${esc(g.id)}">${b.s}</g>`);
        pos[g.id] = b.out;
      });
    }
    // fili: dall'uscita della sorgente all'ingresso della porta, a gomito, con un canale verticale per filo
    let lane = 0;
    for (const g of net.gates) {
      const P = gpos[g.id];
      g.in.forEach((s, i) => {
        const [sx, sy] = pos[s] || [x0, 0];
        const tx = inX(g.type, P.x, style), ty = P.y + inY(g.in.length, i);
        const mid = Math.min(tx - 8, Math.max(sx + 8, tx - 14 - (lane++ % 4) * 6));
        const v = sig ? sig[s] : null;
        const cls = v == null ? 'sch-w' : v ? 'sch-w sch-hi' : 'sch-w sch-lo';
        wires.push(`<path class="${cls}" fill="none" d="M${r1(sx)} ${r1(sy)}H${r1(mid)}V${r1(ty)}H${r1(tx)}"/>`);
        if (v != null) labels.push(`<text class="sch-bit" x="${r1(tx - 4)}" y="${r1(ty - 4)}" text-anchor="end">${v}</text>`);
      });
    }
    // uscite
    let W = x0 + 40 + maxL * colW + 30;
    for (const [name, s] of Object.entries(net.outputs)) {
      const [sx, sy] = pos[s];
      const ex = sx + 26;
      const v = sig ? sig[s] : null;
      wires.push(`<path class="${v == null ? 'sch-w' : v ? 'sch-w sch-hi' : 'sch-w sch-lo'}" fill="none" d="M${r1(sx)} ${r1(sy)}H${r1(ex)}"/>`);
      labels.push(`<text class="sch-t" x="${r1(ex + 6)}" y="${r1(sy + 5)}">${esc(name)}${v != null ? ' = ' + v : ''}</text>`);
      W = Math.max(W, ex + 50);
    }
    const desc = o.desc || describe(net, sig);
    const w = Math.ceil(W), h = Math.ceil(H);
    return { svg: `<svg class="sch sch-logic" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(desc)}">${wires.join('')}${parts.join('')}<g class="sch-labels">${labels.join('')}</g></svg>`, desc, w, h };
  }
  function describe(net, sig) {
    const name = (s) => { const g = net.gates.find((x) => x.id === s); return g ? `l’uscita della porta ${NAME[g.type]} ${g.id.replace(/^G/, '')}` : `l’ingresso ${s}`; };
    const out = [`Rete con ${net.gates.length} ${net.gates.length === 1 ? 'porta' : 'porte'} e ingressi ${net.inputs.join(', ')}.`];
    for (const g of net.gates) out.push(`Porta ${NAME[g.type]} ${g.id.replace(/^G/, '')}: ${g.in.length === 1 ? 'ingresso' : 'ingressi'} ${g.in.map(name).join(' e ')}${sig ? `; uscita ${sig[g.id]}` : ''}.`);
    for (const [k, s] of Object.entries(net.outputs)) out.push(`L’uscita ${k} è ${name(s)}${sig ? `, che vale ${sig[s]}` : ''}.`);
    if (sig) out.push('Ingressi: ' + net.inputs.map((i) => `${i} = ${sig[i]}`).join(', ') + '.');
    return out.join(' ');
  }
  // le due rappresentazioni affiancate (o una sotto l'altra su uno schermo stretto)
  function both(net, o = {}) {
    const a = network(net, Object.assign({}, o, { style: 'iec' })), b = network(net, Object.assign({}, o, { style: 'ansi' }));
    return { iec: a, ansi: b, html: `<div class="gate-pair"><figure><figcaption>Simboli CEI EN 60617</figcaption>${a.svg}</figure><figure><figcaption>Forme americane (nei datasheet)</figcaption>${b.svg.replace(/role="img" aria-label="[^"]*"/, 'aria-hidden="true"')}</figure></div>`, desc: a.desc };
  }
  // una porta da sola, per riconoscere il simbolo
  function gateSymbol(type, style, o = {}) {
    const k = type === 'NOT' || type === 'BUF' ? 1 : 2;
    const b = body(type, 24, 8, style);
    let s = b.s;
    for (let i = 0; i < k; i++) s += `<line class="sch-w" x1="4" y1="${r1(8 + inY(k, i))}" x2="${inX(type, 24, style)}" y2="${r1(8 + inY(k, i))}"/>`;
    s += `<line class="sch-w" x1="${r1(b.out[0])}" y1="${r1(b.out[1])}" x2="${r1(b.out[0] + 18)}" y2="${r1(b.out[1])}"/>`;
    const w = 110, h = 60;
    return `<svg class="sch sch-sym" viewBox="0 0 ${w} ${h}" width="${w * (o.scale || 1.3)}" height="${h * (o.scale || 1.3)}" role="img" aria-label="${esc(o.label || 'porta logica')}">${s}</svg>`;
  }

  /* ---------- Blocchi: flip-flop, contatori, registri ---------- */
  // flip-flop: type 'D' | 'JK' | 'T' | 'SR'; il clock con il triangolo (fronte di salita)
  function flipflop(type, o = {}) {
    const ins = type === 'JK' ? ['J', 'C', 'K'] : type === 'SR' ? ['S', 'C', 'R'] : [type, 'C'];
    const W = 64, H = 22 + ins.length * 24;
    const x = 40, y = 10;
    let s = `<rect class="sch-gate" x="${x}" y="${y}" width="${W}" height="${H}"/>`;
    ins.forEach((p, i) => {
      const yy = y + 18 + i * 24;
      s += `<line class="sch-w" x1="10" y1="${yy}" x2="${x}" y2="${yy}"/>`;
      if (p === 'C') s += `<path class="sch-gate" fill="none" d="M${x} ${yy - 6}L${x + 9} ${yy}L${x} ${yy + 6}"/><text class="sch-t" x="${x + 13}" y="${yy + 4}">C1</text>`;
      else s += `<text class="sch-t" x="${x + 6}" y="${yy + 4}">${p === 'C' ? '' : (p === 'D' || p === 'T' ? '1' : '1') + p}</text>`;
      s += `<text class="sch-v" x="6" y="${yy - 4}">${o.inputs && o.inputs[p] != null ? o.inputs[p] : p === 'C' ? 'CLK' : p}</text>`;
    });
    s += `<line class="sch-w" x1="${x + W}" y1="${y + 18}" x2="${x + W + 26}" y2="${y + 18}"/><text class="sch-t" x="${x + W + 30}" y="${y + 22}">Q${o.q != null ? ' = ' + o.q : ''}</text>`;
    s += `<circle class="sch-gate" cx="${x + W + 4}" cy="${y + H - 14}" r="4"/><line class="sch-w" x1="${x + W + 8}" y1="${y + H - 14}" x2="${x + W + 26}" y2="${y + H - 14}"/><text class="sch-t" x="${x + W + 30}" y="${y + H - 10}">Q̅</text>`;
    const w = x + W + 64, h = y + H + 10;
    return `<svg class="sch" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(o.label || `Flip-flop ${type} con ingressi ${ins.map((p) => (p === 'C' ? 'clock' : p)).join(', ')} e uscite Q e Q negato`)}">${s}</svg>`;
  }

  // esempi per la pagina di prova
  function demo() {
    const net = { inputs: ['A', 'B', 'C'], gates: [{ id: 'G1', type: 'AND', in: ['A', 'B'] }, { id: 'G2', type: 'NOT', in: ['C'] }, { id: 'G3', type: 'OR', in: ['G1', 'G2'] }], outputs: { Y: 'G3' } };
    const out = [];
    const b = both(net, { values: { A: 1, B: 0, C: 0 } });
    out.push(`<h2>Rete logica (simulazione A=1, B=0, C=0)</h2>${b.html}<p>${b.desc}</p>`);
    out.push(`<h2>Porte</h2>${['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR'].map((t) => gateSymbol(t, 'iec', { scale: 0.9 }) + gateSymbol(t, 'ansi', { scale: 0.9 })).join('')}`);
    out.push(`<h2>Flip-flop</h2>${flipflop('D', { q: 1 })}${flipflop('JK')}`);
    return out;
  }

  const api = { network, both, gateSymbol, flipflop, describe, QUAL, NAME, demo };
  root.ElekGates = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
