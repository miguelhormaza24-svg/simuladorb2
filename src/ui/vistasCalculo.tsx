import { useMemo, useState, type ReactNode } from 'react';
import { API6A, ENSAYO_RGD, RGD_RIESGO, TABLA_C1_ELASTOMEROS, TERMOPLASTICOS } from '../data/criterios';
import { CORRIENTES } from '../data/corrientes';
import { EQUIPOS } from '../data/equipos';
import type { EstadoAgua, TipoAmina } from '../data/tipos';
import { monteCarloPieza, NOMBRE_VARIABLE, tornadoPieza, type ResultadoMonteCarlo } from '../engine/analisis';
import {
  calificacionRGD, claseTemperatura, condicionSello, ensayoRGDCubre, evaluarElastomeros, evaluarTermoplasticos, planEnvejecimiento, riesgoRGD,
} from '../engine/elastomeros';
import { advertenciaTraslado, aplicarPresets, PRESETS } from '../engine/escenarios';
import { evaluarPieza, type EntradaPieza, type EvaluacionMaterial, type ResultadoPieza } from '../engine/evaluarPieza';
import type { Hallazgo } from '../engine/tipos';
import { clavePieza } from '../state/store';
import { AVISO_ACADEMICO, CampoNum, CampoSel, CampoSi, Chip, fmt, Hoja, Tabla, Verificado, type Tono } from './comunes';
import { materialPorId } from '../data/materiales';
import { criteriosDe, entradaCon, materialVigente, origenCampo, seleccion } from './contexto';
import { Barras, FiguraSSC, Tornado } from './graficas';
import type { PropsVista } from './vistasDatos';

const TONO_REGION: Tono[] = ['ok', 'aviso', 'aviso', 'mal'];
const TXT_HALLAZGO: Record<Hallazgo['tipo'], [Tono, string]> = { exclusion: ['mal', 'Exclusión'], aviso: ['aviso', 'Aviso'], requisito: ['neutro', 'Requisito'] };

function SelectorPieza({ estado, cambiar, soloSellos = false }: PropsVista & { soloSellos?: boolean }): ReactNode {
  const { equipo, pieza } = seleccion(estado.eq, estado.pz);
  const piezas = equipo.piezas.filter((p) => (soloSellos ? p.forma === 'sello' : p.forma !== 'sello'));
  return (
    <div className="selector">
      <CampoSel id="sel-eq" etiqueta="Equipo" valor={equipo.id} opciones={EQUIPOS.map((e) => [e.id, `${e.n}. ${e.nombre}`])}
        alCambiar={(eq) => { const e = EQUIPOS.find((x) => x.id === eq)!; cambiar({ eq, pz: (e.piezas.find((p) => (soloSellos ? p.forma === 'sello' : p.forma !== 'sello')) ?? e.piezas[0]!).id }); }} />
      <CampoSel id="sel-pz" etiqueta="Pieza" valor={piezas.some((p) => p.id === pieza.id) ? pieza.id : piezas[0]!.id}
        opciones={piezas.map((p) => [p.id, p.nombre])} alCambiar={(pz) => cambiar({ pz })} />
    </div>
  );
}

export function ListaHallazgos({ h }: { h: Hallazgo[] }): ReactNode {
  if (!h.length) return <span className="menor">Sin observaciones.</span>;
  return (
    <ul className="hallazgos">
      {h.map((x, i) => (
        <li key={`${x.regla}-${i}`}>
          <Chip tono={TXT_HALLAZGO[x.tipo][0]}>{TXT_HALLAZGO[x.tipo][1]}</Chip> {x.texto}{' '}
          <span className="menor">{x.norma}, {x.clausula}. <Verificado v={x.verificado} /></span>
        </li>
      ))}
    </ul>
  );
}

function FilaMaterial({ m, pos }: { m: EvaluacionMaterial; pos: number | null }): ReactNode {
  return (
    <tr>
      <th scope="row">{pos != null ? `${pos}. ` : ''}{m.nombre}<span className="menor bloque">{m.spec}</span></th>
      <td>{m.viable ? <Chip tono="ok">Viable</Chip> : <Chip tono="mal">Excluido</Chip>}</td>
      <td>{m.cercania != null ? fmt(m.cercania, 3) : '—'}</td>
      <td>{fmt(m.integridad)}</td><td>{fmt(m.costoCicloVida)}</td><td>{fmt(m.fabricabilidad)}</td>
      <td>{m.pren ? `${fmt(m.pren.min)} a ${fmt(m.pren.max)}` : '—'}</td>
      <td><ListaHallazgos h={m.hallazgos} /></td>
    </tr>
  );
}

export function TablaRanking({ r }: { r: ResultadoPieza }): ReactNode {
  const excluidos = r.materiales.filter((m) => m.enLista && !m.viable);
  return (
    <Tabla titulo="Ranking de materiales">
      <thead><tr><th>Material</th><th>Estado</th><th>Cercanía TOPSIS</th><th>Integridad</th><th>Costo de ciclo de vida</th><th>Fabricabilidad</th><th>PREN</th><th>Motivos, requisitos y cláusulas</th></tr></thead>
      <tbody>
        {r.ranking.map((m, i) => <FilaMaterial key={m.id} m={m} pos={i + 1} />)}
        {excluidos.map((m) => <FilaMaterial key={m.id} m={m} pos={null} />)}
      </tbody>
    </Tabla>
  );
}

