/**
 * Escenarios · presets que cambian una o varias entradas de la pieza.
 * Regla del proyecto: los valores de B1 no se trasladan sin justificar a
 * corrientes ya tratadas; `advertenciaTraslado` lo recuerda.
 */
import type { EntradaPieza } from './evaluarPieza';

export interface Preset {
  id: string;
  grupo: string;
  nombre: string;
  cambios: Partial<EntradaPieza>;
  /** el valor viene de la base de diseño de B1 (alimentación sin tratar) */ deB1: boolean;
  nota: string;
}

export const PRESETS: Preset[] = [
  { id: 'ano1', grupo: 'Cloruros', nombre: 'Año 1: agua condensada, 600 mg/L', cambios: { Cl: 600 }, deB1: false, nota: 'Valor inicial de ISO 21457 §6.2.3.2 para agua condensada.' },
  { id: 'ano8', grupo: 'Cloruros', nombre: 'Año 8: agua de formación, 28 000 mg/L', cambios: { Cl: 28000 }, deB1: true, nota: 'Dato del escenario B desde el año 8.' },
  { id: 'p50', grupo: 'Presión', nombre: 'Planta a 50 bar (S1)', cambios: { P: 50 }, deB1: false, nota: 'Supuesto S1, por confirmar en el acta B1–B2.' },
  { id: 'p320', grupo: 'Presión', nombre: 'Cabezal B1 a 320 bar', cambios: { P: 320 }, deB1: true, nota: 'Presión de cabezal de B1: no es la presión de B2.' },
  { id: 'top', grupo: 'Temperatura', nombre: 'Operación: 95 °C', cambios: { T: 95, Tmax: 95 }, deB1: true, nota: 'Temperatura de operación del escenario.' },
  { id: 'tmax', grupo: 'Temperatura', nombre: 'Máxima: 120 °C', cambios: { T: 120, Tmax: 120 }, deB1: true, nota: 'Temperatura máxima del escenario.' },
  { id: 'inh0', grupo: 'Inhibidor', nombre: 'Sin inhibidor', cambios: { inhibidor: 0 }, deB1: false, nota: 'Sin crédito por inhibición.' },
  { id: 'inh95', grupo: 'Inhibidor', nombre: 'Disponibilidad del 95 %', cambios: { inhibidor: 95 }, deB1: false, nota: 'ISO 21457 §8.1 Nota 1.' },
  { id: 'inh99', grupo: 'Inhibidor', nombre: 'Disponibilidad del 99 %', cambios: { inhibidor: 99 }, deB1: false, nota: 'ISO 21457 §8.1 Nota 1.' },
  { id: 'meg0', grupo: 'MEG', nombre: 'Sin crédito por MEG', cambios: { wAgua: 100 }, deB1: false, nota: 'Fase acuosa 100 % agua.' },
  { id: 'meg50', grupo: 'MEG', nombre: 'MEG al 50 % en la fase acuosa', cambios: { wAgua: 50 }, deB1: true, nota: 'Proporción supuesta; el dato real lo da B1.' },
  { id: 'h2s4', grupo: 'H₂S residual', nombre: '4 ppmv', cambios: { H2S: 0.0004 }, deB1: false, nota: 'Especificación típica de gas endulzado (supuesto).' },
  { id: 'h2s20', grupo: 'H₂S residual', nombre: '20 ppmv', cambios: { H2S: 0.002 }, deB1: false, nota: 'Endulzamiento degradado (supuesto).' },
  { id: 'h2s100', grupo: 'H₂S residual', nombre: '100 ppmv', cambios: { H2S: 0.01 }, deB1: false, nota: 'A 50 bar equivale a 0,5 kPa: vuelve a ser servicio agrio.' },
];

export const presetPorId = (id: string): Preset | undefined => PRESETS.find((p) => p.id === id);

/** Aplica los presets en orden sobre la entrada base. */
export function aplicarPresets(base: EntradaPieza, ids: string[]): EntradaPieza {
  let e = { ...base };
  for (const id of ids) {
    const p = presetPorId(id);
    if (p) e = { ...e, ...p.cambios };
  }
  if (e.Tmax < e.T) e.Tmax = e.T;
  return e;
}

const SIN_TRATAR = ['C01', 'C02', 'C03', 'C04'];

/** Corrientes posteriores al endulzamiento, la regeneración o la deshidratación. */
export const esCorrienteTratada = (idCorriente: string): boolean => !SIN_TRATAR.includes(idCorriente);

/** Texto de advertencia si un preset traslada un valor de B1 a una corriente tratada. */
export function advertenciaTraslado(idCorriente: string, ids: string[]): string | null {
  if (!esCorrienteTratada(idCorriente)) return null;
  const de = ids.map(presetPorId).filter((p): p is Preset => !!p && p.deB1);
  if (!de.length) return null;
  return `${de.map((p) => p.nombre).join('; ')}: es un valor de la alimentación de B1 y ${idCorriente} es una corriente ya tratada. Úselo solo como caso de sensibilidad y justifíquelo.`;
}
