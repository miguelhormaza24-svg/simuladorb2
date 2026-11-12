import { describe, expect, it } from 'vitest';
import { FIGURA1_SSC, valoresCriterio } from '../data/criterios';
import { dwm1991, dwm1995, factorGlicol, factorPH, factorPelicula, phSaturacion, regimenH2S } from './co2';
import { claseSobreespesor, crEfectiva, disponibilidadMinima, llevaSobreespesor } from './inhibicion';
import { compararPH, constantesEquilibrio, phCO2Correlacion, phInSitu } from './ph';
import { coefFugacidadCO2, presionesParciales } from './presiones';
import { phFrontera, severidadSSC } from './ssc';
import { aKelvin, acotar, presion } from './unidades';

const cv = valoresCriterio();

describe('unidades', () => {
  it('convierte presiones', () => {
    const p = presion(50);
    expect(p).toMatchObject({ bar: 50, kPa: 5000, MPa: 5 });
    expect(p.psia).toBeCloseTo(725.19, 2);
    expect(aKelvin(25)).toBeCloseTo(298.15, 10);
    expect(acotar(5, 0, 1)).toBe(1);
    expect(acotar(-5, 0, 1)).toBe(0);
  });
});

describe('modelo 1 · presiones parciales y fugacidad', () => {
  it('calcula pH₂S y pCO₂ en las cuatro unidades', () => {
    const pp = presionesParciales(50, 1.4, 1.8, 95, cv);
    expect(pp.pH2S).toMatchObject({ bar: expect.closeTo(0.7, 10), kPa: expect.closeTo(70, 8), MPa: expect.closeTo(0.07, 10) });
    expect(pp.pH2S.psia).toBeCloseTo(10.153, 3);
    expect(pp.pCO2.bar).toBeCloseTo(0.9, 10);
    expect(pp.phiCO2).toBeCloseTo(0.9223, 4);
    expect(pp.fCO2).toBeCloseTo(0.83, 3);
    expect(pp.razon).toBeCloseTo(1.2857, 4);
    expect(pp.fueraDeRango).toBe(false);
  });
  it('acota la presión de la fugacidad a 250 bar y marca el cabezal de 320 bar', () => {
    const pp = presionesParciales(320, 1.4, 1.8, 95, cv);
    expect(pp.fueraDeRango).toBe(true);
    expect(pp.phiCO2).toBeCloseTo(coefFugacidadCO2(250, 95), 12);
    expect(pp.pH2S.kPa).toBeCloseTo(448, 6);
  });
  it('sin H₂S la razón es infinita y no admite fracciones negativas', () => {
    expect(presionesParciales(50, 0, 1.8, 95).razon).toBe(Infinity);
    expect(presionesParciales(50, -1, -1, 95).pCO2.bar).toBe(0);
    expect(coefFugacidadCO2(0, 95)).toBe(1);
  });
});

describe('modelo 2 · pH in situ', () => {
  it('reproduce las constantes conocidas a 25 °C', () => {
    const k = constantesEquilibrio(25);
    expect(-Math.log10(k.k1CO2)).toBeCloseTo(6.352, 2);
    expect(-Math.log10(k.k2CO2)).toBeCloseTo(10.329, 2);
    expect(-Math.log10(k.k1H2S)).toBeCloseTo(6.98, 2);
    expect(-Math.log10(k.kw)).toBeCloseTo(13.995, 2);
    expect(k.khCO2 * 1.01325).toBeCloseTo(0.034, 3);
    expect(k.khH2S).toBeCloseTo(0.097, 2);
  });
  it('agua pura con 1 bar de CO₂ a 25 °C: pH ≈ 3,9, cerca de la correlación de de Waard', () => {
    const r = phInSitu({ T_C: 25, fCO2_bar: 1, pH2S_bar: 0 });
    expect(r.pH).toBeGreaterThan(3.85);
    expect(r.pH).toBeLessThan(3.95);
    expect(r.aporteH2S).toBe(0);
    expect(Math.abs(r.pH - phCO2Correlacion(25, 1))).toBeLessThan(0.15);
    expect(phCO2Correlacion(95, 0.83, '1995')).toBeCloseTo(3.82 + 0.00384 * 95 - 0.5 * Math.log10(0.83), 10);
  });
  it('el bicarbonato sube el pH según Henderson–Hasselbalch', () => {
    const k = constantesEquilibrio(25);
    const esperado = -Math.log10(k.k1CO2) + Math.log10(0.01 / (k.khCO2 * 1));
    expect(phInSitu({ T_C: 25, fCO2_bar: 1, pH2S_bar: 0, HCO3_mgL: 610.17 }).pH).toBeCloseTo(esperado, 2);
  });
  it('en C01 a 50 bar el H₂S aporta más acidez que el CO₂ y el pH calculado queda cerca de 3,9', () => {
    const r = phInSitu({ T_C: 95, fCO2_bar: 0.83, pH2S_bar: 0.7 });
    expect(r.pH).toBeGreaterThan(3.8);
    expect(r.pH).toBeLessThan(4.1);
    expect(r.aporteH2S).toBeGreaterThan(0.5);
    const e = r.especies;
    expect(e.H).toBeCloseTo(e.HCO3 + 2 * e.CO3 + e.HS + e.OH, 9); // electroneutralidad
  });
  it('sin gases ácidos da agua neutra y compara con el pH ingresado', () => {
    const r = phInSitu({ T_C: 25, fCO2_bar: 0, pH2S_bar: 0 });
    expect(r.pH).toBeCloseTo(7.0, 1);
    expect(r.aporteH2S).toBe(0);
    expect(compararPH(4.0, 3.5)).toMatchObject({ masAcido: true, masAlcalino: false });
    expect(compararPH(4.0, 4.5).masAlcalino).toBe(true);
    expect(compararPH(4.0, 4.1)).toMatchObject({ masAcido: false, masAlcalino: false });
  });
});

