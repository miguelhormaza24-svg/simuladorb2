/**
 * CRITERIOS, UMBRALES Y TABLAS DE NORMA
 * -------------------------------------------------------------------------
 * Regla del proyecto: ningún valor de norma vive fuera de este archivo.
 * Cada entrada declara valor, unidad, norma, cláusula o tabla, página y
 * `verificado`.
 *
 *   verificado: true  → leído en un PDF adjunto al proyecto (página impresa
 *                       de la norma).
 *   verificado: false → la norma no está adjunta o el PDF es una vista previa
 *                       que no llega a esa cláusula. El valor viene de
 *                       literatura, del conocimiento del modelo o del
 *                       prototipo v1, y la interfaz lo muestra «por verificar».
 */

export type EstadoFuente =
  | 'adjunta' // leído en el PDF adjunto
  | 'literatura' // artículo o práctica publicada, no adjunta
  | 'conocimiento' // norma no adjunta; valor aportado de memoria, autorizado por el usuario
  | 'supuesto' // valor didáctico del grupo
  | 'pendiente'; // sin valor: falta la norma

export interface Fuente {
  norma: string;
  clausula: string;
  pagina: number | null;
  verificado: boolean;
  estado: EstadoFuente;
  nota?: string;
}

export interface Criterio extends Fuente {
  id: string;
  titulo: string;
  valor: number;
  unidad: string;
  editable: boolean;
}

/* ---------- constructores de fuente ---------- */
const iso21457 = (clausula: string, pagina: number, nota?: string): Fuente => ({
  norma: 'ISO 21457:2010', clausula, pagina, verificado: true, estado: 'adjunta', nota,
});
const iso15156_2 = (clausula: string, pagina: number, nota?: string): Fuente => ({
  norma: 'ISO 15156-2:2015', clausula, pagina, verificado: true, estado: 'adjunta', nota,
});
const iso15156_2_na = (clausula: string, nota?: string): Fuente => ({
  norma: 'ISO 15156-2', clausula, pagina: null, verificado: false, estado: 'conocimiento',
  nota: nota ?? 'El PDF adjunto es una vista previa que termina en la pág. 9: esta cláusula no se pudo leer.',
});
const iso15156_3_na = (clausula: string, nota?: string): Fuente => ({
  norma: 'ISO 15156-3:2020', clausula, pagina: null, verificado: false, estado: 'conocimiento',
  nota: nota ?? 'El PDF adjunto es una vista previa que termina en la pág. 9: el Anexo A no se pudo leer.',
});
const iso23936_2 = (clausula: string, pagina: number, nota?: string): Fuente => ({
  norma: 'ISO 23936-2:2011', clausula, pagina, verificado: true, estado: 'adjunta', nota,
});
const api6a = (clausula: string, nota?: string): Fuente => ({
  norma: 'API 6A / ISO 10423', clausula, pagina: null, verificado: false, estado: 'conocimiento',
  nota: nota ?? 'Norma no adjunta: valor aportado de memoria por indicación del usuario. Solo referencia comparativa.',
});
const lit = (norma: string, clausula: string, nota?: string): Fuente => ({
  norma, clausula, pagina: null, verificado: false, estado: 'literatura', nota,
});
const supuesto = (nota: string): Fuente => ({
  norma: 'Criterio del grupo', clausula: '—', pagina: null, verificado: false, estado: 'supuesto', nota,
});

const c = (
  id: string, titulo: string, valor: number, unidad: string, fuente: Fuente, editable = true,
): Criterio => ({ id, titulo, valor, unidad, editable, ...fuente });

/* =====================================================================
   1. CRITERIOS ESCALARES (editables en la pestaña Criterios)
   ===================================================================== */
