/**
 * Modelo 7 · Aleaciones resistentes a la corrosión (CRA).
 *  - PREN con la Ec. (1) de ISO 21457.
 *  - Límites ambientales de ISO 15156-3 Anexo A (sin verificar: ver criterios.ts).
 *  - Agua de mar clorada: ISO 21457 Tabla 10.
 *  - Atmósfera marina: ISO 21457 Tabla 3.
 *  - Corrosión bajo aislamiento: ISO 21457 §6.6.5 (cualitativo).
 */
import {
  CUI, LIMITES_15156_3, PREN_CLASES, TABLA10_AGUA_MAR, TABLA3_ATMOSFERA_MARINA,
  type Limite15156, type ValoresCriterio,
} from '../data/criterios';
import type { Material } from '../data/materiales';

export interface Composicion { Cr: number; Mo?: number; W?: number; N?: number }

export function pren(c: Composicion): number {
  const k = PREN_CLASES.coef;
  return c.Cr + k.Mo * ((c.Mo ?? 0) + k.W * (c.W ?? 0)) + k.N * (c.N ?? 0);
}

export interface PrenRango { min: number; nominal: number; max: number }

/** PREN con los extremos y el punto medio de la composición de la Tabla C.1. */
export function prenMaterial(m: Material): PrenRango | null {
  if (!m.comp) return null;
  const en = (i: 0 | 1): Composicion => ({
    Cr: m.comp!.Cr[i], Mo: m.comp!.Mo[i], W: m.comp!.W?.[i], N: m.comp!.N?.[i],
  });
  const min = pren(en(0));
  const max = pren(en(1));
  return { min, nominal: (min + max) / 2, max };
}

export interface Condicion15156 { T_C: number; pH2S_kPa: number; Cl_mgL: number; pH: number }

export interface Resultado15156 {
  cumple: boolean;
  /** fila que se cumple, o la más cercana si no cumple */ fila: Limite15156 | null;
  /** mayor fracción de uso del límite en la fila elegida (1 = en el límite) */ uso: number;
  motivo: string;
}

const dentro = (x: number, lim: number | null): boolean => lim == null || x <= lim;
const fmt = (x: number): string => x.toLocaleString('es-CO', { maximumFractionDigits: 1 });

function describir(f: Limite15156): string {
  const p: string[] = [];
  if (f.tMax != null) p.push(`T ≤ ${fmt(f.tMax)} °C`);
  if (f.pH2S_kPa != null) p.push(`pH₂S ≤ ${fmt(f.pH2S_kPa)} kPa`);
  if (f.cl_mgL != null) p.push(`Cl⁻ ≤ ${fmt(f.cl_mgL)} mg/L`);
  if (f.pHmin != null) p.push(`pH ≥ ${fmt(f.pHmin)}`);
  return p.length ? p.join(', ') : 'sin límite ambiental';
}

/** Comprueba la condición contra las filas admisibles del material. */
export function cumple15156_3(clave: string, c: Condicion15156): Resultado15156 {
  const lim = LIMITES_15156_3[clave];
  if (!lim) return { cumple: false, fila: null, uso: Infinity, motivo: 'Sin límites cargados para este material.' };
  let mejor: { fila: Limite15156; uso: number; ok: boolean } | null = null;
  for (const fila of lim.filas) {
    const ok = dentro(c.T_C, fila.tMax) && dentro(c.pH2S_kPa, fila.pH2S_kPa) && dentro(c.Cl_mgL, fila.cl_mgL)
      && (fila.pHmin == null || c.pH >= fila.pHmin);
    const uso = Math.max(
      fila.tMax != null ? c.T_C / fila.tMax : 0,
      fila.pH2S_kPa != null ? c.pH2S_kPa / fila.pH2S_kPa : 0,
      fila.cl_mgL != null ? c.Cl_mgL / fila.cl_mgL : 0,
    );
    if (!mejor || (ok && !mejor.ok) || (ok === mejor.ok && uso < mejor.uso)) mejor = { fila, uso, ok };
  }
  const m = mejor!;
  const cond = `T ${fmt(c.T_C)} °C, pH₂S ${fmt(c.pH2S_kPa)} kPa, Cl⁻ ${fmt(c.Cl_mgL)} mg/L, pH ${fmt(c.pH)}`;
  return {
    cumple: m.ok, fila: m.fila, uso: m.uso,
    motivo: m.ok ? `Dentro de ${lim.fuente.clausula}: ${describir(m.fila)}.`
      : `Fuera de ${lim.fuente.clausula} (${describir(m.fila)}) con ${cond}.`,
  };
}

export interface ResultadoAguaMar {
  estado: 'apto' | 'excede' | 'no_listado';
  tMax: number | null;
  motivo: string;
  otras?: string;
}

/** Lado de agua de mar clorada con rendijas (Tabla 10). */
export function aguaMarClorada(
  claveAguaMar: string | undefined, T_C: number, cv: ValoresCriterio, cloroResidual_mgL?: number,
): ResultadoAguaMar {
  const fila = TABLA10_AGUA_MAR.filas.find((f) => f.material === claveAguaMar);
  if (!fila || fila.tMax == null) {
    return { estado: 'no_listado', tMax: null, motivo: 'No figura en la Tabla 10 para agua de mar clorada con rendijas; con agua de mar en intercambiadores de carcasa y tubos el inoxidable generalmente no se usa (§7.4.3).' };
  }
  if (T_C > fila.tMax) {
    return { estado: 'excede', tMax: fila.tMax, otras: fila.otras, motivo: `Agua de mar clorada a ${fmt(T_C)} °C: supera los ${fmt(fila.tMax)} °C de la Tabla 10.` };
  }
  if (claveAguaMar === 'tipo25Cr' && cloroResidual_mgL != null && cloroResidual_mgL > cv.cloro_residual_25cr!) {
    return { estado: 'excede', tMax: fila.tMax, otras: fila.otras, motivo: `Cloro residual de ${fmt(cloroResidual_mgL)} mg/L: supera el máximo de ${fmt(cv.cloro_residual_25cr!)} mg/L para 25Cr.` };
  }
  return { estado: 'apto', tMax: fila.tMax, otras: fila.otras, motivo: `Admitido hasta ${fmt(fila.tMax)} °C en agua de mar clorada con rendijas.` };
}

export interface ResultadoAtmosfera {
  estado: 'ok' | 'condicional' | 'excede' | 'sin_limite';
  limites: [number, number] | null;
}

/** Inoxidable sólido sin recubrimiento en atmósfera marina (Tabla 3). */
export function atmosferaMarina(claveAtm: string | undefined, T_C: number): ResultadoAtmosfera {
  const lim = claveAtm ? TABLA3_ATMOSFERA_MARINA.limites[claveAtm] : undefined;
  if (!lim) return { estado: 'sin_limite', limites: null };
  if (T_C <= lim[0]) return { estado: 'ok', limites: lim };
  if (T_C <= lim[1]) return { estado: 'condicional', limites: lim };
  return { estado: 'excede', limites: lim };
}

/** §6.6.5: la corrosión bajo aislamiento se considera en CS, austeníticos y dúplex aislados. */
export function riesgoCUI(familia: string, aislado: boolean, expuesto: boolean): boolean {
  return aislado && expuesto && CUI.familias.includes(familia);
}
