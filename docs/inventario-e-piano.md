# Elektron — inventario e piano

Elektron è l'app sorella di Verto (latino) e Hermeneus (greco) per l'elettronica degli istituti tecnici,
settore tecnologico, indirizzo Elettronica ed Elettrotecnica, articolazione Elettronica, classi 3ª, 4ª e 5ª.
Il nome viene dal greco ἤλεκτρον, «ambra», da cui viene la parola «elettricità».

## Decisioni prese (26 ottobre 2026)
| Scelta | Decisione |
|---|---|
| Nome e cartella del sito | **Elektron**, `elektron` |
| Programma | 25 unità, 111 lezioni e 25 prove, come proposto qui sotto |
| Simboli delle porte logiche | CEI EN 60617 (rettangolari) e forme americane **sempre affiancati** in ogni schema logico |
| Materiali di riferimento | nessun libro da seguire: si usano le convenzioni dichiarate qui sotto |
| Palette e mascotte | da scegliere alla tappa 6, fra proposte applicate all'app vera |

## Inventario di Verto

| Parte di Verto | Destino in Elektron |
|---|---|
| `build.js`: file unico con caratteri incorporati, sito con manifest, icone, `.nojekyll`, licenze | **si riusa**, con nome, caratteri e moduli nuovi |
| Service worker con ambito sulla cartella, cache `app@/cartella/@versione`, cancella solo le proprie | **si riusa**; in più non tocca mai le cache che iniziano con `verto@` o `hermeneus@` |
| `tools/pubblica.sh` | **si riusa**, con il controllo dei dati riservati (`tools/riservati.js`) prima dell'invio |
| `savecode.js`: bit impacchettati, Fletcher a 16 bit, base32 di Crockford, stelle oltre lo sblocco | **si riusa** il formato; cambiano i campi |
| Ripetizione dilazionata a 5 scatole, un passo al giorno | **si riusa** per il glossario |
| Serie con scudi, XP, obiettivo, gradi, insegne, suoni, coriandoli, avvisi | **si riusa** la logica; gli scudi diventano «fusibili di riserva», gradi e insegne sono nuovi |
| Lezione: schede, domanda di controllo, esercizi sbagliati in fondo, stelle 95/80 %, prova al 70 % | **si riusa**; la domanda di controllo segue **ogni** scheda, non solo le tabelle |
| Benvenuto in tre passi, posizione nel percorso anche all'indietro, «Continua», «Lezione attuale» | **si riusa** |
| Strati inerti, focus restituito, Esc, avvio senza `requestAnimationFrame`, anteprime `#demo=…` | **si riusa** |
| Perimetri (`lessons.js`: vocabolario incontrato, forme ammesse) | **si adatta**: grandezze, componenti, formule e topologie già introdotte, tipo di numeri ammessi |
| Viste (`app.js`) | **si adatta**: Percorso, Palestra (Problemi di calcolo in cima), Teoria e Formulario, Glossario, Profilo |
| `explain.js` (spiegazioni dalle analisi del motore) | **si adatta**: spiegazioni dagli errori tipici calcolati dal motore |
| `app.css`: gettoni, scale, impaginazione da computer | **si adatta** l'architettura; valori, palette e caratteri sono nuovi |
| Giocatore automatico, riquadri a 360 px, `audit-tokens.js`, `check-classes.js`, `contrast.js`, `icons.py`, `run-all.js` | **si riusano** e si adattano agli esercizi nuovi |
| Motore morfologico, lessico, frasi, generatore di frasi, lettura del latino, teoria latina | **si tolgono** |
| Giano, palette «Pigmenti romani», marchio a rombi, Lexend, Marcellus, Gentium | **si tolgono**: di Verto non deve vedersi nulla |
| Wikizionario | **si toglie**; al suo posto collegamenti facoltativi a Wikipedia in italiano |
| Lettura ad alta voce | resta solo per i termini inglesi del glossario e solo con voci locali del dispositivo |

