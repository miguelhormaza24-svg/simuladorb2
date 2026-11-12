/**
 * Modelo 1 · Presiones parciales y fugacidad del CO₂.
 * pX = y·P (ISO 21457 §6.2.3.2: se usa la presión parcial en la fase gas).
 * Coeficiente de fugacidad de de Waard–Milliams: log φ = (0,0031 − 1,4/T)·P.
 */
import { MODELO_DWM, type ValoresCriterio } from '../data/criterios';
import { aKelvin, presion, type Presion } from './unidades';

export interface PresionesParciales {
  pH2S: Presion;
  pCO2: Presion;
  /** coeficiente de fugacidad del CO₂ */ phiCO2: number;
  /** fugacidad del CO₂, bar */ fCO2: number;
  /** pCO₂/pH₂S; Infinity si no hay H₂S */ razon: number;
  /** true si P supera el intervalo de validez de la ecuación de fugacidad */ fueraDeRango: boolean;
}

export function coefFugacidadCO2(P_bar: number, T_C: number, pMax_bar = 250): number {
  const { a, b } = MODELO_DWM.fugacidad;
  const P = Math.min(Math.max(P_bar, 0), pMax_bar);
  return Math.pow(10, (a - b / aKelvin(T_C)) * P);
}

/** P en bar abs; fracciones en % mol; T en °C. */
export function presionesParciales(
  P_bar: number, yH2S_pct: number, yCO2_pct: number, T_C: number, cv?: ValoresCriterio,
): PresionesParciales {
  const pMax = cv?.p_max_fugacidad ?? 250;
  const pH2S = Math.max(0, P_bar * yH2S_pct) / 100;
  const pCO2 = Math.max(0, P_bar * yCO2_pct) / 100;
  const phiCO2 = coefFugacidadCO2(P_bar, T_C, pMax);
  return {
    pH2S: presion(pH2S),
    pCO2: presion(pCO2),
    phiCO2,
    fCO2: pCO2 * phiCO2,
    razon: pH2S > 0 ? pCO2 / pH2S : Infinity,
    fueraDeRango: P_bar > pMax,
  };
}
