import type { ReactNode } from 'react';
import { PENDIENTES_NORMAS, PENDIENTES_PROCESO } from '../data/pendientes';
import { aCSV, aJSON, descargar, fichaDe } from '../report/exportar';
import { AVISO_ACADEMICO, Chip, EtiquetaOrigen, fmt, Hoja } from './comunes';
import { TODAS_LAS_PIEZAS } from './contexto';
import { TablaRanking } from './vistasCalculo';
import type { PropsVista } from './vistasDatos';

export function Reporte({ estado, cambiar }: PropsVista): ReactNode {
  const todas = TODAS_LAS_PIEZAS.filter((s) => s.pieza.forma !== 'sello').map((s) => `${s.equipo.id}/${s.pieza.id}`);
  const claves = estado.reporte.length ? estado.reporte : [];
  const fichas = claves.map((c) => fichaDe(estado, c));
  const ahora = new Date();
  return (
    <>
      <Hoja titulo="Reporte" nivel={1} clase="no-imprimir">
        <p className="entrada">Fichas de selección de las piezas que agregó desde el Simulador, o de todas las piezas con los valores actuales.</p>
        <p className="botones">
          <button type="button" className="boton" onClick={() => cambiar({ reporte: todas })}>Incluir las {todas.length} piezas</button>
          <button type="button" className="boton" disabled={!fichas.length} onClick={() => cambiar({ reporte: [] })}>Vaciar</button>
          <button type="button" className="boton primario" disabled={!fichas.length} onClick={() => window.print()}>Imprimir o guardar como PDF</button>
          <button type="button" className="boton" disabled={!fichas.length} onClick={() => descargar('reporte_B2.csv', aCSV(fichas), 'text/csv')}>Descargar CSV</button>
          <button type="button" className="boton" disabled={!fichas.length} onClick={() => descargar('reporte_B2.json', aJSON(fichas, ahora.toISOString()), 'application/json')}>Descargar JSON</button>
        </p>
      </Hoja>
      {fichas.length ? (
        <article className="reporte">
          <header className="hoja">
            <h1>Selección de materiales · Planta de gas B2</h1>
            <p>Universidad Industrial de Santander · Selección de materiales. Generado el {ahora.toLocaleDateString('es-CO')} a las {ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}.</p>
            <p className="aviso-academico" role="note">{AVISO_ACADEMICO} Los datos S son supuestos y los P están pendientes; las fuentes «por verificar» no se pudieron leer en un PDF adjunto.</p>
          </header>
          {fichas.map((f, i) => {
            const r = f.resultado;
            return (
              <section key={f.clave} className="hoja ficha">
                <h2>{i + 1}. {f.equipo} — {f.pieza}</h2>
                <p><strong>Corriente:</strong> {f.corriente}. <strong>Material del inventario:</strong> {f.materialInventario}</p>
                <p><strong>Recomendación:</strong> {r.mejor ? `${r.mejor.nombre} (${r.mejor.spec})` : 'ningún candidato de la lista es viable con estos datos'}.</p>
                <ul className="datos-ficha">{f.entradas.map((d) => <li key={d.campo}>{d.campo}: {typeof d.valor === 'number' ? fmt(d.valor, 4) : d.valor} {d.unidad} <EtiquetaOrigen o={d.origen} /></li>)}</ul>
                <p>pH₂S {fmt(r.pp.pH2S.kPa, 3)} kPa; pCO₂ {fmt(r.pp.pCO2.bar, 3)} bar; <Chip tono={r.ssc.region === 0 ? 'ok' : r.ssc.region === 3 ? 'mal' : 'aviso'}>Región SSC {r.ssc.region}</Chip>
                  {r.corrosion.aplica ? ` Velocidad sin inhibir ${fmt(r.corrosion.crBase, 2)} mm/a; sobreespesor requerido ${fmt(r.corrosion.caRequerido, 1)} mm.` : ' El modelo de CO₂ no aplica o el servicio es seco.'}</p>
                <TablaRanking r={r} />
                <p className="menor">Mecanismos potenciales: {r.mecanismos.filter((m) => m.estado === 'P').map((m) => m.nombre).join('; ') || 'ninguno'}. Por verificar: {r.mecanismos.filter((m) => m.estado === 'V').map((m) => m.nombre).join('; ') || 'ninguno'}.</p>
              </section>
            );
          })}
          <section className="hoja">
            <h2>Pendientes que condicionan estos resultados</h2>
            <ul className="simple">{[...PENDIENTES_PROCESO, ...PENDIENTES_NORMAS].map((p) => <li key={p}>{p}</li>)}</ul>
          </section>
        </article>
      ) : <Hoja><p>Todavía no hay fichas. Use «Agregar al reporte» en el Simulador o incluya todas las piezas.</p></Hoja>}
    </>
  );
}
