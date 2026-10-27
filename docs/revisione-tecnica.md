# Revisione tecnica (da docente)

Revisione dei contenuti fatta alla fine del lavoro, il 27 ottobre 2026, su versione `b17ed3e` e successive.

## Come è stata fatta

1. **Calcoli rifatti a mano.** Per ogni unità ho estratto due problemi di calcolo dalla prova finale (generati dal motore con numeri casuali) e ho rifatto il conto senza il motore. Tutti giusti, fra gli altri: legge di Ohm con i prefissi; serie di tre resistori; partitore con carico (680 Ω ∥ 2,2 kΩ = 519 Ω, V = 104 mV); regola delle 5τ; RC serie in alternata (X_C = 79,6 Ω, Z = 234 Ω, I = 21,4 mA); due diodi a soglia in serie; resistenza del LED scelta per eccesso nella serie E12 (300 Ω → 330 Ω); BJT in saturazione (I_C limitata da R_C a 4,37 mA, non β·I_B); potenza nel MOSFET in conduzione; decibel di potenza e di tensione; isteresi del trigger di Schmitt; semionda con la soglia del diodo (3,83 V); PT100 a 150 °C (158 Ω); errore di quantizzazione Q/2.
2. **Coerenza fra schema e formula.** Per l'astabile con l'operazionale e per il trigger di Schmitt ho controllato che R₁ nello schema sia quella verso massa e R₂ quella dall'uscita, come nella formula β = R₁/(R₁ + R₂).
3. **Riferimenti indipendenti.** I 111 problemi di riferimento dei test (`test/fixtures/riferimento.py`) sono calcolati con formule chiuse, separate dal motore; i transitori sono confrontati con l'integrazione numerica, le minimizzazioni con la tabella di verità completa.
4. **Giocatore automatico.** Tutte le 136 lezioni rigiocate nell'app vera: ogni risposta giusta accettata, tre stelle in ogni lezione.

## Convenzioni dichiarate (in Profilo → Informazioni e in docs/inventario-e-piano.md)

Verso convenzionale della corrente; freccia della tensione verso il morsetto +; convenzione degli utilizzatori sui bipoli passivi e dei generatori sulle sorgenti; in alternata valori efficaci, angoli in gradi, unità immaginaria j; simboli CEI EN 60617; scrittura SI (virgola decimale, spazio fra numero e unità); diodo al silicio a soglia 0,7 V; operazionale ideale.

## Sicurezza

Le attività pratiche (laboratorio libero, misure con il multimetro) sono solo in bassissima tensione continua, fino a 12 V, con l'avvertenza in evidenza. Alcuni problemi di calcolo usano tensioni più alte (24 V per un carico comandato da un MOSFET, 230 V al primario di un trasformatore): sono esercizi sulla carta, e il testo non chiede mai di misurarle. La rete non si misura mai.

## Correzioni fatte durante la revisione

- Le ore («h») non erano riconosciute come unità: ora sì, e «H» (henry) al posto delle ore viene rifiutato.
- Una semplificazione che dà la costante 0 o 1 era giudicata «non minima»: ora è accettata.
- Nel livello Esperto della palestra comparivano risultati intermedi in Ω² (il determinante del metodo delle maglie), che non si possono scrivere con i prefissi: ora si chiedono solo i risultati con un'unità vera.
