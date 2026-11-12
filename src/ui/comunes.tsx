import type { ReactNode } from 'react';
import { ORIGEN_TXT, type Origen } from '../data/tipos';

/** Número en formato de Colombia (coma decimal). */
export function fmt(x: number | null | undefined, d = 1): string {
  if (x == null || Number.isNaN(x)) return '—';
  if (!Number.isFinite(x)) return x > 0 ? '∞' : '−∞';
  return x.toLocaleString('es-CO', { maximumFractionDigits: d, minimumFractionDigits: 0 });
}

export function EtiquetaOrigen({ o }: { o: Origen }): ReactNode {
  return <abbr className={`origen origen-${o}`} title={ORIGEN_TXT[o]}>{o}</abbr>;
}

export type Tono = 'ok' | 'aviso' | 'mal' | 'neutro';

/** Estado con símbolo y texto: nunca solo color. */
export function Chip({ tono, children, titulo }: { tono: Tono; children: ReactNode; titulo?: string }): ReactNode {
  const simbolo = { ok: '✓', aviso: '!', mal: '✕', neutro: '·' }[tono];
  return <span className={`chip chip-${tono}`} title={titulo}><span aria-hidden="true">{simbolo}</span> {children}</span>;
}

export function Verificado({ v }: { v: boolean }): ReactNode {
  return v
    ? <Chip tono="ok" titulo="Leído en un PDF adjunto al proyecto">Verificado</Chip>
    : <Chip tono="aviso" titulo="La norma no está adjunta o el PDF no llega a esa cláusula">Por verificar</Chip>;
}

export function Fuente({ norma, clausula, pagina, verificado }: { norma: string; clausula: string; pagina?: number | null; verificado: boolean }): ReactNode {
  return (
    <span className="fuente">
      {norma}, {clausula}{pagina != null ? `, pág. ${pagina}` : ''} <Verificado v={verificado} />
    </span>
  );
}

export function Hoja({ titulo, nivel = 2, children, clase = '' }: { titulo?: ReactNode; nivel?: 1 | 2 | 3; children: ReactNode; clase?: string }): ReactNode {
  const H = `h${nivel}` as 'h1' | 'h2' | 'h3';
  return <section className={`hoja ${clase}`}>{titulo ? <H>{titulo}</H> : null}{children}</section>;
}

export function Tabla({ children, titulo }: { children: ReactNode; titulo: string }): ReactNode {
  return <div className="tabla-scroll" role="region" aria-label={titulo} tabIndex={0}><table>{children}</table></div>;
}

interface CampoNumProps {
  id: string;
  etiqueta: string;
  unidad?: string;
  valor: number;
  origen: Origen;
  min?: number;
  max?: number;
  paso?: number;
  alCambiar: (v: number) => void;
}

export function CampoNum(p: CampoNumProps): ReactNode {
  return (
    <div className="campo">
      <label htmlFor={p.id}>{p.etiqueta} <EtiquetaOrigen o={p.origen} /></label>
      <div className="campo-fila">
        <input
          id={p.id} type="number" inputMode="decimal" value={Number.isFinite(p.valor) ? p.valor : ''}
          min={p.min} max={p.max} step={p.paso ?? 'any'}
          onChange={(e) => { const v = e.currentTarget.valueAsNumber; if (Number.isFinite(v)) p.alCambiar(v); }}
        />
        {p.unidad ? <span className="unidad">{p.unidad}</span> : null}
      </div>
    </div>
  );
}

export function CampoSel<T extends string>(p: {
  id: string; etiqueta: string; valor: T; opciones: [T, string][]; origen?: Origen; alCambiar: (v: T) => void;
}): ReactNode {
  return (
    <div className="campo">
      <label htmlFor={p.id}>{p.etiqueta} {p.origen ? <EtiquetaOrigen o={p.origen} /> : null}</label>
      <select id={p.id} value={p.valor} onChange={(e) => p.alCambiar(e.currentTarget.value as T)}>
        {p.opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </div>
  );
}

export function CampoSi(p: { id: string; etiqueta: string; valor: boolean; alCambiar: (v: boolean) => void }): ReactNode {
  return (
    <label className="campo-si" htmlFor={p.id}>
      <input id={p.id} type="checkbox" checked={p.valor} onChange={(e) => p.alCambiar(e.currentTarget.checked)} /> {p.etiqueta}
    </label>
  );
}

export const AVISO_ACADEMICO = 'Herramienta académica. No declara cumplimiento de ISO 15156 ni reemplaza cálculos certificados.';
