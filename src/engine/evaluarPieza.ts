/**
 * Evaluación de una pieza: une los modelos 1 a 13.
 *   1. Presiones parciales, pH in situ y región SSC.
 *   2. Corrosión por CO₂ del acero al carbono, inhibición y sobreespesor.
 *   3. Filtro de viabilidad de cada material: cada exclusión lleva motivo,
 *      norma, cláusula y si la fuente está verificada.
 *   4. Ranking TOPSIS de los materiales viables de la lista del inventario.
 * Función pura: no depende de la interfaz.
 */
import {
  ASCC_AMINAS, CS_REGIONES, FUENTES, LIMITES_15156_3, TABLA10_AGUA_MAR, TABLA3_ATMOSFERA_MARINA, TEG_MATERIALES,
  type ValoresCriterio,
} from '../data/criterios';
import { MATERIALES, type Material } from '../data/materiales';
import type { Corriente, DatosAmina, DatosTEG, Equipo, EstadoAgua, Forma, Pieza, TipoCorriente } from '../data/tipos';
import { claseMaterialAPI6A, type ClaseAPI6A } from './api6a';
import { dwm1991, dwm1995, regimenH2S, type Regimen, type ResultadoDWM, type ResultadoDWM95 } from './co2';
import { aguaMarClorada, atmosferaMarina, cumple15156_3, prenMaterial, riesgoCUI, type PrenRango } from './cra';
import {
  claseSobreespesor, crEfectiva, disponibilidadMinima, llevaSobreespesor, sobreespesorRequerido, type ClaseSobreespesor,
} from './inhibicion';
import { verificarEspesor, type VerificacionEspesor } from './mecanica';
import { compararPH, phInSitu, type ComparacionPH } from './ph';
import { presionesParciales, type PresionesParciales } from './presiones';
import { requierePWHT, severidadAmina, severidadTEG, type Severidad } from './soluciones';
import { severidadSSC, type SeveridadSSC } from './ssc';
import { hallazgo, type Hallazgo } from './tipos';
import { topsis } from './topsis';

const ACIDO_HUMEDO: TipoCorriente[] = ['hc_humedo', 'agua_agria', 'gas_humedo', 'gas_acido', 'vapor_acido', 'drenaje'];
const SOLUCION: TipoCorriente[] = ['amina_rica', 'amina_pobre', 'teg'];
const RECUBRIBLE: TipoCorriente[] = ['hc_humedo', 'agua_agria', 'gas_humedo', 'drenaje'];
const n1 = (x: number, d = 1): string => x.toLocaleString('es-CO', { maximumFractionDigits: d });

export interface LadoServicio {
  id: string;
  tipo: TipoCorriente;
  Tmax: number;
  cloroResidual?: number;
}

export interface EntradaPieza {
  forma: Forma;
  tipo: TipoCorriente;
  /** bar abs */ P: number;
  /** °C */ T: number;
  Tmax: number;
  Tmin: number;
  /** % mol en el gas */ H2S: number;
  CO2: number;
  agua: EstadoAgua;
  pH: number;
  /** mg/L */ Cl: number;
  HCO3: number;
  /** % de agua en la fase acuosa; 100 = sin crédito por MEG */ wAgua: number;
  rocio?: number;
  amina?: DatosAmina;
  teg?: DatosTEG;
  /** disponibilidad del inhibidor, % */ inhibidor: number;
  /** vida de diseño, años */ vida: number;
  externo: boolean;
  aislado: boolean;
  servicio?: LadoServicio;
  caInv?: number;
  /** espesor del inventario, mm */ espesorInv?: number;
  /** diámetro interior, m */ D?: number;
  /** aplicar los límites de ISO 15156-3 también en amina y TEG */ aplicar15156EnSolucion: boolean;
  conPelicula: boolean;
  corregirPH: boolean;
  /** ubicar el punto en la Figura 1 con el pH calculado en vez del ingresado */ usarPHCalculado: boolean;
  /** velocidad del líquido (m/s) y diámetro hidráulico (m) para dWM 1995 */ U?: number;
  dHidraulico?: number;
}

