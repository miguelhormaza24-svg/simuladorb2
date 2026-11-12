import { describe, expect, it } from 'vitest';
import { ENSAYO_RGD, valoresCriterio } from '../data/criterios';
import { materialPorId } from '../data/materiales';
import { claseMaterialAPI6A } from './api6a';
import { aguaMarClorada, atmosferaMarina, cumple15156_3, pren, prenMaterial, riesgoCUI } from './cra';
import {
  calificacionRGD, claseTemperatura, ensayoRGDCubre, evaluarElastomeros, evaluarTermoplasticos, planEnvejecimiento, riesgoRGD,
  type CondicionSello,
} from './elastomeros';
import { densidadGas, espesorUG27, velocidadBoquilla, velocidadErosional, verificarEspesor } from './mecanica';
import { requierePWHT, severidadAmina, severidadTEG } from './soluciones';

const cv = valoresCriterio();

describe('modelo 7 · PREN (ISO 21457 Ec. 1)', () => {
  it('aplica Cr + 3,3·(Mo + 0,5·W) + 16·N', () => {
    expect(pren({ Cr: 25, Mo: 4, N: 0.3 })).toBeCloseTo(43, 10);
    expect(pren({ Cr: 25, Mo: 3.5, W: 0.7, N: 0.25 })).toBeCloseTo(41.705, 10);
    expect(pren({ Cr: 17 })).toBe(17);
  });
  it('da el intervalo con la composición de la Tabla C.1', () => {
    expect(prenMaterial(materialPorId('ss316')!)).toMatchObject({ min: expect.closeTo(22.6, 6), max: expect.closeTo(27.9, 6) });
    expect(prenMaterial(materialPorId('mo6')!)!.min).toBeGreaterThan(40); // tipo 6Mo: PREN ≥ 40
    expect(prenMaterial(materialPorId('dss25')!)!.min).toBeLessThan(40); // por eso la nota b pide especificar PREN ≥ 40
    expect(prenMaterial(materialPorId('c276')!)!.nominal).toBeGreaterThan(60);
    expect(prenMaterial(materialPorId('cs')!)).toBeNull();
    expect(materialPorId('no_existe')).toBeUndefined();
  });
});

describe('modelo 7 · límites ambientales ISO 15156-3 (sin verificar)', () => {
  const c = { T_C: 60, pH2S_kPa: 70, Cl_mgL: 28000, pH: 3.9 };
  it('316L: admitido a 60 °C y 100 kPa; excluido por temperatura o por pH₂S', () => {
    expect(cumple15156_3('tipo316', c)).toMatchObject({ cumple: true, uso: 1 });
    const t = cumple15156_3('tipo316', { ...c, T_C: 120 });
    expect(t.cumple).toBe(false);
    expect(t.motivo).toContain('Tabla A.2');
    expect(cumple15156_3('tipo316', { ...c, pH2S_kPa: 101 }).cumple).toBe(false);
  });
  it('dúplex: 10 kPa para 22Cr y 20 kPa para 25Cr', () => {
    expect(cumple15156_3('tipo22Cr', { ...c, pH2S_kPa: 10 }).cumple).toBe(true);
    expect(cumple15156_3('tipo22Cr', { ...c, pH2S_kPa: 10.1 }).cumple).toBe(false);
    expect(cumple15156_3('tipo25Cr', { ...c, pH2S_kPa: 20 }).cumple).toBe(true);
    expect(cumple15156_3('tipo25Cr', { ...c, T_C: 233, pH2S_kPa: 5 }).cumple).toBe(false);
  });
  it('6Mo: entre las filas que se cumplen elige la de mayor margen; con Cl⁻ de 28 000 mg/L solo queda la de 60 °C', () => {
    expect(cumple15156_3('tipo6Mo', { ...c, T_C: 110, Cl_mgL: 0 })).toMatchObject({ cumple: true, fila: { tMax: 171 }, uso: expect.closeTo(0.7, 6) });
    expect(cumple15156_3('tipo6Mo', { ...c, T_C: 110 }).cumple).toBe(false);
    expect(cumple15156_3('tipo6Mo', c).cumple).toBe(true);
  });
  it('Alloy 625 y titanio no tienen límite ambiental; clave desconocida no cumple', () => {
    const r = cumple15156_3('alloy625', { ...c, T_C: 200, pH2S_kPa: 5000 });
    expect(r).toMatchObject({ cumple: true, uso: 0 });
    expect(r.motivo).toContain('sin límite ambiental');
    expect(cumple15156_3('titanio', c).cumple).toBe(true);
    expect(cumple15156_3('xx', c)).toMatchObject({ cumple: false, fila: null });
  });
});

