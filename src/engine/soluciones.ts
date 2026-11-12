/**
 * Modelos 8 y 9 · Severidad en soluciones de amina y de TEG.
 * ISO 21457 solo da criterios cualitativos (§6.2.2.5 agrietamiento alcalino;
 * §7.4.4 y Tabla 11 para glicol). Los umbrales numéricos son de literatura,
 * editables y marcados «sin verificar».
 */
import { ASCC_AMINAS, type ValoresCriterio } from '../data/criterios';
import type { DatosAmina, DatosTEG } from '../data/tipos';

export interface Severidad {
  n: number;
  nivel: 'baja' | 'moderada' | 'alta';
  factores: string[];
}

const nivel = (n: number): Severidad['nivel'] => (n === 0 ? 'baja' : n === 1 ? 'moderada' : 'alta');
const f1 = (x: number): string => x.toLocaleString('es-CO', { maximumFractionDigits: 2 });

export function severidadAmina(
  tipo: 'amina_rica' | 'amina_pobre', T_C: number, a: DatosAmina, cv: ValoresCriterio,
): Severidad {
  const f: string[] = [];
  const tRica = cv.amina_t_rica!;
  const vMax = cv.amina_vel_max!;
  if (tipo === 'amina_rica') {
    if (T_C > tRica) f.push(`Temperatura de ${f1(T_C)} °C, mayor que ${f1(tRica)} °C: se libera gas ácido`);
    if (a.carga > cv.amina_carga_max!) f.push(`Carga ácida de ${f1(a.carga)} mol/mol, mayor que ${f1(cv.amina_carga_max!)}`);
    if (a.vel > vMax) f.push(`Velocidad de ${f1(a.vel)} m/s, mayor que ${f1(vMax)} m/s`);
  } else {
    if (T_C > tRica + 20) f.push(`Zona caliente: ${f1(T_C)} °C, mayor que ${f1(tRica + 20)} °C`);
    if (a.vel > 2 * vMax) f.push(`Velocidad de ${f1(a.vel)} m/s, mayor que ${f1(2 * vMax)} m/s`);
  }
  if (a.hss > cv.amina_hss_max!) f.push(`Sales termoestables de ${f1(a.hss)} %, mayores que ${f1(cv.amina_hss_max!)} %`);
  return { n: f.length, nivel: nivel(f.length), factores: f };
}

export interface RequisitoPWHT {
  requiere: boolean;
  /** °C; null = a toda temperatura */ umbral: number | null;
}

/** Tratamiento térmico posterior a la soldadura del acero al carbono en amina (API RP 945, sin verificar). */
export function requierePWHT(tipoAmina: string, T_C: number): RequisitoPWHT {
  const umbral = ASCC_AMINAS.pwht[tipoAmina];
  if (umbral === undefined || umbral === null) return { requiere: true, umbral: null };
  return { requiere: T_C > umbral, umbral };
}

export function severidadTEG(t: DatosTEG, pH: number, cv: ValoresCriterio): Severidad {
  const f: string[] = [];
  if (t.Tpel > cv.teg_t_max!) f.push(`Temperatura de película de ${f1(t.Tpel)} °C, mayor que ${f1(cv.teg_t_max!)} °C: degradación térmica a ácidos orgánicos`);
  if (t.contaminado === 'si') f.push('TEG contaminado con H₂S, salmuera o hidrocarburo');
  if (pH < cv.teg_ph_min!) f.push(`pH de ${f1(pH)}, menor que ${f1(cv.teg_ph_min!)}: TEG degradado o ácido`);
  return { n: f.length, nivel: nivel(f.length), factores: f };
}
