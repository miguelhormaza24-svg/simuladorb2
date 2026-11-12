/** Datos que faltan. Se muestran en Inicio, Normas y en los reportes. */
export const PENDIENTES_PROCESO: string[] = [
  'Presión real de llegada (acta B1–B2): se usa Pd = 50 bar (S1).',
  'Presión y temperatura de operación por equipo: absorbedor, contactor y regeneradores usan valores típicos.',
  'Caudales por fase: sin ellos no hay velocidad en boquillas ni efecto de flujo en el modelo de 1995.',
  'Fracción de MEG en la fase acuosa: no se da crédito hasta tener el dato.',
  'Bicarbonato y ácidos orgánicos del agua, para el pH in situ.',
  'Tipo y concentración de amina, carga ácida, velocidad y sales termoestables.',
  'H₂S y CO₂ residuales del gas endulzado (C07 y C10) y punto de rocío de entrega.',
  'Medio de calentamiento de los rehervidores y temperaturas de película.',
  'Cloro residual, temperatura y velocidad del agua de mar C13-W (acta B2–B3).',
  'Dimensiones del contactor de TEG y estado de tratamiento térmico de las soldaduras.',
];

export const PENDIENTES_NORMAS: string[] = [
  'ISO 15156-2 completa: Anexos A, C y D. Hoy solo se leyó hasta la Figura 1.',
  'ISO 15156-3 completa: Anexo A. Los límites de CRA están sin verificar.',
  'ISO 23936-1 completa: límites de temperatura de PTFE, PEEK, PVDF y PA.',
  'API 6A: las tablas de referencia vienen de memoria.',
  'NORSOK M-506: segundo modelo de corrosión por CO₂, no implementado.',
  'API RP 945, ASME II-D y API RP 14E: umbrales y fórmulas marcados como literatura.',
];
