/**
 * Modelos 5 y 6 · Inhibición y sobreespesor de corrosión.
 * ISO 21457 §8.1 Nota 1: método de la disponibilidad del inhibidor, con
 * velocidad inhibida típica de 0,1 mm/a. §8.2: clases de sobreespesor.
 * §7.2.2: los tubos de intercambiador no llevan sobreespesor; el simulador
 * aplica lo mismo a los internos de pared delgada.
 */
import type { ValoresCriterio } from '../data/criterios';
import type { Forma } from '../data/tipos';
import { acotar } from './unidades';

/** Velocidad media ponderada por disponibilidad (%), en mm/a. */
export function crEfectiva(crSinInhibir: number, disponibilidad_pct: number, crInhibida: number): number {
  const A = acotar(disponibilidad_pct, 0, 100) / 100;
  return A * Math.min(crInhibida, crSinInhibir) + (1 - A) * crSinInhibir;
}

export const sobreespesorRequerido = (cr_mm_a: number, vida_a: number): number => cr_mm_a * vida_a;

/**
 * Disponibilidad mínima (%) para que el sobreespesor requerido no pase de caMax.
 * Devuelve 0 si no hace falta inhibidor y null si ni con 100 % alcanza.
 */
export function disponibilidadMinima(
  crSinInhibir: number, caMax_mm: number, vida_a: number, crInhibida: number,
): number | null {
  const crAdmisible = caMax_mm / vida_a;
  if (crSinInhibir <= crAdmisible) return 0;
  const crInh = Math.min(crInhibida, crSinInhibir);
  if (crInh > crAdmisible) return null;
  return (100 * (crSinInhibir - crAdmisible)) / (crSinInhibir - crInh);
}

export interface ClaseSobreespesor {
  clave: 0 | 1 | 2 | 3;
  nombre: string;
  /** sobreespesor de la clase, mm; null si se excede el máximo */ ca: number | null;
}

export function claseSobreespesor(caRequerido_mm: number, cv: ValoresCriterio): ClaseSobreespesor {
  if (caRequerido_mm <= cv.ca_no_corrosivo!) return { clave: 0, nombre: 'No corrosivo', ca: cv.ca_no_corrosivo! };
  if (caRequerido_mm <= cv.ca_leve!) return { clave: 1, nombre: 'Levemente corrosivo', ca: cv.ca_leve! };
  if (caRequerido_mm <= cv.ca_severo!) return { clave: 2, nombre: 'Severamente corrosivo', ca: cv.ca_severo! };
  return { clave: 3, nombre: 'Excede el sobreespesor máximo', ca: null };
}

export const llevaSobreespesor = (forma: Forma): boolean => forma !== 'tubos' && forma !== 'internos' && forma !== 'sello';