export const OPCIONES_BASE = {
  inhibidor: 0, vida: 25, aislado: false, aplicar15156EnSolucion: false,
  conPelicula: true, corregirPH: false, usarPHCalculado: false,
};

/** Arma la entrada de una pieza del inventario con los datos de su corriente. */
export function entradaDePieza(
  equipo: Equipo, pieza: Pieza, corrientes: Record<string, Corriente>, cambios: Partial<EntradaPieza> = {},
): EntradaPieza {
  const s = corrientes[pieza.corriente];
  if (!s) throw new Error(`Corriente desconocida: ${pieza.corriente}`);
  const serv = pieza.servicio ? corrientes[pieza.servicio] : undefined;
  const T = pieza.T ?? s.T.v;
  const base: EntradaPieza = {
    ...OPCIONES_BASE,
    forma: pieza.forma, tipo: s.tipo,
    P: pieza.P ?? s.P.v, T, Tmax: Math.max(pieza.Tmax ?? s.Tmax.v, T), Tmin: s.Tmin.v,
    H2S: s.H2S.v, CO2: s.CO2.v, agua: s.agua.v, pH: s.pH.v, Cl: s.Cl.v, HCO3: s.HCO3.v,
    wAgua: s.wAgua?.v ?? 100, rocio: s.rocio?.v, amina: s.amina, teg: s.teg,
    externo: pieza.ext === true,
    servicio: serv ? { id: serv.id, tipo: serv.tipo, Tmax: serv.Tmax.v } : undefined,
    caInv: pieza.caInv,
    espesorInv: pieza.forma === 'recipiente' ? equipo.dim.e : undefined,
    D: equipo.dim.D,
  };
  return { ...base, ...cambios };
}

export interface Humedad { humedo: boolean; motivo: string }

export function evaluarHumedad(e: EntradaPieza, cv: ValoresCriterio): Humedad {
  if (e.tipo === 'gas_seco') {
    if (e.agua === 'si') return { humedo: true, motivo: 'Se indicó agua libre.' };
    const lim = e.Tmin - cv.margen_rocio!;
    if (e.rocio != null && e.rocio <= lim) {
      return { humedo: false, motivo: `Punto de rocío de ${n1(e.rocio, 0)} °C, no mayor que Tmín − ${cv.margen_rocio} = ${n1(lim, 0)} °C: gas seco (ISO 21457 §6.2.3.5).` };
    }
    return { humedo: true, motivo: 'No se demuestra que el punto de rocío esté 10 °C por debajo de la temperatura mínima: se evalúa como húmedo.' };
  }
  if (e.agua === 'no') return { humedo: false, motivo: 'Se indicó que no hay agua libre.' };
  if (e.agua === 'si') return { humedo: true, motivo: 'Fase acuosa presente.' };
  return { humedo: true, motivo: 'Agua posible o condensable: se evalúa como húmedo hasta demostrar lo contrario (Tabla 23 del informe).' };
}

export interface ResultadoCorrosion {
  aplica: boolean;
  seco: boolean;
  dwm91?: ResultadoDWM;
  dwm95?: ResultadoDWM95;
  /** mm/a sin inhibidor */ crBase: number;
  /** mm/a ponderada por disponibilidad */ crEf: number;
  /** mm en la vida de diseño */ caRequerido: number;
  clase: ClaseSobreespesor | null;
  /** disponibilidad mínima (%) para no pasar del sobreespesor máximo; null = imposible */ dispMinima: number | null;
}

export interface EvaluacionMaterial {
  id: string;
  nombre: string;
  spec: string;
  familia: string;
  enLista: boolean;
  viable: boolean;
  hallazgos: Hallazgo[];
  pren: PrenRango | null;
  /** índice didáctico de 0 a 10 */ integridad: number;
  /** índice relativo (acero al carbono = 1) */ costoCicloVida: number;
  /** índice de 0 a 10 */ fabricabilidad: number;
  /** cercanía TOPSIS entre 0 y 1; null si no se ordenó */ cercania: number | null;
}

