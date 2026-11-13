import type { ReactNode } from 'react';
import {
  CRITERIOS, LIMITES_15156_3, NORMAS, TABLA10_AGUA_MAR, TABLA3_ATMOSFERA_MARINA, type Criterio,
} from '../data/criterios';
import { CORRIENTES } from '../data/corrientes';
import { EQUIPOS } from '../data/equipos';
import { ESCENARIO } from '../data/escenario';
import { MATERIALES } from '../data/materiales';
import { MECANISMOS } from '../data/mecanismos';
import { PENDIENTES_NORMAS, PENDIENTES_PROCESO } from '../data/pendientes';
import { ORIGEN_TXT, type Corriente, type Origen } from '../data/tipos';
import { prenMaterial } from '../engine/cra';
import type { EstadoMecanismo } from '../engine/evaluarPieza';
import { presionesParciales } from '../engine/presiones';
import { severidadSSC } from '../engine/ssc';
import type { Estado } from '../state/store';
import { AVISO_ACADEMICO, Chip, EtiquetaOrigen, Fuente, fmt, Hoja, Tabla, Verificado, type Tono } from './comunes';
import { materialPorId } from '../data/materiales';
import { criteriosDe, materialVigente, reemplazarExcluidos, resultadoDe, seleccion, TODAS_LAS_PIEZAS } from './contexto';
import { Diagrama, FiguraSSC } from './graficas';

export interface PropsVista { estado: Estado; cambiar: (p: Partial<Estado>) => void }

const Dato = ({ v, o, d = 1, u = '' }: { v: number; o: Origen; d?: number; u?: string }): ReactNode => (
  <span className="dato">{fmt(v, d)}{u ? ` ${u}` : ''} <EtiquetaOrigen o={o} /></span>
);

/* ------------------------------ Inicio ------------------------------ */
export function Inicio({ estado, cambiar }: PropsVista): ReactNode {
  const { equipo } = seleccion(estado.eq, estado.pz);
  return (
    <>
      <Hoja titulo="Selección de materiales para la planta de gas B2" nivel={1}>
        <p className="entrada">Ocho equipos de la planta de proceso en tierra del Proyecto B, La Guajira: recepción, endulzamiento con aminas y deshidratación con TEG. Elija un equipo en el diagrama para ver sus piezas y simularlas.</p>
        <p className="aviso-academico" role="note">{AVISO_ACADEMICO}</p>
      </Hoja>
      <Hoja titulo="Equipos y corrientes del alcance">
        <Diagrama sel={equipo.id} alElegir={(eq) => cambiar({ eq, pz: seleccion(eq, '').pieza.id })} />
        <div className="ficha-equipo" aria-live="polite">
          <h3>{equipo.n}. {equipo.nombre}</h3>
          <p>{equipo.funcion}</p>
          <p className="menor">Entra: {equipo.entradas.join(', ')}. Sale: {equipo.salidas.join(', ')}.</p>
          <ul className="lista-piezas">
            {equipo.piezas.map((p) => (
              <li key={p.id}>
                <button type="button" className="enlace" onClick={() => cambiar({ vista: p.forma === 'sello' ? 'sellos' : 'simulador', eq: equipo.id, pz: p.id })}>{p.nombre}</button>
                <span className="menor"> · {p.corriente} · {p.invTxt}</span>
              </li>
            ))}
          </ul>
        </div>
      </Hoja>
      <div className="rejilla2">
        <Hoja titulo="Base de diseño del escenario B">
          <Tabla titulo="Base de diseño del escenario B"><tbody>{ESCENARIO.map(([a, b]) => <tr key={a}><th scope="row">{a}</th><td>{b}</td></tr>)}</tbody></Tabla>
        </Hoja>
        <Hoja titulo="Cómo leer los datos">
          <p>Cada dato de entrada lleva la letra de su origen:</p>
          <ul className="simple">
            {(Object.keys(ORIGEN_TXT) as Origen[]).map((o) => <li key={o}><EtiquetaOrigen o={o} /> {ORIGEN_TXT[o]}</li>)}
          </ul>
          <p>Cada criterio dice de qué norma sale y si se pudo leer en el PDF adjunto: <Verificado v /> <Verificado v={false} /></p>
          <p>Los 320 bar son la presión del cabezal de B1, no la de B2. Los valores de B1 no se trasladan a corrientes ya tratadas sin justificarlo.</p>
        </Hoja>
      </div>
      <Hoja titulo="Datos de proceso pendientes">
        <ul className="simple">{PENDIENTES_PROCESO.map((p) => <li key={p}>{p}</li>)}</ul>
      </Hoja>
    </>
  );
}

