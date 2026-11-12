/**
 * Modelo 3 · Severidad SSC (ISO 15156-2, Figura 1).
 * Las fronteras vienen de FIGURA1_SSC. Un punto sobre una frontera pasa a la
 * región más severa (supuesto conservador del simulador).
 */
import { FIGURA1_SSC, type ValoresCriterio } from '../data/criterios';

export type RegionSSC = 0 | 1 | 2 | 3;

/** Interpola el pH de una frontera (lineal en log₁₀ pH₂S). */
export function phFrontera(vertices: [number, number][], pH2S_kPa: number): number {
  const primero = vertices[0]!;
  const ultimo = vertices[vertices.length - 1]!;
  if (pH2S_kPa <= primero[0]) return primero[1];
  if (pH2S_kPa >= ultimo[0]) return ultimo[1];
  for (let i = 1; i < vertices.length; i++) {
    const [x0, y0] = vertices[i - 1]!;
    const [x1, y1] = vertices[i]!;
    if (pH2S_kPa <= x1) {
      const f = (Math.log10(pH2S_kPa) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0));
      return y0 + f * (y1 - y0);
    }
  }
  return ultimo[1];
}

export interface SeveridadSSC {
  region: RegionSSC;
  agrio: boolean;
  /** pH de la frontera 1/2 a esa pH₂S */ phSup: number;
  /** pH de la frontera 2/3 a esa pH₂S */ phInf: number;
  /** el punto queda fuera de los ejes de la figura */ fueraDeFigura: boolean;
}

export function severidadSSC(pH2S_kPa: number, pH: number, cv?: ValoresCriterio): SeveridadSSC {
  const umbral = cv?.ssc_umbral_pH2S ?? 0.3;
  const phSup = phFrontera(FIGURA1_SSC.fronteraSuperior, pH2S_kPa);
  const phInf = phFrontera(FIGURA1_SSC.fronteraInferior, pH2S_kPa);
  const [, xMax] = FIGURA1_SSC.ejes.pH2S;
  const [yMin, yMax] = FIGURA1_SSC.ejes.pH;
  const fueraDeFigura = pH2S_kPa > xMax || pH < yMin || pH > yMax;
  let region: RegionSSC;
  if (!(pH2S_kPa >= umbral)) region = 0;
  else if (pH > phSup) region = 1;
  else if (pH > phInf) region = 2;
  else region = 3;
  return { region, agrio: region !== 0, phSup, phInf, fueraDeFigura };
}