const LISTA: Criterio[] = [
  // --- Servicio agrio ---
  c('ssc_umbral_pH2S', 'Umbral de pH₂S para servicio agrio (región 0 por debajo)', 0.3, 'kPa',
    iso15156_2('§7.1.1 y §7.1.2', 8), false),
  c('cs_dureza_HRC', 'Dureza máxima del acero al carbono en servicio agrio', 22, 'HRC',
    iso15156_2_na('Anexo A.2.1.2')),
  c('cs_dureza_soldadura_HV', 'Dureza máxima de soldadura y ZAC en servicio agrio', 250, 'HV',
    iso15156_2_na('§7.3.3 y Anexo A.2.1.4')),

  // --- Corrosión por CO₂ e inhibición ---
  c('cr_inhibida', 'Velocidad de corrosión con inhibidor', 0.1, 'mm/a',
    iso21457('§8.1, Nota 1', 26, 'Valor típico; la norma pide acordarlo con el usuario final.')),
  c('ca_no_corrosivo', 'Sobreespesor para servicio no corrosivo', 1.5, 'mm',
    iso21457('§8.2 a)', 26, 'La norma da el intervalo 1,0 a 1,5 mm.')),
  c('ca_leve', 'Sobreespesor para servicio levemente corrosivo', 3.0, 'mm', iso21457('§8.2 b)', 26)),
  c('ca_severo', 'Sobreespesor para servicio severamente corrosivo (máximo usado en equipos)', 6.0, 'mm',
    iso21457('§8.2 c)', 26)),
  c('perdida_pared_delgada', 'Pérdida admisible en tubos e internos, que no llevan sobreespesor', 0.5, 'mm',
    supuesto('ISO 21457 §7.2.2 (pág. 17) dice que los tubos no tienen sobreespesor; la tolerancia de 0,5 mm es del grupo.')),
  c('margen_rocio', 'Margen de punto de rocío para considerar el gas seco', 10, '°C', iso21457('§6.2.3.5', 11)),
  c('regimen_h2s', 'pCO₂/pH₂S por debajo del cual domina el H₂S', 20, '—',
    lit('Pots et al., NACE Corrosion/2002, artículo 02235', 'Regímenes de corrosión CO₂/H₂S')),
  c('regimen_co2', 'pCO₂/pH₂S por encima del cual domina el CO₂', 500, '—',
    lit('Pots et al., NACE Corrosion/2002, artículo 02235', 'Regímenes de corrosión CO₂/H₂S')),
  c('p_max_fugacidad', 'Presión máxima de validez del coeficiente de fugacidad', 250, 'bar',
    lit('de Waard, Lotz y Milliams (1991), Corrosion 47(12)', 'Ecuación de fugacidad')),

  // --- Agua por defecto ---
  c('ph_agua_condensada', 'pH inicial para agua condensada sin análisis', 3.5, '—', iso21457('§6.2.3.2', 10)),
  c('cl_agua_condensada', 'Cloruros iniciales para agua condensada sin análisis', 600, 'mg/L', iso21457('§6.2.3.2', 10)),
  c('ph_agua_formacion', 'pH inicial para agua de formación sin análisis', 4.5, '—', iso21457('§6.2.3.2', 10)),
  c('cl_agua_formacion', 'Cloruros iniciales para agua de formación sin análisis', 100000, 'mg/L', iso21457('§6.2.3.2', 10)),

  // --- Inoxidables con cloruros ---
  c('cl_316_max', 'Cloruros máximos para tipo 316 hasta 60 °C', 200, 'mg/L',
    iso21457('Tabla 9, nota a', 21, 'La nota es de agua dulce; el simulador la usa como cribado para agua de proceso (§6.2.2.6).')),
  c('t_316_cloruros', 'Temperatura sobre la cual el 316 exige cloruros menores a 200 mg/L', 60, '°C',
    iso21457('Tabla 9, nota a', 21)),
  c('cloro_residual_25cr', 'Cloro residual máximo para 25Cr dúplex en agua de mar', 0.7, 'mg/L', iso21457('Tabla 10', 22)),
  c('overlay_espesor_min', 'Espesor mínimo terminado de overlay CRA', 3.0, 'mm', iso21457('§8.10', 30)),
  c('recubrimiento_t_max', 'Temperatura máxima del recubrimiento orgánico interno', 90, '°C',
    supuesto('ISO 21457 Tabla 10 solo dice que la temperatura la limita el tipo de recubrimiento. Confirmar con el fabricante.')),

  // --- Aminas (literatura, editables) ---
  c('amina_t_rica', 'Temperatura de amina rica sobre la cual se libera gas ácido', 90, '°C',
    lit('API RP 945 / API RP 571', 'Práctica de operación de unidades de amina')),
  c('amina_carga_max', 'Carga ácida máxima de amina rica en acero al carbono', 0.45, 'mol/mol',
    lit('API RP 945 / API RP 571', 'Práctica de operación de unidades de amina')),
  c('amina_vel_max', 'Velocidad máxima de amina rica en acero al carbono', 1.5, 'm/s',
    lit('API RP 945 / API RP 571', 'Práctica de operación de unidades de amina')),
  c('amina_hss_max', 'Sales termoestables máximas', 2.0, '% p/p',
    lit('API RP 945 / API RP 571', 'Práctica de operación de unidades de amina')),

  // --- TEG (literatura, editables) ---
  c('teg_t_max', 'Temperatura máxima de película del TEG (degradación térmica)', 204, '°C',
    lit('GPSA Engineering Data Book, sección 20', 'Deshidratación con glicol')),
  c('teg_ph_min', 'pH mínimo del TEG en operación', 6, '—',
    lit('GPSA Engineering Data Book, sección 20', 'Control de pH del glicol')),

  // --- Mecánica ---
  c('s_admisible', 'Esfuerzo admisible de SA-516 Gr 70 a la temperatura de diseño', 138, 'MPa',
    lit('ASME BPVC II-D, Tabla 1A', 'Norma no adjunta; verificar a la temperatura de diseño')),
  c('e_junta', 'Eficiencia de junta soldada', 1.0, '—',
    supuesto('Radiografía total (ASME VIII-1 UW-12). Norma no adjunta.')),
  c('c_erosional', 'Constante C de velocidad erosional', 100, '—',
    lit('API RP 14E, §2.5', 'Servicio continuo sin sólidos; norma no adjunta')),

  // --- Elastómeros ---
  c('rgd_p_bajo', 'Presión de gas desde la que el riesgo de RGD crece mucho', 7, 'MPa', iso23936_2('Tabla F.1', 63)),
  c('rgd_p_alto', 'Presión de gas con riesgo de RGD alto', 14, 'MPa', iso23936_2('Tabla F.1', 63)),
  c('rgd_calificacion_max', 'Calificación máxima admisible por sección de O-ring', 3, '—', iso23936_2('§7.3.2', 9), false),
  c('hinchamiento_ok', 'Hinchamiento en volumen bajo el cual la Tabla C.1 dice «OK»', 20, '%',
    iso23936_2('Tabla C.1, nota c', 41), false),

  // --- API 6A (comparativa) ---
  c('api6a_co2_leve', 'pCO₂ límite de «no corrosivo»', 0.05, 'MPa', api6a('Tabla A.1')),
  c('api6a_co2_alto', 'pCO₂ límite de «moderada a altamente corrosivo»', 0.21, 'MPa', api6a('Tabla A.1')),

  // --- Pesos de la selección multicriterio ---
  c('lcc_inhibicion', 'Recargo de costo de ciclo de vida por inhibición y monitoreo del acero al carbono', 0.5, '× CS',
    supuesto('Índice didáctico: inyección de inhibidor, cupones y probetas durante la vida de diseño.')),
  c('lcc_recubrimiento', 'Recargo de costo de ciclo de vida por inspección y reparación del recubrimiento', 0.5, '× CS',
    supuesto('Índice didáctico. ISO 21457 Tabla 4, nota a: inspección y reparación periódicas.')),
  c('peso_integridad', 'Peso del criterio integridad', 45, '%', supuesto('Pesos de partida del grupo.')),
  c('peso_costo', 'Peso del criterio costo de ciclo de vida', 40, '%', supuesto('Pesos de partida del grupo.')),
  c('peso_fabricacion', 'Peso del criterio fabricabilidad', 15, '%', supuesto('Pesos de partida del grupo.')),
];