export type EstadoMecanismo = 'P' | 'V' | 'D' | 'NA';

export interface MecanismoEvaluado { id: string; nombre: string; estado: EstadoMecanismo; motivo: string }

export interface ResultadoPieza {
  entrada: EntradaPieza;
  pp: PresionesParciales;
  ph: ComparacionPH & { aporteH2S: number; usado: number };
  ssc: SeveridadSSC;
  humedad: Humedad;
  regimen: Regimen;
  corrosion: ResultadoCorrosion;
  amina?: Severidad;
  teg?: Severidad;
  mecanica?: VerificacionEspesor;
  api6a: ClaseAPI6A;
  /** todos los materiales disponibles en esa forma */ materiales: EvaluacionMaterial[];
  /** viables de la lista del inventario, de mejor a peor */ ranking: EvaluacionMaterial[];
  mejor: EvaluacionMaterial | null;
  /** admitidos por norma pero fuera de la lista de candidatos */ fueraDeLista: EvaluacionMaterial[];
  mecanismos: MecanismoEvaluado[];
}

/* ------------------------------------------------------------------ */

function evaluarCorrosion(e: EntradaPieza, pp: PresionesParciales, humedo: boolean, cv: ValoresCriterio): ResultadoCorrosion {
  const acido = ACIDO_HUMEDO.includes(e.tipo) || e.tipo === 'gas_seco';
  if (!acido) return { aplica: false, seco: false, crBase: 0, crEf: 0, caRequerido: 0, clase: null, dispMinima: 0 };
  if (!humedo) {
    return { aplica: false, seco: true, crBase: 0, crEf: 0, caRequerido: 0, clase: claseSobreespesor(0, cv), dispMinima: 0 };
  }
  const dwm91 = dwm1991({
    T_C: e.T, fCO2_bar: pp.fCO2, conPelicula: e.conPelicula, wAgua_pct: e.wAgua, pH: e.corregirPH ? e.pH : undefined,
  });
  const dwm95 = e.U != null && e.dHidraulico != null
    ? dwm1995({ T_C: e.T, fCO2_bar: pp.fCO2, U_ms: e.U, d_m: e.dHidraulico, pH: e.corregirPH ? e.pH : undefined, wAgua_pct: e.wAgua, conPelicula: e.conPelicula })
    : undefined;
  const crBase = dwm91.v;
  const crEf = crEfectiva(crBase, e.inhibidor, cv.cr_inhibida!);
  const caRequerido = sobreespesorRequerido(crEf, e.vida);
  return {
    aplica: true, seco: false, dwm91, dwm95, crBase, crEf, caRequerido,
    clase: claseSobreespesor(caRequerido, cv),
    dispMinima: disponibilidadMinima(crBase, cv.ca_severo!, e.vida, cv.cr_inhibida!),
  };
}

interface Contexto {
  e: EntradaPieza;
  cv: ValoresCriterio;
  pp: PresionesParciales;
  ssc: SeveridadSSC;
  humedo: boolean;
  corr: ResultadoCorrosion;
  amina?: Severidad;
  teg?: Severidad;
  phUsado: number;
}

