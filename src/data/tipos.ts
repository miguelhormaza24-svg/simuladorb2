/** Origen de cada dato de entrada. La interfaz lo muestra siempre. */
export type Origen = 'D' | 'I' | 'S' | 'P' | 'U';

export const ORIGEN_TXT: Record<Origen, string> = {
  D: 'Dato del escenario B',
  I: 'Inventario o inferido del informe',
  S: 'Supuesto',
  P: 'Pendiente (valor provisional)',
  U: 'Ingresado por el usuario',
};

export interface Dato<T = number> {
  v: T;
  o: Origen;
}

export type TipoCorriente =
  | 'hc_humedo' | 'agua_agria' | 'gas_humedo' | 'amina_rica' | 'amina_pobre' | 'gas_acido'
  | 'teg' | 'vapor_acido' | 'drenaje' | 'gas_seco' | 'servicio' | 'agua_mar';

export type EstadoAgua = 'si' | 'no' | 'posible' | 'condensa';
export type TipoAmina = 'MEA' | 'DEA' | 'DIPA' | 'MDEA';

export interface DatosAmina {
  tipo: TipoAmina;
  /** % en peso */ conc: number;
  /** mol gas ácido / mol amina */ carga: number;
  /** m/s */ vel: number;
  /** sales termoestables, % en peso */ hss: number;
}

export interface DatosTEG {
  /** temperatura de película, °C */ Tpel: number;
  contaminado: 'si' | 'no';
}

export interface Corriente {
  id: string;
  nombre: string;
  fase: string;
  tipo: TipoCorriente;
  color: string;
  /** bar abs */ P: Dato;
  /** °C */ T: Dato;
  Tmax: Dato;
  Tmin: Dato;
  /** % mol en fase gas */ H2S: Dato;
  CO2: Dato;
  agua: Dato<EstadoAgua>;
  pH: Dato;
  /** mg/L */ Cl: Dato;
  /** bicarbonato, mg/L */ HCO3: Dato;
  /** % de agua en la fase acuosa (resto: MEG) */ wAgua?: Dato;
  /** punto de rocío de agua, °C */ rocio?: Dato;
  amina?: DatosAmina;
  teg?: DatosTEG;
  nota: string;
  material: string;
}

export type Forma = 'recipiente' | 'boquilla' | 'tuberia' | 'internos' | 'tubos' | 'sello';

export interface Pieza {
  id: string;
  nombre: string;
  forma: Forma;
  corriente: string;
  /** corriente del otro lado (tubos de intercambiador) */ servicio?: string;
  /** id del material propuesto en el inventario */ inv?: string;
  invTxt: string;
  dim: string;
  cant: string;
  norma: string;
  /** expuesta a la atmósfera marina */ ext?: boolean;
  nps?: string;
  /** sobreespesor del inventario, mm */ caInv?: number;
  /** condiciones locales que reemplazan las de la corriente */
  P?: number;
  T?: number;
  Tmax?: number;
}

export interface Equipo {
  id: string;
  n: number;
  etapa: number;
  nombre: string;
  corto: string;
  entradas: string[];
  salidas: string[];
  funcion: string;
  proceso: 'separador' | 'columna' | 'hx';
  /** diámetro interior (m), longitud (m), espesor del inventario (mm) */
  dim: { D: number; L: number; e: number };
  piezas: Pieza[];
}

export interface MecanismoCorriente {
  /** potencial */ P: string;
  /** por verificar */ V: string;
  /** descarte condicionado */ D: string;
  /** justificación */ J: string;
}