export const CRITERIOS: Record<string, Criterio> = Object.fromEntries(LISTA.map((x) => [x.id, x]));

/** Mapa id → valor numérico. El usuario puede sobrescribir valores editables. */
export type ValoresCriterio = Record<string, number>;

export function valoresCriterio(cambios: Partial<ValoresCriterio> = {}): ValoresCriterio {
  const v: ValoresCriterio = {};
  for (const k of Object.keys(CRITERIOS)) v[k] = CRITERIOS[k]!.valor;
  for (const [k, x] of Object.entries(cambios)) {
    if (CRITERIOS[k]?.editable && typeof x === 'number' && Number.isFinite(x)) v[k] = x;
  }
  return v;
}

/* =====================================================================
   2. ISO 15156-2, Figura 1 — regiones de severidad SSC
   Digitalizada del PDF (imagen ráster de 1393 × 1145 px, 300 ppp).
   Cuadrícula medida: pH₂S 0,1 / 1 / 10 / 100 / 1000 kPa en x = 316,5 / 553 /
   789 / 1025 / 1261,5 px; pH 6,5 / 5,5 / 4,5 / 3,5 / 2,5 en y = 130 / 366 /
   602 / 838 / 1074 px. Las fronteras caen sobre las intersecciones con una
   desviación máxima de 0,002 unidades de pH.
   La línea vertical se dibuja en ≈0,316 kPa pero el texto la rotula 0,3 kPa:
   se usa el valor del texto (§7.1.1).
   ===================================================================== */
export const FIGURA1_SSC = {
  fuente: iso15156_2('§7.2.1.2, Figura 1', 9,
    'El informe cita la edición 2020; el PDF adjunto es la edición 2015.'),
  /** Vértices [pH₂S en kPa, pH] de la frontera entre las regiones 1 y 2. */
  fronteraSuperior: [[0.3, 4.5 + Math.log10(0.3)], [1, 4.5], [10, 5.5], [100, 6.5], [1000, 6.5]] as [number, number][],
  /** Vértices [pH₂S en kPa, pH] de la frontera entre las regiones 2 y 3. */
  fronteraInferior: [[0.3, 3.5], [1, 3.5], [10, 4.5], [100, 5.5], [1000, 5.5]] as [number, number][],
  /** Tramo punteado de la figura (por debajo de 0,3 kPa), solo para dibujar. */
  punteada: [[0.1, 3.5], [0.3, 4.5 + Math.log10(0.3)]] as [number, number][],
  ejes: { pH2S: [0.01, 1000] as [number, number], pH: [2.5, 6.5] as [number, number] },
};

/* =====================================================================
   3. Modelos de corrosión por CO₂ (literatura; ninguna norma adjunta los da)
   Los valores de control del proyecto (12,6 y 9,3 mm/a a 95 °C y pCO₂ 0,9 bar)
   reproducen estas constantes.
   ===================================================================== */
export const MODELO_DWM = {
  fuente1991: lit('de Waard, Lotz y Milliams (1991), Corrosion 47(12), 976–985',
    'Nomograma, factor de película, fugacidad, factor de glicol y corrección por pH',
    'Reproduce los valores de control dados por el usuario.'),
  fuente1995: lit('de Waard, Lotz y Dugstad (1995), NACE Corrosion/95, artículo 128',
    'Modelo de resistencias: reacción y transferencia de masa'),
  /** log Vnom = a − b/T + c·log fCO₂ (T en K, f en bar, V en mm/a) */
  nomograma: { a: 5.8, b: 1710, c: 0.67 },
  /** log Fpelícula = a/T − b·log fCO₂ − c, con máximo 1 */
  pelicula: { a: 2400, b: 0.6, c: 6.7 },
  /** log φ = (a − b/T)·P (P en bar) */
  fugacidad: { a: 0.0031, b: 1.4 },
  /** log Fglicol = a·(log W − 2), W = % en peso de agua en la mezcla agua/glicol */
  glicol: { a: 1.6 },
  /** pH del agua pura con CO₂: pH = a + b·t − 0,5·log fCO₂ (t en °C) */
  phCO2_1991: { a: 3.71, b: 0.00417 },
  phCO2_1995: { a: 3.82, b: 0.00384 },
  /** pH de saturación: el menor entre Fe₃O₄ (a + b/T − c·log f) y FeCO₃ (d − e·log f) */
  phSat: { a: 1.36, b: 1307, c: 0.17, d: 5.4, e: 0.66 },
  /** log FpH = a·(pHsat − pH) si pH < pHsat; −b·(pH − pHsat)^c si pH > pHsat */
  fpH: { a: 0.32, b: 0.13, c: 1.6 },
  /** 1995: log Vr = a − b/T + c·log pCO₂ − d·(pH − pHCO₂); Vm = e·U^0,8/d^0,2·pCO₂ */
  resistencias: { a: 4.93, b: 1119, c: 0.58, d: 0.34, e: 2.45 },
};

export const NORSOK_M506 = {
  disponible: false,
  fuente: {
    norma: 'NORSOK M-506', clausula: 'Modelo completo', pagina: null, verificado: false, estado: 'pendiente',
    nota: 'Norma no adjunta: el segundo modelo no se implementa. Se compara dWM 1991 con dWM 1995.',
  } as Fuente,
};

/* =====================================================================
   4. Equilibrio CO₂/H₂S–agua para el pH in situ (literatura)
   El Anexo D de ISO 15156-2 no está en el PDF adjunto.
   Constantes en función de T (K); log en base 10.
   ===================================================================== */
