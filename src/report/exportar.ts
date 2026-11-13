/**
 * Fichas de selección por pieza y su exportación a CSV y JSON.
 * El PDF se obtiene con la hoja de impresión del navegador.
 */
import { CORRIENTES } from '../data/corrientes';
import { PENDIENTES_NORMAS } from '../data/pendientes';
import type { Origen } from '../data/tipos';
import type { ResultadoPieza } from '../engine/evaluarPieza';
import type { Estado } from '../state/store';
import { AVISO_ACADEMICO } from '../ui/comunes';
import { materialPorId } from '../data/materiales';
import { materialVigente, origenCampo, resultadoDe, seleccion } from '../ui/contexto';

export interface DatoFicha { campo: string; valor: number | string; unidad: string; origen: Origen }

export interface Ficha {
  clave: string;
  equipo: string;
  pieza: string;
  corriente: string;
  materialInventario: string;
  /** material vigente: el elegido por el usuario o el del inventario */ materialSeleccionado: string;
  reemplazado: boolean;
  seleccionadoViable: boolean | null;
  entradas: DatoFicha[];
  resultado: ResultadoPieza;
}

export function fichaDe(estado: Estado, clave: string): Ficha {
  const [eq = '', pz = ''] = clave.split('/');
  const s = seleccion(eq, pz);
  const r = resultadoDe(estado, s.equipo.id, s.pieza.id);
  const e = r.entrada;
  const v = materialVigente(estado, s);
  const d = (campo: string, k: keyof typeof e, unidad: string): DatoFicha => ({ campo, valor: e[k] as number | string, unidad, origen: origenCampo(estado, s, k) });
  return {
    clave: `${s.equipo.id}/${s.pieza.id}`, equipo: s.equipo.nombre, pieza: s.pieza.nombre, corriente: `${s.pieza.corriente} · ${CORRIENTES[s.pieza.corriente]!.nombre}`,
    materialInventario: s.pieza.invTxt,
    materialSeleccionado: materialPorId(v.id ?? '')?.nombre ?? s.pieza.invTxt, reemplazado: v.reemplazado,
    seleccionadoViable: r.materiales.find((m) => m.id === v.id)?.viable ?? null,
    entradas: [
      d('Presión', 'P', 'bar abs'), d('Temperatura de operación', 'T', '°C'), d('Temperatura máxima', 'Tmax', '°C'),
      d('H₂S en el gas', 'H2S', '% mol'), d('CO₂ en el gas', 'CO2', '% mol'), d('Agua libre', 'agua', ''), d('pH', 'pH', ''),
      d('Cloruros', 'Cl', 'mg/L'), d('Agua en la fase acuosa', 'wAgua', '%'), d('Disponibilidad del inhibidor', 'inhibidor', '%'), d('Vida de diseño', 'vida', 'años'),
    ],
    resultado: r,
  };
}

const num = (x: number, d = 3): string => (Number.isFinite(x) ? x.toLocaleString('es-CO', { maximumFractionDigits: d, useGrouping: false }) : '');
const celda = (x: string | number): string => `"${String(x).replace(/"/g, '""')}"`;

/** CSV con punto y coma y coma decimal: una fila por material de cada pieza. */
export function aCSV(fichas: Ficha[]): string {
  const cab = ['Equipo', 'Pieza', 'Corriente', 'Material seleccionado', 'Reemplaza al inventario', 'pH2S (kPa)', 'pCO2 (bar)', 'Región SSC', 'Velocidad sin inhibir (mm/a)', 'Sobreespesor requerido (mm)',
    'Material', 'Estado', 'Posición', 'Cercanía TOPSIS', 'Exclusiones', 'Normas y cláusulas', 'Fuentes sin verificar'];
  const filas = fichas.flatMap((f) => {
    const r = f.resultado;
    return r.materiales.filter((m) => m.enLista).map((m) => {
      const ex = m.hallazgos.filter((h) => h.tipo === 'exclusion');
      const pos = r.ranking.findIndex((x) => x.id === m.id);
      return [f.equipo, f.pieza, f.corriente, f.materialSeleccionado, f.reemplazado ? 'Sí' : 'No', num(r.pp.pH2S.kPa), num(r.pp.pCO2.bar), r.ssc.region, num(r.corrosion.crBase), num(r.corrosion.caRequerido, 2),
        m.nombre, m.viable ? 'Viable' : 'Excluido', pos >= 0 ? pos + 1 : '', m.cercania != null ? num(m.cercania) : '',
        ex.map((h) => h.texto).join(' | '), m.hallazgos.map((h) => `${h.norma}, ${h.clausula}`).filter((x, i, a) => a.indexOf(x) === i).join(' | '),
        m.hallazgos.some((h) => !h.verificado) ? 'Sí' : 'No'];
    });
  });
  return `﻿${[`# ${AVISO_ACADEMICO}`, cab.map(celda).join(';'), ...filas.map((f) => f.map(celda).join(';'))].join('\r\n')}`;
}

export function aJSON(fichas: Ficha[], generado: string): string {
  return JSON.stringify({ herramienta: 'Simulador B2 · Selección de materiales (UIS)', aviso: AVISO_ACADEMICO, generado, normasPendientes: PENDIENTES_NORMAS, fichas }, null, 2);
}

export function descargar(nombre: string, contenido: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: `${mime};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
