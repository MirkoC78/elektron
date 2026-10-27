/* ELEKTRON — interfaccia, parte 2: testo con le formule, schemi, grafici, strumenti, tabelle e schede delle lezioni.
   Ogni disegno arriva dal motore con la sua descrizione per i lettori di schermo. */

/* ---------- Testo con le formule ---------- */
// $…$ è una formula (MathML con la lettura in italiano), **…** è grassetto; il resto si scrive com'è
function mathml(src, block) { try { return MA.toMathML(src, { block }); } catch (e) { return `<span class="mono">${esc(src)}</span>`; } }
const mathIn = (src) => `<span class="mathin">${mathml(src)}</span>`;
function rich(text) {
  return String(text ?? '').split(/(\$[^$]+\$)/).map((part) => {
    if (part.length > 1 && part[0] === '$' && part[part.length - 1] === '$') return mathIn(part.slice(1, -1));
    return esc(part).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }).join('');
}
// formula da sola, in un riquadro che scorre in orizzontale se è più larga dello schermo
const mathBox = (src) => `<div class="mathbox">${mathml(src, true)}</div>`;
const fig = (svgHtml, cap) => `<figure class="figure-box">${svgHtml}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;

/* ---------- Disegni dal motore ---------- */
function schemaHtml(schema) {
  try { const d = SCH.ladder(schema.ladder, schema.opts || {}); return fig(d.svg); } catch (e) { return ''; }
}
function tplHtml(tpl) {
  try {
    const f = TPL[tpl.name];
    const d = tpl.name === 'mosfet' ? f(tpl.p || {}) : f(tpl.kind, tpl.p || {});
    return fig(d.svg);
  } catch (e) { return ''; }
}
function plotHtml(p) {
  try {
    if (p.kind === 'transitorio') return fig(PL.transient({ x0: p.x0, xf: p.xf, tau: p.tau }));
    if (p.kind === 'bode') return fig(PL.bode({ kind: p.kindF, fc: p.fc }));
    if (p.kind === 'vi') {
      // caratteristica di un resistore: una retta per l'origine, con il punto di lavoro segnato
      const Imax = p.Vmax / p.R;
      const [V0, I0] = p.point;
      const series = [{ pts: [[0, 0], [p.Vmax, Imax * 1000]], cls: 'pl-tr1' }, { pts: [[V0, 0], [V0, I0 * 1000], [0, I0 * 1000]], cls: 'pl-asym' }];
      return fig(PL.plot({ series, x: { min: 0, max: p.Vmax, label: 'V (V)' }, y: { min: 0, max: Imax * 1000 * 1.05, label: 'I (mA)' },
        desc: `Caratteristica tensione–corrente di un resistore: una retta che parte dall’origine. Il punto segnato, collegato agli assi da due tratti, è a ${U.fmt(V0, 'V')} e ${U.fmt(I0, 'A', { prefixes: ['', 'm'] })}.` }));
    }
  } catch (e) { /* disegno non disponibile */ }
  return '';
}
const scopeHtml = (o) => fig(PL.scope(o));
const meterHtml = (o) => fig(PL.multimeter(o));
const bandsHtml = (b) => fig(PL.resistor(b));
// le porte: simbolo CEI e forma americana sempre affiancati
function gatePairs(types) {
  return `<div class="gate-pair">${types.map((t) => `<figure><figcaption>${esc(t)}</figcaption>${GT.gateSymbol(t, 'iec', { label: `porta ${t}, simbolo CEI EN 60617` })}${GT.gateSymbol(t, 'ansi', { label: `porta ${t}, forma americana` })}</figure>`).join('')}</div><p class="note">In ogni riquadro: a sinistra il simbolo CEI EN 60617, a destra la forma americana dei datasheet.</p>`;
}
const netHtml = (net, values) => { try { return `<div class="figure-box">${GT.both(net, { values }).html}</div>`; } catch (e) { return ''; } };
const GATE_FN = { AND: (a, b) => a & b, OR: (a, b) => a | b, NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b), XOR: (a, b) => a ^ b, XNOR: (a, b) => 1 - (a ^ b) };
function truthTables(types) {
  return `<div class="row wrap">${types.map((t) => `<table class="tt"><caption class="sr">Tabella di verità della porta ${esc(t)}</caption><thead><tr><th scope="col">A</th><th scope="col">B</th><th scope="col">${esc(t)}</th></tr></thead><tbody>${[0, 1, 2, 3].map((m) => { const a = m >> 1, b = m & 1; return `<tr><td>${a}</td><td>${b}</td><td class="out">${GATE_FN[t](a, b)}</td></tr>`; }).join('')}</tbody></table>`).join('')}</div>`;
}
function kmapFig(on, vars, withGroups) {
  try {
    const km = LG.kmap(on, vars);
    const groups = withGroups ? LG.minimalSOP(on, vars).implicants : [];
    return fig(PL.kmap(km, vars, groups));
  } catch (e) { return ''; }
}
// diagramma temporale di un flip-flop D: Q copia D sui fronti di salita del clock
function timingDemo() {
  const D = [0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0], clk = D.map((_, k) => (k % 2 === 0 ? 0 : 1));
  const Q = []; let q = 0;
  D.forEach((d, k) => { if (k > 0 && clk[k] === 1 && clk[k - 1] === 0) q = D[k - 1]; Q.push(q); });
  return fig(PL.timing([{ name: 'CLK', levels: clk }, { name: 'D', levels: D }, { name: 'Q', levels: Q }]));
}
function tauTable() {
  const rows = [1, 2, 3, 4, 5].map((k) => [`${k}τ`, U.num((1 - Math.exp(-k)) * 100, { sig: 3 }) + ' %']);
  return tableHtml(['Tempo', 'Variazione compiuta'], rows);
}
function tableHtml(cols, rows, cap = '') {
  return `<div class="tbl-wrap" tabindex="0"><table class="para">${cap ? `<caption class="sr">${esc(cap)}</caption>` : ''}<thead><tr>${cols.map((c) => `<th scope="col">${rich(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${rich(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

/* ---------- Svolgimento ---------- */
const TEXT_ONLY = /^s*("[^"]*"[s;,:.]*)+$/;
// una catena di uguaglianze separate da «;» (le divisioni successive) va a capo, una per riga
function stepPart(src) {
  if (TEXT_ONLY.test(src)) return `<p>${esc(src.match(/"[^"]*"/g).map((x) => x.slice(1, -1)).join('; '))}</p>`;
  const parts = String(src).split(/;s+(?=[^"]*(?:"[^"]*"[^"]*)*$)/);
  if (parts.length > 1) { try { return parts.map((x) => `<div class="mathbox">${MA.toMathML(x)}</div>`).join(''); } catch (e) { /* si scrive tutta intera */ } }
  return `<div class="mathbox">${mathml(src)}</div>`;
}
// i passaggi del risolutore: formula, sostituzione con le unità, risultato
function stepsHtml(sol, o = {}) {
  const steps = (sol && sol.steps) || [];
  if (!steps.length) return '';
  return `<ol class="steps">${steps.map((s) => {
    const same = !s.f || s.f === s.s;
    return `<li><div class="stepbox">${same ? '' : `<div class="stepnote">${stepPart(s.f)}</div>`}<div>${stepPart(s.s || s.f)}</div></div></li>`;
  }).join('')}</ol>${o.after || ''}`;
}
// il risultato da scrivere nella soluzione: con l'unità e i prefissi della lezione
function answerText(it) {
  const p = it.problem, sol = p.sol;
  if (sol.z) return `${CX.fmtRect(sol.z, sol.u || '')} = ${CX.fmtPolar(sol.z, sol.u || '')}`;
  if (sol.seq != null) return sol.seq;
  if (sol.expr) return LG.text(sol.expr);
  if (sol.minterms) return sol.minterms.length ? 'mintermini ' + sol.minterms.join(', ') : 'nessuna casella a 1';
  if (sol.base != null) return sol.twos ? NS.toTwos(sol.v, sol.bits) : sol.bcd ? NS.toBCD(sol.v) : NS.toBase(sol.v, sol.base) + (sol.base !== 10 ? ` (base ${sol.base})` : '');
  if (typeof sol.v === 'number' && isFinite(sol.v)) return sol.u ? U.fmt(sol.v, sol.u, { prefixes: (SES && SES.prefixes) || LS.ALL_PREFIXES, sig: 3 }) : U.num(sol.v, { sig: 4 });
  return '';
}

/* ---------- Concetti nuovi ---------- */
const conceptTag = (id) => `<button class="tag new" data-act="concept" data-c="${esc(id)}">${I.info}Nuovo: ${esc(CO.name(id))}</button>`;
function conceptSheet(id) { openSheet(CO.name(id), `${say(rich(CO.text(id)), 'pensierosa', 64)}<p class="note">È un concetto che non hai ancora visto nel percorso: qui ti serve solo questo. Lo incontrerai di nuovo più avanti.</p>`); }

/* ---------- Schede delle lezioni ---------- */
function formulaCard(c) {
  return `<div class="formula-card"><div class="main-f">${mathml(c.f, true)}</div>${c.leg ? `<div class="legend">${c.leg.map(([s, n, u]) => `<span>${mathml(s)}</span><span>${esc(n)}</span><span class="u">${u ? esc(u) : ''}</span>`).join('')}</div>` : ''}${c.inv && c.inv.length ? `<div class="inverses"><span class="note">Formule inverse</span>${c.inv.map((f) => `<div>${mathml(f)}</div>`).join('')}</div>` : ''}</div>`;
}
function exampleHtml(p) {
  if (!p) return '';
  return `<div class="example"><span class="k">Esempio svolto</span><p>${rich(p.text)}</p>${problemFigure(p)}${stepsHtml(p.sol)}</div>`;
}
function cardHtml(c) {
  let h = '';
  if (c.say) h += say(rich(c.say), 'contenta', 72);
  if (c.warn) h += `<div class="warn-card">${I.warn}<div><b>Sicurezza</b><p>${rich(c.warn)}</p></div></div>`;
  if (c.math && c.p) h += `<div class="math-card"><span class="k">Ripasso di matematica</span><p>${rich(c.p)}</p></div>`;
  else if (c.p) h += `<div class="lesson-text"><p>${rich(c.p)}</p></div>`;
  if (c.f) h += formulaCard(c);
  if (c.tbl) h += tableHtml(c.tbl.c, c.tbl.r);
  if (c.table === 'tau') h += tauTable();
  if (c.schema) h += schemaHtml(c.schema);
  if (c.tpl) h += tplHtml(c.tpl);
  if (c.plot) h += plotHtml(c.plot);
  if (c.scope) h += scopeHtml(c.scope);
  if (c.truth) h += truthTables(c.truth);
  if (c.gates) h += gatePairs(c.gates);
  if (c.kmapDemo) h += kmapFig(c.kmapDemo.on, c.kmapDemo.vars, true);
  if (c.ff) h += fig(GT.flipflop(c.ff));
  if (c.timing) h += timingDemo();
  return h;
}
// il disegno che accompagna un problema
function problemFigure(p) {
  let h = '';
  if (p.schema) h += schemaHtml(p.schema);
  if (p.tpl) h += tplHtml(p.tpl);
  if (p.plot) h += plotHtml(p.plot);
  if (p.scope) h += scopeHtml(p.scope);
  if (p.meter) h += meterHtml(p.meter);
  if (p.bands) h += bandsHtml(p.bands);
  if (p.symbol) h += fig(SCH.symbol(p.symbol, { scale: 1.6 }));
  if (p.logicExpr) h += `<div class="mathbox">${p.logicExpr}</div>`;
  if (p.net && p.kind !== 'simula') h += netHtml(p.net);
  if (p.gateType && !p.net) h += gatePairs([p.gateType]);
  if (p.table && p.table.rows) h += `<table class="tt"><thead><tr>${p.table.vars.map((v) => `<th scope="col">${esc(v)}</th>`).join('')}<th scope="col">Y</th></tr></thead><tbody>${p.table.rows.map((r) => `<tr>${r.in.map((b) => `<td>${b}</td>`).join('')}<td class="out">${r.out === '-' ? '–' : r.out}</td></tr>`).join('')}</tbody></table>`;
  return h;
}