export const EQUILIBRIO_ACUOSO = {
  fuente: lit('Plummer y Busenberg (1982); Suleimenov y Krupp (1994); Kharaka et al. (1988)',
    'Constantes de Henry y de disociación de CO₂ y H₂S',
    'Sustituye al Anexo D de ISO 15156-2, que no está en el PDF adjunto. Solución ideal: no corrige por fuerza iónica.'),
  /** log KH,CO₂ [mol/(kg·atm)] = a + b·T + c/T + d·log T + e/T² */
  khCO2: [108.3865, 0.01985076, -6919.53, -40.45154, 669365],
  /** log K1,CO₂ */
  k1CO2: [-356.3094, -0.06091964, 21834.37, 126.8339, -1684915],
  /** log K2,CO₂ */
  k2CO2: [-107.8871, -0.03252849, 5151.79, 38.92561, -563713.9],
  /** log KH,H₂S [mol/(L·bar)] = −(a + b·T + c·T² + d/T + e·log T) */
  khH2S: [634.27, 0.2709, -0.00011132, -16719, -261.9],
  /** log K1,H₂S = a + b·T + c·T² + d/T + e·ln T */
  k1H2S: [782.43945, 0.361261, -0.00016722, -20565.7315, -142.741722],
  /** log Kw = a/T + b + c·T */
  kw: [-4470.99, 6.0875, -0.01706],
  /** masas molares, g/mol */
  M_HCO3: 61.017,
};

/* =====================================================================
   5. ISO 21457 — PREN, atmósfera marina, agua de mar clorada
   ===================================================================== */
export const PREN_CLASES = {
  fuente: iso21457('§3.1.18 Ec. (1) y §3.1.21 a §3.1.23', 4),
  /** FPREN = wCr + 3,3·(wMo + 0,5·wW) + 16·wN */
  coef: { Mo: 3.3, W: 0.5, N: 16 },
  tipo6Mo_min: 40,
  tipo22Cr: [30, 40] as [number, number],
  tipo25Cr: [40, 45] as [number, number],
};

/** Tabla 3: límites de temperatura (°C) de inoxidables sin recubrimiento en atmósfera marina. */
export const TABLA3_ATMOSFERA_MARINA = {
  fuente: iso21457('§6.6.2, Tabla 3', 14,
    'El límite inferior es el peor caso de laboratorio; muchos usuarios aplican el superior. Aleaciones de níquel y titanio no tienen límite establecido (nota b).'),
  limites: {
    tipo316: [50, 60], tipo6Mo: [100, 120], tipo22Cr: [80, 100], tipo25Cr: [90, 110],
  } as Record<string, [number, number]>,
};

export interface FilaAguaMar {
  material: string;
  /** °C; null = la limita el recubrimiento */ tMax: number | null;
  equipos: string;
  otras?: string;
}

/** Tabla 10: materiales típicos para agua de mar clorada con rendijas. */
export const TABLA10_AGUA_MAR = {
  fuente: iso21457('§7.4.3, Tabla 10', 22,
    'En carcasa y tubos con agua de mar hay rendijas severas y el inoxidable generalmente no se usa; se usa titanio.'),
  filas: [
    { material: 'pe', tMax: 60, equipos: 'Tubería' },
    { material: 'tubo_elastomero', tMax: 70, equipos: 'Tubería' },
    { material: 'grp_epoxi', tMax: 95, equipos: 'Tubería, recipientes', otras: 'Velocidad máxima 5 m/s' },
    { material: 'cs_recubierto', tMax: null, equipos: 'Tubería, recipientes, válvulas', otras: 'La temperatura la limita el recubrimiento' },
    { material: 'tipo6Mo', tMax: 20, equipos: 'Tubería, recipientes' },
    { material: 'alloy625', tMax: 30, equipos: 'Tubería, equipos, válvulas' },
    { material: 'tipo25Cr', tMax: 20, equipos: 'Tubería, equipos, recipientes, válvulas, bombas', otras: 'Cloro residual máximo 0,7 mg/L' },
    { material: 'alloyC276', tMax: 50, equipos: 'Tubería, equipos, válvulas, intercambiadores' },
    { material: 'alloy686', tMax: 60, equipos: 'Tubería, equipos, válvulas, intercambiadores' },
    { material: 'titanio', tMax: 85, equipos: 'Tubería, equipos, válvulas, intercambiadores' },
    { material: 'cuni9010', tMax: 100, equipos: 'Tubería, intercambiadores', otras: 'Velocidad máxima 2,5 a 3,5 m/s; evitar estancamiento y acople con inoxidable, titanio o níquel' },
    { material: 'nial_bronce', tMax: 75, equipos: 'Bombas y válvulas', otras: 'Velocidad máxima 15 m/s' },
  ] as FilaAguaMar[],
};

export const CUI = {
  fuente: iso21457('§6.6.5', 14,
    'Cualitativo: amenaza mayor en aceros al carbono y de baja aleación; también considerar austeníticos y dúplex.'),
  familias: ['CS', 'CLAD', 'SS', 'DSS'],
};

export const ASCC_AMINAS = {
  fuente: iso21457('§6.2.2.5', 9,
    'Cualitativo: aminas, cáusticos o carbonatos causan agrietamiento alcalino del acero al carbono. Mitigación: tratamiento térmico tras soldar o conformar, recubrimiento, CRA o no metálicos.'),
  /** Temperatura (°C) sobre la que se pide PWHT; null = a toda temperatura. */
  pwht: { MEA: null, DIPA: null, DEA: 60, MDEA: 82 } as Record<string, number | null>,
  fuentePwht: lit('API RP 945', '§ sobre tratamiento térmico posterior a la soldadura',
    'Norma no adjunta; el informe pide confirmar el estado de PWHT.'),
};

export const TEG_MATERIALES = {
  fuente: iso21457('§7.4.4 y Tabla 11', 23,
    'Glicol: acero al carbono o tipo 316. El 316 es buena alternativa en intercambiadores y componentes críticos; el acero al carbono exige inhibición o control de pH.'),
};

