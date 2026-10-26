/* ELEKTRON — percorso, classe 3ª: unità 1–12.
   Ogni lezione: id, title, sub, intro (concetti introdotti), num ('int' | 'dec1' | 'free'), prefixes (facoltativo),
   teach (schede), bank (domande di teoria), mix (8–12 esercizi: «gen», «s:gen» a scelta, «o:gen» da ordinare).
   Schede: say (parla la guida), p (testo, formule fra $…$), f (formula con la legenda leg e le inverse inv),
   ex (esempio svolto dal motore con il generatore indicato), schema, tbl (tabella di concetti), math (ripasso di matematica),
   warn (avvertenza di sicurezza). Ogni scheda ha la sua domanda di controllo q: [domanda, giusta, sbagliate…] oppure
   { gen } (un problema del motore, a scelta). Nessun valore calcolato è scritto a mano: gli esempi li svolge il motore. */
(function (root) {
  'use strict';
  const Q = (q, right, ...wrong) => [q, right, ...wrong];
  const T = (id, title) => ({ id, title: title || 'Prova d’unità', test: true });
  const UNITS = [
  /* ========================= 1. Grandezze e unità ========================= */
  { id: 'u1', title: 'Grandezze e unità', cls: 3, say: 'Cominciamo dalle grandezze dell’elettricità: carica, corrente, tensione, potenza ed energia. Poi impariamo a scrivere i numeri grandi e piccoli come fanno i tecnici.',
    lessons: [
    { id: 'u1l1', title: 'Carica e corrente', sub: 'coulomb, ampere, I = Q/t', intro: ['q.Q', 'q.I', 'q.t', 'f.IQt'], num: 'int',
      teach: [
        { say: 'La materia contiene cariche elettriche. Nei metalli alcuni elettroni sono liberi di muoversi: quando si muovono tutti nello stesso verso, c’è una corrente.', q: Q('Che cosa si muove in un filo di rame percorso da corrente?', 'gli elettroni liberi', 'i protoni', 'gli atomi di rame') },
        { p: 'La **carica elettrica** si indica con $Q$ e si misura in **coulomb** (C). La **corrente** $I$ è la quantità di carica che attraversa la sezione di un conduttore in un secondo: si misura in **ampere** (A).', q: Q('In quale unità si misura la corrente?', 'ampere (A)', 'coulomb (C)', 'volt (V)') },
        { f: 'I = Q/t', leg: [['I', 'corrente', 'A'], ['Q', 'carica', 'C'], ['t', 'tempo', 's']], inv: ['Q = I * t', 't = Q/I'], q: { gen: 'carica.I' } },
        { ex: 'carica.Q', q: Q('Se la stessa carica passa in un tempo doppio, la corrente…', 'si dimezza', 'raddoppia', 'resta uguale') }],
      mix: ['carica.I', 'carica.I', 's:carica.I', 'carica.Q', 'carica.Q', 'carica.I', 's:carica.Q', 'carica.Q', 'carica.I'] },
    { id: 'u1l2', title: 'Tensione', sub: 'volt, energia per coulomb', intro: ['q.V', 'q.W', 'f.VWQ'], num: 'int',
      teach: [
        { say: 'Perché le cariche si muovano serve qualcuno che le spinga: un generatore, per esempio una pila. La spinta si chiama tensione.', q: Q('Che cosa fa muovere le cariche in un circuito?', 'la tensione del generatore', 'il filo', 'la corrente stessa') },
        { p: 'La **tensione** $V$ fra due punti è l’energia $W$ che il generatore fornisce a ogni coulomb di carica che porta da un punto all’altro. Si misura in **volt** (V): 1 V = 1 J/C. L’energia si misura in **joule** (J).', q: Q('Che cosa vuol dire che una pila ha 1,5 V?', 'fornisce 1,5 J a ogni coulomb di carica', 'fa passare 1,5 C al secondo', 'contiene 1,5 J di energia in tutto') },
        { f: 'V = W/Q', leg: [['V', 'tensione', 'V'], ['W', 'energia', 'J'], ['Q', 'carica', 'C']], inv: ['W = V * Q'], q: { gen: 'tensione.V' } },
        { tbl: { c: ['Grandezza', 'Simbolo', 'Unità'], r: [['carica', 'Q', 'coulomb (C)'], ['corrente', 'I', 'ampere (A)'], ['tensione', 'V', 'volt (V)'], ['energia', 'W', 'joule (J)'], ['tempo', 't', 'secondo (s)']] }, q: Q('Qual è il simbolo della tensione?', 'V', 'T', 'E') }],
      mix: ['tensione.V', 'tensione.V', 'abbina.grandezze', 's:tensione.V', 'carica.I', 'tensione.V', 'abbina.grandezze', 'carica.Q', 'tensione.V'] },
    { id: 'u1l3', title: 'Potenze di 10 e notazione scientifica', sub: 'ripasso di matematica', intro: ['m.pot10', 'm.sci'], num: 'free',
      teach: [
        { say: 'In elettronica ci sono numeri enormi e numeri piccolissimi: un milione di ohm, un milionesimo di farad. Le potenze di 10 li rendono facili da scrivere.', q: Q('Quanto vale 10³?', '1000', '30', '100') },
        { math: true, p: '$10^3 = 1000$, $10^6 = `1 000 000`$; $10^{-3} = 0,001$, $10^{-6} = `0,000 001`$. L’esponente dice di quanti posti si sposta la virgola: a destra se è positivo, a sinistra se è negativo.', q: Q('Quanto vale 10⁻³?', '0,001', '−1000', '0,0001') },
        { math: true, p: 'Nella **notazione scientifica** un numero si scrive come un numero fra 1 e 10 moltiplicato per una potenza di 10: $4700 = 4,7 * 10^3$, $0,0025 = 2,5 * 10^{-3}$.', q: { gen: 'sci.leggi' } },
        { math: true, p: 'Moltiplicando due potenze di 10 gli esponenti si **sommano**: $10^3 * 10^{-2} = 10^1$. Dividendo si **sottraggono**: $10^3/10^5 = 10^{-2}$.', q: Q('Quanto fa 10⁴ · 10⁻⁶?', '10⁻²', '10⁻²⁴', '10¹⁰') }],
      mix: ['sci.leggi', 'sci.leggi', 'sci.prodotto', 's:sci.leggi', 'sci.prodotto', 'sci.leggi', 'sci.prodotto', 's:sci.prodotto', 'sci.leggi'] },
    { id: 'u1l4', title: 'Prefissi SI e scrittura dei tecnici', sub: 'k, M, m, µ, n, p · 4,7 kΩ · 4k7', intro: ['m.prefissi'], num: 'free', prefixes: ['p', 'n', 'µ', 'm', '', 'k', 'M', 'G'],
      teach: [
        { say: 'Al posto delle potenze di 10 i tecnici usano i prefissi: una lettera davanti all’unità. Così si scrive 4,7 kΩ invece di 4700 Ω.', q: Q('Che cosa vuol dire il prefisso k?', 'per mille (10³)', 'per un milione', 'diviso mille') },
        { tbl: { c: ['Prefisso', 'Simbolo', 'Fattore'], r: [['giga', 'G', '10⁹'], ['mega', 'M', '10⁶'], ['chilo', 'k', '10³'], ['milli', 'm', '10⁻³'], ['micro', 'µ', '10⁻⁶'], ['nano', 'n', '10⁻⁹'], ['pico', 'p', '10⁻¹²']] }, q: Q('Quanto vale 1 µA?', '0,000 001 A', '0,001 A', '1000 A') },
        { p: 'Si scrive secondo il **Sistema Internazionale**: virgola decimale, uno spazio fra numero e unità, prefisso attaccato all’unità: $`4,7 kΩ`$, $`12 mA`$. Attenzione: **m** minuscola è milli, **M** maiuscola è mega.', q: Q('Quale scrittura è corretta secondo il SI?', '4,7 kΩ', '4.7KΩ', '4,7 K Ω') },
        { p: 'Sugli schemi i tecnici mettono la lettera del prefisso al posto della virgola: **4k7** = 4,7 kΩ, **2M2** = 2,2 MΩ, **4R7** = 4,7 Ω, **R47** = 0,47 Ω. Così una virgola sbiadita non cambia il valore.', q: { gen: 'prefissi.tecnici' } }],
      mix: ['prefissi.base', 'prefissi.verso', 'prefissi.base', 'prefissi.tecnici', 's:prefissi.base', 'prefissi.verso', 'prefissi.base', 'prefissi.tecnici', 's:prefissi.verso', 'prefissi.verso'] },
    { id: 'u1l5', title: 'Potenza ed energia', sub: 'P = V·I, W = P·t, kWh', intro: ['q.P', 'f.PVI', 'f.WPt', 'u.Wh'], num: 'dec1',
      teach: [
        { say: 'Una lampadina da 60 W e una da 10 W, accese per lo stesso tempo, consumano energie diverse. La potenza dice quanto in fretta un apparecchio usa l’energia.', q: Q('Che cosa misura la potenza?', 'l’energia trasformata in un secondo', 'la carica che passa', 'la spinta del generatore') },
        { f: 'P = V * I', leg: [['P', 'potenza', 'W'], ['V', 'tensione', 'V'], ['I', 'corrente', 'A']], inv: ['I = P/V', 'V = P/I'], q: { gen: 'potenza.PVI' } },
        { f: 'W = P * t', leg: [['W', 'energia', 'J'], ['P', 'potenza', 'W'], ['t', 'tempo', 's']], inv: ['P = W/t'], q: { gen: 'energia.J' } },
        { p: 'Nelle bollette l’energia si conta in **kilowattora**: 1 kWh è l’energia di 1 kW per un’ora. Con il tempo in ore e la potenza in watt l’energia viene in wattora (Wh); 1 Wh = 3600 J.', q: { gen: 'energia.kWh' } }],
      mix: ['potenza.PVI', 'potenza.PVI', 'potenza.IPV', 's:potenza.PVI', 'energia.J', 'energia.kWh', 'potenza.IPV', 'energia.J', 's:energia.kWh', 'abbina.grandezze', 'energia.kWh'] },
    Object.assign(T('u1t'), { mix: ['carica.I', 'tensione.V', 'sci.leggi', 'prefissi.base', 'prefissi.verso', 'prefissi.tecnici', 'potenza.PVI', 'potenza.IPV', 'energia.J', 'energia.kWh', 'carica.Q', 'abbina.grandezze'] }),
    ] },

  /* ========================= 2. Il circuito, i componenti, gli strumenti ========================= */
  { id: 'u2', title: 'Il circuito, i componenti, gli strumenti', cls: 3, say: 'Ora mettiamo insieme i pezzi: generatore, fili, componenti. Impariamo i simboli, il codice colori dei resistori e come si usa il multimetro, in sicurezza.',
    lessons: [
    { id: 'u2l1', title: 'Il circuito e le convenzioni dei segni', sub: 'simboli CEI, verso della corrente, freccia della tensione', intro: ['c.gen', 'c.SW', 'c.lamp', 'k.verso', 'k.freccia', 'k.utilizzatori'], num: 'dec1',
      teach: [
        { say: 'Un circuito è un percorso chiuso: il generatore, i fili e gli utilizzatori. Se il percorso si interrompe, la corrente si ferma.', q: Q('Che cosa succede se apri l’interruttore di un circuito?', 'la corrente si ferma in tutto il circuito', 'la corrente continua ma più debole', 'si scarica il generatore') },
        { schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: 12 }], [{ id: 'H1', t: 'LAMP' }]], top: [[{ id: 'SW1', t: 'SW', closed: true }]] } }, p: 'Gli schemi usano i **simboli CEI EN 60617**: il generatore di tensione è un cerchio attraversato dal conduttore, con il **+** dalla parte del morsetto positivo; l’interruttore è una levetta; la lampada un cerchio con una croce.', q: Q('Nello schema, dove è il morsetto positivo del generatore?', 'dalla parte del segno +, in alto', 'in basso', 'non si può sapere') },
        { p: '**Verso convenzionale** della corrente: nel circuito esterno la corrente va dal morsetto **+** al morsetto **−** del generatore. (Gli elettroni in realtà vanno al contrario: la convenzione è nata prima di scoprirli.)', q: Q('In quale verso si disegna la corrente nel circuito esterno?', 'dal + al − del generatore', 'dal − al + del generatore', 'in entrambi i versi') },
        { p: 'La **tensione** si disegna con una freccia accanto al componente: **la punta indica il morsetto a potenziale più alto** (il +). Per gli utilizzatori la corrente entra dal +: è la **convenzione degli utilizzatori**, e la potenza così calcolata è assorbita. Per i generatori la corrente esce dal +: **convenzione dei generatori**, potenza erogata.', q: Q('Per un resistore (utilizzatore), da quale morsetto entra la corrente?', 'da quello a potenziale più alto, indicato dalla punta della freccia', 'da quello a potenziale più basso', 'dipende dal colore del resistore') }],
      bank: [Q('Un circuito aperto…', 'non è percorso da corrente', 'è percorso dalla corrente massima', 'ha tensione nulla ai capi dell’interruttore'), Q('La freccia della tensione punta…', 'verso il morsetto a potenziale più alto', 'nel verso degli elettroni', 'sempre verso destra'), Q('Con la convenzione dei generatori, la potenza calcolata come V·I è…', 'erogata dal generatore', 'assorbita dal generatore', 'sempre nulla'), Q('Gli elettroni, in un filo, si muovono…', 'dal − al + nel circuito esterno', 'dal + al − nel circuito esterno', 'non si muovono')],
      mix: ['domande', 'simbolo', 'domande', 'domande', 'simbolo', 'domande', 'simbolo', 'domande'] },
    { id: 'u2l2', title: 'Il resistore e il codice colori', sub: 'ohm, bande, 4 e 5 anelli', intro: ['c.R', 'q.R', 'c.codice'], num: 'dec1',
      teach: [
        { say: 'Il resistore è il componente più usato: limita la corrente. La sua resistenza si misura in ohm, con la lettera greca Ω.', q: Q('In quale unità si misura la resistenza?', 'ohm (Ω)', 'ampere (A)', 'watt (W)') },
        { p: 'Nei simboli CEI il **resistore è un rettangolo** con i due terminali. (Il simbolo a zig-zag è quello americano.) Il valore si legge sul corpo con il **codice colori**.', q: { gen: 'simbolo' } },
        { tbl: { c: ['Colore', 'Cifra', 'Moltiplicatore', 'Tolleranza'], r: [['nero', '0', '×1', ''], ['marrone', '1', '×10', '±1 %'], ['rosso', '2', '×100', '±2 %'], ['arancio', '3', '×1000', ''], ['giallo', '4', '×10⁴', ''], ['verde', '5', '×10⁵', '±0,5 %'], ['blu', '6', '×10⁶', '±0,25 %'], ['viola', '7', '×10⁷', '±0,1 %'], ['grigio', '8', '', '±0,05 %'], ['bianco', '9', '', ''], ['oro', '', '×0,1', '±5 %'], ['argento', '', '×0,01', '±10 %']] }, q: Q('Quale cifra vale il rosso?', '2', '1', '3') },
        { p: 'Con **4 bande**: due cifre, il moltiplicatore, la tolleranza. Con **5 bande**: tre cifre, il moltiplicatore, la tolleranza. Si legge partendo dal lato opposto alla banda della tolleranza (oro o argento, spesso un po’ staccata).', q: { gen: 'colori.valore' } }],
      bank: [Q('Nel codice a 4 bande, la terza banda è…', 'il moltiplicatore', 'la terza cifra', 'la tolleranza')],
      mix: ['colori.valore', 'colori.valore', 'colori.bande', 'simbolo', 'colori.valore', 'colori.bande', 'domande', 'colori.valore', 'colori.bande'] },
    { id: 'u2l3', title: 'Valori commerciali e tolleranza', sub: 'serie E12 ed E24, percentuali', intro: ['m.perc', 'q.tol', 'c.serieE'], num: 'dati1',
      teach: [
        { say: 'I resistori non si trovano di tutti i valori: si comprano in serie di valori standard. E nessun resistore vale esattamente quanto c’è scritto.', q: Q('Perché un resistore da 1 kΩ può misurare 980 Ω?', 'per la tolleranza', 'perché è guasto', 'perché il multimetro sbaglia sempre') },
        { math: true, p: 'Il **5 %** di una grandezza è la grandezza moltiplicata per $5/100$. Con tolleranza ±5 % il valore vero sta fra il nominale meno il 5 % e il nominale più il 5 %.', ex: 'tolleranza.min', q: { gen: 'tolleranza.min' } },
        { p: 'La **serie E12** ha 12 valori per decade: **10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82**, e i loro multipli (100 Ω, 4,7 kΩ, 56 kΩ…). La **serie E24** ne ha 24 (aggiunge 11, 13, 16, 20, 24, 30, 36, 43, 51, 62, 75, 91). Le serie sono fatte in modo che ogni valore, con la sua tolleranza, quasi tocchi il successivo.', q: { gen: 'serieE.vicino' } }],
      mix: ['tolleranza.min', 'tolleranza.min', 'serieE.vicino', 's:tolleranza.min', 'serieE.vicino', 'colori.valore', 'tolleranza.min', 'serieE.vicino', 'colori.bande'] },
    { id: 'u2l4', title: 'Generatori e multimetro', sub: 'voltmetro in parallelo, amperometro in serie, portata', intro: ['c.genI', 'c.VM', 'c.AM', 's.portata'], num: 'free',
      teach: [
        { p: 'Il **generatore di tensione** ideale mantiene la stessa tensione qualunque sia la corrente. Il **generatore di corrente** ideale mantiene la stessa corrente qualunque sia la tensione: il suo simbolo è un cerchio con il segmento trasversale e una freccia per il verso.', q: { gen: 'simbolo' } },
        { p: 'Il **voltmetro** misura la tensione fra due punti: si collega **in parallelo** al componente, senza toccare il circuito. L’**amperometro** misura la corrente: si collega **in serie**, aprendo il circuito e facendo passare la corrente dentro lo strumento. L’**ohmmetro** si usa solo a circuito **spento**.', q: { gen: 'multimetro.collega' } },
        { p: 'La **portata** è il valore più grande che lo strumento misura su quella scala. Si sceglie la portata più piccola che contiene il valore atteso: così si leggono più cifre. Se il valore supera la portata, il display mostra «1» a sinistra (fuori scala).', q: { gen: 'multimetro.portata' } },
        { warn: 'In laboratorio misuriamo solo circuiti in bassissima tensione (fino a 12 V in continua). Non si misura mai la presa di rete.', q: Q('Quale tensione si può misurare in laboratorio, in questo corso?', 'al massimo 12 V in continua', 'la presa di casa', 'qualunque, se si ha il multimetro') }],
      mix: ['multimetro.collega', 'multimetro.portata', 'multimetro.leggi', 'simbolo', 'multimetro.collega', 'multimetro.leggi', 'multimetro.portata', 'multimetro.leggi', 'multimetro.collega'] },
    { id: 'u2l5', title: 'Sicurezza elettrica', sub: 'effetti della corrente, bassissima tensione, regole del laboratorio', intro: ['k.sicurezza'], num: 'dec1',
      teach: [
        { say: 'Prima di toccare un circuito vero, una cosa importante: la corrente che attraversa il corpo può fare molto male. Ecco le regole.', q: Q('Che cosa è pericoloso per il corpo umano?', 'la corrente che lo attraversa', 'solo il colore dei fili', 'il campo magnetico di una pila') },
        { p: 'Gli effetti dipendono dalla **corrente** che attraversa il corpo e dal **tempo**: già qualche decina di milliampere attraverso il torace può causare la fibrillazione del cuore. La corrente dipende dalla tensione e dalla resistenza del corpo, che con la pelle bagnata è molto più bassa.', q: Q('Quando il corpo conduce di più?', 'con la pelle bagnata', 'con la pelle asciutta', 'non cambia mai') },
        { p: 'La **bassissima tensione di sicurezza** (in continua fino a 120 V, ma in laboratorio a scuola restiamo entro 12 V) non è pericolosa in condizioni normali. La **rete** a 230 V in alternata può uccidere: non si apre, non si misura, non si toccano parti scoperte.', q: Q('In questo corso, a quale tensione si fanno gli esperimenti?', 'fino a 12 V in continua', '230 V con attenzione', '400 V con i guanti') },
        { warn: 'Regole del laboratorio: si monta e si modifica il circuito sempre a generatore spento; si controlla lo schema prima di accendere; un componente che scalda o fa odore si spegne subito; non si lavora mai da soli e non si toccano mai cavi di rete danneggiati.', q: Q('Quando si modifica un circuito?', 'sempre a generatore spento', 'mentre è acceso, per vedere l’effetto', 'quando il docente non guarda') }],
      bank: [Q('Un resistore che scalda e fa odore di bruciato…', 'si spegne subito il generatore', 'si raffredda soffiando', 'è normale'), Q('Si può misurare la tensione della presa di casa con il multimetro in laboratorio?', 'no: non si lavora sulla rete', 'sì, con la portata più alta', 'sì, se il multimetro è nuovo'), Q('Che cosa rende più pericolosa una scossa?', 'la pelle bagnata e un tempo lungo', 'le scarpe di gomma', 'una tensione di 3 V'), Q('Prima di accendere un circuito nuovo…', 'si controlla che corrisponda allo schema', 'si aumenta la tensione al massimo', 'si tolgono i componenti'), Q('Un cavo di alimentazione con l’isolante rotto…', 'non si usa e si segnala', 'si ripara con il nastro e si usa', 'si usa solo per poco'), Q('La corrente pericolosa per il cuore è dell’ordine…', 'di qualche decina di milliampere', 'di qualche microampere', 'di migliaia di ampere'), Q('Chi lavora in laboratorio…', 'non lavora mai da solo', 'lavora meglio da solo', 'può lasciare il circuito acceso e uscire')],
      mix: ['domande', 'domande', 'domande', 'domande', 'domande', 'domande', 'domande', 'domande'] },
    Object.assign(T('u2t'), { num: 'dati1', bank: [Q('Il voltmetro si collega…', 'in parallelo', 'in serie', 'a circuito spento'), Q('L’amperometro si collega…', 'in serie, aprendo il circuito', 'in parallelo', 'ai capi del generatore'), Q('Si monta un circuito…', 'a generatore spento', 'a generatore acceso', 'con la rete a 230 V')], mix: ['simbolo', 'colori.valore', 'colori.bande', 'tolleranza.min', 'serieE.vicino', 'multimetro.collega', 'multimetro.portata', 'multimetro.leggi', 'domande', 'domande', 'colori.valore', 'domande'] }),
    ] },

  /* ========================= 3. Legge di Ohm ========================= */
  { id: 'u3', title: 'Legge di Ohm', cls: 3, say: 'Tensione, corrente e resistenza sono legate da una legge semplicissima, scoperta da Georg Simon Ohm. La userai per tutto il corso.',
    lessons: [
    { id: 'u3l1', title: 'La legge di Ohm', sub: 'V = R·I', intro: ['f.ohm'], num: 'dec1',
      teach: [
        { say: 'Raddoppia la tensione ai capi di un resistore: la corrente raddoppia. Tensione e corrente sono proporzionali, e il rapporto fra loro è la resistenza.', q: Q('Se la tensione ai capi di un resistore raddoppia, la corrente…', 'raddoppia', 'si dimezza', 'resta uguale') },
        { f: 'V = R * I', leg: [['V', 'tensione', 'V'], ['R', 'resistenza', 'Ω'], ['I', 'corrente', 'A']], q: { gen: 'ohm.V' } },
        { schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: 12 }], [{ id: 'R1', t: 'R', v: 1000 }]], top: [[]] }, opts: { currents: [{ el: 'R1', label: 'I' }], voltages: [{ el: 'R1', label: 'V' }] } }, p: 'Nello schema la freccia piena sul filo è la corrente, la freccia tratteggiata con il + è la tensione: con la convenzione degli utilizzatori la corrente entra nel resistore dal lato del +.', q: Q('Nello schema, come si riconosce la freccia della tensione?', 'è tratteggiata e ha il segno + vicino alla punta', 'è piena e sta sul filo', 'non c’è differenza') },
        { ex: 'ohm.V', q: Q('Con le unità del SI, se R è in kΩ e I in mA, la tensione viene in…', 'volt', 'kilovolt', 'millivolt') }],
      bank: [Q('Se la tensione ai capi di un resistore si dimezza, la corrente…', 'si dimezza', 'raddoppia', 'resta uguale'), Q('La legge di Ohm dice che…', 'tensione e corrente sono proporzionali', 'la corrente non dipende dalla tensione', 'la resistenza dipende dalla corrente')],
      mix: ['ohm.V', 'ohm.V', 's:ohm.V', 'domande', 'ohm.V', 'ohm.V', 's:ohm.V', 'ohm.V', 'domande'] },
    { id: 'u3l2', title: 'Formule inverse', sub: 'I = V/R, R = V/I · equazioni di primo grado', intro: ['m.eq1'], num: 'dec1',
      teach: [
        { math: true, p: 'Da $V = R * I$ si ricava una qualunque delle tre grandezze. Si trattano come un’**equazione di primo grado**: si dividono, o si moltiplicano, entrambi i membri per la stessa grandezza. Dividendo per $R$: $V/R = I$.', q: { gen: 'ohm.inversa' } },
        { f: 'I = V/R', leg: [['I', 'corrente', 'A'], ['V', 'tensione', 'V'], ['R', 'resistenza', 'Ω']], inv: ['V = R * I', 'R = V/I'], q: { gen: 'ohm.I' } },
        { ex: 'ohm.R', q: Q('Per controllare un risultato…', 'si guarda se l’ordine di grandezza è sensato e l’unità è giusta', 'si rifà il conto più in fretta', 'non serve') },
        { p: 'Il **metodo**: 1) scrivi i dati con le unità; 2) scrivi che cosa cerchi; 3) scegli la formula; 4) porta i prefissi nelle unità del SI (o usa kΩ con mA, che dà V); 5) calcola; 6) controlla unità e ordine di grandezza.', q: { gen: 'ohm.I' } }],
      mix: ['ohm.I', 'ohm.R', 'ohm.inversa', 'ohm.I', 'o:ohm.R', 'ohm.R', 's:ohm.I', 'ohm.inversa', 'ohm.V', 'ohm.R'] },
    { id: 'u3l3', title: 'Effetto Joule e potenza nominale', sub: 'P = R·I², P = V²/R, resistori da 1/4 W', intro: ['f.PRI2', 'f.PV2R', 'c.potenza-nominale'], num: 'dati1',
      teach: [
        { say: 'Un resistore percorso da corrente scalda: è l’effetto Joule. Il calore è energia elettrica trasformata.', q: Q('In che cosa trasforma l’energia un resistore?', 'in calore', 'in luce soltanto', 'in carica') },
        { f: 'P = R * I^2', leg: [['P', 'potenza', 'W'], ['R', 'resistenza', 'Ω'], ['I', 'corrente', 'A']], inv: ['P = V^2/R', 'I = sqrt(P/R)'], q: { gen: 'joule.P' } },
        { p: 'Queste formule vengono da $P = V * I$ con la legge di Ohm: sostituendo $V = R * I$ si ottiene $P = R * I^2$; sostituendo $I = V/R$ si ottiene $P = V^2/R$.', q: Q('Se la corrente in un resistore raddoppia, la potenza…', 'diventa quattro volte', 'raddoppia', 'resta uguale') },
        { p: 'Ogni resistore ha una **potenza nominale**: quella che può dissipare senza danneggiarsi. I più comuni sono da **1/4 W** (0,25 W); poi 1/2 W, 1 W, 2 W. Si sceglie un resistore con potenza nominale almeno uguale a quella che dissipa, meglio con un po’ di margine.', q: { gen: 'joule.nominale' } }],
      mix: ['joule.P', 'joule.P', 'joule.Imax', 'joule.nominale', 's:joule.P', 'joule.P', 'joule.nominale', 'joule.Imax', 'ohm.I', 'joule.P'] },
    { id: 'u3l4', title: 'Resistività e caratteristica V–I', sub: 'R = ρ·l/S, grafico tensione–corrente', intro: ['q.rho', 'f.rho'], num: 'dati1',
      teach: [
        { p: 'La resistenza di un filo dipende dal **materiale**, dalla **lunghezza** $l$ e dalla **sezione** $S$: un filo lungo resiste di più, un filo grosso di meno. Il materiale è descritto dalla **resistività** $rho$.', q: Q('Raddoppiando la lunghezza di un filo, la sua resistenza…', 'raddoppia', 'si dimezza', 'resta uguale') },
        { f: 'R = rho * l/S', leg: [['R', 'resistenza', 'Ω'], ['rho', 'resistività', 'Ω·mm²/m'], ['l', 'lunghezza', 'm'], ['S', 'sezione', 'mm²']], q: { gen: 'resistivita.R' } },
        { p: 'I buoni **conduttori** (argento, rame, alluminio) hanno resistività piccolissime; gli **isolanti** (plastica, vetro, ceramica) altissime. Nei cavi elettrici si usa il rame, con $rho = \`0,0175 Ω·mm²/m\`$.', q: Q('Quale materiale è un buon conduttore?', 'rame', 'vetro', 'plastica') },
        { p: 'La **caratteristica tensione–corrente** di un resistore è una retta che passa per l’origine: il rapporto $V/I$ è sempre lo stesso, ed è la resistenza.', q: { gen: 'ohm.grafico' } }],
      mix: ['resistivita.R', 'resistivita.R', 'ohm.grafico', 's:resistivita.R', 'ohm.grafico', 'resistivita.R', 'ohm.I', 'ohm.grafico', 'ohm.R'] },
    Object.assign(T('u3t'), { num: 'dati1', mix: ['ohm.V', 'ohm.I', 'ohm.R', 'ohm.inversa', 'joule.P', 'joule.Imax', 'joule.nominale', 'resistivita.R', 'ohm.grafico', 'ohm.I', 'joule.P', 'ohm.R'] }),
    ] },

  /* ========================= 4. Serie e parallelo ========================= */
  { id: 'u4', title: 'Resistori in serie e in parallelo', cls: 3, say: 'Quasi mai un circuito ha un solo resistore. Impariamo a riconoscere quando sono in serie e quando in parallelo, e a sostituirli con un resistore equivalente.',
    lessons: [
    { id: 'u4l1', title: 'Resistori in serie', sub: 'stessa corrente, R_eq = R₁ + R₂ + …', intro: ['f.serie'], num: 'free',
      teach: [
        { p: 'Due resistori sono **in serie** quando sono attraversati dalla **stessa corrente**, uno dopo l’altro, senza nodi in mezzo da cui la corrente possa andare altrove. Le tensioni ai loro capi si sommano.', schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: 12 }], [{ id: 'R2', t: 'R', v: 470 }]], top: [[{ id: 'R1', t: 'R', v: 330 }]] }, opts: { currents: [{ el: 'R1', label: 'I' }] } }, q: Q('Nello schema, R₁ e R₂ come sono collegati?', 'in serie: li attraversa la stessa corrente', 'in parallelo', 'né in serie né in parallelo') },
        { f: 'R_{eq} = R_1 + R_2 + R_3', leg: [['R_{eq}', 'resistenza equivalente', 'Ω'], ['R_1, R_2, R_3', 'resistenze in serie', 'Ω']], q: { gen: 'serie.Req' } },
        { ex: 'serie.IV', q: Q('In una serie, ai capi del resistore più grande c’è…', 'la tensione più grande', 'la tensione più piccola', 'la stessa tensione degli altri') }],
      mix: ['serie.Req', 'serie.Req', 'serie.IV', 's:serie.Req', 'serie.IV', 'o:serie.IV', 'serie.Req', 'serie.IV', 's:serie.IV', 'serie.Req'] },
    { id: 'u4l2', title: 'Resistori in parallelo', sub: 'stessa tensione, si sommano i reciproci', intro: ['f.par'], num: 'free',
      teach: [
        { p: 'Due resistori sono **in parallelo** quando sono collegati **fra gli stessi due nodi**: hanno la **stessa tensione**. La corrente del generatore si divide fra i rami.', schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: 12 }], [{ id: 'R1', t: 'R', v: 1000 }], [{ id: 'R2', t: 'R', v: 2200 }]], top: [[], []] }, opts: { currents: [{ el: 'R1', label: 'I_1' }, { el: 'R2', label: 'I_2' }] } }, q: Q('Due resistori in parallelo hanno sempre…', 'la stessa tensione', 'la stessa corrente', 'la stessa resistenza') },
        { f: '1/R_{eq} = 1/R_1 + 1/R_2', leg: [['R_{eq}', 'resistenza equivalente', 'Ω']], inv: ['R_{eq} = {R_1 * R_2}/{R_1 + R_2}', 'R_{eq} = R/n'], q: { gen: 'parallelo.Req' } },
        { p: 'Per due resistori si usa il «prodotto diviso la somma»; per $n$ resistori uguali $R_{eq} = R/n$. Il parallelo è sempre **più piccolo del resistore più piccolo**: aggiungere un ramo apre una strada in più alla corrente.', q: Q('Il parallelo di 1 kΩ e 1 MΩ vale circa…', '1 kΩ (un po’ meno)', '1 MΩ', '500 kΩ') },
        { ex: 'parallelo.I', q: Q('In un parallelo passa più corrente…', 'nel ramo con la resistenza più piccola', 'nel ramo con la resistenza più grande', 'in tutti i rami uguale') }],
      mix: ['parallelo.Req', 'parallelo.Req', 'parallelo.I', 's:parallelo.Req', 'parallelo.I', 'parallelo.Req', 's:parallelo.I', 'parallelo.Req', 'serie.Req', 'parallelo.I'] },
    { id: 'u4l3', title: 'Reti miste: leggere lo schema', sub: 'riduzione passo per passo', intro: ['k.riduzione'], num: 'free',
      teach: [
        { say: 'In una rete mista si riconoscono, uno alla volta, i gruppi in serie e in parallelo. Si parte dal punto più lontano dal generatore e si torna indietro.', q: Q('Da dove conviene cominciare a ridurre una rete?', 'dal punto più lontano dal generatore', 'dal generatore', 'da un punto a caso') },
        { schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: 12 }], [{ id: 'R2', t: 'R', v: 200 }], [{ id: 'R3', t: 'R', v: 300 }]], top: [[{ id: 'R1', t: 'R', v: 100 }], []], names: { T1: 'A' } } }, p: 'Qui $R_2$ e $R_3$ sono fra gli stessi due nodi (A e la massa): sono in parallelo. Il loro equivalente $R_{23}$ è in serie con $R_1$.', q: { gen: 'schema.serieparallelo' } },
        { ex: 'mista.Req', q: Q('Il resistore equivalente di tutta la rete…', 'fa assorbire al generatore la stessa corrente della rete vera', 'è sempre la somma di tutti i resistori', 'è il resistore più grande') }],
      mix: ['schema.serieparallelo', 'mista.Req', 'mista.Req', 'schema.serieparallelo', 's:mista.Req', 'mista.Req', 'o:mista.Req', 'schema.serieparallelo', 'mista.Req'] },
    { id: 'u4l4', title: 'Correnti e tensioni nei rami', sub: 'dal resistore equivalente al circuito vero', intro: ['k.ritorno'], num: 'free',
      teach: [
        { p: 'Trovata $R_{eq}$, la corrente del generatore è $I = V/R_{eq}$. Poi si torna indietro: nei gruppi in **serie** la corrente è la stessa e si calcolano le tensioni ($V = R * I$); nei gruppi in **parallelo** la tensione è la stessa e si calcolano le correnti ($I = V/R$).', q: Q('Tornando indietro, in un gruppo in parallelo che cosa è uguale per tutti i rami?', 'la tensione', 'la corrente', 'la potenza') },
        { ex: 'mista.ramo', q: Q('Controllo finale: le correnti dei rami di un parallelo sommate danno…', 'la corrente che entra nel parallelo', 'zero', 'la tensione del generatore') }],
      mix: ['mista.ramo', 'mista.ramo', 'o:mista.ramo', 'mista.ramo', 's:mista.ramo', 'mista.Req', 'mista.ramo', 'o:mista.ramo', 'mista.ramo'] },
    Object.assign(T('u4t'), { mix: ['serie.Req', 'serie.IV', 'parallelo.Req', 'parallelo.I', 'schema.serieparallelo', 'mista.Req', 'mista.ramo', 'parallelo.Req', 'serie.IV', 'mista.ramo', 'mista.Req', 'schema.serieparallelo'] }),
    ] },

  /* ========================= 5. Partitori ========================= */
  { id: 'u5', title: 'Partitori di tensione e di corrente', cls: 3, say: 'Il partitore è una delle idee più utili dell’elettronica: con due resistori si ottiene una frazione della tensione. Lo ritroverai nei sensori, nei transistor, ovunque.',
    lessons: [
    { id: 'u5l1', title: 'Partitore di tensione', sub: 'V₂ = V·R₂/(R₁ + R₂)', intro: ['f.part'], num: 'free',
      teach: [
        { p: 'Due resistori in serie si dividono la tensione del generatore **in proporzione alle loro resistenze**: sul resistore più grande cade la tensione più grande.', schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: 12 }], [{ id: 'R2', t: 'R', v: 2000 }]], top: [[{ id: 'R1', t: 'R', v: 1000 }]] }, opts: { voltages: [{ el: 'R2', label: 'V_2' }] } }, q: Q('Con R₁ = 1 kΩ e R₂ = 2 kΩ, su quale resistore cade più tensione?', 'su R₂', 'su R₁', 'su entrambi uguale') },
        { f: 'V_2 = V * R_2/{R_1 + R_2}', leg: [['V_2', 'tensione su R₂', 'V'], ['V', 'tensione totale', 'V']], q: { gen: 'partitore.V2' } },
        { p: 'Attenzione al numeratore: c’è la resistenza **su cui cerchi la tensione**. Il controllo è facile: la tensione su $R_2$ deve stare fra 0 e $V$, e $V_1 + V_2 = V$.', q: Q('V₁ + V₂ in un partitore vale…', 'V, la tensione del generatore', 'zero', 'il doppio di V') }],
      mix: ['partitore.V2', 'partitore.V2', 's:partitore.V2', 'partitore.V2', 'serie.IV', 'partitore.V2', 's:partitore.V2', 'partitore.V2', 'serie.Req'] },
    { id: 'u5l2', title: 'Partitore con carico', sub: 'il carico abbassa la tensione', intro: ['k.carico'], num: 'free',
      teach: [
        { p: 'Se colleghi un **carico** $R_L$ all’uscita del partitore, il carico va in **parallelo a $R_2$**: la resistenza in basso diventa $R_2$ parallelo $R_L$, più piccola, e la tensione d’uscita scende.', schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: 12 }], [{ id: 'R2', t: 'R', v: 1000 }], [{ id: 'RL', t: 'R', v: 1000 }]], top: [[{ id: 'R1', t: 'R', v: 1000 }], []] }, opts: { voltages: [{ el: 'RL', label: 'V_L' }] } }, q: Q('Collegando un carico all’uscita, la tensione del partitore…', 'scende', 'sale', 'resta uguale') },
        { ex: 'partitore.carico', q: Q('Perché il carico conti poco, deve essere…', 'molto più grande di R₂', 'molto più piccolo di R₂', 'uguale a R₁') }],
      mix: ['partitore.carico', 'partitore.carico', 'o:partitore.carico', 's:partitore.carico', 'partitore.V2', 'partitore.carico', 'partitore.carico', 's:partitore.carico', 'partitore.V2'] },
    { id: 'u5l3', title: 'Partitore di corrente', sub: 'I₁ = I·R₂/(R₁ + R₂)', intro: ['f.partI'], num: 'free',
      teach: [
        { p: 'Una corrente che si divide fra due resistori in parallelo va di più dove trova **meno resistenza**. Nella formula, al numeratore c’è la resistenza **dell’altro ramo**.', schema: { ladder: { cols: [[{ id: 'I1', t: 'I', v: 0.03 }], [{ id: 'R1', t: 'R', v: 1000 }], [{ id: 'R2', t: 'R', v: 2000 }]], top: [[], []] }, opts: { currents: [{ el: 'R1', label: 'I_1' }, { el: 'R2', label: 'I_2' }] } }, q: Q('In quale ramo passa più corrente, con R₁ = 1 kΩ e R₂ = 2 kΩ?', 'in R₁', 'in R₂', 'uguale') },
        { f: 'I_1 = I * R_2/{R_1 + R_2}', leg: [['I_1', 'corrente in R₁', 'A'], ['I', 'corrente totale', 'A']], q: { gen: 'partitore.corrente' } },
        { ex: 'partitore.corrente', q: Q('I₁ + I₂ in un partitore di corrente vale…', 'la corrente totale I', 'zero', 'I/2') }],
      mix: ['partitore.corrente', 'partitore.corrente', 's:partitore.corrente', 'partitore.corrente', 'parallelo.I', 'partitore.corrente', 's:partitore.corrente', 'partitore.corrente', 'parallelo.I'] },
    { id: 'u5l4', title: 'Il potenziometro', sub: 'un partitore regolabile', intro: ['c.pot'], num: 'free',
      teach: [
        { p: 'Il **potenziometro** è un resistore con un terzo terminale, il **cursore**, che scorre sulla pista. Collegato fra il generatore e la massa, è un partitore regolabile: la parte di pista fra cursore e massa fa da $R_2$.', q: Q('A che cosa serve il cursore del potenziometro?', 'a scegliere che frazione della tensione prendere', 'a cambiare la tensione del generatore', 'a misurare la corrente') },
        { ex: 'potenziometro.V', q: Q('Con il cursore a metà corsa, la tensione d’uscita è…', 'metà della tensione applicata', 'zero', 'tutta la tensione') },
        { p: 'Nel simbolo CEI il resistore variabile ha una freccia obliqua sul rettangolo; nel potenziometro la freccia del cursore tocca il rettangolo dal lato.', q: { gen: 'simbolo' } }],
      mix: ['potenziometro.V', 'potenziometro.V', 's:potenziometro.V', 'partitore.V2', 'potenziometro.V', 'simbolo', 'potenziometro.V', 'partitore.carico', 's:potenziometro.V'] },
    Object.assign(T('u5t'), { mix: ['partitore.V2', 'partitore.carico', 'partitore.corrente', 'potenziometro.V', 'partitore.V2', 'partitore.carico', 'partitore.corrente', 'mista.Req', 'potenziometro.V', 'partitore.V2'] }),
    ] },

  /* ========================= 6. Kirchhoff ========================= */
  { id: 'u6', title: 'Principi di Kirchhoff', cls: 3, say: 'Quando una rete non si riduce in serie e parallelo, ci sono due principi che valgono sempre: uno per i nodi e uno per le maglie. Li ha scritti Gustav Kirchhoff nel 1845.',
    lessons: [
    { id: 'u6l1', title: 'Nodi, rami, maglie e potenziali', sub: 'la massa come riferimento', intro: ['kir.nodo', 'kir.ramo', 'kir.maglia', 'c.massa', 'q.potenziale'], num: 'free',
      teach: [
        { p: 'Un **nodo** è un punto in cui si incontrano **almeno tre** conduttori (negli schemi ha il pallino). Un **ramo** è un tratto fra due nodi. Una **maglia** è un percorso chiuso. In una rete: maglie indipendenti = rami − nodi + 1.', q: { gen: 'schema.nodi' } },
        { p: 'Si sceglie un punto di riferimento, la **massa** (simbolo con le tre lineette), e gli si dà 0 V. Il **potenziale** di un punto è la sua tensione rispetto alla massa. La tensione fra due punti è la differenza dei potenziali: $V_{AB} = V_A - V_B$.', q: { gen: 'potenziale.VAB' } }],
      bank: [Q('Un punto in cui si incontrano solo due fili è…', 'un punto qualunque, non un nodo', 'un nodo', 'una maglia'), Q('Il potenziale della massa vale…', '0 V per definizione', '12 V', 'dipende dal generatore')],
      mix: ['schema.nodi', 'potenziale.VAB', 'schema.nodi', 'potenziale.VAB', 'domande', 'schema.nodi', 'potenziale.VAB', 'schema.nodi', 'domande'] },
    { id: 'u6l2', title: 'Primo principio di Kirchhoff', sub: 'correnti entranti = correnti uscenti', intro: ['f.kcl'], num: 'free',
      teach: [
        { p: 'La carica non si crea e non si distrugge: in un nodo **la somma delle correnti che entrano è uguale alla somma delle correnti che escono**.', q: { gen: 'kcl.I' } },
        { f: 'I_1 + I_2 = I_3 + I_4', leg: [['I_1, I_2', 'correnti entranti', 'A'], ['I_3, I_4', 'correnti uscenti', 'A']], q: { gen: 'kcl.I' } },
        { p: 'Il **verso** di una corrente incognita si sceglie a piacere. Se il calcolo dà un numero **negativo**, la corrente va nel verso opposto a quello disegnato: si lascia il segno meno, non si cambia il disegno.', q: Q('Il calcolo dà I = −3 mA. Che cosa vuol dire?', 'la corrente vale 3 mA nel verso opposto a quello disegnato', 'c’è un errore', 'la corrente non esiste') }],
      bank: [Q('Il primo principio di Kirchhoff deriva…', 'dalla conservazione della carica', 'dalla legge di Ohm', 'dalla conservazione dell’energia')],
      mix: ['kcl.I', 'kcl.I', 's:kcl.I', 'kcl.I', 'domande', 'kcl.I', 's:kcl.I', 'kcl.I', 'kcl.I'] },
    { id: 'u6l3', title: 'Secondo principio di Kirchhoff', sub: 'la somma delle tensioni di una maglia è zero', intro: ['f.kvl'], num: 'free',
      teach: [
        { p: 'Percorrendo una maglia e tornando al punto di partenza si torna allo stesso potenziale: **la somma algebrica delle tensioni lungo una maglia è zero**. Si sceglie un verso di percorrenza: le tensioni con la freccia **concorde** si prendono con il +, le altre con il −.', q: { gen: 'kvl.V' } },
        { ex: 'kvl.V', q: Q('Il secondo principio deriva…', 'dalla conservazione dell’energia', 'dalla conservazione della carica', 'dal codice colori') }],
      bank: [Q('Lungo una maglia la somma algebrica delle tensioni è…', 'zero', 'uguale alla tensione del generatore più grande', 'uguale alla corrente')],
      mix: ['kvl.V', 'kvl.V', 's:kvl.V', 'kvl.V', 'domande', 'kvl.V', 'kcl.I', 's:kvl.V', 'kvl.V'] },
    { id: 'u6l4', title: 'Reti con due maglie', sub: 'correnti di maglia, sistemi di due equazioni', intro: ['m.sist2'], num: 'free',
      teach: [
        { math: true, p: 'Un **sistema di due equazioni** in due incognite si risolve per sostituzione o con la **regola di Cramer**: con $a * x + b * y = e$ e $c * x + d * y = f$, il determinante è $Delta = a * d - b * c$ e $x = {e * d - b * f}/Delta$, $y = {a * f - e * c}/Delta$.', q: Q('Nel sistema x + y = 5, x − y = 1, quanto vale x?', '3', '2', '5') },
        { p: '**Metodo delle correnti di maglia**: si assegna a ogni maglia una corrente (per esempio in verso orario) e si scrive il secondo principio per ognuna. In un ramo in comune a due maglie la corrente vera è la differenza delle due correnti di maglia.', schema: { ladder: { cols: [[{ id: 'E1', t: 'V', v: 12 }, { id: 'R1', t: 'R', v: 100 }], [{ id: 'R3', t: 'R', v: 200 }], [{ id: 'E2', t: 'V', v: 6 }, { id: 'R2', t: 'R', v: 300 }]], top: [[], []], names: { T1: 'A' } } }, q: Q('Nel ramo comune a due maglie, la corrente è…', 'la differenza delle due correnti di maglia', 'la somma delle due correnti', 'zero') },
        { ex: 'maglie.due', q: Q('Quante equazioni servono con il metodo delle maglie, in una rete con due maglie?', 'due', 'tre', 'una') }],
      mix: ['maglie.due', 'o:maglie.due', 'maglie.due', 's:maglie.due', 'kvl.V', 'maglie.due', 'kcl.I', 'o:maglie.due', 'maglie.due'] },
    { id: 'u6l5', title: 'Trova il guasto', sub: 'misure ai nodi, componenti interrotti o in corto', intro: ['k.guasto'], num: 'free',
      teach: [
        { say: 'Un tecnico non vede dentro i componenti, ma misura le tensioni ai nodi e le confronta con quelle attese. È un lavoro da investigatore.', q: Q('Per cercare un guasto, che cosa si misura per primo?', 'le tensioni dei nodi rispetto alla massa', 'il colore dei resistori', 'la temperatura della stanza') },
        { p: 'Un componente **interrotto** (aperto) blocca la corrente nel suo ramo: ai capi di un resistore interrotto può comparire tutta la tensione, e dopo di lui i potenziali scendono a zero. Un componente **in corto** rende uguali i potenziali dei suoi due capi.', q: Q('Ai capi di un resistore in corto la tensione è…', 'zero', 'quella del generatore', 'il doppio del normale') },
        { ex: 'guasto', q: Q('Se V_A = V_B e fra A e B c’è un resistore percorso da corrente in condizioni normali, quel resistore…', 'potrebbe essere in corto', 'è sicuramente interrotto', 'funziona benissimo') }],
      mix: ['guasto', 'guasto', 'potenziale.VAB', 'guasto', 'guasto', 'schema.nodi', 'guasto', 'guasto'] },
    Object.assign(T('u6t'), { mix: ['schema.nodi', 'potenziale.VAB', 'kcl.I', 'kvl.V', 'maglie.due', 'guasto', 'kcl.I', 'kvl.V', 'guasto', 'potenziale.VAB', 'maglie.due'] }),
    ] },

  /* ========================= 7. Metodi di analisi ========================= */
  { id: 'u7', title: 'Metodi di analisi delle reti', cls: 3, say: 'Con i principi di Kirchhoff si risolve tutto, ma a volte con molta fatica. Ecco i metodi che accorciano la strada: sovrapposizione, Thevenin, Norton, Millman.',
    lessons: [
    { id: 'u7l1', title: 'Sovrapposizione degli effetti', sub: 'un generatore alla volta', intro: ['f.sovr'], num: 'free',
      teach: [
        { p: 'In una rete **lineare** (resistori e generatori) ogni corrente è la **somma** delle correnti che darebbe ciascun generatore da solo. Per lasciare un generatore da solo si **spengono** gli altri: un generatore di tensione spento diventa un **corto circuito**, uno di corrente un **circuito aperto**.', q: Q('Spegnere un generatore di tensione vuol dire…', 'sostituirlo con un corto circuito', 'sostituirlo con un circuito aperto', 'toglierlo e lasciare i fili staccati') },
        { ex: 'sovrapposizione.I', q: Q('Con la sovrapposizione, le correnti dovute ai singoli generatori…', 'si sommano tenendo conto del loro verso', 'si sommano sempre come numeri positivi', 'si moltiplicano') }],
      mix: ['sovrapposizione.I', 'o:sovrapposizione.I', 'sovrapposizione.I', 's:sovrapposizione.I', 'sovrapposizione.I', 'maglie.due', 'o:sovrapposizione.I', 'sovrapposizione.I'] },
    { id: 'u7l2', title: 'Teorema di Thevenin', sub: 'V_th e R_th visti da due morsetti', intro: ['f.th'], num: 'free',
      teach: [
        { p: 'Qualunque rete lineare, vista da due morsetti A e B, si comporta come **un generatore $V_{th}$ in serie a una resistenza $R_{th}$**. $V_{th}$ è la tensione fra A e B **a vuoto** (morsetti aperti); $R_{th}$ è la resistenza vista da A e B **con i generatori spenti**.', schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: 12 }], [{ id: 'R2', t: 'R', v: 2000 }], [{ id: 'AB', t: 'OPEN' }]], top: [[{ id: 'R1', t: 'R', v: 1000 }], [{ id: 'R3', t: 'R', v: 470 }]] } }, q: Q('Come si calcola R_th?', 'spegnendo i generatori e guardando la rete dai morsetti', 'con i generatori accesi', 'misurando la corrente di corto') },
        { ex: 'thevenin.Rth', q: Q('A vuoto, in R₃ (in serie al morsetto A) passa corrente?', 'no: con i morsetti aperti non passa corrente in R₃', 'sì, la corrente massima', 'dipende da R₃') },
        { ex: 'thevenin.IL', q: Q('Con l’equivalente di Thevenin, la corrente in un carico R_L è…', 'V_th/(R_th + R_L)', 'V_th/R_L', 'V_th · R_L') }],
      mix: ['thevenin.Vth', 'thevenin.Rth', 'thevenin.IL', 's:thevenin.Rth', 'thevenin.Vth', 'o:thevenin.IL', 'thevenin.Rth', 'thevenin.IL', 's:thevenin.Vth', 'thevenin.Rth'] },
    { id: 'u7l3', title: 'Teorema di Norton', sub: 'I_N e R_th, conversione', intro: ['f.no'], num: 'free',
      teach: [
        { p: 'La stessa rete equivale anche a un **generatore di corrente $I_N$ in parallelo a $R_{th}$**. $I_N$ è la corrente che passerebbe in un corto circuito fra A e B: $I_N = V_{th}/R_{th}$. Si passa da Thevenin a Norton e ritorno con questa formula.', q: { gen: 'norton.IN' } },
        { ex: 'norton.IN', q: Q('Da Norton a Thevenin: V_th vale…', 'I_N · R_th', 'I_N / R_th', 'I_N + R_th') }],
      bank: [Q('Il generatore di Norton è…', 'un generatore di corrente in parallelo a R_th', 'un generatore di tensione in serie a R_th', 'un corto circuito'), Q('R_th e R_N…', 'sono la stessa resistenza', 'sono una il doppio dell’altra', 'non hanno relazione')],
      mix: ['norton.IN', 'norton.IN', 'domande', 's:norton.IN', 'thevenin.Rth', 'norton.IN', 'domande', 'thevenin.Vth', 'norton.IN'] },
    { id: 'u7l4', title: 'Teorema di Millman', sub: 'rami in parallelo fra due nodi', intro: ['f.mil'], num: 'free',
      teach: [
        { p: 'Quando tutti i rami (generatori con la loro resistenza, o solo resistori) sono **fra gli stessi due nodi**, la tensione fra i nodi è la media dei generatori «pesata» con le conduttanze.', schema: { ladder: { cols: [[{ id: 'E1', t: 'V', v: 12 }, { id: 'R1', t: 'R', v: 100 }], [{ id: 'R2', t: 'R', v: 200 }], [{ id: 'E3', t: 'V', v: 6 }, { id: 'R3', t: 'R', v: 300 }]], top: [[], []], names: { T0: 'A' } } }, q: Q('Il teorema di Millman si usa quando…', 'tutti i rami sono fra gli stessi due nodi', 'c’è un solo generatore', 'i resistori sono tutti uguali') },
        { f: 'V_{AB} = {E_1/R_1 + E_2/R_2 + E_3/R_3}/{1/R_1 + 1/R_2 + 1/R_3}', leg: [['V_{AB}', 'tensione fra i due nodi', 'V'], ['E_k', 'generatore del ramo k (0 se non c’è), con il segno', 'V']], q: { gen: 'millman.VAB' } },
        { ex: 'millman.VAB', q: Q('Un generatore con il + verso il nodo B entra nella formula…', 'con il segno meno', 'con il segno più', 'non entra') }],
      mix: ['millman.VAB', 'millman.VAB', 's:millman.VAB', 'millman.VAB', 'sovrapposizione.I', 'millman.VAB', 's:millman.VAB', 'millman.VAB'] },
    { id: 'u7l5', title: 'Massimo trasferimento di potenza', sub: 'R_L = R_th', intro: ['f.pmax'], num: 'free',
      teach: [
        { p: 'Un generatore con resistenza interna $R_{th}$ cede la **massima potenza** a un carico quando $R_L = R_{th}$. In quel caso sul carico c’è metà di $V_{th}$ e il rendimento è del 50 %: metà della potenza si perde dentro il generatore.', q: Q('Quando un carico riceve la potenza massima?', 'quando R_L = R_th', 'quando R_L è molto grande', 'quando R_L = 0') },
        { f: 'P_{max} = V_{th}^2/{4 * R_{th}}', leg: [['P_{max}', 'potenza massima sul carico', 'W']], q: { gen: 'pmax' } }],
      bank: [Q('Con R_L = R_th il rendimento è…', '50 %', '100 %', '25 %'), Q('Gli amplificatori audio e le antenne lavorano spesso in condizioni di…', 'adattamento: R_L = R_th', 'corto circuito', 'circuito aperto')],
      mix: ['pmax', 'pmax', 'domande', 's:pmax', 'thevenin.Rth', 'pmax', 'domande', 'thevenin.Vth', 'pmax'] },
    Object.assign(T('u7t'), { mix: ['sovrapposizione.I', 'thevenin.Vth', 'thevenin.Rth', 'thevenin.IL', 'norton.IN', 'millman.VAB', 'pmax', 'thevenin.Rth', 'sovrapposizione.I', 'millman.VAB', 'thevenin.IL'] }),
    ] },

  /* ========================= 8. Condensatori e induttori ========================= */
  { id: 'u8', title: 'Condensatori e induttori', cls: 3, say: 'Due componenti nuovi, che immagazzinano energia: il condensatore in un campo elettrico, l’induttore in un campo magnetico. Da qui usiamo tutti i prefissi: µF, nF, pF.',
    lessons: [
    { id: 'u8l1', title: 'Il condensatore', sub: 'capacità, Q = C·V, codici', intro: ['c.C', 'q.C', 'f.QCV', 'c.codiceC'], num: 'free', prefixes: ['p', 'n', 'µ', 'm', '', 'k', 'M'],
      teach: [
        { p: 'Il **condensatore** è fatto di due armature conduttrici separate da un isolante (il dielettrico). Collegato a un generatore si carica: le armature accumulano cariche uguali e opposte. Il simbolo CEI sono due lamine parallele; quello **elettrolitico** ha la polarità, con il +.', q: { gen: 'simbolo' } },
        { f: 'Q = C * V', leg: [['Q', 'carica', 'C'], ['C', 'capacità', 'F'], ['V', 'tensione', 'V']], inv: ['C = Q/V', 'V = Q/C'], q: { gen: 'cond.Q' } },
        { p: 'Il farad è enorme: le capacità comuni sono in **µF** (microfarad), **nF** e **pF**. Sui condensatori piccoli il valore è scritto in **codice**: tre cifre, le prime due del valore e la terza il numero di zeri, in picofarad: **104** = 10·10⁴ pF = 100 nF. Ogni condensatore ha anche una **tensione massima** di lavoro da non superare.', q: { gen: 'cond.codice' } }],
      bank: [Q('Un elettrolitico montato al contrario…', 'si può danneggiare: ha una polarità', 'funziona lo stesso', 'diventa un resistore')],
      mix: ['cond.Q', 'cond.codice', 'cond.Q', 's:cond.Q', 'cond.codice', 'simbolo', 'cond.Q', 'domande', 'cond.codice'] },
    { id: 'u8l2', title: 'Condensatori in serie e in parallelo', sub: 'le regole al contrario dei resistori', intro: ['f.Cpar', 'f.Cser'], num: 'free', prefixes: ['p', 'n', 'µ', 'm', '', 'k', 'M'],
      teach: [
        { p: 'Per i condensatori le regole sono **rovesciate** rispetto ai resistori: in **parallelo** le capacità si **sommano** (è come allargare le armature); in **serie** si sommano i **reciproci**.', q: { gen: 'cond.serieparallelo' } },
        { f: 'C_{eq} = C_1 + C_2', leg: [['C_{eq}', 'capacità equivalente in parallelo', 'F']], inv: ['C_{eq} = {C_1 * C_2}/{C_1 + C_2}'], q: { gen: 'cond.serieparallelo' } }],
      mix: ['cond.serieparallelo', 'cond.serieparallelo', 's:cond.serieparallelo', 'cond.serieparallelo', 'cond.Q', 'cond.serieparallelo', 's:cond.serieparallelo', 'cond.serieparallelo'] },
    { id: 'u8l3', title: 'Energia nel condensatore', sub: 'W = ½·C·V²', intro: ['f.WC'], num: 'free', prefixes: ['p', 'n', 'µ', 'm', '', 'k', 'M'],
      teach: [
        { f: 'W = 1/2 * C * V^2', leg: [['W', 'energia', 'J'], ['C', 'capacità', 'F'], ['V', 'tensione', 'V']], q: { gen: 'cond.energia' } },
        { warn: 'Un condensatore grande e carico può dare una scossa o una scintilla anche a circuito spento: prima di toccarlo si scarica attraverso un resistore.', q: Q('Un condensatore elettrolitico da 470 µF, caricato, a circuito spento…', 'può restare carico: va scaricato con un resistore', 'si scarica sempre da solo all’istante', 'non è mai pericoloso') }],
      mix: ['cond.energia', 'cond.energia', 's:cond.energia', 'cond.Q', 'cond.energia', 'cond.serieparallelo', 'cond.energia', 's:cond.energia'] },
    { id: 'u8l4', title: 'L’induttore', sub: 'induttanza, v = L·ΔI/Δt, energia', intro: ['c.L', 'q.L', 'f.vL', 'f.WL'], num: 'free', prefixes: ['p', 'n', 'µ', 'm', '', 'k', 'M'],
      teach: [
        { p: 'L’**induttore** è una bobina di filo, a volte su un nucleo di ferrite. Si **oppone alle variazioni della corrente**: quando la corrente cambia, ai suoi capi nasce una tensione proporzionale alla rapidità del cambiamento. Il simbolo CEI è una serie di archi. L’induttanza si misura in **henry** (H).', q: { gen: 'simbolo' } },
        { f: 'v_L = L * {Delta I}/{Delta t}', leg: [['v_L', 'tensione sull’induttore', 'V'], ['L', 'induttanza', 'H'], ['Delta I', 'variazione della corrente', 'A'], ['Delta t', 'tempo della variazione', 's']], q: { gen: 'ind.vL' } },
        { f: 'W = 1/2 * L * I^2', leg: [['W', 'energia', 'J'], ['I', 'corrente', 'A']], q: { gen: 'ind.energia' } },
        { p: 'Gli induttori in **serie** e in **parallelo** si combinano **come i resistori**. In continua, a regime, un induttore ideale è un **corto circuito**; un condensatore ideale un **circuito aperto**.', q: Q('In continua, a regime, un condensatore è…', 'un circuito aperto', 'un corto circuito', 'un generatore') }],
      mix: ['ind.vL', 'ind.energia', 'ind.vL', 's:ind.vL', 'simbolo', 'ind.energia', 'cond.energia', 'ind.vL', 's:ind.energia'] },
    Object.assign(T('u8t'), { mix: ['cond.Q', 'cond.codice', 'cond.serieparallelo', 'cond.energia', 'ind.vL', 'ind.energia', 'cond.Q', 'cond.serieparallelo', 'ind.vL', 'cond.energia'] }),
    ] },

  /* ========================= 9. Transitori ========================= */
  { id: 'u9', title: 'Transitori RC e RL', cls: 3, say: 'Un condensatore non si carica in un istante: la tensione sale piano, prima veloce e poi sempre più lenta. Il ritmo lo decide la costante di tempo τ.',
    lessons: [
    { id: 'u9l1', title: 'Costante di tempo', sub: 'τ = R·C, τ = L/R, regola delle 5τ', intro: ['q.tau', 'f.tau', 'f.5tau'], num: 'free', prefixes: ['p', 'n', 'µ', 'm', '', 'k', 'M'],
      teach: [
        { f: 'tau = R * C', leg: [['tau', 'costante di tempo', 's'], ['R', 'resistenza', 'Ω'], ['C', 'capacità', 'F']], inv: ['tau = L/R'], q: { gen: 'tau.RC' } },
        { table: 'tau', p: 'Dopo un tempo $tau$ il condensatore ha compiuto il 63 % della variazione, dopo $5 * tau$ il 99 %: in pratica il transitorio è finito.', q: { gen: 'tau.cinque' } }],
      mix: ['tau.RC', 'tau.RC', 'tau.cinque', 's:tau.RC', 'tau.cinque', 'tau.RC', 's:tau.cinque', 'tau.RC'] },
    { id: 'u9l2', title: 'La carica del condensatore', sub: 'v_C = E·(1 − e^(−t/τ))', intro: ['m.exp', 'f.carica'], num: 'free', prefixes: ['p', 'n', 'µ', 'm', '', 'k', 'M'],
      teach: [
        { math: true, p: 'La **funzione esponenziale** $e^{-x}$ vale 1 per $x = 0$ e scende verso zero senza mai arrivarci: ogni volta che $x$ cresce di 1 il valore si riduce a poco più di un terzo. Sulla calcolatrice si usa il tasto $e^x$ con il numero negativo.', q: Q('Come si comporta e⁻ˣ quando x cresce?', 'scende verso zero', 'cresce sempre', 'resta uguale a 1') },
        { f: 'v_C(t) = E * (1 - e^{-t/tau})', leg: [['v_C', 'tensione sul condensatore', 'V'], ['E', 'tensione del generatore', 'V'], ['t', 'tempo dalla chiusura', 's']], q: { gen: 'carica.vC' } },
        { plot: { kind: 'transitorio', x0: 0, xf: 10, tau: 1e-3 }, p: 'La curva parte ripida e si appiattisce: la corrente di carica, all’inizio $E/R$, si riduce man mano che il condensatore si carica.', q: Q('All’istante della chiusura, la corrente di carica vale…', 'E/R, il massimo', 'zero', 'metà del massimo') }],
      mix: ['carica.vC', 'carica.vC', 'o:carica.vC', 's:carica.vC', 'tau.RC', 'carica.vC', 'carica.vC', 's:carica.vC'] },
    { id: 'u9l3', title: 'La scarica del condensatore', sub: 'v_C = V₀·e^(−t/τ)', intro: ['f.scarica'], num: 'free', prefixes: ['p', 'n', 'µ', 'm', '', 'k', 'M'],
      teach: [
        { f: 'v_C(t) = V_0 * e^{-t/tau}', leg: [['V_0', 'tensione iniziale', 'V']], q: { gen: 'scarica.vC' } },
        { plot: { kind: 'transitorio', x0: 10, xf: 0, tau: 1e-3 }, p: 'Nella scarica la tensione scende verso zero con la stessa costante di tempo: dopo $tau$ è al 37 % del valore iniziale.', q: Q('Dopo un tempo τ dalla scarica, il condensatore è al…', '37 % della tensione iniziale', '63 %', '0 %') }],
      mix: ['scarica.vC', 'scarica.vC', 's:scarica.vC', 'carica.vC', 'scarica.vC', 'tau.cinque', 'scarica.vC', 's:scarica.vC'] },
    { id: 'u9l4', title: 'Il transitorio RL', sub: 'la corrente nell’induttore', intro: ['f.rl'], num: 'free', prefixes: ['p', 'n', 'µ', 'm', '', 'k', 'M'],
      teach: [
        { f: 'i(t) = E/R * (1 - e^{-t/tau})', leg: [['i', 'corrente', 'A'], ['tau', 'L/R', 's']], q: { gen: 'rl.i' } },
        { p: 'Nell’induttore è la **corrente** che non può cambiare di colpo (nel condensatore era la tensione). All’accensione la corrente parte da zero e sale verso $E/R$ con $tau = L/R$.', q: Q('Nell’induttore, all’accensione, la corrente…', 'parte da zero e sale', 'salta subito a E/R', 'resta zero') },
        { warn: 'Aprendo di colpo un circuito con un induttore (un relè, un motore) nasce una sovratensione: per questo si mette un diodo di ricircolo.', q: Q('Perché sulla bobina di un relè si mette un diodo?', 'per assorbire la sovratensione allo spegnimento', 'per accendere un LED', 'per raddrizzare la corrente') }],
      mix: ['rl.i', 'rl.i', 's:rl.i', 'tau.RC', 'rl.i', 'carica.vC', 'rl.i', 's:rl.i'] },
    Object.assign(T('u9t'), { mix: ['tau.RC', 'tau.cinque', 'carica.vC', 'scarica.vC', 'rl.i', 'carica.vC', 'scarica.vC', 'tau.RC', 'rl.i', 'carica.vC'] }),
    ] },

  /* ========================= 10. Numerazione ========================= */
  { id: 'u10', title: 'Sistemi di numerazione e codici', cls: 3, say: 'I circuiti digitali conoscono solo due livelli, alto e basso: 1 e 0. Per questo i numeri si scrivono in binario. Vediamo come, e come scriverli più corti in esadecimale.',
    lessons: [
    { id: 'u10l1', title: 'Il sistema binario', sub: 'bit, pesi, divisioni successive', intro: ['l.bin'], num: 'free',
      teach: [
        { p: 'Nel sistema **binario** le cifre sono solo **0 e 1** (bit) e i pesi sono le potenze di 2: 1, 2, 4, 8, 16, 32, 64, 128… Il valore è la somma dei pesi delle cifre a 1.', ex: 'num.bin2dec', q: { gen: 'num.bin2dec' } },
        { p: 'Da decimale a binario si fanno le **divisioni successive per 2**: si scrive ogni resto (0 o 1) e si continua con il quoziente fino a zero. Le cifre si leggono **dall’ultimo resto al primo**.', q: { gen: 'num.dec2bin' } }],
      mix: ['num.bin2dec', 'num.dec2bin', 'num.bin2dec', 'num.dec2bin', 's:num.bin2dec', 'num.dec2bin', 'num.bin2dec', 'num.dec2bin'] },
    { id: 'u10l2', title: 'Il sistema esadecimale', sub: 'cifre da 0 a F, gruppi di 4 bit', intro: ['l.hex'], num: 'free',
      teach: [
        { p: 'Il sistema **esadecimale** ha 16 cifre: 0–9 e poi **A = 10, B = 11, C = 12, D = 13, E = 14, F = 15**. Ogni cifra esadecimale corrisponde a **4 bit**: per passare dal binario si raggruppano i bit a quattro a quattro **partendo da destra**.', q: { gen: 'num.bin2hex' } },
        { tbl: { c: ['Esadecimale', 'Binario', 'Decimale'], r: [['0', '0000', '0'], ['5', '0101', '5'], ['9', '1001', '9'], ['A', '1010', '10'], ['C', '1100', '12'], ['F', '1111', '15']] }, q: { gen: 'num.hex2bin' } }],
      mix: ['num.bin2hex', 'num.hex2bin', 'num.hex2dec', 'num.bin2hex', 's:num.hex2dec', 'num.hex2bin', 'num.hex2dec', 'num.bin2hex', 'num.hex2bin'] },
    { id: 'u10l3', title: 'Il codice BCD', sub: 'ogni cifra decimale in 4 bit', intro: ['l.bcd'], num: 'free',
      teach: [
        { p: 'Nel **BCD** (Binary Coded Decimal) ogni cifra decimale si scrive con i suoi 4 bit, separatamente dalle altre. È comodo per i display, ma spreca combinazioni: da 1010 a 1111 non sono codici BCD.', ex: 'num.bcd', q: { gen: 'num.bcd' } }],
      bank: [Q('In BCD, il numero 9 si scrive…', '1001', '1111', '0110'), Q('Il gruppo 1100 in BCD…', 'non è valido: vale più di 9', 'vale 12', 'vale 3')],
      mix: ['num.bcd', 'num.bcd', 'domande', 'num.bcd', 'num.dec2bin', 'num.bcd', 'domande', 'num.bin2dec', 'num.bcd'] },
    { id: 'u10l4', title: 'Somma binaria e complemento a due', sub: 'riporti, numeri negativi, overflow', intro: ['l.somma', 'l.c2'], num: 'free',
      teach: [
        { p: 'La **somma binaria** si fa in colonna come quella decimale: $0 + 1 = 1$, $1 + 1 = 10$ (scrivo 0 e riporto 1), $1 + 1 + 1 = 11$ (scrivo 1 e riporto 1).', q: { gen: 'num.somma' } },
        { p: 'I numeri **negativi** si scrivono in **complemento a due** su un numero fisso di bit: si scrive il modulo in binario, si **invertono tutti i bit** e si **aggiunge 1**. Il primo bit a sinistra fa da segno: 1 vuol dire negativo. Con $n$ bit si va da $-2^{n-1}$ a $2^{n-1} - 1$.', q: { gen: 'num.c2' } },
        { p: 'Se la somma di due numeri dello stesso segno dà un risultato di segno opposto c’è **overflow**: il risultato non sta nel numero di bit.', q: { gen: 'num.range' } }],
      mix: ['num.somma', 'num.c2', 'num.c2dec', 'num.range', 'num.c2', 'num.somma', 'num.c2dec', 'num.range', 'num.c2'] },
    Object.assign(T('u10t'), { mix: ['num.dec2bin', 'num.bin2dec', 'num.bin2hex', 'num.hex2bin', 'num.hex2dec', 'num.bcd', 'num.somma', 'num.c2', 'num.c2dec', 'num.range'] }),
    ] },

  /* ========================= 11. Boole e porte ========================= */
  { id: 'u11', title: 'Algebra di Boole e porte logiche', cls: 3, say: 'George Boole, a metà dell’Ottocento, inventò un’algebra con due soli valori, vero e falso. Un secolo dopo è diventata il linguaggio dei circuiti digitali.',
    lessons: [
    { id: 'u11l1', title: 'NOT, AND, OR', sub: 'tabelle di verità e simboli', intro: ['l.porte', 'l.not', 'l.and', 'l.or', 'l.espressioni'], num: 'free',
      teach: [
        { p: 'Una variabile logica vale 0 o 1. Le tre operazioni fondamentali: **NOT** inverte ($bar(A)$, si legge «A negato»); **AND** dà 1 solo se tutti gli ingressi sono 1 ($A * B$); **OR** dà 1 se almeno un ingresso è 1 ($A + B$).', truth: ['AND', 'OR'], q: { gen: 'porta.tabella' } },
        { gates: ['NOT', 'AND', 'OR'], p: 'I simboli **CEI EN 60617** sono rettangoli con un segno dentro: **1** per il NOT (con il cerchietto della negazione all’uscita), **&** per l’AND, **≥1** per l’OR. Accanto trovi le forme americane, che vedrai nei datasheet.', q: { gen: 'porta.riconosci' } },
        { ex: 'logica.valuta', q: { gen: 'logica.simula' } }],
      mix: ['porta.tabella', 'porta.riconosci', 'logica.valuta', 'logica.simula', 'porta.tabella', 'logica.valuta', 'logica.simula', 'porta.riconosci', 'logica.valuta'] },
    { id: 'u11l2', title: 'NAND, NOR, XOR', sub: 'porte universali e OR esclusivo', intro: ['l.nand', 'l.nor', 'l.xor', 'l.xnor'], num: 'free',
      teach: [
        { p: '**NAND** e **NOR** sono AND e OR con l’uscita negata. Sono **universali**: con sole NAND (o sole NOR) si costruisce qualunque funzione. Un integrato come il **74HC00** contiene quattro NAND a due ingressi.', truth: ['NAND', 'NOR'], q: { gen: 'porta.tabella' } },
        { gates: ['NAND', 'NOR', 'XOR'], p: 'La **XOR** (OR esclusivo, $A ⊕ B$) dà 1 quando gli ingressi sono **diversi**; la **XNOR** quando sono uguali. Nel simbolo CEI la XOR ha **=1**.', q: { gen: 'porta.riconosci' } }],
      mix: ['porta.tabella', 'porta.riconosci', 'logica.valuta', 'porta.tabella', 'logica.simula', 'porta.riconosci', 'logica.valuta', 'porta.tabella', 'logica.simula'] },
    { id: 'u11l3', title: 'Teoremi e De Morgan', sub: 'semplificare le espressioni', intro: ['l.teoremi', 'l.demorgan'], num: 'free',
      teach: [
        { tbl: { c: ['Teorema', 'Forma AND', 'Forma OR'], r: [['elemento neutro', 'A·1 = A', 'A + 0 = A'], ['annullamento', 'A·0 = 0', 'A + 1 = 1'], ['idempotenza', 'A·A = A', 'A + A = A'], ['complemento', 'A·A̅ = 0', 'A + A̅ = 1'], ['assorbimento', 'A·(A + B) = A', 'A + A·B = A'], ['', 'A·(A̅ + B) = A·B', 'A + A̅·B = A + B']] }, q: { gen: 'teoremi.semplifica' } },
        { p: 'I **teoremi di De Morgan**: la negazione di un prodotto è la somma delle negazioni, $bar(A * B) = bar(A) + bar(B)$; la negazione di una somma è il prodotto delle negazioni, $bar(A + B) = bar(A) * bar(B)$. In pratica: si nega ogni termine e si scambia AND con OR.', q: { gen: 'demorgan' } }],
      mix: ['demorgan', 'teoremi.semplifica', 'demorgan', 'teoremi.semplifica', 'logica.valuta', 'demorgan', 'teoremi.semplifica', 'demorgan', 'teoremi.semplifica'] },
    { id: 'u11l4', title: 'Dallo schema all’espressione', sub: 'reti di porte e simulatore', intro: [], num: 'free',
      teach: [
        { p: 'Per leggere una rete si parte dagli **ingressi** e si scrive l’uscita di ogni porta, una alla volta, fino all’uscita finale. Per costruire una rete da un’espressione si fa il contrario: una porta per ogni operazione.', q: { gen: 'logica.schema' } },
        { ex: 'logica.simula', q: { gen: 'logica.valuta' } }],
      mix: ['logica.schema', 'logica.simula', 'logica.schema', 'logica.valuta', 'logica.schema', 'logica.simula', 'logica.schema', 'logica.valuta', 'logica.simula'] },
    Object.assign(T('u11t'), { mix: ['porta.tabella', 'porta.riconosci', 'logica.valuta', 'demorgan', 'teoremi.semplifica', 'logica.schema', 'logica.simula', 'porta.tabella', 'demorgan', 'logica.schema'] }),
    ] },

  /* ========================= 12. Reti combinatorie ========================= */
  { id: 'u12', title: 'Reti combinatorie', cls: 3, say: 'Dato un problema («accendi l’allarme se…»), si scrive la tabella di verità, si ricava l’espressione e la si semplifica con le mappe di Karnaugh. Poi si costruisce con le porte.',
    lessons: [
    { id: 'u12l1', title: 'Forme canoniche', sub: 'dalla tabella alla somma di prodotti', intro: ['l.canon'], num: 'free',
      teach: [
        { p: 'Per ogni riga della tabella in cui l’uscita vale 1 si scrive un **prodotto** (mintermine) con tutte le variabili: negata se vale 0, diretta se vale 1. La funzione è la **somma** di questi prodotti: è la **forma canonica**.', q: { gen: 'canonica' } }],
      mix: ['canonica', 'canonica', 'logica.valuta', 'canonica', 'canonica', 'logica.schema', 'canonica', 'canonica'] },
    { id: 'u12l2', title: 'Mappe di Karnaugh a 2 e 3 variabili', sub: 'gruppi di 1 adiacenti', intro: ['l.km'], num: 'free',
      teach: [
        { p: 'La **mappa di Karnaugh** è la tabella di verità disposta in modo che due caselle **vicine** differiscano di un solo bit (ordine di Gray: 00, 01, 11, 10). I bordi opposti sono vicini.', kmapDemo: { on: [1, 3, 5, 7], vars: ['A', 'B', 'C'] }, q: { gen: 'km.riempi' } },
        { p: 'Si raggruppano gli 1 in **rettangoli di 1, 2, 4, 8 caselle**, i più grandi possibile, anche sovrapposti. Ogni gruppo dà un prodotto con le sole variabili che **non cambiano** nel gruppo. La somma dei gruppi è la forma minima.', q: { gen: 'km.minima' } }],
      mix: ['km.riempi', 'km.minima', 'km.riempi', 'km.minima', 'canonica', 'km.minima', 'km.riempi', 'km.minima'] },
    { id: 'u12l3', title: 'Mappe a 4 variabili e indifferenze', sub: 'sedici caselle, condizioni don’t care', intro: ['l.km4', 'l.dc'], num: 'free',
      teach: [
        { p: 'Con 4 variabili la mappa ha **16 caselle**: righe AB, colonne CD, entrambe in ordine di Gray. I quattro angoli sono tutti vicini fra loro.', kmapDemo: { on: [0, 2, 8, 10, 5, 7, 13, 15], vars: ['A', 'B', 'C', 'D'], groups: true }, q: { gen: 'km.minima' } },
        { p: 'Le **condizioni indifferenti** (–) sono combinazioni d’ingresso che non capitano mai (per esempio i codici BCD da 10 a 15): si possono considerare 0 o 1, come conviene per fare gruppi più grandi.', q: Q('Una casella «–» nella mappa…', 'si può usare come 1 se aiuta a fare un gruppo più grande', 'va sempre presa come 1', 'va sempre presa come 0') }],
      mix: ['km.minima', 'km.minima', 'km.minima', 'km.riempi', 'km.minima', 'km.minima', 'canonica', 'km.minima'] },
    { id: 'u12l4', title: 'Multiplexer e decoder', sub: 'scegliere un ingresso, attivare un’uscita', intro: ['l.mux', 'l.dec'], num: 'free',
      teach: [
        { p: 'Il **multiplexer** (MUX) ha più ingressi di dati e alcuni ingressi di **selezione**: il numero scritto in binario sui selettori sceglie quale ingresso arriva all’uscita. Un MUX a 4 ingressi ha 2 selettori.', q: { gen: 'mux.uscita' } },
        { p: 'Il **decoder** fa il contrario: riceve un numero in binario e attiva **una sola** uscita, quella con quel numero. Un decoder da 3 a 8 ha 3 ingressi e 8 uscite.', q: { gen: 'decoder.uscita' } }],
      mix: ['mux.uscita', 'decoder.uscita', 'mux.uscita', 'decoder.uscita', 'mux.uscita', 'decoder.uscita', 'num.bin2dec', 'mux.uscita'] },
    { id: 'u12l5', title: 'Sommatori', sub: 'semisommatore e sommatore completo', intro: ['l.adder'], num: 'free',
      teach: [
        { p: 'Il **semisommatore** somma due bit: la somma è $S = A ⊕ B$, il riporto $C = A * B$. Il **sommatore completo** somma anche il riporto in arrivo: $S = A ⊕ B ⊕ C_{in}$. Mettendone $n$ in fila si sommano numeri di $n$ bit.', q: { gen: 'sommatore' } }],
      mix: ['sommatore', 'sommatore', 'num.somma', 'sommatore', 'sommatore', 'num.somma', 'sommatore', 'sommatore'] },
    Object.assign(T('u12t'), { mix: ['canonica', 'km.riempi', 'km.minima', 'km.minima', 'mux.uscita', 'decoder.uscita', 'sommatore', 'canonica', 'km.minima', 'sommatore'] }),
    ] },
  ];
  root.ELEK_COURSE3 = UNITS;
  if (typeof module !== 'undefined') module.exports = UNITS;
})(typeof window !== 'undefined' ? window : globalThis);