/* ----------------------------- Simulador ---------------------------- */
export function Simulador({ estado, cambiar }: PropsVista): ReactNode {
  const s = seleccion(estado.eq, estado.pz);
  const clave = clavePieza(s.equipo.id, s.pieza.id);
  const cv = criteriosDe(estado);
  const e = entradaCon(estado, s.equipo.id, s.pieza.id);
  const r = useMemo(() => evaluarPieza(e, cv), [JSON.stringify(e), JSON.stringify(cv)]); // eslint-disable-line react-hooks/exhaustive-deps
  const [mc, setMc] = useState<{ clave: string; res: ResultadoMonteCarlo } | null>(null);
  const firma = JSON.stringify([clave, e, estado.criterios]);

  const poner = (p: Partial<EntradaPieza>): void => cambiar({ cambios: { ...estado.cambios, [clave]: { ...estado.cambios[clave], ...p } } });
  const num = (campo: keyof EntradaPieza, etiqueta: string, unidad: string, extra: { min?: number; max?: number; paso?: number } = {}): ReactNode => (
    <CampoNum id={`f-${campo}`} etiqueta={etiqueta} unidad={unidad} valor={e[campo] as number} origen={origenCampo(estado, s, campo)} {...extra} alCambiar={(v) => poner({ [campo]: v })} />
  );
  if (s.pieza.forma === 'sello') {
    return (
      <Hoja titulo="Simulador por pieza" nivel={1}>
        <SelectorPieza estado={estado} cambiar={cambiar} />
        <p>Los sellos se evalúan con ISO 23936-2 en la pestaña Sellos.</p>
        <button type="button" className="boton primario" onClick={() => cambiar({ vista: 'sellos' })}>Evaluar los sellos de este equipo</button>
      </Hoja>
    );
  }
  const vigente = materialVigente(estado, s);
  const sel = r.materiales.find((m) => m.id === vigente.id);
  const elegir = (id: string | null): void => {
    const { [clave]: _, ...resto } = estado.materiales;
    cambiar({ materiales: id && id !== s.pieza.inv ? { ...resto, [clave]: id } : resto });
  };
  const c = r.corrosion;
  const torn = tornadoPieza(e, cv, c.aplica ? 'ca' : 'pH2S');
  const enReporte = estado.reporte.includes(clave);
  const amina = e.amina;
  const teg = e.teg;

  return (
    <>
      <Hoja titulo="Simulador por pieza" nivel={1} clase="no-imprimir">
        <SelectorPieza estado={estado} cambiar={cambiar} />
        <p className="menor">Corriente {s.pieza.corriente}{s.pieza.servicio ? `, con ${s.pieza.servicio} del otro lado` : ''}. {CORRIENTES[s.pieza.corriente]!.nota}</p>
        <form className="formulario" onSubmit={(ev) => ev.preventDefault()}>
          <fieldset><legend>Condiciones</legend>
            {num('P', 'Presión', 'bar abs', { min: 0 })}{num('T', 'Temperatura de operación', '°C')}{num('Tmax', 'Temperatura máxima', '°C')}{num('Tmin', 'Temperatura mínima', '°C')}
            {num('H2S', 'H₂S en el gas', '% mol', { min: 0, paso: 0.0001 })}{num('CO2', 'CO₂ en el gas', '% mol', { min: 0 })}
          </fieldset>
          <fieldset><legend>Fase acuosa</legend>
            <CampoSel<EstadoAgua> id="f-agua" etiqueta="Agua libre" valor={e.agua} origen={origenCampo(estado, s, 'agua')} alCambiar={(agua) => poner({ agua })}
              opciones={[['si', 'Presente'], ['condensa', 'Condensa'], ['posible', 'Posible'], ['no', 'Ausente']]} />
            {num('pH', 'pH', '')}{num('Cl', 'Cloruros', 'mg/L', { min: 0 })}{num('HCO3', 'Bicarbonato', 'mg/L', { min: 0 })}{num('wAgua', 'Agua en la fase acuosa (resto MEG)', '%', { min: 1, max: 100 })}
            {e.tipo === 'gas_seco' ? <CampoNum id="f-rocio" etiqueta="Punto de rocío" unidad="°C" valor={e.rocio ?? 0} origen={origenCampo(estado, s, 'rocio')} alCambiar={(rocio) => poner({ rocio })} /> : null}
          </fieldset>
          {amina ? (
            <fieldset><legend>Amina</legend>
              <CampoSel<TipoAmina> id="f-am-tipo" etiqueta="Tipo" valor={amina.tipo} origen={origenCampo(estado, s, 'amina')} alCambiar={(tipo) => poner({ amina: { ...amina, tipo } })} opciones={[['MDEA', 'MDEA'], ['DEA', 'DEA'], ['MEA', 'MEA'], ['DIPA', 'DIPA']]} />
              <CampoNum id="f-am-carga" etiqueta="Carga ácida" unidad="mol/mol" valor={amina.carga} origen={origenCampo(estado, s, 'amina')} alCambiar={(carga) => poner({ amina: { ...amina, carga } })} />
              <CampoNum id="f-am-vel" etiqueta="Velocidad" unidad="m/s" valor={amina.vel} origen={origenCampo(estado, s, 'amina')} alCambiar={(vel) => poner({ amina: { ...amina, vel } })} />
              <CampoNum id="f-am-hss" etiqueta="Sales termoestables" unidad="% p/p" valor={amina.hss} origen={origenCampo(estado, s, 'amina')} alCambiar={(hss) => poner({ amina: { ...amina, hss } })} />
            </fieldset>
          ) : null}
          {teg ? (
            <fieldset><legend>TEG</legend>
              <CampoNum id="f-teg-t" etiqueta="Temperatura de película" unidad="°C" valor={teg.Tpel} origen={origenCampo(estado, s, 'teg')} alCambiar={(Tpel) => poner({ teg: { ...teg, Tpel } })} />
              <CampoSi id="f-teg-c" etiqueta="TEG contaminado con H₂S, salmuera o hidrocarburo" valor={teg.contaminado === 'si'} alCambiar={(v) => poner({ teg: { ...teg, contaminado: v ? 'si' : 'no' } })} />
            </fieldset>
          ) : null}
          {e.servicio ? (
            <fieldset><legend>Lado de servicio ({e.servicio.id})</legend>
              <CampoNum id="f-serv-t" etiqueta="Temperatura máxima del servicio" unidad="°C" valor={e.servicio.Tmax} origen={origenCampo(estado, s, 'servicio') === 'U' ? 'U' : 'P'} alCambiar={(Tmax) => poner({ servicio: { ...e.servicio!, Tmax } })} />
              {e.servicio.tipo === 'agua_mar' ? <CampoNum id="f-serv-cl" etiqueta="Cloro residual" unidad="mg/L" valor={e.servicio.cloroResidual ?? 0.5} origen={e.servicio.cloroResidual == null ? 'P' : 'U'} alCambiar={(cloroResidual) => poner({ servicio: { ...e.servicio!, cloroResidual } })} /> : null}
            </fieldset>
          ) : null}
          <fieldset><legend>Control y modelo</legend>
            {num('inhibidor', 'Disponibilidad del inhibidor', '%', { min: 0, max: 100 })}{num('vida', 'Vida de diseño', 'años', { min: 1 })}
            <CampoNum id="f-U" etiqueta="Velocidad del líquido (modelo de 1995)" unidad="m/s" valor={e.U ?? NaN} origen={e.U == null ? 'P' : 'U'} alCambiar={(U) => poner({ U, dHidraulico: e.dHidraulico ?? e.D ?? 0.2 })} />
            <CampoSi id="f-ext" etiqueta="Expuesta a la atmósfera marina" valor={e.externo} alCambiar={(externo) => poner({ externo })} />
            <CampoSi id="f-ais" etiqueta="Con aislamiento térmico" valor={e.aislado} alCambiar={(aislado) => poner({ aislado })} />
            <CampoSi id="f-pel" etiqueta="Aplicar el factor de película" valor={e.conPelicula} alCambiar={(conPelicula) => poner({ conPelicula })} />
            <CampoSi id="f-cph" etiqueta="Corregir la velocidad por pH" valor={e.corregirPH} alCambiar={(corregirPH) => poner({ corregirPH })} />
            <CampoSi id="f-phc" etiqueta="Usar el pH calculado en la Figura 1" valor={e.usarPHCalculado} alCambiar={(usarPHCalculado) => poner({ usarPHCalculado })} />
            <CampoSi id="f-156" etiqueta="Aplicar ISO 15156-3 también en amina y TEG" valor={e.aplicar15156EnSolucion} alCambiar={(aplicar15156EnSolucion) => poner({ aplicar15156EnSolucion })} />
          </fieldset>
        </form>
        <p>
          <button type="button" className="boton" disabled={!estado.cambios[clave]} onClick={() => { const { [clave]: _, ...resto } = estado.cambios; cambiar({ cambios: resto }); }}>Restablecer esta pieza</button>{' '}
          <button type="button" className="boton primario" onClick={() => cambiar({ reporte: enReporte ? estado.reporte.filter((x) => x !== clave) : [...estado.reporte, clave] })}>{enReporte ? 'Quitar del reporte' : 'Agregar al reporte'}</button>
        </p>
      </Hoja>

      <section className="veredicto" aria-live="polite">
        <div>
          <p className="menor">Recomendación para {s.equipo.corto.toLowerCase()}, {s.pieza.nombre.toLowerCase()}</p>
          <p className="grande">{r.mejor ? r.mejor.nombre : 'Ningún candidato de la lista es viable'}</p>
          <p className="menor">{r.mejor ? r.mejor.spec : 'Revise las condiciones o amplíe la lista de materiales.'}</p>
        </div>
        <div>
          <p className="menor">{vigente.reemplazado ? 'Material seleccionado (reemplaza al del inventario)' : 'Material seleccionado: el del inventario'}</p>
          <p>{vigente.reemplazado ? <strong>{materialPorId(vigente.id!)?.nombre ?? vigente.id}</strong> : s.pieza.invTxt}</p>
          <p>
            {sel ? (sel.viable ? <Chip tono="ok">Viable con estos datos</Chip> : <Chip tono="mal">Excluido con estos datos</Chip>) : <Chip tono="neutro">No disponible en esta forma</Chip>}
            {vigente.reemplazado ? <> <Chip tono="aviso">Reemplazado</Chip></> : null}
          </p>
          {vigente.reemplazado ? <p className="menor">Inventario: {s.pieza.invTxt}</p> : null}
          <p className="botones">
            {r.mejor && r.mejor.id !== vigente.id ? <button type="button" className="boton primario" onClick={() => elegir(r.mejor!.id)}>Reemplazar por el recomendado</button> : null}
            {vigente.reemplazado ? <button type="button" className="boton" onClick={() => elegir(null)}>Volver al material del inventario</button> : null}
          </p>
        </div>
      </section>

      <div className="rejilla2">
        <Hoja titulo="H₂S y servicio agrio" nivel={3}>
          <Tabla titulo="Presiones parciales">
            <thead><tr><th /><th>kPa</th><th>bar</th><th>MPa</th><th>psia</th></tr></thead>
            <tbody>
              <tr><th scope="row">pH₂S</th><td>{fmt(r.pp.pH2S.kPa, 3)}</td><td>{fmt(r.pp.pH2S.bar, 4)}</td><td>{fmt(r.pp.pH2S.MPa, 5)}</td><td>{fmt(r.pp.pH2S.psia, 3)}</td></tr>
              <tr><th scope="row">pCO₂</th><td>{fmt(r.pp.pCO2.kPa, 2)}</td><td>{fmt(r.pp.pCO2.bar, 3)}</td><td>{fmt(r.pp.pCO2.MPa, 4)}</td><td>{fmt(r.pp.pCO2.psia, 2)}</td></tr>
            </tbody>
          </Tabla>
          <p>Coeficiente de fugacidad del CO₂: {fmt(r.pp.phiCO2, 4)}; fugacidad: {fmt(r.pp.fCO2, 3)} bar.{r.pp.fueraDeRango ? ' La presión supera los 250 bar de validez de la ecuación: el coeficiente se calcula a 250 bar.' : ''}</p>
          <p><Chip tono={TONO_REGION[r.ssc.region]!}>Región SSC {r.ssc.region}</Chip> {r.ssc.agrio ? 'Servicio agrio.' : 'Por debajo de 0,3 kPa: no es servicio agrio.'} {r.humedad.motivo}</p>
          <p>pH ingresado: {fmt(r.ph.ingresado, 2)}; pH calculado: {fmt(r.ph.calculado, 2)} (diferencia de {fmt(r.ph.diferencia, 2)}). El H₂S aporta el {fmt(r.ph.aporteH2S * 100, 0)} % de la acidez. {r.ph.masAcido ? 'El pH ingresado es más ácido que el del equilibrio: revise ácidos orgánicos o la presión del dato.' : r.ph.masAlcalino ? 'El pH ingresado es más alcalino que el del equilibrio: habría bicarbonato o una solución alcalina.' : 'Coinciden dentro de 0,3 unidades.'}</p>
          <p className="menor">El pH calculado sale de un balance con constantes de literatura; el Anexo D de ISO 15156-2 no está adjunto. <Verificado v={false} /></p>
        </Hoja>
        <Hoja titulo="Ubicación en la Figura 1" nivel={3}>
          <FiguraSSC puntos={[{ id: clave, etiqueta: `${s.equipo.corto}: ${s.pieza.corriente}`, pH2S_kPa: r.pp.pH2S.kPa, pH: r.ph.usado, sel: true }]} />
        </Hoja>
      </div>

      <Hoja titulo="Corrosión interna del acero al carbono" nivel={3}>
        {c.aplica && c.dwm91 ? (
          <div className="rejilla2">
            <div>
              <Barras titulo="Velocidad de corrosión" unidad="mm/a" datos={[
                { etiqueta: 'Nomograma, sin película', valor: c.dwm91.vNom },
                { etiqueta: 'Con factor de película', valor: c.dwm91.vPelicula, nota: `Factor ${fmt(c.dwm91.fPelicula, 3)}` },
                { etiqueta: 'Con glicol y pH', valor: c.crBase, nota: `Factor de glicol ${fmt(c.dwm91.fGlicol, 3)}; de pH ${fmt(c.dwm91.fpH, 3)}` },
                { etiqueta: `Con inhibidor al ${fmt(e.inhibidor)} %`, valor: c.crEf },
                ...(c.dwm95 ? [{ etiqueta: 'Modelo de 1995, con flujo', valor: c.dwm95.v, nota: `Reacción ${fmt(c.dwm95.vr, 1)}; transferencia ${fmt(c.dwm95.vm, 1)} mm/a` }] : []),
              ]} />
              <p className="menor">de Waard, Lotz y Milliams (1991){c.dwm95 ? ' y de Waard, Lotz y Dugstad (1995)' : ''}. <Verificado v={false} /> NORSOK M-506 no está adjunta.</p>
            </div>
            <div>
              <p>Sobreespesor requerido en {fmt(e.vida, 0)} años: <strong>{fmt(c.caRequerido, 1)} mm</strong>. {c.clase ? <Chip tono={c.clase.clave === 3 ? 'mal' : c.clase.clave === 0 ? 'ok' : 'aviso'}>{c.clase.nombre}{c.clase.ca != null ? `: ${fmt(c.clase.ca)} mm` : ''}</Chip> : null}</p>
              <p>{c.dispMinima == null ? 'Ni con el 100 % de disponibilidad el acero al carbono queda dentro de 6 mm.' : c.dispMinima === 0 ? 'El acero al carbono queda dentro de 6 mm sin inhibidor.' : `Disponibilidad mínima del inhibidor para no pasar de 6 mm: ${fmt(c.dispMinima, 1)} %.`}</p>
              <p><Chip tono={r.regimen.advertencia ? 'aviso' : 'neutro'}>pCO₂/pH₂S = {fmt(r.pp.razon, 1)}</Chip> {r.regimen.texto}</p>
              {r.mecanica ? <p>Espesor por presión (UG-27): {fmt(r.mecanica.t_mm, 1)} mm; con sobreespesor, {fmt(r.mecanica.tRequerido_mm, 1)} mm frente a {fmt(e.espesorInv, 0)} mm del inventario. {r.mecanica.cumple ? <Chip tono="ok">Cabe</Chip> : <Chip tono="mal">No cabe</Chip>} <Verificado v={false} /></p> : null}
            </div>
          </div>
        ) : (
          <p>{c.seco ? 'Sin fase acuosa: no hay corrosión electroquímica (ISO 21457 §6.2.3.5).' : 'El modelo de CO₂ no aplica a esta corriente; se evalúa la severidad de la solución.'}
            {r.amina ? ` Severidad de amina ${r.amina.nivel}${r.amina.factores.length ? `: ${r.amina.factores.join('; ')}.` : '.'}` : ''}
            {r.teg ? ` Severidad de TEG ${r.teg.nivel}${r.teg.factores.length ? `: ${r.teg.factores.join('; ')}.` : '.'}` : ''}</p>
        )}
      </Hoja>

      <Hoja titulo="Ranking de materiales candidatos" nivel={3}>
        <TablaRanking r={r} />
        {r.fueraDeLista.length ? <p className="menor">Admitidos por la Tabla 10 de ISO 21457 pero fuera de la lista del inventario: {r.fueraDeLista.map((m) => m.nombre).join('; ')}.</p> : null}
        <p className="menor">Integridad, costo y fabricabilidad son índices didácticos. Referencia API 6A: clase {r.api6a.clase} ({r.api6a.corrosividadTxt}). <Verificado v={false} /></p>
      </Hoja>

      <div className="rejilla2">
        <Hoja titulo="Mecanismos de daño con estos datos" nivel={3}>
          <ul className="hallazgos">
            {r.mecanismos.map((m) => <li key={m.id}><Chip tono={m.estado === 'P' ? 'mal' : m.estado === 'V' ? 'aviso' : m.estado === 'D' ? 'ok' : 'neutro'}>{m.estado}</Chip> <strong>{m.nombre}.</strong> {m.motivo}</li>)}
          </ul>
        </Hoja>
        <Hoja titulo="Sensibilidad" nivel={3}>
          <Tornado barras={torn} unidad={c.aplica ? 'mm' : 'kPa'} nombres={NOMBRE_VARIABLE} titulo={c.aplica ? 'Sensibilidad del sobreespesor requerido' : 'Sensibilidad de la presión parcial de H₂S'} />
          <p className="menor">{c.aplica ? 'Sobreespesor requerido' : 'Presión parcial de H₂S'} al mover una variable a la vez: P ±20 %, T ±10 °C, CO₂ y H₂S ±25 %, pH ±0,3, Cl⁻ ±50 %, inhibidor −5 y +1 puntos.</p>
        </Hoja>
      </div>

      <Hoja titulo="Monte Carlo: probabilidad de que cada material sea viable" nivel={3}>
        <p><button type="button" className="boton" onClick={() => setMc({ clave: firma, res: monteCarloPieza(e, cv, 800, 2026) })}>Correr 800 simulaciones</button> <span className="menor">Distribuciones triangulares sobre los mismos intervalos; semilla fija, resultado reproducible.</span></p>
        {mc && mc.clave === firma ? (
          <div className="rejilla2">
            <Barras titulo="Probabilidad de viabilidad" unidad="%" max={100} decimales={0}
              datos={r.materiales.filter((m) => m.enLista).map((m) => ({ etiqueta: m.nombre, valor: (mc.res.viabilidad[m.id] ?? 0) * 100 }))} />
            <div>
              <p>Sobreespesor requerido: P10 {fmt(mc.res.ca.p10, 1)} mm, P50 {fmt(mc.res.ca.p50, 1)} mm, P90 {fmt(mc.res.ca.p90, 1)} mm.</p>
              <p>Región SSC: {[0, 1, 2, 3].map((k) => `${k}: ${fmt((mc.res.region[String(k)] ?? 0) * 100, 0)} %`).join('; ')}.</p>
            </div>
          </div>
        ) : <p className="menor">{mc ? 'Los datos cambiaron: vuelva a correr la simulación.' : 'Todavía no se ha corrido.'}</p>}
      </Hoja>
    </>
  );
}