/* =====================================================================
   6. ISO 15156-3, Anexo A — límites ambientales de CRA (SIN VERIFICAR)
   Cada fila es una combinación admisible: se cumple si la condición queda
   dentro de al menos una fila. null = sin límite.
   ===================================================================== */
export interface Limite15156 {
  tMax: number | null;
  pH2S_kPa: number | null;
  cl_mgL: number | null;
  pHmin: number | null;
}

export interface Limites15156Material {
  fuente: Fuente;
  filas: Limite15156[];
  nota: string;
}

export const LIMITES_15156_3: Record<string, Limites15156Material> = {
  tipo316: {
    fuente: iso15156_3_na('Tabla A.2'),
    filas: [{ tMax: 60, pH2S_kPa: 100, cl_mgL: null, pHmin: null }],
    nota: 'Austeníticos: 60 °C y 100 kPa con cualquier Cl⁻ y pH. La tabla tiene filas adicionales para S31603 con Cl⁻ limitado que no se cargaron.',
  },
  tipo6Mo: {
    fuente: iso15156_3_na('Tabla A.8'),
    filas: [
      { tMax: 60, pH2S_kPa: 100, cl_mgL: null, pHmin: null },
      { tMax: 121, pH2S_kPa: 700, cl_mgL: 5000, pHmin: null },
      { tMax: 149, pH2S_kPa: 310, cl_mgL: 5000, pHmin: null },
      { tMax: 171, pH2S_kPa: 100, cl_mgL: 5000, pHmin: null },
    ],
    nota: 'Austeníticos altamente aleados con PREN > 40.',
  },
  tipo22Cr: {
    fuente: iso15156_3_na('Tabla A.24'),
    filas: [{ tMax: 232, pH2S_kPa: 10, cl_mgL: null, pHmin: null }],
    nota: 'Dúplex con 30 ≤ PREN ≤ 40 y Mo ≥ 1,5 %.',
  },
  tipo25Cr: {
    fuente: iso15156_3_na('Tabla A.24'),
    filas: [{ tMax: 232, pH2S_kPa: 20, cl_mgL: null, pHmin: null }],
    nota: 'Dúplex con 40 < PREN ≤ 45.',
  },
  alloy625: {
    fuente: iso15156_3_na('Tabla A.13'),
    filas: [{ tMax: null, pH2S_kPa: null, cl_mgL: null, pHmin: null }],
    nota: 'Aleación de níquel en solución sólida, recocida: cualquier combinación de T, pH₂S, Cl⁻ y pH.',
  },
  titanio: {
    fuente: iso15156_3_na('Tabla A.41'),
    filas: [{ tMax: null, pH2S_kPa: null, cl_mgL: null, pHmin: null }],
    nota: 'R50400 (Gr 2) con dureza máxima de 100 HRB: cualquier combinación.',
  },
};

/** Requisitos del acero al carbono según la región SSC (ISO 15156-2 §7.2.1.4, sin verificar). */
export const CS_REGIONES = {
  fuente: iso15156_2_na('§7.2.1.4 y Anexo A.2 a A.4'),
  requisito: {
    0: 'Sin precauciones especiales (§7.2.1.3).',
    1: 'Aceros de A.2, A.3 o A.4.',
    2: 'Aceros de A.2 o A.3.',
    3: 'Solo aceros de A.2: dureza ≤ 22 HRC, soldadura ≤ 250 HV.',
  } as Record<number, string>,
};

/* =====================================================================
   7. ISO 23936-2 — elastómeros
   ===================================================================== */
export type Resistencia = 'OK' | 'C' | 'NO';

export interface Elastomero {
  id: string;
  /** temperatura máxima nominal en aire, °C */ tMax: number;
  /** límite superior del intervalo, si la tabla da uno */ tMaxSup?: number;
  crudo: Resistencia;
  alcalino: Resistencia;
  metanol: Resistencia;
  agua: Resistencia;
  h2s: Resistencia;
  desc: string;
}

/** Tabla C.1 (informativa): características de los elastómeros más usados. */
export const TABLA_C1_ELASTOMEROS = {
  fuente: iso23936_2('Anexo C, Tabla C.1', 41,
    'Es solo una guía: la norma recomienda caracterizar cada compuesto en su ambiente. OK = hinchamiento < 20 % y envejecimiento aceptable; C = podría servir, ver notas; NO = no apto.'),
  filas: [
    { id: 'EPDM', tMax: 150, crudo: 'NO', alcalino: 'OK', metanol: 'OK', agua: 'OK', h2s: 'OK', desc: 'Bueno en agua y vapor; malo en hidrocarburos.' },
    { id: 'CR', tMax: 100, crudo: 'C', alcalino: 'NO', metanol: 'OK', agua: 'OK', h2s: 'C', desc: 'Bueno en agua; cubierta de mangueras; buena intemperie.' },
    { id: 'NBR', tMax: 120, crudo: 'OK', alcalino: 'OK', metanol: 'OK', agua: 'OK', h2s: 'NO', desc: 'Nitrilo de uso general; susceptible al envejecimiento.' },
    { id: 'HNBR', tMax: 160, crudo: 'OK', alcalino: 'OK', metanol: 'OK', agua: 'OK', h2s: 'C', desc: 'Nitrilo hidrogenado: mejor resistencia térmica y química.' },
    { id: 'FKM 1', tMax: 200, crudo: 'OK', alcalino: 'NO', metanol: 'NO', agua: 'OK', h2s: 'C', desc: 'Copolímero, el más especificado; malo en metanol y en fluidos alcalinos.' },
    { id: 'FKM 2', tMax: 200, crudo: 'OK', alcalino: 'NO', metanol: 'OK', agua: 'OK', h2s: 'C', desc: 'Terpolímero; los grados de alto flúor resisten metanol.' },
    { id: 'FKM 3', tMax: 200, crudo: 'OK', alcalino: 'NO', metanol: 'NO', agua: 'OK', h2s: 'C', desc: 'Terpolímero de baja Tg; los grados de bajo flúor no resisten metanol.' },
    { id: 'FKM 5', tMax: 200, crudo: 'OK', alcalino: 'OK', metanol: 'OK', agua: 'OK', h2s: 'C', desc: 'Pentapolímero para fluidos alcalinos; poca información de desempeño.' },
    { id: 'FEPM', tMax: 230, crudo: 'C', alcalino: 'OK', metanol: 'OK', agua: 'OK', h2s: 'OK', desc: 'TFE/P: malo en aromáticos; bueno en H₂S, vapor y alcalinos; Tg alta.' },
    { id: 'ETP', tMax: 200, crudo: 'OK', alcalino: 'OK', metanol: 'OK', agua: 'OK', h2s: 'C', desc: 'Terpolímero con etileno, desarrollado para resistencia alcalina.' },
    { id: 'FFKM', tMax: 220, tMaxSup: 315, crudo: 'OK', alcalino: 'OK', metanol: 'OK', agua: 'OK', h2s: 'OK', desc: 'Perfluoroelastómero: 220 a 315 °C según el curado; muy buena resistencia química.' },
  ] as Elastomero[],
  notas: [
    'Nota 2: es improbable el contacto de CR con H₂S.',
    'Nota 3: los nitrilos envejecen químicamente con H₂S, el NBR más que el HNBR; dependen de temperatura y concentración.',
    'Nota 4: el metanol de la tabla es puro; diluido en agua es menos agresivo.',
    'Nota 6: en FKM, el curado con peróxido resiste mejor que el de bisfenol.',
  ],
};

