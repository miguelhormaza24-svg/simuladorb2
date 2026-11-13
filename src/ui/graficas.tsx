/**
 * Gráficas en SVG propio. Colores de serie validados con el validador de
 * paletas (modo claro, fondo blanco): azul, naranja, aguamarina, violeta y rojo
 * pasan la separación para daltonismo en pares adyacentes. Como la aguamarina
 * queda bajo 3:1 de contraste, cada línea lleva además su rótulo de corriente.
 */
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { FIGURA1_SSC } from '../data/criterios';
import { EQUIPOS } from '../data/equipos';
import type { BarraTornado } from '../engine/incertidumbre';
import { fmt } from './comunes';

/* ------------------------------------------------------------------ */
/* Globo de datos compartido                                           */
/* ------------------------------------------------------------------ */
interface Globo { x: number; y: number; texto: string }

function useGlobo(): { globo: ReactNode; sobre: (texto: string) => { onMouseMove: (e: React.MouseEvent) => void; onMouseLeave: () => void; onFocus: (e: React.FocusEvent) => void; onBlur: () => void } } {
  const [g, setG] = useState<Globo | null>(null);
  const sobre = (texto: string) => ({
    onMouseMove: (e: React.MouseEvent) => setG({ x: e.clientX, y: e.clientY, texto }),
    onMouseLeave: () => setG(null),
    onFocus: (e: React.FocusEvent) => {
      const r = (e.currentTarget as Element).getBoundingClientRect();
      setG({ x: r.left + r.width / 2, y: r.top, texto });
    },
    onBlur: () => setG(null),
  });
  const globo = g ? <div className="globo" role="status" style={{ left: g.x, top: g.y }}>{g.texto}</div> : null;
  return { globo, sobre };
}

/* ------------------------------------------------------------------ */
/* Diagrama isométrico de los ocho equipos                             */
/* Esquemático y sin escala. Coordenadas de planta (x, y) y altura z;  */
/* x avanza con el proceso y la vista mira desde +x, +y y arriba.      */
/* ------------------------------------------------------------------ */
type P3 = [number, number, number];
type P2 = [number, number];
const K = 26;
const pr = ([x, y, z]: P3): P2 => [(x - y) * 0.866 * K, (x + y) * 0.5 * K - z * K];
const cad = (pts: P2[]): string => pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');

/** Envolvente convexa (cadena monótona) para la silueta de un cilindro. */
function envolvente(pts: P2[]): P2[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cruz = (o: P2, a: P2, b: P2): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const media = (lista: P2[]): P2[] => {
    const h: P2[] = [];
    for (const q of lista) {
      while (h.length >= 2 && cruz(h[h.length - 2]!, h[h.length - 1]!, q) <= 0) h.pop();
      h.push(q);
    }
    h.pop();
    return h;
  };
  return [...media(p), ...media([...p].reverse())];
}

interface Cilindro { eje: 'x' | 'z'; a: P3; largo: number; r: number; nombre: P3; ancla?: 'start' | 'middle' | 'end' }

function circulo(c: P3, r: number, eje: 'x' | 'z'): P2[] {
  return Array.from({ length: 32 }, (_, i) => {
    const t = (i / 32) * 2 * Math.PI;
    const [u, v] = [r * Math.cos(t), r * Math.sin(t)];
    return pr(eje === 'x' ? [c[0], c[1] + u, c[2] + v] : [c[0] + u, c[1] + v, c[2]]);
  });
}

const extremo = (c: Cilindro): P3 => (c.eje === 'x' ? [c.a[0] + c.largo, c.a[1], c.a[2]] : [c.a[0], c.a[1], c.a[2] + c.largo]);