/* ------------------------------- Sellos ----------------------------- */
export function Sellos({ estado, cambiar }: PropsVista): ReactNode {
  const { equipo } = seleccion(estado.eq, estado.pz);
  const pieza = equipo.piezas.find((p) => p.forma === 'sello') ?? equipo.piezas[0]!;
  const cv = criteriosDe(estado);
  const e = entradaCon(estado, equipo.id, pieza.id);
  const r = evaluarPieza(e, cv);
  const [extra, setExtra] = useState({ metanol: false, aromaticos: false });
  const [secciones, setSecciones] = useState('0, 1, 3, 2, 1, 0');
  const base = condicionSello(e, r.ssc.agrio);
  const c = { ...base, metanol: extra.metanol, aromaticos: base.aromaticos || extra.aromaticos };
  const rgd = riesgoRGD(c, cv);
  const plan = planEnvejecimiento(c);
  const clase = claseTemperatura(c.Tmin_C, c.Tmax_C);
  const notas = secciones.split(/[,;\s]+/).map(Number).filter((x) => Number.isInteger(x) && x >= 0 && x <= 5);
  const cal = calificacionRGD(notas, cv);
  const tono = { apto: 'ok', condicional: 'aviso', no_apto: 'mal' } as const;
  const txt = { apto: 'Apto', condicional: 'Requiere calificación', no_apto: 'No apto' } as const;
  return (
    <>
      <Hoja titulo="Sellos no metálicos" nivel={1}>
        <p className="entrada">Cribado de elastómeros con ISO 23936-2:2011: compatibilidad de la Tabla C.1, riesgo de descompresión rápida de gas y plan de calificación.</p>
        <div className="selector">
          <CampoSel id="sel-eq-s" etiqueta="Equipo" valor={equipo.id} opciones={EQUIPOS.map((x) => [x.id, `${x.n}. ${x.nombre}`])}
            alCambiar={(eq) => cambiar({ eq, pz: (EQUIPOS.find((x) => x.id === eq)!.piezas.find((p) => p.forma === 'sello') ?? EQUIPOS[0]!.piezas[0]!).id })} />
        </div>
        <p>{pieza.nombre} · corriente {pieza.corriente}: {fmt(c.P_bar)} bar, {fmt(c.Tmin_C, 0)} a {fmt(c.Tmax_C, 0)} °C, CO₂ {fmt(c.yCO2_pct, 2)} %, H₂S {fmt(c.yH2S_pct, 4)} %. {c.h2s ? 'Servicio agrio.' : 'No es servicio agrio.'} {c.alcalino ? 'Fluido alcalino (amina).' : ''} {c.hidrocarburo ? 'Con hidrocarburo.' : 'Sin hidrocarburo.'}</p>
        <p className="campos-linea">
          <CampoSi id="s-met" etiqueta="Hay metanol" valor={extra.metanol} alCambiar={(metanol) => setExtra({ ...extra, metanol })} />
          <CampoSi id="s-aro" etiqueta="Hay aromáticos" valor={c.aromaticos} alCambiar={(aromaticos) => setExtra({ ...extra, aromaticos })} />
        </p>
        <p className="menor">Las condiciones vienen de la pieza; cámbielas en el Simulador. La Tabla C.1 es una guía informativa: la norma pide caracterizar cada compuesto en su ambiente.</p>
      </Hoja>
      <Hoja titulo="Compatibilidad de elastómeros (Tabla C.1)">
        <Tabla titulo="Compatibilidad de elastómeros">
          <thead><tr><th>Elastómero</th><th>T máx. en aire, °C</th><th>Resultado</th><th>Motivo</th><th>Características</th></tr></thead>
          <tbody>{evaluarElastomeros(c).map((x) => <tr key={x.id}><th scope="row">{x.id}</th><td>{x.tMax}</td><td><Chip tono={tono[x.aptitud]}>{txt[x.aptitud]}</Chip></td><td>{x.motivos.join(' ') || '—'}</td><td>{x.desc}</td></tr>)}</tbody>
        </Tabla>
        <p className="menor">{TABLA_C1_ELASTOMEROS.fuente.norma}, {TABLA_C1_ELASTOMEROS.fuente.clausula}, pág. {TABLA_C1_ELASTOMEROS.fuente.pagina}. <Verificado v /> {TABLA_C1_ELASTOMEROS.notas.join(' ')}</p>
      </Hoja>
      <div className="rejilla2">
        <Hoja titulo="Descompresión rápida de gas (RGD)">
          <p><Chip tono={rgd.nivel === 'alto' ? 'mal' : rgd.nivel === 'medio' ? 'aviso' : rgd.nivel === 'bajo' ? 'ok' : 'neutro'}>Riesgo {rgd.nivel.replace('_', ' ')}</Chip> {rgd.motivo}</p>
          <p className="menor">{RGD_RIESGO.fuente.norma}, {RGD_RIESGO.fuente.clausula}, pág. {RGD_RIESGO.fuente.pagina}. <Verificado v /></p>
          <h3>Ensayo del Anexo B</h3>
          <ul className="simple">
            <li>{ENSAYO_RGD.presion_MPa} MPa y {ENSAYO_RGD.temperatura_C} °C; despresurización a {ENSAYO_RGD.despresurizacion_MPa_min} MPa/min.</li>
            <li>{ENSAYO_RGD.ciclos} ciclos; primera exposición de {ENSAYO_RGD.primeraExposicion_h} h.</li>
            <li>O-ring de {fmt(ENSAYO_RGD.csd_mm, 2)} mm de sección; mínimo {ENSAYO_RGD.replicasMin} réplicas.</li>
            <li>Gas: {ENSAYO_RGD.gas['B.1.i']}. {ENSAYO_RGD.notaH2S}</li>
          </ul>
          <p>{ensayoRGDCubre(c.P_bar, c.Tmax_C) ? <Chip tono="ok">El ensayo normalizado cubre este servicio</Chip> : <Chip tono="aviso">Este servicio supera el ensayo normalizado: ensayo a medida</Chip>} No se permite extrapolar hacia arriba.</p>
          <div className="campo"><label htmlFor="s-cal">Calificaciones de las secciones de un O-ring (0 a 5)</label><input id="s-cal" type="text" value={secciones} onChange={(ev) => setSecciones(ev.currentTarget.value)} /></div>
          <p>Calificación final: {cal.final.join('') || '—'}. {cal.aprueba ? <Chip tono="ok">Aprueba: ninguna sección supera 3</Chip> : <Chip tono="mal">No aprueba</Chip>} <span className="menor">§7.3.2 y Tabla B.5.</span></p>
        </Hoja>
        <Hoja titulo="Plan de envejecimiento (Anexo A)">
          <ul className="simple">
            <li><strong>Líquido:</strong> {plan.liquido}</li><li><strong>Gas:</strong> {plan.gas}</li><li><strong>Distribución:</strong> {plan.distribucion}</li>
            <li><strong>Presión:</strong> {plan.presion}</li>
            <li><strong>Clase de temperatura:</strong> {clase ? `${clase.clase} (${clase.min} a ${clase.max} °C)` : 'ninguna clase cubre el intervalo: temperaturas a medida'}{plan.tEnsayo ? `; ensayos a ${plan.tEnsayo.join(', ')} °C` : clase ? '; la norma no da temperaturas de ensayo para esta clase' : ''}</li>
          </ul>
          <h3>Aceptación (§7.2.2)</h3>
          <ul className="simple">{plan.aceptacion.map((a) => <li key={a}>{a}</li>)}</ul>
          <h3>Referencia API 6A</h3>
          <p>Clase de material {r.api6a.clase}: cuerpo en {r.api6a.cuerpo.toLowerCase()}, internos en {r.api6a.internos.toLowerCase()}. Fluido de ensayo de sellos: {r.api6a.fluidoSellos}, con {API6A.ensayoSellos.hidrocarburo_pct} % de hidrocarburo líquido y {API6A.ensayoSellos.agua_pct} % de agua, a {fmt(API6A.ensayoSellos.presion_MPa)} MPa durante {API6A.ensayoSellos.duracion_h} h. <Verificado v={false} /></p>
        </Hoja>
      </div>
      <Hoja titulo="Termoplásticos">
        <p>{TERMOPLASTICOS.fuenteGeneral.nota}</p>
        <Tabla titulo="Límites de temperatura de termoplásticos">
          <thead><tr><th>Material</th><th>T máx. en agua dulce, °C</th><th>A {fmt(c.Tmax_C, 0)} °C</th><th>Fuente</th><th>Estado</th></tr></thead>
          <tbody>{evaluarTermoplasticos(c.Tmax_C, 'agua_dulce').map((t) => <tr key={t.id}><th scope="row">{t.id}<span className="menor bloque">{t.nombre}</span></th><td>{t.tMax ?? '—'}</td><td><Chip tono={t.estado === 'apto' ? 'ok' : t.estado === 'excede' ? 'mal' : 'neutro'}>{t.estado === 'apto' ? 'Dentro del límite' : t.estado === 'excede' ? 'Excede' : 'Pendiente'}</Chip></td><td>{t.norma}</td><td><Verificado v={t.verificado} /></td></tr>)}</tbody>
        </Tabla>
        <p className="menor">Los límites verificables son de agua dulce (ISO 21457, Tabla 9) y no cubren hidrocarburo ni gas agrio: la compatibilidad química se califica con los niveles de ensayo de ISO 23936-1.</p>
      </Hoja>
    </>
  );
}

