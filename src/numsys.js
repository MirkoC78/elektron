/* ELEKTRON — sistemi di numerazione e codici: binario, ottale, esadecimale, BCD, complemento a due, somma binaria.
   Le conversioni escono con la traccia (divisioni successive, somma dei pesi). Nessun accesso al DOM. */
(function (root) {
  'use strict';
  const DIG = '0123456789ABCDEF';
  const BASE_NAME = { 2: 'binario', 8: 'ottale', 10: 'decimale', 16: 'esadecimale' };
  // numero scritto in una base, a gruppi di 4 cifre per il binario (1011 0110)
  function toBase(n, b, o = {}) {
    if (n < 0 || !Number.isInteger(n)) throw new Error('solo interi non negativi');
    let s = n.toString(b).toUpperCase();
    if (o.bits) s = s.padStart(o.bits, '0');
    if (b === 2 && o.group !== false && s.length > 4) s = s.replace(/\B(?=(\d{4})+(?!\d))/g, ' ');
    return s;
  }
  // lettura di una risposta in una base: spazi, prefissi 0b/0x, pedici (1011₂) e la h finale si ignorano
  function parseBase(input, b) {
    let s = String(input).trim().replace(/[\s_]/g, '').replace(/[₀-₉]+$/, '').toUpperCase();
    if (b === 2) s = s.replace(/^0B/, '').replace(/B$/, '');
    if (b === 16) s = s.replace(/^0X/, '').replace(/H$/, '');
    if (!s) return { ok: false, msg: 'Scrivi il numero.' };
    for (const c of s) if (DIG.indexOf(c) < 0 || DIG.indexOf(c) >= b) return { ok: false, msg: `«${c}» non è una cifra del sistema ${BASE_NAME[b] || 'in base ' + b}.` };
    return { ok: true, value: parseInt(s, b), digits: s };
  }
  // divisioni successive: n = q·b + r, i resti letti dal basso danno le cifre
  function divisions(n, b) {
    const rows = [];
    let x = n;
    if (x === 0) rows.push({ n: 0, q: 0, r: 0 });
    while (x > 0) { rows.push({ n: x, q: Math.floor(x / b), r: x % b }); x = Math.floor(x / b); }
    return rows;
  }
  // somma dei pesi: 1011₂ = 1·2³ + 0·2² + 1·2¹ + 1·2⁰
  function weights(digits, b) {
    const d = String(digits).toUpperCase().replace(/\s/g, '');
    return [...d].map((c, i) => ({ c, v: DIG.indexOf(c), p: d.length - 1 - i, w: b ** (d.length - 1 - i) }));
  }
  // binario ↔ esadecimale a gruppi di 4 bit
  function nibbles(bin) {
    const s = String(bin).replace(/\s/g, '');
    const pad = s.padStart(Math.ceil(s.length / 4) * 4, '0');
    return pad.match(/.{4}/g).map((g) => ({ bits: g, hex: DIG[parseInt(g, 2)] }));
  }
  // BCD: ogni cifra decimale in 4 bit
  const toBCD = (n) => String(n).split('').map((d) => (+d).toString(2).padStart(4, '0')).join(' ');
  function fromBCD(s) {
    const g = String(s).replace(/\s/g, '');
    if (!/^[01]+$/.test(g) || g.length % 4) return null;
    const ds = g.match(/.{4}/g).map((x) => parseInt(x, 2));
    if (ds.some((d) => d > 9)) return null; // 1010…1111 non sono codici BCD
    return Number(ds.join(''));
  }
  // complemento a due su n bit
  const range2 = (n) => ({ min: -(2 ** (n - 1)), max: 2 ** (n - 1) - 1 });
  function toTwos(v, n) {
    const { min, max } = range2(n);
    if (v < min || v > max) return null;
    return (v < 0 ? 2 ** n + v : v).toString(2).padStart(n, '0');
  }
  function fromTwos(bits) {
    const s = String(bits).replace(/\s/g, '');
    const n = s.length, u = parseInt(s, 2);
    return s[0] === '1' ? u - 2 ** n : u;
  }
  // traccia del complemento a due di un negativo: binario del modulo, inversione, +1
  function twosSteps(v, n) {
    const m = Math.abs(v).toString(2).padStart(n, '0');
    const inv = [...m].map((c) => (c === '1' ? '0' : '1')).join('');
    return { mod: m, inv, res: toTwos(v, n), oneComp: inv };
  }
  // somma binaria su n bit con i riporti; overflow per i numeri con segno e riporto finale per quelli senza segno
  function addBinary(a, b, n) {
    const A = String(a).replace(/\s/g, '').padStart(n, '0'), B = String(b).replace(/\s/g, '').padStart(n, '0');
    let c = 0;
    const carries = Array(n + 1).fill(0);
    const out = Array(n).fill('0');
    for (let i = n - 1; i >= 0; i--) { const s = +A[i] + +B[i] + c; out[i] = String(s % 2); c = s >> 1; carries[i] = c; }
    const sum = out.join('');
    // overflow con segno: due addendi dello stesso segno danno un risultato di segno opposto
    const ovf = A[0] === B[0] && sum[0] !== A[0];
    return { sum, carryOut: c, carries, overflow: ovf };
  }
  const bitsFor = (n) => (n <= 1 ? 1 : Math.ceil(Math.log2(n + 1)));

  const api = { DIG, BASE_NAME, toBase, parseBase, divisions, weights, nibbles, toBCD, fromBCD, range2, toTwos, fromTwos, twosSteps, addBinary, bitsFor };
  root.ElekNum = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
