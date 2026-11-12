import type { Fuente } from '../data/criterios';

/** Resultado trazable de una regla: siempre dice de qué norma y cláusula sale. */
export interface Hallazgo {
  tipo: 'exclusion' | 'aviso' | 'requisito';
  regla: string;
  texto: string;
  norma: string;
  clausula: string;
  verificado: boolean;
}

export function hallazgo(tipo: Hallazgo['tipo'], regla: string, texto: string, f: Fuente, clausula?: string): Hallazgo {
  return { tipo, regla, texto, norma: f.norma, clausula: clausula ?? f.clausula, verificado: f.verificado };
}
