/**
 * Modelo 4 · Corrosión por CO₂ del acero al carbono.
 *  - dwm1991: nomograma de de Waard, Lotz y Milliams con factor de película,
 *    factor de glicol y corrección por pH (opcional).
 *  - dwm1995: modelo de resistencias de de Waard, Lotz y Dugstad (reacción +
 *    transferencia de masa), que agrega el efecto de la velocidad.
 *  - NORSOK M-506 no está adjunta: no se implementa (ver NORSOK_M506).
 * Velocidades en mm/a, fugacidad en bar, temperatura en °C.
 */
import { MODELO_DWM, type ValoresCriterio } from '../data/criterios';
import { phCO2Correlacion } from './ph';
import { aKelvin } from './unidades';

const L = Math.log10;

export interface EntradaDWM {
  T_C: number;
  fCO2_bar: number;
  /** aplica el factor de película de alta temperatura (por defecto, sí) */ conPelicula?: boolean;
  /** % en peso de agua en la fase acuosa; 100 = sin glicol */ wAgua_pct?: number;
  /** si se da, aplica la corrección por pH frente al pH de saturación */ pH?: number;
}

export interface ResultadoDWM {
  /** velocidad del nomograma, sin factores */ vNom: number;
  fPelicula: number;
  fGlicol: number;
  fpH: number;
  pHsat: number;
  /** vNom × fPelícula (si aplica) */ vPelicula: number;
  /** velocidad con todos los factores activos */ v: number;
}

export function factorPelicula(T_C: number, fCO2_bar: number): number {
  const { a, b, c } = MODELO_DWM.pelicula;
  return Math.min(1, Math.pow(10, a / aKelvin(T_C) - b * L(fCO2_bar) - c));
}

export function factorGlicol(wAgua_pct: number): number {
  const W = Math.min(100, Math.max(1, wAgua_pct));
  return Math.min(1, Math.pow(10, MODELO_DWM.glicol.a * (L(W) - 2)));
}

export function phSaturacion(T_C: number, fCO2_bar: number): number {
  const { a, b, c, d, e } = MODELO_DWM.phSat;
  return Math.min(a + b / aKelvin(T_C) - c * L(fCO2_bar), d - e * L(fCO2_bar));
}

export function factorPH(pH: number, pHsat: number): number {
  const { a, b, c } = MODELO_DWM.fpH;
  return pH <= pHsat ? Math.pow(10, a * (pHsat - pH)) : Math.pow(10, -b * Math.pow(pH - pHsat, c));
}

export function dwm1991(e: EntradaDWM): ResultadoDWM {
  if (!(e.fCO2_bar > 0)) return { vNom: 0, fPelicula: 1, fGlicol: 1, fpH: 1, pHsat: NaN, vPelicula: 0, v: 0 };
  const { a, b, c } = MODELO_DWM.nomograma;
  const vNom = Math.pow(10, a - b / aKelvin(e.T_C) + c * L(e.fCO2_bar));
  const fPelicula = e.conPelicula === false ? 1 : factorPelicula(e.T_C, e.fCO2_bar);
  const fGlicol = factorGlicol(e.wAgua_pct ?? 100);
  const pHsat = phSaturacion(e.T_C, e.fCO2_bar);
  const fpH = e.pH == null ? 1 : factorPH(e.pH, pHsat);
  const vPelicula = vNom * fPelicula;
  return { vNom, fPelicula, fGlicol, fpH, pHsat, vPelicula, v: vPelicula * fGlicol * fpH };
}

export interface EntradaDWM95 {
  T_C: number;
  fCO2_bar: number;
  /** velocidad del líquido, m/s */ U_ms: number;
  /** diámetro hidráulico, m */ d_m: number;
  /** pH real; si falta se toma el del agua pura con CO₂ */ pH?: number;
  wAgua_pct?: number;
  conPelicula?: boolean;
}

export interface ResultadoDWM95 {
  /** velocidad controlada por la reacción */ vr: number;
  /** velocidad controlada por la transferencia de masa */ vm: number;
  pHCO2: number;
  v: number;
}

export function dwm1995(e: EntradaDWM95): ResultadoDWM95 {
  if (!(e.fCO2_bar > 0)) return { vr: 0, vm: 0, pHCO2: NaN, v: 0 };
  const k = MODELO_DWM.resistencias;
  const pHCO2 = phCO2Correlacion(e.T_C, e.fCO2_bar, '1995');
  const pH = e.pH ?? pHCO2;
  const vr = Math.pow(10, k.a - k.b / aKelvin(e.T_C) + k.c * L(e.fCO2_bar) - k.d * (pH - pHCO2));
  const vm = (k.e * Math.pow(Math.max(e.U_ms, 1e-6), 0.8)) / Math.pow(Math.max(e.d_m, 1e-6), 0.2) * e.fCO2_bar;
  const base = 1 / (1 / vr + 1 / vm);
  const fPelicula = e.conPelicula === false ? 1 : factorPelicula(e.T_C, e.fCO2_bar);
  return { vr, vm, pHCO2, v: base * fPelicula * factorGlicol(e.wAgua_pct ?? 100) };
}

export type ClaveRegimen = 'sin_h2s' | 'h2s' | 'mixto' | 'co2';

export interface Regimen {
  clave: ClaveRegimen;
  texto: string;
  /** el modelo de CO₂ no representa bien el régimen */ advertencia: boolean;
}

/** Régimen de corrosión según pCO₂/pH₂S (umbrales de literatura, editables). */
export function regimenH2S(razon: number, cv?: ValoresCriterio): Regimen {
  const rH2S = cv?.regimen_h2s ?? 20;
  const rCO2 = cv?.regimen_co2 ?? 500;
  if (!Number.isFinite(razon)) {
    return { clave: 'sin_h2s', texto: 'Sin H₂S: corrosión dominada por CO₂.', advertencia: false };
  }
  if (razon < rH2S) {
    return {
      clave: 'h2s', advertencia: true,
      texto: `pCO₂/pH₂S < ${rH2S}: domina el H₂S. La película de sulfuro de hierro suele proteger y el modelo de CO₂ tiende a sobrestimar la pérdida general, pero si la película se daña hay picadura y ningún modelo aceptado la predice (ISO 21457 §6.2.2.2).`,
    };
  }
  if (razon <= rCO2) {
    return { clave: 'mixto', advertencia: true, texto: `Régimen mixto CO₂/H₂S (pCO₂/pH₂S entre ${rH2S} y ${rCO2}): usar el modelo de CO₂ con cautela.` };
  }
  return { clave: 'co2', advertencia: false, texto: `pCO₂/pH₂S > ${rCO2}: domina el CO₂.` };
}
