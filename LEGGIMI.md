# Elektron — corso guidato di elettronica per l'istituto tecnico

Elektron è un'app web per studenti di 16–19 anni (classi 3ª, 4ª e 5ª, indirizzo Elettronica ed Elettrotecnica):
un percorso a 25 unità con lezioni brevi, palestra di problemi, laboratorio virtuale, teoria, formulario e glossario
italiano–inglese. La guida è Erre, un resistore da 1 kΩ.
Tutto funziona sul dispositivo: nessun account, nessuna intelligenza artificiale, nessun dato inviato a nessuno.

- Sito: https://mirkoc78.github.io/elektron/ (installabile su telefono, funziona senza rete)
- File unico: `dist/elektron.html` (si apre in qualunque browser recente, anche dal disco)

## Per chi sviluppa

| Comando | Che cosa fa |
|---|---|
| `node build.js` | costruisce `dist/elektron.html` e `dist/sito/` |
| `node test/run-all.js` | tutti i test del motore, degli schemi, del controllo delle risposte, del percorso e del salvataggio |
| `node tools/gioca.js` | rigioca tutte le lezioni in Chrome senza finestra (con `PALESTRA=1`: la palestra) |
| `node tools/prova-sito.js` | prova il sito installabile e il service worker |
| `node tools/schermate.js tutte` | schermate a 360 px e su desktop, chiaro e scuro, in `_schermate/` |
| `node tools/audit-tokens.js`, `node tools/contrast.js` | sistema di design e contrasti |
| `bash tools/pubblica.sh "messaggio"` | ricostruisce, prova, controlla i dati riservati, pubblica su GitHub Pages |

Documenti: piano e convenzioni in [docs/inventario-e-piano.md](docs/inventario-e-piano.md), [sistema di design](docs/sistema-design.md),
[accessibilità](docs/accessibilita.md), [revisione delle schermate](docs/revisione-design.md),
[revisione tecnica](docs/revisione-tecnica.md), [punti da verificare](docs/da-verificare.md).

Caratteri: IBM Plex Sans, IBM Plex Mono, STIX Two Math (SIL Open Font License 1.1).