export interface ClaseTemperatura {
  clase: string;
  /** °C; null = temperatura ambiente */ min: number | null;
  max: number | null;
  /** temperaturas de ensayo, °C; null = no es posible */ ensayo: [number, number, number] | null;
}

/** Tabla A.6: clases de temperatura y temperaturas elevadas de ensayo. */
export const TABLA_A6_TEMPERATURA = {
  fuente: iso23936_2('Anexo A, §A.1.2.1, Tabla A.6', 19,
    'La nota de la tabla dice que es coherente con ISO 10423 y API 6A. Tolerancia de ±2 °C.'),
  filas: [
    { clase: 'K', min: -60, max: 82, ensayo: [97, 112, 127] },
    { clase: 'L', min: -46, max: 82, ensayo: [97, 112, 127] },
    { clase: 'P', min: -29, max: 82, ensayo: [97, 112, 127] },
    { clase: 'R', min: null, max: null, ensayo: [36, 51, 66] },
    { clase: 'S', min: -18, max: 66, ensayo: [81, 96, 111] },
    { clase: 'T', min: -18, max: 82, ensayo: [97, 112, 127] },
    { clase: 'U', min: -18, max: 121, ensayo: [136, 151, 166] },
    { clase: 'V', min: 2, max: 121, ensayo: [136, 151, 166] },
    { clase: 'X', min: -18, max: 180, ensayo: [195, 210, 225] },
    { clase: 'Y', min: -18, max: 345, ensayo: null },
    { clase: 'No ISO/API', min: 0, max: 150, ensayo: [165, 180, 195] },
  ] as ClaseTemperatura[],
};

/** Tablas A.1 a A.5: medios de envejecimiento. */
export const MEDIOS_ENVEJECIMIENTO = {
  fuente: iso23936_2('Anexo A, §A.1.1.2, Tablas A.1 a A.5', 17),
  liquido: {
    'A.1.i': 'No aromático: 70 % heptano, 30 % ciclohexano',
    'A.1.ii': 'Aromático: 70 % heptano, 20 % ciclohexano, 10 % tolueno',
  },
  gasDulce: { 'A.2.i': '5 % CO₂, 95 % CH₄' },
  gasAgrio: {
    'A.3.i': 'Normal: 3 % CO₂, 2 % H₂S, 95 % CH₄',
    'A.3.ii': 'Alto H₂S: 5 % CO₂, 10 % H₂S, 85 % CH₄',
  },
  /** límite de H₂S en el gas de servicio para usar A.3.i (su contenido de H₂S) */
  h2sNormal_pct: 2,
  multifase: '30 % en volumen de gas, 10 % de agua desionizada y 60 % de hidrocarburo líquido (Tabla A.4 dulce, Tabla A.5 agria)',
  presion: '6 ± 0,5 MPa con los gases de ensayo, antes de calentar (§A.1.2.2)',
  replicas: 5,
};

/** §7.2.2: intervalos máximos de aceptación tras el envejecimiento. */
export const ACEPTACION_ENVEJECIMIENTO = {
  fuente: iso23936_2('§7.2.2', 9, 'Empieza en la pág. 8. Cualquier relajación se acuerda con el usuario.'),
  dureza: [-20, 10] as [number, number],
  durezaNominal90: [-20, 5] as [number, number],
  volumen_pct: [-5, 25] as [number, number],
  traccion_pct: [-50, 50] as [number, number],
};

/** Anexo B: ensayo normalizado de descompresión rápida de gas. */
export const ENSAYO_RGD = {
  fuente: iso23936_2('Anexo B, §B.1.1.2 a §B.1.2', 27,
    'Aprobar a 100 °C y 15 MPa califica para servicio por debajo de esos valores; no se permite extrapolar hacia arriba.'),
  presion_MPa: 15,
  temperatura_C: 100,
  despresurizacion_MPa_min: 2,
  ciclos: 8,
  primeraExposicion_h: 68,
  csd_mm: 5.33,
  replicasMin: 4,
  gas: { 'B.1.i': '10 % mol CO₂, 90 % mol CH₄', 'B.1.ii': '10 % mol CO₂, 90 % mol N₂' },
  notaH2S: 'El CO₂ se considera sustituto adecuado del H₂S en el ensayo RGD; el envejecimiento agrio se califica aparte con el Anexo A.',
  fuenteCalificacion: iso23936_2('Anexo B, Tabla B.4 y Tabla B.5', 34),
};

