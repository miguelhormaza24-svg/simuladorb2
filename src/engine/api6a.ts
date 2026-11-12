/**
 * Modelo 12 · API 6A como referencia comparativa.
 * La norma no está adjunta: las tablas vienen de memoria y están marcadas «sin
 * verificar». API 6A cubre cabezas de pozo; en B2 solo sirve para comparar
 * válvulas y sellos, no como código de diseño de recipientes.
 */
import { API6A, type ValoresCriterio } from '../data/criterios';

export interface ClaseAPI6A {
  /** 0 = no corrosivo, 1 = levemente corrosivo, 2 = moderada a altamente corrosivo */ corrosividad: 0 | 1 | 2;
  corrosividadTxt: string;
  clase: string;
  cuerpo: string;
  internos: string;
  fluidoSellos: string;
}

const TXT = ['no corrosivo', 'levemente corrosivo', 'moderada a altamente corrosivo'] as const;

export function claseMaterialAPI6A(
  agrio: boolean, pCO2_MPa: number, cv: ValoresCriterio, inoxFueraDeLimites = false,
): ClaseAPI6A {
  const corrosividad: 0 | 1 | 2 = pCO2_MPa < cv.api6a_co2_leve! ? 0 : pCO2_MPa <= cv.api6a_co2_alto! ? 1 : 2;
  const clase = agrio
    ? (inoxFueraDeLimites && corrosividad >= 1 ? 'HH' : (['DD', 'EE', 'FF'] as const)[corrosividad])
    : (['AA', 'BB', 'CC'] as const)[corrosividad];
  const m = API6A.clasesMaterial[clase]!;
  return {
    corrosividad, corrosividadTxt: TXT[corrosividad], clase,
    cuerpo: m.cuerpo, internos: m.internos, fluidoSellos: API6A.fluidoSellos[clase]!,
  };
}