describe('modelo 7 · agua de mar (Tabla 10), atmósfera marina (Tabla 3) y CUI (§6.6.5)', () => {
  it('agua de mar clorada con rendijas', () => {
    expect(aguaMarClorada('titanio', 45, cv)).toMatchObject({ estado: 'apto', tMax: 85 });
    expect(aguaMarClorada('titanio', 86, cv).estado).toBe('excede');
    expect(aguaMarClorada('tipo6Mo', 45, cv)).toMatchObject({ estado: 'excede', tMax: 20 });
    expect(aguaMarClorada('alloy625', 30, cv).estado).toBe('apto');
    expect(aguaMarClorada('alloyC276', 45, cv).estado).toBe('apto');
    expect(aguaMarClorada('cuni9010', 45, cv).otras).toContain('2,5 a 3,5 m/s');
    expect(aguaMarClorada(undefined, 20, cv).estado).toBe('no_listado');
    expect(aguaMarClorada('cs_recubierto', 20, cv).estado).toBe('no_listado');
  });
  it('25Cr: cloro residual máximo de 0,7 mg/L', () => {
    expect(aguaMarClorada('tipo25Cr', 15, cv, 0.5).estado).toBe('apto');
    expect(aguaMarClorada('tipo25Cr', 15, cv, 1.0).estado).toBe('excede');
    expect(aguaMarClorada('tipo25Cr', 15, cv).estado).toBe('apto');
  });
  it('inoxidable sin recubrimiento en atmósfera marina', () => {
    expect(atmosferaMarina('tipo316', 45)).toMatchObject({ estado: 'ok', limites: [50, 60] });
    expect(atmosferaMarina('tipo316', 55).estado).toBe('condicional');
    expect(atmosferaMarina('tipo316', 95).estado).toBe('excede');
    expect(atmosferaMarina('tipo22Cr', 95).estado).toBe('condicional');
    expect(atmosferaMarina('tipo6Mo', 121).estado).toBe('excede');
    expect(atmosferaMarina(undefined, 200)).toEqual({ estado: 'sin_limite', limites: null });
  });
  it('CUI solo en equipos aislados y expuestos de CS, austenítico o dúplex', () => {
    expect(riesgoCUI('CS', true, true)).toBe(true);
    expect(riesgoCUI('SS', true, true)).toBe(true);
    expect(riesgoCUI('NI', true, true)).toBe(false);
    expect(riesgoCUI('CS', false, true)).toBe(false);
    expect(riesgoCUI('CS', true, false)).toBe(false);
  });
});

describe('modelos 8 y 9 · amina y TEG', () => {
  const a = { tipo: 'MDEA' as const, conc: 45, carga: 0.45, vel: 1, hss: 1 };
  it('severidad de amina rica: temperatura, carga, velocidad y sales termoestables', () => {
    expect(severidadAmina('amina_rica', 60, a, cv)).toMatchObject({ n: 0, nivel: 'baja' });
    expect(severidadAmina('amina_rica', 95, a, cv)).toMatchObject({ n: 1, nivel: 'moderada' });
    const alta = severidadAmina('amina_rica', 95, { ...a, carga: 0.5, vel: 2, hss: 3 }, cv);
    expect(alta).toMatchObject({ n: 4, nivel: 'alta' });
    expect(alta.factores[1]).toContain('0,5 mol/mol');
  });
  it('severidad de amina pobre: zona caliente y velocidad', () => {
    expect(severidadAmina('amina_pobre', 105, a, cv).n).toBe(0);
    expect(severidadAmina('amina_pobre', 125, { ...a, vel: 3.5 }, cv).n).toBe(2);
  });
  it('los criterios de amina son editables', () => {
    expect(severidadAmina('amina_rica', 95, a, { ...cv, amina_t_rica: 100 }).n).toBe(0);
  });
  it('PWHT según el tipo de amina', () => {
    expect(requierePWHT('MEA', 20)).toEqual({ requiere: true, umbral: null });
    expect(requierePWHT('DEA', 50)).toEqual({ requiere: false, umbral: 60 });
    expect(requierePWHT('MDEA', 100)).toEqual({ requiere: true, umbral: 82 });
    expect(requierePWHT('otra', 20).requiere).toBe(true);
  });
  it('severidad de TEG: película, contaminación y pH', () => {
    expect(severidadTEG({ Tpel: 190, contaminado: 'no' }, 7, cv).n).toBe(0);
    expect(severidadTEG({ Tpel: 215, contaminado: 'no' }, 7, cv)).toMatchObject({ n: 1, nivel: 'moderada' });
    expect(severidadTEG({ Tpel: 215, contaminado: 'si' }, 5, cv)).toMatchObject({ n: 3, nivel: 'alta' });
  });
});

