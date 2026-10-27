# Sistema di design di Elektron

Ogni misura del foglio di stile (`src/app.css`, `src/sch.css`) viene dai gettoni definiti in `:root`. Un valore scritto a mano è un errore: lo segnala `node tools/audit-tokens.js`, che esce con errore se trova colori, dimensioni del testo, raggi, ombre o altezze fuori dal sistema, misure non multiple di 4 o stili scritti nel markup.

## Scale

| Scala | Gettoni | Valori |
|---|---|---|
| Spazi (base 4) | `--sp-1` … `--sp-9` | 4, 8, 12, 16, 20, 24, 32, 40, 48 px |
| Testo (7 dimensioni) | `--fs-xs` … `--fs-3xl` | 12, 14, 16, 18, 22, 28, 36 px; formule `--fs-math` = 1,08 em (STIX Two Math ha l'occhio più piccolo di Plex) |
| Raggi (3 + cerchio) | `--r-sm`, `--r-md`, `--r-lg`, `--r-pill` | 6, 12, 20 px; 999 px per le pastiglie |
| Altezze dei controlli (3) | `--h-sm`, `--h-md`, `--h-lg` | 40, 48, 56 px: nessun bersaglio sotto i 40 px |
| Rilievo dei pulsanti (uno solo) | `--depth` | 4 px di ombra piena sotto pulsanti e opzioni, nel colore del loro bordo |
| Icone | `--ic-xs` … `--ic-xl` | 16, 20, 24, 32, 40 px |
| Colonne | `--w-main`, `--w-side`, `--w-rail` | 640, 320, 232 px |

Caratteri: IBM Plex Sans (interfaccia, latino e greco per Ω e µ), IBM Plex Mono (numeri delle unità, codici, bit), STIX Two Math ridotto ai simboli delle formule (MathML). Tutti incorporati, licenza SIL OFL 1.1.

## Tavolozza Ardesia

Scelta dall'autore fra tre proposte applicate all'app vera (le altre due, Rame e Viola elettrico, sono nella storia del repository, tappa 6). Grigio ardesia e giallo segnale, come gli strumenti da banco.

- **Chiaro**: fondo `#F1F3F5`, schede bianche, colore principale ardesia `#263442`, accento giallo `#E0A800` (solo per dettagli e grafica, mai per testo su fondo chiaro: il testo usa `--acc-text` `#7A5C00`).
- **Scuro**: fondo `#0F1317`, colore principale giallo `#FFC93D` con testo scuro sopra.
- Stati: giusto `--good`, sbagliato `--bad`, sempre accompagnati da parola e icona (il colore non è mai l'unico indizio).
- Intestazioni delle unità: `--g-1` classe 3ª (ardesia), `--g-2` classe 4ª (petrolio), `--g-3` classe 5ª (viola), con testo bianco.
- Schemi: conduttori `--sch-wire`, correnti `--sch-cur` (rosso) con freccia piena e nome, tensioni `--sch-vol` (verde) con freccia aperta e nome, nodi `--sch-node`. Correnti e tensioni si distinguono per forma della freccia ed etichetta, non solo per il colore.
- Oscilloscopio e multimetro hanno sempre il fondo scuro (`--scope-bg`), come gli strumenti veri; le tracce si distinguono anche per il tratteggio e per il nome del canale.

## Regole di composizione

- Un solo blocco di colore pieno per schermata oltre all'intestazione dell'unità (di solito il pulsante principale).
- Liste a righe (`.list`, `.rowbtn`) al posto di schede colorate.
- Parole, titoli e numeri con l'unità non si spezzano a metà (`overflow-wrap: normal`, spazio non separabile fra numero e unità generato dal motore). Le formule più larghe della colonna scorrono nel loro riquadro (`.mathbox`, `.mathin`), le tabelle larghe nel loro (`.tbl-wrap`).
- Sul telefono: barra in basso con cinque sezioni. Da 1024 px: menu laterale, colonna centrale di 640 px, pannello dei progressi a destra.
- Movimento ridotto rispettato: niente coriandoli né animazioni d'ingresso.

## Mascotte

Erre, un resistore da 1 kΩ (bande marrone, nero, rosso, oro), scelta dall'autore fra tre proposte. Disegno originale in SVG (`src/guide.js`), contorno uniforme di 3 px a 120 px, reofori metallici con contorno scuro che si vedono sul fondo chiaro e su quello scuro. Cinque espressioni: normale, contenta, pensierosa, triste, esultante. Sotto i 64 px si disegna solo il busto. È decorativa (`aria-hidden`): il testo che accompagna dice tutto da solo.

## Strumenti

- `node tools/audit-tokens.js`: valori fuori dal sistema (deve dire «Nessun valore fuori dal sistema»).
- `node tools/contrast.js [--md]`: 90 coppie di colori in chiaro e in scuro contro le soglie WCAG 2.1 AA.
- `node tools/check-classes.js`: classi usate senza regola e regole senza uso. Le classi segnalate come «senza regola» sono nomi composti nei disegni (`cols-${n}`, `km-g${k}`, `scope-tr${k}`) o gruppi degli SVG che non hanno bisogno di stile.
