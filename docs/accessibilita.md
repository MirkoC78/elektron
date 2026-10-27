# Accessibilità (WCAG 2.1 AA)

Verificata con strumenti automatici a ogni costruzione e con il giocatore automatico nel browser; non con un lettore di schermo vero (vedi `docs/da-verificare.md`).

## Che cosa si controlla e come

- **Contrasti**: `node tools/contrast.js` ricostruisce la cascata delle variabili di `app.css` e controlla 90 coppie (testo 4,5:1, grafica e bordi 3:1) in chiaro e in scuro, compresi i colori di schemi e strumenti. Risultato: nessuna coppia sotto la soglia (tabella sotto).
- **Nomi e descrizioni**: il giocatore (`node tools/gioca.js`, `PALESTRA=1 node tools/gioca.js`) controlla su ogni schermata attraversata (1472 esercizi delle lezioni, più di 700 della palestra, le viste principali) che ogni pulsante, campo e menu abbia un nome accessibile, che ogni disegno abbia `role="img"` e la descrizione, che ogni formula abbia la lettura (`alttext`), che non ci siano identificatori ripetuti e che nessun bersaglio sia più basso di 40 px. Risultato: nessun problema.
- **Larghezza**: a 360 px e a 1280 px niente esce dallo schermo (le formule e le tabelle larghe scorrono nel loro riquadro).
- **Console**: pulita in tutte le lezioni, nella palestra, nel sito servito via HTTP e senza rete.

## Scelte

- **Schemi**: ogni schema è disegnato dal motore insieme alla sua descrizione a parole (componenti, collegamenti, valori, versi), letta come etichetta dell'immagine. Lo stesso per grafici, oscilloscopio, multimetro, porte logiche, mappe di Karnaugh e codice colori.
- **Formule**: MathML con la lettura in italiano («R uguale frazione: R 1 per R 2, fratto R 1 più R 2, fine frazione»).
- **Colore mai da solo**: le bande del codice colori hanno il nome del colore e la cifra; giusto e sbagliato hanno parola e icona; correnti e tensioni si distinguono per la forma della freccia e il nome; le tracce dell'oscilloscopio per tratteggio e canale.
- **Porte logiche**: simbolo CEI EN 60617 e forma americana affiancati; la descrizione è una sola (la seconda figura è nascosta ai lettori di schermo per non leggere due volte la stessa cosa).
- **Tastiera**: tutto si usa da tastiera; 1–5 scelgono le opzioni, Invio controlla e prosegue, Esc chiude fogli e finestre; il focus torna al pulsante che li aveva aperti; solo lo strato più in alto è attivo (`inert`).
- **Movimento ridotto**: niente coriandoli né animazioni d'ingresso.
- **Lingua**: pagina in italiano; i termini inglesi del glossario hanno `lang="en"`.

## Tabella dei contrasti

