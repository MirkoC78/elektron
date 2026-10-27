# Revisione critica delle schermate

Revisione fatta sulle schermate di `node tools/schermate.js tutte` (360 px e 1280 px, chiaro e scuro) e sulle 1472 schermate di esercizio attraversate dal giocatore automatico. Il plugin Design (design-critique, accessibility-review) non è installato in questo ambiente: le procedure sono state applicate a mano, con gli strumenti di `tools/`. Per ogni punto: che cosa non andava, che cosa è stato fatto.

## Corretti

| Schermata | Problema | Correzione |
|---|---|---|
| Palestra, 360 px | I sei tipi di esercizio in un selettore a segmenti allargavano la pagina a 499 px | Menu a tendina, come l'argomento |
| Svolgimento | Le formule lunghe (Kirchhoff con due maglie, divisioni successive) facevano uscire la colonna fino a 437 px | I figli delle griglie possono restringersi (`min-width: 0`); ogni passaggio è un riquadro che scorre; le catene di uguaglianze separate da «;» vanno a capo una per riga; i passaggi fatti solo di parole si scrivono come testo |
| Testo dei problemi | Le formule in linea non vanno a capo | Riquadro in linea che scorre (`.mathin`) se la formula è più larga della colonna |
| Codice colori nelle opzioni | Bande disegnate con stili scritti nel markup | Piccolo SVG con le bande e, accanto, i nomi dei colori |
| Mappa di Karnaugh | Colonne della griglia scritte nel markup | Classi `cols-3` / `cols-5` |
| Mascotte sul fondo scuro | Braccia e gambe di Erre sparivano | Reofori metallici chiari con contorno scuro |
| Audio | Avviso in console quando un suono partiva senza un tocco | Nessun suono prima del primo tocco |
| Valori fuori dal sistema | 12 (rgb scritto a mano, 11 px, 15 px, 66 px, 6 px, gettone inutilizzato…) | Tutti riportati ai gettoni; l'audit ora non trova nulla |

## Scelte confermate

- Il percorso si apre con la scheda «Continua» in cima; «Lezione attuale» compare solo dopo aver scorso il percorso.
- La verifica sta nella fascia in basso (verdetto, errore tipico nominato, risultato giusto, Continua); lo svolgimento guidato compare sotto l'esercizio, così la fascia resta bassa anche a 360 px.
- Nel tema scuro il pulsante principale è giallo con testo scuro: è il colore più riconoscibile della tavolozza e ha contrasto alto.

## Limiti noti (da guardare con occhi umani)

- Il busto di Erre a 52 px nella fascia della verifica è leggibile ma piccolo; le espressioni si distinguono soprattutto dalla bocca.
- Le icone dell'app mostrano Erre intero su fondo ardesia: sulle schermate Home con sfondi scuri il bordo dell'icona si distingue poco.
- Le formule con molte frazioni annidate restano alte; non sono state viste su un iPhone vero.
