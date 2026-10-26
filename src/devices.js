/* ELEKTRON — dispositivi: diodi, LED, Zener, raddrizzatori, BJT, MOSFET, operazionale, trigger di Schmitt, astabili,
   NE555, ponte di Wien, trasformatore, regolatori, sensori. Modelli scolastici dichiarati (docs/inventario-e-piano.md):
   diodo a soglia 0,7 V; BJT con V_BE = 0,7 V, V_CE,sat = 0,2 V, I_C = β·I_B in zona attiva; operazionale ideale con
   l'uscita limitata a ±V_sat; NE555 con le soglie a 1/3 e 2/3 di V_CC.
   Ogni risolutore restituisce { sym, u, v, steps, mistakes } come in solve.js; accept elenca altri valori accettati
   (per esempio il calcolo esatto accanto a quello approssimato che si usa a scuola). */
(function (root) {
  'use strict';
  const U = root.ElekUnits || require('./units.js');
  const MA = root.ElekMath || require('./math.js');
  const Q = (o) => (v, u, paren) => MA.q(v, u, { prefixes: o.prefixes, sig: o.sig ?? 3, paren });
  const num = (v, d = 3) => '`' + U.num(v, { sig: d }) + '`';
  const step = (f, s, v, u) => ({ f, s, v, u });
  const sol = (sym, u, v, steps, mistakes = [], extra = {}) => Object.assign({ sym, u, v, steps, mistakes: mistakes.filter((m) => isFinite(m.v) && Math.abs(m.v - v) > 1e-15) }, extra);
  const VBE = 0.7, VCES = 0.2, VF = 0.7;

  /* ======================= Diodi ======================= */
  // p = { V, R, n (diodi in serie, 1), model: 'soglia' | 'ideale', vf }
  function diode(p, o = {}) {
    const q = Q(o);
    const n = p.n || 1, vf = p.model === 'ideale' ? 0 : p.vf ?? VF;
    const drop = n * vf;
    if (p.V <= drop) return sol('I', 'A', 0, [step(`V <= ${n > 1 ? n + ' * ' : ''}V_γ`, `${q(p.V, 'V')} ≤ ${q(drop, 'V')} → I = 0`, 0, 'A')], [{ id: 'soglia', v: p.V / p.R }], { note: 'il diodo è interdetto' });
    const v = (p.V - drop) / p.R;
    const f = p.model === 'ideale' ? 'I = V/R' : n > 1 ? `I = {V - ${n} * V_γ}/R` : 'I = {V - V_γ}/R';
    const s = p.model === 'ideale' ? `I = ${q(p.V, 'V')}/${q(p.R, 'Ω')} = ${q(v, 'A')}` : `I = {${q(p.V, 'V')} - ${n > 1 ? n + ' * ' : ''}${q(vf, 'V')}}/${q(p.R, 'Ω')} = ${q(v, 'A')}`;
    return sol('I', 'A', v, [step(f, s, v, 'A')], p.model === 'ideale' ? [{ id: 'soglia', v: (p.V - VF) / p.R }] : [{ id: 'soglia', v: p.V / p.R }, { id: 'soglia', v: (p.V - vf) / p.R }]);
  }
  // resistenza di limitazione del LED: p = { V, Vf, I, series: 'E12' } → valore calcolato, commerciale (il primo sopra), potenza
  function ledResistor(p, o = {}) {
    const q = Q(o);
    const R = (p.V - p.Vf) / p.I;
    const steps = [step('R = {V - V_F}/I_F', `R = {${q(p.V, 'V')} - ${q(p.Vf, 'V')}}/${q(p.I, 'A')} = ${q(R, 'Ω')}`, R, 'Ω')];
    const wrong = [{ id: 'soglia', v: p.V / p.I }];
    if (p.find === 'R' || !p.find) return sol('R', 'Ω', R, steps, wrong);
    const Rc = U.nextUp(R, p.series || 'E12');
    steps.push(step(`R = ${q(Rc, 'Ω')}`, `"valore commerciale ${p.series || 'E12'} subito sopra:" ${q(Rc, 'Ω')}`, Rc, 'Ω'));
    if (p.find === 'Rc') return sol('R', 'Ω', Rc, steps, wrong.concat([{ id: 'serie-e', v: U.nextDown(R, p.series || 'E12') }]));
    const I = (p.V - p.Vf) / Rc, P = Rc * I * I;
    steps.push(step('I_F = {V - V_F}/R', `I_F = {${q(p.V, 'V')} - ${q(p.Vf, 'V')}}/${q(Rc, 'Ω')} = ${q(I, 'A')}`, I, 'A'));
    steps.push(step('P = R * I_F^2', `P = ${q(Rc, 'Ω')} * (${q(I, 'A')})^2 = ${q(P, 'W')}`, P, 'W'));
    return sol('P', 'W', P, steps, [{ id: 'quadrato', v: Rc * I }]);
  }
  /* stabilizzatore a Zener: p = { V, R, Vz, RL, find: 'VL' | 'IR' | 'IL' | 'IZ' | 'PZ' }.
     Prima si controlla se lo Zener lavora: senza Zener il carico avrebbe V·R_L/(R + R_L). */
  function zener(p, o = {}) {
    const q = Q(o);
    const Vopen = p.RL ? p.V * p.RL / (p.R + p.RL) : p.V;
    const steps = [];
    if (p.RL) steps.push(step('V_{L0} = V * R_L/{R + R_L}', `V_{L0} = ${q(p.V, 'V')} * ${q(p.RL, 'Ω')}/{${q(p.R, 'Ω')} + ${q(p.RL, 'Ω')}} = ${q(Vopen, 'V')}`, Vopen, 'V'));
    const on = Vopen > p.Vz;
    if (!on) {
      steps.push(step('V_L = V_{L0}', `V_{L0} < V_Z: "lo Zener non conduce", V_L = ${q(Vopen, 'V')}`, Vopen, 'V'));
      const ans = { VL: Vopen, IR: Vopen / p.RL, IL: Vopen / p.RL, IZ: 0, PZ: 0 }[p.find];
      return sol({ VL: 'V_L', IR: 'I_R', IL: 'I_L', IZ: 'I_Z', PZ: 'P_Z' }[p.find], { VL: 'V', PZ: 'W' }[p.find] || 'A', ans, steps, [{ id: 'zener-sempre', v: p.find === 'VL' ? p.Vz : NaN }], { note: 'lo Zener è spento' });
    }
    if (p.RL) steps.push(step('V_{L0} > V_Z', `${q(Vopen, 'V')} > ${q(p.Vz, 'V')}: "lo Zener conduce", V_L = ${q(p.Vz, 'V')}`, p.Vz, 'V'));
    if (p.find === 'VL') return sol('V_L', 'V', p.Vz, steps, [{ id: 'zener-sempre', v: Vopen }]);
    const IR = (p.V - p.Vz) / p.R;
    steps.push(step('I_R = {V - V_Z}/R', `I_R = {${q(p.V, 'V')} - ${q(p.Vz, 'V')}}/${q(p.R, 'Ω')} = ${q(IR, 'A')}`, IR, 'A'));
    if (p.find === 'IR') return sol('I_R', 'A', IR, steps, [{ id: 'formula-inversa', v: p.V / p.R }, { id: 'formula-inversa', v: p.Vz / p.R }]);
    const IL = p.RL ? p.Vz / p.RL : 0;
    steps.push(step('I_L = V_Z/R_L', `I_L = ${q(p.Vz, 'V')}/${q(p.RL, 'Ω')} = ${q(IL, 'A')}`, IL, 'A'));
    if (p.find === 'IL') return sol('I_L', 'A', IL, steps, [{ id: 'formula-inversa', v: p.V / p.RL }]);
    const IZ = IR - IL;
    steps.push(step('I_Z = I_R - I_L', `I_Z = ${q(IR, 'A')} - ${q(IL, 'A')} = ${q(IZ, 'A')}`, IZ, 'A'));
    if (p.find === 'IZ') return sol('I_Z', 'A', IZ, steps, [{ id: 'corrente-carico', v: IR }, { id: 'segno', v: IL - IR }]);
    const PZ = p.Vz * IZ;
    steps.push(step('P_Z = V_Z * I_Z', `P_Z = ${q(p.Vz, 'V')} * ${q(IZ, 'A')} = ${q(PZ, 'W')}`, PZ, 'W'));
    return sol('P_Z', 'W', PZ, steps, [{ id: 'corrente-carico', v: p.Vz * IR }]);
  }
  /* raddrizzatore: p = { V2 (efficace sul secondario), type: 'semi' | 'ponte', vf, f (rete, 50 Hz), C, I (carico), find: 'Vp' | 'Vmed' | 'Vr' | 'Vdc' } */
  function rectifier(p, o = {}) {
    const q = Q(o);
    const nd = p.type === 'ponte' ? 2 : 1;
    const vf = p.vf ?? VF;
    const V2p = p.V2 * Math.SQRT2;
    const Vp = V2p - nd * vf;
    const steps = [step('V_{2p} = V_2 * sqrt(2)', `V_{2p} = ${q(p.V2, 'V')} * sqrt(2) = ${q(V2p, 'V')}`, V2p, 'V'),
      step(nd === 2 ? 'V_p = V_{2p} - 2 * V_γ' : 'V_p = V_{2p} - V_γ', `V_p = ${q(V2p, 'V')} - ${nd === 2 ? '2 * ' : ''}${q(vf, 'V')} = ${q(Vp, 'V')}`, Vp, 'V')];
    const wrongP = [{ id: 'efficace-picco', v: p.V2 - nd * vf }, { id: 'soglia', v: V2p }, { id: 'soglia', v: V2p - (3 - nd) * vf }];
    if (p.find === 'Vp') return sol('V_p', 'V', Vp, steps, wrongP);
    if (p.find === 'Vmed') {
      const v = (nd === 2 ? 2 : 1) * Vp / Math.PI;
      steps.push(step(nd === 2 ? 'V_{med} = {2 * V_p}/pi' : 'V_{med} = V_p/pi', `V_{med} = ${nd === 2 ? `{2 * ${q(Vp, 'V')}}` : q(Vp, 'V')}/pi = ${q(v, 'V')}`, v, 'V'));
      return sol('V_{med}', 'V', v, steps, [{ id: 'raddrizzatore', v: (nd === 2 ? 1 : 2) * Vp / Math.PI }, { id: 'efficace-picco', v: Vp / Math.SQRT2 }]);
    }
    // con il condensatore di filtro: ondulazione picco-picco approssimata V_r = I/(f_r·C), f_r = f (semionda) o 2f (ponte)
    const f = p.f || 50, fr = nd === 2 ? 2 * f : f;
    const Vr = p.I / (fr * p.C);
    steps.push(step(nd === 2 ? 'V_r = I/{2 * f * C}' : 'V_r = I/{f * C}', `V_r = ${q(p.I, 'A')}/{${nd === 2 ? '2 * ' : ''}${q(f, 'Hz')} * ${q(p.C, 'F')}} = ${q(Vr, 'V')}`, Vr, 'V'));
    if (p.find === 'Vr') return sol('V_r', 'V', Vr, steps, [{ id: 'frequenza-ondulazione', v: nd === 2 ? p.I / (f * p.C) : p.I / (2 * f * p.C) }]);
    const Vdc = Vp - Vr / 2;
    steps.push(step('V_{DC} = V_p - V_r/2', `V_{DC} = ${q(Vp, 'V')} - ${q(Vr, 'V')}/2 = ${q(Vdc, 'V')}`, Vdc, 'V'));
    return sol('V_{DC}', 'V', Vdc, steps, [{ id: 'ondulazione', v: Vp - Vr }, { id: 'efficace-picco', v: p.V2 - nd * vf - Vr / 2 }]);
  }

  /* ======================= BJT e MOSFET ======================= */
  function bjtGain(p, o = {}) {
    const q = Q(o);
    if (p.find === 'IC') { const v = p.beta * p.IB; return sol('I_C', 'A', v, [step('I_C = beta * I_B', `I_C = ${p.beta} * ${q(p.IB, 'A')} = ${q(v, 'A')}`, v, 'A')], [{ id: 'beta-dimenticato', v: p.IB }, { id: 'formula-inversa', v: p.IB / p.beta }]); }
    if (p.find === 'IB') { const v = p.IC / p.beta; return sol('I_B', 'A', v, [step('I_B = I_C/beta', `I_B = ${q(p.IC, 'A')}/${p.beta} = ${q(v, 'A')}`, v, 'A')], [{ id: 'formula-inversa', v: p.IC * p.beta }]); }
    if (p.find === 'IE') { const v = p.IC + p.IB; return sol('I_E', 'A', v, [step('I_E = I_C + I_B', `I_E = ${q(p.IC, 'A')} + ${q(p.IB, 'A')} = ${q(v, 'A')}`, v, 'A')], [{ id: 'segno', v: p.IC - p.IB }]); }
    const v = p.IC / p.IB;
    return sol('beta', '', v, [step('beta = I_C/I_B', `beta = ${q(p.IC, 'A')}/${q(p.IB, 'A')} = ${num(v)}`, v, '')], [{ id: 'formula-inversa', v: p.IB / p.IC }]);
  }
  /* BJT con la resistenza di base e quella di collettore (emettitore a massa):
     p = { VCC, VBB, RB, RC, beta, find: 'IB' | 'IC' | 'VCE' | 'zona' }; zona: 'interdizione' | 'attiva' | 'saturazione' */
  function bjt(p, o = {}) {
    const q = Q(o);
    const steps = [];
    if (p.VBB <= VBE) {
      steps.push(step('V_{BB} <= V_{BE}', `${q(p.VBB, 'V')} ≤ ${q(VBE, 'V')}: "interdizione", I_B = I_C = 0`, 0, 'A'));
      const v = { IB: 0, IC: 0, VCE: p.VCC, zona: 'interdizione' }[p.find];
      return sol({ IB: 'I_B', IC: 'I_C', VCE: 'V_{CE}', zona: 'zona' }[p.find], p.find === 'VCE' ? 'V' : p.find === 'zona' ? '' : 'A', v, steps, [], { zone: 'interdizione' });
    }
    const IB = (p.VBB - VBE) / p.RB;
    steps.push(step('I_B = {V_{BB} - V_{BE}}/R_B', `I_B = {${q(p.VBB, 'V')} - ${q(VBE, 'V')}}/${q(p.RB, 'Ω')} = ${q(IB, 'A')}`, IB, 'A'));
    if (p.find === 'IB') return sol('I_B', 'A', IB, steps, [{ id: 'vbe-trascurata', v: p.VBB / p.RB }]);
    const ICa = p.beta * IB, ICs = (p.VCC - VCES) / p.RC;
    steps.push(step('I_C = beta * I_B', `I_C = ${p.beta} * ${q(IB, 'A')} = ${q(ICa, 'A')}`, ICa, 'A'));
    steps.push(step('I_{C,sat} = {V_{CC} - V_{CE,sat}}/R_C', `I_{C,sat} = {${q(p.VCC, 'V')} - ${q(VCES, 'V')}}/${q(p.RC, 'Ω')} = ${q(ICs, 'A')}`, ICs, 'A'));
    const sat = ICa >= ICs;
    const zone = sat ? 'saturazione' : 'attiva';
    const zs = step(sat ? 'beta * I_B >= I_{C,sat}' : 'beta * I_B < I_{C,sat}', sat ? `${q(ICa, 'A')} ≥ ${q(ICs, 'A')}: "saturazione"` : `${q(ICa, 'A')} < ${q(ICs, 'A')}: "zona attiva"`, null, '');
    steps.push(zs);
    if (p.find === 'zona') return sol('zona', '', zone, steps, [], { zone });
    const IC = sat ? ICs : ICa;
    if (p.find === 'IC') return sol('I_C', 'A', IC, steps, sat ? [{ id: 'saturazione-ignorata', v: ICa }, { id: 'vbe-trascurata', v: Math.min(p.beta * p.VBB / p.RB, ICs) }] : [{ id: 'saturazione-ignorata', v: ICs }, { id: 'beta-dimenticato', v: IB }, { id: 'vbe-trascurata', v: p.beta * p.VBB / p.RB }], { zone });
    const VCE = sat ? VCES : p.VCC - p.RC * ICa;
    steps.push(sat ? step('V_{CE} = V_{CE,sat}', `V_{CE} = ${q(VCES, 'V')}`, VCE, 'V') : step('V_{CE} = V_{CC} - R_C * I_C', `V_{CE} = ${q(p.VCC, 'V')} - ${q(p.RC, 'Ω')} * ${q(ICa, 'A')} = ${q(VCE, 'V')}`, VCE, 'V'));
    return sol('V_{CE}', 'V', VCE, steps, sat ? [{ id: 'saturazione-ignorata', v: p.VCC - p.RC * ICa }] : [{ id: 'saturazione-ignorata', v: VCES }, { id: 'segno', v: p.RC * ICa }], { zone });
  }
  /* polarizzazione a partitore (metodo scolastico: corrente di base trascurabile rispetto a quella del partitore):
     p = { VCC, R1, R2, RC, RE, beta, find: 'VB' | 'IE' | 'IC' | 'VCE' } — accept contiene il calcolo esatto con I_B */
  function bjtDivider(p, o = {}) {
    const q = Q(o);
    const VB = p.VCC * p.R2 / (p.R1 + p.R2);
    const steps = [step('V_B = V_{CC} * R_2/{R_1 + R_2}', `V_B = ${q(p.VCC, 'V')} * ${q(p.R2, 'Ω')}/{${q(p.R1, 'Ω')} + ${q(p.R2, 'Ω')}} = ${q(VB, 'V')}`, VB, 'V')];
    // calcolo esatto (Thevenin della base) per accettare anche chi tiene conto di I_B
    const Rth = p.R1 * p.R2 / (p.R1 + p.R2);
    const IBx = (VB - VBE) / (Rth + (p.beta + 1) * p.RE), ICx = p.beta * IBx, IEx = (p.beta + 1) * IBx;
    if (p.find === 'VB') return sol('V_B', 'V', VB, steps, [{ id: 'partitore-capovolto', v: p.VCC * p.R1 / (p.R1 + p.R2) }]);
    const VE = VB - VBE;
    steps.push(step('V_E = V_B - V_{BE}', `V_E = ${q(VB, 'V')} - ${q(VBE, 'V')} = ${q(VE, 'V')}`, VE, 'V'));
    const IE = VE / p.RE;
    steps.push(step('I_E = V_E/R_E', `I_E = ${q(VE, 'V')}/${q(p.RE, 'Ω')} = ${q(IE, 'A')}`, IE, 'A'));
    const vbeWrong = VB / p.RE;
    if (p.find === 'IE' || p.find === 'IC') {
      if (p.find === 'IC') steps.push(step('I_C ≈ I_E', `I_C ≈ ${q(IE, 'A')}`, IE, 'A'));
      return sol(p.find === 'IC' ? 'I_C' : 'I_E', 'A', IE, steps, [{ id: 'vbe-trascurata', v: vbeWrong }, { id: 'partitore-capovolto', v: (p.VCC * p.R1 / (p.R1 + p.R2) - VBE) / p.RE }], { accept: [p.find === 'IC' ? ICx : IEx] });
    }
    const VCE = p.VCC - IE * (p.RC + p.RE);
    steps.push(step('V_{CE} = V_{CC} - I_C * (R_C + R_E)', `V_{CE} = ${q(p.VCC, 'V')} - ${q(IE, 'A')} * (${q(p.RC, 'Ω')} + ${q(p.RE, 'Ω')}) = ${q(VCE, 'V')}`, VCE, 'V'));
    return sol('V_{CE}', 'V', VCE, steps, [{ id: 'resistenza-emettitore', v: p.VCC - IE * p.RC }, { id: 'vbe-trascurata', v: p.VCC - vbeWrong * (p.RC + p.RE) }], { accept: [p.VCC - ICx * p.RC - IEx * p.RE] });
  }
  /* BJT come interruttore: resistenza di base per saturarlo. p = { VCC, RC (carico), Vin, beta, k (fattore di sovrasaturazione), series } */
  function bjtSwitch(p, o = {}) {
    const q = Q(o);
    const k = p.k || 2;
    const ICs = (p.VCC - VCES) / p.RC;
    const IBmin = ICs / p.beta, IB = k * IBmin;
    const RB = (p.Vin - VBE) / IB;
    const steps = [
      step('I_{C,sat} = {V_{CC} - V_{CE,sat}}/R_C', `I_{C,sat} = {${q(p.VCC, 'V')} - ${q(VCES, 'V')}}/${q(p.RC, 'Ω')} = ${q(ICs, 'A')}`, ICs, 'A'),
      step('I_{B,min} = I_{C,sat}/beta', `I_{B,min} = ${q(ICs, 'A')}/${p.beta} = ${q(IBmin, 'A')}`, IBmin, 'A'),
      step(`I_B = ${k} * I_{B,min}`, `I_B = ${k} * ${q(IBmin, 'A')} = ${q(IB, 'A')}`, IB, 'A'),
      step('R_B = {V_{in} - V_{BE}}/I_B', `R_B = {${q(p.Vin, 'V')} - ${q(VBE, 'V')}}/${q(IB, 'A')} = ${q(RB, 'Ω')}`, RB, 'Ω'),
    ];
    if (p.find !== 'RBc') return sol('R_B', 'Ω', RB, steps, [{ id: 'vbe-trascurata', v: p.Vin / IB }, { id: 'sovrasaturazione', v: (p.Vin - VBE) / IBmin }, { id: 'beta-dimenticato', v: (p.Vin - VBE) / (k * ICs) }]);
    const RBc = U.nextDown(RB, p.series || 'E12');
    steps.push(step(`R_B = ${q(RBc, 'Ω')}`, `"valore commerciale ${p.series || 'E12'} subito sotto, perché la corrente di base non cali:" ${q(RBc, 'Ω')}`, RBc, 'Ω'));
    return sol('R_B', 'Ω', RBc, steps, [{ id: 'serie-e', v: U.nextUp(RB, p.series || 'E12') }]);
  }
  // MOSFET come interruttore: p = { VDD, RD, VGS, Vth, Ron, find: 'ID' | 'P' | 'VDS' }
  function mosfet(p, o = {}) {
    const q = Q(o);
    const on = p.VGS >= p.Vth;
    const steps = [step(on ? 'V_{GS} >= V_{GS(th)}' : 'V_{GS} < V_{GS(th)}', `${q(p.VGS, 'V')} ${on ? '≥' : '<'} ${q(p.Vth, 'V')}: "${on ? 'il MOSFET conduce' : 'il MOSFET è spento'}"`, null, '')];
    if (!on) return sol({ ID: 'I_D', P: 'P', VDS: 'V_{DS}' }[p.find], p.find === 'P' ? 'W' : p.find === 'VDS' ? 'V' : 'A', p.find === 'VDS' ? p.VDD : 0, steps, [{ id: 'soglia-mos', v: p.find === 'VDS' ? 0 : p.VDD / (p.RD + p.Ron) }]);
    const ID = p.VDD / (p.RD + p.Ron);
    steps.push(step('I_D = V_{DD}/{R_D + R_{DS(on)}}', `I_D = ${q(p.VDD, 'V')}/{${q(p.RD, 'Ω')} + ${q(p.Ron, 'Ω')}} = ${q(ID, 'A')}`, ID, 'A'));
    if (p.find === 'ID') return sol('I_D', 'A', ID, steps, [{ id: 'soglia-mos', v: 0 }], { accept: [p.VDD / p.RD] });
    if (p.find === 'VDS') { const v = p.Ron * ID; steps.push(step('V_{DS} = R_{DS(on)} * I_D', `V_{DS} = ${q(p.Ron, 'Ω')} * ${q(ID, 'A')} = ${q(v, 'V')}`, v, 'V')); return sol('V_{DS}', 'V', v, steps, [{ id: 'soglia-mos', v: p.VDD }]); }
    const P = p.Ron * ID * ID;
    steps.push(step('P = R_{DS(on)} * I_D^2', `P = ${q(p.Ron, 'Ω')} * (${q(ID, 'A')})^2 = ${q(P, 'W')}`, P, 'W'));
    return sol('P', 'W', P, steps, [{ id: 'quadrato', v: p.Ron * ID }, { id: 'potenza-carico', v: p.RD * ID * ID }]);
  }

  /* ======================= Operazionale ======================= */
  // satura l'uscita alle tensioni di alimentazione (±Vsat)
  function clip(v, vs) { return vs == null ? v : Math.max(-vs, Math.min(vs, v)); }
  function satStep(steps, raw, vs, q) {
    if (vs == null || Math.abs(raw) <= vs) return raw;
    const v = clip(raw, vs);
    steps.push(step(`|V_{out}| > V_{sat}`, `${q(raw, 'V', true)} "supera" ${q(vs, 'V')}: "l’operazionale satura", V_{out} = ${q(v, 'V')}`, v, 'V'));
    return v;
  }
  /* p = { kind: 'invertente' | 'non-invertente' | 'inseguitore' | 'sommatore' | 'differenziale', Vin, R1, Rf, V: [..], R: [..], V1, V2, Vsat,
     find: 'Av' | 'Vout' } */
  function opamp(p, o = {}) {
    const q = Q(o);
    const steps = [];
    const vs = p.Vsat;
    switch (p.kind) {
      case 'invertente': {
        const A = -p.Rf / p.R1;
        steps.push(step('A_v = -R_f/R_1', `A_v = -${q(p.Rf, 'Ω')}/${q(p.R1, 'Ω')} = ${num(A)}`, A, ''));
        if (p.find === 'Av') return sol('A_v', '', A, steps, [{ id: 'segno-invertente', v: -A }, { id: 'formula-inversa', v: -p.R1 / p.Rf }, { id: 'non-invertente-uno', v: 1 + p.Rf / p.R1 }]);
        const raw = A * p.Vin;
        steps.push(step('V_{out} = A_v * V_{in}', `V_{out} = ${num(A)} * ${q(p.Vin, 'V', true)} = ${q(raw, 'V')}`, raw, 'V'));
        const v = satStep(steps, raw, vs, q);
        return sol('V_{out}', 'V', v, steps, [{ id: 'segno-invertente', v: -v }, { id: 'saturazione-op', v: raw }, { id: 'non-invertente-uno', v: clip((1 + p.Rf / p.R1) * p.Vin, vs) }]);
      }
      case 'non-invertente': {
        const A = 1 + p.Rf / p.R1;
        steps.push(step('A_v = 1 + R_f/R_1', `A_v = 1 + ${q(p.Rf, 'Ω')}/${q(p.R1, 'Ω')} = ${num(A)}`, A, ''));
        if (p.find === 'Av') return sol('A_v', '', A, steps, [{ id: 'non-invertente-uno', v: A - 1 }, { id: 'segno', v: -A }]);
        const raw = A * p.Vin;
        steps.push(step('V_{out} = A_v * V_{in}', `V_{out} = ${num(A)} * ${q(p.Vin, 'V', true)} = ${q(raw, 'V')}`, raw, 'V'));
        const v = satStep(steps, raw, vs, q);
        return sol('V_{out}', 'V', v, steps, [{ id: 'non-invertente-uno', v: clip((A - 1) * p.Vin, vs) }, { id: 'segno-invertente', v: -v }, { id: 'saturazione-op', v: raw }]);
      }
      case 'inseguitore': {
        steps.push(step('V_{out} = V_{in}', `V_{out} = ${q(p.Vin, 'V')}`, p.Vin, 'V'));
        return sol('V_{out}', 'V', p.Vin, steps, [{ id: 'segno', v: -p.Vin }, { id: 'inseguitore-zero', v: 0 }]);
      }
      case 'sommatore': {
        const terms = p.V.map((x, i) => x / p.R[i]);
        const raw = -p.Rf * terms.reduce((a, b) => a + b, 0);
        const f = `V_{out} = -R_f * (${p.V.map((_, i) => `V_${i + 1}/R_${i + 1}`).join(' + ')})`;
        const s = `V_{out} = -${q(p.Rf, 'Ω')} * (${p.V.map((x, i) => `${q(x, 'V', true)}/${q(p.R[i], 'Ω')}`).join(' + ')}) = ${q(raw, 'V')}`;
        steps.push(step(f, s, raw, 'V'));
        const v = satStep(steps, raw, vs, q);
        return sol('V_{out}', 'V', v, steps, [{ id: 'segno-invertente', v: -v }, { id: 'saturazione-op', v: raw }, { id: 'sommatore-media', v: clip(-p.V.reduce((a, b) => a + b, 0), vs) }]);
      }
      case 'differenziale': {
        // R1 = R3, Rf = R4 (le due coppie uguali): V_out = (R_f/R_1)·(V_2 − V_1)
        const raw = p.Rf / p.R1 * (p.V2 - p.V1);
        steps.push(step('V_{out} = R_f/R_1 * (V_2 - V_1)', `V_{out} = ${q(p.Rf, 'Ω')}/${q(p.R1, 'Ω')} * (${q(p.V2, 'V', true)} - ${q(p.V1, 'V', true)}) = ${q(raw, 'V')}`, raw, 'V'));
        const v = satStep(steps, raw, vs, q);
        return sol('V_{out}', 'V', v, steps, [{ id: 'segno', v: -v }, { id: 'saturazione-op', v: raw }, { id: 'non-invertente-uno', v: clip((1 + p.Rf / p.R1) * (p.V2 - p.V1), vs) }]);
      }
      default: throw new Error('opamp: configurazione ' + p.kind);
    }
  }
  // comparatore ad anello aperto: p = { Vp (ingresso +), Vn (ingresso −), Vsat }
  function comparator(p, o = {}) {
    const q = Q(o);
    const v = p.Vp > p.Vn ? p.Vsat : -p.Vsat;
    return sol('V_{out}', 'V', v, [step(p.Vp > p.Vn ? 'V_+ > V_-' : 'V_+ < V_-', `${q(p.Vp, 'V', true)} ${p.Vp > p.Vn ? '>' : '<'} ${q(p.Vn, 'V', true)} → V_{out} = ${q(v, 'V')}`, v, 'V')],
      [{ id: 'comparatore-ingressi', v: -v }, { id: 'saturazione-op', v: 1e5 * (p.Vp - p.Vn) }]);
  }
  /* trigger di Schmitt invertente: ingresso sul −, partitore R1 (verso massa) e R2 (dall'uscita al +):
     soglie ±V_sat·R1/(R1 + R2). p = { R1, R2, Vsat, find: 'VTH' | 'VTL' | 'H' } */
  function schmitt(p, o = {}) {
    const q = Q(o);
    const b = p.R1 / (p.R1 + p.R2);
    const VT = p.Vsat * b;
    const steps = [step('V_T = V_{sat} * R_1/{R_1 + R_2}', `V_T = ${q(p.Vsat, 'V')} * ${q(p.R1, 'Ω')}/{${q(p.R1, 'Ω')} + ${q(p.R2, 'Ω')}} = ${q(VT, 'V')}`, VT, 'V')];
    if (p.find === 'VTH') return sol('V_{TH}', 'V', VT, steps, [{ id: 'partitore-capovolto', v: p.Vsat * p.R2 / (p.R1 + p.R2) }, { id: 'segno', v: -VT }]);
    if (p.find === 'VTL') return sol('V_{TL}', 'V', -VT, steps, [{ id: 'partitore-capovolto', v: -p.Vsat * p.R2 / (p.R1 + p.R2) }, { id: 'segno', v: VT }]);
    const H = 2 * VT;
    steps.push(step('V_H = V_{TH} - V_{TL} = 2 * V_T', `V_H = 2 * ${q(VT, 'V')} = ${q(H, 'V')}`, H, 'V'));
    return sol('V_H', 'V', H, steps, [{ id: 'isteresi-meta', v: VT }, { id: 'partitore-capovolto', v: 2 * p.Vsat * p.R2 / (p.R1 + p.R2) }]);
  }
  // astabile con l'operazionale (trigger di Schmitt con la rete RC): T = 2·R·C·ln((1 + β)/(1 − β)), β = R1/(R1 + R2)
  function astableOA(p, o = {}) {
    const q = Q(o);
    const b = p.R1 / (p.R1 + p.R2);
    const L = Math.log((1 + b) / (1 - b));
    const T = 2 * p.R * p.C * L;
    const steps = [step('beta = R_1/{R_1 + R_2}', `beta = ${q(p.R1, 'Ω')}/{${q(p.R1, 'Ω')} + ${q(p.R2, 'Ω')}} = ${num(b)}`, b, ''),
      step('T = 2 * R * C * ln({1 + beta}/{1 - beta})', `T = 2 * ${q(p.R, 'Ω')} * ${q(p.C, 'F')} * ln({1 + ${num(b)}}/{1 - ${num(b)}}) = ${q(T, 's')}`, T, 's')];
    if (p.find !== 'f') return sol('T', 's', T, steps, [{ id: 'astabile-mezzo', v: T / 2 }]);
    const f = 1 / T;
    steps.push(step('f = 1/T', `f = 1/${q(T, 's')} = ${q(f, 'Hz')}`, f, 'Hz'));
    return sol('f', 'Hz', f, steps, [{ id: 'astabile-mezzo', v: 2 * f }, { id: 'omega-f', v: 2 * Math.PI * f }]);
  }
  /* NE555 astabile: t_H = 0,693·(R_A + R_B)·C, t_L = 0,693·R_B·C. p = { RA, RB, C, find: 'tH' | 'tL' | 'T' | 'f' | 'D' } */
  function ne555astable(p, o = {}) {
    const q = Q(o);
    const k = 0.693;
    const tH = k * (p.RA + p.RB) * p.C, tL = k * p.RB * p.C, T = tH + tL;
    const steps = [step('t_H = 0,693 * (R_A + R_B) * C', `t_H = 0,693 * (${q(p.RA, 'Ω')} + ${q(p.RB, 'Ω')}) * ${q(p.C, 'F')} = ${q(tH, 's')}`, tH, 's')];
    const wrongT = k * (p.RA + p.RB) * p.C;
    if (p.find === 'tH') return sol('t_H', 's', tH, steps, [{ id: '555-formula', v: k * p.RB * p.C }, { id: '555-formula', v: k * p.RA * p.C }]);
    steps.push(step('t_L = 0,693 * R_B * C', `t_L = 0,693 * ${q(p.RB, 'Ω')} * ${q(p.C, 'F')} = ${q(tL, 's')}`, tL, 's'));
    if (p.find === 'tL') return sol('t_L', 's', tL, steps, [{ id: '555-formula', v: tH }, { id: '555-formula', v: k * p.RA * p.C }]);
    steps.push(step('T = t_H + t_L', `T = ${q(tH, 's')} + ${q(tL, 's')} = ${q(T, 's')}`, T, 's'));
    if (p.find === 'T') return sol('T', 's', T, steps, [{ id: '555-formula', v: wrongT }]);
    if (p.find === 'D') { const D = 100 * tH / T; steps.push(step('D = t_H/T * 100', `D = ${q(tH, 's')}/${q(T, 's')} * 100 = \`${U.num(D, { sig: 3 })} %\``, D, '%')); return sol('D', '%', D, steps, [{ id: '555-duty', v: 100 * tL / T }], { abs: 0.5 }); }
    const f = 1 / T;
    steps.push(step('f = 1/T', `f = 1/${q(T, 's')} = ${q(f, 'Hz')}`, f, 'Hz'));
    // la formula compatta f = 1,44/((R_A + 2·R_B)·C) dà lo stesso risultato entro l'arrotondamento: si accetta
    return sol('f', 'Hz', f, steps, [{ id: '555-formula', v: 1 / wrongT }, { id: 'omega-f', v: 2 * Math.PI * f }], { accept: [1.44 / ((p.RA + 2 * p.RB) * p.C)] });
  }
  function ne555mono(p, o = {}) {
    const q = Q(o);
    const T = 1.1 * p.R * p.C;
    return sol('T', 's', T, [step('T = 1,1 * R * C', `T = 1,1 * ${q(p.R, 'Ω')} * ${q(p.C, 'F')} = ${q(T, 's')}`, T, 's')], [{ id: '555-formula', v: 0.693 * p.R * p.C }, { id: 'costante-tempo', v: p.R * p.C }]);
  }
  // oscillatore a ponte di Wien: f_0 = 1/(2π·R·C); per oscillare serve un guadagno 3 (R_f = 2·R_1)
  function wien(p, o = {}) {
    const q = Q(o);
    if (p.find === 'Rf') { const v = 2 * p.R1; return sol('R_f', 'Ω', v, [step('A_v = 1 + R_f/R_1 = 3', `R_f = 2 * R_1 = 2 * ${q(p.R1, 'Ω')} = ${q(v, 'Ω')}`, v, 'Ω')], [{ id: 'wien-guadagno', v: 3 * p.R1 }]); }
    const f = 1 / (2 * Math.PI * p.R * p.C);
    return sol('f_0', 'Hz', f, [step('f_0 = 1/{2 * pi * R * C}', `f_0 = 1/{2 * pi * ${q(p.R, 'Ω')} * ${q(p.C, 'F')}} = ${q(f, 'Hz')}`, f, 'Hz')], [{ id: 'omega-f', v: 1 / (p.R * p.C) }, { id: 'omega-f', v: 2 * Math.PI * f }]);
  }

  /* ======================= Alimentatori ======================= */
  function transformer(p, o = {}) {
    const q = Q(o);
    if (p.find === 'n') { const v = p.V1 / p.V2; return sol('n', '', v, [step('n = V_1/V_2', `n = ${q(p.V1, 'V')}/${q(p.V2, 'V')} = ${num(v)}`, v, '')], [{ id: 'formula-inversa', v: p.V2 / p.V1 }]); }
    const v = p.V1 * p.N2 / p.N1;
    return sol('V_2', 'V', v, [step('V_2 = V_1 * N_2/N_1', `V_2 = ${q(p.V1, 'V')} * ${p.N2}/${p.N1} = ${q(v, 'V')}`, v, 'V')], [{ id: 'formula-inversa', v: p.V1 * p.N1 / p.N2 }, { id: 'efficace-picco', v: v * Math.SQRT2 }]);
  }
  // regolatore lineare: potenza dissipata e rendimento (trascurando la corrente di riposo)
  function linearReg(p, o = {}) {
    const q = Q(o);
    if (p.find === 'eta') { const v = 100 * p.Vout / p.Vin; return sol('eta', '%', v, [step('eta = V_{out}/V_{in} * 100', `eta = ${q(p.Vout, 'V')}/${q(p.Vin, 'V')} * 100 = \`${U.num(v, { sig: 3 })} %\``, v, '%')], [{ id: 'formula-inversa', v: 100 * p.Vin / p.Vout }, { id: 'rendimento-perdite', v: 100 - v }], { abs: 0.5 }); }
    const v = (p.Vin - p.Vout) * p.I;
    return sol('P_D', 'W', v, [step('P_D = (V_{in} - V_{out}) * I', `P_D = (${q(p.Vin, 'V')} - ${q(p.Vout, 'V')}) * ${q(p.I, 'A')} = ${q(v, 'W')}`, v, 'W')], [{ id: 'potenza-carico', v: p.Vout * p.I }, { id: 'potenza-carico', v: p.Vin * p.I }]);
  }
  // LM317: V_out = 1,25 V·(1 + R2/R1) (trascurando la corrente del piedino ADJ)
  function lm317(p, o = {}) {
    const q = Q(o);
    if (p.find === 'R2') { const v = p.R1 * (p.Vout / 1.25 - 1); return sol('R_2', 'Ω', v, [step('R_2 = R_1 * (V_{out}/V_{ref} - 1)', `R_2 = ${q(p.R1, 'Ω')} * (${q(p.Vout, 'V')}/\`1,25 V\` - 1) = ${q(v, 'Ω')}`, v, 'Ω')], [{ id: 'non-invertente-uno', v: p.R1 * p.Vout / 1.25 }]); }
    const v = 1.25 * (1 + p.R2 / p.R1);
    return sol('V_{out}', 'V', v, [step('V_{out} = V_{ref} * (1 + R_2/R_1)', `V_{out} = \`1,25 V\` * (1 + ${q(p.R2, 'Ω')}/${q(p.R1, 'Ω')}) = ${q(v, 'V')}`, v, 'V')], [{ id: 'non-invertente-uno', v: 1.25 * p.R2 / p.R1 }, { id: 'formula-inversa', v: 1.25 * (1 + p.R1 / p.R2) }]);
  }

  /* ======================= Sensori ======================= */
  // PT100: R = R_0·(1 + α·T), α = 0,00385 /°C
  function pt100(p, o = {}) {
    const q = Q(o);
    const a = p.alpha ?? 0.00385, R0 = p.R0 ?? 100;
    if (p.find === 'T') { const v = (p.R / R0 - 1) / a; return sol('T', '°C', v, [step('T = {R/R_0 - 1}/alpha', `T = {${q(p.R, 'Ω')}/${q(R0, 'Ω')} - 1}/\`${U.num(a, { sig: 3 })} /°C\` = \`${U.num(v, { sig: 3 })} °C\``, v, '°C')], [{ id: 'formula-inversa', v: (p.R - R0) / a }], { abs: 0.5 }); }
    const v = R0 * (1 + a * p.T);
    return sol('R', 'Ω', v, [step('R = R_0 * (1 + alpha * T)', `R = ${q(R0, 'Ω')} * (1 + \`${U.num(a, { sig: 3 })} /°C\` * \`${U.num(p.T)} °C\`) = ${q(v, 'Ω')}`, v, 'Ω')], [{ id: 'formula-inversa', v: R0 * a * p.T }, { id: 'pt100-uno', v: R0 + a * p.T }]);
  }
  // LM35: 10 mV/°C
  function lm35(p, o = {}) {
    const q = Q(o);
    if (p.find === 'T') { const v = p.V / 0.01; return sol('T', '°C', v, [step('T = V/{\`10 mV/°C\`}', `T = ${q(p.V, 'V')}/\`10 mV/°C\` = \`${U.num(v, { sig: 3 })} °C\``, v, '°C')], [{ id: 'prefisso', v: p.V / 10 }, { id: 'prefisso', v: p.V * 1000 / 10 * 1000 }], { abs: 0.5 }); }
    const v = 0.01 * p.T;
    return sol('V_{out}', 'V', v, [step('V_{out} = \`10 mV/°C\` * T', `V_{out} = \`10 mV/°C\` * \`${U.num(p.T)} °C\` = ${q(v, 'V')}`, v, 'V')], [{ id: 'prefisso', v: 10 * p.T }]);
  }
  /* NTC con il parametro B: R(T) = R_25·e^(B·(1/T − 1/T_25)) con le temperature in kelvin */
  function ntc(p, o = {}) {
    const q = Q(o);
    const TK = p.T + 273.15, T0 = (p.T0 ?? 25) + 273.15;
    const v = p.R0 * Math.exp(p.B * (1 / TK - 1 / T0));
    return sol('R_T', 'Ω', v, [
      step('T_K = T + 273,15', `T_K = \`${U.num(p.T)} °C\` + 273,15 = \`${U.num(TK, { dec: 2 })} K\``, TK, 'K'),
      step('R_T = R_{25} * e^{B * (1/T_K - 1/T_{25})}', `R_T = ${q(p.R0, 'Ω')} * e^{${p.B} * (1/\`${U.num(TK, { dec: 2 })} K\` - 1/\`${U.num(T0, { dec: 2 })} K\`)} = ${q(v, 'Ω')}`, v, 'Ω'),
    ], [{ id: 'kelvin', v: p.R0 * Math.exp(p.B * (1 / p.T - 1 / (T0 - 273.15))) }, { id: 'segno', v: p.R0 * Math.exp(-p.B * (1 / TK - 1 / T0)) }]);
  }
  // partitore con un sensore resistivo (in basso): V_out = V·R_s/(R + R_s)
  function sensorDivider(p, o = {}) {
    const q = Q(o);
    const v = p.V * p.Rs / (p.R + p.Rs);
    return sol('V_{out}', 'V', v, [step('V_{out} = V * R_S/{R + R_S}', `V_{out} = ${q(p.V, 'V')} * ${q(p.Rs, 'Ω')}/{${q(p.R, 'Ω')} + ${q(p.Rs, 'Ω')}} = ${q(v, 'V')}`, v, 'V')], [{ id: 'partitore-capovolto', v: p.V * p.R / (p.R + p.Rs) }]);
  }
  /* condizionamento: il campo [a, b] del sensore diventa [0, V_FS] dell'ingresso dell'ADC: V_out = G·(V_s − a).
     p = { a, b, VFS, Vs, find: 'G' | 'Voff' | 'Vout' } */
  function conditioning(p, o = {}) {
    const q = Q(o);
    const G = p.VFS / (p.b - p.a);
    const steps = [step('G = V_{FS}/{V_{max} - V_{min}}', `G = ${q(p.VFS, 'V')}/{${q(p.b, 'V')} - ${q(p.a, 'V', true)}} = ${num(G)}`, G, '')];
    if (p.find === 'G') return sol('G', '', G, steps, [{ id: 'formula-inversa', v: (p.b - p.a) / p.VFS }, { id: 'condizionamento-offset', v: p.VFS / p.b }]);
    const off = -G * p.a;
    steps.push(step('V_{off} = -G * V_{min}', `V_{off} = -${num(G)} * ${q(p.a, 'V', true)} = ${q(off, 'V')}`, off, 'V'));
    if (p.find === 'Voff') return sol('V_{off}', 'V', off, steps, [{ id: 'segno', v: -off }]);
    const v = G * p.Vs + off;
    steps.push(step('V_{out} = G * V_S + V_{off}', `V_{out} = ${num(G)} * ${q(p.Vs, 'V', true)} + ${q(off, 'V', true)} = ${q(v, 'V')}`, v, 'V'));
    return sol('V_{out}', 'V', v, steps, [{ id: 'condizionamento-offset', v: G * p.Vs }]);
  }

  const api = { VBE, VCES, VF, diode, ledResistor, zener, rectifier, bjtGain, bjt, bjtDivider, bjtSwitch, mosfet, opamp, comparator, schmitt, astableOA, ne555astable, ne555mono, wien, transformer, linearReg, lm317, pt100, lm35, ntc, sensorDivider, conditioning, clip };
  root.ElekDevices = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