function evaluarMaterial(m: Material, x: Contexto): EvaluacionMaterial {
  const { e, cv, pp, ssc, humedo, corr } = x;
  const h: Hallazgo[] = [];
  const excluir = (regla: string, texto: string, f: Parameters<typeof hallazgo>[3]): void => { h.push(hallazgo('exclusion', regla, texto, f)); };
  const avisar = (regla: string, texto: string, f: Parameters<typeof hallazgo>[3]): void => { h.push(hallazgo('aviso', regla, texto, f)); };
  const pedir = (regla: string, texto: string, f: Parameters<typeof hallazgo>[3]): void => { h.push(hallazgo('requisito', regla, texto, f)); };

  const esCS = m.familia === 'CS';
  const delgada = !llevaSobreespesor(e.forma);
  const solucion = SOLUCION.includes(e.tipo);
  const acidoHumedo = (ACIDO_HUMEDO.includes(e.tipo) || e.tipo === 'gas_seco') && humedo;
  let integridad = 8;
  let lcc = m.costo;

  /* 1. Servicio agrio: ISO 15156 */
  if (ssc.agrio && humedo) {
    if (esCS) {
      pedir('cs_agrio', `Región SSC ${ssc.region}: ${CS_REGIONES.requisito[ssc.region]} Ensayo HIC para placa y tubería soldada.`, CS_REGIONES.fuente);
    } else if (m.clave15156 && (!solucion || e.aplicar15156EnSolucion)) {
      const r = cumple15156_3(m.clave15156, { T_C: e.Tmax, pH2S_kPa: pp.pH2S.kPa, Cl_mgL: e.Cl, pH: x.phUsado });
      const f = LIMITES_15156_3[m.clave15156]!.fuente;
      if (!r.cumple) excluir('iso15156_3', r.motivo, f);
      else {
        pedir('iso15156_3', `${r.motivo} Condición metalúrgica y dureza según la tabla.`, f);
        integridad = Number.isFinite(r.uso) && r.uso > 0 ? 7 + 3 * Math.max(0, 1 - r.uso) : 10;
      }
    } else if (m.clave15156) {
      avisar('iso15156_3_solucion', 'Los límites del Anexo A de ISO 15156-3 no se aplicaron a la solución de amina o TEG: justificar con ensayo o experiencia de campo.', FUENTES.calificacionAlterna);
    }
  } else if (ssc.agrio && !humedo) {
    pedir('agrio_seco', 'Sigue clasificado como servicio agrio aunque esté seco: deshidratar o inhibir no relaja el requisito.', FUENTES.agrioNoSeRelaja);
  }

  /* 2. Corrosión interna según el servicio */
  if (acidoHumedo) {
    if (m.id === 'cs_coat') {
      if (!RECUBRIBLE.includes(e.tipo)) excluir('recubrimiento_servicio', 'El recubrimiento orgánico interno no es típico en este servicio.', FUENTES.grupo);
      else if (e.Tmax > cv.recubrimiento_t_max!) excluir('recubrimiento_T', `Temperatura máxima de ${n1(e.Tmax, 0)} °C: supera los ${n1(cv.recubrimiento_t_max!, 0)} °C supuestos para el recubrimiento.`, FUENTES.grupo);
      else {
        integridad = 6.5;
        lcc += cv.lcc_recubrimiento!;
        pedir('recubrimiento', 'Ánodos de sacrificio, inspección y reparación periódica del recubrimiento.', FUENTES.recipientes);
        avisar('recubrimiento_galvanica', 'Si el recubrimiento se daña, hay par galvánico entre los internos CRA y la pared.', FUENTES.recubrimientos);
      }
    } else if (esCS) {
      if (delgada) {
        if (corr.caRequerido > cv.perdida_pared_delgada!) excluir('pared_delgada', `${e.forma === 'tubos' ? 'Tubos' : 'Internos'} sin sobreespesor, con pérdida estimada de ${n1(corr.caRequerido)} mm en la vida de diseño.`, FUENTES.sinSobreespesorTubos);
        else integridad = 7;
      } else if (corr.clase && corr.clase.clave === 3) {
        excluir('ca_excede', `Sobreespesor requerido de ${n1(corr.caRequerido)} mm: supera el máximo de ${n1(cv.ca_severo!)} mm.`, FUENTES.sobreespesor);
      } else if (corr.clase) {
        integridad = [9, 7.5, 5][corr.clase.clave]!;
        pedir('sobreespesor', `Sobreespesor de ${n1(corr.clase.ca!)} mm (${corr.clase.nombre.toLowerCase()}); requerido por cálculo: ${n1(corr.caRequerido)} mm.`, FUENTES.sobreespesor);
        if (e.caInv != null && e.caInv < corr.caRequerido) avisar('ca_inventario', `El sobreespesor del inventario (${n1(e.caInv)} mm) es menor que el requerido (${n1(corr.caRequerido)} mm).`, FUENTES.sobreespesor);
      }
      if (e.inhibidor > 0) {
        lcc += cv.lcc_inhibicion!;
        pedir('inhibicion', `Disponibilidad del inhibidor de ${n1(e.inhibidor)} %: demostrar la eficacia con ensayo o experiencia y monitorear.`, FUENTES.inhibicion);
      }
    } else if (!ssc.agrio) integridad = 9.5;
  } else if (e.tipo === 'amina_rica' || e.tipo === 'amina_pobre') {
    const s = x.amina!;
    if (m.id === 'cs_coat') excluir('recubrimiento_servicio', 'El recubrimiento orgánico interno no es típico en servicio de amina.', FUENTES.grupo);
    else if (esCS) {
      const pw = requierePWHT(e.amina?.tipo ?? 'MDEA', e.Tmax);
      pedir('ascc_amina', `Agrietamiento alcalino por aminas: ${pw.requiere ? 'tratamiento térmico posterior a la soldadura y al conformado' : `PWHT recomendado sobre ${pw.umbral} °C; confirmar el estado de las soldaduras`}.`, ASCC_AMINAS.fuente);
      if (delgada && s.n >= 1) excluir('amina_pared_delgada', `Pared delgada sin sobreespesor con severidad de amina ${s.nivel}.`, FUENTES.sinSobreespesorTubos);
      else if (delgada) { integridad = 4.5; avisar('amina_pared_delgada', 'Pared delgada sin sobreespesor: vida limitada.', FUENTES.sinSobreespesorTubos); }
      else if (s.n >= 2) excluir('amina_severidad', `Severidad de amina alta: ${s.factores.join('; ')}.`, ASCC_AMINAS.fuentePwht);
      else if (s.n === 1) { integridad = 5.5; pedir('sobreespesor', `Sobreespesor de ${n1(cv.ca_severo!)} mm. Severidad moderada: ${s.factores.join('; ')}.`, FUENTES.sobreespesor); }
      else { integridad = 8; pedir('sobreespesor', `Sobreespesor de ${n1(cv.ca_leve!)} mm (levemente corrosivo).`, FUENTES.sobreespesor); }
    } else integridad = Math.max(integridad, 9);
  } else if (e.tipo === 'teg') {
    const s = x.teg!;
    if (m.id === 'cs_coat') excluir('recubrimiento_servicio', 'El recubrimiento orgánico interno no es típico en servicio de glicol.', FUENTES.grupo);
    else if (esCS) {
      if (delgada && s.n >= 1) excluir('teg_pared_delgada', `Pared delgada sin sobreespesor con severidad de TEG ${s.nivel}.`, FUENTES.sinSobreespesorTubos);
      else if (delgada) { integridad = 4.5; avisar('teg_pared_delgada', 'Pared delgada sin sobreespesor; el tipo 316 es buena alternativa en intercambiadores y componentes críticos.', TEG_MATERIALES.fuente); }
      else if (s.n >= 2) excluir('teg_severidad', `Severidad de TEG alta: ${s.factores.join('; ')}.`, TEG_MATERIALES.fuente);
      else if (s.n === 1) { integridad = 5.5; pedir('sobreespesor', `Sobreespesor de ${n1(cv.ca_severo!)} mm. ${s.factores.join('; ')}.`, FUENTES.sobreespesor); }
      else { integridad = 8.5; pedir('teg_quimica', `Sobreespesor de ${n1(cv.ca_leve!)} mm y tratamiento químico del TEG (inhibición, control de pH o ambos).`, TEG_MATERIALES.fuente); }
    } else integridad = Math.max(integridad, 9);
  } else if (m.id === 'cs_coat') {
    excluir('recubrimiento_servicio', 'Recubrimiento interno innecesario en servicio seco o no corrosivo.', FUENTES.grupo);
  } else if (esCS) {
    integridad = 9;
    pedir('sobreespesor', `Sobreespesor de ${n1(cv.ca_no_corrosivo!)} mm (servicio no corrosivo).`, FUENTES.sobreespesor);
  } else if (!ssc.agrio) integridad = 9.5;

  /* 3. Tipo 316 con cloruros y temperatura */
  if (m.clave15156 === 'tipo316' && humedo && e.Tmax > cv.t_316_cloruros!) {
    if (e.Cl > cv.cl_316_max!) excluir('cl_316', `Cloruros de ${n1(e.Cl, 0)} mg/L con ${n1(e.Tmax, 0)} °C: supera ${n1(cv.cl_316_max!, 0)} mg/L sobre ${n1(cv.t_316_cloruros!, 0)} °C (picadura y SCC por cloruros).`, FUENTES.sccSinH2S);
    else if (e.Cl > 0) avisar('cl_316', 'Sobre 60 °C el tipo 316 exige cloruros bajos: vigilar la concentración por evaporación.', FUENTES.sccSinH2S);
  }

  /* 4. Lado de servicio de los tubos */
  if (e.forma === 'tubos' && e.servicio?.tipo === 'agua_mar') {
    const r = aguaMarClorada(m.claveAguaMar, e.servicio.Tmax, cv, e.servicio.cloroResidual);
    if (r.estado !== 'apto') excluir(r.estado === 'no_listado' ? 'agua_mar_no_listado' : 'agua_mar_T', r.motivo, TABLA10_AGUA_MAR.fuente);
    else pedir('agua_mar', `${r.motivo}${r.otras ? ` ${r.otras}.` : ''} Evitar roscas y rendijas.`, TABLA10_AGUA_MAR.fuente);
  }
  if (m.familia === 'CU' && (pp.pH2S.kPa > 0 || solucion)) {
    excluir('cuni_proceso', 'Aleación de cobre con H₂S o amina en el lado de proceso.', FUENTES.cuniProceso);
  }

  /* 5. Exterior: atmósfera marina y aislamiento */
  if (e.externo && m.claveAtm && !delgada) {
    const a = atmosferaMarina(m.claveAtm, e.Tmax);
    const f = TABLA3_ATMOSFERA_MARINA.fuente;
    if (a.estado === 'excede') excluir('atm_marina', `Inoxidable sin recubrimiento a ${n1(e.Tmax, 0)} °C en atmósfera marina: supera el intervalo de ${a.limites![0]} a ${a.limites![1]} °C (SCC externo por cloruros). Alternativa: clad sobre acero al carbono.`, f);
    else if (a.estado === 'condicional') { integridad -= 1; avisar('atm_marina', `Entre ${a.limites![0]} y ${a.limites![1]} °C en atmósfera marina: aceptable solo si el usuario final adopta el límite superior.`, f); }
  }
  if (riesgoCUI(m.familia, e.aislado, e.externo && !delgada)) {
    avisar('cui', 'Equipo aislado en ambiente marino: evaluar corrosión bajo aislamiento y recubrimiento apto para servicio marino.', { ...FUENTES.recubrimientoExterno, clausula: '§6.6.5' });
  }
  if (!esCS && m.familia !== 'CU' && !delgada) {
    pedir('galvanica', 'Unión con tramos de acero al carbono: evaluar la galvánica caso por caso.', FUENTES.galvanica);
  }

  const viable = !h.some((y) => y.tipo === 'exclusion');
  return {
    id: m.id, nombre: m.nombre, spec: m.spec, familia: m.familia, enLista: m.enLista, viable, hallazgos: h,
    pren: prenMaterial(m), integridad: Math.min(10, Math.max(0, integridad)), costoCicloVida: lcc, fabricabilidad: m.fab, cercania: null,
  };
}

