/**
 * Modelo 11 · Sellos no metálicos.
 * Elastómeros: ISO 23936-2:2011 (adjunta completa) — Tabla C.1, riesgo de
 * descompresión rápida de gas (Tabla F.1), plan de envejecimiento (Anexo A) y
 * ensayo RGD (Anexo B).
 * Termoplásticos: ISO 23936-1:2022 (vista previa) no trae límites; se usan los
 * de ISO 21457 Tablas 9 y 10 y el resto queda pendiente.
 */
import {
  ACEPTACION_ENVEJECIMIENTO, ENSAYO_RGD, MEDIOS_ENVEJECIMIENTO, TABLA_A6_TEMPERATURA, TABLA_C1_ELASTOMEROS,
  TERMOPLASTICOS, type ClaseTemperatura, type Resistencia, type ValoresCriterio,
} from '../data/criterios';

export interface CondicionSello {
  Tmax_C: number;
  Tmin_C: number;
  /** presión total, bar abs */ P_bar: number;
  yCO2_pct: number;
  /** hay fase gas a presión en contacto con el sello */ gas: boolean;
  hidrocarburo: boolean;
  aromaticos: boolean;
  /** fluido alcalino: amina */ alcalino: boolean;
  metanol: boolean;
  agua: boolean;
  /** servicio agrio (pH₂S ≥ 0,3 kPa) */ h2s: boolean;
  /** % mol de H₂S en el gas */ yH2S_pct: number;
}

/** Condición del sello a partir de la entrada de la pieza (tipo de corriente y servicio agrio). */
export function condicionSello(
  e: { tipo: string; P: number; Tmax: number; Tmin: number; CO2: number; H2S: number; agua: string }, agrio: boolean,
): CondicionSello {
  const amina = e.tipo === 'amina_rica' || e.tipo === 'amina_pobre';
  const hidrocarburo = ['hc_humedo', 'gas_humedo', 'gas_seco', 'gas_acido', 'vapor_acido', 'drenaje'].includes(e.tipo);
  return {
    Tmax_C: e.Tmax, Tmin_C: e.Tmin, P_bar: e.P, yCO2_pct: e.CO2, yH2S_pct: e.H2S,
    gas: !['agua_agria', 'drenaje', 'agua_mar', 'servicio'].includes(e.tipo),
    hidrocarburo, aromaticos: e.tipo === 'hc_humedo', alcalino: amina, metanol: false,
    agua: e.agua !== 'no', h2s: agrio,
  };
}

export type Aptitud = 'apto' | 'condicional' | 'no_apto';

export interface ResultadoElastomero {
  id: string;
  tMax: number;
  aptitud: Aptitud;
  motivos: string[];
  desc: string;
}

/** Cribado de compatibilidad con la Tabla C.1 (guía informativa). */
export function evaluarElastomeros(c: CondicionSello): ResultadoElastomero[] {
  return TABLA_C1_ELASTOMEROS.filas.map((e) => {
    const motivos: string[] = [];
    let aptitud: Aptitud = 'apto';
    const peor = (a: Aptitud): void => {
      if (a === 'no_apto' || (a === 'condicional' && aptitud === 'apto')) aptitud = a;
    };
    if (c.Tmax_C > e.tMax) {
      peor('no_apto');
      motivos.push(`Temperatura máxima de ${c.Tmax_C} °C: supera los ${e.tMax} °C nominales en aire.`);
    }
    const fluidos: [boolean, Resistencia, string][] = [
      [c.hidrocarburo, e.crudo, 'hidrocarburo'], [c.alcalino, e.alcalino, 'fluido alcalino (amina)'],
      [c.metanol, e.metanol, 'metanol'], [c.agua, e.agua, 'agua'], [c.h2s, e.h2s, 'H₂S'],
    ];
    for (const [presente, r, nombre] of fluidos) {
      if (!presente) continue;
      if (r === 'NO') { peor('no_apto'); motivos.push(`No apto para ${nombre}.`); }
      else if (r === 'C') { peor('condicional'); motivos.push(`Podría servir con ${nombre}: requiere calificación.`); }
    }
    if (c.aromaticos && e.id === 'FEPM') { peor('condicional'); motivos.push('Malo en solventes aromáticos.'); }
    return { id: e.id, tMax: e.tMax, aptitud, motivos, desc: e.desc };
  });
}

export interface RiesgoRGD {
  nivel: 'no_aplica' | 'bajo' | 'medio' | 'alto';
  motivo: string;
}