**Da scrivere da zero:** il motore (numeri e unità, reti in continua e in alternata con l'analisi nodale modificata,
transitori, logica combinatoria e sequenziale, semiconduttori, operazionale, filtri, conversione, numerazione, errori tipici,
traccia dei passaggi), gli schemi SVG dalla netlist con i simboli CEI, gli strumenti virtuali, il simulatore logico,
il controllo delle risposte numeriche, tutti i contenuti, la mascotte, la palette, il marchio, le icone.

## Convenzioni dichiarate (uguali in tutta l'app)
- **Corrente**: verso convenzionale, dal morsetto positivo al negativo nel circuito esterno.
- **Tensione**: la freccia punta verso il morsetto a potenziale più alto; accanto c'è sempre il segno +.
- **Bipoli**: convenzione degli utilizzatori per resistori, condensatori, induttori, diodi; convenzione dei generatori per i generatori.
  Con la convenzione degli utilizzatori una potenza positiva è assorbita.
- **Kirchhoff**: al nodo, somma delle correnti entranti = somma delle uscenti; alla maglia, somma algebrica delle tensioni = 0
  percorrendola nel verso scelto (positive le tensioni la cui freccia è concorde con il verso di percorrenza).
- **Alternata**: valori efficaci per tensioni e correnti, se non è detto altro; fasori con il modulo efficace; angoli in gradi;
  unità immaginaria *j*.
- **Scrittura SI**: virgola decimale, spazio fra numero e unità (4,7 kΩ), simboli delle unità in tondo, prefissi senza spazio.
- **Modelli dei semiconduttori**: diodo ideale o a soglia 0,7 V (LED secondo il colore, Zener a tensione costante); BJT con
  V<sub>BE</sub> = 0,7 V, I<sub>C</sub> = β·I<sub>B</sub> in zona attiva, V<sub>CE,sat</sub> = 0,2 V; MOSFET come interruttore con
  V<sub>GS(th)</sub> e R<sub>DS(on)</sub>; operazionale ideale con uscita limitata dalle alimentazioni.

