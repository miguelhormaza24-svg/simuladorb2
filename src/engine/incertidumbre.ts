/**
 * Modelo 14 · Incertidumbre: sensibilidad (tornado) y Monte Carlo.
 * El generador tiene semilla, así que cada corrida es reproducible.
 */
export type Distribucion =
  | { tipo: 'fijo'; v: number }
  | { tipo: 'uniforme'; min: number; max: number }
  | { tipo: 'triangular'; min: number; moda: number; max: number }
  | { tipo: 'normal'; media: number; desv: number; min?: number; max?: number };

/** Generador pseudoaleatorio mulberry32: uniforme en [0, 1). */
export function mulberry32(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function muestrear(d: Distribucion, rnd: () => number): number {
  switch (d.tipo) {
    case 'fijo':
      return d.v;
    case 'uniforme':
      return d.min + rnd() * (d.max - d.min);
    case 'triangular': {
      const u = rnd();
      const ancho = d.max - d.min;
      if (ancho <= 0) return d.moda;
      const fc = (d.moda - d.min) / ancho;
      return u < fc ? d.min + Math.sqrt(u * ancho * (d.moda - d.min)) : d.max - Math.sqrt((1 - u) * ancho * (d.max - d.moda));
    }
    case 'normal': {
      const u1 = Math.max(rnd(), 1e-12);
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rnd());
      return Math.min(d.max ?? Infinity, Math.max(d.min ?? -Infinity, d.media + d.desv * z));
    }
  }
}

/** Corre el modelo n veces muestreando las variables que tienen distribución. */
export function monteCarlo<T extends Record<string, number>, R>(
  base: T, dists: Partial<Record<keyof T, Distribucion>>, modelo: (x: T) => R, n: number, semilla = 1,
): R[] {
  const rnd = mulberry32(semilla);
  const claves = Object.keys(dists) as (keyof T)[];
  const out: R[] = [];
  for (let i = 0; i < n; i++) {
    const x = { ...base };
    for (const k of claves) x[k] = muestrear(dists[k]!, rnd) as T[keyof T];
    out.push(modelo(x));
  }
  return out;
}

/** Fracción de corridas en que cada bandera es verdadera. */
export function probabilidades(corridas: Record<string, boolean>[]): Record<string, number> {
  const p: Record<string, number> = {};
  for (const c of corridas) for (const [k, v] of Object.entries(c)) p[k] = (p[k] ?? 0) + (v ? 1 : 0);
  for (const k of Object.keys(p)) p[k] = p[k]! / corridas.length;
  return p;
}

export function percentil(xs: number[], p: number): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const i = (Math.min(100, Math.max(0, p)) / 100) * (s.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return s[lo]! + (s[hi]! - s[lo]!) * (i - lo);
}

export interface BarraTornado {
  variable: string;
  /** resultado con la variable en su mínimo y en su máximo */ bajo: number;
  alto: number;
  base: number;
  amplitud: number;
}

/** Sensibilidad una variable a la vez; devuelve las barras de mayor a menor amplitud. */
export function tornado<T extends Record<string, number>>(
  base: T, rangos: Partial<Record<keyof T, [number, number]>>, f: (x: T) => number,
): BarraTornado[] {
  const y0 = f(base);
  return (Object.keys(rangos) as (keyof T)[])
    .map((k) => {
      const [min, max] = rangos[k]!;
      const bajo = f({ ...base, [k]: min });
      const alto = f({ ...base, [k]: max });
      return { variable: String(k), bajo, alto, base: y0, amplitud: Math.abs(alto - bajo) };
    })
    .sort((a, b) => b.amplitud - a.amplitud);
}
