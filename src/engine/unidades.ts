/** Conversión de unidades. Presiones absolutas. */
export const BAR_A_KPA = 100;
export const BAR_A_MPA = 0.1;
export const BAR_A_PSI = 14.5037738;
export const ATM_A_BAR = 1.01325;
export const KELVIN = 273.15;

export interface Presion {
  bar: number;
  kPa: number;
  MPa: number;
  psia: number;
}

export function presion(bar: number): Presion {
  return { bar, kPa: bar * BAR_A_KPA, MPa: bar * BAR_A_MPA, psia: bar * BAR_A_PSI };
}

export const aKelvin = (tC: number): number => tC + KELVIN;

export function acotar(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}
