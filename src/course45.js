/* ELEKTRON — percorso, classi 4ª e 5ª: unità 13–25 (stessa struttura di course3.js). */
(function (root) {
  'use strict';
  const Q = (q, right, ...wrong) => [q, right, ...wrong];
  const T = (id) => ({ id, title: 'Prova d’unità', test: true });
  const ALL = ['p', 'n', 'µ', 'm', '', 'k', 'M'];
  const UNITS = [
  /* ========================= 13. Grandezze sinusoidali ========================= */
  { id: 'u13', title: 'Grandezze sinusoidali', cls: 4, say: 'La corrente della presa di casa non è continua: cambia verso cinquanta volte al secondo, seguendo una sinusoide. Impariamo a descriverla e a vederla con l’oscilloscopio.',
    lessons: [
    { id: 'u13l1', title: 'Periodo e frequenza', sub: 'f = 1/T, hertz', intro: ['q.f', 'q.T', 'f.fT'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Una grandezza **periodica** si ripete uguale dopo un tempo $T$, il **periodo**. La **frequenza** $f$ dice quante volte si ripete in un secondo: si misura in **hertz** (Hz). La rete elettrica in Europa è a 50 Hz.', scope: { traces: [{ Vp: 2, f: 1000 }], vdiv: [1], tdiv: 0.0002 }, q: Q('Che cosa misura la frequenza?', 'quante volte al secondo il segnale si ripete', 'quanto è grande il segnale', 'quanto dura il segnale in tutto') },
        { f: 'f = 1/T', leg: [['f', 'frequenza', 'Hz'], ['T', 'periodo', 's']], inv: ['T = 1/f'], q: { gen: 'sin.fT' } }],
      mix: ['sin.fT', 'sin.fT', 's:sin.fT', 'sin.fT', 'abbina.grandezze', 'sin.fT', 's:sin.fT', 'sin.fT'] },
    { id: 'u13l2', title: 'Valore di picco, efficace e medio', sub: 'V_eff = V_p/√2', intro: ['q.Vp', 'q.Veff', 'f.eff', 'f.medio'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Il **valore di picco** $V_p$ è il massimo della sinusoide; il **picco-picco** $V_{pp} = 2 * V_p$ è la distanza fra massimo e minimo. Il **valore efficace** è la tensione continua che darebbe la stessa potenza su un resistore: per una sinusoide $V_{eff} = V_p/sqrt(2)$.', q: { gen: 'sin.valori' } },
        { f: 'V_{eff} = V_p/sqrt(2)', leg: [['V_{eff}', 'valore efficace', 'V'], ['V_p', 'valore di picco', 'V']], inv: ['V_p = V_{eff} * sqrt(2)'], q: { gen: 'sin.valori' } },
        { p: 'I **230 V** della rete sono un valore **efficace**: il picco è più alto. I multimetri in alternata mostrano il valore efficace. Il **valore medio** di una sinusoide su un periodo è zero; dopo il raddrizzamento vale $V_p/pi$ (semionda) o $2 * V_p/pi$ (doppia semionda).', q: Q('Il valore medio di una sinusoide su un periodo intero è…', 'zero', 'il valore di picco', 'il valore efficace') }],
      mix: ['sin.valori', 'sin.valori', 's:sin.valori', 'sin.medio', 'sin.valori', 'sin.medio', 'sin.fT', 's:sin.valori', 'sin.valori'] },
    { id: 'u13l3', title: 'Pulsazione e fase', sub: 'ω = 2π·f, radianti, sfasamento', intro: ['q.w', 'f.omega', 'q.phi', 'm.rad', 'f.fase'], num: 'free', prefixes: ALL,
      teach: [
        { math: true, p: 'Gli angoli si misurano anche in **radianti**: un giro completo è $2 * pi$ rad, cioè 360°. Per passare dai gradi ai radianti si moltiplica per $pi/180$.', q: { gen: 'sin.radianti' } },
        { f: 'omega = 2 * pi * f', leg: [['omega', 'pulsazione', 'rad/s'], ['f', 'frequenza', 'Hz']], q: { gen: 'sin.omega' } },
        { p: 'Una sinusoide si scrive $v(t) = V_p * sin(omega * t + phi)$. La **fase** $phi$ dice di quanto è spostata nel tempo. Due sinusoidi della stessa frequenza sfasate di $Delta t$ hanno uno **sfasamento** $phi = 360° * {Delta t}/T$: quella che arriva prima al massimo è **in anticipo**.', scope: { traces: [{ Vp: 3, f: 1000 }, { Vp: 2, f: 1000, phase: -60 }], vdiv: [1, 1], tdiv: 0.0002 }, q: { gen: 'sin.fase' } }],
      mix: ['sin.omega', 'sin.radianti', 'sin.fase', 's:sin.omega', 'sin.fase', 'sin.radianti', 'sin.omega', 'sin.fase'] },
    { id: 'u13l4', title: 'L’oscilloscopio', sub: 'V/div, s/div, lettura di un segnale', intro: ['c.osc'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'L’**oscilloscopio** disegna la tensione in funzione del tempo su una griglia di **divisioni**. La manopola **V/div** dice quanti volt vale una divisione in verticale; la **base dei tempi** (s/div) quanti secondi vale una divisione in orizzontale.', q: { gen: 'osc.lettura' } },
        { p: 'Per leggere un segnale: conti le divisioni dal centro al picco e moltiplichi per V/div (ampiezza); conti le divisioni di un periodo e moltiplichi per s/div (periodo); poi $f = 1/T$.', q: { gen: 'osc.lettura' } },
        { warn: 'In laboratorio l’oscilloscopio si usa su segnali in bassissima tensione (generatore di funzioni, circuiti a 12 V): mai sulla rete.', q: Q('Su quali segnali usi l’oscilloscopio in laboratorio?', 'su segnali in bassissima tensione', 'sulla presa di rete', 'su qualunque segnale') }],
      mix: ['osc.lettura', 'osc.lettura', 'osc.lettura', 'sin.fT', 'osc.lettura', 'sin.valori', 'osc.lettura', 'osc.lettura'] },
    Object.assign(T('u13t'), { mix: ['sin.fT', 'sin.valori', 'sin.medio', 'sin.omega', 'sin.fase', 'sin.radianti', 'osc.lettura', 'osc.lettura', 'sin.valori', 'sin.fT'] }),
    ] },

  /* ========================= 14. Complessi, fasori, impedenza ========================= */
  { id: 'u14', title: 'Numeri complessi, fasori e impedenza', cls: 4, say: 'In alternata resistori, condensatori e induttori sfasano tensione e corrente. Con i numeri complessi i circuiti in alternata si risolvono come quelli in continua.',
    lessons: [
    { id: 'u14l1', title: 'I numeri complessi', sub: 'a + jb, forma polare', intro: ['m.cx'], num: 'free', prefixes: ALL,
      teach: [
        { math: true, p: 'Un **numero complesso** si scrive $z = a + j * b$: $a$ è la **parte reale**, $b$ la **parte immaginaria**, e $j$ è l’unità immaginaria, con $j^2 = -1$. (In elettronica si usa $j$ invece di $i$, che indica la corrente.)', q: Q('Quanto vale j²?', '−1', '1', 'j') },
        { math: true, p: 'In **forma polare** lo stesso numero è un vettore: **modulo** $|z| = sqrt(a^2 + b^2)$ e **argomento** $phi = arctan(b/a)$ (attenzione al quadrante se $a$ è negativo). Si scrive $|z|∠phi$.', q: { gen: 'cx.polare' } },
        { math: true, p: 'Le **somme** si fanno in forma algebrica (reale con reale, immaginaria con immaginaria); i **prodotti** e le **divisioni** in forma polare (moduli moltiplicati o divisi, angoli sommati o sottratti).', q: { gen: 'cx.operazioni' } }],
      mix: ['cx.polare', 'cx.operazioni', 'cx.polare', 'cx.operazioni', 'cx.polare', 'cx.operazioni', 'cx.polare', 'cx.operazioni'] },
    { id: 'u14l2', title: 'I fasori', sub: 'una sinusoide come vettore', intro: ['k.fasori'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Una sinusoide di frequenza nota è descritta da due numeri, **ampiezza e fase**: si rappresenta con un vettore, il **fasore**, lungo quanto il valore efficace e ruotato dell’angolo di fase. Il fasore è un numero complesso.', q: Q('Un fasore descrive di una sinusoide…', 'il valore efficace e la fase', 'solo la frequenza', 'solo il valore di picco') },
        { p: 'Sommare due sinusoidi della **stessa frequenza** vuol dire sommare i loro fasori come numeri complessi: il risultato è ancora una sinusoide della stessa frequenza.', q: { gen: 'cx.operazioni' } }],
      bank: [Q('Si possono sommare con i fasori due sinusoidi…', 'della stessa frequenza', 'di qualunque frequenza', 'solo se hanno la stessa ampiezza'), Q('L’angolo del fasore rappresenta…', 'la fase della sinusoide', 'la frequenza', 'il periodo')],
      mix: ['cx.operazioni', 'domande', 'cx.polare', 'cx.operazioni', 'domande', 'cx.polare', 'cx.operazioni', 'cx.polare'] },
    { id: 'u14l3', title: 'Le reattanze', sub: 'X_L = ωL, X_C = 1/(ωC)', intro: ['q.X', 'f.XL', 'f.XC'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'In alternata un induttore si oppone alla corrente con la **reattanza induttiva**, che **cresce** con la frequenza; un condensatore con la **reattanza capacitiva**, che **cala** con la frequenza. Le reattanze si misurano in ohm.', q: Q('Aumentando la frequenza, la reattanza di un condensatore…', 'diminuisce', 'aumenta', 'resta uguale') },
        { f: 'X_L = 2 * pi * f * L', leg: [['X_L', 'reattanza induttiva', 'Ω'], ['L', 'induttanza', 'H']], inv: ['X_C = 1/{2 * pi * f * C}'], q: { gen: 'reattanza' } },
        { p: 'Nell’induttore la tensione è **in anticipo di 90°** sulla corrente; nel condensatore è **in ritardo di 90°**. Nel resistore sono in fase. Con i complessi: $Z_L = j * X_L$, $Z_C = -j * X_C$, $Z_R = R$.', q: Q('Nel condensatore, la tensione rispetto alla corrente è…', 'in ritardo di 90°', 'in anticipo di 90°', 'in fase') }],
      mix: ['reattanza', 'reattanza', 's:reattanza', 'reattanza', 'sin.omega', 'reattanza', 's:reattanza', 'reattanza'] },
    { id: 'u14l4', title: 'Circuiti RC e RL in serie', sub: 'impedenza, modulo e sfasamento', intro: ['q.Z', 'f.Z'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { p: 'L’**impedenza** di un resistore in serie a una reattanza è $Z = R + j * X$ ($X$ positiva per l’induttore, negativa per il condensatore). Il modulo **non** è la somma: resistenza e reattanza sono a 90°, si sommano come i lati di un triangolo rettangolo.', q: Q('Il modulo dell’impedenza di R e X in serie vale…', '√(R² + X²)', 'R + X', 'R · X') },
        { f: '|Z| = sqrt(R^2 + X^2)', leg: [['|Z|', 'modulo dell’impedenza', 'Ω'], ['phi', 'sfasamento, arctan(X/R)', '°']], q: { gen: 'ac.serie' } },
        { ex: 'ac.serie', q: Q('In un circuito RC serie la corrente è…', 'in anticipo sulla tensione', 'in ritardo sulla tensione', 'in fase con la tensione') }],
      mix: ['ac.serie', 'ac.serie', 'o:ac.serie', 's:ac.serie', 'reattanza', 'ac.serie', 'ac.serie', 's:ac.serie', 'ac.serie'] },
    { id: 'u14l5', title: 'Circuiti RLC e reti in alternata', sub: 'X = X_L − X_C', intro: ['k.rlc'], num: 'free', prefixes: ALL, level: 3,
      teach: [
        { p: 'Con induttore e condensatore in serie le reattanze hanno **segno opposto** e si sottraggono: $X = X_L - X_C$. Se prevale $X_L$ il circuito è **induttivo** (corrente in ritardo), se prevale $X_C$ è **capacitivo** (corrente in anticipo).', q: Q('Se X_C > X_L, il circuito RLC serie è…', 'capacitivo', 'induttivo', 'puramente resistivo') },
        { ex: 'ac.serie', q: Q('Tutti i metodi delle reti in continua (partitori, Thevenin, sovrapposizione) in alternata…', 'valgono con le impedenze complesse', 'non valgono più', 'valgono solo con i moduli') }],
      mix: ['ac.serie', 'ac.serie', 'o:ac.serie', 'ac.serie', 's:ac.serie', 'ac.serie', 'reattanza', 'ac.serie'] },
    Object.assign(T('u14t'), { level: 2, mix: ['cx.polare', 'cx.operazioni', 'reattanza', 'ac.serie', 'ac.serie', 'reattanza', 'cx.polare', 'ac.serie', 'reattanza', 'ac.serie'] }),
    ] },

  /* ========================= 15. Potenze in alternata e risonanza ========================= */
  { id: 'u15', title: 'Potenze in alternata, rifasamento, risonanza', cls: 4, say: 'In alternata non tutta la potenza che passa nei fili fa lavoro utile. E quando le reattanze si bilanciano succede qualcosa di speciale: la risonanza.',
    lessons: [
    { id: 'u15l1', title: 'Potenza attiva, reattiva e apparente', sub: 'P, Q, S e cos φ', intro: ['q.Qr', 'q.S', 'f.PQS'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'La **potenza attiva** $P = V * I * cos(phi)$ (watt) è quella che diventa lavoro o calore. La **reattiva** $Q = V * I * sin(phi)$ (var) va e viene fra generatore e reattanze. L’**apparente** $S = V * I$ (VA) è quella che i fili devono portare. Formano un **triangolo**: $S^2 = P^2 + Q^2$.', q: { gen: 'ac.potenze' } },
        { p: '$cos(phi)$ è il **fattore di potenza**: vale 1 per un carico resistivo, meno di 1 per un motore o un trasformatore.', q: Q('Il fattore di potenza di un carico puramente resistivo vale…', '1', '0', '0,5') }],
      mix: ['ac.potenze', 'ac.potenze', 's:ac.potenze', 'ac.potenze', 'ac.serie', 'ac.potenze', 's:ac.potenze', 'ac.potenze'] },
    { id: 'u15l2', title: 'Il rifasamento', sub: 'il condensatore che riduce la potenza reattiva', intro: ['f.rifasamento'], num: 'free', prefixes: ALL, level: 3,
      teach: [
        { p: 'Un carico induttivo (un motore) assorbe potenza reattiva: con lo stesso lavoro utile i fili portano più corrente e scaldano di più. Si **rifasa** mettendo un condensatore in parallelo: la sua potenza reattiva, di segno opposto, compensa quella del motore.', q: Q('A che cosa serve rifasare?', 'a ridurre la corrente nei fili a parità di potenza attiva', 'ad aumentare la potenza del motore', 'a cambiare la frequenza') },
        { f: 'C = {P * (tan(phi_1) - tan(phi_2))}/{omega * V^2}', leg: [['phi_1', 'sfasamento prima', '°'], ['phi_2', 'sfasamento dopo', '°']], q: { gen: 'rifasamento' } },
        { warn: 'Il rifasamento riguarda gli impianti alimentati dalla rete: qui lo studiamo solo con il calcolo.', q: Q('In laboratorio si monta un rifasamento sulla rete?', 'no: solo calcolo', 'sì, con un condensatore qualunque', 'sì, se il motore è piccolo') }],
      mix: ['rifasamento', 'rifasamento', 'o:rifasamento', 'ac.potenze', 'rifasamento', 's:rifasamento', 'ac.potenze', 'rifasamento'] },
    { id: 'u15l3', title: 'Risonanza serie', sub: 'f₀ = 1/(2π√(LC)), fattore di merito', intro: ['f.f0'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { p: 'In un RLC serie c’è una frequenza in cui $X_L = X_C$: le reattanze si annullano, l’impedenza è solo $R$ (minima) e la corrente è **massima** e in fase con la tensione. È la **risonanza**.', q: Q('Alla risonanza, l’impedenza di un RLC serie…', 'è minima e vale R', 'è massima', 'è zero sempre') },
        { f: 'f_0 = 1/{2 * pi * sqrt(L * C)}', leg: [['f_0', 'frequenza di risonanza', 'Hz']], q: { gen: 'risonanza' } },
        { p: 'Il **fattore di merito** $Q = X_0/R$ dice quanto la risonanza è «stretta»: la **banda** (larghezza di banda) è $B = f_0/Q$. È il principio dei circuiti di sintonia delle radio.', q: Q('Un fattore di merito alto vuol dire…', 'una banda stretta: il circuito sceglie bene la frequenza', 'una banda larga', 'nessuna risonanza') }],
      mix: ['risonanza', 'risonanza', 's:risonanza', 'risonanza', 'reattanza', 'risonanza', 'risonanza', 's:risonanza'] },
    { id: 'u15l4', title: 'Risonanza parallelo', sub: 'il circuito antirisonante', intro: ['k.antirisonanza'], num: 'free', prefixes: ALL, level: 3,
      teach: [
        { p: 'Con L e C **in parallelo**, alla stessa frequenza $f_0 = 1/{2 * pi * sqrt(L * C)}$ le correnti dei due rami sono uguali e opposte: la corrente totale è **minima** e l’impedenza **massima**. Si usa per scegliere una frequenza, per esempio negli oscillatori.', q: Q('Alla risonanza, l’impedenza di un LC parallelo ideale è…', 'massima', 'minima', 'zero') }],
      bank: [Q('Nel risonante parallelo ideale, alla risonanza, la corrente fornita dal generatore è…', 'minima', 'massima', 'uguale a quella del ramo L'), Q('La frequenza di risonanza del parallelo ideale è…', 'la stessa del serie: 1/(2π√(LC))', 'il doppio', 'la metà')],
      mix: ['risonanza', 'domande', 'risonanza', 'domande', 'risonanza', 'reattanza', 'risonanza', 'risonanza'] },
    Object.assign(T('u15t'), { level: 2, mix: ['ac.potenze', 'ac.potenze', 'risonanza', 'risonanza', 'ac.potenze', 'risonanza', 'ac.serie', 'ac.potenze', 'risonanza', 'reattanza'] }),
    ] },

  /* ========================= 16. Reti sequenziali ========================= */
  { id: 'u16', title: 'Reti sequenziali', cls: 4, say: 'Le reti combinatorie non ricordano niente: l’uscita dipende solo dagli ingressi di adesso. Le reti sequenziali hanno memoria, e con un clock contano, memorizzano, scandiscono il tempo.',
    lessons: [
    { id: 'u16l1', title: 'Il latch SR', sub: 'una memoria di un bit', intro: ['l.sr'], num: 'free',
      teach: [
        { p: 'Due porte NOR con le uscite riportate agli ingressi formano un **latch SR**: con **S = 1** l’uscita va a 1 (set), con **R = 1** va a 0 (reset), con **S = R = 0** resta com’era (memoria). **S = R = 1** è la combinazione **vietata**.', q: { gen: 'latch.SR' } }],
      bank: [Q('Con S = 0 e R = 0 il latch SR…', 'mantiene lo stato precedente', 'va a 0', 'va a 1'), Q('Perché S = R = 1 è vietata nel latch a NOR?', 'porta entrambe le uscite a 0 e lo stato dopo è incerto', 'brucia le porte', 'non succede niente')],
      mix: ['latch.SR', 'latch.SR', 'domande', 'latch.SR', 'latch.SR', 'domande', 'latch.SR', 'latch.SR'] },
    { id: 'u16l2', title: 'Il flip-flop D e il clock', sub: 'fronte di salita, diagrammi temporali', intro: ['l.ff'], num: 'free',
      teach: [
        { p: 'Il **flip-flop D** copia l’ingresso D sull’uscita Q **solo sul fronte di salita del clock**; per il resto del tempo Q non cambia, qualunque cosa faccia D. Nel simbolo il clock è segnato con un triangolino.', ff: 'D', q: { gen: 'ff.sequenza' } },
        { timing: 'D', p: 'Nel **diagramma temporale** si disegnano clock, ingressi e uscite uno sotto l’altro: si guarda il valore di D nell’istante di ogni fronte di salita.', q: { gen: 'ff.sequenza' } }],
      mix: ['ff.sequenza', 'ff.sequenza', 'ff.sequenza', 'latch.SR', 'ff.sequenza', 'ff.sequenza', 'ff.sequenza', 'ff.sequenza'] },
    { id: 'u16l3', title: 'I flip-flop JK e T', sub: 'mantenere, impostare, commutare', intro: ['l.jk'], num: 'free',
      teach: [
        { tbl: { c: ['J', 'K', 'Q dopo il fronte'], r: [['0', '0', 'resta uguale'], ['0', '1', '0'], ['1', '0', '1'], ['1', '1', 'commuta (si inverte)']] }, ff: 'JK', q: { gen: 'ff.sequenza' } },
        { p: 'Il **flip-flop T** (toggle) è un JK con J = K = T: con T = 1 commuta a ogni fronte, con T = 0 resta fermo. Commutando a ogni fronte divide per due la frequenza del clock.', q: { gen: 'ff.sequenza' } }],
      mix: ['ff.sequenza', 'ff.sequenza', 'ff.sequenza', 'ff.sequenza', 'latch.SR', 'ff.sequenza', 'ff.sequenza', 'ff.sequenza'] },
    { id: 'u16l4', title: 'I contatori', sub: 'asincroni, sincroni, modulo N, divisori di frequenza', intro: ['l.cont'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Mettendo in fila flip-flop T, ognuno comandato dall’uscita del precedente, si ottiene un **contatore asincrono**: con $n$ flip-flop conta da 0 a $2^n - 1$ e ricomincia. In un **contatore sincrono** tutti i flip-flop ricevono lo stesso clock e cambiano insieme.', timing: 'contatore', q: { gen: 'contatore' } },
        { p: 'Un contatore **modulo N** conta da 0 a N − 1: quando arriva a N una rete combinatoria lo **azzera**. Servono almeno $n$ flip-flop con $2^n >= N$. Ogni flip-flop divide la frequenza per 2: l’ultimo di $n$ dà $f/2^n$.', q: { gen: 'contatore.bit' } }],
      mix: ['contatore', 'contatore.bit', 'divisore.f', 'contatore', 'contatore.bit', 'divisore.f', 'contatore', 'num.bin2dec', 'contatore'] },
    { id: 'u16l5', title: 'I registri', sub: 'parallelo e a scorrimento', intro: ['l.reg'], num: 'free',
      teach: [
        { p: 'Un **registro** è un gruppo di flip-flop D con lo stesso clock: memorizza una **parola** di bit. In un **registro a scorrimento** l’uscita di ogni flip-flop va all’ingresso del successivo: a ogni clock i bit si spostano di un posto. Così si passa da un dato seriale a uno parallelo (SIPO) e viceversa (PISO).', q: { gen: 'registro' } }],
      mix: ['registro', 'registro', 'ff.sequenza', 'registro', 'contatore', 'registro', 'registro', 'ff.sequenza'] },
    Object.assign(T('u16t'), { mix: ['latch.SR', 'ff.sequenza', 'ff.sequenza', 'contatore', 'contatore.bit', 'divisore.f', 'registro', 'ff.sequenza', 'contatore', 'registro'] }),
    ] },

  /* ========================= 17. Diodi ========================= */
  { id: 'u17', title: 'Semiconduttori e diodi', cls: 4, say: 'Con i semiconduttori entriamo nell’elettronica vera. Il primo componente è il diodo: una valvola a senso unico per la corrente.',
    lessons: [
    { id: 'u17l1', title: 'Giunzione PN e modelli del diodo', sub: 'ideale e a soglia (0,7 V)', intro: ['c.D', 'f.diodo'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Il silicio puro conduce poco. **Drogandolo** con piccole quantità di altri elementi si ottengono il tipo **N** (elettroni in più) e il tipo **P** (lacune, cioè elettroni mancanti). Unendo le due zone si forma una **giunzione PN**: è il diodo.', q: Q('Che cosa ha in più un semiconduttore di tipo N?', 'elettroni liberi', 'lacune', 'protoni') },
        { p: 'Il diodo conduce quando l’**anodo** (zona P) è più positivo del **catodo** (zona N): **polarizzazione diretta**. Al contrario è **interdetto**. Nel simbolo CEI il triangolo indica il verso della corrente, la barretta è il catodo. Un diodo da raddrizzamento comune è l’**1N4007**.', q: { gen: 'diodo.stato' } },
        { p: 'Due **modelli** scolastici: il diodo **ideale** (in conduzione è un filo, interdetto un circuito aperto) e il diodo **a soglia**: in conduzione ha ai capi circa **0,7 V** (silicio). In questo corso, salvo avviso, usiamo il modello a soglia.', q: { gen: 'diodo.I' } }],
      bank: [Q('Nella polarizzazione inversa il diodo…', 'non conduce (solo una minima corrente di perdita)', 'conduce meglio', 'si comporta come un resistore da 1 kΩ'), Q('La barretta nel simbolo del diodo indica…', 'il catodo', 'l’anodo', 'il verso degli elettroni')],
      mix: ['diodo.stato', 'diodo.I', 'domande', 'diodo.I', 'diodo.stato', 's:diodo.I', 'domande', 'diodo.I', 'diodo.stato'] },
    { id: 'u17l2', title: 'Circuiti con diodi', sub: 'diodi in serie, porte a diodi', intro: ['k.diodi'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Per risolvere un circuito con diodi si fa un’**ipotesi** (conduce o non conduce), si calcola, e si **controlla**: se un diodo supposto in conduzione risulta con la corrente al contrario, o uno interdetto con più di 0,7 V ai capi, l’ipotesi era sbagliata.', q: Q('Se un diodo supposto in conduzione risulta attraversato da corrente negativa…', 'l’ipotesi è sbagliata: il diodo è interdetto', 'il diodo è guasto', 'va bene così') },
        { ex: 'diodo.I', q: Q('Due diodi al silicio in serie, in conduzione, hanno ai capi circa…', '1,4 V in tutto', '0,7 V in tutto', '0 V') }],
      mix: ['diodo.I', 'diodo.I', 'diodo.stato', 's:diodo.I', 'diodo.I', 'ohm.I', 'diodo.stato', 'diodo.I'] },
    { id: 'u17l3', title: 'Il LED', sub: 'la resistenza di limitazione', intro: ['c.LED', 'f.led'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Il **LED** è un diodo che emette luce quando conduce. La tensione in conduzione $V_F$ dipende dal colore: circa 1,8–2 V per rosso e giallo, 2–3 V per verde, 3 V per blu e bianco. La corrente tipica è di 10–20 mA.', q: Q('Un LED collegato senza resistenza a 9 V…', 'si brucia: la corrente non è limitata', 'si accende normalmente', 'non si accende') },
        { f: 'R = {V - V_F}/I_F', leg: [['R', 'resistenza di limitazione', 'Ω'], ['V_F', 'tensione del LED in conduzione', 'V'], ['I_F', 'corrente del LED', 'A']], q: { gen: 'led.R' } },
        { p: 'Il valore calcolato quasi mai è commerciale: si sceglie il valore **E12 subito sopra**, così la corrente resta un po’ sotto quella voluta. Poi si controlla la potenza nel resistore.', q: { gen: 'led.R' } }],
      mix: ['led.R', 'led.R', 's:led.R', 'led.R', 'diodo.I', 'led.R', 'o:led.R', 'led.R'] },
    { id: 'u17l4', title: 'I raddrizzatori', sub: 'semionda, ponte di Graetz, filtro', intro: ['f.raddr', 'f.ondulazione'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { p: 'Il **raddrizzatore a semionda** lascia passare solo le semionde positive: un diodo in serie al carico. Il **ponte di Graetz** (quattro diodi) le raddrizza tutte e due: doppia semionda. Nel ponte, in ogni semionda conducono **due** diodi in serie.', tpl: { name: 'rectifier', kind: 'ponte', p: { C: 0, RL: 100, V2: 12 } }, q: Q('Nel ponte di Graetz, in ogni semionda, quanti diodi conducono?', 'due', 'uno', 'quattro') },
        { p: 'La tensione di picco sul carico è quella di picco del secondario meno le soglie dei diodi che conducono. Un **condensatore di filtro** in parallelo al carico si carica ai picchi e alimenta il carico fra un picco e l’altro: resta una piccola **ondulazione**.', q: { gen: 'raddrizzatore' } },
        { warn: 'Il trasformatore è collegato alla rete. In laboratorio si lavora solo sul secondario in bassissima tensione, con il trasformatore già cablato e chiuso.', q: Q('In laboratorio, su quale parte dell’alimentatore si misura?', 'sul secondario in bassissima tensione', 'sul primario a 230 V', 'su entrambi') }],
      mix: ['raddrizzatore', 'raddrizzatore', 'o:raddrizzatore', 'sin.valori', 'raddrizzatore', 's:raddrizzatore', 'raddrizzatore', 'sin.medio', 'raddrizzatore'] },
    { id: 'u17l5', title: 'Lo Zener e lo stabilizzatore', sub: 'una tensione fissa', intro: ['c.DZ', 'f.zener'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { p: 'Il **diodo Zener** si usa in **polarizzazione inversa**: quando la tensione arriva a $V_Z$ comincia a condurre e mantiene ai capi quasi esattamente $V_Z$. Con una resistenza in serie forma uno **stabilizzatore**.', q: Q('Lo Zener, nello stabilizzatore, è montato…', 'con il catodo verso il +, in inversa', 'in diretta', 'in serie al carico') },
        { f: 'I_Z = I_R - I_L', leg: [['I_R', '(V − V_Z)/R', 'A'], ['I_L', 'V_Z/R_L', 'A']], q: { gen: 'zener' } },
        { p: 'Prima si controlla che lo Zener **lavori**: senza Zener, sul carico ci sarebbe $V * R_L/{R + R_L}$; se è minore di $V_Z$, lo Zener non conduce e non stabilizza.', q: { gen: 'zener' } }],
      mix: ['zener', 'zener', 'o:zener', 's:zener', 'zener', 'led.R', 'zener', 'zener'] },
    Object.assign(T('u17t'), { level: 2, mix: ['diodo.stato', 'diodo.I', 'led.R', 'raddrizzatore', 'zener', 'diodo.I', 'led.R', 'raddrizzatore', 'zener', 'diodo.stato'] }),
    ] },

  /* ========================= 18. BJT ========================= */
  { id: 'u18', title: 'Il transistor BJT', cls: 4, say: 'Il transistor è il componente che ha cambiato il mondo: una piccola corrente ne comanda una grande. Lo useremo come interruttore e come amplificatore.',
    lessons: [
    { id: 'u18l1', title: 'Struttura e guadagno', sub: 'collettore, base, emettitore, I_C = β·I_B', intro: ['c.Q', 'f.beta'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Il **BJT** (transistor bipolare) ha tre zone, **NPN** o **PNP**, e tre terminali: **collettore** (C), **base** (B), **emettitore** (E). Nel simbolo la freccia sta sull’emettitore: uscente nell’NPN, entrante nel PNP. Un NPN comune per piccoli segnali è il **BC547**.', q: Q('Nel simbolo dell’NPN, la freccia sull’emettitore è…', 'uscente', 'entrante', 'assente') },
        { f: 'I_C = beta * I_B', leg: [['I_C', 'corrente di collettore', 'A'], ['I_B', 'corrente di base', 'A'], ['beta', 'guadagno di corrente (h_FE)', '']], inv: ['I_E = I_C + I_B'], q: { gen: 'bjt.guadagno' } }],
      mix: ['bjt.guadagno', 'bjt.guadagno', 's:bjt.guadagno', 'bjt.guadagno', 'bjt.guadagno', 's:bjt.guadagno', 'bjt.guadagno', 'bjt.guadagno'] },
    { id: 'u18l2', title: 'Zone di funzionamento', sub: 'interdizione, zona attiva, saturazione', intro: ['k.zone'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { tbl: { c: ['Zona', 'Condizione', 'Comportamento'], r: [['interdizione', 'V_BE < 0,7 V', 'I_B = I_C = 0: interruttore aperto'], ['zona attiva', 'V_BE ≈ 0,7 V e V_CE > 0,2 V', 'I_C = β·I_B: amplifica'], ['saturazione', 'β·I_B maggiore di quella che il circuito permette', 'V_CE ≈ 0,2 V: interruttore chiuso']] }, q: { gen: 'bjt.base' } },
        { p: 'Il **metodo**: calcoli $I_B = {V_{in} - V_{BE}}/R_B$; calcoli la corrente di saturazione $I_{C,sat} = {V_{CC} - V_{CE,sat}}/R_C$; se $beta * I_B$ è minore, sei in zona attiva ($I_C = beta * I_B$), altrimenti sei in saturazione ($I_C = I_{C,sat}$).', q: { gen: 'bjt.base' } }],
      mix: ['bjt.base', 'bjt.base', 'o:bjt.base', 'bjt.base', 's:bjt.base', 'bjt.guadagno', 'bjt.base', 'bjt.base'] },
    { id: 'u18l3', title: 'La polarizzazione', sub: 'punto di lavoro, partitore e resistenza di emettitore', intro: ['k.polarizzazione'], num: 'free', prefixes: ALL, level: 3,
      teach: [
        { p: 'Per amplificare, il transistor deve lavorare in zona attiva a metà strada: è il **punto di lavoro**. Con la **polarizzazione a partitore** $R_1$ e $R_2$ fissano la tensione di base e $R_E$ stabilizza la corrente anche se $beta$ cambia.', tpl: { name: 'bjt', kind: 'partitore', p: { R1: 47000, R2: 10000, RC: 2200, RE: 1000 } }, q: Q('A che cosa serve R_E nella polarizzazione a partitore?', 'a stabilizzare la corrente di collettore', 'ad accendere il transistor', 'a limitare la tensione di alimentazione') },
        { p: 'Metodo scolastico (partitore «rigido»): si trascura la corrente di base, $V_B = V_{CC} * R_2/{R_1 + R_2}$, $V_E = V_B - V_{BE}$, $I_C ≈ I_E = V_E/R_E$, $V_{CE} = V_{CC} - I_C * (R_C + R_E)$.', q: { gen: 'bjt.partitore' } }],
      mix: ['bjt.partitore', 'bjt.partitore', 'o:bjt.partitore', 'bjt.partitore', 's:bjt.partitore', 'bjt.base', 'bjt.partitore', 'bjt.partitore'] },
    { id: 'u18l4', title: 'Il BJT come interruttore', sub: 'saturazione sicura, relè e diodo di ricircolo', intro: ['k.interruttore'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { p: 'Per accendere un carico (un LED, un relè) con un’uscita digitale, il transistor deve andare **in saturazione**: si calcola la corrente di base minima $I_{C,sat}/beta$ e la si moltiplica per un **fattore di sovrasaturazione** (2 o 3), perché $beta$ varia da un esemplare all’altro.', tpl: { name: 'bjt', kind: 'led', p: { RB: 10000, RC: 330 } }, q: { gen: 'bjt.interruttore' } },
        { p: 'Con un **relè** la bobina è un induttore: allo spegnimento produce una sovratensione che può distruggere il transistor. Si mette in parallelo alla bobina un **diodo di ricircolo**, con il catodo verso il +.', tpl: { name: 'bjt', kind: 'rele', p: { RB: 4700 } }, q: Q('Il diodo in parallelo alla bobina del relè è montato…', 'con il catodo verso il +: normalmente non conduce', 'con l’anodo verso il +', 'in serie alla bobina') }],
      mix: ['bjt.interruttore', 'bjt.interruttore', 'o:bjt.interruttore', 'bjt.base', 'bjt.interruttore', 's:bjt.interruttore', 'bjt.base', 'bjt.interruttore'] },
    Object.assign(T('u18t'), { level: 2, mix: ['bjt.guadagno', 'bjt.base', 'bjt.base', 'bjt.partitore', 'bjt.interruttore', 'bjt.guadagno', 'bjt.base', 'bjt.interruttore', 'bjt.partitore', 'bjt.base'] }),
    ] },

  /* ========================= 19. MOSFET e famiglie logiche ========================= */
  { id: 'u19', title: 'MOSFET e famiglie logiche', cls: 4, say: 'Il MOSFET è il transistor dei circuiti digitali: miliardi in ogni processore. Lo vediamo come interruttore, e poi scopriamo come sono fatte dentro le porte logiche.',
    lessons: [
    { id: 'u19l1', title: 'Il MOSFET ad arricchimento', sub: 'gate, drain, source, soglia', intro: ['c.M', 'f.mos'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Il **MOSFET a canale N ad arricchimento** ha tre terminali: **gate** (G), **drain** (D), **source** (S). Il gate è isolato: non assorbe corrente in continua. Quando $V_{GS}$ supera la **tensione di soglia** $V_{GS(th)}$ si forma un canale fra drain e source.', tpl: { name: 'mosfet', p: { RD: 100 } }, q: Q('Quanta corrente assorbe il gate di un MOSFET in continua?', 'praticamente zero: è isolato', 'come la base di un BJT', 'quella del carico') },
        { p: 'Come interruttore, acceso, il MOSFET è una piccola resistenza $R_{DS(on)}$ (decimi di ohm o meno): dissipa $P = R_{DS(on)} * I_D^2$. Spento, è un circuito aperto.', q: { gen: 'mos.ID' } }],
      mix: ['mos.ID', 'mos.ID', 's:mos.ID', 'mos.ID', 'bjt.interruttore', 'mos.ID', 's:mos.ID', 'mos.ID'] },
    { id: 'u19l2', title: 'Il MOSFET come interruttore per carichi', sub: 'comando da un microcontrollore', intro: ['k.mosinterruttore'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Con un MOSFET a canale N sul lato basso (source a massa) un’uscita a 5 V, come quella di una scheda **Arduino UNO**, accende motorini, strisce LED, elettrovalvole a 12 V. Serve un MOSFET «**logic level**», che conduce bene già con $V_{GS}$ = 5 V.', q: Q('Perché si usa un MOSFET «logic level» con Arduino?', 'perché conduce bene già con 5 V sul gate', 'perché costa meno', 'perché lavora a 230 V') },
        { p: 'Una resistenza fra gate e source (qualche decina di kΩ) tiene spento il MOSFET quando il microcontrollore non comanda; una piccola resistenza in serie al gate limita gli impulsi di corrente. Con carichi induttivi serve il **diodo di ricircolo**.', q: Q('A che cosa serve la resistenza fra gate e source?', 'a tenere spento il MOSFET quando il gate non è comandato', 'ad accenderlo', 'a misurare la corrente') }],
      bank: [Q('Con il MOSFET sul lato basso, il carico è collegato…', 'fra l’alimentazione e il drain', 'fra source e massa', 'sul gate'), Q('Un motorino comandato da un MOSFET richiede…', 'un diodo di ricircolo in parallelo', 'un condensatore in serie al gate', 'niente altro')],
      mix: ['mos.ID', 'domande', 'mos.ID', 'domande', 'mos.ID', 'bjt.interruttore', 'mos.ID', 'mos.ID'] },
    { id: 'u19l3', title: 'Livelli TTL e CMOS', sub: 'V_OH, V_IH, V_IL, V_OL, margini di rumore', intro: ['l.famiglie'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Per una porta logica non conta il valore esatto della tensione ma la **fascia**: un’uscita alta è sopra $V_{OH}$, una bassa sotto $V_{OL}$; un ingresso riconosce come alto ciò che supera $V_{IH}$ e come basso ciò che sta sotto $V_{IL}$.', q: { gen: 'famiglie.margine' } },
        { p: 'Il **margine di rumore** è quanto disturbo si può sommare senza errori: $N_{MH} = V_{OH} - V_{IH}$, $N_{ML} = V_{IL} - V_{OL}$. Le famiglie storiche sono la **TTL** (74LS…) e la **CMOS** (74HC…, 4000): la CMOS consuma pochissimo da ferma e ha margini più ampi.', q: { gen: 'famiglie.compatibili' } }],
      mix: ['famiglie.margine', 'famiglie.compatibili', 'famiglie.margine', 'famiglie.margine', 'famiglie.compatibili', 'famiglie.margine', 'famiglie.margine', 'famiglie.compatibili'] },
    { id: 'u19l4', title: 'L’inverter CMOS', sub: 'un MOSFET N e un MOSFET P', intro: ['k.cmos'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'L’**inverter CMOS** ha un MOSFET a canale **P** verso l’alimentazione e uno a canale **N** verso massa, con i gate uniti. Con ingresso alto conduce l’N e l’uscita va a 0; con ingresso basso conduce il P e l’uscita va a $V_{DD}$. Uno dei due è sempre spento: da fermo non passa corrente.', q: Q('Nell’inverter CMOS con ingresso alto, quale MOSFET conduce?', 'quello a canale N', 'quello a canale P', 'tutti e due') }],
      bank: [Q('Quando consuma di più una porta CMOS?', 'durante le commutazioni', 'da ferma con uscita alta', 'da ferma con uscita bassa'), Q('Perché gli ingressi CMOS non vanno lasciati scollegati?', 'perché restano a un livello incerto e possono oscillare', 'perché si bruciano subito', 'perché consumano corrente continua'), Q('Il consumo di un processore CMOS cresce con…', 'la frequenza di clock', 'il colore del contenitore', 'il numero di piedini')],
      mix: ['domande', 'domande', 'famiglie.margine', 'domande', 'famiglie.compatibili', 'domande', 'mos.ID', 'domande'] },
    Object.assign(T('u19t'), { mix: ['mos.ID', 'mos.ID', 'famiglie.margine', 'famiglie.compatibili', 'domande', 'mos.ID', 'famiglie.margine', 'domande', 'mos.ID', 'famiglie.compatibili'], bank: [Q('Il gate di un MOSFET…', 'è isolato e non assorbe corrente in continua', 'assorbe la corrente del carico', 'è collegato al drain'), Q('Nell’inverter CMOS da fermo…', 'uno dei due MOSFET è sempre spento', 'conducono sempre tutti e due', 'il consumo è massimo')] }),
    ] },

  /* ========================= 20. Operazionali ========================= */
  { id: 'u20', title: 'Amplificatori operazionali', cls: 4, say: 'L’operazionale è un amplificatore quasi perfetto in un piccolo integrato. Con due resistori decidi tu il guadagno. È il mattone di filtri, oscillatori, condizionatori.',
    lessons: [
    { id: 'u20l1', title: 'L’operazionale ideale e il comparatore', sub: 'guadagno infinito, cortocircuito virtuale', intro: ['c.OA', 'f.comparatore'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'L’operazionale **ideale** ha guadagno infinito, **ingressi che non assorbono corrente** e uscita che può dare qualunque corrente. Si alimenta di solito in modo **duale** (±12 V o ±15 V): l’uscita non può superare queste tensioni (**saturazione**). Nel simbolo il triangolo ha l’ingresso invertente (−) e quello non invertente (+).', q: Q('Quanta corrente entra negli ingressi di un operazionale ideale?', 'zero', 'la corrente di uscita', 'qualche ampere') },
        { p: 'Senza retroazione (**ad anello aperto**) il guadagno enorme manda subito l’uscita in saturazione: l’operazionale è un **comparatore**. Uscita a $+V_{sat}$ se $V_+ > V_-$, a $-V_{sat}$ se $V_+ < V_-$.', tpl: { name: 'opamp', kind: 'comparatore', p: { Vin: 2, Vref: 1 } }, q: { gen: 'oa.comparatore' } },
        { p: 'Con la **retroazione negativa** (un collegamento dall’uscita all’ingresso −) l’uscita si porta dove serve per rendere $V_+ = V_-$: è il **cortocircuito virtuale**. Da qui si ricavano tutte le formule degli amplificatori.', q: Q('Con la retroazione negativa, in un operazionale ideale…', 'V₊ = V₋ (cortocircuito virtuale)', 'l’uscita è sempre in saturazione', 'gli ingressi assorbono molta corrente') }],
      bank: [Q('Un comparatore con V₊ > V₋ dà in uscita…', '+V_sat', '−V_sat', '0 V')],
      mix: ['oa.comparatore', 'oa.comparatore', 'domande', 's:oa.comparatore', 'oa.comparatore', 'oa.comparatore', 'domande', 'oa.comparatore'] },
    { id: 'u20l2', title: 'L’amplificatore invertente', sub: 'A_v = −R_f/R₁', intro: ['f.oa'], num: 'free', prefixes: ALL,
      teach: [
        { tpl: { name: 'opamp', kind: 'invertente', p: { R1: 1000, Rf: 10000 } }, p: 'L’ingresso + è a massa; per il cortocircuito virtuale anche il − è a 0 V (**massa virtuale**). La corrente in $R_1$ è $V_{in}/R_1$, non entra nell’operazionale e passa tutta in $R_f$.', q: Q('Nell’invertente, a quale tensione si trova l’ingresso −?', '0 V (massa virtuale)', 'V_in', 'V_out') },
        { f: 'A_v = -R_f/R_1', leg: [['A_v', 'guadagno di tensione', ''], ['R_f', 'resistenza di retroazione', 'Ω'], ['R_1', 'resistenza d’ingresso', 'Ω']], inv: ['V_{out} = A_v * V_{in}'], q: { gen: 'oa.amplificatore' } },
        { p: 'Il segno meno vuol dire che l’uscita è **in opposizione di fase**: se l’ingresso sale, l’uscita scende.', q: { gen: 'oa.amplificatore' } }],
      mix: ['oa.amplificatore', 'oa.amplificatore', 's:oa.amplificatore', 'oa.amplificatore', 'oa.comparatore', 'oa.amplificatore', 's:oa.amplificatore', 'oa.amplificatore'] },
    { id: 'u20l3', title: 'Non invertente e inseguitore', sub: 'A_v = 1 + R_f/R₁', intro: ['f.noninv'], num: 'free', prefixes: ALL,
      teach: [
        { tpl: { name: 'opamp', kind: 'non-invertente', p: { R1: 1000, Rf: 4700 } }, f: 'A_v = 1 + R_f/R_1', leg: [['A_v', 'guadagno del non invertente', '']], q: { gen: 'oa.amplificatore' } },
        { tpl: { name: 'opamp', kind: 'inseguitore', p: {} }, p: 'Con l’uscita collegata direttamente al − ($R_f = 0$) il guadagno è 1: è l’**inseguitore di tensione** (buffer). Non amplifica, ma ha ingresso che non assorbe corrente e uscita robusta: separa un circuito delicato dal carico.', q: Q('A che cosa serve un inseguitore se ha guadagno 1?', 'a separare la sorgente dal carico senza caricarla', 'a invertire il segnale', 'a raddoppiare la tensione') }],
      mix: ['oa.amplificatore', 'oa.amplificatore', 's:oa.amplificatore', 'oa.amplificatore', 'oa.amplificatore', 'oa.comparatore', 'oa.amplificatore', 's:oa.amplificatore'] },
    { id: 'u20l4', title: 'Sommatore e differenziale', sub: 'mescolare e sottrarre segnali', intro: ['f.sommatore', 'f.differenziale'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { tpl: { name: 'opamp', kind: 'sommatore', p: { V: [1, 1], R: [10000, 10000], Rf: 20000 } }, f: 'V_{out} = -R_f * (V_1/R_1 + V_2/R_2)', leg: [['V_1, V_2', 'tensioni d’ingresso', 'V']], q: { gen: 'oa.sommatore' } },
        { tpl: { name: 'opamp', kind: 'differenziale', p: { R1: 10000, Rf: 20000 } }, f: 'V_{out} = R_2/R_1 * (V_2 - V_1)', leg: [['V_2 - V_1', 'differenza degli ingressi', 'V']], q: { gen: 'oa.differenziale' } }],
      mix: ['oa.sommatore', 'oa.differenziale', 'oa.sommatore', 's:oa.sommatore', 'oa.differenziale', 'oa.amplificatore', 'oa.sommatore', 'oa.differenziale'] },
    { id: 'u20l5', title: 'Saturazione e limiti', sub: 'l’uscita non supera l’alimentazione', intro: ['f.saturazione'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { p: 'Se il calcolo dà un’uscita oltre l’alimentazione, l’operazionale **satura**: l’uscita si ferma a $±V_{sat}$, poco sotto le tensioni di alimentazione. Con una sinusoide troppo ampia si vedono i picchi «tagliati» (clipping).', q: { gen: 'oa.saturazione' } },
        { p: 'Un operazionale vero ha anche altri limiti: guadagno grande ma non infinito, una banda limitata (il prodotto guadagno × banda è costante) e una velocità massima di variazione dell’uscita (**slew rate**). Un integrato storico e diffusissimo è il µA741.', q: Q('Che cosa succede a una sinusoide amplificata oltre la saturazione?', 'i picchi vengono tagliati', 'raddoppia la frequenza', 'diventa continua') }],
      mix: ['oa.saturazione', 'oa.saturazione', 'oa.amplificatore', 's:oa.saturazione', 'oa.saturazione', 'oa.amplificatore', 'oa.saturazione', 'oa.amplificatore'] },
    Object.assign(T('u20t'), { level: 2, mix: ['oa.comparatore', 'oa.amplificatore', 'oa.amplificatore', 'oa.sommatore', 'oa.differenziale', 'oa.saturazione', 'oa.amplificatore', 'oa.comparatore', 'oa.sommatore', 'oa.saturazione'] }),
    ] },

  /* ========================= 21. Filtri e Bode ========================= */
  { id: 'u21', title: 'Filtri del primo ordine e diagrammi di Bode', cls: 4, say: 'Un resistore e un condensatore bastano a separare i suoni gravi da quelli acuti. Impariamo a descrivere i filtri con i decibel e con i diagrammi di Bode.',
    lessons: [
    { id: 'u21l1', title: 'I decibel', sub: 'ripasso dei logaritmi, G = 20·log', intro: ['q.dB', 'm.log', 'f.dB'], num: 'free', prefixes: ALL,
      teach: [
        { math: true, p: 'Il **logaritmo in base 10** di un numero è l’esponente a cui elevare 10 per ottenerlo: $log(100) = 2$ perché $10^2 = 100$; $log(1) = 0$; il logaritmo di un numero fra 0 e 1 è negativo. Il logaritmo di un prodotto è la somma dei logaritmi.', q: Q('Quanto vale log(1000)?', '3', '1000', '30') },
        { f: 'G_{dB} = 20 * log(V_{out}/V_{in})', leg: [['G_{dB}', 'guadagno in decibel', 'dB']], inv: ['A = 10^{G_{dB}/20}'], q: { gen: 'db' } },
        { p: 'Per le **potenze** si usa $10 * log$. Un guadagno positivo in dB vuol dire che il segnale cresce, negativo che si attenua. $\`-3 dB\`$ è il punto in cui la tensione è scesa a circa il 71 % (e la potenza a metà).', q: { gen: 'db' } }],
      mix: ['db', 'db', 's:db', 'db', 'db', 's:db', 'db', 'db'] },
    { id: 'u21l2', title: 'Il filtro passa-basso RC', sub: 'f_c = 1/(2πRC)', intro: ['q.fc', 'f.fc'], num: 'free', prefixes: ALL,
      teach: [
        { schema: { ladder: { cols: [[{ id: 'V1', t: 'V', ac: true, label: 'v_in' }], [{ id: 'C1', t: 'C', v: 100e-9 }]], top: [[{ id: 'R1', t: 'R', v: 1000 }]] }, opts: { voltages: [{ el: 'C1', label: 'v_{out}' }] } }, p: 'Nel **passa-basso** RC l’uscita è presa sul condensatore. A bassa frequenza il condensatore è quasi un aperto e l’uscita vale quanto l’ingresso; ad alta frequenza la sua reattanza è piccola e l’uscita si attenua.', q: Q('Un passa-basso lascia passare…', 'le frequenze basse e attenua le alte', 'le frequenze alte', 'solo la continua, mai l’alternata') },
        { f: 'f_c = 1/{2 * pi * R * C}', leg: [['f_c', 'frequenza di taglio', 'Hz']], q: { gen: 'filtro' } },
        { p: 'Alla **frequenza di taglio** l’uscita è a $\`-3 dB\`$ e sfasata di $-45°$. Molto oltre $f_c$ il modulo cala di 20 dB per decade (ogni volta che la frequenza si moltiplica per 10).', q: { gen: 'filtro' } }],
      mix: ['filtro', 'filtro', 's:filtro', 'filtro', 'db', 'filtro', 'filtro', 's:filtro'] },
    { id: 'u21l3', title: 'Il filtro passa-alto RC', sub: 'il condensatore in serie', intro: ['f.passaalto'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { schema: { ladder: { cols: [[{ id: 'V1', t: 'V', ac: true, label: 'v_in' }], [{ id: 'R1', t: 'R', v: 1000 }]], top: [[{ id: 'C1', t: 'C', v: 100e-9 }]] }, opts: { voltages: [{ el: 'R1', label: 'v_{out}' }] } }, p: 'Nel **passa-alto** si scambiano i posti: il condensatore è in serie, l’uscita sul resistore. Blocca la continua e le frequenze basse, lascia passare le alte. La frequenza di taglio ha la stessa formula; alla $f_c$ lo sfasamento è $+45°$.', q: Q('Un condensatore in serie a un segnale…', 'blocca la componente continua', 'la lascia passare tutta', 'la raddoppia') },
        { ex: 'filtro', q: { gen: 'filtro' } }],
      mix: ['filtro', 'filtro', 'o:filtro', 's:filtro', 'filtro', 'filtro', 'db', 'filtro'] },
    { id: 'u21l4', title: 'Diagrammi di Bode asintotici', sub: 'decadi, −20 dB/decade', intro: ['f.bode'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { plot: { kind: 'bode', fc: 1000, kindF: 'basso' }, p: 'Il **diagramma di Bode** del modulo ha la frequenza su scala **logaritmica** e il guadagno in dB. Per un filtro del primo ordine si approssima con due rette, gli **asintoti**: orizzontale a 0 dB fino a $f_c$, poi inclinata di $-20$ dB per decade (passa-basso). La curva vera sta 3 dB sotto il punto d’angolo.', q: { gen: 'bode' } }],
      mix: ['bode', 'bode', 'filtro', 'bode', 's:bode', 'db', 'bode', 'bode'] },
    { id: 'u21l5', title: 'Filtri attivi del primo ordine', sub: 'il filtro con l’operazionale', intro: ['f.attivo'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { tpl: { name: 'opamp', kind: 'passa-basso', p: { R1: 1000, Rf: 10000, C: 10e-9 } }, p: 'Mettendo il condensatore nella rete di un invertente si ottiene un **filtro attivo**: nel **passa-basso** il condensatore è in parallelo a $R_f$, nel **passa-alto** in serie a $R_1$. In banda passante il guadagno è $K = -R_f/R_1$; l’uscita, robusta, non risente del carico.', q: { gen: 'filtro.attivo' } }],
      mix: ['filtro.attivo', 'filtro.attivo', 's:filtro.attivo', 'filtro', 'filtro.attivo', 'bode', 'filtro.attivo', 'filtro.attivo'] },
    Object.assign(T('u21t'), { level: 2, mix: ['db', 'db', 'filtro', 'filtro', 'bode', 'filtro.attivo', 'filtro', 'bode', 'filtro.attivo', 'db'] }),
    ] },

  /* ========================= 22. Generatori di forme d'onda ========================= */
  { id: 'u22', title: 'Generatori di forme d’onda', cls: 5, say: 'Ogni circuito digitale ha bisogno di un clock, ogni allarme di un suono. Vediamo i circuiti che generano da soli onde quadre e sinusoidi.',
    lessons: [
    { id: 'u22l1', title: 'Il trigger di Schmitt', sub: 'due soglie, isteresi', intro: ['f.schmitt'], num: 'free', prefixes: ALL,
      teach: [
        { tpl: { name: 'opamp', kind: 'schmitt', p: { R1: 10000, R2: 47000 } }, p: 'Un comparatore con una **retroazione positiva** (dall’uscita all’ingresso +) ha **due soglie**: una per il passaggio da alto a basso e una per il ritorno. La differenza fra le soglie è l’**isteresi**: rende il comparatore insensibile ai disturbi piccoli.', q: Q('A che cosa serve l’isteresi?', 'a evitare commutazioni ripetute per un segnale disturbato', 'ad amplificare di più', 'a generare una sinusoide') },
        { f: 'V_T = V_{sat} * R_1/{R_1 + R_2}', leg: [['V_T', 'soglia (positiva e negativa)', 'V']], q: { gen: 'schmitt' } }],
      mix: ['schmitt', 'schmitt', 's:schmitt', 'schmitt', 'oa.comparatore', 'schmitt', 's:schmitt', 'schmitt'] },
    { id: 'u22l2', title: 'L’astabile con l’operazionale', sub: 'Schmitt e rete RC', intro: ['f.astabile'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { tpl: { name: 'opamp', kind: 'astabile', p: {} }, p: 'Collegando un trigger di Schmitt a una rete RC si ottiene un **astabile**: il condensatore si carica verso l’uscita finché raggiunge una soglia, l’uscita commuta, il condensatore si scarica verso l’altra soglia, e così via. In uscita c’è un’**onda quadra**.', q: Q('Che forma d’onda ha l’uscita dell’astabile?', 'quadra', 'sinusoidale', 'continua') },
        { f: 'T = 2 * R * C * ln({1 + beta}/{1 - beta})', leg: [['beta', 'R₁/(R₁ + R₂)', '']], q: { gen: 'astabile' } }],
      mix: ['astabile', 'astabile', 's:astabile', 'schmitt', 'astabile', 'astabile', 'schmitt', 'astabile'] },
    { id: 'u22l3', title: 'Il NE555 astabile', sub: 't_H, t_L, frequenza, duty cycle', intro: ['c.555', 'f.555a'], num: 'free', prefixes: ALL,
      teach: [
        { tpl: { name: 'ne555', kind: 'astabile', p: { RA: 1000, RB: 10000, C: 100e-9 } }, p: 'Il **NE555** contiene due comparatori con soglie a 1/3 e 2/3 di $V_{CC}$, un flip-flop e un transistor di scarica. Nell’**astabile** il condensatore si carica attraverso $R_A + R_B$ e si scarica attraverso $R_B$: la tensione oscilla fra $V_{CC}/3$ e $2 * V_{CC}/3$.', q: Q('Fra quali tensioni oscilla il condensatore del 555 astabile?', 'fra 1/3 e 2/3 di V_CC', 'fra 0 e V_CC', 'fra −V_CC e +V_CC') },
        { f: 't_H = 0,693 * (R_A + R_B) * C', leg: [['t_H', 'uscita alta', 's'], ['t_L', '0,693 · R_B · C, uscita bassa', 's']], inv: ['t_L = 0,693 * R_B * C', 'f = 1/{t_H + t_L}'], q: { gen: 'ne555' } },
        { p: 'Il **duty cycle** è la frazione del periodo con l’uscita alta: $D = t_H/T$. Nell’astabile classico è sempre maggiore del 50 %, perché la carica passa per $R_A + R_B$ e la scarica solo per $R_B$.', q: { gen: 'ne555' } }],
      mix: ['ne555', 'ne555', 'o:ne555', 's:ne555', 'ne555', 'ne555', 'astabile', 'ne555'] },
    { id: 'u22l4', title: 'Il NE555 monostabile', sub: 'un impulso di durata fissa', intro: ['f.555m'], num: 'free', prefixes: ALL,
      teach: [
        { tpl: { name: 'ne555', kind: 'monostabile', p: { R: 100000, C: 10e-6 } }, p: 'Nel **monostabile** un impulso sul piedino di trigger porta l’uscita alta; il condensatore si carica attraverso $R$ e, quando arriva a $2 * V_{CC}/3$, l’uscita torna bassa. La durata dell’impulso non dipende da quanto dura il trigger.', q: Q('Da che cosa dipende la durata dell’impulso del monostabile?', 'da R e C', 'da quanto premi il pulsante', 'da V_CC soltanto') },
        { f: 'T = 1,1 * R * C', leg: [['T', 'durata dell’impulso', 's']], q: { gen: 'ne555.mono' } }],
      mix: ['ne555.mono', 'ne555.mono', 's:ne555.mono', 'ne555', 'ne555.mono', 'ne555.mono', 'ne555', 'ne555.mono'] },
    { id: 'u22l5', title: 'L’oscillatore a ponte di Wien', sub: 'una sinusoide', intro: ['f.wien'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Per generare una **sinusoide** serve un amplificatore e una rete che, a una sola frequenza, riporti all’ingresso un segnale in fase e della giusta ampiezza (**condizione di Barkhausen**: guadagno d’anello 1, sfasamento 0°). Nel **ponte di Wien** la rete RC attenua di 3 volte alla frequenza $f_0$: l’amplificatore non invertente deve avere guadagno 3.', q: Q('Quanto deve valere il guadagno dell’amplificatore nel ponte di Wien?', '3', '1', '10') },
        { f: 'f_0 = 1/{2 * pi * R * C}', leg: [['f_0', 'frequenza di oscillazione', 'Hz']], inv: ['R_f = 2 * R_1'], q: { gen: 'wien' } }],
      mix: ['wien', 'wien', 's:wien', 'wien', 'ne555', 'wien', 'schmitt', 'wien'] },
    Object.assign(T('u22t'), { mix: ['schmitt', 'astabile', 'ne555', 'ne555', 'ne555.mono', 'wien', 'schmitt', 'ne555', 'wien', 'astabile'] }),
    ] },

  /* ========================= 23. Conversione A/D e D/A ========================= */
  { id: 'u23', title: 'Conversione A/D e D/A', cls: 5, say: 'Il mondo è analogico, i microcontrollori sono digitali. In mezzo ci sono i convertitori: trasformano una tensione in un numero, e un numero in una tensione.',
    lessons: [
    { id: 'u23l1', title: 'Il campionamento', sub: 'teorema di Nyquist-Shannon, aliasing', intro: ['f.nyquist'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Per convertire un segnale lo si **campiona**: se ne prende il valore a intervalli regolari, con frequenza di campionamento $f_s$. Il **teorema del campionamento** (Nyquist, Shannon) dice che per ricostruirlo serve $f_s >= 2 * f_{max}$.', q: { gen: 'campionamento' } },
        { p: 'Se si campiona troppo lentamente, una frequenza alta si presenta come una frequenza più bassa che non c’è: è l’**aliasing**. Per evitarlo si mette prima del convertitore un filtro passa-basso (anti-aliasing).', q: { gen: 'campionamento' } }],
      bank: [Q('I CD audio campionano a 44,1 kHz perché…', 'l’udito arriva a circa 20 kHz e serve almeno il doppio', 'è la frequenza della rete', 'è un numero a caso')],
      mix: ['campionamento', 'campionamento', 'domande', 's:campionamento', 'campionamento', 'campionamento', 'filtro', 'campionamento'] },
    { id: 'u23l2', title: 'La quantizzazione', sub: 'livelli, quanto, errore', intro: ['f.quanto'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Un convertitore a $n$ bit distingue $2^n$ livelli. Il **quanto** (o risoluzione) è il salto di tensione fra un livello e il successivo: $Q = V_{FS}/2^n$, con $V_{FS}$ la tensione di fondo scala.', q: { gen: 'adc' } },
        { p: 'In questa app il convertitore **arrotonda** al livello più vicino: l’**errore di quantizzazione** è al massimo $Q/2$. (Alcuni convertitori troncano: allora l’errore arriva a $Q$.) Più bit vogliono dire quanto più piccolo e meno errore.', q: { gen: 'adc' } }],
      mix: ['adc', 'adc', 's:adc', 'adc', 'num.dec2bin', 'adc', 's:adc', 'adc'] },
    { id: 'u23l3', title: 'Il convertitore D/A', sub: 'resistori pesati e rete R-2R', intro: ['f.dac'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { p: 'Il **convertitore D/A** dà una tensione proporzionale al codice: $V_{out} = N * Q$. Il **D/A a resistori pesati** usa un sommatore con l’operazionale: ogni bit pilota un resistore di valore doppio del precedente ($R$, $2 * R$, $4 * R$…), così pesa la metà.', q: { gen: 'dac.pesato' } },
        { p: 'La **rete R-2R** usa solo due valori di resistenza, $R$ e $2 * R$, per qualunque numero di bit: è più facile da costruire con precisione, ed è la più usata negli integrati.', q: { gen: 'adc' } }],
      mix: ['adc', 'dac.pesato', 'adc', 's:dac.pesato', 'dac.pesato', 'adc', 'oa.sommatore', 'dac.pesato'] },
    { id: 'u23l4', title: 'I convertitori A/D', sub: 'flash e ad approssimazioni successive', intro: ['c.arduino'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { p: 'Il convertitore **flash** confronta la tensione con $2^n - 1$ comparatori insieme: velocissimo ma con molti componenti. Quello ad **approssimazioni successive** (SAR) prova un bit alla volta, dal più significativo, come in una ricerca per dimezzamenti: è il più diffuso.', q: Q('Il convertitore ad approssimazioni successive trova il codice…', 'un bit alla volta, dal più significativo', 'con 2ⁿ comparatori insieme', 'contando gli impulsi da zero') },
        { p: 'La scheda **Arduino UNO** ha un A/D ad approssimazioni successive a **10 bit** con riferimento di 5 V: legge da 0 a 1023. (La funzione di Arduino tronca il valore; qui, negli esercizi generali, si arrotonda.)', q: { gen: 'arduino' } }],
      mix: ['adc', 'arduino', 'adc', 'arduino', 's:adc', 'arduino', 'adc', 'campionamento'] },
    Object.assign(T('u23t'), { level: 2, mix: ['campionamento', 'adc', 'adc', 'dac.pesato', 'arduino', 'adc', 'campionamento', 'arduino', 'adc', 'dac.pesato'] }),
    ] },

  /* ========================= 24. Alimentatori ========================= */
  { id: 'u24', title: 'Alimentatori', cls: 5, say: 'Ogni apparecchio elettronico ha dentro un alimentatore: prende i 230 V della rete e li trasforma in una tensione continua bassa e stabile. Lo smontiamo blocco per blocco, sulla carta.',
    lessons: [
    { id: 'u24l1', title: 'Schema a blocchi e trasformatore', sub: 'V₂ = V₁·N₂/N₁', intro: ['c.T', 'f.trasf'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Un alimentatore lineare ha quattro blocchi: **trasformatore** (abbassa la tensione), **raddrizzatore** (la rende di un solo verso), **filtro** (la livella), **regolatore** (la rende stabile).', q: Q('Qual è il blocco che rende la tensione stabile al variare del carico?', 'il regolatore', 'il trasformatore', 'il raddrizzatore') },
        { f: 'V_2 = V_1 * N_2/N_1', leg: [['V_1, V_2', 'tensioni efficaci al primario e al secondario', 'V'], ['N_1, N_2', 'numero di spire', '']], q: { gen: 'trasformatore' } },
        { warn: 'Il primario del trasformatore è collegato alla rete a 230 V: in laboratorio non si apre, non si misura e non si collega. Si usano solo alimentatori e trasformatori già chiusi, con il secondario in bassissima tensione.', q: Q('Il primario del trasformatore, in laboratorio…', 'non si tocca e non si misura', 'si misura con il multimetro', 'si collega con i morsetti a coccodrillo') }],
      mix: ['trasformatore', 'trasformatore', 's:trasformatore', 'trasformatore', 'sin.valori', 'trasformatore', 'trasformatore', 's:trasformatore'] },
    { id: 'u24l2', title: 'Raddrizzatore e filtro', sub: 'ondulazione e tensione continua', intro: ['k.filtro'], num: 'free', prefixes: ALL, level: 3,
      teach: [
        { tpl: { name: 'rectifier', kind: 'ponte', p: { C: 1000e-6, RL: 100, V2: 12 } }, p: 'Dopo il ponte, il condensatore di filtro si carica al picco e si scarica nel carico fra un picco e l’altro. L’**ondulazione** picco-picco vale circa $V_r = I/{2 * f * C}$ con il ponte (i picchi sono due per periodo, a 100 Hz). La tensione continua media è circa $V_p - V_r/2$.', q: { gen: 'raddrizzatore' } },
        { ex: 'raddrizzatore', q: Q('Per ridurre l’ondulazione a parità di carico…', 'si aumenta la capacità del filtro', 'si riduce la capacità', 'si toglie il condensatore') }],
      mix: ['raddrizzatore', 'raddrizzatore', 'o:raddrizzatore', 's:raddrizzatore', 'raddrizzatore', 'trasformatore', 'raddrizzatore', 'raddrizzatore'] },
    { id: 'u24l3', title: 'I regolatori lineari', sub: '7805, LM317, potenza dissipata', intro: ['f.regolatore', 'f.lm317'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Un **regolatore lineare** (per esempio il **7805**, che dà 5 V) tiene l’uscita costante «bruciando» la differenza di tensione: dissipa $P = (V_{in} - V_{out}) * I$. Serve qualche volt di margine fra ingresso e uscita, e spesso un dissipatore.', q: { gen: 'regolatore' } },
        { f: 'V_{out} = \`1,25 V\` * (1 + R_2/R_1)', leg: [['R_1', 'fra uscita e ADJ', 'Ω'], ['R_2', 'fra ADJ e massa', 'Ω']], q: { gen: 'lm317' } }],
      mix: ['regolatore', 'lm317', 'regolatore', 's:lm317', 'lm317', 'regolatore', 's:regolatore', 'lm317'] },
    { id: 'u24l4', title: 'Cenni agli alimentatori switching', sub: 'rendimento alto, commutazione', intro: ['f.rendimento'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Un alimentatore **switching** non dissipa la differenza di tensione: un transistor commuta velocemente (decine o centinaia di kHz) e un induttore con un condensatore livellano l’uscita. Il **rendimento** $eta = P_{out}/P_{in}$ arriva al 90 % e oltre, e il trasformatore, se c’è, è piccolissimo.', q: { gen: 'switching' } }],
      bank: [Q('Perché i caricabatterie moderni sono piccoli e leggeri?', 'perché sono switching: lavorano ad alta frequenza', 'perché hanno un trasformatore a 50 Hz più grande', 'perché non hanno componenti'), Q('Lo svantaggio di uno switching rispetto a un lineare è…', 'un po’ di disturbo ad alta frequenza in uscita', 'il rendimento più basso', 'il peso maggiore')],
      mix: ['switching', 'switching', 'domande', 'regolatore', 'switching', 'domande', 'lm317', 'switching'] },
    Object.assign(T('u24t'), { level: 2, mix: ['trasformatore', 'raddrizzatore', 'raddrizzatore', 'regolatore', 'lm317', 'switching', 'trasformatore', 'regolatore', 'lm317', 'switching'] }),
    ] },

  /* ========================= 25. Trasduttori ========================= */
  { id: 'u25', title: 'Trasduttori e acquisizione dati', cls: 5, say: 'Per misurare temperatura, luce, distanza servono i trasduttori: trasformano una grandezza fisica in un segnale elettrico. Poi il segnale va adattato all’ingresso del convertitore.',
    lessons: [
    { id: 'u25l1', title: 'Caratteristiche dei sensori', sub: 'campo di misura, sensibilità, linearità', intro: ['f.sensibilita'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Di un sensore interessano il **campo di misura** (da quanto a quanto misura), la **sensibilità** (quanto cambia l’uscita per ogni unità della grandezza misurata), la **linearità** (se la caratteristica è una retta) e il **tempo di risposta**.', q: { gen: 'sensibilita' } }],
      bank: [Q('La sensibilità di un sensore di temperatura si misura in…', 'volt (o ohm) per grado', 'gradi per secondo', 'watt'), Q('Un sensore lineare ha una caratteristica…', 'a retta', 'a esponenziale', 'a gradini')],
      mix: ['sensibilita', 'domande', 'sensibilita', 'domande', 'sensibilita', 'sensibilita', 'domande', 'sensibilita'] },
    { id: 'u25l2', title: 'Sensori di temperatura', sub: 'PT100, NTC, LM35', intro: ['c.pt100', 'f.pt100', 'c.lm35', 'f.lm35', 'c.ntc', 'f.ntc'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { f: 'R = R_0 * (1 + alpha * T)', leg: [['R_0', 'resistenza a 0 °C (100 Ω per la PT100)', 'Ω'], ['alpha', '0,00385 /°C', '1/°C']], p: 'La **PT100** è un filo di platino: la sua resistenza cresce con la temperatura, in modo quasi lineare.', q: { gen: 'pt100' } },
        { p: 'Il **termistore NTC** è un semiconduttore: la resistenza **scende**, e molto, quando la temperatura sale; la caratteristica è esponenziale, con le temperature in kelvin. L’**LM35** è un sensore integrato con uscita già in tensione: 10 mV per grado Celsius.', q: { gen: 'lm35' } }],
      mix: ['pt100', 'lm35', 'ntc', 'pt100', 'lm35', 's:pt100', 'ntc', 'lm35'] },
    { id: 'u25l3', title: 'Sensori di luce', sub: 'fotoresistore e fotodiodo', intro: ['c.ldr'], num: 'free', prefixes: ALL,
      teach: [
        { p: 'Il **fotoresistore** (LDR) ha una resistenza che **scende** con la luce: al buio può valere centinaia di kΩ, in pieno sole poche centinaia di ohm. In un **partitore** con un resistore fisso diventa una tensione che si legge con un A/D.', schema: { ladder: { cols: [[{ id: 'V1', t: 'V', v: 5 }], [{ id: 'RS', t: 'R', kind: 'LDR', label: '' }]], top: [[{ id: 'R1', t: 'R', v: 10000 }]] }, opts: { voltages: [{ el: 'RS', label: 'V_{out}' }] } }, q: { gen: 'ldr' } },
        { p: 'Il **fotodiodo** in polarizzazione inversa lascia passare una corrente proporzionale alla luce: è più veloce e più lineare dell’LDR.', q: Q('Con più luce, la resistenza di un LDR…', 'scende', 'sale', 'resta uguale') }],
      mix: ['ldr', 'ldr', 's:ldr', 'ldr', 'partitore.V2', 'ldr', 'simbolo', 'ldr'] },
    { id: 'u25l4', title: 'Condizionamento e acquisizione', sub: 'guadagno, offset, catena di misura', intro: ['f.condizionamento'], num: 'free', prefixes: ALL, level: 2,
      teach: [
        { p: 'La **catena di acquisizione**: sensore → **condizionamento** → convertitore A/D → microcontrollore. Il condizionamento adatta il segnale: lo amplifica e lo sposta (**offset**) perché il campo del sensore occupi tutto il campo d’ingresso dell’A/D, da 0 a $V_{FS}$.', q: { gen: 'condizionamento' } },
        { f: 'V_{out} = G * (V_S - V_{min})', leg: [['G', 'V_FS/(V_max − V_min)', ''], ['V_{min}', 'uscita minima del sensore', 'V']], q: { gen: 'condizionamento' } }],
      mix: ['condizionamento', 'condizionamento', 's:condizionamento', 'adc', 'condizionamento', 'lm35', 'condizionamento', 'arduino'] },
    Object.assign(T('u25t'), { level: 2, mix: ['sensibilita', 'pt100', 'lm35', 'ntc', 'ldr', 'condizionamento', 'condizionamento', 'pt100', 'lm35', 'ldr'] }),
    ] },
  ];
  root.ELEK_COURSE45 = UNITS;
  if (typeof module !== 'undefined') module.exports = UNITS;
})(typeof window !== 'undefined' ? window : globalThis);
