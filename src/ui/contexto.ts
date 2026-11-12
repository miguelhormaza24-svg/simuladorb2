import { valoresCriterio, type ValoresCriterio } from '../data/criterios';
import { CORRIENTES } from '../data/corrientes';
import { EQUIPOS } from '../data/equipos';
import type { Equipo, Origen, Pieza } from '../data/tipos';
import { entradaDePieza, evaluarPieza, type EntradaPieza, type ResultadoPieza } from '../engine/evaluarPieza';
import { clavePieza, type Estado } from '../state/store';

export interface Seleccion { equipo: Equipo; pieza: Pieza }

export function seleccion(eq: string, pz: string): Seleccion {
  const equipo = EQUIPOS.find((e) => e.id === eq) ?? EQUIPOS[0]!;
  const pieza = equipo.piezas.find((p) => p.id === pz) ?? equipo.piezas[0]!;
  return { equipo, pieza };
}

export function entradaCon(estado: Estado, eq: string, pz: string): EntradaPieza {
  const { equipo, pieza } = seleccion(eq, pz);
  return entradaDePieza(equipo, pieza, CORRIENTES, estado.cambios[clavePieza(equipo.id, pieza.id)] ?? {});
}

export const criteriosDe = (estado: Estado): ValoresCriterio => valoresCriterio(estado.criterios);

export function resultadoDe(estado: Estado, eq: string, pz: string): ResultadoPieza {
  return evaluarPieza(entradaCon(estado, eq, pz), criteriosDe(estado));
}

type CampoCorriente = 'P' | 'T' | 'Tmax' | 'Tmin' | 'H2S' | 'CO2' | 'agua' | 'pH' | 'Cl' | 'HCO3' | 'wAgua' | 'rocio';

/** Origen que la interfaz muestra junto a cada dato de entrada. */
export function origenCampo(estado: Estado, s: Seleccion, campo: keyof EntradaPieza): Origen {
  const cambios = estado.cambios[clavePieza(s.equipo.id, s.pieza.id)] ?? {};
  if (campo in cambios) return 'U';
  if ((campo === 'P' || campo === 'T' || campo === 'Tmax') && s.pieza[campo] != null) return 'S';
  if (campo === 'vida') return 'D';
  const c = CORRIENTES[s.pieza.corriente]!;
  const d = c[campo as CampoCorriente];
  if (d && typeof d === 'object' && 'o' in d) return d.o;
  if (campo === 'wAgua' || campo === 'amina' || campo === 'teg') return 'P';
  if (campo === 'caInv' || campo === 'espesorInv' || campo === 'D') return 'I';
  return 'S';
}

export const TODAS_LAS_PIEZAS: Seleccion[] = EQUIPOS.flatMap((equipo) => equipo.piezas.map((pieza) => ({ equipo, pieza })));
