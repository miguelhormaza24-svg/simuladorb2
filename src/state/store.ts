/**
 * Estado de la aplicación. Se guarda en el hash de la URL (para compartir un
 * caso) y en localStorage (para retomarlo). Todo acceso va con try/catch: la
 * aplicación funciona igual si el almacenamiento falla.
 */
import { useCallback, useEffect, useState } from 'react';
import type { EntradaPieza } from '../engine/evaluarPieza';

export const VISTAS = [
  ['inicio', 'Inicio'], ['equipos', 'Equipos'], ['corrientes', 'Corrientes'], ['mecanismos', 'Mecanismos'],
  ['simulador', 'Simulador'], ['sellos', 'Sellos'], ['escenarios', 'Escenarios'], ['criterios', 'Criterios'],
  ['normas', 'Normas'], ['reporte', 'Reporte'],
] as const;
export type Vista = (typeof VISTAS)[number][0];

export interface Estado {
  vista: Vista;
  eq: string;
  pz: string;
  /** cambios del usuario por pieza, con clave «equipo/pieza» */ cambios: Record<string, Partial<EntradaPieza>>;
  /** criterios editados */ criterios: Record<string, number>;
  /** material elegido por pieza en reemplazo del inventario: «equipo/pieza» → id del material */ materiales: Record<string, string>;
  /** piezas agregadas al reporte */ reporte: string[];
  presetsA: string[];
  presetsB: string[];
}

export const ESTADO_INICIAL: Estado = {
  vista: 'inicio', eq: 'E1-SEP', pz: 'virola', cambios: {}, criterios: {}, materiales: {}, reporte: [],
  presetsA: ['ano8', 'p50', 'inh0'], presetsB: ['ano8', 'p50', 'inh99'],
};

const CLAVE = 'simuladorb2:v2';
type Datos = Pick<Estado, 'cambios' | 'criterios' | 'materiales' | 'reporte' | 'presetsA' | 'presetsB'>;

const aTexto = (d: Datos): string => btoa(unescape(encodeURIComponent(JSON.stringify(d)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deTexto = (t: string): Partial<Datos> => JSON.parse(decodeURIComponent(escape(atob(t.replace(/-/g, '+').replace(/_/g, '/'))))) as Partial<Datos>;

export function hashDe(e: Estado): string {
  const d: Datos = { cambios: e.cambios, criterios: e.criterios, materiales: e.materiales, reporte: e.reporte, presetsA: e.presetsA, presetsB: e.presetsB };
  const vacio = !Object.keys(d.cambios).length && !Object.keys(d.criterios).length && !Object.keys(d.materiales).length && !d.reporte.length;
  return `#/${e.vista}/${e.eq}/${e.pz}${vacio ? '' : `?d=${aTexto(d)}`}`;
}

export function leerHash(hash: string, base: Estado): Estado {
  try {
    const [ruta = '', consulta = ''] = hash.replace(/^#\/?/, '').split('?');
    const [vista, eq, pz] = ruta.split('/');
    const e: Estado = { ...base };
    if (VISTAS.some(([v]) => v === vista)) e.vista = vista as Vista;
    if (eq) e.eq = eq;
    if (pz) e.pz = pz;
    const d = new URLSearchParams(consulta).get('d');
    if (d) Object.assign(e, sanear(deTexto(d)));
    return e;
  } catch {
    return base;
  }
}

function sanear(d: Partial<Datos>): Partial<Datos> {
  const o: Partial<Datos> = {};
  if (d.cambios && typeof d.cambios === 'object') o.cambios = d.cambios;
  if (d.criterios && typeof d.criterios === 'object') o.criterios = d.criterios;
  if (d.materiales && typeof d.materiales === 'object') o.materiales = d.materiales;
  if (Array.isArray(d.reporte)) o.reporte = d.reporte.filter((x) => typeof x === 'string');
  if (Array.isArray(d.presetsA)) o.presetsA = d.presetsA;
  if (Array.isArray(d.presetsB)) o.presetsB = d.presetsB;
  return o;
}

function leerLocal(): Partial<Estado> {
  try {
    const t = localStorage.getItem(CLAVE);
    return t ? (JSON.parse(t) as Partial<Estado>) : {};
  } catch {
    return {};
  }
}

function guardar(e: Estado): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(e));
  } catch {
    /* almacenamiento no disponible: se sigue sin persistencia */
  }
  try {
    const h = hashDe(e);
    if (location.hash !== h) history.replaceState(null, '', h);
  } catch {
    /* sin acceso al historial */
  }
}

function inicial(): Estado {
  const local = { ...ESTADO_INICIAL, ...leerLocal() };
  return location.hash.length > 2 ? leerHash(location.hash, local) : local;
}

export function useEstado(): [Estado, (p: Partial<Estado>) => void] {
  const [estado, setEstado] = useState<Estado>(inicial);
  const cambiar = useCallback((p: Partial<Estado>) => setEstado((e) => ({ ...e, ...p })), []);
  useEffect(() => guardar(estado), [estado]);
  useEffect(() => {
    const alCambiar = (): void => setEstado((e) => leerHash(location.hash, e));
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);
  return [estado, cambiar];
}

export const clavePieza = (eq: string, pz: string): string => `${eq}/${pz}`;
