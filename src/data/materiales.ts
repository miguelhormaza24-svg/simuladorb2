/**
 * Materiales candidatos.
 * - Composición: intervalos de ISO 21457:2010, Anexo C, Tabla C.1 (págs. 35 a 37, verificado).
 *   Para S32205 la tabla imprime Mo 3,00–3,00; se carga tal cual.
 * - costo y fab: índices didácticos del grupo (acero al carbono = 1; fab de 0 a 10). Editables.
 * - enLista: false = no está en la lista de candidatos del inventario; se muestra solo
 *   para informar que la Tabla 10 de ISO 21457 lo admite.
 */
import type { Forma } from './tipos';

export type Familia = 'CS' | 'CLAD' | 'SS' | 'DSS' | 'NI' | 'TI' | 'CU';
export type Rango = [number, number];

export interface Material {
  id: string;
  nombre: string;
  spec: string;
  familia: Familia;
  uns?: string;
  /** % en peso, [mín, máx] */
  comp?: { Cr: Rango; Mo: Rango; N?: Rango; W?: Rango };
  costo: number;
  fab: number;
  formas: Forma[];
  /** clave en LIMITES_15156_3 de la capa en contacto con el fluido */
  clave15156?: string;
  /** clave en TABLA3_ATMOSFERA_MARINA; solo materiales sólidos expuestos */
  claveAtm?: string;
  /** clave en TABLA10_AGUA_MAR */
  claveAguaMar?: string;
  enLista: boolean;
  ref: string;
}

const TODAS: Forma[] = ['recipiente', 'boquilla', 'tuberia', 'internos', 'tubos'];

export const MATERIALES: Material[] = [
  { id: 'cs', nombre: 'Acero al carbono sour/HIC', spec: 'SA-516 Gr 70N · SA-105N · A106 Gr B · SA-179 (tubos)', familia: 'CS',
    costo: 1, fab: 10, formas: TODAS, enLista: true, ref: 'ISO 21457 §7.2.1 (caso base) y Tabla 4' },
  { id: 'cs_coat', nombre: 'Acero al carbono con recubrimiento interno orgánico', spec: 'SA-516 Gr 70N + epoxi o fenólico, con ánodos', familia: 'CS',
    costo: 1.5, fab: 8, formas: ['recipiente'], enLista: true, ref: 'ISO 21457 Tabla 4 (recipientes), nota a' },
  { id: 'cs_c316', nombre: 'Acero al carbono con clad u overlay 316L', spec: 'SA-516 Gr 70N + clad SA-264 u overlay ER316L', familia: 'CLAD', uns: 'S31603',
    comp: { Cr: [16, 18], Mo: [2, 3] }, costo: 3, fab: 6, formas: ['recipiente', 'boquilla'], clave15156: 'tipo316', enLista: true,
    ref: 'ISO 21457 Tabla 4 y §8.10' },
  { id: 'cs_c625', nombre: 'Acero al carbono con overlay Alloy 625', spec: 'SA-516 Gr 70N o SA-105N + overlay ERNiCrMo-3', familia: 'CLAD', uns: 'N06625',
    comp: { Cr: [20, 23], Mo: [8, 10] }, costo: 5, fab: 5, formas: ['recipiente', 'boquilla'], clave15156: 'alloy625', enLista: true,
    ref: 'ISO 21457 Tabla 4 y §8.10' },
  { id: 'ss316', nombre: 'Inoxidable austenítico 316L', spec: 'UNS S31603 · SA-240, A312 o A213 TP316L', familia: 'SS', uns: 'S31603',
    comp: { Cr: [16, 18], Mo: [2, 3] }, costo: 4, fab: 9, formas: TODAS, clave15156: 'tipo316', claveAtm: 'tipo316', enLista: true,
    ref: 'ISO 21457 Tablas 3, 4 y 11' },
  { id: 'dss22', nombre: 'Dúplex 22Cr (2205)', spec: 'UNS S32205', familia: 'DSS', uns: 'S32205',
    comp: { Cr: [22, 23], Mo: [3, 3], N: [0.14, 0.2] }, costo: 5, fab: 7, formas: TODAS, clave15156: 'tipo22Cr', claveAtm: 'tipo22Cr', enLista: true,
    ref: 'ISO 21457 Tablas 3 y 4' },
  { id: 'dss25', nombre: 'Superdúplex 25Cr (2507)', spec: 'UNS S32750, especificado con PREN ≥ 40', familia: 'DSS', uns: 'S32750',
    comp: { Cr: [24, 26], Mo: [3, 5], N: [0.24, 0.32] }, costo: 7, fab: 6, formas: TODAS, clave15156: 'tipo25Cr', claveAtm: 'tipo25Cr', claveAguaMar: 'tipo25Cr', enLista: true,
    ref: 'ISO 21457 Tablas 3, 4 y 10; Tabla C.1 nota b' },
  { id: 'mo6', nombre: 'Austenítico 6Mo', spec: 'UNS S31254', familia: 'SS', uns: 'S31254',
    comp: { Cr: [19, 20], Mo: [6, 6.5], N: [0.18, 0.22] }, costo: 8, fab: 6, formas: ['boquilla', 'tuberia', 'internos', 'tubos'], clave15156: 'tipo6Mo', claveAtm: 'tipo6Mo', claveAguaMar: 'tipo6Mo', enLista: true,
    ref: 'ISO 21457 Tablas 3, 10 y 11' },
  { id: 'a625', nombre: 'Alloy 625 sólido', spec: 'UNS N06625', familia: 'NI', uns: 'N06625',
    comp: { Cr: [20, 23], Mo: [8, 10] }, costo: 15, fab: 5, formas: ['boquilla', 'tuberia', 'internos', 'tubos'], clave15156: 'alloy625', claveAguaMar: 'alloy625', enLista: true,
    ref: 'ISO 21457 Tablas 4 y 10; Tabla 3 nota b' },
  { id: 'ti2', nombre: 'Titanio Gr 2', spec: 'ASTM B338 Gr 2 (tubos)', familia: 'TI', uns: 'R50400',
    costo: 10, fab: 5, formas: ['tubos'], clave15156: 'titanio', claveAguaMar: 'titanio', enLista: true,
    ref: 'ISO 21457 Tabla 10 y §7.4.3' },
  // --- Admitidos por la Tabla 10 pero fuera de la lista de candidatos del inventario ---
  { id: 'c276', nombre: 'Alloy C276 / C22', spec: 'UNS N10276', familia: 'NI', uns: 'N10276',
    comp: { Cr: [14.5, 16.5], Mo: [15, 17], W: [3, 4.5] }, costo: 22, fab: 4, formas: ['tubos'], clave15156: 'alloy625', claveAguaMar: 'alloyC276', enLista: false,
    ref: 'ISO 21457 Tabla 10' },
  { id: 'a59', nombre: 'Alloy 686 / 59 / C2000', spec: 'UNS N06059', familia: 'NI', uns: 'N06059',
    comp: { Cr: [22, 24], Mo: [15, 16.5] }, costo: 25, fab: 4, formas: ['tubos'], clave15156: 'alloy625', claveAguaMar: 'alloy686', enLista: false,
    ref: 'ISO 21457 Tabla 10' },
  { id: 'cuni', nombre: 'CuNi 90/10', spec: 'UNS C70600', familia: 'CU', uns: 'C70600',
    costo: 3, fab: 7, formas: ['tubos'], claveAguaMar: 'cuni9010', enLista: false,
    ref: 'ISO 21457 Tabla 10, notas b y c' },
];

export const materialPorId = (id: string): Material | undefined => MATERIALES.find((m) => m.id === id);