/* ------------------------------ Equipos ----------------------------- */
export function Equipos({ estado, cambiar }: PropsVista): ReactNode {
  const pendientes = reemplazarExcluidos(estado);
  const reemplazados = Object.keys(estado.materiales).length;
  return (
    <>
      <Hoja titulo="Equipos del alcance" nivel={1}>
        <p className="entrada">Inventario del informe B2 (Tablas 8 a 12). Los materiales son candidatos de partida, no aprobados. La columna «Material seleccionado» dice si cumple con los datos actuales.</p>
        <p className="botones">
          <button type="button" className="boton primario" disabled={!pendientes.n} onClick={() => cambiar({ materiales: pendientes.materiales })}>Reemplazar por el recomendado las {pendientes.n} piezas que no cumplen</button>
          <button type="button" className="boton" disabled={!reemplazados} onClick={() => cambiar({ materiales: {} })}>Volver todas al material del inventario</button>
        </p>
        <p className="menor">{reemplazados} pieza{reemplazados === 1 ? '' : 's'} con material reemplazado. El reemplazo es una selección de trabajo dentro del simulador: no modifica el inventario del informe.</p>
      </Hoja>
      {EQUIPOS.map((e) => (
        <Hoja key={e.id} titulo={`${e.n}. ${e.nombre}`}>
          <p>{e.funcion}</p>
          <p className="menor">Etapa {e.etapa}. Entra: {e.entradas.join(', ')}. Sale: {e.salidas.join(', ')}. Ø {fmt(e.dim.D)} m × {fmt(e.dim.L)} m; espesor {fmt(e.dim.e)} mm <EtiquetaOrigen o="I" /></p>
          <Tabla titulo={`Piezas de ${e.nombre}`}>
            <thead><tr><th>Pieza</th><th>Corriente</th><th>Material del inventario</th><th>Material seleccionado</th><th>Dimensiones</th><th>Norma de consulta</th><th /></tr></thead>
            <tbody>
              {e.piezas.map((p) => {
                const s = { equipo: e, pieza: p };
                const v = materialVigente(estado, s);
                const m = p.forma === 'sello' ? undefined : resultadoDe(estado, e.id, p.id).materiales.find((x) => x.id === v.id);
                return (
                <tr key={p.id}>
                  <th scope="row">{p.nombre}</th><td>{p.corriente}{p.servicio ? ` / ${p.servicio}` : ''}</td><td>{p.invTxt}</td>
                  <td>{p.forma === 'sello' ? <span className="menor">Ver Sellos</span> : <>
                    {v.reemplazado ? <><strong>{materialPorId(v.id!)?.nombre}</strong> <Chip tono="aviso">Reemplazado</Chip></> : 'El del inventario'}{' '}
                    {m ? (m.viable ? <Chip tono="ok">Viable</Chip> : <Chip tono="mal">Excluido</Chip>) : null}</>}</td>
                  <td>{p.dim}</td><td>{p.norma}</td>
                  <td><button type="button" className="boton" onClick={() => cambiar({ vista: p.forma === 'sello' ? 'sellos' : 'simulador', eq: e.id, pz: p.id })}>{p.forma === 'sello' ? 'Evaluar sellos' : 'Simular'}</button></td>
                </tr>
                );
              })}
            </tbody>
          </Tabla>
        </Hoja>
      ))}
    </>
  );
}

/* ----------------------------- Corrientes --------------------------- */
const esDeProceso = (c: Corriente): boolean => c.tipo !== 'servicio' && c.tipo !== 'agua_mar';