/* ----------------------------- Escenarios --------------------------- */
const GRUPOS = [...new Set(PRESETS.map((p) => p.grupo))];

export function Escenarios({ estado, cambiar }: PropsVista): ReactNode {
  const s = seleccion(estado.eq, estado.pz);
  const cv = criteriosDe(estado);
  if (s.pieza.forma === 'sello') return <Hoja titulo="Escenarios" nivel={1}><SelectorPieza estado={estado} cambiar={cambiar} /><p>Elija una pieza metálica.</p></Hoja>;
  const base = entradaCon(estado, s.equipo.id, s.pieza.id);
  const lados = (['presetsA', 'presetsB'] as const).map((k) => {
    const ids = estado[k];
    const e = aplicarPresets(base, ids);
    return { k, ids, e, r: evaluarPieza(e, cv), aviso: advertenciaTraslado(s.pieza.corriente, ids) };
  });
  const [A, B] = lados as [typeof lados[number], typeof lados[number]];
  const elegir = (k: 'presetsA' | 'presetsB', grupo: string, id: string): void => {
    const otros = estado[k].filter((x) => PRESETS.find((p) => p.id === x)?.grupo !== grupo);
    cambiar({ [k]: id ? [...otros, id] : otros });
  };
  const filas: [string, (x: typeof A) => string][] = [
    ['Presión, bar', (x) => fmt(x.e.P)], ['Temperatura / máxima, °C', (x) => `${fmt(x.e.T, 0)} / ${fmt(x.e.Tmax, 0)}`],
    ['Cloruros, mg/L', (x) => fmt(x.e.Cl, 0)], ['H₂S, % mol', (x) => fmt(x.e.H2S, 4)], ['Disponibilidad del inhibidor, %', (x) => fmt(x.e.inhibidor)],
    ['Agua en la fase acuosa, %', (x) => fmt(x.e.wAgua, 0)], ['pH₂S, kPa', (x) => fmt(x.r.pp.pH2S.kPa, 3)], ['Región SSC', (x) => String(x.r.ssc.region)],
    ['Velocidad sin inhibir, mm/a', (x) => (x.r.corrosion.aplica ? fmt(x.r.corrosion.crBase, 2) : 'No aplica')],
    ['Sobreespesor requerido, mm', (x) => (x.r.corrosion.aplica ? fmt(x.r.corrosion.caRequerido, 1) : 'No aplica')],
    ['Clase de sobreespesor', (x) => x.r.corrosion.clase?.nombre ?? 'No aplica'],
    ['Material recomendado', (x) => x.r.mejor?.nombre ?? 'Ninguno'], ['Materiales viables', (x) => x.r.ranking.map((m) => m.nombre).join('; ') || 'Ninguno'],
  ];
  return (
    <>
      <Hoja titulo="Escenarios" nivel={1}>
        <p className="entrada">La misma pieza en dos condiciones. Las filas que cambian llevan la marca «≠».</p>
        <SelectorPieza estado={estado} cambiar={cambiar} />
        <div className="rejilla2">
          {lados.map((l, i) => (
            <fieldset key={l.k}><legend>{i === 0 ? 'Base' : 'Alternativo'}</legend>
              {GRUPOS.map((g) => (
                <CampoSel key={g} id={`${l.k}-${g}`} etiqueta={g} valor={l.ids.find((x) => PRESETS.find((p) => p.id === x)?.grupo === g) ?? ''}
                  opciones={[['', 'Valor de la pieza'], ...PRESETS.filter((p) => p.grupo === g).map((p): [string, string] => [p.id, p.nombre])]} alCambiar={(id) => elegir(l.k, g, id)} />
              ))}
              {l.aviso ? <p className="aviso-academico" role="note">{l.aviso}</p> : null}
            </fieldset>
          ))}
        </div>
      </Hoja>
      <Hoja titulo={`Resultados · ${s.equipo.corto}, ${s.pieza.nombre.toLowerCase()}`}>
        <Tabla titulo="Comparación de escenarios">
          <thead><tr><th /><th>Base</th><th>Alternativo</th><th>Cambia</th></tr></thead>
          <tbody>{filas.map(([t, f]) => { const a = f(A); const b = f(B); return <tr key={t} className={a !== b ? 'cambia' : ''}><th scope="row">{t}</th><td>{a}</td><td>{b}</td><td>{a !== b ? <span title="Cambia entre escenarios">≠</span> : ''}</td></tr>; })}</tbody>
        </Tabla>
        <p className="menor">A 320 bar la ecuación de fugacidad queda fuera de su intervalo y se calcula a 250 bar. El MEG al 50 % es un supuesto.</p>
      </Hoja>
    </>
  );
}

export { AVISO_ACADEMICO };
