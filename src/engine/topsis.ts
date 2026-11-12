/**
 * Modelo 13 · Ranking multicriterio por TOPSIS.
 * Normalización vectorial, pesos normalizados a suma 1, soluciones ideal y
 * anti-ideal, y cercanía relativa C = d⁻/(d⁺ + d⁻) entre 0 y 1.
 */
export interface ResultadoTopsis {
  /** cercanía relativa de cada alternativa */ cercania: number[];
  /** índices de las alternativas, de mejor a peor */ orden: number[];
}

/**
 * @param matriz filas = alternativas, columnas = criterios
 * @param pesos un peso por criterio (cualquier escala)
 * @param beneficio true si más es mejor; false si es un costo
 */
export function topsis(matriz: number[][], pesos: number[], beneficio: boolean[]): ResultadoTopsis {
  const n = matriz.length;
  const m = pesos.length;
  if (n === 0) return { cercania: [], orden: [] };
  const suma = pesos.reduce((a, b) => a + Math.max(0, b), 0) || 1;
  const w = pesos.map((p) => Math.max(0, p) / suma);
  const norma = Array.from({ length: m }, (_, j) => Math.sqrt(matriz.reduce((a, f) => a + f[j]! * f[j]!, 0)) || 1);
  const v = matriz.map((f) => f.map((x, j) => (w[j]! * x) / norma[j]!));
  const col = (j: number): number[] => v.map((f) => f[j]!);
  const ideal = Array.from({ length: m }, (_, j) => (beneficio[j] ? Math.max(...col(j)) : Math.min(...col(j))));
  const anti = Array.from({ length: m }, (_, j) => (beneficio[j] ? Math.min(...col(j)) : Math.max(...col(j))));
  const dist = (f: number[], ref: number[]): number => Math.sqrt(f.reduce((a, x, j) => a + (x - ref[j]!) ** 2, 0));
  const cercania = v.map((f) => {
    const dMas = dist(f, ideal);
    const dMenos = dist(f, anti);
    return dMas + dMenos === 0 ? 1 : dMenos / (dMas + dMenos);
  });
  const orden = cercania.map((_, i) => i).sort((a, b) => cercania[b]! - cercania[a]! || a - b);
  return { cercania, orden };
}
