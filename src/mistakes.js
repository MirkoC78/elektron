/* ELEKTRON — errori tipici. Ogni risolutore (solve.js) calcola la risposta sbagliata che ciascun errore produce;
   quando la risposta dello studente coincide con uno di questi valori, la spiegazione nomina proprio quell'errore.
   Il catalogo dà il nome dell'errore e una spiegazione breve; il risolutore può aggiungere un dettaglio (why) legato al problema.
   Alcuni errori valgono per qualunque risposta numerica (prefisso dimenticato, segno) e si aggiungono da soli. */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const CATALOG = {
    'serie-parallelo': { name: 'serie e parallelo scambiati', text: 'Hai trattato come in serie dei componenti in parallelo (o il contrario). In serie i resistori sono attraversati dalla stessa corrente e le resistenze si sommano; in parallelo hanno la stessa tensione e si sommano i reciproci.' },
    'reciproco': { name: 'reciproco dimenticato', text: 'Hai sommato i reciproci delle resistenze ma non hai fatto il reciproco della somma: 1/R₁ + 1/R₂ è la conduttanza totale, la resistenza equivalente è il suo reciproco.' },
    'prefisso': { name: 'prefisso dimenticato', text: 'Il numero è giusto ma è sbagliato di un fattore 1000: controlla i prefissi (k, m, µ…) nei dati e nel risultato.' },
    'prefisso-milione': { name: 'prefisso sbagliato', text: 'Il risultato è sbagliato di un fattore un milione: forse hai confuso µ con m, oppure M con k.' },
    'partitore-capovolto': { name: 'partitore capovolto', text: 'Nel partitore la tensione su un resistore è proporzionale a quel resistore: al numeratore va la resistenza su cui cerchi la tensione, non l’altra.' },
    'partitore-corrente-capovolto': { name: 'partitore di corrente capovolto', text: 'Nel partitore di corrente la corrente in un ramo è proporzionale alla resistenza dell’altro ramo: passa più corrente dove la resistenza è minore.' },
    'carico-ignorato': { name: 'carico trascurato', text: 'Hai calcolato il partitore come se il carico non ci fosse: il carico è in parallelo al resistore in basso e ne abbassa la resistenza.' },
    'efficace-picco': { name: 'valore efficace scambiato con quello di picco', text: 'Valore di picco ed efficace differiscono di un fattore √2: V_eff = V_p/√2 per una sinusoide. Controlla quale dei due è dato e quale è chiesto.' },
    'picco-piccopicco': { name: 'picco scambiato con picco-picco', text: 'Il valore picco-picco è il doppio di quello di picco: V_pp = 2·V_p.' },
    'omega-f': { name: 'ω scambiata con f', text: 'Pulsazione e frequenza differiscono di un fattore 2π: ω = 2π·f. Nelle reattanze serve ω, non f.' },
    'segno': { name: 'segno sbagliato', text: 'Il valore è giusto ma il segno no: controlla il verso scelto per la corrente o per la tensione e la convenzione dei segni.' },
    'soglia': { name: 'soglia del diodo trascurata', text: 'Un diodo al silicio che conduce ha ai suoi capi circa 0,7 V (un LED di più): va tolta dalla tensione disponibile per la resistenza.' },
    'segno-invertente': { name: 'segno meno dell’invertente dimenticato', text: 'L’amplificatore invertente ha guadagno −R_f/R_1: l’uscita ha segno opposto all’ingresso.' },
    'formula-inversa': { name: 'formula inversa sbagliata', text: 'La formula inversa non è giusta: ricavala dalla formula di partenza con i passaggi di un’equazione di primo grado (si divide, o si moltiplica, entrambi i membri per la stessa grandezza).' },
    'quadrato': { name: 'quadrato dimenticato', text: 'Nella formula la corrente (o la tensione) è al quadrato: P = R·I² e P = V²/R.' },
    'radice': { name: 'radice dimenticata', text: 'Ricavando la grandezza dalla potenza serve la radice quadrata: I = √(P/R), V = √(P·R).' },
    'moduli-sommati': { name: 'moduli sommati', text: 'Resistenza e reattanza non si sommano come numeri: sono a 90° fra loro. Il modulo dell’impedenza è |Z| = √(R² + X²).' },
    'reattanze-sommate': { name: 'reattanze sommate', text: 'La reattanza induttiva e quella capacitiva hanno segno opposto: X = X_L − X_C.' },
    'ore-secondi': { name: 'ore e secondi confusi', text: 'In un’ora ci sono 3600 secondi: l’energia in joule è P·t con t in secondi, quella in wattora è P·t con t in ore.' },
    'condensatori-come-resistori': { name: 'regole dei condensatori scambiate', text: 'Per i condensatori le regole sono rovesciate rispetto ai resistori: in parallelo le capacità si sommano, in serie si sommano i reciproci.' },
    'costante-tempo': { name: 'costante di tempo sbagliata', text: 'La costante di tempo è τ = R·C per il circuito RC e τ = L/R per il circuito RL.' },
    'carica-scarica': { name: 'carica e scarica scambiate', text: 'Durante la carica la tensione sale verso il valore finale (1 − e^(−t/τ)); durante la scarica scende verso zero (e^(−t/τ)).' },
    'beta-dimenticato': { name: 'guadagno di corrente trascurato', text: 'In zona attiva la corrente di collettore è β volte quella di base: I_C = β·I_B.' },
    'vbe-trascurata': { name: 'tensione base-emettitore trascurata', text: 'Fra base ed emettitore di un BJT che conduce ci sono circa 0,7 V: vanno tolti dalla tensione che cade sulla resistenza di base.' },
    'non-invertente-uno': { name: '«1 +» dimenticato', text: 'Il non invertente ha guadagno 1 + R_f/R_1, non R_f/R_1.' },
    'db-potenza': { name: 'decibel di tensione e di potenza confusi', text: 'Per un rapporto di tensioni si usa 20·log; per un rapporto di potenze 10·log.' },
    'bit-livelli': { name: 'livelli e intervalli confusi', text: 'Con n bit ci sono 2ⁿ codici; l’intervallo fra due livelli (il quanto) è V_FS/2ⁿ.' },
    'complemento-uno': { name: 'complemento a uno invece che a due', text: 'Nel complemento a due, dopo aver invertito i bit, bisogna aggiungere 1.' },
    'percentuale': { name: 'percentuale presa come valore', text: 'La tolleranza è una percentuale del valore nominale: il 5 % di 4,7 kΩ è 235 Ω, non 5 Ω.' },
    'generatore-spento': { name: 'generatore spento nel modo sbagliato', text: 'Per calcolare la resistenza di Thevenin i generatori si spengono: quelli di tensione diventano un corto circuito, quelli di corrente un circuito aperto.' },
    'massimo-trasferimento': { name: 'formula della potenza massima sbagliata', text: 'Con R_L = R_th sul carico c’è metà della tensione di Thevenin: P_max = V_th²/(4·R_th).' },
    'seno-coseno': { name: 'seno e coseno scambiati', text: 'La potenza attiva usa il coseno dello sfasamento (P = V·I·cos φ), quella reattiva il seno (Q = V·I·sin φ).' },
    'unita-angolo': { name: 'radianti al posto dei gradi', text: 'L’angolo è chiesto in gradi: controlla che la calcolatrice sia impostata in gradi (DEG), non in radianti.' },
    'raddrizzatore': { name: 'semionda e doppia semionda confuse', text: 'Il valore medio della semionda è V_p/π; quello della doppia semionda è il doppio, 2·V_p/π.' },
    'arrotondamento': { name: 'arrotondamento troppo grossolano', text: 'Il risultato è vicino, ma arrotondato troppo presto: tieni almeno tre cifre significative nei passaggi.' },
  };
  // errori che valgono per qualunque risultato numerico: prefisso (×1000, ÷1000, ×10⁶, ÷10⁶) e segno
  function generic(v) {
    if (!isFinite(v) || v === 0) return [];
    return [
      { id: 'prefisso', v: v * 1000 }, { id: 'prefisso', v: v / 1000 },
      { id: 'prefisso-milione', v: v * 1e6 }, { id: 'prefisso-milione', v: v / 1e6 },
      { id: 'segno', v: -v },
    ];
  }
  /* trova l'errore tipico che produce il valore x (numero nell'unità base). mistakes: [{ id, v, why }] dal risolutore.
     Si cercano prima gli errori del problema, poi quelli generici; il primo che coincide (con la stessa tolleranza della
     risposta giusta) vince. Non si confonde mai con la risposta giusta: il chiamante controlla prima che non sia giusta. */
  function match(x, mistakes, right, tol = U.TOL) {
    const all = (mistakes || []).concat(generic(right)).filter((m) => isFinite(m.v) && !U.within(m.v, right, tol * 3));
    for (const m of all) if (U.within(x, m.v, tol)) return Object.assign({ name: CATALOG[m.id] ? CATALOG[m.id].name : m.id, text: CATALOG[m.id] ? CATALOG[m.id].text : '' }, m);
    return null;
  }
  // il problema è ben posto se nessun errore tipico dà (quasi) la stessa risposta di quella giusta
  function distinct(right, mistakes, sep = 0.03) {
    return (mistakes || []).every((m) => !isFinite(m.v) || !U.within(m.v, right, sep));
  }
  const api = { CATALOG, generic, match, distinct };
  root.ElekMistakes = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