## Dosaggio dei numeri
- Unità 1–3: valori interi o con una cifra decimale; nessun prefisso fino alla lezione 1.4.
- Dalla lezione 1.4: prefissi k e m; µ, n, p dall'unità 8.
- Numeri complessi solo dalla lezione 14.1.
- Tolleranza delle risposte numeriche: 1 % del valore esatto (dichiarata nell'esercizio); per gli angoli 0,5°.

## Programma

Le schede «Ripasso di matematica» compaiono nel punto in cui servono (segnate con \*).

### Classe 3ª
| Unità | Lezioni (più la prova finale) |
|---|---|
| 1. Grandezze e unità | Carica e corrente · Tensione · Potenze di 10 e notazione scientifica\* · Prefissi SI, notazione ingegneristica, scrittura dei tecnici · Potenza ed energia |
| 2. Il circuito, i componenti, gli strumenti | Il circuito e le convenzioni dei segni · Resistore e codice colori · Serie E12/E24 e tolleranza\* · Generatori e multimetro · Sicurezza elettrica |
| 3. Legge di Ohm | La legge · Formule inverse\* · Effetto Joule e potenza nominale · Resistività e caratteristica V–I |
| 4. Serie e parallelo | Serie · Parallelo · Reti miste: leggere lo schema · Correnti e tensioni nei rami |
| 5. Partitori | Partitore di tensione · Partitore con carico · Partitore di corrente · Il potenziometro |
| 6. Principi di Kirchhoff | Nodi, rami, maglie, massa · Primo principio · Secondo principio · Reti con due maglie\* · Trova il guasto |
| 7. Metodi di analisi | Sovrapposizione · Thevenin · Norton · Millman · Massimo trasferimento di potenza |
| 8. Condensatori e induttori | Il condensatore e i codici · Serie e parallelo · Energia immagazzinata · L'induttore |
| 9. Transitori RC e RL | Costante di tempo · Carica\* · Scarica · Transitorio RL |
| 10. Numerazione e codici | Binario · Esadecimale · BCD · Somma binaria e complemento a due |
| 11. Algebra di Boole e porte | NOT, AND, OR · NAND, NOR, XOR · Teoremi e De Morgan · Dallo schema all'espressione |
| 12. Reti combinatorie | Forme canoniche · Karnaugh a 2 e 3 variabili · Karnaugh a 4 variabili · Multiplexer e decoder · Sommatori |

### Classe 4ª
| Unità | Lezioni |
|---|---|
| 13. Grandezze sinusoidali | Periodo e frequenza · Picco, efficace e medio · Pulsazione e fase\* · L'oscilloscopio |
| 14. Complessi, fasori, impedenza | Numeri complessi\* · Fasori · Reattanze · Circuiti RC e RL serie · RLC e reti in alternata |
| 15. Potenze in alternata e risonanza | P, Q, S e fattore di potenza · Rifasamento · Risonanza serie · Risonanza parallelo |
| 16. Reti sequenziali | Latch SR · Flip-flop D e clock · JK e T · Contatori · Registri |
| 17. Diodi | Giunzione PN e modelli · Circuiti con diodi · LED · Raddrizzatori · Zener e stabilizzatore |
| 18. Transistor BJT | Struttura e guadagno · Zone di funzionamento · Polarizzazione · Il BJT come interruttore |
| 19. MOSFET e famiglie logiche | MOSFET ad arricchimento · Interruttore per carichi · Livelli TTL e CMOS · Inverter CMOS |
| 20. Amplificatori operazionali | Ideale e comparatore · Invertente · Non invertente e inseguitore · Sommatore e differenziale · Saturazione |
| 21. Filtri e diagrammi di Bode | Decibel\* · Passa-basso RC · Passa-alto · Bode asintotico · Filtri attivi |

### Classe 5ª
| Unità | Lezioni |
|---|---|
| 22. Generatori di forme d'onda | Trigger di Schmitt · Astabile con l'operazionale · NE555 astabile · NE555 monostabile · Ponte di Wien |
| 23. Conversione A/D e D/A | Campionamento · Quantizzazione · D/A pesato e R-2R · A/D flash e ad approssimazioni successive |
| 24. Alimentatori | Schema a blocchi e trasformatore · Raddrizzatore e filtro · Regolatori lineari · Cenni agli switching |
| 25. Trasduttori e acquisizione | Caratteristiche dei sensori · Temperatura · Luce · Condizionamento e catena di acquisizione |

## Piano a tappe (un commit per tappa)
0. Repository, infrastruttura presa da Verto, questo documento.
1. Motore delle reti: numeri e unità, serie E, codice colori, reti in continua e in alternata, traccia dei passaggi, errori tipici; test di riferimento e controlli incrociati.
2. Motore, il resto: transitori, logica, semiconduttori, operazionale, filtri, conversione, numerazione; test.
3. Schemi SVG dalla netlist con i simboli CEI, strumenti virtuali, simulatore logico.
4. Controllo delle risposte; test con migliaia di risposte sbagliate simulate.
5. Percorso e perimetri: 25 unità, motore delle lezioni, generatore dei problemi; test dei perimetri e 10.000 problemi.
6. Interfaccia; tre palette sull'app vera e due o tre mascotte con l'anteprima (scelta dell'utente).
7. Mascotte definitiva, motivazione, teoria, formulario, glossario, convertitore.
8. Salvataggio, codice, copia su file, promemoria; sito installabile e icone.
9. Sistema di design, critica di tutte le schermate, accessibilità AA; revisioni in `docs/`.
10. Prove nel browser: giocatore automatico, 360 px e computer, chiaro e scuro, console.
11. Revisione tecnica, `docs/da-verificare.md`, rapporto finale, pubblicazione.
