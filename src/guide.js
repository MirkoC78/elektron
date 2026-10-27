/* ELEKTRON — la guida: tre proposte di mascotte da scegliere (poi resta solo quella scelta).
   a · Erre, un resistore con le bande del codice colori (marrone, nero, rosso: 1 kΩ) e i reofori per braccia;
   b · Zampa, la rana degli esperimenti di Galvani, con una scintilla sulla pancia;
   c · Sandro, Alessandro Volta in versione fumetto, con la sua pila a colonna.
   Cinque espressioni: normale, contenta, pensierosa, triste, esultante. Sotto i 64 px si disegna solo il busto.
   Contorno uniforme in tutte le figure; nessuna somiglianza con mascotte esistenti. */
(function (root) {
  'use strict';
  const LINE = '#2B2420';
  const sw = 'stroke="' + LINE + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  const MOODS = ['normale', 'contenta', 'pensierosa', 'triste', 'esultante'];
  const ALIAS = { idle: 'normale', happy: 'contenta', think: 'pensierosa', sad: 'triste', cheer: 'esultante' };

  // occhi, sopracciglia e bocca, uguali per le tre figure (cx: centro del volto, y: altezza degli occhi, d: distanza)
  function face(cx, y, d, mood, o = {}) {
    let s = '';
    const r = o.r || 3.6;
    if (mood === 'esultante') s += `<path d="M${cx - d - 4} ${y + 1}q4 -6 8 0M${cx + d - 4} ${y + 1}q4 -6 8 0" fill="none" ${sw}/>`;
    else if (mood === 'contenta') s += `<path d="M${cx - d - 4} ${y + 1}q4 -5 8 0M${cx + d - 4} ${y + 1}q4 -5 8 0" fill="none" ${sw}/>`;
    else {
      const ly = mood === 'pensierosa' ? -1.5 : 0, lx = mood === 'pensierosa' ? 1.5 : 0;
      s += `<circle cx="${cx - d}" cy="${y}" r="${r}" fill="${LINE}"/><circle cx="${cx + d}" cy="${y}" r="${r}" fill="${LINE}"/>`;
      s += `<circle cx="${cx - d + 1.2 + lx}" cy="${y - 1.2 + ly}" r="1.2" fill="#FFFFFF"/><circle cx="${cx + d + 1.2 + lx}" cy="${y - 1.2 + ly}" r="1.2" fill="#FFFFFF"/>`;
    }
    if (mood === 'pensierosa') s += `<path d="M${cx - d - 5} ${y - 8}l9 -2M${cx + d - 4} ${y - 10}l9 2" fill="none" ${sw}/>`;
    if (mood === 'triste') s += `<path d="M${cx - d - 5} ${y - 7}l9 -3M${cx + d - 4} ${y - 10}l9 3" fill="none" ${sw}/>`;
    const my = y + (o.mouth || 11);
    if (mood === 'normale') s += `<path d="M${cx - 6} ${my}q6 5 12 0" fill="none" ${sw}/>`;
    else if (mood === 'contenta') s += `<path d="M${cx - 8} ${my - 1}q8 9 16 0z" fill="#B8432F" ${sw}/>`;
    else if (mood === 'esultante') s += `<path d="M${cx - 9} ${my - 2}q9 13 18 0z" fill="#B8432F" ${sw}/>`;
    else if (mood === 'pensierosa') s += `<path d="M${cx - 5} ${my + 1}h9" fill="none" ${sw}/>`;
    else s += `<path d="M${cx - 6} ${my + 3}q6 -5 12 0" fill="none" ${sw}/>`;
    if (mood === 'contenta' || mood === 'esultante') s += `<circle cx="${cx - d - 5}" cy="${y + 7}" r="3" fill="#F2A08A" opacity=".8"/><circle cx="${cx + d + 5}" cy="${y + 7}" r="3" fill="#F2A08A" opacity=".8"/>`;
    return s;
  }
  const sparkle = (x, y) => `<path d="M${x} ${y - 7}v14M${x - 7} ${y}h14" fill="none" stroke="#E0A800" stroke-width="3" stroke-linecap="round"/>`;
  const think = (x, y) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#FFFFFF" ${sw}/><circle cx="${x + 7}" cy="${y - 9}" r="4" fill="#FFFFFF" ${sw}/>`;

  /* ---------- a · Erre, il resistore ---------- */
  function erre(mood) {
    const up = mood === 'esultante';
    let s = '';
    // reofori: braccia (in alto se esulta) e gambe
    s += up ? `<path d="M30 56 14 34M90 56l16-22" fill="none" ${sw}/>` : mood === 'pensierosa' ? `<path d="M30 58 16 66M90 56c10 0 12-10 4-18" fill="none" ${sw}/>` : mood === 'triste' ? `<path d="M30 58 18 76M90 58l12 18" fill="none" ${sw}/>` : `<path d="M30 56 14 64M90 56l16 8" fill="none" ${sw}/>`;
    const hands = up ? [[14, 34], [106, 34]] : mood === 'pensierosa' ? [[16, 66], [94, 38]] : mood === 'triste' ? [[18, 76], [102, 76]] : [[14, 64], [106, 64]];
    s += hands.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#C9CED3" ${sw}/>`).join('');
    s += `<path d="M48 78v24M72 78v24" fill="none" ${sw}/><path d="M40 103h10M70 103h10" fill="none" ${sw}/>`;
    // corpo con le bande: marrone, nero, rosso e la tolleranza oro
    s += `<rect x="30" y="32" width="60" height="46" rx="12" fill="#E8D3A8" ${sw}/>`;
    s += `<rect x="36" y="33.5" width="6" height="43" fill="#7A4A21"/><rect x="45" y="33.5" width="5" height="43" fill="#1A1A1A"/><rect x="78" y="33.5" width="5" height="43" fill="#C62828"/><rect x="84" y="36" width="3" height="38" fill="#C9A227"/>`;
    s += `<rect x="30" y="32" width="60" height="46" rx="12" fill="none" ${sw}/>`;
    s += face(64, 50, 7, mood, { r: 3.4, mouth: 10 });
    if (up) s += sparkle(104, 18) + sparkle(18, 20);
    if (mood === 'pensierosa') s += think(98, 22);
    return s;
  }
  /* ---------- b · Zampa, la rana di Galvani ---------- */
  function zampa(mood) {
    const up = mood === 'esultante';
    let s = '';
    // zampe posteriori
    s += `<path d="M34 96c-14 2-18-12-8-16 6-2 12 2 14 8" fill="#4FA35E" ${sw}/><path d="M86 96c14 2 18-12 8-16-6-2-12 2-14 8" fill="#4FA35E" ${sw}/>`;
    // corpo e pancia con la scintilla
    s += `<ellipse cx="60" cy="82" rx="28" ry="22" fill="#4FA35E" ${sw}/><ellipse cx="60" cy="86" rx="17" ry="14" fill="#DDEFC9"/>`;
    s += `<path d="M62 76l-6 10h6l-3 9 8-12h-6l3-7z" fill="#E0A800" ${sw} stroke-width="1.6"/>`;
    // braccia
    if (up) s += `<path d="M38 74 22 52M82 74l16-22" fill="none" ${sw}/><circle cx="21" cy="50" r="5" fill="#4FA35E" ${sw}/><circle cx="99" cy="50" r="5" fill="#4FA35E" ${sw}/>`;
    else if (mood === 'pensierosa') s += `<path d="M38 78c-8 6-8 14 0 16M82 76c10-2 14-10 8-16" fill="none" ${sw}/>`;
    else s += `<path d="M38 80c-8 6-8 12-2 16M82 80c8 6 8 12 2 16" fill="none" ${sw}/>`;
    // testa con gli occhi sporgenti
    s += `<ellipse cx="60" cy="50" rx="34" ry="22" fill="#4FA35E" ${sw}/>`;
    s += `<circle cx="44" cy="32" r="11" fill="#4FA35E" ${sw}/><circle cx="76" cy="32" r="11" fill="#4FA35E" ${sw}/><circle cx="44" cy="32" r="7" fill="#FFFFFF"/><circle cx="76" cy="32" r="7" fill="#FFFFFF"/>`;
    s += face(60, 32, 16, mood, { r: 3.6, mouth: 22 });
    if (up) s += sparkle(104, 22) + sparkle(16, 24);
    if (mood === 'pensierosa') s += think(98, 16);
    return s;
  }
  /* ---------- c · Sandro, Volta con la pila ---------- */
  function sandro(mood) {
    const up = mood === 'esultante';
    let s = '';
    // la pila: dischi di rame e zinco separati dal panno
    const px = up ? 88 : 92, py = up ? 26 : 56;
    s += `<rect x="${px - 2}" y="${py - 2}" width="22" height="46" rx="3" fill="#F3EEE4" ${sw}/>`;
    for (let k = 0; k < 6; k++) s += `<rect x="${px + 1}" y="${py + 1 + k * 7}" width="16" height="3" fill="${k % 2 ? '#9AA4AD' : '#C77B3B'}"/><rect x="${px + 1}" y="${py + 4 + k * 7}" width="16" height="2" fill="#7E9C6A"/>`;
    // corpo: giacca blu, cravatta bianca
    s += `<path d="M26 112c0-22 14-34 34-34s34 12 34 34z" fill="#2F4E7A" ${sw}/><path d="M52 80l8 12 8-12" fill="#FFFFFF" ${sw}/>`;
    // braccio che regge la pila
    s += up ? `<path d="M84 90 94 72" fill="none" stroke="#2F4E7A" stroke-width="9" stroke-linecap="round"/><path d="M36 90 22 62" fill="none" stroke="#2F4E7A" stroke-width="9" stroke-linecap="round"/><circle cx="21" cy="60" r="5" fill="#F2C9A0" ${sw}/>` : `<path d="M84 96 94 100" fill="none" stroke="#2F4E7A" stroke-width="9" stroke-linecap="round"/>`;
    // testa, capelli bianchi a riccioli ai lati
    s += `<circle cx="34" cy="42" r="8" fill="#ECECEC" ${sw}/><circle cx="86" cy="42" r="8" fill="#ECECEC" ${sw}/><circle cx="34" cy="56" r="7" fill="#ECECEC" ${sw}/><circle cx="86" cy="56" r="7" fill="#ECECEC" ${sw}/>`;
    s += `<ellipse cx="60" cy="48" rx="25" ry="28" fill="#F2C9A0" ${sw}/>`;
    s += `<path d="M36 36c4-14 16-18 24-18s20 4 24 18c-8-6-16-8-24-8s-16 2-24 8z" fill="#ECECEC" ${sw}/>`;
    s += `<path d="M60 52v6l-3 2" fill="none" ${sw} stroke-width="2.4"/>`;
    s += face(60, 46, 10, mood, { r: 3.2, mouth: 17 });
    if (up) s += sparkle(108, 16) + sparkle(14, 30);
    if (mood === 'pensierosa') s += think(96, 16);
    return s;
  }
  const DRAW = { a: erre, b: zampa, c: sandro };
  const CHOICES = [
    { id: 'a', name: 'Erre', desc: 'un resistore da 1 kΩ con le bande del codice colori; i reofori fanno da braccia e da gambe' },
    { id: 'b', name: 'Zampa', desc: 'la rana degli esperimenti di Luigi Galvani, con una scintilla sulla pancia' },
    { id: 'c', name: 'Sandro', desc: 'Alessandro Volta in versione fumetto, con la pila a colonna di rame e zinco' },
  ];
  const INTRO = {
    a: 'Ciao, sono Erre: un resistore da 1 kΩ. Ti accompagno dalla legge di Ohm fino agli operazionali, un passo alla volta.',
    b: 'Ciao, sono Zampa: con una rana come me Galvani scoprì che i metalli fanno scorrere la corrente. Ti accompagno passo passo.',
    c: 'Ciao, sono Sandro, cioè Alessandro Volta: nel 1800 ho costruito la prima pila. Ti accompagno passo passo nell’elettronica.',
  };
  function svgOf(mood = 'normale', size = 96, variant = 'a') {
    mood = ALIAS[mood] || (MOODS.includes(mood) ? mood : 'normale');
    const f = DRAW[variant] || erre;
    // sotto i 64 px: solo il busto
    const bust = size < 64;
    const vb = bust ? '10 4 100 80' : '0 0 120 120';
    const h = bust ? Math.round(size * 0.8) : size;
    const name = (CHOICES.find((c) => c.id === variant) || CHOICES[0]).name;
    return `<svg class="guide" viewBox="${vb}" width="${size}" height="${h}" aria-hidden="true" data-mood="${mood}" data-name="${name}">${f(mood)}</svg>`;
  }
  const api = { svg: svgOf, MOODS, CHOICES, intro: (v) => INTRO[v] || INTRO.a };
  root.ELEK_GUIDE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
