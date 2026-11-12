import { describe, expect, it } from 'vitest';
import { valoresCriterio } from '../data/criterios';
import { CORRIENTES } from '../data/corrientes';
import { EQUIPOS } from '../data/equipos';
import { conPunto, distribuciones, monteCarloPieza, rangosPorDefecto, tornadoPieza } from './analisis';
import { condicionSello } from './elastomeros';
import { advertenciaTraslado, aplicarPresets, esCorrienteTratada, PRESETS, presetPorId } from './escenarios';
import { entradaDePieza, evaluarPieza } from './evaluarPieza';

const cv = valoresCriterio();
const entrada = (eq: string, pz: string, cambios = {}) => {
  const e = EQUIPOS.find((x) => x.id === eq)!;
  return entradaDePieza(e, e.piezas.find((p) => p.id === pz)!, CORRIENTES, cambios);
};

describe('escenarios', () => {
  const base = entrada('E1-SEP', 'virola');
  it('cada preset tiene grupo, nombre y nota', () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    expect(presetPorId('p320')!.cambios).toEqual({ P: 320 });
    expect(presetPorId('x')).toBeUndefined();
  });
  it('año 1 frente a año 8, 50 frente a 320 bar, inhibidor y MEG', () => {
    expect(aplicarPresets(base, ['ano1']).Cl).toBe(600);
    expect(aplicarPresets(base, ['ano8', 'p320', 'inh99', 'meg50', 'no_existe'])).toMatchObject({ Cl: 28000, P: 320, inhibidor: 99, wAgua: 50 });
    expect(aplicarPresets(base, []).P).toBe(50);
    const r320 = evaluarPieza(aplicarPresets(base, ['p320']), cv);
    expect(r320.pp.pH2S.kPa).toBeCloseTo(448, 6);
    expect(r320.pp.fueraDeRango).toBe(true);
  });
  it('temperatura de operación frente a máxima; Tmáx nunca queda bajo T', () => {
    expect(aplicarPresets(base, ['top'])).toMatchObject({ T: 95, Tmax: 95 });
    expect(aplicarPresets(base, ['tmax'])).toMatchObject({ T: 120, Tmax: 120 });
    expect(aplicarPresets({ ...base, T: 130, Tmax: 100 }, []).Tmax).toBe(130);
  });
  it('H₂S residual: con 100 ppmv el contactor vuelve a ser agrio', () => {
    const con = entrada('E3-CON', 'cuerpo');
    expect(evaluarPieza(aplicarPresets(con, ['h2s4']), cv).ssc.region).toBe(0);
    expect(evaluarPieza(aplicarPresets(con, ['h2s20']), cv).ssc.region).toBe(0);
    expect(evaluarPieza(aplicarPresets(con, ['h2s100']), cv).ssc.agrio).toBe(true);
  });
  it('advierte al trasladar valores de B1 a corrientes tratadas', () => {
    expect(esCorrienteTratada('C01')).toBe(false);
    expect(esCorrienteTratada('C07')).toBe(true);
    expect(advertenciaTraslado('C01', ['p320'])).toBeNull();
    expect(advertenciaTraslado('C07', ['p50', 'inh99'])).toBeNull();
    expect(advertenciaTraslado('C07', ['p320', 'tmax'])).toContain('C07 es una corriente ya tratada');
  });
});

describe('análisis de incertidumbre por pieza', () => {
  const base = entrada('E1-SEP', 'virola', { inhibidor: 99 });
  it('intervalos de partida y distribuciones triangulares', () => {
    const r = rangosPorDefecto(base);
    expect(r.P).toEqual([40, 60]);
    expect(r.inhibidor).toEqual([94, 100]);
    expect(rangosPorDefecto(entrada('E1-SEP', 'virola')).inhibidor).toEqual([0, 1]);
    const d = distribuciones(base);
    expect(d.P).toEqual({ tipo: 'triangular', min: 40, moda: 50, max: 60 });
    expect(distribuciones({ ...base, Cl: 0 }).Cl).toEqual({ tipo: 'fijo', v: 0 });
  });
  it('al mover T, Tmáx se desplaza igual', () => {
    const x = { P: 50, T: 105, CO2: 1.8, H2S: 1.4, pH: 3.9, Cl: 28000, inhibidor: 99 };
    expect(conPunto(base, x)).toMatchObject({ T: 105, Tmax: 130 });
  });
  it('tornado del sobreespesor: la disponibilidad del inhibidor domina', () => {
    const t = tornadoPieza(base, cv, 'ca');
    expect(t).toHaveLength(7);
    expect(t[0]!.variable).toBe('inhibidor');
    expect(t[0]!.base).toBeCloseTo(4.8, 1);
    expect(t.find((b) => b.variable === 'Cl')!.amplitud).toBe(0); // el Cl⁻ no entra en el modelo de CO₂
    const p = tornadoPieza(base, cv, 'pH2S');
    expect(p.find((b) => b.variable === 'P')).toMatchObject({ bajo: expect.closeTo(56, 6), alto: expect.closeTo(84, 6) });
  });
  it('Monte Carlo reproducible con probabilidades entre 0 y 1', () => {
    const a = monteCarloPieza(base, cv, 300, 5);
    const b = monteCarloPieza(base, cv, 300, 5);
    expect(a).toEqual(b);
    expect(a.n).toBe(300);
    expect(a.region['3']).toBe(1);
    expect(a.viabilidad.cs).toBeGreaterThan(0);
    expect(a.viabilidad.cs).toBeLessThan(1);
    expect(a.viabilidad.cs_c625).toBe(1);
    expect(a.ca.p10).toBeLessThan(a.ca.p50);
    expect(a.ca.p50).toBeLessThan(a.ca.p90);
    expect(monteCarloPieza(base, cv).n).toBe(500);
  });
});

describe('condición del sello a partir de la pieza', () => {
  it('C01: hidrocarburo aromático, agua, gas y H₂S', () => {
    const e = entrada('E1-REC', 'sellos');
    expect(condicionSello(e, true)).toMatchObject({ Tmax_C: 120, P_bar: 50, gas: true, hidrocarburo: true, aromaticos: true, alcalino: false, agua: true, h2s: true });
  });
  it('amina: fluido alcalino sin hidrocarburo; agua agria: sin fase gas', () => {
    expect(condicionSello(entrada('E2-ABS', 'sellos'), true)).toMatchObject({ alcalino: true, hidrocarburo: false });
    expect(condicionSello({ ...entrada('E1-SEP', 'virola'), agua: 'no' }, false)).toMatchObject({ gas: false, agua: false, h2s: false });
  });
});