| Palette | Tema | Colore | Sfondo | Contrasto | Minimo | Dove |
|---|---|---|---|---|---|---|
| Ardesia | chiaro | `--ink` | `--bg` | 15.43 | 4.5 | testo sullo sfondo |
| Ardesia | chiaro | `--ink` | `--surface` | 17.17 | 4.5 | testo sulle schede |
| Ardesia | chiaro | `--ink` | `--surface-2` | 13.94 | 4.5 | testo sui riquadri grigi |
| Ardesia | chiaro | `--muted` | `--bg` | 6.33 | 4.5 | testo secondario sullo sfondo |
| Ardesia | chiaro | `--muted` | `--surface` | 7.04 | 4.5 | testo secondario sulle schede |
| Ardesia | chiaro | `--muted` | `--surface-2` | 5.72 | 4.5 | testo secondario sui riquadri grigi |
| Ardesia | chiaro | `--pri-text` | `--bg` | 11.43 | 4.5 | collegamenti e testo attivo |
| Ardesia | chiaro | `--pri-text` | `--surface` | 12.71 | 4.5 | collegamenti sulle schede |
| Ardesia | chiaro | `--pri-text` | `--pri-soft` | 10.20 | 4.5 | etichette e scelte attive |
| Ardesia | chiaro | `--pri-ink` | `--pri` | 12.71 | 4.5 | testo dei pulsanti principali |
| Ardesia | chiaro | `--on-state` | `--good` | 6.09 | 4.5 | pulsante «giusto» |
| Ardesia | chiaro | `--on-state` | `--bad` | 6.54 | 4.5 | pulsante «sbagliato» |
| Ardesia | chiaro | `--ink` | `--good-soft` | 14.53 | 4.5 | riquadro della risposta giusta |
| Ardesia | chiaro | `--ink` | `--bad-soft` | 14.04 | 4.5 | riquadro della risposta sbagliata |
| Ardesia | chiaro | `--good-text` | `--good-soft` | 8.36 | 4.5 | risposta giusta, titolo e scelta |
| Ardesia | chiaro | `--bad-text` | `--bad-soft` | 8.15 | 4.5 | risposta sbagliata, titolo e scelta |
| Ardesia | chiaro | `--star-d` | `--star-soft` | 6.63 | 4.5 | etichetta «Nuova» |
| Ardesia | chiaro | `--star-d` | `--surface` | 7.55 | 4.5 | punti XP |
| Ardesia | chiaro | `--flame` | `--surface` | 5.44 | 4.5 | serie di giorni |
| Ardesia | chiaro | `--on-state` | `--bad` | 6.54 | 4.5 | contatore errori |
| Ardesia | chiaro | `--on-g` | `--g-1` | 12.71 | 4.5 | intestazione unità, classe 3ª |
| Ardesia | chiaro | `--on-g` | `--g-2` | 7.14 | 4.5 | intestazione unità, classe 4ª |
| Ardesia | chiaro | `--on-g` | `--g-3` | 7.46 | 4.5 | intestazione unità, classe 5ª |
| Ardesia | chiaro | `--acc-text` | `--surface` | 6.25 | 4.5 | termini inglesi del glossario |
| Ardesia | chiaro | `--muted` | `--surface-2` | 5.72 | 4.5 | intestazione delle unità chiuse |
| Ardesia | chiaro | `--sch-text` | `--sch-fill` | 17.17 | 4.5 | scritte degli schemi |
| Ardesia | chiaro | `--sch-muted` | `--sch-fill` | 7.04 | 4.5 | valori dei componenti |
| Ardesia | chiaro | `--sch-wire` | `--sch-fill` | 12.83 | 3 | conduttori |
| Ardesia | chiaro | `--sch-cur` | `--sch-fill` | 6.54 | 4.5 | frecce e nomi delle correnti |
| Ardesia | chiaro | `--sch-vol` | `--sch-fill` | 6.09 | 4.5 | frecce e nomi delle tensioni |
| Ardesia | chiaro | `--sch-node` | `--sch-fill` | 7.14 | 4.5 | nomi dei nodi |
| Ardesia | chiaro | `--sch-hl` | `--sch-fill` | 7.46 | 3 | componente evidenziato |
| Ardesia | chiaro | `--scope-txt` | `--scope-bg` | 15.56 | 4.5 | scritte dell’oscilloscopio e del multimetro |
| Ardesia | chiaro | `--scope-tr1` | `--scope-bg` | 13.12 | 3 | traccia 1 |
| Ardesia | chiaro | `--scope-tr2` | `--scope-bg` | 10.97 | 3 | traccia 2 |
| Ardesia | chiaro | `--pri` | `--bg` | 11.43 | 3 | pietra della lezione attuale |
| Ardesia | chiaro | `--road-done` | `--bg` | 11.43 | 3 | pietre completate |
| Ardesia | chiaro | `--focus` | `--bg` | 6.42 | 3 | anello di focus |
| Ardesia | chiaro | `--focus` | `--surface` | 7.14 | 3 | focus sulle schede |
| Ardesia | chiaro | `--line-strong` | `--surface` | 3.92 | 3 | bordi dei campi e dei pulsanti chiari |
| Ardesia | chiaro | `--line-strong` | `--bg` | 3.52 | 3 | bordi sullo sfondo |
| Ardesia | chiaro | `--star` | `--surface` | 5.11 | 3 | stelle e anello obiettivo |
| Ardesia | chiaro | `--good` | `--surface` | 6.09 | 3 | segno di spunta |
| Ardesia | chiaro | `--bad` | `--bad-soft` | 5.35 | 3 | bordo della risposta sbagliata |
| Ardesia | chiaro | `--pri` | `--surface` | 12.71 | 3 | interruttori accesi |
| Ardesia | scuro | `--ink` | `--bg` | 15.82 | 4.5 | testo sullo sfondo |
| Ardesia | scuro | `--ink` | `--surface` | 14.55 | 4.5 | testo sulle schede |
| Ardesia | scuro | `--ink` | `--surface-2` | 12.81 | 4.5 | testo sui riquadri grigi |
| Ardesia | scuro | `--muted` | `--bg` | 8.85 | 4.5 | testo secondario sullo sfondo |
| Ardesia | scuro | `--muted` | `--surface` | 8.13 | 4.5 | testo secondario sulle schede |
| Ardesia | scuro | `--muted` | `--surface-2` | 7.16 | 4.5 | testo secondario sui riquadri grigi |
| Ardesia | scuro | `--pri-text` | `--bg` | 13.13 | 4.5 | collegamenti e testo attivo |
| Ardesia | scuro | `--pri-text` | `--surface` | 12.07 | 4.5 | collegamenti sulle schede |
| Ardesia | scuro | `--pri-text` | `--pri-soft` | 10.12 | 4.5 | etichette e scelte attive |
| Ardesia | scuro | `--pri-ink` | `--pri` | 12.06 | 4.5 | testo dei pulsanti principali |
| Ardesia | scuro | `--on-state` | `--good` | 8.75 | 4.5 | pulsante «giusto» |
| Ardesia | scuro | `--on-state` | `--bad` | 8.34 | 4.5 | pulsante «sbagliato» |
| Ardesia | scuro | `--ink` | `--good-soft` | 12.13 | 4.5 | riquadro della risposta giusta |
| Ardesia | scuro | `--ink` | `--bad-soft` | 13.23 | 4.5 | riquadro della risposta sbagliata |
| Ardesia | scuro | `--good-text` | `--good-soft` | 8.06 | 4.5 | risposta giusta, titolo e scelta |
| Ardesia | scuro | `--bad-text` | `--bad-soft` | 8.26 | 4.5 | risposta sbagliata, titolo e scelta |
| Ardesia | scuro | `--star-d` | `--star-soft` | 10.12 | 4.5 | etichetta «Nuova» |
| Ardesia | scuro | `--star-d` | `--surface` | 12.07 | 4.5 | punti XP |
| Ardesia | scuro | `--flame` | `--surface` | 7.91 | 4.5 | serie di giorni |
| Ardesia | scuro | `--on-state` | `--bad` | 8.34 | 4.5 | contatore errori |
| Ardesia | scuro | `--on-g` | `--g-1` | 9.43 | 4.5 | intestazione unità, classe 3ª |
| Ardesia | scuro | `--on-g` | `--g-2` | 8.38 | 4.5 | intestazione unità, classe 4ª |
| Ardesia | scuro | `--on-g` | `--g-3` | 8.97 | 4.5 | intestazione unità, classe 5ª |
| Ardesia | scuro | `--acc-text` | `--surface` | 12.07 | 4.5 | termini inglesi del glossario |
| Ardesia | scuro | `--muted` | `--surface-2` | 7.16 | 4.5 | intestazione delle unità chiuse |
| Ardesia | scuro | `--sch-text` | `--sch-fill` | 14.55 | 4.5 | scritte degli schemi |
| Ardesia | scuro | `--sch-muted` | `--sch-fill` | 8.13 | 4.5 | valori dei componenti |
| Ardesia | scuro | `--sch-wire` | `--sch-fill` | 11.33 | 3 | conduttori |
| Ardesia | scuro | `--sch-cur` | `--sch-fill` | 7.51 | 4.5 | frecce e nomi delle correnti |
| Ardesia | scuro | `--sch-vol` | `--sch-fill` | 9.67 | 4.5 | frecce e nomi delle tensioni |
| Ardesia | scuro | `--sch-node` | `--sch-fill` | 10.09 | 4.5 | nomi dei nodi |
| Ardesia | scuro | `--sch-hl` | `--sch-fill` | 9.36 | 3 | componente evidenziato |
| Ardesia | scuro | `--scope-txt` | `--scope-bg` | 16.27 | 4.5 | scritte dell’oscilloscopio e del multimetro |
| Ardesia | scuro | `--scope-tr1` | `--scope-bg` | 13.72 | 3 | traccia 1 |
| Ardesia | scuro | `--scope-tr2` | `--scope-bg` | 11.48 | 3 | traccia 2 |
| Ardesia | scuro | `--pri` | `--bg` | 12.15 | 3 | pietra della lezione attuale |
| Ardesia | scuro | `--road-done` | `--bg` | 12.15 | 3 | pietre completate |
| Ardesia | scuro | `--focus` | `--bg` | 13.13 | 3 | anello di focus |
| Ardesia | scuro | `--focus` | `--surface` | 12.07 | 3 | focus sulle schede |
| Ardesia | scuro | `--line-strong` | `--surface` | 3.91 | 3 | bordi dei campi e dei pulsanti chiari |
| Ardesia | scuro | `--line-strong` | `--bg` | 4.26 | 3 | bordi sullo sfondo |
| Ardesia | scuro | `--star` | `--surface` | 11.17 | 3 | stelle e anello obiettivo |
| Ardesia | scuro | `--good` | `--surface` | 7.88 | 3 | segno di spunta |
| Ardesia | scuro | `--bad` | `--bad-soft` | 6.83 | 3 | bordo della risposta sbagliata |
| Ardesia | scuro | `--pri` | `--surface` | 11.17 | 3 | interruttori accesi |