describe('modelo 10 · mecánica', () => {
  it('UG-27 para el separador: 50 bar, Ø 1,8 m', () => {
    const r = espesorUG27(5, 900, 138, 1);
    expect(r.t_mm).toBeCloseTo(33.33, 2);
    expect(r.valido).toBe(true);
  });
  it('marca cuando la fórmula no aplica', () => {
    expect(espesorUG27(60, 900, 138, 1).valido).toBe(false); // P > 0,385·S·E
    expect(espesorUG27(300, 900, 138, 1)).toEqual({ t_mm: Infinity, valido: false });
    expect(espesorUG27(-1, 900, 138, 1).valido).toBe(false);
  });
  it('compara espesor de presión + sobreespesor con el del inventario', () => {
    const ok = verificarEspesor({ P_bar: 50, D_m: 1.8, e_mm: 45, CA_mm: 6, S_MPa: 138, E: 1 });
    expect(ok).toMatchObject({ cumple: true, tRequerido_mm: expect.closeTo(39.33, 2), margen_mm: expect.closeTo(5.67, 2), caDisponible_mm: expect.closeTo(11.67, 2) });
    expect(verificarEspesor({ P_bar: 50, D_m: 1.8, e_mm: 35, CA_mm: 6, S_MPa: 138, E: 1 }).cumple).toBe(false);
  });
  it('velocidad erosional de API RP 14E en SI y velocidad en boquillas', () => {
    expect(velocidadErosional(100, 50)).toBeCloseTo(17.25, 2);
    expect(densidadGas(50, 95, 20)).toBeCloseTo(32.67, 2);
    expect(densidadGas(50, 95, 20, 0.9)).toBeCloseTo(36.3, 1);
    const b = velocidadBoquilla(0.5, 193.7, 32.67, 100);
    expect(b.v).toBeCloseTo(16.97, 2);
    expect(b.excede).toBe(false);
    expect(velocidadBoquilla(1, 193.7, 32.67, 100).excede).toBe(true);
  });
});