const ISO: Record<string, Cilindro> = {
  'E1-REC': { eje: 'x', a: [0, 0, 1.4], largo: 3, r: 0.8, nombre: [1.5, 0, 2.9] },
  'E1-SEP': { eje: 'x', a: [5, 0, 1.4], largo: 4, r: 1, nombre: [7, 0, 3.1] },
  'E2-ABS': { eje: 'z', a: [12.5, 0, 0], largo: 7, r: 0.9, nombre: [11, 0, 6.6], ancla: 'end' },
  'E2-HX': { eje: 'x', a: [14, 4.5, 1], largo: 2.5, r: 0.6, nombre: [14.4, 6.9, 0], ancla: 'end' },
  'E2-REG': { eje: 'z', a: [20, 4.5, 0], largo: 6, r: 0.8, nombre: [21.2, 4.5, 3.2], ancla: 'start' },
  'E2-REH': { eje: 'x', a: [19, 8, 1], largo: 2.5, r: 0.65, nombre: [20.2, 9.3, -0.4] },
  'E3-CON': { eje: 'z', a: [25, 0, 0], largo: 6.5, r: 0.85, nombre: [26.2, 0, 2.2], ancla: 'start' },
  'E3-REG': { eje: 'z', a: [31.5, 4.5, 0], largo: 4, r: 0.6, nombre: [32.4, 4.5, 1.8], ancla: 'start' },
};

type ColorLinea = 'gas' | 'liq' | 'amina' | 'teg' | 'acido' | 'serv';
interface Tubo { id: string; c: ColorLinea; pts: P3[]; rot?: P3; ancla?: 'start' | 'middle' | 'end'; punteada?: boolean; destino?: string }

const TUBOS: Tubo[] = [
  { id: 'C01', c: 'gas', pts: [[-3.2, 0, 1.4], [0, 0, 1.4]], rot: [-2.4, 0, 2.2] },
  { id: 'C01', c: 'gas', pts: [[3, 0, 1.4], [5, 0, 1.4]] },
  { id: 'C02', c: 'gas', pts: [[9, 0, 1.4], [11.6, 0, 1.4]], rot: [10.4, 0, 2.2] },
  { id: 'C04', c: 'liq', pts: [[5.8, 0.9, 0.5], [5.8, 3.6, 0.5]], rot: [5.8, 4.2, 0.5], ancla: 'end', destino: 'agua agria → B3' },
  { id: 'C03', c: 'liq', pts: [[8, 0.9, 0.5], [8, 3.6, 0.5]], rot: [8, 4.2, 0.5], ancla: 'end', destino: 'condensado → etapa 5' },
  { id: 'C07', c: 'gas', pts: [[12.5, 0, 7], [12.5, 0, 8], [23, 0, 8], [23, 0, 1.5], [24.15, 0, 1.5]], rot: [17.5, 0, 8.7] },
  { id: 'C05-R', c: 'amina', pts: [[12.5, 0.9, 1], [12.5, 4.5, 1], [14, 4.5, 1]], rot: [12.2, 3, 1.2], ancla: 'end' },
  { id: 'C05-R', c: 'amina', pts: [[16.5, 4.5, 1], [18, 4.5, 1], [18, 4.5, 4.5], [19.2, 4.5, 4.5]], rot: [17.7, 4.5, 3.2], ancla: 'end' },
  { id: 'C05-P', c: 'amina', pts: [[20, 5.3, 0.8], [20, 7.35, 0.8]] },
  { id: 'C05-P', c: 'amina', pts: [[19.2, 4.5, 0.3], [17.2, 4.5, 0.3], [17.2, 6, 0.3], [15.2, 6, 0.3], [15.2, 5.1, 0.3]], rot: [16.4, 6.7, 0.3], ancla: 'start' },
  { id: 'C05-P', c: 'amina', pts: [[14.8, 4.5, 1.6], [14.8, 4.5, 2.6], [14.8, 0, 2.6], [14.8, 0, 5.8], [13.4, 0, 5.8]], rot: [15.2, 0, 4.6], ancla: 'start' },
  { id: 'C06', c: 'acido', pts: [[20, 4.5, 6], [20, 4.5, 7], [20, 2, 7]], rot: [20, 1.7, 7.2], ancla: 'start', destino: 'gas ácido → B3' },
  { id: 'C13-W', c: 'serv', pts: [[22.4, 4.5, 5.2], [20.8, 4.5, 5.2]], rot: [22.7, 4.5, 5.2], ancla: 'start', punteada: true },
  { id: 'MC', c: 'serv', pts: [[23, 8, 1], [21.5, 8, 1]], rot: [23.3, 8, 1], ancla: 'start', punteada: true, destino: 'calentamiento' },
  { id: 'C10', c: 'gas', pts: [[25, 0, 6.5], [25, 0, 7.4], [29.5, 0, 7.4]], rot: [29.8, 0, 7.4], ancla: 'start', destino: 'gas seco → etapa 4' },
  { id: 'C08-R', c: 'teg', pts: [[25, 0.85, 0.6], [25, 4.5, 0.6], [30.9, 4.5, 0.6]], rot: [28.8, 4.5, 1.5] },
  { id: 'C08-P', c: 'teg', pts: [[31.5, 3.9, 3], [31.5, 0, 3], [31.5, 0, 5.5], [25.85, 0, 5.5]], rot: [31.9, 0, 4.5], ancla: 'start' },
  { id: 'C09-V', c: 'acido', pts: [[31.5, 4.5, 4], [31.5, 4.5, 5], [33.5, 4.5, 5]], rot: [33.8, 4.5, 5], ancla: 'start', destino: 'vapores → B3' },
  { id: 'C09-D', c: 'liq', pts: [[31.5, 5.1, 0.3], [31.5, 7, 0.3]], rot: [31.5, 7.6, 0.3], ancla: 'end', destino: 'drenajes → B3' },
];