export const RGD_RIESGO = {
  fuente: iso23936_2('Anexo F, Tabla F.1', 63,
    'Sobre 7 a 14 MPa el riesgo crece mucho; el CO₂ alto lo aumenta; secciones gruesas y más ciclos también.'),
};

/* =====================================================================
   8. Termoplásticos
   ISO 23936-1:2022 adjunta es una vista previa (hasta §4.4): no trae tabla
   de límites de temperatura. Los límites verificables vienen de ISO 21457.
   ===================================================================== */
export interface Termoplastico {
  id: string;
  nombre: string;
  /** °C; null = pendiente */ tMaxAguaDulce: number | null;
  tMaxAguaMar: number | null;
  fuente: Fuente;
}

const iso23936_1_pend = (): Fuente => ({
  norma: 'ISO 23936-1:2022', clausula: 'Límites de temperatura', pagina: null, verificado: false, estado: 'pendiente',
  nota: 'El PDF adjunto es una vista previa que termina en §4.4 y no trae límites. Pendiente.',
});

export const TERMOPLASTICOS = {
  fuenteGeneral: {
    norma: 'ISO 23936-1:2022', clausula: '§1 y §4.1', pagina: 5, verificado: true, estado: 'adjunta',
    nota: 'La norma define cuatro niveles de ensayo de estabilidad, no una lista de materiales aprobados. La descompresión rápida queda fuera de su alcance. Los polímeros totalmente fluorados (PTFE, PTFE modificado, PFA, FEP) sin carga o con carga de carbono están exentos de los niveles 3 y 4.',
  } as Fuente,
  exentosNivel3y4: ['PTFE', 'PTFEm', 'PFA', 'FEP'],
  filas: [
    { id: 'PE', nombre: 'Polietileno', tMaxAguaDulce: 60, tMaxAguaMar: 60, fuente: iso21457('Tabla 9 y Tabla 10', 21, 'La temperatura real la fija el usuario con el fabricante (nota c).') },
    { id: 'PP', nombre: 'Polipropileno', tMaxAguaDulce: 90, tMaxAguaMar: null, fuente: iso21457('Tabla 9', 21, 'La temperatura real la fija el usuario con el fabricante (nota c).') },
    { id: 'PVC', nombre: 'Policloruro de vinilo', tMaxAguaDulce: 70, tMaxAguaMar: null, fuente: iso21457('Tabla 9', 21, 'La temperatura real la fija el usuario con el fabricante (nota c).') },
    { id: 'GRP epoxi', nombre: 'Plástico reforzado con fibra de vidrio, resina epoxi', tMaxAguaDulce: 95, tMaxAguaMar: 95, fuente: iso21457('Tabla 9 y Tabla 10', 21) },
    { id: 'PTFE', nombre: 'Politetrafluoroetileno', tMaxAguaDulce: null, tMaxAguaMar: null, fuente: iso23936_1_pend() },
    { id: 'PEEK', nombre: 'Polieteretercetona', tMaxAguaDulce: null, tMaxAguaMar: null, fuente: iso23936_1_pend() },
    { id: 'PVDF', nombre: 'Polifluoruro de vinilideno', tMaxAguaDulce: null, tMaxAguaMar: null, fuente: iso23936_1_pend() },
    { id: 'PA', nombre: 'Poliamida', tMaxAguaDulce: null, tMaxAguaMar: null, fuente: iso23936_1_pend() },
  ] as Termoplastico[],
};

/* =====================================================================
   9. API 6A — referencia comparativa (SIN VERIFICAR, de memoria)
   Las clases de temperatura se toman de la Tabla A.6 de ISO 23936-2, que sí
   está adjunta y declara ser coherente con API 6A.
   ===================================================================== */
export const API6A = {
  fuenteTabla2: api6a('Tabla 2 (clases de temperatura)',
    'Se usan los valores de ISO 23936-2 Tabla A.6 (pág. 19), que la propia tabla declara coherentes con API 6A.'),
  fuenteTabla3: api6a('Tabla 3 (clases de material)'),
  fuenteTablaA1: api6a('Anexo A, Tabla A.1 (corrosividad relativa por pCO₂)'),
  fuenteTablaF2: api6a('Anexo F, Tabla F.2 (fluidos de ensayo de sellos no metálicos)'),
  clasesMaterial: {
    AA: { servicio: 'General', cuerpo: 'Acero al carbono o de baja aleación', internos: 'Acero al carbono o de baja aleación' },
    BB: { servicio: 'General', cuerpo: 'Acero al carbono o de baja aleación', internos: 'Acero inoxidable' },
    CC: { servicio: 'General', cuerpo: 'Acero inoxidable', internos: 'Acero inoxidable' },
    DD: { servicio: 'Agrio', cuerpo: 'Acero al carbono o de baja aleación', internos: 'Acero al carbono o de baja aleación' },
    EE: { servicio: 'Agrio', cuerpo: 'Acero al carbono o de baja aleación', internos: 'Acero inoxidable' },
    FF: { servicio: 'Agrio', cuerpo: 'Acero inoxidable', internos: 'Acero inoxidable' },
    HH: { servicio: 'Agrio', cuerpo: 'CRA', internos: 'CRA' },
  } as Record<string, { servicio: string; cuerpo: string; internos: string }>,
  fluidoSellos: {
    AA: '5 % CO₂ y 95 % CH₄', BB: '5 % CO₂ y 95 % CH₄', CC: '80 % CO₂ y 20 % CH₄',
    DD: '10 % H₂S, 5 % CO₂ y 85 % CH₄', EE: '10 % H₂S, 5 % CO₂ y 85 % CH₄',
    FF: '10 % H₂S, 80 % CO₂ y 10 % CH₄', HH: '10 % H₂S, 80 % CO₂ y 10 % CH₄',
  } as Record<string, string>,
  ensayoSellos: { presion_MPa: 6.9, duracion_h: 160, hidrocarburo_pct: 60, agua_pct: 5 },
};