describe('modelo 11 · elastómeros (ISO 23936-2)', () => {
  const c01: CondicionSello = {
    Tmax_C: 120, Tmin_C: 5, P_bar: 50, yCO2_pct: 1.8, yH2S_pct: 1.4, gas: true,
    hidrocarburo: true, aromaticos: true, alcalino: false, metanol: false, agua: true, h2s: true,
  };
  const apt = (c: CondicionSello) => Object.fromEntries(evaluarElastomeros(c).map((e) => [e.id, e.aptitud]));
  it('Tabla C.1 para C01: agrio con hidrocarburo a 120 °C', () => {
    expect(apt(c01)).toEqual({
      EPDM: 'no_apto', CR: 'no_apto', NBR: 'no_apto', HNBR: 'condicional', 'FKM 1': 'condicional', 'FKM 2': 'condicional',
      'FKM 3': 'condicional', 'FKM 5': 'condicional', FEPM: 'condicional', ETP: 'condicional', FFKM: 'apto',
    });
    const nbr = evaluarElastomeros(c01).find((e) => e.id === 'NBR')!;
    expect(nbr.motivos).toEqual(['No apto para H₂S.']);
  });
  it('Tabla C.1 para amina: los FKM 1 a 3 no resisten fluido alcalino', () => {
    const r = apt({ ...c01, Tmax_C: 60, hidrocarburo: false, aromaticos: false, alcalino: true, h2s: false });
    expect(r['FKM 1']).toBe('no_apto');
    expect(r.EPDM).toBe('apto');
    expect(r.HNBR).toBe('apto');
    expect(apt({ ...c01, Tmax_C: 60, metanol: true, h2s: false })['FKM 3']).toBe('no_apto');
  });
  it('riesgo de RGD según la Tabla F.1', () => {
    expect(riesgoRGD(c01, cv).nivel).toBe('bajo');
    expect(riesgoRGD({ ...c01, yCO2_pct: 56 }, cv).nivel).toBe('medio');
    expect(riesgoRGD({ ...c01, P_bar: 100 }, cv).nivel).toBe('medio');
    expect(riesgoRGD({ ...c01, P_bar: 100, yCO2_pct: 20 }, cv).nivel).toBe('alto');
    expect(riesgoRGD({ ...c01, P_bar: 320 }, cv).nivel).toBe('alto');
    expect(riesgoRGD({ ...c01, gas: false }, cv).nivel).toBe('no_aplica');
  });
  it('clase de temperatura más estrecha de la Tabla A.6', () => {
    expect(claseTemperatura(5, 120)).toMatchObject({ clase: 'V', ensayo: [136, 151, 166] });
    expect(claseTemperatura(5, 60)!.clase).toBe('S');
    expect(claseTemperatura(-10, 120)!.clase).toBe('U');
    expect(claseTemperatura(5, 150)!.clase).toBe('X');
    expect(claseTemperatura(5, 204)).toMatchObject({ clase: 'Y', ensayo: null });
    expect(claseTemperatura(5, 400)).toBeNull();
  });
  it('plan de envejecimiento del Anexo A', () => {
    const p = planEnvejecimiento(c01);
    expect(p.liquido).toContain('A.1.ii');
    expect(p.gas).toContain('A.3.i');
    expect(p.distribucion).toContain('Tabla A.5');
    expect(p.tEnsayo).toEqual([136, 151, 166]);
    expect(p.aceptacion[0]).toBe('Dureza: +10/-20 unidades (+5/-20 si la nominal es 90)');
    expect(p.aceptacion[1]).toBe('Volumen: +25 %/-5 %');
    const dulce = planEnvejecimiento({ ...c01, h2s: false, aromaticos: false });
    expect(dulce.gas).toContain('A.2.i');
    expect(dulce.liquido).toContain('A.1.i ·');
    expect(dulce.distribucion).toContain('Tabla A.4');
    expect(planEnvejecimiento({ ...c01, yH2S_pct: 43.8 }).gas).toContain('A.3.ii');
    expect(planEnvejecimiento({ ...c01, Tmax_C: 400 }).tEnsayo).toBeNull();
  });
  it('ensayo RGD del Anexo B: calificación máxima de 3 y cobertura del ensayo normalizado', () => {
    expect(ENSAYO_RGD).toMatchObject({ presion_MPa: 15, temperatura_C: 100, despresurizacion_MPa_min: 2, ciclos: 8, csd_mm: 5.33 });
    expect(calificacionRGD([0, 0, 3, 2, 1, 0], cv)).toEqual({ final: [3, 2, 1, 0], aprueba: true });
    expect(calificacionRGD([3, 4, 5, 4, 3, 2, 1, 0], cv)).toEqual({ final: [5, 4, 4, 3], aprueba: false });
    expect(calificacionRGD([], cv).aprueba).toBe(false);
    expect(ensayoRGDCubre(50, 95)).toBe(true);
    expect(ensayoRGDCubre(50, 120)).toBe(false);
    expect(ensayoRGDCubre(320, 95)).toBe(false);
  });
  it('termoplásticos: límites de ISO 21457 y pendientes de ISO 23936-1', () => {
    const r = Object.fromEntries(evaluarTermoplasticos(65, 'agua_dulce').map((t) => [t.id, t]));
    expect(r.PE).toMatchObject({ estado: 'excede', tMax: 60, verificado: true });
    expect(r.PP!.estado).toBe('apto');
    expect(r.PTFE).toMatchObject({ estado: 'pendiente', tMax: null, verificado: false });
    const mar = Object.fromEntries(evaluarTermoplasticos(45, 'agua_mar').map((t) => [t.id, t.estado]));
    expect(mar).toMatchObject({ PE: 'apto', PP: 'pendiente', 'GRP epoxi': 'apto' });
  });
});

describe('modelo 12 · API 6A (comparativa, sin verificar)', () => {
  it('clase de material por servicio y pCO₂', () => {
    expect(claseMaterialAPI6A(false, 0.01, cv)).toMatchObject({ clase: 'AA', corrosividad: 0 });
    expect(claseMaterialAPI6A(false, 0.1, cv).clase).toBe('BB');
    expect(claseMaterialAPI6A(false, 0.3, cv).clase).toBe('CC');
    expect(claseMaterialAPI6A(true, 0.01, cv).clase).toBe('DD');
    expect(claseMaterialAPI6A(true, 0.09, cv)).toMatchObject({ clase: 'EE', corrosividadTxt: 'levemente corrosivo' });
    expect(claseMaterialAPI6A(true, 0.3, cv).clase).toBe('FF');
    expect(claseMaterialAPI6A(true, 0.09, cv, true)).toMatchObject({ clase: 'HH', cuerpo: 'CRA' });
    expect(claseMaterialAPI6A(true, 0.01, cv, true).clase).toBe('DD');
    expect(claseMaterialAPI6A(true, 0.09, cv).fluidoSellos).toBe('10 % H₂S, 5 % CO₂ y 85 % CH₄');
  });
});