function mecanismos(x: Contexto): MecanismoEvaluado[] {
  const { e, pp, ssc, humedo, corr, cv } = x;
  const out: MecanismoEvaluado[] = [];
  const add = (id: string, nombre: string, estado: EstadoMecanismo, motivo: string): void => { out.push({ id, nombre, estado, motivo }); };
  const solucion = SOLUCION.includes(e.tipo);
  const servicio = e.tipo === 'servicio' || e.tipo === 'agua_mar';

  if (solucion || servicio) add('co2', 'Corrosión por CO₂ húmedo', 'NA', 'No es una fase acuosa ácida: se evalúa con el modelo propio del servicio.');
  else if (corr.seco) add('co2', 'Corrosión por CO₂ húmedo', 'D', 'Descarte condicionado: sin agua libre. Verificar transitorios y enfriamiento.');
  else if (pp.pCO2.bar > 0) add('co2', 'Corrosión por CO₂ húmedo', 'P', `Velocidad sin inhibir de ${n1(corr.crBase, 2)} mm/a; con la disponibilidad dada, ${n1(corr.crEf, 2)} mm/a.`);
  else add('co2', 'Corrosión por CO₂ húmedo', 'D', 'Sin CO₂ en el gas.');

  if (servicio) add('ssc', 'SSC / HIC por H₂S', 'NA', 'Sin gas agrio, salvo contaminación cruzada.');
  else if (ssc.region === 0) add('ssc', 'SSC / HIC por H₂S', 'D', `pH₂S de ${n1(pp.pH2S.kPa, 3)} kPa, menor que ${cv.ssc_umbral_pH2S} kPa: región 0. Los aceros muy susceptibles aún pueden agrietarse.`);
  else if (humedo) add('ssc', 'SSC / HIC por H₂S', 'P', `Región SSC ${ssc.region} con pH₂S de ${n1(pp.pH2S.kPa)} kPa y pH de ${n1(x.phUsado)}.`);
  else add('ssc', 'SSC / HIC por H₂S', 'V', 'Servicio agrio sin agua libre demostrada: el requisito de materiales no se relaja.');

  if (e.tipo === 'amina_rica' || e.tipo === 'amina_pobre') {
    add('ascc', 'Agrietamiento alcalino por aminas', 'P', 'Acero al carbono soldado en contacto con amina.');
    add('amina', 'Corrosión por amina y gas ácido', x.amina!.n > 0 ? 'P' : 'V', x.amina!.n > 0 ? x.amina!.factores.join('; ') : 'Sin factores de severidad con los valores supuestos: confirmar la química.');
  } else add('ascc', 'Agrietamiento alcalino por aminas', 'NA', 'Sin solución de amina en contacto.');

  if (e.tipo === 'teg') add('teg', 'Degradación del TEG y corrosión en zonas calientes', x.teg!.n > 0 ? 'P' : 'V', x.teg!.n > 0 ? x.teg!.factores.join('; ') : 'Controlar la temperatura de película, el pH y los contaminantes.');

  if (humedo && e.Cl > cv.cl_316_max! && e.Tmax > cv.t_316_cloruros!) add('scc_cl', 'SCC y picadura por cloruros en inoxidables', 'P', `Cloruros de ${n1(e.Cl, 0)} mg/L a ${n1(e.Tmax, 0)} °C.`);
  else if (humedo && e.Cl > 0) add('scc_cl', 'SCC y picadura por cloruros en inoxidables', 'V', 'Depende del material, la temperatura local y la concentración por evaporación.');
  else add('scc_cl', 'SCC y picadura por cloruros en inoxidables', 'V', 'Cloruros de la fase acuosa sin dato: no se descarta.');

  if ((e.tipo === 'gas_humedo' || e.tipo === 'gas_acido' || e.tipo === 'vapor_acido') && e.agua === 'condensa') add('tlc', 'Corrosión en la parte superior de la línea', 'V', 'El gas condensa agua; el inhibidor no protege la parte superior (ISO 21457 §8.1).');
  add('erosion', 'Erosión y erosión-corrosión', 'V', 'Sin caudales por fase no se calcula la velocidad frente a la erosional.');
  if (['agua_agria', 'drenaje', 'agua_mar', 'hc_humedo'].includes(e.tipo)) add('mic', 'Corrosión inducida por microorganismos', 'V', 'Zonas de baja velocidad, puntos muertos y agua estancada.');
  if (e.servicio?.tipo === 'agua_mar' || e.tipo === 'agua_mar') add('agua_mar', 'Picadura y rendija en agua de mar clorada', 'P', 'Depende del cloro residual y de la temperatura que acuerde B3.');
  if (e.externo) {
    add('externa', 'Corrosión atmosférica marina', 'P', 'Planta costera: recubrimiento externo para servicio marino.');
    add('cui', 'Corrosión bajo aislamiento', e.aislado ? 'P' : 'V', e.aislado ? 'Equipo aislado en ambiente marino.' : 'Aplica si el equipo se aísla.');
  }
  return out;
}

