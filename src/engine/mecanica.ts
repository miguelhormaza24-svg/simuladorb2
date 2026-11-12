/**
 * Modelo 10 · Verificaciones mecánicas (normas no adjuntas, ver MECANICA).
 *  - Espesor por presión interna de un cilindro: ASME VIII-1 UG-27(c)(1).
 *  - Velocidad erosional: API RP 14E, con C editable.
 */
import { MECANICA } from '../data/criterios';
import { aKelvin } from './unidades';

export interface EspesorPresion {
  /** espesor por presión, sin sobreespesor, mm */ t_mm: number;
  /** la fórmula de pared delgada aplica (t ≤ R/2 y P ≤ 0,385·S·E) */ valido: boolean;
}

export function espesorUG27(P_MPa: number, R_mm: number, S_MPa: number, E: number): EspesorPresion {
  const den = S_MPa * E - 0.6 * P_MPa;
  if (!(den > 0) || !(P_MPa >= 0)) return { t_mm: Infinity, valido: false };
  const t_mm = (P_MPa * R_mm) / den;
  return { t_mm, valido: t_mm <= R_mm / 2 && P_MPa <= MECANICA.limiteUG27 * S_MPa * E };
}

export interface VerificacionEspesor extends EspesorPresion {
  /** espesor por presión + sobreespesor, mm */ tRequerido_mm: number;
  /** espesor del inventario − requerido, mm */ margen_mm: number;
  /** sobreespesor máximo que admite el espesor del inventario, mm */ caDisponible_mm: number;
  cumple: boolean;
}

export function verificarEspesor(p: {
  P_bar: number; D_m: number; e_mm: number; CA_mm: number; S_MPa: number; E: number;
}): VerificacionEspesor {
  const base = espesorUG27(p.P_bar / 10, (p.D_m * 1000) / 2, p.S_MPa, p.E);
  const tRequerido_mm = base.t_mm + p.CA_mm;
  return {
    ...base, tRequerido_mm,
    margen_mm: p.e_mm - tRequerido_mm,
    caDisponible_mm: p.e_mm - base.t_mm,
    cumple: base.valido && p.e_mm >= tRequerido_mm,
  };
}

/** Velocidad erosional en m/s para una densidad de mezcla en kg/m³. */
export function velocidadErosional(C: number, rho_kg_m3: number): number {
  return (MECANICA.factorSI * C) / Math.sqrt(rho_kg_m3);
}

/** Densidad de un gas real, kg/m³. M en g/mol. */
export function densidadGas(P_bar: number, T_C: number, M_g_mol: number, Z = 1): number {
  return (P_bar * 1e5 * (M_g_mol / 1000)) / (Z * 8.314462 * aKelvin(T_C));
}

export interface VelocidadBoquilla {
  /** m/s */ v: number;
  ve: number;
  /** v/ve */ razon: number;
  excede: boolean;
}

/** Velocidad en una boquilla frente a la erosional. Q en m³/s reales; DI en mm. */
export function velocidadBoquilla(Q_m3_s: number, DI_mm: number, rho_kg_m3: number, C: number): VelocidadBoquilla {
  const area = (Math.PI * Math.pow(DI_mm / 1000, 2)) / 4;
  const v = Q_m3_s / area;
  const ve = velocidadErosional(C, rho_kg_m3);
  return { v, ve, razon: v / ve, excede: v > ve };
}