export function Corrientes({ estado }: PropsVista): ReactNode {
  const cv = criteriosDe(estado);
  const lista = Object.values(CORRIENTES);
  const puntos = lista.filter(esDeProceso).map((c) => ({
    id: c.id, etiqueta: c.id, pH: c.pH.v, pH2S_kPa: presionesParciales(c.P.v, c.H2S.v, c.CO2.v, c.T.v, cv).pH2S.kPa,
  }));
  return (
    <>
      <Hoja titulo="Corrientes que tocan los ocho equipos" nivel={1}>
        <p className="entrada">Base de diseño por corriente (Tabla 20 del informe). Las fracciones de H₂S y CO₂ son de la fase gas a la presión indicada.</p>
        <Tabla titulo="Corrientes del alcance">
          <thead><tr><th>Corriente</th><th>P, bar</th><th>T / Tmáx, °C</th><th>H₂S, % mol</th><th>CO₂, % mol</th><th>pH</th><th>Cl⁻, mg/L</th><th>pH₂S, kPa</th><th>pCO₂, bar</th><th>Región SSC</th></tr></thead>
          <tbody>
            {lista.map((c) => {
              const pp = presionesParciales(c.P.v, c.H2S.v, c.CO2.v, c.T.v, cv);
              const r = severidadSSC(pp.pH2S.kPa, c.pH.v, cv);
              return (
                <tr key={c.id}>
                  <th scope="row">{c.id}<span className="menor bloque">{c.nombre}</span></th>
                  <td><Dato v={c.P.v} o={c.P.o} /></td><td><Dato v={c.T.v} o={c.T.o} d={0} /> / {fmt(c.Tmax.v, 0)}</td>
                  <td><Dato v={c.H2S.v} o={c.H2S.o} d={4} /></td><td><Dato v={c.CO2.v} o={c.CO2.o} d={2} /></td>
                  <td><Dato v={c.pH.v} o={c.pH.o} /></td><td><Dato v={c.Cl.v} o={c.Cl.o} d={0} /></td>
                  <td>{fmt(pp.pH2S.kPa, 3)}</td><td>{fmt(pp.pCO2.bar, 3)}</td>
                  <td>{esDeProceso(c) ? <Chip tono={r.region === 0 ? 'ok' : r.region === 3 ? 'mal' : 'aviso'}>Región {r.region}</Chip> : <Chip tono="neutro">No aplica</Chip>}</td>
                </tr>
              );
            })}
          </tbody>
        </Tabla>
      </Hoja>
      <div className="rejilla2">
        <Hoja titulo="Ubicación en la Figura 1 de ISO 15156-2"><FiguraSSC puntos={puntos} /></Hoja>
        <Hoja titulo="Notas por corriente">
          <dl className="notas">{lista.map((c) => <div key={c.id}><dt>{c.id} · {c.nombre}</dt><dd>{c.nota} <span className="menor">Material candidato del informe: {c.material}</span></dd></div>)}</dl>
        </Hoja>
      </div>
    </>
  );
}

/* ----------------------------- Mecanismos --------------------------- */
const TONO_MEC: Record<EstadoMecanismo, [Tono, string]> = {
  P: ['mal', 'Potencial'], V: ['aviso', 'Por verificar'], D: ['ok', 'Descarte condicionado'], NA: ['neutro', 'No aplica'],
};
const COLUMNAS: [string, string][] = [
  ['co2', 'CO₂ húmedo'], ['ssc', 'SSC / HIC'], ['ascc', 'Amina (ASCC)'], ['scc_cl', 'Cloruros'], ['tlc', 'Parte superior'],
  ['agua_mar', 'Agua de mar'], ['externa', 'Atmósfera marina'], ['cui', 'CUI'],
];