describe('modelo 3 · regiones SSC (ISO 15156-2, Figura 1)', () => {
  it.each([
    [0.02, 4.5, 0], [0.29, 3.0, 0], [0.3, 6.0, 1], [0.5, 3.6, 2], [0.5, 3.4, 3],
    [1, 4.6, 1], [1, 4.4, 2], [1, 3.4, 3], [10, 5.6, 1], [10, 5.0, 2], [10, 4.4, 3],
    [70, 3.9, 3], [100, 6.6, 1], [100, 6.0, 2], [500, 6.6, 1], [500, 6.0, 2], [500, 5.4, 3],
  ])('pH₂S %f kPa y pH %f → región %i', (p, ph, region) => {
    expect(severidadSSC(p, ph, cv).region).toBe(region);
  });
  it('un punto sobre la frontera pasa a la región más severa', () => {
    expect(severidadSSC(1, 4.5, cv).region).toBe(2);
    expect(severidadSSC(1, 3.5, cv).region).toBe(3);
    expect(severidadSSC(10, 5.5, cv).region).toBe(2);
  });
  it('las fronteras son rectas en log₁₀(pH₂S) con pendiente de 1 pH por década', () => {
    expect(phFrontera(FIGURA1_SSC.fronteraSuperior, 31.6228)).toBeCloseTo(6.0, 3);
    expect(phFrontera(FIGURA1_SSC.fronteraInferior, 70)).toBeCloseTo(3.5 + Math.log10(70), 6);
    expect(phFrontera(FIGURA1_SSC.fronteraInferior, 0.5)).toBe(3.5);
    expect(phFrontera(FIGURA1_SSC.fronteraSuperior, 5000)).toBe(6.5);
    expect(phFrontera(FIGURA1_SSC.fronteraSuperior, 0.1)).toBeCloseTo(4.5 + Math.log10(0.3), 6);
  });
  it('avisa cuando el punto cae fuera de los ejes de la figura', () => {
    expect(severidadSSC(70, 9.0, cv).fueraDeFigura).toBe(true);
    expect(severidadSSC(2000, 4, cv).fueraDeFigura).toBe(true);
    expect(severidadSSC(70, 3.9).fueraDeFigura).toBe(false);
    expect(severidadSSC(NaN, 4, cv).region).toBe(0);
  });
});

