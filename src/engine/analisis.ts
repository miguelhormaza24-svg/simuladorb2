/**
 * Modelo 14 aplicado a una pieza: tornado y Monte Carlo sobre P, T, CO₂, H₂S,
 * pH, Cl⁻ y disponibilidad del inhibidor.
 */
import type { ValoresCriterio } from '../data/criterios';
import { evaluarPieza, type EntradaPieza } from './evaluarPieza';
import { monteCarlo, percentil, probabilidades, tornado, type BarraTornado, type Distribucion } from './incertidumbre';

export const VARIABLES = ['P', 'T', 'CO2', 'H2S', 'pH', 'Cl', 'inhibidor'] as const;
export type Variable = (typeof VARIABLES)[number];
export type Rangos = Record<Variable, [number, number]>;

export const NOMBRE_VARIABLE: Record<Variable, string> = {
  P: 'Presión', T: 'Temperatura', CO2: 'CO₂', H2S: 'H₂S', pH: 'pH', Cl: 'Cloruros', inhibidor: 'Disponibilidad del inhibidor',
};

/** Intervalos de partida (supuestos del grupo, editables en la interfaz). */
export function rangosPorDefecto(e: EntradaPieza): Rangos {
  return {
    P: [e.P * 0.8, e.P * 1.2],
    T: [e.T - 10, e.T + 10],
    CO2: [e.CO2 * 0.75, e.CO2 * 1.25],
    H2S: [e.H2S * 0.75, e.H2S * 1.25],
    pH: [e.pH - 0.3, e.pH + 0.3],
    Cl: [e.Cl * 0.5, e.Cl * 1.5],
    inhibidor: [Math.max(0, e.inhibidor - 5), Math.min(100, e.inhibidor + 1)],
  };
}

type Punto = Record<Variable, number>;
const punto = (e: EntradaPieza): Punto => ({ P: e.P, T: e.T, CO2: e.CO2, H2S: e.H2S, pH: e.pH, Cl: e.Cl, inhibidor: e.inhibidor });

/** Devuelve la entrada con las variables del punto; la temperatura máxima nunca queda bajo la de operación. */
export function conPunto(e: EntradaPieza, x: Punto): EntradaPieza {
  const dT = x.T - e.T;
  return { ...e, ...x, Tmax: Math.max(e.Tmax + dT, x.T) };
}

export type Objetivo = 'ca' | 'pH2S';

/** Sensibilidad del sobreespesor requerido (mm) o de la pH₂S (kPa). */
export function tornadoPieza(e: EntradaPieza, cv: ValoresCriterio, objetivo: Objetivo, rangos = rangosPorDefecto(e)): BarraTornado[] {
  const f = (x: Punto): number => {
    const r = evaluarPieza(conPunto(e, x), cv);
    return objetivo === 'ca' ? r.corrosion.caRequerido : r.pp.pH2S.kPa;
  };
  return tornado(punto(e), rangos, f);
}

export interface ResultadoMonteCarlo {
  n: number;
  semilla: number;
  /** probabilidad de que cada material sea viable */ viabilidad: Record<string, number>;
  /** probabilidad de cada región SSC */ region: Record<string, number>;
  /** percentiles del sobreespesor requerido, mm */ ca: { p10: number; p50: number; p90: number };
}

/** Distribución triangular con moda en el valor base y extremos en el intervalo. */
export function distribuciones(e: EntradaPieza, rangos = rangosPorDefecto(e)): Record<Variable, Distribucion> {
  const base = punto(e);
  const d = {} as Record<Variable, Distribucion>;
  for (const k of VARIABLES) {
    const [min, max] = rangos[k];
    d[k] = max > min ? { tipo: 'triangular', min, moda: Math.min(max, Math.max(min, base[k])), max } : { tipo: 'fijo', v: base[k] };
  }
  return d;
}

export function monteCarloPieza(
  e: EntradaPieza, cv: ValoresCriterio, n = 500, semilla = 2026, rangos = rangosPorDefecto(e),
): ResultadoMonteCarlo {
  const corridas = monteCarlo(punto(e), distribuciones(e, rangos), (x) => {
    const r = evaluarPieza(conPunto(e, x), cv);
    return {
      viable: Object.fromEntries(r.materiales.filter((m) => m.enLista).map((m) => [m.id, m.viable])),
      region: { 0: r.ssc.region === 0, 1: r.ssc.region === 1, 2: r.ssc.region === 2, 3: r.ssc.region === 3 },
      ca: r.corrosion.caRequerido,
    };
  }, n, semilla);
  const cas = corridas.map((c) => c.ca);
  return {
    n, semilla,
    viabilidad: probabilidades(corridas.map((c) => c.viable)),
    region: probabilidades(corridas.map((c) => c.region)),
    ca: { p10: percentil(cas, 10), p50: percentil(cas, 50), p90: percentil(cas, 90) },
  };
}