/* =====================================================================
   10. Mecánica (normas no adjuntas)
   ===================================================================== */
export const MECANICA = {
  fuenteUG27: lit('ASME BPVC VIII-1, UG-27(c)(1)', 't = P·R / (S·E − 0,6·P)',
    'Norma no adjunta. Válida si t ≤ R/2 y P ≤ 0,385·S·E.'),
  fuenteErosional: lit('API RP 14E, §2.5, Ec. 2.14', 'Ve = C / √ρm (pie/s, lb/pie³)',
    'Norma no adjunta. En SI: Ve [m/s] = 1,22·C / √ρ [kg/m³].'),
  factorSI: 1.22,
  limiteUG27: 0.385,
};

/* =====================================================================
   11. Fuentes de reglas cualitativas
   ===================================================================== */
export const FUENTES = {
  sinSobreespesorTubos: iso21457('§7.2.2', 17, 'Los tubos y placas de intercambiador no disponen de sobreespesor: se considera CRA.'),
  sobreespesor: iso21457('§8.2', 26),
  inhibicion: iso21457('§8.1, Nota 1', 26),
  agrioNoSeRelaja: iso21457('§6.2.2.4', 9, 'Deshidratar o inhibir no relaja el requisito de materiales resistentes al H₂S.'),
  gasSeco: iso21457('§6.2.3.5', 11),
  corrosionH2S: iso21457('§6.2.2.2', 8),
  sccSinH2S: iso21457('§6.2.2.6 y Tabla 9, nota a', 9),
  recipientes: iso21457('§7.2.3 y Tabla 4', 18, 'Recipientes: acero al carbono con o sin recubrimiento, con clad u overlay, o CRA sólido. Nota a: ánodos e inspección del recubrimiento.'),
  recubrimientos: iso21457('§8.3', 27, 'Evaluar la galvánica entre internos CRA y la pared si el recubrimiento se daña.'),
  galvanica: iso21457('§8.7.1', 28),
  recubrimientoExterno: iso21457('§8.3', 27, 'Recubrir inoxidables contra SCC externo exige acuerdo con el usuario final.'),
  calificacionAlterna: {
    norma: 'ISO 15156-3:2020', clausula: '§6.1', pagina: 6, verificado: true, estado: 'adjunta',
    nota: 'Los CRA se seleccionan con el Anexo A, por ensayo según el Anexo B o por experiencia de campo documentada.',
  } as Fuente,
  cuniProceso: lit('Práctica de selección de aleaciones de cobre', 'Ataque por sulfuros y por aminas',
    'Las aleaciones de cobre no se usan con H₂S ni con aminas en el lado de proceso. ISO 21457 Tabla 8, nota a: el CuNi 90/10 no es compatible galvánicamente con CRA.'),
  grupo: supuesto('Regla de cribado del grupo, heredada del prototipo v1.'),
};

/* =====================================================================
   12. Normas del proyecto y su estado
   ===================================================================== */
export interface NormaProyecto {
  codigo: string;
  titulo: string;
  estado: 'completa' | 'vista previa' | 'no adjunta';
  alcance: string;
}

export const NORMAS: NormaProyecto[] = [
  { codigo: 'ISO 21457:2010', titulo: 'Selección de materiales y control de corrosión para sistemas de producción de petróleo y gas', estado: 'completa', alcance: 'Mecanismos, sobreespesor, inhibición, PREN, Tablas 3, 9, 10 y 11, CUI, agrietamiento alcalino.' },
  { codigo: 'ISO 15156-2:2015', titulo: 'Aceros al carbono y de baja aleación resistentes al agrietamiento', estado: 'vista previa', alcance: 'Leído hasta la pág. 9: umbral de 0,3 kPa y Figura 1. Faltan los Anexos A, C y D.' },
  { codigo: 'ISO 15156-3:2020', titulo: 'CRA y otras aleaciones resistentes al agrietamiento', estado: 'vista previa', alcance: 'Leído hasta la pág. 9: PREN (§6.3). Falta el Anexo A con los límites ambientales.' },
  { codigo: 'ISO 23936-2:2011', titulo: 'Materiales no metálicos. Parte 2: elastómeros', estado: 'completa', alcance: 'Tabla C.1, Anexo A (envejecimiento), Anexo B (RGD), Tabla F.1 y criterios de aceptación.' },
  { codigo: 'ISO 23936-1:2022', titulo: 'Materiales no metálicos. Parte 1: termoplásticos', estado: 'vista previa', alcance: 'Leído hasta §4.4: alcance y niveles de ensayo. Sin límites de temperatura.' },
  { codigo: 'API 6A / ISO 10423', titulo: 'Equipos de cabeza de pozo y árbol de navidad', estado: 'no adjunta', alcance: 'Referencia comparativa de memoria: Tablas 2, 3, A.1 y F.2.' },
  { codigo: 'NORSOK M-506', titulo: 'Modelo de velocidad de corrosión por CO₂', estado: 'no adjunta', alcance: 'No implementado.' },
  { codigo: 'API RP 945', titulo: 'Agrietamiento ambiental en unidades de amina', estado: 'no adjunta', alcance: 'Criterios de amina marcados como literatura.' },
  { codigo: 'ASME VIII-1 / II-D', titulo: 'Recipientes a presión y propiedades de materiales', estado: 'no adjunta', alcance: 'Fórmula UG-27 y esfuerzo admisible editable.' },
  { codigo: 'API RP 14E', titulo: 'Diseño de tuberías de producción costa afuera', estado: 'no adjunta', alcance: 'Velocidad erosional con C editable.' },
];