export function Mecanismos({ estado, cambiar }: PropsVista): ReactNode {
  const piezas = TODAS_LAS_PIEZAS.filter((s) => s.pieza.forma !== 'sello');
  return (
    <>
      <Hoja titulo="Cribado de mecanismos de daño" nivel={1}>
        <p className="entrada">La matriz del informe (Tabla 22) reclasificada pieza por pieza con los datos actuales. La falta de un dato no es evidencia para descartar un mecanismo.</p>
        <p className="leyenda">{(Object.keys(TONO_MEC) as EstadoMecanismo[]).map((k) => <Chip key={k} tono={TONO_MEC[k][0]}>{k} · {TONO_MEC[k][1]}</Chip>)}</p>
        <Tabla titulo="Mecanismos por pieza">
          <thead><tr><th>Equipo y pieza</th><th>Corriente</th>{COLUMNAS.map(([id, t]) => <th key={id}>{t}</th>)}</tr></thead>
          <tbody>
            {piezas.map(({ equipo, pieza }) => {
              const r = resultadoDe(estado, equipo.id, pieza.id);
              return (
                <tr key={`${equipo.id}/${pieza.id}`}>
                  <th scope="row"><button type="button" className="enlace" onClick={() => cambiar({ vista: 'simulador', eq: equipo.id, pz: pieza.id })}>{equipo.corto}: {pieza.nombre}</button></th>
                  <td>{pieza.corriente}</td>
                  {COLUMNAS.map(([id]) => {
                    const m = r.mecanismos.find((x) => x.id === id);
                    return <td key={id}>{m ? <Chip tono={TONO_MEC[m.estado][0]} titulo={m.motivo}>{m.estado}</Chip> : <span className="menor">—</span>}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </Tabla>
        <p className="menor">Pase el cursor o enfoque una celda para leer el motivo. Erosión y MIC quedan por verificar en todas las piezas mientras falten caudales.</p>
      </Hoja>
      <Hoja titulo="Tabla 22 del informe, por corriente">
        <Tabla titulo="Tabla 22 del informe">
          <thead><tr><th>Corriente</th><th>Potencial</th><th>Por verificar</th><th>Descarte o condición</th><th>Justificación</th></tr></thead>
          <tbody>{Object.entries(MECANISMOS).map(([id, m]) => <tr key={id}><th scope="row">{id}</th><td>{m.P}</td><td>{m.V}</td><td>{m.D}</td><td>{m.J}</td></tr>)}</tbody>
        </Tabla>
      </Hoja>
    </>
  );
}

/* ------------------------------ Criterios --------------------------- */
const ESTADO_TXT: Record<Criterio['estado'], string> = {
  adjunta: 'Norma adjunta', literatura: 'Literatura', conocimiento: 'De memoria', supuesto: 'Supuesto del grupo', pendiente: 'Pendiente',
};

export function Criterios({ estado, cambiar }: PropsVista): ReactNode {
  const lista = Object.values(CRITERIOS);
  const poner = (id: string, v: number): void => cambiar({ criterios: { ...estado.criterios, [id]: v } });
  const editados = Object.keys(estado.criterios).length;
  return (
    <>
      <Hoja titulo="Criterios de decisión" nivel={1}>
        <p className="entrada">Todos los umbrales que usa el motor, con su fuente. Los marcados «por verificar» vienen de normas no adjuntas, de literatura o de memoria: ajústelos cuando tenga el texto.</p>
        <p><button type="button" className="boton" disabled={!editados} onClick={() => cambiar({ criterios: {} })}>Restablecer los valores de partida</button> <span className="menor">{editados} criterio{editados === 1 ? '' : 's'} editado{editados === 1 ? '' : 's'}.</span></p>
        <Tabla titulo="Criterios editables">
          <thead><tr><th>Criterio</th><th>Valor</th><th>Fuente</th><th>Tipo</th><th>Estado</th></tr></thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <th scope="row"><label htmlFor={`cr-${c.id}`}>{c.titulo}</label>{c.nota ? <span className="menor bloque">{c.nota}</span> : null}</th>
                <td className="celda-valor">
                  <input id={`cr-${c.id}`} type="number" step="any" disabled={!c.editable} value={estado.criterios[c.id] ?? c.valor}
                    onChange={(e) => { const v = e.currentTarget.valueAsNumber; if (Number.isFinite(v)) poner(c.id, v); }} /> <span className="unidad">{c.unidad}</span>
                  {estado.criterios[c.id] != null && estado.criterios[c.id] !== c.valor ? <span className="menor bloque">De partida: {fmt(c.valor, 3)} <EtiquetaOrigen o="U" /></span> : null}
                </td>
                <td>{c.norma}, {c.clausula}{c.pagina != null ? `, pág. ${c.pagina}` : ''}</td>
                <td>{ESTADO_TXT[c.estado]}</td>
                <td><Verificado v={c.verificado} /></td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </Hoja>
      <div className="rejilla2">
        <Hoja titulo="Agua de mar clorada con rendijas">
          <p><Fuente {...TABLA10_AGUA_MAR.fuente} /></p>
          <Tabla titulo="ISO 21457, Tabla 10">
            <thead><tr><th>Material</th><th>T máx., °C</th><th>Otras limitaciones</th></tr></thead>
            <tbody>{TABLA10_AGUA_MAR.filas.map((f) => <tr key={f.material}><th scope="row">{f.material}</th><td>{f.tMax ?? 'Según recubrimiento'}</td><td>{f.otras ?? '—'}</td></tr>)}</tbody>
          </Tabla>
        </Hoja>
        <Hoja titulo="Inoxidables sin recubrimiento en atmósfera marina">
          <p><Fuente {...TABLA3_ATMOSFERA_MARINA.fuente} /></p>
          <Tabla titulo="ISO 21457, Tabla 3">
            <thead><tr><th>Tipo</th><th>Límite inferior, °C</th><th>Límite superior, °C</th></tr></thead>
            <tbody>{Object.entries(TABLA3_ATMOSFERA_MARINA.limites).map(([k, [a, b]]) => <tr key={k}><th scope="row">{k}</th><td>{a}</td><td>{b}</td></tr>)}</tbody>
          </Tabla>
        </Hoja>
      </div>
      <Hoja titulo="Límites ambientales de ISO 15156-3 cargados">
        <p className="aviso-academico" role="note">El Anexo A no está en el PDF adjunto: estos valores vienen de memoria y están por verificar.</p>
        <Tabla titulo="Límites de ISO 15156-3">
          <thead><tr><th>Familia</th><th>Tabla</th><th>Combinaciones admitidas</th><th>Nota</th></tr></thead>
          <tbody>
            {Object.entries(LIMITES_15156_3).map(([k, l]) => (
              <tr key={k}><th scope="row">{k}</th><td>{l.fuente.clausula}</td>
                <td>{l.filas.map((f, i) => <span key={i} className="bloque">{f.tMax == null && f.pH2S_kPa == null ? 'Sin límite ambiental' : `${f.tMax} °C; ${f.pH2S_kPa} kPa; ${f.cl_mgL == null ? 'cualquier Cl⁻' : `Cl⁻ ≤ ${fmt(f.cl_mgL, 0)} mg/L`}`}</span>)}</td>
                <td>{l.nota}</td></tr>
            ))}
          </tbody>
        </Tabla>
      </Hoja>
      <Hoja titulo="Materiales candidatos">
        <p>Composición de ISO 21457, Tabla C.1. Costo y fabricabilidad son índices didácticos del grupo.</p>
        <Tabla titulo="Materiales candidatos">
          <thead><tr><th>Material</th><th>Especificación</th><th>PREN mín. a máx.</th><th>Costo relativo</th><th>Fabricabilidad</th><th>Lista del inventario</th></tr></thead>
          <tbody>
            {MATERIALES.map((m) => {
              const p = prenMaterial(m);
              return <tr key={m.id}><th scope="row">{m.nombre}</th><td>{m.spec}</td><td>{p ? `${fmt(p.min)} a ${fmt(p.max)}` : '—'}</td><td>{fmt(m.costo)}</td><td>{fmt(m.fab)}</td><td>{m.enLista ? 'Sí' : 'No'}</td></tr>;
            })}
          </tbody>
        </Tabla>
      </Hoja>
    </>
  );
}

/* ------------------------------- Normas ----------------------------- */
export function Normas(): ReactNode {
  const tono = { completa: 'ok', 'vista previa': 'aviso', 'no adjunta': 'mal' } as const;
  return (
    <>
      <Hoja titulo="Normas y cómo se usan" nivel={1}>
        <p className="entrada">Qué se pudo leer de cada norma. Donde el PDF es una vista previa o la norma no está adjunta, los valores quedan «por verificar».</p>
        <Tabla titulo="Normas del proyecto">
          <thead><tr><th>Norma</th><th>Título</th><th>PDF</th><th>Uso en el simulador</th></tr></thead>
          <tbody>{NORMAS.map((n) => <tr key={n.codigo}><th scope="row">{n.codigo}</th><td>{n.titulo}</td><td><Chip tono={tono[n.estado]}>{n.estado}</Chip></td><td>{n.alcance}</td></tr>)}</tbody>
        </Tabla>
      </Hoja>
      <div className="rejilla2">
        <Hoja titulo="Normas pendientes"><ul className="simple">{PENDIENTES_NORMAS.map((p) => <li key={p}>{p}</li>)}</ul></Hoja>
        <Hoja titulo="Alcance de la herramienta">
          <p>{AVISO_ACADEMICO}</p>
          <p>ISO 15156 trata solo el agrietamiento; la pérdida de material se estima aparte con el modelo de CO₂. API 6A cubre cabezas de pozo y aquí solo sirve para comparar válvulas y sellos.</p>
          <p>Las ecuaciones, fuentes y limitaciones de cada modelo están en <code>docs/metodologia.md</code> y los valores de control en <code>docs/validacion.md</code>.</p>
        </Hoja>
      </div>
    </>
  );
}
