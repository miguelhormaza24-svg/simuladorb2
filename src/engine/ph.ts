/**
 * Modelo 2 · pH in situ.
 * Balance de electroneutralidad del sistema CO₂/H₂S–agua con bicarbonato:
 *   [H⁺] + Alc = [HCO₃⁻] + 2[CO₃²⁻] + [HS⁻] + [OH⁻]
 * Alc es el catión que acompaña al bicarbonato ingresado (mol/kg).
 * Sustituye al Anexo D de ISO 15156-2, que no está en el PDF adjunto.
 * Limitaciones: solución ideal (sin corrección por fuerza iónica, así que el
 * Cl⁻ no cambia el resultado), sin ácidos orgánicos y sin Fe²⁺ disuelto.
 */
import { EQUILIBRIO_ACUOSO, MODELO_DWM } from '../data/criterios';
import { ATM_A_BAR, aKelvin } from './unidades';

const L = Math.log10;
const poli = (k: number[], T: number): number => k[0]! + k[1]! * T + k[2]! / T + k[3]! * L(T) + k[4]! / (T * T);

export interface ConstantesEquilibrio {
  /** mol/(kg·bar) */ khCO2: number;
  k1CO2: number;
  k2CO2: number;
  /** mol/(L·bar) */ khH2S: number;
  k1H2S: number;
  kw: number;
}

export function constantesEquilibrio(T_C: number): ConstantesEquilibrio {
  const T = aKelvin(T_C);
  const E = EQUILIBRIO_ACUOSO;
  const s = E.khH2S;
  const h = E.k1H2S;
  return {
    khCO2: Math.pow(10, poli(E.khCO2, T)) / ATM_A_BAR,
    k1CO2: Math.pow(10, poli(E.k1CO2, T)),
    k2CO2: Math.pow(10, poli(E.k2CO2, T)),
    khH2S: Math.pow(10, -(s[0]! + s[1]! * T + s[2]! * T * T + s[3]! / T + s[4]! * L(T))),
    k1H2S: Math.pow(10, h[0]! + h[1]! * T + h[2]! * T * T + h[3]! / T + h[4]! * Math.log(T)),
    kw: Math.pow(10, E.kw[0]! / T + E.kw[1]! + E.kw[2]! * T),
  };
}

export interface EntradaPH {
  T_C: number;
  /** fugacidad o presión parcial del CO₂, bar */ fCO2_bar: number;
  /** presión parcial del H₂S, bar */ pH2S_bar: number;
  /** bicarbonato del agua, mg/L (0 = agua condensada) */ HCO3_mgL?: number;
}

export interface ResultadoPH {
  pH: number;
  /** mol/kg */ especies: { H: number; HCO3: number; CO3: number; HS: number; OH: number };
  /** fracción de la acidez que aporta el H₂S frente al CO₂ */ aporteH2S: number;
}

export function phInSitu(e: EntradaPH): ResultadoPH {
  const k = constantesEquilibrio(e.T_C);
  const a = k.k1CO2 * k.khCO2 * Math.max(0, e.fCO2_bar); // [HCO3-]·[H+]
  const s = k.k1H2S * k.khH2S * Math.max(0, e.pH2S_bar); // [HS-]·[H+]
  const alc = Math.max(0, e.HCO3_mgL ?? 0) / 1000 / EQUILIBRIO_ACUOSO.M_HCO3;
  const balance = (h: number): number => h + alc - a / h - (2 * k.k2CO2 * a) / (h * h) - s / h - k.kw / h;
  // balance(h) es creciente en h: bisección en pH entre 0 y 14.
  let lo = 0;
  let hi = 14;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (balance(Math.pow(10, -mid)) > 0) lo = mid;
    else hi = mid;
  }
  const pH = (lo + hi) / 2;
  const H = Math.pow(10, -pH);
  const HCO3 = a / H;
  return {
    pH,
    especies: { H, HCO3, CO3: (k.k2CO2 * HCO3) / H, HS: s / H, OH: k.kw / H },
    aporteH2S: a + s > 0 ? s / (a + s) : 0,
  };
}

/** pH del agua pura saturada con CO₂ según las correlaciones de de Waard. */
export function phCO2Correlacion(T_C: number, fCO2_bar: number, version: '1991' | '1995' = '1991'): number {
  const k = version === '1991' ? MODELO_DWM.phCO2_1991 : MODELO_DWM.phCO2_1995;
  return k.a + k.b * T_C - 0.5 * L(Math.max(fCO2_bar, 1e-9));
}

export interface ComparacionPH {
  calculado: number;
  ingresado: number;
  /** ingresado − calculado */ diferencia: number;
  /** el pH ingresado es más ácido que el calculado en más de la tolerancia */ masAcido: boolean;
  masAlcalino: boolean;
}

export function compararPH(calculado: number, ingresado: number, tolerancia = 0.3): ComparacionPH {
  const diferencia = ingresado - calculado;
  return { calculado, ingresado, diferencia, masAcido: diferencia < -tolerancia, masAlcalino: diferencia > tolerancia };
}
