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
/* Diagrama de los ocho equipos                                        */
/* ------------------------------------------------------------------ */
const NODOS: Record<string, [number, number, number, number]> = {
  'E1-REC': [30, 150, 130, 64], 'E1-SEP': [210, 150, 130, 64], 'E2-ABS': [420, 105, 120, 135],
  'E2-HX': [420, 318, 132, 58], 'E2-REG': [640, 286, 132, 94], 'E2-REH': [640, 410, 132, 58],
  'E3-CON': [880, 105, 120, 135], 'E3-REG': [880, 318, 132, 72],
};

type ColorLinea = 'gas' | 'liq' | 'amina' | 'teg' | 'acido' | 'serv';
const LINEAS: [string, ColorLinea, string, [number, number], boolean?][] = [
  ['C01', 'gas', 'M0 182 H30', [0, 170]], ['C01', 'gas', 'M160 182 H210', [168, 172]],
  ['C02', 'gas', 'M340 182 H372 V222 H420', [346, 172]], ['C03', 'liq', 'M290 214 V268', [296, 252]],
  ['C04', 'liq', 'M250 214 V268', [212, 252]], ['C07', 'gas', 'M480 105 V72 H845 V222 H880', [600, 64]],
  ['C05-R', 'amina', 'M470 240 V318', [478, 290]], ['C05-R', 'amina', 'M552 334 H640', [596, 326]],
  ['C05-P', 'amina', 'M700 380 V410', [708, 400]], ['C05-P', 'amina', 'M640 446 H592 V362 H552', [598, 460]],
  ['C05-P', 'amina', 'M490 376 V398 H575 V125 H540', [583, 160]], ['C06', 'acido', 'M700 286 V250', [708, 262]],
  ['C13-W', 'serv', 'M806 304 H772', [778, 320], true], ['MC', 'serv', 'M830 438 H772', [790, 430], true],
  ['C10', 'gas', 'M940 105 V72 H1160', [1010, 64]], ['C08-R', 'teg', 'M930 240 V318', [938, 290]],
  ['C08-P', 'teg', 'M1012 372 H1048 V135 H1000', [1056, 260]], ['C09-V', 'acido', 'M880 336 H826 V292', [834, 352]],
  ['C09-D', 'liq', 'M940 390 V430', [948, 422]],
];
const DESTINOS: [number, number, number, number, string[]][] = [
  [196, 270, 150, 44, ['Agua agria → B3 (C04)', 'Condensado → etapa 5 (C03)']], [646, 208, 128, 40, ['Gas ácido → B3']],
  [1060, 44, 114, 24, ['Gas seco → etapa 4']], [770, 262, 76, 28, ['Vapores → B3']], [892, 432, 98, 28, ['Drenajes → B3']],
];
const LEYENDA: [ColorLinea, string][] = [
  ['gas', 'Gas'], ['liq', 'Líquidos'], ['amina', 'Amina'], ['teg', 'TEG'], ['acido', 'Gas ácido y vapores'], ['serv', 'Servicio de B3 (punteado)'],
];

function partir(nombre: string): string[] {
  const p = nombre.split(' ');
  if (p.length < 2 || nombre.length < 12) return [nombre];
  const m = Math.ceil(p.length / 2);
  return [p.slice(0, m).join(' '), p.slice(m).join(' ')];
}

export function Diagrama({ sel, alElegir }: { sel: string; alElegir: (eq: string) => void }): ReactNode {
  const tecla = (e: KeyboardEvent, id: string): void => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alElegir(id); }
  };
  return (
    <figure className="diagrama">
      <div className="tabla-scroll">
        <svg viewBox="0 36 1180 440" role="group" aria-label="Diagrama de los ocho equipos del alcance y sus corrientes">
          <g className="destino">
            {DESTINOS.map(([x, y, w, h, t]) => (
              <g key={`${x}-${y}`}>
                <rect x={x} y={y} width={w} height={h} rx={4} />
                {t.map((s, i) => <text key={s} x={x + 7} y={y + 17 + i * 17}>{s}</text>)}
              </g>
            ))}
          </g>
          {LINEAS.map(([id, c, d, [lx, ly], punteada], i) => (
            <g key={`${id}-${i}`}>
              <path className="halo" d={d} />
              <path className={`linea c-${c}`} d={d} strokeDasharray={punteada ? '5 4' : undefined} />
              {punteada ? null : <path className="flujo" d={d} />}
              <text className="rotulo" x={lx} y={ly}>{id}</text>
            </g>
          ))}
          {EQUIPOS.map((e) => {
            const [x, y, w, h] = NODOS[e.id]!;
            const lineas = partir(e.corto);
            return (
              <g
                key={e.id} className={`nodo${e.id === sel ? ' sel' : ''}`} tabIndex={0} role="button"
                aria-pressed={e.id === sel} aria-label={`${e.n}. ${e.nombre}`}
                onClick={() => alElegir(e.id)} onKeyDown={(ev) => tecla(ev, e.id)}
              >
                <rect x={x} y={y} width={w} height={h} rx={6} />
                <circle cx={x + 15} cy={y + 15} r={10} />
                <text className="num" x={x + 15} y={y + 19} textAnchor="middle">{e.n}</text>
                {lineas.map((t, i) => (
                  <text key={t} x={x + w / 2 + 8} y={y + h / 2 + 4 + (i - (lineas.length - 1) / 2) * 16} textAnchor="middle">{t}</text>
                ))}
              </g>
            );
          })}
          <text className="nota" x={4} y={232}>desde la válvula de llegada</text>
        </svg>
      </div>
      <figcaption className="leyenda">
        {LEYENDA.map(([c, t]) => <span key={c}><i className={`muestra c-${c}`} />{t}</span>)}
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
