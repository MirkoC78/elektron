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
    'zener-sempre': { name: "Zener considerato sempre in conduzione", text: "Lo Zener stabilizza solo se, togliendolo, sul carico ci sarebbe più di V_Z: prima controlla la tensione a vuoto V·R_L/(R + R_L)." },
    'serie-e': { name: "valore commerciale scelto dalla parte sbagliata", text: "Fra i due valori commerciali vicini scegli quello che non fa superare la corrente (o che non fa uscire dalla saturazione): per un LED il valore subito sopra, per la base di un interruttore quello subito sotto." },
    'corrente-carico': { name: "corrente del carico dimenticata", text: "La corrente nel resistore di limitazione si divide fra lo Zener e il carico: I_Z = I_R − I_L." },
    'frequenza-ondulazione': { name: "frequenza dell’ondulazione sbagliata", text: "Con la semionda il condensatore si ricarica una volta per periodo (50 Hz); con il ponte due volte (100 Hz): V_r = I/(f·C) oppure V_r = I/(2·f·C)." },
    'ondulazione': { name: "ondulazione presa per intero", text: "La tensione continua media è V_p meno metà dell’ondulazione picco-picco: V_DC ≈ V_p − V_r/2." },
    'saturazione-ignorata': { name: "saturazione ignorata", text: "Se β·I_B supera la corrente di saturazione il transistor è saturo: I_C = (V_CC − V_CE,sat)/R_C e V_CE ≈ 0,2 V. Prima di usare I_C = β·I_B controlla la zona." },
    'resistenza-emettitore': { name: "resistenza di emettitore dimenticata", text: "La corrente di collettore attraversa anche R_E: V_CE = V_CC − I_C·(R_C + R_E)." },
    'sovrasaturazione': { name: "fattore di sovrasaturazione dimenticato", text: "Per essere sicuri che il transistor saturi si prende una corrente di base maggiore del minimo (di solito 2 o 3 volte I_C,sat/β)." },
    'soglia-mos': { name: "tensione di soglia del MOSFET trascurata", text: "Il MOSFET conduce solo se V_GS supera la tensione di soglia V_GS(th): controllala prima di calcolare la corrente." },
    'potenza-carico': { name: "potenza del carico al posto di quella del componente", text: "La potenza dissipata da un componente è il prodotto della tensione ai suoi capi per la corrente che lo attraversa, non quella del carico." },
    'saturazione-op': { name: "saturazione dell’operazionale ignorata", text: "L’uscita dell’operazionale non può superare le tensioni di alimentazione: se il calcolo dà di più, l’uscita satura a ±V_sat." },
    'inseguitore-zero': { name: "inseguitore frainteso", text: "L’inseguitore ha guadagno 1: l’uscita ripete la tensione d’ingresso." },
    'sommatore-media': { name: "resistenze del sommatore trascurate", text: "Ogni ingresso del sommatore pesa R_f/R_i: V_out = −R_f·(V_1/R_1 + V_2/R_2 + …)." },
    'comparatore-ingressi': { name: "ingressi del comparatore scambiati", text: "L’uscita del comparatore va a +V_sat quando l’ingresso non invertente (+) è più alto di quello invertente (−)." },
    'isteresi-meta': { name: "isteresi presa a metà", text: "L’isteresi è la distanza fra le due soglie: V_H = V_TH − V_TL = 2·V_T." },
    'astabile-mezzo': { name: "mezzo periodo al posto del periodo", text: "Il periodo dell’astabile comprende la carica e la scarica del condensatore: T = 2·R·C·ln((1 + β)/(1 − β))." },
    '555-formula': { name: "formula del NE555 sbagliata", text: "Nell’astabile il condensatore si carica attraverso R_A + R_B (t_H = 0,693·(R_A + R_B)·C) e si scarica solo attraverso R_B (t_L = 0,693·R_B·C); nel monostabile T = 1,1·R·C." },
    '555-duty': { name: "duty cycle capovolto", text: "Il duty cycle è la frazione del periodo in cui l’uscita è alta: D = t_H/T." },
    'wien-guadagno': { name: "guadagno del ponte di Wien sbagliato", text: "Alla frequenza di oscillazione il ponte di Wien attenua di 3 volte: l’amplificatore deve avere guadagno 3, cioè R_f = 2·R_1." },
    'rendimento-perdite': { name: "perdite al posto del rendimento", text: "Il rendimento è la frazione di potenza che arriva al carico: η = P_out/P_in." },
    'pt100-uno': { name: "«1 +» della PT100 dimenticato", text: "La resistenza della PT100 è R = R_0·(1 + α·T): a 0 °C vale R_0, non zero." },
    'kelvin': { name: "temperatura in gradi Celsius al posto dei kelvin", text: "Nella formula dell’NTC le temperature vanno in kelvin: T_K = T + 273,15." },
    'condizionamento-offset': { name: "offset dimenticato", text: "Se il campo del sensore non parte da zero serve anche uno spostamento (offset), oltre al guadagno." },
    'nyquist': { name: "teorema del campionamento frainteso", text: "Per ricostruire il segnale la frequenza di campionamento deve essere almeno il doppio della frequenza massima: f_c ≥ 2·f_max." },
    'fase-filtro': { name: "segno della fase del filtro sbagliato", text: "Il passa-basso ritarda (fase negativa, fino a −90°); il passa-alto anticipa (fase positiva, fino a +90°). Alla frequenza di taglio la fase è ∓45°." },
    'bode-pendenza': { name: "pendenza di Bode sbagliata", text: "Un filtro del primo ordine scende di 20 dB per decade (6 dB per ottava) oltre la frequenza di taglio." },
    'filtro-attivo-r': { name: 'resistenza sbagliata nella frequenza di taglio', text: 'Nel filtro attivo la frequenza di taglio dipende dalla resistenza che sta con il condensatore: R_f nel passa-basso (C in parallelo a R_f), R_1 nel passa-alto (C in serie a R_1).' },
    'quanto-meno-uno': { name: "quanto calcolato con 2ⁿ − 1", text: "In questa app il quanto è Q = V_FS/2ⁿ (convenzione dichiarata nella lezione)." },
    'troncamento': { name: "codice troncato invece che arrotondato", text: "In questa app il convertitore arrotonda al livello più vicino: N = Vin/Q arrotondato all’intero più vicino, con un errore di al massimo Q/2." },
    'potenze-10': { name: "potenze di 10 sbagliate", text: "Moltiplicando due potenze di 10 gli esponenti si sommano (10³·10⁻² = 10¹); un esponente negativo sposta la virgola verso sinistra." },
    'colori-moltiplicatore': { name: "moltiplicatore sbagliato", text: "La penultima banda è il moltiplicatore: dice quanti zeri aggiungere dopo le cifre (oro vuol dire dividere per 10, argento per 100)." },
    'colori-ordine': { name: "bande lette al contrario", text: "Il codice si legge partendo dalla banda più vicina al bordo; la banda della tolleranza (oro, argento) è l’ultima, un po’ staccata." },
    'strumento-collegamento': { name: "collegamento dello strumento sbagliato", text: "Il voltmetro si collega in parallelo al componente, l’amperometro in serie (aprendo il circuito); l’ohmmetro solo a circuito spento." },
    'portata-piccola': { name: "portata troppo piccola", text: "Con una portata più piccola del valore da misurare lo strumento va fuori scala (il display mostra 1 a sinistra)." },
    'portata-grande': { name: "portata troppo grande", text: "Con una portata troppo grande si perdono cifre: si sceglie la portata più piccola che contiene il valore." },
    'potenza-piccola': { name: "potenza nominale insufficiente", text: "La potenza nominale del resistore deve essere almeno quella che dissipa: con meno si scalda troppo e si guasta." },
    'nodi-punti': { name: "nodi contati male", text: "Un nodo è un punto in cui si incontrano almeno tre conduttori: i punti in cui se ne incontrano solo due non sono nodi." },
    'guasto': { name: "guasto sbagliato", text: "Confronta ogni misura con il valore atteso: un componente interrotto blocca la corrente nel suo ramo, uno in corto rende uguali i potenziali ai suoi capi." },
    'codice-cifre': { name: "codice del condensatore letto come numero", text: "Nel codice a tre cifre le prime due sono le cifre del valore e la terza è il numero di zeri, in picofarad: 104 = 10·10⁴ pF = 100 nF." },
    'porta-sbagliata': { name: "porta sbagliata", text: "Guarda le righe della tabella: AND dà 1 solo con tutti gli ingressi a 1, OR dà 1 se almeno un ingresso è a 1, XOR se gli ingressi sono diversi; NAND, NOR e XNOR sono le stesse con l’uscita negata." },
    'demorgan': { name: "De Morgan applicato a metà", text: "Con De Morgan si negano i singoli termini e insieme AND diventa OR (e OR diventa AND): ¬(A·B) = A̅ + B̅, ¬(A + B) = A̅·B̅." },
    'divisioni': { name: "divisioni non moltiplicate per la scala", text: "Sull’oscilloscopio si contano le divisioni e poi si moltiplica per la scala: V/div per le tensioni, s/div per i tempi." },
    'contatore-modulo': { name: "modulo del contatore dimenticato", text: "Un contatore modulo M, arrivato a M − 1, al clock successivo torna a 0: lo stato è il resto della divisione per M." },
    'divisore': { name: "divisione di frequenza sbagliata", text: "Ogni flip-flop divide la frequenza per 2: dopo n flip-flop f_out = f/2ⁿ." },
    'latch': { name: "latch SR frainteso", text: "Nel latch SR: S = 1 imposta Q = 1, R = 1 azzera Q, con S = R = 0 Q resta com’è; S = R = 1 è la combinazione vietata." },
    'diodo-verso': { name: "verso del diodo frainteso", text: "Il diodo conduce quando l’anodo (il lato del triangolo) è più positivo del catodo (il lato della barretta)." },
    'margine': { name: "margine di rumore sbagliato", text: "Il margine a livello alto è V_OH − V_IH, quello a livello basso V_IL − V_OL: si confrontano un’uscita e un ingresso." },
    'simbolo': { name: "simbolo confuso", text: "Ripassa i simboli: il resistore è un rettangolo, il condensatore due lamine parallele, l’induttore una serie di archi, il diodo un triangolo con una barretta." },
    'resti-al-contrario': { name: 'cifre lette nell’ordine sbagliato', text: 'Con le divisioni successive le cifre si leggono dall’ultimo resto al primo; in un codice il bit più significativo è a sinistra.' },
    'negazione': { name: 'funzione negata', text: 'Il risultato è esattamente il contrario di quello giusto: controlla le negazioni (le barre) e, con De Morgan, che AND e OR siano stati scambiati.' },
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
