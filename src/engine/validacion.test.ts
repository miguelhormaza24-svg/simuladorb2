/**
 * VALORES DE CONTROL OBLIGATORIOS DEL PROYECTO.
 * Cada prueba reproduce un valor dado por el usuario. El informe está en
 * docs/validacion.md.
 */
import { describe, expect, it } from 'vitest';
import { valoresCriterio } from '../data/criterios';
import { CORRIENTES } from '../data/corrientes';
import { EQUIPOS } from '../data/equipos';
import { dwm1991 } from './co2';
import { entradaDePieza, evaluarPieza } from './evaluarPieza';
import { claseSobreespesor, crEfectiva, sobreespesorRequerido } from './inhibicion';
import { presionesParciales } from './presiones';
import { severidadSSC } from './ssc';

const cv = valoresCriterio();
const pieza = (eq: string, pz: string, cambios = {}) => {
  const e = EQUIPOS.find((x) => x.id === eq)!;
  return evaluarPieza(entradaDePieza(e, e.piezas.find((p) => p.id === pz)!, CORRIENTES, cambios), cv);
};

describe('Valores de control', () => {
  it('C1 · dWM a 95 °C, 50 bar y pCO₂ 0,9 bar: ≈12,6 mm/a sin película y ≈9,3 mm/a con película', () => {
    const pp = presionesParciales(50, 1.4, 1.8, 95);
    expect(pp.pCO2.bar).toBeCloseTo(0.9, 10);
    const sin = dwm1991({ T_C: 95, fCO2_bar: pp.fCO2, conPelicula: false });
    const con = dwm1991({ T_C: 95, fCO2_bar: pp.fCO2 });
    expect(sin.v).toBeCloseTo(12.6, 1);
    expect(con.v).toBeCloseTo(9.3, 1);
  });

  it('C2 · pH₂S de C01 a 50 bar = 70 kPa: servicio agrio', () => {
    const s = CORRIENTES.C01!;
    const pp = presionesParciales(s.P.v, s.H2S.v, s.CO2.v, s.T.v);
    expect(pp.pH2S.kPa).toBeCloseTo(70, 6);
    const ssc = severidadSSC(pp.pH2S.kPa, s.pH.v, cv);
    expect(ssc.agrio).toBe(true);
    expect(ssc.region).toBe(3);
  });

  it('C3 · C07 con 4 ppmv de H₂S: 0,02 kPa, región 0', () => {
    const s = CORRIENTES.C07!;
    expect(s.H2S.v).toBeCloseTo(0.0004, 10); // 4 ppmv en % mol
    const pp = presionesParciales(s.P.v, s.H2S.v, s.CO2.v, s.T.v);
    expect(pp.pH2S.kPa).toBeCloseTo(0.02, 6);
    expect(severidadSSC(pp.pH2S.kPa, s.pH.v, cv).region).toBe(0);
  });

  it('C4 · 316L con Tmáx de 120 °C en servicio agrio: excluido por ISO 15156-3', () => {
    const r = pieza('E1-REC', 'demister');
    expect(r.entrada.Tmax).toBe(120);
    expect(r.ssc.agrio).toBe(true);
    const m = r.materiales.find((x) => x.id === 'ss316')!;
    expect(m.viable).toBe(false);
    const ex = m.hallazgos.find((h) => h.tipo === 'exclusion' && h.regla === 'iso15156_3')!;
    expect(ex.norma).toBe('ISO 15156-3:2020');
    expect(ex.clausula).toBe('Tabla A.2');
    expect(ex.verificado).toBe(false); // el Anexo A no está en el PDF adjunto
  });

  it('C5 · tubos de condensador con C13-W a 45 °C: solo titanio Gr 2 es viable (Tabla 10)', () => {
    const r = pieza('E2-REG', 'cond');
    expect(r.entrada.servicio).toMatchObject({ id: 'C13-W', tipo: 'agua_mar', Tmax: 45 });
    expect(r.ranking.map((m) => m.id)).toEqual(['ti2']);
    expect(r.mejor!.id).toBe('ti2');
    // La Tabla 10 también admite a 45 °C dos aleaciones que no están en la lista del inventario.
    expect(r.fueraDeLista.map((m) => m.id).sort()).toEqual(['a59', 'c276']);
    for (const id of ['mo6', 'a625', 'dss25']) {
      const m = r.materiales.find((x) => x.id === id)!;
      expect(m.hallazgos.some((h) => h.regla === 'agua_mar_T' && h.clausula === '§7.4.3, Tabla 10' && h.verificado)).toBe(true);
    }
  });

  it('C6 · separador con 99 % de disponibilidad de inhibidor: CA ≈ 4,8 mm, acero al carbono viable con 6 mm', () => {
    const r = pieza('E1-SEP', 'virola', { inhibidor: 99 });
    expect(r.corrosion.crBase).toBeCloseTo(9.3, 1);
    expect(r.corrosion.caRequerido).toBeCloseTo(4.8, 1);
    expect(r.corrosion.clase).toMatchObject({ clave: 2, ca: 6 });
    expect(r.materiales.find((m) => m.id === 'cs')!.viable).toBe(true);
    // comprobación directa de la fórmula
    const ca = sobreespesorRequerido(crEfectiva(9.3, 99, 0.1), 25);
    expect(ca).toBeCloseTo(4.8, 2);
    expect(claseSobreespesor(ca, cv).ca).toBe(6);
    // sin inhibidor no es viable
    expect(pieza('E1-SEP', 'virola').materiales.find((m) => m.id === 'cs')!.viable).toBe(false);
  });
});