/** Riesgo de daño por descompresión rápida de gas (Tabla F.1). */
export function riesgoRGD(c: Pick<CondicionSello, 'P_bar' | 'yCO2_pct' | 'gas'>, cv: ValoresCriterio): RiesgoRGD {
  if (!c.gas) return { nivel: 'no_aplica', motivo: 'Sin fase gas a presión en contacto con el sello.' };
  const P = c.P_bar / 10;
  const co2Alto = c.yCO2_pct >= 10;
  if (P > cv.rgd_p_alto!) return { nivel: 'alto', motivo: `Presión de gas de ${P.toLocaleString('es-CO')} MPa, mayor que ${cv.rgd_p_alto} MPa.` };
  if (P >= cv.rgd_p_bajo!) return { nivel: co2Alto ? 'alto' : 'medio', motivo: `Presión de gas entre ${cv.rgd_p_bajo} y ${cv.rgd_p_alto} MPa${co2Alto ? ' con CO₂ alto' : ''}: el riesgo crece mucho.` };
  return { nivel: co2Alto ? 'medio' : 'bajo', motivo: `Presión de gas de ${P.toLocaleString('es-CO')} MPa, menor que ${cv.rgd_p_bajo} MPa${co2Alto ? ', pero con CO₂ alto, que es más soluble en el elastómero' : ''}.` };
}

/** Clase de temperatura más estrecha de la Tabla A.6 que cubre el intervalo de servicio. */
export function claseTemperatura(Tmin_C: number, Tmax_C: number): ClaseTemperatura | null {
  const cubren = TABLA_A6_TEMPERATURA.filas.filter(
    (f) => f.min != null && f.max != null && f.clase !== 'No ISO/API' && Tmin_C >= f.min && Tmax_C <= f.max,
  );
  if (!cubren.length) return null;
  return cubren.sort((a, b) => (a.max! - a.min!) - (b.max! - b.min!))[0]!;
}

export interface PlanEnvejecimiento {
  liquido: string;
  gas: string;
  distribucion: string;
  clase: ClaseTemperatura | null;
  /** °C; null si la clase no permite ensayo o no hay clase */ tEnsayo: [number, number, number] | null;
  aceptacion: string[];
  presion: string;
}

/** Plan de envejecimiento del Anexo A para la condición de servicio. */
export function planEnvejecimiento(c: CondicionSello): PlanEnvejecimiento {
  const M = MEDIOS_ENVEJECIMIENTO;
  const A = ACEPTACION_ENVEJECIMIENTO;
  const clase = claseTemperatura(c.Tmin_C, c.Tmax_C);
  const gas = !c.h2s ? `A.2.i · ${M.gasDulce['A.2.i']}`
    : c.yH2S_pct > M.h2sNormal_pct ? `A.3.ii · ${M.gasAgrio['A.3.ii']}` : `A.3.i · ${M.gasAgrio['A.3.i']}`;
  return {
    liquido: c.aromaticos ? `A.1.ii · ${M.liquido['A.1.ii']}` : `A.1.i · ${M.liquido['A.1.i']}`,
    gas,
    distribucion: `${c.h2s ? 'Tabla A.5 (agrio)' : 'Tabla A.4 (dulce)'}: ${M.multifase}`,
    clase,
    tEnsayo: clase?.ensayo ?? null,
    presion: M.presion,
    aceptacion: [
      `Dureza: +${A.dureza[1]}/${A.dureza[0]} unidades (+${A.durezaNominal90[1]}/${A.durezaNominal90[0]} si la nominal es 90)`,
      `Volumen: +${A.volumen_pct[1]} %/${A.volumen_pct[0]} %`,
      `Tracción: ±${A.traccion_pct[1]} % (módulo, resistencia y elongación a rotura)`,
      'Vida de servicio por extrapolación de Arrhenius (Anexo D)',
    ],
  };
}

export interface CalificacionRGD {
  /** las cuatro calificaciones más altas, en orden descendente (Tabla B.5) */ final: number[];
  aprueba: boolean;
}

/** Calificación de un O-ring: aprueba si ninguna sección supera 3 (§7.3.2). */
export function calificacionRGD(secciones: number[], cv: ValoresCriterio): CalificacionRGD {
  const final = [...secciones].sort((a, b) => b - a).slice(0, 4);
  return { final, aprueba: secciones.length > 0 && secciones.every((s) => s <= cv.rgd_calificacion_max!) };
}

/** El ensayo normalizado (15 MPa, 100 °C) cubre el servicio solo si ambos quedan por debajo. */
export function ensayoRGDCubre(P_bar: number, Tmax_C: number): boolean {
  return P_bar / 10 <= ENSAYO_RGD.presion_MPa && Tmax_C <= ENSAYO_RGD.temperatura_C;
}

export interface ResultadoTermoplastico {
  id: string;
  nombre: string;
  estado: 'apto' | 'excede' | 'pendiente';
  tMax: number | null;
  norma: string;
  verificado: boolean;
}

/** Límite de temperatura de termoplásticos en agua dulce o agua de mar clorada. */
export function evaluarTermoplasticos(T_C: number, medio: 'agua_dulce' | 'agua_mar'): ResultadoTermoplastico[] {
  return TERMOPLASTICOS.filas.map((t) => {
    const tMax = medio === 'agua_mar' ? t.tMaxAguaMar : t.tMaxAguaDulce;
    return {
      id: t.id, nombre: t.nombre, tMax,
      estado: tMax == null ? 'pendiente' : T_C <= tMax ? 'apto' : 'excede',
      norma: `${t.fuente.norma}, ${t.fuente.clausula}`, verificado: t.fuente.verificado,
    };
  });
}
