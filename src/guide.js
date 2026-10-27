/* ELEKTRON — la guida: Erre, un resistore da 1 kΩ (bande marrone, nero, rosso e la tolleranza oro).
   I reofori fanno da braccia e da gambe: fili metallici chiari con il contorno scuro, visibili sul fondo chiaro e su quello scuro.
   Cinque espressioni: normale, contenta, pensierosa, triste, esultante. Sotto i 64 px si disegna solo il busto.
   Contorno uniforme (3 px a 120 px); disegno originale, nessuna somiglianza con mascotte esistenti. */
(function (root) {
  'use strict';
  const LINE = '#2B2420';
  const sw = 'stroke="' + LINE + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  const MOODS = ['normale', 'contenta', 'pensierosa', 'triste', 'esultante'];
  const ALIAS = { idle: 'normale', happy: 'contenta', think: 'pensierosa', sad: 'triste', cheer: 'esultante' };
  // un reoforo: contorno scuro e anima metallica chiara
  const lead = (d) => `<path d="${d}" fill="none" stroke="${LINE}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#C9CED3" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;

  // occhi, sopracciglia e bocca (cx: centro del volto, y: altezza degli occhi, d: mezza distanza fra gli occhi)
  function face(cx, y, d, mood) {
    let s = '';
    const r = 3.4;
    if (mood === 'esultante' || mood === 'contenta') s += `<path d="M${cx - d - 4} ${y + 1}q4 -${mood === 'esultante' ? 6 : 5} 8 0M${cx + d - 4} ${y + 1}q4 -${mood === 'esultante' ? 6 : 5} 8 0" fill="none" ${sw}/>`;
    else {
      const ly = mood === 'pensierosa' ? -1.5 : 0, lx = mood === 'pensierosa' ? 1.5 : 0;
      s += `<circle cx="${cx - d}" cy="${y}" r="${r}" fill="${LINE}"/><circle cx="${cx + d}" cy="${y}" r="${r}" fill="${LINE}"/>`;
      s += `<circle cx="${cx - d + 1.2 + lx}" cy="${y - 1.2 + ly}" r="1.2" fill="#FFFFFF"/><circle cx="${cx + d + 1.2 + lx}" cy="${y - 1.2 + ly}" r="1.2" fill="#FFFFFF"/>`;
    }
    if (mood === 'pensierosa') s += `<path d="M${cx - d - 5} ${y - 8}l9 -2M${cx + d - 4} ${y - 10}l9 2" fill="none" ${sw}/>`;
    if (mood === 'triste') s += `<path d="M${cx - d - 5} ${y - 7}l9 -3M${cx + d - 4} ${y - 10}l9 3" fill="none" ${sw}/>`;
    const my = y + 10;
    if (mood === 'normale') s += `<path d="M${cx - 6} ${my}q6 5 12 0" fill="none" ${sw}/>`;
    else if (mood === 'contenta') s += `<path d="M${cx - 8} ${my - 1}q8 9 16 0z" fill="#B8432F" ${sw}/>`;
    else if (mood === 'esultante') s += `<path d="M${cx - 9} ${my - 2}q9 13 18 0z" fill="#B8432F" ${sw}/>`;
    else if (mood === 'pensierosa') s += `<path d="M${cx - 5} ${my + 1}h9" fill="none" ${sw}/>`;
    else s += `<path d="M${cx - 6} ${my + 3}q6 -5 12 0" fill="none" ${sw}/>`;
    if (mood === 'contenta' || mood === 'esultante') s += `<circle cx="${cx - d - 5}" cy="${y + 7}" r="3" fill="#F2A08A" opacity=".8"/><circle cx="${cx + d + 5}" cy="${y + 7}" r="3" fill="#F2A08A" opacity=".8"/>`;
    return s;
  }
  const sparkle = (x, y) => `<path d="M${x} ${y - 7}v14M${x - 7} ${y}h14" fill="none" stroke="${LINE}" stroke-width="6" stroke-linecap="round"/><path d="M${x} ${y - 7}v14M${x - 7} ${y}h14" fill="none" stroke="#FFC93D" stroke-width="3" stroke-linecap="round"/>`;
  const think = (x, y) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#FFFFFF" ${sw}/><circle cx="${x + 7}" cy="${y - 9}" r="4" fill="#FFFFFF" ${sw}/>`;

  function erre(mood) {
    const up = mood === 'esultante';
    let s = '';
    // braccia (in alto se esulta, una sotto il mento se pensa, giù se è triste) e gambe
    const arms = up ? ['M30 56 14 34', 'M90 56l16-22'] : mood === 'pensierosa' ? ['M30 58 16 66', 'M90 56c10 0 12-10 4-18'] : mood === 'triste' ? ['M30 58 18 76', 'M90 58l12 18'] : ['M30 56 14 64', 'M90 56l16 8'];
    const hands = up ? [[14, 34], [106, 34]] : mood === 'pensierosa' ? [[16, 66], [94, 38]] : mood === 'triste' ? [[18, 76], [102, 76]] : [[14, 64], [106, 64]];
    s += arms.map(lead).join('');
    s += hands.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#C9CED3" ${sw}/>`).join('');
    s += lead('M48 78v24h-8') + lead('M72 78v24h8');
    // corpo con le bande: marrone, nero, rosso (1 kΩ) e la tolleranza oro
    s += `<rect x="30" y="32" width="60" height="46" rx="12" fill="#E8D3A8" ${sw}/>`;
    s += `<rect x="36" y="33.5" width="6" height="43" fill="#7A4A21"/><rect x="45" y="33.5" width="5" height="43" fill="#1A1A1A"/><rect x="78" y="33.5" width="5" height="43" fill="#C62828"/><rect x="84" y="36" width="3" height="38" fill="#C9A227"/>`;
    s += `<rect x="30" y="32" width="60" height="46" rx="12" fill="none" ${sw}/>`;
    s += face(64, 50, 7, mood);
    if (up) s += sparkle(104, 18) + sparkle(18, 20);
    if (mood === 'pensierosa') s += think(98, 22);
    return s;
  }
  function svgOf(mood = 'normale', size = 96) {
    mood = ALIAS[mood] || (MOODS.includes(mood) ? mood : 'normale');
    // sotto i 64 px: solo il busto (il corpo con il volto e l'attacco delle braccia)
    const bust = size < 64;
    const vb = bust ? '8 20 104 70' : '0 0 120 120';
    const h = bust ? Math.round(size * 70 / 104) : size;
    return `<svg class="guide" viewBox="${vb}" width="${size}" height="${h}" aria-hidden="true" data-mood="${mood}">${erre(mood)}</svg>`;
  }
  const INTRO = 'Ciao, sono Erre: un resistore da 1 kΩ (guarda le mie bande: marrone, nero, rosso). Ti accompagno dalla legge di Ohm fino agli operazionali, un passo alla volta.';
  const api = { svg: svgOf, MOODS, INTRO, NAME: 'Erre' };
  root.ELEK_GUIDE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