describe('modelo 4 · corrosión por CO₂', () => {
  it('factores del nomograma', () => {
    expect(factorPelicula(95, 0.83)).toBeCloseTo(0.737, 3);
    expect(factorPelicula(40, 0.83)).toBe(1);
    expect(factorGlicol(100)).toBe(1);
    expect(factorGlicol(50)).toBeCloseTo(0.33, 2);
    expect(factorGlicol(0)).toBeCloseTo(Math.pow(10, -3.2), 8);
    expect(phSaturacion(95, 0.83)).toBeCloseTo(4.924, 2);
    expect(phSaturacion(20, 10)).toBeCloseTo(5.4 - 0.66, 6);
    expect(factorPH(4.924, 4.924)).toBe(1);
    expect(factorPH(3.9, 4.924)).toBeGreaterThan(1);
    expect(factorPH(6, 4.924)).toBeLessThan(1);
  });
  it('dWM 1991: glicol y pH son factores multiplicativos opcionales', () => {
    const base = dwm1991({ T_C: 95, fCO2_bar: 0.83 });
    expect(base.fpH).toBe(1);
    expect(dwm1991({ T_C: 95, fCO2_bar: 0.83, wAgua_pct: 50 }).v).toBeCloseTo(base.v * 0.33, 1);
    expect(dwm1991({ T_C: 95, fCO2_bar: 0.83, pH: 6 }).v).toBeLessThan(base.v);
    expect(dwm1991({ T_C: 95, fCO2_bar: 0 })).toMatchObject({ v: 0, vNom: 0 });
  });
  it('dWM 1995: la velocidad queda por debajo de ambas resistencias y crece con el flujo', () => {
    const lento = dwm1995({ T_C: 95, fCO2_bar: 0.83, U_ms: 1, d_m: 0.2, conPelicula: false });
    const rapido = dwm1995({ T_C: 95, fCO2_bar: 0.83, U_ms: 5, d_m: 0.2, conPelicula: false });
    expect(lento.v).toBeLessThan(Math.min(lento.vr, lento.vm));
    expect(rapido.v).toBeGreaterThan(lento.v);
    expect(lento.vr).toBeCloseTo(Math.pow(10, 4.93 - 1119 / 368.15 + 0.58 * Math.log10(0.83)), 6);
    expect(lento.vm).toBeCloseTo((2.45 / Math.pow(0.2, 0.2)) * 0.83, 6);
    expect(dwm1995({ T_C: 95, fCO2_bar: 0.83, U_ms: 1, d_m: 0.2, pH: 6 }).vr).toBeLessThan(lento.vr);
    expect(dwm1995({ T_C: 95, fCO2_bar: 0.83, U_ms: 1, d_m: 0.2 }).v).toBeCloseTo(lento.v * factorPelicula(95, 0.83), 8);
    expect(dwm1995({ T_C: 95, fCO2_bar: 0, U_ms: 1, d_m: 0.2 }).v).toBe(0);
  });
  it('régimen por pCO₂/pH₂S, con advertencia cuando domina el H₂S', () => {
    expect(regimenH2S(1.29, cv)).toMatchObject({ clave: 'h2s', advertencia: true });
    expect(regimenH2S(100, cv)).toMatchObject({ clave: 'mixto', advertencia: true });
    expect(regimenH2S(1000, cv)).toMatchObject({ clave: 'co2', advertencia: false });
    expect(regimenH2S(Infinity)).toMatchObject({ clave: 'sin_h2s', advertencia: false });
    expect(regimenH2S(30, { ...cv, regimen_h2s: 50 }).clave).toBe('h2s');
  });
});

describe('modelos 5 y 6 · inhibición y sobreespesor', () => {
  it('pondera por disponibilidad', () => {
    expect(crEfectiva(9.3, 99, 0.1)).toBeCloseTo(0.192, 6);
    expect(crEfectiva(9.3, 0, 0.1)).toBe(9.3);
    expect(crEfectiva(9.3, 150, 0.1)).toBeCloseTo(0.1, 10);
    expect(crEfectiva(0.05, 100, 0.1)).toBe(0.05); // el inhibidor no empeora
  });
  it('disponibilidad mínima para que el acero al carbono sea viable', () => {
    expect(disponibilidadMinima(9.3, 6, 25, 0.1)).toBeCloseTo(98.48, 1);
    expect(disponibilidadMinima(0.2, 6, 25, 0.1)).toBe(0);
    expect(disponibilidadMinima(9.3, 2, 25, 0.1)).toBeNull();
  });
  it('clases de ISO 21457 §8.2 y piezas sin sobreespesor (§7.2.2)', () => {
    expect(claseSobreespesor(1, cv)).toMatchObject({ clave: 0, ca: 1.5 });
    expect(claseSobreespesor(2.5, cv)).toMatchObject({ clave: 1, ca: 3 });
    expect(claseSobreespesor(6, cv)).toMatchObject({ clave: 2, ca: 6 });
    expect(claseSobreespesor(6.1, cv)).toMatchObject({ clave: 3, ca: null });
    expect(llevaSobreespesor('recipiente')).toBe(true);
    expect(llevaSobreespesor('tubos')).toBe(false);
    expect(llevaSobreespesor('internos')).toBe(false);
  });
});