const LEYENDA: [ColorLinea, string][] = [
  ['gas', 'Gas'], ['liq', 'Líquidos'], ['amina', 'Amina'], ['teg', 'TEG'], ['acido', 'Gas ácido y vapores'], ['serv', 'Servicio de B3 (punteado)'],
];
const [SX0, SX1, SY0, SY1] = [-4, 37, -2.5, 10.5];
const SUELO: P3[] = [[SX0, SY0, 0], [SX1, SY0, 0], [SX1, SY1, 0], [SX0, SY1, 0]];

interface Capa { prof: number; nodo: ReactNode }

export function Diagrama({ sel, alElegir }: { sel: string; alElegir: (eq: string) => void }): ReactNode {
  const tecla = (e: KeyboardEvent, id: string): void => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alElegir(id); }
  };
  const capas: Capa[] = [];
  // Tuberías: cada tramo se ordena por profundidad (x + y) para que pase por detrás o por delante de los equipos.
  TUBOS.forEach((t, i) => {
    for (let j = 1; j < t.pts.length; j++) {
      const [a, b] = [t.pts[j - 1]!, t.pts[j]!];
      const d = `M${cad([pr(a)])} L${cad([pr(b)])}`;
      capas.push({
        prof: (a[0] + a[1] + b[0] + b[1]) / 2 + 0.02 * ((a[2] + b[2]) / 2),
        nodo: (
          <g key={`t${i}-${j}`}>
            <path className="halo" d={d} />
            <path className={`linea c-${t.c}`} d={d} strokeDasharray={t.punteada ? '5 4' : undefined} />
            {t.punteada ? null : <path className="flujo" d={d} />}
          </g>
        ),
      });
    }
  });
  EQUIPOS.forEach((e) => {
    const c = ISO[e.id]!;
    const fin = extremo(c);
    const cuerpo = envolvente([...circulo(c.a, c.r, c.eje), ...circulo(fin, c.r, c.eje)]);
    const [nx, ny] = pr(c.nombre);
    const [bx, by] = pr(c.eje === 'x' ? [c.a[0] + c.largo * 0.45, c.a[1], c.a[2]] : [c.a[0], c.a[1], c.a[2] + c.largo * 0.5]);
    const patas = c.eje === 'x' ? [0.22, 0.78].map((f): [P2, P2] => [pr([c.a[0] + c.largo * f, c.a[1], c.a[2] - c.r * 0.9]), pr([c.a[0] + c.largo * f, c.a[1], 0])]) : [];
    capas.push({
      prof: c.eje === 'x' ? c.a[0] + c.largo / 2 + c.a[1] : c.a[0] + c.a[1],
      nodo: (
        <g
          key={e.id} className={`nodo${e.id === sel ? ' sel' : ''}`} tabIndex={0} role="button"
          aria-pressed={e.id === sel} aria-label={`${e.n}. ${e.nombre}`}
          onClick={() => alElegir(e.id)} onKeyDown={(ev) => tecla(ev, e.id)}
        >
          {patas.map(([p, q], k) => <line key={k} className="pata" x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} />)}
          <polygon className="cuerpo" points={cad(cuerpo)} />
          <polygon className="tapa" points={cad(circulo(fin, c.r, c.eje))} />
          <circle className="sello" cx={bx} cy={by} r={10} />
          <text className="num" x={bx} y={by + 4} textAnchor="middle">{e.n}</text>
          <text className="nombre" x={nx} y={ny} textAnchor={c.ancla ?? 'middle'}>{e.corto}</text>
        </g>
      ),
    });
  });
  capas.sort((a, b) => a.prof - b.prof);

  const malla: ReactNode[] = [];
  for (let x = SX0; x <= SX1; x += 2) { const [p, q] = [pr([x, SY0, 0]), pr([x, SY1, 0])]; malla.push(<line key={`x${x}`} className="malla" x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} />); }
  for (let y = SY0; y <= SY1; y += 2) { const [p, q] = [pr([SX0, y, 0]), pr([SX1, y, 0])]; malla.push(<line key={`y${y}`} className="malla" x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} />); }

  return (
    <figure className="diagrama">
      <div className="tabla-scroll">
        <svg viewBox="-340 -110 1250 745" role="group" aria-label="Vista isométrica de los ocho equipos del alcance y sus corrientes">
          <polygon className="suelo" points={cad(SUELO.map(pr))} />
          {malla}
          {capas.map((c) => c.nodo)}
          {TUBOS.map((t, i) => {
            if (!t.rot) return null;
            const [x, y] = pr(t.rot);
            return (
              <text key={`r${i}`} className="rotulo" x={x} y={y + 4} textAnchor={t.ancla ?? 'middle'}>
                {t.id}{t.destino ? <tspan className="destino"> · {t.destino}</tspan> : null}
              </text>
            );
          })}
        </svg>
      </div>
      <figcaption>
        <span className="leyenda">{LEYENDA.map(([c, t]) => <span key={c}><i className={`muestra c-${c}`} />{t}</span>)}</span>
        <span className="menor bloque">Vista isométrica esquemática, sin escala. La posición de los equipos no representa la distribución real de la planta.</span>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* ISO 15156-2, Figura 1                                               */
/* ------------------------------------------------------------------ */
export interface PuntoSSC { id: string; etiqueta: string; pH2S_kPa: number; pH: number; sel?: boolean }

const AN = 560;
const AL = 360;
const M = { izq: 46, der: 28, sup: 14, inf: 42 };
const [X0, X1] = [0.01, 1000];
const [Y0, Y1] = FIGURA1_SSC.ejes.pH;
const sx = (p: number): number => M.izq + ((Math.log10(Math.min(X1, Math.max(X0, p))) - Math.log10(X0)) / (Math.log10(X1) - Math.log10(X0))) * (AN - M.izq - M.der);
const sy = (ph: number): number => M.sup + ((Y1 - Math.min(Y1, Math.max(Y0, ph))) / (Y1 - Y0)) * (AL - M.sup - M.inf);
const poli = (pts: [number, number][]): string => pts.map(([p, ph]) => `${sx(p).toFixed(1)},${sy(ph).toFixed(1)}`).join(' ');

export function FiguraSSC({ puntos }: { puntos: PuntoSSC[] }): ReactNode {
  const { globo, sobre } = useGlobo();
  const sup = FIGURA1_SSC.fronteraSuperior;
  const inf = FIGURA1_SSC.fronteraInferior;
  const reg3: [number, number][] = [[0.3, Y0], ...inf, [X1, Y0]];
  const reg2: [number, number][] = [...inf, ...[...sup].reverse()];
  const reg1: [number, number][] = [...sup, [X1, Y1], [0.3, Y1]];
  const decadas = [0.01, 0.1, 1, 10, 100, 1000];
  const phs = [2.5, 3.5, 4.5, 5.5, 6.5];
  return (
    <figure className="grafica">
      <svg viewBox={`0 0 ${AN} ${AL}`} role="img" aria-label="Regiones de severidad SSC de ISO 15156-2, Figura 1, con el punto de cada pieza">
        <rect className="reg r0" x={sx(X0)} y={sy(Y1)} width={sx(0.3) - sx(X0)} height={sy(Y0) - sy(Y1)} />
        <polygon className="reg r1" points={poli(reg1)} />
        <polygon className="reg r2" points={poli(reg2)} />
        <polygon className="reg r3" points={poli(reg3)} />
        {decadas.map((d) => <line key={d} className="rejilla" x1={sx(d)} x2={sx(d)} y1={sy(Y1)} y2={sy(Y0)} />)}
        {phs.map((p) => <line key={p} className="rejilla" x1={sx(X0)} x2={sx(X1)} y1={sy(p)} y2={sy(p)} />)}
        <polyline className="frontera" points={poli(sup)} />
        <polyline className="frontera" points={poli(inf)} />
        <polyline className="frontera punteada" points={poli(FIGURA1_SSC.punteada)} />
        <line className="frontera" x1={sx(0.3)} x2={sx(0.3)} y1={sy(Y1)} y2={sy(Y0)} />
        <text className="eje" x={sx(0.3) + 4} y={sy(Y1) + 12}>0,3 kPa</text>
        <text className="region" x={sx(0.04)} y={sy(5)}>Región 0</text>
        <text className="region" x={sx(1.6)} y={sy(6.05)}>Región 1</text>
        <text className="region" x={sx(320)} y={sy(6) + 4} textAnchor="middle">Región 2</text>
        <text className="region" x={sx(320)} y={sy(3.2)} textAnchor="middle">Región 3</text>
        {decadas.map((d) => <text key={d} className="eje" x={sx(d)} y={AL - M.inf + 16} textAnchor="middle">{fmt(d, 2)}</text>)}
        {phs.map((p) => <text key={p} className="eje" x={M.izq - 6} y={sy(p) + 4} textAnchor="end">{fmt(p, 1)}</text>)}
        <text className="eje titulo-eje" x={(M.izq + AN - M.der) / 2} y={AL - 6} textAnchor="middle">Presión parcial de H₂S, kPa</text>
        <text className="eje titulo-eje" transform={`translate(12 ${(M.sup + AL - M.inf) / 2}) rotate(-90)`} textAnchor="middle">pH in situ</text>
        {puntos.map((p) => {
          const fuera = p.pH > Y1 || p.pH < Y0 || p.pH2S_kPa < X0 || p.pH2S_kPa > X1;
          const texto = `${p.etiqueta}: pH₂S ${fmt(p.pH2S_kPa, 3)} kPa, pH ${fmt(p.pH, 2)}${fuera ? ' (fuera de la escala de la figura)' : ''}`;
          return (
            <g key={p.id} className={`punto${p.sel ? ' sel' : ''}`} tabIndex={0} role="img" aria-label={texto} {...sobre(texto)}>
              <circle className="zona" cx={sx(p.pH2S_kPa)} cy={sy(p.pH)} r={12} />
              {fuera
                ? <path className="marca" d={`M${sx(p.pH2S_kPa) - 6} ${sy(p.pH) + 5} L${sx(p.pH2S_kPa) + 6} ${sy(p.pH) + 5} L${sx(p.pH2S_kPa)} ${sy(p.pH) - 6} Z`} />
                : <circle className="marca" cx={sx(p.pH2S_kPa)} cy={sy(p.pH)} r={p.sel ? 6 : 4.5} />}
              {p.sel ? <text className="eje fuerte" x={sx(p.pH2S_kPa) + 10} y={sy(p.pH) - 8}>{p.etiqueta}</text> : null}
            </g>
          );
        })}
      </svg>
      <figcaption>ISO 15156-2:2015, Figura 1 (pág. 9). El triángulo marca un punto fuera de la escala de la figura.</figcaption>
      {globo}
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Barras horizontales de una sola serie                               */
/* ------------------------------------------------------------------ */
export interface DatoBarra { etiqueta: string; valor: number; nota?: string }

export function Barras({ datos, unidad, max, decimales = 2, titulo }: { datos: DatoBarra[]; unidad: string; max?: number; decimales?: number; titulo: string }): ReactNode {
  const { globo, sobre } = useGlobo();
  const tope = max ?? Math.max(...datos.map((d) => d.valor), 1e-9);
  return (
    <div className="barras" role="list" aria-label={titulo}>
      {datos.map((d) => {
        const texto = `${d.etiqueta}: ${fmt(d.valor, decimales)} ${unidad}${d.nota ? `. ${d.nota}` : ''}`;
        return (
          <div key={d.etiqueta} className="barra-fila" role="listitem" tabIndex={0} aria-label={texto} {...sobre(texto)}>
            <span className="barra-nombre">{d.etiqueta}</span>
            <span className="barra-pista">
              <span className="barra" style={{ width: `${Math.max(0, Math.min(100, (d.valor / tope) * 100))}%` }} />
            </span>
            <span className="barra-valor">{fmt(d.valor, decimales)} {unidad}</span>
          </div>
        );
      })}
      {globo}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tornado                                                             */
/* ------------------------------------------------------------------ */
export function Tornado({ barras, unidad, nombres, titulo }: { barras: BarraTornado[]; unidad: string; nombres: Record<string, string>; titulo: string }): ReactNode {
  const { globo, sobre } = useGlobo();
  const vals = barras.flatMap((b) => [b.bajo, b.alto, b.base]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const an = 560;
  const [x0, x1] = [190, an - 62];
  const esc = (v: number): number => (max === min ? (x0 + x1) / 2 : x0 + ((v - min) / (max - min)) * (x1 - x0));
  const fila = 30;
  const alto = barras.length * fila + 34;
  const base = barras[0]?.base ?? 0;
  return (
    <figure className="grafica">
      <svg viewBox={`0 0 ${an} ${alto}`} role="img" aria-label={titulo}>
        <line className="rejilla" x1={esc(base)} x2={esc(base)} y1={4} y2={alto - 26} />
        {barras.map((b, i) => {
          const y = 8 + i * fila;
          const nombre = nombres[b.variable] ?? b.variable;
          const texto = `${nombre}: ${fmt(b.bajo, 2)} ${unidad} con el valor mínimo y ${fmt(b.alto, 2)} ${unidad} con el máximo`;
          const seg = (v: number, clase: string): ReactNode => (
            <rect className={clase} x={Math.min(esc(base), esc(v))} y={y} width={Math.max(0, Math.abs(esc(v) - esc(base)) - 1)} height={16} rx={3} />
          );
          return (
            <g key={b.variable} tabIndex={0} role="img" aria-label={texto} {...sobre(texto)}>
              <text className="eje" x={x0 - 12} y={y + 12} textAnchor="end">{nombre}</text>
              {seg(b.bajo, 't-bajo')}{seg(b.alto, 't-alto')}
              <text className="eje" x={Math.max(esc(b.bajo), esc(b.alto)) + 6} y={y + 12}>{fmt(Math.max(b.bajo, b.alto), 1)}</text>
            </g>
          );
        })}
        <text className="eje" x={esc(base)} y={alto - 10} textAnchor="middle">Base: {fmt(base, 2)} {unidad}</text>
      </svg>
      <figcaption className="leyenda">
        <span><i className="muestra t-bajo" />Variable en su mínimo</span>
        <span><i className="muestra t-alto" />Variable en su máximo</span>
      </figcaption>
      {globo}
    </figure>
  );
}