export function evaluarPieza(e: EntradaPieza, cv: ValoresCriterio): ResultadoPieza {
  const pp = presionesParciales(e.P, e.H2S, e.CO2, e.T, cv);
  const phCalc = phInSitu({ T_C: e.T, fCO2_bar: pp.fCO2, pH2S_bar: pp.pH2S.bar, HCO3_mgL: e.HCO3 });
  const comp = compararPH(phCalc.pH, e.pH);
  const acuosoAcido = ACIDO_HUMEDO.includes(e.tipo) || e.tipo === 'gas_seco';
  const phUsado = e.usarPHCalculado && acuosoAcido ? phCalc.pH : e.pH;
  const ssc = severidadSSC(pp.pH2S.kPa, phUsado, cv);
  const humedad = evaluarHumedad(e, cv);
  const corr = evaluarCorrosion(e, pp, humedad.humedo, cv);
  const amina = e.tipo === 'amina_rica' || e.tipo === 'amina_pobre'
    ? severidadAmina(e.tipo, e.T, e.amina ?? { tipo: 'MDEA', conc: 45, carga: 0, vel: 0, hss: 0 }, cv) : undefined;
  const teg = e.tipo === 'teg' ? severidadTEG(e.teg ?? { Tpel: e.T, contaminado: 'no' }, e.pH, cv) : undefined;
  const x: Contexto = { e, cv, pp, ssc, humedo: humedad.humedo, corr, amina, teg, phUsado };

  const materiales = e.forma === 'sello' ? [] : MATERIALES
    .filter((m) => m.formas.includes(e.forma) && (m.enLista || e.servicio?.tipo === 'agua_mar'))
    .map((m) => evaluarMaterial(m, x));
  const viables = materiales.filter((m) => m.viable && m.enLista);
  const t = topsis(
    viables.map((m) => [m.integridad, m.costoCicloVida, m.fabricabilidad]),
    [cv.peso_integridad!, cv.peso_costo!, cv.peso_fabricacion!], [true, false, true],
  );
  viables.forEach((m, i) => { m.cercania = t.cercania[i]!; });
  const ranking = t.orden.map((i) => viables[i]!);

  const inox316 = materiales.find((m) => m.id === 'ss316');
  const inoxFuera = inox316?.hallazgos.some((y) => y.tipo === 'exclusion' && y.regla === 'iso15156_3') ?? false;
  const mecanica = e.espesorInv != null && e.D != null
    ? verificarEspesor({ P_bar: e.P, D_m: e.D, e_mm: e.espesorInv, CA_mm: corr.clase?.ca ?? corr.caRequerido, S_MPa: cv.s_admisible!, E: cv.e_junta! })
    : undefined;

  return {
    entrada: e, pp, ph: { ...comp, aporteH2S: phCalc.aporteH2S, usado: phUsado }, ssc, humedad,
    regimen: regimenH2S(pp.razon, cv), corrosion: corr, amina, teg, mecanica,
    api6a: claseMaterialAPI6A(ssc.agrio, pp.pCO2.MPa, cv, inoxFuera),
    materiales, ranking, mejor: ranking[0] ?? null,
    fueraDeLista: materiales.filter((m) => !m.enLista && m.viable),
    mecanismos: mecanismos(x),
  };
}
